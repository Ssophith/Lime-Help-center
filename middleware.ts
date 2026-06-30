import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Path-based Content Security Policy.
 *
 * Public pages get a strict CSP — no remote script CDNs, image hosts limited
 * to our own R2 and the LIME domains. Admin pages at /jadmin/* need a looser
 * policy: TinyMCE loads from `cdn.tiny.cloud`, and Cloudflare auto-injects
 * its Insights beacon on proxied traffic. We allow both.
 *
 * next.config.js can't easily split headers by path (multiple matchers
 * concatenate → browsers intersect → effectively *more* restrictive).
 * Middleware sets exactly one CSP per response, so split-by-path works
 * the way you'd expect.
 */

const ADMIN_CSP = [
  "default-src 'self'",
  // TinyMCE CDN + Cloudflare Insights beacon. 'unsafe-eval' is needed by
  // TinyMCE for some plugins (codeview, autoresize, certain format pickers).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tiny.cloud https://*.tiny.cloud https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tiny.cloud https://*.tiny.cloud",
  "font-src 'self' https://fonts.gstatic.com https://cdn.tiny.cloud https://*.tiny.cloud data:",
  "img-src 'self' data: blob: https://cdn-kb.lime.mn https://*.r2.dev https://onlime.mn https://support.onlime.mn https://help.lime.mn https://cdn.tiny.cloud https://*.tiny.cloud",
  "media-src 'self' https://cdn-kb.lime.mn https://*.r2.dev blob:",
  "connect-src 'self' https://cdn.tiny.cloud https://*.tiny.cloud https://cloudflareinsights.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const PUBLIC_CSP = [
  "default-src 'self'",
  // Cloudflare Insights is injected by the CF proxy on this domain too —
  // keep allow so the public site doesn't throw console errors.
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://cdn-kb.lime.mn https://*.r2.dev https://onlime.mn https://support.onlime.mn https://help.lime.mn",
  "media-src 'self' https://cdn-kb.lime.mn https://*.r2.dev",
  "connect-src 'self' https://cloudflareinsights.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isAdmin = request.nextUrl.pathname.startsWith('/jadmin');
  response.headers.set('Content-Security-Policy', isAdmin ? ADMIN_CSP : PUBLIC_CSP);
  return response;
}

// Skip middleware for static assets and Next.js internals — they already
// pass through fine and we don't need to compute CSP for every chunk.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
};
