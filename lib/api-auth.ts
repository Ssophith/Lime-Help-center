import { getCurrentAdmin } from '@/lib/auth';
import { getUserByLoginIdentifier } from '@/lib/db-users';
import { NextResponse } from 'next/server';
import type { User } from '@/types';

/**
 * Shared auth guard for API mutation routes.
 * Returns null if authenticated, or a 401 NextResponse if not.
 * Usage:
 *   const unauth = await requireAuth();
 *   if (unauth) return unauth;
 */
export async function requireAuth(): Promise<NextResponse | null> {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * Resolve the current session to a `users` row.
 * Returns null when no session, or session can't be mapped to a user.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return null;
    const user = await getUserByLoginIdentifier(admin.username);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Auth helper that returns a NextResponse on failure or a User on success.
 * Use when you need the user object in the route body.
 *
 * Caller pattern:
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   const me = auth;
 */
export async function requireUser(): Promise<User | NextResponse> {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return me;
}

/**
 * Auth + role gate. Returns User on success, or NextResponse on failure.
 *
 * `roles` is an allowlist — passing `['super_admin']` requires that exact
 * role. An empty array (or omitting) accepts any active user.
 */
export async function requireRole(
  roles: Array<'super_admin' | 'publisher'>
): Promise<User | NextResponse> {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (roles.length > 0 && !roles.includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return me;
}
