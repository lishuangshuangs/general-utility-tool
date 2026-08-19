const input = document.getElementById("input");
const output = document.getElementById("output");
const message = document.getElementById("message");
const maps = window.ZhMaps || { s2t: {}, t2s: {} };
const SAMPLE = "Utilora 把常用工具留在浏览器里。头发干了以后，再把文件名转成 slug。";

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function mapText(text, table) {
  let out = "";
  for (const ch of text) out += table[ch] || ch;
  return out;
}

function toPinyin(text, asSlug) {
  if (!window.TinyPinyin || !TinyPinyin.isSupported()) {
    throw new Error("当前浏览器不支持中文拼音转换");
  }
  const tokens = TinyPinyin.parse(text);
  if (asSlug) {
    return tokens
      .map((token) => {
        if (token.type === 2) return token.target.toLowerCase();
        if (/[A-Za-z0-9]/.test(token.source)) return token.source.toLowerCase();
        return "-";
      })
      .join("")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  return tokens
    .map((token, index) => {
      if (token.type === 2) {
        const prev = tokens[index - 1];
        return (prev && prev.type === 2 ? " " : "") + token.target.toLowerCase();
      }
      return token.target;
    })
    .join("");
}

function convert(mode) {
  const text = input.value;
  try {
    if (mode === "s2t") {
      output.value = mapText(text, maps.s2t);
      show(true, "已转为繁体");
    } else if (mode === "t2s") {
      output.value = mapText(text, maps.t2s);
      show(true, "已转为简体");
    } else if (mode === "pinyin") {
      output.value = toPinyin(text, false);
      show(true, "已转为拼音");
    } else if (mode === "slug") {
      output.value = toPinyin(text, true);
      show(true, "已转为 slug");
    }
  } catch (error) {
    show(false, error.message);
  }
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.onclick = () => convert(button.dataset.mode);
});

document.getElementById("sample").onclick = () => {
  input.value = SAMPLE;
  convert("s2t");
};

document.getElementById("copy").onclick = async () => {
  await navigator.clipboard.writeText(output.value);
  show(true, "已复制");
};

document.getElementById("swap").onclick = () => {
  input.value = output.value;
  show(true, "已把结果填回原文");
};

document.getElementById("clear").onclick = () => {
  input.value = "";
  output.value = "";
  show(true, "");
};
