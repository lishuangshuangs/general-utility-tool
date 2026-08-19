const input = document.getElementById("input");
const output = document.getElementById("output");
const message = document.getElementById("message");

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

function extract() {
  const text = input.value;
  const matches = text.match(EMAIL_RE) || [];
  const seen = new Set();
  const ordered = [];
  for (const m of matches) {
    const key = m.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(m);
  }
  output.value = ordered.join("\n");
  document.getElementById("count").textContent = ordered.length;
  message.textContent = ordered.length ? `已提取 ${ordered.length} 个邮箱` : "未找到邮箱";
}

document.getElementById("run").onclick = extract;
input.addEventListener("input", () => {
  if (input.value.trim()) extract();
});

document.getElementById("copy").onclick = async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  message.textContent = "已复制";
};

document.getElementById("sample").onclick = () => {
  input.value = "联系我们：support@utilora.example 或 sales@example.com\n抄送 alice@test.org，重复 support@utilora.example\n无效：not-an-email、@missing.com";
  extract();
  message.textContent = "已填入示例";
};

document.getElementById("clear").onclick = () => {
  input.value = "";
  output.value = "";
  document.getElementById("count").textContent = "0";
  message.textContent = "";
};
