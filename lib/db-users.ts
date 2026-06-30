import { query, queryOne, transaction } from './db-connection';
import type { User, Invite, ArticleHistory } from '@/types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// User operations
export const getUsers = async (): Promise<User[]> => {
  const rows = await query<{
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    created_by: string | null;
  }>('SELECT * FROM users ORDER BY created_at DESC');
  
  return rows.map(row => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as 'super_admin' | 'publisher',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || undefined,
    createdBy: row.created_by || undefined,
  }));
};

export const getUserById = async (id: string): Promise<User | null> => {
  const row = await queryOne<{
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    created_by: string | null;
  }>('SELECT * FROM users WHERE id = $1', [id]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as 'super_admin' | 'publisher',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || undefined,
    createdBy: row.created_by || undefined,
  };
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const row = await queryOne<{
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    created_by: string | null;
  }>('SELECT * FROM users WHERE email = $1', [email]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as 'super_admin' | 'publisher',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || undefined,
    createdBy: row.created_by || undefined,
  };
};

/**
 * Resolve a session-username (which may be an email OR a legacy admin_users
 * username) to a row in `users`.
 *
 *   1. Exact email match — covers everyone in the modern `users` flow
 *      (berjan@onlime.mn, devops@onlime.mn, admin@lime.mn, etc.).
 *   2. Explicit `admin_users.linked_user_id` — covers legacy username-based
 *      logins like the bare "admin". The link is set at migration time
 *      (see scripts/add-admin-linked-user.sql) and is the only sanctioned
 *      mapping between the two tables.
 *
 * Earlier versions of this function used a `LOWER(email) LIKE 'username@%'`
 * fallback. That was order-dependent and could silently misroute identity
 * if anyone was later invited at e.g. `admin@onlime.mn`. The explicit
 * column closes that gap.
 */
export const getUserByLoginIdentifier = async (identifier: string): Promise<User | null> => {
  if (!identifier) return null;

  // 1. Email exact match.
  const byEmail = await getUserByEmail(identifier);
  if (byEmail) return byEmail;

  // 2. Legacy `admin_users` lookup via explicit linked_user_id.
  if (identifier.includes('@')) return null;

  const row = await queryOne<{
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    created_by: string | null;
  }>(
    `SELECT u.*
       FROM admin_users au
       JOIN users u ON u.id = au.linked_user_id
      WHERE au.username = $1
      LIMIT 1`,
    [identifier]
  );

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as 'super_admin' | 'publisher',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || undefined,
    createdBy: row.created_by || undefined,
  };
};

export const createUser = async (
  email: string,
  name: string,
  password: string,
  role: 'super_admin' | 'publisher' = 'publisher',
  createdBy?: string
): Promise<User> => {
  const id = `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  
  await query(
    `INSERT INTO users (id, email, name, password_hash, role, is_active, created_at, updated_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, email, name, passwordHash, role, true, now, now, createdBy || null]
  );
  
  return {
    id,
    email,
    name,
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || undefined,
  };
};

export const updateUser = async (userId: string, updates: { name?: string; email?: string }): Promise<void> => {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (updates.name !== undefined) {
    setParts.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    setParts.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  
  if (setParts.length === 0) return;
  
  values.push(userId);
  await query(
    `UPDATE users SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
    values
  );
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, userId]
  );
};

export const updateUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  await query(
    'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [isActive, userId]
  );
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  // Check if user exists first
  const user = await queryOne<{ id: string }>('SELECT id FROM users WHERE id = $1', [userId]);
  if (!user) {
    return false;
  }
  // Delete the user
  await query('DELETE FROM users WHERE id = $1', [userId]);
  return true;
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  await query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
};

// Invite operations
export const createInvite = async (
  email: string,
  role: 'super_admin' | 'publisher',
  createdBy: string | undefined,
  expiresInHours: number = 72
): Promise<Invite> => {
  const id = `invite_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();
  
  await query(
    `INSERT INTO invites (id, email, token, role, expires_at, created_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, email, token, role, expiresAt, createdAt, createdBy || null]
  );
  
  return {
    id,
    email,
    token,
    role,
    expiresAt,
    createdAt,
    createdBy,
  };
};

export const getInviteByToken = async (token: string): Promise<Invite | null> => {
  const row = await queryOne<{
    id: string;
    email: string;
    token: string;
    role: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
    created_by: string | null;
  }>('SELECT * FROM invites WHERE token = $1', [token]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    token: row.token,
    role: row.role as 'super_admin' | 'publisher',
    expiresAt: row.expires_at,
    usedAt: row.used_at || undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || undefined,
  };
};

export const getInviteById = async (id: string): Promise<Invite | null> => {
  const row = await queryOne<{
    id: string;
    email: string;
    token: string;
    role: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
    created_by: string | null;
  }>('SELECT * FROM invites WHERE id = $1', [id]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    token: row.token,
    role: row.role as 'super_admin' | 'publisher',
    expiresAt: row.expires_at,
    usedAt: row.used_at || undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || undefined,
  };
};

export const markInviteAsUsed = async (inviteId: string): Promise<void> => {
  await query(
    'UPDATE invites SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
    [inviteId]
  );
};

export const deleteInvite = async (inviteId: string): Promise<boolean> => {
  const result = await query('DELETE FROM invites WHERE id = $1', [inviteId]);
  return result.length > 0;
};

export const getInvites = async (): Promise<Invite[]> => {
  const rows = await query<{
    id: string;
    email: string;
    token: string;
    role: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
    created_by: string | null;
  }>('SELECT * FROM invites ORDER BY created_at DESC');
  
  return rows.map(row => ({
    id: row.id,
    email: row.email,
    token: row.token,
    role: row.role as 'super_admin' | 'publisher',
    expiresAt: row.expires_at,
    usedAt: row.used_at || undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || undefined,
  }));
};

// Article history operations
export const createArticleHistory = async (
  articleId: string,
  categoryId: string,
  userId: string | undefined,
  action: 'created' | 'updated' | 'published' | 'archived' | 'deleted',
  changes?: Record<string, any>
): Promise<void> => {
  const id = `hist_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  await query(
    `INSERT INTO article_history (id, article_id, category_id, user_id, action, changes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [id, articleId, categoryId, userId || null, action, changes ? JSON.stringify(changes) : null]
  );
};

export const getArticleHistory = async (articleId: string): Promise<ArticleHistory[]> => {
  const rows = await query<{
    id: string;
    article_id: string;
    category_id: string;
    user_id: string | null;
    action: string;
    changes: string | null;
    created_at: string;
    user_name: string | null;
  }>(
    `SELECT h.*, u.name as user_name
     FROM article_history h
     LEFT JOIN users u ON h.user_id = u.id
     WHERE h.article_id = $1
     ORDER BY h.created_at DESC`,
    [articleId]
  );
  
  return rows.map(row => ({
    id: row.id,
    articleId: row.article_id,
    categoryId: row.category_id,
    userId: row.user_id || undefined,
    userName: row.user_name || undefined,
    action: row.action as 'created' | 'updated' | 'published' | 'archived' | 'deleted',
    changes: row.changes ? JSON.parse(row.changes) : undefined,
    createdAt: row.created_at,
  }));
};
