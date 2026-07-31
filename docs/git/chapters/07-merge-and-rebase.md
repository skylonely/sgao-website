---
outline: deep
---

# 第七章：Merge 与 Rebase——Git 合并的艺术

> **一句话理解：**
>
> **Merge 保留历史，Rebase 重写历史。**
>
> 两者没有绝对的优劣，关键在于使用场景。

---

## 本章知识地图

```text
代码合并
├── Merge
│   ├── Fast-forward
│   └── Three-way Merge
├── Rebase
├── 冲突解决
├── Merge vs Rebase
└── 企业最佳实践
```

---

## 本章目标

学习完成后，你将能够：

- 理解 Merge 与 Rebase 的本质区别
- 理解为什么会发生冲突
- 独立解决合并冲突
- 知道什么时候该 Merge、什么时候该 Rebase
- 避免改写公共历史造成团队事故

---

## 一、为什么需要代码合并？

假设两位开发者同时工作：

```text
main
 │
 ├── feature/login
 └── feature/order
```

登录功能完成后，需要回到 `main`。

支付功能完成后，也要回到 `main`。

于是就出现了：

> **代码合并（Merge）。**

---

## 二、Merge 是什么？

一句话：

> **Merge 会保留两条开发历史，并生成一个新的 Merge
> Commit（大多数情况下）。**

示意图：

```text
A──B──C────────M
    \         /
     D──E────F
```

这里的 `M` 就是 Merge Commit。

---

## 三、Fast-forward Merge

如果主分支没有新的提交：

```text
A──B──C (main)
        \
         D──E (feature)
```

执行 Merge 后：

```text
A──B──C──D──E (main)
```

没有新的 Merge Commit。

这种方式叫：

**Fast-forward Merge。**

优点：

- 历史简单
- 提交记录整洁

---

## 四、Three-way Merge

如果两个分支都发生了变化：

```text
      D──E
     /
A──B──C
     \
      F──G
```

Git 无法直接移动指针。

于是：

创建：

```text
      D──E
     /     \
A──B──C─────M
     \     /
      F──G
```

这就是 Three-way Merge。

---

## 五、Rebase 是什么？

一句话：

> **Rebase 会把你的提交"重新放到"另一个分支之后。**

例如：

原来：

```text
A──B──C(main)

 \
  D──E(feature)
```

执行：

```bash
git rebase main
```

结果：

```text
A──B──C──D'──E'
```

注意：

`D'` 和 `E'` 是新的 Commit。

这就是：

> **改写历史。**

---

## 六、Merge vs Rebase

| 对比项 | Merge | Rebase |
| --- | --- | --- |
| 保留历史 | ✅ | ❌（改写） |
| 提交记录 | 分叉 | 更线性 |
| 是否生成 Merge Commit | 大多数情况会 | 不会 |
| 风险 | 较低 | 较高 |

---

## 七、为什么会发生冲突？

两个人同时修改：

```text
src/Login.vue
```

例如：

小王：

```text
登录按钮：蓝色
```

小李：

```text
登录按钮：绿色
```

Git：

不知道：

应该保留哪一个。

于是：

出现：

```text
<<<<<<< HEAD
蓝色
=======
绿色
>>>>>>> feature
```

这就是：

Merge Conflict。

---

## 八、如何解决冲突？

步骤：

1.  打开冲突文件
2.  手工修改
3.  删除冲突标记
4.  保存
5.  git add
6.  git commit

完成。

---

## 🚨 事故案例

### 场景

开发者：

```bash
git rebase main
git push --force
```

直接推送公共分支。

结果：

团队其他成员：

全部：

无法继续 Push。

#### 原因

Rebase：

修改了 Commit Hash。

公共历史：

发生变化。

---

## 📦 最佳实践

推荐：

- 个人功能分支可以 Rebase
- 公共分支优先 Merge
- 合并前先同步 main
- Pull Request 后再 Merge

---

## 📖 企业规范

很多团队：

Feature：

```text
feature/login
```

开发期间：

经常：

```bash
git fetch
git rebase origin/main
```

保持：

分支：

最新。

最终：

通过：

Pull Request

Merge。

---

## 错误示范 vs 正确示范

❌ 错误：

```text
多人同时修改 main
```

✅ 正确：

```text
feature

↓

PR

↓

Review

↓

Merge
```

---

## 🧪 实验室（Lab）

```bash
git checkout -b feature/demo

echo demo > demo.txt

git add .
git commit -m "feat: demo"

git switch main

git merge feature/demo
```

尝试：

```bash
git log --graph --oneline
```

观察：

Merge 后：

历史变化。

---

## 🧠 思考题

为什么：

Rebase：

会产生新的 Commit Hash？

提示：

Commit 中包含：

父 Commit 信息。

---

## 面试官会怎么问？

**Q：Merge 和 Rebase 有什么区别？**

参考回答：

- Merge 保留完整开发历史，更安全。
- Rebase 会重写提交历史，使提交记录更线性，但不能随意用于公共分支。

---

**Q：什么时候不要使用 Rebase？**

答：

> **不要对已经共享给团队的公共分支执行 Rebase。**

因为会改写历史，影响其他开发者。

---

## 本章总结

牢记一句话：

> **Merge 保留历史，Rebase 整理历史。**

团队开发中：

- 功能开发可以适当 Rebase。
- 合并到主分支通常通过 Pull Request + Merge 完成。

---

## AI 时代开发建议

AI 生成代码后：

```text
ChatGPT / Codex
      │
修改代码
      │
Feature Branch
      │
人工 Review
      │
Pull Request
      │
Merge
```

不要直接让 AI 在 `main` 分支持续修改代码。

---

## 下一章预告

**第八章：《Git Flow——企业级 Git 工作流》**

我们将深入介绍：

- Git Flow
- GitHub Flow
- Trunk-Based Development
- 如何选择适合团队的分支策略
- 企业级开发流程实践
