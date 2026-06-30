# Admin Guide

For content authors (publishers and super-admins) maintaining content on
the LIME help center.

## Logging in

1. Go to <https://help.lime.mn/jadmin/login>
2. Username (super-admin) or email address (publisher) + password.
3. You're now on `/jadmin`. Sessions last 24 hours.

If you don't have an account yet, ask a super-admin to send you an
invite — you'll get an email with a one-time link to set your password.

## Sidebar

Five sections, gated by role:

| Section | Path | Role |
|---|---|---|
| Ангилал (Categories) | `/jadmin?menu=categories` | super-admin |
| Нийтлэл (Articles) | `/jadmin?menu=articles` | any |
| FAQ | `/jadmin?menu=faqs` | super-admin |
| Хэрэглэгчид (Users) | `/jadmin?menu=users` | super-admin |
| Профайл (Profile) | `/jadmin?menu=profile` | any |

Publishers can edit / delete their **own** articles. Super-admins can edit
anyone's content and manage everything.

## Categories

Categories define the site's top-level navigation. Drag-and-drop the cards
to reorder. Each card shows the article count.

**Add:** `Шинэ ангилал` → fill in slug, title, optional description, icon,
and icon-background color (pastel hex). Save.

**Edit:** click `Засах` on the card. Same fields as create.

**Delete:** trash icon. **All articles in that category will also be deleted
(cascade).** Confirm carefully.

## Articles

The articles tab lists every article across every category with filters
for search query, status (published / draft / archived), and category.
Click a column header to sort.

**Add:** `Шинэ нийтлэл нэмэх` opens the editor modal.

Fields:
- **Ангилал** — pick the category.
- **Статус** — `Ноорог` (draft, hidden from public), `Нийтлэгдсэн`
  (published, public), `Архивлагдсан` (archived, hidden from public).
- **Slug** — URL segment (e.g. `loginmail` → `/login/loginmail`).
  Lowercase, alphanumeric, hyphens only.
- **Гарчиг** — page title.
- **Агуулга** — body, rich text. See "Editor" below.
- **Товчлол** — optional short excerpt for search results / OG metadata.
- **Дараалал** — display order within the category. Lower numbers first.

Hit `Хадгалах` to save.

Quick actions in the table:
- `Нийтлэх` (Publish), `Ноорог` (Move to draft), `Архив` (Archive) —
  one-click status changes.
- Pencil icon — open the edit modal.
- Trash icon — delete the article.

## Editor

The article editor is TinyMCE, configured for Mongolian content authoring.

**Inserting images:** toolbar → image icon → upload from your device.
Files go to Cloudflare R2 and the URL is inserted automatically. Drag-
and-drop into the editor also works.

**Inserting videos / PDFs:** toolbar → media or file picker. Same flow.
Size limit: 25 MB per file. Allowed types: jpg / jpeg / png / gif / webp /
svg, mp4 / webm / mov, pdf / doc / docx / xls / xlsx / ppt / pptx / txt.

**Headings, lists, links:** use the formatting toolbar. The block
formatter supports Paragraph, H1–H4, and Preformatted. Mulish is the
only font (matches the LIME brandbook).

**Tables:** Insert → Table. Resize cells by dragging.

**HTML view:** Tools → Source code. Useful for fixing markup, embedding
iframes, etc. Anything you paste here is server-side sanitized via
DOMPurify before being shown to the public — `<script>`, event handlers
(`onerror=`, `onclick=`), and `javascript:` URLs are stripped.

**Don't paste from Word directly.** Word smuggles in font tags and
inline styles that look messy. Paste into a plain-text intermediary
first (or use TinyMCE's "Paste as text" mode).

## FAQs

Single-tier list of frequently asked questions, shown on the public home
page. Same editor as articles, no category. Drag to reorder.

## Users (super-admin only)

Lists all `users` rows. Each row has:
- **Edit** — change name. Email + role can't be changed after creation
  for security.
- **Key** — change the user's password.
- **Ban / Play** — toggle `isActive`. Inactive users can't log in.
- **Trash** — delete the user.

Self-delete and self-deactivation are blocked.

**Invite a new user:** `Хэрэглэгч урих` → enter an `@onlime.mn` email and
pick `Нийтлэгч` (publisher) or `Супер админ`. They get an email with a
link valid for 72 hours.

**Pending invites** show below the user list. You can resend the email or
cancel the invite.

## Profile

Update your own name and change your password. Email is immutable.

## What publishers can't do

- Edit articles they didn't create
- Edit or delete categories
- Edit or delete FAQs
- See or manage other users
- Send invites

If a publisher needs to edit someone else's article, a super-admin has to
either reassign it (via DB) or make the edit themselves.

## Status badge meanings

| Status | Public visibility | Search visibility | AI chat retrieves |
|---|---|---|---|
| Нийтлэгдсэн (published) | ✅ | ✅ | ✅ |
| Ноорог (draft) | ❌ | ❌ | ❌ |
| Архивлагдсан (archived) | ❌ | ❌ | ❌ |

Articles that haven't been categorized stay searchable internally but
won't appear under the category listing.

## AI chat widget

Every public page has a green floating button bottom-right that opens the
LIME AI assistant. It answers in Mongolian using only published articles
as source material; it cites them at the end of each response. If no
article covers the topic, it declines politely.

If users complain about wrong answers — usually it's a content gap.
Check the category, add or update the article, and the next question on
that topic will return the new content (FTS picks it up immediately).
