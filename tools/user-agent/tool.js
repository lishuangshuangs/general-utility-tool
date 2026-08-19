(() => {
  const input = document.getElementById("input");
  const result = document.getElementById("result");
  const message = document.getElementById("message");

  function detect(ua) {
    const s = ua || "";
    let browser = "未知";
    let version = "—";
    let os = "未知";
    let device = "桌面";
    let engine = "未知";
    let mobile = "否";

    if (/Windows NT 10/.test(s)) os = "Windows 10/11";
    else if (/Windows NT 6\.3/.test(s)) os = "Windows 8.1";
    else if (/Windows NT 6\.1/.test(s)) os = "Windows 7";
    else if (/Windows/.test(s)) os = "Windows";
    else if (/Mac OS X ([\d_]+)/.test(s)) {
      const m = s.match(/Mac OS X ([\d_]+)/);
      os = "macOS " + (m ? m[1].replace(/_/g, ".") : "");
    } else if (/Android ([\d.]+)/.test(s)) {
      const m = s.match(/Android ([\d.]+)/);
      os = "Android " + (m ? m[1] : "");
    } else if (/iPhone|iPad|iPod/.test(s)) {
      const m = s.match(/OS ([\d_]+)/);
      os = "iOS " + (m ? m[1].replace(/_/g, ".") : "");
    } else if (/Linux/.test(s)) os = "Linux";
    else if (/CrOS/.test(s)) os = "Chrome OS";

    if (/Mobile|Android.*Mobile|iPhone|iPod/.test(s)) {
      device = "手机";
      mobile = "是";
    } else if (/iPad|Tablet|Android(?!.*Mobile)/.test(s)) {
      device = "平板";
      mobile = "是";
    }

    const rules = [
      { re: /Edg\/([\d.]+)/, name: "Microsoft Edge" },
      { re: /OPR\/([\d.]+)/, name: "Opera" },
      { re: /Chrome\/([\d.]+)/, name: "Chrome" },
      { re: /Firefox\/([\d.]+)/, name: "Firefox" },
      { re: /Version\/([\d.]+).*Safari/, name: "Safari" },
      { re: /MSIE ([\d.]+)/, name: "Internet Explorer" },
      { re: /Trident.*rv:([\d.]+)/, name: "Internet Explorer" },
      { re: /SamsungBrowser\/([\d.]+)/, name: "Samsung Internet" },
      { re: /UCBrowser\/([\d.]+)/, name: "UC Browser" },
      { re: /MicroMessenger\/([\d.]+)/, name: "微信" },
      { re: /QQ\/([\d.]+)/, name: "QQ" },
    ];
    for (const r of rules) {
      const m = s.match(r.re);
      if (m) {
        browser = r.name;
        version = m[1];
        break;
      }
    }

    if (/Gecko\//.test(s) && /Firefox/.test(s)) engine = "Gecko";
    else if (/AppleWebKit/.test(s)) engine = "WebKit / Blink";
    else if (/Trident/.test(s)) engine = "Trident";
    else if (/Presto/.test(s)) engine = "Presto";

    return { browser, version, os, device, engine, mobile };
  }

  function show(info) {
    document.getElementById("browser").textContent = info.browser;
    document.getElementById("version").textContent = info.version;
    document.getElementById("os").textContent = info.os;
    document.getElementById("device").textContent = info.device;
    document.getElementById("engine").textContent = info.engine;
    document.getElementById("mobile").textContent = info.mobile;
    result.hidden = false;
    message.textContent = "解析完成";
    message.className = "message";
  }

  function parse() {
    const ua = input.value.trim();
    if (!ua) {
      message.textContent = "请输入 User-Agent";
      message.className = "message error";
      result.hidden = true;
      return;
    }
    show(detect(ua));
  }

  document.getElementById("parse").addEventListener("click", parse);
  document.getElementById("use-current").addEventListener("click", () => {
    input.value = navigator.userAgent;
    parse();
  });
  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    result.hidden = true;
    message.textContent = "";
  });

  input.value = navigator.userAgent;
  parse();
})();
