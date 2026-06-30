import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createArticle, updateArticle, deleteArticle, getArticleById } from '@/lib/db';
import { requireUser } from '@/lib/api-auth';
import { requireSameOrigin } from '@/lib/csrf';

// Whitelist of fields a client may set on an article. Anything else (views,
// helpful, not_helpful, publisher_id, last_modified_by, created_at, etc.) is
// stripped — those are owned by the server.
const ArticleStatus = z.enum(['published', 'draft', 'archived']);

const ArticleWritable = z.object({
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  excerpt: z.string().max(2000).optional(),
  order: z.number().int().default(0),
  status: ArticleStatus.optional(),
});

const CreateBody = ArticleWritable.extend({
  categoryId: z.string().min(1).max(255),
}).strict();

const UpdateBody = z.object({
  slug: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(2000).optional(),
  order: z.number().int().optional(),
  status: ArticleStatus.optional(),
  categoryId: z.string().min(1).max(255),
  articleId: z.string().min(1).max(255),
}).strict();

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const me = auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { categoryId, ...article } = parsed.data;

  try {
    const newArticle = await createArticle(categoryId, article, me.id);
    if (!newArticle) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error('createArticle failed:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const me = auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = UpdateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { categoryId, articleId, ...updates } = parsed.data;

  // RBAC: publishers may only edit articles they originally created
  // (publisher_id matches their user id). Super-admins may edit anything.
  if (me.role !== 'super_admin') {
    const existing = await getArticleById(articleId);
    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    if (existing.article.publisherId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const article = await updateArticle(categoryId, articleId, updates, me.id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (error) {
    console.error('updateArticle failed:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const me = auth;
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const id = searchParams.get('id');
    if (!categoryId || !id) {
      return NextResponse.json({ error: 'Category ID and Article ID are required' }, { status: 400 });
    }

    // Same ownership check as PUT — publishers can only delete their own.
    if (me.role !== 'super_admin') {
      const existing = await getArticleById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }
      if (existing.article.publisherId !== me.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await deleteArticle(categoryId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('deleteArticle failed:', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
