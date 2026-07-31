---
outline: deep
---

# 第五章：Git 常用命令（开发实战篇）

> **这一章不只是教命令，而是教你在真实开发中什么时候用、为什么用。**

---

## 本章知识地图

```text
Git 命令体系

初始化
├── git init
└── git clone

查看状态
├── git status
├── git diff
└── git log

提交
├── git add
├── git commit
└── git restore

文件操作
├── git mv
└── git rm

同步
├── git fetch
├── git pull
└── git push
```

---

## 本章目标

学习完成后，你能够：

- 独立完成一个 Git 开发流程
- 理解每条命令存在的原因
- 知道哪些命令危险、哪些命令安全
- 建立每天开发的 Git 使用习惯

---

## 一、初始化项目

### git init

**作用：** 将普通目录变成 Git 仓库。

```bash
git init
```

#### 为什么会有这个命令？

Git 需要创建 `.git` 目录，用来保存对象数据库、提交历史、分支信息等。

#### 开发场景

新建一个前端项目：

```bash
mkdir vue-demo
cd vue-demo
git init
```

危险指数：⭐☆☆☆☆（安全）

---

### git clone

**作用：** 从远程仓库复制一个完整仓库。

```bash
git clone https://github.com/user/project.git
```

#### 开发场景

加入团队项目时，第一步通常就是 `git clone`。

危险指数：⭐☆☆☆☆（安全）

---

## 二、查看状态

### git status

这是开发过程中最常用的命令。

```bash
git status
```

#### 为什么需要它？

任何提交之前，都建议先确认：

- 哪些文件修改了？
- 哪些已经进入暂存区？
- 当前位于哪个分支？

#### 开发建议

一天可能执行几十次 `git status`，它应该成为肌肉记忆。

危险指数：⭐☆☆☆☆

---

### git diff

查看尚未提交的修改。

```bash
git diff
```

#### 开发场景

AI 帮你生成了一段代码。

提交前：

```bash
git diff
```

认真阅读每一处变化。

危险指数：⭐☆☆☆☆

---

### git log

查看提交历史。

```bash
git log --oneline
```

常用参数：

```bash
git log --graph --oneline --decorate
```

可以更直观地查看提交关系。

危险指数：⭐☆☆☆☆

---

## 三、提交代码

### git add

```bash
git add .
```

#### 为什么不是直接 commit？

因为 Git 引入了**暂存区**。

你可以：

```bash
git add src/Login.vue
```

只提交登录功能，而不是整个项目。

危险指数：⭐☆☆☆☆

---

### git commit

```bash
git commit -m "feat(login): add login page"
```

#### 推荐提交规范

```text
feat: 新功能
fix: 修复 Bug
docs: 文档
style: 样式
refactor: 重构
test: 测试
chore: 维护
```

危险指数：⭐☆☆☆☆

---

## 四、恢复修改

### git restore

恢复工作区修改：

```bash
git restore README.md
```

恢复暂存区：

```bash
git restore --staged README.md
```

#### 开发场景

修改了一堆内容，发现方向错了，可以恢复。

⚠️ 注意：

恢复后，未提交的修改可能无法找回。

危险指数：⭐⭐⭐☆☆

---

## 五、文件操作

### git mv

移动文件并保留历史。

```bash
git mv old.js new.js
```

危险指数：⭐☆☆☆☆

---

### git rm

删除文件。

```bash
git rm test.js
```

如果只是删除工作区文件，不希望 Git 跟踪：

```bash
git rm --cached test.js
```

危险指数：⭐⭐⭐☆☆

---

## 六、同步远程仓库

### git fetch

获取远程更新，但**不会自动合并**。

```bash
git fetch
```

适合先查看远程变化。

危险指数：⭐☆☆☆☆

---

### git pull

拉取并合并远程代码。

```bash
git pull origin main
```

开发前建议先执行，减少冲突。

危险指数：⭐⭐☆☆☆

---

### git push

上传本地提交。

```bash
git push origin main
```

#### 开发建议

不要未经 Review 就直接推送到生产主分支。

危险指数：⭐⭐☆☆☆

---

## 七、一天开发流程（推荐）

```text
开始工作
   │
git pull
   │
开发代码
   │
git status
   │
git diff
   │
git add
   │
git commit
   │
git push
结束工作
```

---

## AI 时代 Git 工作流

```text
ChatGPT / Codex
        │
生成代码
        │
git diff（人工 Review）
        │
本地运行测试
        │
git add
        │
git commit
        │
git push
```

> **原则：永远不要未经检查就提交 AI 生成的代码。**

---

## 实验室（Lab）

```bash
mkdir git-lab
cd git-lab
git init

echo "Hello Git" > README.md

git status
git add README.md
git status
git commit -m "docs: first commit"
git log --oneline
```

观察每一步状态变化。

---

## 面试官会怎么问？

**Q：git fetch 和 git pull 有什么区别？**

答：

- `git fetch`：只获取远程更新，不合并。
- `git pull`：获取更新并尝试合并到当前分支。

---

## 本章总结

真正高频使用的命令其实只有十几个：

- git init
- git clone
- git status
- git diff
- git add
- git commit
- git log
- git restore
- git fetch
- git pull
- git push

熟练掌握它们，就足以完成绝大多数日常开发工作。

---

## 下一章预告

**第六章：《Branch（分支）——Git 最强大的功能》**

我们将深入讲解：

- 为什么需要分支？
- main、develop、feature 有什么区别？
- 如何创建、切换、删除分支？
- 企业项目为什么几乎不会直接在 main 上开发？
