import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import {
  cloudflareBook,
  cloudNativeBook,
  createBookSidebar,
  gitBook,
  systemArchitectBook,
} from "./book-modules";

export default withMermaid(defineConfig({
  title: "SGAO Knowledge Base",
  description: "SGAO 平台架构、开发工具、AI 基础与 Cloudflare 实践知识库",
  lang: "zh-CN",
  srcExclude: ["travel/**"],
  themeConfig: {
    siteTitle: "SGAO",
    nav: [
      { text: "首页", link: "/" },
      { text: "软考专题", link: "/ruankao/system-architect/" },
      { text: "平台架构", link: "/guide/platform-architecture" },
      { text: "Git 专栏", link: "/git/" },
      { text: "云原生专题", link: "/cloud-native/" },
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
      { text: "Cloudflare 专题", link: "/cloudflare/" },
      { text: "文档规范", link: "/guide/writing-standard" },
    ],

    sidebar: {
      "/git/": createBookSidebar(gitBook),
      "/ruankao/system-architect/": createBookSidebar(systemArchitectBook),
      "/cloudflare/": createBookSidebar(cloudflareBook),
      "/cloud-native/": createBookSidebar(cloudNativeBook),
      "/": [
        {
          text: "📐 平台与规范",
          collapsed: false,
          items: [
            {
              text: "SGAO Platform 架构",
              link: "/guide/platform-architecture",
            },
            { text: "文档写作规范", link: "/guide/writing-standard" },
            { text: "Book Module 规范", link: "/guide/book-module-standard" },
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
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/skylonely/sgao-website",
      },
    ],
  },
}));
