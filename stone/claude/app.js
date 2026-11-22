/* The Stone, inside Claude: pages come from Claude on the viewer's own plan (sample), the save lives in the
   viewer's private space in this artifact's database (db + user), narration uses the Claude voice (tts)
   or the device voice where that is not offered. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const log=$('log'), live=$('live'), busy=$('busy'), busyText=$('busy-text'), optsEl=$('options'), input=$('action');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TAGS='street (Privet Drive, suburbs, the zoo), kitchen (a Muggle kitchen or the Dursleys\' house), hut (Hagrid\'s hut or any small cottage or the hut on the rock), diagon, knockturn, platform, train, castle, great_hall, common_room, dorm, corridor, dungeon (Potions, cellars, the trapdoor chambers), classroom, library, office, hospital, greenhouse, grounds, forest, lake, quidditch, hogsmeade';
let DB=null, UID=null, SAMPLE=null, TTS=null;

// faces drawn for the 2008 story that would be wrong in 1991 stay out; the rest are drawn from the cast list
(function(){const keep=['Mr Ollivander','Ollivander','Garrick Ollivander','Rubeus Hagrid','Argus Filch','Mr Filch','Madam Poppy Pomfrey','Madam Irma Pince','Madam Rolanda Hooch','Professor Filius Flitwick'];
  const H=window.HAND_PORTRAITS||{};Object.keys(H).forEach(k=>{if(!keep.includes(k))delete H[k]})})();
const ROBERT={name:'Robert Potter',age:'child',gender:'m',hair_colour:'black',hair_style:'messy',eye_colour:'green',skin:1,features:['scar','glasses'],robes:'muggle_clothes'};
function drawFace(ctx,name,sp){try{window.drawPortraitHQ(ctx,Object.assign({name},sp||{}))}catch(e){}}

/* ---------- the painting across the top ---------- */
const cv=$('scene'), cx=cv.getContext('2d'); cx.imageSmoothingEnabled=false;
const imgCache={}; let cur=null, raf=0, frame=0; const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function key(tag,tod){const t=(tod==='dusk'||tod==='night')?tod:'day';return (ART[tag+'_'+t]?tag:'castle')+'_'+t}
function paint(tag,tod){const k=key(tag,tod);cur={k,meta:ARTMETA[k]||{}};if(!imgCache[k]){const im=new Image();im.src=ART[k];imgCache[k]=im;im.onload=()=>{if(cur&&cur.k===k)draw()}}draw();if(!raf&&!reduce)raf=requestAnimationFrame(tick)}
function draw(){if(!cur)return;const im=imgCache[cur.k];if(!im||!im.complete||!im.naturalWidth)return;cx.drawImage(im,0,0);cx.save();cx.scale(2,2);const m=cur.meta,f=frame;
  (m.sparkles||[]).forEach(([x,y],i)=>{const ph=(f+i*7)%40;if(ph<6){cx.fillStyle=ph<3?'#fff8dc':'#c9c9e8';cx.fillRect(x,y,1,1);if(ph<2){cx.fillRect(x-1,y,1,1);cx.fillRect(x+1,y,1,1);cx.fillRect(x,y-1,1,1);cx.fillRect(x,y+1,1,1)}}});
  (m.flames||[]).forEach(([x,y],i)=>{const ph=(f+i*5)%8;cx.fillStyle=ph<4?'#ffd36a':'#ff9b3a';cx.fillRect(x,y-(ph<2?1:0),1,1)});
  (m.smoke||[]).forEach(([x,y],i)=>{for(let k=0;k<3;k++){const ph=((f/3|0)+i*9+k*7)%24;cx.fillStyle='rgba(200,200,215,'+(0.5-ph/48)+')';cx.fillRect(x+Math.round(Math.sin((ph+k*5)/3)*1.5)-1+k,y-ph,2,2)}});cx.restore()}
function tick(){frame++;if(frame%4===0)draw();raf=requestAnimationFrame(tick)}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!reduce&&!raf)raf=requestAnimationFrame(tick)});
paint('kitchen','day');

