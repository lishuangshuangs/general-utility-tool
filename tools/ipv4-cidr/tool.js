(() => {
  const input = document.getElementById("cidr");
  const message = document.getElementById("message");
  const result = document.getElementById("result");

  function ipToLong(ip) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  }

  function longToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }

  function calc() {
    const raw = input.value.trim().replace(/\s+/g, "");
    if (!raw) {
      result.hidden = true;
      message.textContent = "";
      return;
    }
    let ipStr, prefix;
    if (raw.includes("/")) {
      const [a, b] = raw.split("/");
      ipStr = a;
      prefix = Number(b);
    } else {
      ipStr = raw;
      prefix = 32;
    }
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      message.textContent = "前缀长度须为 0–32 的整数";
      message.className = "message error";
      result.hidden = true;
      return;
    }
    const ip = ipToLong(ipStr);
    if (ip === null) {
      message.textContent = "请输入合法的 IPv4 地址";
      message.className = "message error";
      result.hidden = true;
      return;
    }
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const hostBits = 32 - prefix;
    const totalHosts = hostBits >= 31 ? (hostBits === 32 ? 4294967296 : 1 << hostBits) : 1 << hostBits;
    const usable = hostBits <= 1 ? totalHosts : totalHosts - 2;
    const first = hostBits <= 1 ? network : (network + 1) >>> 0;
    const last = hostBits <= 1 ? broadcast : (broadcast - 1) >>> 0;

    document.getElementById("network").textContent = longToIp(network);
    document.getElementById("broadcast").textContent = longToIp(broadcast);
    document.getElementById("mask").textContent = longToIp(mask);
    document.getElementById("wildcard").textContent = longToIp((~mask) >>> 0);
    document.getElementById("prefix").textContent = "/" + prefix;
    document.getElementById("hosts").textContent = usable.toLocaleString() + "（总 " + totalHosts.toLocaleString() + "）";
    document.getElementById("first").textContent = longToIp(first);
    document.getElementById("last").textContent = longToIp(last);
    result.hidden = false;
    message.textContent = "计算完成";
    message.className = "message";
  }

  document.getElementById("calc").addEventListener("click", calc);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") calc();
  });
  document.getElementById("sample").addEventListener("click", () => {
    input.value = "10.0.0.0/8";
    calc();
  });
  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    result.hidden = true;
    message.textContent = "";
  });
  document.getElementById("copy").addEventListener("click", async () => {
    if (result.hidden) return;
    const lines = [
      "网络地址: " + document.getElementById("network").textContent,
      "广播地址: " + document.getElementById("broadcast").textContent,
      "子网掩码: " + document.getElementById("mask").textContent,
      "通配掩码: " + document.getElementById("wildcard").textContent,
      "前缀: " + document.getElementById("prefix").textContent,
      "主机数: " + document.getElementById("hosts").textContent,
      "可用起: " + document.getElementById("first").textContent,
      "可用止: " + document.getElementById("last").textContent,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      message.textContent = "已复制结果";
      message.className = "message";
    } catch {
      message.textContent = "复制失败";
      message.className = "message error";
    }
  });

  calc();
})();
