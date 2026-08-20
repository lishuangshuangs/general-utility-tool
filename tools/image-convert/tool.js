const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file");
const format = document.getElementById("format");
const quality = document.getElementById("quality");
const qualityText = document.getElementById("qualityText");
const bg = document.getElementById("bg");
const message = document.getElementById("message");
const compare = document.getElementById("compare");
const batch = document.getElementById("batch");
const beforeImg = document.getElementById("beforeImg");
const afterImg = document.getElementById("afterImg");
const beforeMeta = document.getElementById("beforeMeta");
const afterMeta = document.getElementById("afterMeta");
const downloadBtn = document.getElementById("download");

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

async function convertFile(file) {
  const type = format.value;
  const q = Number(quality.value);
  const { image, url } = await loadImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (type === "image/jpeg") {
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, type, q);
  if (!blob) throw new Error("当前浏览器不支持这种输出格式");
  return {
    beforeUrl: url,
    beforeMeta: `${width}×${height} · ${formatSize(file.size)} · ${file.type || "未知"}`,
    afterUrl: URL.createObjectURL(blob),
    afterMeta: `${width}×${height} · ${formatSize(blob.size)} · ${extOf(type).toUpperCase()}`,
    blob,
  };
}

function paint() {
  const ready = items.filter((item) => item.blob);
  downloadBtn.disabled = !ready.length;
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
  quality.disabled = format.value === "image/png";
  if (!items.length) return;
  const next = [];
  for (const item of items) {
    try {
      next.push({ ...item, ...(await convertFile(item.file)), error: undefined });
    } catch (error) {
      next.push({ ...item, error: error.message || "转换失败" });
    }
  }
  items = next;
  const failed = items.filter((item) => item.error).length;
  show(!failed, failed ? `${items.length - failed} 张完成，${failed} 张失败` : `已转为 ${extOf(format.value).toUpperCase()}，共 ${items.length} 张。`);
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
  items = files.slice(0, 20).map((file) => ({ name: file.name, file, beforeUrl: URL.createObjectURL(file) }));
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
format.addEventListener("change", rebuild);
quality.addEventListener("input", rebuild);
bg.addEventListener("input", rebuild);
document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.items || [])].map((item) => item.getAsFile()).filter((file) => file?.type.startsWith("image/"));
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
    link.download = `${ready[0].name.replace(/\.[^.]+$/, "") || "converted"}.${ext}`;
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
  link.download = "utilora-converted.zip";
  link.click();
};

document.getElementById("clear").onclick = () => {
  items = [];
  fileInput.value = "";
  paint();
  show(true, "");
};

qualityText.textContent = Number(quality.value).toFixed(2);
