---
outline: deep
---

# 第十章：GitHub Actions——自动化与 CI/CD

> **一句话理解：**
>
> **GitHub Actions = GitHub
> 内置的自动化平台，让代码提交后自动完成测试、构建、发布和部署。**

---

## 🎯 学习目标（Learning Outcomes）

完成本章后，你将能够：

- 理解 CI 与 CD 的区别
- 理解 Workflow、Job、Step、Runner 的关系
- 编写基础 GitHub Actions Workflow
- 自动构建并部署项目
- 排查常见 Workflow 失败原因

---

## 🏗️ 系统架构图（Architecture）

```text
Developer
    │
git push
    │
    ▼
GitHub Repository
    │
    ▼
GitHub Actions
    │
 ┌── Test
 ├── Build
 ├── Lint
 └── Deploy
    │
    ▼
Cloudflare / GitHub Pages / Docker
```

---

## 本章知识地图

```text
GitHub Actions
├── CI/CD
├── Workflow
├── Event
├── Job
├── Step
├── Runner
├── Secrets
├── Cache
└── Deploy
```

---

## 🏛️ 设计思想（Design Philosophy）

过去开发流程通常依赖人工：

```text
写代码 → 测试 → 打包 → 上传服务器
```

效率低且容易出错。

GitHub Actions
将这些步骤自动化，实现**持续集成（CI）**与**持续交付（CD）**。

---

## 📈 演进历史（Evolution）

```text
手工部署
   │
Jenkins
   │
GitHub Actions
   │
Cloud CI
   │
AI 自动化开发
```

---

## 一、CI 与 CD

**CI（Continuous Integration）**：持续集成。

开发者频繁提交代码，由系统自动执行测试、检查和构建。

**CD（Continuous Delivery / Deployment）**：持续交付或持续部署。

代码通过验证后，自动发布到目标环境。

---

## 二、GitHub Actions 的四个核心概念

### Workflow

一次自动化流程。

保存在：

```text
.github/workflows/*.yml
```

---

### Event

Workflow 的触发条件，例如：

```yaml
on:
  push:
    branches:
      - main
```

---

### Job

Workflow 中的一组任务。

一个 Workflow 可以包含多个 Job。

---

### Step

Job 中的具体执行步骤，例如：

- Checkout
- 安装依赖
- 构建
- 测试
- 部署

---

### Runner

真正执行 Workflow 的运行环境。

常见：

```yaml
runs-on: ubuntu-latest
```

---

## 三、第一个 Workflow

```yaml
name: Build

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install
        run: npm install

      - name: Build
        run: npm run build
```

当代码推送到 main 后，将自动执行安装与构建。

---

## 四、Secrets

不要把密钥写进代码。

正确做法：

```text
Repository

↓

Settings

↓

Secrets and variables

↓

Actions
```

例如：

- API_KEY
- CLOUDFLARE_API_TOKEN
- R2_ACCESS_KEY

---

## 五、Cache

安装依赖往往最耗时。

可以开启缓存：

```yaml
uses: actions/cache
```

减少重复下载，提高构建速度。

---

## 六、自动部署

典型流程：

```text
Push
 │
 ▼
Actions
 │
 ├── Test
 ├── Build
 └── Deploy
      │
      ▼
Cloudflare Pages
```

这也是现代前端项目最常见的发布方式。

---

## 🏢 企业实践（Enterprise Practice）

建议：

- 每次提交自动执行 Lint
- 自动运行单元测试
- Build 成功才能 Merge
- 使用 Secrets 管理敏感信息
- 主分支开启保护策略

---

## 🚨 事故案例（Case Study）

开发者将 Cloudflare API Token 写入仓库。

结果：

- Token 泄露
- 被第三方调用
- 服务受到影响

**经验：**

任何密钥都应放入 GitHub Secrets，而不是代码仓库。

---

## 💡 常见误区（Common Mistakes）

- ❌ Workflow 放错目录
- ❌ YAML 缩进错误
- ❌ Secret 写进代码
- ❌ 所有步骤放在一个 Job 中
- ❌ 构建失败仍继续部署

---

## 🤖 AI Coding 实践

ChatGPT / Codex 可以：

- 生成 Workflow
- 优化 YAML
- 排查构建错误

但仍需：

- 人工检查权限
- 验证 Secrets
- 阅读执行日志

---

## ✅ 最佳实践清单（Checklist）

- [ ] Workflow 放在 `.github/workflows`
- [ ] 使用 Secrets
- [ ] 自动执行测试
- [ ] 自动构建
- [ ] 自动部署
- [ ] 开启依赖缓存
- [ ] 保持日志清晰

---

## 🧪 实验室（Lab）

创建：

```text
.github/workflows/build.yml
```

提交：

```bash
git add .
git commit -m "ci: add github actions"
git push
```

观察 GitHub Actions 是否自动执行。

---

## 🧠 思考题

为什么现代团队越来越倾向于"Push 即部署"？

思考：

- 自动化
- 可重复性
- 减少人为错误

---

## 面试官会怎么问？

**Q：Workflow、Job、Step 有什么关系？**

答：

Workflow 是完整流程；Workflow 包含一个或多个 Job；Job 又由多个 Step
组成。

**Q：为什么使用 GitHub Secrets？**

答：

用于安全管理敏感信息，避免密钥泄露到代码仓库。

---

## 📚 延伸阅读（Further Reading）

建议继续学习：

- Docker 与 GitHub Actions
- Cloudflare Pages 自动部署
- Cloudflare Workers 自动发布
- GitHub CLI
- GitHub API
- Dependabot

---

## 本章总结

GitHub Actions 将重复性的开发工作自动化，使团队能够更专注于业务开发。

它不仅是 CI/CD 工具，更是现代软件工程的重要组成部分。

---

## 下一章预告

**第十一章：《Git 实战与事故恢复》**

我们将通过真实案例学习：

- 误删 Commit 如何恢复
- reset、revert、restore 的区别
- reflog 的使用
- Cherry-pick
- Stash
- 常见 Git 事故处理流程
