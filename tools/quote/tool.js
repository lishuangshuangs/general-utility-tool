(() => {
  const F = window.UtiloraFinance;
  const kinds = document.getElementById("kinds");
  const linesEl = document.getElementById("lines");
  const sheet = document.getElementById("sheet");
  const message = document.getElementById("message");
  let kind = "报价单";
  let rows = [
    { name: "咨询服务", spec: "按项目", qty: "1", unit: "项", price: "8000", rate: "6" },
    { name: "配件", spec: "A-12", qty: "10", unit: "个", price: "113", rate: "13" },
  ];

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const number = document.getElementById("number");
  const date = document.getElementById("date");
  number.value = `Q${today().replace(/-/g, "")}-001`;
  date.value = today();

  function val(id) {
    return document.getElementById(id).value.trim();
  }

  function computed() {
    const taxIncluded = document.getElementById("taxIncluded").value === "in";
    const items = rows.map((line) => {
      const qty = Number(line.qty) || 0;
      const price = Number(line.price) || 0;
      const rate = (Number(line.rate) || 0) / 100;
      const amount = F.roundFen(qty * price);
      const split = taxIncluded ? F.vatFromInclusive(amount, rate) : F.vatFromExclusive(amount, rate);
      return { ...line, qty, price, ...split };
    });
    const exclusive = F.roundFen(items.reduce((sum, item) => sum + item.exclusive, 0));
    const tax = F.roundFen(items.reduce((sum, item) => sum + item.tax, 0));
    const inclusive = F.roundFen(items.reduce((sum, item) => sum + item.inclusive, 0));
    const off = Math.max(0, Number(document.getElementById("discount").value) || 0);
    return { items, exclusive, tax, inclusive, off, payable: F.roundFen(Math.max(0, inclusive - off)) };
  }

  function renderLines() {
    linesEl.innerHTML = "";
    rows.forEach((line, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input data-k="name" value="${line.name}"></td>
        <td><input data-k="spec" value="${line.spec}"></td>
        <td><input data-k="qty" inputmode="decimal" value="${line.qty}"></td>
        <td><input data-k="unit" value="${line.unit}"></td>
        <td><input data-k="price" inputmode="decimal" value="${line.price}"></td>
        <td><input data-k="rate" inputmode="decimal" value="${line.rate}"></td>
        <td><button type="button" class="secondary" data-del="${index}" aria-label="删除行">删</button></td>`;
      tr.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", () => {
          rows[index][input.dataset.k] = input.value;
          renderSheet();
        });
      });
      tr.querySelector("[data-del]").addEventListener("click", () => {
        if (rows.length === 1) return;
        rows.splice(index, 1);
        render();
      });
      linesEl.append(tr);
    });
  }

  function renderSheet() {
    const c = computed();
    const sellerName = val("sellerName");
    const buyerName = val("buyerName");
    sheet.innerHTML = `
      <div class="quote-card">
        <div class="quote-head">
          <div>
            <p class="muted">${sellerName || "UTILORA"}</p>
            <h2>${kind}</h2>
          </div>
          <div class="quote-meta">
            <p>单号 ${val("number") || "—"}</p>
            <p>日期 ${val("date") || "—"}</p>
          </div>
        </div>
        <div class="quote-parties">
          <div>
            <p class="muted">卖方</p>
            <p><strong>${sellerName || "—"}</strong></p>
            ${val("sellerTax") ? `<p class="muted">税号 ${val("sellerTax")}</p>` : ""}
            ${val("sellerContact") ? `<p class="muted">${val("sellerContact")}</p>` : ""}
          </div>
          <div>
            <p class="muted">买方</p>
            <p><strong>${buyerName || "—"}</strong></p>
            ${val("buyerTax") ? `<p class="muted">税号 ${val("buyerTax")}</p>` : ""}
            ${val("buyerContact") ? `<p class="muted">${val("buyerContact")}</p>` : ""}
          </div>
        </div>
        <table class="sheet-table">
          <thead><tr><th>项目</th><th>规格</th><th>数量</th><th>单价</th><th>税率</th><th>不含税</th><th>税额</th></tr></thead>
          <tbody>${c.items.map((item) => `
            <tr>
              <td>${item.name || "—"}</td>
              <td>${item.spec || "—"}</td>
              <td>${item.qty}${item.unit}</td>
              <td>${F.formatRmb(item.price)}</td>
              <td>${F.roundFen(item.rate * 100)}%</td>
              <td>${F.formatRmb(item.exclusive)}</td>
              <td>${F.formatRmb(item.tax)}</td>
            </tr>`).join("")}</tbody>
        </table>
        <div class="quote-sum">
          <p>不含税合计　${F.formatRmb(c.exclusive)}</p>
          <p>税额合计　${F.formatRmb(c.tax)}</p>
          <p>价税合计　${F.formatRmb(c.inclusive)}</p>
          ${c.off > 0 ? `<p>优惠　−${F.formatRmb(c.off)}</p>` : ""}
          <p class="money-line">应付 ${F.formatRmb(c.payable)}</p>
          <p class="money-line">${F.toMoney(c.payable)}</p>
        </div>
        ${val("note") ? `<p class="quote-note">${val("note").replace(/</g, "<")}</p>` : ""}
      </div>`;
    return c;
  }

  function render() {
    renderLines();
    renderSheet();
  }

  kinds.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    kind = button.dataset.kind;
    [...kinds.children].forEach((item) => item.classList.toggle("active", item === button));
    renderSheet();
  });
  ["number", "date", "taxIncluded", "sellerName", "sellerTax", "sellerContact", "buyerName", "buyerTax", "buyerContact", "discount", "note"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderSheet);
    document.getElementById(id).addEventListener("change", renderSheet);
  });
  document.getElementById("addLine").onclick = () => {
    rows.push({ name: "", spec: "", qty: "1", unit: "项", price: "", rate: "13" });
    render();
  };
  document.getElementById("print").onclick = () => window.print();
  document.getElementById("copy").onclick = async () => {
    const c = renderSheet();
    await navigator.clipboard.writeText(`【${kind} ${val("number")}】${val("buyerName") || "客户"}　应付 ${F.formatRmb(c.payable)}　${F.toMoney(c.payable)}`);
    message.textContent = "已复制摘要";
  };
  document.getElementById("csv").onclick = () => {
    const c = renderSheet();
    const csv = ["项目,规格,数量,单位,单价,税率,不含税,税额,价税合计", ...c.items.map((item) => [item.name, item.spec, item.qty, item.unit, item.price, `${F.roundFen(item.rate * 100)}%`, item.exclusive, item.tax, item.inclusive].join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${val("number") || "quote"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  render();
})();
