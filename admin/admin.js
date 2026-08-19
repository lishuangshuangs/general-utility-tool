const loginPanel = document.getElementById('login-panel');
const managerPanel = document.getElementById('manager-panel');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const managerMessage = document.getElementById('manager-message');
const feedbackList = document.getElementById('feedback-list');
const empty = document.getElementById('empty');
const summary = document.getElementById('summary');
const filterForm = document.getElementById('filter-form');
const sessionKey = 'utilora_admin_session';
const tip = document.getElementById('chart-tip');

const toolNames = {
  'json-formatter': 'JSON 格式化',
  timestamp: '时间戳转换',
  base64: 'Base64 编解码',
  'qr-code': '二维码生成器',
  'password-generator': '密码生成器',
  'text-counter': '文本统计',
  'url-codec': 'URL 编解码',
  'hash-generator': 'Hash / MD5',
  'uuid-generator': 'UUID 生成器',
  'regex-tester': '正则测试',
  'color-converter': '颜色转换',
  'case-converter': '大小写转换',
  'text-diff': '文本对比',
  'jwt-decoder': 'JWT 解码',
  'cron-explainer': 'Cron 表达式解释',
  'url-parser': 'URL 解析器',
  'number-base': '进制转换',
  'unit-converter': '单位换算',
  'html-entities': 'HTML 实体编解码',
  'random-number': '随机数生成器',
  'douyin-downloader': '抖音视频下载',
  'image-compress': '图片压缩',
  'number-chinese': '数字转中文大写',
  'zh-convert': '简繁拼音',
};

const deviceNames = { mobile: '手机', desktop: '电脑', tablet: '平板', unknown: '未知' };
let analyticsCache = null;

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(sessionKey)); }
  catch { return null; }
}

function setMessage(element, text, error = false) {
  if (!element) return;
  element.className = error ? 'message error' : 'message';
  element.textContent = text;
}

