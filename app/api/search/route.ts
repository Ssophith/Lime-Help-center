import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limit: 20 requests per 10 seconds per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (!(await rateLimit(`search:${ip}`, 20, 10_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchArticles(q);
    return NextResponse.json({ results: Array.isArray(results) ? results : [] });
  } catch (error) {
    console.error('Search API error:', error);
    // Never expose stack traces to clients
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
