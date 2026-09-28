"use client";

import { startNavigationLogin } from "./navigation-sync";
import { searchTodoOverview, type TodoOverview, type TodoOverviewStatus } from "./workbench-data";

export default function GlobalSearchResults({ query, signedIn, overview, status }: {
  query: string;
  signedIn: boolean;
  overview: TodoOverview | null;
  status: TodoOverviewStatus;
}) {
  const results = overview ? searchTodoOverview(overview, query) : [];
  const visibleResults = results.slice(0, 8);

  return (
    <section className="global-search-results" aria-labelledby="global-search-heading">
      <div className="section-heading global-search-heading">
        <div>
          <span>TODO RESULTS</span>
          <h2 id="global-search-heading">Todo 清单与待办<sup>{results.length}</sup></h2>
        </div>
        <a href="https://img.sgao.cc/admin/files/">继续在图片库搜索 <span>↗</span></a>
      </div>

      {!signedIn ? (
        <div className="global-search-message">
          <div><strong>登录后可以同时搜索个人 Todo</strong><p>网站搜索不受影响，清单内容不会在未登录时读取。</p></div>
          <button type="button" onClick={startNavigationLogin}>登录账号 ↗</button>
        </div>
      ) : status === "loading" || status === "idle" ? (
        <p className="global-search-state">正在搜索 Todo 清单…</p>
      ) : status === "error" ? (
        <div className="global-search-message"><div><strong>暂时无法读取 Todo</strong><p>仍可继续查看下方的网站搜索结果。</p></div><a href="https://todo.sgao.cc/">打开 Todo ↗</a></div>
      ) : visibleResults.length ? (
        <>
          <div className="global-search-todo-grid">
            {visibleResults.map(({ list, matchingItems }) => (
              <a className="global-search-todo-card" href={list.href} key={list.id}>
                <div className="global-search-todo-title"><strong>{list.title}</strong><span>待完成 {list.remaining}/{list.total} ↗</span></div>
                {matchingItems.length ? (
                  <ul>{matchingItems.slice(0, 3).map((item) => <li className={item.checked ? "checked" : ""} key={item.id}><span>{item.checked ? "✓" : "○"}</span>{item.label}</li>)}</ul>
                ) : <p>{list.description || "清单标题或说明与关键词匹配。"}</p>}
                {matchingItems.length > 3 && <small>另有 {matchingItems.length - 3} 项匹配</small>}
              </a>
            ))}
          </div>
          {results.length > visibleResults.length && <p className="global-search-state">还有 {results.length - visibleResults.length} 张匹配清单，可前往 Todo 继续查看。</p>}
        </>
      ) : <p className="global-search-state">Todo 中没有找到与“{query.trim()}”匹配的清单或待办。</p>}
    </section>
  );
}
