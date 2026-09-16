import { reactive } from "vue";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
};

export const pwaState = reactive({
  supported: false,
  installed: false,
  installAvailable: false,
  manualInstallHint: false,
  offlineReady: false,
  updateReady: false,
});

let installPrompt: BeforeInstallPromptEvent | undefined;
let registration: ServiceWorkerRegistration | undefined;
let initialized = false;
let activatingUpdate = false;

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function watchRegistration(candidate: ServiceWorkerRegistration) {
  registration = candidate;
  if (candidate.waiting) pwaState.updateReady = true;
  candidate.addEventListener("updatefound", () => {
    const worker = candidate.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        pwaState.updateReady = true;
      }
    });
  });
}

export function initializePwa() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  pwaState.installed = isStandalone();
  pwaState.manualInstallHint = !pwaState.installed
    && /iPad|iPhone|iPod/.test(navigator.userAgent);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    pwaState.installAvailable = true;
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = undefined;
    pwaState.installAvailable = false;
    pwaState.installed = true;
  });

  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  pwaState.supported = true;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (activatingUpdate) window.location.reload();
  });
  void navigator.serviceWorker.register("/sw.js", { scope: "/" })
    .then((candidate) => {
      watchRegistration(candidate);
      return navigator.serviceWorker.ready;
    })
    .then(() => { pwaState.offlineReady = true; })
    .catch(() => { pwaState.offlineReady = false; });

  const checkForUpdate = () => {
    if (document.visibilityState === "visible") void registration?.update();
  };
  window.addEventListener("focus", checkForUpdate);
  document.addEventListener("visibilitychange", checkForUpdate);
}

export async function installPwa() {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === "accepted") pwaState.installAvailable = false;
  installPrompt = undefined;
}

export function activatePwaUpdate() {
  const waiting = registration?.waiting;
  if (!waiting) return;
  activatingUpdate = true;
  waiting.postMessage({ type: "SKIP_WAITING" });
}
