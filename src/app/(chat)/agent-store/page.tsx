import { agentCategoryRepository } from "@/lib/db/repository";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { AgentStoreClient } from "./components/agent-store-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AgentStorePage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  // 获取分类列表
  const categories = await agentCategoryRepository.getAllCategories();

  return (
    <AgentStoreClient
      userId={session.user.id}
      userRole={session.user.role}
      initialCategories={categories}
    />
  );
}
