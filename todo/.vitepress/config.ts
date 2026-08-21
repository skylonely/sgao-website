import { defineConfig } from "vitepress";

export default defineConfig({
  srcDir: "../docs/todo",
  title: "SGAO Todo",
  description: "SGAO 的个人待办与清单",
  lang: "zh-CN",
  cleanUrls: true,
  themeConfig: {
    siteTitle: "SGAO Todo",
    nav: [
      { text: "清单首页", link: "/" },
      { text: "旅行站", link: "https://travel.sgao.cc" },
      { text: "SGAO", link: "https://sgao.cc" },
    ],
    footer: {
      message: "一项一项，轻松完成。",
      copyright: "SGAO Todo",
    },
  },
});
