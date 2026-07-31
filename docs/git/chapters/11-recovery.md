---
outline: deep
---

# 第十一章：Git 实战与事故恢复

> **一句话理解：**
>
> **Git
> 最重要的价值之一，不是避免错误，而是在错误发生后能够快速、安全地恢复。**

---

## 🎯 学习目标

完成本章后，你将能够：

- 理解 `restore`、`reset`、`revert` 的区别
- 掌握 `reflog` 的恢复能力
- 学会使用 `stash` 暂存未完成工作
- 使用 `cherry-pick` 精准迁移提交
- 面对常见 Git 事故时快速恢复

---

## 🚀 一分钟读懂

```text
误删文件
    │
restore

提交错了
    │
reset / revert

分支丢了
    │
reflog

临时切需求
    │
stash

迁移提交
    │
cherry-pick
```

---

## 📖 故事引入

周五晚上，开发完成准备下班。

突然发现：

- 提交到了错误分支
- `reset --hard` 之后代码没了
- 不小心删除了分支
- `push --force` 覆盖了远程历史

这些都是团队开发中真实发生过的事故。

Git 提供了一整套恢复工具，但前提是知道什么时候使用哪一种。

---

## 🏛️ 恢复工具总览

| 场景 | 推荐命令 |
| --- | --- |
| 恢复工作区文件 | `git restore` |
| 回退本地提交 | `git reset` |
| 撤销已发布提交 | `git revert` |
| 找回历史 | `git reflog` |
| 暂存现场 | `git stash` |
| 迁移提交 | `git cherry-pick` |

---

## 🔄 git restore

恢复工作区文件：

```bash
git restore README.md
```

适用：

- 修改尚未提交
- 放弃本地改动

不会影响已经存在的 Commit。

---

## ⏪ git reset

回退本地历史：

```bash
git reset --soft HEAD~1
git reset --mixed HEAD~1
git reset --hard HEAD~1
```

区别：

- **soft**：保留暂存区和工作区
- **mixed**（默认）：保留工作区
- **hard**：工作区、暂存区一起回退

> ⚠️ `--hard` 前请确认没有需要保留的修改。

---

## ↩️ git revert

撤销已经共享的提交：

```bash
git revert <commit>
```

特点：

- 不改写历史
- 新建一个"反向提交"
- 适合公共分支

---

## 🧭 git reflog

Git 的"后悔药"。

查看 HEAD 历史：

```bash
git reflog
```

恢复：

```bash
git reset --hard HEAD@{3}
```

> ⚠️ 该命令会同步覆盖工作区和暂存区。执行前先用 `git status` 确认当前修改已提交或备份，并核对目标记录。

即使分支删除、Reset 后，也常常可以借助 reflog 找回。

---

## 📦 git stash

临时保存未完成修改：

```bash
git stash
git switch hotfix
...
git switch feature/login
git stash pop
```

适用：

- 紧急修复线上问题
- 中途切换任务

---

## 🎯 git cherry-pick

把指定 Commit 应用到当前分支：

```bash
git cherry-pick <commit>
```

适用：

- Bug 修复迁移
- 多版本维护
- 不需要合并整个分支

---

## 🌍 真实事故案例

### 案例一：误执行 reset --hard

现象：

```bash
git reset --hard HEAD~1
```

发现代码消失。

恢复步骤：

1. `git reflog`
2. 找到丢失 Commit
3. `git reset --hard <hash>`

---

### 案例二：提交到了 main

处理：

```bash
git branch feature/login
git switch feature/login
```

再根据情况重置 main。

---

### 案例三：误删分支

```bash
git branch -D feature/login
```

恢复：

```bash
git reflog
git checkout -b feature/login <commit>
```

---

## 🏢 企业实践

建议：

- 不直接对公共分支执行 `reset --hard`
- 已 Push 的提交优先使用 `revert`
- 公共分支禁止直接使用 `push --force`；确需改写历史时，应经过团队确认并优先使用 `--force-with-lease`
- 重要发布前打 Tag

---

## ⚠️ 常见误区

❌ `reset` 和 `revert` 一样。

实际上：

- `reset` 修改历史
- `revert` 保留历史

---

❌ 删除分支意味着数据永久丢失。

很多情况下仍可通过 `reflog` 找回。

---

## 🏆 Senior Tips

恢复前先问自己三个问题：

1. 修改是否已经 Push？
2. 是否有人基于这段历史开发？
3. 是否必须改写历史？

如果答案不确定，优先使用 `revert`。

---

## 🧪 Lab

尝试：

```bash
git stash
git stash list
git stash pop

git reflog

git cherry-pick <commit>
```

记录每条命令对历史的影响。

---

## 🔗 知识关联

```text
第十章
CI/CD
Workflow
      │
      ▼
第十一章
restore
reset
revert
reflog
stash
cherry-pick
      │
      ▼
第十二章
AI 工程实践
最佳实践
```

---

## ✅ 本章速查

| 问题 | 工具 |
| --- | --- |
| 放弃未提交修改 | restore |
| 回退本地提交 | reset |
| 撤销已发布提交 | revert |
| 找回历史 | reflog |
| 临时保存 | stash |
| 精准迁移 | cherry-pick |

**一句话总结：**

Git 不怕犯错，关键是理解每一种恢复工具的边界。

---

## 🧠 思考题

为什么很多团队规定：

> 已经推送到公共仓库的历史，优先使用 `git revert`，而不是 `git reset`？

请结合团队协作和历史一致性进行分析。

---

## 📚 下一章预告

**第十二章：《AI 时代 Git 最佳实践》**

我们将把前十一章内容串联起来，构建一套从需求、AI 辅助开发、Code
Review、CI/CD 到部署上线的现代软件工程工作流。
