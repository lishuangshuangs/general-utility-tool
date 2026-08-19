(() => {
  const latinWords = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
    "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
    "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
    "deserunt", "mollit", "anim", "id", "est", "laborum"
  ];
  const zhSentences = [
    "在快速迭代的产品开发中，占位文本能够帮助设计师与工程师提前确认版式与阅读节奏。",
    "本地优先工具箱强调隐私与即时反馈，所有处理均在浏览器内完成，无需上传任何内容。",
    "纸感界面追求克制与清晰，让每一次点击都对应可预期的结果。",
    "中文排版需要兼顾字间距、行高与段落节奏，占位文本可模拟真实阅读体验。",
    "实用工具应当简单、可靠，并能在桌面与手机端保持一致的操作路径。",
    "从需求到实现的闭环越短，团队就越容易验证假设并持续优化体验。",
    "数据安全与本地计算是现代工具设计的基础原则之一。",
    "当界面以内容为中心时，装饰性元素应退居次要位置。",
    "清晰的层级与足够的对比度，能让用户在任何光线下都能快速完成任务。",
    "生成式内容可用于原型演示，但正式产品仍需真实文案与校对。"
  ];

  const langEl = document.getElementById("lang");
  const countEl = document.getElementById("count");
  const startEl = document.getElementById("start");
  const output = document.getElementById("output");
  const message = document.getElementById("message");

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function latinSentence(wordCount) {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(latinWords[rand(0, latinWords.length - 1)]);
    }
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(" ") + ".";
  }

  function latinParagraph(sentenceCount, first) {
    const parts = [];
    for (let i = 0; i < sentenceCount; i++) {
      if (first && i === 0) {
        parts.push("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
      } else {
        parts.push(latinSentence(rand(6, 14)));
      }
    }
    return parts.join(" ");
  }

  function zhParagraph(sentenceCount) {
    const parts = [];
    for (let i = 0; i < sentenceCount; i++) {
      parts.push(zhSentences[rand(0, zhSentences.length - 1)]);
    }
    return parts.join("");
  }

  function generate() {
    const n = Math.min(20, Math.max(1, Number(countEl.value) || 3));
    const isLatin = langEl.value === "latin";
    const startWithLorem = startEl.value === "1";
    const paras = [];
    for (let i = 0; i < n; i++) {
      if (isLatin) {
        paras.push(latinParagraph(rand(3, 6), startWithLorem && i === 0));
      } else {
        paras.push(zhParagraph(rand(2, 4)));
      }
    }
    output.value = paras.join("\n\n");
    message.textContent = `已生成 ${n} 段`;
    message.className = "message";
  }

  document.getElementById("generate").addEventListener("click", generate);
  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) {
      message.textContent = "请先生成文本";
      message.className = "message error";
      return;
    }
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "已复制到剪贴板";
      message.className = "message";
    } catch {
      message.textContent = "复制失败，请手动选择";
      message.className = "message error";
    }
  });

  generate();
})();
