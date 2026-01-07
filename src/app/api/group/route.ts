import { NextRequest, NextResponse } from "next/server";
import { getSession } from "lib/auth/server";
import { groupRepository, departmentRepository } from "lib/db/repository";
import { z } from "zod";

const GroupSchema = z.object({
  name: z.string().min(1).max(10),
  departmentId: z.string().uuid(),
});

const UpdateGroupAgentsSchema = z.object({
  agentIds: z.array(z.string()), // 允许非UUID字符串（默认AI员工）
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    if (departmentId) {
      const groups = await groupRepository.selectGroupsByDepartmentId(
        departmentId,
        session.user.id,
      );
      return NextResponse.json(groups);
    } else {
      const groups = await groupRepository.selectGroupsByUserId(
        session.user.id,
      );
      return NextResponse.json(groups);
    }
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, departmentId } = GroupSchema.parse(body);

    // 验证部门是否存在且属于当前用户
    const department = await departmentRepository.selectDepartmentById(
      departmentId,
      session.user.id,
    );
    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    // 检查该部门下的小组数量限制（最多8个）
    const existingGroups =
      await groupRepository.selectGroupsByDepartmentId(
        departmentId,
        session.user.id,
      );
    if (existingGroups.length >= 8) {
      return NextResponse.json(
        { error: "每个部门最多只能创建8个小组" },
        { status: 400 },
      );
    }

    const group = await groupRepository.insertGroup({
      name: name.trim(),
      departmentId,
      userId: session.user.id,
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to create group:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // 如果是更新小组名称
    if (body.name !== undefined) {
      const { name } = z.object({ name: z.string().min(1).max(10) }).parse({
        name: body.name,
      });

      const group = await groupRepository.updateGroup(id, session.user.id, {
        name: name.trim(),
      });

      return NextResponse.json(group);
    }

    // 如果是更新小组的AI员工
    if (body.agentIds !== undefined) {
      const { agentIds } = UpdateGroupAgentsSchema.parse(body);

      // 验证agentIds：检查默认AI员工ID是否有效
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const defaultEmployeeIds = agentIds.filter((agentId) => !uuidRegex.test(agentId));
      
      // 验证默认AI员工ID是否在SUPER_EMPLOYEE_MODULES中存在
      const { SUPER_EMPLOYEE_MODULES } = await import("@/lib/super-employee-modules");
      const invalidDefaultIds = defaultEmployeeIds.filter(
        (id) => !(id in SUPER_EMPLOYEE_MODULES),
      );
      
      if (invalidDefaultIds.length > 0) {
        return NextResponse.json(
          { error: `无效的AI员工ID: ${invalidDefaultIds.join(", ")}` },
          { status: 400 },
        );
      }

      // 所有agentIds都可以使用（默认AI员工和自定义智能体）
      await groupRepository.updateGroupAgents(id, agentIds, session.user.id);

      const groupWithAgents = await groupRepository.selectGroupWithAgents(
        id,
        session.user.id,
      );

      return NextResponse.json(groupWithAgents);
    }

    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Failed to update group:", error);
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map((issue) => issue.message).join(", ");
      return NextResponse.json({ error: errorMessage || "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 },
      );
    }

    await groupRepository.deleteGroup(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

