---
outline: deep
---

# 第八章：Git 工作流与团队协作

> **一句话理解：**
>
> **Git 工作流不是 Git 的功能，而是团队约定如何使用 Git 的规则。**

---

## 🎯 学习目标

完成本章后，你将能够：

- 理解 Git Flow、GitHub Flow、Trunk-Based Development 的区别
- 根据团队规模选择合适的工作流
- 建立统一的分支协作规范
- 理解 AI Coding 时代的软件开发流程

---

## 🚀 一分钟读懂

```text
需求
 │
 ▼
Feature Branch
 │
 ▼
开发 + AI 辅助编码
 │
 ▼
Commit
 │
 ▼
Pull Request
 │
 ▼
Code Review
 │
 ▼
GitHub Actions
 │
 ▼
部署
```

---

## 📖 故事引入

两支团队都在使用 Git：

- A 团队：任何人直接提交到 `main`
- B 团队：统一分支、Code Review、自动测试后再合并

几个月后：

- A 团队历史混乱、冲突频发、回滚困难。
- B 团队上线稳定、协作顺畅。

区别不在 Git，而在**工作流**。

---

## 🏛️ 为什么需要工作流？

Git 提供的是能力：

- Branch
- Commit
- Merge

工作流规定的是：

- 什么时候建分支
- 谁可以合并
- 谁负责评审
- 什么时候发布

统一规则可以显著降低协作成本。

---

## Git Flow

典型分支：

```text
main
 │
develop
 ├── feature/*
 ├── release/*
 └── hotfix/*
```

**适合：**

- 大型项目
- 固定版本发布
- 多团队协作

**优点：**

- 职责清晰
- 发布流程规范

**缺点：**

- 分支较多
- 学习成本较高

---

## GitHub Flow

流程：

```text
main
 │
feature/*
 │
Pull Request
 │
Review
 │
Merge
```

特点：

- 只有长期维护的 `main`
- 功能开发使用短生命周期分支
- 合并后立即部署

**适合：**

- Web
- SaaS
- 持续交付团队

---

## Trunk-Based Development

核心思想：

所有开发者围绕主干（Trunk）协作。

```text
main
 │
短分支
 │
快速合并
```

特点：

- 分支生命周期短
- 高频提交
- 高频部署

要求：

- 自动测试完善
- CI/CD 成熟

---

## 📊 三种工作流对比

| 工作流 | 适用场景 | 优点 | 挑战 |
| --- | --- | --- | --- |
| Git Flow | 版本制软件 | 流程规范 | 分支较多 |
| GitHub Flow | Web / SaaS | 简洁高效 | 依赖持续部署 |
| Trunk-Based | 高速迭代 | 冲突少、反馈快 | 自动化要求高 |

---

## 🤖 AI Coding 时代的新工作流

现代开发流程正在发生变化：

```text
需求分析
   │
   ▼
ChatGPT / Codex
   │
   ▼
Feature Branch
   │
   ▼
开发与自测
   │
   ▼
Commit
   │
   ▼
Pull Request
   │
   ▼
AI Review + 人工 Review
   │
   ▼
GitHub Actions
   │
   ▼
自动测试
   │
   ▼
自动部署
```

AI 可以提高开发效率，但不能替代：

- 需求确认
- 架构设计
- Code Review
- 最终质量把关

---

## 🏢 企业实践

建议统一规范：

- 一个需求一个分支
- Pull Request 至少一位评审
- 必须通过自动测试
- 禁止直接提交到 `main`
- 发布版本统一打 Tag

---

## ⚠️ 常见误区

❌ 工作流越复杂越专业。

实际上，应选择最符合团队规模和业务特点的方案。

---

❌ 使用 AI 后可以跳过 Code Review。

AI 会提高效率，但不能保证业务逻辑完全正确。

---

## 🏆 Senior Tips

随着团队成长，可以逐步升级：

```text
个人开发
   │
GitHub Flow
   │
Git Flow
   │
Trunk-Based + CI/CD
```

流程应服务于团队，而不是增加负担。

---

## 🧪 Lab

假设团队有：

- 3 名前端
- 2 名后端
- 1 名测试

请设计：

1. 分支命名规范
2. Pull Request 流程
3. 发布流程
4. Hotfix 流程

并说明为什么这样设计。

---

## 🔗 知识关联

```text
第七章
Merge
Rebase
Conflict
      │
      ▼
第八章
Git Flow
GitHub Flow
Trunk-Based
      │
      ▼
第九章
GitHub
Pull Request
Review
Issues
```

---

## ✅ 本章速查

**推荐选择**

- 个人项目：GitHub Flow
- 中小团队：GitHub Flow + CI
- 大型团队：Git Flow 或 Trunk-Based

**一句话总结**

优秀团队的核心竞争力，不是工具，而是统一、可执行、可持续演进的协作流程。

---

## 🧠 思考题

如果你的团队已经使用 ChatGPT、Codex 等 AI 工具，哪些开发环节可以交给
AI？哪些环节仍应由开发者负责？

---

## 📚 下一章预告

**第九章：《GitHub 与现代协作》**

我们将深入介绍：

- Repository
- Issue
- Pull Request
- Code Review
- Release
- Projects

理解 GitHub 如何成为现代软件工程的协作平台。
