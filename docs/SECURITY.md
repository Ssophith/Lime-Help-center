# Security

Security model, secret-handling procedures, and the hardening currently in
place for the LIME help center.

## Threat model

Primary concerns, in order:

1. **Public site abuse** — bot scraping of `/api/ask`, `/api/search`,
   `/api/articles/[id]/feedback`. Mitigations: per-IP rate limits,
   server-side content sanitization, CSP, no leaked enumeration signals.
2. **Compromised publisher account** — a publisher's session cookie or
   credentials are stolen. Mitigations: publisher-only RBAC, role-checked
   mutations, server-side HTML sanitization (defangs stored XSS payloads),
   CSP defense-in-depth.
3. **Compromised super-admin account** — full takeover. Mitigations:
   bcrypt cost-10 passwords, rate-limited login (per-IP and per-username),
   SameSite=strict session cookie, CSRF check on every mutation.
4. **Secrets in source control** — historical leaks. Mitigations: all
   secrets in `.env.production` (gitignored), Docker `.env` (gitignored),
   placeholder docs that point at the env files. Rotate if exposed.

## Authentication

- **Session tokens** are 256-bit random hex (`crypto.randomBytes(32)`)
  stored in the `sessions` table with a 24-hour expiry. Logout deletes
  the row; expired tokens are pruned opportunistically on each successful
  login.
- **Cookie flags:** `httpOnly`, `secure` (prod), `sameSite: 'strict'`,
  `path: '/'`. `sameSite: strict` blocks the cookie on cross-site
  top-level navigations — the primary CSRF vector for cookie-auth admin
  panels.
- **Passwords:** bcrypt cost 10 (`bcrypt.compare` is constant-time).
  Minimum length 8 across all entry points (login set, invite-accept,
  profile change, super-admin password reset).
- **Two user tables:**
  - `admin_users` — legacy username-based logins (e.g. `admin`).
    Linked to a `users` row via `admin_users.linked_user_id` for role
    resolution. See `scripts/add-admin-linked-user.sql`.
  - `users` — modern email-based logins. Each row has a role
    (`super_admin` | `publisher`) and an `is_active` flag.

## Authorization

Every mutation route layers three checks:

1. `requireSameOrigin(request)` from `lib/csrf.ts` — rejects cross-origin
   POST/PUT/PATCH/DELETE.
2. `requireUser()` or `requireRole(['super_admin'])` from
   `lib/api-auth.ts` — validates session and role.
3. Zod `.strict()` schema validation — rejects unknown fields and
   prevents mass-assignment.

Per-route RBAC:

| Route | Required |
|---|---|
| `/api/categories` POST/PUT/DELETE | super-admin |
| `/api/faqs` POST/PUT/DELETE | super-admin |
| `/api/articles` POST | any authenticated user |
| `/api/articles` PUT/DELETE | super-admin **or** the article's `publisher_id` |
| `/api/users` GET/POST/PUT/DELETE | super-admin |
| `/api/users/invites*` | super-admin |
| `/api/users/me` GET/PUT | any authenticated user (only their own row) |
| `/api/upload` | any authenticated user |
| `/api/articles/[id]/feedback` | public (rate-limited) |
| `/api/ask` | public (rate-limited) |
| `/api/search` | public (rate-limited) |

## Rate limiting

Defined in `lib/rate-limit.ts` (sliding-window). Defaults:

| Endpoint | Bucket | Limit / Window |
|---|---|---|
| `/api/auth/login` | per IP | 20 / 15 min |
| `/api/auth/login` | per username | 10 / 15 min |
| `/api/articles/[id]/feedback` | per IP per article | 5 / hour |
| `/api/ask` | per IP | 10 / hour |
| `/api/search` | per IP | 20 / 10 sec |
| `/api/users/invites/resend` | per admin | 10 / hour |
| `/api/users/invites/accept` | per IP | 20 / 15 min |

In-memory by default — fine for single-instance PM2. Set `REDIS_URL` to
auto-enable a Redis sliding-window backend when scaling out.

## Content security

- **Article + FAQ HTML** is sanitized with `isomorphic-dompurify` via
  `lib/sanitize-html.ts` before any `dangerouslySetInnerHTML` call.
  The allowlist matches what TinyMCE emits for the configured editor
  toolset. `<script>`, event handlers, and `javascript:` URLs are
  stripped.
- **Content-Security-Policy** is set per-path in `middleware.ts`:
  - Public pages: strict (`script-src 'self' 'unsafe-inline'` plus
    Cloudflare Insights only).
  - `/jadmin/*`: same plus TinyMCE CDN (`cdn.tiny.cloud`) and
    `'unsafe-eval'` for editor plugins.
  - Both: `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`.

## File uploads

- 25 MB cap per upload (`MAX_UPLOAD_BYTES` in `app/api/upload/route.ts`).
- Extension allowlist: jpg/jpeg/png/gif/webp/svg/mp4/webm/mov/pdf/doc/
  docx/xls/xlsx/ppt/pptx/txt.
