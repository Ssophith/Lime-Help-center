import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getInviteById, createInvite, markInviteAsUsed, getUserByLoginIdentifier } from '@/lib/db-users';
import { sendInviteEmail } from '@/lib/email';
import { getCurrentAdmin } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

const Body = z.object({ inviteId: z.string().min(1).max(64) }).strict();

async function getSuperAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const user = await getUserByLoginIdentifier(admin.username);
  if (!user || !user.isActive || user.role !== 'super_admin') return null;
  return user;
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  // 10 resends per admin per hour — abuse cap, not a security ceiling.
  const admin = await getCurrentAdmin();
  if (admin) {
    if (!(await rateLimit(`invite-resend:${admin.username}`, 10, 60 * 60 * 1000))) {
      return NextResponse.json({ error: 'Хэт олон удаа дахин илгээлээ. Дараа оролдоно уу.' }, { status: 429 });
    }
  }

  try {
    const me = await getSuperAdmin();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const invite = await getInviteById(parsed.data.inviteId);
    if (!invite) {
      return NextResponse.json({ error: 'Урилга олдсонгүй' }, { status: 404 });
    }
    if (invite.usedAt) {
      return NextResponse.json({ error: 'Энэ урилга аль хэдийн ашиглагдсан байна' }, { status: 400 });
    }

    const newInvite = await createInvite(invite.email, invite.role, invite.createdBy, 72);
    await markInviteAsUsed(invite.id);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://help.lime.mn';
    const inviteLink = `${baseUrl}/jadmin/invite/${newInvite.token}`;
    try {
      await sendInviteEmail(invite.email, inviteLink, newInvite.role);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      return NextResponse.json({ error: 'Имэйл илгээхэд алдаа гарлаа' }, { status: 500 });
    }

    return NextResponse.json({ success: true, invite: newInvite });
  } catch (error: any) {
    console.error('Failed to resend invite:', error);
    return NextResponse.json({ error: error.message || 'Failed to resend invite' }, { status: 500 });
  }
}
