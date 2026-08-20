(() => {
  const F = window.UtiloraFinance;
  const KEY = "utilora_crater_v1";
  const view = document.getElementById("view");
  const sheet = document.getElementById("sheet");
  const titleEl = document.getElementById("page-title");
  const primary = document.getElementById("primary-action");

  const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const esc = (v) => String(v || "").replace(/[&<>"]/g, (ch) => ({ "&": "\u0026amp;", "<": "\u0026lt;", ">": "\u0026gt;", '"': "\u0026quot;" }[ch]));
  const money = (n) => F.formatRmb(F.roundFen(Number(n) || 0));

  const empty = () => ({
    company: { name: "示例商行", taxId: "91310000MA0000000X", address: "上海市静安区", phone: "021-00000000", email: "hi@example.com", payInfo: "工行 6222 **** 8899", theme: "navy" },
    customers: [], items: [], estimates: [], invoices: [], payments: [], expenses: [],
  });

  const load = () => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (data && data.company) return { ...empty(), ...data };
    } catch { /* ignore */ }
    const db = empty();
    db.customers = [
      { id: "c1", name: "星海贸易", taxId: "91310115MA1KXXXXXX", email: "a@example.com", phone: "021-58880000", address: "浦东新区世纪大道 1 号" },
      { id: "c2", name: "北岸工作室", taxId: "", email: "b@example.com", phone: "13800000000", address: "静安区" },
      { id: "c3", name: "林间咖啡", taxId: "", email: "c@example.com", phone: "13600000000", address: "徐汇区" },
    ];
    db.items = [
      { id: "i1", name: "品牌顾问", spec: "按项目", unit: "项", price: 8000, rate: 6 },
      { id: "i2", name: "门店物料", spec: "A-12", unit: "批", price: 1260, rate: 13 },
      { id: "i3", name: "上门安装", spec: "市区", unit: "次", price: 300, rate: 6 },
    ];
    db.estimates = [
      { id: "e1", number: "EST-00001", customerId: "c1", date: today(), validUntil: addDays(7), status: "sent", notes: "含税报价，有效期 7 天。", rows: [{ name: "品牌顾问", spec: "按项目", qty: 1, unit: "项", price: 8000, rate: 6 }] },
      { id: "e2", number: "EST-00002", customerId: "c3", date: today(), validUntil: addDays(10), status: "draft", notes: "", rows: [{ name: "门店物料", spec: "A-12", qty: 2, unit: "批", price: 1260, rate: 13 }] },
    ];
    db.invoices = [
      { id: "v1", number: "INV-00001", customerId: "c2", date: addDays(-20), dueDate: addDays(-5), status: "sent", notes: "月结。", rows: [{ name: "上门安装", spec: "市区", qty: 2, unit: "次", price: 300, rate: 6 }] },
      { id: "v2", number: "INV-00002", customerId: "c1", date: today(), dueDate: addDays(15), status: "sent", notes: "", rows: [{ name: "品牌顾问", spec: "按项目", qty: 1, unit: "项", price: 8000, rate: 6 }] },
      { id: "v3", number: "INV-00003", customerId: "c3", date: addDays(-3), dueDate: addDays(12), status: "draft", notes: "", rows: [{ name: "门店物料", spec: "A-12", qty: 1, unit: "批", price: 1260, rate: 13 }] },
    ];
    db.payments = [{ id: "p1", invoiceId: "v2", date: today(), amount: 3000, method: "转账", note: "预付" }];
    db.expenses = [
      { id: "x1", date: today(), vendor: "办公用品", category: "办公", amount: 268, note: "" },
      { id: "x2", date: addDays(-12), vendor: "地铁", category: "交通", amount: 120, note: "" },
    ];
    return db;
  };

  let db = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  const customer = (id) => db.customers.find((c) => c.id === id) || {};
  const nextNo = (prefix, list) => `${prefix}-${String(list.length + 1).padStart(5, "0")}`;

  function compute(doc) {
    const items = (doc.rows || []).map((line) => {
      const qty = Number(line.qty) || 0;
      const price = Number(line.price) || 0;
      const rate = (Number(line.rate) || 0) / 100;
      return { ...line, ...F.vatFromExclusive(F.roundFen(qty * price), rate) };
    });
    const exclusive = F.roundFen(items.reduce((s, i) => s + i.exclusive, 0));
    const tax = F.roundFen(items.reduce((s, i) => s + i.tax, 0));
    return { items, exclusive, tax, inclusive: F.roundFen(exclusive + tax) };
  }
  const paidOf = (id) => F.roundFen(db.payments.filter((p) => p.invoiceId === id).reduce((s, p) => s + Number(p.amount || 0), 0));
  function invoiceStatus(inv) {
    const total = compute(inv).inclusive;
    const paid = paidOf(inv.id);
    if (paid >= total && total > 0) return "paid";
    if (paid > 0) return "partial";
    if (inv.dueDate && inv.dueDate < today() && inv.status !== "draft") return "overdue";
    return inv.status || "draft";
  }
  const EST_LABEL = { draft: "草稿", sent: "已发送", viewed: "已查看", expired: "已过期", accepted: "已接受", rejected: "已拒绝" };
  const INV_LABEL = { draft: "草稿", sent: "已发送", viewed: "已查看", overdue: "逾期", partial: "部分付款", paid: "已付清" };
  const pill = (s, map) => `<span class="pill ${s}">${map[s] || s}</span>`;
  const route = () => { const h = (location.hash.replace(/^#\/?/, "") || "dashboard").split("/"); return { name: h[0], id: h[1] || "" }; };
  const go = (name, id) => { location.hash = id ? `#/${name}/${id}` : `#/${name}`; };

  function monthSeries() {
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 7 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const sales = db.invoices.filter((inv) => (inv.date || "").startsWith(key)).reduce((s, inv) => s + compute(inv).inclusive, 0);
      const expenses = db.expenses.filter((e) => (e.date || "").startsWith(key)).reduce((s, e) => s + Number(e.amount || 0), 0);
      return { key, label: `${d.getMonth() + 1}月`, sales, expenses };
    });
  }
  function svgChart(series) {
    const w = 640, h = 220, p = 28;
    const max = Math.max(1, ...series.flatMap((s) => [s.sales, s.expenses]));
    const x = (i) => p + (i * (w - 2 * p)) / Math.max(1, series.length - 1);
    const y = (v) => h - p - (v / max) * (h - 2 * p);
    const line = (key) => series.map((s, i) => `${x(i)},${y(s[key])}`).join(" ");
    const area = `${x(0)},${h - p} ${line("expenses")} ${x(series.length - 1)},${h - p}`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline fill="none" stroke="#c7d2fe" stroke-width="1" points="${p},${y(max / 2)} ${w - p},${y(max / 2)}" />
      <polygon fill="#fb718522" points="${area}"></polygon>
      <polyline fill="none" stroke="#5851d8" stroke-width="3" points="${line("sales")}"></polyline>
      <polyline fill="none" stroke="#fb7185" stroke-width="3" points="${line("expenses")}"></polyline>
      ${series.map((s, i) => `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" fill="#9ca3af" font-size="11">${s.label}</text>`).join("")}
    </svg>`;
  }

  function paper(doc, kind) {
    const c = customer(doc.customerId);
    const co = db.company;
    const sum = compute(doc);
    return `<div class="inv-paper">
      <div class="inv-banner">
        <div class="brand">${esc(co.name || "专业财务")}</div>
        <div class="meta"><b>${esc(kind)}</b><div>${esc(doc.number)}</div><div>${esc(doc.date)}</div></div>
      </div>
      <div class="inv-body">
        <div class="inv-fromto">
          <div>卖方<br><b>${esc(co.name)}</b>${esc(co.address)}<br>${esc(co.phone)} ${esc(co.taxId)}</div>
          <div>买方<br><b>${esc(c.name || "—")}</b>${esc(c.address || "")}<br>${esc(c.phone || "")}</div>
        </div>
        <table class="inv-table">
          <thead><tr><th>项目</th><th>数量</th><th>单价</th><th>税率</th><th>金额</th></tr></thead>
          <tbody>${sum.items.map((it) => `<tr><td>${esc(it.name)}<div>${esc(it.spec)}</div></td><td>${esc(it.qty)}${esc(it.unit || "")}</td><td>${money(it.price)}</td><td>${it.rate}%</td><td>${money(it.inclusive)}</td></tr>`).join("")}</tbody>
        </table>
        <div class="inv-total">
          <p><span>不含税</span><span>${money(sum.exclusive)}</span></p>
          <p><span>税额</span><span>${money(sum.tax)}</span></p>
          <p class="pay"><span>应付</span><span>${money(sum.inclusive)}</span></p>
        </div>
        ${doc.notes ? `<p style="color:#6b7280;margin-top:18px">${esc(doc.notes)}</p>` : ""}
        ${co.payInfo ? `<p style="color:#6b7280">收款 ${esc(co.payInfo)}</p>` : ""}
      </div>
    </div>`;
  }

  function printDoc(doc, kind) {
    if (!doc) return;
    const c = customer(doc.customerId);
    const co = db.company;
    const sum = compute(doc);
    sheet.innerHTML = `<div class="quote-card theme-navy">${paper(doc, kind)}</div>`;
    sheet.querySelector(".inv-paper").style.width = "100%";
    window.print();
    void c; void co; void sum;
  }

  function renderDashboard() {
    const due = db.invoices.reduce((s, inv) => s + Math.max(0, compute(inv).inclusive - paidOf(inv.id)), 0);
    const sales = db.invoices.reduce((s, inv) => s + compute(inv).inclusive, 0);
    const receipts = db.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const expenses = db.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const series = monthSeries();
    const dues = db.invoices.filter((i) => ["overdue", "sent", "partial"].includes(invoiceStatus(i)));
    view.innerHTML = `
      <div class="stat-row">
        <div class="stat-card"><div><b>${money(due)}</b><span>应收未收</span></div><div class="stat-ico pink">¥</div></div>
        <div class="stat-card"><div><b>${db.customers.length}</b><span>客户</span></div><div class="stat-ico blue">客</div></div>
        <div class="stat-card"><div><b>${db.invoices.length}</b><span>发票</span></div><div class="stat-ico violet">票</div></div>
        <div class="stat-card"><div><b>${db.estimates.length}</b><span>报价</span></div><div class="stat-ico blue">报</div></div>
      </div>
      <div class="chart-wrap">
        <div class="chart-card"><h2>销售收入与费用</h2>${svgChart(series)}</div>
        <div class="sum-card">
          <p><span>销售合计</span><b class="purple">${money(sales)}</b></p>
          <p><span>已收</span><b class="green">${money(receipts)}</b></p>
          <p><span>费用</span><b class="red">${money(expenses)}</b></p>
          <p><span>净额</span><b>${money(sales - expenses)}</b></p>
        </div>
      </div>
      <div class="split-lists">
        <div class="list-card">
          <h2>到期发票</h2>
          ${dues.length ? dues.map((inv) => `<div class="mini-row" data-go="invoice/${inv.id}"><div><b>${esc(customer(inv.customerId).name)}</b><small>${esc(inv.dueDate)} · ${esc(inv.number)}</small></div><b>${money(compute(inv).inclusive - paidOf(inv.id))}</b></div>`).join("") : `<p class="empty">没有到期发票</p>`}
        </div>
        <div class="list-card">
          <h2>最近报价</h2>
          ${db.estimates.map((est) => `<div class="mini-row" data-go="estimate/${est.id}"><div><b>${esc(customer(est.customerId).name)}</b><small>${esc(est.date)} · ${esc(est.number)}</small></div><b>${money(compute(est).inclusive)}</b></div>`).join("") || `<p class="empty">还没有报价</p>`}
        </div>
      </div>`;
    view.querySelectorAll("[data-go]").forEach((el) => el.onclick = () => { location.hash = `#/${el.dataset.go}`; });
  }

  function renderPeople(kind) {
    const isCust = kind === "customers";
    const list = db[kind];
    view.innerHTML = `<div class="panel">${list.length ? `<table class="sheet-table"><thead><tr>${isCust ? "<th>客户</th><th>电话</th><th>邮箱</th><th></th>" : "<th>项目</th><th>单价</th><th>税率</th><th></th>"}</tr></thead><tbody>${list.map((row) => `<tr>
      <td><b>${esc(row.name)}</b><div style="color:#9ca3af;font-size:12px">${esc(isCust ? row.address : row.spec)}</div></td>
      <td>${isCust ? esc(row.phone) : money(row.price)}</td>
      <td>${isCust ? esc(row.email) : `${row.rate}%`}</td>
      <td class="actions"><button class="secondary" data-edit="${row.id}">编辑</button><button class="secondary" data-del="${row.id}">删除</button></td>
    </tr>`).join("")}</tbody></table>` : `<p class="empty">${isCust ? "还没有客户" : "还没有项目"}</p>`}</div>
    <div class="panel" id="box" hidden style="margin-top:14px"><div class="form-grid" id="form"></div><div class="actions"><button id="save">保存</button><button class="secondary" id="cancel">取消</button></div></div>`;
    const fields = isCust ? [["name", "名称"], ["taxId", "税号"], ["phone", "电话"], ["email", "邮箱"], ["address", "地址"]] : [["name", "名称"], ["spec", "规格"], ["unit", "单位"], ["price", "单价"], ["rate", "税率%"]];
    let current = null;
    const open = (row) => {
      current = row;
      document.getElementById("form").innerHTML = fields.map(([k, l]) => `<div class="field"><label>${l}</label><input data-k="${k}" value="${esc(row[k] || "")}"></div>`).join("");
      document.getElementById("box").hidden = false;
    };
    primary.onclick = () => open(isCust ? { name: "" } : { name: "", unit: "项", rate: 13 });
    view.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => open(list.find((r) => r.id === b.dataset.edit)));
    view.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { db[kind] = db[kind].filter((r) => r.id !== b.dataset.del); save(); draw(); });
    document.getElementById("cancel").onclick = () => { document.getElementById("box").hidden = true; };
    document.getElementById("save").onclick = () => {
      const payload = { ...(current || {}) };
      document.querySelectorAll("#form [data-k]").forEach((i) => { payload[i.dataset.k] = i.value.trim(); });
      if (!payload.name) return;
      payload.price = Number(payload.price || 0);
      payload.rate = Number(payload.rate || 0);
      if (!payload.id) payload.id = uid(isCust ? "c" : "i");
      const idx = db[kind].findIndex((r) => r.id === payload.id);
      if (idx >= 0) db[kind][idx] = payload; else db[kind].unshift(payload);
      save(); draw();
    };
  }

  function convertEstimate(id) {
    const est = db.estimates.find((e) => e.id === id);
    if (!est) return;
    est.status = "accepted";
    const inv = { id: uid("v"), number: nextNo("INV", db.invoices), customerId: est.customerId, estimateId: est.id, date: today(), dueDate: addDays(15), status: "sent", notes: est.notes, rows: est.rows.map((r) => ({ ...r })) };
    db.invoices.unshift(inv); save(); go("invoices", inv.id);
  }
  function quickPay(id) {
    const inv = db.invoices.find((i) => i.id === id);
    if (!inv) return;
    const left = Math.max(0, compute(inv).inclusive - paidOf(inv.id));
    const amount = Number(window.prompt("收到多少？", String(left)) || 0);
    if (!amount) return;
    db.payments.unshift({ id: uid("p"), invoiceId: id, date: today(), amount, method: "转账", note: "" });
    save(); draw();
  }

  function renderDocs(kind) {
    const isEst = kind === "estimates";
    const list = db[kind];
    const map = isEst ? EST_LABEL : INV_LABEL;
    const selectedId = route().id || (list[0] && list[0].id) || "";
    const selected = list.find((d) => d.id === selectedId) || list[0];
    const statusOf = (d) => (isEst ? d.status : invoiceStatus(d));
    view.innerHTML = `<div class="split-app">
      <div class="doc-list">
        <div class="tools"><input id="q" placeholder="搜索客户或单号"></div>
        <div class="tabs">
          <button class="on" data-f="all">全部</button>
          <button data-f="draft">草稿</button>
          <button data-f="${isEst ? "sent" : "overdue"}">${isEst ? "已发送" : "逾期"}</button>
          ${isEst ? "" : `<button data-f="paid">已付清</button>`}
        </div>
        <div class="doc-scroll" id="rows"></div>
      </div>
      <div class="preview-pane" id="preview">${selected ? "" : `<p class="empty">${isEst ? "还没有报价" : "还没有发票"}</p>`}</div>
    </div>`;
    let filter = "all";
    const paintList = () => {
      const q = (document.getElementById("q").value || "").toLowerCase();
      const rows = list.filter((d) => {
        const st = statusOf(d);
        if (filter !== "all" && st !== filter) return false;
        const name = (customer(d.customerId).name || "") + d.number;
        return name.toLowerCase().includes(q);
      });
      document.getElementById("rows").innerHTML = rows.map((d) => `<div class="doc-item${d.id === selectedId ? " on" : ""}" data-id="${d.id}">
        <div><b>${esc(customer(d.customerId).name || "未选客户")}</b>${pill(statusOf(d), map)}<small>${esc(d.number)} · ${esc(d.date)}</small></div>
        <b>${money(compute(d).inclusive)}</b>
      </div>`).join("") || `<p class="empty">没有匹配单据</p>`;
      document.querySelectorAll(".doc-item").forEach((el) => el.onclick = () => go(kind, el.dataset.id));
    };
    const paintPreview = () => {
      if (!selected) return;
      document.getElementById("preview").innerHTML = `
        <div class="preview-actions">
          ${isEst ? `<button class="main" data-act="convert">转为发票</button>` : `<button class="main" data-act="pay">记录收款</button>`}
          <button data-act="edit">编辑</button>
          <button data-act="sent">标为已发送</button>
          <button data-act="print">打印 / PDF</button>
        </div>
        ${paper(selected, isEst ? "报价单" : "发票")}`;
      document.querySelectorAll("[data-act]").forEach((b) => b.onclick = () => {
        if (b.dataset.act === "print") printDoc(selected, isEst ? "报价单" : "发票");
        if (b.dataset.act === "edit") go(isEst ? "estimate" : "invoice", selected.id);
        if (b.dataset.act === "convert") convertEstimate(selected.id);
        if (b.dataset.act === "pay") quickPay(selected.id);
        if (b.dataset.act === "sent") { selected.status = "sent"; save(); draw(); }
      });
    };
    document.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => {
      filter = b.dataset.f;
      document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
      paintList();
    });
    document.getElementById("q").oninput = paintList;
    primary.onclick = () => go(isEst ? "estimate" : "invoice", "new");
    paintList();
    paintPreview();
  }

  function renderPayments() {
    view.innerHTML = `<div class="panel">${db.payments.length ? `<table class="sheet-table"><thead><tr><th>日期</th><th>发票</th><th>客户</th><th>金额</th><th>方式</th></tr></thead><tbody>${db.payments.map((p) => {
      const inv = db.invoices.find((i) => i.id === p.invoiceId) || {};
      return `<tr><td>${esc(p.date)}</td><td>${esc(inv.number)}</td><td>${esc(customer(inv.customerId).name)}</td><td>${money(p.amount)}</td><td>${esc(p.method)}</td></tr>`;
    }).join("")}</tbody></table>` : `<p class="empty">还没有收款</p>`}</div>`;
    primary.onclick = () => { if (db.invoices[0]) quickPay(db.invoices[0].id); };
  }

  function renderExpenses() {
    view.innerHTML = `<div class="panel">
      <div class="form-grid">
        <div class="field"><label>日期</label><input id="x-date" type="date" value="${today()}"></div>
        <div class="field"><label>对象</label><input id="x-vendor" placeholder="供应商"></div>
        <div class="field"><label>类别</label><input id="x-cat" placeholder="办公 / 交通"></div>
        <div class="field"><label>金额</label><input id="x-amount" inputmode="decimal"></div>
      </div>
      <div class="actions"><button id="x-save" type="button">记一笔</button></div>
    </div>
    <div class="panel" style="margin-top:14px">${db.expenses.length ? `<table class="sheet-table"><thead><tr><th>日期</th><th>对象</th><th>类别</th><th>金额</th></tr></thead><tbody>${db.expenses.map((e) => `<tr><td>${esc(e.date)}</td><td>${esc(e.vendor)}</td><td>${esc(e.category)}</td><td>${money(e.amount)}</td></tr>`).join("")}</tbody></table>` : `<p class="empty">还没有费用</p>`}</div>`;
    primary.hidden = true;
    document.getElementById("x-save").onclick = () => {
      const amount = Number(document.getElementById("x-amount").value);
      if (!amount) return;
      db.expenses.unshift({ id: uid("x"), date: document.getElementById("x-date").value, vendor: document.getElementById("x-vendor").value.trim(), category: document.getElementById("x-cat").value.trim(), amount, note: "" });
      save(); draw();
    };
  }

  function renderReports() {
    const series = monthSeries();
    view.innerHTML = `<div class="chart-card"><h2>近 8 个月销售与费用</h2>${svgChart(series)}</div>
      <div class="panel" style="margin-top:14px"><table class="sheet-table"><thead><tr><th>月份</th><th>销售</th><th>费用</th><th>净额</th></tr></thead><tbody>${series.map((s) => `<tr><td>${s.label}</td><td>${money(s.sales)}</td><td>${money(s.expenses)}</td><td>${money(s.sales - s.expenses)}</td></tr>`).join("")}</tbody></table></div>`;
    primary.hidden = true;
  }

  function renderSettings() {
    const c = db.company;
    view.innerHTML = `<div class="panel"><div class="form-grid">
      <div class="field"><label>公司名称</label><input id="co-name" value="${esc(c.name)}"></div>
      <div class="field"><label>税号</label><input id="co-tax" value="${esc(c.taxId)}"></div>
      <div class="field"><label>地址</label><input id="co-addr" value="${esc(c.address)}"></div>
      <div class="field"><label>电话</label><input id="co-phone" value="${esc(c.phone)}"></div>
      <div class="field"><label>邮箱</label><input id="co-email" value="${esc(c.email)}"></div>
      <div class="field"><label>收款账户</label><input id="co-pay" value="${esc(c.payInfo)}"></div>
    </div><div class="actions"><button id="co-save" type="button">保存</button></div><p id="co-msg" class="empty"></p></div>`;
    primary.hidden = true;
    document.getElementById("co-save").onclick = () => {
      db.company = { ...c, name: document.getElementById("co-name").value.trim(), taxId: document.getElementById("co-tax").value.trim(), address: document.getElementById("co-addr").value.trim(), phone: document.getElementById("co-phone").value.trim(), email: document.getElementById("co-email").value.trim(), payInfo: document.getElementById("co-pay").value.trim() };
      save();
      document.getElementById("co-msg").textContent = "已保存在这台设备";
    };
  }

  function blankDoc(isEst) {
    return { id: uid(isEst ? "e" : "v"), number: nextNo(isEst ? "EST" : "INV", isEst ? db.estimates : db.invoices), customerId: (db.customers[0] && db.customers[0].id) || "", date: today(), validUntil: addDays(7), dueDate: addDays(15), status: "draft", notes: "", rows: [{ name: "", spec: "", qty: 1, unit: "项", price: "", rate: 13 }] };
  }

  function renderEditor(isEst, id) {
    const list = isEst ? db.estimates : db.invoices;
    const found = id && id !== "new" ? list.find((d) => d.id === id) : null;
    const working = JSON.parse(JSON.stringify(found || blankDoc(isEst)));
    const paint = () => {
      view.innerHTML = `<div class="edit-split">
        <div class="panel">
          <div class="form-grid">
            <div class="field"><label>客户</label><select id="d-customer">${db.customers.map((c) => `<option value="${c.id}"${c.id === working.customerId ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
            <div class="field"><label>单号</label><input id="d-number" value="${esc(working.number)}"></div>
            <div class="field"><label>日期</label><input id="d-date" type="date" value="${esc(working.date)}"></div>
            <div class="field"><label>${isEst ? "有效期" : "到期日"}</label><input id="d-due" type="date" value="${esc(isEst ? working.validUntil : working.dueDate)}"></div>
          </div>
          <table class="sheet-table" style="margin-top:12px"><thead><tr><th>项目</th><th>数量</th><th>单价</th><th>税率</th><th></th></tr></thead>
          <tbody>${working.rows.map((row, i) => `<tr>
            <td><input data-i="${i}" data-k="name" list="item-list" value="${esc(row.name)}"></td>
            <td><input data-i="${i}" data-k="qty" value="${esc(row.qty)}"></td>
            <td><input data-i="${i}" data-k="price" value="${esc(row.price)}"></td>
            <td><input data-i="${i}" data-k="rate" value="${esc(row.rate)}"></td>
            <td><button class="secondary" data-del="${i}">删</button></td>
          </tr>`).join("")}</tbody></table>
          <datalist id="item-list">${db.items.map((it) => `<option value="${esc(it.name)}"></option>`).join("")}</datalist>
          <div class="actions"><button class="secondary" id="d-add" type="button">加一行</button>
            <select id="d-item"><option value="">从项目库插入</option>${db.items.map((it) => `<option value="${it.id}">${esc(it.name)}</option>`).join("")}</select>
          </div>
          <div class="field" style="margin-top:12px"><label>备注</label><textarea id="d-notes" style="min-height:70px">${esc(working.notes)}</textarea></div>
          <div class="actions">
            <button id="d-save" type="button">保存</button>
            <button class="secondary" id="d-print" type="button">打印</button>
            <button class="secondary" id="d-back" type="button">返回</button>
          </div>
        </div>
        <div class="preview-pane">${paper(working, isEst ? "报价单" : "发票")}</div>
      </div>`;
      const sync = () => {
        working.customerId = document.getElementById("d-customer").value;
        working.number = document.getElementById("d-number").value.trim();
        working.date = document.getElementById("d-date").value;
        if (isEst) working.validUntil = document.getElementById("d-due").value; else working.dueDate = document.getElementById("d-due").value;
        working.notes = document.getElementById("d-notes").value;
        view.querySelectorAll("tbody [data-k]").forEach((input) => { working.rows[Number(input.dataset.i)][input.dataset.k] = input.value; });
      };
      view.querySelectorAll("tbody [data-k]").forEach((input) => {
        input.addEventListener("change", () => {
          const i = Number(input.dataset.i);
          working.rows[i][input.dataset.k] = input.value;
          if (input.dataset.k === "name") {
            const hit = db.items.find((it) => it.name === input.value);
            if (hit) { working.rows[i] = { ...working.rows[i], spec: hit.spec, unit: hit.unit, price: hit.price, rate: hit.rate }; paint(); }
          }
        });
      });
      document.getElementById("d-add").onclick = () => { sync(); working.rows.push({ name: "", spec: "", qty: 1, unit: "项", price: "", rate: 13 }); paint(); };
      document.getElementById("d-item").onchange = (e) => {
        const it = db.items.find((x) => x.id === e.target.value);
        if (!it) return;
        sync(); working.rows.push({ name: it.name, spec: it.spec, qty: 1, unit: it.unit, price: it.price, rate: it.rate }); paint();
      };
      view.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { if (working.rows.length === 1) return; working.rows.splice(Number(b.dataset.del), 1); paint(); });
      document.getElementById("d-save").onclick = () => {
        sync();
        const arr = isEst ? db.estimates : db.invoices;
        const idx = arr.findIndex((d) => d.id === working.id);
        if (idx >= 0) arr[idx] = working; else arr.unshift(working);
        save(); go(isEst ? "estimates" : "invoices", working.id);
      };
      document.getElementById("d-print").onclick = () => { sync(); printDoc(working, isEst ? "报价单" : "发票"); };
      document.getElementById("d-back").onclick = () => go(isEst ? "estimates" : "invoices");
    };
    primary.hidden = true;
    paint();
  }

  const titles = { dashboard: "工作台", customers: "客户", items: "项目", estimates: "报价", invoices: "发票", payments: "收款", expenses: "费用", reports: "报表", settings: "设置", estimate: "编辑报价", invoice: "编辑发票" };

  function draw() {
    const r = route();
    primary.hidden = false;
    document.querySelectorAll(".crater-side button").forEach((btn) => {
      const key = btn.dataset.route;
      btn.classList.toggle("active", key === r.name || (r.name === "estimate" && key === "estimates") || (r.name === "invoice" && key === "invoices"));
    });
    titleEl.textContent = titles[r.name] || "工作台";
    if (r.name === "dashboard") { primary.textContent = "新建报价"; primary.onclick = () => go("estimate", "new"); renderDashboard(); }
    else if (r.name === "customers") { primary.textContent = "新建客户"; renderPeople("customers"); }
    else if (r.name === "items") { primary.textContent = "新建项目"; renderPeople("items"); }
    else if (r.name === "estimates") { primary.textContent = "新建报价"; renderDocs("estimates"); }
    else if (r.name === "invoices") { primary.textContent = "新建发票"; renderDocs("invoices"); }
    else if (r.name === "payments") { primary.textContent = "记收款"; renderPayments(); }
    else if (r.name === "expenses") renderExpenses();
    else if (r.name === "reports") renderReports();
    else if (r.name === "settings") renderSettings();
    else if (r.name === "estimate") renderEditor(true, r.id);
    else if (r.name === "invoice") renderEditor(false, r.id);
    else location.hash = "#/dashboard";
  }

  document.querySelectorAll(".crater-side button").forEach((btn) => { btn.onclick = () => go(btn.dataset.route); });
  document.getElementById("sidebar-toggle").onclick = () => document.body.classList.toggle("sidebar-open");
  window.addEventListener("hashchange", draw);
  if (!location.hash) location.hash = "#/dashboard";
  else draw();
})();
