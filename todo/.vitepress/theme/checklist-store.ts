import defaultChecklists from "../../checklists.json";

const CHECKLISTS_STORAGE_KEY = "sgao.todo.checklists.v1";
const CHECKED_STORAGE_PREFIX = "sgao.todo.checked.v1.";
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export type ChecklistItem = {
  id: string;
  label: string;
};

export type Checklist = {
  id: string;
  slug: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  deletedAt?: string;
};

function cloneChecklist(checklist: Checklist): Checklist {
  return {
    ...checklist,
    items: checklist.items.map((item) => ({ ...item })),
  };
}

function validChecklist(value: unknown): value is Checklist {
  if (!value || typeof value !== "object") return false;
  const checklist = value as Partial<Checklist>;
  return typeof checklist.id === "string"
    && typeof checklist.slug === "string"
    && typeof checklist.title === "string"
    && typeof checklist.description === "string"
    && (checklist.deletedAt === undefined
      || (typeof checklist.deletedAt === "string" && !Number.isNaN(Date.parse(checklist.deletedAt))))
    && Array.isArray(checklist.items)
    && checklist.items.every((item) =>
      item
      && typeof item.id === "string"
      && typeof item.label === "string",
    );
}

export function defaultLists(): Checklist[] {
  return (defaultChecklists as Checklist[]).map(cloneChecklist);
}

export function readAllChecklists(): Checklist[] {
  if (typeof window === "undefined") return defaultLists();

  try {
    const stored = localStorage.getItem(CHECKLISTS_STORAGE_KEY);
    if (!stored) return defaultLists();
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) && parsed.every(validChecklist)
      ? parsed.map(cloneChecklist)
      : defaultLists();
  } catch {
    return defaultLists();
  }
}

export function writeChecklists(checklists: Checklist[]) {
  const trashed = readAllChecklists().filter(({ deletedAt }) => deletedAt);
  writeAllChecklists([...checklists, ...trashed]);
}

export function writeAllChecklists(checklists: Checklist[]) {
  localStorage.setItem(CHECKLISTS_STORAGE_KEY, JSON.stringify(checklists));
}

export function readChecklists(): Checklist[] {
  return readAllChecklists().filter(({ deletedAt }) => !deletedAt);
}

export function readTrashedChecklists(): Checklist[] {
  return readAllChecklists()
    .filter((checklist): checklist is Checklist & { deletedAt: string } => Boolean(checklist.deletedAt))
    .sort((a, b) => Date.parse(b.deletedAt) - Date.parse(a.deletedAt));
}

export function moveChecklistToTrash(checklistId: string) {
  const deletedAt = new Date().toISOString();
  const lists = readAllChecklists().map((checklist) =>
    checklist.id === checklistId ? { ...checklist, deletedAt } : checklist,
  );
  writeAllChecklists(lists);
}

export function restoreTrashedChecklist(checklistId: string) {
  const all = readAllChecklists();
  const active = all.filter(({ deletedAt }) => !deletedAt);
  const lists = all.map((checklist) => {
    if (checklist.id !== checklistId) return checklist;
    const slugIsTaken = active.some(({ slug }) => slug === checklist.slug);
    const restored = cloneChecklist(checklist);
    delete restored.deletedAt;
    return slugIsTaken
      ? { ...restored, slug: uniqueSlug(restored.title, active) }
      : restored;
  });
  writeAllChecklists(lists);
}

export function permanentlyDeleteChecklist(checklistId: string) {
  writeAllChecklists(readAllChecklists().filter(({ id }) => id !== checklistId));
  removeLocalCheckedIds(checklistId);
}

export function cleanupExpiredTrash(now = Date.now()) {
  const all = readAllChecklists();
  const expired = all.filter(({ deletedAt }) =>
    deletedAt && now - Date.parse(deletedAt) >= TRASH_RETENTION_MS,
  );
  if (!expired.length) return 0;
  const expiredIds = new Set(expired.map(({ id }) => id));
  writeAllChecklists(all.filter(({ id }) => !expiredIds.has(id)));
  expired.forEach(({ id }) => removeLocalCheckedIds(id));
  return expired.length;
}

export function isDefaultChecklist(checklist: Checklist) {
  return defaultChecklists.some(({ id }) => id === checklist.id);
}

export function checklistHref(checklist: Checklist) {
  const defaultChecklist = defaultChecklists.find(({ id }) => id === checklist.id);
  return defaultChecklist
    ? `/${defaultChecklist.slug}`
    : `/lists/${encodeURIComponent(checklist.slug)}`;
}

function slugBase(title: string) {
  const normalized = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return normalized || "list";
}

export function uniqueSlug(title: string, checklists: Checklist[]) {
  const base = slugBase(title);
  const existing = new Set(checklists.map(({ slug }) => slug));
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function newChecklist(title: string, description: string, checklists: Checklist[]): Checklist {
  return {
    id: `list-${crypto.randomUUID()}`,
    slug: uniqueSlug(title, checklists),
    title: title.trim(),
    description: description.trim(),
    items: [],
  };
}

export function newChecklistItem(label = ""): ChecklistItem {
  return {
    id: `item-${crypto.randomUUID()}`,
    label,
  };
}

export function reorderEntries<T>(entries: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex
    || fromIndex < 0
    || toIndex < 0
    || fromIndex >= entries.length
    || toIndex >= entries.length) return [...entries];

  const next = [...entries];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function readLocalCheckedIds(checklistId: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${CHECKED_STORAGE_PREFIX}${checklistId}`) || "[]");
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function writeLocalCheckedIds(checklistId: string, ids: Set<string>) {
  localStorage.setItem(`${CHECKED_STORAGE_PREFIX}${checklistId}`, JSON.stringify([...ids]));
}

export function removeLocalCheckedIds(checklistId: string) {
  localStorage.removeItem(`${CHECKED_STORAGE_PREFIX}${checklistId}`);
}
