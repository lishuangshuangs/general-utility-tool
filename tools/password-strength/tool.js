const pwd = document.getElementById("pwd");
const bar = document.getElementById("bar");
const scoreLabel = document.getElementById("scoreLabel");
const checksEl = document.getElementById("checks");
const message = document.getElementById("message");

const COMMON = new Set([
  "password","123456","12345678","qwerty","abc123","111111","123123","admin",
  "letmein","welcome","monkey","dragon","master","login","princess","qwerty123",
  "password1","123456789","000000","iloveyou","admin123","root","passw0rd",
  "密码","1234567890","asdfgh","zxcvbn","1q2w3e4r","aa123456"
]);

function analyze(s) {
  const len = s.length;
  let pool = 0;
  const hasLower = /[a-z]/.test(s);
  const hasUpper = /[A-Z]/.test(s);
  const hasDigit = /[0-9]/.test(s);
  const hasSymbol = /[^A-Za-z0-9]/.test(s);
  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasDigit) pool += 10;
  if (hasSymbol) pool += 33;
  const entropy = len && pool ? Math.round(len * Math.log2(pool) * 10) / 10 : 0;

  const checks = [
    { ok: len >= 12, text: len >= 12 ? "长度 ≥ 12" : "长度建议 ≥ 12" },
    { ok: hasLower && hasUpper, text: hasLower && hasUpper ? "含大小写字母" : "建议含大小写字母" },
    { ok: hasDigit, text: hasDigit ? "含数字" : "建议含数字" },
    { ok: hasSymbol, text: hasSymbol ? "含特殊符号" : "建议含特殊符号" },
    { ok: !COMMON.has(s.toLowerCase()), text: COMMON.has(s.toLowerCase()) ? "出现在常见弱密码列表" : "不在常见弱密码列表" },
    { ok: !/(.)\1{2,}/.test(s), text: /(.)\1{2,}/.test(s) ? "存在连续重复字符" : "无过多连续重复" },
    { ok: !/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|qwe|asd|zxc/i.test(s), text: /012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|qwe|asd|zxc/i.test(s) ? "含简单连续序列" : "无明显连续序列" },
  ];

  let score = 0;
  if (len >= 8) score += 15;
  if (len >= 12) score += 20;
  if (len >= 16) score += 15;
  if (hasLower) score += 10;
  if (hasUpper) score += 10;
  if (hasDigit) score += 10;
  if (hasSymbol) score += 15;
  if (entropy >= 60) score += 10;
  if (COMMON.has(s.toLowerCase())) score = Math.min(score, 20);
  if (/(.)\1{3,}/.test(s)) score -= 15;
  score = Math.max(0, Math.min(100, score));

  let label = "极弱", color = "#ef4444";
  if (score >= 80) { label = "很强"; color = "#059669"; }
  else if (score >= 60) { label = "较强"; color = "#10b981"; }
  else if (score >= 40) { label = "中等"; color = "#f59e0b"; }
  else if (score >= 20) { label = "较弱"; color = "#f97316"; }

  let crack = "—";
  if (entropy > 0) {
    if (entropy < 28) crack = "瞬间";
    else if (entropy < 40) crack = "数秒～数分钟";
    else if (entropy < 60) crack = "数小时～数天";
    else if (entropy < 80) crack = "数月～数年";
    else crack = "极难（理论）";
  }

  const charset = [hasLower && "小写", hasUpper && "大写", hasDigit && "数字", hasSymbol && "符号"].filter(Boolean).join("+") || "—";

  return { len, entropy, charset, crack, score, label, color, checks };
}

function render() {
  const s = pwd.value;
  if (!s) {
    bar.style.width = "0";
    scoreLabel.textContent = "请输入密码";
    scoreLabel.style.color = "";
    document.getElementById("len").textContent = "0";
    document.getElementById("entropy").textContent = "0";
    document.getElementById("charset").textContent = "—";
    document.getElementById("crack").textContent = "—";
    checksEl.innerHTML = "";
    return;
  }
  const r = analyze(s);
  bar.style.width = r.score + "%";
  bar.style.background = r.color;
  scoreLabel.textContent = `${r.label}（${r.score} 分）`;
  scoreLabel.style.color = r.color;
  document.getElementById("len").textContent = r.len;
  document.getElementById("entropy").textContent = r.entropy;
  document.getElementById("charset").textContent = r.charset;
  document.getElementById("crack").textContent = r.crack;
  checksEl.innerHTML = r.checks.map((c) =>
    `<div class="check ${c.ok ? "ok" : "bad"}"><span>${c.ok ? "✓" : "✗"}</span>${c.text}</div>`
  ).join("");
}

pwd.addEventListener("input", render);

document.getElementById("toggle").onclick = () => {
  const show = pwd.type === "password";
  pwd.type = show ? "text" : "password";
  document.getElementById("toggle").textContent = show ? "隐藏密码" : "显示密码";
};

document.getElementById("sample").onclick = () => {
  pwd.value = "password123";
  render();
  message.textContent = "已填入示例弱密码";
};

document.getElementById("clear").onclick = () => {
  pwd.value = "";
  message.textContent = "";
  render();
};

render();
