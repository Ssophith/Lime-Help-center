import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUsers,
  createUser,
  updateUserPassword,
  updateUserStatus,
  createInvite,
  getUserByLoginIdentifier,
} from '@/lib/db-users';
import { sendInviteEmail } from '@/lib/email';
import { getCurrentAdmin } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/csrf';
import type { User } from '@/types';

const RoleSchema = z.enum(['super_admin', 'publisher']);

const InviteBody = z.object({
  action: z.literal('invite'),
  email: z.string().email().endsWith('@onlime.mn'),
  role: RoleSchema.optional(),
}).strict();

const CreateUserBody = z.object({
  action: z.literal('create'),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(200),
  role: RoleSchema.optional(),
}).strict();

const PostBody = z.discriminatedUnion('action', [InviteBody, CreateUserBody]);

const ChangePassword = z.object({
  action: z.literal('change_password'),
  userId: z.string().min(1).max(64),
  password: z.string().min(8).max(200),
}).strict();

const UpdateStatus = z.object({
  action: z.literal('update_status'),
  userId: z.string().min(1).max(64),
  isActive: z.boolean(),
}).strict();

const UpdateDetails = z.object({
  action: z.literal('update_details'),
  userId: z.string().min(1).max(64),
  name: z.string().min(1).max(255).optional(),
  // email intentionally not accepted — see comment in update_user
}).strict();

const PutBody = z.discriminatedUnion('action', [ChangePassword, UpdateStatus, UpdateDetails]);

// Resolve the session cookie to a real users-table row + role.
// Returns null when there's no valid session or the session doesn't map to a user.
async function getSuperAdmin(): Promise<User | null> {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const user = await getUserByLoginIdentifier(admin.username);
  if (!user || !user.isActive) return null;
  if (user.role !== 'super_admin') return null;
  return user;
}

export async function GET(_request: NextRequest) {
  try {
    const me = await getSuperAdmin();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  try {
    const me = await getSuperAdmin();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = PostBody.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'invite') {
      const { email, role } = parsed.data;
      const invite = await createInvite(email, role || 'publisher', me.id, 72);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://help.lime.mn';
      const inviteLink = `${baseUrl}/jadmin/invite/${invite.token}`;
      try {
        await sendInviteEmail(email, inviteLink, invite.role);
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Continue even if email fails — invite row was written.
      }
      return NextResponse.json({ success: true, invite });
    }

    if (parsed.data.action === 'create') {
      const { email, name, password, role } = parsed.data;
      const user = await createUser(email, name, password, role || 'publisher', me.id);
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to create user/invite:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user/invite' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  try {
    const me = await getSuperAdmin();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = PutBody.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'change_password') {
      await updateUserPassword(parsed.data.userId, parsed.data.password);
      return NextResponse.json({ success: true });
    }

    if (parsed.data.action === 'update_status') {
      // Prevent locking yourself out by disabling your own account.
      if (parsed.data.userId === me.id && !parsed.data.isActive) {
        return NextResponse.json({ error: 'Cannot disable your own account' }, { status: 400 });
      }
      await updateUserStatus(parsed.data.userId, parsed.data.isActive);
      return NextResponse.json({ success: true });
    }

    if (parsed.data.action === 'update_details') {
      const { updateUser } = await import('@/lib/db-users');
      const updates: { name?: string } = {};
      if (parsed.data.name !== undefined) updates.name = parsed.data.name;
      // Email is intentionally immutable — it's the login identity.
      await updateUser(parsed.data.userId, updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent self-delete.
    if (userId === me.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const { deleteUser } = await import('@/lib/db-users');
    const success = await deleteUser(userId);

    if (!success) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
