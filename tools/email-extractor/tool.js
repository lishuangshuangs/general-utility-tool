(() => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const unique = document.getElementById("unique");
  const message = document.getElementById("message");
  const countEl = document.getElementById("count");
  const uniqueCountEl = document.getElementById("unique-count");

  // Practical email regex (not perfect RFC, but good for extraction)
  const emailRe =
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;

  function extract() {
    const text = input.value;
    const matches = text.match(emailRe) || [];
    const all = matches.map((m) => m.toLowerCase());
    const deduped = [...new Set(all)];
    const result = unique.checked ? deduped : matches;

    countEl.textContent = matches.length;
    uniqueCountEl.textContent = deduped.length;
    output.value = result.join("\n");
    message.textContent =
      matches.length === 0
        ? "未找到邮箱地址"
        : `找到 ${matches.length} 个，去重后 ${deduped.length} 个`;
    message.className = "message";
  }

  document.getElementById("extract").addEventListener("click", extract);
  unique.addEventListener("change", () => {
    if (input.value.trim()) extract();
  });
  input.addEventListener("input", () => {
    if (input.value.trim()) extract();
  });

  document.getElementById("sample").addEventListener("click", () => {
    input.value = `联系人列表：
张三：zhangsan@example.com
李四：lisi@company.cn，备用：lisi.backup@mail.com
无效：not-an-email、@missing.local
重复：zhangsan@example.com
客服：support@utilora.dev / hello@utilora.dev`;
    extract();
  });

  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    countEl.textContent = "0";
    uniqueCountEl.textContent = "0";
    message.textContent = "";
  });

  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) {
      message.textContent = "暂无结果可复制";
      message.className = "message error";
      return;
    }
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "已复制结果";
      message.className = "message";
    } catch {
      message.textContent = "复制失败，请手动选择";
      message.className = "message error";
    }
  });
})();
