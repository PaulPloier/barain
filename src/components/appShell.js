import { createHeroSection } from "./heroSection.js";
import { createSitePreloader } from "./sitePreloader.js";
import { createSiteHeader } from "./siteHeader.js";
import { sectionData } from "../scripts/sectionData.js";

function renderSection(section) {
  return `
    <section class="content-section" id="${section.id}">
      <div class="content-section__inner">
        <p class="content-section__eyebrow">${section.eyebrow}</p>
        <h2 class="content-section__title">${section.title}</h2>
        <p class="content-section__copy">${section.copy}</p>
      </div>
    </section>
  `;
}

export function createAppShell() {
  return `
    ${createSitePreloader()}
    <div class="site-shell" data-site-shell data-state="loading">
      ${createSiteHeader()}
      <main class="page-main">
        ${createHeroSection()}
        ${sectionData.map(renderSection).join("")}
      </main>
    </div>
  `;
}
