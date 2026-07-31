import { defineConfig } from "vitepress";

export default defineConfig({
  title: "SGAO Knowledge Base",
  description: "SGAO 平台架构、开发工具、AI 基础与 Cloudflare 实践知识库",
  lang: "zh-CN",
  themeConfig: {
    siteTitle: "SGAO",
    nav: [
      { text: "首页", link: "/" },
      { text: "平台架构", link: "/guide/platform-architecture" },
      {
        text: "Git 与 GitHub",
        items: [
          { text: "Git 与 GitHub 文档", link: "/git/" },
          {
            text: "GitHub 2026 完整指南",
            link: "/git/github-complete-guide",
          },
        ],
      },
      {
        text: "AI 基础",
        items: [
          { text: "AI 基础文档", link: "/ai/" },
          {
            text: "API、CLI、Prompt、MCP、Skill 与 Agent",
            link: "/ai/api-cli-prompt-mcp-skill-agent",
          },
        ],
      },
      {
        text: "Cloudflare",
        items: [
          { text: "Cloudflare 文档", link: "/cloudflare/" },
          {
            text: "Workers 自动部署",
            link: "/cloudflare/workers-auto-deploy",
          },
          { text: "DNS 与域名配置", link: "/cloudflare/dns-domain" },
          {
            text: "Spaceship 域名部署",
            link: "/cloudflare/spaceship-worker-deployment",
          },
          { text: "Image Center", link: "/cloudflare/image-center" },
        ],
      },
      { text: "文档规范", link: "/guide/writing-standard" },
    ],

    sidebar: [
      {
        text: "📐 平台与规范",
        collapsed: false,
        items: [
          { text: "SGAO Platform 架构", link: "/guide/platform-architecture" },
          { text: "文档写作规范", link: "/guide/writing-standard" },
        ],
      },
      {
        text: "🔀 Git 与 GitHub",
        link: "/git/",
        collapsed: false,
        items: [
          {
            text: "GitHub 2026 完整指南",
            link: "/git/github-complete-guide",
          },
        ],
      },
      {
        text: "🤖 AI 基础",
        link: "/ai/",
        collapsed: false,
        items: [
          {
            text: "API、CLI、Prompt、MCP、Skill 与 Agent",
            link: "/ai/api-cli-prompt-mcp-skill-agent",
          },
        ],
      },
      {
        text: "📚 Cloudflare",
        link: "/cloudflare/",
        collapsed: false,
        items: [
          {
            text: "Workers 双站点自动部署",
            link: "/cloudflare/workers-auto-deploy",
          },
          { text: "DNS 与域名配置", link: "/cloudflare/dns-domain" },
          {
            text: "Spaceship 域名部署",
            link: "/cloudflare/spaceship-worker-deployment",
          },
          {
            text: "Image Center（图片中心）",
            link: "/cloudflare/image-center",
          },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/skylonely/sgao-website",
      },
    ],
  },
});
