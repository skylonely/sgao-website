"use client";

import { useState } from "react";
import {
  downloadPreSyncBackup, logoutNavigationAccount, navigationAccount,
  startNavigationLogin, type NavigationAccountState,
} from "./navigation-sync";

export default function NavigationAccountPanel({ state }: { state: NavigationAccountState }) {
  const [backupMessage, setBackupMessage] = useState("");
  const choosing = state.phase === "choice" || state.phase === "conflict";
  const time = state.updatedAt && !Number.isNaN(Date.parse(state.updatedAt))
    ? new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(state.updatedAt))
    : "";

  return (
    <section className="navigation-account-panel" aria-label="账号与导航同步">
      <div className="navigation-account-panel__heading">
        <div>
          <strong>账号与导航同步</strong>
          {state.signedIn && <span className="navigation-account-email">{state.email}</span>}
        </div>
        {state.signedIn && <button type="button" onClick={logoutNavigationAccount}>退出账号</button>}
      </div>
      <p role="status">{state.message}</p>
      {time && <small>上次同步：{time}</small>}
      {choosing ? (
        <>
          <p className="navigation-account-note">
            合并会保留双方的收藏、网站和分类；使用云端会替换本机导航，并保存一份同步前备份。访问足迹不受影响，也不会上传。
          </p>
          <div className="navigation-account-actions">
            <button className="navigation-account-primary" type="button" onClick={() => void navigationAccount.choose("merge")}>
              {state.phase === "conflict" ? "合并本机修改" : "合并本机数据并同步"}
            </button>
            <button type="button" onClick={() => void navigationAccount.choose("cloud")}>
              {state.cloudInitialized ? "使用云端导航" : "不导入，开始空导航"}
            </button>
          </div>
        </>
      ) : (
        <div className="navigation-account-actions">
          {!state.signedIn ? (
            <button className="navigation-account-primary" type="button" disabled={!state.ready} onClick={startNavigationLogin}>
              {state.ready ? "登录账号" : "检查中…"}
            </button>
          ) : (
            <>
              <button type="button" disabled={state.phase === "syncing"} onClick={() => void navigationAccount.refresh()}>
                {state.phase === "syncing" ? "同步中…" : "立即同步"}
              </button>
              {state.phase === "error" && <button type="button" onClick={startNavigationLogin}>重新登录</button>}
            </>
          )}
        </div>
      )}
      <p className="navigation-account-note">仅同步收藏、自定义网站和分类；足迹、搜索记录及显示偏好只留在本机。</p>
      <button className="navigation-account-backup" type="button" onClick={() => {
        setBackupMessage(downloadPreSyncBackup() ? "同步前备份已下载。" : "当前没有同步前备份。原有导出功能仍可使用。");
      }}>下载同步前备份</button>
      {backupMessage && <p role="status">{backupMessage}</p>}
    </section>
  );
}
