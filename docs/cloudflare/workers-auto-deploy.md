# Cloudflare Workers 双站点自动部署（导航站 + VitePress 知识库）

> **项目**：SGAO Knowledge Base
>
> **更新时间**：2026-07-27

本文记录同一个 GitHub 仓库同时部署两个独立网站的完整方案：

- `sgao.cc`：导航站
- `docs.sgao.cc`：VitePress 知识库

## 一、项目目标

实现下面的自动化流程：

```text
VS Code
   │
修改代码
   │
Commit
   │
Push
   │
GitHub（同一个仓库）
   │
Cloudflare Workers Builds
   │
自动构建并部署
   │
├── sgao.cc
└── docs.sgao.cc
```

最终目标：

- 一个 GitHub 仓库
- 两个独立的 Cloudflare Worker
- 两套独立的构建和部署命令
- 一个导航站 `sgao.cc`
- 一个知识库 `docs.sgao.cc`

## 二、项目架构

```text
GitHub（同一个仓库）
        │
        ├──────────────────┐
        │                  │
        ▼                  ▼
noisy-math-2b8d         sgao-docs
        │                  │
        ▼                  ▼
     sgao.cc          docs.sgao.cc
```

虽然代码放在同一个 GitHub 仓库，但导航站和知识库使用不同的 Worker、构建命令、输出目录和域名，因此可以独立部署，互不影响。

## 三、项目目录

```text
sgao-website/
├── app/
├── docs/
│   ├── .vitepress/
│   ├── cloudflare/
│   ├── github/
│   ├── docker/
│   ├── vscode/
│   ├── mac/
│   ├── ai/
│   └── index.md
├── dist-static/
├── worker/
├── package.json
├── wrangler.jsonc
└── wrangler.docs.jsonc
```

主要目录和文件：

| 路径                    | 用途                         |
| ----------------------- | ---------------------------- |
| `app/`                  | 导航站源代码                 |
| `docs/`                 | VitePress 知识库源文件       |
| `dist-static/`          | 导航站构建输出目录           |
| `docs/.vitepress/dist/` | 知识库构建输出目录           |
| `wrangler.jsonc`        | 导航站 Worker 配置           |
| `wrangler.docs.jsonc`   | 知识库 Worker 配置           |

## 四、环境准备

| 软件       | 用途                   |
| ---------- | ---------------------- |
| GitHub     | 代码托管               |
| Cloudflare | Worker、域名与自动部署 |
| SourceTree | Git 图形化管理         |
| Node.js    | 项目运行环境           |
| Wrangler   | Cloudflare CLI         |

建议先确认本地环境：

```bash
node -v
npm -v
npx wrangler --version
```

## 五、GitHub 仓库

仓库：

```text
skylonely/sgao-website
```

首次关联：

```bash
git remote add origin https://github.com/skylonely/sgao-website.git
git push -u origin main
```

> GitHub 已不支持使用账户密码进行 Git 操作，请使用 Personal Access Token（PAT）或 SSH。

## 六、package.json

导航站与知识库分别使用独立的开发、构建和预览命令：

```json
{
  "scripts": {
    "dev": "WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext dev",
    "build:static": "vite build --config vite.static.config.ts",
    "preview:static": "vite preview --config vite.static.config.ts",
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

对应关系：

| 站点   | 本地开发               | 构建                    | 本地预览                 |
| ------ | ---------------------- | ----------------------- | ------------------------ |
| 导航站 | `npm run dev`          | `npm run build:static`  | `npm run preview:static` |
| 知识库 | `npm run docs:dev`     | `npm run docs:build`    | `npm run docs:preview`   |

## 七、wrangler.jsonc（导航站）

导航站使用根目录中的 `wrangler.jsonc`：

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "noisy-math-2b8d",
  "main": "worker/index.ts",
  "compatibility_date": "2026-07-27",
  "assets": {
    "directory": "./dist-static",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash"
  }
}
```

关键配置：

- Worker 名称：`noisy-math-2b8d`
- 静态资源目录：`dist-static/`
- 对外域名：`sgao.cc`

