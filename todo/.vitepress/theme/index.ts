import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import ChecklistState from "../../../travel/.vitepress/theme/ChecklistState.vue";
import "../../../travel/.vitepress/theme/checklist.css";

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "doc-after": () => h(ChecklistState),
    }),
};
