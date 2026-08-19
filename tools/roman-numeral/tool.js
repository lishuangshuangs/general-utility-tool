(() => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const message = document.getElementById("message");

  const romanMap = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];

  function toRoman(num) {
    if (!Number.isInteger(num) || num < 1 || num > 3999) {
      throw new Error("请输入 1–3999 之间的整数");
    }
    let n = num;
    let res = "";
    for (const [val, sym] of romanMap) {
      while (n >= val) {
        res += sym;
        n -= val;
      }
    }
    return res;
  }

  function toArabic(str) {
    const s = str.toUpperCase().replace(/\s+/g, "");
    if (!/^[MDCLXVI]+$/.test(s)) throw new Error("无效的罗马数字");
    const values = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      const cur = values[s[i]];
      const next = values[s[i + 1]] || 0;
      if (cur < next) total -= cur;
      else total += cur;
    }
    if (total < 1 || total > 3999 || toRoman(total) !== s) {
      throw new Error("无效的罗马数字");
    }
    return total;
  }

  function showMsg(text, isError) {
    message.textContent = text || "";
    message.className = isError ? "message error" : "message";
  }

  document.getElementById("to-roman").addEventListener("click", () => {
    try {
      const n = parseInt(input.value.trim(), 10);
      if (Number.isNaN(n)) throw new Error("请输入有效整数");
      output.textContent = toRoman(n);
      showMsg("已转换为罗马数字");
    } catch (e) {
      output.textContent = "—";
      showMsg(e.message, true);
    }
  });

  document.getElementById("to-arabic").addEventListener("click", () => {
    try {
      const val = toArabic(input.value.trim());
      output.textContent = String(val);
      showMsg("已转换为阿拉伯数字");
    } catch (e) {
      output.textContent = "—";
      showMsg(e.message, true);
    }
  });

  document.getElementById("copy").addEventListener("click", async () => {
    const text = output.textContent;
    if (!text || text === "—") {
      showMsg("没有可复制的结果", true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showMsg("已复制结果");
    } catch {
      showMsg("复制失败，请手动选择", true);
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("to-roman").click();
  });
})();
