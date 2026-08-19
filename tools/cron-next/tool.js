(() => {
  const cronInput = document.getElementById("cron");
  const countEl = document.getElementById("count");
  const list = document.getElementById("list");
  const message = document.getElementById("message");

  function parseField(field, min, max) {
    const values = new Set();
    const parts = field.split(",");
    for (const part of parts) {
      if (part === "*") {
        for (let i = min; i <= max; i++) values.add(i);
        continue;
      }
      const stepMatch = part.match(/^(\*|\d+(?:-\d+)?)\/(\d+)$/);
      if (stepMatch) {
        let start = min;
        let end = max;
        if (stepMatch[1] !== "*") {
          const range = stepMatch[1].split("-").map(Number);
          start = range[0];
          end = range[1] !== undefined ? range[1] : range[0];
        }
        const step = Number(stepMatch[2]);
        for (let i = start; i <= end; i += step) if (i >= min && i <= max) values.add(i);
        continue;
      }
      const rangeMatch = part.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const a = Number(rangeMatch[1]);
        const b = Number(rangeMatch[2]);
        for (let i = a; i <= b; i++) if (i >= min && i <= max) values.add(i);
        continue;
      }
      if (/^\d+$/.test(part)) {
        const n = Number(part);
        if (n >= min && n <= max) values.add(n);
      }
    }
    return values;
  }

  function matches(date, mins, hours, days, months, weeks) {
    return (
      mins.has(date.getMinutes()) &&
      hours.has(date.getHours()) &&
      days.has(date.getDate()) &&
      months.has(date.getMonth() + 1) &&
      weeks.has(date.getDay())
    );
  }

  function nextRuns(expr, from, limit) {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) throw new Error("请输入 5 段 Cron 表达式");
    const mins = parseField(parts[0], 0, 59);
    const hours = parseField(parts[1], 0, 23);
    const days = parseField(parts[2], 1, 31);
    const months = parseField(parts[3], 1, 12);
    const weeks = parseField(parts[4], 0, 6);
    if (!mins.size || !hours.size || !days.size || !months.size || !weeks.size) {
      throw new Error("表达式中存在无效字段");
    }
    const results = [];
    const cursor = new Date(from.getTime());
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    const maxIter = 366 * 24 * 60;
    for (let i = 0; i < maxIter && results.length < limit; i++) {
      if (matches(cursor, mins, hours, days, months, weeks)) {
        results.push(new Date(cursor.getTime()));
      }
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
    return results;
  }

  function formatDate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      "  周" +
      week
    );
  }

  function run() {
    const limit = Math.min(20, Math.max(1, Number(countEl.value) || 5));
    countEl.value = limit;
    try {
      const runs = nextRuns(cronInput.value, new Date(), limit);
      if (!runs.length) {
        list.replaceChildren();
        message.className = "message error";
        message.textContent = "在合理范围内未找到匹配时间";
        return;
      }
      list.replaceChildren(
        ...runs.map((d, i) => {
          const li = document.createElement("li");
          li.innerHTML = `<strong>${formatDate(d)}</strong><span>第 ${i + 1} 次</span>`;
          return li;
        })
      );
      message.className = "message";
      message.textContent = "已计算 " + runs.length + " 次运行时间";
    } catch (err) {
      list.replaceChildren();
      message.className = "message error";
      message.textContent = err.message || "计算失败";
    }
  }

  document.getElementById("run").addEventListener("click", run);
  document.getElementById("sample").addEventListener("click", () => {
    cronInput.value = "0 9 * * 1-5";
    run();
  });
  cronInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });
  run();
})();
