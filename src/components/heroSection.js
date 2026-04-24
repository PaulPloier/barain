import heroVideo from "../assets/video/Cinematic Mouth Transition.mp4";

export function createHeroSection() {
  return `
    <section class="hero" id="top">
      <div class="hero__viewport">
        <video
          class="hero__video"
          data-hero-video
          playsinline
          muted
          preload="auto"
        >
          <source src="${heroVideo}" type="video/mp4" />
        </video>
        <div class="hero__overlay">
          <div class="hero__copy">
            <p class="hero__eyebrow">BARAiN</p>
            <p class="hero__label">Cinematic mouth transition</p>
          </div>
          <div class="hero__hint">
            <span class="hero__hint-line"></span>
            <span>Scroll to enter</span>
          </div>
        </div>
      </div>
    </section>
  `;
}
