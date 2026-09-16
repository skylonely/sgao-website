const ANONYMOUS_QUEUE_KEY = "sgao.todo.anonymous-sync.v1";

type PendingCheck = {
  checklistId: string;
  itemId: string;
  checked: boolean;
};

let retryTimer: ReturnType<typeof setTimeout> | undefined;

function readQueue(): PendingCheck[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ANONYMOUS_QUEUE_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is PendingCheck =>
      entry
      && typeof entry === "object"
      && typeof entry.checklistId === "string"
      && typeof entry.itemId === "string"
      && typeof entry.checked === "boolean",
    );
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingCheck[]) {
  if (queue.length) localStorage.setItem(ANONYMOUS_QUEUE_KEY, JSON.stringify(queue));
  else localStorage.removeItem(ANONYMOUS_QUEUE_KEY);
}

export function queueAnonymousCheck(checklistId: string, itemId: string, checked: boolean) {
  const key = `${checklistId}\n${itemId}`;
  const queue = readQueue().filter((entry) => `${entry.checklistId}\n${entry.itemId}` !== key);
  queue.push({ checklistId, itemId, checked });
  writeQueue(queue);
}

export async function flushAnonymousChecks(visitorId: string) {
  if (!navigator.onLine) return false;
  const queue = readQueue();
  if (!queue.length) return true;

  for (const pending of queue) {
    try {
      const response = await fetch(`/api/v1/checklists/${pending.checklistId}/items/${pending.itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Checklist-Visitor": visitorId,
        },
        body: JSON.stringify({ checked: pending.checked }),
      });
      if (!response.ok) continue;
      const latest = readQueue();
      writeQueue(latest.filter((entry) =>
        entry.checklistId !== pending.checklistId
          || entry.itemId !== pending.itemId
          || entry.checked !== pending.checked,
      ));
    } catch {
      // Keep this change in the persistent queue for the next retry.
    }
  }

  const completed = readQueue().length === 0;
  if (!completed && !retryTimer) {
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void flushAnonymousChecks(visitorId);
    }, 5_000);
  }
  return completed;
}
