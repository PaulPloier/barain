import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function resetHeroState({ video, overlay, veil, headline }) {
  gsap.set(overlay, { autoAlpha: 1, filter: "blur(0px)" });
  gsap.set(veil, { autoAlpha: 0 });
  gsap.set(headline, { autoAlpha: 0, yPercent: 12 });

  if (video.readyState >= 1) {
    video.currentTime = 0;
  }
}

function buildHeroTimeline({ hero, video, overlay, veil, headline, reducedMotion }) {
  ScrollTrigger.getById("barain-hero-scroll")?.kill();
  gsap.killTweensOf(video);
  resetHeroState({ video, overlay, veil, headline });

  if (reducedMotion.matches) {
    gsap.set(overlay, { autoAlpha: 0 });
    gsap.set(veil, { autoAlpha: 1 });
    gsap.set(headline, { autoAlpha: 1, yPercent: 0 });
    return null;
  }

  const playback = { time: 0 };
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration - 0.05 : 7.95;

  return gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      id: "barain-hero-scroll",
      trigger: hero,
      start: "top top",
      end: () => `+=${window.innerHeight * 3.25}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })
    .to(
      playback,
      {
        time: duration,
        duration: 0.72,
        onUpdate: () => {
          video.currentTime = playback.time;
        },
      },
      0,
    )
    .to(
      overlay,
      {
        autoAlpha: 0,
        filter: "blur(18px)",
        duration: 0.16,
      },
      0.58,
    )
    .to(
      veil,
      {
        autoAlpha: 1,
        duration: 0.2,
      },
      0.7,
    )
    .to(
      headline,
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: 0.22,
      },
      0.78,
    );
}

export function initVideoScroll() {
  const hero = document.querySelector(".hero");
  const video = hero?.querySelector("[data-hero-video]");
  const overlay = hero?.querySelector("[data-hero-overlay]");
  const veil = hero?.querySelector("[data-hero-veil]");
  const headline = hero?.querySelector("[data-hero-headline]");

  if (!hero || !video || !overlay || !veil || !headline) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timeline = null;

  const setup = () => {
    timeline?.kill();
    timeline = buildHeroTimeline({
      hero,
      video,
      overlay,
      veil,
      headline,
      reducedMotion,
    });
    ScrollTrigger.refresh();
  };

  const handleVideoReady = () => {
    video.pause();
    setup();
  };

  if (video.readyState >= 1) {
    handleVideoReady();
  } else {
    video.addEventListener("loadedmetadata", handleVideoReady, { once: true });
  }

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", setup);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(setup);
  }
}
