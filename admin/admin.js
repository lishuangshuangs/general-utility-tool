const loginPanel=document.getElementById('login-panel');
const managerPanel=document.getElementById('manager-panel');
const loginForm=document.getElementById('login-form');
const loginMessage=document.getElementById('login-message');
const managerMessage=document.getElementById('manager-message');
const feedbackList=document.getElementById('feedback-list');
const empty=document.getElementById('empty');
const summary=document.getElementById('summary');
const filterForm=document.getElementById('filter-form');
const sessionKey='utilora_admin_session';

function getSession(){try{return JSON.parse(sessionStorage.getItem(sessionKey))}catch{return null}}
function setMessage(element,text,error=false){element.className=error?'message error':'message';element.textContent=text}
function apiHeaders(){const session=getSession();return{apikey:SUPABASE_CONFIG.publishableKey,Authorization:`Bearer ${session?.access_token||''}`,'Content-Type':'application/json'}}

loginForm.addEventListener('submit',async event=>{
  event.preventDefault();const button=document.getElementById('login-button');button.disabled=true;setMessage(loginMessage,'正在登录……');
  try{const response=await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:SUPABASE_CONFIG.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value})});const data=await response.json();if(!response.ok)throw new Error(data.error_description||data.msg||'登录失败');sessionStorage.setItem(sessionKey,JSON.stringify(data));document.getElementById('password').value='';showManager();await Promise.all([loadFeedback(),loadAnalytics()])}catch(error){setMessage(loginMessage,error.message,true)}finally{button.disabled=false}
});

