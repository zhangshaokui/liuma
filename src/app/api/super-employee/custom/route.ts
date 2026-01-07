import { NextRequest, NextResponse } from "next/server";
import { getSession } from "lib/auth/server";
import { agentRepository } from "lib/db/repository";
import { z } from "zod";

// 自定义AI员工的特殊标记：在description中添加这个标记
const SUPER_EMPLOYEE_CUSTOM_MARKER = "__SUPER_EMPLOYEE_CUSTOM__";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 获取当前用户的所有agents
    const agents = await agentRepository.selectAgentsByUserId(session.user.id);
    
    // 过滤出自定义的super-employee agents（通过description中的标记识别）
    const customEmployees = agents
      .filter(agent => agent.description?.includes(SUPER_EMPLOYEE_CUSTOM_MARKER))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description?.replace(SUPER_EMPLOYEE_CUSTOM_MARKER, '').trim() || '',
        icon: agent.icon,
        instructions: agent.instructions,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }));

    return NextResponse.json(customEmployees);
  } catch (error) {
    console.error('Failed to fetch custom employees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, systemPrompt } = body as {
      name: string;
      description: string;
      systemPrompt: string;
    };

    // 验证输入
    if (!name || name.trim().length === 0 || name.length > 14) {
      return NextResponse.json({ error: "名称不能为空且不能超过14个字符" }, { status: 400 });
    }
    if (!description || description.trim().length === 0 || description.length > 14) {
      return NextResponse.json({ error: "描述不能为空且不能超过14个字符" }, { status: 400 });
    }
    if (!systemPrompt || systemPrompt.trim().length === 0) {
      return NextResponse.json({ error: "提示词不能为空" }, { status: 400 });
    }

    // 检查是否已达到最大数量（5个）
    const existingAgents = await agentRepository.selectAgentsByUserId(session.user.id);
    const customCount = existingAgents.filter(agent => 
      agent.description?.includes(SUPER_EMPLOYEE_CUSTOM_MARKER)
    ).length;
    
    if (customCount >= 5) {
      return NextResponse.json({ error: "最多只能添加5个自定义AI员工" }, { status: 400 });
    }

    // 创建agent，在description中添加标记
    const agent = await agentRepository.insertAgent({
      name: name.trim(),
      description: `${description.trim()}${SUPER_EMPLOYEE_CUSTOM_MARKER}`,
      userId: session.user.id,
      instructions: {
        role: description.trim(),
        systemPrompt: systemPrompt.trim(),
      },
      icon: {
        type: "emoji",
        value: "🤖",
      },
      visibility: "private",
    });

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      description: description.trim(),
      icon: agent.icon,
      instructions: agent.instructions,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.message }, { status: 400 });
    }
    console.error('Failed to create custom employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, description, systemPrompt } = body as {
      id: string;
      name?: string;
      description?: string;
      systemPrompt?: string;
    };

    // 验证权限
    const existingAgent = await agentRepository.selectAgentById(id, session.user.id);
    if (!existingAgent || existingAgent.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!existingAgent.description?.includes(SUPER_EMPLOYEE_CUSTOM_MARKER)) {
      return NextResponse.json({ error: "Not a custom employee" }, { status: 400 });
    }

    // 构建更新数据
    const updateData: any = {};
    if (name !== undefined) {
      if (name.trim().length === 0 || name.length > 14) {
        return NextResponse.json({ error: "名称不能为空且不能超过14个字符" }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      if (description.trim().length === 0 || description.length > 14) {
        return NextResponse.json({ error: "描述不能为空且不能超过14个字符" }, { status: 400 });
      }
      updateData.description = `${description.trim()}${SUPER_EMPLOYEE_CUSTOM_MARKER}`;
    }
    if (systemPrompt !== undefined) {
      if (systemPrompt.trim().length === 0) {
        return NextResponse.json({ error: "提示词不能为空" }, { status: 400 });
      }
      updateData.instructions = {
        ...existingAgent.instructions,
        systemPrompt: systemPrompt.trim(),
        role: description !== undefined ? description.trim() : existingAgent.instructions?.role,
      };
    }

    const updatedAgent = await agentRepository.updateAgent(id, session.user.id, updateData);

    return NextResponse.json({
      id: updatedAgent.id,
      name: updatedAgent.name,
      description: updatedAgent.description?.replace(SUPER_EMPLOYEE_CUSTOM_MARKER, '').trim() || '',
      icon: updatedAgent.icon,
      instructions: updatedAgent.instructions,
      createdAt: updatedAgent.createdAt,
      updatedAt: updatedAgent.updatedAt,
    });
  } catch (error) {
    console.error('Failed to update custom employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // 验证权限
    const existingAgent = await agentRepository.selectAgentById(id, session.user.id);
    if (!existingAgent || existingAgent.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!existingAgent.description?.includes(SUPER_EMPLOYEE_CUSTOM_MARKER)) {
      return NextResponse.json({ error: "Not a custom employee" }, { status: 400 });
    }

    await agentRepository.deleteAgent(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete custom employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