手动部署命令：

```bash
npm run build:static
npx wrangler deploy
```

## 八、wrangler.docs.jsonc（知识库）

知识库使用独立配置文件 `wrangler.docs.jsonc`：

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "sgao-docs",
  "compatibility_date": "2026-07-27",
  "assets": {
    "directory": "./docs/.vitepress/dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

关键配置：

- Worker 名称：`sgao-docs`
- 静态资源目录：`docs/.vitepress/dist/`
- 对外域名：`docs.sgao.cc`

手动部署命令：

```bash
npm run docs:build
npx wrangler deploy --config wrangler.docs.jsonc
```

## 九、Cloudflare 自动部署配置

在 Cloudflare 控制台中，两个 Worker 都连接同一个 GitHub 仓库，但使用不同的构建和部署命令。

### 导航站

项目：

```text
noisy-math-2b8d
```

Git 配置：

| 配置项         | 内容                  |
| -------------- | --------------------- |
| Repository     | `sgao-website`        |
| Production 分支 | `main`                |
| Build Command  | `npm run build:static` |
| Deploy Command | `npx wrangler deploy` |

部署完成后访问：

```text
https://sgao.cc
```

### 知识库

项目：

```text
sgao-docs
```

Git 配置：

| 配置项         | 内容                                                  |
| -------------- | ----------------------------------------------------- |
| Repository     | `sgao-website`                                        |
| Production 分支 | `main`                                                |
| Build Command  | `npm run docs:build`                                  |
| Deploy Command | `npx wrangler deploy --config wrangler.docs.jsonc`    |

部署完成后访问：

```text
https://docs.sgao.cc
```

> 两个 Worker 可以连接同一个仓库。它们会分别执行自己的构建命令，并读取各自的 Wrangler 配置。

## 十、域名绑定

最终绑定关系：

| 域名           | Worker            | 用途             |
| -------------- | ----------------- | ---------------- |
| `sgao.cc`      | `noisy-math-2b8d` | 导航站           |
| `docs.sgao.cc` | `sgao-docs`       | VitePress 知识库 |

绑定步骤：

1. 打开 Cloudflare 控制台。
2. 进入对应的 Worker。
3. 打开 **Settings → Domains & Routes**。
4. 点击 **Add → Custom Domain**。
5. 为导航站绑定 `sgao.cc`。
6. 为知识库绑定 `docs.sgao.cc`。
7. 确认一个域名只绑定到一个正确的 Worker。

如果 `docs.sgao.cc` 曾经绑定到导航站 Worker，需要先从 `noisy-math-2b8d` 中移除，再绑定到 `sgao-docs`。

## 十一、日常自动部署流程

### 更新导航站

修改：

```text
app/
worker/
```

提交：

```bash
git add .
git commit -m "更新导航站"
git push
```

GitHub 更新后，Cloudflare 自动执行：

```text
npm run build:static
        ↓
npx wrangler deploy
        ↓
sgao.cc
```

### 更新知识库

新增或修改：

```text
docs/
```

提交：

```bash
git add .
git commit -m "新增知识库文档"
git push
```

GitHub 更新后，Cloudflare 自动执行：

```text
npm run docs:build
        ↓
npx wrangler deploy --config wrangler.docs.jsonc
        ↓
docs.sgao.cc
```

## 十二、SourceTree 工作流

以后更新网站时：

```text
修改代码
   ↓
检查文件
   ↓
Commit
   ↓
Push
   ↓
GitHub
   ↓
Cloudflare 自动部署
```

正常情况下，不需要每次都在 Cloudflare 控制台手动发布。

## 十三、本地开发与构建

### 导航站

开发：

```bash
npm run dev
```

构建：

```bash
npm run build:static
```

预览静态构建：

```bash
npm run preview:static
```

### 知识库

开发：

```bash
npm run docs:dev
```

构建：

```bash
npm run docs:build
```

预览构建结果：

```bash
npm run docs:preview
```

默认本地地址通常为：

```text
http://localhost:5173
```

如果端口已被占用，终端会显示实际使用的新端口。

## 十四、输出目录与 .gitignore

构建输出：

| 站点   | 输出目录                 |
| ------ | ------------------------ |
| 导航站 | `dist-static/`           |
| 知识库 | `docs/.vitepress/dist/`  |

建议 `.gitignore`：

```text
.vinext/
.wrangler/
dist-static/
work/

docs/.vitepress/dist
docs/.vitepress/cache
```

这些目录由开发或构建命令自动生成，不需要提交到 GitHub。

## 十五、知识库目录与首页

推荐知识库结构：

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

推荐首页内容：

```text
SGAO 知识库

记录每一次踩坑
沉淀每一次经验

Cloudflare
GitHub
Docker
VSCode
Mac
AI
```

## 十六、常见问题

### 为什么版本历史显示“已手动部署”？

因为该版本是通过 Cloudflare 控制台或 `wrangler deploy` 命令触发的，而不是由 GitHub 提交触发的自动构建。

检查下面几项：

1. Worker 是否已经连接正确的 GitHub 仓库。
2. Production 分支是否设置为 `main`。
3. Build Command 和 Deploy Command 是否填写正确。
4. 推送一次新的 Git commit，等待 Cloudflare 自动构建。

连接 Git 自动部署后，手动部署的旧版本仍会保留在历史记录中，这是正常现象。

### 为什么 `docs.sgao.cc` 和 `sgao.cc` 显示同一个页面？

通常是因为两个域名绑定到了同一个 Worker。

正确关系应当是：

```text
sgao.cc
   ↓
noisy-math-2b8d

docs.sgao.cc
   ↓
sgao-docs
```

处理方法：

1. 检查两个 Worker 的 **Domains & Routes**。
2. 从导航站 Worker 中移除 `docs.sgao.cc`。
3. 将 `docs.sgao.cc` 绑定到 `sgao-docs`。
4. 等待域名配置生效。
5. 强制刷新浏览器；如果仍显示旧页面，再清理浏览器缓存。

### 为什么要创建两个 Worker？

因为两个网站使用不同的：

- 构建命令
- 输出目录
- Wrangler 配置
- 域名
- 发布版本

使用两个 Worker 可以独立部署和回滚，也能避免修改知识库时影响导航站。

### 为什么本地正常，线上还是旧版本？

常见原因：

- 新代码没有 Commit 和 Push。
- Cloudflare 自动构建没有触发或构建失败。
- 部署命令使用了错误的 Wrangler 配置。
- 域名绑定到了旧 Worker。
- 浏览器或边缘节点仍在使用缓存。

建议先查看 Cloudflare 最新部署时间和构建日志，再使用无痕窗口确认是否属于浏览器缓存。

## 十七、方案优点与后续规划

当前方案的优点：

- 一个 GitHub 仓库
- 两个独立 Worker
- 两个独立域名
- 自动部署
- 导航站与知识库互不影响
- 维护简单
- 扩展方便

后续还可以继续增加独立站点：

| 域名             | 用途       |
| ---------------- | ---------- |
| `blog.sgao.cc`   | 博客       |
| `api.sgao.cc`    | API 服务   |
| `status.sgao.cc` | 服务状态页 |
| `img.sgao.cc`    | 图片资源   |
| `demo.sgao.cc`   | 示例项目   |

整个网站可以逐步形成统一的子域名体系。

## 十八、经验总结

完成后的结构：

```text
sgao.cc
├── 首页
├── AI
├── 工具
└── 知识库入口

docs.sgao.cc
├── Cloudflare
├── GitHub
├── Docker
├── VSCode
├── Mac
└── AI
```

完成清单：

- GitHub 仓库关联完成
- 导航站 Worker 自动部署完成
- 知识库 Worker 自动部署完成
- VitePress 知识库搭建完成
- 两个域名分别绑定到正确的 Worker

以后只需要修改对应目录、Commit 并 Push，Cloudflare 就会自动构建和发布。
