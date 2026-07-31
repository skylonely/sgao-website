---
outline: deep
---

# 第三章：Git 工作原理（核心篇）

> **如果第二章帮助你理解 Git 是什么，那么这一章将解释 Git
> 是如何工作的。**

---

## 本章目标

阅读完本章，你将理解：

- Git 的四个核心区域
- `git add` 到底做了什么
- `git commit` 内部发生了什么
- HEAD 是什么
- 为什么 Git 能快速比较版本
- 为什么 Git 能恢复历史版本

---

## 1. Git 的四个核心区域

Git 的工作流程围绕四个区域展开：

```text
Working Tree
     │
 git add
     ▼
Staging Area(Index)
     │
git commit
     ▼
Local Repository
     │
 git push
     ▼
Remote Repository(GitHub)
```

四个区域分别是：

| 区域 | 作用 |
| --- | --- |
| Working Tree | 正在编辑的代码 |
| Staging Area（Index） | 即将提交的内容 |
| Local Repository | 本地提交历史 |
| Remote Repository | GitHub 等远程仓库 |

牢记这张图，后面所有 Git 命令都围绕它展开。

---

## 2. Working Tree（工作区）

工作区就是你正在修改的项目目录。

例如：

```text
project/
├── src/
├── package.json
└── README.md
```

当你修改 `App.vue` 时，变化首先只存在于工作区。

此时执行：

```bash
git status
```

Git 会告诉你：

```text
modified: src/App.vue
```

说明修改还没有进入版本历史。

---

## 3. git add 到底做了什么？

很多教程说：

> git add 就是"添加文件"。

其实并不准确。

更准确的说法是：

> **git add 是把当前文件状态写入暂存区（Index）。**

流程如下：

```text
修改 App.vue
      │
      ▼
Working Tree
      │
 git add App.vue
      ▼
Staging Area
```

这意味着：

- 可以暂存部分文件
- 可以多次 add
- 可以继续修改工作区

---

## 4. Staging Area（暂存区）

暂存区是 Git 最有特色的设计之一。

假设今天修改了三个文件：

```text
App.vue
Login.vue
README.md
```

但是今天只想提交登录功能：

```bash
git add Login.vue
git commit -m "feat: add login page"
```

另外两个文件仍留在工作区。

因此：

> **暂存区的意义，是让一次 Commit 更加精确。**

---

## 5. git commit 内部发生了什么？

执行：

```bash
git commit -m "feat: add login"
```

Git 会依次完成：

```text
读取暂存区
      │
生成快照
      │
创建 Commit 对象
      │
记录作者
      │
记录时间
      │
记录提交说明
      │
移动当前分支指针
```

一次 Commit 完成后，新的历史版本就诞生了。

---

## 6. HEAD 是什么？

HEAD 可以理解为：

> **当前所在的位置。**

例如：

```text
main
  │
  ▼
Commit C ← HEAD
```

新的 Commit 会继续向前移动：

```text
Commit A

↓

Commit B

↓

Commit C

↓

Commit D ← HEAD
```

HEAD 永远指向当前检出的提交。

---

## 7. 为什么 Git 能快速比较版本？

Git 并不是每次都重新扫描整个项目。

它会利用：

- 哈希值（Hash）
- 对象数据库（Object Database）
- 索引（Index）

快速判断哪些文件发生了变化。

因此：

```bash
git diff
git status
git log
```

通常都非常快。

---

## 8. 一次完整的开发流程

下面是一位开发者最典型的一天：

```text
修改代码
   │
git status
   │
git add
   │
git status
   │
git commit
   │
git log
   │
git push
```

这是最经典的 Git 工作流。

---

## Mermaid 流程图

```text
flowchart LR
A[Working Tree] -->|git add| B[Index / Staging Area]
B -->|git commit| C[Local Repository]
C -->|git push| D[GitHub]
D -->|git pull| C
```

---

## 本章总结

Git 的核心流程可以概括为：

```text
修改代码
   │
Working Tree
   │
git add
   ▼
Index
   │
git commit
   ▼
Repository
   │
git push
   ▼
Remote Repository
```

理解这张图，比记住几十个命令更重要。

---

## ⚠️ 常见误区

**误区一：**

`git add` 会提交代码。

❌ 不会。

它只是放入暂存区。

---

**误区二：**

`git commit` 会上传 GitHub。

❌ 不会。

Commit 仍然只保存在本地。

---

**误区三：**

所有修改都会一起提交。

❌ 不一定。

只有进入暂存区的内容才会参与 Commit。

---

## 🚀 推荐实践

- 提交前先执行 `git status`
- 每个 Commit 只完成一件事情
- 经常使用 `git diff` 检查修改
- 不要养成一次提交大量无关改动的习惯

---

## 下一章预告

**第四章：《Git 内部原理》**

我们将继续深入：

- Blob
- Tree
- Commit Object
- Hash
- Object Database
- 为什么 Git 几乎不会损坏数据
- Git 为什么能做到如此高效
