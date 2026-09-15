import { defineConfig } from "vitepress";
import checklists from "../checklists.json";

export default defineConfig({
  srcDir: "../docs/todo",
  title: "SGAO Todo",
  description: "SGAO 的个人待办与清单",
  lang: "zh-CN",
  cleanUrls: true,
  transformPageData(pageData) {
    const slug = pageData.params?.list;
    if (typeof slug !== "string") return;

    const checklist = checklists.find((candidate) => candidate.slug === slug);
    if (!checklist) return;

    return {
      title: checklist.title,
      description: checklist.description,
      frontmatter: {
        ...pageData.frontmatter,
        title: checklist.title,
        description: checklist.description,
        checklistId: checklist.id,
        aside: false,
      },
    };
  },
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
