import { getSession } from "auth/server";
import { employeeRepository, agentGroupRepository } from "lib/db/repository";
import { z } from "zod";

const EmployeeSchema = z.object({
  agentId: z.string().min(1),
});

// GET - List user's employees (backward compatibility)
export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use group-based approach to get employees
    const group = await agentGroupRepository.getGroupByName(
      session.user.id,
      "我的AI员工",
    );

    if (!group) {
      return Response.json({ employees: [] });
    }

    const employees = await agentGroupRepository.getGroupAgents(group.id);
    return Response.json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return Response.json(
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}

// POST - Add an agent as employee (dual write)
export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId } = EmployeeSchema.parse(body);

    // Check access
    const hasAccess = await employeeRepository.checkAgentAccess(
      agentId,
      session.user.id,
    );

    if (!hasAccess) {
      return Response.json(
        { error: "Agent not found or access denied" },
        { status: 404 },
      );
    }

    // Get or create "我的AI员工" group
    let group = await agentGroupRepository.getGroupByName(
      session.user.id,
      "我的AI员工",
    );

    if (!group) {
      group = await agentGroupRepository.createGroup(
        session.user.id,
        "我的AI员工",
        "system",
      );
    }

    // Add to group (new approach)
    await agentGroupRepository.addMember(group.id, agentId);

    // Also add to user_employees for backward compatibility (dual write)
    await employeeRepository.addEmployee(session.user.id, agentId);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }

    console.error("Error adding employee:", error);
    return Response.json(
      { error: "Failed to add employee" },
      { status: 500 },
    );
  }
}

// DELETE - Remove an employee (dual write)
export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId } = EmployeeSchema.parse(body);

    // Get "我的AI员工" group
    const group = await agentGroupRepository.getGroupByName(
      session.user.id,
      "我的AI员工",
    );

    if (group) {
      // Remove from group
      await agentGroupRepository.removeMember(group.id, agentId);
    }

    // Also remove from user_employees for backward compatibility (dual write)
    await employeeRepository.removeEmployee(session.user.id, agentId);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }

    console.error("Error removing employee:", error);
    return Response.json(
      { error: "Failed to remove employee" },
      { status: 500 },
    );
  }
}
