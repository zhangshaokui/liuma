import { agentGroupRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { z } from "zod";
import { serverCache } from "lib/cache";
import { CacheKeys } from "lib/cache/cache-keys";

// Schema for agent group operations
export const AgentGroupCreateSchema = z.object({
  name: z.string().min(1).max(100),
  departmentId: z.string().uuid().nullable().optional(),
  color: z.string().optional().default("#94a3b8"),
  icon: z.string().optional().default("📁"),
  sortOrder: z.number().optional().default(0),
  type: z.enum(["system", "custom"]).optional().default("custom"),
});

export const AgentGroupUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

// GET /api/agent-groups - 获取小组列表
export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const departmentId = url.searchParams.get("departmentId");

    let groups;

    if (departmentId) {
      // 获取特定部门下的小组
      groups = await agentGroupRepository.getGroupsByDepartment(departmentId);
    } else {
      // 获取用户所有小组
      groups = await agentGroupRepository.getUserGroups(session.user.id);
    }

    return Response.json(groups);
  } catch (error) {
    console.error("Failed to fetch agent groups:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// POST /api/agent-groups - 创建小组
export async function POST(request: Request): Promise<Response> {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const data = AgentGroupCreateSchema.parse(body);

    const group = await agentGroupRepository.createGroup(session.user.id, data);

    // Clear cache
    serverCache.delete(CacheKeys.userDepartments(session.user.id));

    return Response.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Failed to create agent group:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// PUT /api/agent-groups - 更新小组
export async function PUT(request: Request): Promise<Response> {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const data = AgentGroupUpdateSchema.parse(updateData);

    if (!id) {
      return Response.json(
        { error: "Agent group ID is required" },
        { status: 400 },
      );
    }

    const group = await agentGroupRepository.updateGroup(
      id,
      session.user.id,
      data,
    );

    // Clear cache
    serverCache.delete(CacheKeys.userDepartments(session.user.id));

    return Response.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Failed to update agent group:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/agent-groups - 删除小组
export async function DELETE(request: Request): Promise<Response> {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get("id");

    if (!groupId) {
      return Response.json(
        { error: "Agent group ID is required" },
        { status: 400 },
      );
    }

    // 检查小组是否存在
    const group = await agentGroupRepository.getGroupById(groupId);
    if (!group) {
      return Response.json({ error: "小组不存在" }, { status: 404 });
    }

    // 检查是否为系统组
    if (group.type === "system") {
      return Response.json({ error: "系统组不能删除" }, { status: 400 });
    }

    // 检查是否为未分组小组
    if (group.name === "未分组") {
      return Response.json({ error: "未分组小组不能删除" }, { status: 400 });
    }

    // 检查权限
    if (group.userId !== session.user.id) {
      return Response.json({ error: "无权限删除此小组" }, { status: 403 });
    }

    await agentGroupRepository.deleteGroup(groupId, session.user.id);

    // Clear cache
    serverCache.delete(CacheKeys.userDepartments(session.user.id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete agent group:", error);
    // 如果是已知的业务错误，返回具体的错误信息
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
