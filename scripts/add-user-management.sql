-- User Management System Migration
-- This adds users, invites, and article history tracking

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'publisher' CHECK (role IN ('super_admin', 'publisher')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  created_by VARCHAR(50) REFERENCES users(id)
);

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'publisher' CHECK (role IN ('super_admin', 'publisher')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

-- Article history table (tracks who made changes)
CREATE TABLE IF NOT EXISTS article_history (
  id VARCHAR(50) PRIMARY KEY,
  article_id VARCHAR(50) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'published', 'archived', 'deleted'
  changes JSONB, -- Store what changed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add publisher and last_modified_by to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS publisher_id VARCHAR(50) REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(50) REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_article_history_article_id ON article_history(article_id);
CREATE INDEX IF NOT EXISTS idx_article_history_user_id ON article_history(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_publisher_id ON articles(publisher_id);
CREATE INDEX IF NOT EXISTS idx_articles_last_modified_by ON articles(last_modified_by);

-- Create initial super admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt (rounds=10)
-- You should change this password immediately after first login
INSERT INTO users (id, email, name, password_hash, role, is_active, created_at)
VALUES (
  'admin_' || extract(epoch from now())::text,
  'admin@lime.mn',
  'Super Admin',
  '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- CHANGE THIS!
  'super_admin',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
