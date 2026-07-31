# 一篇文章搞定 GitHub（2026 完整版）

> 面向前端开发者、独立开发者和 AI 开发者的一篇 GitHub 入门到实战指南。

GitHub 已经不仅是代码托管平台，也是现代软件开发的重要基础设施。无论使用 ChatGPT、Codex、VS Code、Cloudflare、Docker 还是 AI Agent，许多开发流程都会和 GitHub 产生联系。

## 一、Git 与 GitHub 有什么区别

很多初学者会混淆 Git 与 GitHub，实际上它们属于不同层次。

### Git

Git 是一个分布式版本控制系统，负责：

- 记录文件修改历史
- 管理代码版本
- 恢复到历史状态
- 创建与合并分支
- 支持多人协作

Git 可以完全离线使用。一个 Git 仓库既可以只保存在本地，也可以同步到 GitHub 等远程平台。

### GitHub

GitHub 是基于 Git 的软件开发与协作平台。它可以托管远程 Git 仓库，并提供 Pull Request、Issue、Actions、Release 等协作能力。

简单理解：

```text
Git
  └── 管理代码版本

GitHub
  └── 托管 Git 仓库，并提供协作与自动化能力
```

## 二、GitHub 可以做什么

GitHub 的常用能力包括：

- Repository（仓库）
- Branch（分支）
- Commit（提交）
- Pull Request（代码合并与审核）
- Issue（任务与问题管理）
- Release（版本发布）
- Wiki（项目文档）
- GitHub Actions（自动化与 CI/CD）
- GitHub Pages（静态网站托管）

## 三、GitHub 常见概念

### Repository（仓库）

Repository 用于保存一个项目的文件及其版本历史。

例如：

```text
my-blog
admin-system
vue-demo
```

一个仓库通常包含源代码、README、配置文件、测试和项目文档。

### Commit（提交）

Commit 是项目在某个时间点的版本快照。提交信息应简明说明本次修改的目的，例如：

```text
feat: 新增登录页面
fix: 修复按钮样式
docs: 更新 README
```

### Branch（分支）

分支可以让开发者在不直接影响稳定版本的情况下开发新功能或修复问题。

常见命名示例：

```text
main
develop
feature/login
feature/payment
fix/login-validation
hotfix/payment
```

仓库不一定要同时使用上述所有分支。个人项目通常保留 `main` 和短期功能分支即可。

### Pull Request（PR）

Pull Request 用于提出、讨论、审核和合并代码变更。

典型流程：

```text
创建分支
  ↓
开发并提交代码
  ↓
推送分支
  ↓
创建 Pull Request
  ↓
代码审查与自动检查
  ↓
合并到 main
```

### Issue

Issue 可以用来记录：

- Bug
- 功能需求
- 待办事项
- 项目讨论

复杂项目还可以使用标签、负责人、里程碑和 GitHub Projects 来组织工作。

### Release

Release 用于发布正式版本，通常与 Git 标签配合使用：

```text
v1.0.0
v1.1.0
v3.0.0
```

Release 页面可以包含版本说明、变更记录和安装包等附件。

## 四、常见 GitHub 工作流程

一个常见的协作流程是：

```text
Clone
  ↓
创建分支
  ↓
Coding
  ↓
Commit
  ↓
Push
  ↓
Pull Request
  ↓
Review
  ↓
Merge
```

个人项目也可以直接在 `main` 分支工作，但使用功能分支和 Pull Request 更有利于检查变更、运行自动测试并保留讨论记录。

## 五、最常用的 Git 命令

### 初始化与克隆

在当前目录初始化仓库：

```bash
git init
```

克隆远程仓库：

```bash
git clone https://github.com/user/project.git
```

### 查看状态与历史

查看工作区状态：

```bash
git status
```

查看简洁提交历史：

```bash
git log --oneline
```

查看远程仓库：

```bash
git remote -v
```

### 暂存与提交

暂存所有当前变更：

```bash
git add .
```

提交变更：

```bash
git commit -m "feat: 新增登录页面"
```

提交前应先运行 `git status`，避免把密钥、构建产物或无关文件一起提交。

### 同步远程仓库

推送当前分支：

```bash
git push origin main
```

拉取并整合远程分支：

```bash
git pull origin main
```

团队项目中，建议在拉取和推送前确认当前分支，并了解项目采用 merge 还是 rebase 策略。

## 六、README 为什么重要

README 是项目的入口说明，通常包括：

- 项目介绍
- 功能说明
- 技术栈
- 安装方式
- 使用方法
- 部署方式
- 贡献指南
- License

