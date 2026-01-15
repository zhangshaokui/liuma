import { getSession } from "auth/server";
import { agentGroupRepository } from "lib/db/repository";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return Response.json(
        { error: "agentId is required" },
        { status: 400 },
      );
    }

    // Get "我的AI员工" group
    const group = await agentGroupRepository.getGroupByName(
      session.user.id,
      "我的AI员工",
    );

    let isEmployee = false;
    if (group) {
      isEmployee = await agentGroupRepository.isAgentInGroup(group.id, agentId);
    }

    return Response.json({ isEmployee });
  } catch (error) {
    console.error("Error checking employee:", error);
    return Response.json(
      { error: "Failed to check employee" },
      { status: 500 },
    );
  }
}
