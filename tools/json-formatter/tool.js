const input = document.getElementById("input");
const message = document.getElementById("message");
const SAMPLE = `{
  "name": "Utilora",
  "local": true,
  "tools": [
    { "id": "json-formatter", "ready": true },
    { "id": "timestamp", "ready": true }
  ]
}`;

function locateError(text, error) {
  const at = /position\s+(\d+)/i.exec(error.message);
  const lineCol = /line\s+(\d+)\s+column\s+(\d+)/i.exec(error.message);
  if (lineCol) return `第 ${lineCol[1]} 行，第 ${lineCol[2]} 列`;
  if (!at) return "";
  const pos = Number(at[1]);
  const line = text.slice(0, pos).split(/\r?\n/).length;
  return `第 ${line} 行`;
}

function parseInput() {
  try {
    return { ok: true, value: JSON.parse(input.value) };
  } catch (error) {
    const where = locateError(input.value, error);
    return { ok: false, error: where ? `${error.message}（${where}）` : error.message };
  }
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function writeJSON(space, sorter) {
  const parsed = parseInput();
  if (!parsed.ok) {
    show(false, `格式错误：${parsed.error}`);
    return;
  }
  const data = sorter ? sorter(parsed.value) : parsed.value;
  input.value = JSON.stringify(data, null, space);
  show(true, space === 0 ? "已压缩" : sorter ? "已按 key 排序" : "JSON 格式正确");
}

document.querySelectorAll("[data-space]").forEach((button) => {
  button.onclick = () => writeJSON(Number(button.dataset.space));
});

document.getElementById("sort").onclick = () => writeJSON(2, sortKeys);

document.getElementById("sample").onclick = () => {
  input.value = SAMPLE;
  show(true, "已填入示例");
};

document.getElementById("download").onclick = () => {
  const blob = new Blob([input.value || "{}"], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data.json";
  link.click();
  URL.revokeObjectURL(link.href);
  show(true, "已下载 data.json");
};

document.getElementById("clear").onclick = () => {
  input.value = "";
  show(true, "");
};

document.getElementById("copy").onclick = async () => {
  await navigator.clipboard.writeText(input.value);
  show(true, "已复制");
};

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    writeJSON(2);
  }
});
