/* Portraits v3: flat, hand-drawn pixel style. Shapes are laid out at 256px with flat cel tones only (no gradients),
   sampled down to 64px without smoothing, cleaned of stray pixels, then the face is drawn directly on the 64px grid
   (eyes, brows, nose, mouth, glasses) and a darker outline is run round the figure. Poses: three-quarter left,
   front, three-quarter right. Deterministic per name; cached. */
(function(){
'use strict';
const S=64, B=256, Q=B/S;
const cache=new Map();
function hash(s){let h=2166136261;for(const c of String(s||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){let s=seed||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%100000)/100000}}
function hexToRgb(h){const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255]}
function rgbToHsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return [h,s,l]}
function hslToRgb(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r,g,b;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)]}
// tone: k<0 darker and cooler (toward violet), k>0 lighter and warmer
function toneRGB(hex,k){const [h,s,l]=rgbToHsl(hexToRgb(hex));const H=k<0?h+(((255-h+540)%360)-180)*(-k)*0.16:h+(((45-h+540)%360)-180)*k*0.12;
  return hslToRgb(H,s+(k<0?-k*0.12:-k*0.12),l+k*0.24)}
const tone=(hex,k)=>'rgb('+toneRGB(hex,k).join(',')+')';
const mixRGB=(a,b,t)=>[Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)];

const SKINS=['#f4d9c3','#eecdb0','#e0b691','#d0a17b','#c48f6b','#a5714c','#865636','#5b3a26'];
const HAIR={black:'#2a2630',dark_brown:'#4a3322',brown:'#6e4b2e',light_brown:'#916944',auburn:'#8f3d25',ginger:'#c45c2a',blond:'#d8b45f',platinum:'#ece0b9',grey:'#9d9a95',white:'#e8e4db'};
const EYES={brown:'#6a4424',dark_brown:'#3b2516',hazel:'#7d6b32',green:'#3f7a48',blue:'#3b6db0',grey:'#7a8b9a'};
const HOUSE={Gryffindor:['#8b1e24','#d9a94b'],Slytherin:['#1f5a32','#c0c4c8'],Ravenclaw:['#22427a','#b07a30'],Hufflepuff:['#d9b23a','#2a2a2a']};
const F_NAMES=/^(cordelia|ida|wren|ottilie|minerva|hermione|ginny|luna|molly|dilys|saffron|clemency|imogen|euphemia|maeve|pibbit|philippa|augusta|rose|lily|alice|mary|sarah|emma|olivia|sophie|grace|anna|kate|helen|jane|ruth|agnes|poppy|pomona|sybill|rolanda|dolores|narcissa|bellatrix|andromeda|fleur|cho|lavender|parvati|padma|hannah|susan|katie|angelina|alicia|ottoline|beatrix|harriet|eleanor|edith|mildred|maud|nell)/i;
function inferGender(name,sp){
  const g=String(sp.gender||'').toLowerCase();if(/^(f|female|girl|woman)$/.test(g))return 'f';if(/^(m|male|boy|man)$/.test(g))return 'm';
  const n=String(name||'').trim();
  if(/^(mrs|miss|ms|madam|madame|dame|lady|mother|aunt|grandma|granny)\b/i.test(n))return 'f';
  if(/^(mr|sir|lord|master|father|uncle|grandpa|grandad)\b/i.test(n))return 'm';
  const first=n.replace(/^(professor|prof\.?|dr\.?|the)\s+/i,'').split(/\s+/)[0]||'';
  if(F_NAMES.test(first))return 'f';
  if(/(a|ia|ie|elle|ette|ine|lyn|een)$/i.test(first)&&!/^(luca|joshua|ezra|elijah|noah|nikita|sasha|andrea|ira|jonah|micah|barnaby)$/i.test(first))return 'f';
  return 'm';
}

