import { NextRequest, NextResponse } from "next/server";
import { getSession } from "lib/auth/server";
import { groupRepository } from "lib/db/repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    // getAgentsByGroupId现在返回合并后的默认AI员工和自定义智能体
    const agents = await groupRepository.getAgentsByGroupId(
      id,
      session.user.id,
    );
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Failed to fetch group agents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

