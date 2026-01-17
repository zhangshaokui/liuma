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

  return (
    <AgentsList
      userId={session.user.id}
      userRole={session.user.role}
    />
  );
}
