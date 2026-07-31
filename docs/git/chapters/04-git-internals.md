---
outline: deep
---

# 第四章：Git 内部原理

> **一句话理解：**
>
> **Git
> 并不是把代码"放进仓库"，而是把代码转换成一个个对象（Object），再用引用把它们组织成完整的历史。**

---

## 🎯 学习目标

阅读本章后，你将能够：

- 理解 Git Object Database 的组成
- 掌握 Blob、Tree、Commit、Tag 的作用
- 理解 Hash 在 Git 中的意义
- 明白一次 `git commit` 在底层到底发生了什么
- 为理解 Branch、Merge、Rebase 打下基础

---

## 🚀 一分钟读懂

```text
文件
 │
 ▼
Blob
 │
 ▼
Tree
 │
 ▼
Commit
 │
 ▼
Branch → HEAD
```

Git 的历史，本质上就是一张由对象和引用组成的有向图。

---

## 📖 故事引入

很多人执行了几千次：

```bash
git commit
```

却不知道 Git 到底保存了什么。

实际上，Git 从来不会直接保存"项目"。

它保存的是一系列对象（Object），然后把这些对象连接起来。

---

## 🏛️ 设计思想

Git 采用 **Content Addressable Storage（内容寻址存储）**。

核心思想：

- 相同内容只保存一次
- 每个对象都有唯一 Hash
- 对象不可修改，只能新增
- 历史通过引用连接，而不是覆盖

因此 Git 可以同时做到：

- 高性能
- 节省空间
- 保证完整性
- 支持历史恢复

---

## Git Object Database

```text
.git/
└── objects/
    ├── Blob
    ├── Tree
    ├── Commit
    └── Tag
```

所有 Git 历史最终都会存放到 Object Database。

---

## Blob：保存文件内容

Blob 只关心：

> 文件内容。

它不知道：

- 文件名
- 所在目录
- 创建时间

相同内容会得到相同 Hash。

---

## Tree：保存目录结构

Tree 负责记录：

- 文件名
- 子目录
- Blob 引用
- Tree 引用

可以理解为：

> 一个目录快照。

---

## Commit：保存一次历史

Commit 不直接保存文件。

它保存：

- Tree 的 Hash
- Parent Commit
- 作者
- 时间
- 提交说明

因此 Commit 更像是：

> 指向一次项目状态的说明书。

---

## Tag：保存版本

Tag 用于标记重要节点，例如：

```text
v1.0
v3.0
v3.0
```

企业发布版本时通常都会打 Tag。

---

## 🔄 一次 Commit 的完整过程

```text
修改文件
    │
    ▼
Blob
    │
生成 Tree
    │
生成 Commit
    │
更新 Branch
    │
移动 HEAD
```

每一次 Commit 都会创建新的对象，而不是覆盖旧对象。

---

## Hash 为什么重要？

每个对象都有唯一 Hash。

例如：

```text
9daeafb9864cf43055ae93beb0afd6c7d144bfa4
```

Hash 的作用：

- 唯一标识对象
- 检测数据完整性
- 建立对象之间的引用关系

任何内容发生变化，Hash 都会改变。

---

## 🌍 动手观察 Git 对象

查看最新 Commit：

```bash
git rev-parse HEAD
```

查看 Commit 内容：

```bash
git cat-file -p HEAD
```

查看目录结构：

```bash
git ls-tree HEAD
```

计算文件 Hash：

```bash
git hash-object README.md
```

这些命令可以帮助你真正看到 Git 的底层对象。

---

## 🏢 企业实践

大型项目通常：

- Commit 保持小而独立
- 使用 Tag 管理发布版本
- 不直接修改历史对象
- 使用 Branch 引用不同开发线

对象不可变，使 Git 的历史更加可靠。

---

## ⚠️ 常见误区

❌ Commit 保存所有文件副本。

实际上：

Commit 只是引用 Tree。

---

❌ Blob 保存文件名。

实际上：

Blob 只保存内容。

文件名属于 Tree。

---

## 🏆 Senior Tips

- 理解 Object，比记住命令更重要。
- Branch 只是 Commit 的一个引用。
- HEAD 只是当前引用的位置。

理解这一点，后续学习 Merge 和 Rebase 会轻松很多。

---

## 🧪 Lab

执行：

```bash
git rev-parse HEAD
git cat-file -p HEAD
git ls-tree HEAD
```

观察：

- Commit 中记录了什么？
- Tree 中记录了什么？
- Blob 与 Tree 有什么区别？

---

## 🔗 知识关联

```text
第三章
Working Tree
Index
Repository
      │
      ▼
第四章
Blob
Tree
Commit
Tag
Hash
      │
      ▼
第五章
git add
git commit
git status
git diff
```

---

## ✅ 本章速查

**四种对象**

- Blob
- Tree
- Commit
- Tag

**四个关键词**

- Hash
- Object
- Reference
- Immutable（不可变）

**一句话总结**

Git 的历史是对象的集合，Branch 和 HEAD 只是这些对象的引用。

---

## 🧠 思考题

为什么 Git 不直接修改已有 Commit，而是始终创建新的 Commit？

提示：

思考：

- 历史完整性
- 数据一致性
- 多人协作

---

## 📚 延伸阅读

下一章：

**第五章：《Git 常用命令》**

届时你会发现：

每一个 Git 命令，本质上都是在操作本章介绍的这些对象和引用。
