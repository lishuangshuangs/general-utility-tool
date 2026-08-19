const amount = document.getElementById("amount");
const moneyOut = document.getElementById("moneyOut");
const spokenOut = document.getElementById("spokenOut");
const message = document.getElementById("message");

const MONEY = "零壹贰叁肆伍陆柒捌玖";
const SPOKEN = "零一二三四五六七八九";
const SMALL = ["", "拾", "佰", "仟"];
const SMALL_SPOKEN = ["", "十", "百", "千"];
const BIG = ["", "万", "亿"];

function section(n, digits, small) {
  const text = String(n).padStart(4, "0");
  let out = "";
  let pendingZero = false;
  for (let i = 0; i < 4; i += 1) {
    const d = Number(text[i]);
    if (d === 0) {
      pendingZero = out.length > 0;
      continue;
    }
    if (pendingZero) out += digits[0];
    pendingZero = false;
    out += digits[d] + small[3 - i];
  }
  return out;
}

function integerPart(n, digits, small, spoken) {
  if (n === 0) return digits[0];
  const blocks = [];
  while (n > 0) {
    blocks.push(n % 10000);
    n = Math.floor(n / 10000);
  }
  let out = "";
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const piece = section(blocks[i], digits, small);
    if (piece) {
      if (out && blocks[i] < 1000) out += digits[0];
      out += piece + BIG[i];
    } else if (i > 0 && out && !out.endsWith(digits[0])) {
      out += digits[0];
    }
  }
  if (spoken && out.startsWith("一十")) out = out.slice(1);
  return out.replace(/零+/g, "零").replace(/零+$/g, "") || digits[0];
}

function toMoney(value) {
  const neg = value < 0;
  const cents = Math.round(Math.abs(value) * 100);
  const yuan = Math.floor(cents / 100);
  const jiao = Math.floor((cents % 100) / 10);
  const fen = cents % 10;
  let body = integerPart(yuan, MONEY, SMALL, false) + "元";
  if (jiao === 0 && fen === 0) body += "整";
  else {
    if (jiao) body += MONEY[jiao] + "角";
    else if (fen && yuan) body += "零";
    if (fen) body += MONEY[fen] + "分";
  }
  return (neg ? "负" : "") + body;
}

function toSpoken(value) {
  const neg = value < 0;
  const abs = Math.abs(value);
  const [intRaw, dec = ""] = abs.toFixed(2).replace(/\.?0+$/, "").split(".");
  let body = integerPart(Number(intRaw), SPOKEN, SMALL_SPOKEN, true);
  if (dec) {
    body += "点" + [...dec].map((d) => SPOKEN[Number(d)]).join("");
  }
  return (neg ? "负" : "") + body;
}

function parseAmount(raw) {
  const text = raw.trim().replace(/,/g, "").replace(/[￥¥元]/g, "");
  if (!text) return { empty: true };
  if (!/^-?\d+(\.\d+)?$/.test(text)) return { error: "请输入有效数字" };
  const value = Number(text);
  if (!Number.isFinite(value)) return { error: "请输入有效数字" };
  if (Math.abs(value) >= 1e12) return { error: "数字过大，请控制在万亿以内" };
  return { value };
}

function render() {
  const parsed = parseAmount(amount.value);
  if (parsed.empty) {
    moneyOut.textContent = "—";
    spokenOut.textContent = "—";
    message.textContent = "";
    return;
  }
  if (parsed.error) {
    moneyOut.textContent = "—";
    spokenOut.textContent = "—";
    message.className = "message error";
    message.textContent = parsed.error;
    return;
  }
  moneyOut.textContent = toMoney(parsed.value);
  spokenOut.textContent = toSpoken(parsed.value);
  message.className = "message";
  message.textContent = "";
}

amount.addEventListener("input", render);
document.getElementById("sample").onclick = () => {
  amount.value = "12345.67";
  render();
};
document.getElementById("clear").onclick = () => {
  amount.value = "";
  render();
};
document.getElementById("copyMoney").onclick = async () => {
  if (moneyOut.textContent === "—") return;
  await navigator.clipboard.writeText(moneyOut.textContent);
  message.className = "message";
  message.textContent = "已复制人民币大写";
};
document.getElementById("copySpoken").onclick = async () => {
  if (spokenOut.textContent === "—") return;
  await navigator.clipboard.writeText(spokenOut.textContent);
  message.className = "message";
  message.textContent = "已复制中文读法";
};
render();
