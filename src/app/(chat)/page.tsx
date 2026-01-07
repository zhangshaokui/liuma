import ChatBot from "@/components/chat-bot";
import { generateUUID } from "lib/utils";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { SUPER_EMPLOYEE_MODULES } from "@/lib/super-employee-modules";

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { module?: string; se_new?: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  // Handle Super Employee module
  let agent: any = undefined;
  let isNewSE = false;
  
  if (searchParams.module && searchParams.module in SUPER_EMPLOYEE_MODULES) {
    const moduleConfig = SUPER_EMPLOYEE_MODULES[searchParams.module as keyof typeof SUPER_EMPLOYEE_MODULES];
    agent = {
      id: searchParams.module,
      name: moduleConfig.name,
      description: "Super Employee - " + moduleConfig.name,
      icon: {
        type: "emoji",
        value: "🤖",
      },
      userId: "super-employee",
      visibility: "public",
      instructions: {
        role: moduleConfig.role,
        systemPrompt: moduleConfig.systemPrompt,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    isNewSE = searchParams.se_new === "true";
  }

  const id = generateUUID();
  return <ChatBot initialMessages={[]} threadId={id} key={id} agent={agent} isNewSE={isNewSE} moduleId={searchParams.module} />;
}
