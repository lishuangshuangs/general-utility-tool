(() => {
  const input = document.getElementById("input");
  const tbody = document.getElementById("tbody");
  const resultWrap = document.getElementById("result-wrap");
  const message = document.getElementById("message");

  function parseCookieLine(line) {
    const parts = line.split(";").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return null;
    const first = parts[0];
    const eq = first.indexOf("=");
    const name = eq === -1 ? first : first.slice(0, eq).trim();
    const value = eq === -1 ? "" : first.slice(eq + 1).trim();
    const attrs = parts.slice(1).map((p) => {
      const i = p.indexOf("=");
      if (i === -1) return { key: p, val: true };
      return { key: p.slice(0, i).trim(), val: p.slice(i + 1).trim() };
    });
    return { name, value, attrs };
  }

  function parse() {
    const raw = input.value.trim();
    if (!raw) {
      message.textContent = "请输入 Cookie 字符串";
      message.className = "message error";
      resultWrap.hidden = true;
      return;
    }
    let lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].includes(";") && !lines[0].toLowerCase().includes("path=") && !lines[0].toLowerCase().includes("httponly")) {
      const pairs = lines[0].split(";").map((p) => p.trim()).filter(Boolean);
      lines = pairs;
    }
    const rows = [];
    lines.forEach((line) => {
      const parsed = parseCookieLine(line);
      if (parsed && parsed.name) rows.push(parsed);
    });
    tbody.replaceChildren();
    if (!rows.length) {
      message.textContent = "未能解析出有效 Cookie";
      message.className = "message error";
      resultWrap.hidden = true;
      return;
    }
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      const attrStr = r.attrs
        .map((a) => (a.val === true ? a.key : `${a.key}=${a.val}`))
        .join("; ") || "—";
      tr.innerHTML = `<td><code>${escapeHtml(r.name)}</code></td><td><code>${escapeHtml(r.value)}</code></td><td>${escapeHtml(attrStr)}</td>`;
      tbody.append(tr);
    });
    resultWrap.hidden = false;
    message.textContent = `共解析 ${rows.length} 条`;
    message.className = "message";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.getElementById("parse").addEventListener("click", parse);
  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    tbody.replaceChildren();
    resultWrap.hidden = true;
    message.textContent = "";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) parse();
  });
})();
