(() => {
  const palette = document.getElementById("palette");
  const countEl = document.getElementById("count");
  const modeEl = document.getElementById("mode");
  const message = document.getElementById("message");
  let colors = [];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return "#" + f(0) + f(8) + f(4);
  }

  function genOne(mode) {
    const h = rand(0, 360);
    let s, l;
    if (mode === "vibrant") {
      s = rand(65, 95);
      l = rand(40, 60);
    } else if (mode === "pastel") {
      s = rand(30, 55);
      l = rand(72, 88);
    } else if (mode === "dark") {
      s = rand(40, 80);
      l = rand(18, 38);
    } else {
      s = rand(25, 90);
      l = rand(25, 80);
    }
    return hslToHex(h, s, l);
  }

  function render() {
    const n = Math.min(12, Math.max(3, Number(countEl.value) || 5));
    countEl.value = n;
    const mode = modeEl.value;
    colors = Array.from({ length: n }, () => genOne(mode));
    palette.replaceChildren(
      ...colors.map((hex) => {
        const card = document.createElement("div");
        card.className = "swatch-card";
        card.title = "点击复制 " + hex;
        card.innerHTML = `<div class="chip" style="background:${hex}"></div><div class="meta">${hex}</div>`;
        card.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(hex);
            message.className = "message";
            message.textContent = "已复制 " + hex;
          } catch {
            message.className = "message error";
            message.textContent = "复制失败";
          }
        });
        return card;
      })
    );
    message.className = "message";
    message.textContent = "已生成 " + n + " 个颜色";
  }

  document.getElementById("gen").addEventListener("click", render);
  document.getElementById("copyAll").addEventListener("click", async () => {
    if (!colors.length) return;
    try {
      await navigator.clipboard.writeText(colors.join("\n"));
      message.className = "message";
      message.textContent = "已复制全部 HEX";
    } catch {
      message.className = "message error";
      message.textContent = "复制失败";
    }
  });
  countEl.addEventListener("change", render);
  modeEl.addEventListener("change", render);
  render();
})();
