// 사진 목록 (data.js)
const DATA=window.CLOSET_DATA||{mini:[],tees:0,show2025:{cover:'',photos:[]}};
const pad=n=>String(n).padStart(2,'0');
const range=(count,make)=>Array.from({length:count},(_,i)=>make(i+1));
const SHOW_DIR='assets/show2025/';
const MAGAZINE={title:'CLOSET',sub:'2026 VOL.01',label:'클로젯 매거진',pages:range(44,n=>`assets/page-${pad(n)}.jpg`)};
const MINI=DATA.mini.map(m=>({title:m.title,sub:'MINI MAGAZINE',label:m.title,cover:`assets/mini/${m.id}-01.jpg`,tag:m.tag,pages:range(m.pages,n=>`assets/mini/${m.id}-${pad(n)}.jpg`)}));
const ALBUMS={
  tees:{title:'SHORT-SLEEVE',sub:'DESIGN',label:'반팔 디자인',pages:range(DATA.tees,n=>`assets/tees/t${pad(n)}.jpg`)},
  show2025:{title:'2025',sub:'FASHION SHOW',label:'2025 패션쇼',pages:(DATA.show2025.photos||[]).map(f=>SHOW_DIR+f)}
};

// 뷰어: 매거진, 미니 매거진, 앨범 사진을 같은 창에서 한 장씩 넘겨 본다
const reader=document.querySelector('#reader');
const readerTitle=document.querySelector('#reader-title');
const picture=document.querySelector('#reader-image');
const paper=document.querySelector('.reader-paper');
const select=document.querySelector('#page-select');
const pageTotal=document.querySelector('#page-total');
const prev=document.querySelector('#prev');
const next=document.querySelector('#next');
const zoom=document.querySelector('#zoom');
let book=MAGAZINE,page=1;
function showPage(n){
  const last=book.pages.length;
  page=Math.max(1,Math.min(last,n));
  picture.src=book.pages[page-1];picture.alt=`${book.label} ${page}쪽`;
  select.value=page;prev.disabled=page===1;next.disabled=page===last;
  paper.classList.remove('zoom');paper.scrollTop=0;paper.scrollLeft=0;zoom.textContent='확대 ＋';zoom.setAttribute('aria-pressed','false');
  if(page<last)new Image().src=book.pages[page];
}
function openBook(b,n){
  if(!b.pages.length)return;
  book=b;
  const small=document.createElement('small');small.textContent=b.sub;
  readerTitle.replaceChildren(b.title,' ',small);
  select.replaceChildren(...b.pages.map((_,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=pad(i+1);return o}));
  pageTotal.textContent=b.pages.length;
  showPage(n);
  if(!reader.open){
    // 보던 위치를 기억한다. 카카오톡 등 일부 휴대폰 브라우저는 뷰어가 열린 동안 페이지를 맨 위로 올려 버린다.
    readerScrollY=window.scrollY;
    // 휴대폰 뒤로 가기를 누르면 사이트를 나가지 않고 뷰어만 닫히도록 기록을 하나 남긴다
    history.pushState({reader:true},'');
    reader.showModal();
  }
  document.body.classList.add('reading');
}
let readerScrollY=0;
history.scrollRestoration='manual';
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>openBook(MAGAZINE,Number(b.dataset.page))));
// 닫기 버튼, 바깥 클릭, Esc, 휴대폰 뒤로 가기가 모두 이 함수를 거친다.
// 브라우저의 close 이벤트는 늦게 오거나 오지 않는 경우가 있어서 정리를 여기서 바로 한다.
function closeReader(){
  if(reader.open)reader.close();
  if(!document.body.classList.contains('reading'))return;
  document.body.classList.remove('reading');
  window.scrollTo(0,readerScrollY);
  if(history.state&&history.state.reader)history.back();
}
document.querySelector('#close-reader').addEventListener('click',closeReader);
reader.addEventListener('close',closeReader);
window.addEventListener('popstate',closeReader);
reader.addEventListener('click',e=>{if(e.target===reader){const r=reader.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeReader()}});
prev.addEventListener('click',()=>showPage(page-1));next.addEventListener('click',()=>showPage(page+1));select.addEventListener('change',()=>showPage(Number(select.value)));
zoom.addEventListener('click',()=>{const expanded=paper.classList.toggle('zoom');zoom.setAttribute('aria-pressed',String(expanded));zoom.textContent=expanded?'축소 −':'확대 ＋'});
reader.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;if(e.key==='ArrowRight'){e.preventDefault();showPage(page+1)}if(e.key==='ArrowLeft'){e.preventDefault();showPage(page-1)}});
// 휴대폰: 좌우로 밀어서 넘기기 (확대 중에는 화면 이동을 위해 끈다)
let touchX=null,touchY=0;
paper.addEventListener('touchstart',e=>{if(e.touches.length===1&&!paper.classList.contains('zoom')){touchX=e.touches[0].clientX;touchY=e.touches[0].clientY}else touchX=null},{passive:true});
paper.addEventListener('touchend',e=>{if(touchX===null)return;const t=e.changedTouches[0];const dx=t.clientX-touchX,dy=t.clientY-touchY;touchX=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)showPage(page+(dx<0?1:-1))});

