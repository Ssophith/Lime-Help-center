# LIME Help Center

Knowledge base & help center for **LIME** (Mongolian mobile operator), running in production at **[help.lime.mn](https://help.lime.mn)**.

Built with Next.js 15, React 19, PostgreSQL, and Tailwind CSS. Content is authored in Mongolian (Cyrillic).

---

## Features

- 📚 **Categories, articles, FAQs** — organize support content with drag-and-drop reordering
- 🔍 **Full-text search** — Postgres FTS over titles, excerpts, and article bodies with relevance ranking
- ✍️ **TinyMCE-based editor** — rich text + image / video / PDF uploads to Cloudflare R2
- 🤖 **AI chat widget** — RAG-powered Q&A on every public page (Groq Llama 3.3 70B), citing retrieved articles
- 👥 **Roles** — super-admin (full access) + publisher (edit own articles only)
- 🔐 **Hardened auth** — bcrypt passwords, opaque session tokens, SameSite=strict cookies, CSRF, rate-limiting, CSP
- 📊 **Article feedback** — public helpful / not-helpful voting

## Quick start (local development)

```bash
# 1. Install deps (Node 20+)
npm install

# 2. Start Postgres in Docker
npm run db:up

# 3. Configure environment
cp env.production.template .env.production
# Edit .env.production — set DATABASE_URL, R2_*, GROQ_API_KEY, etc.

# 4. Create an admin user
npm run create-admin admin <strong-password>

# 5. Run the dev server
npm run dev   # http://localhost:3000

# 6. (Optional) seed example content
npm run add-examples
```

The admin panel is at `/jadmin` (intentionally non-obvious to reduce drive-by bot login attempts). The public site is everything else.

## Project layout

```
app/
  page.tsx                  Public homepage (categories grid)
  [category]/page.tsx       Public category page (articles list)
  [category]/[article]/     Public article view
  faq/[id]/                 Public FAQ view
  search/                   Public search results
  api/                      REST endpoints (categories, articles, faqs, users, auth, upload, ask, search)
  jadmin/                   Admin panel (auth-gated)
    _components/            Per-tab admin components (CategoriesTab, ArticlesTab, etc.)

lib/
  db-pg.ts                  Postgres data layer
  db-users.ts               User + invite + article-history operations
  db-connection.ts          Pool + query helpers
  auth.ts                   Session token issuance, cookie helpers, bcrypt verify
  api-auth.ts               requireAuth / requireUser / requireRole guards
  csrf.ts                   requireSameOrigin for mutation routes
  rate-limit.ts             Async rate limiter (in-memory + optional Redis backend)
  sanitize-html.ts          DOMPurify wrapper for article HTML

components/
  AIChat.tsx                Floating chat widget (public pages)
  TinyMCEEditor.tsx         Rich text editor wrapper
  ...

middleware.ts               Per-path Content-Security-Policy
scripts/                    DB migrations + seed scripts
docs/                       DEPLOYMENT, DEVELOPMENT, ADMIN_GUIDE, SECURITY
```

## Documentation

- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — local dev setup, Node version, WSL notes
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — production deploy (Docker, PM2, nginx, R2)
- **[docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)** — for content authors: categories, articles, FAQs
- **[docs/SECURITY.md](docs/SECURITY.md)** — security model, where secrets live, rotation procedures
- **[CHANGELOG.md](CHANGELOG.md)** — version history
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — how to develop, test, submit changes

## License

MIT — see [LICENSE](LICENSE).

---

**Brand assets:** [lime.mn/brandbook](https://lime.mn/brandbook). UI uses the LIME palette (`#02251A` deep green + `#C8FF00` lime accent) and Mulish typeface.
