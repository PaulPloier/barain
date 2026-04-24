import "./styles/main.css";
import { createAppShell } from "./components/appShell.js";
import { initVideoScroll } from "./scripts/videoScroll.js";

const PRELOADER_HOLD_MS = 320;
const PRELOADER_FADE_MS = 820;
const PROGRESS_WEIGHTS = {
  sequence: 0.86,
  fonts: 0.07,
  window: 0.07,
};

const app = document.querySelector("#app");

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function waitForWindowLoad() {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener("load", resolve, { once: true });
  });
}

function waitForFonts() {
  if (!document.fonts?.ready) {
    return Promise.resolve();
  }

  return document.fonts.ready.catch(() => {});
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function setAppState(state) {
  document.documentElement.dataset.appState = state;
  document.body.dataset.appState = state;
}

function formatProgress(progress) {
  return `${Math.round(clamp(progress) * 100)}%`;
}

setAppState("loading");
app.innerHTML = createAppShell();

const siteShell = document.querySelector("[data-site-shell]");
const preloader = document.querySelector("[data-site-preloader]");
const preloaderProgress = document.querySelector("[data-preloader-progress]");
const progressState = {
  sequence: 0,
  fonts: 0,
  window: 0,
};

function updatePreloaderProgress() {
  const total =
    progressState.sequence * PROGRESS_WEIGHTS.sequence +
    progressState.fonts * PROGRESS_WEIGHTS.fonts +
    progressState.window * PROGRESS_WEIGHTS.window;

  if (preloaderProgress) {
    preloaderProgress.textContent = formatProgress(total);
  }
}

updatePreloaderProgress();

const sequenceController = initVideoScroll({
  onProgress: (progress) => {
    progressState.sequence = clamp(progress);
    updatePreloaderProgress();
  },
});

const fontsReady = waitForFonts().then(() => {
  progressState.fonts = 1;
  updatePreloaderProgress();
});

const windowReady = waitForWindowLoad().then(() => {
  progressState.window = 1;
  updatePreloaderProgress();
});

Promise.all([sequenceController.ready, fontsReady, windowReady])
  .catch((error) => {
    console.error("BARAiN preload completed with a fallback path:", error);
    progressState.sequence = 1;
    progressState.fonts = 1;
    progressState.window = 1;
    updatePreloaderProgress();
  })
  .then(async () => {
    progressState.sequence = 1;
    progressState.fonts = 1;
    progressState.window = 1;
    updatePreloaderProgress();

    await waitForNextPaint();
    await wait(PRELOADER_HOLD_MS);

    siteShell?.setAttribute("data-state", "ready");
    preloader?.setAttribute("data-state", "exiting");

    await wait(PRELOADER_FADE_MS);

    preloader?.setAttribute("data-state", "hidden");
    window.scrollTo(0, 0);
    setAppState("ready");
  });
