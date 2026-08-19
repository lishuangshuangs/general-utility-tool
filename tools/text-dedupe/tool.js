const input = document.getElementById("input");
const output = document.getElementById("output");
const message = document.getElementById("message");
const ignoreCase = document.getElementById("ignore-case");
const trimEl = document.getElementById("trim");
const keepEmpty = document.getElementById("keep-empty");

function dedupe() {
  const raw = input.value;
  const lines = raw.split(/\r?\n/);
  const seen = new Set();
  const result = [];
  for (const line of lines) {
    let key = trimEl.checked ? line.trim() : line;
    if (!keepEmpty.checked && key === "") continue;
    const check = ignoreCase.checked ? key.toLowerCase() : key;
    if (seen.has(check)) continue;
    seen.add(check);
    result.push(trimEl.checked ? key : line);
  }
  output.value = result.join("\n");
  const before = lines.length;
  const after = result.length;
  document.getElementById("before").textContent = before;
  document.getElementById("after").textContent = after;
  document.getElementById("removed").textContent = Math.max(0, before - after);
  message.textContent = after < before ? `已移除 ${before - after} 行重复` : (raw ? "无重复行" : "");
}

document.getElementById("run").onclick = dedupe;
[ignoreCase, trimEl, keepEmpty].forEach((el) => el.addEventListener("change", () => {
  if (input.value) dedupe();
}));

document.getElementById("sample").onclick = () => {
  input.value = "apple\nBanana\napple\nbanana\n\nCherry\nAPPLE\n";
  dedupe();
  message.textContent = "已填入示例";
};

document.getElementById("copy").onclick = async () => {
  if (!output.value && output.value !== "") {
    message.textContent = "请先去重";
    return;
  }
  await navigator.clipboard.writeText(output.value);
  message.textContent = "已复制";
};

document.getElementById("clear").onclick = () => {
  input.value = "";
  output.value = "";
  document.getElementById("before").textContent = "0";
  document.getElementById("after").textContent = "0";
  document.getElementById("removed").textContent = "0";
  message.textContent = "";
};
