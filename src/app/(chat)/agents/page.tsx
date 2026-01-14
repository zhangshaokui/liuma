import { agentRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { AgentsList } from "@/components/agent/agents-list";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  // Fetch only my agents
  const myAgents = await agentRepository.selectAgents(
    session.user.id,
    ["mine"],
    50,
  );

  return (
    <AgentsList
      initialMyAgents={myAgents}
      userId={session.user.id}
      userRole={session.user.role}
    />
  );
}
