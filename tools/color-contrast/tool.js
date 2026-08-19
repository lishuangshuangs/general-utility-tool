(() => {
  const fg = document.getElementById("fg");
  const bg = document.getElementById("bg");
  const fgHex = document.getElementById("fgHex");
  const bgHex = document.getElementById("bgHex");
  const ratioEl = document.getElementById("ratio");
  const badges = document.getElementById("badges");
  const swatchNormal = document.getElementById("swatchNormal");
  const swatchLarge = document.getElementById("swatchLarge");
  const message = document.getElementById("message");

  function parseHex(str) {
    let s = String(str || "").trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split("").map((c) => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return "#" + s.toLowerCase();
  }

  function hexToRgb(hex) {
    const h = parseHex(hex);
    if (!h) return null;
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
    };
  }

  function relLuminance({ r, g, b }) {
    const toLin = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  }

  function contrast(hex1, hex2) {
    const a = hexToRgb(hex1);
    const b = hexToRgb(hex2);
    if (!a || !b) return null;
    const L1 = relLuminance(a);
    const L2 = relLuminance(b);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function badge(text, pass) {
    const span = document.createElement("span");
    span.className = "badge " + (pass ? "pass" : "fail");
    span.textContent = text + (pass ? " 通过" : " 未通过");
    return span;
  }

  function syncFromPicker() {
    fgHex.value = fg.value;
    bgHex.value = bg.value;
    calc();
  }

  function syncFromHex() {
    const f = parseHex(fgHex.value);
    const b = parseHex(bgHex.value);
    if (f) {
      fg.value = f;
      fgHex.value = f;
    }
    if (b) {
      bg.value = b;
      bgHex.value = b;
    }
    calc();
  }

  function calc() {
    const f = parseHex(fg.value) || "#111827";
    const b = parseHex(bg.value) || "#ffffff";
    const r = contrast(f, b);
    if (r == null) {
      ratioEl.textContent = "—";
      badges.replaceChildren();
      message.className = "message error";
      message.textContent = "颜色格式无效";
      return;
    }
    const rounded = Math.round(r * 100) / 100;
    ratioEl.textContent = rounded.toFixed(2) + " : 1";
    const aaNormal = r >= 4.5;
    const aaLarge = r >= 3;
    const aaaNormal = r >= 7;
    const aaaLarge = r >= 4.5;
    badges.replaceChildren(
      badge("AA 正文", aaNormal),
      badge("AA 大字", aaLarge),
      badge("AAA 正文", aaaNormal),
      badge("AAA 大字", aaaLarge)
    );
    swatchNormal.style.color = f;
    swatchNormal.style.background = b;
    swatchLarge.style.color = f;
    swatchLarge.style.background = b;
    message.className = "message";
    message.textContent = "已更新";
  }

  fg.addEventListener("input", syncFromPicker);
  bg.addEventListener("input", syncFromPicker);
  fgHex.addEventListener("change", syncFromHex);
  bgHex.addEventListener("change", syncFromHex);
  fgHex.addEventListener("input", () => {
    if (parseHex(fgHex.value)) syncFromHex();
  });
  bgHex.addEventListener("input", () => {
    if (parseHex(bgHex.value)) syncFromHex();
  });

  document.getElementById("swap").addEventListener("click", () => {
    const t = fg.value;
    fg.value = bg.value;
    bg.value = t;
    syncFromPicker();
  });

  document.getElementById("sample").addEventListener("click", () => {
    fg.value = "#111827";
    bg.value = "#f8fafc";
    syncFromPicker();
  });

  syncFromPicker();
})();
