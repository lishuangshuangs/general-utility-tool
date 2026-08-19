const source = document.getElementById("source");
const result = document.getElementById("result");
const from = document.getElementById("from");
const to = document.getElementById("to");
const message = document.getElementById("message");
const SAMPLE = `{
  "name": "Utilora",
  "tools": ["json", "yaml", "csv"]
}`;

function read(text, format) {
  if (format === "json") return JSON.parse(text);
  if (format === "yaml") return jsyaml.load(text);
  return UtiloraCsv.csvToObjects(text);
}
function writeOut(value, format) {
  if (format === "json") return JSON.stringify(value, null, 2);
  if (format === "yaml") return jsyaml.dump(value, { indent: 2 }).trimEnd();
  return UtiloraCsv.objectsToCsv(value);
}
function convert() {
  const text = source.value;
  if (!text.trim()) { result.value = ""; message.className = "message"; message.textContent = "转换在本地完成，CSV 第一行作为表头。"; return true; }
  try {
    result.value = writeOut(read(text, from.value), to.value);
    message.className = "message";
    message.textContent = "转换在本地完成，CSV 第一行作为表头。";
    return true;
  } catch (error) {
    result.value = "";
    message.className = "message error";
    message.textContent = error.message || "无法转换";
    return false;
  }
}
source.value = UtiloraShare.readShareQuery() || SAMPLE;
from.addEventListener("change", convert);
to.addEventListener("change", convert);
source.addEventListener("input", convert);
document.getElementById("swap").onclick = () => {
  const ok = convert();
  const nextFrom = to.value, nextTo = from.value;
  if (ok) source.value = result.value;
  from.value = nextFrom;
  to.value = nextTo;
  convert();
};
document.getElementById("copy").onclick = async () => {
  if (!result.value) return;
  await navigator.clipboard.writeText(result.value);
  message.className = "message";
  message.textContent = "已复制";
};
document.getElementById("share").onclick = () => UtiloraShare.copyShareLink(source.value, message);
convert();
