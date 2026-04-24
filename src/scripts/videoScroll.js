const DEFAULT_SEQUENCE_FPS = 12;
const MAX_CANVAS_DPR = 1.5;
const FRAME_END_PROGRESS = 0.82;
const OVERLAY_FADE_START = 0.72;
const OVERLAY_FADE_END = 0.82;
const VEIL_FADE_START = 0.82;
const VEIL_FADE_END = 0.92;
const HEADLINE_REVEAL_START = 0.9;
const HEADLINE_REVEAL_END = 1;
const HEADER_REVEAL_START = 0.985;
const HEADER_REVEAL_END = 1;
const SEEK_EPSILON = 1 / 120;

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function waitForEvent(target, eventName) {
  return new Promise((resolve, reject) => {
    const handleSuccess = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error(`Failed while waiting for ${eventName}`));
    };

    const cleanup = () => {
      target.removeEventListener(eventName, handleSuccess);
      target.removeEventListener("error", handleError);
    };

    target.addEventListener(eventName, handleSuccess, { once: true });
    target.addEventListener("error", handleError, { once: true });
  });
}

function nextAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function getExtractionWidth(videoWidth) {
  const deviceMemory = navigator.deviceMemory ?? 8;

  if (deviceMemory <= 4) {
    return Math.min(videoWidth, 640);
  }

  if (deviceMemory <= 8) {
    return Math.min(videoWidth, 768);
  }

  return Math.min(videoWidth, 960);
}

function createSurface(width, height) {
  if (typeof OffscreenCanvas === "function") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: false,
    });

    return { canvas, context };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  return {
    canvas,
    context: canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: false,
    }),
  };
}

function snapshotSurface(surface) {
  if (
    typeof OffscreenCanvas === "function" &&
    surface.canvas instanceof OffscreenCanvas &&
    typeof surface.canvas.transferToImageBitmap === "function"
  ) {
    return Promise.resolve(surface.canvas.transferToImageBitmap());
  }

  return createImageBitmap(surface.canvas);
}

function updateLoadingState(state, progress) {
  const safeProgress = clamp(progress);
  state.onProgress?.(safeProgress);
}

function resetCapturedFrames(state) {
  for (const frame of state.frames) {
    frame.close?.();
  }

  state.frames.length = 0;
  state.currentFrame = -1;
  state.needsRedraw = true;
}

function sizeCanvas(state) {
  const rect = state.canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (state.canvas.width === width && state.canvas.height === height) {
    return;
  }

  state.canvas.width = width;
  state.canvas.height = height;
  state.needsRedraw = true;
}

function drawCoverImage(context, source, targetWidth, targetHeight) {
  const sourceWidth = source.width;
  const sourceHeight = source.height;

  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let sourceX = 0;
  let sourceY = 0;
  let drawWidth = sourceWidth;
  let drawHeight = sourceHeight;

  if (sourceRatio > targetRatio) {
    drawWidth = sourceHeight * targetRatio;
    sourceX = (sourceWidth - drawWidth) / 2;
  } else {
    drawHeight = sourceWidth / targetRatio;
    sourceY = (sourceHeight - drawHeight) / 2;
  }

  context.clearRect(0, 0, targetWidth, targetHeight);
  context.drawImage(
    source,
    sourceX,
    sourceY,
    drawWidth,
    drawHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );
}

function drawFrame(state, frameIndex) {
  const safeIndex = Math.max(0, Math.min(frameIndex, state.frames.length - 1));

  if (!state.frames[safeIndex]) {
    return;
  }

  if (safeIndex === state.currentFrame && !state.needsRedraw) {
    return;
  }

  drawCoverImage(state.context, state.frames[safeIndex], state.canvas.width, state.canvas.height);
  state.currentFrame = safeIndex;
  state.needsRedraw = false;
}

async function captureCurrentFrame(state, surface, extractionWidth, extractionHeight) {
  surface.context.drawImage(state.video, 0, 0, extractionWidth, extractionHeight);
  const bitmap = await snapshotSurface(surface);
  state.frames.push(bitmap);

  if (state.frames.length === 1) {
    sizeCanvas(state);
    drawFrame(state, 0);
  }
}

