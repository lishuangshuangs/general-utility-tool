const search = document.getElementById("tool-search");
const cards = [...document.querySelectorAll(".tool-card")];
const categoryButtons = [...document.querySelectorAll("#categories [data-category]")];
const noResults = document.getElementById("no-results");
const grid = document.getElementById("tool-grid");
const groupsRoot = document.getElementById("tool-groups");
const library = document.getElementById("library");
const favRow = document.getElementById("fav-row");
const recentRow = document.getElementById("recent-row");
const favShelf = document.getElementById("fav-shelf");
const recentShelf = document.getElementById("recent-shelf");
const installBtn = document.getElementById("install-app");

const groups = [
  { id: "finance", title: "财务", desc: "发票、报价、个税与工资" },
  { id: "text", title: "文本", desc: "中文处理、格式与校对" },
  { id: "developer", title: "开发", desc: "编码、接口与工程辅助" },
  { id: "image", title: "图像", desc: "压缩、裁剪、配色与二维码" },
  { id: "calc", title: "计算", desc: "单位、时间与数值换算" },
];

const toolPriority = [
  "vat-split",
  "quote",
  "income-tax",
  "payroll",
  "number-chinese",
  "id-card",
  "zh-convert",
  "markdown-preview",
  "list-converter",
  "text-counter",
  "slugify",
  "email-extractor",
  "json-formatter",
  "data-convert",
  "regex-tester",
  "jwt-decoder",
  "sql-formatter",
  "image-compress",
  "image-convert",
  "image-resize",
  "image-watermark",
  "image-palette",
  "qr-code",
  "percentage",
  "timestamp",
  "unit-converter",
];

const cardBySlug = new Map();
cards.forEach((card) => {
  const match = card.getAttribute("href").match(/tools\/([^/]+)/);
  if (match) cardBySlug.set(match[1], card);
});

const groupGrids = new Map();
if (groupsRoot) {
  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "tool-group";
    section.dataset.group = group.id;
    section.innerHTML = `<div class="tool-group-head"><h3>${group.title}</h3><p>${group.desc}</p></div><div class="tool-grid"></div>`;
    groupsRoot.append(section);
    groupGrids.set(group.id, section.querySelector(".tool-grid"));
  });
}

function placeCards() {
  const ordered = [];
  toolPriority.forEach((slug) => {
    const card = cardBySlug.get(slug);
    if (card) ordered.push(card);
  });
  cards.forEach((card) => {
    if (!ordered.includes(card)) ordered.push(card);
  });
  ordered.forEach((card) => {
    const host = groupGrids.get(card.dataset.category) || grid;
    host.append(card);
  });
}

placeCards();

cards.forEach((card) => {
  const match = card.getAttribute("href").match(/tools\/([^/]+)/);
  if (!match || !window.Utilora) return;
  const slug = match[1];
  card.append(Utilora.starButton(slug));
  card.addEventListener("click", () => Utilora.addRecent(slug));
});

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

function updateCounts() {
  const totals = { all: cards.length };
  cards.forEach((card) => {
    totals[card.dataset.category] = (totals[card.dataset.category] || 0) + 1;
  });
  categoryButtons.forEach((button) => {
    const count = totals[button.dataset.category] || 0;
    let em = button.querySelector("em");
    if (!em) {
      em = document.createElement("em");
      button.append(em);
    }
    em.textContent = count;
  });
}

let category = "all";

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
  document.querySelectorAll(".tool-group").forEach((section) => {
    const matchCategory = category === "all" || section.dataset.group === category;
    const hasCard = [...section.querySelectorAll(".tool-card")].some((card) => !card.hidden);
    section.hidden = !(matchCategory && hasCard);
  });
  noResults.hidden = visible !== 0;
  const countNode = document.getElementById("tool-count");
  if (countNode) countNode.textContent = cards.length;
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
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pendingPrompt = event;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    if (!pendingPrompt) return;
    pendingPrompt.prompt();
    await pendingPrompt.userChoice.catch(() => {});
    pendingPrompt = null;
    installBtn.hidden = true;
  });
}

updateCounts();
renderShelves();
filterTools();
