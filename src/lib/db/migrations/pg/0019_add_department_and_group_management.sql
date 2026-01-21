-- Add department and agent group management for AI employees

-- Create department table
CREATE TABLE IF NOT EXISTS "department" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT '🏢',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Create indexes for department table
CREATE INDEX IF NOT EXISTS "department_user_id_idx" ON "department"(user_id);
CREATE INDEX IF NOT EXISTS "department_sort_order_idx" ON "department"(sort_order);

-- Add new columns to agent_group table
ALTER TABLE "agent_group" ADD COLUMN IF NOT EXISTS "department_id" UUID REFERENCES "department"(id) ON DELETE SET NULL;
ALTER TABLE "agent_group" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#94a3b8';
ALTER TABLE "agent_group" ADD COLUMN IF NOT EXISTS "icon" TEXT NOT NULL DEFAULT '📁';
ALTER TABLE "agent_group" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "agent_group" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for agent_group.department_id
CREATE INDEX IF NOT EXISTS "agent_group_department_id_idx" ON "agent_group"(department_id);

-- Add group_id column to agent table
ALTER TABLE "agent" ADD COLUMN IF NOT EXISTS "group_id" UUID REFERENCES "agent_group"(id) ON DELETE SET NULL;

-- Create index for agent.group_id
CREATE INDEX IF NOT EXISTS "agent_group_id_idx" ON "agent"(group_id);

-- Initialize default department for all users
INSERT INTO "department" (user_id, name, color, icon, sort_order)
SELECT id, '默认部门', '#94a3b8', '📋', 999
FROM "user"
WHERE NOT EXISTS (
  SELECT 1 FROM "department"
  WHERE "department".user_id = "user".id AND "department".name = '默认部门'
);

-- Initialize default group for all users
INSERT INTO "agent_group" (user_id, department_id, name, color, icon, sort_order, type)
SELECT
  u.id,
  (SELECT id FROM "department" WHERE "department".user_id = u.id AND "department".name = '默认部门' LIMIT 1),
  '未分组',
  '#cbd5e1',
  '📁',
  999,
  'system'
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM "agent_group"
  WHERE "agent_group".user_id = u.id AND "agent_group".name = '未分组'
);
