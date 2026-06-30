import { NextRequest, NextResponse } from 'next/server';
import { getAdminByUsername, verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { queryOne } from '@/lib/db-connection';
import { requireSameOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Block cross-origin login posts — prevents an attacker forcing a victim
  // to authenticate to the attacker's account from a malicious page.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  // Brute-force defense: bucket by IP, then per username on top.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (!(await rateLimit(`login-ip:${ip}`, 20, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Per-username bucket: 10 failed/successful attempts per 15 min.
    // Tracking *after* validation means typo-laden bad input doesn't count.
    if (typeof username === 'string' && !(await rateLimit(`login-user:${username.toLowerCase()}`, 10, 15 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Too many attempts for this account. Try again later.' },
        { status: 429 }
      );
    }
    
    // Try to get user from admin_users table first (by username)
    let admin = await getAdminByUsername(username);
    let passwordHash: string | null = null;
    let userId: string | null = null;
    
    // If not found in admin_users, check users table (by email)
    if (!admin) {
      try {
        const { getUserByEmail } = await import('@/lib/db-users');
        const user = await getUserByEmail(username);
        if (user && user.isActive) {
          // Get password hash from users table
          const userRow = await queryOne<{ password_hash: string; id: string }>(
            'SELECT password_hash, id FROM users WHERE email = $1 AND is_active = true',
            [username]
          );
          if (userRow) {
            passwordHash = userRow.password_hash;
            userId = userRow.id;
          }
        }
      } catch (error) {
        console.error('Error checking users table:', error);
      }
    } else {
      passwordHash = admin.passwordHash;
    }
    
    // Also check if username is an email and try users table
    if (!passwordHash && username.includes('@')) {
      try {
        const { getUserByEmail } = await import('@/lib/db-users');
        const user = await getUserByEmail(username);
        if (user && user.isActive) {
          const userRow = await queryOne<{ password_hash: string; id: string }>(
            'SELECT password_hash, id FROM users WHERE email = $1 AND is_active = true',
            [username]
          );
          if (userRow) {
            passwordHash = userRow.password_hash;
            userId = userRow.id;
          }
        }
      } catch (error) {
        console.error('Error checking users table by email:', error);
      }
    }
    
    if (!passwordHash) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const { verifyPassword } = await import('@/lib/auth');
    const isValid = await verifyPassword(password, passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Create session
    const sessionToken = await createSession(username);
    await setSessionCookie(sessionToken);
    
    // Update last login for user in users table (if exists)
    if (userId) {
      try {
        const { updateUserLastLogin } = await import('@/lib/db-users');
        await updateUserLastLogin(userId);
      } catch (error) {
        console.error('Failed to update last login:', error);
      }
    } else {
      // Try to find user by email/username
      try {
        const { getUserByEmail, updateUserLastLogin } = await import('@/lib/db-users');
        const user = await getUserByEmail(username);
        if (user) {
          await updateUserLastLogin(user.id);
        }
      } catch (error) {
        // Ignore errors - user might not exist in users table yet
        console.error('Failed to update last login:', error);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      username: username 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
