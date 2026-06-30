export interface Category {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  iconColor?: string; // Soft/pastel color for icon background
  order: number;
  articles: Article[];
}

export type ArticleStatus = 'published' | 'draft' | 'archived';

export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string; // Markdown content
  excerpt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  views?: number;
  helpful?: number;
  notHelpful?: number;
  status?: ArticleStatus; // published, draft, or archived
  publisherId?: string; // User who published/created the article
  lastModifiedBy?: string; // User who last modified the article
  publisherName?: string; // Denormalized for display
  lastModifiedByName?: string; // Denormalized for display
}

export interface FAQ {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
}

export interface KnowledgeBase {
  categories: Category[];
  faqs: FAQ[];
}

export type UserRole = 'super_admin' | 'publisher';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

export interface Invite {
  id: string;
  email: string;
  token: string;
  role: UserRole;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ArticleHistory {
  id: string;
  articleId: string;
  categoryId: string;
  userId?: string;
  userName?: string;
  action: 'created' | 'updated' | 'published' | 'archived' | 'deleted';
  changes?: Record<string, any>;
  createdAt: string;
}
