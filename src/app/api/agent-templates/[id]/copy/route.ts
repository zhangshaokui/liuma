import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-instance";
import { agentRepository } from "@/lib/db/repository";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { AgentTable } from "@/lib/db/pg/schema.pg";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    const templateId = params.id;
    const userId = session.user.id;

    // 获取模板
    const [template] = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        instructions: AgentTable.instructions,
        isTemplate: AgentTable.isTemplate,
      })
      .from(AgentTable)
      .where(eq(AgentTable.id, templateId))
      .limit(1);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (!template.isTemplate) {
      return NextResponse.json({ error: "Not a template" }, { status: 400 });
    }

    // 创建新的 Agent（复制）
    // Note: 复制的模板不是模板，而是一个普通 Agent
    const newAgent = await agentRepository.insertAgent({
      name: template.name,
      description: template.description || "",
      instructions: template.instructions || {},
      icon: template.icon ?? undefined,
      userId: userId,
      visibility: "private",
      isTemplate: false,
      categoryId: null,
    });

    // 增加模板的复制计数
    await db
      .update(AgentTable)
      .set({ copyCount: sql`copy_count + 1` })
      .where(eq(AgentTable.id, templateId));

    return NextResponse.json({
      id: newAgent.id,
      name: newAgent.name,
    });
  } catch (error) {
    console.error("Error copying template:", error);
    return NextResponse.json(
      { error: "Failed to copy template" },
      { status: 500 }
    );
  }
}
