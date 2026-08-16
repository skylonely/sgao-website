import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import ChecklistState from "./ChecklistState.vue";
import "./checklist.css";

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "doc-after": () => h(ChecklistState),
    }),
};
