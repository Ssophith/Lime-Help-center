const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root warning
  outputFileTracingRoot: path.join(__dirname),
  // Allow cross-origin requests from local network (fixes dev warning)
  allowedDevOrigins: process.env.NODE_ENV === 'production' ? [] : ['192.168.4.200'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'onlime.mn' },
      { protocol: 'https', hostname: 'support.onlime.mn' },
      { protocol: 'https', hostname: 'help.lime.mn' },
      { protocol: 'https', hostname: 'cdn-kb.lime.mn' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  // Allow access from any host (for network access)
  async rewrites() {
    return [];
  },
  // Ensure static files are served correctly
  async headers() {
    // Content-Security-Policy is set per-path in middleware.ts so that
    // /jadmin/* can load TinyMCE from cdn.tiny.cloud while public pages
    // keep a stricter policy. Don't add CSP here — duplicate headers
    // intersect in the browser, making things effectively *more* restrictive.
    return [
      {
        source: '/:path*',
        headers: [
          // Access-Control-Allow-Origin is not set by Nginx, keep it here
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://help.lime.mn'
              : '*',
          },
          // NOTE: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection,
          // Referrer-Policy, and HSTS are all set by Nginx — removed from here
          // to avoid duplicate headers which can cause browser warnings.
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

};

module.exports = nextConfig;
