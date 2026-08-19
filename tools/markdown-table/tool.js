(() => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const alignEl = document.getElementById("align");
  const message = document.getElementById("message");

  const sample = `| 姓名 | 年龄 | 城市 |\n| --- | --- | --- |\n| 张三 | 28 | 上海 |\n| 李四 | 31 | 北京 |\n| 王五 | 24 | 广州 |`;

  function parseRows(text) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)*\|?$/.test(line))
      .map((line) => {
        let s = line;
        if (s.startsWith("|")) s = s.slice(1);
        if (s.endsWith("|")) s = s.slice(0, -1);
        return s.split("|").map((c) => c.trim());
      })
      .filter((row) => row.some((c) => c.length));
  }

  function pad(str, width, align) {
    const len = [...str].length;
    const space = Math.max(0, width - len);
    if (align === "right") return " ".repeat(space) + str;
    if (align === "center") {
      const left = Math.floor(space / 2);
      return " ".repeat(left) + str + " ".repeat(space - left);
    }
    return str + " ".repeat(space);
  }

  function sep(width, align) {
    if (align === "center") return ":" + "-".repeat(Math.max(1, width - 2)) + ":";
    if (align === "right") return "-".repeat(Math.max(1, width - 1)) + ":";
    return "-".repeat(Math.max(1, width));
  }

  function alignTable() {
    const rows = parseRows(input.value);
    if (!rows.length) {
      output.value = "";
      message.className = "message error";
      message.textContent = "请输入有效的表格内容";
      return;
    }
    const colCount = Math.max(...rows.map((r) => r.length));
    const normalized = rows.map((r) => {
      const copy = r.slice();
      while (copy.length < colCount) copy.push("");
      return copy;
    });
    const widths = Array.from({ length: colCount }, (_, i) =>
      Math.max(3, ...normalized.map((r) => [...String(r[i] || "")].length))
    );
    const align = alignEl.value;
    const lines = normalized.map(
      (row) =>
        "| " +
        row.map((cell, i) => pad(String(cell || ""), widths[i], align)).join(" | ") +
        " |"
    );
    const separator =
      "| " + widths.map((w) => sep(w, align)).join(" | ") + " |";
    output.value = [lines[0], separator, ...lines.slice(1)].join("\n");
    message.className = "message";
    message.textContent = "对齐完成，共 " + normalized.length + " 行";
  }

  document.getElementById("run").addEventListener("click", alignTable);
  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      message.className = "message";
      message.textContent = "已复制对齐结果";
    } catch {
      message.className = "message error";
      message.textContent = "复制失败";
    }
  });
  document.getElementById("sample").addEventListener("click", () => {
    input.value = sample;
    alignTable();
  });
  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    message.textContent = "";
  });
  input.addEventListener("input", () => {
    if (input.value.trim()) alignTable();
  });
  alignEl.addEventListener("change", () => {
    if (input.value.trim()) alignTable();
  });
})();
