import heroVideo from "../assets/video/Cinematic Mouth Transition.mp4";

export function createHeroSection() {
  return `
    <section class="hero" id="top" data-sequence-fps="24">
      <div class="hero__viewport">
        <canvas
          class="hero__canvas"
          data-hero-canvas
          aria-hidden="true"
        ></canvas>
        <video
          class="hero__source"
          data-hero-video
          aria-hidden="true"
          playsinline
          muted
          preload="auto"
          src="${heroVideo}"
        >
        </video>
        <div class="hero__veil" data-hero-veil></div>
        <div class="hero__overlay" data-hero-overlay>
          <div class="hero__hint">
            <span class="hero__hint-line"></span>
            <span>Scroll to enter</span>
          </div>
        </div>
        <div class="hero__headline-block" data-hero-headline>
          <h1 class="hero__headline">WE CONNECT SOUND TO SPACE</h1>
        </div>
      </div>
    </section>
  `;
}
