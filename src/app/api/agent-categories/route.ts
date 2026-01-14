import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-instance";
import { agentCategoryRepository } from "@/lib/db/repository";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await agentCategoryRepository.getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, emoji, sortOrder = 0 } = body;

    if (!name || !emoji) {
      return NextResponse.json(
        { error: "Name and emoji are required" },
        { status: 400 }
      );
    }

    const category = await agentCategoryRepository.createCategory(
      name,
      emoji,
      sortOrder
    );

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