/* ---------- settings: text and narration ---------- */
const S={textSize:1,textFont:'book',voice:'buttery',autoRead:false,rate:1};
const FONTS={book:"'Crimson Pro', Georgia, serif",classic:"Georgia, 'Times New Roman', serif",clean:"-apple-system, 'Helvetica Neue', Arial, sans-serif",easy:"'Atkinson Hyperlegible', -apple-system, Arial, sans-serif"};
function applyType(){const r=document.documentElement.style;r.setProperty('--fs',String(+S.textSize||1));r.setProperty('--body',FONTS[S.textFont]||FONTS.book);
  if(S.textFont==='easy'&&!$('f-easy')){const l=document.createElement('link');l.id='f-easy';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap';document.head.appendChild(l)}}
try{Object.assign(S,JSON.parse(localStorage.getItem('stone.view')||'{}'))}catch(e){}
applyType();

/* ---------- the save: one state document and one document per page, private to this viewer ---------- */
let state, turns=[];
function fresh(){return {n:0,chapter:2,date:'Sunday 23 June 1991',location:'Privet Drive',tag:'kitchen',tod:'day',giftStage:1,ledger:[],chronicle:[],cast:{'Robert Potter':ROBERT},ended:false,updated:''}}
const col=()=>DB.collection('data/users/'+UID);
async function loadAll(){
  state=fresh();turns=[];if(!DB||!UID)return;
  const st=await col().doc('state').get();if(st.exists)state=Object.assign(fresh(),JSON.parse(JSON.stringify(st.data())));
  const q=await col().where('kind','==','page').orderBy('n','desc').limit(6).get();
  turns=q.docs.map(d=>JSON.parse(JSON.stringify(d.data()))).filter(t=>t.n<=state.n).sort((a,b)=>a.n-b.n);
  const sv=await col().doc('settings').get();if(sv.exists){Object.assign(S,sv.data());applyType()}
}
let writing=Promise.resolve();
function save(page){
  if(!DB||!UID){$('saved').textContent='NOT SAVED';return}
  $('saved').textContent='SAVING…';
  writing=writing.then(async()=>{
    if(page)await col().doc('p'+String(page.n).padStart(4,'0')).set(Object.assign({kind:'page'},page));
    await col().doc('state').set(JSON.parse(JSON.stringify(state)));
    $('saved').textContent='SAVED';
  }).catch(e=>{$('saved').textContent=e&&e.code==='quota_exceeded'?'SAVE FULL':'NOT SAVED'});
  return writing;
}
async function saveSettings(){try{localStorage.setItem('stone.view',JSON.stringify(S))}catch(e){}if(DB&&UID){try{await col().doc('settings').set(Object.assign({},S))}catch(e){}}}

/* ---------- rendering ---------- */
function para(text,latest){let first=true;return String(text||'').split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean).map(b=>{const h=b.split('\n').map(l=>esc(l).replace(/\*(.+?)\*/g,'<i>$1</i>')).join('<br>');const lede=latest&&first&&!/^["“‘'*]/.test(b);first=false;return '<p'+(lede?' class="lede"':'')+'>'+h+'</p>'}).join('')}
const CH=['','The Boy Who Lived','The Vanishing Glass','The Letters','The Keeper of the Keys','Diagon Alley','The Journey','The Sorting','The Potions Master','The Midnight Duel','Halloween','Quidditch','The Mirror','Flamel','The Dragon','The Forest','The Trapdoor','Two Faces'];
function renderTurn(t,old,latest){const d=document.createElement('div');d.className='turn'+(old?' old':'')+(latest?' latest':'');
  let h='';if(t.action&&!/^\[/.test(t.action))h+='<p class="you">'+esc(t.action)+'</p>';
  if(latest&&t.giftUp){const r=window.STONE_GM.ladder[t.giftUp-1];h+='<p class="chap" style="color:var(--accent)">✦ YOUR GIFT GREW · STAGE '+t.giftUp+' · '+esc(r.name.toUpperCase())+' (SEE JOURNAL)</p>'}
  if(latest&&t.chapterStart)h+='<p class="chap">CHAPTER '+t.chapter+' · '+esc((CH[t.chapter]||'').toUpperCase())+'</p>';
  d.innerHTML=h+para(t.scene,latest);return d}
function renderPresent(t){const d=document.createElement('div');d.className='present';
  (t.present||[]).slice(0,5).forEach(n=>{const sp=(state.cast||{})[n];if(!sp)return;const w=document.createElement('div');w.className='who';const c=document.createElement('canvas');c.width=64;c.height=64;drawFace(c.getContext('2d'),n,sp);w.appendChild(c);const l=document.createElement('span');l.textContent=n.replace(/^(Professor|Madam|Mr|Mrs) /,'').split(' ')[0];w.appendChild(l);d.appendChild(w)});
  const lb=document.createElement('button');lb.type='button';lb.className='listen';lb.id='b-listen';lb.textContent=speaking?'■ Stop':'▶ Listen';lb.addEventListener('click',speakCurrent);d.appendChild(lb);
  const vn=document.createElement('span');vn.className='vnote';vn.id='vstat';d.appendChild(vn);return d}
function renderAll(){log.innerHTML='';
  if(!turns.length){log.innerHTML='<div class="empty">The book is open. Your first year begins in the cupboard under the stairs.</div>';renderOptions(null);return}
  const show=turns.slice(-4);
  if(show.length>1){const det=document.createElement('details');det.className='earlier';const sm=document.createElement('summary');sm.textContent='EARLIER · '+(show.length-1)+(show.length===2?' PAGE':' PAGES');det.appendChild(sm);show.slice(0,-1).forEach(t=>det.appendChild(renderTurn(t,true,false)));log.appendChild(det)}
  const last=show[show.length-1];log.appendChild(renderPresent(last));log.appendChild(renderTurn(last,false,true));
  paint(last.tag||state.tag,last.tod||state.tod);$('loc').textContent=state.location||'';$('date').textContent=state.date||'';renderOptions(last)}
function renderOptions(t){optsEl.innerHTML='';$('lead').textContent='WHAT DO YOU DO?';
  if(!SAMPLE){$('lead').textContent='OPEN THIS PAGE IN CLAUDE TO PLAY';return}
  if(!t){const b=document.createElement('button');b.type='button';b.className='opt cont';b.textContent='BEGIN';b.addEventListener('click',()=>act('[begin]'));optsEl.appendChild(b);return}
  if(state.ended){$('lead').textContent='THE END OF THE FIRST YEAR';return}
  (t.options||[]).forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='opt';b.innerHTML='<span class="n">'+(i+1)+'</span><span>'+esc(o)+'</span>';b.addEventListener('click',()=>act(o));optsEl.appendChild(b)})}
const scrollToLatest=()=>setTimeout(()=>{const el=log.querySelector('.present')||log.querySelector('.turn.latest');if(el)window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-8),behavior:'smooth'})},60);
const scrollEnd=()=>setTimeout(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}),40);
function setBusy(on,txt){busy.hidden=!on;if(txt)busyText.textContent=txt}

