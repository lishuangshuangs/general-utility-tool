const loginPanel=document.getElementById('login-panel');
const managerPanel=document.getElementById('manager-panel');
const loginForm=document.getElementById('login-form');
const loginMessage=document.getElementById('login-message');
const managerMessage=document.getElementById('manager-message');
const feedbackList=document.getElementById('feedback-list');
const empty=document.getElementById('empty');
const summary=document.getElementById('summary');
const sessionKey='utilora_admin_session';

function getSession(){try{return JSON.parse(sessionStorage.getItem(sessionKey))}catch{return null}}
function setMessage(element,text,error=false){element.className=error?'message error':'message';element.textContent=text}
function apiHeaders(){const session=getSession();return{apikey:SUPABASE_CONFIG.publishableKey,Authorization:`Bearer ${session?.access_token||''}`,'Content-Type':'application/json'}}

loginForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=document.getElementById('login-button');button.disabled=true;setMessage(loginMessage,'正在登录……');
  try{
    const response=await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:SUPABASE_CONFIG.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value})});
    const data=await response.json();if(!response.ok)throw new Error(data.error_description||data.msg||'登录失败');
    sessionStorage.setItem(sessionKey,JSON.stringify(data));document.getElementById('password').value='';showManager();await loadFeedback();
  }catch(error){setMessage(loginMessage,error.message,true)}finally{button.disabled=false}
});

async function request(path,options={}){const response=await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${path}`,{...options,headers:{...apiHeaders(),...(options.headers||{})}});if(response.status===401||response.status===403){logout();throw new Error('登录已失效或没有管理员权限')}if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.message||`请求失败（${response.status}）`)}return response}
function showManager(){loginPanel.hidden=true;managerPanel.hidden=false;loginMessage.textContent=''}
function showLogin(){managerPanel.hidden=true;loginPanel.hidden=false}
function logout(){sessionStorage.removeItem(sessionKey);feedbackList.replaceChildren();showLogin()}

async function loadFeedback(){setMessage(managerMessage,'正在加载……');try{const response=await request('feedback?select=id,created_at,name,title,message,contact,status&order=created_at.desc');const rows=await response.json();renderRows(rows);setMessage(managerMessage,'');summary.textContent=`共 ${rows.length} 条留言`}catch(error){setMessage(managerMessage,error.message,true)}}
function renderRows(rows){feedbackList.replaceChildren();empty.hidden=rows.length>0;rows.forEach(row=>{const tr=document.createElement('tr');[['created_at',new Date(row.created_at).toLocaleString()],['name',row.name],['title',row.title],['message',row.message],['contact',row.contact||'—']].forEach(([,value])=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});const statusTd=document.createElement('td'),select=document.createElement('select');[['new','新留言'],['processing','处理中'],['completed','已完成'],['closed','已关闭']].forEach(([value,label])=>{const option=new Option(label,value,value===row.status,value===row.status);select.add(option)});select.addEventListener('change',()=>updateStatus(row.id,select.value));statusTd.append(select);tr.append(statusTd);const actionTd=document.createElement('td'),button=document.createElement('button');button.className='delete';button.textContent='删除';button.addEventListener('click',()=>deleteFeedback(row.id,row.title));actionTd.append(button);tr.append(actionTd);feedbackList.append(tr)})}
async function updateStatus(id,status){try{await request(`feedback?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status})});setMessage(managerMessage,'状态已更新')}catch(error){setMessage(managerMessage,error.message,true);await loadFeedback()}}
async function deleteFeedback(id,title){if(!confirm(`确定删除“${title}”吗？此操作无法撤销。`))return;try{await request(`feedback?id=eq.${id}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});setMessage(managerMessage,'留言已删除');await loadFeedback()}catch(error){setMessage(managerMessage,error.message,true)}}
document.getElementById('refresh').addEventListener('click',loadFeedback);document.getElementById('logout').addEventListener('click',logout);
if(getSession()){showManager();loadFeedback()}else showLogin();
