import { getSession } from "auth/server";
import { agentGroupRepository } from "lib/db/repository";

// POST - Update last_used_at timestamp (when agent is used in chat)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; agentId: string }> },
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    await agentGroupRepository.updateLastUsed(params.id, params.agentId);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating last used:", error);
    return Response.json(
      { error: "Failed to update last used" },
      { status: 500 },
    );
  }
}
