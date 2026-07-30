import { defineConfig } from "vitepress";

export default defineConfig({
  title: "SGAO Knowledge Base",
  description: "SGAO 知识库",
  themeConfig: {
    siteTitle: "SGAO",
    nav: [
      { text: "首页", link: "/" },
      {
        text: "技术文档",
        items: [
          { text: "Cloudflare", link: "/cloudflare/" },
          { text: "GitHub", link: "/github/" },
          { text: "Docker", link: "/docker/" },
          { text: "VSCode", link: "/vscode/" },
          { text: "Mac", link: "/mac/" },
          { text: "Apple", link: "/apple/" },
        ],
      },
      {
        text: "生活与工作",
        items: [
          { text: "生活", link: "/life/" },
          { text: "旅游", link: "/travel/" },
          { text: "装修", link: "/renovation/" },
          { text: "工作", link: "/work/" },
          { text: "常用工具", link: "/tools/" },
        ],
      },
      {
        text: "AI",
        items: [
          { text: "OpenAI", link: "/ai/openai" },
          { text: "Claude", link: "/ai/claude" },
          { text: "Claude Code", link: "/ai/claude-code" },
          { text: "Cursor", link: "/ai/cursor" },
          { text: "提示词", link: "/ai/prompts" },
          { text: "MCP", link: "/ai/mcp" },
        ],
      },
      { text: "文档规范", link: "/guide/writing-standard" },
    ],

    sidebar: [
      {
        text: "📚 Cloudflare",
        link: "/cloudflare/",
        collapsed: false,
        items: [
          {
            text: "Workers 自动部署",
            link: "/cloudflare/workers-auto-deploy",
          },
          { text: "DNS 配置", link: "/cloudflare/dns" },
          { text: "域名绑定", link: "/cloudflare/domain" },
          { text: "Pages", link: "/cloudflare/pages" },
          { text: "Workers", link: "/cloudflare/workers" },
          {
            text: "Image Center（图片中心）",
            link: "/cloudflare/image-center",
          },
          {
            text: "Image Center R2 迁移",
            link: "/cloudflare/image-center-r2-migration",
          },
          {
            text: "Image Repository（图片仓库）",
            link: "/cloudflare/image-repository",
          },
        ],
      },
      {
        text: "📚 GitHub",
        link: "/github/",
        collapsed: false,
        items: [
          { text: "Git 基础", link: "/github/git" },
          { text: "SourceTree", link: "/github/sourcetree" },
          { text: "PAT Token", link: "/github/pat-token" },
          { text: "自动部署", link: "/github/auto-deploy" },
        ],
      },
      {
        text: "📚 Mac",
        link: "/mac/",
        collapsed: false,
        items: [
          { text: "Homebrew", link: "/mac/homebrew" },
          { text: "Python", link: "/mac/python" },
          { text: "Terminal", link: "/mac/terminal" },
        ],
      },
      {
        text: "📚 VSCode",
        link: "/vscode/",
        collapsed: false,
        items: [
          { text: "插件", link: "/vscode/extensions" },
          { text: "配置", link: "/vscode/configuration" },
          { text: "AI", link: "/vscode/ai" },
        ],
      },
      { text: "📚 Docker", link: "/docker/" },
      { text: "🍎 Apple", link: "/apple/" },
      { text: "🏡 生活", link: "/life/" },
      { text: "✈️ 旅游", link: "/travel/" },
      { text: "🏠 装修", link: "/renovation/" },
      { text: "💼 工作", link: "/work/" },
      { text: "🧰 常用工具", link: "/tools/" },
      {
        text: "🤖 AI",
        link: "/ai/",
        collapsed: false,
        items: [
          { text: "OpenAI", link: "/ai/openai" },
          { text: "Claude", link: "/ai/claude" },
          { text: "Claude Code", link: "/ai/claude-code" },
          { text: "Cursor", link: "/ai/cursor" },
          { text: "提示词", link: "/ai/prompts" },
          { text: "MCP", link: "/ai/mcp" },
        ],
      },
      {
        text: "📐 平台与规范",
        collapsed: false,
        items: [
          { text: "SGAO Platform 架构", link: "/guide/platform-architecture" },
          { text: "文档写作规范", link: "/guide/writing-standard" },
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
