# Future Features Implementation Guide

This document outlines the planned features and their implementation structure.

## 1. Social Share (Facebook, X/Twitter, etc.)

**Location**: `lib/social-share.ts`, `components/SocialShare.tsx`

**Implementation**:
- Add share buttons component
- Support for Facebook, Twitter/X, LinkedIn, WhatsApp
- Use Open Graph meta tags for better sharing
- Generate share URLs with article information

**Files to create**:
- `lib/social-share.ts` - Share URL generators
- `components/SocialShare.tsx` - Share buttons component
- Update `app/[category]/[article]/page.tsx` to include share component

## 2. Admin Authentication

**Location**: `lib/auth.ts`, `app/api/auth/`, `middleware.ts`

**Implementation**:
- JWT-based authentication
- Password hashing with bcrypt
- Admin login/logout endpoints
- Protected admin routes with middleware
- Session management

**Files to create**:
- `lib/auth.ts` - Authentication utilities
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint
- `app/api/auth/me/route.ts` - Current user endpoint
- `middleware.ts` - Route protection
- `app/jadmin/login/page.tsx` - Login page
- Database table: `admin_users`

## 3. Cloudflare R2 Integration

**Location**: `lib/r2.ts`, `app/api/upload/route.ts`

**Implementation**:
- R2 client setup
- Image/video upload endpoints
- File management utilities
- Public URL generation

**Files to create**:
- `lib/r2.ts` - R2 client and utilities
- `app/api/upload/route.ts` - Upload endpoint
- `components/FileUpload.tsx` - Upload component
- Update TipTap editor to support image uploads

## 4. SMTP Configuration

**Location**: `lib/email.ts`, `app/api/email/route.ts`

**Implementation**:
- Nodemailer setup
- Email templates
- Password reset emails
- Article feedback emails
- Admin notifications

**Files to create**:
- `lib/email.ts` - Email utilities
- `app/api/email/send/route.ts` - Send email endpoint
- `app/api/email/reset-password/route.ts` - Password reset
- `templates/email/` - Email templates directory

## 5. Article Feedback System

**Location**: `app/api/articles/[id]/feedback/route.ts`, `components/ArticleFeedback.tsx`

**Implementation**:
- Track helpful/not helpful votes
- Collect feedback when article is disliked
- Store feedback in database
- Email notifications for negative feedback

**Database table**: `article_feedback`

**Files to update**:
- `components/ArticleFeedback.tsx` - Add feedback form
- `app/api/articles/[id]/feedback/route.ts` - Feedback endpoint

## Database Schema Additions

```sql
-- Admin users table
CREATE TABLE admin_users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Article feedback table
CREATE TABLE article_feedback (
  id VARCHAR(255) PRIMARY KEY,
  article_id VARCHAR(255) REFERENCES articles(id) ON DELETE CASCADE,
  helpful BOOLEAN,
  feedback_text TEXT,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File uploads table (for R2)
CREATE TABLE file_uploads (
  id VARCHAR(255) PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  r2_key VARCHAR(500) NOT NULL,
  public_url VARCHAR(1000) NOT NULL,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
