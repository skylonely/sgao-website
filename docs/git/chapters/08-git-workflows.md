---
outline: deep
---

# 第八章：Git Flow——企业级 Git 工作流

> **一句话理解：**
>
> **工作流（Workflow）决定团队如何协作，而不仅仅是如何使用 Git。**

---

## 本章知识地图

```text
Git 工作流
├── Git Flow
├── GitHub Flow
├── Trunk-Based Development
├── Pull Request
├── Code Review
├── CI/CD
└── AI Coding
```

---

## 本章目标

完成本章学习后，你将能够：

- 理解为什么会有 Git 工作流
- 掌握 Git Flow、GitHub Flow、Trunk-Based Development
- 根据团队规模选择合适的工作流
- 理解现代 CI/CD 与 AI Coding 的关系

---

## 🏛️ 设计思想（Design Philosophy）

Git 只是工具。

真正影响团队效率的是：

> **大家是否遵循统一的协作规则。**

如果每个人都按自己的方式开发：

- 分支混乱
- 提交混乱
- 发布混乱

于是便诞生了 Git 工作流。

---

## 📈 演进历史（Evolution）

```text
CVS
 │
SVN
 │
Git
 │
Git Flow（2010）
 │
GitHub Flow
 │
CI/CD
 │
Trunk-Based Development
 │
AI Coding（ChatGPT / Codex）
```

软件交付越来越快，工作流也不断演进。

---

## 一、Git Flow

适合：

- 长期维护产品
- 多版本并行
- 发布流程严格

### 分支结构

```text
main
│
develop
├── feature/*
├── release/*
└── hotfix/*
```

#### 生命周期

```text
需求
 │
 ▼
feature
 │
 ▼
develop
 │
 ▼
release
 │
 ▼
main
```

优点：

- 版本清晰
- 发布可控

缺点：

- 分支较多
- 流程复杂

---

## 二、GitHub Flow

一句话：

> **只有一个长期存在的 main。**

流程：

```text
main
 │
 ▼
feature
 │
 ▼
Pull Request
 │
 ▼
Code Review
 │
 ▼
Merge
 │
 ▼
Deploy
```

适合：

- Web 项目
- SaaS
- 创业团队

优点：

- 简单
- 上手快
- 持续部署友好

---

## 三、Trunk-Based Development

设计理念：

> 尽量减少长期分支。

流程：

```text
main
 │
 ├── 短生命周期分支
 │
 └── 每天多次合并
```

通常配合：

- 自动测试
- Feature Flag
- CI/CD

适合：

- DevOps
- 高频发布团队

---

## 三种工作流对比

| 项目类型 | 推荐工作流 |
| --- | --- |
| 个人项目 | GitHub Flow |
| 创业团队 | GitHub Flow |
| 企业业务系统 | Git Flow |
| 高频发布平台 | Trunk-Based |
| 开源项目 | GitHub Flow |

---

## Pull Request 为什么重要？

Pull Request（PR）不仅是合并代码。

更重要的是：

- Code Review
- 自动测试
- 团队讨论
- 风险控制

推荐流程：

```text
Feature
 │
 ▼
Push
 │
 ▼
Pull Request
 │
 ▼
Review
 │
 ▼
CI
 │
 ▼
Merge
```

---

## 🚨 事故案例

某团队所有人直接 Push 到 main：

```text
main
├── 登录（未完成）
├── 支付（未完成）
├── 修复 Bug
└── 实验代码
```

一次发布导致：

- Bug 修复上线
- 未完成功能也一起上线

正确做法：

所有开发先进入 Feature Branch，经 PR 后再合并。

---

## 📖 企业规范（Enterprise Practice）

建议：

- 一个功能，一个分支
- 一个分支，一个 PR
- PR 至少一人 Review
- CI 全绿再 Merge
- Merge 后立即删除 Feature Branch

---

## 🤖 AI Coding 工作流

现代推荐流程：

```text
需求
 │
 ▼
ChatGPT / Codex
 │
 ▼
Feature Branch
 │
 ▼
人工 Review
 │
 ▼
Pull Request
 │
 ▼
CI 自动测试
 │
 ▼
Merge
 │
 ▼
Cloudflare / Production
```

AI 可以提升效率，但：

> **AI 不应绕过 Review 与测试。**

---

## 🧪 实验室（Lab）

创建功能分支：

```bash
git switch -c feature/login
```

提交：

```bash
git add .
git commit -m "feat(login): add login"
git push origin feature/login
```

然后：

- 创建 Pull Request
- 请同事 Review
- Merge 到 main

---

## 🧠 思考题

为什么越来越多互联网公司从 Git Flow 转向 GitHub Flow 或 Trunk-Based？

提示：

思考：

- 发布频率
- 自动化
- CI/CD

---

## 面试官会怎么问？

**Q：Git Flow 和 GitHub Flow 最大区别？**

答：

Git Flow 分支更多，适合版本管理严格的项目；GitHub Flow 更简单，围绕
main + Feature Branch + Pull Request，适合持续交付。

**Q：什么时候选择 Trunk-Based？**

答：

当团队拥有完善的自动测试、CI/CD 和快速发布能力时，Trunk-Based
能显著减少分支维护成本。

---

## 本章总结

没有一种工作流适合所有团队。

选择原则：

- 发布频率越高，流程越简单。
- 自动化越完善，越适合短生命周期分支。
- 团队越大，越需要统一规范。

---

## 下一章预告

**第九章：《GitHub——现代协作开发平台》**

我们将进入 GitHub 世界，系统介绍：

- Repository
- Fork
- Star
- Issue
- Pull Request
- Actions
- Releases
- Pages
- GitHub 与 AI 开发
