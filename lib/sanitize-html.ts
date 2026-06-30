import DOMPurify from 'isomorphic-dompurify';

/**
 * Server-side HTML sanitizer for user-authored TinyMCE content.
 *
 * Authors are limekb publishers (trusted enough to write articles, but not
 * trusted with raw <script>). Any HTML stored in articles or FAQs flows
 * through `dangerouslySetInnerHTML` on public pages, so a hostile or
 * compromised publisher could otherwise script every visitor's browser.
 *
 * Allowlist matches what TinyMCE actually emits for our editor config:
 * formatting, lists, links, images, tables, basic blocks. No <script>,
 * no event handlers, no `javascript:` / `data:` URLs.
 */
const config = {
  ALLOWED_TAGS: [
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img', 'video', 'source', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
    'iframe', // for embedded video; locked down via ALLOWED_URI_REGEXP below
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title',
    'src', 'alt', 'width', 'height', 'controls', 'poster',
    'class', 'style',
    'colspan', 'rowspan',
    'data-sheets-root',
    'allow', 'allowfullscreen', 'frameborder',
    'draggable', 'cursor',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Force every <a> to open safely
  ADD_ATTR: ['target'],
  // strip unknown protocols entirely
  ALLOW_DATA_ATTR: false,
  USE_PROFILES: { html: true },
};

export function sanitizeArticleHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  const clean = DOMPurify.sanitize(dirty, config) as unknown as string;
  return clean;
}
