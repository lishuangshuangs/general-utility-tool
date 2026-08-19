(() => {
  const rootEl = document.getElementById("root");
  const parentEl = document.getElementById("parent");
  const vwBaseEl = document.getElementById("vwBase");
  const vhBaseEl = document.getElementById("vhBase");
  const fields = {
    px: document.getElementById("px"),
    rem: document.getElementById("rem"),
    em: document.getElementById("em"),
    vw: document.getElementById("vw"),
    vh: document.getElementById("vh"),
    percent: document.getElementById("percent"),
  };
  const message = document.getElementById("message");
  let lock = false;

  function num(el) {
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : 0;
  }

  function round(n) {
    return Math.round(n * 10000) / 10000;
  }

  function fromPx(px) {
    const root = Math.max(1, num(rootEl));
    const parent = Math.max(1, num(parentEl));
    const vwBase = Math.max(1, num(vwBaseEl));
    const vhBase = Math.max(1, num(vhBaseEl));
    lock = true;
    fields.px.value = round(px);
    fields.rem.value = round(px / root);
    fields.em.value = round(px / parent);
    fields.vw.value = round((px / vwBase) * 100);
    fields.vh.value = round((px / vhBase) * 100);
    fields.percent.value = round((px / parent) * 100);
    lock = false;
  }

  function onInput(source) {
    if (lock) return;
    const root = Math.max(1, num(rootEl));
    const parent = Math.max(1, num(parentEl));
    const vwBase = Math.max(1, num(vwBaseEl));
    const vhBase = Math.max(1, num(vhBaseEl));
    let px = 0;
    if (source === "px") px = num(fields.px);
    else if (source === "rem") px = num(fields.rem) * root;
    else if (source === "em") px = num(fields.em) * parent;
    else if (source === "vw") px = (num(fields.vw) / 100) * vwBase;
    else if (source === "vh") px = (num(fields.vh) / 100) * vhBase;
    else if (source === "percent") px = (num(fields.percent) / 100) * parent;
    fromPx(px);
    message.textContent = "";
  }

  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener("input", () => onInput(key));
  });
  [rootEl, parentEl, vwBaseEl, vhBaseEl].forEach((el) => {
    el.addEventListener("input", () => {
      if (fields.px.value !== "") onInput("px");
    });
  });

  document.getElementById("sample").addEventListener("click", () => {
    fromPx(16);
    message.textContent = "已填入 16px";
    message.className = "message";
  });
  document.getElementById("clear").addEventListener("click", () => {
    Object.values(fields).forEach((el) => (el.value = ""));
    message.textContent = "";
  });
})();
