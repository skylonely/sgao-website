import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import ChecklistIndex from "./ChecklistIndex.vue";
import ChecklistPage from "./ChecklistPage.vue";
import "../../../travel/.vitepress/theme/checklist.css";

const todoTheme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("ChecklistIndex", ChecklistIndex);
    app.component("ChecklistPage", ChecklistPage);
  },
  Layout: () => h(DefaultTheme.Layout),
};

export default todoTheme;
