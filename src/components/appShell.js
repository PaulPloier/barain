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
    <div class="site-shell">
      <main class="page-main">
        <section class="intro-placeholder" id="top">
          <div class="intro-placeholder__inner">
            <p class="intro-placeholder__eyebrow">BARAiN</p>
            <h1 class="intro-placeholder__title">
              Spatially led sonic experiences are taking shape.
            </h1>
            <p class="intro-placeholder__copy">
              This first pass establishes the cinematic frontend shell, section
              structure, and performance-focused baseline for the interactive
              launch sequence.
            </p>
          </div>
        </section>
        ${sectionData.map(renderSection).join("")}
      </main>
    </div>
  `;
}
