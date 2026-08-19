const urlEl = document.getElementById("url");
const source = document.getElementById("source");
const medium = document.getElementById("medium");
const campaign = document.getElementById("campaign");
const term = document.getElementById("term");
const content = document.getElementById("content");
const output = document.getElementById("output");
const message = document.getElementById("message");

function build() {
  const base = urlEl.value.trim();
  if (!base) {
    message.textContent = "请填写目标网址";
    message.className = "message error";
    return;
  }
  if (!source.value.trim()) {
    message.textContent = "utm_source 为必填";
    message.className = "message error";
    return;
  }
  let u;
  try {
    u = new URL(base);
  } catch {
    message.textContent = "网址格式不正确，请包含 https:// 或 http://";
    message.className = "message error";
    return;
  }
  const params = {
    utm_source: source.value.trim(),
    utm_medium: medium.value.trim(),
    utm_campaign: campaign.value.trim(),
    utm_term: term.value.trim(),
    utm_content: content.value.trim(),
  };
  Object.entries(params).forEach(([k, v]) => {
    if (v) u.searchParams.set(k, v);
  });
  output.value = u.toString();
  message.textContent = "已生成";
  message.className = "message";
}

document.getElementById("build").onclick = build;
document.getElementById("copy").onclick = async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  message.textContent = "已复制";
  message.className = "message";
};
document.getElementById("sample").onclick = () => {
  urlEl.value = "https://utilora.github.io/";
  source.value = "newsletter";
  medium.value = "email";
  campaign.value = "spring_launch";
  term.value = "";
  content.value = "header_cta";
  build();
  message.textContent = "已填入示例";
};
document.getElementById("clear").onclick = () => {
  urlEl.value = "";
  source.value = "";
  medium.value = "";
  campaign.value = "";
  term.value = "";
  content.value = "";
  output.value = "";
  message.textContent = "";
};
