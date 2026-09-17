type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type PwaEnvironment = {
  secure: boolean;
  serviceWorkers?: ServiceWorkerContainer;
  standalone: () => boolean;
  listen: (name: string, handler: EventListener) => () => void;
  listenDisplay: (handler: () => void) => () => void;
  channel: () => MessageChannel;
  reload: () => void;
};
export type NavigationPwaState = {
  phase: "checking" | "preparing" | "ready" | "unavailable" | "error";
  message: string;
  installed: boolean;
  canInstall: boolean;
  installBusy: boolean;
  installMessage: string;
  updateAvailable: boolean;
};
const INITIAL_STATE: NavigationPwaState = {
  phase: "checking", message: "正在检查离线资源…", installed: false, canInstall: false,
  installBusy: false, installMessage: "", updateAvailable: false,
};

function browserEnvironment(): PwaEnvironment {
  const media = window.matchMedia("(display-mode: standalone)");
  return {
    secure: window.isSecureContext,
    serviceWorkers: "serviceWorker" in navigator ? navigator.serviceWorker : undefined,
    standalone: () => media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    listen(name, handler) {
      window.addEventListener(name, handler);
      return () => window.removeEventListener(name, handler);
    },
    listenDisplay(handler) {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    },
    channel: () => new MessageChannel(),
    reload: () => window.location.reload(),
  };
}

export class NavigationPwaController {
  private state = INITIAL_STATE;
  private listeners = new Set<() => void>();
  private environment: PwaEnvironment | undefined;
  private registration: ServiceWorkerRegistration | undefined;
  private promptEvent: InstallPrompt | undefined;
  private cleanups: (() => void)[] = [];
  private started = false;
  private generation = 0;
  private reloadOnActivation = false;
  private startPromise: Promise<void> | undefined;

  constructor(private providedEnvironment?: PwaEnvironment) {}
  getSnapshot = () => this.state;
  getServerSnapshot = () => INITIAL_STATE;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(next: Partial<NavigationPwaState>) {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((listener) => listener());
  }
  private current(generation: number) { return this.started && generation === this.generation; }

  start() {
    if (this.started) return this.startPromise ?? Promise.resolve();
    this.started = true;
    const generation = ++this.generation;
    const environment = this.environment = this.providedEnvironment ?? browserEnvironment();
    this.update({ installed: environment.standalone() });
    this.cleanups.push(environment.listen("beforeinstallprompt", (event) => {
      if (!("prompt" in event) || typeof event.prompt !== "function") return;
      event.preventDefault();
      this.promptEvent = event as InstallPrompt;
      this.update({ canInstall: !this.state.installed, installMessage: "" });
    }));
    const installed = () => {
      this.promptEvent = undefined;
      this.update({ installed: true, canInstall: false, installMessage: "已添加到设备，可从桌面图标打开。" });
    };
    this.cleanups.push(environment.listen("appinstalled", installed));
    this.cleanups.push(environment.listenDisplay(() => {
      if (environment.standalone()) installed();
    }));
    if (!environment.secure || !environment.serviceWorkers) {
      this.update({ phase: "unavailable", message: "当前浏览器或连接不支持离线缓存，仍可正常在线使用导航。" });
      return Promise.resolve();
    }
    const serviceWorkers = environment.serviceWorkers;
    const controllerChanged = () => {
      if (this.reloadOnActivation) {
        this.reloadOnActivation = false;
        environment.reload();
      } else void this.inspectActive();
    };
    serviceWorkers.addEventListener("controllerchange", controllerChanged);
    this.cleanups.push(() => serviceWorkers.removeEventListener("controllerchange", controllerChanged));
    this.startPromise = (async () => {
      try {
        this.update({ phase: "preparing", message: "正在准备离线导航，首次准备请保持联网…" });
        const registration = await serviceWorkers.register("/navigation-sw.js", { scope: "/", updateViaCache: "none" });
        if (!this.current(generation)) return;
        this.registration = registration;
        this.watchRegistration(registration);
        if (!registration.active) await serviceWorkers.ready;
        if (!this.current(generation)) return;
        await this.inspectActive();
      } catch {
        if (this.current(generation)) this.update({ phase: "error", message: "离线导航暂未准备好，请联网后重试；本机导航数据不受影响。" });
      }
    })();
    return this.startPromise;
  }

