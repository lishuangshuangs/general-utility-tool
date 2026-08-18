const form=document.getElementById('form');
const submitButton=document.getElementById('submit');
const formMessage=document.getElementById('form-message');

form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(document.getElementById('website').value)return;

  formMessage.className='message';
  formMessage.textContent='正在提交……';
  submitButton.disabled=true;

  const payload={
    name:document.getElementById('name').value.trim(),
    title:document.getElementById('title').value.trim(),
    message:document.getElementById('detail').value.trim(),
    contact:document.getElementById('contact').value.trim()||null
  };

  try{
    const response=await fetch(`${SUPABASE_CONFIG.url}/rest/v1/feedback`,{
      method:'POST',
      headers:{
        apikey:SUPABASE_CONFIG.publishableKey,
        Authorization:`Bearer ${SUPABASE_CONFIG.publishableKey}`,
        'Content-Type':'application/json',
        Prefer:'return=minimal'
      },
      body:JSON.stringify(payload)
    });

    if(!response.ok){
      const error=await response.json().catch(()=>({}));
      throw new Error(error.message||`HTTP ${response.status}`);
    }

    form.reset();
    formMessage.textContent='提交成功，感谢你的建议！';
  }catch(error){
    formMessage.className='message error';
    formMessage.textContent=`提交失败：${error.message}，请稍后重试。`;
  }finally{
    submitButton.disabled=false;
  }
});
