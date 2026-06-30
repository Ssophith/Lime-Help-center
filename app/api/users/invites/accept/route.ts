import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getInviteByToken, markInviteAsUsed, createUser, getUserByEmail, updateUserLastLogin } from '@/lib/db-users';
import { requireSameOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

// Password policy must match createUser callers elsewhere (>= 8).
// Was previously 6 here, inconsistent with the rest of the app.
const Body = z.object({
  token: z.string().min(32).max(128),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(200),
}).strict();

export async function POST(request: NextRequest) {
  // Reject cross-origin POSTs even though this is a public endpoint —
  // accept-invite is state-changing (creates an account), and we want
  // browser SameSite + Origin checks to fire.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  // Rate-limit by IP. Token brute-force is otherwise possible: 256-bit
  // entropy makes that impractical, but defense-in-depth is cheap.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (!(await rateLimit(`invite-accept:${ip}`, 20, 15 * 60 * 1000))) {
    return NextResponse.json({ error: 'Хэт олон оролдлого. Дараа дахин оролдоно уу.' }, { status: 429 });
  }

  try {
    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { token, name, password } = parsed.data;

    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Урилга олдсонгүй' }, { status: 404 });
    }

    // Defense-in-depth: even though invites are only created with @onlime.mn
    // emails, double-check here in case the DB is tampered with.
    if (!invite.email.endsWith('@onlime.mn')) {
      return NextResponse.json({ error: 'Зөвхөн @onlime.mn домэйнтэй имэйл зөвшөөрөгдөнө' }, { status: 400 });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Урилга хүчингүй болсон байна' }, { status: 400 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Энэ урилга аль хэдийн ашиглагдсан байна' }, { status: 400 });
    }

    const existingUser = await getUserByEmail(invite.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Энэ имэйлтэй хэрэглэгч аль хэдийн бүртгэгдсэн байна' },
        { status: 400 }
      );
    }

    const user = await createUser(invite.email, name, password, invite.role, invite.createdBy);
    await updateUserLastLogin(user.id);
    await markInviteAsUsed(invite.id);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Failed to accept invite:', error);
    return NextResponse.json({ error: error.message || 'Failed to accept invite' }, { status: 500 });
  }
}
