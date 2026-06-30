# Contributing

Thanks for working on the LIME help center. This is a small, focused
codebase serving real customer support traffic — keep changes minimal and
production-aware.

## Setup

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full local setup
(Node 20+, Docker Postgres on port 5444, `.env.production`, etc.).

## Workflow

1. Branch from `master`. Name branches after the change, not the developer
   (e.g. `fix-publish-draft-regression`, not `berjan-changes`).
2. Make the change, plus the minimum supporting tests / docs.
3. Run `npx tsc --noEmit` and `npm run build` locally before pushing.
4. Open a merge request against `master`. Describe **what** and **why**;
   leave code-level "how" to the diff.
5. Squash on merge.

## Style

- **TypeScript everywhere.** No `any` unless interfacing with an
  external lib whose types are wrong.
- **No comments that restate the code.** Only document the *why* —
  hidden constraints, past incidents, non-obvious invariants.
- **Mongolian for UI copy, English for code and developer docs.**
- **Don't add abstractions before you need them.** Three similar lines
  beat a premature helper.

## Testing

There is no test suite yet — for now, the bar is:

1. `npx tsc --noEmit` clean.
2. `npm run build` succeeds.
3. Smoke-test the changed flow in a browser against `npm run dev` or the
   running production instance.
4. For API changes, `curl` the endpoint with realistic payloads.
5. For DB changes, write the migration as a SQL file in `scripts/` and
   apply it before merging (don't bake migrations into TS code paths).

If you add a test framework, document it here.

## Security

- **Never** commit `.env.production`, API keys, passwords, tokens, or
  DB credentials. See [docs/SECURITY.md](docs/SECURITY.md).
- Mutation routes (POST/PUT/PATCH/DELETE) must:
  1. Call `requireSameOrigin(request)` from `@/lib/csrf`.
  2. Call `requireUser()` or `requireRole(['super_admin'])` from `@/lib/api-auth`.
  3. Validate the body with a Zod `.strict()` schema.
- Public routes that touch the DB should have a rate limit from
  `@/lib/rate-limit`.
- HTML stored in the DB that's rendered via `dangerouslySetInnerHTML` must
  pass through `sanitizeArticleHtml` from `@/lib/sanitize-html`.

## Database changes

- Schema changes live in `scripts/*.sql`, idempotent (`IF NOT EXISTS`,
  `IF NOT EXISTS`).
- Apply migrations against the live DB only after they're reviewed.
- Update `docs/DEPLOYMENT.md` if a new migration is part of the deploy.

## Docs

We keep docs minimal. The four pinned docs in `docs/` plus the four root
files (`README.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`) cover
everything. **Do not create new `README-X.md` or `DEPLOYMENT-X.md` at the
root** — absorb the content into the right pinned doc instead.

If you're unsure where something belongs, ask the `kb-doc-curator` agent.

## Commit messages

```
Short imperative subject line (≤72 chars)

Longer explanation of *why* this change exists, what it replaces, what
trade-offs you took. Don't restate the diff.

Refs #123 (if applicable)
```

Co-authored commits are welcome.

## Releases

Bump the version in `package.json`, write a CHANGELOG entry under
`[Unreleased]` → move it to a new version section, tag the commit
(`git tag v0.2.0`), push the tag.
