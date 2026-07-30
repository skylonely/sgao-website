# 🌐 sgao-website

`sgao-website` 是 SGAO Platform 的主站与知识库项目，包含网址导航、VitePress 文档站和 Cloudflare Worker 部署配置。

## 在线服务

| 地址 | 用途 |
| --- | --- |
| [sgao.cc](https://sgao.cc) | 主站与网址导航 |
| [docs.sgao.cc](https://docs.sgao.cc) | SGAO 知识库 |
| [img.sgao.cc](https://img.sgao.cc) | 图片中心与 CDN |

完整说明参见 [SGAO Platform 架构](https://docs.sgao.cc/guide/platform-architecture)。

## 技术栈

- Next.js、React、TypeScript
- vinext、Vite
- VitePress
- Cloudflare Workers、Cloudflare R2
- Wrangler

## 项目结构

```text
sgao-website/
├── app/                    # 主站页面与组件
├── docs/                   # VitePress 知识库
│   ├── .vitepress/         # 文档站配置与主题
│   ├── cloudflare/         # Cloudflare 实践文档
│   ├── guide/              # 平台架构与写作规范
│   └── index.md            # 知识库首页
├── public/                 # 主站静态资源
├── worker/                 # 主站 Cloudflare Worker 入口
├── package.json            # 依赖与脚本
├── wrangler.jsonc          # 主站 Worker 配置
└── wrangler.docs.jsonc     # 知识库 Worker 配置
```

## 本地开发

安装依赖：

```bash
npm install
```

启动主站：

```bash
npm run dev
```

启动知识库：

```bash
npm run docs:dev
```

## 构建验证

构建主站：

```bash
npm run build
```

构建知识库：

```bash
npm run docs:build
```

## 部署

主站和知识库使用不同的 Worker，可以独立部署。

部署主站：

```bash
npm run build
npx wrangler deploy
```

部署知识库：

```bash
npm run docs:build
npx wrangler deploy --config wrangler.docs.jsonc
```

详细流程参见 [Cloudflare Workers 双站点自动部署](https://docs.sgao.cc/cloudflare/workers-auto-deploy)。

## 相关项目

- [sgao-image-center](https://github.com/skylonely/sgao-image-center)：图片中心 Worker、上传后台和 API
- [sgao-images](https://github.com/skylonely/sgao-images)：可选图片备份与资源仓库

## 文档维护

新增文档前请阅读 [文档写作规范](https://docs.sgao.cc/guide/writing-standard)。知识库只展示已有实际内容的页面，暂不使用只有标题或“后续补充”的占位文档。
