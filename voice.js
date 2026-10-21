/* Narrator: Kokoro-82M in the browser (free, local). Falls back to the device voice until the model is ready. */
(function(){
'use strict';
const S=window.HOG.settings;
const VOICES={bm_george:'George (British)',bm_daniel:'Daniel (British)',bm_fable:'Fable (British)',bm_lewis:'Lewis (British)',bf_emma:'Emma (British)',bf_alice:'Alice (British)',am_michael:'Michael (American)',af_heart:'Heart (American)'};
let tts=null, loading=null, status='idle', statusMsg='', ctx=null, queue=[], playing=false, current=null, stopFlag=false, onStatus=()=>{};
const V={VOICES,get status(){return status},get statusMsg(){return statusMsg},onStatus(fn){onStatus=fn},get speaking(){return playing}};
function setStatus(s,m){status=s;statusMsg=m||'';try{onStatus(s,m)}catch(e){}}
function audioCtx(){if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC()}if(ctx.state==='suspended')ctx.resume();return ctx}
V.unlock=()=>{try{audioCtx()}catch(e){}};

async function load(){
  if(tts)return tts; if(loading)return loading;
  loading=(async()=>{
    setStatus('loading','Fetching the narrator (about 90 MB, once)…');
    const mod=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm');
    const hasGPU=!!navigator.gpu;
    const prog=(p)=>{if(p&&p.status==='progress'&&p.file&&/onnx/.test(p.file)){setStatus('loading','Fetching the narrator… '+Math.round(p.progress||0)+'%')}};
    try{
      tts=await mod.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:hasGPU?'fp32':'q8',device:hasGPU?'webgpu':'wasm',progress_callback:prog});
    }catch(e){
      tts=await mod.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm',progress_callback:prog});
    }
    setStatus('ready','Narrator ready');
    return tts;
  })().catch(e=>{loading=null;setStatus('error','Narrator unavailable: '+(e&&e.message||e));throw e});
  return loading;
}
V.preload=()=>load().catch(()=>{});

function chunks(text){
  // sentences grouped to ~220 chars so the first audio starts fast
  const paras=String(text||'').replace(/\*/g,'').split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  const out=[];
  for(const p of paras){
    const sents=p.replace(/\n/g,' ').match(/[^.!?…]+[.!?…]+["”’)]?\s*|[^.!?…]+$/g)||[p];
    let cur='';
    for(const s of sents){ if((cur+s).length>220&&cur){out.push(cur.trim());cur=''} cur+=s }
    if(cur.trim())out.push(cur.trim());
  }
  return out;
}
function playBuffer(f32,rate){
  return new Promise(res=>{
    const ac=audioCtx(); const buf=ac.createBuffer(1,f32.length,rate); buf.copyToChannel(f32,0);
    const src=ac.createBufferSource(); src.buffer=buf; src.playbackRate.value=S.rate||1; src.connect(ac.destination); src.onended=()=>res(); current=src; src.start();
  });
}
async function run(text){
  const parts=chunks(text); playing=true; stopFlag=false; setStatus('speaking','');
  // generate ahead by one while the previous plays
  let next=null;
  const gen=(t)=>tts.generate(t,{voice:S.voice||'bm_george'});
  try{
    next=gen(parts[0]);
    for(let i=0;i<parts.length;i++){
      if(stopFlag)break;
      const audio=await next;
      next= i+1<parts.length ? gen(parts[i+1]) : null;
      if(stopFlag)break;
      await playBuffer(audio.audio,audio.sampling_rate);
    }
  }catch(e){ setStatus('error','Narration failed: '+(e&&e.message||e)) }
  playing=false; current=null; if(status==='speaking')setStatus('ready','');
}
/* device-voice fallback */
function deviceSpeak(text){
  const synth=window.speechSynthesis; if(!synth)return Promise.resolve();
  return new Promise(res=>{
    const vs=synth.getVoices(); const v=vs.find(v=>/en[-_]GB/i.test(v.lang)&&/Daniel|Serena|Oliver|Arthur/.test(v.name))||vs.find(v=>/en[-_]GB/i.test(v.lang))||null;
    const parts=chunks(text); let i=0; playing=true; stopFlag=false; setStatus('speaking','device voice');
    const next=()=>{ if(stopFlag||i>=parts.length){playing=false;setStatus(tts?'ready':'idle','');return res()}
      const u=new SpeechSynthesisUtterance(parts[i++]); if(v)u.voice=v; u.lang='en-GB'; u.rate=0.95*(S.rate||1); u.onend=()=>setTimeout(next,200); u.onerror=()=>{playing=false;res()}; synth.speak(u) };
    synth.cancel(); next();
  });
}
V.speak=async(text)=>{
  V.stop(); V.unlock();
  if(tts)return run(text);
  // not loaded yet: start loading, read with the device voice this time
  load().catch(()=>{});
  return deviceSpeak(text);
};
V.stop=()=>{stopFlag=true; try{if(current)current.stop()}catch(e){} try{window.speechSynthesis&&window.speechSynthesis.cancel()}catch(e){} playing=false; if(status==='speaking')setStatus(tts?'ready':'idle','')};
window.HOG.voice=V;
})();
