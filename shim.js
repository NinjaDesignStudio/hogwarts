/* Standalone runtime: replaces the Claude viewer's db + sample with local storage + the Anthropic API,
   decrypts the GM documents with a passphrase, and exposes window.claude.use() so the game code is unchanged. */
(function(){
'use strict';
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}};
const SETTINGS_KEY='hog.settings', STATE_KEY='hog.state', TURNS_KEY='hog.turns', GM_KEY='hog.gm';
const settings=Object.assign({apiKey:'',model:'claude-opus-5-5',thinking:true,voice:'bm_george',autoRead:true,rate:1.0},JSON.parse(LS(SETTINGS_KEY)||'{}'));
window.HOG={settings,saveSettings(){LS(SETTINGS_KEY,JSON.stringify(settings))}};

/* ---------- crypto: AES-GCM with PBKDF2 ---------- */
const enc=new TextEncoder(), dec=new TextDecoder();
const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a))), unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function keyFrom(pass,salt){const km=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:200000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt','encrypt'])}
async function decryptBundle(bundle,pass){const key=await keyFrom(pass,unb64(bundle.salt));const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(bundle.iv)},key,unb64(bundle.data));return JSON.parse(dec.decode(pt))}
window.HOG.decryptBundle=decryptBundle;

/* ---------- local "db" with the same surface the game uses ---------- */
let turnsCache=null;
function loadTurns(){if(!turnsCache){try{turnsCache=JSON.parse(LS(TURNS_KEY)||'[]')}catch(e){turnsCache=[]}}return turnsCache}
function saveTurns(){LS(TURNS_KEY,JSON.stringify(turnsCache))}
const db={
  doc(path){
    const [col,id]=path.split('/');
    return {
      async get(){
        if(col==='gm'){const gm=JSON.parse(LS(GM_KEY)||'{}');return {exists:!!gm[id],data:()=>({text:gm[id]||''})}}
        if(col==='game'){const s=LS(STATE_KEY);return {exists:!!s,data:()=>JSON.parse(s)}}
        if(col==='turns'){const t=loadTurns().find(t=>'t'+String(t.n).padStart(4,'0')===id);return {exists:!!t,data:()=>t}}
        return {exists:false,data:()=>undefined};
      },
      async set(data){
        if(col==='game'){LS(STATE_KEY,JSON.stringify(data));return}
        if(col==='turns'){const arr=loadTurns();const i=arr.findIndex(t=>t.n===data.n);if(i>=0)arr[i]=data;else arr.push(data);arr.sort((a,b)=>a.n-b.n);saveTurns();return}
        if(col==='gm'){const gm=JSON.parse(LS(GM_KEY)||'{}');gm[id]=data.text;LS(GM_KEY,JSON.stringify(gm));return}
      }
    };
  },
  collection(col){
    let lim=6, dir='desc';
    const q={orderBy(f,d){dir=d||'asc';return q},limit(n){lim=n;return q},async get(){const arr=loadTurns().slice().sort((a,b)=>dir==='desc'?b.n-a.n:a.n-b.n).slice(0,lim);return {docs:arr.map(t=>({data:()=>t}))}}};
    return q;
  }
};
window.HOG.db=db;
window.HOG.resetGame=()=>{LS(STATE_KEY,null);LS(TURNS_KEY,null);turnsCache=null};
window.HOG.exportSave=()=>JSON.stringify({state:JSON.parse(LS(STATE_KEY)||'null'),turns:loadTurns()});
window.HOG.importSave=(json)=>{const o=JSON.parse(json);if(o.state)LS(STATE_KEY,JSON.stringify(o.state));if(Array.isArray(o.turns)){turnsCache=o.turns;saveTurns()}};

