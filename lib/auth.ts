import { cookies } from 'next/headers';
import { query, queryOne } from './db-connection';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
}

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_TTL_HOURS = 24;

// ── DB helpers ─────────────────────────────────────────

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  try {
    const row = await queryOne<{
      id: string;
      username: string;
      password_hash: string;
    }>('SELECT id, username, password_hash FROM admin_users WHERE username = $1', [username]);
    if (!row) return null;
    return { id: row.id, username: row.username, passwordHash: row.password_hash };
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// ── Session store (DB-backed, opaque random token) ─────

/** Create a new secure random session token and persist it. */
export async function createSession(username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex'); // 64-char hex, 256-bit entropy
  await query(
    `INSERT INTO sessions (token, username, expires_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '${SESSION_TTL_HOURS} hours')`,
    [token, username]
  );
  // Opportunistically purge expired sessions (fire-and-forget, don't await)
  query('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP').catch(() => {});
  return token;
}

/** Look up a session token — single DB query, no secret comparison needed. */
export async function verifySession(token: string): Promise<{ valid: boolean; username?: string }> {
  if (!token || token.length !== 64) return { valid: false };
  try {
    const row = await queryOne<{ username: string; expires_at: string }>(
      'SELECT username, expires_at FROM sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );
    if (!row) return { valid: false };
    return { valid: true, username: row.username };
  } catch {
    return { valid: false };
  }
}

/** Get the current session from the cookie — single DB lookup. */
export async function getCurrentAdmin(): Promise<{ username: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const { valid, username } = await verifySession(token);
    if (!valid || !username) return null;
    return { username };
  } catch {
    return null;
  }
}

// ── Cookie helpers ─────────────────────────────────────

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // `strict` blocks the cookie on top-level cross-site navigations (the
    // primary CSRF vector for cookie-auth admin panels). Admins reach /jadmin
    // by typing it directly or via same-site links, so this is safe.
    sameSite: 'strict',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  cookieStore.delete(SESSION_COOKIE_NAME);
  // Also invalidate in DB so old token can't be reused
  if (token) {
    query('DELETE FROM sessions WHERE token = $1', [token]).catch(() => {});
  }
}
