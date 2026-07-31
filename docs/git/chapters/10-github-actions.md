---
outline: deep
---

# 第十章：GitHub Actions 与 CI/CD

> **一句话理解：**
>
> **GitHub Actions 是把一次 Git
> 提交自动连接到测试、构建和部署的桥梁，让软件交付从手工操作走向自动化。**

---

## 🎯 学习目标

完成本章后，你将能够：

- 理解 CI/CD 的核心思想
- 理解 GitHub Actions 的工作原理
- 掌握 Workflow、Job、Step、Runner 的关系
- 编写简单的 GitHub Actions Workflow
- 将 GitHub Actions 应用于实际项目自动部署

---

## 🚀 一分钟读懂

```text
git push
    │
    ▼
GitHub
    │
    ▼
GitHub Actions
    │
    ▼
Install
    │
    ▼
Lint
    │
    ▼
Test
    │
    ▼
Build
    │
    ▼
Deploy
```

---

## 📖 故事引入

假设团队每天发布几十次代码。

如果每次都需要手动：

- 安装依赖
- 执行测试
- 打包
- 上传服务器

不仅效率低，而且容易出错。

GitHub Actions 的目标，就是把这些重复工作自动完成。

---

## 🏛️ 什么是 CI/CD？

**CI（Continuous Integration，持续集成）**

每次提交代码后，自动执行：

- 编译
- 检查
- 测试

确保新代码不会破坏已有功能。

**CD（Continuous Delivery / Deployment）**

通过自动化流程，将通过验证的代码持续交付或部署到目标环境。

---

## GitHub Actions 工作模型

```text
Event
   │
   ▼
Workflow
   │
   ▼
Job
   │
   ▼
Step
   │
   ▼
Runner
```

- **Event**：触发事件，例如 `push`、`pull_request`
- **Workflow**：完整自动化流程
- **Job**：一组任务
- **Step**：任务中的具体步骤
- **Runner**：执行 Workflow 的运行环境

---

## 第一个 Workflow

```yaml
name: CI

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install
        run: npm install

      - name: Test
        run: npm test
```

一次 `git push` 即可自动执行整个流程。

---

## 🔄 Workflow 生命周期

```text
Push
 │
 ▼
Checkout
 │
 ▼
Install
 │
 ▼
Lint
 │
 ▼
Test
 │
 ▼
Build
 │
 ▼
Deploy
```

任何一步失败，Workflow 都会停止并反馈错误。

---

## 🌍 真实案例：自动部署文档网站

假设维护一个文档站点：

```text
docs/
```

开发流程：

```text
修改 Markdown
      │
      ▼
git commit
      │
      ▼
git push
      │
      ▼
GitHub Actions
      │
      ▼
构建静态文件
      │
      ▼
部署到 Cloudflare Pages
      │
      ▼
网站自动更新
```

整个过程无需手动上传文件。

---

## 🏢 企业实践

推荐流水线包含：

- 安装依赖
- 代码格式检查
- 静态分析
- 单元测试
- 构建
- 安全扫描
- 自动部署

生产环境通常还会增加人工审批环节。

---

## ⚠️ 常见误区

❌ GitHub Actions 只能用于部署。

实际上，它可以执行几乎任何自动化任务。

---

❌ 所有 Workflow 都应自动部署生产环境。

建议区分：

- 开发环境
- 测试环境
- 生产环境

采用不同策略。

---

## 🏆 Senior Tips

设计流水线时遵循：

- 快速失败（Fail Fast）
- 可重复执行
- 最小权限
- Secrets 不写入代码仓库
- 小步发布、快速回滚

---

## 🧪 Lab

创建 `.github/workflows/ci.yml`：

1. Push 自动触发
2. 安装依赖
3. 执行测试
4. 构建项目

尝试增加一个故意失败的步骤，观察 Workflow 的执行结果。

---

## 🔗 知识关联

```text
第九章
Repository
PR
Review
      │
      ▼
第十章
Workflow
Job
Step
Runner
CI/CD
      │
      ▼
第十一章
恢复
Reset
Restore
Reflog
```

---

## ✅ 本章速查

**Workflow 组成**

- Event
- Workflow
- Job
- Step
- Runner

**一句话总结**

GitHub Actions 将 Git、测试、构建和部署连接成一条自动化交付流水线。

---

## 🧠 思考题

如果团队每天发布 30 次代码，没有 CI/CD
会遇到哪些问题？自动化能够解决哪些环节，又有哪些工作仍需要人工参与？

---

## 📚 下一章预告

**第十一章：《Git 实战与事故恢复》**

学习如何使用 Reset、Restore、Revert、Reflog
等工具，在误操作后快速恢复项目。
