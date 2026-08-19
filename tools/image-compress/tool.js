const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file");
const quality = document.getElementById("quality");
const qualityText = document.getElementById("qualityText");
const maxWidth = document.getElementById("maxWidth");
const format = document.getElementById("format");
const message = document.getElementById("message");
const compare = document.getElementById("compare");
const beforeImg = document.getElementById("beforeImg");
const afterImg = document.getElementById("afterImg");
const beforeMeta = document.getElementById("beforeMeta");
const afterMeta = document.getElementById("afterMeta");
const downloadBtn = document.getElementById("download");
const copyBtn = document.getElementById("copyBase64");

let sourceFile = null;
let sourceUrl = "";
let outputBlob = null;
let outputUrl = "";

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function formatSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function revoke(url) {
  if (url) URL.revokeObjectURL(url);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取这张图片"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, q) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, q);
  });
}

async function compress() {
  if (!sourceFile) return;
  const q = Number(quality.value);
  const limit = Number(maxWidth.value);
  const type = format.value;
  qualityText.textContent = q.toFixed(2);

  try {
    const { image, url } = await loadImage(sourceFile);
    revoke(sourceUrl);
    sourceUrl = url;
    beforeImg.src = url;

    let width = image.naturalWidth;
    let height = image.naturalHeight;
    if (limit && Math.max(width, height) > limit) {
      const scale = limit / Math.max(width, height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (type === "image/jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, type, q);
    if (!blob) {
      show(false, "当前浏览器不支持这种输出格式");
      return;
    }

    revoke(outputUrl);
    outputBlob = blob;
    outputUrl = URL.createObjectURL(blob);
    afterImg.src = outputUrl;
    beforeMeta.textContent = `${image.naturalWidth}×${image.naturalHeight} · ${formatSize(sourceFile.size)}`;
    const ratio = sourceFile.size ? Math.round((1 - blob.size / sourceFile.size) * 100) : 0;
    afterMeta.textContent = `${width}×${height} · ${formatSize(blob.size)} · ${ratio > 0 ? `小 ${ratio}%` : ratio < 0 ? `大 ${-ratio}%` : "体积接近"}`;
    compare.hidden = false;
    downloadBtn.disabled = false;
    copyBtn.disabled = false;
    show(true, "已压缩。重绘后 EXIF 定位信息会一并去掉。");
  } catch (error) {
    show(false, error.message || "压缩失败");
  }
}

function acceptFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    show(false, "请选择图片文件");
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    show(false, "图片请小于 20 MB");
    return;
  }
  sourceFile = file;
  compress();
}

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag");
  acceptFile(event.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => acceptFile(fileInput.files[0]));
quality.addEventListener("input", compress);
maxWidth.addEventListener("change", compress);
format.addEventListener("change", compress);

document.addEventListener("paste", (event) => {
  const item = [...(event.clipboardData?.items || [])].find((entry) => entry.type.startsWith("image/"));
  if (item) acceptFile(item.getAsFile());
});

downloadBtn.onclick = () => {
  if (!outputBlob) return;
  const ext = format.value.split("/")[1].replace("jpeg", "jpg");
  const link = document.createElement("a");
  link.href = outputUrl;
  link.download = `compressed.${ext}`;
  link.click();
};

copyBtn.onclick = async () => {
  if (!outputBlob) return;
  const buffer = await outputBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const dataUrl = `data:${outputBlob.type};base64,${btoa(binary)}`;
  await navigator.clipboard.writeText(dataUrl);
  show(true, "已复制 Data URL");
};

document.getElementById("clear").onclick = () => {
  sourceFile = null;
  outputBlob = null;
  revoke(sourceUrl);
  revoke(outputUrl);
  sourceUrl = "";
  outputUrl = "";
  fileInput.value = "";
  compare.hidden = true;
  downloadBtn.disabled = true;
  copyBtn.disabled = true;
  show(true, "");
};
