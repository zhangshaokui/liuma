import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { AgentsManagedList } from "@/components/agent/agents-managed-list";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return (
    <AgentsManagedList userId={session.user.id} userRole={session.user.role} />
  );
}
