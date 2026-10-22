/* Portraits v2. Painted as a small illustration at 256px with curves and soft light (head modelled as a turned
   ellipsoid so poses can vary: three-quarter left, front, three-quarter right), then reduced to 64px, quantised to
   a small palette and cleaned of stray pixels, for a polished pixel-art finish. Deterministic per name; cached. */
(function(){
'use strict';
const S=64, B=256;
const cache=new Map();
function hash(s){let h=2166136261;for(const c of String(s||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){let s=seed||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%100000)/100000}}
function hexToRgb(h){const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255]}
function rgbToHsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return [h,s,l]}
function hslToRgb(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r,g,b;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)]}
function tone(hex,k){const [h,s,l]=rgbToHsl(hexToRgb(hex));const H=k<0?h+(((250-h+540)%360)-180)*(-k)*0.12:h+(((45-h+540)%360)-180)*k*0.1;
  const c=hslToRgb(H,s+(k<0?-k*0.08:-k*0.1),l+k*0.22);return 'rgb('+c.join(',')+')'}
const rgba=(hex,a)=>{const c=hexToRgb(hex);return 'rgba('+c.join(',')+','+a+')'};

const SKINS=['#f4d9c3','#eecdb0','#e0b691','#d0a17b','#c48f6b','#a5714c','#865636','#5b3a26'];
const HAIR={black:'#25222a',dark_brown:'#45311f',brown:'#6b4a2e',light_brown:'#8d6743',auburn:'#8c3b24',ginger:'#c25a2a',blond:'#d6b25f',platinum:'#ece0b9',grey:'#9b9894',white:'#e7e3da'};
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
  const yaw=pose==='left'?-0.42:pose==='right'?0.42:0;
  const cv=document.createElement('canvas');cv.width=B;cv.height=B;const c=cv.getContext('2d');
  const P=(pts)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath()};
  const ell=(x,y,rx,ry,rot)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,Math.PI*2)};
  const skinIdx=sp.skin_hq!=null?sp.skin_hq:(sp.skin==null?2:[1,2,4,6,7][Math.max(0,Math.min(4,sp.skin|0))]);
  const SKN=SKINS[Math.max(0,Math.min(7,skinIdx))];
  let hairHex=HAIR[sp.hair_colour]||(old?HAIR.grey:HAIR.dark_brown);if(old&&(sp.hair_colour==='black'||sp.hair_colour==='dark_brown'))hairHex='#5d5955';
  const ek=Object.keys(EYES);const eyeHex=EYES[sp.eye_colour]||EYES[ek[Math.floor(R()*ek.length)]];
  const [h1,h2]=HOUSE[sp.house]||[null,null];
  // background
  const bg=ghost?'#28324c':painting?'#3b2f22':'#5a5f45';
  c.fillStyle=bg;c.fillRect(0,0,B,B);
  let gr=c.createRadialGradient(100,90,10,128,128,190);gr.addColorStop(0,rgba('#ffffff',0.07));gr.addColorStop(1,rgba('#000000',0.22));c.fillStyle=gr;c.fillRect(0,0,B,B);
  // head geometry: an ellipsoid turned by yaw
  const scale=kid?0.9:teen?0.95:1;
  const hx=128+yaw*-6, hy=kid?112:106;
  const rxH=(g==='f'?47:51)*scale, ryH=(g==='f'?60:63)*scale*(kid?0.96:1);
  const jawW=sp.face==='square'?0.86:sp.face==='heart'?0.62:sp.face==='long'?0.72:sp.face==='round'?0.8:(g==='f'?0.7:0.78)+(R()-.5)*0.08;
  const proj=(th,ph)=>{const a=th+yaw;return [hx+rxH*Math.sin(a)*Math.cos(ph),hy+ryH*Math.sin(ph),Math.cos(a)*Math.cos(ph)]};
  const outline=[];
  for(let i=0;i<=72;i++){const t=i/72*Math.PI*2;const st=Math.sin(t),ct=Math.cos(t);let x=hx+rxH*ct,y=hy+ryH*st;
    if(st>0){const k=1-(1-jawW)*Math.pow(st,1.6);x=hx+rxH*ct*k+Math.sin(yaw)*rxH*0.42*Math.pow(st,2.2);
      if(yaw!==0&&Math.sign(ct)===Math.sign(yaw)&&st>0.15&&st<0.75)x-=Math.sign(yaw)*rxH*0.06*Math.sin((st-0.15)/0.6*Math.PI)}
    outline.push([x,y])}
  const facePath=()=>P(outline);
  const eyePh=0.04, eyeTh=0.4;
  const eyeL=proj(-eyeTh,eyePh), eyeR=proj(eyeTh,eyePh);
  const noseBase=proj(0,0.3), noseTip=[noseBase[0]+Math.sin(yaw)*rxH*0.26,noseBase[1]];
  const mouth=proj(0,0.52), chin=proj(0,0.92);
  mouth[0]+=Math.sin(yaw)*rxH*0.14;chin[0]+=Math.sin(yaw)*rxH*0.25;
  // hair helpers
  const style=sp.hair_style||'short';
  const HL=x=>tone(hairHex,x);
  const lock=(x0,y0,cx1,cy1,x1,y1,w0,w1,fill)=>{const N=12,pts=[],pts2=[];for(let i=0;i<=N;i++){const t=i/N,u=1-t;const x=u*u*x0+2*u*t*cx1+t*t*x1,y=u*u*y0+2*u*t*cy1+t*t*y1;
      const dx=2*u*(cx1-x0)+2*t*(x1-cx1),dy=2*u*(cy1-y0)+2*t*(y1-cy1),l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,w=(w0+(w1-w0)*t)/2;
      pts.push([x+nx*w,y+ny*w]);pts2.push([x-nx*w,y-ny*w])}
    P(pts.concat(pts2.reverse()));c.fillStyle=fill;c.fill();c.strokeStyle=rgba('#140c10',0.18);c.lineWidth=1.6;c.stroke()};
  const lit=(x,y)=>-(x-hx)/(rxH*1.6)-(y-hy)/(ryH*2.2);
  const hairFill=(x,y,extra)=>HL(Math.max(-0.95,Math.min(0.85,lit(x,y)*1.25+(extra||0)-0.05)));
  const longLen=g==='f'?ryH*2.05:ryH*1.55;
  if(style==='long'||style==='curly'&&g==='f'||style==='bob'||style==='plaits'){
    const back=style==='bob'?ryH*1.15:style==='plaits'?ryH*0.8:longLen;
    c.fillStyle=HL(-0.55);P([[hx-rxH*1.18,hy-ryH*0.3],[hx+rxH*1.18,hy-ryH*0.3],[hx+rxH*1.3,hy+back],[hx-rxH*1.3,hy+back]]);c.fill();
    ell(hx,hy-ryH*0.2,rxH*1.18,ryH*0.95);c.fill();
  }
  // clothes
  const robes=sp.robes||(h1?'school_robes':'muggle_clothes');
  const pick=(a)=>a[Math.floor(R()*a.length)];
  let cloth='#26232c',trim=null,inner=null,collar='crew';
  if(robes==='school_robes'){cloth='#232029';trim=h1;inner='#5f6068';collar='tie'}
  else if(robes==='teacher_robes'){cloth=pick(['#3f2441','#23392d','#2a2d4a','#41291f']);trim='#b8904a';collar='high'}
  else if(robes==='muggle_clothes'){cloth=pick(['#34496f','#3f5b3b','#6b2f31','#8a6b30','#56565f','#4b3b5b']);collar=g==='f'?pick(['scoop','crew','shirt']):pick(['crew','shirt','crew'])}
  else if(robes==='shopkeeper'){cloth=pick(['#4b2f1f','#2f4b37','#5b2b3b','#3b3147']);inner='#e8dfcd';collar='waistcoat'}
  else if(robes==='ministry_robes'){cloth='#272b4a';trim='#bfc3cf';collar='high'}
  else if(robes==='winter_cloak'){cloth='#4b4b55';trim='#c9a24a';collar='fur'}
  else if(robes==='quidditch_robes'){cloth=h1||'#8b1e24';trim=h2||'#d9a94b';collar='vneck'}
  else if(robes==='dress_robes'){cloth=pick(['#1f3b2b','#23294b','#4b1f2f']);trim='#c9a24a';collar='high'}
  else if(robes==='ghost'){cloth='#8aa0c0';collar='crew'}
  const shY=hy+ryH*1.22, sx=hx+yaw*-10, sw=g==='f'?96:108;
  const torso=[[sx-sw*0.42,shY-4],[sx+sw*0.42,shY-4],[sx+sw*0.95,shY+26],[sx+sw*1.25,B+4],[sx-sw*1.25,B+4],[sx-sw*0.95,shY+26]];
  const nw=(g==='f'?19:23)*scale, nTop=hy+ryH*0.6, ncx=hx+Math.sin(yaw)*rxH*0.15;
  P([[ncx-nw,nTop],[ncx+nw,nTop],[ncx+nw*1.08,shY+14],[ncx-nw*1.08,shY+14]]);c.fillStyle=tone(SKN,-0.12);c.fill();
  gr=c.createLinearGradient(ncx-nw,0,ncx+nw,0);gr.addColorStop(0,rgba('#ffffff',0.12));gr.addColorStop(0.55,rgba('#000000',0));gr.addColorStop(1,rgba('#2a1020',0.28));c.fillStyle=gr;c.fill();
  ell(ncx+Math.sin(yaw)*8,nTop+18,nw*1.3,16);c.fillStyle=rgba('#3a1a1a',0.3);c.fill();
  P(torso);gr=c.createLinearGradient(sx-sw,0,sx+sw,0);gr.addColorStop(0,tone(cloth,0.35));gr.addColorStop(0.45,tone(cloth,0));gr.addColorStop(1,tone(cloth,-0.55));c.fillStyle=gr;c.fill();
  c.save();P(torso);c.clip();
  ell(sx-sw*0.95,shY+40,40,34);c.fillStyle=rgba('#ffffff',0.06);c.fill();
  c.strokeStyle=rgba('#000000',0.22);c.lineWidth=5;c.beginPath();c.moveTo(sx-sw*0.55,shY+30);c.quadraticCurveTo(sx-sw*0.7,shY+60,sx-sw*0.62,B);c.stroke();
  c.beginPath();c.moveTo(sx+sw*0.55,shY+30);c.quadraticCurveTo(sx+sw*0.72,shY+60,sx+sw*0.66,B);c.stroke();
  if(robes==='muggle_clothes'){for(let x=0;x<B;x+=8){c.fillStyle=rgba('#000000',0.06);c.fillRect(x,shY,3,B)}}
  c.restore();
  const V=(depth,width,fill)=>{P([[sx-width,shY-6],[sx+width,shY-6],[sx+3,shY+depth],[sx-3,shY+depth]]);c.fillStyle=fill;c.fill()};
  if(collar==='tie'){
    V(70,32,tone(trim||'#8b1e24',-0.1));V(66,27,tone(inner,0));V(40,19,'#ece6da');
    P([[sx-14,shY-6],[sx-2,shY+8],[sx-16,shY+12]]);c.fillStyle='#f6f1e8';c.fill();P([[sx+14,shY-6],[sx+2,shY+8],[sx+16,shY+12]]);c.fillStyle='#d9d2c5';c.fill();
    P([[sx-6,shY+6],[sx+6,shY+6],[sx+9,shY+64],[sx,shY+72],[sx-9,shY+64]]);c.save();c.clip();
    for(let y=shY;y<shY+80;y+=10){c.fillStyle=h1||'#8b1e24';c.fillRect(sx-12,y,24,6);c.fillStyle=h2||'#d9a94b';c.fillRect(sx-12,y+6,24,4)}
    c.fillStyle=rgba('#000000',0.2);c.fillRect(sx+1,shY,12,80);c.restore();
    ell(sx,shY+8,7,5);c.fillStyle=h1||'#8b1e24';c.fill();
  } else if(collar==='crew'||collar==='scoop'){
    const d=collar==='scoop'?22:12;c.fillStyle=tone(SKN,-0.1);c.beginPath();c.moveTo(sx-nw-6,shY-6);c.quadraticCurveTo(sx,shY+d*1.6,sx+nw+6,shY-6);c.closePath();c.fill();
    c.strokeStyle=tone(cloth,0.15);c.lineWidth=6;c.beginPath();c.moveTo(sx-nw-8,shY-6);c.quadraticCurveTo(sx,shY+d*1.7,sx+nw+8,shY-6);c.stroke();
  } else if(collar==='shirt'){
    V(36,16,'#e8e0d0');P([[sx-22,shY-8],[sx-2,shY+12],[sx-24,shY+18]]);c.fillStyle='#f4efe6';c.fill();P([[sx+22,shY-8],[sx+2,shY+12],[sx+24,shY+18]]);c.fillStyle='#d4ccbe';c.fill();
  } else if(collar==='vneck'){V(40,20,tone(SKN,-0.1));c.strokeStyle=trim;c.lineWidth=6;c.beginPath();c.moveTo(sx-22,shY-6);c.lineTo(sx,shY+40);c.lineTo(sx+22,shY-6);c.stroke()}
  else if(collar==='waistcoat'){
    V(80,30,tone(cloth,-0.25));V(60,20,inner);
    P([[sx-20,shY-8],[sx-2,shY+12],[sx-22,shY+18]]);c.fillStyle='#f6f1e8';c.fill();P([[sx+20,shY-8],[sx+2,shY+12],[sx+22,shY+18]]);c.fillStyle='#d4ccbe';c.fill();
    const tie=pick(['#8a2a2a','#2a4a6a','#6a5a2a','#4a2a5a']);P([[sx-5,shY+8],[sx+5,shY+8],[sx+8,shY+52],[sx,shY+60],[sx-8,shY+52]]);c.fillStyle=tie;c.fill();
    for(let i=0;i<3;i++){ell(sx-12,shY+66+i*16,3,3);c.fillStyle='#c9a24a';c.fill()}
  } else if(collar==='high'){
    P([[sx-nw-14,shY-18],[sx+nw+14,shY-18],[sx+nw+20,shY+8],[sx-nw-20,shY+8]]);gr=c.createLinearGradient(sx-40,0,sx+40,0);gr.addColorStop(0,tone(cloth,0.3));gr.addColorStop(1,tone(cloth,-0.45));c.fillStyle=gr;c.fill();
    if(trim){c.strokeStyle=trim;c.lineWidth=5;c.beginPath();c.moveTo(sx-nw-20,shY+8);c.lineTo(sx+nw+20,shY+8);c.stroke();ell(sx,shY+18,8,8);c.fillStyle=trim;c.fill();ell(sx-2,shY+16,3,3);c.fillStyle=rgba('#ffffff',0.6);c.fill()}
  } else if(collar==='fur'){
    for(let i=0;i<70;i++){const a=i/70*Math.PI;const x=sx-Math.cos(a)*(sw*0.85),y=shY+4-Math.sin(a)*6+((i*7)%5)-2;ell(x,y+10,14,12);c.fillStyle=tone('#8b7a66',(-(x-sx)/sw)*0.4+((i*3)%4-1.5)*0.08);c.fill()}
    if(trim){ell(sx,shY+30,8,8);c.fillStyle=trim;c.fill()}
  }
  // ears
  const hideEars=style==='long'||style==='bob'||(style==='curly'&&g==='f')||style==='plaits';
  for(const side of[-1,1]){
    if(hideEars||Math.cos(side*1.45+yaw)<=0.08)continue;if(side<0&&feats.has('missing_ear'))continue;
    const ep=proj(side*1.45,0.08);const ew=11*Math.max(.5,Math.abs(Math.sin(side*1.45+yaw)));
    ell(ep[0]+side*4,ep[1]+6,ew,19,side*0.15);c.fillStyle=tone(SKN,side<0?-0.02:-0.18);c.fill();
    ell(ep[0]+side*5,ep[1]+7,ew*0.45,10,side*0.15);c.fillStyle=tone(SKN,-0.35);c.fill();
    if(feats.has('earring')){ell(ep[0]+side*4,ep[1]+26,3,3);c.fillStyle='#d9b85a';c.fill()}
  }
  // face
  facePath();c.fillStyle=tone(SKN,0);c.fill();
  c.save();facePath();c.clip();
  gr=c.createRadialGradient(hx-rxH*0.55+yaw*-10,hy-ryH*0.45,6,hx-rxH*0.2,hy-ryH*0.1,rxH*1.7);gr.addColorStop(0,rgba('#fff6e8',0.38));gr.addColorStop(0.5,rgba('#ffffff',0.03));gr.addColorStop(1,rgba('#000000',0));c.fillStyle=gr;c.fillRect(0,0,B,B);
  gr=c.createLinearGradient(hx-rxH*0.1+yaw*rxH*0.3,0,hx+rxH*1.05,0);gr.addColorStop(0,rgba('#5a2a3a',0));gr.addColorStop(0.5,rgba('#4a2032',0.42));gr.addColorStop(1,rgba('#2a1028',0.72));c.fillStyle=gr;c.fillRect(0,0,B,B);
  gr=c.createLinearGradient(0,hy+ryH*0.45,0,hy+ryH);gr.addColorStop(0,rgba('#3a1a2a',0));gr.addColorStop(1,rgba('#3a1a2a',0.32));c.fillStyle=gr;c.fillRect(0,0,B,B);
  for(const e of[eyeL,eyeR]){ell(e[0],e[1]-3,17*Math.max(.55,e[2]),11);c.fillStyle=rgba('#4a2030',0.1);c.fill()}
  const ck=proj(-0.55,0.26);ell(ck[0],ck[1],16,10);c.fillStyle=rgba('#ffffff',0.1);c.fill();
  if(g==='f'||kid){for(const s of[-0.55,0.55]){const p=proj(s,0.3);ell(p[0],p[1],14*Math.max(.5,p[2]),9);c.fillStyle=rgba('#e06070',0.14);c.fill()}}
  const nb=proj(0,0.05);
  c.strokeStyle=rgba('#fff4e6',0.32);c.lineWidth=5;c.beginPath();c.moveTo(nb[0]-4+Math.sin(yaw)*8,nb[1]+4);c.lineTo(noseTip[0]-5,noseTip[1]-6);c.stroke();
  P([[nb[0]+3+Math.sin(yaw)*6,nb[1]+6],[noseTip[0]+9,noseTip[1]-2],[noseTip[0]+3,noseTip[1]+7],[noseBase[0]+2,noseBase[1]-6]]);c.fillStyle=rgba('#4a2030',0.3);c.fill();
  ell(noseTip[0]-1,noseTip[1]+1,9,7);c.fillStyle=tone(SKN,0.12);c.fill();
  ell(noseTip[0]-6,noseTip[1]+7,4,2.5);c.fillStyle=tone(SKN,-0.6);c.fill();ell(noseTip[0]+5,noseTip[1]+7,4,2.5);c.fill();
  ell(noseTip[0]+2,noseTip[1]+13,10,4);c.fillStyle=rgba('#4a2030',0.18);c.fill();
  if(yaw!==0){c.strokeStyle=tone(SKN,-0.4);c.lineWidth=3;c.beginPath();c.moveTo(nb[0]+Math.sin(yaw)*14,nb[1]+10);c.quadraticCurveTo(noseTip[0]+Math.sign(yaw)*12,noseTip[1]-2,noseTip[0]+Math.sign(yaw)*6,noseTip[1]+8);c.stroke()}
  const mw=(g==='f'?17:19)*Math.max(.7,Math.cos(yaw))*scale;
  const lipC=g==='f'?tone('#b4545c',-0.05):tone(SKN,-0.18);
  c.fillStyle=lipC;c.beginPath();c.moveTo(mouth[0]-mw,mouth[1]);c.quadraticCurveTo(mouth[0]-mw*0.4,mouth[1]-7,mouth[0],mouth[1]-4);c.quadraticCurveTo(mouth[0]+mw*0.4,mouth[1]-7,mouth[0]+mw,mouth[1]);c.closePath();c.fill();
  c.fillStyle=g==='f'?tone('#c66870',0.08):tone(SKN,-0.06);c.beginPath();c.moveTo(mouth[0]-mw*0.85,mouth[1]+1);c.quadraticCurveTo(mouth[0],mouth[1]+(g==='f'?13:9),mouth[0]+mw*0.85,mouth[1]+1);c.closePath();c.fill();
  c.strokeStyle=tone(SKN,g==='f'?-0.75:-0.6);c.lineWidth=g==='f'?3.2:2.8;c.beginPath();c.moveTo(mouth[0]-mw,mouth[1]);c.quadraticCurveTo(mouth[0],mouth[1]+2,mouth[0]+mw,mouth[1]);c.stroke();
  if(g==='f'){ell(mouth[0]-mw*0.3,mouth[1]+5,5,2.5);c.fillStyle=rgba('#ffffff',0.2);c.fill()}
  ell(chin[0],chin[1]-14,14,6);c.fillStyle=rgba('#ffffff',0.08);c.fill();
  if(old){c.strokeStyle=rgba('#4a2030',0.35);c.lineWidth=2.5;
    for(const s of[-1,1]){c.beginPath();c.moveTo(noseTip[0]+s*12,noseTip[1]+2);c.quadraticCurveTo(mouth[0]+s*(mw+6),mouth[1]-8,mouth[0]+s*(mw+4),mouth[1]+8);c.stroke()}
    for(let i=0;i<2;i++){c.beginPath();c.moveTo(hx-22,hy-ryH*0.5+i*8);c.quadraticCurveTo(hx,hy-ryH*0.53+i*8,hx+22,hy-ryH*0.5+i*8);c.stroke()}
    for(const e of[eyeL,eyeR]){c.beginPath();c.moveTo(e[0]-11,e[1]+9);c.quadraticCurveTo(e[0],e[1]+14,e[0]+11,e[1]+9);c.stroke()}}
  if(feats.has('freckles')||(sp.hair_colour==='ginger'&&R()<.6)){for(let i=0;i<26;i++){const p=proj((R()-.5)*1.2,0.12+R()*0.28);ell(p[0],p[1],2.2,2.2);c.fillStyle=rgba('#8a4a2a',0.45);c.fill()}}
  if(feats.has('scar')){const p=proj(eyeTh+0.05,-0.12);c.strokeStyle=rgba('#e8b0a8',0.9);c.lineWidth=3;c.beginPath();c.moveTo(p[0]-4,p[1]-14);c.lineTo(p[0]+4,p[1]+6);c.stroke()}
  if(feats.has('stubble')){for(let i=0;i<220;i++){const p=proj((R()-.5)*1.4,0.45+R()*0.5);if(Math.abs(p[0]-mouth[0])<mw&&Math.abs(p[1]-mouth[1])<6)continue;c.fillStyle=rgba(hairHex,0.35);c.fillRect(p[0],p[1],2,2)}}
  c.restore();
  c.save();c.strokeStyle=rgba('#2a1020',0.35);c.lineWidth=3;c.beginPath();outline.slice(0,22).forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore();
  // eyes
  const irisR=(kid?7.6:6.8);
  const drawEye=(e,side)=>{const fore=Math.max(.45,e[2]);const w=13.5*fore*(kid?1.08:1),h=6.8*(kid?1.1:1);const x=e[0],y=e[1];
    c.beginPath();c.moveTo(x-w,y);c.quadraticCurveTo(x,y-h*1.5,x+w,y);c.quadraticCurveTo(x,y+h*1.05,x-w,y);c.closePath();c.fillStyle='#e8e1d4';c.fill();
    c.save();c.clip();
    const ix=x+Math.sin(yaw)*6;ell(ix,y,irisR*fore*1.05,irisR);c.fillStyle=tone(eyeHex,0.05);c.fill();
    ell(ix,y-irisR*0.35,irisR*fore,irisR*0.7);c.fillStyle=rgba('#000000',0.3);c.fill();
    ell(ix,y,irisR*0.42*fore,irisR*0.45);c.fillStyle='#140e0e';c.fill();
    ell(ix-2.5,y-2.5,1.8,1.8);c.fillStyle='#ffffff';c.fill();
    c.fillStyle=rgba('#3a2020',0.25);c.fillRect(x-w,y-h*1.5,w*2,h*0.7);
    c.restore();
    c.strokeStyle=(hairHex===HAIR.white||hairHex===HAIR.platinum)?'#5a4030':'#2a1a14';c.lineWidth=g==='f'?4.2:3.4;
    c.beginPath();c.moveTo(x-w-1,y+1);c.quadraticCurveTo(x,y-h*1.6,x+w+1,y+1);c.stroke();
    if(g==='f'){const ox=side*(w+1);c.beginPath();c.moveTo(x+ox,y);c.lineTo(x+ox+side*5,y-5);c.stroke()}
    c.strokeStyle=rgba('#4a2030',0.14);c.lineWidth=2;c.beginPath();c.moveTo(x-w*0.6,y-h*1.25);c.quadraticCurveTo(x,y-h*2.1,x+w*0.7,y-h*1.2);c.stroke();
  };
  drawEye(eyeL,-1);drawEye(eyeR,1);
  for(const [e,side] of[[eyeL,-1],[eyeR,1]]){const fore=Math.max(.45,e[2]);const w=18*fore,x=e[0],y=e[1]-16;
    const th=g==='f'?3.4:(kid?4:5);c.fillStyle=tone(hairHex,old&&hairHex!==HAIR.white?-0.15:-0.3);
    c.beginPath();c.moveTo(x-side*w*0.95,y+3);c.quadraticCurveTo(x,y-(g==='f'?7:4),x+side*w,y+(g==='f'?4:1));c.quadraticCurveTo(x,y-(g==='f'?7:4)+th,x-side*w*0.95,y+3+th);c.closePath();c.fill()}
  // beard and moustache
  if(feats.has('beard')){
    const bp=[];for(let i=8;i<=28;i++){const p=outline[i];bp.push([p[0],p[1]+(old?10:4)])}
    const top=[proj(0.95,0.25),proj(0.4,0.42),[mouth[0],mouth[1]-6],proj(-0.4,0.42),proj(-0.95,0.25)];
    c.save();P(bp.concat(top.map(p=>[p[0],p[1]])));c.fillStyle=HL(-0.35);c.fill();c.clip();
    for(let i=0;i<46;i++){const x0=hx-rxH+R()*rxH*2,y0=mouth[1]-10+R()*30;lock(x0,y0,x0+(R()-.5)*8,y0+20,x0+(x0-hx)*0.15,y0+40+(old?18:6),7,1.5,hairFill(x0,y0,0.15*(R()-.3)))}
    c.restore();
    c.fillStyle=tone(SKN,-0.75);c.fillRect(mouth[0]-mw*0.7,mouth[1]-1,mw*1.4,3);
  }
  if(feats.has('moustache')||feats.has('beard')){for(const s of[-1,1]){lock(mouth[0]+s*2,mouth[1]-9,mouth[0]+s*mw*0.6,mouth[1]-9,mouth[0]+s*(mw+5),mouth[1]+2,8,2,hairFill(mouth[0]+s*10,mouth[1]-10,s<0?0.15:-0.1))}}
  // front hair
  const crown=[hx+Math.sin(yaw)*rxH*0.35,hy-ryH*1.02];
  const partX=hx+Math.sin(yaw)*rxH*0.5+(R()<.5?-1:1)*rxH*0.28;
  const fr={messy:0.08,swept:0.06,bob:0.16,short:0.03,parted:0.0,spiky:-0.02,long:0.02,curly:0.0,ponytail:-0.02,bun:-0.02,plaits:0.0,buzz:-0.02}[style]||0;
  const hairline=(t)=>{const recede=old&&g==='m'?0.1:0;const a=Math.min(1,Math.abs(t)/1.35);return proj(t,-0.56+recede+fr*(1-a)+(g==='m'&&!old?0.66:0.5)*a*a*a)};
  const capPath=(grow)=>{const pts=[];for(let i=0;i<=40;i++){const a=Math.PI+i/40*Math.PI;const top=Math.max(0,-Math.sin(a));pts.push([hx+(rxH+grow*0.8)*Math.cos(a)+Math.sin(yaw)*8*top,hy-ryH*0.1+(ryH+grow*1.25)*Math.sin(a)-top*top*grow*0.4])}
    for(let i=0;i<=20;i++){const t=1.5-i/20*3;const p=hairline(t);pts.push([p[0],Math.min(p[1],hy-4)])}return pts};
  if(style!=='bald'){
    const grow={curly:16,buzz:3,spiky:10,messy:11,short:7,parted:8,swept:9,long:10,bob:11,ponytail:6,bun:6,plaits:7}[style]||8;
    P(capPath(grow));c.fillStyle=HL(style==='buzz'?-0.15:-0.25);c.fill();
    if(style==='buzz'){c.save();P(capPath(grow));c.clip();for(let i=0;i<500;i++){const x=hx-rxH+R()*rxH*2,y=hy-ryH*1.1+R()*ryH*0.8;c.fillStyle=hairFill(x,y,0.2);c.fillRect(x,y,2,3)}c.restore()}
    else if(style==='curly'){
      for(let i=0;i<120;i++){const a=Math.PI+R()*Math.PI*1.05-0.02,rr=0.55+R()*0.5;const x=hx+(rxH+10)*Math.cos(a)*rr+Math.sin(yaw)*6,y=hy-ryH*0.15+(ryH+10)*Math.sin(a)*rr;
        if(y>hairline((x-hx)/rxH)[1]+4&&Math.abs(x-hx)<rxH*0.8)continue;ell(x,y,9,8);c.fillStyle=hairFill(x,y,-0.1);c.fill();c.strokeStyle=hairFill(x,y,0.35);c.lineWidth=2;c.beginPath();c.arc(x-1,y-1,5,3.4,5.6);c.stroke()}
      if(g==='f'||!old)for(let i=0;i<60;i++){const s=R()<.5?-1:1;const x=hx+s*(rxH*(0.85+R()*0.45)),y=hy-ryH*0.3+R()*ryH*(g==='f'?1.5:0.6);ell(x,y,8,8);c.fillStyle=hairFill(x,y,-0.2);c.fill();c.strokeStyle=hairFill(x,y,0.25);c.lineWidth=2;c.beginPath();c.arc(x-1,y-1,5,3.4,5.6);c.stroke()}
    } else {
      const n=style==='spiky'?26:44;
      for(let i=0;i<n;i++){const t=-1.55+i/(n-1)*3.1;const end=hairline(t);
        let sx0=(style==='parted'||style==='swept'||style==='long'||style==='bob')?partX:crown[0], sy0=crown[1]+(R()-.5)*8;
        let ex=end[0],ey=Math.min(end[1],hy-4)+4,cxp=(sx0+ex)/2+(ex-hx)*0.35,cyp=(sy0+ey)/2-14;
        if(style==='spiky'){ex=sx0+(ex-sx0)*0.7;ey=crown[1]-16-R()*20+(Math.abs(t)*14);cxp=(sx0+ex)/2;cyp=(sy0+ey)/2}
        if(style==='messy'){ex+=(R()-.5)*14;ey+=R()*10-2}
        if(style==='swept'&&ex<partX){ey+=(partX-ex)*0.25}
        if((style==='parted'||style==='short')&&Math.abs(t)<0.9){ey-=6;cxp+=(ex<partX?-8:8)}
        if(style==='ponytail'||style==='bun'){ex=hx+(ex-hx)*0.98;ey=Math.min(ey,hy-ryH*0.4)}
        lock(sx0,sy0,cxp,cyp,ex,ey,14,3,hairFill(ex,ey,(R()-.5)*0.25))}
      if(style==='messy'||style==='short'||style==='parted'||style==='swept'){
        const N=style==='messy'?13:11;const clumps=[];
        for(let i=0;i<N;i++){const a=Math.PI+0.18+i/(N-1)*(Math.PI-0.36);const rr=1+(style==='messy'?(R()-.4)*0.12:0);
          const px=hx+(rxH+grow*0.3)*Math.cos(a)*rr+Math.sin(yaw)*8*Math.max(0,-Math.sin(a)),py=hy-ryH*0.1+(ryH+grow*0.8)*Math.sin(a)*rr;
          clumps.push({x:px+(hx-px)*0.1,y:py+8,rx:(style==='messy'?13:11)+R()*3,ry:7.5+R()*2,rot:a+Math.PI/2+(style==='swept'?0.35:0)+(R()-.5)*0.3})}
        clumps.sort((p,q)=>Math.abs(q.x-hx)-Math.abs(p.x-hx)); // centre ones last, on top
        for(const k of clumps){ell(k.x,k.y,k.rx,k.ry,k.rot);c.fillStyle=hairFill(k.x,k.y,-0.12);c.fill();
          ell(k.x-k.rx*0.25,k.y-k.ry*0.35,k.rx*0.55,k.ry*0.35,k.rot);c.fillStyle=hairFill(k.x,k.y,0.32);c.fill();
          c.strokeStyle=rgba('#140c10',0.22);c.lineWidth=2;c.beginPath();c.ellipse(k.x,k.y,k.rx,k.ry,k.rot,0.2,Math.PI-0.2);c.stroke()}
      }
      if(style==='messy'||style==='swept'){for(let i=0;i<10;i++){const t=-0.9+i/9*1.8;const p=hairline(t);const len=style==='swept'?10+(partX-p[0])*0.18:6+R()*10;lock(p[0],p[1]-12,p[0]+(style==='swept'?8:(R()-.5)*6),p[1]-2,p[0]+(style==='swept'?14:(R()-.5)*8),p[1]+len,10,2,hairFill(p[0],p[1],(R()-.5)*0.2))}}
      if(style==='long'||style==='bob'){const len=style==='bob'?ryH*1.0:longLen*0.9;
        for(const s of[-1,1])for(let i=0;i<12;i++){const x0=hx+s*(rxH*(0.62+i*0.04))+Math.sin(yaw)*6,y0=hy-ryH*0.5+i*2;const x1=hx+s*(rxH*(1.05+i*0.035))+(R()-.5)*8,y1=hy+len*(0.7+R()*0.3)-(style==='bob'?0:i*2);
          lock(x0,y0,x1+s*6,(y0+y1)/2,x1-(style==='bob'?s*12:0),y1,15,4,hairFill(x1,(y0+y1)/2,(R()-.5)*0.3-(s>0?0.15:0)))}}
      if(style==='plaits'){for(const s of[-1,1]){const x=hx+s*rxH*1.02;for(let i=0;i<10;i++){const y=hy-6+i*13;ell(x+(i%2?3:-3),y,9,8,(i%2?0.5:-0.5));c.fillStyle=hairFill(x,y,i%2?0.05:-0.2);c.fill()}ell(x,hy+126,6,4);c.fillStyle=h1||'#8b1e24';c.fill()}}
      if(style==='bun'){ell(crown[0]-Math.sin(yaw)*10,crown[1]-12,22,18);c.fillStyle=HL(-0.2);c.fill();for(let i=0;i<8;i++){c.strokeStyle=hairFill(crown[0],crown[1],0.3-i*0.06);c.lineWidth=3;c.beginPath();c.arc(crown[0]-Math.sin(yaw)*10,crown[1]-12,16-i*2,3.2+i*0.3,5.8+i*0.2);c.stroke()}}
      if(style==='ponytail'){const s=yaw>0?-1:1;const bx=hx+s*rxH*1.0;for(let i=0;i<10;i++)lock(bx,hy-ryH*0.6,bx+s*16,hy,bx+s*(8+R()*10),hy+ryH*0.9+R()*20,14,3,hairFill(bx,hy,-0.15+(R()-.5)*0.2));ell(bx,hy-ryH*0.6,7,6);c.fillStyle='#8b2a2a';c.fill()}
      c.save();P(capPath(grow));c.clip();c.strokeStyle=rgba('#fff4dc',0.22);c.lineWidth=4;
      for(let i=0;i<7;i++){const t=-1.2+i*0.25;const p=proj(t,-0.72);c.beginPath();c.moveTo(p[0]-6,p[1]-8);c.quadraticCurveTo(p[0],p[1]-2,p[0]+6,p[1]+6);c.stroke()}c.restore();
    }
    c.save();facePath();c.clip();c.strokeStyle=rgba('#2a1020',0.25);c.lineWidth=7;c.beginPath();for(let i=0;i<=20;i++){const t=-1.3+i/20*2.6;const p=hairline(t);i?c.lineTo(p[0],p[1]+3):c.moveTo(p[0],p[1]+3)}c.stroke();c.restore();
  } else if(old){
    for(const s of[-1,1]){for(let i=0;i<8;i++){const p=proj(s*(1.2+i*0.03),-0.2+i*0.05);lock(p[0],p[1],p[0]+s*6,p[1]+8,p[0]+s*4,p[1]+18,10,3,hairFill(p[0],p[1],0))}}
    ell(hx-rxH*0.35,hy-ryH*0.75,14,8,-0.4);c.fillStyle=rgba('#ffffff',0.22);c.fill();
  }
  // glasses
  if(feats.has('glasses')){const fr=old?'#a08a5a':'#2e2622';c.strokeStyle=fr;c.lineWidth=3.4;
    for(const e of[eyeL,eyeR]){const fore=Math.max(.5,e[2]);ell(e[0],e[1]+1,19*fore,14);c.stroke();ell(e[0]-6*fore,e[1]-5,3,2);c.fillStyle=rgba('#ffffff',0.5);c.fill()}
    c.beginPath();c.moveTo(eyeL[0]+18*Math.max(.5,eyeL[2]),eyeL[1]);c.quadraticCurveTo((eyeL[0]+eyeR[0])/2,eyeL[1]-5,eyeR[0]-18*Math.max(.5,eyeR[2]),eyeR[1]);c.stroke();
    const near=yaw>0?eyeL:eyeR;c.beginPath();c.moveTo(near[0]+(near===eyeL?-19:19),near[1]);c.lineTo(near[0]+(near===eyeL?-34:34),near[1]+2);c.stroke()}
  // hats
  const hd=sp.head||'none';const hl=hairline(0);const brimY=Math.min(hl[1]-2,hy-ryH*0.55);
  if(hd==='pointed_hat'){const HC='#2b2535';P([[hx-rxH*1.55,brimY+6],[hx+rxH*1.55,brimY+6],[hx+rxH*1.3,brimY-6],[hx-rxH*1.3,brimY-6]]);c.fillStyle=tone(HC,-0.1);c.fill();
    P([[hx-rxH*0.95,brimY-2],[hx+rxH*0.95,brimY-2],[hx+rxH*0.2,brimY-120],[hx+rxH*0.9,brimY-150],[hx-rxH*0.1,brimY-118]]);gr=c.createLinearGradient(hx-rxH,0,hx+rxH,0);gr.addColorStop(0,tone(HC,0.35));gr.addColorStop(1,tone(HC,-0.4));c.fillStyle=gr;c.fill();
    c.fillStyle=h1||'#6a4a2a';c.fillRect(hx-rxH*0.95,brimY-14,rxH*1.9,10)}
  if(hd==='bowler'){c.fillStyle='#24222a';ell(hx,brimY+2,rxH*1.35,9);c.fill();ell(hx,brimY-22,rxH*0.98,30);c.fill();c.fillRect(hx-rxH*0.98,brimY-22,rxH*1.96,24);ell(hx-rxH*0.4,brimY-36,16,8);c.fillStyle=rgba('#ffffff',0.15);c.fill()}
  if(hd==='winter_hat'){const a=h1||'#8b1e24',b2=h2||'#d9a94b';
    c.save();c.beginPath();c.rect(hx-rxH*1.12,brimY-20,rxH*2.24,28);c.ellipse(hx,brimY-20,rxH*1.12,40,0,Math.PI,Math.PI*2);c.clip();
    for(let y=brimY-70;y<brimY+10;y+=10){c.fillStyle=((y/10)|0)%2?a:b2;c.fillRect(0,y,B,10)}gr=c.createLinearGradient(hx-rxH,0,hx+rxH,0);gr.addColorStop(0,rgba('#ffffff',0.15));gr.addColorStop(1,rgba('#000000',0.35));c.fillStyle=gr;c.fillRect(0,0,B,B);c.restore();
    ell(hx,brimY-64,13,13);c.fillStyle=b2;c.fill()}
  if(hd==='bonnet'){c.fillStyle='#ece8df';ell(hx,brimY-6,rxH*1.05,30);c.fill();c.fillRect(hx-rxH*1.05,brimY-6,rxH*2.1,12);c.fillStyle='#c8c0b4';c.fillRect(hx-rxH*1.05,brimY+2,rxH*2.1,4);c.fillStyle='#c23a3a';c.fillRect(hx-3,brimY-26,6,16);c.fillRect(hx-8,brimY-21,16,6)}
  if(hd==='cavalier_hat'){c.fillStyle='#3a2a1e';ell(hx,brimY,rxH*1.9,14,-0.08);c.fill();ell(hx,brimY-22,rxH,28);c.fill();c.strokeStyle='#efe6d2';c.lineWidth=8;c.beginPath();c.moveTo(hx+rxH*0.4,brimY-20);c.quadraticCurveTo(hx+rxH*1.6,brimY-80,hx+rxH*1.9,brimY-10);c.stroke()}
  if(painting){c.lineWidth=22;c.strokeStyle='#b8902e';c.strokeRect(11,11,B-22,B-22);c.lineWidth=6;c.strokeStyle='#7a5a1a';c.strokeRect(22,22,B-44,B-44);c.strokeStyle='#e8c870';c.lineWidth=3;c.strokeRect(4,4,B-8,B-8)}
  if(ghost){const id=c.getImageData(0,0,B,B),d=id.data;for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;d[i]=l*0.7+30;d[i+1]=l*0.82+42;d[i+2]=Math.min(255,l*1.05+62)}c.putImageData(id,0,0)}
  // reduce to 64px, then palette and cleanup
  const mid=document.createElement('canvas');mid.width=128;mid.height=128;const mc=mid.getContext('2d');mc.imageSmoothingEnabled=true;mc.imageSmoothingQuality='high';mc.drawImage(cv,0,0,128,128);
  const out=document.createElement('canvas');out.width=S;out.height=S;const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';oc.drawImage(mid,0,0,S,S);
  quantise(oc,30);
  return out;
}
function quantise(ctx,k){
  const id=ctx.getImageData(0,0,S,S),d=id.data,n=S*S;const px=new Float32Array(n*3);for(let i=0;i<n;i++){px[i*3]=d[i*4];px[i*3+1]=d[i*4+1];px[i*3+2]=d[i*4+2]}
  const lum=i=>px[i*3]*.3+px[i*3+1]*.59+px[i*3+2]*.11;
  const order=[...Array(n).keys()].sort((a,b)=>lum(a)-lum(b));
  const C=new Float32Array(k*3);for(let j=0;j<k;j++){const p=order[Math.floor((j+.5)/k*n)];C[j*3]=px[p*3];C[j*3+1]=px[p*3+1];C[j*3+2]=px[p*3+2]}
  const lab=new Uint8Array(n);
  for(let it=0;it<9;it++){const sum=new Float32Array(k*3),cnt=new Float32Array(k);
    for(let i=0;i<n;i++){let best=0,bd=1e12;for(let j=0;j<k;j++){const dr=px[i*3]-C[j*3],dg=px[i*3+1]-C[j*3+1],db=px[i*3+2]-C[j*3+2];const dd=dr*dr*0.8+dg*dg+db*db*0.7;if(dd<bd){bd=dd;best=j}}
      lab[i]=best;sum[best*3]+=px[i*3];sum[best*3+1]+=px[i*3+1];sum[best*3+2]+=px[i*3+2];cnt[best]++}
    for(let j=0;j<k;j++)if(cnt[j]){C[j*3]=sum[j*3]/cnt[j];C[j*3+1]=sum[j*3+1]/cnt[j];C[j*3+2]=sum[j*3+2]/cnt[j]}}
  for(let pass=0;pass<2;pass++){const L2=lab.slice();for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){const i=y*S+x,a=lab[i-1],b=lab[i+1],u=lab[i-S],w=lab[i+S];
    if(a!==lab[i]&&b!==lab[i]&&u!==lab[i]&&w!==lab[i]){if(a===b&&(a===u||a===w))L2[i]=a;else if(u===w&&(u===a||u===b))L2[i]=u}}lab.set(L2)}
  for(let i=0;i<n;i++){const j=lab[i];d[i*4]=C[j*3];d[i*4+1]=C[j*3+1];d[i*4+2]=C[j*3+2];d[i*4+3]=255}
  ctx.putImageData(id,0,0);
}
function drawPortraitHQ(ctx,sp,opt){
  sp=sp||{};const name=sp.name||(opt&&opt.name)||'';
  const key=name+'|'+JSON.stringify(sp);let cv=cache.get(key);
  if(!cv){try{cv=render(sp,name)}catch(e){console.error(e);return}cache.set(key,cv);if(cache.size>80)cache.delete(cache.keys().next().value)}
  ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,S,S);ctx.drawImage(cv,0,0);
}
window.drawPortraitHQ=drawPortraitHQ;window.PORTRAIT_SIZE=S;
})();
