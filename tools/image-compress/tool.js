const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file");
const quality = document.getElementById("quality");
const qualityText = document.getElementById("qualityText");
const maxWidth = document.getElementById("maxWidth");
const format = document.getElementById("format");
const message = document.getElementById("message");
const compare = document.getElementById("compare");
const batch = document.getElementById("batch");
const beforeImg = document.getElementById("beforeImg");
const afterImg = document.getElementById("afterImg");
const beforeMeta = document.getElementById("beforeMeta");
const afterMeta = document.getElementById("afterMeta");
const downloadBtn = document.getElementById("download");
const copyBtn = document.getElementById("copyBase64");

let items = [];

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function formatSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function extOf(type) {
  return type.split("/")[1].replace("jpeg", "jpg");
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
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, q));
}

async function compressFile(file) {
  const q = Number(quality.value);
  const limit = Number(maxWidth.value);
  const type = format.value;
  const { image, url } = await loadImage(file);
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
  if (!blob) throw new Error("当前浏览器不支持这种输出格式");
  const ratio = file.size ? Math.round((1 - blob.size / file.size) * 100) : 0;
  return {
    beforeUrl: url,
    beforeMeta: `${image.naturalWidth}×${image.naturalHeight} · ${formatSize(file.size)}`,
    afterUrl: URL.createObjectURL(blob),
    afterMeta: `${width}×${height} · ${formatSize(blob.size)} · ${ratio > 0 ? `小 ${ratio}%` : ratio < 0 ? `大 ${-ratio}%` : "体积接近"}`,
    blob,
  };
}

function paint() {
  const ready = items.filter((item) => item.blob);
  downloadBtn.disabled = !ready.length;
  copyBtn.disabled = ready.length !== 1;
  downloadBtn.textContent = ready.length > 1 ? "打包下载" : "下载";
  if (items.length === 1 && items[0].afterUrl) {
    compare.hidden = false;
    batch.hidden = true;
    beforeImg.src = items[0].beforeUrl;
    afterImg.src = items[0].afterUrl;
    beforeMeta.textContent = items[0].beforeMeta;
    afterMeta.textContent = items[0].afterMeta;
  } else if (items.length > 1) {
    compare.hidden = true;
    batch.hidden = false;
    batch.innerHTML = items
      .map(
        (item) =>
          `<li><img src="${item.afterUrl || item.beforeUrl}" alt=""><span>${item.name}</span><span>${item.error || item.afterMeta || "处理中"}</span></li>`,
      )
      .join("");
  } else {
    compare.hidden = true;
    batch.hidden = true;
    batch.innerHTML = "";
  }
}

async function rebuild() {
  qualityText.textContent = Number(quality.value).toFixed(2);
  if (!items.length) return;
  const next = [];
  for (const item of items) {
    try {
      const result = await compressFile(item.file);
      next.push({ ...item, ...result, error: undefined });
    } catch (error) {
      next.push({ ...item, error: error.message || "压缩失败" });
    }
  }
  items = next;
  const failed = items.filter((item) => item.error).length;
  const saved = items.reduce((sum, item) => sum + (item.blob ? item.file.size - item.blob.size : 0), 0);
  show(
    !failed,
    failed
      ? `${items.length - failed} 张完成，${failed} 张失败`
      : `已压缩 ${items.length} 张。合计${saved > 0 ? `小 ${formatSize(saved)}` : "体积接近"}。EXIF 已去掉。`,
  );
  paint();
}

function accept(list) {
  const files = [...(list || [])].filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    show(false, "请选择图片文件");
    return;
  }
  if (files.some((file) => file.size > 20 * 1024 * 1024)) {
    show(false, "单张图片请小于 20 MB");
    return;
  }
  items = files.slice(0, 20).map((file) => ({
    name: file.name,
    file,
    beforeUrl: URL.createObjectURL(file),
  }));
  rebuild();
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
quality.addEventListener("input", rebuild);
maxWidth.addEventListener("change", rebuild);
format.addEventListener("change", rebuild);
document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.items || [])]
    .map((item) => item.getAsFile())
    .filter((file) => file?.type.startsWith("image/"));
  if (files.length) {
    event.preventDefault();
    accept(files);
  }
});

downloadBtn.onclick = async () => {
  const ready = items.filter((item) => item.blob);
  if (!ready.length) return;
  const ext = extOf(format.value);
  if (ready.length === 1) {
    const link = document.createElement("a");
    link.href = ready[0].afterUrl;
    link.download = `compressed.${ext}`;
    link.click();
    return;
  }
  const zip = await UtiloraZip.zipBlobs(
    ready.map((item, index) => ({
      name: `${item.name.replace(/\.[^.]+$/, "") || `image-${index + 1}`}.${ext}`,
      blob: item.blob,
    })),
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(zip);
  link.download = "utilora-images.zip";
  link.click();
};

copyBtn.onclick = async () => {
  const item = items.find((entry) => entry.blob);
  if (!item) return;
  const bytes = new Uint8Array(await item.blob.arrayBuffer());
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  await navigator.clipboard.writeText(`data:${item.blob.type};base64,${btoa(binary)}`);
  show(true, "已复制 Data URL");
};

document.getElementById("clear").onclick = () => {
  items = [];
  fileInput.value = "";
  paint();
  show(true, "");
};
