import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/lib/auth';
import { getUserByEmail, getUserByLoginIdentifier, updateUser, updateUserPassword } from '@/lib/db-users';
import { verifyPassword } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/csrf';

const UpdateMeBody = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().optional(), // accepted but ignored — see comment below
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8).max(200).optional(),
}).strict();

// GET /api/users/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve session.username to a real user. Refuse if no mapping —
    // earlier code fabricated a `role: super_admin` response, which would
    // surface admin UI to revoked/orphaned sessions even though every
    // server-side route now re-checks the real role.
    const user = await getUserByLoginIdentifier(admin.username);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return NextResponse.json({ error: 'Failed to fetch current user' }, { status: 500 });
  }
}

// PUT /api/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = UpdateMeBody.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { name, currentPassword, newPassword } = parsed.data;

    // Resolve session.username to a real user row.
    const user = await getUserByLoginIdentifier(admin.username);
    
    if (user) {
      // Update user profile
      const updates: { name?: string; email?: string } = {};
      if (name !== undefined) updates.name = name;
      // Email cannot be changed for now
      
      if (Object.keys(updates).length > 0) {
        await updateUser(user.id, updates);
      }

      // Update password if provided
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Одоогийн нууц үг шаардлагатай' }, { status: 400 });
        }

        // Verify current password
        const { getAdminByUsername } = await import('@/lib/auth');
        const adminUser = await getAdminByUsername(admin.username);
        if (!adminUser) {
          return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, adminUser.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: 'Одоогийн нууц үг буруу байна' }, { status: 400 });
        }

        await updateUserPassword(user.id, newPassword);
      }

      // Fetch updated user via the same lookup used in GET.
      const updatedUser = await getUserByLoginIdentifier(admin.username);
      if (!updatedUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json(updatedUser);
    } else {
      // Session doesn't map to a `users` row — refuse the update.
      // Used to fabricate a super_admin response here; that misled the client.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
