const input = document.getElementById("input");
const result = document.getElementById("result");
const message = document.getElementById("message");
let lastJson = "";

function parseCookie(str) {
  const map = new Map();
  const parts = String(str || "").split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      map.set(trimmed, "");
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    try {
      val = decodeURIComponent(val.replace(/\+/g, " "));
    } catch {
      /* keep raw */
    }
    if (key) map.set(key, val);
  }
  return map;
}

function render() {
  const map = parseCookie(input.value);
  if (map.size === 0) {
    result.hidden = true;
    result.innerHTML = "";
    lastJson = "";
    message.textContent = input.value.trim() ? "未解析到有效键值" : "";
    return;
  }
  const obj = Object.fromEntries(map);
  lastJson = JSON.stringify(obj, null, 2);
  const rows = [...map.entries()]
    .map(([k, v]) => `<tr><td><code>${escapeHtml(k)}</code></td><td><code>${escapeHtml(v)}</code></td></tr>`)
    .join("");
  result.innerHTML = `<table class="cookie-table"><thead><tr><th>键</th><th>值</th></tr></thead><tbody>${rows}</tbody></table>`;
  result.hidden = false;
  message.textContent = `共 ${map.size} 项`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.getElementById("parse").onclick = render;
input.addEventListener("input", () => {
  if (input.value.trim()) render();
});

document.getElementById("sample").onclick = () => {
  input.value = "session_id=abc123; theme=dark; lang=zh-CN; _ga=GA1.2.123456789.1620000000";
  render();
  message.textContent = "已填入示例";
};

document.getElementById("copy").onclick = async () => {
  if (!lastJson) {
    message.textContent = "请先解析";
    return;
  }
  await navigator.clipboard.writeText(lastJson);
  message.textContent = "已复制 JSON";
};

document.getElementById("clear").onclick = () => {
  input.value = "";
  result.hidden = true;
  result.innerHTML = "";
  lastJson = "";
  message.textContent = "";
};
