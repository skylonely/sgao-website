function searchTerms(query) {
  return query.normalize("NFKC").toLowerCase().trim().split(/\s+/u).filter(Boolean);
}

function matchesTerms(text, terms) {
  const normalized = text.normalize("NFKC").toLowerCase();
  return terms.every((term) => normalized.includes(term));
}

export function shouldOpenCreateChecklist(search) {
  return new URLSearchParams(search).get("create") === "1";
}

export function shouldOpenChecklistBackup(search) {
  return new URLSearchParams(search).get("backup") === "1";
}

export function withoutCreateChecklistParam(url) {
  const next = new URL(url, "https://todo.sgao.cc/");
  next.searchParams.delete("create");
  return `${next.pathname}${next.search}${next.hash}`;
}

export function withoutChecklistActionParams(url) {
  const next = new URL(url, "https://todo.sgao.cc/");
  next.searchParams.delete("create");
  next.searchParams.delete("backup");
  return `${next.pathname}${next.search}${next.hash}`;
}

/** @template {{ title: string, description: string, items: Array<{ label: string }> }} T
 * @param {T[]} lists
 * @param {string} query
 * @returns {T[]}
 */
export function searchChecklists(lists, query) {
  const terms = searchTerms(query);
  return lists.filter((list) => matchesTerms(
    [list.title, list.description, ...list.items.map(({ label }) => label)].join("\n"),
    terms,
  ));
}

/** @template {{ label: string }} T
 * @param {T[]} items
 * @param {string} query
 * @returns {T[]}
 */
export function matchingChecklistItems(items, query) {
  const terms = searchTerms(query);
  return terms.length ? items.filter(({ label }) => matchesTerms(label, terms)) : [];
}

/** @template {{ id: string }} T
 * @param {T[]} items
 * @param {Set<string>} checkedIds
 * @param {"all" | "unchecked" | "checked"} filter
 * @returns {T[]}
 */
export function filterChecklistItems(items, checkedIds, filter) {
  return items.filter(({ id }) => filter === "all"
    || (filter === "checked" ? checkedIds.has(id) : !checkedIds.has(id)));
}

/** @param {Array<{ id: string }>} items
 * @param {Set<string>} checkedIds
 */
export function checklistProgress(items, checkedIds) {
  const completed = items.filter(({ id }) => checkedIds.has(id)).length;
  return { total: items.length, completed, remaining: items.length - completed };
}
