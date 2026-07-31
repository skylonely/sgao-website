---
outline: deep
---

# 第六章：Branch 与分支管理

> **一句话理解：**
>
> **Git 分支不是代码副本，而是指向 Commit
> 的一个可移动引用（Reference）。**

---

## 🎯 学习目标

完成本章后，你将能够：

- 理解 Branch、HEAD、Reference 的关系
- 理解为什么 Git 创建分支几乎是瞬间完成
- 掌握 `git branch`、`git switch` 的使用场景
- 建立分支管理最佳实践
- 为 Merge、Rebase 打下基础

---

## 🚀 一分钟读懂

```text
main
 │
 ▼
A ──► B ──► C
            ▲
          HEAD

创建 feature 分支

main
 │
 ▼
A ──► B ──► C
            ▲
         feature
            ▲
          HEAD
```

创建分支时，没有复制任何代码，只新增了一个引用。

---

## 📖 故事引入

你要开发一个登录功能。

如果直接修改 `main` 分支，一旦功能未完成或出现问题，就可能影响其他成员。

正确做法：

```bash
git switch -c feature/login
```

从这一刻开始，你的开发与 `main` 隔离，直到功能完成再合并。

---

## 🏛️ 为什么 Git 的分支这么快？

很多版本控制系统创建分支时，会复制一份完整代码。

Git 不会。

Git 只是新增一个指向当前 Commit 的引用：

```text
main ─────┐
feature ──┘
          │
          ▼
       Commit C
```

因此：

- 创建速度极快
- 几乎不占额外空间
- 可以放心大量使用分支

---

## 🌳 HEAD 是什么？

HEAD 表示：

> **当前所在的位置。**

例如：

```text
main
 │
 ▼
A ──► B ──► C
            ▲
          HEAD
```

切换分支：

```bash
git switch feature/login
```

HEAD 将指向：

```text
feature/login
     ▲
    HEAD
```

后续 Commit 都会追加到当前分支。

---

## 🔄 新提交后发生了什么？

假设：

```text
main
 │
 ▼
A ──► B ──► C
            ▲
         feature
            ▲
          HEAD
```

执行：

```bash
git commit -m "feat: login"
```

结果：

```text
main
 │
 ▼
A ──► B ──► C
                 \
                  D
                  ▲
               feature
                  ▲
                HEAD
```

真正移动的是 **feature 分支引用**，不是历史记录。

---

## 📌 常用命令

创建分支：

```bash
git branch feature/login
```

创建并切换：

```bash
git switch -c feature/login
```

查看分支：

```bash
git branch
```

切换分支：

```bash
git switch main
```

删除已合并分支：

```bash
git branch -d feature/login
```

---

## 🏢 企业实践

推荐命名规范：

```text
main
develop
feature/login
feature/order
bugfix/payment
hotfix/v3.1.1
release/v2.1
```

建议：

- 一个需求一个分支
- 不直接提交到 main
- 使用 Pull Request 合并
- 合并后及时删除功能分支

---

## ⚠️ 常见误区

❌ Branch 会复制整个项目。

实际上：

Branch 只是一个引用。

---

❌ HEAD 等于当前 Commit。

实际上：

HEAD 通常指向当前分支，再由分支指向最新 Commit。

---

❌ 一个分支开发多个需求。

建议保持"一分支一功能"，方便评审和回滚。

---

## 🏆 Senior Tips

优秀团队通常保持：

- 功能分支生命周期尽量短
- 每天同步主分支
- 尽早提交、尽早合并
- 避免长期存在的大分支

这样能有效降低合并冲突。

---

## 🧪 Lab

执行：

```bash
git switch -c feature/demo
echo "branch" > demo.txt
git add .
git commit -m "feat: demo branch"

git log --oneline --graph --decorate --all
```

观察：

- HEAD 在哪里？
- feature 指向哪个 Commit？
- main 是否发生变化？

---

## 🔗 知识关联

```text
第五章
status
add
commit
      │
      ▼
第六章
Branch
HEAD
Reference
switch
      │
      ▼
第七章
Merge
Fast-Forward
Three-Way Merge
Rebase
```

---

## ✅ 本章速查

**核心概念**

- Branch = 引用
- HEAD = 当前工作位置
- Commit = 历史节点

**一句话总结**

Git 分支之所以轻量，是因为它移动的是引用，而不是复制代码。

---

## 🧠 思考题

为什么 Git 鼓励：

- 一个需求一个分支？
- 一个功能一个 Pull Request？

思考它们如何降低团队协作成本。

---

## 📚 下一章预告

**第七章：《Merge 与 Rebase》**

你将理解：

- Fast-Forward Merge
- Three-Way Merge
- Rebase 的工作原理
- 如何选择 Merge 还是 Rebase
