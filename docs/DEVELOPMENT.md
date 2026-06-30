# Development

Local setup for working on the LIME help center.

## Prerequisites

- **Node.js 20+** (`engines.node` in `package.json` requires `>= 20.9.0`).
  If you're on an older version, install `nvm` and run `nvm install 20`.
- **Docker** for the local Postgres container.
- A Cloudflare R2 bucket (or accept that image uploads won't work locally
  — text-only authoring still works).
- A Groq API key (free at <https://console.groq.com/keys>) if you want the
  AI chat widget to actually answer. Without it, `/api/ask` returns 503
  and the widget shows a graceful error.

## First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres in Docker (binds host port 5444)
npm run db:up

# 3. Create a .env.production based on the template
cp env.production.template .env.production
chmod 600 .env.production
```

Fill in the required variables in `.env.production`:

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Everything | `postgresql://limekb:<pw>@localhost:5444/limekb` — match `docker-compose.yml` |
| `R2_*` | Image / video / PDF uploads | See `docs/DEPLOYMENT.md` for R2 setup |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | The article editor | Free at <https://www.tiny.cloud/> |
| `GROQ_API_KEY` | AI chat widget | Free at <https://console.groq.com/keys> |
| `NODEMAILER_*` / `AWS_SES_*` | User invites by email | Optional locally |
| `REDIS_URL` | Multi-instance rate limiting | Optional — leave unset for in-memory |

```bash
# 4. Apply the FTS migration (adds articles.search_vector + GIN index)
psql "$DATABASE_URL" -f scripts/add-fts.sql

# 5. Apply the admin→user mapping migration
psql "$DATABASE_URL" -f scripts/add-admin-linked-user.sql

# 6. Create an admin user
npm run create-admin admin <pick-a-strong-password>

# 7. (Optional) seed example content
npm run add-examples

# 8. Run the dev server
npm run dev
```

Visit:
- **Public site**: <http://localhost:3000>
- **Admin panel**: <http://localhost:3000/jadmin> (log in with the admin user you created)

## Common scripts

```bash
npm run dev              # Dev server on 0.0.0.0:3000
npm run build            # Production build (also runs postbuild chmod)
npm start                # Run the built server
npm run lint             # ESLint
npm run db:up            # docker-compose up -d (Postgres)
npm run db:down          # docker-compose down
npm run db:logs          # Tail Postgres logs
npm run db:fts           # Apply FTS migration (tsx wrapper)
npm run create-admin     # Create an admin_users row
npm run add-examples     # Seed example content
npm run migrate          # File-storage → Postgres migration (legacy; no longer needed)
```

## Useful direct DB access

```bash
# Get DATABASE_URL into your shell
export $(grep -E '^DATABASE_URL=' .env.production)
psql "$DATABASE_URL"
```

Common one-liners:

```sql
-- What's published vs draft vs archived?
SELECT status, COUNT(*) FROM articles GROUP BY status;

-- Find articles in the empty 'number' category (or any category)
SELECT a.id, a.title, a.status FROM articles a
  JOIN categories c ON c.id = a.category_id
  WHERE c.slug = 'number';

-- Who edited what, recently
SELECT h.action, h.created_at, u.name, a.title
  FROM article_history h
  LEFT JOIN users u ON u.id = h.user_id
  LEFT JOIN articles a ON a.id = h.article_id
  ORDER BY h.created_at DESC LIMIT 20;
```

## Editor stack

- **TinyMCE** (`@tinymce/tinymce-react`) is the primary editor. Loaded
  from `cdn.tiny.cloud` — the API key is in `NEXT_PUBLIC_TINYMCE_API_KEY`
  and is safe to expose (it's domain-locked at tiny.cloud).
- Uploaded images / videos / PDFs go to `/api/upload`, which streams them
  to Cloudflare R2 under `categories/{categorySlug}/articles/{articleId}/`.
- Server-side HTML is sanitized via `lib/sanitize-html.ts` before being
  rendered with `dangerouslySetInnerHTML` on public pages — see
  `docs/SECURITY.md` for the allowlist.

## Windows / WSL

- Run everything inside WSL2 (Ubuntu). Node + Docker work natively there.
- If `localhost:3000` from a Windows browser doesn't reach WSL, set up
  port forwarding from PowerShell (as Admin):
  ```powershell
  wsl hostname -I   # find the WSL2 IP
  netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
  netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<WSL_IP>
  ```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `DATABASE_URL environment variable is not set` | Missed step 3 above, or running from a shell that doesn't auto-load `.env.production` |
| `column a.search_vector does not exist` (search errors) | Skipped the FTS migration in step 4 |
| Admin can edit but `last_modified_by` stays null | `admin_users.linked_user_id` isn't populated — re-run step 5 |
| AI chat returns 503 | `GROQ_API_KEY` unset or revoked |
| AI chat says "prepayment credits depleted" | You're using a Gemini key on a billed Google Cloud project. Switch to Groq (free) or top up Google billing. |
| Article images don't load | R2 credentials wrong, or R2 bucket public-URL not set in `R2_PUBLIC_URL` |
