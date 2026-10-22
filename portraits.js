/* HQ portraits, 64x64. Procedural, painted per pixel: head and hair are lit as rounded forms from the upper left
   and posterised into hue-shifted ramps (cool shadows, warm lights). Deterministic per name. */
(function(){
'use strict';
const S=64;
function hash(s){let h=2166136261;for(const c of String(s||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){let s=seed||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%100000)/100000}}
function hexToHsl(hex){const n=parseInt(hex.slice(1),16);let r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return [h,s,l]}
function hslToRgb(h,s,l){h=((h%360)+360)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r,g,b;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)]}
// 5-step ramp, index 0 darkest. Shadows drift toward violet and gain saturation; lights drift warm.
function ramp(hex,spread){spread=spread==null?1:spread;const [h,s,l]=hexToHsl(hex);const out=[];
  for(let i=0;i<5;i++){const t=(i-2.6)/2.6;const L=Math.max(.04,Math.min(.96,l+t*.24*spread));
    const H=t<0?h+(h>200&&h<300?0:(h<200?1:-1)*(-t)*16):h+(h>60&&h<240?-1:1)*(-t)*-8;
    const Sa=Math.max(0,Math.min(1,s+(t<0?-t*.10:-t*.06)));out.push(hslToRgb(t<0?lerpHue(h,250,-t*.1):lerpHue(h,48,t*.08),Sa,L))}
  return out}
function skinRamp(hex){const [h,s,l]=hexToHsl(hex);const off=[-.21,-.12,-.045,.03,.09];
  return off.map((o,i)=>{const t=(i-2.4)/2.4;const H=t<0?h-(-t)*9:h+t*6;const Sa=Math.max(0,Math.min(1,s+(t<0?(-t)*.04:-t*.08)));return hslToRgb(H,Sa,Math.max(.05,Math.min(.95,l+o*(l<.35?.8:1))))})}
function lerpHue(a,b,t){let d=((b-a+540)%360)-180;return a+d*t}
function mix(a,b,t){return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)]}
const rgb=hex=>{const n=parseInt(hex.slice(1),16);return [n>>16&255,n>>8&255,n&255]};

const SKINS=['#f6dcc6','#f1d2b6','#e3b995','#d4a57e','#c99470','#a87650','#8a5a3a','#5e3c28'];
const HAIR={black:'#26232b',dark_brown:'#43301f',brown:'#6b4a2e',light_brown:'#8a6440',auburn:'#8e3c24',ginger:'#c85a28',blond:'#d8b45e',platinum:'#ece0b8',grey:'#9c9a98',white:'#e8e4dc'};
const EYES={brown:'#6a4424',dark_brown:'#3a2414',hazel:'#7a6a30',green:'#3f7a46',blue:'#3a6aae',grey:'#7a8a98'};
const HOUSE={Gryffindor:['#8b1e24','#d9a94b'],Slytherin:['#1f5a32','#c0c4c8'],Ravenclaw:['#22427a','#b07a30'],Hufflepuff:['#d9b23a','#2a2a2a']};
const F_NAMES=/^(cordelia|ida|wren|ottilie|minerva|hermione|ginny|luna|molly|dilys|saffron|clemency|imogen|euphemia|maeve|pibbit|philippa|augusta|rose|lily|alice|mary|sarah|emma|olivia|sophie|grace|anna|kate|helen|jane|ruth|agnes|poppy|pomona|sybill|rolanda|dolores|narcissa|bellatrix|andromeda|fleur|cho|lavender|parvati|padma|hannah|susan|katie|angelina|alicia|ottoline|beatrix|harriet|eleanor|edith|mildred|maud|nell)/i;
function inferGender(name,sp){
  if(sp.gender==='f'||sp.gender==='female'||sp.gender==='girl'||sp.gender==='woman')return 'f';
  if(sp.gender==='m'||sp.gender==='male'||sp.gender==='boy'||sp.gender==='man')return 'm';
  const n=String(name||'').trim();
  if(/^(mrs|miss|ms|madam|madame|dame|lady|mother|aunt|grandma|granny)\b/i.test(n))return 'f';
  if(/^(mr|sir|lord|master|father|uncle|grandpa|grandad)\b/i.test(n))return 'm';
  const first=n.replace(/^(professor|prof\.?|dr\.?|the)\s+/i,'').split(/\s+/)[0]||'';
  if(F_NAMES.test(first))return 'f';
  if(/(a|ia|ie|elle|ette|ine|lyn|een)$/i.test(first)&&!/^(luca|joshua|ezra|elijah|noah|nikita|sasha|andrea|ira|jonah|micah|barnaby|haverstock)$/i.test(first))return 'f';
  return 'm';
}

