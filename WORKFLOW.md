# 开发工作流说明

## 角色分工

- **Claude**: 本地开发、提交 PR
- **用户**: 审核 PR、合并代码

## 开发流程

### 1. Claude 开发新功能

```bash
cd ~/pr_chatbot/liuma

# 创建功能分支
git checkout -b feature/功能名称

# 修改代码...
# 提交更改
git add .
git commit -m "feat: 功能描述"

# 推送到 GitHub
git push origin feature/功能名称

# 创建 PR 到 dev 分支
# (通过 GitHub Web UI 或 gh 命令)
```

### 2. 用户审核代码

1. 访问 GitHub PR 页面
2. 查看 代码变更
3. 如果有问题，添加 comment
4. 如果满意，点击 "Approve" 并 "Merge"

### 3. 自动部署

PR 合并到 dev 后，服务器自动：
1. 拉取最新代码
2. 构建项目
3. 重启服务

（待配置 GitHub Actions）

## 目录结构

- **本地开发目录**: `~/pr_chatbot/liuma`
- **服务器生产目录**: `~/bc/better-chatbot` (tx 服务器)
- **服务器 Git 仓库**: `~/better/liuma` (tx 服务器)

## 快速命令

```bash
# 查看当前状态
git status

# 查看最近的 PR
gh pr list

# 查看某个 PR 的详情
gh pr view <pr-number>

# 合并 PR
gh pr merge <pr-number>
```

## 注意事项

1. **不要直接在 dev/main 分支修改**
2. **每个功能用独立分支**
3. **提交信息清晰描述变更**
4. **PR 合并前必须通过审核**
