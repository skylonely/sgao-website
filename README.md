# 🌐 sgao-website

Personal website and navigation system for **sgao.cc**.

基于 Cloudflare Workers 构建的个人网站与导航系统，用于管理个人链接、技术文档以及项目入口。

## ✨ Features

- 个人主页展示
- 网站导航入口
- 技术文档聚合
- Cloudflare Workers 部署
- 全球 CDN 加速访问
- 简洁、高性能、低成本

## 🏗️ Architecture

```
User
 │
 ▼
sgao.cc
 │
 ▼
Cloudflare Workers
 │
 ▼
sgao-website
```

## 🛠️ Tech Stack

- Cloudflare Workers
- TypeScript
- Vite
- Wrangler

## 📦 Installation

Install dependencies:

```bash
npm install
```

## 🚀 Development

Run local development server:

```bash
npm run dev
```

## 📤 Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## 📁 Project Structure

```
sgao-website
│
├── src/                    # Website source code
│
├── public/                 # Static assets
│
├── package.json            # Project configuration
│
├── wrangler.jsonc          # Cloudflare Workers configuration
│
└── README.md
```

## 🌐 Online Website

Main Website:

https://sgao.cc

Image CDN:

https://img.sgao.cc

## 🔗 Related Projects

### sgao-image-center

Image service and management center:

https://github.com/skylonely/sgao-image-center

### sgao-images

Image asset repository:

https://github.com/skylonely/sgao-images

## 📝 Notes

This project is the main website entrance of the **sgao.cc personal cloud infrastructure**.

It integrates website navigation, documentation and related personal projects.

---

Built with ❤️ by skylonely
