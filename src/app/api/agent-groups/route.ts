import { getSession } from "auth/server";
import { agentGroupRepository } from "lib/db/repository";
import { z } from "zod";

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["system", "custom"]).optional().default("custom"),
});

// GET - 获取用户的组列表
export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const groups = await agentGroupRepository.getUserGroups(session.user.id);
    return Response.json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return Response.json(
      { error: "Failed to fetch groups" },
      { status: 500 },
    );
  }
}

// POST - 创建组
export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type } = CreateGroupSchema.parse(body);

    // 检查是否已存在同名组
    const existing = await agentGroupRepository.getGroupByName(
      session.user.id,
      name,
    );

    if (existing) {
      return Response.json(
        { error: "Group with this name already exists" },
        { status: 400 },
      );
    }

    const group = await agentGroupRepository.createGroup(
      session.user.id,
      name,
      type,
    );

    return Response.json({ group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }

    console.error("Error creating group:", error);
    return Response.json(
      { error: "Failed to create group" },
      { status: 500 },
    );
  }
}
