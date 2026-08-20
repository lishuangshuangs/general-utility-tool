(() => {
  const F = window.UtiloraFinance;
  const SELLER_KEY = "utilora_quote_seller";
  const BUYERS_KEY = "utilora_quote_buyers";
  const ITEMS_KEY = "utilora_quote_items";
  const DOCS_KEY = "utilora_quote_docs";
  const kinds = document.getElementById("kinds");
  const linesEl = document.getElementById("lines");
  const sheet = document.getElementById("sheet");
  const message = document.getElementById("message");
  let kind = "报价单";
  let theme = "classic";
  let logoData = "";
  let sealData = "";
  let qrData = "";
  let currentId = "";
  let rows = [
    { name: "咨询服务", spec: "按项目", qty: "1", unit: "项", price: "8000", rate: "6" },
    { name: "配件", spec: "A-12", qty: "10", unit: "个", price: "113", rate: "13" },
  ];

  const readList = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const writeList = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      message.className = "message error";
      message.textContent = "本机存储已满，请删几条历史单据";
    }
  };

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function addDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const number = document.getElementById("number");
  const date = document.getElementById("date");
  number.value = `Q${today().replace(/-/g, "")}-001`;
  date.value = today();
  document.getElementById("validUntil").value = addDays(7);

  function val(id) {
    return document.getElementById(id).value.trim();
  }
  function setVal(id, value) {
    const node = document.getElementById(id);
    if (node && value != null) node.value = value;
  }
  function esc(value) {
    return String(value || "").replace(/[&<>"]/g, (ch) => ({
      "&": "\u0026amp;",
      "<": "\u0026lt;",
      ">": "\u0026gt;",
      '"': "\u0026quot;",
    }[ch]));
  }
  function tip(text, error) {
    message.className = error ? "message error" : "message";
    message.textContent = text;
  }

  function readImage(file, max, done) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      done(canvas.toDataURL("image/png"));
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  function makeSeal(text) {
    const label = (text || "示例商行").replace(/\s/g, "").slice(0, 8) || "公章";
    const canvas = document.createElement("canvas");
    canvas.width = 280;
    canvas.height = 280;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#c0392b";
    ctx.fillStyle = "#c0392b";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(140, 140, 126, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(140, 140, 112, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", 140, 92);
    const size = label.length > 6 ? 22 : 26;
    ctx.font = `bold ${size}px "Songti SC","SimSun",serif`;
    ctx.fillText(label.slice(0, 4), 140, 148);
    if (label.length > 4) ctx.fillText(label.slice(4), 140, 180);
    ctx.font = "16px serif";
    ctx.fillText("专用章", 140, 214);
    return canvas.toDataURL("image/png");
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
    const pct = Math.max(0, Number(document.getElementById("discountPct").value) || 0);
    const fromPct = F.roundFen(inclusive * (pct / 100));
    const off = Math.max(fromPct, Math.max(0, Number(document.getElementById("discount").value) || 0));
    const payable = F.roundFen(Math.max(0, inclusive - off));
    const depositPct = Math.min(100, Math.max(0, Number(document.getElementById("depositPct").value) || 0));
    const deposit = F.roundFen(payable * (depositPct / 100));
    return { items, exclusive, tax, inclusive, off, payable, depositPct, deposit, balance: F.roundFen(payable - deposit) };
  }

  function snapshot() {
    return {
      id: currentId || `q-${Date.now()}`,
      kind,
      theme,
      logoData,
      sealData,
      qrData,
      rows,
      status: val("status"),
      number: val("number"),
      date: val("date"),
      taxIncluded: document.getElementById("taxIncluded").value,
      sellerName: val("sellerName"),
      sellerTax: val("sellerTax"),
      sellerContact: val("sellerContact"),
      buyerName: val("buyerName"),
      buyerTax: val("buyerTax"),
      buyerContact: val("buyerContact"),
      validUntil: val("validUntil"),
      payInfo: val("payInfo"),
      depositPct: val("depositPct"),
      discountPct: val("discountPct"),
      discount: val("discount"),
      terms: val("terms"),
      note: val("note"),
      unbrand: document.getElementById("unbrand").checked,
      savedAt: new Date().toISOString(),
    };
  }

  function applySnapshot(doc) {
    currentId = doc.id || "";
    kind = doc.kind || "报价单";
    theme = doc.theme || "classic";
    logoData = doc.logoData || "";
    sealData = doc.sealData || "";
    qrData = doc.qrData || "";
    rows = Array.isArray(doc.rows) && doc.rows.length ? doc.rows : [{ name: "", spec: "", qty: "1", unit: "项", price: "", rate: "13" }];
    setVal("status", doc.status || "已报价");
    setVal("number", doc.number);
    setVal("date", doc.date);
    setVal("taxIncluded", doc.taxIncluded || "ex");
    setVal("sellerName", doc.sellerName);
    setVal("sellerTax", doc.sellerTax);
    setVal("sellerContact", doc.sellerContact);
    setVal("buyerName", doc.buyerName);
    setVal("buyerTax", doc.buyerTax);
    setVal("buyerContact", doc.buyerContact);
    setVal("validUntil", doc.validUntil);
    setVal("payInfo", doc.payInfo);
    setVal("depositPct", doc.depositPct);
    setVal("discountPct", doc.discountPct);
    setVal("discount", doc.discount);
    setVal("terms", doc.terms);
    setVal("note", doc.note);
    document.getElementById("unbrand").checked = Boolean(doc.unbrand);
    [...kinds.children].forEach((item) => item.classList.toggle("active", item.dataset.kind === kind));
    [...document.getElementById("themes").children].forEach((item) => item.classList.toggle("active", item.dataset.theme === theme));
    render();
  }

  function renderSelect(id, items, blank, label) {
    const select = document.getElementById(id);
    const current = select.value;
    select.innerHTML = `<option value="">${blank}</option>` + items.map((item, index) =>
      `<option value="${index}">${esc(label(item))}</option>`).join("");
    select.value = current;
  }

  function renderLookups() {
    renderSelect("buyerPick", readList(BUYERS_KEY), "选择已存客户", (item) => item.name);
    renderSelect("itemPick", readList(ITEMS_KEY), "从项目库插入", (item) => `${item.name} ${item.price}`);
    renderSelect("historyPick", readList(DOCS_KEY), "打开已存单据", (item) =>
      `${(item.savedAt || "").slice(0, 10)} ${item.number || ""} ${item.buyerName || ""}`);
  }

  function renderLines() {
    linesEl.innerHTML = "";
    rows.forEach((line, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input data-k="name"></td>
        <td><input data-k="spec"></td>
        <td><input data-k="qty" inputmode="decimal"></td>
        <td><input data-k="unit"></td>
        <td><input data-k="price" inputmode="decimal"></td>
        <td><input data-k="rate" inputmode="decimal"></td>
        <td><button type="button" class="secondary" data-del="${index}" aria-label="删除行">删</button></td>`;
      tr.querySelectorAll("input").forEach((input) => {
        input.value = line[input.dataset.k] || "";
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
    const hideBrand = document.getElementById("unbrand").checked;
    const status = val("status");
    const terms = val("terms");
    sheet.innerHTML = `
      <div class="quote-card theme-${esc(theme)}">
        ${status ? `<div class="quote-mark">${esc(status)}</div>` : ""}
        <div class="quote-head">
          <div class="quote-brand">
            ${logoData ? `<img class="quote-logo" alt="" src="${logoData}">` : ""}
            <div>
              <p class="muted">${esc(sellerName || "UTILORA")}</p>
              <h2>${esc(kind)}</h2>
            </div>
          </div>
          <div class="quote-meta">
            <p>单号 ${esc(val("number") || "—")}</p>
            <p>日期 ${esc(val("date") || "—")}</p>
            ${val("validUntil") ? `<p>有效期至 ${esc(val("validUntil"))}</p>` : ""}
          </div>
        </div>
        <div class="quote-parties">
          <div>
            <p class="muted">卖方</p>
            <p><strong>${esc(sellerName || "—")}</strong></p>
            ${val("sellerTax") ? `<p class="muted">税号 ${esc(val("sellerTax"))}</p>` : ""}
            ${val("sellerContact") ? `<p class="muted">${esc(val("sellerContact"))}</p>` : ""}
          </div>
          <div>
            <p class="muted">买方</p>
            <p><strong>${esc(buyerName || "—")}</strong></p>
            ${val("buyerTax") ? `<p class="muted">税号 ${esc(val("buyerTax"))}</p>` : ""}
            ${val("buyerContact") ? `<p class="muted">${esc(val("buyerContact"))}</p>` : ""}
          </div>
        </div>
        <table class="sheet-table">
          <thead><tr><th>项目</th><th>规格</th><th>数量</th><th>单价</th><th>税率</th><th>不含税</th><th>税额</th></tr></thead>
          <tbody>${c.items.map((item) => `
            <tr>
              <td>${esc(item.name || "—")}</td>
              <td>${esc(item.spec || "—")}</td>
              <td>${esc(item.qty)}${esc(item.unit)}</td>
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
          <p class="money-line">${esc(F.toMoney(c.payable))}</p>
          ${c.depositPct > 0 ? `<p>预付 ${c.depositPct}%　${F.formatRmb(c.deposit)}　尾款　${F.formatRmb(c.balance)}</p>` : ""}
          ${val("payInfo") ? `<p class="muted">收款 ${esc(val("payInfo"))}</p>` : ""}
        </div>
        <div class="quote-extras">
          ${qrData ? `<div class="quote-qr"><img alt="收款码" src="${qrData}"><span>扫码收款</span></div>` : ""}
          ${sealData ? `<img class="quote-seal" alt="公章" src="${sealData}">` : ""}
        </div>
        ${terms ? `<p class="quote-note">付款条款：${esc(terms)}</p>` : ""}
        ${val("note") ? `<p class="quote-note">${esc(val("note"))}</p>` : ""}
        <div class="quote-signs">
          <p>卖方签章：______________</p>
          <p>买方确认：______________</p>
        </div>
        ${hideBrand ? "" : `<p class="quote-foot">由 Utilora 本地生成 · 非正式发票</p>`}
      </div>`;
    return c;
  }

  function render() {
    const pill = document.getElementById("plan-pill");
    if (pill && window.UtiloraPro) {
      pill.textContent = UtiloraPro.label();
      pill.className = "plan-pill on";
    }
    renderLookups();
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
  document.getElementById("themes").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    theme = button.dataset.theme;
    [...document.getElementById("themes").children].forEach((item) => item.classList.toggle("active", item === button));
    renderSheet();
  });
  document.getElementById("logo").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (file) readImage(file, 360, (data) => { logoData = data; renderSheet(); });
  });
  document.getElementById("seal").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (file) readImage(file, 280, (data) => { sealData = data; renderSheet(); });
  });
  document.getElementById("qr").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (file) readImage(file, 220, (data) => { qrData = data; renderSheet(); });
  });
  document.getElementById("makeSeal").onclick = () => {
    sealData = makeSeal(val("sellerName"));
    renderSheet();
    tip("已按卖方名称生成公章，可再上传真实印章替换");
  };

  ["number", "date", "status", "taxIncluded", "sellerName", "sellerTax", "sellerContact", "buyerName", "buyerTax", "buyerContact", "discount", "discountPct", "note", "validUntil", "payInfo", "depositPct", "terms", "unbrand"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderSheet);
    document.getElementById(id).addEventListener("change", renderSheet);
  });
  document.getElementById("addLine").onclick = () => {
    rows.push({ name: "", spec: "", qty: "1", unit: "项", price: "", rate: "13" });
    render();
  };
  document.getElementById("nextNumber").onclick = () => {
    const current = val("number");
    const match = current.match(/^(.*?)(\d+)$/);
    number.value = match ? `${match[1]}${String(Number(match[2]) + 1).padStart(match[2].length, "0")}` : `${current || "Q"}-002`;
    renderSheet();
  };
  document.getElementById("saveBuyer").onclick = () => {
    if (!val("buyerName")) return tip("请先填写买方名称", true);
    const list = readList(BUYERS_KEY).filter((item) => item.name !== val("buyerName"));
    list.unshift({ name: val("buyerName"), tax: val("buyerTax"), contact: val("buyerContact") });
    writeList(BUYERS_KEY, list.slice(0, 40));
    renderLookups();
    tip("客户已保存，下次可直接选");
  };
  document.getElementById("buyerPick").onchange = () => {
    const item = readList(BUYERS_KEY)[Number(document.getElementById("buyerPick").value)];
    if (!item) return;
    setVal("buyerName", item.name);
    setVal("buyerTax", item.tax);
    setVal("buyerContact", item.contact);
    renderSheet();
  };
  document.getElementById("saveItem").onclick = () => {
    const line = rows[0];
    if (!line || !line.name) return tip("第一行还没有项目名", true);
    const list = readList(ITEMS_KEY).filter((item) => item.name !== line.name);
    list.unshift({ name: line.name, spec: line.spec, unit: line.unit, price: line.price, rate: line.rate });
    writeList(ITEMS_KEY, list.slice(0, 80));
    renderLookups();
    tip("已写入项目库");
  };
  document.getElementById("itemPick").onchange = () => {
    const item = readList(ITEMS_KEY)[Number(document.getElementById("itemPick").value)];
    document.getElementById("itemPick").value = "";
    if (!item) return;
    rows.push({ name: item.name, spec: item.spec || "", qty: "1", unit: item.unit || "项", price: item.price || "", rate: item.rate || "13" });
    render();
  };
  document.getElementById("saveSeller").onclick = () => {
    localStorage.setItem(SELLER_KEY, JSON.stringify({
      sellerName: val("sellerName"),
      sellerTax: val("sellerTax"),
      sellerContact: val("sellerContact"),
      payInfo: val("payInfo"),
      theme,
      logoData,
      sealData,
      qrData,
      unbrand: document.getElementById("unbrand").checked,
      terms: val("terms"),
      depositPct: val("depositPct"),
    }));
    tip("卖方资料已保存在这台设备");
  };
  document.getElementById("saveDoc").onclick = () => {
    const doc = snapshot();
    currentId = doc.id;
    const list = readList(DOCS_KEY).filter((item) => item.id !== doc.id);
    list.unshift(doc);
    writeList(DOCS_KEY, list.slice(0, 20));
    renderLookups();
    tip("已存入本机历史");
  };
  document.getElementById("historyPick").onchange = () => {
    const doc = readList(DOCS_KEY)[Number(document.getElementById("historyPick").value)];
    if (!doc) return;
    applySnapshot(doc);
    tip("已打开历史单据");
  };
  document.getElementById("newDoc").onclick = () => {
    currentId = "";
    rows = [{ name: "", spec: "", qty: "1", unit: "项", price: "", rate: "13" }];
    number.value = `Q${today().replace(/-/g, "")}-001`;
    date.value = today();
    setVal("buyerName", "");
    setVal("buyerTax", "");
    setVal("buyerContact", "");
    setVal("status", "草稿");
    render();
  };
  document.getElementById("print").onclick = () => window.print();
  document.getElementById("copy").onclick = async () => {
    const c = renderSheet();
    await navigator.clipboard.writeText(`【${kind} ${val("number")}】${val("buyerName") || "客户"}　应付 ${F.formatRmb(c.payable)}　${F.toMoney(c.payable)}`);
    tip("已复制摘要");
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

  try {
    const saved = JSON.parse(localStorage.getItem(SELLER_KEY) || "null");
    if (saved) {
      setVal("sellerName", saved.sellerName);
      setVal("sellerTax", saved.sellerTax);
      setVal("sellerContact", saved.sellerContact);
      setVal("payInfo", saved.payInfo);
      setVal("terms", saved.terms);
      setVal("depositPct", saved.depositPct);
      if (saved.theme) theme = saved.theme;
      if (saved.logoData) logoData = saved.logoData;
      if (saved.sealData) sealData = saved.sealData;
      if (saved.qrData) qrData = saved.qrData;
      if (saved.unbrand) document.getElementById("unbrand").checked = true;
      [...document.getElementById("themes").children].forEach((item) => {
        item.classList.toggle("active", item.dataset.theme === theme);
      });
    }
  } catch {
    /* ignore */
  }
  render();
})();
