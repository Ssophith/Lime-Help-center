import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { requireSameOrigin } from '@/lib/csrf';

const CreateBody = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  order: z.number().int().default(0),
}).strict();

const UpdateBody = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  order: z.number().int().optional(),
}).strict();

export async function GET() {
  try {
    const faqs = await getFAQs();
    return NextResponse.json(Array.isArray(faqs) ? faqs : []);
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
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
    const faq = await createFAQ(parsed.data);
    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
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
    const faq = await updateFAQ(id, updates);
    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }
    return NextResponse.json(faq);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
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
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }
    await deleteFAQ(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
