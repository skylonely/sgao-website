"use client";

import { useEffect, useRef } from "react";
import type { NavigationImportMode, NavigationImportPreview } from "./navigation-backup";

export default function NavigationImportDialog({ preview, mode, error, onMode, onCancel, onConfirm }: {
  preview: NavigationImportPreview; mode: NavigationImportMode; error: string;
  onMode: (mode: NavigationImportMode) => void; onCancel: () => void; onConfirm: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancel.current?.focus();
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  const recovery = preview.source === "recovery";
  const result = mode === "merge" ? preview.merged : preview.replacement;
  const rows = [
    ["收藏", preview.current.favorites.length, preview.incoming.favorites.length, result?.favorites.length],
    ["自定义网站", preview.current.customSites.length, preview.incoming.customSites.length, result?.customSites.length],
    ["自定义分类", preview.current.customNavigations.length, preview.incoming.customNavigations.length, result?.customNavigations.length],
    ["访问足迹", preview.current.history.length, preview.incoming.history?.length ?? "未包含", result?.history.length],
  ];
  return <div className="modal-layer confirm-layer">
    <button className="modal-mask" aria-label="取消备份操作" onClick={onCancel} />
    <section ref={dialog} className="confirm-modal navigation-import-modal" role="dialog" aria-modal="true" aria-labelledby="navigation-import-title" aria-describedby="navigation-import-description" onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); onCancel(); }
      if (event.key !== "Tab") return;
      const buttons = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <span className="confirm-kicker">PREVIEW & CONFIRM</span>
      <h2 id="navigation-import-title">{recovery ? "恢复导入前备份" : "预览导航备份"}</h2>
      <p className="navigation-import-filename">{preview.name}</p>
      <p id="navigation-import-description">预览不会修改数据。确认后会先保存当前本机导航的自动备份；备份只留在此浏览器，不上传云端。</p>
      {!recovery && <fieldset className="navigation-import-options">
        <legend>导入方式</legend>
        <label><input type="radio" name="navigation-import-mode" value="merge" checked={mode === "merge"} disabled={!preview.merged} onChange={() => onMode("merge")} /><span><strong>合并现有数据（推荐）</strong><small>保留两边导航；同 ID 不同内容会分别保留，本机访问足迹不变。</small></span></label>
        <label><input type="radio" name="navigation-import-mode" value="replace" checked={mode === "replace"} onChange={() => onMode("replace")} /><span><strong>替换现有数据</strong><small>收藏、网站和分类以备份为准；备份未包含足迹时保留本机足迹。</small></span></label>
      </fieldset>}
      <table className="navigation-import-table"><caption>操作前后数量对比</caption><thead><tr><th scope="col">数据</th><th scope="col">本机</th><th scope="col">备份</th><th scope="col">操作后</th></tr></thead><tbody>{rows.map(([label, current, incoming, next]) => <tr key={label}><th scope="row">{label}</th><td>{current}</td><td>{incoming}</td><td>{next ?? "—"}</td></tr>)}</tbody></table>
      <p className="navigation-import-warning">{recovery ? "恢复会替换本机导航；恢复前的当前数据会成为新的自动备份。" : mode === "replace" ? "替换会移除未在备份中出现的本机收藏、网站和分类。" : "合并不会删除现有导航；内容不同的同 ID 条目可能产生新的条目。"} 启用账号同步时，确认后的收藏、网站和分类也可能同步至云端；已有冲突仍需单独处理。访问足迹只留在本机。</p>
      {preview.mergeError && <p className="navigation-import-error">{preview.mergeError}</p>}
      {error && <p className="navigation-import-error" role="alert">{error}</p>}
      <div className="confirm-actions"><button ref={cancel} onClick={onCancel}>取消</button><button className={mode === "replace" ? "confirm-danger" : "navigation-import-primary"} disabled={!result} onClick={onConfirm}>{recovery ? "确认恢复" : mode === "merge" ? "确认合并" : "确认替换"}</button></div>
    </section>
  </div>;
}
