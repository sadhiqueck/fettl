BEGIN;
CREATE TABLE upload_access (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  "ownerId" TEXT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "groupId" TEXT REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX upload_access_key_idx ON upload_access(key);
-- Preserve access to previously attached files. Unattached legacy keys stay private.
WITH files AS (
  SELECT "groupId", "receiptUrl" AS url FROM expenses WHERE NOT "isDeleted"
  UNION SELECT "groupId", "imageUrl" FROM chat_messages WHERE NOT "isDeleted"
  UNION SELECT id, "coverImage" FROM groups
), grants AS (
  SELECT DISTINCT "groupId", substring(url from '/uploads/([^/?#]+)$') AS key FROM files
)
INSERT INTO upload_access (id, key, "groupId")
SELECT gen_random_uuid()::text, key, "groupId" FROM grants WHERE key IS NOT NULL;
INSERT INTO upload_access (id, key, "ownerId")
SELECT gen_random_uuid()::text, substring("avatarUrl" from '/uploads/([^/?#]+)$'), id FROM users
WHERE "avatarUrl" ~ '/uploads/[^/?#]+$';
COMMIT;
