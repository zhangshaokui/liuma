import { NextRequest, NextResponse } from "next/server";
import { getSession } from "lib/auth/server";
import { departmentRepository } from "lib/db/repository";
import { z } from "zod";

const DepartmentSchema = z.object({
  name: z.string().min(1).max(10),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const departments = await departmentRepository.selectDepartmentsByUserId(
      session.user.id,
    );
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = DepartmentSchema.parse(body);

    // 检查部门数量限制（最多20个）
    const existingDepartments =
      await departmentRepository.selectDepartmentsByUserId(session.user.id);
    if (existingDepartments.length >= 20) {
      return NextResponse.json(
        { error: "最多只能创建20个部门" },
        { status: 400 },
      );
    }

    const department = await departmentRepository.insertDepartment({
      name: name.trim(),
      userId: session.user.id,
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Failed to create department:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name } = DepartmentSchema.parse(body);

    const department = await departmentRepository.updateDepartment(
      id,
      session.user.id,
      { name: name.trim() },
    );

    return NextResponse.json(department);
  } catch (error) {
    console.error("Failed to update department:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 },
      );
    }

    await departmentRepository.deleteDepartment(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete department:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