async function extractFramesByPlayback(state, surface, extractionWidth, extractionHeight) {
  if (typeof state.video.requestVideoFrameCallback !== "function") {
    throw new Error("requestVideoFrameCallback is not supported");
  }

  await seekVideo(state.video, state.frames.length / state.fps);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve();
    };

    const fail = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      state.video.pause();
      state.video.playbackRate = 1;
      state.video.removeEventListener("ended", handleEnded);
      state.video.removeEventListener("error", handleError);
    };

    const handleError = () => {
      fail(new Error("Failed to decode source video during frame extraction"));
    };

    const handleEnded = () => {
      if (state.frames.length >= Math.max(1, state.frameCount - 1)) {
        updateLoadingState(state, 1);
        finish();
        return;
      }

      fail(new Error(`Playback extraction ended early (${state.frames.length}/${state.frameCount})`));
    };

    const handleFrame = async () => {
      if (settled) {
        return;
      }

      try {
        const bitmapPromise = captureCurrentFrame(state, surface, extractionWidth, extractionHeight);

        if (state.frames.length + 1 < state.frameCount) {
          state.video.requestVideoFrameCallback(handleFrame);
        }

        await bitmapPromise;

        if (state.frames.length >= state.frameCount) {
          updateLoadingState(state, 1);
          finish();
          return;
        }

        if (state.frames.length % 6 === 0) {
          updateLoadingState(state, state.frames.length / state.frameCount);
        }
      } catch (error) {
        fail(error);
      }
    };

    state.video.playbackRate = 4;
    state.video.addEventListener("ended", handleEnded, { once: true });
    state.video.addEventListener("error", handleError, { once: true });
    state.video.requestVideoFrameCallback(handleFrame);
    state.video.play().catch(fail);
  });
}

function seekVideo(video, time) {
  const safeTime = Math.max(0, Math.min(time, Math.max(video.duration - SEEK_EPSILON, 0)));

  if (Math.abs(video.currentTime - safeTime) <= SEEK_EPSILON && video.readyState >= 2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const handleSeeked = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Failed to seek source video"));
    };

    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", handleError, { once: true });

    if (typeof video.fastSeek === "function") {
      video.fastSeek(safeTime);
    } else {
      video.currentTime = safeTime;
    }
  });
}

async function extractFramesBySeeking(state, surface, extractionWidth, extractionHeight) {
  for (let index = 0; index < state.frameCount; index += 1) {
    const time = index / state.fps;

    await seekVideo(state.video, time);
    await captureCurrentFrame(state, surface, extractionWidth, extractionHeight);

    if (index === state.frameCount - 1 || index % 4 === 0) {
      updateLoadingState(state, (index + 1) / state.frameCount);
      await nextAnimationFrame();
    }
  }
}

async function extractFrames(state) {
  if (typeof createImageBitmap !== "function") {
    throw new Error("ImageBitmap is not supported in this browser");
  }

  if (state.video.readyState < 1) {
    await waitForEvent(state.video, "loadedmetadata");
  }

  if (state.video.readyState < 2) {
    await waitForEvent(state.video, "loadeddata");
  }

  const extractionWidth = getExtractionWidth(state.video.videoWidth);
  const extractionHeight = Math.round((extractionWidth / state.video.videoWidth) * state.video.videoHeight);
  const surface = createSurface(extractionWidth, extractionHeight);

  if (!surface.context) {
    throw new Error("2D canvas context is unavailable");
  }

  state.surface = surface;
  state.frameCount = Math.max(1, Math.round(state.video.duration * state.fps));
  updateLoadingState(state, 0);
  await seekVideo(state.video, 0);
  await captureCurrentFrame(state, surface, extractionWidth, extractionHeight);
  updateLoadingState(state, 1 / state.frameCount);

  try {
    await extractFramesByPlayback(state, surface, extractionWidth, extractionHeight);
  } catch (error) {
    console.warn("BARAiN playback extraction fell back to seek extraction:", error);
    resetCapturedFrames(state);
    await extractFramesBySeeking(state, surface, extractionWidth, extractionHeight);
  }

  state.ready = true;
  state.frameCount = state.frames.length;
  updateLoadingState(state, 1);
  state.video.pause();
  state.video.currentTime = 0;
}

function getScrollProgress(root) {
  const rect = root.getBoundingClientRect();
  const scrollSpan = Math.max(1, root.offsetHeight - window.innerHeight);
  const travelled = clamp(-rect.top, 0, scrollSpan);

  return travelled / scrollSpan;
}

