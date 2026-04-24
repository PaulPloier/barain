export function createSitePreloader() {
  return `
    <div
      class="site-preloader"
      data-site-preloader
      data-state="loading"
      role="status"
      aria-live="polite"
      aria-label="Loading BARAiN experience"
    >
      <div class="site-preloader__content">
        <div class="site-preloader__glow" aria-hidden="true"></div>
        <div class="site-preloader__brand">
          <span class="site-preloader__mark" aria-hidden="true"></span>
          <span class="site-preloader__wordmark">BARAiN</span>
        </div>
        <p class="site-preloader__progress" data-preloader-progress>0%</p>
      </div>
    </div>
  `;
}
