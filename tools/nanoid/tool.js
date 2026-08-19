const sizeEl = document.getElementById("size");
const countEl = document.getElementById("count");
const alphabetEl = document.getElementById("alphabet");
const output = document.getElementById("output");
const message = document.getElementById("message");

const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

function nanoid(size, alphabet) {
  const chars = alphabet || DEFAULT_ALPHABET;
  const len = chars.length;
  if (len < 2) throw new Error("字母表至少 2 个字符");
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = "";
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i] % len];
  }
  return id;
}

function generate() {
  const size = Math.max(8, Math.min(64, +sizeEl.value || 21));
  const count = Math.max(1, Math.min(50, +countEl.value || 1));
  sizeEl.value = size;
  countEl.value = count;
  let alphabet = alphabetEl.value.trim();
  if (!alphabet) alphabet = DEFAULT_ALPHABET;
  try {
    const ids = Array.from({ length: count }, () => nanoid(size, alphabet));
    output.value = ids.join("\n");
    message.textContent = `已生成 ${count} 个，长度 ${size}`;
  } catch (e) {
    message.textContent = e.message || "生成失败";
    message.classList.add("error");
  }
}

document.getElementById("generate").onclick = generate;
document.getElementById("copy").onclick = async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  message.textContent = "已复制";
  message.classList.remove("error");
};

generate();
