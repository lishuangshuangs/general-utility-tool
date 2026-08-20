const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file");
const text = document.getElementById("text");
const position = document.getElementById("position");
const size = document.getElementById("size");
const sizeText = document.getElementById("sizeText");
const opacity = document.getElementById("opacity");
const opacityText = document.getElementById("opacityText");
const color = document.getElementById("color");
const angle = document.getElementById("angle");
const angleText = document.getElementById("angleText");
const format = document.getElementById("format");
const message = document.getElementById("message");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const downloadBtn = document.getElementById("download");

let source = null;
let output = null;

function show(ok, msg) {
  message.className = ok ? "message" : "message error";
  message.textContent = msg;
}

function hexToRgb(hex) {
  const n = hex.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function drawWatermark(ctx, width, height) {
  const label = text.value.trim() || "Utilora";
  const fontSize = Number(size.value);
  const alpha = Number(opacity.value);
  const deg = Number(angle.value);
  const [r, g, b] = hexToRgb(color.value);
  ctx.save();
  ctx.font = `${fontSize}px "Source Han Sans", "PingFang SC", sans-serif`;
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.strokeStyle = `rgba(15,23,42,${alpha * 0.35})`;
  ctx.lineWidth = Math.max(1, fontSize / 18);
  const metrics = ctx.measureText(label);
  const tw = metrics.width;
  const th = fontSize;
  const pad = Math.round(Math.min(width, height) * 0.04);
  const rotate = (x, y) => {
    ctx.translate(x, y);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.strokeText(label, 0, 0);
    ctx.fillText(label, 0, 0);
  };
  if (position.value === "tile") {
    const gapX = tw + pad * 3;
    const gapY = th + pad * 3;
    for (let y = pad; y < height + gapY; y += gapY) {
      for (let x = pad; x < width + gapX; x += gapX) {
        ctx.save();
        rotate(x, y);
        ctx.restore();
      }
    }
  } else {
    const map = {
      tl: [pad, pad + th],
      tr: [width - pad - tw, pad + th],
      bl: [pad, height - pad],
      br: [width - pad - tw, height - pad],
      center: [(width - tw) / 2, (height + th) / 2],
    };
    const [x, y] = map[position.value] || map.br;
    rotate(x, y);
  }
  ctx.restore();
}

function render() {
  sizeText.textContent = size.value;
  opacityText.textContent = Number(opacity.value).toFixed(2);
  angleText.textContent = `${angle.value}°`;
  if (!source) return;
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (format.value === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(source, 0, 0);
  drawWatermark(ctx, canvas.width, canvas.height);
  canvas.toBlob(
    (blob) => {
      if (!blob) {
        show(false, "当前浏览器不支持这种输出格式");
        return;
      }
      if (output) URL.revokeObjectURL(output);
      output = URL.createObjectURL(blob);
      previewImg.src = output;
      preview.hidden = false;
      downloadBtn.disabled = false;
      downloadBtn.dataset.type = blob.type;
    },
    format.value,
    0.92,
  );
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
  const image = new Image();
  image.onload = () => {
    source = image;
    show(true, `${image.naturalWidth}×${image.naturalHeight}`);
    render();
  };
  image.onerror = () => show(false, "无法读取这张图片");
  image.src = URL.createObjectURL(file);
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
["input", "change"].forEach((type) => {
  [text, position, size, opacity, color, angle, format].forEach((node) => node.addEventListener(type, render));
});
document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.items || [])].map((item) => item.getAsFile()).filter((file) => file?.type.startsWith("image/"));
  if (files[0]) {
    event.preventDefault();
    loadFile(files[0]);
  }
});

downloadBtn.onclick = () => {
  if (!output) return;
  const ext = (downloadBtn.dataset.type || format.value).split("/")[1].replace("jpeg", "jpg");
  const link = document.createElement("a");
  link.href = output;
  link.download = `watermark.${ext}`;
  link.click();
};

document.getElementById("clear").onclick = () => {
  source = null;
  fileInput.value = "";
  preview.hidden = true;
  downloadBtn.disabled = true;
  show(true, "");
};

render();
