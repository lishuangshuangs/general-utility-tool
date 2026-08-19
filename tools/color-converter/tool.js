const input = document.getElementById("input");
const output = document.getElementById("output");
const message = document.getElementById("message");
const preview = document.getElementById("preview");

function convert() {
  let v = input.value.trim();
  let r;
  let g;
  let b;
  if (/^#?[0-9a-f]{6}$/i.test(v)) {
    v = v.replace("#", "");
    r = parseInt(v.slice(0, 2), 16);
    g = parseInt(v.slice(2, 4), 16);
    b = parseInt(v.slice(4), 16);
  } else {
    const rgb = v.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    const hsl = v.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
    if (rgb) {
      [r, g, b] = rgb.slice(1).map(Number);
      if ([r, g, b].some((x) => x > 255)) {
        message.className = "message error";
        message.textContent = "RGB 数值应为 0–255";
        return;
      }
    } else if (hsl) {
      const h0 = Number(hsl[1]);
      const s0 = Number(hsl[2]) / 100;
      const l0 = Number(hsl[3]) / 100;
      const a = s0 * Math.min(l0, 1 - l0);
      const f = (n) => {
        const k = (n + h0 / 30) % 12;
        return l0 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      };
      r = Math.max(0, Math.min(255, Math.round(f(0) * 255)));
      g = Math.max(0, Math.min(255, Math.round(f(8) * 255)));
      b = Math.max(0, Math.min(255, Math.round(f(4) * 255)));
    } else {
      message.className = "message error";
      message.textContent = "请输入 HEX、rgb() 或 hsl()";
      return;
    }
  }
  const hex = "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === rr ? 60 * (((gg - bb) / d) % 6) : max === gg ? 60 * ((bb - rr) / d + 2) : 60 * ((rr - gg) / d + 4);
  }
  if (h < 0) h += 360;
  output.textContent = `HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  preview.style.background = hex;
  preview.dataset.hex = hex;
  message.className = "message";
  message.textContent = "转换完成";
}

document.getElementById("convert").onclick = convert;
document.getElementById("copy").onclick = async () => {
  if (output.textContent === "—") return;
  await navigator.clipboard.writeText(output.textContent);
  message.textContent = "已复制";
};
document.getElementById("share").onclick = () => UtiloraShare.copyShareLink(preview.dataset.hex || input.value, message);
input.addEventListener("input", convert);
const shared = UtiloraShare.readShareQuery();
if (shared) input.value = shared;
convert();
