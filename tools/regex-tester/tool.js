const pattern = document.getElementById("pattern");
const flags = document.getElementById("flags");
const text = document.getElementById("text");
const message = document.getElementById("message");
const matches = document.getElementById("matches");

function test() {
  if (!pattern.value) {
    matches.textContent = "等待输入表达式";
    message.textContent = "";
    return;
  }
  try {
    let f = flags.value;
    if (!f.includes("g")) f += "g";
    const regex = new RegExp(pattern.value, f);
    const found = [];
    let match;
    while ((match = regex.exec(text.value)) !== null) {
      found.push(`第 ${found.length + 1} 个：位置 ${match.index}，内容「${match[0]}」`);
      if (match[0] === "") regex.lastIndex += 1;
    }
    message.className = "message";
    message.textContent = `找到 ${found.length} 个匹配`;
    matches.textContent = found.join("\n") || "没有匹配内容";
  } catch (error) {
    message.className = "message error";
    message.textContent = error.message;
    matches.textContent = "表达式无效";
  }
}

[pattern, flags, text].forEach((el) => el.addEventListener("input", test));
document.getElementById("share").onclick = () => UtiloraShare.copyShareLink(pattern.value, message);
const shared = UtiloraShare.readShareQuery();
pattern.value = shared || "\\d+";
test();
