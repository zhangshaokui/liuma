-- Rename "待分配部门" to "默认部门"
UPDATE "department"
SET name = '默认部门'
WHERE name = '待分配部门';

-- Update agent_group department_id references if needed
UPDATE "agent_group"
SET department_id = (
  SELECT d.id FROM "department" d
  WHERE d.user_id = "agent_group".user_id AND d.name = '默认部门'
  LIMIT 1
)
WHERE "agent_group".name = '未分组'
AND EXISTS (
  SELECT 1 FROM "department" d
  WHERE d.user_id = "agent_group".user_id AND d.name = '默认部门'
);
