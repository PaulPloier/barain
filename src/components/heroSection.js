import heroVideo from "../assets/video/Cinematic Mouth Transition.mp4";

export function createHeroSection() {
  return `
    <section class="hero" id="top">
      <div class="hero__viewport">
        <video
          class="hero__video"
          data-hero-video
          aria-hidden="true"
          playsinline
          muted
          preload="auto"
        >
          <source src="${heroVideo}" type="video/mp4" />
        </video>
        <div class="hero__veil" data-hero-veil></div>
        <div class="hero__overlay" data-hero-overlay>
          <div class="hero__copy">
            <p class="hero__eyebrow">BARAiN</p>
            <p class="hero__label">Cinematic mouth transition</p>
          </div>
          <div class="hero__hint">
            <span class="hero__hint-line"></span>
            <span>Scroll to enter</span>
          </div>
        </div>
        <div class="hero__headline-block" data-hero-headline>
          <p class="hero__headline-eyebrow">BARAiN</p>
          <h1 class="hero__headline">WE CONNECT SOUND TO SPACE</h1>
        </div>
      </div>
    </section>
  `;
}