// 미니 매거진 표지 (클로젯 탭, 홈)
function miniCard(m){
  const b=document.createElement('button');b.type='button';b.className='mini-card';
  const frame=document.createElement('span');frame.className='framed';
  const img=document.createElement('img');img.loading='lazy';img.src=m.cover;img.alt=`미니 매거진 「${m.title}」 표지`;
  frame.append(img);
  const tag=document.createElement('small');tag.textContent=m.tag;
  const title=document.createElement('b');title.textContent=m.title;
  b.append(frame,tag,title);
  b.addEventListener('click',()=>openBook(m,1));
  return b;
}
document.querySelectorAll('[data-mini-grid]').forEach(grid=>grid.replaceChildren(...MINI.map(miniCard)));

// 앨범 (반팔 디자인, 2025 패션쇼): 사진을 누르면 뷰어로 크게 본다
document.querySelectorAll('[data-album]').forEach(grid=>{
  const album=ALBUMS[grid.dataset.album];
  grid.replaceChildren(...album.pages.map((src,i)=>{
    const b=document.createElement('button');b.type='button';
    const img=document.createElement('img');img.loading='lazy';img.src=src;img.alt=`${album.label} 사진 ${i+1}`;
    b.append(img);b.addEventListener('click',()=>openBook(album,i+1));
    return b;
  }));
  const empty=document.querySelector(`[data-album-empty="${grid.dataset.album}"]`);
  if(empty)empty.hidden=album.pages.length>0;
});
// 패션쇼 탭 액자: 단체 사진이 있으면 글자 그림 대신 사진을 보여 준다
if(DATA.show2025.cover){
  const cover=document.querySelector('[data-show-cover]');
  cover.src=SHOW_DIR+DATA.show2025.cover;cover.hidden=false;
  cover.closest('.last-show').classList.add('has-photo');
}

// 탭: 주소의 #값으로 보여 줄 패널을 정한다 (뒤로 가기, 링크 공유가 그대로 동작)
// 패널에 id 대신 data-tab을 쓴다. id가 #값과 같으면 브라우저가 그 위치로 스크롤해 버린다.
// 하위 화면(반팔 앨범 등)은 data-parent로 메뉴의 어느 칸을 밝힐지 정한다.
const panels=[...document.querySelectorAll('.panel')];
const tabs=[...document.querySelectorAll('nav a')];
let scrollTarget=null;
function showTab(moveFocus){
  const panel=panels.find(p=>p.dataset.tab===location.hash.slice(1))||panels[0];
  const current='#'+(panel.dataset.parent||panel.dataset.tab);
  panels.forEach(p=>{p.hidden=p!==panel});
  tabs.forEach(t=>{if(t.getAttribute('href')===current)t.setAttribute('aria-current','page');else t.removeAttribute('aria-current')});
  document.title=panel.dataset.title;
  const target=scrollTarget&&document.getElementById(scrollTarget);
  scrollTarget=null;
  if(target&&panel.contains(target))target.scrollIntoView();else window.scrollTo(0,0);
  if(moveFocus)panel.focus({preventScroll:true});
  if(panel.dataset.tab==='guestbook')loadNotes();
}
// 앨범에서 "← 우리의 기록"으로 돌아오거나 홈의 "전체 보기"를 누르면 기록 부분으로 바로 내려간다
document.querySelectorAll('[data-scroll], .back-link[href="#about"]').forEach(a=>a.addEventListener('click',()=>{scrollTarget=a.dataset.scroll||'archive'}));
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
