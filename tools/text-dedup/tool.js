(() => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const mode = document.getElementById("mode");
  const message = document.getElementById("message");
  const beforeEl = document.getElementById("before");
  const afterEl = document.getElementById("after");
  const removedEl = document.getElementById("removed");

  function dedup() {
    const text = input.value;
    const m = mode.value;
    let items = [];
    let joiner = "\n";

    if (m === "word") {
      items = text.split(/\s+/).filter(Boolean);
      joiner = " ";
    } else {
      items = text.split(/\r?\n/);
    }

    const seen = new Set();
    const result = [];
    for (const item of items) {
      let key = item;
      if (m === "line-trim") key = item.trim();
      if (m === "line-case") key = item.trim().toLowerCase();
      if (m === "line-trim" && key === "") {
        if (!seen.has("")) {
          seen.add("");
          result.push(item);
        }
        continue;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(m === "line-trim" || m === "line-case" ? (m === "line-trim" ? item.trim() : item) : item);
    }

    const before = items.length;
    const after = result.length;
    beforeEl.textContent = before;
    afterEl.textContent = after;
    removedEl.textContent = Math.max(0, before - after);
    output.value = result.join(joiner);
    message.textContent = after === before ? "无重复项" : `已去除 ${before - after} 项`;
    message.className = "message";
  }

  document.getElementById("run").addEventListener("click", dedup);
  mode.addEventListener("change", () => {
    if (input.value.trim()) dedup();
  });
  input.addEventListener("input", () => {
    if (input.value.trim()) dedup();
  });

  document.getElementById("sample").addEventListener("click", () => {
    input.value = "苹果\n香蕉\n苹果\n橙子\n香蕉\n葡萄\n苹果\n猕猴桃";
    mode.value = "line";
    dedup();
  });

  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    beforeEl.textContent = "0";
    afterEl.textContent = "0";
    removedEl.textContent = "0";
    message.textContent = "";
  });

  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) {
      message.textContent = "暂无结果可复制";
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
