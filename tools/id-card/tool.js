const input = document.getElementById("input");
const stats = document.getElementById("stats");
const message = document.getElementById("message");
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK = "10X98765432";
const PROVINCE = {"11":"北京","12":"天津","13":"河北","14":"山西","15":"内蒙古","21":"辽宁","22":"吉林","23":"黑龙江","31":"上海","32":"江苏","33":"浙江","34":"安徽","35":"福建","36":"江西","37":"山东","41":"河南","42":"湖北","43":"湖南","44":"广东","45":"广西","46":"海南","50":"重庆","51":"四川","52":"贵州","53":"云南","54":"西藏","61":"陕西","62":"甘肃","63":"青海","64":"宁夏","65":"新疆","71":"台湾","81":"香港","82":"澳门"};
function checksum(body) {
  const sum = [...body].reduce((acc, ch, i) => acc + Number(ch) * WEIGHTS[i], 0);
  return CHECK[sum % 11];
}
function parseDate(raw) {
  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6));
  const day = Number(raw.slice(6, 8));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (year < 1900 || date > new Date()) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function inspect(raw) {
  const text = raw.toUpperCase().replace(/[\s-]/g, "");
  if (!text) return { error: "" };
  if (/^\d{15}$/.test(text)) {
    const birth = parseDate(`19${text.slice(6, 12)}`);
    if (!birth) return { error: "15 位号码里的出生日期无效" };
    return { valid: true, note: "旧版 15 位号码，无校验位", items: [
      { label: "地区", value: PROVINCE[text.slice(0, 2)] ?? "未知地区" },
      { label: "生日", value: birth },
      { label: "性别", value: Number(text[14]) % 2 ? "男" : "女" },
      { label: "校验", value: "无" },
    ]};
  }
  if (!/^\d{17}[\dX]$/.test(text)) return { error: "请输入 18 位身份证号，或旧版 15 位" };
  const birth = parseDate(text.slice(6, 14));
  if (!birth) return { error: "出生日期无效" };
  const expect = checksum(text.slice(0, 17));
  const ok = expect === text[17];
  return {
    error: ok ? "" : `校验位应为 ${expect}`,
    valid: ok,
    note: ok ? "号码结构与校验位正确。这不是身份核验。" : "",
    items: [
      { label: "地区", value: PROVINCE[text.slice(0, 2)] ?? "未知地区" },
      { label: "生日", value: birth },
      { label: "性别", value: Number(text[16]) % 2 ? "男" : "女" },
      { label: "校验位", value: expect },
    ],
  };
}
function paint() {
  const result = inspect(input.value);
  if (result.items) {
    stats.hidden = false;
    stats.innerHTML = result.items.map((item) => `<div class="stat"><span>${item.label}</span><strong>${item.value}</strong></div>`).join("");
  } else {
    stats.hidden = true;
    stats.innerHTML = "";
  }
  message.className = result.error ? "message error" : "message";
  message.textContent = result.error || result.note || "输入号码后即时校验";
  window.__idSummary = result.items ? result.items.map((item) => `${item.label} ${item.value}`).join(" · ") + (result.valid ? " · 校验通过" : "") : "";
}
input.addEventListener("input", paint);
document.getElementById("sample").onclick = () => { input.value = "11010519491231002X"; paint(); };
document.getElementById("copy").onclick = async () => {
  if (!window.__idSummary) return;
  await navigator.clipboard.writeText(window.__idSummary);
  message.className = "message";
  message.textContent = "已复制解析结果";
};
document.getElementById("clear").onclick = () => { input.value = ""; paint(); };
paint();
