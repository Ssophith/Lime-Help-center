import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF defense for mutation routes.
 *
 * Verifies the request's Origin (or Referer fallback) host matches the
 * server's own host. Cookies on a cross-origin request will still be sent
 * with SameSite=lax — Origin check closes that gap.
 *
 * Returns null when the request is same-origin (caller proceeds), or a
 * 403 NextResponse otherwise.
 *
 * Usage in any state-changing route handler:
 *   const csrf = requireSameOrigin(request);
 *   if (csrf) return csrf;
 */
export function requireSameOrigin(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  // GET/HEAD/OPTIONS aren't state-changing — let them through.
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const host = request.headers.get('host');
  if (!host) {
    return NextResponse.json({ error: 'Missing Host header' }, { status: 400 });
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Prefer Origin (always set on POST/PUT/DELETE from browsers).
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return null;
      return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
    } catch {
      return NextResponse.json({ error: 'Invalid Origin header' }, { status: 400 });
    }
  }

  // Fall back to Referer when Origin is absent (some same-origin tools omit Origin).
  if (referer) {
    try {
      const refHost = new URL(referer).host;
      if (refHost === host) return null;
      return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
    } catch {
      return NextResponse.json({ error: 'Invalid Referer header' }, { status: 400 });
    }
  }

  // Neither Origin nor Referer — likely a non-browser client. Reject mutations
  // unless explicitly allowlisted upstream.
  return NextResponse.json(
    { error: 'Missing Origin/Referer header on mutation request' },
    { status: 403 }
  );
}
