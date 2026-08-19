const input = document.getElementById("input");
const SAMPLE = "Utilora 把常用文本与开发工具留在浏览器里。\n无需安装，也无需登录。\nThe quick brown fox jumps over the lazy dog.";

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function count() {
  const text = input.value;
  const compact = text.replace(/\s/g, "");
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const latin = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
  const words = (text.match(/[\u3400-\u9fff]|[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
  const bytes = new TextEncoder().encode(text).length;
  const minutes = compact ? Math.max(1, Math.ceil(cjk / 400 + latin / 200)) : 0;

  document.getElementById("chars").textContent = text.length;
  document.getElementById("nonspaces").textContent = compact.length;
  document.getElementById("cjk").textContent = cjk;
  document.getElementById("words").textContent = words;
  document.getElementById("lines").textContent = text ? text.split(/\r?\n/).length : 0;
  document.getElementById("bytes").textContent = formatBytes(bytes);
  document.getElementById("readtime").textContent = minutes ? `约 ${minutes} 分钟` : "—";
}

input.addEventListener("input", count);

document.getElementById("sample").onclick = () => {
  input.value = SAMPLE;
  count();
  message.textContent = "已填入示例";
};

document.getElementById("clear").onclick = () => {
  input.value = "";
  message.textContent = "";
  count();
};

document.getElementById("copy").onclick = async () => {
  await navigator.clipboard.writeText(input.value);
  message.textContent = "已复制";
};

count();
