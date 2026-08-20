const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file");
const count = document.getElementById("count");
const message = document.getElementById("message");
const layout = document.getElementById("layout");
const previewImg = document.getElementById("previewImg");
const swatches = document.getElementById("swatches");
const copyCss = document.getElementById("copyCss");

let source = null;
let colors = [];

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function channelRange(pixels, start, end, channel) {
  let min = 255;
  let max = 0;
  for (let i = start; i < end; i += 1) {
    const v = pixels[i][channel];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

function average(pixels, start, end) {
  let r = 0;
  let g = 0;
  let b = 0;
  const n = end - start;
  for (let i = start; i < end; i += 1) {
    r += pixels[i][0];
    g += pixels[i][1];
    b += pixels[i][2];
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function medianCut(pixels, k) {
  const boxes = [{ start: 0, end: pixels.length }];
  while (boxes.length < k) {
    let best = 0;
    let bestRange = -1;
    boxes.forEach((box, index) => {
      const range = Math.max(
        channelRange(pixels, box.start, box.end, 0),
        channelRange(pixels, box.start, box.end, 1),
        channelRange(pixels, box.start, box.end, 2),
      );
      if (range > bestRange && box.end - box.start > 1) {
        bestRange = range;
        best = index;
      }
    });
    if (bestRange <= 0) break;
    const box = boxes[best];
    let channel = 0;
    let range = -1;
    for (let c = 0; c < 3; c += 1) {
      const current = channelRange(pixels, box.start, box.end, c);
      if (current > range) {
        range = current;
        channel = c;
      }
    }
    const slice = pixels.slice(box.start, box.end).sort((a, b) => a[channel] - b[channel]);
    for (let i = 0; i < slice.length; i += 1) pixels[box.start + i] = slice[i];
    const mid = box.start + Math.floor((box.end - box.start) / 2);
    boxes.splice(best, 1, { start: box.start, end: mid }, { start: mid, end: box.end });
  }
  return boxes
    .map((box) => ({
      color: average(pixels, box.start, box.end),
      weight: box.end - box.start,
    }))
    .sort((a, b) => b.weight - a.weight)
    .map((item) => item.color);
}

function extract(image, k) {
  const sample = document.createElement("canvas");
  const size = 120;
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight, 1);
  sample.width = Math.max(1, Math.round(image.naturalWidth * scale));
  sample.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, sample.width, sample.height);
  const data = ctx.getImageData(0, 0, sample.width, sample.height).data;
  const pixels = [];
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3];
    if (a < 80) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (!pixels.length) throw new Error("没有可用像素");
  return medianCut(pixels, k);
}

function render() {
  swatches.innerHTML = colors
    .map((rgb) => {
      const hex = toHex(rgb);
      return `<button class="swatch" type="button" data-hex="${hex}"><i style="background:${hex}"></i><div><b>${hex}</b><span>rgb(${rgb.join(", ")})</span></div></button>`;
    })
    .join("");
  copyCss.disabled = !colors.length;
}

async function analyze() {
  if (!source) return;
  try {
    colors = extract(source, Number(count.value));
    render();
    show(true, `已提取 ${colors.length} 种主色，点击色块复制 HEX。`);
  } catch (error) {
    show(false, error.message || "提取失败");
  }
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    show(false, "请选择图片文件");
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    show(false, "单张图片请小于 20 MB");
    return;
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    source = image;
    previewImg.src = url;
    layout.hidden = false;
    analyze();
  };
  image.onerror = () => show(false, "无法读取这张图片");
  image.src = url;
}

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag");
  const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
  if (file) loadFile(file);
});
fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));
count.addEventListener("change", analyze);
swatches.addEventListener("click", async (event) => {
  const button = event.target.closest(".swatch");
  if (!button) return;
  await navigator.clipboard.writeText(button.dataset.hex);
  show(true, `已复制 ${button.dataset.hex}`);
});
copyCss.onclick = async () => {
  const css = colors.map((rgb, index) => `  --color-${index + 1}: ${toHex(rgb)};`).join("\n");
  await navigator.clipboard.writeText(`:root {\n${css}\n}`);
  show(true, "已复制 CSS 变量");
};
document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.items || [])].map((item) => item.getAsFile()).filter((file) => file?.type.startsWith("image/"));
  if (files[0]) {
    event.preventDefault();
    loadFile(files[0]);
  }
});
document.getElementById("clear").onclick = () => {
  source = null;
  colors = [];
  fileInput.value = "";
  layout.hidden = true;
  swatches.innerHTML = "";
  copyCss.disabled = true;
  show(true, "");
};
