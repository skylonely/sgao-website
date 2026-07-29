# GitHub 图片存储迁移到 Cloudflare R2

> 更新时间：2026-07-29

## 一、迁移目标

将 **sgao-image-center** 从 GitHub Raw 图片存储升级到 Cloudflare R2。

    浏览器
        │
        ▼
    img.sgao.cc
        │
        ▼
    Cloudflare Worker
        │
        ▼
    Cloudflare R2

图片不再依赖 GitHub Raw。

------------------------------------------------------------------------

## 二、迁移原因

-   GitHub 仓库公开可见
-   上传依赖 Git Push
-   不适合作为长期图片中心

R2 优势：

-   对象存储
-   私有 Bucket
-   Cloudflare CDN
-   免费额度高
-   上传更方便

------------------------------------------------------------------------

## 三、创建 R2 Bucket

Bucket：

    sgao-images

推荐配置：

-   Location：自动
-   Storage Class：标准（Standard）
-   Public Access：关闭

------------------------------------------------------------------------

## 四、绑定 Worker

修改 `wrangler.jsonc`：

``` json
"r2_buckets": [
  {
    "binding": "IMAGES",
    "bucket_name": "sgao-images"
  }
]
```

执行：

``` bash
npm run cf-typegen
```

------------------------------------------------------------------------

## 五、R2 存储模块

新增：

    src/storage/r2.ts

负责：

-   读取 R2
-   返回 Response
-   设置 Content-Type
-   设置 Cache-Control
-   设置 ETag

------------------------------------------------------------------------

## 六、统一存储入口

新增：

    src/storage/index.ts

支持：

``` ts
type StorageMode = "github" | "r2" | "r2-github";
```

切换方式：

``` ts
const STORAGE_MODE = "r2";
```

------------------------------------------------------------------------

## 七、上传后台

新增：

    /admin

支持：

-   Token 验证
-   拖拽上传
-   批量上传
-   自动生成图片地址

------------------------------------------------------------------------

## 八、上传 API

    POST /api/upload

流程：

    Browser
     ↓
    Worker
     ↓
    UPLOAD_TOKEN
     ↓
    R2.put()
     ↓
    返回 URL

------------------------------------------------------------------------

## 九、上传密钥

生成：

``` bash
openssl rand -hex 32
```

线上：

``` bash
npx wrangler secret put UPLOAD_TOKEN
```

本地：

    .dev.vars

    UPLOAD_TOKEN=你的密钥

加入：

    .gitignore

    .dev.vars

------------------------------------------------------------------------

## 十、部署

``` bash
npm run deploy
```

后台：

    https://img.sgao.cc/admin/

上传后生成：

    https://img.sgao.cc/common/demo.png

------------------------------------------------------------------------

## 十一、推荐目录

    common/
    logo/
    docs/
    blog/

------------------------------------------------------------------------

## 十二、免费额度

-   存储：10GB
-   A 类操作：100 万次/月
-   B 类操作：1000 万次/月

------------------------------------------------------------------------

## 十三、当前版本

已完成：

-   R2 存储
-   私有 Bucket
-   上传后台
-   Token 验证
-   批量上传
-   拖拽上传
-   自动生成 img.sgao.cc 地址
-   CDN 缓存

后续规划：

-   图片列表
-   删除图片
-   GitHub → R2 一键同步
-   WebP 自动转换
