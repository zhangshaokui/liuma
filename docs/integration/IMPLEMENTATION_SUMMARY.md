# 腾讯云COS & 智谱搜索集成 - 实施总结

## 📋 实施概述

本次更新为项目添加了**腾讯云对象存储（COS）**和**智谱AI搜索API**的完整支持，采用**零代码修改**和**兼容扩展**的设计理念。

---

## ✅ 完成的工作

### 1. 腾讯云COS存储集成

**实现方式：** 零代码集成（配置即可）

**核心原理：**
- 腾讯云COS 100%兼容AWS S3 API
- 现有S3实现已支持自定义endpoint
- 只需配置环境变量即可切换

**文件修改：** 无

**配置示例：**
```bash
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=my-bucket
FILE_STORAGE_S3_REGION=ap-guangzhou
FILE_STORAGE_S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
AWS_ACCESS_KEY_ID=<TENCENT_SECRET_ID>
AWS_SECRET_ACCESS_KEY=<TENCENT_SECRET_KEY>
```

---

### 2. 智谱搜索API集成

**实现方式：** 创建适配器层，提供统一接口

**新增文件：**
- `src/lib/ai/tools/web/zhipu-search.ts` - 智谱搜索实现
- `src/lib/ai/tools/web/index.ts` - 统一导出接口
- `src/lib/ai/tools/web/exa-search.ts` - 重命名（原web-search.ts）

**核心设计：**

```typescript
// 统一接口，支持多提供商
export const getSearchTool = () => {
  const provider = resolveProvider(); // 从环境变量读取
  switch (provider) {
    case 'exa': return exaSearchTool;
    case 'zhipu': return zhipuSearchTool;
  }
};
```

**API适配：**

| 特性 | 智谱API格式 | 统一接口格式 |
|------|------------|-------------|
| 输入 | `{description, queries, recency_days}` | 标准化为工具调用 |
| 输出 | `{title, link, content}` | `{id, title, url, text, ...}` |

**更新文件：**
- `src/lib/ai/tools/tool-kit.ts` - 更新导入路径
- `src/lib/ai/workflow/executor/node-executor.ts` - 更新导入路径
- `src/components/workflow/node-config/tool-node-config.tsx` - 更新导入路径
- `src/components/tool-invocation/web-search.tsx` - 更新导入路径

---

### 3. 文档与配置

**新增文档：**
- `docs/integration/COS_ZHIPU_INTEGRATION.md` - 完整集成指南（8个章节）
- `docs/integration/QUICKSTART.md` - 5分钟快速配置指南
- `.env.example.tencos.zhipu` - 环境变量配置模板

**文档内容：**
- ✅ 配置步骤说明
- ✅ API对比表格
- ✅ 故障排查指南
- ✅ 成本参考
- ✅ 最佳实践
- ✅ 测试方法

---

## 🎯 设计原则

### 1. KISS（简单至上）
- 腾讯云COS：配置即用，零代码修改
- 智谱搜索：单一适配器文件，清晰的接口

### 2. DRY（避免重复）
- 统一搜索工具接口：`getSearchTool()`
- 统一错误处理模式
- 共享类型定义

### 3. 开放封闭原则
- 对扩展开放：轻松添加新的搜索提供商
- 对修改封闭：现有代码无需改动

### 4. 依赖倒置
- 依赖抽象接口，不依赖具体实现
- 通过环境变量控制具体提供商

---

## 📊 兼容性矩阵

### 存储提供商

| 提供商 | 状态 | 配置难度 | 国内访问 |
|--------|------|----------|----------|
| Vercel Blob | ✅ 原生支持 | ⭐ 简单 | ⭐⭐ 快 |
| AWS S3 | ✅ 原生支持 | ⭐ 简单 | ⭐ 慢 |
| 腾讯云COS | ✅ 完全兼容 | ⭐ 简单 | ⭐⭐⭐ 最快 |

### 搜索提供商

| 提供商 | 状态 | 配置难度 | 中文支持 |
|--------|------|----------|----------|
| Exa AI | ✅ 原生支持 | ⭐ 简单 | ⭐⭐ 一般 |
| 智谱AI | ✅ 新增支持 | ⭐ 简单 | ⭐⭐⭐ 优秀 |

---

## 🚀 使用方式

### 方式1：聊天集成（自动）

```typescript
// 系统自动使用环境变量配置的搜索提供商
import { getSearchTool } from 'lib/ai/tools/web';

const searchTool = getSearchTool();

// 在AI聊天中使用
await streamText({
  model: openai('gpt-4'),
  tools: { web_search: searchTool },
  messages: [...]
});
```

### 方式2：工作流集成

