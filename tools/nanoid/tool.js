(() => {
  const sizeEl = document.getElementById("size");
  const countEl = document.getElementById("count");
  const alphabetEl = document.getElementById("alphabet");
  const output = document.getElementById("output");
  const message = document.getElementById("message");

  const alphabets = {
    url: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-",
    alphanum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    numbers: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz0123456789",
  };

  function nanoid(size, alphabet) {
    const mask = (2 << (Math.log(alphabet.length - 1) / Math.LN2)) - 1;
    const step = Math.ceil((1.6 * mask * size) / alphabet.length);
    let id = "";
    while (id.length < size) {
      const bytes = new Uint8Array(step);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < step && id.length < size; i++) {
        const idx = bytes[i] & mask;
        if (idx < alphabet.length) id += alphabet[idx];
      }
    }
    return id;
  }

  function generate() {
    const size = Math.min(64, Math.max(4, Number(sizeEl.value) || 21));
    const count = Math.min(50, Math.max(1, Number(countEl.value) || 5));
    const alphabet = alphabets[alphabetEl.value] || alphabets.url;
    const ids = [];
    for (let i = 0; i < count; i++) {
      ids.push(nanoid(size, alphabet));
    }
    output.value = ids.join("\n");
    message.textContent = `已生成 ${count} 个`;
    message.className = "message";
  }

  document.getElementById("generate").addEventListener("click", generate);
  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) {
      message.textContent = "请先生成";
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

  generate();
})();
