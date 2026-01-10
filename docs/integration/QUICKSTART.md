# 腾讯云COS & 智谱搜索快速配置

## ⚡ 5分钟快速配置

### 1️⃣ 腾讯云COS存储配置

**步骤：**

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 创建COS存储桶（选择地域：广州/上海/北京等）
3. 获取访问密钥：访问管理 > API密钥管理

**环境变量配置** (`.env.local`):

```bash
# 启用S3存储（指向腾讯云COS）
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=<your-bucket-name>
FILE_STORAGE_S3_REGION=ap-guangzhou
FILE_STORAGE_S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com

# 腾讯云凭证
AWS_ACCESS_KEY_ID=<TENCENT_SECRET_ID>
AWS_SECRET_ACCESS_KEY=<TENCENT_SECRET_KEY>
```

**常用地域endpoint：**
- 广州：`cos.ap-guangzhou.myqcloud.com`
- 上海：`cos.ap-shanghai.myqcloud.com`
- 北京：`cos.ap-beijing.myqcloud.com`
- 中国香港：`cos.ap-hongkong.myqcloud.com`

✅ **完成！** 无需修改任何代码，现有S3实现已完全兼容。

---

### 2️⃣ 智谱搜索API配置

**步骤：**

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 创建API密钥

**环境变量配置** (`.env.local`):

```bash
# 选择搜索提供商
WEB_SEARCH_PROVIDER=zhipu

# 智谱API密钥
ZHIPU_API_KEY=<your-zhipu-api-key>
```

✅ **完成！** 系统会自动使用智谱搜索进行网络搜索。

---

## 🔄 切换搜索提供商

### 从Exa切换到智谱

```bash
# 修改 .env.local
WEB_SEARCH_PROVIDER=zhipu  # 从 "exa" 改为 "zhipu"
ZHIPU_API_KEY=<your-key>
```

### 从智谱切换到Exa

```bash
# 修改 .env.local
WEB_SEARCH_PROVIDER=exa  # 从 "zhipu" 改为 "exa"
EXA_API_KEY=<your-key>
```

**无需修改任何代码！**

---

## 📊 功能对比

### 搜索功能对比

| 功能 | Exa AI | 智谱搜索 |
|------|--------|----------|
| 基础搜索 | ✅ | ✅ |
| 内容提取 | ✅ | ✅ |
| 时效控制 | ✅ | ✅ |
| 中文优化 | 一般 | ⭐ 优秀 |
| 域名过滤 | ✅ | ❌ |
| 分类搜索 | ✅ | ❌ |

### 存储方案对比

| 特性 | 腾讯云COS | AWS S3 | Vercel Blob |
|------|-----------|--------|-------------|
| 国内访问速度 | ⭐ 最快 | 较慢 | 快 |
| 兼容性 | S3 API | 原生 | 专有API |
| 配置难度 | 简单 | 简单 | 最简单 |
| 成本 | ¥0.118/GB/月 | $0.023/GB | $0.15/GB |

---

## 🧪 测试配置

### 测试文件上传

```bash
# 生成预签名上传URL
curl -X POST http://localhost:3000/api/storage/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.txt",
    "contentType": "text/plain"
  }'
```

### 测试搜索功能

在聊天界面输入：
```
搜索2025年AI技术最新发展
```

或者使用工作流节点：
```typescript
{
  type: 'tool',
  tool: 'web_search',
  inputs: {
    description: '搜索AI技术趋势',
    queries: ['2025年AI技术发展', '大模型最新进展'],
    recency_days: 7
  }
}
```

---

## ❓ 常见问题

**Q: 腾讯云COS和AWS S3可以同时使用吗？**
A: 不可以。系统通过 `FILE_STORAGE_TYPE` 环境变量选择单一存储提供商。

**Q: 智谱搜索支持英文搜索吗？**
A: 支持。智谱搜索对中英文都有很好的支持。

**Q: 如何查看当前使用的搜索提供商？**
A: 在代码中使用 `getSearchProvider()` 函数查询：
```typescript
import { getSearchProvider } from 'lib/ai/tools/web';
console.log(getSearchProvider()); // 'exa' | 'zhipu'
```

**Q: 腾讯云COS支持CDN加速吗？**
A: 支持！配置CDN后，设置环境变量：
```bash
FILE_STORAGE_S3_PUBLIC_BASE_URL=https://your-cdn-domain.com
```

---

## 🔗 相关文档

- [完整集成指南](./COS_ZHIPU_INTEGRATION.md)
- [腾讯云COS官方文档](https://cloud.tencent.com/document/product/436)
- [智谱AI官方文档](https://docs.bigmodel.cn/)
- [项目主文档](../../README.md)

---

## 📝 环境变量模板

```bash
# === 文件存储 ===
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=<your-bucket>
FILE_STORAGE_S3_REGION=ap-guangzhou
FILE_STORAGE_S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
AWS_ACCESS_KEY_ID=<TENCENT_SECRET_ID>
AWS_SECRET_ACCESS_KEY=<TENCENT_SECRET_KEY>

# === 搜索服务 ===
WEB_SEARCH_PROVIDER=zhipu
ZHIPU_API_KEY=<your-zhipu-key>
# 或使用 Exa
# WEB_SEARCH_PROVIDER=exa
# EXA_API_KEY=<your-exa-key>
```
