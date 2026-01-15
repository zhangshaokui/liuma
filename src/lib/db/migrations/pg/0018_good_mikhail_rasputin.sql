-- Remove template fields from other tables (keep only agent table)

ALTER TABLE "account" DROP COLUMN IF EXISTS "is_template";
ALTER TABLE "account" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "account" DROP COLUMN IF EXISTS "copy_count";
ALTER TABLE "account" DROP COLUMN IF EXISTS "cover_emoji";

ALTER TABLE "archive" DROP COLUMN IF EXISTS "is_template";
ALTER TABLE "archive" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "archive" DROP COLUMN IF EXISTS "copy_count";
ALTER TABLE "archive" DROP COLUMN IF EXISTS "cover_emoji";

ALTER TABLE "chat_export_comment" DROP COLUMN IF EXISTS "is_template";
ALTER TABLE "chat_export_comment" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "chat_export_comment" DROP COLUMN IF EXISTS "copy_count";
ALTER TABLE "chat_export_comment" DROP COLUMN IF EXISTS "cover_emoji";

ALTER TABLE "mcp_server" DROP COLUMN IF EXISTS "is_template";
ALTER TABLE "mcp_server" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "mcp_server" DROP COLUMN IF EXISTS "copy_count";
ALTER TABLE "mcp_server" DROP COLUMN IF EXISTS "cover_emoji";

ALTER TABLE "session" DROP COLUMN IF EXISTS "is_template";
ALTER TABLE "session" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "session" DROP COLUMN IF EXISTS "copy_count";
ALTER TABLE "session" DROP COLUMN IF EXISTS "cover_emoji";

ALTER TABLE "user" DROP COLUMN IF EXISTS "is_template";
ALTER TABLE "user" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "user" DROP COLUMN IF EXISTS "copy_count";
ALTER TABLE "user" DROP COLUMN IF EXISTS "cover_emoji";

ALTER TABLE "workflow" DROP COLUMN IF EXISTS "is_template";
ALTER TABLE "workflow" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "workflow" DROP COLUMN IF EXISTS "copy_count";
ALTER TABLE "workflow" DROP COLUMN IF EXISTS "cover_emoji";
