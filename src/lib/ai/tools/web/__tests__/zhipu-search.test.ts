/**
 * 智谱搜索工具测试
 *
 * 注意：这些测试需要 ZHIPU_API_KEY 环境变量
 * 运行测试前请确保已配置密钥
 */

import { describe, it, expect, beforeAll } from "vitest";
import { zhipuSearchTool, zhipuSearchSchema } from "../zhipu-search";

describe("Zhipu Search Tool", () => {
  beforeAll(() => {
    // 检查是否配置了API密钥
    if (!process.env.ZHIPU_API_KEY) {
      console.warn("⚠️  ZHIPU_API_KEY not configured, skipping tests");
    }
  });

  describe("Schema Validation", () => {
    it("应该定义正确的搜索schema", () => {
      expect(zhipuSearchSchema).toBeDefined();
      expect(zhipuSearchSchema.type).toBe("object");
      expect(zhipuSearchSchema.properties).toBeDefined();
      expect(zhipuSearchSchema.properties?.description).toBeDefined();
      expect(zhipuSearchSchema.properties?.queries).toBeDefined();
    });

    it("应该包含必需的字段", () => {
      const required = zhipuSearchSchema.required as string[];
      expect(required).toContain("description");
      expect(required).toContain("queries");
    });

    it("应该支持可选字段", () => {
      expect(zhipuSearchSchema.properties?.recency_days).toBeDefined();
    });
  });

  describe("Tool Interface", () => {
    it("应该导出搜索工具", () => {
      expect(zhipuSearchTool).toBeDefined();
      expect(zhipuSearchTool.description).toBeDefined();
      expect(zhipuSearchTool.inputSchema).toBeDefined();
      expect(zhipuSearchTool.execute).toBeInstanceOf(Function);
    });

    it("应该有清晰的工具描述", () => {
      expect(zhipuSearchTool.description).toContain("Zhipu AI");
      expect(zhipuSearchTool.description).toContain("web search");
    });
  });

  describe("API Integration", () => {
    it.skipIf(!process.env.ZHIPU_API_KEY)(
      "应该成功执行搜索（需要API密钥）",
      async () => {
        const result = await zhipuSearchTool.execute({
          description: "测试搜索功能",
          queries: ["人工智能技术发展"],
          recency_days: 30,
        });

        expect(result).toBeDefined();
        expect(result.requestId).toBeDefined();
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results.length).toBeGreaterThan(0);

        // 验证结果格式
        const firstResult = result.results[0];
        expect(firstResult).toHaveProperty("id");
        expect(firstResult).toHaveProperty("title");
        expect(firstResult).toHaveProperty("url");
        expect(firstResult).toHaveProperty("text");
      },
      { timeout: 30000 },
    );

    it.skipIf(!process.env.ZHIPU_API_KEY)(
      "应该处理多查询搜索",
      async () => {
        const result = await zhipuSearchTool.execute({
          description: "搜索AI和机器学习相关内容",
          queries: [
            "人工智能最新进展",
            "机器学习算法",
            "深度学习应用",
          ],
          recency_days: 7,
        });

        expect(result.results.length).toBeGreaterThan(0);
        expect(result.requestId).toBeDefined();
      },
      { timeout: 30000 },
    );
  });

  describe("Error Handling", () => {
    it.skipIf(!process.env.ZHIPU_API_KEY)(
      "应该处理无效的API密钥",
      async () => {
        // 保存原始密钥
        const originalKey = process.env.ZHIPU_API_KEY;

        try {
          // 临时设置为无效密钥
          delete process.env.ZHIPU_API_KEY;

          const result = await zhipuSearchTool.execute({
            description: "测试",
            queries: ["test"],
          });

          // 应该返回错误格式
          expect(result).toHaveProperty("isError", true);
          expect(result).toHaveProperty("error");
        } finally {
          // 恢复原始密钥
          process.env.ZHIPU_API_KEY = originalKey;
        }
      },
      { timeout: 10000 },
    );
  });
});
