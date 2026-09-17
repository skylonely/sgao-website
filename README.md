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

### 主站账号与导航同步

主站复用 `api.sgao.cc/api/v1/account/*` 的 Cloudflare Access 登录，仅同步收藏、自定义网站和分类。首次登录须明确选择合并本机数据或使用云端；访问足迹、搜索和显示偏好不会上传，也不与 Todo 清单混用。

修改先保存在本机，联网后自动提交；页面可见时每 10 秒检查云端更新，重新聚焦和联网时也会检查。版本冲突会暂停自动覆盖，等待用户选择合并或使用云端。替换本机导航前保存一份可下载的备份；导入这种导航备份不影响本机访问足迹。清空本机数据会暂停同步，不删除云端导航。

浏览器的 `navigator.onLine` 仅作为请求失败后的状态提示，不拦截登录检查、手动同步或自动同步。只有实际请求失败后才显示连接问题；真正断网时保留本机待同步修改并重试，登录过期则提示重新登录。

本地验证：`npm run navigation:test`、`npm test`、`npm run build:static`。登录与真实跨设备同步仍需发布后验证。

首次发布账号同步须先在独立 API 项目应用 `migrations/0005_account_navigation.sql`，再发布 API，最后构建并发布主站。新增表 `account_navigation_profiles` 使用现有 D1 绑定，不修改 Todo 表；生产迁移和发布须单独确认。

### 主站自定义导航排序

网站卡片的 ↑ ↓ 只交换同分类的相邻自定义网站，内置网站固定在前；“偏好与数据 → 自定义导航”的箭头调整自定义分类顺序，内置分类顺序不变。首尾禁用对应按钮，单条目的分类不能移动。搜索、收藏及足迹页不提供排序按钮；访问足迹仍按访问先后显示。

顺序直接使用 `customSites` 和 `customNavigations` 数组，不新增 API、数据库字段或备份格式。保留 ID、收藏及网站分类引用，沿用离线待同步和云端版本冲突保护。每次点击都读取最新本机导航；已删除条目或网站分类已变化时拒绝排序，不覆盖其他条目的最新修改。替换导入保留备份的数组顺序；合并时云端/当前已有条目顺序优先，新条目追加。验证：`npm run order:test`、`npm run navigation:test`。

### 主站自定义导航编辑

自定义网站卡片提供铅笔按钮，可修改名称、地址、描述及所属分类；“偏好与数据 → 自定义导航”提供分类名称和图标编辑。内置网站和分类不提供编辑入口。保存保留原 ID、收藏、足迹及分类内的网站引用，沿用本机保存、离线待同步和账号冲突保护。不重新生成条目或改变排序。

打开编辑时读取最新本机数据，保存前再次读取并比较当前条目；若期间条目被修改或删除，阻止覆盖并提示取消后重新打开，其他条目的最新变化会保留。地址继续校验 HTTP/HTTPS、账号密码和长度，分类名称校验重名。保存成功前不修改界面数据，取消或按 Escape 不写入。验证：`npm run edit:test`、`npm run navigation:test`。

### 主站备份安全导入

主站 JSON 备份选中文件后先进行格式校验和数量预览，不立即写入。支持旧版导航导出格式和 `format: sgao-navigation, version: 1` 的新格式；不接受 Todo 备份。默认合并收藏、自定义网站与分类，同 ID 不同内容分别保留，本机访问足迹不变。替换以备份为准，备份包含足迹时同时替换足迹，未包含时保留本机足迹。

确认合并、替换或恢复前，必须先成功保存本机快照到 `sgao.navigation.before-import.v1`；存储失败则中止，写入过程中失败会尝试回滚。预览期间数据变化时刷新预览并要求再次确认。全部写入完成后才通知账号同步；启用同步时操作结果可能影响云端导航，足迹与自动备份不上传。

“我的数据”可下载或恢复最近一次操作前备份。恢复同样预览和确认，并将恢复前的当前数据保留为新的备份。仅保留一份自动备份，浏览器清理站点存储会删除它，不能替代导出备份。验证：`npm run backup:test`。

### 主站安装与离线导航

“偏好与数据”提供安装与离线资源状态。支持原生安装提示的浏览器可点击安装；iPhone Safari 可通过分享菜单“添加到主屏幕”。首次联网须等到“离线导航已准备好”，此后断网重开仍可搜索、编辑本机导航。登录和第三方网站需要联网；账号同步沿用现有逻辑，恢复网络后需保持页面打开。

主站构建额外生成独立静态离线页面和版本化 `navigation-sw.js`，仅预缓存公开离线页面、其 JS/CSS、图标和 manifest。不缓存 SSR 页面、RSC、API、登录凭据或第三方响应，不影响 Todo 缓存。在线首页优先访问服务器，网络失败或服务端 5xx 时使用离线页面。新版本等待用户点击“应用更新并刷新”，不会自动打断编辑。

浏览器清理或回收缓存后需要联网重新准备；清理站点数据还可能删除本机导航，应定期导出备份。验证命令：`npm run pwa:test`（构建及缓存/安装/更新回归测试）。

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
