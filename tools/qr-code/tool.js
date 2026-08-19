const content = document.getElementById("content");
const qr = document.getElementById("qr");
const message = document.getElementById("message");
const iconInput = document.getElementById("icon");
const makePane = document.getElementById("make-pane");
const readPane = document.getElementById("read-pane");
const decodedBox = document.getElementById("decoded");
const copyDecoded = document.getElementById("copy-decoded");
const useDecoded = document.getElementById("use-decoded");
let iconImage = null;
let decoded = "";

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

function loadIcon(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Icon 读取失败"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Icon 图片无效"));
      image.onload = () => resolve(image);
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function generate() {
  if (!content.value.trim()) {
    show(false, "请输入文本或网址");
    return;
  }
  if (typeof QRCode === "undefined") {
    show(false, "二维码组件加载失败，请刷新页面");
    return;
  }
  try {
    if (iconInput.files[0]) iconImage = await loadIcon(iconInput.files[0]);
    const size = +document.getElementById("size").value;
    const level = document.getElementById("level").value;
    const style = document.getElementById("border-style").value;
    const temp = document.createElement("div");
    new QRCode(temp, { text: content.value.trim(), width: size, height: size, correctLevel: QRCode.CorrectLevel[level] });
    const source = temp.querySelector("canvas");
    if (!source) throw new Error("二维码绘制失败");
    const padding = style === "none" ? 0 : 20;
    const total = size + padding * 2;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.id = "final-qr";
    canvas.width = canvas.height = total;
    ctx.fillStyle = style === "dark" ? "#111827" : "#ffffff";
    if (style === "rounded") {
      roundedRect(ctx, 0, 0, total, total, 18);
      ctx.fill();
      ctx.save();
      roundedRect(ctx, 0, 0, total, total, 18);
      ctx.clip();
    } else ctx.fillRect(0, 0, total, total);
    ctx.drawImage(source, padding, padding, size, size);
    if (style === "rounded") ctx.restore();
    if (iconImage) {
      const iconSize = Math.round(size * 0.18);
      const x = (total - iconSize) / 2;
      const y = (total - iconSize) / 2;
      ctx.fillStyle = "#fff";
      roundedRect(ctx, x - 6, y - 6, iconSize + 12, iconSize + 12, 10);
      ctx.fill();
      ctx.save();
      roundedRect(ctx, x, y, iconSize, iconSize, 7);
      ctx.clip();
      ctx.drawImage(iconImage, x, y, iconSize, iconSize);
      ctx.restore();
    }
    qr.replaceChildren(canvas);
    show(true, "生成完成");
  } catch (error) {
    show(false, error.message);
  }
}

async function decodeWithJsQR(file) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("无法读取这张图片"));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const found = typeof jsQR === "function" ? jsQR(pixels.data, pixels.width, pixels.height) : null;
  URL.revokeObjectURL(url);
  if (!found?.data) throw new Error("没有识别到二维码");
  return found.data;
}

async function decodeImage(file) {
  if ("BarcodeDetector" in window) {
    try {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close?.();
      if (codes[0]?.rawValue) return codes[0].rawValue;
    } catch {
      /* fall through to jsQR */
    }
  }
  return decodeWithJsQR(file);
}

async function readFile(file) {
  if (!file) return;
  try {
    decoded = await decodeImage(file);
    decodedBox.hidden = false;
    decodedBox.innerHTML = `<p class="hint" style="margin:0 0 6px">识别结果</p><p style="margin:0;font-family:ui-monospace,monospace">${decoded}</p>`;
    copyDecoded.disabled = false;
    useDecoded.disabled = false;
    show(true, "识别完成");
  } catch (error) {
    show(false, error.message);
  }
}

function setMode(mode) {
  const make = mode === "make";
  makePane.hidden = !make;
  readPane.hidden = make;
  document.getElementById("tab-make").classList.toggle("active", make);
  document.getElementById("tab-read").classList.toggle("active", !make);
}

document.getElementById("tab-make").onclick = () => setMode("make");
document.getElementById("tab-read").onclick = () => setMode("read");
document.getElementById("generate").onclick = generate;
document.getElementById("download").onclick = () => {
  const canvas = document.getElementById("final-qr");
  if (!canvas) {
    show(false, "请先生成二维码");
    return;
  }
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "utilora-qrcode.png";
  a.click();
};
document.getElementById("share").onclick = () => UtiloraShare.copyShareLink(content.value, message);
document.getElementById("read-file").onchange = (event) => readFile(event.target.files[0]);
document.getElementById("read-drop").addEventListener("dragover", (event) => event.preventDefault());
document.getElementById("read-drop").addEventListener("drop", (event) => {
  event.preventDefault();
  readFile(event.dataTransfer.files[0]);
});
copyDecoded.onclick = async () => {
  await navigator.clipboard.writeText(decoded);
  show(true, "已复制");
};
useDecoded.onclick = () => {
  content.value = decoded;
  setMode("make");
};
document.addEventListener("paste", (event) => {
  if (readPane.hidden) return;
  const file = [...(event.clipboardData?.items || [])].map((item) => item.getAsFile()).find((item) => item?.type.startsWith("image/"));
  if (file) {
    event.preventDefault();
    readFile(file);
  }
});

content.value = UtiloraShare.readShareQuery() || "https://utilora.github.io/";
