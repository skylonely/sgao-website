# Cloudflare 图片中心（Image Center）

> 更新时间：2026-09-18（账号鉴权、图片回收站和完整分页搜索已发布）

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
验证 Cloudflare Access 登录凭证与管理账号
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

上传与文件管理只允许 `gsios602@gmail.com` 的 Cloudflare Access 登录身份，网页不再要求上传密钥。登录检查通过后自动读取目录和文件；未登录或登录过期时显示登录入口。旧 Bearer 密钥不再授权管理操作，线上旧密钥暂不删除，以便必要时回滚。

上线前须在现有 Zero Trust 团队配置路径级图片应用，保护 `img.sgao.cc/admin`、`img.sgao.cc/admin/*` 和 `img.sgao.cc/api/*`，Allow 策略仅包含该邮箱。不能保护整个图片域名或整个 Worker，公开图片访问必须保持不变。

Worker 配置 `ACCESS_TEAM_DOMAIN` 和该图片应用的 `ACCESS_AUD`，通过 `jose` 验证 JWT 签名、issuer、audience、有效期和邮箱，而不是信任网页传入的邮箱。配置为空时管理请求会被拒绝。当前使用 `https://gsios602.cloudflareaccess.com` 团队的 `img` 应用，版本 `bdf89cdb-4d08-4616-8055-c6b85629ea3c` 已发布。登录入口为 `/api/login`，会返回固定上传页或文件管理页，不允许任意外部跳转。所有写入还必须通过同源校验。29 项本地自动化测试通过；真实账号登录和上传仍需用户在浏览器验收。

本地验证：图片中心项目执行 `npx vitest run`、`npm run test:auth-ui` 和 TypeScript 检查。真实账号登录及公开图片访问须在配置和发布后再次验证；没有数据库迁移，不修改 Todo 或主站 API。

### 图片回收站（已发布）

代码提交 `089f003`，Worker 版本 `578e40bc-3dab-4147-9792-c223eb23dd0e` 已发布。50 项本地自动化测试、类型检查和模拟构建通过；登录后的真实浏览器操作仍需人工验收。

文件管理页新增“图片文件 / 回收站”切换。普通删除、批量删除改为移入回收站，支持受保护的缩略图、恢复到原路径、二次确认后彻底删除；不自动清空，也不能恢复旧版本已经永久删除的图片。

沿用当前邮箱登录保护和 R2 绑定。内部图片副本和记录分别保存在 `__sgao_trash/data/` 与 `__sgao_trash/records/`，禁止通过公开图片路径访问，并从正常文件/目录列表排除。`/api/trash` 支持列表、预览、恢复和彻底删除，仍只允许管理账号。

删除先复制图片字节和元数据，再用 ETag 条件写入唯一删除占位符。恢复不会覆盖原路径新图片；批量移入返回部分失败详情。永久删除只清除内部副本和记录，保留不包含原图字节的小占位符以防并发上传被误删；上传可安全复用该路径。公开图片请求在缓存及 GitHub 回源前检查占位符和缓存 ETag，每次增加一次 R2 HEAD。浏览器已有缓存可能暂时显示旧图，回收站副本持续占用 R2 存储。

上线不需要数据库迁移或新的 Access 配置，不会自动移动已有图片。启用后不要直接回滚到不识别回收站的旧 Worker，也不要手动删占位符：旧版可能公开内部副本，或通过 GitHub 回源重新显示被删除的图片。完整恢复、失败处理及验证说明见图片中心 README。

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

### 完整分页搜索（已发布）

代码提交 `c89dee4`，Worker 版本 `0855df0a-eab6-408e-8331-037a1d5fd32c` 已发布。64 项本地自动化测试、类型和语法检查及模拟构建通过；登录后的搜索和手机布局仍需人工验收。

搜索文件名或目录时，输入停顿 300 ms 后自动串行读取当前视图的剩余分页，边读取边展示匹配结果及已检查文件数。空分页继续读取，完成前明确提示结果可能不完整；支持暂停、继续和失败后从原分页重试。清空关键词、切换图片/回收站视图或退出登录会取消读取，迟到响应不会回填。已完整读取后修改关键词只做本地筛选，新增文件或其他设备修改需刷新；分页不是跨请求快照。

只读取列表元数据，不下载全部原图，不新增数据库、绑定或 Access 配置；全量搜索会增加正常的 R2 列表请求。本次不修改线上图片数据。

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
