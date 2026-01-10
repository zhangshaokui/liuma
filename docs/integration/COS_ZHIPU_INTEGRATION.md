# 腾讯云COS & 智谱搜索API 集成指南

本文档说明如何在项目中集成腾讯云对象存储（COS）和智谱AI搜索API。

## 目录

- [腾讯云COS存储](#腾讯云cos存储)
  - [零代码集成](#零代码集成)
  - [环境变量配置](#环境变量配置)
  - [区域endpoint列表](#区域endpoint列表)
- [智谱搜索API](#智谱搜索api)
  - [特性说明](#特性说明)
  - [环境变量配置](#环境变量配置-1)
  - [使用示例](#使用示例)
  - [API对比](#api对比)

---

## 腾讯云COS存储

### 零代码集成

✨ **好消息！** 腾讯云COS **100%兼容AWS S3 API**，现有的S3实现**已完全支持**，无需修改任何代码。

### 环境变量配置

在 `.env.local` 或 `.env` 文件中添加以下配置：

```bash
# 启用S3存储（指向腾讯云COS）
FILE_STORAGE_TYPE=s3

# 存储桶配置
FILE_STORAGE_S3_BUCKET=<your-bucket-name>  # 例如：my-bucket-1234567890
FILE_STORAGE_S3_REGION=ap-guangzhou        # 选择离你最近的地域
FILE_STORAGE_S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com

# 腾讯云访问凭证（可在腾讯云控制台获取）
AWS_ACCESS_KEY_ID=<TENCENT_SECRET_ID>
AWS_SECRET_ACCESS_KEY=<TENCENT_SECRET_KEY>

# 可选：通过CDN或自定义域名提供文件访问
# FILE_STORAGE_S3_PUBLIC_BASE_URL=https://cdn.example.com
```

### 区域endpoint列表

| 地域 | Region | Endpoint |
|------|--------|----------|
| 广州 | ap-guangzhou | cos.ap-guangzhou.myqcloud.com |
| 上海 | ap-shanghai | cos.ap-shanghai.myqcloud.com |
| 北京 | ap-beijing | cos.ap-beijing.myqcloud.com |
| 成都 | ap-chengdu | cos.ap-chengdu.myqcloud.com |
| 重庆 | ap-chongqing | cos.ap-chongqing.myqcloud.com |
| 中国香港 | ap-hongkong | cos.ap-hongkong.myqcloud.com |
| 新加坡 | ap-singapore | cos.ap-singapore.myqcloud.com |
| 东京 | ap-tokyo | cos.ap-tokyo.myqcloud.com |
| 首尔 | ap-seoul | cos.ap-seoul.myqcloud.com |

**完整列表请参考：** [腾讯云COS地域文档](https://cloud.tencent.com/document/product/436/6224)

### 获取凭证

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 **访问管理** > **API密钥管理**
3. 创建密钥或查看现有密钥
4. 复制 `SecretId` 和 `SecretKey`

### 验证配置

```bash
# 测试文件上传
curl -X POST http://localhost:3000/api/storage/upload-url \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.txt","contentType":"text/plain"}'
```

---

## 智谱搜索API

### 特性说明

智谱AI提供了强大的联网搜索能力，具有以下特点：

- ✅ **智能查询理解**：自动优化搜索查询
- ✅ **多源搜索整合**：同时搜索多个来源
- ✅ **内容提取**：自动提取网页正文内容
- ✅ **时效性控制**：可设置搜索时间范围

### 环境变量配置

在 `.env.local` 或 `.env` 文件中添加：

```bash
# 选择搜索提供商
WEB_SEARCH_PROVIDER=zhipu  # 可选值: exa | zhipu

# 智谱API密钥
ZHIPU_API_KEY=<your-zhipu-api-key>
```

### 获取API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入 **API Keys** 页面
4. 创建新的API密钥

### 使用示例

#### 在聊天中使用

```typescript
import { getSearchTool } from '@/lib/ai/tools/web';

const searchTool = getSearchTool();

// 在AI聊天中使用
const result = await streamText({
  model: openai('gpt-4'),
  tools: {
    web_search: searchTool,
  },
  messages: [
    {
      role: 'user',
      content: '搜索最新的AI技术发展动态'
    }
  ]
});
```

#### 在工作流中使用

```typescript
import { zhipuSearchToolForWorkflow } from '@/lib/ai/tools/web';

// 工作流节点配置
const searchNode = {
  type: 'tool',
  tool: zhipuSearchToolForWorkflow,
  inputs: {
    description: '搜索2025年AI技术发展趋势',
    queries: [
      '2025年人工智能技术趋势',
      'AI大模型最新进展',
      '机器学习前沿技术'
    ],
    recency_days: 7  // 搜索最近7天的内容
  }
};
```

### API对比

#### Exa vs 智谱搜索

| 特性 | Exa AI | 智谱搜索 |
|------|--------|----------|
| 搜索类型 | semantic, keyword, neural | 智能多源搜索 |
| 内容提取 | ✅ 支持 | ✅ 支持 |
| 时效性控制 | 日期范围 | recency_days |
| 自定义域名过滤 | ✅ includeDomains | ❌ 不支持 |
| 分类搜索 | company, news, github等 | ❌ 不支持 |
| 中文优化 | 一般 | ⭐ 优秀 |

#### 输入格式对比

**Exa格式：**
```typescript
{
  query: "search query",
  numResults: 5,
  type: "auto",
  category: "news",
  includeDomains: ["example.com"],
  maxCharacters: 3000
}
```

**智谱格式：**
```typescript
{
  description: "搜索的目的和原因",
  queries: ["查询1", "查询2", "查询3"],
  recency_days: 0  // 0=无时间限制
}
```

#### 输出格式对比

两者都返回标准化的搜索结果：

```typescript
{
  requestId: string,
  results: [
    {
      id: string,
      title: string,
      url: string,
      text: string,
      publishedDate?: string,
      score?: number
    }
  ]
}
```

---

## 切换搜索提供商

### 从Exa切换到智谱

1. 更新环境变量：
```bash
# 从
WEB_SEARCH_PROVIDER=exa
EXA_API_KEY=***

# 改为
WEB_SEARCH_PROVIDER=zhipu
ZHIPU_API_KEY=***
```

2. **无需修改任何代码**！系统会自动使用新的搜索提供商。

### 代码兼容性

统一接口确保了无缝切换：

```typescript
import { getSearchTool } from '@/lib/ai/tools/web';

// 自动使用配置的提供商
const searchTool = getSearchTool();

// 查询当前使用的提供商
import { getSearchProvider } from '@/lib/ai/tools/web';
const provider = getSearchProvider(); // 'exa' | 'zhipu'
```

---

## 故障排查

### 腾讯云COS常见问题

**问题1：凭证错误**
```
Error: Missing required env: AWS_ACCESS_KEY_ID
```
**解决：** 检查环境变量是否正确配置

**问题2：endpoint错误**
```
Error: getaddrinfo ENOTFOUND cos.ap-guangzhou.myqcloud.com
```
**解决：** 确认region和endpoint匹配

**问题3：bucket不存在**
```
Error: NoSuchBucket
```
**解决：** 在腾讯云控制台创建存储桶

### 智谱搜索常见问题

**问题1：API密钥无效**
```
Error: Invalid Zhipu API key
```
**解决：** 检查 `ZHIPU_API_KEY` 是否正确

**问题2：配额超限**
```
Error: Zhipu API usage limit exceeded
```
**解决：** 等待配额重置或升级套餐

**问题3：无搜索结果**
```
results: []
```
**解决：**
- 尝试调整 `recency_days` 参数
- 使用更通用的搜索查询
- 检查网络连接

---

## 成本参考

### 腾讯云COS定价

- **存储费用**：¥0.118/GB/月（广州）
- **请求费用**：¥0.01/万次读请求
- **流量费用**：¥0.5/GB（外网下行流量）

*价格仅供参考，请以[官方定价](https://cloud.tencent.com/product/cos/pricing)为准*

### 智谱搜索定价

- **免费额度**：新用户有一定免费额度
- **按量计费**：根据搜索次数和内容长度计费

*请参考[智谱AI定价](https://open.bigmodel.cn/pricing)获取最新信息*

---

## 最佳实践

### 腾讯云COS

1. **使用CDN加速**：配置 `FILE_STORAGE_S3_PUBLIC_BASE_URL` 指向CDN域名
2. **设置生命周期**：自动清理旧文件
3. **启用版本控制**：防止误删除
4. **配置CORS**：允许前端直接访问

### 智谱搜索

1. **多查询策略**：提供3-5个不同角度的查询
2. **时效性设置**：新闻类搜索设置 `recency_days: 7`
3. **描述详细**：description字段帮助AI理解搜索意图
4. **结果验证**：检查返回的results数组长度

---

## 参考资源

- [腾讯云COS Node.js SDK](https://cloud.tencent.com/document/product/436/8629)
- [腾讯云COS API文档](https://cloud.tencent.com/document/product/436/7751)
- [智谱AI开放平台](https://open.bigmodel.cn/)
- [智谱搜索API文档](https://docs.bigmodel.cn/cn/guide/tools/web-search)

---

## 技术支持

如有问题，请：
1. 查看本文档的"故障排查"部分
2. 查看项目 `docs/` 目录下的其他文档
3. 提交 Issue 到项目仓库
