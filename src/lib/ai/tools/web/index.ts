/**
 * Web Search Tools - Unified Interface for Multiple Search Providers
 *
 * This module provides a unified interface for different web search providers:
 * - Exa AI (exaSearchTool, exaContentsTool)
 * - Zhipu AI (zhipuSearchTool)
 *
 * Usage:
 *   import { getSearchTool } from 'lib/ai/tools/web'
 *   const searchTool = getSearchTool() // Uses provider from env
 *
 * Environment Variables:
 *   WEB_SEARCH_PROVIDER=exa|zhipu (default: exa)
 *   EXA_API_KEY=... (for Exa)
 *   ZHIPU_API_KEY=... (for Zhipu)
 */

export {
  exaSearchTool,
  exaSearchToolForWorkflow,
  exaContentsTool,
  exaContentsToolForWorkflow,
  exaSearchSchema,
  exaContentsSchema,
} from "./exa-search";
export {
  zhipuSearchTool,
  zhipuSearchToolForWorkflow,
  zhipuSearchSchema,
} from "./zhipu-search";
export type {
  ExaSearchRequest,
  ExaSearchResult,
  ExaSearchResponse,
} from "./exa-search";
export type {
  ZhipuSearchRequest,
  ZhipuSearchResult,
  ZhipuSearchResponse,
  UnifiedSearchResult,
} from "./zhipu-search";

import { exaSearchTool } from "./exa-search";
import { zhipuSearchTool } from "./zhipu-search";

export type WebSearchProvider = "exa" | "zhipu";

const resolveProvider = (): WebSearchProvider => {
  const provider = process.env.WEB_SEARCH_PROVIDER?.trim().toLowerCase();

  if (provider === "exa" || provider === "zhipu") {
    return provider;
  }

  // 默认使用 Exa
  return "exa";
};

/**
 * 获取配置的搜索工具
 * 根据环境变量 WEB_SEARCH_PROVIDER 自动选择
 */
export const getSearchTool = () => {
  const provider = resolveProvider();

  switch (provider) {
    case "exa":
      return exaSearchTool;
    case "zhipu":
      return zhipuSearchTool;
    default:
      const exhaustiveCheck: never = provider;
      throw new Error(`Unsupported web search provider: ${exhaustiveCheck}`);
  }
};

/**
 * 获取当前配置的搜索提供商名称
 */
export const getSearchProvider = (): WebSearchProvider => {
  return resolveProvider();
};
