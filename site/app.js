// 매거진 뷰어
const reader=document.querySelector('#reader');
const picture=document.querySelector('#reader-image');
const paper=document.querySelector('.reader-paper');
const select=document.querySelector('#page-select');
const prev=document.querySelector('#prev');
const next=document.querySelector('#next');
const zoom=document.querySelector('#zoom');
let page=1;
for(let n=1;n<=44;n++){const o=document.createElement('option');o.value=n;o.textContent=String(n).padStart(2,'0');select.append(o)}
function showPage(n){page=Math.max(1,Math.min(44,n));picture.src=`assets/page-${String(page).padStart(2,'0')}.jpg`;picture.alt=`클로젯 매거진 ${page}페이지`;select.value=page;prev.disabled=page===1;next.disabled=page===44;paper.classList.remove('zoom');paper.scrollTop=0;paper.scrollLeft=0;zoom.textContent='확대 ＋';zoom.setAttribute('aria-pressed','false');}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{showPage(Number(b.dataset.page));reader.showModal();document.body.classList.add('reading')}));
document.querySelector('#close-reader').addEventListener('click',()=>reader.close());
reader.addEventListener('close',()=>document.body.classList.remove('reading'));
reader.addEventListener('click',e=>{if(e.target===reader){const r=reader.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)reader.close()}});
prev.addEventListener('click',()=>showPage(page-1));next.addEventListener('click',()=>showPage(page+1));select.addEventListener('change',()=>showPage(Number(select.value)));
zoom.addEventListener('click',()=>{const expanded=paper.classList.toggle('zoom');zoom.setAttribute('aria-pressed',String(expanded));zoom.textContent=expanded?'축소 −':'확대 ＋'});
reader.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;if(e.key==='ArrowRight'){e.preventDefault();showPage(page+1)}if(e.key==='ArrowLeft'){e.preventDefault();showPage(page-1)}});

// 탭: 주소의 #값으로 보여 줄 패널을 정한다 (뒤로 가기, 링크 공유가 그대로 동작)
// 패널에 id 대신 data-tab을 쓴다. id가 #값과 같으면 브라우저가 그 위치로 스크롤해 버린다.
const panels=[...document.querySelectorAll('.panel')];
const tabs=[...document.querySelectorAll('nav a')];
function showTab(moveFocus){
  const panel=panels.find(p=>p.dataset.tab===location.hash.slice(1))||panels[0];
  panels.forEach(p=>{p.hidden=p!==panel});
  tabs.forEach(t=>{if(t.getAttribute('href')==='#'+panel.dataset.tab)t.setAttribute('aria-current','page');else t.removeAttribute('aria-current')});
  document.title=panel.dataset.title;
  window.scrollTo(0,0);
  if(moveFocus)panel.focus({preventScroll:true});
  if(panel.dataset.tab==='guestbook')loadNotes();
}
document.querySelector('#to-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// 방명록: config.js의 주소(구글 Apps Script)로 글을 읽고 쓴다
const gbUrl=(window.CLOSET_CONFIG||{}).guestbookUrl||'';
const GB_STEP=12;
const GB_COOLDOWN=30000;
const form=document.querySelector('#gb-form');
const fields=document.querySelector('#gb-fields');
const nameInput=document.querySelector('#gb-name');
const messageInput=document.querySelector('#gb-message');
const trapInput=document.querySelector('#gb-website');
const count=document.querySelector('#gb-count');
const send=document.querySelector('#gb-send');
const statusLine=document.querySelector('#gb-status');
const list=document.querySelector('#gb-list');
const total=document.querySelector('#gb-total');
const empty=document.querySelector('#gb-empty');
const more=document.querySelector('#gb-more');
const retry=document.querySelector('#gb-retry');
let notes=[],shown=0,loaded=false,loading=false,lastPost=0;
function say(text,isError){statusLine.textContent=text;statusLine.classList.toggle('error',Boolean(isError))}
function formatDate(iso){const d=new Date(iso);if(isNaN(d))return'';return`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`}
function renderNotes(){
  list.replaceChildren(...notes.slice(0,shown).map(n=>{
    const li=document.createElement('li');
    const head=document.createElement('div');
    const who=document.createElement('b');who.textContent=n.name;
    const when=document.createElement('time');when.textContent=formatDate(n.at);
    head.append(who,when);
    const text=document.createElement('p');text.textContent=n.message;
    li.append(head,text);
    return li;
  }));
  total.textContent=notes.length?`${notes.length}개의 메모`:'';
  empty.textContent=notes.length?'':'아직 남겨진 글이 없어요. 첫 메모의 주인공이 되어 주세요.';
  more.hidden=shown>=notes.length;
}
async function loadNotes(force){
  if(!gbUrl||loading||(loaded&&!force))return;
  loading=true;retry.hidden=true;
  if(!loaded)empty.textContent='메모를 불러오는 중입니다…';
  try{
    const res=await fetch(gbUrl);
    const data=await res.json();
    if(!data.ok)throw new Error(data.error);
    notes=data.notes;shown=Math.min(Math.max(shown,GB_STEP),notes.length);loaded=true;
    renderNotes();
  }catch(err){
    empty.textContent='메모를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    retry.hidden=false;
  }finally{loading=false}
}
function readLastPost(){try{return Number(localStorage.getItem('closet-gb-last'))||lastPost}catch(err){return lastPost}}
function writeLastPost(time){lastPost=time;try{localStorage.setItem('closet-gb-last',String(time))}catch(err){}}
if(gbUrl){
  messageInput.addEventListener('input',()=>{count.textContent=`${messageInput.value.length} / 300`});
  more.addEventListener('click',()=>{shown=Math.min(shown+GB_STEP,notes.length);renderNotes()});
  retry.addEventListener('click',()=>loadNotes(true));
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const name=nameInput.value.trim();
    const message=messageInput.value.trim();
    if(!name){say('이름 또는 닉네임을 적어 주세요.',true);nameInput.focus();return}
    if(!message){say('남기고 싶은 말을 적어 주세요.',true);messageInput.focus();return}
    const wait=Math.ceil((readLastPost()+GB_COOLDOWN-Date.now())/1000);
    if(wait>0){say(`${wait}초 뒤에 다시 남길 수 있어요.`,true);return}
    send.disabled=true;say('보내는 중입니다…');
    try{
      // text/plain으로 보내야 브라우저의 사전 요청 없이 Apps Script에 전달된다
      const res=await fetch(gbUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({name,message,website:trapInput.value})});
      const data=await res.json();
      if(!data.ok){say(data.error||'등록하지 못했습니다.',true);return}
      writeLastPost(Date.now());
      form.reset();count.textContent='0 / 300';
      if(data.pending)say('고마워요! 확인을 거친 뒤 공개됩니다.');
      else{say('고마워요! 메모가 등록되었습니다.');await loadNotes(true)}
    }catch(err){
      say('보내지 못했습니다. 잠시 후 다시 시도해 주세요.',true);
    }finally{send.disabled=false}
  });
}else{
  fields.disabled=true;
  say('방명록은 곧 열립니다. 조금만 기다려 주세요.');
  empty.textContent='아직 준비 중입니다.';
}

window.addEventListener('hashchange',()=>showTab(true));
showTab(false);
