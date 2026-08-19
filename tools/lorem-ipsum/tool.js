const lang = document.getElementById("lang");
const count = document.getElementById("count");
const output = document.getElementById("output");
const message = document.getElementById("message");

const LATIN = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates.",
  "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur.",
];

const ZH = [
  "这是一段用于界面预览的中文占位文本。设计稿中常用此类文字填充段落，避免真实内容干扰排版判断。",
  "工具箱应尽量把处理留在浏览器本地，减少不必要的数据上传，保护用户隐私的同时提升响应速度。",
  "段落长度与断句方式会影响阅读节奏。生成多段时可观察行高、字距与对齐是否协调。",
  "中文排版需注意全角标点、禁则与两端对齐。占位文本可帮助在真实文案到位前完成视觉验证。",
  "本地优先意味着输入内容默认不离开设备。收藏与最近使用等偏好也仅保存在本机。",
  "当需要更多变化时，可切换段落数量或语言，快速得到不同密度的填充效果。",
  "实用工具的价值在于顺手：打开即用、结果可信、界面克制，而不是功能堆砌。",
  "完成预览后请替换为正式文案。占位文字仅作布局参考，不应出现在对外发布版本中。",
];

function pick(arr, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[i % arr.length]);
  return out.join("\n\n");
}

function generate() {
  const n = Math.max(1, Math.min(20, +count.value || 1));
  count.value = n;
  const pool = lang.value === "zh" ? ZH : LATIN;
  output.value = pick(pool, n);
  message.textContent = `已生成 ${n} 段`;
}

document.getElementById("generate").onclick = generate;
document.getElementById("copy").onclick = async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  message.textContent = "已复制";
};
document.getElementById("clear").onclick = () => {
  output.value = "";
  message.textContent = "";
};

generate();
