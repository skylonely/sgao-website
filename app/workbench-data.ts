import defaultChecklists from "../todo/checklists.json";

export const TODO_ACCOUNT_ENDPOINT = "https://api.sgao.cc/api/v1/account/checklists";

const defaultRoutes = new Map(defaultChecklists.map((list) => [list.id, `/${list.slug}`]));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type WorkbenchTodoItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type WorkbenchChecklist = {
  id: string;
  title: string;
  description: string;
  href: string;
  remaining: number;
  total: number;
  items: WorkbenchTodoItem[];
};

export type TodoOverview = {
  email: string;
  listCount: number;
  remaining: number;
  total: number;
  lists: WorkbenchChecklist[];
};

export type TodoOverviewStatus = "idle" | "loading" | "ready" | "error";

export type TodoSearchResult = {
  list: WorkbenchChecklist;
  matchingItems: WorkbenchTodoItem[];
};

function searchTerms(query: string) {
  return query.normalize("NFKC").toLowerCase().trim().split(/\s+/u).filter(Boolean);
}

function includesAllTerms(text: string, terms: string[]) {
  const normalized = text.normalize("NFKC").toLowerCase();
  return terms.every((term) => normalized.includes(term));
}

export function matchesGlobalSearch(text: string, query: string) {
  const terms = searchTerms(query);
  return terms.length > 0 && includesAllTerms(text, terms);
}

export function searchTodoOverview(overview: TodoOverview, query: string): TodoSearchResult[] {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  return overview.lists.flatMap((list) => {
    const searchable = [list.title, list.description, ...list.items.map(({ label }) => label)].join("\n");
    if (!includesAllTerms(searchable, terms)) return [];
    const matchingItems = list.items.filter(({ label }) => {
      const normalized = label.normalize("NFKC").toLowerCase();
      return terms.some((term) => normalized.includes(term));
    });
    return [{ list, matchingItems }];
  });
}

export function parseTodoOverview(value: unknown, expectedEmail: string): TodoOverview {
  const data = (value as { data?: Record<string, unknown> } | null)?.data;
  const account = data?.account as { email?: unknown } | undefined;
  const email = typeof account?.email === "string" ? account.email.trim().toLowerCase() : "";
  if (!email || email !== expectedEmail.trim().toLowerCase() || !Array.isArray(data?.lists)) {
    throw new Error("清单账号或响应格式不正确");
  }

  const lists: WorkbenchChecklist[] = [];
  let remaining = 0;
  let total = 0;
  for (const candidate of data.lists) {
    if (!candidate || typeof candidate !== "object") throw new Error("清单响应格式不正确");
    const list = candidate as Record<string, unknown>;
    if (typeof list.id !== "string" || !list.id
      || typeof list.slug !== "string" || !slugPattern.test(list.slug)
      || typeof list.title !== "string" || !list.title.trim()
      || (list.description !== undefined && typeof list.description !== "string")
      || (list.deletedAt !== null && list.deletedAt !== undefined && typeof list.deletedAt !== "string")
      || !Array.isArray(list.items)) {
      throw new Error("清单响应格式不正确");
    }
    const items: WorkbenchTodoItem[] = [];
    let listRemaining = 0;
    for (const item of list.items) {
      if (!item || typeof item !== "object") {
        throw new Error("清单项目响应格式不正确");
      }
      const candidateItem = item as Record<string, unknown>;
      if (typeof candidateItem.id !== "string" || !candidateItem.id
        || typeof candidateItem.label !== "string" || !candidateItem.label.trim()
        || typeof candidateItem.checked !== "boolean") {
        throw new Error("清单项目响应格式不正确");
      }
      const parsedItem = {
        id: candidateItem.id,
        label: candidateItem.label.trim(),
        checked: candidateItem.checked,
      };
      items.push(parsedItem);
      if (!parsedItem.checked) listRemaining += 1;
    }
    if (list.deletedAt) continue;
    const route = defaultRoutes.get(list.id) ?? `/lists/${encodeURIComponent(list.slug)}`;
    const entry = {
      id: list.id, title: list.title.trim(), description: typeof list.description === "string" ? list.description.trim() : "",
      href: `https://todo.sgao.cc${route}`,
      remaining: listRemaining, total: items.length, items,
    };
    lists.push(entry);
    remaining += listRemaining;
    total += list.items.length;
  }
  return { email, listCount: lists.length, remaining, total, lists };
}

export async function fetchTodoOverview(
  expectedEmail: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<TodoOverview> {
  const response = await fetcher(TODO_ACCOUNT_ENDPOINT, {
    credentials: "include", cache: "no-store", redirect: "manual", signal,
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("暂时无法读取 Todo 清单");
  }
  return parseTodoOverview(await response.json(), expectedEmail);
}
