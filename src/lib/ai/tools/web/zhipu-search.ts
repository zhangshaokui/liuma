import { tool as createTool } from "ai";
import { JSONSchema7 } from "json-schema";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";
import { safe } from "ts-safe";

// 智谱搜索 API Types
export interface ZhipuSearchRequest {
  description: string;
  queries: string[];
  recency_days?: number;
}

export interface ZhipuSearchResult {
  title: string;
  link: string;
  content: string;
}

export interface ZhipuSearchResponse {
  results: ZhipuSearchResult[];
}

// 统一的搜索结果格式（兼容Exa）
export interface UnifiedSearchResult {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text: string;
  score?: number;
}

export const zhipuSearchSchema: JSONSchema7 = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description: "Description of what you're searching for and why",
    },
    queries: {
      type: "array",
      items: { type: "string" },
      description: "List of search query strings",
      minItems: 1,
    },
    recency_days: {
      type: "number",
      description:
        "How recent the search results should be (0 = no time limit, 7 = last 7 days, etc.)",
      default: 0,
    },
  },
  required: ["description", "queries"],
};

const API_KEY = process.env.ZHIPU_API_KEY;
const BASE_URL = "https://open.bigmodel.cn/api/paas/v4/tools";

const fetchZhipu = async (
  toolCallId: string,
  request: ZhipuSearchRequest,
): Promise<any> => {
  if (!API_KEY) {
    throw new Error("ZHIPU_API_KEY is not configured");
  }

  // 智谱API使用特定的web_browser工具调用格式
  const payload = {
    model: "glm-4",
    stream: false,
    tool_calls: [
      {
        type: "web_browser",
        web_browser: {
          input: `msearch(description="${request.description}", queries=${JSON.stringify(request.queries)}, recency_days=${request.recency_days || 0})`,
        },
      },
    ],
  };

  const response = await fetch(`${BASE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("Invalid Zhipu API key");
  }
  if (response.status === 429) {
    throw new Error("Zhipu API usage limit exceeded");
  }

  if (!response.ok) {
    throw new Error(`Zhipu API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // 从智格API响应中提取搜索结果
  // 智谱返回格式: { choices: [{ delta: { tool_calls: [{ web_browser: { outputs: [...] } }] } }] }
  const outputs =
    data.choices?.[0]?.delta?.tool_calls?.[0]?.web_browser?.outputs;

  if (!outputs || !Array.isArray(outputs)) {
    throw new Error("Invalid response format from Zhipu API");
  }

  return {
    requestId: toolCallId,
    results: outputs.map((item: ZhipuSearchResult, index: number) => ({
      id: `zhipu-${index}-${Date.now()}`,
      title: item.title,
      url: item.link,
      text: item.content,
    })),
  };
};

export const zhipuSearchToolForWorkflow = createTool({
  description:
    "Search the web using Zhipu AI - performs real-time web searches with intelligent query understanding. Returns relevant results with content extraction.",
  inputSchema: jsonSchemaToZod(zhipuSearchSchema),
  execute: async (params) => {
    const searchRequest: ZhipuSearchRequest = {
      description: params.description,
      queries: params.queries,
      recency_days: params.recency_days ?? 0,
    };

    return fetchZhipu(`workflow-${Date.now()}`, searchRequest);
  },
});

export const zhipuSearchTool = createTool({
  description:
    "Search the web using Zhipu AI - performs real-time web searches with intelligent query understanding. Returns relevant results with content extraction.",
  inputSchema: jsonSchemaToZod(zhipuSearchSchema),
  execute: (params) => {
    return safe(async () => {
      const searchRequest: ZhipuSearchRequest = {
        description: params.description,
        queries: params.queries,
        recency_days: params.recency_days ?? 0,
      };

      const result = await fetchZhipu(`chat-${Date.now()}`, searchRequest);

      return {
        ...result,
        guide: `Use the search results to answer the user's question. Summarize the content and ask if they have any additional questions about the topic.`,
      };
    })
      .ifFail((e) => {
        return {
          isError: true,
          error: e.message,
          solution:
            "A web search error occurred. First, explain to the user what caused this specific error and how they can resolve it. Then provide helpful information based on your existing knowledge to answer their question.",
        };
      })
      .unwrap();
  },
});