function render(sp,name){
  const R=rng(hash(name+'|'+(sp.role||'')));
  const g=inferGender(name,sp), age=sp.age||'adult', old=age==='old', kid=age==='child', teen=age==='teen';
  const ghost=sp.house==='ghost'||sp.robes==='ghost', painting=sp.house==='portrait';
  const feats=new Set([].concat(sp.extra&&sp.extra!=='none'?String(sp.extra).split(/[,\s]+/):[],Array.isArray(sp.features)?sp.features:[]));
  if(/one ear|missing ear|lost an ear/i.test(sp.role||''))feats.add('missing_ear');
  const pose=sp.pose||(['left','front','right','left','right','front','left','right'][Math.floor(R()*8)]);
  const yaw=pose==='left'?-0.4:pose==='right'?0.4:0, dir=Math.sign(yaw);
  const cv=document.createElement('canvas');cv.width=B;cv.height=B;const c=cv.getContext('2d');
  const P=(pts)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath()};
  const ell=(x,y,rx,ry,rot)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,Math.PI*2)};
  const skinIdx=sp.skin_hq!=null?sp.skin_hq:(sp.skin==null?2:[1,2,4,6,7][Math.max(0,Math.min(4,sp.skin|0))]);
  const SKN=SKINS[Math.max(0,Math.min(7,skinIdx))];
  const SK={l:tone(SKN,0.12),m:tone(SKN,0),s:tone(SKN,-0.26),d:tone(SKN,-0.5)};
  let hairHex=HAIR[sp.hair_colour]||(old?HAIR.grey:HAIR.dark_brown);if(old&&(sp.hair_colour==='black'||sp.hair_colour==='dark_brown'))hairHex='#5f5a55';
  const HR={d:tone(hairHex,-0.45),s:tone(hairHex,-0.2),m:tone(hairHex,0.05),l:tone(hairHex,0.32)};
  const ek=Object.keys(EYES);const eyeHex=EYES[sp.eye_colour]||EYES[ek[Math.floor(R()*ek.length)]];
  const [h1,h2]=HOUSE[sp.house]||[null,null];
  const bg=ghost?'#2a344e':painting?'#3c3024':'#5b6047';
  c.fillStyle=bg;c.fillRect(0,0,B,B);
  // ---- geometry (head as a turned ellipsoid)
  const scale=kid?0.9:teen?0.95:1;
  const hx=128-yaw*8, hy=kid?112:106;
  const rxH=(g==='f'?46:50)*scale, ryH=(g==='f'?58:61)*scale*(kid?0.96:1);
  const jawW=sp.face==='square'?0.86:sp.face==='heart'?0.62:sp.face==='long'?0.72:sp.face==='round'?0.82:(g==='f'?0.7:0.78)+(R()-.5)*0.08;
  const proj=(th,ph)=>{const a=th+yaw;return [hx+rxH*Math.sin(a)*Math.cos(ph),hy+ryH*Math.sin(ph),Math.cos(a)*Math.cos(ph)]};
  const outline=[];
  for(let i=0;i<=72;i++){const t=i/72*Math.PI*2;const st=Math.sin(t),ct=Math.cos(t);let x=hx+rxH*ct,y=hy+ryH*st;
    if(st>0){const k=1-(1-jawW)*Math.pow(st,1.6);x=hx+rxH*ct*k+Math.sin(yaw)*rxH*0.4*Math.pow(st,2.2);
      if(yaw!==0&&Math.sign(ct)===dir&&st>0.12&&st<0.7)x-=dir*rxH*0.07*Math.sin((st-0.12)/0.58*Math.PI)}
    outline.push([x,y])}
  const facePath=()=>P(outline);
  const eyeL=proj(-0.4,0.05), eyeR=proj(0.4,0.05);
  const noseTip=proj(0,0.3);noseTip[0]+=Math.sin(yaw)*rxH*0.24;
  const mouth=proj(0,0.53);mouth[0]+=Math.sin(yaw)*rxH*0.12;
  // ---- hair helpers (flat, three tones)
  const style=sp.hair_style||'short';
  const lit=(x,y)=>-(x-hx)/(rxH*1.4)-(y-hy)/(ryH*2.2);
  const hairTone=(x,y,extra)=>{const v=lit(x,y)*1.3+(extra||0);return v<-0.3?HR.d:v<0.12?HR.s:v<0.55?HR.m:HR.l};
  const lock=(x0,y0,cx1,cy1,x1,y1,w0,w1,fill,edge)=>{const N=12,pts=[],pts2=[];for(let i=0;i<=N;i++){const t=i/N,u=1-t;const x=u*u*x0+2*u*t*cx1+t*t*x1,y=u*u*y0+2*u*t*cy1+t*t*y1;
      const dx=2*u*(cx1-x0)+2*t*(x1-cx1),dy=2*u*(cy1-y0)+2*t*(y1-cy1),l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,w=(w0+(w1-w0)*t)/2;
      pts.push([x+nx*w,y+ny*w]);pts2.push([x-nx*w,y-ny*w])}
    P(pts.concat(pts2.reverse()));c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=HR.d;c.lineWidth=3;c.stroke()}};
  const longLen=g==='f'?ryH*2.05:ryH*1.5;
  if(style==='long'||(style==='curly'&&g==='f')||style==='bob'||style==='plaits'){
    const back=style==='bob'?ryH*1.15:style==='plaits'?ryH*0.8:longLen;
    c.fillStyle=HR.d;P([[hx-rxH*1.16,hy-ryH*0.3],[hx+rxH*1.16,hy-ryH*0.3],[hx+rxH*1.26,hy+back],[hx-rxH*1.26,hy+back]]);c.fill();
    ell(hx,hy-ryH*0.2,rxH*1.16,ryH*0.95);c.fill();
  }
  // ---- clothes (flat bands)
  const robes=sp.robes||(h1?'school_robes':'muggle_clothes');
  const pick=(a)=>a[Math.floor(R()*a.length)];
  let cloth='#2a2630',trim=null,inner=null,collar='crew';
  if(robes==='school_robes'){cloth='#26222c';trim=h1;inner='#62636b';collar='tie'}
  else if(robes==='teacher_robes'){cloth=pick(['#442747','#253c2f','#2c2f4d','#452b21']);trim='#c09a4e';collar='high'}
  else if(robes==='muggle_clothes'){cloth=pick(['#384c73','#42603f','#712f33','#8e6e32','#5a5a63','#4f3e60']);collar=g==='f'?pick(['scoop','crew','shirt']):pick(['crew','shirt','crew'])}
  else if(robes==='shopkeeper'){cloth=pick(['#503221','#31503b','#5f2d3e','#3e344b']);inner='#e8dfcd';collar='waistcoat'}
  else if(robes==='ministry_robes'){cloth='#292e4e';trim='#c2c6d2';collar='high'}
  else if(robes==='winter_cloak'){cloth='#4e4e58';trim='#c9a24a';collar='fur'}
  else if(robes==='quidditch_robes'){cloth=h1||'#8b1e24';trim=h2||'#d9a94b';collar='vneck'}
  else if(robes==='dress_robes'){cloth=pick(['#21402e','#252c50','#512133']);trim='#c9a24a';collar='high'}
  else if(robes==='ghost'){cloth='#8aa0c0';collar='crew'}
  const shY=hy+ryH*1.2, sx=hx-yaw*6, sw=g==='f'?94:106;
  const torso=[[sx-sw*0.42,shY-4],[sx+sw*0.42,shY-4],[sx+sw*0.95,shY+26],[sx+sw*1.25,B+4],[sx-sw*1.25,B+4],[sx-sw*0.95,shY+26]];
  const nw=(g==='f'?18:22)*scale, nTop=hy+ryH*0.6, ncx=hx+Math.sin(yaw)*rxH*0.15;
  P([[ncx-nw,nTop],[ncx+nw,nTop],[ncx+nw*1.08,shY+14],[ncx-nw*1.08,shY+14]]);c.fillStyle=SK.s;c.fill();
  P([[ncx-nw,nTop+16],[ncx-nw*0.15,nTop+16],[ncx-nw*0.05,shY+14],[ncx-nw*1.08,shY+14]]);c.fillStyle=SK.m;c.fill();
  ell(ncx+dir*6,nTop+10,nw*1.25,14);c.fillStyle=SK.d;c.fill();
  P(torso);c.fillStyle=tone(cloth,0);c.fill();
  c.save();P(torso);c.clip();
  P([[sx+nw*0.5,shY-4],[sx+sw*0.5,shY-4],[sx+sw*1.0,shY+26],[sx+sw*1.3,B+4],[sx+sw*0.32,B+4]]);c.fillStyle=tone(cloth,-0.32);c.fill();
  ell(sx-sw*0.86,shY+30,sw*0.42,24,-0.25);c.fillStyle=tone(cloth,0.2);c.fill();
  c.strokeStyle=tone(cloth,-0.38);c.lineWidth=4;c.beginPath();c.moveTo(sx-sw*0.5,shY+40);c.quadraticCurveTo(sx-sw*0.64,shY+70,sx-sw*0.58,B);c.stroke();
  c.beginPath();c.moveTo(sx+sw*0.62,shY+36);c.quadraticCurveTo(sx+sw*0.74,shY+70,sx+sw*0.7,B);c.stroke();
  if(robes==='muggle_clothes'){c.fillStyle=tone(cloth,-0.12);for(let x=0;x<B;x+=8)c.fillRect(x,shY+8,4,B)}
  c.restore();
  const V=(depth,width,fill)=>{P([[sx-width,shY-6],[sx+width,shY-6],[sx+3,shY+depth],[sx-3,shY+depth]]);c.fillStyle=fill;c.fill()};
  if(collar==='tie'){
    V(72,34,trim||'#8b1e24');V(68,28,tone(inner,0));c.save();P([[sx,shY-6],[sx+28,shY-6],[sx+3,shY+68]]);c.clip();c.fillStyle=tone(inner,-0.3);c.fillRect(0,0,B,B);c.restore();
    V(40,19,'#ece6da');P([[sx-15,shY-6],[sx-2,shY+10],[sx-17,shY+14]]);c.fillStyle='#f6f1e8';c.fill();P([[sx+15,shY-6],[sx+2,shY+10],[sx+17,shY+14]]);c.fillStyle='#cfc7b9';c.fill();
    P([[sx-6,shY+6],[sx+6,shY+6],[sx+9,shY+64],[sx,shY+72],[sx-9,shY+64]]);c.save();c.clip();
    for(let y=shY;y<shY+80;y+=12){c.fillStyle=h1||'#8b1e24';c.fillRect(sx-12,y,24,8);c.fillStyle=h2||'#d9a94b';c.fillRect(sx-12,y+8,24,4)}
    c.fillStyle=tone(h1||'#8b1e24',-0.35);c.fillRect(sx+2,shY,12,80);c.restore();
  } else if(collar==='crew'||collar==='scoop'){
    const d=collar==='scoop'?22:12;c.fillStyle=SK.s;c.beginPath();c.moveTo(sx-nw-6,shY-6);c.quadraticCurveTo(sx,shY+d*1.6,sx+nw+6,shY-6);c.closePath();c.fill();
    c.strokeStyle=tone(cloth,0.18);c.lineWidth=8;c.beginPath();c.moveTo(sx-nw-8,shY-6);c.quadraticCurveTo(sx,shY+d*1.7,sx+nw+8,shY-6);c.stroke();
  } else if(collar==='shirt'){
    V(36,16,'#e8e0d0');P([[sx-22,shY-8],[sx-2,shY+12],[sx-24,shY+18]]);c.fillStyle='#f4efe6';c.fill();P([[sx+22,shY-8],[sx+2,shY+12],[sx+24,shY+18]]);c.fillStyle='#cfc7b9';c.fill();
  } else if(collar==='vneck'){V(40,20,SK.s);c.strokeStyle=trim;c.lineWidth=8;c.beginPath();c.moveTo(sx-22,shY-6);c.lineTo(sx,shY+40);c.lineTo(sx+22,shY-6);c.stroke()}
  else if(collar==='waistcoat'){
    V(80,30,tone(cloth,-0.3));V(60,20,inner);c.save();P([[sx,shY-6],[sx+20,shY-6],[sx+3,shY+60]]);c.clip();c.fillStyle='#cfc7b9';c.fillRect(0,0,B,B);c.restore();
    P([[sx-20,shY-8],[sx-2,shY+12],[sx-22,shY+18]]);c.fillStyle='#f6f1e8';c.fill();P([[sx+20,shY-8],[sx+2,shY+12],[sx+22,shY+18]]);c.fillStyle='#cfc7b9';c.fill();
    const tie=pick(['#8a2a2a','#2a4a6a','#6a5a2a','#4a2a5a']);P([[sx-6,shY+8],[sx+6,shY+8],[sx+9,shY+52],[sx,shY+60],[sx-9,shY+52]]);c.fillStyle=tie;c.fill();
    for(let i=0;i<3;i++){c.fillStyle='#d4ac52';c.fillRect(sx-16,shY+64+i*16,6,6)}
  } else if(collar==='high'){
    P([[sx-nw-14,shY-18],[sx+nw+14,shY-18],[sx+nw+20,shY+8],[sx-nw-20,shY+8]]);c.fillStyle=tone(cloth,0.12);c.fill();
    P([[sx+4,shY-18],[sx+nw+14,shY-18],[sx+nw+20,shY+8],[sx+4,shY+8]]);c.fillStyle=tone(cloth,-0.3);c.fill();
    if(trim){c.fillStyle=trim;c.fillRect(sx-nw-20,shY+6,(nw+20)*2,6);c.fillRect(sx-6,shY+14,12,12);c.fillStyle='#fff3cc';c.fillRect(sx-6,shY+14,4,4)}
  } else if(collar==='fur'){
    for(let i=0;i<34;i++){const a=i/34*Math.PI;const x=sx-Math.cos(a)*(sw*0.82),y=shY+6-Math.sin(a)*6+((i*7)%5)-2;ell(x,y+8,16,13);c.fillStyle=tone('#8b7a66',x<sx?(i%3?0.12:0.25):(i%3?-0.25:-0.1));c.fill()}
    if(trim){c.fillStyle=trim;c.fillRect(sx-8,shY+26,16,16)}
  }
  // ---- ears
  const hideEars=style==='long'||style==='bob'||(style==='curly'&&g==='f')||style==='plaits';
  for(const side of[-1,1]){
    if(hideEars||Math.cos(side*1.45+yaw)<=0.1)continue;if(side<0&&feats.has('missing_ear'))continue;
    const ep=proj(side*1.45,0.08);const ew=11*Math.max(.55,Math.abs(Math.sin(side*1.45+yaw)));
    ell(ep[0]+side*4,ep[1]+6,ew,18,side*0.15);c.fillStyle=side<0?SK.m:SK.s;c.fill();
    ell(ep[0]+side*5,ep[1]+7,ew*0.4,9,side*0.15);c.fillStyle=SK.d;c.fill();
    if(feats.has('earring')){c.fillStyle='#e0bc5c';c.fillRect(ep[0]+side*4-3,ep[1]+24,6,6)}
  }
  // ---- face: shadow, lit mass, highlight (hard-edged cel bands)
  facePath();c.fillStyle=SK.s;c.fill();
  c.save();facePath();c.clip();
  ell(hx-rxH*0.14-yaw*rxH*0.12,hy-ryH*0.1,rxH*0.9,ryH*0.93);c.fillStyle=SK.m;c.fill();
  ell(hx-rxH*0.42-yaw*rxH*0.1,hy-ryH*0.36,rxH*0.36,ryH*0.3,-0.2);c.fillStyle=SK.l;c.fill();
  // cheekbone plane and jaw shade on the lit side
  ell(hx-rxH*0.5-yaw*rxH*0.15,hy+ryH*0.28,rxH*0.22,ryH*0.14);c.fillStyle=SK.l;c.fill();
  c.restore();
  // ---- beard (flat locks)
  if(feats.has('beard')){
    const bp=[];for(let i=8;i<=28;i++){const p=outline[i];bp.push([p[0],p[1]+(old?12:5)])}
    const top=[proj(0.95,0.22),proj(0.42,0.4),[mouth[0],mouth[1]-6],proj(-0.42,0.4),proj(-0.95,0.22)];
    c.save();P(bp.concat(top));c.fillStyle=HR.s;c.fill();c.clip();
    for(let i=0;i<30;i++){const x0=hx-rxH+R()*rxH*2,y0=mouth[1]-8+R()*28;lock(x0,y0,x0+(R()-.5)*8,y0+20,x0+(x0-hx)*0.15,y0+42+(old?18:6),10,2,hairTone(x0,y0,(R()-.5)*0.5))}
    c.restore();
  }
  if(feats.has('moustache')||feats.has('beard')){for(const s of[-1,1])lock(mouth[0]+s*2,mouth[1]-10,mouth[0]+s*20,mouth[1]-10,mouth[0]+s*26,mouth[1]+2,10,3,hairTone(mouth[0]+s*10,mouth[1],s<0?0.3:-0.2))}
  // ---- front hair
  const crown=[hx+Math.sin(yaw)*rxH*0.35,hy-ryH*1.02];
  const partX=hx+Math.sin(yaw)*rxH*0.5+(R()<.5?-1:1)*rxH*0.28;
  const fr={messy:0.08,swept:0.06,bob:0.16,short:0.02,parted:0.0,spiky:-0.02,long:0.02,curly:0.0,ponytail:-0.02,bun:-0.02,plaits:0.0,buzz:-0.02}[style]||0;
  const hairline=(t)=>{const recede=old&&g==='m'?0.1:0;const a=Math.min(1,Math.abs(t)/1.35);return proj(t,-0.56+recede+fr*(1-a)+(g==='m'&&!old?0.62:0.48)*a*a*a)};
  const grow={curly:16,buzz:3,spiky:10,messy:11,short:7,parted:8,swept:9,long:10,bob:11,ponytail:6,bun:6,plaits:7}[style]||8;
  const capPath=()=>{const pts=[];for(let i=0;i<=40;i++){const a=Math.PI+i/40*Math.PI;const top=Math.max(0,-Math.sin(a));pts.push([hx+(rxH+grow*0.8)*Math.cos(a)+Math.sin(yaw)*8*top,hy-ryH*0.1+(ryH+grow*1.25)*Math.sin(a)-top*top*grow*0.4])}
    for(let i=0;i<=20;i++){const t=1.5-i/20*3;const p=hairline(t);pts.push([p[0],Math.min(p[1],hy-4)])}return pts};
  if(style!=='bald'){
    // contact shadow on the forehead, under the hair
    c.save();facePath();c.clip();c.strokeStyle=SK.s;c.lineWidth=10;c.beginPath();for(let i=0;i<=20;i++){const t=-1.3+i/20*2.6;const p=hairline(t);i?c.lineTo(p[0],p[1]+4):c.moveTo(p[0],p[1]+4)}c.stroke();c.restore();
    P(capPath());c.fillStyle=HR.s;c.fill();
    c.save();P(capPath());c.clip();ell(hx-rxH*0.35-yaw*10,hy-ryH*0.85,rxH*0.75,ryH*0.42,-0.3);c.fillStyle=HR.m;c.fill();c.restore();
    if(style==='buzz'){c.save();P(capPath());c.clip();for(let i=0;i<140;i++){const x=hx-rxH+R()*rxH*2,y=hy-ryH*1.1+R()*ryH*0.8;c.fillStyle=hairTone(x,y,0.15);c.fillRect(x&~3,y&~3,4,4)}c.restore()}
    else if(style==='curly'){
      const blobs=[];for(let i=0;i<70;i++){const a=Math.PI+R()*Math.PI*1.05-0.02,rr=0.6+R()*0.45;const x=hx+(rxH+10)*Math.cos(a)*rr+Math.sin(yaw)*6,y=hy-ryH*0.15+(ryH+10)*Math.sin(a)*rr;
        if(y>hairline((x-hx)/rxH)[1]+4&&Math.abs(x-hx)<rxH*0.8)continue;blobs.push([x,y])}
      if(g==='f'||!old)for(let i=0;i<34;i++){const s=R()<.5?-1:1;blobs.push([hx+s*(rxH*(0.85+R()*0.4)),hy-ryH*0.3+R()*ryH*(g==='f'?1.5:0.6)])}
      for(const [x,y] of blobs){ell(x,y,11,10);c.fillStyle=hairTone(x,y,-0.25);c.fill();ell(x-3,y-3,5,4);c.fillStyle=hairTone(x,y,0.35);c.fill()}
    } else {
      const n=style==='spiky'?20:30;
      for(let i=0;i<n;i++){const t=-1.55+i/(n-1)*3.1;const end=hairline(t);
        let sx0=(style==='parted'||style==='swept'||style==='long'||style==='bob')?partX:crown[0], sy0=crown[1]+(R()-.5)*8;
        let ex=end[0],ey=Math.min(end[1],hy-4)+4,cxp=(sx0+ex)/2+(ex-hx)*0.35,cyp=(sy0+ey)/2-14;
        if(style==='spiky'){ex=sx0+(ex-sx0)*0.7;ey=crown[1]-16-R()*20+(Math.abs(t)*14);cxp=(sx0+ex)/2;cyp=(sy0+ey)/2}
        if(style==='messy'){ex+=(R()-.5)*14;ey+=R()*10-2}
        if(style==='swept'&&ex<partX){ey+=(partX-ex)*0.25}
        if((style==='parted'||style==='short')&&Math.abs(t)<0.9){ey-=6;cxp+=(ex<partX?-8:8)}
        if(style==='ponytail'||style==='bun'){ey=Math.min(ey,hy-ryH*0.4)}
        lock(sx0,sy0,cxp,cyp,ex,ey,16,4,hairTone(ex,ey,(R()-.5)*0.4),i%3===0)}
      if(style==='messy'||style==='swept'){for(let i=0;i<8;i++){const t=-0.85+i/7*1.7;const p=hairline(t);const len=style==='swept'?10+(partX-p[0])*0.18:6+R()*10;
        lock(p[0],p[1]-12,p[0]+(style==='swept'?8:(R()-.5)*6),p[1]-2,p[0]+(style==='swept'?14:(R()-.5)*8),p[1]+len,12,3,hairTone(p[0],p[1],(R()-.5)*0.3),true)}}
      if(style==='long'||style==='bob'){const len=style==='bob'?ryH*1.0:longLen*0.9;
        for(const s of[-1,1])for(let i=0;i<9;i++){const x0=hx+s*(rxH*(0.62+i*0.05))+Math.sin(yaw)*6,y0=hy-ryH*0.5+i*2;const x1=hx+s*(rxH*(1.05+i*0.04))+(R()-.5)*8,y1=hy+len*(0.72+R()*0.28)-(style==='bob'?0:i*2);
          lock(x0,y0,x1+s*6,(y0+y1)/2,x1-(style==='bob'?s*12:0),y1,18,5,hairTone(x1,(y0+y1)/2,(R()-.5)*0.4-(s>0?0.25:0)),i%2===0)}}
      if(style==='plaits'){for(const s of[-1,1]){const x=hx+s*rxH*1.02;for(let i=0;i<9;i++){const y=hy-4+i*14;ell(x+(i%2?3:-3),y,10,9,(i%2?0.5:-0.5));c.fillStyle=i%2?HR.m:HR.s;c.fill()}c.fillStyle=h1||'#8b1e24';c.fillRect(x-6,hy+122,12,8)}}
      if(style==='bun'){const bx=crown[0]-Math.sin(yaw)*10,by=crown[1]-12;ell(bx,by,22,18);c.fillStyle=HR.s;c.fill();ell(bx-6,by-5,11,8);c.fillStyle=HR.m;c.fill();c.strokeStyle=HR.d;c.lineWidth=4;c.beginPath();c.arc(bx,by,12,0.3,2.6);c.stroke()}
      if(style==='ponytail'){const s=yaw>0?-1:1;const bx=hx+s*rxH*1.0;for(let i=0;i<7;i++)lock(bx,hy-ryH*0.6,bx+s*16,hy,bx+s*(8+R()*10),hy+ryH*0.9+R()*20,16,4,i%2?HR.s:HR.m,i===0);c.fillStyle='#8b2a2a';c.fillRect(bx-6,hy-ryH*0.6-4,12,8)}
      // highlight strands, hard and bright
      c.save();P(capPath());c.clip();c.strokeStyle=HR.l;c.lineWidth=4;
      for(let i=0;i<5;i++){const t=-1.0+i*0.22;const p=proj(t-yaw*0.3,-0.74);c.beginPath();c.moveTo(p[0]-6,p[1]-8);c.quadraticCurveTo(p[0],p[1]-2,p[0]+4,p[1]+8);c.stroke()}c.restore();
    }
  } else if(old){
    for(const s of[-1,1]){for(let i=0;i<6;i++){const p=proj(s*(1.2+i*0.03),-0.2+i*0.05);lock(p[0],p[1],p[0]+s*6,p[1]+8,p[0]+s*4,p[1]+18,12,4,i%2?HR.m:HR.s)}}
    ell(hx-rxH*0.35,hy-ryH*0.75,12,7,-0.4);c.fillStyle=SK.l;c.fill();
  }
  // ---- hats (flat)
  const hd=sp.head||'none';const hl=hairline(0);const brimY=Math.min(hl[1]-2,hy-ryH*0.55);
  if(hd==='pointed_hat'){const HC='#2c2637';P([[hx-rxH*1.55,brimY+6],[hx+rxH*1.55,brimY+6],[hx+rxH*1.3,brimY-6],[hx-rxH*1.3,brimY-6]]);c.fillStyle=tone(HC,-0.15);c.fill();
    P([[hx-rxH*0.95,brimY-2],[hx+rxH*0.95,brimY-2],[hx+rxH*0.2,brimY-120],[hx+rxH*0.9,brimY-150],[hx-rxH*0.1,brimY-118]]);c.fillStyle=tone(HC,0.05);c.fill();
    P([[hx+rxH*0.1,brimY-2],[hx+rxH*0.95,brimY-2],[hx+rxH*0.2,brimY-120]]);c.fillStyle=tone(HC,-0.3);c.fill();
    c.fillStyle=h1||'#6a4a2a';c.fillRect(hx-rxH*0.95,brimY-16,rxH*1.9,12)}
  if(hd==='bowler'){c.fillStyle='#26242c';ell(hx,brimY+2,rxH*1.35,10);c.fill();ell(hx,brimY-22,rxH*0.98,30);c.fill();c.fillRect(hx-rxH*0.98,brimY-22,rxH*1.96,24);c.fillStyle='#3e3b46';ell(hx-rxH*0.4,brimY-34,16,8);c.fill()}
  if(hd==='winter_hat'){const a=h1||'#8b1e24',b2=h2||'#d9a94b';
    c.save();c.beginPath();c.rect(hx-rxH*1.12,brimY-20,rxH*2.24,28);c.ellipse(hx,brimY-20,rxH*1.12,40,0,Math.PI,Math.PI*2);c.clip();
    for(let y=brimY-72;y<brimY+12;y+=12){c.fillStyle=((y/12)|0)%2?a:b2;c.fillRect(0,y,B,12)}c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(hx+8,0,B,B);c.restore();
    ell(hx,brimY-64,14,14);c.fillStyle=b2;c.fill()}
  if(hd==='bonnet'){c.fillStyle='#ece8df';ell(hx,brimY-6,rxH*1.05,30);c.fill();c.fillRect(hx-rxH*1.05,brimY-6,rxH*2.1,12);c.fillStyle='#c8c0b4';c.fillRect(hx+4,brimY-36,rxH*1.05,46);c.fillStyle='#c23a3a';c.fillRect(hx-4,brimY-28,8,20);c.fillRect(hx-10,brimY-22,20,8)}
  if(hd==='cavalier_hat'){c.fillStyle='#3a2a1e';ell(hx,brimY,rxH*1.9,14,-0.08);c.fill();ell(hx,brimY-22,rxH,28);c.fill();c.strokeStyle='#efe6d2';c.lineWidth=10;c.beginPath();c.moveTo(hx+rxH*0.4,brimY-20);c.quadraticCurveTo(hx+rxH*1.6,brimY-80,hx+rxH*1.9,brimY-10);c.stroke()}
  if(painting){c.lineWidth=24;c.strokeStyle='#b8902e';c.strokeRect(12,12,B-24,B-24);c.lineWidth=8;c.strokeStyle='#7a5a1a';c.strokeRect(24,24,B-48,B-48);c.strokeStyle='#e8c870';c.lineWidth=4;c.strokeRect(4,4,B-8,B-8)}

  // ===== sample down to 64 without smoothing
  const out=document.createElement('canvas');out.width=S;out.height=S;const oc=out.getContext('2d');
  const src=c.getImageData(0,0,B,B).data, id=oc.createImageData(S,S), d=id.data;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){ // majority of the 4x4 block, so thin shapes survive and edges stay hard
    const counts=new Map();let best=null,bc=0;
    for(let yy=0;yy<Q;yy++)for(let xx=0;xx<Q;xx++){const i=((y*Q+yy)*B+(x*Q+xx))*4;const k=(src[i]<<16)|(src[i+1]<<8)|src[i+2];const n=(counts.get(k)||0)+1;counts.set(k,n);if(n>bc){bc=n;best=k}}
    const o=(y*S+x)*4;d[o]=best>>16&255;d[o+1]=best>>8&255;d[o+2]=best&255;d[o+3]=255}
  // merge near-identical colours left by anti-aliased edges, then remove isolated pixels
  const key=(i)=>(d[i]<<16)|(d[i+1]<<8)|d[i+2];
  const freq=new Map();for(let i=0;i<d.length;i+=4){const k=key(i);freq.set(k,(freq.get(k)||0)+1)}
  const pal=[...freq.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]);const keep=pal.slice(0,34);
  const near=(k)=>{let bk=keep[0],bd=1e9;for(const q of keep){const dr=(k>>16&255)-(q>>16&255),dg=(k>>8&255)-(q>>8&255),db=(k&255)-(q&255),dd=dr*dr+dg*dg+db*db;if(dd<bd){bd=dd;bk=q}}return bk};
  for(let i=0;i<d.length;i+=4){const k=key(i);if(!keep.includes(k)){const q=near(k);d[i]=q>>16&255;d[i+1]=q>>8&255;d[i+2]=q&255}}
  for(let pass=0;pass<2;pass++){const copy=d.slice();for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){const i=(y*S+x)*4;const k=key(i);
    const nb=[i-4,i+4,i-S*4,i+S*4].map(j=>(copy[j]<<16)|(copy[j+1]<<8)|copy[j+2]);if(nb.every(q=>q!==k)){const m=new Map();nb.forEach(q=>m.set(q,(m.get(q)||0)+1));const [q,n]=[...m.entries()].sort((a,b)=>b[1]-a[1])[0];if(n>=3){d[i]=q>>16&255;d[i+1]=q>>8&255;d[i+2]=q&255}}}}
  // ===== the face, placed pixel by pixel
  const put=(x,y,rgb)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=S||y>=S)return;const o=(y*S+x)*4;d[o]=rgb[0];d[o+1]=rgb[1];d[o+2]=rgb[2]};
  const skL=toneRGB(SKN,0.12),skM=toneRGB(SKN,0),skS=toneRGB(SKN,-0.26),skD=toneRGB(SKN,-0.5);
  const lash=(hairHex===HAIR.white||hairHex===HAIR.platinum||hairHex===HAIR.grey)?[74,56,48]:mixRGB(toneRGB(hairHex,-0.6),[30,18,16],0.5);
  const white=[236,230,220],whiteS=[200,194,186],iris=hexToRgb(eyeHex),irisD=mixRGB(iris,[0,0,0],0.45),brow=toneRGB(hairHex,old&&hairHex!==HAIR.white?-0.2:-0.4);
  const eyes=[[eyeL,-1],[eyeR,1]];
  for(const [e,side] of eyes){
    const ex=Math.round(e[0]/Q), ey=Math.round(e[1]/Q), far=e[2]<0.8;
    const look=yaw>0?1:yaw<0?-1:0; // the irises turn with the head
    if(!far){ // 4 wide: sclera, iris dark, iris, sclera
      for(let i=-2;i<=1;i++)put(ex+i,ey-1,lash);
      put(ex-2,ey,look>0?white:whiteS);put(ex+1,ey,look<0?white:whiteS);put(ex-1,ey,irisD);put(ex,ey,iris);
      if(look>0){put(ex-1,ey,whiteS);put(ex,ey,irisD);put(ex+1,ey,iris)}if(look<0){put(ex-2,ey,iris);put(ex-1,ey,irisD);put(ex,ey,whiteS)}
      if(g==='f'){put(side<0?ex-3:ex+2,ey-1,lash);put(side<0?ex-3:ex+2,ey-2,lash)}
      put(ex-1,ey+1,skS);put(ex,ey+1,skS);
      for(let i=-2;i<=1;i++)put(ex+i,ey-3-(g==='f'&&(i===-1||i===0)?1:0),brow);if(g==='m'&&!kid)put(side<0?ex+1:ex-2,ey-2,brow);
    } else { // far eye, foreshortened: 3 wide
      const o=look>0?1:-1; // shift toward the turn
      for(let i=-1;i<=1;i++)put(ex+i,ey-1,lash);
      put(ex-o,ey,irisD);put(ex,ey,iris);put(ex+o,ey,whiteS);
      put(ex,ey+1,skS);
      for(let i=-1;i<=1;i++)put(ex+i,ey-3-(g==='f'&&i===0?1:0),brow);
    }
  }
  // nose: bridge light, side shadow, nostril and the shadow underneath
  const nx=Math.round(noseTip[0]/Q), ny=Math.round(noseTip[1]/Q);
  put(nx-1,ny-3,skL);put(nx-1,ny-2,skL);put(nx+1,ny-2,skS);put(nx+1,ny-1,skS);
  if(yaw!==0){put(nx+dir,ny,skS);put(nx+dir*2,ny,skD)}
  put(nx-1,ny,skL);put(nx,ny+1,skD);put(nx+1,ny+1,skS);put(nx-1,ny+1,skS);
  // mouth
  const mx=Math.round(mouth[0]/Q), my=Math.round(mouth[1]/Q)+1, mw=g==='f'?2:2+(R()<.5?1:0);
  const lipLine=g==='f'?[124,44,52]:skD, lipLow=g==='f'?mixRGB(skM,[196,92,98],0.55):skS, lipHi=g==='f'?mixRGB(skL,[236,150,150],0.4):skM;
  for(let i=-mw;i<=mw;i++)put(mx+i,my,Math.abs(i)===mw?skS:lipLine);
  if(!feats.has('beard')){for(let i=-mw+1;i<=mw-1;i++)put(mx+i,my+1,i<0?lipHi:lipLow);put(mx,my+3,skS)}
  if(old){put(nx-3,ny+1,skS);put(nx-3,ny+2,skS);put(nx+3,ny+1,skS);put(nx+3,ny+2,skS);for(let i=-2;i<=2;i++)if(i)put(Math.round(hx/Q)+i,Math.round((hy-ryH*0.45)/Q),skS)}
  if(g==='f'||kid){const bl=mixRGB(skM,[220,110,110],0.3);put(Math.round(eyeL[0]/Q)-1,Math.round(eyeL[1]/Q)+3,bl);put(Math.round(eyeL[0]/Q),Math.round(eyeL[1]/Q)+3,bl);put(Math.round(eyeR[0]/Q),Math.round(eyeR[1]/Q)+3,mixRGB(skS,[200,90,90],0.25))}
  if(feats.has('freckles')||(sp.hair_colour==='ginger'&&R()<.6)){const fr=mixRGB(skS,[150,80,50],0.35);for(const [e] of eyes){const ex=Math.round(e[0]/Q),ey=Math.round(e[1]/Q);put(ex-1,ey+2,fr);put(ex+1,ey+3,fr);put(ex,ey+4,fr)}put(nx,ny-1,fr)}
  if(feats.has('scar')){const ex=Math.round(eyeR[0]/Q),ey=Math.round(eyeR[1]/Q);put(ex+1,ey-4,[230,180,170]);put(ex+1,ey-3,[230,180,170]);put(ex+2,ey+1,[230,180,170])}
  if(feats.has('stubble')){const tint=toneRGB(hairHex,-0.3);for(let y=my-2;y<my+6;y++)for(let x=mx-7;x<=mx+7;x++){if(y>=my&&y<=my+1&&Math.abs(x-mx)<=mw)continue;if(Math.abs(x-mx)>5+(y-my+2)*0.2)continue;const o=(y*S+x)*4;const cur=[d[o],d[o+1],d[o+2]];if([skL,skM,skS].some(t=>Math.abs(t[0]-cur[0])+Math.abs(t[1]-cur[1])<24))put(x,y,mixRGB(cur,tint,0.28))}}
  if(feats.has('glasses')){const fr=old?[170,146,92]:[40,32,30];
    for(const [e] of eyes){const ex=Math.round(e[0]/Q),ey=Math.round(e[1]/Q),w=e[2]<0.8?2:3;
      for(let i=-w;i<=w-1;i++){put(ex+i,ey-2,fr);put(ex+i,ey+2,fr)}put(ex-w-1,ey-1,fr);put(ex-w-1,ey,fr);put(ex-w-1,ey+1,fr);put(ex+w,ey-1,fr);put(ex+w,ey,fr);put(ex+w,ey+1,fr);
      put(ex-w,ey-1,[255,255,255])}
    const a=Math.round(eyeL[0]/Q)+3,b=Math.round(eyeR[0]/Q)-3,yy=Math.round(eyeL[1]/Q)-1;for(let x=a;x<=b;x++)put(x,yy,fr)}
  // ===== outline: darken figure pixels that touch the background
  const bgK=(()=>{const q=hexToRgb(bg);return (q[0]<<16)|(q[1]<<8)|q[2]})();
  const isBg=(x,y)=>{if(x<0||y<0||x>=S||y>=S)return false;const o=(y*S+x)*4;return ((d[o]<<16)|(d[o+1]<<8)|d[o+2])===bgK};
  const edge=[];for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(isBg(x,y))continue;if(isBg(x-1,y)||isBg(x+1,y)||isBg(x,y-1)||isBg(x,y+1))edge.push([x,y])}
  for(const [x,y] of edge){const o=(y*S+x)*4;const dark=mixRGB([d[o],d[o+1],d[o+2]],[24,20,30],x<S/2-6?0.35:0.55);d[o]=dark[0];d[o+1]=dark[1];d[o+2]=dark[2]}
  if(ghost){for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;d[i]=l*0.7+30;d[i+1]=l*0.82+42;d[i+2]=Math.min(255,l*1.05+62)}}
  oc.putImageData(id,0,0);
  return out;
}
// match "Professor Longbottom", "Hagrid" or "Madam Pomfrey" to a hand-drawn face, only when the match is unique
const TITLES=/\b(professor|prof|madam|madame|sir|dame|headmistress|headmaster|curator|lady|lord|the)\b/g;   // Mr/Mrs stay: Mr Mallory is not Corin
const toks=n=>String(n||'').toLowerCase().replace(/[^a-z' -]/g,' ').replace(TITLES,' ').split(/[\s-]+/).filter(Boolean);
let handIdx=null,handN=-1;
function handFor(name){const H=window.HAND_PORTRAITS||{};if(H[name])return H[name];
  const keys=Object.keys(H);if(handN!==keys.length){handIdx=keys.map(k=>[toks(k),H[k]]);handN=keys.length}
  const t=toks(name);if(!t.length)return null;
  const hits=new Set(handIdx.filter(([kt])=>t.every(x=>kt.includes(x))).map(([,f])=>f));
  return hits.size===1?[...hits][0]:null}
function drawPortraitHQ(ctx,sp,opt){
  sp=sp||{};const name=sp.name||(opt&&opt.name)||'';
  const hand=handFor(name);if(hand){ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,S,S);hand(ctx);return}
  const key=name+'|'+JSON.stringify(sp);let cv=cache.get(key);
  if(!cv){try{cv=render(sp,name)}catch(e){console.error(e);return}cache.set(key,cv);if(cache.size>80)cache.delete(cache.keys().next().value)}
  ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,S,S);ctx.drawImage(cv,0,0);
}
window.drawPortraitHQ=drawPortraitHQ;window.PORTRAIT_SIZE=S;
})();
