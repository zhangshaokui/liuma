import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-instance";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { AgentTable, AgentCategoryTable, UserTable } from "@/lib/db/pg/schema.pg";
import { eq, like, or, desc, and } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category"); // "全部" or category ID or null

  try {
    // 构建所有条件
    const conditions: SQL[] = [];

    // 只查询模板
    conditions.push(eq(AgentTable.isTemplate, true));

    // 搜索条件
    if (search) {
      conditions.push(
        or(
          like(AgentTable.name, `%${search}%`),
          like(AgentTable.description, `%${search}%`)
        )!
      );
    }

    // 分类过滤
    if (category && category !== "全部") {
      conditions.push(eq(AgentTable.categoryId, category));
    }

    const templates = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        coverEmoji: AgentTable.coverEmoji,
        copyCount: AgentTable.copyCount,
        categoryId: AgentTable.categoryId,
        categoryName: AgentCategoryTable.name,
        categoryEmoji: AgentCategoryTable.emoji,
        userId: AgentTable.userId,
        userName: UserTable.name,
        createdAt: AgentTable.createdAt,
      })
      .from(AgentTable)
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .leftJoin(AgentCategoryTable, eq(AgentTable.categoryId, AgentCategoryTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(AgentTable.copyCount))
      .limit(100);

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
