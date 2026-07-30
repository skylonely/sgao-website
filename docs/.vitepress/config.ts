import { defineConfig } from "vitepress";

export default defineConfig({
  title: "SGAO Knowledge Base",
  description: "SGAO 平台架构与 Cloudflare 实践知识库",
  lang: "zh-CN",
  themeConfig: {
    siteTitle: "SGAO",
    nav: [
      { text: "首页", link: "/" },
      { text: "平台架构", link: "/guide/platform-architecture" },
      {
        text: "Cloudflare",
        items: [
          { text: "Cloudflare 文档", link: "/cloudflare/" },
          {
            text: "Workers 自动部署",
            link: "/cloudflare/workers-auto-deploy",
          },
          { text: "DNS 与域名配置", link: "/cloudflare/dns-domain" },
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
