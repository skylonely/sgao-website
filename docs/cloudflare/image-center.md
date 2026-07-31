# Cloudflare 图片中心（Image Center）

> 更新时间：2026-07-30

Image Center 是 SGAO Platform 的统一图片存储与访问服务。当前方案以 Cloudflare R2 作为主要存储，通过 Cloudflare Worker 提供上传、管理、访问和缓存能力，并统一使用 `img.sgao.cc` 对外提供图片地址。

## 一、当前架构

```text
用户或管理后台
      │
      ▼
img.sgao.cc
      │
      ▼
Cloudflare Edge
      │
      ▼
sgao-image-center Worker
      │
      ▼
Cloudflare R2
```

主要组件：

| 组件 | 用途 |
| --- | --- |
| `img.sgao.cc` | 统一图片访问域名 |
| Cloudflare Edge | TLS、CDN、安全防护与边缘缓存 |
| `sgao-image-center` | 路由、鉴权、上传与文件管理 |
| Cloudflare R2 | 图片和文件的主要对象存储 |
| GitHub | 源代码管理及可选备份 |

## 二、为什么使用 R2

早期版本通过 Worker 从 GitHub Raw 读取图片。这种方式存在以下问题：

- 图片仓库必须公开
- 上传依赖 Git Commit 和 Push
- GitHub Raw 在部分网络环境中访问不稳定
- 不适合后台上传、批量操作和文件管理

迁移到 R2 后：

- Bucket 可以保持私有
- Worker 可直接读取、写入、列出和删除对象
- 支持管理后台和上传 API
- 图片地址继续保持 `img.sgao.cc` 不变
- 存储实现变化不会影响 Markdown 中的图片链接

GitHub 仓库 `sgao-images` 仅作为可选的资源备份，不再是线上图片请求的主要来源。

## 三、R2 绑定

在图片中心项目的 Wrangler 配置中绑定 R2 Bucket：

```json
{
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "sgao-images"
    }
  ]
}
```

Worker 通过 `IMAGES` 绑定访问 Bucket。主要操作包括：

- `get()`：读取对象
- `put()`：上传对象
- `list()`：列出文件
- `delete()`：删除对象

R2 Bucket 保持私有，外部访问必须经过 Worker。

## 四、图片访问流程

访问图片：

```text
浏览器
  ↓
https://img.sgao.cc/docs/guide.png
  ↓
Cloudflare Edge Cache
  ↓ 未命中
Worker
  ↓
Cloudflare R2
```

Worker 负责：

- 解析文件路径
- 从 R2 读取对象
- 返回正确的 `Content-Type`
- 设置 `Cache-Control`
- 返回 ETag 等缓存验证信息
- 对不存在的文件返回正确状态

## 五、图片上传流程

```text
用户选择图片
  ↓
管理后台调用上传 API
  ↓
验证上传 Token
  ↓
Worker 写入 R2
  ↓
返回 img.sgao.cc 地址
```

上传接口：

```text
POST /api/upload
```

后台入口：

```text
https://img.sgao.cc/admin/
```

当前支持：

- 选择文件上传
- 拖拽上传
- 批量上传
- 自动生成访问地址
- 自动生成 Markdown
- 文件浏览与搜索
- 重命名和删除
- 批量操作

## 六、上传鉴权

上传和管理操作使用独立 Token，Token 只保存在运行环境中。

生成随机 Token：

```bash
openssl rand -hex 32
```

设置线上密钥：

```bash
npx wrangler secret put UPLOAD_TOKEN
```

本地开发可以放入 `.dev.vars`：

```text
UPLOAD_TOKEN=本地开发密钥
```

`.dev.vars` 必须加入 `.gitignore`，不得提交到仓库或写入文档。

## 七、目录规范

推荐按使用场景组织 R2 对象：

```text
common/
logo/
docs/
blog/
travel/
cloudflare/
apple/
mac/
```

命名建议：

- 使用小写英文
- 多个单词使用短横线
- 文件名表达实际内容
- 避免空格、中文和“最终版”等临时描述

推荐：

```text
docs/cloudflare-worker.png
```

不推荐：

```text
docs/CloudFlare Worker 最终版.png
```

## 八、图片地址使用

Markdown：

```md
![Cloudflare Worker](https://img.sgao.cc/docs/cloudflare-worker.png)
```

HTML：

```html
<img
  src="https://img.sgao.cc/docs/cloudflare-worker.png"
  alt="Cloudflare Worker"
/>
```

CSS：

```css
background-image: url("https://img.sgao.cc/common/background.png");
```

统一使用 `img.sgao.cc`，不要在文档或页面中直接引用 R2 内部地址或 GitHub Raw 地址。

## 九、缓存策略

图片请求采用分层缓存：

```text
浏览器缓存
  ↓
Cloudflare Edge Cache
  ↓
Worker
  ↓
Cloudflare R2
```

更新已有文件时，应根据实际情况选择：

- 使用新文件名
- 在 URL 后添加版本参数
- 清理对应的 Cloudflare 缓存

示例：

```text
https://img.sgao.cc/logo/logo.png?v=2
```

长期缓存的资源优先使用带版本的文件名，例如：

```text
logo-v2.png
```

## 十、部署与验证

在独立的 `sgao-image-center` 项目中执行：

```bash
npm install
npm run dev
npm run deploy
```

部署后检查：

```bash
curl -I https://img.sgao.cc/docs/guide.png
```

确认：

- 返回状态为 `200`
- `Content-Type` 与文件类型一致
- HTTPS 正常
- 缓存响应头符合预期
- 管理后台可以完成上传和文件操作

## 十一、当前状态

已完成：

- R2 私有 Bucket
- Worker 读取和写入 R2
- 上传后台
- Token 鉴权
- 拖拽与批量上传
- 图片浏览、搜索和删除
- 自动生成图片及 Markdown 地址
- Cloudflare CDN 缓存
- GitHub 自动部署

后续规划：

- 自动 WebP / AVIF
- 图片压缩与缩略图
- 防盗链策略
- 更完整的操作审计
- R2 与 GitHub 的按需备份

## 十二、官方参考

- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Use R2 from Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## 十三、相关文章

- [SGAO Platform 架构](/guide/platform-architecture)
- [DNS 与域名配置](./dns-domain)
- [Workers 双站点自动部署](./workers-auto-deploy)
