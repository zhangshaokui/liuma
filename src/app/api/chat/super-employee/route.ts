import { NextRequest, NextResponse } from "next/server";
import { getSession } from "lib/auth/server";
import { chatRepository, agentRepository } from "lib/db/repository";
import { randomUUID } from "node:crypto";
import { generateText } from "ai";
import { customModelProvider } from "lib/ai/models";
import { SUPER_EMPLOYEE_MODULES } from "@/lib/super-employee-modules";
import { buildUserSystemPrompt } from "lib/ai/prompts";
import { getUserPreferences } from "lib/user/server";
import globalLogger from "logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Super Employee Chat API: `),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { message, employeeId, chatModel, isCustom } = json as {
      message: string;
      employeeId: string;
      chatModel?: {
        provider: string;
        model: string;
      };
      isCustom?: boolean;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" });
    }

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取员工模块配置
    let moduleConfig;
    if (isCustom) {
      // 自定义员工：从数据库获取
      const agent = await agentRepository.selectAgentById(employeeId, session.user.id);
      if (!agent || agent.userId !== session.user.id) {
        return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });
      }
      moduleConfig = {
        name: agent.name,
        role: agent.instructions?.role || '',
        systemPrompt: agent.instructions?.systemPrompt || '',
      };
    } else {
      // 默认员工：从SUPER_EMPLOYEE_MODULES获取
      moduleConfig = SUPER_EMPLOYEE_MODULES[employeeId as keyof typeof SUPER_EMPLOYEE_MODULES];
      if (!moduleConfig) {
        return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });
      }
    }

    // 调用chatRepository创建thread和消息
    const threadId = randomUUID();
    const thread = await chatRepository.insertThread({
      id: threadId,
      title: `${moduleConfig.name}AI员工对话`,
      userId: session.user.id,
    });

    await chatRepository.insertMessage({
      id: randomUUID(),
      threadId: thread.id,
      role: 'user',
      parts: [{ type: 'text', text: message }],
    });

    // 获取用户偏好设置
    const userPreferences = (await getUserPreferences(session.user.id)) || undefined;

    // 确定使用的模型：优先使用GLM，如果没有则使用传入的chatModel或默认模型
    let modelToUse = chatModel;
    if (!modelToUse) {
      // 尝试获取GLM模型
      const glmProvider = customModelProvider.modelsInfo.find((p) => p.provider === "GLM");
      if (glmProvider && glmProvider.models.length > 0) {
        const flashModel = glmProvider.models.find((m) => m.name === "glm-4-flash");
        modelToUse = {
          provider: "GLM",
          model: flashModel ? "glm-4-flash" : glmProvider.models[0].name,
        };
      } else {
        // 如果没有GLM，使用第一个可用模型
        const firstProvider = customModelProvider.modelsInfo[0];
        if (firstProvider && firstProvider.models.length > 0) {
          modelToUse = {
            provider: firstProvider.provider,
            model: firstProvider.models[0].name,
          };
        }
      }
    }

    if (!modelToUse) {
      return NextResponse.json({ error: "No available model" }, { status: 500 });
    }

    logger.info(`Using model: ${modelToUse.provider}/${modelToUse.model} for employee: ${employeeId}`);

    // 获取模型实例
    const model = customModelProvider.getModel(modelToUse);

    // 构建系统提示词：合并用户系统提示词和员工特定的系统提示词
    const baseSystemPrompt = buildUserSystemPrompt(session.user, userPreferences);
    const employeeSystemPrompt = moduleConfig.systemPrompt;
    const systemPrompt = `${baseSystemPrompt}\n\n${employeeSystemPrompt}`.trim();

    // 调用GLM API生成回复
    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const responseText = result.text || '抱歉，我暂时无法回复。';

    // 保存AI回复到数据库
    await chatRepository.insertMessage({
      id: randomUUID(),
      threadId: thread.id,
      role: 'assistant',
      parts: [{ type: 'text', text: responseText }],
    });

    return NextResponse.json({
      threadId: thread.id,
      messageId: randomUUID(),
      content: responseText,
    });
  } catch (error: any) {
    logger.error('Super employee chat error:', error);
    console.error('Super employee chat error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
