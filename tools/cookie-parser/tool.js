(() => {
  const input = document.getElementById("input");
  const tbody = document.getElementById("tbody");
  const resultWrap = document.getElementById("result-wrap");
  const emptyState = document.getElementById("empty-state");
  const message = document.getElementById("message");
  let lastPairs = [];

  function parseCookie(str) {
    const pairs = [];
    if (!str || !str.trim()) return pairs;
    str.split(";").forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        pairs.push({ name: trimmed, value: "" });
      } else {
        pairs.push({
          name: trimmed.slice(0, eq).trim(),
          value: trimmed.slice(eq + 1).trim(),
        });
      }
    });
    return pairs;
  }

  function render() {
    const pairs = parseCookie(input.value);
    lastPairs = pairs;
    tbody.replaceChildren();
    if (pairs.length === 0) {
      resultWrap.hidden = true;
      emptyState.hidden = false;
      emptyState.textContent = input.value.trim()
        ? "未解析出有效 Cookie 键值对。"
        : "输入 Cookie 后点击解析，结果将显示在下方。";
      message.textContent = "";
      return;
    }
    emptyState.hidden = true;
    resultWrap.hidden = false;
    pairs.forEach(({ name, value }) => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      const tdValue = document.createElement("td");
      tdName.textContent = name;
      tdValue.textContent = value;
      tr.append(tdName, tdValue);
      tbody.append(tr);
    });
    message.textContent = `共解析 ${pairs.length} 项`;
    message.className = "message";
  }

  document.getElementById("parse").addEventListener("click", render);
  input.addEventListener("input", () => {
    if (input.value.trim()) render();
  });

  document.getElementById("sample").addEventListener("click", () => {
    input.value =
      "session_id=a1b2c3d4e5f6; theme=dark; lang=zh-CN; _ga=GA1.2.123456789.1620000000; remember_me=true";
    render();
  });

  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    lastPairs = [];
    tbody.replaceChildren();
    resultWrap.hidden = true;
    emptyState.hidden = false;
    emptyState.textContent = "输入 Cookie 后点击解析，结果将显示在下方。";
    message.textContent = "";
  });

  document.getElementById("copy-json").addEventListener("click", async () => {
    if (lastPairs.length === 0) {
      message.textContent = "暂无数据可复制";
      message.className = "message error";
      return;
    }
    const obj = Object.fromEntries(lastPairs.map((p) => [p.name, p.value]));
    try {
      await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
      message.textContent = "已复制为 JSON";
      message.className = "message";
    } catch {
      message.textContent = "复制失败，请手动选择";
      message.className = "message error";
    }
  });
})();
