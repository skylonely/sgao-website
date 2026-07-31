---
outline: deep
---

# 第三章：Git 工作原理

> **一句话理解：**
>
> **一次 Git
> 提交，本质上是代码在工作区、暂存区和仓库之间的一次状态流转。**

---

## 🎯 学习目标

完成本章后，你将能够：

- 理解 Working Tree、Index、Repository 的职责
- 理解 `git add` 和 `git commit` 的真正作用
- 明白为什么 Git 要设计暂存区
- 能解释一次提交的完整流程

---

## 🚀 一分钟读懂

```text
编辑代码
   │
   ▼
Working Tree（工作区）
   │ git add
   ▼
Index（暂存区）
   │ git commit
   ▼
Repository（本地仓库）
   │ git push
   ▼
Remote Repository
```

---

## 📖 故事引入

很多初学者会问：

> 为什么修改了代码以后，还要先 `git add`，再 `git commit`？

为什么不能一步完成？

答案就在 **Index（暂存区）**。

它让开发者能够**选择本次真正要提交的内容**，而不是把所有修改一次性提交。

---

## 🏛️ 设计思想

Git 将一次开发拆分成三个阶段：

1. 编写代码
2. 确认本次需要提交的修改
3. 固化为历史

这种设计保证了：

- 提交更加精确
- 历史更加清晰
- 多个修改可以灵活组合

---

## 三个核心区域

### ① Working Tree（工作区）

工作区就是你正在编辑的代码目录。

特点：

- 修改立即生效
- Git 尚未记录
- 可随时继续编辑

---

### ② Index（暂存区）

暂存区是 Git 最容易被忽略、也是最重要的设计之一。

执行：

```bash
git add README.md
```

表示：

> 将 README.md 当前状态加入下一次提交计划。

它不是提交，只是**准备提交**。

---

### ③ Repository（本地仓库）

执行：

```bash
git commit -m "docs: update readme"
```

Git 会：

- 创建 Commit
- 保存历史
- 更新分支指针
- 移动 HEAD

至此，一次提交正式完成。

---

## 🔄 一次 Commit 到底发生了什么？

```text
修改 README.md
      │
      ▼
Working Tree
      │
git add
      ▼
Index
      │
git commit
      ▼
Commit Object
      │
更新 Branch
      │
移动 HEAD
```

---

## 🌍 真实开发案例

你正在开发登录模块：

已经完成：

- 登录页面
- 登录接口

但验证码功能还没写完。

这时可以：

```bash
git add login.vue
git add api/login.ts
git commit -m "feat: complete login"
```

验证码相关代码继续保留在工作区。

**暂存区让一次提交只包含一个完整功能。**

---

## 🏢 企业实践

团队通常要求：

- 一个 Commit 只完成一件事
- 提交前执行 `git diff --cached`
- Commit 保持独立、可回滚

这样后续 Review 和排查问题都会更加容易。

---

## ⚠️ 常见误区

❌ `git add` 就等于提交。

实际上：

它只是把修改放入暂存区。

---

❌ `git commit` 会提交所有修改。

实际上：

默认只提交暂存区中的内容。

---

## 🏆 Senior Tips

- 每次 Commit 前先执行：

```bash
git status
git diff --cached
```

确认真正要提交的内容。

- 一个 Commit 只做一件事情，比"大而全"的提交更容易维护。

---

## 🧪 Lab

依次执行：

```bash
echo A > demo.txt
git add demo.txt

echo B >> demo.txt

git status
```

观察：

为什么工作区和暂存区的状态不同？

再执行：

```bash
git add demo.txt
git commit -m "feat: demo"
```

理解 `git add` 的真正作用。

---

## 🔗 知识关联（Knowledge Link）

```text
第二章
Snapshot
Repository
Commit
      │
      ▼
第三章
Working Tree
Index
Repository
      │
      ▼
第四章
Blob
Tree
Commit Object
      │
      ▼
最终理解 Git Object Database
```

---

## ✅ 本章速查

**三个核心区域**

- Working Tree
- Index
- Repository

**三个关键命令**

```bash
git status
git add
git commit
```

**一句话总结**

> 工作区负责编辑，暂存区负责筛选，本地仓库负责记录历史。

---

## 🧠 思考题

如果 Git 没有暂存区，会对多人协作和 Commit 质量产生什么影响？

---

## 📚 延伸阅读

下一章：

**第四章：《Git 内部原理》**

我们将进入 Git 的对象数据库，理解：

- Blob
- Tree
- Commit Object
- Tag
- SHA-1 / SHA-256 哈希
