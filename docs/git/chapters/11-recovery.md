---
outline: deep
---

# 第十一章：Git 实战与事故恢复

> **一句话理解：**
>
> **Git 最强大的能力不是"提交代码"，而是"恢复代码"。**

---

## 🎯 学习目标（Learning Outcomes）

学完本章，你将能够：

- 区分 `reset`、`restore`、`revert` 的使用场景
- 熟练使用 `stash`、`reflog`、`cherry-pick`
- 独立处理常见 Git 事故
- 建立安全的 Git 操作习惯

---

## 🏗️ 架构图（Architecture）

```text
Git Accident

      │
      ▼

发现问题
      │
      ▼

判断事故类型
      │
      ├── 文件恢复
      ├── Commit恢复
      ├── Branch恢复
      └── 远程恢复
      │
      ▼

选择工具
restore
reset
revert
stash
reflog
cherry-pick
```

---

## 🏛️ 设计思想（Design Philosophy）

Git 的设计目标之一就是：

> **尽量让错误可以恢复。**

因此，大多数"删除"其实只是改变引用，而不是立即删除对象。

这也是为什么很多 Git 事故都可以挽回。

---

## 一、Git 的三种"撤销"

### git restore

适用：

- 放弃工作区修改
- 恢复某个文件

```bash
git restore README.md
```

✅ 推荐场景：

刚改坏一个文件，还没有提交。

---

### git reset

作用：

移动 HEAD。

常见模式：

```bash
git reset --soft HEAD~1
git reset --mixed HEAD~1
git reset --hard HEAD~1
```

| 模式 | Commit | 暂存区 | 工作区 |
| --- | --- | --- | --- |
| soft | 回退 | 保留 | 保留 |
| mixed | 回退 | 清除 | 保留 |
| hard | 回退 | 清除 | 清除 |

⚠️ `--hard` 风险最高。

---

### git revert

不是删除历史。

而是：

> **新增一次反向 Commit。**

```bash
git revert HEAD
```

适用于：

已经 Push 到公共仓库的提交。

---

## 🧭 决策指南（Decision Guide）

| 场景 | 推荐命令 |
| --- | --- |
| 修改未提交，想放弃 | `restore` |
| 最近一次提交有问题，未 Push | `reset --soft` |
| 已 Push，需要撤销 | `revert` |
| 临时保存修改 | `stash` |
| 恢复误删提交 | `reflog` |
| 复制某个 Commit | `cherry-pick` |

---

## 二、stash —— 临时保险箱

开发到一半：

领导要求：

立即修 Bug。

可以：

```bash
git stash
```

处理 Bug：

```bash
git switch hotfix/login
```

回来继续：

```bash
git stash pop
```

推荐：

不要长期保存大量 Stash。

---

## 三、reflog —— Git 的"后悔药"

一句话：

> **只要 Commit 还在 reflog 中，就有机会恢复。**

查看：

```bash
git reflog
```

恢复：

```bash
git reset --hard HEAD@{3}
```

很多误删 Commit 都可以通过 reflog 找回。

---

## 四、cherry-pick

适合：

把某一次提交复制到另一个分支。

```bash
git cherry-pick <commit-id>
```

典型场景：

Bug 修复：

需要同时同步到：

- main
- release

无需重新开发。

---

## 🚨 真实事故复盘（Postmortem）

### 事故一：误执行 reset --hard

#### 场景

开发一天后：

```bash
git reset --hard HEAD~1
```

所有未提交修改消失。

#### 排查

- 是否已 Commit？
- 是否还有 Stash？
- reflog 是否仍存在？

#### 恢复

优先：

```bash
git reflog
```

找到正确 Commit。

---

### 事故二：push --force 覆盖团队代码

#### 场景

```bash
git push --force
```

覆盖公共分支。

#### 影响

- 同事无法 Push
- CI 失败
- 提交历史混乱

#### 正确做法

优先使用：

```bash
git push --force-with-lease
```

它会检查远程是否已变化，更安全。

---

### 事故三：误删分支

删除：

```bash
git branch -D feature/login
```

恢复：

```bash
git reflog
git branch feature/login <commit-id>
```

只要 Commit 还在，就能恢复。

---

## 🏢 企业实践（Enterprise Practice）

建议：

- 主分支禁止 Force Push
- 开启 Branch Protection
- 每次大改先建分支
- Merge 前同步 main
- 定期清理已合并分支

---

## 💡 常见误区（Common Mistakes）

❌ 已 Push 还使用 reset

应使用：

```bash
git revert
```

---

❌ 长时间不提交

Commit 越小：

恢复越容易。

---

❌ 依赖 stash 保存几个月

Stash：

只是临时工具。

---

## 🏆 Senior Tips

✔ Commit 要小而频繁

✔ 不要害怕 Commit

✔ 大改之前：

```bash
git switch -c backup/temp
```

✔ 遇到事故：

不要连续执行命令。

先：

```bash
git status
git log
git reflog
```

确认现场。

---

## 🧪 实验室（Lab）

创建三个 Commit：

```bash
echo A > test.txt
git add .
git commit -m "A"

echo B >> test.txt
git commit -am "B"

echo C >> test.txt
git commit -am "C"
```

然后：

```bash
git reset --hard HEAD~1
git reflog
```

尝试恢复。

---

## 🧠 思考题

为什么 Git 能恢复很多"删除"操作？

提示：

思考：

Commit 是否真的立即被删除？

---

## 面试官会怎么问？

**Q：reset、restore、revert 最大区别？**

参考回答：

- restore：恢复文件。
- reset：移动 HEAD。
- revert：新增一次反向提交，不改写历史。

---

**Q：reflog 为什么重要？**

答：

因为它记录了 HEAD 的移动历史，是恢复误操作的重要依据。

---

## 📚 延伸阅读（Further Reading）

推荐继续学习：

- Git 官方《Reset Demystified》
- Interactive Rebase
- Git Bisect
- Git Hooks
- Git LFS

---

## 本章总结

真正优秀的 Git 工程师，并不是从不犯错。

而是：

> **知道如何安全地恢复每一次错误。**

---

## 下一章预告

**第十二章：《Git 最佳实践与 AI 开发工作流》**

我们将总结整个 Git 体系，并结合
ChatGPT、Codex、CI/CD、Cloudflare、Docker，构建一套完整的现代开发工作流。
