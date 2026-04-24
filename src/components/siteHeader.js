const navigationItems = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#artists", label: "Artists" },
  { href: "#process", label: "Process" },
  { href: "#faq", label: "FAQ" },
];

export function createSiteHeader() {
  return `
    <header class="site-header" data-site-header data-state="hidden">
      <div class="site-header__inner">
        <a class="site-header__brand" href="#top" aria-label="BARAiN home">
          <span class="site-header__brand-mark"></span>
          <span>BARAiN</span>
        </a>
        <nav class="site-header__nav" aria-label="Primary navigation">
          ${navigationItems
            .map(
              (item) =>
                `<a class="site-header__link" href="${item.href}">${item.label}</a>`,
            )
            .join("")}
        </nav>
        <a class="site-header__cta" href="#cta">Book Talent</a>
      </div>
    </header>
  `;
}
