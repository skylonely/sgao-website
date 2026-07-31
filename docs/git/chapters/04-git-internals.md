---
outline: deep
---

# 第四章：Git 内部原理（Object、Blob、Tree、Commit）

> **从这一章开始，我们真正进入 Git 的核心。**
>
> 理解 Git Object 后，你会发现 Git
> 并不是一个"保存文件"的工具，而是一个基于内容寻址（Content-addressable）的对象数据库。

---

## 本章目标

阅读完本章，你将理解：

- Git Object 是什么
- Blob、Tree、Commit、Tag 的作用
- Hash 为什么如此重要
- Git 为什么不会重复保存相同内容
- Commit 为什么能形成完整历史

---

## 1. Git 为什么这么可靠？

很多数据库依赖：

```text
文件名
```

Git 不一样。

Git 更关心：

```text
文件内容
```

也就是说：

> **Git 使用"内容"来识别对象，而不是文件名。**

因此：

```text
README.md

Hello Git
```

和

```text
abc.txt

Hello Git
```

在 Git 看来：

内容相同。

对象就是同一个。

---

## 2. 什么是 Git Object？

Git 的所有数据最终都会保存成 Object（对象）。

Git 一共有四种对象：

| Object | 作用 |
| --- | --- |
| Blob | 保存文件内容 |
| Tree | 保存目录结构 |
| Commit | 保存一次提交 |
| Tag | 保存标签 |

可以理解为：

```text
Blob
    ↑
Tree
    ↑
Commit
    ↑
Tag
```

---

## 3. Blob（文件对象）

Blob（Binary Large Object）保存：

> **文件内容。**

例如：

```text
README.md

Hello Git
```

Git 会生成：

```text
Blob
```

Blob：

不知道：

- 文件名
- 所在目录

它只知道：

```text
内容
```

因此：

相同内容：

只保存一次。

---

## 4. Tree（目录对象）

Blob 不知道目录。

Tree 负责组织目录。

例如：

```text
project
│
├── README.md
└── src
    └── App.vue
```

Git：

会生成：

```text
Tree

↓

Blob(README)

↓

Tree(src)

↓

Blob(App.vue)
```

Tree：

描述：

整个目录结构。

---

## 5. Commit（提交对象）

Commit：

不是：

代码。

Commit：

保存的是：

```text
作者

时间

提交说明

父 Commit

Tree
```

关系如下：

```text
Commit

↓

Tree

↓

Blob
```

所以：

Commit：

实际上：

记录：

> **某一时刻整个项目的快照。**

---

## 6. Tag（标签）

Tag：

就是：

给某个 Commit 起一个名字。

例如：

```text
Commit A

↓

Commit B

↓

Commit C

↓

v1.0
```

以后：

直接：

```bash
git checkout v1.0
```

即可回到：

发布版本。

---

## 7. Hash 到底是什么？

Git 中：

每个 Object：

都会生成一个唯一 Hash。

例如：

```text
3f4d2eb2...
```

Hash 来源于：

对象内容。

这意味着：

如果内容变化：

Hash：

一定变化。

因此：

Git 能快速发现：

哪些内容：

发生了修改。

---

## 8. 为什么 Git 不重复保存？

假设：

```text
README.md

Hello Git
```

连续：

Commit：

100 次。

但是：

内容：

没变化。

Git：

不会：

保存：

100 份。

而是：

引用：

同一个 Blob。

因此：

Git：

速度快。

空间占用：

也很小。

---

## 9. Commit 为什么能形成历史？

每个 Commit：

都会保存：

```text
Parent Commit
```

例如：

```text
Commit A

↓

Commit B

↓

Commit C
```

实际上：

就是：

```text
C

↓

Parent

↓

B

↓

Parent

↓

A
```

因此：

Git：

可以：

一直：

向前：

追溯。

---

## 10. Object Database

所有对象：

最终：

都保存在：

```text
.git/objects
```

里面。

如果打开：

可以看到：

很多：

两级目录：

```text
.git

└── objects
    ├── 1a
    ├── 2b
    ├── 8f
    └── ...
```

这里：

保存着：

整个 Git 世界。

---

## Mermaid：Git Object 关系图

```text
flowchart TD

Commit --> Tree

Tree --> Blob1[Blob README]

Tree --> Tree2[src]

Tree2 --> Blob2[Blob App.vue]
```

---

## 实验室（Lab）

初始化：

```bash
git init
```

创建文件：

```bash
echo "Hello Git" > README.md
```

提交：

```bash
git add .
git commit -m "first"
```

查看对象：

```bash
ls .git/objects
```

再修改：

```bash
echo "Hello Git" >> README.md
```

再次提交：

```bash
git add .
git commit -m "second"
```

再次查看：

```bash
ls .git/objects
```

观察：

对象数量：

如何增加。

---

## 面试官会怎么问？

#### Q1：Git 为什么速度快？

答：

因为：

- 大多数操作本地完成
- 使用 Object Database
- 使用 Hash 快速定位对象
- 相同内容不会重复保存

---

#### Q2：Git 保存的是文件还是快照？

答：

Git 保存的是：

> **整个项目在某一时刻的快照。**

---

#### Q3：Blob 保存什么？

答：

Blob：

只保存：

文件内容。

不知道：

文件名。

也不知道：

目录。

---

## 本章总结

Git 的底层可以概括为：

```text
Blob
│
保存内容

↓

Tree
│
组织目录

↓

Commit
│
保存历史

↓

Tag
│
标记版本
```

整个 Git 仓库，本质就是一套由 Object 组成的内容数据库。

---

## ⚠️ 常见误区

- Blob 不保存文件名。
- Commit 不直接保存代码，而是引用 Tree。
- 相同内容不会生成多个 Blob。

---

## 🚀 推荐实践

- 不必死记 Hash，但要理解它为何存在。
- 理解 Object 后，再学习 Branch 和 Merge 会容易很多。
- 可以亲自查看 `.git/objects`，感受 Git 真正保存了什么。

---

## 下一章预告

**第五章：《Git 常用命令（开发实战）》**

我们将从真实开发流程出发，系统学习：

- git init
- git clone
- git status
- git add
- git commit
- git log
- git diff
- git restore
- git rm
- git mv

并结合多个开发案例讲解它们的最佳实践。
