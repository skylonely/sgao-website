import defaultChecklists from "../todo/checklists.json";

export const TODO_ACCOUNT_ENDPOINT = "https://api.sgao.cc/api/v1/account/checklists";

const defaultRoutes = new Map(defaultChecklists.map((list) => [list.id, `/${list.slug}`]));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type WorkbenchChecklist = {
  id: string;
  title: string;
  href: string;
  remaining: number;
  total: number;
};

export type TodoOverview = {
  email: string;
  listCount: number;
  remaining: number;
  total: number;
  lists: WorkbenchChecklist[];
};

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
      || (list.deletedAt !== null && list.deletedAt !== undefined && typeof list.deletedAt !== "string")
      || !Array.isArray(list.items)) {
      throw new Error("清单响应格式不正确");
    }
    let listRemaining = 0;
    for (const item of list.items) {
      if (!item || typeof item !== "object" || typeof item.checked !== "boolean") {
        throw new Error("清单项目响应格式不正确");
      }
      if (!item.checked) listRemaining += 1;
    }
    if (list.deletedAt) continue;
    const route = defaultRoutes.get(list.id) ?? `/lists/${encodeURIComponent(list.slug)}`;
    const entry = {
      id: list.id, title: list.title.trim(), href: `https://todo.sgao.cc${route}`,
      remaining: listRemaining, total: list.items.length,
    };
    lists.push(entry);
    remaining += listRemaining;
    total += list.items.length;
  }
  return { email, listCount: lists.length, remaining, total, lists: lists.slice(0, 3) };
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
