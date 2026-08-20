(() => {
  const F = window.UtiloraFinance;
  const KEY = "utilora_crater_v1";
  const view = document.getElementById("view");
  const sheet = document.getElementById("sheet");
  const titleEl = document.getElementById("page-title");
  const hintEl = document.getElementById("page-hint");
  const primary = document.getElementById("primary-action");

  const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const esc = (v) => String(v || "").replace(/[&<>"]/g, (ch) => ({
    "&": "\u0026amp;",
    "<": "\u0026lt;",
    ">": "\u0026gt;",
    '"': "\u0026quot;",
  }[ch]));
  const money = (n) => F.formatRmb(F.roundFen(Number(n) || 0));

  const empty = () => ({
    company: { name: "示例商行", taxId: "91310000MA0000000X", address: "上海市", phone: "021-00000000", email: "", payInfo: "", theme: "navy" },
    customers: [],
    items: [],
    estimates: [],
    invoices: [],
    payments: [],
    expenses: [],
  });

  const load = () => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (data && data.company) return { ...empty(), ...data };
    } catch { /* ignore */ }
    const db = empty();
    db.customers = [
      { id: "c1", name: "星海贸易", taxId: "91310115MA1KXXXXXX", email: "a@example.com", phone: "021-58880000", address: "浦东新区" },
      { id: "c2", name: "北岸工作室", taxId: "", email: "b@example.com", phone: "13800000000", address: "静安区" },
    ];
    db.items = [
      { id: "i1", name: "咨询服务", spec: "按项目", unit: "项", price: 8000, rate: 6 },
      { id: "i2", name: "配件 A-12", spec: "标准件", unit: "个", price: 113, rate: 13 },
      { id: "i3", name: "上门安装", spec: "市区", unit: "次", price: 300, rate: 6 },
    ];
    db.estimates = [{
      id: "e1", number: `EST-${today().replace(/-/g, "")}-001`, customerId: "c1", date: today(), validUntil: addDays(7),
      status: "sent", notes: "含税报价，有效期 7 天。", rows: [
        { itemId: "i1", name: "咨询服务", spec: "按项目", qty: 1, unit: "项", price: 8000, rate: 6 },
      ],
    }];
    db.invoices = [{
      id: "v1", number: `INV-${today().replace(/-/g, "")}-001`, customerId: "c2", estimateId: "", date: today(), dueDate: addDays(15),
      status: "sent", notes: "月结 15 天。", rows: [
        { itemId: "i3", name: "上门安装", spec: "市区", qty: 2, unit: "次", price: 300, rate: 6 },
      ],
    }];
    db.expenses = [{ id: "x1", date: today(), vendor: "办公用品", category: "办公", amount: 268, note: "打印纸" }];
    return db;
  };

  let db = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));

  const customer = (id) => db.customers.find((c) => c.id === id);
  const nextNo = (prefix, list) => {
    const day = today().replace(/-/g, "");
    const n = list.filter((d) => (d.number || "").includes(day)).length + 1;
    return `${prefix}-${day}-${String(n).padStart(3, "0")}`;
  };

  function compute(doc) {
    const items = (doc.rows || []).map((line) => {
      const qty = Number(line.qty) || 0;
      const price = Number(line.price) || 0;
      const rate = (Number(line.rate) || 0) / 100;
      const split = F.vatFromExclusive(F.roundFen(qty * price), rate);
      return { ...line, ...split };
    });
    const exclusive = F.roundFen(items.reduce((s, i) => s + i.exclusive, 0));
    const tax = F.roundFen(items.reduce((s, i) => s + i.tax, 0));
    const inclusive = F.roundFen(exclusive + tax);
    return { items, exclusive, tax, inclusive };
  }

  function paidOf(invoiceId) {
    return F.roundFen(db.payments.filter((p) => p.invoiceId === invoiceId).reduce((s, p) => s + Number(p.amount || 0), 0));
  }

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
  const pill = (status, map) => `<span class="status-pill ${status}">${map[status] || status}</span>`;

  const route = () => {
    const hash = (location.hash.replace(/^#\/?/, "") || "dashboard").split("/");
    return { name: hash[0] || "dashboard", id: hash[1] || "", extra: hash[2] || "" };
  };
  const go = (name, id) => { location.hash = id ? `#/${name}/${id}` : `#/${name}`; };

  const titles = {
    dashboard: ["工作台", "应收、开票和支出一眼看清"],
    customers: ["客户", "Crater 里先建客户，再开报价"],
    items: ["项目", "常用商品和服务，开单时直接插入"],
    estimates: ["报价单", "发给客户确认，接受后转成发票"],
    invoices: ["发票", "这里的发票是业务单据，不是税控增值税发票"],
    payments: ["收款", "记到对应发票上，自动算未收"],
    expenses: ["费用", "本月花出去的钱"],
    settings: ["公司资料", "抬头、税号、收款账户会印在单据上"],
    estimate: ["编辑报价", "保存后可打印，也可转成发票"],
    invoice: ["编辑发票", "记录收款，打印给客户"],
  };

  function table(headers, rows, emptyText) {
    if (!rows.length) return `<p class="empty">${emptyText}</p>`;
    return `<div class="table-wrap"><table class="sheet-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }

  function renderDashboard() {
    const due = db.invoices.reduce((s, inv) => s + Math.max(0, compute(inv).inclusive - paidOf(inv.id)), 0);
    const monthInv = db.invoices.filter((i) => (i.date || "").startsWith(today().slice(0, 7))).reduce((s, i) => s + compute(i).inclusive, 0);
    const monthExp = db.expenses.filter((e) => (e.date || "").startsWith(today().slice(0, 7))).reduce((s, e) => s + Number(e.amount || 0), 0);
    const overdue = db.invoices.filter((i) => invoiceStatus(i) === "overdue").length;
    view.innerHTML = `
      <div class="overview-grid">
        <div class="overview-card"><span>应收未收</span><strong>${money(due)}</strong></div>
        <div class="overview-card"><span>本月开票</span><strong>${money(monthInv)}</strong></div>
        <div class="overview-card"><span>本月费用</span><strong>${money(monthExp)}</strong></div>
        <div class="overview-card"><span>逾期发票</span><strong>${overdue}</strong></div>
      </div>
      <div class="panel-block">
        <h2>最近发票</h2>
        ${table(["单号", "客户", "金额", "状态"], db.invoices.slice(0, 6).map((inv) => {
          const c = customer(inv.customerId);
          return `<tr><td>${esc(inv.number)}</td><td>${esc(c && c.name)}</td><td>${money(compute(inv).inclusive)}</td><td>${pill(invoiceStatus(inv), INV_LABEL)}</td></tr>`;
        }), "还没有发票")}
      </div>
      <div class="panel-block">
        <h2>最近报价</h2>
        ${table(["单号", "客户", "金额", "状态"], db.estimates.slice(0, 6).map((est) => {
          const c = customer(est.customerId);
          return `<tr><td>${esc(est.number)}</td><td>${esc(c && c.name)}</td><td>${money(compute(est).inclusive)}</td><td>${pill(est.status, EST_LABEL)}</td></tr>`;
        }), "还没有报价")}
      </div>`;
  }

  function renderPeople(kind) {
    const isCust = kind === "customers";
    const list = db[kind];
    view.innerHTML = `
      <div class="panel-block">
        ${table(isCust ? ["名称", "税号", "电话", "邮箱", ""] : ["名称", "规格", "单价", "税率", ""], list.map((row) => isCust
          ? `<tr><td><b>${esc(row.name)}</b><div class="hint">${esc(row.address)}</div></td><td>${esc(row.taxId)}</td><td>${esc(row.phone)}</td><td>${esc(row.email)}</td><td class="row-actions"><button class="secondary" data-edit="${row.id}">编辑</button><button class="secondary" data-del="${row.id}">删除</button></td></tr>`
          : `<tr><td>${esc(row.name)}</td><td>${esc(row.spec)}</td><td>${money(row.price)}</td><td>${row.rate}%</td><td class="row-actions"><button class="secondary" data-edit="${row.id}">编辑</button><button class="secondary" data-del="${row.id}">删除</button></td></tr>`
        ), isCust ? "还没有客户" : "还没有项目")}
      </div>
      <div class="panel-block" id="edit-box" hidden>
        <h2 id="edit-title">新建</h2>
        <div class="form-grid" id="edit-form"></div>
        <div class="actions"><button type="button" id="save-row">保存</button><button type="button" class="secondary" id="cancel-row">取消</button></div>
      </div>`;
    const box = document.getElementById("edit-box");
    const form = document.getElementById("edit-form");
    let current = null;
    const fields = isCust
      ? [["name", "名称"], ["taxId", "税号"], ["phone", "电话"], ["email", "邮箱"], ["address", "地址"]]
      : [["name", "名称"], ["spec", "规格"], ["unit", "单位"], ["price", "单价"], ["rate", "税率%"]];
    const open = (row) => {
      current = row;
      document.getElementById("edit-title").textContent = row.id ? "编辑" : "新建";
      form.innerHTML = fields.map(([k, label]) => `<div class="field"><label>${label}</label><input data-k="${k}" value="${esc(row[k] || "")}"></div>`).join("");
      box.hidden = false;
    };
    primary.onclick = () => open(isCust ? { id: "", name: "", taxId: "", phone: "", email: "", address: "" } : { id: "", name: "", spec: "", unit: "项", price: "", rate: "13" });
    view.querySelectorAll("[data-edit]").forEach((btn) => btn.onclick = () => open(list.find((r) => r.id === btn.dataset.edit)));
    view.querySelectorAll("[data-del]").forEach((btn) => btn.onclick = () => {
      db[kind] = db[kind].filter((r) => r.id !== btn.dataset.del);
      save();
      draw();
    });
    document.getElementById("cancel-row").onclick = () => { box.hidden = true; };
    document.getElementById("save-row").onclick = () => {
      const payload = { ...(current || {}) };
      form.querySelectorAll("[data-k]").forEach((input) => { payload[input.dataset.k] = input.value.trim(); });
      if (!payload.name) return;
      if (payload.price != null) payload.price = Number(payload.price) || 0;
      if (payload.rate != null) payload.rate = Number(payload.rate) || 0;
      if (!payload.id) payload.id = uid(isCust ? "c" : "i");
      const idx = db[kind].findIndex((r) => r.id === payload.id);
      if (idx >= 0) db[kind][idx] = payload;
      else db[kind].unshift(payload);
      save();
      draw();
    };
  }

  function renderDocs(kind) {
    const isEst = kind === "estimates";
    const list = db[kind];
    const map = isEst ? EST_LABEL : INV_LABEL;
    view.innerHTML = `<div class="panel-block">${table(
      ["单号", "客户", "日期", "金额", "状态", ""],
      list.map((doc) => {
        const c = customer(doc.customerId);
        const status = isEst ? doc.status : invoiceStatus(doc);
        return `<tr>
          <td>${esc(doc.number)}</td>
          <td>${esc(c && c.name)}</td>
          <td>${esc(doc.date)}</td>
          <td>${money(compute(doc).inclusive)}</td>
          <td>${pill(status, map)}</td>
          <td class="row-actions">
            <button class="secondary" data-open="${doc.id}">打开</button>
            ${isEst ? `<button class="secondary" data-convert="${doc.id}">转发票</button>` : `<button class="secondary" data-pay="${doc.id}">记收款</button>`}
            <button class="secondary" data-print="${doc.id}">打印</button>
            <button class="secondary" data-del="${doc.id}">删除</button>
          </td>
        </tr>`;
      }),
      isEst ? "还没有报价单" : "还没有发票",
    )}</div>`;
    primary.onclick = () => go(isEst ? "estimate" : "invoice", "new");
    view.querySelectorAll("[data-open]").forEach((b) => b.onclick = () => go(isEst ? "estimate" : "invoice", b.dataset.open));
    view.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      db[kind] = db[kind].filter((d) => d.id !== b.dataset.del);
      save();
      draw();
    });
    view.querySelectorAll("[data-print]").forEach((b) => b.onclick = () => printDoc(list.find((d) => d.id === b.dataset.print), isEst ? "报价单" : "形式发票"));
    view.querySelectorAll("[data-convert]").forEach((b) => b.onclick = () => convertEstimate(b.dataset.convert));
    view.querySelectorAll("[data-pay]").forEach((b) => b.onclick = () => quickPay(b.dataset.pay));
  }

  function convertEstimate(id) {
    const est = db.estimates.find((e) => e.id === id);
    if (!est) return;
    est.status = "accepted";
    const inv = {
      id: uid("v"),
      number: nextNo("INV", db.invoices),
      customerId: est.customerId,
      estimateId: est.id,
      date: today(),
      dueDate: addDays(15),
      status: "sent",
      notes: est.notes,
      rows: est.rows.map((r) => ({ ...r })),
    };
    db.invoices.unshift(inv);
    save();
    go("invoice", inv.id);
  }

  function quickPay(invoiceId) {
    const inv = db.invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    const left = Math.max(0, compute(inv).inclusive - paidOf(inv.id));
    const amount = Number(prompt("收到多少？", String(left)) || 0);
    if (!amount) return;
    db.payments.unshift({ id: uid("p"), invoiceId, date: today(), amount, method: "转账", note: "" });
    save();
    draw();
  }

  function renderPayments() {
    view.innerHTML = `<div class="panel-block">${table(
      ["日期", "发票", "客户", "金额", "方式", ""],
      db.payments.map((p) => {
        const inv = db.invoices.find((i) => i.id === p.invoiceId);
        const c = inv && customer(inv.customerId);
        return `<tr><td>${esc(p.date)}</td><td>${esc(inv && inv.number)}</td><td>${esc(c && c.name)}</td><td>${money(p.amount)}</td><td>${esc(p.method)}</td><td class="row-actions"><button class="secondary" data-del="${p.id}">删除</button></td></tr>`;
      }),
      "还没有收款记录",
    )}</div>`;
    primary.onclick = () => {
      if (!db.invoices.length) return;
      quickPay(db.invoices[0].id);
    };
    view.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      db.payments = db.payments.filter((p) => p.id !== b.dataset.del);
      save();
      draw();
    });
  }

  function renderExpenses() {
    view.innerHTML = `
      <div class="panel-block">
        <div class="form-grid">
          <div class="field"><label>日期</label><input id="x-date" type="date" value="${today()}"></div>
          <div class="field"><label>对象</label><input id="x-vendor" placeholder="供应商 / 报销对象"></div>
          <div class="field"><label>类别</label><input id="x-cat" placeholder="办公 / 交通 / 房租"></div>
          <div class="field"><label>金额</label><input id="x-amount" inputmode="decimal"></div>
        </div>
        <div class="actions"><button type="button" id="x-save">记一笔</button></div>
      </div>
      <div class="panel-block">${table(
        ["日期", "对象", "类别", "金额", ""],
        db.expenses.map((e) => `<tr><td>${esc(e.date)}</td><td>${esc(e.vendor)}</td><td>${esc(e.category)}</td><td>${money(e.amount)}</td><td class="row-actions"><button class="secondary" data-del="${e.id}">删除</button></td></tr>`),
        "还没有费用",
      )}</div>`;
    primary.hidden = true;
    document.getElementById("x-save").onclick = () => {
      const amount = Number(document.getElementById("x-amount").value);
      if (!amount) return;
      db.expenses.unshift({
        id: uid("x"),
        date: document.getElementById("x-date").value || today(),
        vendor: document.getElementById("x-vendor").value.trim(),
        category: document.getElementById("x-cat").value.trim(),
        amount,
        note: "",
      });
      save();
      draw();
    };
    view.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      db.expenses = db.expenses.filter((e) => e.id !== b.dataset.del);
      save();
      draw();
    });
  }

  function renderSettings() {
    const c = db.company;
    view.innerHTML = `
      <div class="panel-block">
        <div class="form-grid">
          <div class="field"><label>公司名称</label><input id="co-name" value="${esc(c.name)}"></div>
          <div class="field"><label>税号</label><input id="co-tax" value="${esc(c.taxId)}"></div>
          <div class="field"><label>地址</label><input id="co-addr" value="${esc(c.address)}"></div>
          <div class="field"><label>电话</label><input id="co-phone" value="${esc(c.phone)}"></div>
          <div class="field"><label>邮箱</label><input id="co-email" value="${esc(c.email)}"></div>
          <div class="field"><label>收款账户</label><input id="co-pay" value="${esc(c.payInfo)}"></div>
          <div class="field"><label>单据模板</label>
            <select id="co-theme">
              <option value="classic"${c.theme === "classic" ? " selected" : ""}>经典</option>
              <option value="navy"${c.theme === "navy" ? " selected" : ""}>商务</option>
              <option value="plain"${c.theme === "plain" ? " selected" : ""}>极简</option>
              <option value="stamp"${c.theme === "stamp" ? " selected" : ""}>合同红</option>
            </select>
          </div>
        </div>
        <div class="actions"><button type="button" id="co-save">保存公司资料</button></div>
        <p class="hint" id="co-msg"></p>
      </div>`;
    primary.hidden = true;
    document.getElementById("co-save").onclick = () => {
      db.company = {
        name: document.getElementById("co-name").value.trim(),
        taxId: document.getElementById("co-tax").value.trim(),
        address: document.getElementById("co-addr").value.trim(),
        phone: document.getElementById("co-phone").value.trim(),
        email: document.getElementById("co-email").value.trim(),
        payInfo: document.getElementById("co-pay").value.trim(),
        theme: document.getElementById("co-theme").value,
      };
      save();
      document.getElementById("co-msg").textContent = "已保存在这台设备";
    };
  }

  function blankDoc(isEst) {
    return {
      id: uid(isEst ? "e" : "v"),
      number: nextNo(isEst ? "EST" : "INV", isEst ? db.estimates : db.invoices),
      customerId: (db.customers[0] && db.customers[0].id) || "",
      date: today(),
      validUntil: addDays(7),
      dueDate: addDays(15),
      status: "draft",
      notes: "",
      rows: [{ itemId: "", name: "", spec: "", qty: 1, unit: "项", price: "", rate: 13 }],
    };
  }

  function renderEditor(isEst, id) {
    const list = isEst ? db.estimates : db.invoices;
    let doc = id && id !== "new" ? list.find((d) => d.id === id) : null;
    if (!doc) doc = blankDoc(isEst);
    const working = JSON.parse(JSON.stringify(doc));
    const paint = () => {
      const sum = compute(working);
      view.innerHTML = `
        <div class="panel-block">
          <div class="form-grid">
            <div class="field"><label>客户</label>
              <select id="d-customer">${db.customers.map((c) => `<option value="${c.id}"${c.id === working.customerId ? " selected" : ""}>${esc(c.name)}</option>`).join("")}${db.customers.length ? "" : "<option value=\"\">请先建客户</option>"}</select>
            </div>
            <div class="field"><label>单号</label><input id="d-number" value="${esc(working.number)}"></div>
            <div class="field"><label>日期</label><input id="d-date" type="date" value="${esc(working.date)}"></div>
            <div class="field"><label>${isEst ? "有效期" : "到期日"}</label><input id="d-due" type="date" value="${esc(isEst ? working.validUntil : working.dueDate)}"></div>
            <div class="field"><label>状态</label>
              <select id="d-status">${Object.entries(isEst ? EST_LABEL : { draft: "草稿", sent: "已发送" }).map(([k, v]) => `<option value="${k}"${working.status === k ? " selected" : ""}>${v}</option>`).join("")}</select>
            </div>
          </div>
          <div class="table-wrap" style="margin-top:12px">
            <table class="sheet-table edit-table">
              <thead><tr><th>项目</th><th>规格</th><th>数量</th><th>单价</th><th>税率</th><th></th></tr></thead>
              <tbody>${working.rows.map((row, i) => `<tr>
                <td><input data-i="${i}" data-k="name" list="item-list" value="${esc(row.name)}"></td>
                <td><input data-i="${i}" data-k="spec" value="${esc(row.spec)}"></td>
                <td><input data-i="${i}" data-k="qty" value="${esc(row.qty)}"></td>
                <td><input data-i="${i}" data-k="price" value="${esc(row.price)}"></td>
                <td><input data-i="${i}" data-k="rate" value="${esc(row.rate)}"></td>
                <td><button class="secondary" data-del-row="${i}">删</button></td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
          <datalist id="item-list">${db.items.map((it) => `<option value="${esc(it.name)}"></option>`).join("")}</datalist>
          <div class="actions">
            <button class="secondary" type="button" id="d-add">加一行</button>
            <select id="d-item" style="width:auto"><option value="">从项目库插入</option>${db.items.map((it) => `<option value="${it.id}">${esc(it.name)}</option>`).join("")}</select>
          </div>
          <p>不含税 ${money(sum.exclusive)}　税额 ${money(sum.tax)}　价税合计 <b>${money(sum.inclusive)}</b>${!isEst ? `　已收 ${money(paidOf(working.id))}　未收 ${money(Math.max(0, sum.inclusive - paidOf(working.id)))}` : ""}</p>
          <div class="field wide"><label>备注</label><textarea id="d-notes" style="min-height:80px">${esc(working.notes)}</textarea></div>
          <div class="actions">
            <button type="button" id="d-save">保存</button>
            <button class="secondary" type="button" id="d-print">打印 / 存 PDF</button>
            ${isEst ? `<button class="secondary" type="button" id="d-convert">转为发票</button>` : `<button class="secondary" type="button" id="d-pay">记收款</button>`}
            <button class="secondary" type="button" id="d-back">返回列表</button>
          </div>
        </div>`;
      const sync = () => {
        working.customerId = document.getElementById("d-customer").value;
        working.number = document.getElementById("d-number").value.trim();
        working.date = document.getElementById("d-date").value;
        if (isEst) working.validUntil = document.getElementById("d-due").value;
        else working.dueDate = document.getElementById("d-due").value;
        working.status = document.getElementById("d-status").value;
        working.notes = document.getElementById("d-notes").value;
        view.querySelectorAll("tbody [data-k]").forEach((input) => {
          const i = Number(input.dataset.i);
          working.rows[i][input.dataset.k] = input.value;
          if (input.dataset.k === "name") {
            const hit = db.items.find((it) => it.name === input.value);
            if (hit) {
              working.rows[i].itemId = hit.id;
              working.rows[i].spec = working.rows[i].spec || hit.spec;
              working.rows[i].unit = hit.unit;
              if (!working.rows[i].price) working.rows[i].price = hit.price;
              working.rows[i].rate = hit.rate;
            }
          }
        });
      };
      view.querySelectorAll("tbody [data-k]").forEach((input) => {
        input.addEventListener("input", () => {
          const i = Number(input.dataset.i);
          working.rows[i][input.dataset.k] = input.value;
        });
        input.addEventListener("change", () => {
          const i = Number(input.dataset.i);
          working.rows[i][input.dataset.k] = input.value;
          if (input.dataset.k === "name") {
            const hit = db.items.find((it) => it.name === input.value);
            if (hit) {
              working.rows[i].itemId = hit.id;
              working.rows[i].spec = hit.spec;
              working.rows[i].unit = hit.unit;
              working.rows[i].price = hit.price;
              working.rows[i].rate = hit.rate;
              paint();
            }
          }
        });
      });
      ["d-customer", "d-number", "d-date", "d-due", "d-status", "d-notes"].forEach((id) => {
        const node = document.getElementById(id);
        if (node) node.addEventListener("change", sync);
      });
      document.getElementById("d-add").onclick = () => { sync(); working.rows.push({ name: "", spec: "", qty: 1, unit: "项", price: "", rate: 13 }); paint(); };
      document.getElementById("d-item").onchange = (e) => {
        const it = db.items.find((x) => x.id === e.target.value);
        if (!it) return;
        sync();
        working.rows.push({ itemId: it.id, name: it.name, spec: it.spec, qty: 1, unit: it.unit, price: it.price, rate: it.rate });
        paint();
      };
      view.querySelectorAll("[data-del-row]").forEach((b) => b.onclick = () => {
        if (working.rows.length === 1) return;
        working.rows.splice(Number(b.dataset.delRow), 1);
        paint();
      });
      document.getElementById("d-save").onclick = () => {
        sync();
        const arr = isEst ? db.estimates : db.invoices;
        const idx = arr.findIndex((d) => d.id === working.id);
        if (idx >= 0) arr[idx] = working;
        else arr.unshift(working);
        save();
        go(isEst ? "estimates" : "invoices");
      };
      document.getElementById("d-print").onclick = () => { sync(); printDoc(working, isEst ? "报价单" : "形式发票"); };
      document.getElementById("d-back").onclick = () => go(isEst ? "estimates" : "invoices");
      const conv = document.getElementById("d-convert");
      if (conv) conv.onclick = () => {
        sync();
        const idx = db.estimates.findIndex((d) => d.id === working.id);
        if (idx >= 0) db.estimates[idx] = working;
        else db.estimates.unshift(working);
        convertEstimate(working.id);
      };
      const pay = document.getElementById("d-pay");
      if (pay) pay.onclick = () => { sync(); quickPay(working.id); };
    };
    primary.hidden = true;
    paint();
  }

  function printDoc(doc, kind) {
    if (!doc) return;
    const c = customer(doc.customerId) || {};
    const co = db.company;
    const sum = compute(doc);
    const theme = co.theme || "navy";
    sheet.innerHTML = `
      <div class="quote-card theme-${esc(theme)}">
        <div class="quote-head">
          <div><p class="muted">${esc(co.name)}</p><h2>${esc(kind)}</h2></div>
          <div class="quote-meta">
            <p>单号 ${esc(doc.number)}</p>
            <p>日期 ${esc(doc.date)}</p>
            ${doc.validUntil ? `<p>有效期至 ${esc(doc.validUntil)}</p>` : ""}
            ${doc.dueDate ? `<p>到期 ${esc(doc.dueDate)}</p>` : ""}
          </div>
        </div>
        <div class="quote-parties">
          <div><p class="muted">卖方</p><p><strong>${esc(co.name)}</strong></p><p class="muted">税号 ${esc(co.taxId)}</p><p class="muted">${esc(co.address)} ${esc(co.phone)}</p></div>
          <div><p class="muted">买方</p><p><strong>${esc(c.name || "—")}</strong></p>${c.taxId ? `<p class="muted">税号 ${esc(c.taxId)}</p>` : ""}<p class="muted">${esc(c.address || "")} ${esc(c.phone || "")}</p></div>
        </div>
        <table class="sheet-table">
          <thead><tr><th>项目</th><th>规格</th><th>数量</th><th>单价</th><th>税率</th><th>不含税</th><th>税额</th></tr></thead>
          <tbody>${sum.items.map((item) => `<tr><td>${esc(item.name)}</td><td>${esc(item.spec)}</td><td>${esc(item.qty)}${esc(item.unit || "")}</td><td>${money(item.price)}</td><td>${item.rate}%</td><td>${money(item.exclusive)}</td><td>${money(item.tax)}</td></tr>`).join("")}</tbody>
        </table>
        <div class="quote-sum">
          <p>不含税合计　${money(sum.exclusive)}</p>
          <p>税额合计　${money(sum.tax)}</p>
          <p class="money-line">应付 ${money(sum.inclusive)}</p>
          <p class="money-line">${esc(F.toMoney(sum.inclusive))}</p>
          ${co.payInfo ? `<p class="muted">收款 ${esc(co.payInfo)}</p>` : ""}
        </div>
        ${doc.notes ? `<p class="quote-note">${esc(doc.notes)}</p>` : ""}
        <div class="quote-signs"><p>卖方签章：______________</p><p>买方确认：______________</p></div>
      </div>`;
    window.print();
  }

  function draw() {
    const r = route();
    primary.hidden = false;
    document.querySelectorAll(".side-link").forEach((btn) => {
      const key = btn.dataset.route;
      btn.classList.toggle("active", key === r.name || (r.name === "estimate" && key === "estimates") || (r.name === "invoice" && key === "invoices"));
    });
    const meta = titles[r.name] || titles.dashboard;
    titleEl.textContent = meta[0];
    hintEl.textContent = meta[1];
    if (r.name === "dashboard") { primary.textContent = "新建报价"; primary.onclick = () => go("estimate", "new"); renderDashboard(); }
    else if (r.name === "customers") { primary.textContent = "新建客户"; renderPeople("customers"); }
    else if (r.name === "items") { primary.textContent = "新建项目"; renderPeople("items"); }
    else if (r.name === "estimates") { primary.textContent = "新建报价"; renderDocs("estimates"); }
    else if (r.name === "invoices") { primary.textContent = "新建发票"; renderDocs("invoices"); }
    else if (r.name === "payments") { primary.textContent = "记一笔收款"; renderPayments(); }
    else if (r.name === "expenses") renderExpenses();
    else if (r.name === "settings") renderSettings();
    else if (r.name === "estimate") renderEditor(true, r.id);
    else if (r.name === "invoice") renderEditor(false, r.id);
    else { location.hash = "#/dashboard"; }
  }

  document.querySelectorAll(".side-link").forEach((btn) => btn.onclick = () => go(btn.dataset.route));
  document.getElementById("sidebar-toggle").onclick = () => document.body.classList.toggle("sidebar-open");
  window.addEventListener("hashchange", draw);
  if (!location.hash) location.hash = "#/dashboard";
  else draw();
})();
