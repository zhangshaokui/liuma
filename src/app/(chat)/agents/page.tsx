import { AgentsManagedList } from "@/components/agent/agents-managed-list";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

interface AgentsPageProps {
  searchParams: Promise<{
    dept?: string;
    group?: string;
    action?: string;
  }>;
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const session = await getSession();
  const params = await searchParams;

  if (!session?.user.id) {
    notFound();
  }

  return (
    <AgentsManagedList
      userId={session.user.id}
      userRole={session.user.role}
      initialDeptId={params.dept}
      initialGroupId={params.group}
      action={params.action}
    />
  );
}
