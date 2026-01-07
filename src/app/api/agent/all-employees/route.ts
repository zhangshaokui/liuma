import { NextRequest, NextResponse } from "next/server";
import { getSession } from "lib/auth/server";
import { agentRepository } from "lib/db/repository";
import { SUPER_EMPLOYEE_MODULES } from "@/lib/super-employee-modules";

// 自定义AI员工的特殊标记
const SUPER_EMPLOYEE_CUSTOM_MARKER = "__SUPER_EMPLOYEE_CUSTOM__";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 获取默认的7个AI员工
    const defaultEmployees = Object.entries(SUPER_EMPLOYEE_MODULES).map(
      ([id, module]) => ({
        id,
        name: module.name,
        description: module.role,
        icon: null,
        isDefault: true,
      }),
    );

    // 获取自定义AI员工
    const agents = await agentRepository.selectAgentsByUserId(session.user.id);
    const customEmployees = agents
      .filter((agent) => agent.description?.includes(SUPER_EMPLOYEE_CUSTOM_MARKER))
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description?.replace(SUPER_EMPLOYEE_CUSTOM_MARKER, "").trim() || "",
        icon: agent.icon,
        isDefault: false,
      }));

    // 合并所有AI员工
    const allEmployees = [...defaultEmployees, ...customEmployees];

    return NextResponse.json(allEmployees);
  } catch (error) {
    console.error("Failed to fetch all employees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