清晰的 README 可以让新成员快速理解项目，也能帮助未来的自己恢复上下文。

## 七、GitHub Actions

GitHub Actions 是 GitHub 的自动化与 CI/CD 平台。工作流通常保存在：

```text
.github/workflows/
```

例如，代码推送后可以自动完成：

```text
Push
  ↓
安装依赖
  ↓
自动测试
  ↓
构建项目
  ↓
部署到 Cloudflare
```

一个仓库可以配置多个 YAML 工作流，并由代码推送、Pull Request、定时任务或手动操作等事件触发。

## 八、GitHub Pages

GitHub Pages 是面向静态网站的托管服务，可以发布 HTML、CSS、JavaScript 文件，也可以结合 Jekyll 或 GitHub Actions 完成构建。

常见用途包括：

- 个人主页
- 项目文档
- 博客
- 前端静态页面

用户站点的默认地址通常是：

```text
https://username.github.io
```

项目站点通常带有仓库路径，也可以配置自定义域名。GitHub Pages 适合静态内容，不用于运行传统后端服务或数据库。

## 九、GitHub 与 AI

AI 开发工具可以参与代码生成、修改、审查和文档编写，再通过 Git 与 GitHub 进入标准开发流程：

```text
用户提出需求
  ↓
ChatGPT / Codex 等 AI 工具生成或修改代码
  ↓
开发者或 Agent 检查变更
  ↓
Git Commit
  ↓
GitHub Pull Request
  ↓
GitHub Actions 测试与部署
```

AI 可以提高效率，但提交前仍应检查代码差异、测试结果、依赖变更和敏感信息。

## 十、推荐的 Commit 规范

可以采用 Conventional Commits 风格：

| 类型 | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档修改 |
| `style` | 不影响逻辑的格式或样式调整 |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统或依赖变更 |
| `ci` | 持续集成配置 |
| `chore` | 其他维护工作 |

示例：

```text
feat: add user login
fix: handle empty search results
docs: update deployment guide
```

提交信息应描述修改意图，而不是使用“update”“修改一下”等含义模糊的内容。

## 十一、GitHub 最佳实践

- 一个独立项目使用一个 Repository。
- 保持 README 与实际使用方式一致。
- 使用 `.gitignore` 排除依赖、构建产物和本地配置。
- 不提交密码、API Key、Token、私钥和 `.env` 文件。
- 为重要分支设置保护规则和必要检查。
- 通过 Pull Request 审核重要变更。
- 使用 Release 和标签发布正式版本。
- 保持提交内容聚焦，提交信息清晰。
- 定期检查依赖、安全告警和仓库访问权限。

如果敏感信息曾被提交，仅删除文件并再次提交是不够的。应立即撤销或轮换对应凭据，再根据需要清理 Git 历史。

## 十二、GitHub 与 Cloudflare

GitHub 可以作为 Cloudflare 部署流程的代码来源：

```text
VS Code / AI 开发工具
  ↓
Git
  ↓
GitHub
  ↓
GitHub Actions 或 Cloudflare 集成
  ↓
Cloudflare Pages / Workers
  ↓
上线
```

这样可以在代码提交或合并后自动完成测试、构建和部署。

## 十三、GitHub 学习路线

### 第一阶段：Git 基础

- Repository
- Commit
- Status
- Push
- Pull

### 第二阶段：分支与协作

- Branch
- Merge
- Pull Request
- Issue

### 第三阶段：自动化与发布

- GitHub Actions
- GitHub Pages
- Release
- Wiki

### 第四阶段：平台集成

- GitHub API
- MCP
- AI 开发
- 自动化部署

## 十四、总结

一句话理解 GitHub：

> Git 负责版本控制，GitHub 托管 Git 仓库并提供协作与自动化能力。

掌握 Repository、Branch、Commit、Pull Request 和 Actions 后，再结合 ChatGPT、Codex、Cloudflare、Docker 等工具，就可以逐步建立完整的现代开发工作流。

## 参考资料

- [GitHub 是什么](https://docs.github.com/zh/get-started/start-your-journey/what-is-github)
- [GitHub Actions 文档](https://docs.github.com/zh/actions)
- [GitHub Pages 文档](https://docs.github.com/zh/pages)
- [Cloudflare Workers 双站点自动部署](/cloudflare/workers-auto-deploy)
- [API、CLI、Prompt、MCP、Skill 与 Agent](/ai/api-cli-prompt-mcp-skill-agent)
