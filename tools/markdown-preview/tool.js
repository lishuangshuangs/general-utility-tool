const source = document.getElementById("source");
const preview = document.getElementById("preview");
const message = document.getElementById("message");
const SAMPLE = `# Utilora

把常用工具留在浏览器里。

- 本地处理
- 收藏可同步
- 支持 **加粗**、*斜体* 和 \`code\`

\`\`\`
{"simple": true}
\`\`\`

[打开工具箱](https://utilora.github.io/)
`;

function escapeHtml(text) {
  const table = {
    "&": "\u0026amp;",
    "<": "\u0026lt;",
    ">": "\u0026gt;",
    '"': "\u0026quot;",
  };
  return text.replace(/[&<>"]/g, (ch) => table[ch] ?? ch);
}

function inlineBase(text, wechat) {
  const code = wechat
    ? '<code style="font-family:ui-monospace,monospace;font-size:14px;background:#f4f4f4;padding:1px 5px;border-radius:3px;">$1</code>'
    : "<code>$1</code>";
  const link = wechat
    ? '<a href="$2" style="color:#576b95;text-decoration:none;">$1</a>'
    : '<a href="$2" target="_blank" rel="noreferrer">$1</a>';
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, code)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, link);
}

function renderBlocks(sourceText, wechat) {
  const chunks = sourceText.replace(/\r\n/g, "\n").split(/```([\s\S]*?)```/);
  const body = chunks
    .map((chunk, index) => {
      if (index % 2 === 1) {
        const newline = chunk.indexOf("\n");
        const code = newline === -1 ? chunk : chunk.slice(newline + 1);
        const escaped = escapeHtml(code.replace(/\n$/, ""));
        return wechat
          ? `<pre style="margin:14px 0;padding:12px 14px;background:#f6f6f6;border-radius:6px;overflow:auto;font-size:13px;line-height:1.7;color:#333;">${escaped}</pre>`
          : `<pre><code>${escaped}</code></pre>`;
      }
      const paint = (text) => inlineBase(text, wechat);
      return chunk
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => {
          if (/^### /.test(block)) {
            return wechat
              ? `<h3 style="margin:1.4em 0 0.5em;font-size:17px;font-weight:600;color:#222;">${paint(block.slice(4))}</h3>`
              : `<h3>${paint(block.slice(4))}</h3>`;
          }
          if (/^## /.test(block)) {
            return wechat
              ? `<h2 style="margin:1.5em 0 0.55em;font-size:19px;font-weight:600;color:#222;">${paint(block.slice(3))}</h2>`
              : `<h2>${paint(block.slice(3))}</h2>`;
          }
          if (/^# /.test(block)) {
            return wechat
              ? `<h1 style="margin:1.2em 0 0.6em;font-size:22px;font-weight:600;color:#1a1a1a;">${paint(block.slice(2))}</h1>`
              : `<h1>${paint(block.slice(2))}</h1>`;
          }
          if (/^> /.test(block)) {
            return wechat
              ? `<blockquote style="margin:12px 0;padding:4px 0 4px 12px;border-left:3px solid #d0d0d0;color:#666;">${paint(block.replace(/^> /gm, ""))}</blockquote>`
              : `<blockquote>${paint(block.replace(/^> /gm, ""))}</blockquote>`;
          }
          if (/^(- |\d+\. )/.test(block)) {
            const ordered = /^\d+\. /.test(block);
            const items = block
              .split("\n")
              .map((line) => line.replace(/^(- |\d+\. )/, ""))
              .map((line) => `<li${wechat ? ' style="margin:4px 0;"' : ""}>${paint(line)}</li>`)
              .join("");
            return ordered
              ? `<ol${wechat ? ' style="margin:10px 0 10px 1.3em;padding:0;"' : ""}>${items}</ol>`
              : `<ul${wechat ? ' style="margin:10px 0 10px 1.3em;padding:0;"' : ""}>${items}</ul>`;
          }
          return wechat
            ? `<p style="margin:0.85em 0;font-size:16px;line-height:1.8;color:#333;">${paint(block).replace(/\n/g, "<br />")}</p>`
            : `<p>${paint(block).replace(/\n/g, "<br />")}</p>`;
        })
        .join("");
    })
    .join("");
  return wechat
    ? `<section style="font-size:16px;line-height:1.8;color:#333;max-width:677px;margin:0 auto;">${body}</section>`
    : body;
}

function render() {
  preview.innerHTML = renderBlocks(source.value, false);
}

source.value = UtiloraShare.readShareQuery() || SAMPLE;
source.addEventListener("input", render);
document.getElementById("sample").onclick = () => {
  source.value = SAMPLE;
  render();
  message.textContent = "已填入示例";
};
document.getElementById("copy-html").onclick = async () => {
  await navigator.clipboard.writeText(preview.innerHTML);
  message.className = "message";
  message.textContent = "已复制 HTML";
};
document.getElementById("copy-wechat").onclick = async () => {
  await navigator.clipboard.writeText(renderBlocks(source.value, true));
  message.className = "message";
  message.textContent = "已复制公众号样式，可直接贴进编辑器";
};
document.getElementById("share").onclick = () => UtiloraShare.copyShareLink(source.value, message);
document.getElementById("clear").onclick = () => {
  source.value = "";
  render();
  message.textContent = "";
};
render();
