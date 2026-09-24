"use client";

import { useEffect, useState } from "react";
import { startNavigationLogin, type NavigationAccountState } from "./navigation-sync";
import { fetchTodoOverview, type TodoOverview } from "./workbench-data";

const shortcuts = [
  {
    name: "Todo 清单",
    description: "查看和整理你的待办",
    href: "https://todo.sgao.cc/",
    actions: [{ label: "＋ 新建", ariaLabel: "新建 Todo 清单", href: "https://todo.sgao.cc/?create=1" }],
    mark: "✓",
  },
  { name: "旅行计划", description: "行程、攻略与出发准备", href: "https://travel.sgao.cc/", mark: "↗" },
  { name: "知识库", description: "查阅收藏的技术笔记", href: "https://docs.sgao.cc/", mark: "▤" },
  {
    name: "图片管理",
    description: "上传、整理与恢复图片",
    href: "https://img.sgao.cc/admin/files/",
    actions: [
      { label: "上传图片", ariaLabel: "上传图片", href: "https://img.sgao.cc/admin/" },
    ],
    mark: "▧",
  },
] as const;

export default function Workbench({ accountState }: { accountState: NavigationAccountState }) {
  const [overview, setOverview] = useState<TodoOverview | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [refresh, setRefresh] = useState(0);
  const signedInEmail = accountState.signedIn ? accountState.email.trim().toLowerCase() : "";

  useEffect(() => {
    if (!signedInEmail) return;
    const controller = new AbortController();
    fetchTodoOverview(signedInEmail, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setOverview(result);
      setStatus("ready");
    }).catch(() => {
      if (controller.signal.aborted) return;
      setOverview(null);
      setStatus("error");
    });
    return () => controller.abort();
  }, [signedInEmail, refresh]);

  useEffect(() => {
    if (!signedInEmail) return;
    let lastRefresh = Date.now();
    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastRefresh < 30_000) return;
      lastRefresh = Date.now();
      setRefresh((value) => value + 1);
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [signedInEmail]);

  const currentOverview = status === "ready" && overview?.email === signedInEmail ? overview : null;

  return (
    <section className="workbench" id="workbench" aria-labelledby="workbench-heading">
      <div className="workbench-heading">
        <div>
          <span>YOUR SPACE</span>
          <h2 id="workbench-heading">我的工作台</h2>
        </div>
        <p>常用入口，打开即达。</p>
      </div>
      <div className="workbench-grid">
        {shortcuts.map((shortcut) => (
          <article className="workbench-shortcut" key={shortcut.href}>
            <a className="workbench-shortcut-main" href={shortcut.href}>
              <span className="workbench-shortcut-mark" aria-hidden="true">{shortcut.mark}</span>
              <span className="workbench-shortcut-copy">
                <strong>{shortcut.name}</strong>
                <small>{shortcut.description}</small>
              </span>
            </a>
            {"actions" in shortcut ? (
              <span className="workbench-shortcut-actions">
                {shortcut.actions.map((action) => (
                  <a className="workbench-shortcut-action" href={action.href} aria-label={action.ariaLabel} key={action.href}>
                    {action.label}
                  </a>
                ))}
              </span>
            ) : <span className="workbench-shortcut-arrow" aria-hidden="true">↗</span>}
          </article>
        ))}
      </div>

      {signedInEmail && (
        <div className="workbench-todo" aria-live="polite">
          <div className="workbench-todo-head">
            <div>
              <span>TODO OVERVIEW</span>
              <h3>清单概览</h3>
            </div>
            <div className="workbench-todo-actions">
              <button type="button" onClick={() => { setStatus("loading"); setRefresh((value) => value + 1); }}>刷新</button>
              <a href="https://todo.sgao.cc/">打开 Todo ↗</a>
            </div>
          </div>
          {currentOverview ? (
            <>
              <p className="workbench-todo-summary">{currentOverview.listCount} 张清单 · {currentOverview.remaining} 项待完成</p>
              {currentOverview.lists.length > 0 ? (
                <ul className="workbench-todo-lists">
                  {currentOverview.lists.map((list) => (
                    <li key={list.id}>
                      <a href={list.href}><span>{list.title}</span><small>待完成 {list.remaining}/{list.total} ↗</small></a>
                    </li>
                  ))}
                </ul>
              ) : <p className="workbench-todo-message">还没有清单，可以去 Todo 创建。</p>}
              {currentOverview.listCount > currentOverview.lists.length && <small className="workbench-todo-note">按 Todo 中的顺序展示前 3 张清单。</small>}
            </>
          ) : (
            <p className="workbench-todo-message">
              {status === "error" ? "暂时无法读取清单。可以重试，或打开 Todo 检查登录状态。" : "正在读取清单…"}
            </p>
          )}
        </div>
      )}
      {accountState.ready && !signedInEmail && (
        <button className="workbench-login" type="button" onClick={startNavigationLogin}>登录后查看我的清单概览 ↗</button>
      )}
    </section>
  );
}