/* ---------- narration: the Claude voice where offered, the device voice elsewhere ---------- */
let speaking=false,inTurn=false,liveText='';
function lbtn(on){const b=$('b-listen');if(b){b.textContent=on?'■ Stop':'▶ Listen';b.classList.toggle('on',on)}}
function stopSpeaking(){speaking=false;lbtn(false);try{TTS&&TTS.stop()}catch(e){}try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}}
async function speakCurrent(){
  if(speaking){stopSpeaking();return}
  const text=String(inTurn&&liveText?liveText:(turns.length?turns[turns.length-1].scene:'')).replace(/\*/g,'');if(!text)return;
  const parts=text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).flatMap(p=>p.length>1900?p.match(/[^.!?]+[.!?"”’]*\s*/g)||[p]:[p]);
  speaking=true;lbtn(true);
  try{
    if(TTS){await TTS.speak(parts.map(t=>({text:t,voice:S.voice||'buttery',language:'en'})),{rate:+S.rate||1})}
    else if(window.speechSynthesis){await new Promise(res=>{let i=0;const voices=speechSynthesis.getVoices();const v=voices.find(v=>/en-GB/i.test(v.lang))||null;
      const next=()=>{if(!speaking||i>=parts.length)return res();const u=new SpeechSynthesisUtterance(parts[i++]);if(v)u.voice=v;u.lang='en-GB';u.rate=0.95*(+S.rate||1);u.onend=next;u.onerror=()=>res();speechSynthesis.speak(u)};next()})}
    else{const el=$('vstat');if(el)el.textContent='No narrator is available here.'}
  }catch(e){const el=$('vstat');if(el&&e&&e.code==='rate_limited')el.textContent='The narrator needs a moment. Try again shortly.'}
  speaking=false;lbtn(false);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&speaking)stopSpeaking()});