  private watchRegistration(registration: ServiceWorkerRegistration) {
    this.update({ updateAvailable: Boolean(registration.waiting) });
    const watchWorker = () => {
      const worker = registration.installing;
      if (!worker) return;
      const changed = () => {
        if (worker.state === "installed") this.update({ updateAvailable: Boolean(registration.waiting) });
        if (worker.state === "activated") void this.inspectActive();
        if (worker.state === "redundant" && !registration.active) {
          this.update({ phase: "error", message: "离线资源下载未完成，请联网后重试。已有本机数据未修改。" });
        }
      };
      worker.addEventListener("statechange", changed);
      this.cleanups.push(() => worker.removeEventListener("statechange", changed));
    };
    watchWorker();
    registration.addEventListener("updatefound", watchWorker);
    this.cleanups.push(() => registration.removeEventListener("updatefound", watchWorker));
  }

  private workerStatus(worker: ServiceWorker, prepare: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      const channel = this.environment!.channel();
      const finish = (ready: boolean) => {
        clearTimeout(timer);
        channel.port1.close(); channel.port2.close();
        resolve(ready);
      };
      const timer = setTimeout(() => finish(false), prepare ? 15000 : 3000);
      channel.port1.onmessage = (event) => finish(event.data?.type === "OFFLINE_STATUS" && event.data.ready === true);
      try { worker.postMessage({ type: prepare ? "PREPARE_OFFLINE" : "GET_OFFLINE_STATUS" }, [channel.port2]); }
      catch { finish(false); }
    });
  }

  private async inspectActive(prepare = false) {
    const generation = this.generation;
    const worker = this.registration?.active;
    if (!this.started || !worker) return;
    const ready = await this.workerStatus(worker, prepare);
    if (!this.current(generation)) return;
    this.update({ phase: ready ? "ready" : "error", updateAvailable: Boolean(this.registration?.waiting),
      message: ready ? "离线导航已准备好，断网后仍可打开和编辑本机导航。"
        : "离线资源暂不可用，请联网后重新准备；本机导航数据仍保留。" });
  }

  async checkOffline() {
    if (!this.registration?.active) { this.stop(); await this.start(); return; }
    const generation = this.generation;
    this.update({ phase: "preparing", message: "正在重新准备离线资源…" });
    try { await this.registration.update(); } catch { /* Existing cached navigation remains usable. */ }
    if (this.current(generation)) await this.inspectActive(true);
  }

  async install() {
    const prompt = this.promptEvent;
    if (!prompt || this.state.installBusy || this.state.installed) return;
    const generation = this.generation;
    this.promptEvent = undefined;
    this.update({ canInstall: false, installBusy: true });
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (this.current(generation)) this.update({ installMessage: choice.outcome === "accepted"
        ? "安装请求已确认，请按浏览器提示完成。" : "已取消安装，仍可正常使用网页和离线导航。" });
    } catch {
      if (this.current(generation)) this.update({ installMessage: "安装提示暂不可用，可通过浏览器菜单添加到桌面。" });
    } finally { if (this.current(generation)) this.update({ installBusy: false }); }
  }

  applyUpdate() {
    const worker = this.registration?.waiting;
    if (!worker || !this.started) return;
    this.reloadOnActivation = true;
    try { worker.postMessage({ type: "SKIP_WAITING" }); }
    catch {
      this.reloadOnActivation = false;
      this.update({ message: "更新暂未应用，请稍后重试。本机数据仍保留。" });
    }
  }

  stop() {
    this.started = false;
    this.generation += 1;
    this.cleanups.splice(0).forEach((cleanup) => cleanup());
    this.reloadOnActivation = false;
    this.promptEvent = undefined;
    this.startPromise = undefined;
    this.registration = undefined;
    this.update({ canInstall: false, installBusy: false });
  }
}

export const navigationPwa = new NavigationPwaController();