function apiHeaders() {
  const session = getSession();
  return {
    apikey: SUPABASE_CONFIG.publishableKey,
    Authorization: `Bearer ${session?.access_token || ''}`,
    'Content-Type': 'application/json',
  };
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('login-button');
  button.disabled = true;
  setMessage(loginMessage, '正在登录……');
  try {
    const response = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_CONFIG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || data.msg || '登录失败');
    sessionStorage.setItem(sessionKey, JSON.stringify(data));
    document.getElementById('password').value = '';
    showManager();
    await Promise.all([loadFeedback(), loadAnalytics()]);
  } catch (error) {
    setMessage(loginMessage, error.message, true);
  } finally {
    button.disabled = false;
  }
});

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${path}`, {
    ...options,
    headers: { ...apiHeaders(), ...(options.headers || {}) },
  });
  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error('登录已失效或没有管理员权限');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `请求失败（${response.status}）`);
  }
  return response;
}

function showManager() {
  loginPanel.hidden = true;
  managerPanel.hidden = false;
  loginMessage.textContent = '';
}

function showLogin() {
  managerPanel.hidden = true;
  loginPanel.hidden = false;
}

function logout() {
  sessionStorage.removeItem(sessionKey);
  feedbackList.replaceChildren();
  analyticsCache = null;
  showLogin();
}

function switchTab(name) {
  const analytics = name === 'analytics';
  document.getElementById('analytics-section').hidden = !analytics;
  document.getElementById('feedback-section').hidden = analytics;
  document.getElementById('tab-analytics').classList.toggle('active', analytics);
  document.getElementById('tab-feedback').classList.toggle('active', !analytics);
  document.getElementById('tab-analytics').setAttribute('aria-selected', String(analytics));
  document.getElementById('tab-feedback').setAttribute('aria-selected', String(!analytics));
}

function buildQuery() {
  const params = new URLSearchParams();
  params.set('select', 'id,created_at,name,title,message,contact,status');
  params.set('order', 'created_at.desc');
  const status = document.getElementById('status-filter').value;
  const start = document.getElementById('start-date').value;
  const end = document.getElementById('end-date').value;
  if (status) params.append('status', `eq.${status}`);
  if (start) params.append('created_at', `gte.${new Date(`${start}T00:00:00`).toISOString()}`);
  if (end) params.append('created_at', `lte.${new Date(`${end}T23:59:59.999`).toISOString()}`);
  return params.toString();
}

async function loadFeedback() {
  const start = document.getElementById('start-date').value;
  const end = document.getElementById('end-date').value;
  if (start && end && start > end) {
    setMessage(managerMessage, '开始日期不能晚于结束日期', true);
    return;
  }
  setMessage(managerMessage, '正在加载……');
  try {
    const response = await request(`feedback?${buildQuery()}`);
    const rows = await response.json();
    renderRows(rows);
    setMessage(managerMessage, '');
    const filtered = document.getElementById('status-filter').value || start || end;
    summary.textContent = `${filtered ? '筛选结果' : '全部留言'}：${rows.length} 条`;
    const badge = document.getElementById('feedback-count');
    badge.hidden = rows.length === 0;
    badge.textContent = rows.length;
  } catch (error) {
    setMessage(managerMessage, error.message, true);
  }
}

function renderRows(rows) {
  feedbackList.replaceChildren();
  empty.hidden = rows.length > 0;
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    [new Date(row.created_at).toLocaleString(), row.name, row.title, row.message, row.contact || '—'].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    });
    const statusTd = document.createElement('td');
    const select = document.createElement('select');
    [['new', '新留言'], ['processing', '处理中'], ['completed', '已完成'], ['closed', '已关闭']].forEach(([value, label]) => {
      select.add(new Option(label, value, value === row.status, value === row.status));
    });
    select.addEventListener('change', () => updateStatus(row.id, select.value));
    statusTd.append(select);
    tr.append(statusTd);
    const actionTd = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'delete';
    button.textContent = '删除';
    button.addEventListener('click', () => deleteFeedback(row.id, row.title));
    actionTd.append(button);
    tr.append(actionTd);
    feedbackList.append(tr);
  });
}

async function updateStatus(id, status) {
  try {
    await request(`feedback?id=eq.${id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status }),
    });
    setMessage(managerMessage, '状态已更新');
    await loadFeedback();
  } catch (error) {
    setMessage(managerMessage, error.message, true);
    await loadFeedback();
  }
}

async function deleteFeedback(id, title) {
  if (!confirm(`确定删除“${title}”吗？此操作无法撤销。`)) return;
  try {
    await request(`feedback?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    setMessage(managerMessage, '留言已删除');
    await loadFeedback();
  } catch (error) {
    setMessage(managerMessage, error.message, true);
  }
}

function selectedRange() {
  const mode = document.getElementById('analytics-range').value;
  if (mode !== 'custom') {
    const days = Number(mode) || 30;
    return { days, start: null, end: null, label: `最近 ${days} 天` };
  }
  const end = document.getElementById('analytics-end').value || todayISO();
  const start = document.getElementById('analytics-start').value || addDays(end, -29);
  const days = Math.max(1, Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1);
  return { days, start, end, label: `${start} 至 ${end}` };
}

async function fetchSummary(range) {
  const bodies = [];
  if (range.start && range.end) bodies.push({ p_days: range.days, p_start: range.start, p_end: range.end });
  bodies.push({ p_days: range.days });
  let lastError;
  for (const body of bodies) {
    try {
      const response = await request('rpc/get_analytics_summary', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function loadAnalytics() {
  const msg = document.getElementById('analytics-message');
  const range = selectedRange();
  if (range.start && range.end && range.start > range.end) {
    setMessage(msg, '开始日期不能晚于结束日期', true);
    return;
  }
  setMessage(msg, '正在加载统计……');
  try {
    const data = await fetchSummary(range);
    analyticsCache = { data, range };
    renderAnalytics(data, range);
    setMessage(msg, '');
  } catch (error) {
    const hint = /404|does not exist|PGRST202/i.test(error.message)
      ? '请重新执行 supabase/analytics.sql 升级统计函数'
      : error.message;
    setMessage(msg, hint, true);
  }
}

function setDelta(id, current, previous, suffix = ' 较上期') {
  const el = document.getElementById(id);
  if (!el) return;
  if (previous == null || Number.isNaN(Number(previous))) {
    el.textContent = '';
    el.className = 'delta';
    return;
  }
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0 && cur === 0) {
    el.textContent = '与上期持平';
    el.className = 'delta flat';
    return;
  }
  if (prev === 0) {
    el.textContent = `新数据${suffix}`;
    el.className = 'delta up';
    return;
  }
  const pct = ((cur - prev) / prev) * 100;
  const sign = pct > 0 ? '+' : '';
  el.textContent = `${sign}${pct.toFixed(1)}%${suffix}`;
  el.className = `delta ${pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'}`;
}

function setShare(id, part, total, label) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!total) {
    el.textContent = '';
    return;
  }
  el.textContent = `${((Number(part) / total) * 100).toFixed(1)}% ${label}`;
  el.className = 'delta muted';
}

function sparkline(values) {
  if (!values.length) return '';
  const width = 120;
  const height = 28;
  const max = Math.max(1, ...values);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = (step * index).toFixed(1);
    const y = (height - (Number(value) / max) * (height - 4) - 2).toFixed(1);
    return `${x},${y}`;
  }).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function prettyReferrer(name) {
  const value = (name || 'direct').toLowerCase();
  if (!name || value === 'direct') return '直接访问';
  if (value.includes('utilora.github.io') || value.includes('localhost')) return '站内跳转';
  return name;
}

