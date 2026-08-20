const search = document.getElementById("tool-search");
const cards = [...document.querySelectorAll(".tool-card")];
const categoryButtons = [...document.querySelectorAll("[data-category]")].filter((node) => node.tagName === "BUTTON");
const noResults = document.getElementById("no-results");
const grid = document.getElementById("tool-grid");
const library = document.getElementById("library");
const favRow = document.getElementById("fav-row");
const recentRow = document.getElementById("recent-row");
const favShelf = document.getElementById("fav-shelf");
const recentShelf = document.getElementById("recent-shelf");
const installBtn = document.getElementById("install-app");

const toolPriority = [
  "vat-split",
  "quote",
  "income-tax",
  "payroll",
  "roman-numeral",
  "percentage",
  "list-converter",
  "http-status",
  "color-contrast",
  "markdown-table",
  "random-palette",
  "cron-next",
  "image-compress",
  "image-convert",
  "image-resize",
  "image-watermark",
  "image-palette",
  "number-chinese",
  "id-card",
  "zh-convert",
  "markdown-preview",
  "unix-permission",
  "sql-formatter",
  "password-strength",
  "utm-builder",
  "email-extractor",
  "user-agent",
  "ipv4-cidr",
  "json-to-ts",
  "gitignore-generator",
  "css-units",
  "slugify",
  "text-binary",
  "lorem-ipsum",
  "cookie-parser",
  "nanoid",
  "text-dedupe",
  "json-formatter",
  "data-convert",
  "unit-converter",
  "timestamp",
  "qr-code",
  "douyin-downloader",
  "password-generator",
  "text-counter",
  "base64",
  "url-codec",
  "url-parser",
  "html-entities",
  "random-number",
  "hash-generator",
  "number-base",
  "uuid-generator",
  "regex-tester",
  "color-converter",
  "case-converter",
  "text-diff",
  "jwt-decoder",
  "cron-explainer",
];

const cardBySlug = new Map();
cards.forEach((card) => {
  const match = card.getAttribute("href").match(/tools\/([^/]+)/);
  if (match) cardBySlug.set(match[1], card);
});

toolPriority.forEach((slug) => {
  const card = cardBySlug.get(slug);
  if (card) grid.append(card);
});

cards.forEach((card) => {
  const match = card.getAttribute("href").match(/tools\/([^/]+)/);
  if (!match || !window.Utilora) return;
  const slug = match[1];
  card.append(Utilora.starButton(slug));
  card.addEventListener("click", () => Utilora.addRecent(slug));
});

let category = "all";

function chipFromCard(card) {
  const chip = document.createElement("a");
  chip.className = "shelf-chip";
  chip.href = card.getAttribute("href");
  chip.innerHTML = `${card.querySelector(".icon").outerHTML}<span>${card.querySelector("h3").textContent}</span>`;
  const match = card.getAttribute("href").match(/tools\/([^/]+)/);
  if (match) chip.addEventListener("click", () => Utilora.addRecent(match[1]));
  return chip;
}

function renderShelves() {
  if (!window.Utilora || !library) return;
  const favs = Utilora.favorites().map((slug) => cardBySlug.get(slug)).filter(Boolean);
  const recents = Utilora.recent().map((slug) => cardBySlug.get(slug)).filter(Boolean);

  favRow.replaceChildren(...favs.map(chipFromCard));
  recentRow.replaceChildren(...recents.map(chipFromCard));
  favShelf.hidden = favs.length === 0;
  recentShelf.hidden = recents.length === 0;
  library.hidden = favs.length === 0 && recents.length === 0;
}

function filterTools() {
  const keyword = search.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const haystack = `${card.dataset.search || ""} ${card.textContent}`.toLowerCase();
    const show =
      (category === "all" || card.dataset.category === category) &&
      (!keyword || haystack.includes(keyword));
    card.hidden = !show;
    if (show) visible += 1;
  });
  noResults.hidden = visible !== 0;
  document.getElementById("tool-count").textContent = cards.length;
  if (library) library.classList.toggle("is-dimmed", Boolean(keyword));
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    category = button.dataset.category;
    filterTools();
  });
});

search.addEventListener("input", filterTools);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== search && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    search.focus();
  }
});
document.addEventListener("utilora:favorites", renderShelves);
document.getElementById("year").textContent = new Date().getFullYear();

if (installBtn) {
  let pendingPrompt = null;
  const guide = document.getElementById("install-guide");
  const footerBtn = document.getElementById("install-app-footer");
  const openInstall = async () => {
    if (pendingPrompt) {
      pendingPrompt.prompt();
      await pendingPrompt.userChoice.catch(() => {});
      pendingPrompt = null;
      return;
    }
    if (guide) guide.hidden = false;
  };
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pendingPrompt = event;
  });
  installBtn.addEventListener("click", openInstall);
  if (footerBtn) footerBtn.addEventListener("click", openInstall);
  document.getElementById("install-guide-close")?.addEventListener("click", () => {
    if (guide) guide.hidden = true;
  });
  if (guide) {
    guide.addEventListener("click", (event) => {
      if (event.target === guide) guide.hidden = true;
    });
  }
}

renderShelves();
filterTools();
