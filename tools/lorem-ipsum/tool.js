(() => {
  const lang = document.getElementById("lang");
  const type = document.getElementById("type");
  const count = document.getElementById("count");
  const countText = document.getElementById("countText");
  const output = document.getElementById("output");
  const message = document.getElementById("message");

  const LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
    "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
    "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
    "deserunt", "mollit", "anim", "id", "est", "laborum"
  ];

  const ZH_SENTENCES = [
    "这是一段用于设计与排版的占位文本，帮助预览页面布局效果。",
    "工具箱应保持简洁，让用户在不离开浏览器的情况下完成日常任务。",
    "本地优先意味着内容不会被主动上传，隐私与速度同时得到保障。",
    "中文占位文字可模拟真实阅读节奏，便于检查行高与换行表现。",
    "开发与设计协作时，快速生成可替换文案能显著缩短迭代周期。",
    "段落长度适中，既不过于零碎，也不显得冗长，便于视觉评估。",
    "请根据实际需求调整数量，生成结果可直接复制到原型或文档中。",
    "纸感界面强调可读性与留白，占位文本只是辅助，不应喧宾夺主。",
    "无论是移动端还是桌面端，清晰的层级与对比度始终至关重要。",
    "完成填充后记得替换为真实内容，避免发布时残留测试文字。",
    "简短的说明可以帮助同事理解意图，减少沟通成本。",
    "统一的工具风格能降低学习门槛，让新用户快速上手。",
    "浏览器内计算保证即时反馈，无需等待服务器往返。",
    "支持多种长度与语言，方便覆盖不同场景的测试需求。",
    "保持中文界面友好，让日常使用者感到自然与顺手。"
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function words(n) {
    const list = [];
    for (let i = 0; i < n; i++) list.push(pick(LOREM_WORDS));
    return list.join(" ");
  }

  function sentenceEn() {
    const n = 8 + Math.floor(Math.random() * 12);
    let s = words(n);
    return s.charAt(0).toUpperCase() + s.slice(1) + ".";
  }

  function paragraphEn() {
    const n = 3 + Math.floor(Math.random() * 4);
    return Array.from({ length: n }, sentenceEn).join(" ");
  }

  function generate() {
    const n = Math.max(1, Math.min(20, +count.value || 1));
    count.value = n;
    countText.textContent = n;
    const isZh = lang.value === "zh";
    let result = "";

    if (type.value === "words") {
      if (isZh) {
        result = Array.from({ length: n }, () => pick(ZH_SENTENCES).replace(/[。，]/g, "")).join("、");
      } else {
        result = words(n);
      }
    } else if (type.value === "sentences") {
      if (isZh) {
        result = Array.from({ length: n }, () => pick(ZH_SENTENCES)).join("");
      } else {
        result = Array.from({ length: n }, sentenceEn).join(" ");
      }
    } else {
      if (isZh) {
        result = Array.from({ length: n }, () => {
          const s = 2 + Math.floor(Math.random() * 3);
          return Array.from({ length: s }, () => pick(ZH_SENTENCES)).join("");
        }).join("\n\n");
      } else {
        result = Array.from({ length: n }, paragraphEn).join("\n\n");
      }
    }

    output.value = result;
    message.textContent = `已生成 ${n} ${type.options[type.selectedIndex].text}`;
  }

  count.oninput = () => {
    countText.textContent = count.value;
  };
  document.getElementById("generate").onclick = generate;
  document.getElementById("copy").onclick = async () => {
    if (!output.value) return;
    await navigator.clipboard.writeText(output.value);
    message.textContent = "已复制到剪贴板";
  };
  document.getElementById("clear").onclick = () => {
    output.value = "";
    message.textContent = "";
  };
  generate();
})();
