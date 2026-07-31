---
outline: deep
---

# 第六章：Branch（分支）——Git 最强大的功能

> **如果说 Commit 让 Git 学会了记录历史，那么 Branch（分支）让 Git
> 真正具备了团队协作能力。**

---

## 本章知识地图

```text
Branch（分支）
├── 为什么需要分支
├── HEAD
├── 创建分支
├── 切换分支
├── 删除分支
├── Merge
├── Rebase（下一章）
├── Git Flow
├── GitHub Flow
└── Trunk-Based Development
```

---

## 本章目标

完成本章学习后，你将能够：

- 理解分支存在的意义
- 理解 HEAD 与 Branch 的关系
- 熟练创建、切换、删除分支
- 理解企业为什么不会直接在 main 上开发
- 建立规范的分支管理思维

---

## 一、为什么需要分支？

假设团队只有一个 `main` 分支。

```text
小王：开发登录
小李：开发支付
小张：修复 Bug

        │
        ▼
      main
```

所有人都直接修改 main。

会发生什么？

- 新功能和 Bug 修复混在一起
- 未完成功能提前发布
- 冲突越来越多
- 很难回滚

因此，Git 引入了 **Branch（分支）**。

---

## 二、什么是 Branch？

Branch 本质上就是：

> **指向某个 Commit 的一个可移动指针。**

例如：

```text
A ── B ── C
           ▲
         main
```

新增一次 Commit：

```text
A ── B ── C ── D
                ▲
              main
```

并不是创建了一个新仓库，而只是把指针移动到了新的 Commit。

**这也是 Git 创建分支几乎瞬间完成的原因。**

---

## 三、HEAD 是什么？

HEAD 表示：

> **当前所在的位置。**

例如：

```text
main
 │
 ▼
A ── B ── C
         ▲
        HEAD
```

切换到 `feature/login`：

```text
feature/login
      │
      ▼
A ── B ── C
         ▲
        HEAD
```

HEAD 永远跟随当前检出的分支。

---

## 四、创建与切换分支

创建：

```bash
git branch feature/login
```

切换：

```bash
git switch feature/login
```

创建并切换：

```bash
git switch -c feature/login
```

推荐优先使用 `git switch`，语义比 `git checkout` 更清晰。

危险指数：⭐☆☆☆☆

---

## 五、删除分支

合并完成后：

```bash
git branch -d feature/login
```

强制删除：

```bash
git branch -D feature/login
```

⚠️ 只有确认不再需要时才使用 `-D`。

危险指数：⭐⭐⭐⭐☆

---

## 六、企业开发流程

推荐流程：

```text
main
 │
 ├── feature/login
 ├── feature/order
 ├── feature/user
 └── hotfix/token
```

每个功能一个分支。

开发完成：

```text
Feature

↓

Pull Request

↓

Code Review

↓

Merge

↓

Delete Branch
```

这是目前最常见的团队协作方式。

---

## 七、三种主流分支模型

### Git Flow

适合：

- 大型项目
- 多版本维护

核心分支：

```text
main
develop
feature/*
release/*
hotfix/*
```

---

### GitHub Flow

适合：

- Web 项目
- 持续交付

流程：

```text
main

↓

feature

↓

PR

↓

Merge

↓

Deploy
```

---

### Trunk-Based Development

适合：

- 高频发布
- DevOps
- CI/CD

特点：

- 分支生命周期很短
- 每天多次合并

---

## 📦 最佳实践（Best Practice）

✅ 一个功能，一个分支。

例如：

```text
feature/login

feature/payment

feature/profile
```

不要：

```text
feature-all
```

把所有功能堆在一起。

---

## 🚨 事故案例（Case Study）

### 场景

开发者直接在 `main` 上开发了：

- 登录功能（未完成）
- 支付功能（未完成）

此时线上发现严重 Bug。

由于所有代码都在 main：

只能把未完成功能一起发布。

#### 正确做法

Bug：

```text
hotfix/token
```

新功能：

```text
feature/login
```

互不影响。

---

## 📖 企业规范（Enterprise Practice）

建议统一命名：

```text
feature/login
feature/order
bugfix/token
hotfix/payment
release/v1.2.0
```

避免：

```text
test
abc
new
```

这样的名称。

---

## 🧪 实验室（Lab）

```bash
git branch feature/login
git switch feature/login

echo "login" > login.txt

git add .
git commit -m "feat(login): add login"

git switch main

git branch
```

观察：

当前分支如何变化。

---

## 🧠 思考题

为什么 Git 创建分支几乎是瞬间完成？

提示：

思考：

Branch 保存的是：

- 文件？
- 仓库？
- 还是 Commit 指针？

---

## 面试官会怎么问？

**Q：Git 分支为什么创建这么快？**

答：

因为 Git 分支只是一个**指向 Commit 的引用**，并不会复制整个项目。

---

**Q：为什么企业不建议直接在 main 开发？**

答：

因为 main 应保持可发布状态，开发中的功能应隔离到独立分支，经过 Review
后再合并。

---

## 本章总结

牢记一句话：

> **Branch 不是复制代码，而是移动指针。**

正因为分支非常轻量，Git 才能够支撑现代团队的大规模协作。

---

## 下一章预告

**第七章：《Merge 与 Rebase——Git 合并的艺术》**

我们将彻底讲清：

- Merge 和 Rebase 的区别
- 为什么会产生冲突
- 如何解决冲突
- 什么情况下绝对不要 Rebase
- 企业开发中的最佳实践
