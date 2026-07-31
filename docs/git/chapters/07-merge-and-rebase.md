---
outline: deep
---

# 第七章：Merge 与 Rebase

> **一句话理解：**
>
> **Merge 保留分支历史，Rebase
> 重塑分支历史。两者都能完成代码整合，但适用场景不同。**

---

## 🎯 学习目标

完成本章后，你将能够：

- 理解 Merge 与 Rebase 的工作原理
- 区分 Fast-Forward Merge 与 Three-Way Merge
- 理解为什么会发生冲突
- 掌握冲突解决流程
- 根据团队规范选择 Merge 或 Rebase

---

## 🚀 一分钟读懂

```text
feature
   │
   ├────────── Merge ───────► 保留分叉历史
   │
   └────────── Rebase ──────► 重写提交历史
```

---

## 📖 故事引入

两位开发者同时基于 `main` 开发：

- 小王：登录功能
- 小李：支付功能

几天后，两人都准备合并。

此时就会遇到 Git 最经典的问题：

> **如何把两条开发线重新汇合？**

答案就是 Merge 或 Rebase。

---

## 🏛️ Merge 的设计思想

Merge 的目标是：

> **完整保留历史。**

示意图：

```text
A──B──C────────────main
     \
      D──E────────feature

Merge 后：

A──B──C──────────────M
     \              /
      D────────E───
```

其中 `M` 是 Merge Commit。

特点：

- 保留真实开发过程
- 不修改已有历史
- 更适合多人协作

---

## 🚄 Fast-Forward Merge

如果主分支没有新的提交：

```text
A──B──C──feature
        ▲
      main
```

执行 Merge 后：

```text
A──B──C
        ▲
     main、feature
```

没有 Merge Commit，仅移动分支引用。

---

## 🌿 Three-Way Merge

如果双方都产生了新的 Commit：

```text
A──B──C────main
     \
      D──E──feature
```

Git 会创建新的 Merge Commit。

这是团队开发中最常见的情况。

---

## 🔄 Rebase 的设计思想

Rebase 的目标是：

> **让历史保持线性。**

执行前：

```text
A──B──C────main
     \
      D──E──feature
```

执行：

```bash
git rebase main
```

执行后：

```text
A──B──C──D'──E'
```

Git 会把 Feature 分支上的提交重新应用到最新的 Main 后面。

注意：

`D'`、`E'` 是新的 Commit。

---

## ⚔️ Merge vs Rebase

| 对比 | Merge | Rebase |
| --- | --- | --- |
| 修改历史 | ❌ | ✅ |
| 保留分叉 | ✅ | ❌ |
| 历史是否线性 | 一般 | 是 |
| 多人协作 | 推荐 | 谨慎 |
| Code Review | 更直观 | 更整洁 |

---

## 💥 为什么会发生冲突？

冲突并不是 Git 出错。

而是：

> **Git 无法自动判断应该保留哪一份修改。**

例如：

两个人同时修改：

```text
README.md 第 10 行
```

Git 无法决定谁是正确的。

需要开发者人工处理。

---

## 🛠️ 冲突处理流程

```text
Merge / Rebase
      │
      ▼
Conflict
      │
      ▼
手动修改代码
      │
git add
      │
git merge --continue
或
git rebase --continue
```

---

## 🏢 企业实践

建议：

- 功能开发完成后，先同步最新 `main`
- 小分支可以使用 Rebase 保持历史整洁
- 已经共享给团队的公共分支不要随意 Rebase
- 主分支合并优先通过 Pull Request 完成

---

## ⚠️ 常见误区

❌ Rebase 更高级，因此应该一直使用。

实际上：

Merge 与 Rebase 没有高低之分，关键在于场景。

---

❌ 冲突意味着 Git 损坏了。

实际上：

冲突说明 Git 无法替你做业务决策。

---

## 🏆 Senior Tips

团队中可以遵循一个简单原则：

- **本地分支**：可以 Rebase，整理历史。
- **共享分支**：尽量不要 Rebase，避免影响其他成员。
- **主分支**：通过 Pull Request 合并，保留审查记录。

---

## 🧪 Lab

创建两个分支并分别修改同一文件：

```bash
git switch -c feature/a
# 修改 README

git switch main
git switch -c feature/b
# 修改 README

git merge feature/a
```

观察冲突提示，尝试解决后继续完成合并。

随后重新创建分支，再尝试：

```bash
git rebase main
```

比较 Merge 与 Rebase 后的历史。

---

## 🔗 知识关联

```text
第六章
Branch
HEAD
Reference
      │
      ▼
第七章
Merge
Fast-Forward
Three-Way
Rebase
Conflict
      │
      ▼
第八章
Git Flow
GitHub Flow
Trunk-Based Development
```

---

## ✅ 本章速查

**Merge**

- 保留历史
- 安全
- 推荐团队协作

**Rebase**

- 历史整洁
- 会改写 Commit
- 谨慎用于共享分支

**一句话总结**

Merge 关注真实历史，Rebase 关注整洁历史。

---

## 🧠 思考题

为什么很多团队规定：

> **不要对已经 Push 到远程、且其他成员正在使用的分支执行 Rebase？**

请结合 Commit Hash、历史改写和团队协作进行思考。

---

## 📚 下一章预告

**第八章：《Git 工作流与团队协作》**

我们将比较：

- Git Flow
- GitHub Flow
- Trunk-Based Development

并结合 AI Coding 时代，讨论哪种工作流更适合现代团队。
