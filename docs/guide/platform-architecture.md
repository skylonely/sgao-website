# SGAO Platform 架构

> 架构版本：v2.0  
> 更新时间：2026-07-30

SGAO Platform 是以统一域名体系为入口、以 Cloudflare 为基础设施的一站式个人数字平台。平台目前整合主站、知识库和图片中心，并为博客、在线工具、开放 API 与统一后台预留扩展空间。

![SGAO Platform 架构图 v2.0](https://img.sgao.cc/docs/guide.png)

## 一、整体架构

用户通过 `sgao.cc` 生态下的域名访问不同服务。请求首先进入 Cloudflare Edge，完成 DNS 解析、SSL/TLS、CDN 加速、安全防护与缓存处理，然后由对应的 Cloudflare Worker 负责路由和业务逻辑。

当前主要链路：

```text
用户
  ↓
统一域名体系
  ↓
Cloudflare Edge
  ↓
Cloudflare Worker
  ↓
Cloudflare R2 / GitHub
```

## 二、统一域名体系

| 域名 | 用途 | 当前状态 |
| --- | --- | --- |
| `sgao.cc` | 主站、个人门户、导航与个人介绍 | 已上线 |
| `docs.sgao.cc` | 知识库、教程与指南 | 已上线 |
| `img.sgao.cc` | 图片中心、图片托管与 CDN 加速 | 已上线 |
| `blog.sgao.cc` | 文章、分类、标签与评论 | 规划中 |
| `labs.sgao.cc` | 在线工具、小应用与实验功能 | 规划中 |
| `api.sgao.cc` | 开放 API 与服务接口 | 规划中 |
| `admin.sgao.cc` | 平台统一管理后台 | 规划中 |

## 三、Cloudflare 基础设施

Cloudflare Edge 为整个平台提供统一的入口能力：

- DNS 解析与域名管理
- SSL/TLS 加密
- 全球 CDN 加速
- 浏览器与边缘缓存
- DDoS 防护
- WAF 防火墙
- 安全访问控制

Cloudflare Worker 负责：

- 请求路由和服务分发
- API 服务
- 缓存控制
- 图片与文件访问
- 后续页面渲染和图片处理能力

## 四、缓存策略

平台采用从用户侧到存储侧的分层缓存策略：

```text
浏览器缓存
  ↓
Cloudflare Edge 缓存
  ↓
Worker 内存缓存
  ↓
Cloudflare R2
```

分层缓存可以减少重复请求和存储读取，在保证内容可更新的同时提升国内外访问速度。

## 五、存储与代码管理

### Cloudflare R2

R2 是当前主要对象存储，负责：

- 图片存储
- 文档附件
- 静态资源
- 备份文件

### GitHub

GitHub 当前用于：

- 源代码管理
- 文档管理
- 配置文件维护
- 博客内容管理（规划）
- 备份存储

主要仓库：

| 仓库 | 用途 |
| --- | --- |
| `sgao-website` | 主站与知识库 |
| `sgao-image-center` | 图片中心 Worker、管理后台和 API |
| `sgao-images` | 可选的图片资源仓库 |

## 六、图片上传流程

图片中心的上传流程如下：

```text
用户上传图片
  ↓
调用 Worker API
  ↓
写入 Cloudflare R2
  ↓
返回 img.sgao.cc 图片地址
```

示例地址：

```text
https://img.sgao.cc/docs/example.png
```

图片中心目前支持图片上传、拖拽上传、批量上传、图片管理、Markdown 链接复制和缓存加速。

## 七、文件管理流程

用户通过管理后台访问 R2 文件，完成浏览、搜索、复制链接、重命名、删除和批量操作。平台统一生成可直接用于 Markdown 的地址：

```md
![图片说明](https://img.sgao.cc/docs/example.png)
```

## 八、技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React、TypeScript、Vite |
| 后端 | Cloudflare Worker、TypeScript |
| 对象存储 | Cloudflare R2 |
| 代码与备份 | GitHub |
| 部署 | Cloudflare Workers、Cloudflare Pages |
| 域名与安全 | Cloudflare |

## 九、发展路线

### 已完成

- 统一域名访问
- Cloudflare 全球 CDN 加速
- Cloudflare Worker 边缘计算
- R2 对象存储
- 图片上传与管理
- Markdown 链接复制
- 自动重命名与缓存优化
- GitHub 自动部署

### 规划中

- 博客系统
- 在线工具集合
- 统一管理后台
- 开放 API
- AI 功能集成
- 数据分析与访问统计
- 多端适配与 PWA

## 十、相关文档

- [Cloudflare 图片中心](/cloudflare/image-center)
- [图片中心迁移到 Cloudflare R2](/cloudflare/image-center-r2-migration)
- [图片仓库使用说明](/cloudflare/image-repository)
- [Cloudflare Workers 自动部署](/cloudflare/workers-auto-deploy)
- [文档写作规范](/guide/writing-standard)