function applyOverlayState(state, progress) {
  const overlayFade =
    1 - clamp((progress - OVERLAY_FADE_START) / (OVERLAY_FADE_END - OVERLAY_FADE_START));
  const veilFade = clamp((progress - VEIL_FADE_START) / (VEIL_FADE_END - VEIL_FADE_START));
  const headlineReveal = easeOutCubic(
    clamp((progress - HEADLINE_REVEAL_START) / (HEADLINE_REVEAL_END - HEADLINE_REVEAL_START)),
  );

  state.overlay.style.opacity = overlayFade.toFixed(3);
  state.overlay.style.filter = `blur(${((1 - overlayFade) * 18).toFixed(2)}px)`;
  state.veil.style.opacity = veilFade.toFixed(3);
  state.headline.style.opacity = headlineReveal.toFixed(3);
  state.headline.style.transform = `translate3d(0, ${((1 - headlineReveal) * 12).toFixed(2)}%, 0)`;
}

function applyHeaderState(state, progress) {
  if (!state.header) {
    return;
  }

  const headerReveal = easeOutCubic(
    clamp((progress - HEADER_REVEAL_START) / (HEADER_REVEAL_END - HEADER_REVEAL_START)),
  );

  state.header.style.opacity = headerReveal.toFixed(3);
  state.header.style.transform = `translate3d(0, ${((1 - headerReveal) * -20).toFixed(2)}px, 0)`;
  state.header.style.pointerEvents = headerReveal > 0.98 ? "auto" : "none";
  state.header.dataset.state = headerReveal > 0.98 ? "visible" : "hidden";
}

function render(state) {
  state.rafId = 0;

  if (!state.isVisible && state.ready) {
    return;
  }

  const progress = getScrollProgress(state.root);
  const frameProgress = clamp(progress / FRAME_END_PROGRESS);

  sizeCanvas(state);
  applyOverlayState(state, progress);
  applyHeaderState(state, progress);

  if (state.frames.length > 0) {
    const totalFrames = state.frameCount || state.frames.length;
    const frameIndex = Math.round(frameProgress * (totalFrames - 1));
    drawFrame(state, frameIndex);
  }
}

function requestRender(state) {
  if (state.rafId) {
    return;
  }

  state.rafId = requestAnimationFrame(() => render(state));
}

function setupVisibilityObserver(state) {
  if (typeof IntersectionObserver !== "function") {
    state.isVisible = true;
    return null;
  }

  const observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    state.isVisible = entry.isIntersecting;

    if (state.isVisible) {
      requestRender(state);
    }
  });

  observer.observe(state.root);
  return observer;
}

export function initVideoScroll({ onProgress } = {}) {
  const root = document.querySelector(".hero");
  const canvas = root?.querySelector("[data-hero-canvas]");
  const video = root?.querySelector("[data-hero-video]");
  const overlay = root?.querySelector("[data-hero-overlay]");
  const veil = root?.querySelector("[data-hero-veil]");
  const headline = root?.querySelector("[data-hero-headline]");
  const header = document.querySelector("[data-site-header]");

  if (!root || !canvas || !video || !overlay || !veil || !headline) {
    return { ready: Promise.resolve(null) };
  }

  const context = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true,
  });

  if (!context) {
    return { ready: Promise.resolve(null) };
  }

  const state = {
    canvas,
    context,
    currentFrame: -1,
    fps: Number(root.dataset.sequenceFps) || DEFAULT_SEQUENCE_FPS,
    frameCount: 0,
    frames: [],
    header,
    headline,
    isVisible: true,
    needsRedraw: true,
    onProgress,
    overlay,
    rafId: 0,
    ready: false,
    root,
    surface: null,
    veil,
    video,
  };

  const handleScroll = () => {
    if (!state.isVisible && state.ready) {
      return;
    }

    requestRender(state);
  };

  const handleResize = () => {
    state.needsRedraw = true;
    requestRender(state);
  };

  const observer = setupVisibilityObserver(state);

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });

  updateLoadingState(state, 0);
  requestRender(state);

  const ready = extractFrames(state)
    .then(() => {
      state.needsRedraw = true;
      requestRender(state);
      return state;
    })
    .catch((error) => {
      console.error("BARAiN sequence extraction failed:", error);
      updateLoadingState(state, 1);
      throw error;
    });

  window.addEventListener(
    "pagehide",
    () => {
      cancelAnimationFrame(state.rafId);
      observer?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

      for (const frame of state.frames) {
        frame.close?.();
      }
    },
    { once: true },
  );

  return { ready };
}
