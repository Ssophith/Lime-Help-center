import { NextRequest, NextResponse } from 'next/server';
import { deleteInvite, getInviteById, getUserByLoginIdentifier } from '@/lib/db-users';
import { getCurrentAdmin } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/csrf';

async function getSuperAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const user = await getUserByLoginIdentifier(admin.username);
  if (!user || !user.isActive || user.role !== 'super_admin') return null;
  return user;
}

export async function DELETE(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  try {
    const me = await getSuperAdmin();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    const invite = await getInviteById(id);
    if (!invite) {
      return NextResponse.json({ error: 'Урилга олдсонгүй' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Энэ урилга аль хэдийн ашиглагдсан байна' }, { status: 400 });
    }

    const success = await deleteInvite(id);
    if (!success) {
      return NextResponse.json({ error: 'Урилга устгахад алдаа гарлаа' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete invite:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete invite' }, { status: 500 });
  }
}
