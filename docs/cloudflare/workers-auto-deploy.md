# Cloudflare Workers + GitHub 自动部署（完整教程）

> **项目**：SGAO Docs
> **更新时间**：2026-07-27

---

# 一、项目目标

实现如下自动化流程：

```text
VS Code
   │
修改代码
   │
Commit
   │
Push
   │
GitHub
   │
Cloudflare Workers Builds
   │
自动部署
   │
https://sgao.cc
```

最终目标：

- 一个 GitHub 仓库
- 一个 Cloudflare Worker
- 一个自动部署流程
- 一个主页（sgao.cc）
- 一个文档站（document.sgao.cc）

---

# 二、环境准备

| 软件       | 用途           |
| ---------- | -------------- |
| GitHub     | 代码托管       |
| Cloudflare | Worker 与部署  |
| SourceTree | Git 图形管理   |
| Node.js    | 运行环境       |
| Wrangler   | Cloudflare CLI |

---

# 三、GitHub 仓库

仓库：

```text
skylonely/sgao-website
```

首次关联：

```bash
git remote add origin https://github.com/skylonely/sgao-website.git
git push -u origin main
```

> GitHub 已不支持密码登录，请使用 Personal Access Token（PAT）。

---

# 四、Cloudflare 自动部署

Workers → Git 存储库

配置：

- Repository：`sgao-website`
- Branch：`main`
- Build Command：

```bash
npm run build
```

- Deploy Command：

```bash
npx wrangler deploy
```

---

# 五、SourceTree 工作流

以后更新网站：

```text
修改代码
   ↓
Commit
   ↓
Push
   ↓
Cloudflare 自动部署
```

无需再手动部署。

---

# 六、建议 .gitignore

```text
.vinext/
.wrangler/
dist-static/
work/

docs/.vitepress/dist
docs/.vitepress/cache
```

---

# 七、搭建 document.sgao.cc

推荐结构：

```text
docs/
├── index.md
├── cloudflare/
│   ├── index.md
│   └── workers-auto-deploy.md
├── github/
├── docker/
├── vscode/
├── mac/
└── ai/
```

---

# 八、推荐首页

```text
SGAO Docs

我的个人知识库

记录技术 · 沉淀经验 · 持续分享

Cloudflare
GitHub
Docker
VSCode
Mac
AI
```

---

# 九、后续规划

网站：

```text
sgao.cc
├── 首页
├── AI
├── 工具
└── 文档入口
```

文档：

```text
document.sgao.cc
├── Cloudflare
├── GitHub
├── Docker
├── VSCode
├── Mac
└── AI
```

---

# 十、经验总结

✅ GitHub 自动部署完成

✅ Cloudflare Workers 自动部署完成

✅ VitePress 初始化完成

✅ SGAO Docs 文档站已搭建

下一步：

1. 导入第一篇文档
2. 配置导航栏
3. 配置侧边栏
4. 绑定 document.sgao.cc
