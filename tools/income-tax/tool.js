(() => {
  const F = window.UtiloraFinance;
  const monthSel = document.getElementById("month");
  const now = new Date().getMonth() + 1;
  monthSel.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === now ? "selected" : ""}>${i + 1} 月</option>`).join("");
  document.getElementById("brackets").innerHTML = F.PIT_BRACKETS.map((item, index) => {
    const range = index === 0
      ? "不超过 36,000"
      : item.max === Infinity
        ? "超过 960,000"
        : `超过 ${F.PIT_BRACKETS[index - 1].max.toLocaleString("zh-CN")} 至 ${item.max.toLocaleString("zh-CN")}`;
    return `<tr><td>${range}</td><td>${F.roundFen(item.rate * 100)}%</td><td>${item.quick.toLocaleString("zh-CN")}</td></tr>`;
  }).join("");

  let mode = "monthly";

  function num(id) {
    return Math.max(0, Number(document.getElementById(id).value) || 0);
  }

  function extraMonthly() {
    const children = num("children") * 2000;
    const infants = num("infants") * 2000;
    const education = Number(document.getElementById("education").value) || 0;
    const housing = Number(document.getElementById("housing").value) || 0;
    const elderMode = document.getElementById("elder").value;
    const elder = elderMode === "only" ? 3000 : elderMode === "share" ? Math.min(1500, num("elderShare")) : 0;
    const pension = Math.min(1000, num("pension"));
    return F.roundFen(children + infants + education + housing + elder + pension);
  }

  function render() {
    const extra = extraMonthly();
    document.getElementById("elderShareField").hidden = document.getElementById("elder").value !== "share";
    document.getElementById("monthlyFields").hidden = mode !== "monthly";
    document.getElementById("annualFields").hidden = mode !== "annual";
    document.getElementById("medicalField").hidden = mode !== "annual";
    document.getElementById("extraHint").textContent = `每月专项附加 ${F.formatRmb(extra)}。房贷与租金不能同时扣。`;
    const stats = document.getElementById("stats");
    const wrap = document.getElementById("scheduleWrap");
    const annualHint = document.getElementById("annualHint");
    if (mode === "monthly") {
      const income = num("salary");
      const special = num("special");
      const month = Math.min(12, Math.max(1, Number(monthSel.value) || 1));
      const schedule = F.withholdingSchedule({
        incomes: Array.from({ length: month }, () => income),
        specialMonthly: special,
        extraMonthly: extra,
      });
      const current = schedule[schedule.length - 1];
      const takeHome = F.roundFen(current.income - special - extra - current.tax);
      stats.innerHTML = `
        <div class="stat"><strong>${F.formatRmb(current.tax)}</strong>${current.month} 月预扣</div>
        <div class="stat"><strong>${F.roundFen(current.rate * 100)}%</strong>本月税率</div>
        <div class="stat"><strong>${F.formatRmb(current.taxable)}</strong>累计应纳税所得</div>
        <div class="stat"><strong>${F.formatRmb(takeHome)}</strong>约当实发</div>`;
      wrap.innerHTML = `<table class="sheet-table"><thead><tr><th>月</th><th>累计收入</th><th>累计所得额</th><th>累计预扣</th><th>本月预扣</th></tr></thead><tbody>${
        schedule.map((row) => `<tr><td>${row.month}</td><td>${F.formatRmb(row.cumulativeIncome)}</td><td>${F.formatRmb(row.taxable)}</td><td>${F.formatRmb(row.cumulativeTax)}</td><td>${F.formatRmb(row.tax)}</td></tr>`).join("")
      }</tbody></table>`;
      annualHint.hidden = true;
      document.getElementById("copy").onclick = async () => {
        await navigator.clipboard.writeText(`${current.month} 月预扣 ${F.formatRmb(current.tax)}，约当实发 ${F.formatRmb(takeHome)}`);
        document.getElementById("message").textContent = "已复制本月结果";
      };
      return;
    }
    const income = num("annualIncome");
    const specialYear = num("annualSpecial");
    const extraYear = F.roundFen(extra * 12);
    const medicalYear = Math.min(80000, num("medical"));
    const deductible = F.MONTHLY_THRESHOLD * 12 + specialYear + extraYear + medicalYear;
    const taxable = Math.max(0, F.roundFen(income - deductible));
    const assessed = F.pitOnTaxable(taxable);
    const paid = num("prepaid");
    const refund = F.roundFen(paid - assessed.tax);
    stats.innerHTML = `
      <div class="stat"><strong>${F.formatRmb(assessed.taxable)}</strong>应纳税所得额</div>
      <div class="stat"><strong>${F.formatRmb(assessed.tax)}</strong>应纳税额</div>
      <div class="stat"><strong>${F.roundFen(assessed.rate * 100)}%</strong>适用税率</div>
      <div class="stat"><strong>${F.formatRmb(Math.abs(refund))}</strong>${refund >= 0 ? "应退税" : "应补税"}</div>`;
    wrap.innerHTML = "";
    annualHint.hidden = false;
    annualHint.textContent = `年收入 ${F.formatRmb(income)} − 减除费用 60,000 − 专项 ${F.formatRmb(specialYear)} − 专项附加 ${F.formatRmb(extraYear)}${medicalYear ? ` − 大病 ${F.formatRmb(medicalYear)}` : ""}。`;
    document.getElementById("copy").onclick = async () => {
      await navigator.clipboard.writeText(`应纳税额 ${F.formatRmb(assessed.tax)}，${refund >= 0 ? "应退" : "应补"} ${F.formatRmb(Math.abs(refund))}`);
      document.getElementById("message").textContent = "已复制汇算结果";
    };
  }

  document.getElementById("modes").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    mode = button.dataset.mode;
    [...document.getElementById("modes").children].forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
  document.querySelectorAll("input, select").forEach((node) => {
    node.addEventListener("input", render);
    node.addEventListener("change", render);
  });
  render();
})();
