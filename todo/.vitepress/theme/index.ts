import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import ChecklistState from "../../../travel/.vitepress/theme/ChecklistState.vue";
import ChecklistIndex from "./ChecklistIndex.vue";
import "../../../travel/.vitepress/theme/checklist.css";

const todoTheme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("ChecklistIndex", ChecklistIndex);
  },
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "doc-after": () => h(ChecklistState),
    }),
};

export default todoTheme;
