# Cloudflare DNS 与域名配置

> 更新时间：2026-08-21

本文记录 SGAO Platform 的域名规划、Cloudflare DNS 管理方式，以及域名绑定到 Cloudflare Worker 的实际流程。

## 一、当前域名规划

| 域名 | 服务 | Worker / 项目 | 状态 |
| --- | --- | --- | --- |
| `sgao.cc` | 主站与网址导航 | `noisy-math-2b8d` | 已上线 |
| `docs.sgao.cc` | VitePress 知识库 | `sgao-docs` | 已上线 |
| `travel.sgao.cc` | 旅行计划与攻略 | `sgao-travel` | 已上线 |
| `todo.sgao.cc` | 个人待办与分类清单 | `sgao-todo` | 已上线 |
| `img.sgao.cc` | 图片中心与 CDN | `sgao-image-center` | 已上线 |
| `blog.sgao.cc` | 博客系统 | 待创建 | 规划中 |
| `labs.sgao.cc` | 在线工具与实验功能 | 待创建 | 规划中 |
| `api.sgao.cc` | 开放 API | `sgao-api` | 已上线 |
| `admin.sgao.cc` | 统一管理后台 | 待创建 | 规划中 |

## 二、DNS 记录基础

Cloudflare DNS 记录常用字段：

| 字段 | 说明 |
| --- | --- |
| Type | 记录类型，例如 A、AAAA、CNAME、TXT |
| Name | 主机名，例如 `docs`、`img` 或根域名 `@` |
| Content | 目标 IP、目标域名或验证内容 |
| Proxy status | 是否由 Cloudflare 代理 |
| TTL | DNS 解析结果的缓存时间 |

### Proxied 与 DNS only

- **Proxied（橙色云）**：请求经过 Cloudflare，可使用 CDN、TLS、WAF、缓存和 DDoS 防护。
- **DNS only（灰色云）**：Cloudflare 只提供 DNS 解析，请求直接访问源站。

网站和 Worker 域名通常应由 Cloudflare 代理；邮件、部分第三方验证记录则按服务商要求使用 DNS only。

## 三、Worker 域名绑定方式

当前平台中的 Worker 是服务源站，优先使用 **Custom Domain**，而不是手工创建占位 DNS 记录再配置 Route。

Custom Domain 的特点：

- 绑定完整域名或子域名的所有路径
- Cloudflare 自动创建所需 DNS 记录
- Cloudflare 自动签发 TLS 证书
- 不需要单独维护源站 IP

### 控制台绑定步骤

1. 打开 Cloudflare 控制台。
2. 进入 **Workers & Pages**。
3. 选择需要绑定的 Worker。
4. 打开 **Settings → Domains & Routes**。
5. 选择 **Add → Custom domain**。
6. 输入完整域名，例如 `docs.sgao.cc`。
7. 等待 DNS 和证书状态变为可用。

::: warning 绑定前检查
同一个主机名不能同时存在冲突的 CNAME 记录。绑定 Custom Domain 前，应先检查并移除旧 Worker、旧 Route 或冲突 DNS 记录。
:::

## 四、三个已上线域名

### 主站 `sgao.cc`

绑定到主站 Worker：

```text
sgao.cc
  ↓
Cloudflare Edge
  ↓
noisy-math-2b8d
```

如果同时使用 `www.sgao.cc`，需要单独绑定 `www`，或创建重定向规则统一跳转到根域名。

### 知识库 `docs.sgao.cc`

绑定到知识库 Worker：

```text
docs.sgao.cc
  ↓
Cloudflare Edge
  ↓
sgao-docs
```

知识库 Worker 的静态资源目录由 `wrangler.docs.jsonc` 指定：

```json
{
  "name": "sgao-docs",
  "assets": {
    "directory": "./docs/.vitepress/dist"
  }
}
```

### 图片中心 `img.sgao.cc`

绑定到图片中心 Worker：

```text
img.sgao.cc
  ↓
Cloudflare Edge
  ↓
sgao-image-center
  ↓
Cloudflare R2
```

图片中心代码和部署配置位于独立的 `sgao-image-center` 项目。

## 五、验证方式

### 检查 DNS

```bash
dig sgao.cc
dig docs.sgao.cc
dig img.sgao.cc
```

### 检查 HTTP 状态

```bash
curl -I https://sgao.cc
curl -I https://docs.sgao.cc
curl -I https://img.sgao.cc/docs/guide.png
```

重点确认：

- 域名能够解析
- HTTPS 证书有效
- 返回状态符合预期
- 页面或资源来自正确的 Worker

## 六、常见问题

### 两个域名显示同一个页面

通常是两个 Custom Domain 绑定到了同一个 Worker。分别检查主站 Worker 和知识库 Worker 的 **Domains & Routes**。

### 域名无法绑定

检查该主机名是否已有：

- CNAME 记录
- 旧 Worker Custom Domain
- Worker Route
- Pages 项目自定义域

清理冲突后重新绑定。

### 域名能解析但页面打不开

依次检查：

1. Worker 是否部署成功
2. Custom Domain 状态是否正常
3. TLS 证书是否已经签发
4. Worker 构建产物是否存在
5. 是否存在重定向循环

### 更新后仍显示旧页面

检查：

- 自动部署是否使用了最新提交
- Worker 是否部署到正确项目
- 浏览器与 Cloudflare 缓存
- 当前域名是否绑定到了旧 Worker

## 七、维护原则

- 一个正式域名只绑定一个明确的服务入口
- 新增子域名前先记录用途和负责人
- 删除 Worker 前先解除 Custom Domain
- 修改 DNS 后保留变更记录
- 不在文档中保存 API Token、账户 ID 或密钥

## 八、官方参考

- [Cloudflare DNS records](https://developers.cloudflare.com/dns/manage-dns-records/)
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)

## 九、相关文章

- [SGAO Platform 架构](/guide/platform-architecture)
- [Spaceship 域名接入 Cloudflare Worker](./spaceship-worker-deployment)
- [Workers 双站点自动部署](./workers-auto-deploy)
- [Image Center（图片中心）](./image-center)
