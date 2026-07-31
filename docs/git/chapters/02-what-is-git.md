---
outline: deep
---

# 第二章：Git 到底是什么？

> **很多人认为 Git 是"保存代码"的工具，其实并不准确。**
>
> Git 的本质是：**一个快照数据库（Snapshot Database）+
> 一个内容寻址对象库（Content-addressable Object Store）+
> 一套引用管理机制（Reference System）。**

---

## 本章目标

读完本章，你将理解：

- Git 的真正本质
- Repository 是什么
- 为什么 Git 速度快
- 为什么 Git 不容易丢数据
- 为什么 Git 不是简单的文件管理工具

---

## 1. Git 并不是网盘

很多初学者认为：

```text
Git = 保存文件
```

实际上：

```text
Git ≠ 保存文件

Git = 保存每一次项目的完整快照
```

Git 关心的是**项目在某一时刻的状态**，而不仅仅是单个文件。

---

## 2. 什么是 Repository（仓库）

Repository（简称 Repo）就是 Git 管理项目的地方。

一个仓库中包含：

```text
project/
│
├── 工作目录（Working Tree）
├── .git/
└── 项目文件
```

真正重要的是 `.git` 目录。

它保存了：

- 所有历史版本
- 提交记录
- 分支
- 标签
- 配置
- 对象数据库

可以说：

> **没有 `.git`，就没有 Git 仓库。**

---

## 3. Git 的核心思想：快照（Snapshot）

很多版本控制工具保存的是：

```text
版本1 → 修改 → 版本2 → 修改 → 版本3
```

Git 更像是：

```text
提交1
┌────────────┐
│项目完整状态│
└────────────┘

提交2
┌────────────┐
│项目完整状态│
└────────────┘

提交3
┌────────────┐
│项目完整状态│
└────────────┘
```

每一次 Commit，都代表项目在当时的完整状态。

如果文件没有变化，Git 会复用已有对象，而不是重复存储。

---

## 4. Git 为什么这么快？

Git 大多数操作都发生在本地。

例如：

```text
git log
git diff
git branch
git commit
```

这些命令无需联网。

因为完整历史已经保存在本地仓库。

只有：

```text
git push
git pull
git fetch
```

才需要与远程仓库通信。

---

## 5. Git 的三大工作区域

理解 Git，必须理解这三个区域：

```text
Working Tree
      │
   git add
      ▼
 Staging Area
      │
 git commit
      ▼
 Repository
```

它们分别表示：

- **Working Tree（工作区）**：正在编辑的文件。
- **Staging Area（暂存区）**：准备提交的内容。
- **Repository（本地仓库）**：已经提交保存的历史。

这也是为什么：

```bash
git add
git commit
```

要分成两步。

---

## 6. 为什么要有暂存区？

很多人都会问：

> 为什么不能直接 Commit？

原因是：

你可以只提交一部分修改。

例如：

今天修改了：

- 登录页面
- README
- CSS

但是：

只想提交登录功能。

那么：

```bash
git add src/login.vue

git commit -m "feat: add login page"
```

README 和 CSS 可以留到下一次提交。

这也是 Git 非常灵活的地方。

---

## 7. Git 为什么不容易丢数据？

Git 中每个对象都有唯一的哈希值。

例如：

```text
3f4d2e...
```

只要对象仍然存在，就可以通过历史记录恢复。

很多看似"删除"的内容，其实仍然保留在对象数据库中，直到垃圾回收。

这也是 Git 数据可靠的重要原因。

---

## 8. 一次 Commit 到底发生了什么？

当执行：

```bash
git commit
```

Git 会：

```text
读取暂存区
      │
生成新的快照
      │
创建 Commit 对象
      │
记录作者、时间、说明
      │
移动当前分支指针
```

这就是一次完整的提交。

---

## 本章总结

请记住三个核心观点：

1.  Git 保存的是**快照**，不是简单的文件。
2.  `.git` 是整个仓库最重要的目录。
3.  Git 的核心流程是：

```text
工作区
   │
git add
   ▼
暂存区
   │
git commit
   ▼
本地仓库
```

理解这三个概念，后续学习 Branch、Merge、Rebase 都会容易很多。

---

## ⚠️ 常见误区

**误区一：删除 .git 不影响项目。**

删除 `.git` 后，项目文件仍然存在，但所有版本历史都会丢失。

---

**误区二：Commit 会上传到 GitHub。**

不会。

Commit 只保存在本地。

只有执行：

```bash
git push
```

才会同步到远程仓库。

---

## 🚀 推荐实践

- 不要把 `.git` 当作普通文件夹删除。
- 每次 Commit 前先使用 `git status` 检查状态。
- 学会理解工作区、暂存区和本地仓库，它们是 Git 最重要的三个概念。

---

## 下一章预告

**第三章：《Git 工作原理》**

我们将深入理解：

- `git add` 到底做了什么？
- `git commit` 内部发生了什么？
- 为什么 Git 能快速比较版本？
- HEAD、Index、Repository 如何协同工作？
