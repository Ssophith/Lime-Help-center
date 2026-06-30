-- Replace the implicit `email LIKE 'username@%'` fallback in
-- getUserByLoginIdentifier with an explicit foreign key from each
-- admin_users row to its corresponding users row.
--
-- Why: the LIKE fallback resolved the legacy `admin` login to whichever
-- users row was created first with an `admin@*` email — that's
-- order-dependent and silently breaks if someone is later invited at
-- e.g. `admin@onlime.mn` before the original `admin@lime.mn`. The
-- explicit column makes the mapping reviewable and stable.

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS linked_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_users_linked_user_id ON admin_users(linked_user_id);

-- Backfill: link each admin_users row to the corresponding users row by
-- explicit email convention (username + '@lime.mn'). Adjust if your
-- deployment uses a different domain mapping.
UPDATE admin_users au
SET linked_user_id = u.id
FROM users u
WHERE au.linked_user_id IS NULL
  AND LOWER(u.email) = LOWER(au.username || '@lime.mn');
