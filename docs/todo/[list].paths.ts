import checklists from "../../todo/checklists.json";

const checklistRoutes = {
  paths() {
    return checklists.map((checklist) => ({
      params: {
        list: checklist.slug,
      },
    }));
  },
};

export default checklistRoutes;
