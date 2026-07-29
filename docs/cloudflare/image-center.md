# Cloudflare 图片中心（Image Center）

## 项目介绍

Image Center 是一个基于 Cloudflare Workers 构建的个人图片 CDN，用于统一管理网站中的所有图片资源。

整体架构：

```text
GitHub (sgao-images)
        │
        ▼
Cloudflare Worker
        │
        ▼
Cloudflare Cache
        │
        ▼
img.sgao.cc
```

图片统一通过：

```
https://img.sgao.cc/...
```

进行访问。

---

# 为什么要做图片中心？

以前：

```
README
 ↓
GitHub Raw
 ↓
raw.githubusercontent.com
```

存在的问题：

- 国内访问速度不稳定
- GitHub Raw 偶尔较慢
- 图片地址不统一
- 后期无法增加压缩、缩略图等功能

现在：

```
GitHub
   ↓
Cloudflare Worker
   ↓
Cloudflare Cache
   ↓
img.sgao.cc
```

优势：

- 全球 CDN
- 首次访问自动缓存
- 后续访问速度极快
- 自己的域名
- 后期可以增加图片处理能力

---

# 项目组成

## 图片仓库

```
GitHub

skylonely/sgao-images
```

用于保存所有图片。

例如：

```
cloudflare/
    example.png

img/
    logo.png

docs/
    worker.png
```

---

## Worker

项目：

```
sgao-image-center
```

负责：

- 接收图片请求
- 从 GitHub 获取图片
- 返回图片
- 写入 Cloudflare Cache

---

## 自定义域名

绑定：

```
img.sgao.cc
```

访问：

```
https://img.sgao.cc/cloudflare/example.png
```

Worker 会自动转换为：

```
https://raw.githubusercontent.com/skylonely/sgao-images/main/cloudflare/example.png
```

---

# 工作流程

第一次访问：

```
浏览器
      │
      ▼
Cloudflare Worker
      │
      ▼
GitHub Raw
      │
      ▼
Cloudflare Cache
      │
      ▼
浏览器
```

第二次访问：

```
浏览器
      │
      ▼
Cloudflare Cache
      │
      ▼
浏览器
```

不会再次访问 GitHub。

---

# 缓存机制

Worker 设置：

```
Cache-Control

public
max-age=86400
s-maxage=31536000
```

浏览器缓存：

1 天

Cloudflare Edge Cache：

1 年

---

# 部署

本地开发：

```bash
npm install

npm run dev
```

部署：

```bash
npm run deploy
```

实际上执行：

```bash
wrangler deploy
```

部署后立即生效。

---

# 后续规划

计划支持：

- 自动 WebP
- 自动压缩
- 图片缩略图
- 防盗链
- 图片 API
- 图片列表
