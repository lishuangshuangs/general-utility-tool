(() => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const nameEl = document.getElementById("name");
  const message = document.getElementById("message");

  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function inferType(value, indent = 0) {
    const pad = "  ".repeat(indent);
    if (value === null) return "null";
    if (Array.isArray(value)) {
      if (value.length === 0) return "unknown[]";
      const types = [...new Set(value.map((v) => inferType(v, indent)))];
      if (types.length === 1) return types[0] + "[]";
      return "(" + types.join(" | ") + ")[]";
    }
    if (isPlainObject(value)) {
      const keys = Object.keys(value);
      if (keys.length === 0) return "{}";
      const lines = keys.map((k) => {
        const safe = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
        return pad + "  " + safe + ": " + inferType(value[k], indent + 1) + ";";
      });
      return "{\n" + lines.join("\n") + "\n" + pad + "}";
    }
    const t = typeof value;
    if (t === "string") return "string";
    if (t === "number") return Number.isInteger(value) ? "number" : "number";
    if (t === "boolean") return "boolean";
    return "unknown";
  }

  function convert() {
    const raw = input.value.trim();
    if (!raw) {
      output.value = "";
      message.textContent = "";
      return;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      message.textContent = "JSON 解析失败：" + e.message;
      message.className = "message error";
      output.value = "";
      return;
    }
    const typeName = (nameEl.value.trim() || "Root").replace(/[^a-zA-Z0-9_$]/g, "") || "Root";
    const body = inferType(data, 0);
    let result;
    if (isPlainObject(data)) {
      result = "interface " + typeName + " " + body;
    } else {
      result = "type " + typeName + " = " + body + ";";
    }
    output.value = result;
    message.textContent = "已生成 TypeScript 类型";
    message.className = "message";
  }

  document.getElementById("convert").addEventListener("click", convert);
  document.getElementById("sample").addEventListener("click", () => {
    input.value = JSON.stringify(
      {
        name: "Utilora",
        version: 1,
        features: ["local", "privacy"],
        meta: { author: "team", open: true },
      },
      null,
      2
    );
    nameEl.value = "ToolInfo";
    convert();
  });
  document.getElementById("clear").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    message.textContent = "";
  });
  document.getElementById("copy").addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "已复制到剪贴板";
      message.className = "message";
    } catch {
      message.textContent = "复制失败";
      message.className = "message error";
    }
  });
})();
