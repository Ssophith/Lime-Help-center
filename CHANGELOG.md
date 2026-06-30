# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
attempts to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **AI chat widget** (`components/AIChat.tsx`) on every public page —
  RAG-powered Q&A using Groq Llama 3.3 70B over the article corpus.
  Streaming responses with source citations, Mongolian system prompt,
  IP rate-limit of 10/hr.
- **`/api/articles/[id]/feedback`** public POST endpoint (Mongolian
  helpful/not-helpful voting). Was being called by `ArticleFeedback.tsx`
  but the route didn't exist.
- **`/api/ask`** streaming endpoint backing the AI widget.
- **CSP enforcement** via `middleware.ts` — strict policy on public pages,
  TinyMCE-friendly policy on `/jadmin/*`.
- **Server-side HTML sanitization** for all article + FAQ rendering
  (`lib/sanitize-html.ts` using `isomorphic-dompurify`).
- **CSRF defense** — `lib/csrf.ts requireSameOrigin()` applied to every
  mutation route. Session cookie upgraded to `sameSite: 'strict'`.
- **Zod allowlist validation** with `.strict()` on articles, FAQs,
  categories, users, invites endpoints.
- **Rate limiting** wired into `/api/auth/login`, `/api/users/invites/*`,
  `/api/articles/[id]/feedback`, `/api/ask`. `lib/rate-limit.ts` now async
  with optional Redis backend (auto-enabled when `REDIS_URL` is set).
- **Publisher RBAC** on `/api/articles` — publishers can only edit/delete
  articles they originally created. Categories and FAQs require
  `super_admin` role.
- **Explicit admin→user mapping** via `admin_users.linked_user_id` column
  (`scripts/add-admin-linked-user.sql`).
- **Article search FTS** with stopword filter + relevance ranking
  (`articles.search_vector` tsvector + GIN index via `scripts/add-fts.sql`).
- **Documentation curator agent** at `.claude/agents/kb-doc-curator.md`
  plus `kb-bug-hunter`, `kb-security-pentester`, `kb-db-inspector`.

### Changed
- **`jadmin/page.tsx` refactored** from 1775 → 600 lines (62% reduction).
  Per-tab components extracted to `app/jadmin/_components/`:
  ArticleModal, ProfileTab, CategoriesTab, ArticlesTab, FAQsTab, UsersTab,
  EditUserModal, PasswordModal, InviteModal.
- **`lib/db.ts`** now re-exports `db-pg` directly; runtime backend switch
  removed.
- **ID generation** in `lib/db-pg.ts` swapped from `Math.random()` to
  `crypto.randomBytes(6).toString('hex')`.
- **Password policy** unified at min length 8 (was inconsistently 6 or 8
  across invite-accept, profile, and admin reset).
- **`/api/users/me`** GET no longer fabricates a `super_admin` response
  when the session can't be mapped to a user row.
- **Search retrieval** now OR-matches tokens (was AND, returned 0 hits
  for any multi-word question).

### Fixed
- **Published → draft regression**: TinyMCE `onEditorChange` could fire
  with a stale render-time closure of `articleForm`, overwriting
  `status: 'published'` with the post-save reset `'draft'`. All
  `setArticleForm` calls now use the functional updater form.
- **Category-dropdown clobber of `articleId`** when mid-edit — preserves
  the real id; new-article flow still gets a temp id.
- **Placeholder auth holes** in `/api/users`, `/api/users/invites` GET,
  and `/api/users/invites/resend` — these were returning a hardcoded
  `{role: 'super_admin'}` for any session cookie value.
- **Feedback endpoint enumeration**: now returns 200 regardless of
  article existence to prevent draft-ID scraping.
- **Mass-assignment risk**: client-supplied `views`, `helpful`,
  `publisher_id`, etc. are now rejected by `.strict()` schemas.
- **Font fallback**: `globals.css` body referenced `'TT Norms Pro'` first
  (never loaded), causing silent fallback to system fonts. Now `'Mulish'`.

### Removed
- **`lib/db-fs.ts`** and **`lib/init-data.ts`** — legacy JSON-file storage
  backend retired. Postgres only.
- **Cleartext credentials** purged from `PRODUCTION-CREDENTIALS.md`,
  `ecosystem.config.js`, `docker-compose.yml`, `env.production.template`,
  `setup-docker-database.sh`, `DEPLOYMENT-*.md`. Secrets now live only in
  `.env.production` (gitignored).
- **Documentation consolidation**: 20 ad-hoc `.md` / `.txt` files at the
  repo root collapsed into `README.md` + `LICENSE` + `CHANGELOG.md` +
  `CONTRIBUTING.md` + `docs/{DEPLOYMENT,DEVELOPMENT,ADMIN_GUIDE,SECURITY}.md`.

### Security
- Full security audit completed; all Critical and High findings remediated
  this release. See `docs/SECURITY.md` for the security model and ongoing
  ops procedures.

## [0.1.0] — 2026-03-26

Initial production deployment as `help.lime.mn`. Pre-rebuild snapshot.