/* ---------- the narrator call ---------- */
function ladderText(){const L=window.STONE_GM.ladder,st=state.giftStage||1;return 'STAGE: '+st+' ('+L[st-1].name+')\n'+L.map(r=>(r.stage===st?'>> ':'   ')+r.stage+'. '+r.name+' ('+r.when+')\n     can: '+r.can.join(' / ')+'\n     not yet: '+r.cant.join(' / ')+'\n     next rung unlocks with: '+r.unlock).join('\n')}
function partialScene(raw){const m=raw.match(/"scene"\s*:\s*"/);if(!m)return null;let i=m.index+m[0].length,out='',e=false;
  for(;i<raw.length;i++){const ch=raw[i];if(e){if(ch==='n')out+='\n';else if(ch==='t')out+='\t';else if(ch==='u'){const hx=raw.slice(i+1,i+5);if(/^[0-9a-fA-F]{4}$/.test(hx)){out+=String.fromCharCode(parseInt(hx,16));i+=4}}else out+=ch;e=false;continue}
    if(ch==='\\'){e=true;continue}if(ch==='"'){partialScene.done=true;return out}out+=ch}partialScene.done=false;return out}
function renderLive(text,done){live.innerHTML=para(text,false)+(done?'<p class="note finishing">Finishing the page and your choices…</p>':'<p class="cursor">▍</p>')}
function prompt(action){
  const recent=turns.slice(-2).map(t=>(t.action&&!/^\[/.test(t.action)?'ROBERT DID: '+t.action+'\n':'')+t.scene).join('\n\n---\n\n');
  const last=turns.length?turns[turns.length-1]:null;
  return [window.STONE_GM.rules,window.STONE_GM.bible,
    '=== CURRENT ===','Chapter of the book (nearest): '+state.chapter+'\nDate: '+state.date+'\nPlace: '+state.location,
    '=== GIFT LADDER (STAGE is where Robert is now; >> marks it) ===',ladderText(),
    '=== PLAYER\'S CHANGES TO THE WORLD (always true from the start of the story; they override the bible and the book) ===',(state.changes&&state.changes.length?state.changes.map(x=>'- '+x).join('\n'):'(none)'),
    '=== WHO ROBERT IS BECOMING (from the player\'s choices) ===',state.self||'(not yet shown: he starts as the book\'s boy, and the player\'s choices will shape him)',
    '=== LEDGER (how this telling has left the book) ===',(state.ledger&&state.ledger.length?state.ledger.map(x=>'- '+x).join('\n'):'(nothing yet: the story is on the book\'s road)'),
    '=== STORY SO FAR (one line per page) ===',(state.chronicle||[]).slice(-120).join('\n')||'(this is the first page)',
    '=== CAST ALREADY DESCRIBED ===',Object.keys(state.cast||{}).join(', '),
    '=== RECENT PAGES ===',recent||'(none)',
    '=== OPTIONS OFFERED LAST PAGE ===',last&&last.options?last.options.map((o,i)=>(i+1)+'. '+o).join('\n'):'(none)',
    '=== ROBERT\'S ACTION (the player\'s words; "I" means Robert; write the page in third person) ===',action==='[begin]'?'Begin the story: the morning of Dudley\'s eleventh birthday, Robert in the cupboard under the stairs. Open with a short, vivid page that sets up who Robert is and how he lives.':action,
    '=== OUTPUT ===',
    'Reply with one JSON object only, no other text, keys in this order:',
    '{"scene":"the page, 300-550 words, paragraphs separated by \\n\\n",'+
    ' "options":["3 or 4 choices, each at most 14 words, in the first person as the player, e.g. \"I grab the key.\" (never he/Robert)"],'+
    ' "chapter":the book chapter this page belongs to (2-17),'+
    ' "date":"in-story date e.g. Wednesday 31 July 1991",'+
    ' "location":"short place name",'+
    ' "tag":"one of: '+TAGS+'",'+
    ' "tod":"day|dusk|night",'+
    ' "present":["up to 4 named characters on this page who are not Robert, full names as in CAST"],'+
    ' "cast":[{"name":"Full Name","age":"child|teen|adult|old","gender":"m|f","hair_colour":"black|dark_brown|brown|light_brown|auburn|ginger|blond|platinum|grey|white","hair_style":"short|parted|swept|messy|spiky|curly|buzz|bob|plaits|long","eye_colour":"brown|blue|green|grey|black","skin":0-4 (0 palest, 4 darkest),"features":["beard","moustache","stubble","freckles","scar","glasses","earring"] (only those that apply),"house":"gryffindor|slytherin|ravenclaw|hufflepuff|ghost|portrait (if known)"} ONLY for named characters appearing for the first time, else []],'+
    ' "gift":null, or the new stage number (2-5) on the page where Robert moves up a rung,'+
    ' "ledger":null or the FULL updated list when this page diverged from the book,'+
    ' "self":null, or a fresh 2-3 sentence summary of who Robert is becoming when the player\'s choices have shifted him,'+
    ' "log":"one line: what happened on this page",'+
    ' "end":false (true only on the final page, with "options":[])}'].join('\n\n')}

async function act(text){
  if(inTurn||!SAMPLE)return;inTurn=true;liveText='';
  try{const p=JSON.parse(localStorage.getItem('stone.pending')||'{}');localStorage.setItem('stone.pending',JSON.stringify({text,n:state.n,at:Date.now(),tries:p.text===text?(p.tries||0)+1:0}))}catch(e){}
  stopSpeaking();
  try{if(DB&&UID){const st=await col().doc('state').get();if(st.exists){const d=st.data();if(Array.isArray(d.changes))state.changes=JSON.parse(JSON.stringify(d.changes));if(typeof d.self==='string')state.self=d.self;if(d.cast&&typeof d.cast==='object')state.cast=JSON.parse(JSON.stringify(d.cast))}}}catch(e){}
  const pend=document.createElement('div');pend.className='turn';if(!/^\[/.test(text))pend.innerHTML='<p class="you">'+esc(text)+'</p>';log.appendChild(pend);
  optsEl.innerHTML='';input.value='';setBusy(true,'The quill is thinking…');live.hidden=true;scrollEnd();
  let out,shown=false;const clearPending=()=>{try{localStorage.removeItem('stone.pending')}catch(_){}};
  try{
    for(let tries=0;;tries++){
      try{out=await SAMPLE.json(prompt(text),{modelTier:'complex',cache:false,onText:({text:raw})=>{const sc=partialScene(String(raw||''));if(sc&&sc.length>12){if(!shown){shown=true;live.hidden=false;setBusy(false)}liveText=sc;renderLive(sc,partialScene.done)}else busyText.textContent='Writing…'}});break}
      catch(e){if(tries>=2||!['unavailable','overloaded','network'].includes(e&&e.code))throw e;
        live.hidden=true;shown=false;setBusy(true,'The connection dropped. Trying again…');await new Promise(r=>setTimeout(r,1500))}
    }
  }catch(e){inTurn=false;liveText='';clearPending();setBusy(false);pend.remove();live.hidden=true;showErr(e||{});renderOptions(turns[turns.length-1]||null);scrollEnd();return}
  inTurn=false;liveText='';setBusy(false);live.hidden=true;live.innerHTML='';pend.remove();
  if(!out||!out.scene){clearPending();showErr({code:'invalid_json'});renderOptions(turns[turns.length-1]||null);return}
  const ch=Math.max(1,Math.min(17,parseInt(out.chapter)||state.chapter||2));
  const t={n:state.n+1,action:text,scene:String(out.scene),options:Array.isArray(out.options)?out.options.map(String).slice(0,4):[],chapter:ch,chapterStart:ch!==state.chapter||!turns.length,
    tag:String(out.tag||state.tag),tod:['day','dusk','night'].includes(out.tod)?out.tod:'day',present:Array.isArray(out.present)?out.present.map(String):[],at:new Date().toISOString()};
  if(Array.isArray(out.cast))out.cast.forEach(c=>{if(c&&c.name&&c.name!=='Robert Potter'){const h=String(c.house||'').toLowerCase();c.house=['ghost','portrait'].includes(h)?h:h?h[0].toUpperCase()+h.slice(1):null;state.cast[String(c.name)]=Object.assign({},state.cast[String(c.name)]||{},c)}});
  {const g=parseInt(out.gift);if(g>(state.giftStage||1)&&g<=5){state.giftStage=g;t.giftUp=g}}
  if(Array.isArray(out.ledger))state.ledger=out.ledger.map(String).slice(0,30);
  if(out.self&&typeof out.self==='string')state.self=out.self.slice(0,700);
  state.chronicle=(state.chronicle||[]).concat(['['+ch+'] '+String(out.log||t.scene.slice(0,100))]).slice(-400);
  Object.assign(state,{n:t.n,chapter:ch,date:String(out.date||state.date),location:String(out.location||state.location),tag:t.tag,tod:t.tod,ended:!!out.end,updated:t.at});
  turns.push(t);if(turns.length>6)turns=turns.slice(-6);
  clearPending();save(t);renderAll();scrollToLatest();
  if(S.autoRead)speakCurrent();
}
function errInfo(e){const m=String(e&&e.message||'');
  if(e.code==='not_granted')return ['Claude needs your permission to write the story.','Pick the option again and allow it when Claude asks.',''];
  if(e.code==='rate_limited')return ['You have reached your Claude usage limit for now.','Wait a while, then pick the option again. Your story is saved.',''];
  if(e.code==='truncated')return ['The page ran out of room before it finished.','Pick the option again.',''];
  if(e.code==='invalid_json')return ['The page came back garbled.','Pick the option again.',''];
  if(['unavailable','overloaded','network'].includes(e.code))return ['Lost the connection to Claude.','It tried three times. Pick the option again.',''];
  return ['Something went wrong writing the page.','Pick the option again.',m]}
function showErr(e){const [t,h,m]=errInfo(e);const d=document.createElement('div');d.className='err';d.innerHTML='<b>'+esc(t)+'</b><p>'+esc(h)+'</p>'+(m?'<small>'+esc(m)+'</small>':'');log.appendChild(d)}
$('free').addEventListener('submit',e=>{e.preventDefault();const v=input.value.trim();if(v)act(v)});

/* ---------- journal and settings ---------- */
function openModal(title,html){$('m-title').textContent=title;$('m-body').innerHTML=html;$('modal').hidden=false}
$('m-close').addEventListener('click',()=>$('modal').hidden=true);$('modal').addEventListener('click',e=>{if(e.target.id==='modal')$('modal').hidden=true});
function journal(tab){tab=tab||'story';
  const tabs='<div class="tabs">'+[['story','STORY SO FAR'],['changes','CHANGES'],['gift','YOUR GIFT']].map(([k,l])=>'<button type="button" data-t="'+k+'" class="'+(k===tab?'on':'')+'">'+l+'</button>').join('')+'</div>';
  let body='';
  if(tab==='story'){let lastC=0;body=(state.chronicle||[]).map(l=>{const m=l.match(/^\[(\d+)\]\s*(.*)$/);const c=m?+m[1]:lastC;let h='';if(c!==lastC){h='<div class="k">CHAPTER '+c+' · '+esc((CH[c]||'').toUpperCase())+'</div>';lastC=c}return h+'<p style="margin:.3em 0">'+esc(m?m[2]:l)+'</p>'}).join('')||'<p class="note">Nothing yet.</p>'}
  if(tab==='changes')body=state.ledger&&state.ledger.length?'<ul>'+state.ledger.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="note">So far, the story is on the book\'s road.</p>';
  if(tab==='gift'){const L=window.STONE_GM.ladder,st=state.giftStage||1;body=L.map(r=>{const now=r.stage===st,done=r.stage<st;return '<div class="rung'+(now?' now':'')+(r.stage>st?' later':'')+'"><div class="k">'+(now?'YOU ARE HERE · ':done?'DONE · ':'')+'STAGE '+r.stage+' · '+esc(r.name.toUpperCase())+'</div><p class="note" style="margin:0 0 6px">'+esc(r.when)+'</p>'+(r.stage<=st?'<ul>'+r.can.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>':'<ul>'+r.can.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>')+(now?'<p><b>Not yet:</b> '+esc(r.cant.join(' '))+'</p><p><b>Next rung unlocks with:</b> '+esc(r.unlock)+'</p>':'')+'</div>'}).join('')+'<p class="note">Never this year: Dark curses, controlling a person like a puppet, wiping memories, Apparition, beating a prepared grown wizard head-on.</p>'}
  openModal('JOURNAL',tabs+body);$('m-body').querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>journal(b.dataset.t)))}
$('b-journal').addEventListener('click',()=>journal());
function settings(){
  const voice=TTS?'<div class="k">NARRATOR VOICE</div><select id="st-voice"><option value="buttery">Buttery</option><option value="airy">Airy</option><option value="glassy">Glassy</option><option value="rounded">Rounded</option></select>':'<p class="note">The Claude voice is not offered in this browser, so Listen uses your device\'s own voice.</p>';
  openModal('SETTINGS',
   '<div class="k">TEXT SIZE</div><select id="st-size"><option value="0.9">Small</option><option value="1">Standard</option><option value="1.12">Large</option><option value="1.25">Larger</option><option value="1.4">Largest</option></select>'+
   '<div class="k">TYPEFACE</div><select id="st-font"><option value="book">Book (Crimson)</option><option value="classic">Classic (Georgia)</option><option value="clean">Clean (sans serif)</option><option value="easy">Easy reading (Atkinson Hyperlegible)</option></select>'+
   voice+'<div class="k">READING SPEED</div><select id="st-rate"><option value="0.85">Slower</option><option value="1">Normal</option><option value="1.15">Faster</option></select>'+
   '<div class="row"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="st-auto" style="width:auto"> Read each page aloud</label></div>'+
   '<div class="k">START OVER</div><p class="note">Wipes this story and begins again at the cupboard under the stairs.</p><div class="row"><button type="button" class="mini" id="st-reset">Start over</button></div>');
  $('st-size').value=String(+S.textSize||1);$('st-font').value=S.textFont||'book';if($('st-voice'))$('st-voice').value=S.voice||'buttery';$('st-rate').value=String(+S.rate||1);$('st-auto').checked=!!S.autoRead;
  const sv=()=>{S.textSize=+$('st-size').value;S.textFont=$('st-font').value;if($('st-voice'))S.voice=$('st-voice').value;S.rate=+$('st-rate').value;S.autoRead=$('st-auto').checked;applyType();saveSettings()};
  ['st-size','st-font','st-voice','st-rate','st-auto'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',sv)});
  $('st-reset').addEventListener('click',async e=>{const b=e.currentTarget;if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='Tap again to wipe the story';return}
    b.disabled=true;b.textContent='Wiping…';
    try{if(DB&&UID){const q=await col().where('kind','==','page').limit(1000).get();for(const d of q.docs)await col().doc(d.id).delete()}}catch(err){}
    state=fresh();turns=[];await save(null);$('modal').hidden=true;renderAll()})}
$('b-settings').addEventListener('click',settings);

/* ---------- start ---------- */
async function boot(){
  $('saved').textContent='OPENING…';
  const use=n=>window.claude&&window.claude.use?window.claude.use(n).catch(()=>null):Promise.resolve(null);
  const [db,user,sample,tts]=await Promise.all([use('db'),use('user'),use('sample'),use('tts')]);
  DB=db;SAMPLE=sample;TTS=tts;
  try{UID=user?await user.id():null}catch(e){UID=null}
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;$('saved').textContent='SAVE NOT REACHED'},10000);
  try{await loadAll()}catch(e){state=state||fresh()}
  clearTimeout(timer);if(!timedOut)$('saved').textContent=DB&&UID?(state.n?'SAVED':'NEW STORY'):'NOT SAVING';
  renderAll();if(turns.length)scrollToLatest();
  if(!SAMPLE){const d=document.createElement('div');d.className='err';d.innerHTML='<b>This page writes its story with Claude.</b><p>Open it from your Claude account to play.</p>';log.appendChild(d)}
  try{const p=JSON.parse(localStorage.getItem('stone.pending')||'null');
    if(p&&p.text&&p.n===state.n&&Date.now()-p.at<6*3600e3&&(p.tries||0)<2&&SAMPLE){const d=document.createElement('p');d.className='note';d.style.textAlign='center';d.textContent='Picking up your last choice…';log.appendChild(d);setTimeout(()=>{d.remove();act(p.text)},600)}
    else if(p)localStorage.removeItem('stone.pending')}catch(e){}
}
boot();
})();