/* ---------- Anthropic API as a "sample" function ---------- */
const API='https://api.anthropic.com/v1/messages';
function mkErr(code,message,text){return {code,message,text}}
async function callModel(input,opts,wantJson){
  opts=opts||{};
  if(!settings.apiKey)throw mkErr('not_granted','No API key');
  const messages=typeof input==='string'?[{role:'user',content:input}]:input.map(m=>({role:m.role,content:m.content}));
  const body={model:opts.fastModel||settings.model,max_tokens:opts.maxTokens||(wantJson?16000:1500),stream:true,messages};
  if(wantJson&&settings.thinking&&!opts.fastModel)body.thinking={type:'enabled',budget_tokens:3000};
  if(body.thinking)body.max_tokens=Math.max(body.max_tokens,body.thinking.budget_tokens+16000);
  let res;
  try{
    res=await fetch(API,{method:'POST',signal:opts.signal,headers:{'content-type':'application/json','x-api-key':settings.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});
  }catch(e){ if(e&&e.name==='AbortError')throw mkErr('cancelled','aborted'); throw mkErr('network',String(e)) }
  if(!res.ok){
    let msg='';try{msg=(await res.json()).error.message}catch(e){}
    if(res.status===400&&/thinking/i.test(msg)&&body.thinking){delete body.thinking;settings.thinking=false;window.HOG.saveSettings();return callModel(input,opts,wantJson)}
    if(res.status===401)throw mkErr('not_granted','Bad API key: '+msg);
    if(res.status===429)throw mkErr('rate_limited',msg||'rate limited');
    if(res.status===400&&/credit/i.test(msg))throw mkErr('rate_limited',msg);
    if(res.status===529||res.status>=500)throw mkErr('overloaded',(res.status+' '+msg).trim());
    throw mkErr('upstream_error',(res.status+' '+msg).trim());
  }
  const reader=res.body.getReader(); const td=new TextDecoder(); let buf='', text='', truncated=false;
  while(true){
    let r;try{r=await reader.read()}catch(e){if((e&&e.name==='AbortError')||(opts.signal&&opts.signal.aborted))throw mkErr('cancelled','aborted');throw mkErr('network','stream dropped: '+String(e))}
    const {value,done}=r; if(done)break;
    buf+=td.decode(value,{stream:true});
    let idx;
    while((idx=buf.indexOf('\n\n'))>=0){
      const chunk=buf.slice(0,idx); buf=buf.slice(idx+2);
      const line=chunk.split('\n').find(l=>l.startsWith('data:')); if(!line)continue;
      let ev; try{ev=JSON.parse(line.slice(5).trim())}catch(e){continue}
      if(ev.type==='content_block_delta'&&ev.delta&&ev.delta.type==='text_delta'){text+=ev.delta.text; if(opts.onText)try{opts.onText({text,delta:ev.delta.text})}catch(e){}}
      if(ev.type==='message_delta'&&ev.delta&&ev.delta.stop_reason==='max_tokens')truncated=true;
      if(ev.type==='error')throw mkErr(ev.error&&/overloaded|api_error/.test(ev.error.type||'')?'overloaded':'upstream_error',JSON.stringify(ev.error));
    }
  }
  if(!text.trim())throw mkErr('empty_completion','no text');
  if(!wantJson)return {text,truncated,modelTierApplied:'complex'};
  // tolerant JSON parse: whole, fenced, or first { to last }
  const tryParse=s=>{try{return JSON.parse(s)}catch(e){return undefined}};
  let v=tryParse(text);
  if(v===undefined){const m=text.match(/```(?:json)?\s*([\s\S]*?)```/);if(m)v=tryParse(m[1])}
  if(v===undefined){const a=text.indexOf('{'),b=text.lastIndexOf('}');if(a>=0&&b>a)v=tryParse(text.slice(a,b+1))}
  if(v===undefined){const a=text.indexOf('{'),b=text.lastIndexOf('}');if(a>=0&&b>a)v=tryParse(repairJson(text.slice(a,b+1)))}
  if(v===undefined){try{localStorage.setItem('hog.lastbad',text.slice(-20000))}catch(e){}throw mkErr(truncated?'truncated':'invalid_json',truncated?'reply cut off at the length limit':'could not parse',text)}
  return v;
}
// escape raw control characters inside strings and drop trailing commas
function repairJson(s){let o='',str=false,esc=false;for(const ch of s){if(str){if(esc){esc=false;o+=ch;continue}if(ch==='\\'){esc=true;o+=ch;continue}if(ch==='"'){str=false;o+=ch;continue}if(ch==='\n'){o+='\\n';continue}if(ch==='\r'){continue}if(ch==='\t'){o+='\\t';continue}o+=ch}else{if(ch==='"')str=true;o+=ch}}return o.replace(/,\s*([}\]])/g,'$1')}
const sample=async(input,opts)=>callModel(input,opts,false);
sample.json=async(input,opts)=>callModel(input,opts,true);
sample.limits=async()=>({maxPromptBytes:262144});

window.claude={use:async(name)=>{if(name==='db')return db;if(name==='sample')return sample;return null}};
})();
