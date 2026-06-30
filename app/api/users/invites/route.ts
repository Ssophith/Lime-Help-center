import { NextRequest, NextResponse } from 'next/server';
import { getInvites, getUserByLoginIdentifier } from '@/lib/db-users';
import { getCurrentAdmin } from '@/lib/auth';

async function getSuperAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const user = await getUserByLoginIdentifier(admin.username);
  if (!user || !user.isActive || user.role !== 'super_admin') return null;
  return user;
}

// GET /api/users/invites — list all invites. Super-admin only.
//
// Note: each `Invite` includes its `token`, which is the secret a recipient
// uses to accept the invite. Leaking this list to a non-super-admin lets them
// hijack any pending super_admin invite. This route used to return a hardcoded
// `{role: 'super_admin'}` placeholder regardless of the caller — that was a
// critical authz hole (caught in the May 2026 security audit).
export async function GET(_request: NextRequest) {
  try {
    const me = await getSuperAdmin();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invites = await getInvites();
    return NextResponse.json(invites);
  } catch (error) {
    console.error('Failed to fetch invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}
