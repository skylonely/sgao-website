import { defineConfig } from "vitepress";

export default defineConfig({
  srcDir: "../docs/travel",
  title: "SGAO Travel",
  description: "SGAO 的旅行计划、行程攻略与出发清单",
  lang: "zh-CN",
  cleanUrls: true,
  themeConfig: {
    siteTitle: "SGAO Travel",
    nav: [
      { text: "旅行首页", link: "/" },
      {
        text: "沈阳 · 丹东 · 大连",
        link: "/shenyang-dandong-dalian/",
      },
      { text: "SGAO", link: "https://sgao.cc" },
      { text: "知识库", link: "https://docs.sgao.cc" },
    ],
    sidebar: {
      "/shenyang-dandong-dalian/": [
        {
          text: "沈阳 · 丹东 · 大连",
          items: [
            {
              text: "旅行概览",
              link: "/shenyang-dandong-dalian/",
            },
            {
              text: "6日5晚旅行攻略",
              link: "/shenyang-dandong-dalian/itinerary",
            },
            {
              text: "旅行准备清单",
              link: "/shenyang-dandong-dalian/checklist",
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
    footer: {
      message: "一路走，一路记录。",
      copyright: "SGAO Travel",
    },
  },
});