async function request(path,options={}){const response=await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${path}`,{...options,headers:{...apiHeaders(),...(options.headers||{})}});if(response.status===401||response.status===403){logout();throw new Error('登录已失效或没有管理员权限')}if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.message||`请求失败（${response.status}）`)}return response}
function showManager(){loginPanel.hidden=true;managerPanel.hidden=false;loginMessage.textContent=''}
function showLogin(){managerPanel.hidden=true;loginPanel.hidden=false}
function logout(){sessionStorage.removeItem(sessionKey);feedbackList.replaceChildren();showLogin()}

function buildQuery(){
  const params=new URLSearchParams();params.set('select','id,created_at,name,title,message,contact,status');params.set('order','created_at.desc');
  const status=document.getElementById('status-filter').value;
  const start=document.getElementById('start-date').value;
  const end=document.getElementById('end-date').value;
  if(status)params.append('status',`eq.${status}`);
  if(start)params.append('created_at',`gte.${new Date(`${start}T00:00:00`).toISOString()}`);
  if(end)params.append('created_at',`lte.${new Date(`${end}T23:59:59.999`).toISOString()}`);
  return params.toString();
}

async function loadFeedback(){
  const start=document.getElementById('start-date').value,end=document.getElementById('end-date').value;
  if(start&&end&&start>end){setMessage(managerMessage,'开始日期不能晚于结束日期',true);return}
  setMessage(managerMessage,'正在加载……');
  try{const response=await request(`feedback?${buildQuery()}`);const rows=await response.json();renderRows(rows);setMessage(managerMessage,'');const filtered=document.getElementById('status-filter').value||start||end;summary.textContent=`${filtered?'筛选结果':'全部留言'}：${rows.length} 条`}catch(error){setMessage(managerMessage,error.message,true)}
}

function renderRows(rows){feedbackList.replaceChildren();empty.hidden=rows.length>0;rows.forEach(row=>{const tr=document.createElement('tr');[new Date(row.created_at).toLocaleString(),row.name,row.title,row.message,row.contact||'—'].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});const statusTd=document.createElement('td'),select=document.createElement('select');[['new','新留言'],['processing','处理中'],['completed','已完成'],['closed','已关闭']].forEach(([value,label])=>select.add(new Option(label,value,value===row.status,value===row.status)));select.addEventListener('change',()=>updateStatus(row.id,select.value));statusTd.append(select);tr.append(statusTd);const actionTd=document.createElement('td'),button=document.createElement('button');button.className='delete';button.textContent='删除';button.addEventListener('click',()=>deleteFeedback(row.id,row.title));actionTd.append(button);tr.append(actionTd);feedbackList.append(tr)})}
async function updateStatus(id,status){try{await request(`feedback?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status})});setMessage(managerMessage,'状态已更新');await loadFeedback()}catch(error){setMessage(managerMessage,error.message,true);await loadFeedback()}}
async function deleteFeedback(id,title){if(!confirm(`确定删除“${title}”吗？此操作无法撤销。`))return;try{await request(`feedback?id=eq.${id}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});setMessage(managerMessage,'留言已删除');await loadFeedback()}catch(error){setMessage(managerMessage,error.message,true)}}

filterForm.addEventListener('submit',event=>{event.preventDefault();loadFeedback()});
document.getElementById('reset-filter').addEventListener('click',()=>{filterForm.reset();loadFeedback()});
document.getElementById('refresh').addEventListener('click',()=>Promise.all([loadFeedback(),loadAnalytics()]));
document.getElementById('logout').addEventListener('click',logout);
if(getSession()){showManager();Promise.all([loadFeedback(),loadAnalytics()])}else showLogin();

const toolNames={'json-formatter':'JSON 格式化','timestamp':'时间戳转换','base64':'Base64 编解码','qr-code':'二维码生成器','password-generator':'密码生成器','text-counter':'文本统计','url-codec':'URL 编解码','hash-generator':'Hash / MD5','uuid-generator':'UUID 生成器','regex-tester':'正则测试','color-converter':'颜色转换','case-converter':'大小写转换','text-diff':'文本对比','jwt-decoder':'JWT 解码','cron-explainer':'Cron 表达式解释'};
async function loadAnalytics(){const msg=document.getElementById('analytics-message');setMessage(msg,'正在加载统计……');try{const response=await request('rpc/get_analytics_summary',{method:'POST',body:'{}'});const data=await response.json();renderAnalytics(data);setMessage(msg,'')}catch(error){setMessage(msg,error.message.includes('404')?'请先在 Supabase 中执行 supabase/analytics.sql':error.message,true)}}
function renderAnalytics(data){const tools=data.tools||[],daily=data.daily||[],total=Number(data.total_tool_uses)||0;document.getElementById('total-views').textContent=Number(data.total_views||0).toLocaleString();document.getElementById('today-views').textContent=Number(data.today_views||0).toLocaleString();document.getElementById('total-uses').textContent=total.toLocaleString();document.getElementById('popular-tool').textContent=tools[0]?toolNames[tools[0].slug]||tools[0].slug:'暂无';const maxDay=Math.max(1,...daily.map(x=>Number(x.views)));const dayChart=document.getElementById('daily-chart');dayChart.replaceChildren();daily.forEach(item=>{const bar=document.createElement('div');bar.className='bar';bar.style.height=`${Math.max(2,Number(item.views)/maxDay*100)}%`;bar.title=`${item.date}：${item.views} 次`;const label=document.createElement('span');label.textContent=item.date.slice(5);bar.append(label);dayChart.append(bar)});const maxTool=Math.max(1,...tools.map(x=>Number(x.uses))),toolChart=document.getElementById('tool-chart'),list=document.getElementById('tool-stats-list');toolChart.replaceChildren();list.replaceChildren();tools.forEach(item=>{const name=toolNames[item.slug]||item.slug,row=document.createElement('div');row.className='chart-row';const label=document.createElement('span');label.textContent=name;const track=document.createElement('div');track.className='chart-track';const fill=document.createElement('i');fill.style.width=`${Number(item.uses)/maxTool*100}%`;track.append(fill);const value=document.createElement('b');value.textContent=Number(item.uses).toLocaleString();row.append(label,track,value);toolChart.append(row);const tr=document.createElement('tr');[name,Number(item.uses).toLocaleString(),total?`${(Number(item.uses)/total*100).toFixed(1)}%`:'0%'].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});list.append(tr)})}
document.getElementById('show-chart').addEventListener('click',()=>{document.getElementById('chart-view').hidden=false;document.getElementById('table-view').hidden=true;document.getElementById('show-chart').className='';document.getElementById('show-table').className='secondary'});document.getElementById('show-table').addEventListener('click',()=>{document.getElementById('chart-view').hidden=true;document.getElementById('table-view').hidden=false;document.getElementById('show-chart').className='secondary';document.getElementById('show-table').className=''});