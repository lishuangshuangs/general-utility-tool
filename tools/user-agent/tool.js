const input = document.getElementById("input");
const result = document.getElementById("result");
const message = document.getElementById("message");

function parseUA(ua) {
  const s = ua || "";
  let os = "未知";
  if (/Windows NT 10/i.test(s)) os = "Windows 10/11";
  else if (/Windows NT 6\.3/i.test(s)) os = "Windows 8.1";
  else if (/Windows NT 6\.1/i.test(s)) os = "Windows 7";
  else if (/Windows/i.test(s)) os = "Windows";
  else if (/Mac OS X 10[._](\d+)/i.test(s)) {
    const m = s.match(/Mac OS X 10[._](\d+)/i);
    os = "macOS 10." + (m ? m[1] : "?");
  } else if (/Mac OS X/i.test(s) || /Macintosh/i.test(s)) os = "macOS";
  else if (/Android\s([\d.]+)/i.test(s)) {
    const m = s.match(/Android\s([\d.]+)/i);
    os = "Android " + (m ? m[1] : "");
  } else if (/iPhone OS\s([\d_]+)/i.test(s) || /iPad.*OS\s([\d_]+)/i.test(s)) {
    const m = s.match(/OS\s([\d_]+)/i);
    os = "iOS " + (m ? m[1].replace(/_/g, ".") : "");
  } else if (/Linux/i.test(s)) os = "Linux";
  else if (/CrOS/i.test(s)) os = "Chrome OS";

  let browser = "未知";
  if (/Edg\/([\d.]+)/i.test(s)) {
    const m = s.match(/Edg\/([\d.]+)/i);
    browser = "Edge " + (m ? m[1] : "");
  } else if (/Chrome\/([\d.]+)/i.test(s) && !/Edg/i.test(s) && !/OPR/i.test(s)) {
    const m = s.match(/Chrome\/([\d.]+)/i);
    browser = "Chrome " + (m ? m[1] : "");
  } else if (/Firefox\/([\d.]+)/i.test(s)) {
    const m = s.match(/Firefox\/([\d.]+)/i);
    browser = "Firefox " + (m ? m[1] : "");
  } else if (/Safari\/([\d.]+)/i.test(s) && /Version\/([\d.]+)/i.test(s) && !/Chrome/i.test(s)) {
    const m = s.match(/Version\/([\d.]+)/i);
    browser = "Safari " + (m ? m[1] : "");
  } else if (/OPR\/([\d.]+)/i.test(s)) {
    const m = s.match(/OPR\/([\d.]+)/i);
    browser = "Opera " + (m ? m[1] : "");
  } else if (/MSIE\s([\d.]+)/i.test(s) || /Trident.*rv:([\d.]+)/i.test(s)) {
    const m = s.match(/(?:MSIE\s|rv:)([\d.]+)/i);
    browser = "IE " + (m ? m[1] : "");
  }

  let device = "桌面";
  if (/Mobile|Android|iPhone|iPod/i.test(s) && !/iPad/i.test(s)) device = "手机";
  else if (/iPad|Tablet|Android(?!.*Mobile)/i.test(s)) device = "平板";
  else if (/bot|crawl|spider|slurp/i.test(s)) device = "爬虫/机器人";

  let engine = "未知";
  if (/AppleWebKit/i.test(s)) engine = "WebKit / Blink";
  else if (/Gecko/i.test(s) && !/like Gecko/i.test(s)) engine = "Gecko";
  else if (/Trident/i.test(s)) engine = "Trident";
  else if (/Presto/i.test(s)) engine = "Presto";

  return { os, browser, device, engine };
}

function render() {
  const ua = input.value.trim();
  if (!ua) {
    result.style.display = "none";
    message.textContent = "";
    return;
  }
  const r = parseUA(ua);
  document.getElementById("os").textContent = r.os;
  document.getElementById("browser").textContent = r.browser;
  document.getElementById("device").textContent = r.device;
  document.getElementById("engine").textContent = r.engine;
  result.style.display = "grid";
  message.textContent = "已解析";
}

document.getElementById("parse").onclick = render;
document.getElementById("current").onclick = () => {
  input.value = navigator.userAgent;
  render();
  message.textContent = "已填入当前浏览器 UA";
};
document.getElementById("sample").onclick = () => {
  input.value = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
  render();
  message.textContent = "已填入示例";
};
document.getElementById("clear").onclick = () => {
  input.value = "";
  result.style.display = "none";
  message.textContent = "";
};
input.addEventListener("input", () => {
  if (input.value.trim()) render();
});
