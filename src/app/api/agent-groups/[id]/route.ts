import { getSession } from "auth/server";
import { agentGroupRepository } from "lib/db/repository";

// DELETE - 删除组
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
    await agentGroupRepository.deleteGroup(params.id, session.user.id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return Response.json(
      { error: "Failed to delete group" },
      { status: 500 },
    );
  }
}
