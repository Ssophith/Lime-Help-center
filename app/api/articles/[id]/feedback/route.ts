import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-connection';
import { rateLimit } from '@/lib/rate-limit';

interface FeedbackBody {
  type?: 'helpful' | 'not-helpful';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string' || id.length > 64) {
    return NextResponse.json({ error: 'Invalid article id' }, { status: 400 });
  }

  // Rate-limit per IP per article: 5 votes / hour. Public endpoint, no auth.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (!(await rateLimit(`feedback:${ip}:${id}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: FeedbackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.type !== 'helpful' && body.type !== 'not-helpful') {
    return NextResponse.json({ error: 'type must be "helpful" or "not-helpful"' }, { status: 400 });
  }

  const column = body.type === 'helpful' ? 'helpful' : 'not_helpful';

  // Atomic increment; returns updated counts (or no rows if article missing)
  const rows = await query<{ helpful: number; not_helpful: number }>(
    `UPDATE articles
       SET ${column} = COALESCE(${column}, 0) + 1
     WHERE id = $1
     RETURNING helpful, not_helpful`,
    [id]
  );

  // Intentionally return 200 even when the article doesn't exist — a 404 here
  // lets unauthenticated callers enumerate draft article IDs (the `art_${ms}_${rand}`
  // pattern is somewhat guessable). The client doesn't need to distinguish.
  if (rows.length === 0) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({
    success: true,
    helpful: rows[0].helpful,
    notHelpful: rows[0].not_helpful,
  });
}