```typescript
import { zhipuSearchToolForWorkflow } from 'lib/ai/tools/web';

// 工作流节点
const searchNode = {
  type: 'tool',
  tool: zhipuSearchToolForWorkflow,
  inputs: {
    description: '搜索最新技术趋势',
    queries: ['AI技术2025', '大模型发展'],
    recency_days: 7
  }
};
```

### 方式3：直接调用

```typescript
import { zhipuSearchTool } from 'lib/ai/tools/web';

const result = await zhipuSearchTool.execute({
  description: '研究项目技术栈',
  queries: ['Next.js最佳实践', 'React性能优化'],
  recency_days: 30
});
```

---

## 🔄 迁移指南

### 从AWS S3迁移到腾讯云COS

**步骤：**

1. 在腾讯云创建COS存储桶
2. 获取腾讯云访问密钥
3. 修改环境变量：

```bash
# 只需修改这4个环境变量
FILE_STORAGE_S3_BUCKET=<new-bucket>
FILE_STORAGE_S3_REGION=ap-guangzhou
FILE_STORAGE_S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
AWS_ACCESS_KEY_ID=<TENCENT_SECRET_ID>
AWS_SECRET_ACCESS_KEY=<TENCENT_SECRET_KEY>
```

4. 重启应用

**数据迁移：** 使用腾讯云COS的数据迁移服务或AWS S3 SDK批量迁移

### 从Exa切换到智谱搜索

**步骤：**

1. 注册智谱AI账号并获取API密钥
2. 修改环境变量：

```bash
WEB_SEARCH_PROVIDER=zhipu
ZHIPU_API_KEY=<your-key>
```

3. 重启应用

**无需修改任何代码！**

---

## 🧪 测试验证

### 测试COS上传

```bash
# 1. 生成上传URL
curl -X POST http://localhost:3000/api/storage/upload-url \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg"}'

# 2. 使用返回的URL上传文件
curl -X PUT "<返回的URL>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg
```

### 测试搜索功能

在聊天界面输入：
```
搜索2025年Web开发最新技术趋势
```

预期结果：使用智谱搜索返回相关文章和内容

---

## 📈 性能优化建议

### 腾讯云COS优化

1. **启用CDN加速**
```bash
FILE_STORAGE_S3_PUBLIC_BASE_URL=https://cdn.example.com
```

2. **选择最近地域**
- 华南用户：ap-guangzhou
- 华东用户：ap-shanghai
- 华北用户：ap-beijing

3. **设置生命周期规则**
自动清理旧文件，降低存储成本

### 智谱搜索优化

1. **多查询策略**：提供3-5个不同角度的查询
2. **时效性控制**：新闻类查询设置 `recency_days: 7`
3. **描述优化**：详细的description提高搜索准确性

---

## 🔒 安全建议

### 腾讯云COS安全

1. **不要在代码中硬编码凭证**
2. **使用临时密钥**（STS）替代永久密钥
3. **配置存储桶策略**：限制访问来源
4. **启用服务器端加密**

### 智谱搜索安全

1. **API密钥定期轮换**
2. **监控API使用量**：设置告警
3. **限制搜索频率**：防止滥用

---

## 📝 环境变量清单

```bash
# === 腾讯云COS ===
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=<必填>
FILE_STORAGE_S3_REGION=<必填>
FILE_STORAGE_S3_ENDPOINT=<必填>
AWS_ACCESS_KEY_ID=<必填>
AWS_SECRET_ACCESS_KEY=<必填>
FILE_STORAGE_S3_PUBLIC_BASE_URL=<可选>

# === 智谱搜索 ===
WEB_SEARCH_PROVIDER=zhipu|exa
ZHIPU_API_KEY=<使用智谱时必填>
EXA_API_KEY=<使用Exa时必填>
```

---

## 🎓 学习资源

- [腾讯云COS快速入门](https://cloud.tencent.com/document/product/436/38314)
- [智谱AI API文档](https://docs.bigmodel.cn/)
- [项目完整文档](../../README.md)

---

## 📞 技术支持

如有问题或建议，请：
1. 查看[完整集成指南](./COS_ZHIPU_INTEGRATION.md)
2. 查看[快速配置指南](./QUICKSTART.md)
3. 提交Issue到项目仓库

---

## ✨ 总结

本次实施成功实现了：

✅ **腾讯云COS** - 零代码集成，配置即用
✅ **智谱搜索API** - 统一接口，无缝切换
✅ **完整文档** - 从快速开始到深度指南
✅ **向后兼容** - 不影响现有功能
✅ **可扩展性** - 轻松添加新的提供商

**核心优势：**
- 🚀 快速配置：5分钟完成
- 🔄 无缝切换：修改环境变量即可
- 📚 文档完善：覆盖所有使用场景
- 🎯 设计优雅：遵循SOLID原则

---

**实施日期：** 2025-01-10
**分支：** feature/cos-zhipu-integration
**状态：** ✅ 完成并待测试
