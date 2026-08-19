(() => {
  const fmt = (n) => {
    if (!Number.isFinite(n)) return "—";
    const s = Math.abs(n) >= 1000 || (Math.abs(n) < 0.01 && n !== 0)
      ? n.toPrecision(6)
      : Number(n.toFixed(6)).toString();
    return s;
  };

  function bindPair(xId, yId, outId, calc) {
    const x = document.getElementById(xId);
    const y = document.getElementById(yId);
    const out = document.getElementById(outId);
    const run = () => {
      const a = parseFloat(x.value);
      const b = parseFloat(y.value);
      if (Number.isNaN(a) || Number.isNaN(b)) {
        out.textContent = "—";
        return;
      }
      try {
        out.textContent = calc(a, b);
      } catch {
        out.textContent = "—";
      }
    };
    x.addEventListener("input", run);
    y.addEventListener("input", run);
  }

  bindPair("p1-x", "p1-y", "p1-out", (x, y) => {
    return `${fmt((x * y) / 100)}（${fmt(x)} × ${fmt(y)}%）`;
  });

  bindPair("p2-a", "p2-b", "p2-out", (a, b) => {
    if (b === 0) return "无法除以零";
    return `${fmt((a / b) * 100)}%`;
  });

  bindPair("p3-a", "p3-b", "p3-out", (a, b) => {
    if (a === 0) return "原值不能为 0";
    const pct = ((b - a) / a) * 100;
    const dir = pct > 0 ? "增加" : pct < 0 ? "减少" : "不变";
    return `${dir} ${fmt(Math.abs(pct))}%（差 ${fmt(b - a)}）`;
  });
})();