function drawPortraitHQ(ctx,sp,opt){
  sp=sp||{};opt=opt||{};
  const name=sp.name||opt.name||'';
  const R=rng(hash(name+'|'+(sp.role||'')));
  const g=inferGender(name,sp), age=sp.age||'adult', old=age==='old', kid=age==='child', teen=age==='teen';
  const ghost=sp.house==='ghost'||sp.robes==='ghost', painting=sp.house==='portrait';
  const feats=new Set([].concat(sp.extra&&sp.extra!=='none'?String(sp.extra).split(/[,\s]+/):[],Array.isArray(sp.features)?sp.features:[]));
  if(/one ear|missing ear|lost an ear/i.test(sp.role||''))feats.add('missing_ear');
  if(/\bscar\b/i.test(sp.role||''))feats.add('scar');
  const img=ctx.createImageData(S,S),D=img.data;
  const put=(x,y,c,a)=>{x|=0;y|=0;if(x<0||y<0||x>=S||y>=S||!c)return;const i=(y*S+x)*4;if(a==null||a>=1){D[i]=c[0];D[i+1]=c[1];D[i+2]=c[2];D[i+3]=255}else{D[i]=D[i]+(c[0]-D[i])*a;D[i+1]=D[i+1]+(c[1]-D[i+1])*a;D[i+2]=D[i+2]+(c[2]-D[i+2])*a;D[i+3]=255}};
  const get=(x,y)=>{const i=(y*S+x)*4;return [D[i],D[i+1],D[i+2]]};
  const L=[-0.62,-0.36,0.7];const ln=Math.hypot(...L);L[0]/=ln;L[1]/=ln;L[2]/=ln;
  const lev=(v,cut)=>{cut=cut||[.18,.38,.58,.8];return v<cut[0]?0:v<cut[1]?1:v<cut[2]?2:v<cut[3]?3:4};
  // ---- palettes
  let skinIdx=sp.skin_hq!=null?sp.skin_hq:(sp.skin==null?2:[1,2,4,6,7][Math.max(0,Math.min(4,sp.skin|0))]);
  const SK=skinRamp(SKINS[Math.max(0,Math.min(7,skinIdx))]);
  let hairHex=HAIR[sp.hair_colour]||(old?HAIR.grey:HAIR.dark_brown); if(old&&(sp.hair_colour==='black'||sp.hair_colour==='dark_brown'))hairHex='#5a5652';
  const HR=ramp(hairHex,hairHex===HAIR.white||hairHex===HAIR.platinum?0.7:1.15);
  const eyeKeys=Object.keys(EYES);const EY=rgb(EYES[sp.eye_colour]||EYES[eyeKeys[Math.floor(R()*eyeKeys.length)]]);
  const [h1,h2]=HOUSE[sp.house]||[null,null];
  // ---- background
  const bgBase=ghost?'#26304a':painting?'#3a2e22':'#50553c';const BG=ramp(bgBase,0.5);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const d=Math.hypot(x-28,y-24)/46;const t=Math.max(0,Math.min(1,1-d));put(x,y,mix(BG[1],BG[2],t*0.8))}
  // ---- geometry
  const cx=32+Math.round((R()-.5)*1.4), cy=kid?29:27;
  const rx=(g==='f'?10.8:11.6)+(kid?-0.5:0)+(R()-.5)*0.8, ry=(kid?12.2:13.2)+(old?0.4:0)+(R()-.5)*0.8;
  const jaw=sp.face||['round','square','long','heart','oval'][Math.floor(R()*5)];
  const jp={round:2.1,square:3.2,long:2.4,heart:1.55,oval:2.2}[jaw]||2.2;
  const halfW=y=>{const t=(y-cy)/ry;if(t<-1||t>1)return -1;if(t<0)return rx*Math.pow(1-Math.pow(-t,2.3),1/2.3);let w=rx*Math.pow(1-Math.pow(t,jp),1/jp);if(g==='m'&&!kid&&jaw==='square')w=Math.max(w,t<.85?rx*.78:w);return w};
  const inFace=(x,y)=>{const w=halfW(y);return w>0&&Math.abs(x+.5-cx)<=w};
  // masks
  const M=new Uint8Array(S*S); // 1 face,2 neck,3 torso,4 ear,5 hair,6 backhair,7 beard,8 hat
  const setM=(x,y,v)=>{if(x>=0&&y>=0&&x<S&&y<S)M[y*S+x]=v};
  const m=(x,y)=>x<0||y<0||x>=S||y>=S?0:M[y*S+x];
  // ---- hair shape (computed first so we know what covers what)
  const style=sp.hair_style||'short';
  const partX=cx+(R()<.5?-3:3)+(style==='long'||style==='bob'?0:0);
  const hairTop=cy-ry-(style==='curly'?4:style==='spiky'?5:style==='buzz'?0:2);
  const hairline=x=>{ // forehead hairline y at column x
    const dx=(x+.5-cx)/rx;let base=cy-ry*(old&&g==='m'?0.62:0.5);if(style==='buzz')base=cy-ry*0.55;
    return base+Math.pow(Math.abs(dx),2.2)*ry*0.55};
  const H=new Uint8Array(S*S),HB=new Uint8Array(S*S);
  const crownY=cy-ry*0.95;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const dx=x+.5-cx,dy=y+.5-cy;
    const capR=(style==='curly'?rx+4:style==='buzz'?rx+0.6:rx+2.2), capRy=ry+(style==='curly'?4:style==='buzz'?0.6:2.2);
    const inCap=(dx*dx)/(capR*capR)+((dy+1)*(dy+1))/(capRy*capRy)<=1&&y<cy+1;
    let front=false,back=false;
    if(style!=='bald'){
      const jag=((x*13+7)%5===0?2:(x*7)%3===0?1:0);if(inCap&&(y<hairline(x)+(style==='short'||style==='messy'||style==='swept'||style==='parted'?jag:0)||Math.abs(dx)>rx-0.6&&y<cy-1))front=true;
      // fringes
      if(style==='messy'&&inCap&&y<hairline(x)+3+((x*7+3)%4)&&y<cy-ry*0.28)front=true;
      if(style==='swept'&&inCap&&y<hairline(x)+Math.max(0,(partX-x))*0.5&&y<cy-2)front=true;
      if(style==='parted'&&inCap&&y<hairline(x)+(Math.sign(cx-partX)*(x-partX)>0?Math.min(4,Math.abs(x-partX)*0.4):0))front=true;
      if((style==='bob'||style==='long'&&g==='f'&&R()<2)&&false)front=true;
      if(style==='bob'){const bw=rx+2.8-Math.max(0,y-(cy+ry*0.25))*0.7;const k=(dx*dx)/((rx+2.8)*(rx+2.8))+((dy+1)*(dy+1))/((ry+2.4)*(ry+2.4));if(k<=1&&y<cy-ry*0.32+((x*5)%3===0?1:0))front=true;if(Math.abs(dx)>=rx-2.4&&Math.abs(dx)<=bw&&y>=cy-ry*0.5&&y<=cy+ry*0.55)front=true;if(Math.abs(dx)<=bw+1&&y>=cy-4&&y<=cy+ry*0.6)back=true}
      if(style==='long'){const fall=Math.max(0,y-cy)*0.22, endY=(g==='f'?cy+ry+12:cy+ry+5)+((x*5+3)%3)-(Math.abs(dx)>rx+3?1:0);if(Math.abs(dx)>=rx-1.6-(y>cy+ry?2:0)&&Math.abs(dx)<=rx+3.2+fall&&y>=cy-6&&y<=endY)front=true;if(Math.abs(dx)<=rx+4.5+fall&&y>=cy-4&&y<=endY+2)back=true}
      if(style==='curly'){const k=Math.hypot(dx/(rx+4.6),(dy+2)/(ry+3.5));if(k<=1&&y<cy+ry*0.35&&(y<hairline(x)+1||Math.abs(dx)>rx-1))front=true;if(k<=1.05&&y<cy+ry*0.5)back=true}
      if(style==='ponytail'||style==='bun'){if(Math.hypot(dx-(style==='bun'?0:rx*0.6),y+.5-(cy-ry-2))<4.2)front=true}
      if(style==='plaits'){for(const s of[-1,1]){const px=cx+s*(rx+0.5);if(Math.abs(x+.5-px)<2.3&&y>=cy-2&&y<=cy+ry+12)front=true}}
      if(style==='spiky'&&y<hairline(x)+1){const sp2=Math.abs(((x+R()*0)%5)-2.5);if(y>=hairTop+sp2*1.2&&Math.abs(dx)<rx+2&&y<cy-2)front=true}
    }
    if(front)H[y*S+x]=1;if(back)HB[y*S+x]=1;
  }
  // ---- back hair
  const hairShade=(x,y,mode)=>{
    const dx=x+.5-cx,dy=y+.5-cy;let nx,ny,nz;
    if(mode==='cap'){nx=dx/(rx+3);ny=(dy+2)/(ry+3);nz=Math.sqrt(Math.max(0.04,1-nx*nx-ny*ny))}
    else{nx=Math.max(-1,Math.min(1,(Math.abs(dx)-rx)/4))*Math.sign(dx);ny=-0.25;nz=Math.sqrt(Math.max(0.04,1-nx*nx-ny*ny))}
    let v=nx*L[0]+ny*L[1]+nz*L[2];
    // strands: radial from crown on the cap, vertical below
    const ang=mode==='cap'?Math.atan2(y+.5-crownY,x+.5-(style==='parted'||style==='swept'?partX:cx)):0;
    const coord=mode==='cap'?ang*9:(x+.5)*1.1+Math.sin(y*.35)*0.8;
    const sv=Math.sin(coord*Math.PI);v+=0.16*sv+(sv<-0.75?-0.14:0)+(style==='curly'?0.2*Math.sin(x*1.3)*Math.sin(y*1.2):0);
    // sheen arc
    if(mode==='cap'){const rr=Math.hypot(dx/(rx+2),(dy+ry*0.35)/(ry*0.8));if(Math.abs(rr-0.78)<0.09&&dx<2)v+=0.18}
    return v;
  };
  for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(HB[y*S+x]){const v=hairShade(x,y,'side')-0.12;put(x,y,HR[Math.max(0,lev(v)-1)]);setM(x,y,6)}
  // ---- torso / clothes
  const shoulderY=cy+ry+7, nw=g==='f'?5:6.2;
  const torsoW=y=>Math.min(31,(g==='f'?12.5:14)+(y-shoulderY)*2.4+(y-shoulderY>3?4:0));
  const robes=sp.robes||(sp.house&&HOUSE[sp.house]?'school_robes':'muggle_clothes');
  const pickHex=(list)=>list[Math.floor(R()*list.length)];
  let clothHex='#26232c',trimHex=null,innerHex=null,collar=null;
  if(robes==='school_robes'){clothHex='#24212a';trimHex=h1;innerHex='#5e5f68';collar='tie'}
  else if(robes==='teacher_robes'){clothHex=pickHex(['#3e2440','#22382c','#2a2c48','#40281e']);trimHex='#b89048';collar='high'}
  else if(robes==='muggle_clothes'){clothHex=pickHex(['#33486e','#3e5a3a','#6a2e30','#8a6a2e','#55555e','#4a3a5a']);collar=g==='f'?'scoop':'crew'}
  else if(robes==='shopkeeper'){clothHex=pickHex(['#4a2e1e','#2e4a36','#5a2a3a','#3a3046']);innerHex='#e6dccb';collar='waistcoat'}
  else if(robes==='ministry_robes'){clothHex='#262a48';trimHex='#b8bcc8';collar='high'}
  else if(robes==='winter_cloak'){clothHex='#4a4a54';trimHex='#c9a24a';collar='cloak'}
  else if(robes==='quidditch_robes'){clothHex=h1||'#8b1e24';trimHex=h2||'#d9a94b';collar='crew'}
  else if(robes==='dress_robes'){clothHex=pickHex(['#1e3a2a','#22284a','#4a1e2e']);trimHex='#c9a24a';collar='high'}
  else if(robes==='ghost'){clothHex='#8aa0c0';collar='crew'}
  const CL=ramp(clothHex,1.1);
  for(let y=shoulderY;y<S;y++){const w=torsoW(y);for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=w){
    const nx=dx/(w+2),ny=-0.35+(y-shoulderY)/40,nz=Math.sqrt(Math.max(.05,1-nx*nx-ny*ny));let v=nx*L[0]+ny*L[1]+nz*L[2];
    if(Math.abs(dx)>w-1.2)v-=0.2; // edge
    if(Math.abs(Math.abs(dx)-w+4)<0.7&&y>shoulderY+8)v-=0.12; // arm seam
    if(robes==='muggle_clothes'&&x%2===0)v-=0.025;
    put(x,y,CL[lev(v,[.25,.48,.7,.9])]);setM(x,y,3)}}}
  // neckline
  const nTop=cy+ry-4;
  const neckW=y=>nw-(y>shoulderY+1?-(y-shoulderY-1)*0.6:0);
  // ---- neck
  for(let y=nTop;y<shoulderY+5;y++){const w=neckW(y);for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=w&&!(m(x,y)===3&&y>shoulderY+1+Math.max(0,3-Math.abs(dx)*0.0))){
    let lv=dx<-w*0.25?2:1;if(y<cy+ry+2)lv=dx<-w*0.5?1:0;if(dx>w-1.6)lv=Math.max(0,lv-1);put(x,y,SK[lv]);setM(x,y,2)}}}
  // collar details over torso
  const V=(y)=>Math.max(0,(y-shoulderY+1)*0.55);
  if(collar==='tie'){
    for(let y=shoulderY;y<S;y++){const vw=1.6+V(y)*0.75;for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=vw){
      let c=rgb(innerHex);c=mix(c,[0,0,0],dx>0?0.18:0);
      if(Math.abs(dx)<=vw-1.2&&y<shoulderY+3)c=dx<0?[236,230,218]:[206,198,186]; // shirt collar
      if(Math.abs(dx)<1.6&&y>=shoulderY+1){const band=((y-shoulderY)>>1)%2;c=rgb(band?(h2||'#d9a94b'):(h1||'#8b1e24'));if(dx>0.2)c=mix(c,[0,0,0],0.2)}
      put(x,y,c)} else if(Math.abs(dx)<=vw+1&&trimHex){put(x,y,mix(rgb(trimHex),[0,0,0],dx>0?.25:0))}}}
  } else if(collar==='crew'||collar==='scoop'){
    const d=collar==='scoop'?4:2;for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=nw+1.5){const yy=shoulderY+Math.round(d*(1-Math.pow(dx/(nw+1.5),2)));for(let y=shoulderY;y<=yy+1;y++){if(y<yy)put(x,y,SK[dx<0?2:1]);else put(x,y,y===yy?CL[3]:CL[2])}}}
  } else if(collar==='waistcoat'){
    for(let y=shoulderY;y<S;y++){const vw=2+V(y)*0.6;for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=vw+1.4&&Math.abs(dx)>vw&&y>shoulderY)put(x,y,mix(CL[3],[0,0,0],dx>0?.25:0));if(Math.abs(dx)<=vw){let c=rgb(innerHex);if(dx>0)c=mix(c,[0,0,0],.15);if(y<shoulderY+2&&Math.abs(dx)>0.8)c=[240,234,222];
      if(Math.abs(dx)<1.4&&y>shoulderY+1&&y<shoulderY+9){c=rgb(pickHex(['#8a2a2a','#2a4a6a','#6a5a2a']))}put(x,y,c)}}}
    for(let y=shoulderY+2;y<S;y+=3)put(cx-1,y+6,[200,170,90]);
  } else if(collar==='high'){
    for(let y=shoulderY-2;y<shoulderY+3;y++){for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=nw+2&&Math.abs(dx)>=nw-1.5)put(x,y,CL[dx<0?3:1])}}
    for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=nw+2.5&&trimHex)put(x,shoulderY+2,mix(rgb(trimHex),[0,0,0],dx>0?.3:0))}
    if(trimHex){put(cx-1,shoulderY+4,rgb(trimHex));put(cx,shoulderY+4,rgb(trimHex));put(cx-1,shoulderY+5,mix(rgb(trimHex),[0,0,0],.3));put(cx,shoulderY+5,mix(rgb(trimHex),[0,0,0],.3))}
  } else if(collar==='cloak'){
    const FU=ramp('#8a7a66',1.2);for(let y=shoulderY-1;y<shoulderY+4;y++){const w=torsoW(Math.max(shoulderY,y))+1-(y<shoulderY+1?2:0);for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=w&&Math.abs(dx)>nw-1.5){const v=-dx/(w+1)*0.5+0.5+((x*3+y*5)%4===0?-0.15:0)+(y===shoulderY+3?-0.2:0);put(x,y,FU[lev(v,[.2,.4,.6,.82])])}}}
    put(cx-1,shoulderY+3,rgb(trimHex));put(cx,shoulderY+3,rgb(trimHex));
  }
  if(robes==='quidditch_robes'&&trimHex){for(let y=shoulderY+6;y<shoulderY+8;y++)for(let x=0;x<S;x++)if(m(x,y)===3)put(x,y,mix(rgb(trimHex),[0,0,0],(x>cx)?.25:0))}
  // ---- ears
  const earY=cy+0;const hideEars=style==='long'||style==='bob'||style==='curly'&&g==='f';
  for(const s of[-1,1]){if(hideEars)break;if(s<0&&feats.has('missing_ear'))continue;
    const ex=cx+s*(rx+0.6);for(let y=earY-1;y<earY+6;y++)for(let x=Math.floor(ex-1.6);x<=Math.ceil(ex+1.6);x++){const ddx=(x+.5-ex),ddy=(y+.5-(earY+2.5));if(ddx*ddx/3.2+ddy*ddy/12<=1){put(x,y,SK[s<0?2:1]);setM(x,y,4)}}
    put(Math.round(ex),earY+2,SK[0]);put(Math.round(ex),earY+3,SK[0]);
    if(feats.has('earring'))put(Math.round(ex),earY+6,[220,190,90]);
  }
  if(feats.has('missing_ear')){const ex=cx-(rx+0.4);put(Math.round(ex),earY+2,SK[0]);put(Math.round(ex),earY+3,mix(SK[0],[150,60,60],.4));put(Math.round(ex)+1,earY+1,SK[1])}
  // ---- face
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(!inFace(x,y))continue;const w=halfW(y);
    const nx=(x+.5-cx)/(w+1.2),ny=(y+.5-cy)/(ry*1.15)-0.05,nz=Math.sqrt(Math.max(.03,1-nx*nx-ny*ny));
    let v=nx*L[0]+ny*L[1]+nz*L[2];
    // cheekbone lift, eye socket dip, under-jaw shade
    const ey=cy+ry*0.06;const sock=Math.exp(-(((Math.abs(x+.5-cx)-rx*0.42)**2)/5+((y+.5-ey+0.5)**2)/3));v-=sock*0.18;
    const cheek=Math.exp(-(((Math.abs(x+.5-cx)-rx*0.5)**2)/8+((y+.5-(ey+5))**2)/6));v+=cheek*0.08;
    if(y>cy+ry*0.72)v-=0.12;
    const ax=(x+.5-cx)/(halfW(y)+0.01);if(ax>0.55&&y>cy-ry*0.1)v-=0.1*(ax-0.55)/0.45;
    if(ax<-0.25&&ax>-0.7&&Math.abs(y+.5-(cy+ry*0.22))<1.6)v+=0.07;
    put(x,y,SK[lev(v,[.18,.42,.66,.9])]);setM(x,y,1)}
  // ---- features
  const eyeY=Math.round(cy+ry*0.06), eo=Math.round(rx*0.43+(R()-.5)*0.6);
  const lash=[44,28,26], white=[232,226,214], whiteS=[198,192,184], pupil=[20,14,14];
  const irisL=mix(EY,[255,255,255],.18), irisD=mix(EY,[0,0,0],.35);
  for(const s of[-1,1]){const ex=cx+s*eo;
    const xs=[ex-2,ex-1,ex,ex+1].map(Math.round), o=s<0?0:3, inn=s<0?3:0; // outer and inner corner indices
    const lashC=mix(lash,SK[0],.25);
    for(let i=0;i<4;i++)put(xs[i],eyeY-1,i===inn?mix(lashC,SK[1],.55):lashC);
    put(s<0?xs[0]-1:xs[3]+1,eyeY-(g==='f'?1:0),mix(lashC,SK[1],g==='f'?0:.5));
    if(g==='f')put(s<0?xs[0]-1:xs[3]+1,eyeY-2,mix(lashC,SK[2],.4));
    put(xs[o],eyeY,mix(white,SK[1],.45));put(xs[inn],eyeY,mix(white,SK[2],.3));
    put(xs[1],eyeY,irisD);put(xs[2],eyeY,mix(EY,irisD,.35));
    if(kid||teen){put(xs[1],eyeY,mix(irisD,[255,255,255],.12))}
    put(xs[1],eyeY+1,SK[2],.6);put(xs[2],eyeY+1,SK[2],.6);
    if(old){for(let i=0;i<4;i++)put(xs[i],eyeY+2,SK[1],.55)}
    // brows
    const by=eyeY-3, BR=HR[old&&hairHex!==HAIR.white?1:0];
    for(let i=0;i<5;i++){const xx=s<0?Math.round(ex+2)-i:Math.round(ex-2)+i;const yy=by+(i===4?1:0)-(g==='f'&&(i===2||i===3)?1:0);
      put(xx,yy,BR,i===0?.7:(g==='f'?.85:1));if(g==='m'&&!kid&&i>0&&i<4)put(xx,yy+1,BR,.4)}
  }
  // nose
  const nlen=Math.round(ry*0.36)+(R()<.3?1:0);const nx0=cx;
  for(let i=1;i<=nlen;i++){put(nx0-1,eyeY+i,SK[3],.55);if(i>1)put(nx0+1,eyeY+i,SK[1]);if(i>nlen-2)put(nx0+2,eyeY+i,SK[1],.6)}
  const ny0=eyeY+nlen+1;put(nx0,ny0,SK[4],.7);put(nx0-1,ny0,SK[3]);put(nx0+1,ny0,SK[1]);put(nx0+2,ny0,SK[1],.8);
  put(nx0-2,ny0+1,SK[1]);put(nx0-1,ny0+1,mix(SK[0],[60,30,30],.3));put(nx0,ny0+1,SK[1]);put(nx0+1,ny0+1,mix(SK[0],[60,30,30],.3));put(nx0+2,ny0+1,SK[0],.8);
  put(nx0,ny0+2,SK[1],.55);put(nx0+1,ny0+2,SK[1],.7);put(nx0+2,ny0+2,SK[1],.4);
  // mouth
  const my=ny0+(kid?3:4)+(jaw==='long'?1:0), mw=g==='f'?3:3+(R()<.5?1:0);
  const lip=mix(SK[2],[168,70,72],g==='f'?.42:.16), lipD=mix(SK[0],[70,30,30],.35), lipL=mix(SK[3],[220,140,135],g==='f'?.32:.12);
  for(let x=-mw;x<=mw;x++){put(cx+x,my,Math.abs(x)===mw?mix(lipD,SK[1],.5):lipD)}
  for(let x=-mw+1;x<=mw-1;x++){put(cx+x,my-1,mix(SK[1],lip,.5),x>0?.75:.5);put(cx+x,my+1,x<0?lipL:lip,old?.5:.95)}
  put(cx-1,my+1,mix(lipL,[255,255,255],.2),old?.4:1);
  put(cx,my+3,SK[2],.5);put(cx+1,my+3,SK[1],.4); // chin crease
  // cheeks / freckles / lines
  if(g==='f'||kid){for(const s of[-1,1]){put(cx+s*(eo+1),eyeY+4,[230,120,120],.18);put(cx+s*(eo+2),eyeY+4,[230,120,120],.12)}}
  if(feats.has('freckles')||(sp.hair_colour==='ginger'&&R()<.6)){const fr=mix(SK[1],[140,70,40],.4);for(let i=0;i<9;i++){const s=i%2?1:-1;put(cx+s*(2+Math.floor(R()*5)),eyeY+2+Math.floor(R()*3),fr,.8)}}
  if(old){const ln2=SK[1];for(let i=0;i<3;i++){put(nx0-3-i*0.4,ny0+i,ln2);put(nx0+3+i*0.4,ny0+i,ln2)}
    for(const yy of[cy-ry*0.55,cy-ry*0.45]){for(let x=-4;x<=4;x++)if((x+10)%3)put(cx+x,Math.round(yy),SK[1],.5)}
    for(const s of[-1,1])put(cx+s*(eo+3),eyeY,SK[1])}
  if(feats.has('scar')){const sx=cx+eo+1;for(let i=0;i<4;i++)put(sx-(i>>1),eyeY-4+i,[200,140,130])}
  // stubble, moustache, beard
  if(feats.has('stubble')){for(let y=my-2;y<cy+ry;y++)for(let x=0;x<S;x++)if(m(x,y)===1&&Math.abs(x+.5-cx)>1&&(x*3+y*5)%3===0)put(x,y,HR[1],.25)}
  if(feats.has('moustache')||feats.has('beard')){for(let x=-mw-1;x<=mw+1;x++){put(cx+x,my-1,HR[x<0?2:1]);if(Math.abs(x)<mw)put(cx+x,my-2,HR[x<0?3:2],.9)}}
  if(feats.has('beard')){const bot=cy+ry+(old?8:4);
    const bw=y=>y<=cy+ry-1?(halfW(y)>0?halfW(y)+0.8:0):Math.max(0,rx*0.62-(y-(cy+ry))*(old?0.7:1.3));
    for(let y=ny0+1;y<=bot;y++){const w=bw(y);for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)>w)continue;
      const inMouth=(y===my||y===my+1)&&Math.abs(dx)<mw-0.5;if(inMouth)continue;
      if(y<my-1&&Math.abs(dx)<w-3.5)continue; // cheeks above the moustache stay bare
      const v=-dx/(w+1)*0.55+0.52+0.13*Math.sin(x*1.9+y*0.4)-(y-my)*0.012;const edge=Math.abs(dx)>w-1||y===bot;
      put(x,y,HR[Math.max(0,lev(v,[.2,.4,.6,.85])-(edge?1:0))]);setM(x,y,7)}}}
  // ---- front hair, with contact shadow on the face
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(!H[y*S+x])continue;
    const side=Math.abs(x+.5-cx)>rx-1&&y>cy-ry*0.4;let v=hairShade(x,y,side||style==='plaits'&&y>cy?'side':'cap');
    const edge=!H[y*S+x-1]||!H[y*S+x+1]||!H[(y-1)*S+x]||!H[(y+1)*S+x];
    let lv=lev(v,[.2,.4,.62,.84]);if(edge&&lv>0&&!(x+.5<cx&&!H[y*S+x-1]&&v>.5))lv--;if(edge&&x+.5>cx+rx*0.4&&lv>0)lv--;
    if(style==='plaits'&&y>cy){lv=((y+(x>cx?1:0))%3===0)?Math.max(0,lv-1):lv}
    put(x,y,HR[lv]);setM(x,y,5)}
  for(let y=1;y<S;y++)for(let x=0;x<S;x++){if(m(x,y)===1&&m(x,y-1)===5)put(x,y,SK[1],.55);if(m(x,y)===1&&(m(x-1,y)===5||m(x+1,y)===5)&&x>cx)put(x,y,SK[1],.35)}
  if(style==='ponytail'){for(let y=cy-3;y<cy+ry+5;y++){const x=Math.round(cx+rx+0.5+Math.sin((y-cy)/5)*0.8);for(let k=0;k<3;k++){const xx=x+k;if(m(xx,y)!==1&&m(xx,y)!==4){put(xx,y,HR[[3,2,1][k]-((y%3)===0?1:0)]);setM(xx,y,5)}}}put(cx+rx+1,cy-ry+3,[160,40,40]);put(cx+rx+2,cy-ry+3,[130,30,30])}
  // ---- glasses
  if(feats.has('glasses')){const fr=old?[150,130,90]:[52,44,40];for(const s of[-1,1]){const ex=cx+s*eo;
      for(let x=-3;x<=3;x++){put(ex+x,eyeY-2,fr,Math.abs(x)===3?.6:1);put(ex+x,eyeY+2,fr,Math.abs(x)===3?.5:.85)}for(let y=-1;y<=1;y++){put(ex-3,eyeY+y,fr);put(ex+3,eyeY+y,fr)}
      put(ex-2,eyeY-1,[255,255,255],.35)}
    put(cx-0,eyeY-1,fr);put(cx-1,eyeY-1,fr,.6);put(cx+1,eyeY-1,fr,.6);
    for(const s of[-1,1])put(cx+s*(eo+4),eyeY-1,fr,.8)}
  // ---- hats
  const hd=sp.head||'none';
  const hatRow=Math.round(hairline(cx)-1);
  if(hd==='pointed_hat'){const HC=ramp('#2a2434',1.2);for(let y=0;y<=hatRow+1;y++){const t=(hatRow+1-y)/(hatRow+1);const w=y>=hatRow-1?rx+7:(rx+1)*(1-t*0.85);for(let x=0;x<S;x++){const dx=x+.5-cx-(1-t)*0+t*t*6;if(Math.abs(dx)<=w){const v=-dx/(w+1)*0.6+0.4+(y>=hatRow-1?0.1:0);put(x,y,HC[lev(v,[.15,.35,.55,.8])]);setM(x,y,8)}}}
    if(h1)for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=rx+1)put(x,hatRow-3,mix(rgb(h1),[0,0,0],dx>0?.3:0))}}
  if(hd==='bowler'){const HC=ramp('#25232a',1.2);for(let y=hatRow-9;y<=hatRow+1;y++){const w=y>=hatRow?rx+5:rx+0.5;for(let x=0;x<S;x++){const dx=x+.5-cx,dd=y<hatRow-5?Math.sqrt(Math.max(0,1-((hatRow-5-y)/4)**2))*w:w;if(Math.abs(dx)<=dd){put(x,y,HC[lev(-dx/(dd+1)*0.6+0.45,[.15,.35,.55,.8])]);setM(x,y,8)}}}}
  if(hd==='winter_hat'){const a=h1||'#8b1e24',b=h2||'#d9a94b';for(let y=hatRow-10;y<=hatRow+2;y++){const w=y<hatRow-4?Math.sqrt(Math.max(0,1-((hatRow-4-y)/6)**2))*(rx+2):rx+2;for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=w){const c=((y-hatRow)>>1)%2?a:b;put(x,y,mix(rgb(c),[0,0,0],dx>0?.25:0));setM(x,y,8)}}}
    for(let y=hatRow-14;y<hatRow-10;y++)for(let x=cx-2;x<=cx+2;x++)if(Math.hypot(x-cx,y-(hatRow-12))<2.6)put(x,y,mix(rgb(b),[255,255,255],.15))}
  if(hd==='bonnet'){const W2=[238,234,226];for(let y=hatRow-8;y<=hatRow+1;y++){const t=(hatRow+1-y)/9;const w=(rx+2.5)*Math.sqrt(Math.max(0,1-t*t*0.9));for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=w)put(x,y,mix(W2,[150,145,160],Math.max(0,(dx/(w+1))*0.45+0.1)+(y===hatRow+1?0.15:0)))}}
    for(let x=-2;x<=2;x++)put(cx+x,hatRow-5,[200,60,60]);put(cx,hatRow-6,[200,60,60]);put(cx,hatRow-4,[200,60,60])}
  if(hd==='cavalier_hat'){const HC=ramp('#3a2a1e',1.1);for(let y=hatRow-7;y<=hatRow+1;y++){const w=y>=hatRow-1?rx+9:rx+1;for(let x=0;x<S;x++){const dx=x+.5-cx;if(Math.abs(dx)<=w)put(x,y,HC[lev(-dx/(w+1)*0.6+0.45)])}}
    for(let i=0;i<9;i++){put(cx+6+i,hatRow-8-Math.round(Math.sin(i/3)*3),[236,226,206]);put(cx+6+i,hatRow-7-Math.round(Math.sin(i/3)*3),[200,190,170])}}
  // ---- painting frame / ghost
  if(painting){const G=ramp('#b8902e',1);for(let i=0;i<S;i++)for(let k=0;k<3;k++){const c=G[k===1?4:k===0?2:1];put(i,k,c);put(i,S-1-k,G[k===1?2:0]);put(k,i,c);put(S-1-k,i,G[k===1?2:0])}}
  if(ghost){for(let i=0;i<D.length;i+=4){const l=(D[i]+D[i+1]+D[i+2])/3;D[i]=l*0.75+30;D[i+1]=l*0.85+40;D[i+2]=Math.min(255,l*1.05+60)}}
  ctx.putImageData(img,0,0);
}
window.drawPortraitHQ=drawPortraitHQ;
window.PORTRAIT_SIZE=S;
})();
