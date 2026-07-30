# Cloudflare

本分类记录 SGAO Platform 已经实际使用的 Cloudflare 配置与维护经验。目前只展示有完整内容、能够直接执行和验证的文档。

## 文档

### [Workers 双站点自动部署](./workers-auto-deploy)

说明 `sgao.cc` 主站和 `docs.sgao.cc` 知识库如何从同一个 GitHub 仓库分别构建、部署到两个 Worker。

### [DNS 与域名配置](./dns-domain)

说明 `sgao.cc` 域名体系、DNS 记录、代理状态、Worker Custom Domain 和常见故障处理。

### [Image Center（图片中心）](./image-center)

说明 `img.sgao.cc` 如何通过 Cloudflare Worker、R2 和分层缓存提供图片上传、管理与访问服务。

## 相关内容

- [SGAO Platform 架构](/guide/platform-architecture)
- [文档写作规范](/guide/writing-standard)
