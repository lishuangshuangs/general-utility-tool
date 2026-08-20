const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const lock = document.getElementById("lock");
const ratio = document.getElementById("ratio");
const format = document.getElementById("format");
const message = document.getElementById("message");
const stage = document.getElementById("stage");
const canvas = document.getElementById("stageCanvas");
const meta = document.getElementById("meta");
const downloadBtn = document.getElementById("download");
const resetBtn = document.getElementById("resetCrop");

const ctx = canvas.getContext("2d");
let source = null;
let crop = null;
let drag = null;
let syncing = false;

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function parseRatio() {
  const value = ratio.value;
  if (value === "free") return null;
  const [a, b] = value.split(":").map(Number);
  return a / b;
}

function targetSize() {
  if (!source) return { width: 0, height: 0 };
  let width = Number(widthInput.value) || source.naturalWidth;
  let height = Number(heightInput.value) || source.naturalHeight;
  width = Math.max(1, Math.min(8000, Math.round(width)));
  height = Math.max(1, Math.min(8000, Math.round(height)));
  return { width, height };
}

function defaultCrop() {
  const { width, height } = targetSize();
  const r = parseRatio();
  if (!r) return { x: 0, y: 0, w: width, h: height };
  let w = width;
  let h = Math.round(w / r);
  if (h > height) {
    h = height;
    w = Math.round(h * r);
  }
  return { x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), w, h };
}

function clampCrop(box) {
  const { width, height } = targetSize();
  const r = parseRatio();
  let w = Math.max(8, Math.min(box.w, width));
  let h = Math.max(8, Math.min(box.h, height));
  if (r) {
    if (w / h > r) w = Math.max(8, Math.round(h * r));
    else h = Math.max(8, Math.round(w / r));
    w = Math.min(w, width);
    h = Math.min(h, height);
  }
  const x = Math.max(0, Math.min(box.x, width - w));
  const y = Math.max(0, Math.min(box.y, height - h));
  return { x, y, w, h };
}

function draw() {
  if (!source) return;
  const { width, height } = targetSize();
  const maxDisplay = Math.min(720, stage.clientWidth || 720);
  const scale = Math.min(1, maxDisplay / width);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (!crop) crop = defaultCrop();
  crop = clampCrop(crop);
  const x = crop.x * scale;
  const y = crop.y * scale;
  const w = crop.w * scale;
  const h = crop.h * scale;
  ctx.fillStyle = "rgba(15,23,42,.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(x, y, w, h);
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, x, y, w, h);
  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  meta.textContent = `原图 ${source.naturalWidth}×${source.naturalHeight} · 输出 ${width}×${height} · 裁剪 ${crop.w}×${crop.h}`;
}

function onWidthChange() {
  if (!source || syncing) return;
  if (lock.value === "1") {
    syncing = true;
    heightInput.value = Math.max(1, Math.round((Number(widthInput.value) / source.naturalWidth) * source.naturalHeight));
    syncing = false;
  }
  crop = defaultCrop();
  draw();
}

function onHeightChange() {
  if (!source || syncing) return;
  if (lock.value === "1") {
    syncing = true;
    widthInput.value = Math.max(1, Math.round((Number(heightInput.value) / source.naturalHeight) * source.naturalWidth));
    syncing = false;
  }
  crop = defaultCrop();
  draw();
}

function pointToImage(event) {
  const rect = canvas.getBoundingClientRect();
  const { width, height } = targetSize();
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  };
}

canvas.addEventListener("pointerdown", (event) => {
  if (!source) return;
  canvas.setPointerCapture(event.pointerId);
  const p = pointToImage(event);
  drag = { x: p.x, y: p.y };
  crop = clampCrop({ x: p.x, y: p.y, w: 8, h: 8 });
  draw();
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const p = pointToImage(event);
  const x = Math.min(drag.x, p.x);
  const y = Math.min(drag.y, p.y);
  crop = clampCrop({ x, y, w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y) });
  draw();
});
canvas.addEventListener("pointerup", () => {
  drag = null;
});

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
    widthInput.value = image.naturalWidth;
    heightInput.value = image.naturalHeight;
    crop = defaultCrop();
    stage.hidden = false;
    downloadBtn.disabled = false;
    resetBtn.disabled = false;
    show(true, "拖动画布即可裁剪。");
    draw();
  };
  image.onerror = () => show(false, "无法读取这张图片");
  image.src = url;
}

function accept(list) {
  const file = [...(list || [])].find((item) => item.type.startsWith("image/"));
  if (file) loadFile(file);
}

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag");
  accept(event.dataTransfer.files);
});
fileInput.addEventListener("change", () => accept(fileInput.files));
widthInput.addEventListener("input", onWidthChange);
heightInput.addEventListener("input", onHeightChange);
lock.addEventListener("change", onWidthChange);
ratio.addEventListener("change", () => {
  crop = defaultCrop();
  draw();
});
window.addEventListener("resize", draw);
document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.items || [])].map((item) => item.getAsFile()).filter((file) => file?.type.startsWith("image/"));
  if (files[0]) {
    event.preventDefault();
    loadFile(files[0]);
  }
});

downloadBtn.onclick = () => {
  if (!source || !crop) return;
  const { width, height } = targetSize();
  const scaled = document.createElement("canvas");
  scaled.width = width;
  scaled.height = height;
  const sctx = scaled.getContext("2d");
  if (format.value === "image/jpeg") {
    sctx.fillStyle = "#fff";
    sctx.fillRect(0, 0, width, height);
  }
  sctx.drawImage(source, 0, 0, width, height);
  const out = document.createElement("canvas");
  out.width = crop.w;
  out.height = crop.h;
  const octx = out.getContext("2d");
  if (format.value === "image/jpeg") {
    octx.fillStyle = "#fff";
    octx.fillRect(0, 0, crop.w, crop.h);
  }
  octx.drawImage(scaled, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  const ext = format.value.split("/")[1].replace("jpeg", "jpg");
  out.toBlob(
    (blob) => {
      if (!blob) {
        show(false, "当前浏览器不支持这种输出格式");
        return;
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `resized.${ext}`;
      link.click();
    },
    format.value,
    0.92,
  );
};

resetBtn.onclick = () => {
  crop = defaultCrop();
  draw();
};

document.getElementById("clear").onclick = () => {
  source = null;
  crop = null;
  fileInput.value = "";
  stage.hidden = true;
  downloadBtn.disabled = true;
  resetBtn.disabled = true;
  meta.textContent = "";
  show(true, "");
};
