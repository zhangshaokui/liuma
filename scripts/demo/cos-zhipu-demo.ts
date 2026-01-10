/**
 * 腾讯云COS & 智谱搜索功能演示脚本
 *
 * 运行方式：
 *   pnpm tsx scripts/demo/cos-zhipu-demo.ts
 *
 * 前置条件：
 *   1. 配置 .env.local 中的腾讯云COS凭证
 *   2. 配置 .env.local 中的智谱API密钥
 */

import { createS3FileStorage } from "../../src/lib/file-storage/s3-file-storage";
import { zhipuSearchTool } from "../../src/lib/ai/tools/web/zhipu-search";
import { getSearchTool, getSearchProvider } from "../../src/lib/ai/tools/web";

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "blue");
  console.log("=".repeat(60) + "\n");
}

async function demoCOSStorage() {
  section("📦 腾讯云COS存储演示");

  // 检查配置
  const hasConfig =
    process.env.FILE_STORAGE_TYPE === "s3" &&
    process.env.FILE_STORAGE_S3_ENDPOINT?.includes("myqcloud.com");

  if (!hasConfig) {
    log("⚠️  腾讯云COS未配置，跳过存储演示", "yellow");
    log("\n配置示例：", "yellow");
    log(`
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=<your-bucket>
FILE_STORAGE_S3_REGION=ap-guangzhou
FILE_STORAGE_S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
AWS_ACCESS_KEY_ID=<TENCENT_SECRET_ID>
AWS_SECRET_ACCESS_KEY=<TENCENT_SECRET_KEY>
    `);
    return;
  }

  try {
    const storage = createS3FileStorage();

    log("✅ COS存储客户端创建成功", "green");
    log(`   Bucket: ${process.env.FILE_STORAGE_S3_BUCKET}`, "green");
    log(`   Region: ${process.env.FILE_STORAGE_S3_REGION}`, "green");
    log(`   Endpoint: ${process.env.FILE_STORAGE_S3_ENDPOINT}`, "green");

    // 测试文件上传
    log("\n📤 测试文件上传...", "blue");
    const testContent = Buffer.from("Hello from Tencent COS!");
    const uploadResult = await storage.upload(testContent, {
      filename: "test-demo.txt",
      contentType: "text/plain",
    });

    log("✅ 文件上传成功", "green");
    log(`   Key: ${uploadResult.key}`, "green");
    log(`   URL: ${uploadResult.sourceUrl}`, "green");
    log(`   Size: ${uploadResult.metadata.size} bytes`, "green");

    // 测试预签名URL
    log("\n🔗 生成预签名URL...", "blue");
    const presignedUrl = await storage.createUploadUrl({
      filename: "presigned-test.txt",
      contentType: "text/plain",
      expiresInSeconds: 3600,
    });

    log("✅ 预签名URL生成成功", "green");
    log(`   URL: ${presignedUrl.url}`, "green");
    log(`   Expires: ${presignedUrl.expiresAt.toISOString()}`, "green");

  } catch (error: any) {
    log(`❌ COS操作失败: ${error.message}`, "red");
  }
}

async function demoZhipuSearch() {
  section("🔍 智谱搜索演示");

  // 检查配置
  if (!process.env.ZHIPU_API_KEY) {
    log("⚠️  智谱API未配置，跳过搜索演示", "yellow");
    log("\n配置示例：", "yellow");
    log(`
WEB_SEARCH_PROVIDER=zhipu
ZHIPU_API_KEY=<your-zhipu-api-key>
    `);
    return;
  }

  try {
    log(`✅ 智谱搜索已配置`, "green");

    // 测试搜索功能
    log("\n🔍 执行搜索: '2025年人工智能技术发展'", "blue");
    const searchResult = await zhipuSearchTool.execute({
      description: "搜索2025年人工智能技术发展趋势",
      queries: [
        "2025年人工智能技术发展",
        "AI大模型最新进展",
        "机器学习前沿技术",
      ],
      recency_days: 30,
    });

    if ((searchResult as any).isError) {
      log(`❌ 搜索失败: ${(searchResult as any).error}`, "red");
      return;
    }

    log("✅ 搜索成功", "green");
    log(`   Request ID: ${searchResult.requestId}`, "green");
    log(`   结果数量: ${searchResult.results.length}`, "green");

    // 显示前3个结果
    log("\n📄 搜索结果（前3条）：", "blue");
    searchResult.results.slice(0, 3).forEach((result: any, index: number) => {
      log(`\n[${index + 1}] ${result.title}`, "green");
      log(`    URL: ${result.url}`, "reset");
      log(
        `    内容: ${result.text.substring(0, 100)}${result.text.length > 100 ? "..." : ""}`,
        "reset",
      );
    });

  } catch (error: any) {
    log(`❌ 搜索失败: ${error.message}`, "red");
  }
}

async function demoUnifiedInterface() {
  section("🔧 统一接口演示");

  const provider = getSearchProvider();
  log(`当前搜索提供商: ${provider}`, "blue");

  const searchTool = getSearchTool();
  log(`✅ 统一接口获取成功`, "green");
  log(`   工具描述: ${searchTool.description.substring(0, 80)}...`, "green");

  if (provider === "exa") {
    log("\n💡 提示: 设置 WEB_SEARCH_PROVIDER=zhipu 切换到智谱搜索", "yellow");
  } else {
    log("\n💡 提示: 设置 WEB_SEARCH_PROVIDER=exa 切换到Exa搜索", "yellow");
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  log("🚀 腾讯云COS & 智谱搜索功能演示", "blue");
  console.log("=".repeat(60));

  try {
    // 1. COS存储演示
    await demoCOSStorage();

    // 2. 智谱搜索演示
    await demoZhipuSearch();

    // 3. 统一接口演示
    await demoUnifiedInterface();

    // 总结
    section("✨ 演示完成");
    log("✅ 所有功能测试完成", "green");
    log("\n📚 更多信息:", "blue");
    log("   - 完整文档: docs/integration/COS_ZHIPU_INTEGRATION.md", "reset");
    log("   - 快速开始: docs/integration/QUICKSTART.md", "reset");
    log("   - 配置模板: .env.example.tencos.zhipu", "reset");

  } catch (error: any) {
    log(`\n❌ 演示过程出错: ${error.message}`, "red");
    console.error(error);
  }
}

// 运行演示
main();
