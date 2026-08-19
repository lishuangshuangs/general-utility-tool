(() => {
  const sizeEl = document.getElementById("size");
  const countEl = document.getElementById("count");
  const alphabetEl = document.getElementById("alphabet");
  const customWrap = document.getElementById("custom-wrap");
  const customAlphabet = document.getElementById("custom-alphabet");
  const output = document.getElementById("output");
  const message = document.getElementById("message");

  const alphabets = {
    default: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-",
    alphanum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    numbers: "0123456789",
    hex: "0123456789abcdef",
  };

  function getAlphabet() {
    if (alphabetEl.value === "custom") {
      const custom = customAlphabet.value || alphabets.default;
      return [...new Set(custom.split(""))].join("") || alphabets.default;
    }
    return alphabets[alphabetEl.value] || alphabets.default;
  }

  function nanoid(size, alphabet) {
    const len = alphabet.length;
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    let id = "";
    for (let i = 0; i < size; i++) {
      id += alphabet[bytes[i] % len];
    }
    return id;
  }

  function generate() {
    let size = Math.max(8, Math.min(64, +sizeEl.value || 21));
    let count = Math.max(1, Math.min(50, +countEl.value || 5));
    sizeEl.value = size;
    countEl.value = count;
    const alphabet = getAlphabet();
    if (alphabet.length < 2) {
      message.textContent = "字符集至少需要 2 个不同字符";
      message.className = "message error";
      return;
    }
    const list = Array.from({ length: count }, () => nanoid(size, alphabet));
    output.value = list.join("\n");
    message.textContent = `已生成 ${count} 个，长度 ${size}`;
    message.className = "message";
  }

  alphabetEl.addEventListener("change", () => {
    customWrap.hidden = alphabetEl.value !== "custom";
    generate();
  });
  document.getElementById("generate").addEventListener("click", generate);
  sizeEl.addEventListener("change", generate);
  countEl.addEventListener("change", generate);
  customAlphabet.addEventListener("change", generate);

  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "已复制";
      message.className = "message";
    } catch {
      message.textContent = "复制失败，请手动选择";
      message.className = "message error";
    }
  });

  generate();
})();
