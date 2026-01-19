import { departmentRepository, agentGroupRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { z } from "zod";
import { serverCache } from "lib/cache";
import { CacheKeys } from "lib/cache/cache-keys";

// Schema for department operations
export const DepartmentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().optional().default("#3b82f6"),
  icon: z.string().optional().default("🏢"),
  sortOrder: z.number().optional().default(0),
});

export const DepartmentUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

// GET /api/department - 获取用户部门列表（含小组数量）
export async function GET(_request: Request) {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const departments = await departmentRepository.findWithGroups(
      session.user.id,
    );

    return Response.json(departments);
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// POST /api/department - 创建部门
export async function POST(request: Request): Promise<Response> {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const data = DepartmentCreateSchema.parse(body);

    const department = await departmentRepository.create(session.user.id, data);

    // 自动创建一个默认组
    await agentGroupRepository.create(session.user.id, {
      departmentId: department.id,
      name: "默认组",
      color: "#94a3b8",
      icon: "📁",
      type: "system",
    });

    // Clear cache
    serverCache.delete(CacheKeys.userDepartments(session.user.id));

    return Response.json(department);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Failed to create department:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// PUT /api/department - 更新部门
export async function PUT(request: Request): Promise<Response> {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const data = DepartmentUpdateSchema.parse(updateData);

    if (!id) {
      return Response.json(
        { error: "Department ID is required" },
        { status: 400 },
      );
    }

    const department = await departmentRepository.update(
      id,
      session.user.id,
      data,
    );

    // Clear cache
    serverCache.delete(CacheKeys.userDepartments(session.user.id));

    return Response.json(department);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Failed to update department:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/department - 删除部门
export async function DELETE(request: Request): Promise<Response> {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const departmentId = url.searchParams.get("id");

    if (!departmentId) {
      return Response.json(
        { error: "Department ID is required" },
        { status: 400 },
      );
    }

    await departmentRepository.delete(departmentId, session.user.id);

    // Clear cache
    serverCache.delete(CacheKeys.userDepartments(session.user.id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete department:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
