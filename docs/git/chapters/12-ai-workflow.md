---
outline: deep
---

# 第十二章：AI 时代 Git 最佳实践 —— 从需求到上线的完整开发工作流

> **一句话理解：**
>
> **现代开发已经不是"写代码"，而是"组织一套高质量的软件交付流程"。**

---

## 🎯 学习目标（Learning Outcomes）

完成本章后，你将能够：

- 建立完整的 AI 开发工作流
- 理解 ChatGPT、Codex、Git、GitHub、CI/CD 的职责边界
- 将 Git 最佳实践应用到真实项目
- 构建一套可持续迭代的软件开发流程

---

## 🏗️ 全局架构图（Architecture）

```text
需求
 │
 ▼
ChatGPT（需求分析、方案设计）
 │
 ▼
Codex（编码实现）
 │
 ▼
Feature Branch
 │
 ▼
Git Commit
 │
 ▼
GitHub
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
CI（测试、构建）
 │
 ▼
Cloudflare / Docker
 │
 ▼
线上运行
 │
 ▼
监控与反馈
 │
 ▼
下一轮迭代
```

---

## 🏛️ 设计思想（Design Philosophy）

优秀的软件团队关注的不是"谁写了多少代码"。

真正重要的是：

- 需求是否理解正确
- 代码是否可维护
- 发布是否稳定
- 出现问题是否可恢复
- 是否能够持续迭代

Git 是基础设施，而不是终点。

---

## 一、AI 与人的职责分工

| AI 更擅长 | 人更擅长 |
| --- | --- |
| 生成样板代码 | 业务理解 |
| 文档编写 | 架构设计 |
| 单元测试示例 | 技术决策 |
| 重构建议 | 风险评估 |
| API 示例 | 最终 Code Review |

**原则：AI 是助手，人是负责人。**

---

## 二、完整案例（Case Study）

假设需要新增一个功能。

### 第一步：需求分析

使用 ChatGPT：

- 梳理需求
- 拆分任务
- 制定开发计划

---

### 第二步：创建分支

```bash
git switch -c feature/new-feature
```

坚持：

> 一个功能，一个分支。

---

### 第三步：编码

使用 Codex：

- 生成代码
- 修改代码
- 补充测试

开发者负责：

- 阅读代码
- 本地运行
- 修正问题

---

### 第四步：提交

```bash
git status
git diff
git add .
git commit -m "feat: add new feature"
```

提交前务必检查变更。

---

### 第五步：Push 与 Pull Request

```bash
git push origin feature/new-feature
```

随后：

- 创建 Pull Request
- 邀请 Review
- 回复评论
- 修改问题

---

### 第六步：自动化

GitHub Actions：

- Lint
- Test
- Build
- Deploy

全部成功后再合并。

---

### 第七步：上线

部署完成后：

- 验证功能
- 观察日志
- 监控错误
- 收集反馈

形成闭环。

---

## 🤖 AI 协作规范（AI Collaboration Guidelines）

推荐：

✅ AI 生成：

- 重复代码
- 文档
- 测试
- 示例

必须人工确认：

- 安全逻辑
- 权限控制
- 支付流程
- 数据删除
- 数据库迁移
- 发布配置

**任何 AI 生成的代码，都应经过人工 Review。**

---

## 📦 Git 黄金法则（Golden Rules）

1.  一个功能，一个分支。
2.  Commit 小而频繁。
3.  不直接在 `main` 开发。
4.  Push 前执行 `git diff`。
5.  合并前同步主分支。
6.  公共分支避免随意 Rebase。
7.  密钥永远不要提交到仓库。
8.  CI 全绿再 Merge。
9.  AI 生成代码必须 Review。
10. 保持文档与代码同步更新。

---

## 🏢 企业最佳实践（Enterprise Practice）

建议团队建立统一规范：

- 分支命名规范
- Commit Message 规范
- Pull Request 模板
- Code Review 清单
- 发布流程
- 回滚流程
- 故障复盘流程

工具可以变化，但流程应保持一致。

---

## 💡 常见误区（Common Mistakes）

- ❌ 认为 AI 可以替代 Review
- ❌ 直接提交未验证代码
- ❌ 长时间不提交
- ❌ 一个分支开发多个功能
- ❌ 没有自动化测试
- ❌ 没有回滚方案

---

## 🏆 Senior Tips

- 每次修改都应可回退。
- 任何自动化都应可重复执行。
- 代码评审关注"为什么"，不仅是"怎么写"。
- 文档也是代码的一部分。
- 小步快跑，比一次性大改更安全。

---

## 🧪 综合实验（Lab）

模拟一次完整开发：

1.  创建 Feature Branch
2.  使用 AI 辅助实现功能
3.  本地测试
4.  Commit
5.  Push
6.  创建 Pull Request
7.  Review
8.  GitHub Actions 自动构建
9.  部署
10. 验证并合并

记录每一步遇到的问题，并总结改进点。

---

## 🧠 思考题

未来五年，开发者最重要的能力是什么？

建议从以下角度思考：

- 工程能力
- AI 协作能力
- 沟通能力
- 持续学习能力

---

## 📚 推荐学习路线

```text
Git
   │
GitHub
   │
GitHub Actions
   │
Docker
   │
Cloudflare
   │
CI/CD
   │
AI Coding
   │
Agent
```

---

## 📖 全书总结

本书从 Git 的诞生开始，逐步介绍：

- Git 原理
- Git 命令
- 分支管理
- Merge 与 Rebase
- GitHub 协作
- GitHub Actions
- Git 事故恢复
- AI 开发工作流

希望读者不仅能够熟练使用 Git，更能建立现代软件工程的思维方式。

---

## 后记

技术会不断变化。

今天流行的是 GitHub Actions，未来可能是新的平台；今天流行的是
ChatGPT、Codex，未来也会有新的 AI 工具。

但优秀工程师始终坚持的原则不会改变：

> **理解原理、保持规范、持续学习、善用工具。**

当你真正做到这些，工具会成为你的助力，而不是限制。
