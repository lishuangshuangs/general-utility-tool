(() => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const fromSel = document.getElementById("from");
  const toSel = document.getElementById("to");
  const trimBox = document.getElementById("trim");
  const uniqueBox = document.getElementById("unique");
  const message = document.getElementById("message");

  function parseList(text, mode) {
    let items = [];
    const t = text.trim();
    if (!t) return [];
    if (mode === "json" || (mode === "auto" && t.startsWith("["))) {
      try {
        const arr = JSON.parse(t);
        if (!Array.isArray(arr)) throw new Error();
        items = arr.map(String);
      } catch {
        if (mode === "json") throw new Error("无效的 JSON 数组");
      }
    }
    if (items.length === 0) {
      let sep = /\r?\n/;
      if (mode === "comma" || (mode === "auto" && t.includes(",") && !t.includes("\n"))) sep = /,/;
      else if (mode === "semicolon" || (mode === "auto" && t.includes(";") && !t.includes("\n"))) sep = /;/;
      else if (mode === "space") sep = /\s+/;
      else if (mode === "auto" && !t.includes("\n") && t.includes(" ")) sep = /\s+/;
      items = t.split(sep);
    }
    if (trimBox.checked) items = items.map((s) => s.trim()).filter(Boolean);
    else items = items.filter((s) => s.length > 0);
    if (uniqueBox.checked) {
      const seen = new Set();
      items = items.filter((s) => {
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
      });
    }
    return items;
  }

  function formatList(items, mode) {
    switch (mode) {
      case "newline": return items.join("\n");
      case "comma": return items.join(",");
      case "comma-space": return items.join(", ");
      case "semicolon": return items.join(";");
      case "json": return JSON.stringify(items, null, 2);
      case "markdown": return items.map((s) => `- ${s}`).join("\n");
      default: return items.join("\n");
    }
  }

  function convert() {
    try {
      const items = parseList(input.value, fromSel.value);
      output.value = formatList(items, toSel.value);
      message.textContent = `共 ${items.length} 项`;
      message.className = "message";
    } catch (e) {
      output.value = "";
      message.textContent = e.message || "转换失败";
      message.className = "message error";
    }
  }

  document.getElementById("convert").addEventListener("click", convert);
  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) {
      message.textContent = "没有可复制的内容";
      message.className = "message error";
      return;
    }
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "已复制结果";
      message.className = "message";
    } catch {
      message.textContent = "复制失败，请手动选择";
      message.className = "message error";
    }
  });
})();
