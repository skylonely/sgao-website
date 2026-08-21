# 🌐 sgao-website

`sgao-website` 是 SGAO Platform 的主站与内容站点项目，包含网址导航、知识库、旅行站、Todo 站和 Cloudflare Worker 部署配置。

## 在线服务

| 地址 | 用途 |
| --- | --- |
| [sgao.cc](https://sgao.cc) | 主站与网址导航 |
| [docs.sgao.cc](https://docs.sgao.cc) | SGAO 知识库 |
| [travel.sgao.cc](https://travel.sgao.cc) | 旅行计划、行程攻略与出发清单 |
| [todo.sgao.cc](https://todo.sgao.cc) | 个人待办与分类清单 |
| [img.sgao.cc](https://img.sgao.cc) | 图片中心与 CDN |

完整说明参见 [SGAO Platform 架构](https://docs.sgao.cc/guide/platform-architecture)。

## 近期文档更新

- [Docker + Kubernetes 云原生专题](https://docs.sgao.cc/cloud-native/)（2026-08-11～2026-08-12）：共 50 章，从容器与 Docker 基础逐步延伸到 Kubernetes 工作负载、网络存储、安全治理、GitOps、可观测性、多集群和故障排查。
- [系统架构设计师专题](https://docs.sgao.cc/ruankao/system-architect/)（2026-08-08～2026-08-10）：新增“案例分析二”第 12～151 篇，覆盖云原生、分布式系统、企业架构、数据治理及 AI Agent 等案例，并提供专题冲刺总结。
- [沈阳・丹东・大连旅行专题](https://travel.sgao.cc/shenyang-dandong-dalian/)（2026-08-06～2026-08-07）：整理 6 日 5 晚行程攻略、城市路线和出发准备清单，并通过独立的 VitePress 旅行站发布。

## 文档目录

| 专题 | 内容说明 | 源文件 |
| --- | --- | --- |
| 云原生 | Docker、容器工程实践与 Kubernetes 生产运维 | [`docs/cloud-native/`](docs/cloud-native/) |
| 系统架构设计师 | 软考基础知识、案例分析、真题、练习与总结 | [`docs/ruankao/system-architect/`](docs/ruankao/system-architect/) |
| 旅行 | 行程概览、详细攻略与准备清单 | [`docs/travel/`](docs/travel/) |
| Cloudflare | 域名、DNS、Workers、R2 与多站点部署实践 | [`docs/cloudflare/`](docs/cloudflare/) |
| Git | Git 原理、命令、协作、CI/CD 与恢复实践 | [`docs/git/`](docs/git/) |
| AI | API、CLI、Prompt、MCP、Skill 与 Agent 基础 | [`docs/ai/`](docs/ai/) |

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
│   ├── ai/                 # AI 基础文档
│   ├── cloud-native/       # Docker 与 Kubernetes 云原生专题
│   ├── cloudflare/         # Cloudflare 实践文档
│   ├── git/                # Git 系列专栏
│   ├── guide/              # 平台架构与写作规范
│   ├── ruankao/            # 系统架构设计师专题
│   ├── travel/             # 旅行站内容源文件
│   ├── todo/               # Todo 站内容源文件
│   └── index.md            # 知识库首页
├── public/                 # 主站静态资源
├── travel/                 # 独立旅行站的 VitePress 配置
├── todo/                   # 独立 Todo 站的 VitePress 配置与 Worker
├── worker/                 # 主站 Cloudflare Worker 入口
├── package.json            # 依赖与脚本
├── wrangler.jsonc          # 主站 Worker 配置
├── wrangler.docs.jsonc     # 知识库 Worker 配置
└── wrangler.todo.jsonc     # Todo Worker 配置
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

test: verify GitHub contributions
