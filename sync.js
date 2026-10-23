/* Cloud save: one encrypted, private gist on the player's own GitHub account.
   The gist holds the save, the API key and the story passphrase, sealed with AES-GCM under a key derived
   from the player's GitHub token, so neither GitHub nor anyone with the gist link can read it.
   Local storage stays as a cache for speed; the cloud copy is the real save. Newest save wins (turn number, then time). */
(function(){
'use strict';
const CFG='hog.sync', DESC='Hogwarts cloud save (encrypted)', FILE='hogwarts-save.enc', API='https://api.github.com';
const TOKEN_URL='https://github.com/settings/tokens/new?scopes=gist&description=Hogwarts%20cloud%20save';
const enc=new TextEncoder(), dec=new TextDecoder();
const b64=u=>{let s='';const a=new Uint8Array(u);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const cfg=()=>{try{return JSON.parse(localStorage.getItem(CFG)||'null')}catch(e){return null}};
const setCfg=c=>{try{c?localStorage.setItem(CFG,JSON.stringify(c)):localStorage.removeItem(CFG)}catch(e){}};
const err=(msg,code)=>Object.assign(new Error(msg),{code});

async function keyFor(token){
  const base=await crypto.subtle.importKey('raw',enc.encode(token.trim()),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:enc.encode('hogwarts-cloud-save-v1'),iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function gz(u8,compress){
  if(typeof CompressionStream==='undefined')return null;
  const s=new Blob([u8]).stream().pipeThrough(compress?new CompressionStream('gzip'):new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
async function seal(obj,token){
  const raw=enc.encode(JSON.stringify(obj)), z=await gz(raw,true), key=await keyFor(token), iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,z||raw);
  return JSON.stringify({v:1,gzip:!!z,n:obj.n||0,updated:obj.updated||'',iv:b64(iv),ct:b64(ct)});
}
async function unseal(txt,token){
  const o=JSON.parse(txt), key=await keyFor(token);
  let pt;try{pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(o.iv)},key,unb64(o.ct)))}catch(e){throw err('This cloud save was sealed with a different token.','key')}
  if(o.gzip){pt=await gz(pt,false);if(!pt)throw err('This browser cannot unpack the cloud save.','gzip')}
  return JSON.parse(dec.decode(pt));
}
async function gh(path,token,opt){
  opt=opt||{};let r;
  try{r=await fetch(API+path,{method:opt.method||'GET',cache:'no-store',headers:Object.assign({'Authorization':'Bearer '+token.trim(),'Accept':'application/vnd.github+json'},opt.body?{'Content-Type':'application/json'}:{}),body:opt.body?JSON.stringify(opt.body):undefined})}
  catch(e){throw err('Could not reach GitHub.','net')}
  if(r.status===401)throw err('GitHub rejected that token. Make a new one with the gist box ticked.','auth');
  if(r.status===403||r.status===404)throw err('That token cannot use gists. Make it with the gist box ticked.','scope');
  if(!r.ok)throw err('GitHub returned '+r.status+'.','net');
  return r.json();
}
async function findGist(token){
  for(let page=1;page<=10;page++){
    const L=await gh('/gists?per_page=100&page='+page,token);
    const g=L.find(x=>x.description===DESC&&x.files&&x.files[FILE]);if(g)return g.id;
    if(L.length<100)break;
  }
  return null;
}
async function readGist(id,token){
  const g=await gh('/gists/'+id,token), f=g.files&&g.files[FILE];if(!f)return null;
  let txt=f.content;if(f.truncated){const r=await fetch(f.raw_url,{cache:'no-store'});txt=await r.text()}
  return unseal(txt,token);
}
async function writeGist(id,token,payload){
  const content=await seal(payload,token);
  if(id){await gh('/gists/'+id,token,{method:'PATCH',body:{files:{[FILE]:{content}}}});return id}
  const g=await gh('/gists',token,{method:'POST',body:{description:DESC,public:false,files:{[FILE]:{content}}}});return g.id;
}

// ---- what travels: settings (with the API key), the passphrase, the state and every turn
function snapshot(){
  const S=window.HOG.settings;let state=null,turns=[];
  try{state=JSON.parse(localStorage.getItem('hog.state')||'null');turns=JSON.parse(localStorage.getItem('hog.turns')||'[]')}catch(e){}
  return {settings:{apiKey:S.apiKey,model:S.model,thinking:S.thinking,voice:S.voice,autoRead:S.autoRead,rate:S.rate},
    pass:localStorage.getItem('hog.pass')||'',state,turns,n:(state&&state.n)||0,updated:(state&&state.updated)||'',device:navigator.userAgent.slice(0,80),at:new Date().toISOString()};
}
function apply(p){
  if(p.settings){Object.assign(window.HOG.settings,p.settings);window.HOG.saveSettings()}
  if(p.pass)localStorage.setItem('hog.pass',p.pass);
  if(p.state)localStorage.setItem('hog.state',JSON.stringify(p.state));
  if(Array.isArray(p.turns))localStorage.setItem('hog.turns',JSON.stringify(p.turns));
}
const newer=(a,b)=>(a.n||0)>(b.n||0)||((a.n||0)===(b.n||0)&&String(a.updated||'')>String(b.updated||''));
const local=()=>{const s=snapshot();return {n:s.n,updated:s.updated}};

let status='', listeners=[];
const say=s=>{status=s;listeners.forEach(f=>{try{f(s)}catch(e){}})};

const SYNC={
  TOKEN_URL,
  on(){return !!(cfg()&&cfg().token)},
  status(){return status},
  onStatus(f){listeners.push(f)},
  // connect a token. Returns {found:bool, remote:{n,updated}|null}
  async connect(token){
    token=String(token||'').trim();if(!token)throw err('Paste the GitHub token first.','empty');
    say('CONNECTING…');
    const id=await findGist(token);let remote=null;
    if(id){remote=await readGist(id,token)}
    setCfg({token,gist:id||null,base:remote?remote.n||0:null});say(id?'CLOUD':'CLOUD (EMPTY)');
    return {found:!!remote,remote};
  },
  disconnect(){setCfg(null);say('')},
  // pull the cloud save into this device if it is newer; returns true when something changed
  async pull(force){
    const c=cfg();if(!c||!c.token||!c.gist)return false;
    const r=await readGist(c.gist,c.token);if(!r)return false;
    if(force||newer(r,local())){apply(r);setCfg(Object.assign(cfg(),{base:r.n||0}));say('CLOUD');return true}
    say('CLOUD');return false;
  },
  // push this device to the cloud unless the cloud is ahead (then say so and keep both)
  async push(force){
    const c=cfg();if(!c||!c.token)return;
    say('SYNCING…');
    try{
      // behind if the cloud is newer, or another device moved it on since this one last synced
      if(c.gist&&!force){const r=await readGist(c.gist,c.token);if(r&&(newer(r,local())||(c.base!=null&&(r.n||0)>c.base))){say('CLOUD IS AHEAD');return 'behind'}}
      const snap=snapshot(), id=await writeGist(c.gist,c.token,snap);setCfg({token:c.token,gist:id,base:snap.n||0});
      SYNC.lastOk=new Date();SYNC.lastError='';say('SAVED · CLOUD');return 'ok';
    }catch(e){SYNC.lastError=e.message||String(e);say('CLOUD SAVE FAILED');throw e}
  },
  apply,snapshot,newer,readGist
};
window.SYNC=SYNC;
})();
