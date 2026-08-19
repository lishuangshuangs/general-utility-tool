(() => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const modeEl = document.getElementById("mode");
  const trimEl = document.getElementById("trim");
  const message = document.getElementById("message");

  function run() {
    const raw = input.value;
    let lines = raw.split(/\r?\n/);
    const before = lines.length;
    const trimMode = trimEl.value;

    if (trimMode === "trim" || trimMode === "empty") {
      lines = lines.map((l) => l.trim());
    }
    if (trimMode === "empty") {
      lines = lines.filter((l) => l.length > 0);
    }

    const seen = new Set();
    const unique = [];
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        unique.push(line);
      }
    }

    let result = unique;
    if (modeEl.value === "sort") {
      result = [...unique].sort((a, b) => a.localeCompare(b, "zh-CN"));
    } else if (modeEl.value === "reverse") {
      result = [...unique].reverse();
    }

    output.value = result.join("\n");
    document.getElementById("before").textContent = String(before);
    document.getElementById("after").textContent = String(result.length);
    document.getElementById("removed").textContent = String(before - result.length);
    message.textContent = `完成：移除 ${before - result.length} 行`;
    message.className = "message";
  }

  document.getElementById("run").addEventListener("click", run);
  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value && output.value !== "") {
      message.textContent = "请先执行去重";
      message.className = "message error";
      return;
    }
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "已复制到剪贴板";
      message.className = "message";
    } catch {
      message.textContent = "复制失败，请手动选择";
      message.className = "message error";
    }
  });
  document.getElementById("swap").addEventListener("click", () => {
    input.value = output.value;
    message.textContent = "已写回输入框";
    message.className = "message";
  });
})();
