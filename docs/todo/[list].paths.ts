import checklists from "../../todo/checklists.json";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function checklistContent(checklist: (typeof checklists)[number]) {
  const items = checklist.items
    .map(({ id, label }) =>
      `<span data-checklist-id="${escapeHtml(id)}"></span>☐ ${escapeHtml(label)}`,
    )
    .join("\n\n");

  return `# ${escapeHtml(checklist.title)}\n\n${escapeHtml(checklist.description)}\n\n${items}`;
}

const checklistRoutes = {
  paths() {
    return checklists.map((checklist) => ({
      params: {
        list: checklist.slug,
      },
      content: checklistContent(checklist),
    }));
  },
};

export default checklistRoutes;
