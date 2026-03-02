import { getSession } from "auth/server";
import { agentGroupRepository } from "lib/db/repository";
import { z } from "zod";

const AddMemberSchema = z.object({
  agentId: z.string().min(1),
});

// GET - 获取组成员（智能体列表）
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const agents = await agentGroupRepository.getGroupAgents(params.id);
    return Response.json({ agents });
  } catch (error) {
    console.error("Error fetching group members:", error);
    return Response.json(
      { error: "Failed to fetch group members" },
      { status: 500 },
    );
  }
}

// POST - 添加成员到组
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const body = await request.json();
    const { agentId } = AddMemberSchema.parse(body);

    await agentGroupRepository.addMember(params.id, agentId);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }

    console.error("Error adding member:", error);
    return Response.json(
      { error: "Failed to add member" },
      { status: 500 },
    );
  }
}

// DELETE - 从组中移除成员
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const body = await request.json();
    const { agentId } = AddMemberSchema.parse(body);

    await agentGroupRepository.removeMember(params.id, agentId);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }

    console.error("Error removing member:", error);
    return Response.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }
}
