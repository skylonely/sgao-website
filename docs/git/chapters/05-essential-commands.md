---
outline: deep
---

# 第五章：Git 常用命令与开发实践

> **一句话理解：**
>
> **Git 命令不是独立存在的，每一个命令都对应着 Git
> 底层对象和状态的变化。**

---

## 🎯 学习目标

完成本章后，你将能够：

- 掌握最常用 Git 命令
- 理解每个命令为什么存在
- 建立完整的日常开发流程
- 编写高质量 Commit
- 避免常见操作失误

---

## 🚀 一分钟读懂

```text
开始开发
    │
git pull
    │
git switch -c feature/login
    │
编写代码
    │
git status
    │
git diff
    │
git add
    │
git commit
    │
git push
    │
Pull Request
```

---

## 📖 故事引入

假设今天需要开发一个登录功能。

正确的流程不是一上来就 `git commit`，而是按开发节奏组织每一步操作。

理解流程，比记住命令更重要。

---

## 🏛️ 设计思想

Git 的命令可以分为四类：

| 类型 | 目标 |
| --- | --- |
| 查看状态 | 了解当前发生了什么 |
| 组织修改 | 决定哪些内容进入本次提交 |
| 记录历史 | 创建新的 Commit |
| 协作同步 | 与远程仓库共享历史 |

---

## 🌍 一天的真实开发流程

### ① 同步最新代码

```bash
git pull
```

**为什么存在？**

确保本地基于最新代码开发，减少冲突。

---

### ② 创建功能分支

```bash
git switch -c feature/login
```

**为什么存在？**

一个功能一个分支，降低风险。

---

### ③ 查看状态

```bash
git status
```

这是使用频率最高的 Git 命令。

作用：

- 查看修改
- 查看暂存区
- 查看当前分支

> 💡 建议每次提交前都执行一次。

---

### ④ 查看差异

```bash
git diff
```

查看工作区修改。

查看暂存区：

```bash
git diff --cached
```

**为什么存在？**

提交前先检查，避免误提交。

---

### ⑤ 添加到暂存区

```bash
git add login.vue
```

或者：

```bash
git add .
```

**为什么存在？**

决定本次 Commit 包含哪些修改。

---

### ⑥ 创建 Commit

```bash
git commit -m "feat: add login page"
```

Commit 应该：

- 小
- 独立
- 可回滚

---

### ⑦ 推送远程

```bash
git push origin feature/login
```

随后创建 Pull Request。

---

## 📦 Commit Message 规范

推荐采用 Conventional Commits：

| 类型 | 用途 |
| --- | --- |
| feat | 新功能 |
| fix | 修复 Bug |
| docs | 文档 |
| refactor | 重构 |
| test | 测试 |
| chore | 工程维护 |
| ci | CI/CD |

例如：

```bash
git commit -m "fix: resolve login timeout"
```

---

## 🏢 企业实践

建议团队统一：

- 一个功能一个 Branch
- 一个 Commit 一件事
- Push 前执行 `git diff`
- Commit Message 保持一致
- 所有修改通过 Pull Request 合并

---

## ⚠️ 常见误区

❌ 不看 `git status` 就提交

容易遗漏文件。

---

❌ 一个 Commit 包含多个功能

后续 Review 和回滚都会变得困难。

---

❌ 直接在 main 分支开发

应始终使用 Feature Branch。

---

## 🏆 Senior Tips

每次提交前执行：

```bash
git status
git diff --cached
```

问自己两个问题：

1. 这次 Commit 是否只完成一件事？
2. 如果明天需要回滚，我是否愿意只撤销这一次提交？

如果答案都是"是"，通常说明 Commit 质量不错。

---

## 🧪 Lab

模拟一次开发：

```bash
git switch -c feature/demo

echo "demo" > demo.txt

git status
git diff

git add demo.txt

git diff --cached

git commit -m "feat: add demo"

git log --oneline
```

观察：

每一步命令如何影响 Git 状态。

---

## 🔗 知识关联

```text
第四章
Blob
Tree
Commit
Hash
      │
      ▼
第五章
status
diff
add
commit
push
      │
      ▼
第六章
Branch
HEAD
switch
merge
```

---

## ✅ 本章速查

**每日开发流程**

```text
Pull
 ↓
Branch
 ↓
Code
 ↓
Status
 ↓
Diff
 ↓
Add
 ↓
Commit
 ↓
Push
```

**一句话总结**

Git 命令真正管理的是代码状态，而不是代码本身。

---

## 🧠 思考题

为什么优秀团队会要求：

- 小 Commit
- 高频 Commit
- 清晰 Commit Message

这些要求会如何影响后续 Review、回滚和协作？

---

## 📚 下一章预告

**第六章：《Branch 与分支管理》**

理解 Branch、HEAD 和引用，你会发现：

> Branch 并不是代码副本，而只是一个指向 Commit 的指针。
