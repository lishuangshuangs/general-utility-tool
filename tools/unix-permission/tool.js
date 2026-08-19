(() => {
  const boxes = [...document.querySelectorAll(".perm-table input[type=checkbox]")];
  const octalEl = document.getElementById("octal");
  const symbolicEl = document.getElementById("symbolic");
  const commandEl = document.getElementById("command");
  const message = document.getElementById("message");

  const whoOrder = ["u", "g", "o"];

  function calc() {
    const vals = { u: 0, g: 0, o: 0 };
    boxes.forEach((box) => {
      if (box.checked) vals[box.dataset.who] += Number(box.dataset.bit);
    });
    const octal = whoOrder.map((w) => vals[w]).join("");
    const symbolic = whoOrder
      .map((w) => {
        const n = vals[w];
        return (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-");
      })
      .join("");
    octalEl.textContent = octal;
    symbolicEl.textContent = symbolic;
    commandEl.textContent = `chmod ${octal} filename`;
  }

  function applyPerm(perm) {
    const str = String(perm).padStart(3, "0").slice(-3);
    whoOrder.forEach((w, i) => {
      const n = Number(str[i]) || 0;
      boxes
        .filter((b) => b.dataset.who === w)
        .forEach((b) => {
          b.checked = (n & Number(b.dataset.bit)) !== 0;
        });
    });
    calc();
  }

  boxes.forEach((box) => box.addEventListener("change", calc));

  document.querySelectorAll("[data-perm]").forEach((btn) => {
    btn.addEventListener("click", () => applyPerm(btn.dataset.perm));
  });

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      message.textContent = okMsg;
      message.className = "message";
    } catch {
      message.textContent = "复制失败，请手动选择";
      message.className = "message error";
    }
  }

  document.getElementById("copy-cmd").addEventListener("click", () => {
    copyText(commandEl.textContent, "已复制 chmod 命令");
  });
  document.getElementById("copy-octal").addEventListener("click", () => {
    copyText(octalEl.textContent, "已复制八进制权限");
  });

  calc();
})();