- MIME allowlist: `image/*`, `video/*`, plus an explicit document set.
- Filenames are sanitized (`[a-zA-Z0-9.-]` only) and prefixed with a
  UUID inside `lib/r2.ts` — path traversal closed.
- The R2 bucket is intentionally a public CDN; the app never proxies
  download requests through itself.

## AI chat (`/api/ask`)

- Public, unauthenticated, rate-limited (10/IP/hour).
- Article content is stripped of HTML before being injected into the
  Groq prompt — reduces prompt-injection surface from rich-text artifacts.
- The system prompt explicitly instructs the model to ignore any
  instructions embedded in article bodies ("Ignore previous instructions",
  etc.). Not a security boundary on its own — pair with sanitization +
  output rendering in markdown-only (no `dangerouslySetInnerHTML` in
  `components/AIChat.tsx`).
- Source articles are filtered to `status = 'published'` only — drafts
  and archived articles aren't exposed via the chat.

## Where secrets live

The **only** place credentials should exist:

- `/home/admin/limekb/.env.production` on the production server
  (`chmod 600`, gitignored).
- `/home/admin/limekb/.env` next to `docker-compose.yml` for the local
  Postgres password (`chmod 600`, gitignored).
- The `admin_users.password_hash` and `users.password_hash` columns in
  the DB (bcrypt hashes — never raw).
- The `sessions.token` column (random per-session, not derived from a
  long-lived secret).

**Nowhere else.** Specifically:

- ❌ Not in `ecosystem.config.js`
- ❌ Not in `docker-compose.yml` literals
- ❌ Not in any `*.md` file
- ❌ Not in `setup-*.sh` scripts
- ❌ Not in commit history that's been intentionally preserved

If you ever find one elsewhere, that's a finding — rotate the secret,
update the source of truth, scrub the leak, document the rotation.

## Rotation procedures

### Postgres password

```bash
# 1. Pick a new password
NEW=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")

# 2. Change it inside the DB
docker exec -i kb_postgres psql -U limekb -d limekb \
  -c "ALTER USER limekb PASSWORD '$NEW';"

# 3. Update .env.production (DATABASE_URL) and the docker-compose .env
$EDITOR /home/admin/limekb/.env.production
$EDITOR /home/admin/limekb/.env

# 4. Restart the app
pm2 restart limekb --update-env

# 5. Restart Postgres so it picks up the new POSTGRES_PASSWORD on next bootstrap
#    (the running container retains the old credential until reset)
docker compose up -d
```

### Admin login password

```bash
cd /home/admin/limekb
ADMIN_PASSWORD='<new-strong-password>' npm run create-admin admin "$ADMIN_PASSWORD"
# Existing sessions remain valid until they expire (24h) — revoke them if needed:
docker exec -i kb_postgres psql -U limekb -d limekb \
  -c "DELETE FROM sessions WHERE username = 'admin';"
```

### R2 / SES / Groq / TinyMCE API keys

Revoke at the provider console, generate a new key, paste into
`.env.production`, `pm2 restart limekb --update-env`. No DB change.

| Provider | Revoke / rotate at |
|---|---|
| Cloudflare R2 | <https://dash.cloudflare.com> → R2 → API Tokens |
| AWS SES | <https://console.aws.amazon.com/iam> → Users → SES user → Security credentials |
| Groq | <https://console.groq.com/keys> |
| TinyMCE | <https://www.tiny.cloud/my-account/dashboard/> |

## Auditing

- `article_history` rows record `(action, user_id, article_id, created_at)`
  for every create / update / publish / archive / delete. Query it for
  forensics:
  ```sql
  SELECT h.created_at, u.name, h.action, a.title, h.changes
    FROM article_history h
    LEFT JOIN users u ON u.id = h.user_id
    LEFT JOIN articles a ON a.id = h.article_id
    WHERE h.created_at > NOW() - INTERVAL '7 days'
    ORDER BY h.created_at DESC;
  ```
- PM2 logs (`/home/admin/.pm2/logs/limekb-*`) record auth failures and
  rate-limit hits.
- Postgres logs (`docker logs kb_postgres`) record connection attempts —
  useful if the DB is being targeted.

## Known acceptable gaps

These are documented choices, not bugs:

- **IDs are timestamp-prefixed** (`art_1769432959049_<rand>`). The
  random part is now `crypto.randomBytes(6)` (48 bits) so guessing one
  is impractical, but the timestamp half is informational.
- **No 2FA.** Out of scope for the current threat model. If a super-admin
  account becomes the actual attack target, add WebAuthn / TOTP.
- **Cloudflare Insights is allowed in CSP.** It's our own analytics
  beacon and runs on the CF zone — accepted as part of the platform.
- **In-memory rate limit.** Fine for one PM2 instance. Switch to Redis
  by setting `REDIS_URL` if you fork or scale.

## Reporting a vulnerability

For internal LIME use only. If you find something, talk to the team
directly — don't open a public issue.
