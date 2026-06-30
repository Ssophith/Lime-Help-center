import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { requireSameOrigin } from '@/lib/csrf';

// Categories define site structure — only super_admin should mutate them.
// Publishers write article content but can't reshape navigation.

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const CreateBody = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  icon: z.string().max(500).optional(),
  iconColor: HexColor.optional(),
  order: z.number().int().default(0),
  articles: z.array(z.any()).optional(), 
}).strict();

const UpdateBody = z.object({
  id: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(500).optional(),
  iconColor: HexColor.optional(),
  order: z.number().int().optional(),
  articles: z.array(z.any()).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAllStatuses = searchParams.get('includeAllStatuses') === 'true';
    const categories = await getCategories(includeAllStatuses);
    return NextResponse.json(Array.isArray(categories) ? categories : []);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const me = await requireRole(['super_admin']);
  if (me instanceof NextResponse) return me;
  try {
    const parsed = CreateBody.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const category = await createCategory(parsed.data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const me = await requireRole(['super_admin']);
  if (me instanceof NextResponse) return me;
  try {
    const parsed = UpdateBody.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { id, ...updates } = parsed.data;
    const category = await updateCategory(id, updates);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const me = await requireRole(['super_admin']);
  if (me instanceof NextResponse) return me;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