function prettyPath(path) {
  if (!path || path === '/') return '首页';
  const slug = path.replace(/^\/tools\/|\/$/g, '').replace(/\/$/, '');
  return toolNames[slug] || path;
}

function bucketDaily(daily, days) {
  if (days <= 45) {
    return daily.map((item) => ({
      ...item,
      label: String(item.date).slice(5),
      title: item.date,
    }));
  }
  const weekly = days <= 140;
  const groups = new Map();
  daily.forEach((item) => {
    const key = weekly ? weekKey(item.date) : String(item.date).slice(0, 7);
    const current = groups.get(key) || { date: key, views: 0, visitors: 0, uses: 0, title: key };
    current.views += Number(item.views) || 0;
    current.visitors += Number(item.visitors) || 0;
    current.uses += Number(item.uses) || 0;
    groups.set(key, current);
  });
  return [...groups.values()].map((item) => ({
    ...item,
    label: weekly ? item.date.slice(5) : item.date.slice(2),
    title: weekly ? `${item.date} 当周` : item.date,
  }));
}

function weekKey(iso) {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function showTip(event, html) {
  tip.hidden = false;
  tip.innerHTML = html;
  moveTip(event);
}

function moveTip(event) {
  const pad = 14;
  const x = Math.min(event.clientX + pad, window.innerWidth - tip.offsetWidth - 8);
  const y = Math.min(event.clientY + pad, window.innerHeight - tip.offsetHeight - 8);
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${Math.max(8, y)}px`;
}

function hideTip() {
  tip.hidden = true;
}

function renderDailyChart(daily, days) {
  const chart = document.getElementById('daily-chart');
  chart.replaceChildren();
  const buckets = bucketDaily(daily, days);
  if (!buckets.length || buckets.every((item) => !Number(item.views) && !Number(item.uses))) {
    chart.classList.add('empty');
    chart.textContent = '所选时间范围内暂无访问';
    return;
  }
  chart.classList.remove('empty');
  const maxViews = Math.max(1, ...buckets.map((item) => Number(item.views) || 0));
  const maxUses = Math.max(1, ...buckets.map((item) => Number(item.uses) || 0));
  const labelEvery = buckets.length > 20 ? Math.ceil(buckets.length / 10) : 1;
  buckets.forEach((item, index) => {
    const group = document.createElement('div');
    group.className = 'bar-group';
    const viewBar = document.createElement('div');
    viewBar.className = 'bar';
    viewBar.style.height = `${Math.max(3, (Number(item.views) / maxViews) * 100)}%`;
    group.append(viewBar);
    if (item.uses != null) {
      const useBar = document.createElement('div');
      useBar.className = 'bar uses';
      useBar.style.height = `${Math.max(2, (Number(item.uses) / maxUses) * 100)}%`;
      group.append(useBar);
    }
    if (index % labelEvery === 0 || index === buckets.length - 1) {
      const label = document.createElement('span');
      label.textContent = item.label;
      group.append(label);
    }
    const html = `<b>${item.title}</b>访问 ${Number(item.views).toLocaleString()} 次<br>访客 ${Number(item.visitors || 0).toLocaleString()} 人<br>工具使用 ${Number(item.uses || 0).toLocaleString()} 次`;
    group.addEventListener('pointerenter', (event) => showTip(event, html));
    group.addEventListener('pointermove', moveTip);
    group.addEventListener('pointerleave', hideTip);
    chart.append(group);
  });
}

function renderRank(id, items, total) {
  const box = document.getElementById(id);
  box.replaceChildren();
  const max = Math.max(1, ...items.map((item) => Number(item.count) || 0));
  items.slice(0, 10).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'chart-row';
    const label = document.createElement('span');
    label.textContent = item.name || '未知';
    label.title = label.textContent;
    const track = document.createElement('div');
    track.className = 'chart-track';
    const fill = document.createElement('i');
    fill.style.width = `${(Number(item.count) / max) * 100}%`;
    track.append(fill);
    const value = document.createElement('b');
    const count = Number(item.count) || 0;
    value.innerHTML = `${count.toLocaleString()}${total ? `<small>${((count / total) * 100).toFixed(0)}%</small>` : ''}`;
    row.append(label, track, value);
    box.append(row);
  });
}

function renderTable(id, rows) {
  const list = document.getElementById(id);
  list.replaceChildren();
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = '暂无数据';
    tr.append(td);
    list.append(tr);
    return;
  }
  rows.forEach((cols) => {
    const tr = document.createElement('tr');
    cols.forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    });
    list.append(tr);
  });
}

function renderAnalytics(data, range) {
  const tools = data.tools || [];
  const daily = data.daily || [];
  const total = Number(data.total_tool_uses) || 0;
  const views = Number(data.total_views) || 0;
  const visitors = Number(data.unique_visitors) || 0;
  const days = Number(data.days) || range.days || 30;
  const newVisitors = data.new_visitors;
  const returning = data.returning_visitors;

  document.getElementById('total-views').textContent = views.toLocaleString();
  document.getElementById('unique-visitors').textContent = visitors.toLocaleString();
  document.getElementById('today-views').textContent = Number(data.today_views || 0).toLocaleString();
  document.getElementById('average-views').textContent = (views / days).toFixed(1);
  document.getElementById('total-uses').textContent = total.toLocaleString();
  document.getElementById('popular-tool').textContent = tools[0] ? (toolNames[tools[0].slug] || tools[0].slug) : '暂无';
  document.getElementById('new-visitors').textContent = newVisitors == null ? '—' : Number(newVisitors).toLocaleString();
  document.getElementById('returning-visitors').textContent = returning == null ? '—' : Number(returning).toLocaleString();
  document.getElementById('views-spark').innerHTML = sparkline(daily.map((item) => Number(item.views) || 0));

  setDelta('total-views-delta', views, data.prev_total_views);
  setDelta('unique-visitors-delta', visitors, data.prev_unique_visitors);
  setDelta('today-views-delta', data.today_views, data.yesterday_views, ' 较昨日');
  setDelta('total-uses-delta', total, data.prev_total_tool_uses);
  setShare('popular-tool-share', tools[0]?.uses, total, '占比');
  setShare('new-visitors-share', newVisitors, visitors, '新访客');
  setShare('returning-visitors-share', returning, visitors, '回访');

  const rangeLabel = data.start && data.end ? `${data.start} 至 ${data.end}` : range.label;
  document.getElementById('analytics-subtitle').textContent = `${rangeLabel} · 共 ${days} 天 · 环比对比上一同等周期`;
  document.getElementById('daily-chart-title').textContent = `${rangeLabel} 访问趋势`;
  if (data.prev_total_views == null) {
    document.getElementById('analytics-subtitle').textContent = `${rangeLabel} · 共 ${days} 天 · 重新执行 supabase/analytics.sql 可启用环比与新访客`;
  }

  renderDailyChart(daily, days);
  renderRank('tool-chart', tools.map((item) => ({ name: toolNames[item.slug] || item.slug, count: item.uses })), total);
  renderRank('device-chart', (data.devices || []).map((item) => ({ name: deviceNames[item.name] || item.name, count: item.count })), views);
  renderRank('browser-chart', data.browsers || [], views);
  renderRank('referrer-chart', (data.referrers || []).map((item) => ({ name: prettyReferrer(item.name), count: item.count })), views);
  renderRank('page-chart', (data.pages || []).map((item) => ({ name: prettyPath(item.path), count: item.views })), views);

  renderTable('daily-stats-list', [...daily].reverse().map((item) => [
    item.date,
    Number(item.views || 0).toLocaleString(),
    Number(item.visitors || 0).toLocaleString(),
    Number(item.uses || 0).toLocaleString(),
  ]));
  renderTable('tool-stats-list', tools.map((item) => [
    toolNames[item.slug] || item.slug,
    Number(item.uses).toLocaleString(),
    total ? `${((Number(item.uses) / total) * 100).toFixed(1)}%` : '0%',
  ]));
}

function exportCsv() {
  if (!analyticsCache) return;
  const { data } = analyticsCache;
  const lines = ['# 每日明细', '日期,访问量,独立访客,工具使用'];
  (data.daily || []).forEach((item) => {
    lines.push([item.date, item.views || 0, item.visitors || 0, item.uses || 0].join(','));
  });
  lines.push('', '# 工具使用', '工具,使用次数,占比');
  const total = Number(data.total_tool_uses) || 0;
  (data.tools || []).forEach((item) => {
    const name = toolNames[item.slug] || item.slug;
    const share = total ? ((Number(item.uses) / total) * 100).toFixed(1) + '%' : '0%';
    lines.push(`${name},${item.uses},${share}`);
  });
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = todayISO();
  link.href = url;
  link.download = `utilora-analytics-${stamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function setChartMode(chart) {
  document.getElementById('chart-view').hidden = !chart;
  document.getElementById('table-view').hidden = chart;
  document.getElementById('show-chart').className = chart ? '' : 'secondary';
  document.getElementById('show-table').className = chart ? 'secondary' : '';
}

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadFeedback();
});
document.getElementById('reset-filter').addEventListener('click', () => {
  filterForm.reset();
  loadFeedback();
});
document.getElementById('refresh').addEventListener('click', () => Promise.all([loadFeedback(), loadAnalytics()]));
document.getElementById('logout').addEventListener('click', logout);
document.getElementById('tab-analytics').addEventListener('click', () => switchTab('analytics'));
document.getElementById('tab-feedback').addEventListener('click', () => switchTab('feedback'));
document.getElementById('analytics-range').addEventListener('change', () => {
  const custom = document.getElementById('analytics-range').value === 'custom';
  document.getElementById('custom-range').hidden = !custom;
  if (!custom) loadAnalytics();
});
document.getElementById('apply-range').addEventListener('click', loadAnalytics);
document.getElementById('show-chart').addEventListener('click', () => setChartMode(true));
document.getElementById('show-table').addEventListener('click', () => setChartMode(false));
document.getElementById('export-csv').addEventListener('click', exportCsv);

const endInput = document.getElementById('analytics-end');
const startInput = document.getElementById('analytics-start');
endInput.value = todayISO();
startInput.value = addDays(endInput.value, -29);
endInput.max = todayISO();
startInput.max = todayISO();

if (getSession()) {
  showManager();
  Promise.all([loadFeedback(), loadAnalytics()]);
} else {
  showLogin();
}
