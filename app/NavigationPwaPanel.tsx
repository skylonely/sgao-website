"use client";

import { navigationPwa, type NavigationPwaState } from "./navigation-pwa";

export default function NavigationPwaPanel({ state }: { state: NavigationPwaState }) {
  const busy = state.phase === "checking" || state.phase === "preparing";
  return (
    <section className="navigation-pwa-panel" aria-label="安装与离线使用">
      <h3>安装与离线使用</h3>
      {state.installed && <p className="navigation-pwa-installed">已在 App 模式打开</p>}
      <p role="status">{state.message}</p>
      <div className="navigation-pwa-actions">
        {state.canInstall && <button type="button" className="navigation-pwa-primary" disabled={state.installBusy} onClick={() => void navigationPwa.install()}>安装到设备</button>}
        {state.phase !== "unavailable" && <button type="button" disabled={busy} onClick={() => void navigationPwa.checkOffline()}>
          {busy ? "准备中…" : state.phase === "error" ? "重新准备离线导航" : "检查离线资源与更新"}
        </button>}
      </div>
      {!state.installed && <p className="navigation-pwa-note">iPhone：在 Safari 分享菜单中选择“添加到主屏幕”。安卓及电脑：使用上方安装按钮，或浏览器菜单中的“安装 / 添加到主屏幕”。</p>}
      {state.installMessage && <p role="status">{state.installMessage}</p>}
      {state.updateAvailable && <div className="navigation-pwa-update">
        <p>新版已准备好。更新会刷新页面，请先完成正在填写的内容；已保存的本机导航不受影响。</p>
        <button type="button" onClick={() => navigationPwa.applyUpdate()}>应用更新并刷新</button>
      </div>}
      <p className="navigation-pwa-note">离线可以查看、搜索和编辑本机导航，第三方网站及账号登录仍需联网。离线缓存不包含账号接口和登录凭据；账号同步会在页面打开并连接恢复后继续。</p>
      <p className="navigation-pwa-note">首次离线使用需先联网完成准备。浏览器清理或回收站点存储可能移除离线资源和本机数据，请定期导出备份。</p>
    </section>
  );
}
