/* Hand-drawn cast portraits, 64x64, built on the approved Graham head.
   Every face, neck, collar and coat below reuses the hand-placed geometry from Graham, Cordelia, George and Ollivander;
   each character then gets its own hair, features and clothes. Key light upper left, facing the viewer's right,
   unless the character is mirrored. */
(function(){
'use strict';
const S=64,BG='#5d6145';
const hex=h=>{const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255]};
const inPoly=(P,X,Y)=>{let ins=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>Y)!==(yj>Y))&&(X<(xj-xi)*(Y-yi)/(yj-yi)+xi))ins=!ins}return ins};

function kit(ctx,bg){
  bg=bg||BG;
  const img=ctx.createImageData(S,S),D=img.data;
  const px=(x,y,c)=>{if(!c||x<0||y<0||x>=S||y>=S)return;const i=(y*S+x)*4,v=hex(c);D[i]=v[0];D[i+1]=v[1];D[i+2]=v[2];D[i+3]=255};
  const at=(x,y)=>{const i=(y*S+x)*4;return '#'+[D[i],D[i+1],D[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('')};
  const poly=(P,c)=>{for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(inPoly(P,x+.5,y+.5))px(x,y,c)};
  const row=(y,x0,x1,c)=>{for(let x=x0;x<=x1;x++)px(x,y,c)};
  const pts=(L,c)=>L.forEach(([x,y])=>px(x,y,c));
  const clump=(P,base,hi,lo)=>{const inn=(x,y)=>inPoly(P,x+.5,y+.5);for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(!inn(x,y))continue;px(x,y,!inn(x,y-1)?hi:!inn(x,y+1)?lo:base)}};
  // a round lock of hair: lit up-left, dark down-right
  const curl=(cx,cy,rx,ry,P)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,d=dx*dx+dy*dy;if(d>1)continue;const l=dx+dy;px(x,y,l<-.75?P[4]:l<-.2?P[3]:l<.55?P[2]:P[1])}};
  for(let i=0;i<S*S;i++){const v=hex(bg);D[i*4]=v[0];D[i*4+1]=v[1];D[i*4+2]=v[2];D[i*4+3]=255}
  const mirror=()=>{for(let y=0;y<S;y++)for(let x=0;x<S/2;x++){const a=(y*S+x)*4,b=(y*S+S-1-x)*4;for(let k=0;k<4;k++){const t=D[a+k];D[a+k]=D[b+k];D[b+k]=t}}};
  const finish=(flip)=>{
    if(flip)mirror();
    const b=hex(bg);const isBg=(x,y)=>{if(x<0||y<0||x>=S||y>=S)return false;const i=(y*S+x)*4;return D[i]===b[0]&&D[i+1]===b[1]&&D[i+2]===b[2]};
    const edge=[];for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(isBg(x,y))continue;if(isBg(x-1,y)||isBg(x+1,y)||isBg(x,y-1)||isBg(x,y+1))edge.push([x,y])}
    for(const [x,y] of edge){const i=(y*S+x)*4,lit=flip?x>=32:x<32,k=lit?0.25:0.5;D[i]=Math.round(D[i]*(1-k)+26*k);D[i+1]=Math.round(D[i+1]*(1-k)+20*k);D[i+2]=Math.round(D[i+2]*(1-k)+30*k)}
    ctx.putImageData(img,0,0);
  };
  return {D,px,at,poly,row,pts,clump,curl,mirror,finish};
}

// ---------------- palettes
const SKIN=[
  ['#4a2a33','#875858','#b5837a','#d9ae9a','#eccab4','#f8e0cd'],
  ['#4b2a2f','#86504a','#b06f5c','#d39678','#e8b696','#f4cfb0'],
  ['#43271f','#7a4a34','#a66a4a','#c58a62','#dba57c','#ecc39a'],
  ['#2e1a16','#5a3324','#7f4a32','#9e6544','#b97f58','#d09a70'],
  ['#1f1210','#3d2219','#5a3324','#774530','#8f5a3e','#a8714f'],
  ['#3e2b2c','#7a5a55','#a88577','#cdac9b','#e2c8b8','#f0ddd0']];
const LIPS=[
  ['#a05a60','#b86e72','#cf8e8c','#6e3840'],['#a8644f','#c4836b','#d89a80','#74393a'],['#94563c','#ad6e52','#c08468','#5e2e24'],
  ['#7a3f2c','#8f5440','#a46a52','#4a2218'],['#5e2e22','#6e3a2c','#84503c','#3a1a12'],['#946a64','#a8807a','#bb948c','#5a3434']];
const HAIR={
  black:['#0d0c12','#19171f','#26232e','#383443','#555067'],
  dkbrown:['#140d0b','#26190f','#3a2618','#523822','#6e4e32'],
  brown:['#22161a','#3e281f','#5f3f2d','#82593b','#a97c52'],
  ltbrown:['#3a2616','#5c3e22','#7f5a34','#a07a48','#c49a62'],
  blond:['#5a4320','#8a6a32','#b8924a','#d8b868','#f0d890'],
  ginger:['#3b140c','#6e2614','#a03d1c','#cc5a26','#ec8a3e'],
  auburn:['#2a1010','#4a1c18','#6e2c22','#8e402c','#b05a3a'],
  grey:['#4a4850','#6e6c74','#94929a','#b8b6bc','#d8d6da'],
  white:['#7f7d84','#a9a7ad','#cfcdcf','#ebe9e6','#fbfaf7']};
const HOUSE={
  gryffindor:{a:['#3a0d10','#5e1519','#7e1f24','#a0323a'],b:'#c9a23a',bD:'#8f7028'},
  hufflepuff:{a:['#6b5410','#9a7b1a','#c9a22a','#e2c24a'],b:'#26231b',bD:'#14120d'},
  ravenclaw:{a:['#0f1b38','#182a52','#22396e','#34508e'],b:'#b07c40',bD:'#7a5226'},
  slytherin:{a:['#0c2617','#123a24','#1d5a3a','#2b7a50'],b:'#b4bbbe',bD:'#7d8487'}};
const ROBE=['#0c0c11','#16161d','#212129','#2e2e38','#45454f'];
const JUMPER=['#3f4046','#55565d','#6c6d74','#878890'];
const SHIRT=['#8e94a0','#b9bec6','#dfe2e6','#f5f6f4'];
const EYE={brown:['#5a3a24','#7a5434'],dkbrown:['#2e1e16','#4a3222'],hazel:['#6a5a2a','#8c7a3e'],green:['#3e6a42','#5e8e5a'],
  blue:['#3f6f9a','#6b98c0'],grey:['#5f6e74','#8a9aa0'],silver:['#9aa6ad','#cfd8dc'],amber:['#9a7420','#c89a34']};
const SC='#e8e2d8',SCS='#b9b1a6',PU='#151316';

// ---------------- body
const sh=(L,dy)=>L.map(([x,y])=>[x,y+dy]);
function coat(k,c,dy){
  k.poly(sh([[0,64],[0,56],[3,52],[10,48],[18,45],[24,42],[28,40],[38,40],[42,42],[48,45],[55,48],[61,52],[64,55],[64,64]],dy),c[2]);
  k.poly(sh([[0,57],[3,52],[10,48],[18,45],[22,44],[16,48],[9,53],[4,58],[0,61]],dy),c[3]);k.pts(sh([[6,51],[7,50],[8,50],[9,49],[10,49],[11,48],[12,48]],dy),c[4]);
  k.poly(sh([[42,42],[48,45],[55,48],[61,52],[64,55],[64,64],[50,64],[48,56],[45,48]],dy),c[1]);
  k.poly(sh([[58,52],[64,56],[64,64],[61,64],[59,58]],dy),c[0]);
  k.pts(sh([[7,52],[6,54],[6,56],[5,58],[5,60],[4,62],[4,63]],dy),c[1]);k.pts(sh([[57,53],[57,55],[58,57],[58,59],[59,61],[59,63]],dy),c[0]);
  k.pts(sh([[17,55],[16,57],[15,59],[14,61]],dy),c[1]);k.pts(sh([[49,55],[50,57],[51,59],[52,61]],dy),c[0]);
}
function neck(k,s,o){const dy=o.dy||0;
  if(o.slim){k.poly([[27,33],[39,33],[38,42+dy],[28,42+dy]],s[2]);k.poly([[28,37],[31,37],[32,42+dy],[29,42+dy]],s[3]);
    k.row(34,28,39,s[1]);k.row(35,29,39,s[1]);k.row(36,32,39,s[1]);k.row(37,35,38,s[1]);if(dy)k.row(39,31,36,s[1])}
  else{k.poly([[25,33],[41,33],[40,41+dy],[26,41+dy]],s[2]);k.poly([[26,36],[30,36],[31,41+dy],[27,41+dy]],s[3]);
    k.row(34,27,40,s[1]);k.row(35,28,40,s[1]);k.row(36,31,40,s[1]);k.pts([[29,37],[30,38],[30,39]],s[2]);k.pts([[28,37],[28,38]],s[4]);k.pts([[38,37],[38,38]],s[1])}
}
function lapels(k,c,dy,style){
  const shawl=style==='shawl';
  const L=shawl?[[24,42],[28,40],[30,46],[30,52],[29,63],[27,63],[24,55],[21,49],[19,46],[22,44]]:[[24,42],[28,40],[30,46],[30,52],[29,63],[27,63],[24,55],[21,49],[19,46],[22,45]];
  const R=shawl?[[42,42],[38,40],[36,46],[36,52],[37,63],[39,63],[42,55],[45,49],[47,46],[44,44]]:[[42,42],[38,40],[36,46],[36,52],[37,63],[39,63],[42,55],[45,49],[47,46],[44,45]];
  k.poly(sh(L,dy),c[3]);k.poly(sh(R,dy),c[1]);
  k.pts(sh([[28,41],[29,43],[29,44],[30,46],[30,47],[30,48],[30,50],[30,51],[29,54],[29,56],[29,58],[29,60],[29,62]],dy),c[1]);
  k.pts(sh([[23,42],[22,43],[21,44],[20,45],[19,46],[20,47],[20,48],[21,49],[22,50],[22,51],[23,52],[23,53],[24,54],[24,55],[25,56],[25,57],[26,58],[26,59],[26,60],[27,61],[27,62],[27,63]],dy),c[0]);
  k.pts(sh([[25,43],[25,44],[24,46],[23,47],[23,48],[24,50],[24,51],[25,53]],dy),c[4]);
  if(!shawl){k.pts(sh([[20,46],[21,46],[22,46],[22,45]],dy),c[1]);k.pts(sh([[45,46],[44,46],[43,46],[44,45]],dy),c[0])}
  k.pts(sh([[37,41],[37,43],[36,45],[36,47],[36,49],[36,51],[37,54],[37,57],[37,60]],dy),c[0]);
  k.pts(sh([[43,42],[44,43],[45,44],[46,45],[47,46],[46,47],[46,48],[45,49],[44,50],[44,51],[43,52],[43,53],[42,54],[42,55],[41,56],[41,57],[40,58],[40,59],[40,60],[39,61],[39,62],[39,63]],dy),c[0]);
  k.pts(sh([[41,44],[42,47],[42,50],[41,53]],dy),c[2]);
  k.pts(sh([[25,37],[25,38],[25,39],[24,40],[24,41]],dy),c[3]);k.pts(sh([[41,37],[41,38],[41,39],[42,40],[42,41]],dy),c[0]);
}
// shirt collar flaps and a knot (Graham's), any tie colours
function collarTie(k,s,dy,W,T){
  k.pts(sh([[26,35],[26,36],[27,36]],dy),W[2]);k.pts(sh([[40,35],[40,36],[39,36]],dy),W[0]);
  k.poly(sh([[26,37],[28,37],[32,40],[31,42],[30,45],[29,46],[27,43],[26,40]],dy),W[3]);
  k.pts(sh([[29,45],[30,44],[31,42],[31,41]],dy),W[1]);k.px(27,42+dy,W[2]);k.px(26,39+dy,W[2]);
  k.poly(sh([[40,37],[38,37],[34,40],[35,42],[36,45],[37,46],[39,43],[40,40]],dy),W[1]);
  k.pts(sh([[37,45],[36,44],[35,42],[35,41]],dy),W[0]);k.px(39,41+dy,W[2]);
  if(T){k.poly(sh([[32,39],[35,39],[34,42],[33,42]],dy),T[2]);k.px(34,40+dy,T[1]);k.px(34,41+dy,T[1]);k.px(32,39+dy,T[3]);k.px(33,40+dy,T[3]);k.px(33,43+dy,T[1])}
  k.pts(sh([[33,37],[34,37],[33,38],[34,38]],dy),s[2]);k.px(32,38+dy,s[3]);
}
// Hogwarts uniform: black robe, grey jumper with house trim, white shirt, house tie, crest
function uniform(k,s,o,house){
  const dy=o.dy||0,H=HOUSE[house];
  coat(k,ROBE,dy);
  neck(k,s,o);
  const VJ=sh([[27,40],[39,40],[37,50],[36,64],[30,64],[29,50]],dy);k.poly(VJ,JUMPER[2]);k.poly(sh([[34,40],[39,40],[37,50],[36,64],[34,64]],dy),JUMPER[1]);
  const VS=sh([[28,40],[38,40],[33,49]],dy);k.poly(VS,SHIRT[2]);k.poly(sh([[33,40],[38,40],[33,49]],dy),SHIRT[1]);
  for(let y=40+dy;y<=49+dy;y++){let a=99,b=-1;for(let x=20;x<46;x++)if(inPoly(VS,x+.5,y+.5)){a=Math.min(a,x);b=Math.max(b,x)}
    if(b<0){if(y<=50+dy){k.px(32,y,H.a[2]);k.px(33,y,H.a[2]);k.px(34,y,H.a[1])}continue}
    k.px(a-1,y,H.a[2]);k.px(a-2,y,H.b);k.px(b+1,y,H.a[1]);k.px(b+2,y,H.bD)}
  // tie down the V, house stripes
  const TP=sh([[32,42],[34,42],[35,46],[33,49],[31,46]],dy);k.poly(TP,H.a[2]);
  for(let y=42+dy;y<50+dy;y++)for(let x=30;x<37;x++)if(inPoly(TP,x+.5,y+.5)){if((x+y)%4===0)k.px(x,y,x>=34?H.bD:H.b);else if(x>=34)k.px(x,y,H.a[1])}
  // knit ribbing
  for(let y=51+dy;y<64;y+=2){k.px(31,y,JUMPER[1]);k.px(35,y,JUMPER[0])}
  lapels(k,ROBE,dy,'shawl');
  collarTie(k,s,dy,SHIRT,H.a);
  // crest on the lit chest
  const C=sh([[10,53],[15,53],[15,56],[13,59],[12,59],[10,56]],dy);k.poly(C,H.a[2]);
  k.pts(sh([[10,53],[11,53],[12,53],[13,53],[14,53],[15,53]],dy),H.b);k.pts(sh([[12,55],[13,55],[12,56],[13,56]],dy),H.b);k.px(13,57+dy,H.a[1]);
}
// teacher or adult robes over a shirt and tie, a high collar, or a blouse
function robes(k,s,o,C,inner){
  const dy=o.dy||0;
  coat(k,C,dy);neck(k,s,o);
  if(inner.kind==='tie'){
    k.poly(sh([[27,40],[39,40],[37,50],[36,64],[30,64],[29,50]],dy),inner.W[2]);k.poly(sh([[34,40],[39,40],[37,50],[36,64],[34,64]],dy),inner.W[1]);
    if(inner.vest){k.poly(sh([[27,46],[39,46],[37,52],[36,64],[30,64],[29,52]],dy),inner.vest[2]);k.poly(sh([[33,46],[39,46],[37,52],[36,64],[33,64]],dy),inner.vest[1]);
      k.pts(sh([[33,52],[33,56],[33,60]],dy),inner.vest[3])}
    const T=inner.T;k.poly(sh([[32,42],[34,42],[36,54],[36,64],[30,64],[30,54]],dy),T[2]);
    for(let y=43+dy;y<S;y++)for(let x=29;x<=37;x++){if(k.at(x,y)!==T[2])continue;if(inner.stripe&&((x+y)%6)===0)k.px(x,y,x>=34?inner.stripe[1]:inner.stripe[0]);else if(x>=35||(x===34&&y<54+dy))k.px(x,y,T[1])}
    if(inner.vest){k.poly(sh([[27,47],[33,52],[39,47],[39,64],[27,64]],dy),inner.vest[2]);k.poly(sh([[33,52],[39,47],[39,64],[33,64]],dy),inner.vest[1]);k.pts(sh([[33,54],[33,58],[33,62]],dy),inner.vest[3])}
    lapels(k,C,dy,o.lapel||'notch');collarTie(k,s,dy,inner.W,T);
  }else if(inner.kind==='high'){
    k.poly(sh([[27,40],[39,40],[37,50],[36,64],[30,64],[29,50]],dy),C[2]);k.poly(sh([[33,40],[39,40],[37,50],[36,64],[33,64]],dy),C[1]);
    lapels(k,C,dy,'shawl');
    k.poly(sh([[26,37],[40,37],[41,42],[25,42]],dy),C[3]);k.poly(sh([[33,37],[40,37],[41,42],[33,42]],dy),C[1]);k.row(37+dy,26,39,C[4]);k.row(42+dy,25,41,C[0]);
    if(inner.trim){k.row(42+dy,26,40,inner.trim)}
    (inner.buttons||[]).forEach(y=>{k.px(33,y+dy,inner.btn||'#c9a23a');k.px(34,y+dy,inner.btnD||'#8f7028')});
  }else if(inner.kind==='blouse'){
    const V=inner.V;
    k.poly(sh([[26,41],[40,41],[38,53],[37,64],[29,64],[28,53]],dy),V[2]);k.poly(sh([[34,41],[40,41],[38,53],[37,64],[34,64]],dy),V[1]);
    k.poly(sh([[29,40],[38,40],[34,47],[33,47]],dy),s[3]);k.poly(sh([[34,40],[38,40],[34,47]],dy),s[2]);
    lapels(k,C,dy,o.lapel||'shawl');
    k.poly(sh([[26,39],[29,39],[33,47],[31,48],[28,45],[26,42]],dy),V[3]);k.poly(sh([[40,39],[38,39],[34,47],[35,48],[38,45],[40,42]],dy),V[1]);
    if(inner.pearls){k.pts(sh([[30,41],[32,43],[34,43],[36,42]],dy),'#f2efe8');k.pts(sh([[31,42],[33,43],[35,43],[37,41]],dy),'#c9c4ba')}
  }else if(inner.kind==='dark'){
    const Dk=inner.D;k.poly(sh([[27,40],[39,40],[37,50],[36,64],[30,64],[29,50]],dy),Dk[1]);k.poly(sh([[34,40],[39,40],[37,50],[36,64],[34,64]],dy),Dk[0]);
    k.poly(sh([[29,40],[37,40],[33,45]],dy),s[2]);k.poly(sh([[29,40],[33,40],[33,45]],dy),s[3]);
    k.pts(sh([[28,40],[29,41],[30,42],[31,43],[32,44]],dy),Dk[2]);k.pts(sh([[38,40],[37,41],[36,42],[35,43],[34,44]],dy),Dk[0]);
    lapels(k,C,dy,o.lapel||'shawl');
  }
}

// ---------------- face (facing right). o: sk, lip, age child|teen|adult|old, sex m|f, ear, eye [ir,irL], lash, brow {s,c:[d,m]},
//                  nose, mouth, lines 0-2, freckles, blush, lidded
function face(k,o){
  const s=o.sk,L=o.lip,ch=o.age==='child',f=o.sex==='f',ey=ch?23:22,m0=33;
  // side of the head and ear (Graham), only when no hair covers it
  if(o.ear){
    k.poly([[19,19],[23,17],[24,30],[25,34],[22,33],[20,31]],s[3]);k.pts([[21,30],[22,31],[22,32],[23,32],[23,33]],s[2]);k.pts([[19,22],[20,22]],s[3]);
    k.pts([[18,23],[17,24],[17,25]],s[4]);k.pts([[19,23],[20,23],[18,24],[20,24],[20,25],[17,26],[17,27],[18,27],[20,27],[17,28],[18,28],[19,28],[20,28],[18,29],[19,29],[19,30]],s[3]);
    k.pts([[19,24],[18,25],[18,26]],s[2]);k.pts([[19,25],[19,26]],s[1]);k.px(19,27,s[2]);k.px(20,26,s[4]);k.px(18,30,s[4]);k.px(19,31,s[2]);
  }
  let F;
  if(ch)F=[[22,15],[28,13],[36,13],[43,15],[46,19],[46,25],[45,30],[43,34],[40,37],[37,38],[34,39],[31,39],[28,38],[25,35],[23,31],[22,25],[21,20]];
  else if(f)F=[[22,14],[28,12],[36,12],[42,14],[45,18],[45,24],[44,29],[42,33],[40,36],[37,38],[35,39],[31,39],[28,37],[25,34],[23,30],[22,24],[21,19]];
  else F=[[22,14],[28,12],[36,12],[43,14],[46,18],[46,24],[45,29],[43,33],[41,36],[38,38],[36,39],[31,39],[29,38],[26,36],[24,33],[23,29],[22,24],[21,19]];
  if(o.jaw==='wide')F=F.map(([x,y])=>y>=29&&x<33?[x-1,y]:y>=29&&x>36?[x+1,y]:[x,y]);
  k.poly(F,s[3]);
  // far cheek turned away, near jaw, chin
  if(ch){k.poly([[42,18],[46,19],[46,25],[45,30],[43,34],[40,37],[39,36],[42,32],[43,27],[43,22]],s[2]);
    k.pts([[46,20],[46,21],[46,22],[46,23],[46,24],[45,27],[45,28],[45,29],[44,31],[44,32],[43,33],[42,35],[41,36]],s[1]);
    k.poly([[23,31],[25,35],[28,38],[31,39],[28,39],[25,36]],s[2]);k.pts([[32,37],[33,37]],s[4]);k.row(39,31,35,s[1])}
  else{const e=f?45:46;k.poly([[e-4,17],[e,18],[e,24],[e-1,29],[e-3,33],[e-5,36],[e-7,37],[e-5,32],[e-3,27],[e-3,21]],s[2]);
    k.pts([[e,19],[e,20],[e,21],[e,22],[e,23],[e-1,26],[e-1,27],[e-1,28],[e-2,30],[e-2,31],[e-3,32],[e-4,34],[e-5,35]],s[1]);
    k.poly([[23,31],[24,33],[26,36],[29,38],[31,39],[28,39],[25,36]],s[2]);k.pts([[25,34],[26,35]],s[1]);
    k.pts([[32,38],[33,38],[34,38]],s[4]);k.pts([[31,37],[35,37]],s[3]);k.row(39,31,36,s[2])}
  // light
  const fy=ch?16:15;k.pts([[28,fy],[29,fy],[30,fy-1],[31,fy-1],[32,fy-1],[29,fy+1]],s[4]);
  k.poly(ch?[[23,26],[27,27],[29,29],[27,31],[24,30]]:[[23,24],[27,26],[28,28],[25,29],[23,27]],s[4]);k.px(ch?25:24,ch?28:26,s[5]);
  if(o.blush||ch){k.pts([[40,ch?29:28],[41,ch?29:28]],L[2])}
  // age
  if(o.lines>=1){k.pts([[30,18],[31,18],[32,18]],s[2]);k.px(24,24,s[2]);k.pts([[27,26],[28,26],[29,26]],s[2]);k.pts([[38,26],[39,26],[40,26]],s[2]);k.pts([[32,31],[31,32],[31,33]],s[2]);k.pts([[40,31],[40,32],[41,33]],s[2])}
  if(o.lines>=2){k.row(15,27,33,s[2]);k.row(17,28,32,s[2]);k.row(27,27,30,s[1]);k.pts([[38,27],[39,27]],s[1]);k.pts([[33,30],[32,31],[32,32],[31,33],[31,34],[32,35]],s[1]);k.pts([[39,31],[40,32],[40,33],[40,34],[39,36]],s[1]);k.pts([[30,37],[29,36]],s[2])}
  if(o.freckles){k.pts([[26,ey+5],[28,ey+6],[30,ey+5],[38,ey+5],[40,ey+6],[42,ey+5],[39,ey+7]],o.freckles);k.pts([[29,ey+5],[33,ey+5],[34,ey+6]],o.freckles)}
  // brows
  const by=ey-2,[bd,bm]=o.brow.c,bs=o.brow.s;
  const B={straight:[[[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0]],[[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0]]],
    thin:[[[26,0],[27,0],[28,0],[29,0],[30,0]],[[37,0],[38,0],[39,0],[40,0],[41,0]]],
    arched:[[[26,0],[27,0],[28,-1],[29,-1],[30,-1],[31,0]],[[36,0],[37,-1],[38,-1],[39,-1],[40,-1],[41,0]]],
    worried:[[[26,0],[27,0],[28,0],[29,-1],[30,-1],[31,-1]],[[36,-1],[37,-1],[38,-1],[39,0],[40,0],[41,0]]],
    scowl:[[[25,-1],[26,-1],[27,-1],[28,0],[29,0],[30,1],[31,1]],[[36,1],[37,1],[38,0],[39,0],[40,-1],[41,-1],[42,-1]]],
    raised:[[[26,0],[27,-1],[28,-1],[29,-1],[30,-1],[31,0]],[[37,0],[38,-1],[39,-1],[40,-1],[41,-1],[42,0]]]}[bs];
  B.forEach(side=>side.forEach(([x,d])=>{k.px(x,by+d,bd);if(o.brow.thick)k.px(x,by+d+1,bm)}));
  if(o.brow.thick){k.px(24,by,bm)}
  // eyes
  const [ir,irL]=o.eye,lash=o.lash||s[0];
  if(o.lidded){
    k.row(ey,26,31,s[2]);k.row(ey,37,42,s[2]);k.row(ey+1,26,31,s[2]);k.row(ey+1,37,42,s[2]);k.row(ey+2,26,31,lash);k.row(ey+2,37,42,lash);
    k.px(26,ey+3,SCS);k.px(27,ey+3,SC);k.px(28,ey+3,ir);k.px(29,ey+3,PU);k.px(30,ey+3,SCS);k.px(31,ey+3,s[2]);
    k.px(37,ey+3,SCS);k.px(38,ey+3,ir);k.px(39,ey+3,PU);k.px(40,ey+3,SC);k.px(41,ey+3,SCS);k.px(42,ey+3,s[2]);
  }else{
    k.row(ey,26,31,s[2]);k.row(ey,37,42,s[2]);k.row(ey+1,26,31,lash);k.row(ey+1,37,42,lash);
    k.px(26,ey+2,SCS);k.px(27,ey+2,SC);k.px(28,ey+2,irL);k.px(29,ey+2,PU);k.px(30,ey+2,SC);k.px(31,ey+2,s[2]);
    k.pts([[28,ey+3],[29,ey+3]],ir);k.row(ey+3,26,27,s[3]);k.px(30,ey+3,s[3]);
    k.px(37,ey+2,SCS);k.px(38,ey+2,irL);k.px(39,ey+2,PU);k.px(40,ey+2,SC);k.px(41,ey+2,SCS);k.px(42,ey+2,s[2]);
    k.pts([[38,ey+3],[39,ey+3]],ir);k.px(40,ey+3,s[2]);k.px(37,ey+3,s[2]);
  }
  if(f){k.px(25,ey+1,lash);k.px(43,ey+1,lash)}
  if(o.lines>=2){k.row(ey-1,26,31,s[1]);k.row(ey-1,37,42,s[1]);k.row(ey+4,26,31,s[2]);k.row(ey+4,37,42,s[2])}
  // nose
  const n=o.nose||'straight';
  if(n==='button'){k.pts([[35,ey+3],[35,ey+4],[35,ey+5]],s[4]);k.poly([[36,ey+4],[38,ey+6],[38,ey+8],[36,ey+8]],s[2]);k.px(35,ey+6,s[4]);k.px(35,ey+7,s[5]);k.px(36,ey+7,s[3]);k.px(36,ey+8,s[1]);k.px(37,ey+8,s[1]);k.px(34,ey+8,s[2])}
  else if(n==='long'){k.pts([[34,22],[35,23],[35,24]],s[4]);k.pts([[36,25],[36,26]],s[4]);k.px(36,25,s[5]);k.pts([[36,27],[35,28]],s[4]);k.poly([[37,24],[39,28],[39,31],[37,31]],s[2]);k.px(38,30,s[1]);k.px(36,29,s[4]);k.px(36,30,s[5]);k.px(37,30,s[3]);k.pts([[34,31],[35,31]],s[2]);k.px(37,32,s[1]);k.px(36,32,s[2]);k.px(38,32,s[1])}
  else if(n==='hook'){k.pts([[34,21],[35,22],[35,23],[36,24],[36,25],[36,26],[36,27]],s[4]);k.px(35,23,s[5]);k.poly([[37,23],[39,28],[39,31],[37,31]],s[2]);k.px(38,30,s[1]);k.px(36,28,s[4]);k.px(36,29,s[5]);k.px(37,29,s[3]);k.px(36,30,s[3]);k.pts([[34,31],[35,31]],s[2]);k.px(37,32,s[1]);k.px(36,32,s[2]);k.px(38,32,s[1])}
  else if(n==='broad'){k.pts([[35,23],[35,24],[35,25],[35,26],[35,27]],s[4]);k.poly([[36,24],[39,27],[40,30],[36,30]],s[2]);k.px(38,29,s[1]);k.px(35,28,s[4]);k.px(35,29,s[5]);k.px(36,29,s[3]);k.pts([[33,30],[34,30]],s[2]);k.px(36,31,s[1]);k.px(35,31,s[2]);k.px(37,31,s[1]);k.px(39,31,s[1]);k.pts([[35,32],[36,32]],s[2])}
  else{k.pts([[35,23],[35,24],[35,25],[35,26],[35,27]],s[4]);k.px(34,22,s[3]);k.poly([[36,24],[38,27],[38,30],[36,30]],s[2]);k.px(37,29,s[1]);k.px(35,28,s[4]);k.px(35,29,s[5]);k.px(36,29,s[3]);k.pts([[33,30],[34,30]],s[2]);k.px(36,31,s[1]);k.px(35,31,s[2]);k.px(37,31,s[1]);k.pts([[35,32],[36,32]],s[2])}
  // mouth
  const [lp1,lp2,lpL,mo]=L,mu=o.mouth||'calm',tth='#efe7da';
  if(mu==='grin'&&ch){k.px(32,m0-1,s[2]);k.px(39,m0-1,s[2]);k.px(33,m0,mo);k.row(m0,34,37,lp1);k.px(38,m0,mo);k.px(33,m0+1,mo);k.row(m0+1,34,37,tth);k.px(37,m0+1,'#cfc5b6');k.px(38,m0+1,mo);k.row(m0+2,34,37,mo);k.row(m0+3,35,36,lp2);k.px(35,m0+3,s[4])}
  else if(mu==='grin'){k.pts([[32,m0-1],[31,m0-2]],s[2]);k.px(40,m0-2,s[2]);k.px(39,m0-1,s[1]);k.px(32,m0,mo);k.row(m0,34,38,lp1);k.px(39,m0,mo);k.px(33,m0+1,mo);k.row(m0+1,34,38,tth);k.px(38,m0+1,'#cfc5b6');k.px(39,m0+1,mo);k.row(m0+2,34,38,mo);k.row(m0+3,35,37,lp2);k.px(35,m0+3,s[4])}
  else if(mu==='smile'){k.px(32,m0-1,s[2]);k.px(39,m0-1,s[2]);k.px(33,m0,mo);k.row(m0,34,37,f?lp1:s[2]);k.px(38,m0,mo);k.row(m0+1,34,37,mo);k.row(m0+2,35,36,lp2);k.px(35,m0+2,f?lpL:s[4])}
  else if(mu==='tight'){k.row(m0,34,37,s[2]);k.row(m0+1,34,37,mo);k.px(33,m0+1,s[2]);k.px(38,m0+1,s[1]);k.row(m0+2,35,36,s[2])}
  else if(mu==='frown'){k.row(m0,34,37,s[2]);k.row(m0+1,34,37,mo);k.px(33,m0+2,mo);k.px(38,m0+2,mo);k.row(m0+2,35,36,lp2)}
  else if(mu==='smirk'){k.row(m0,34,36,s[2]);k.row(m0+1,34,37,mo);k.px(38,m0,mo);k.px(39,m0-1,s[2]);k.px(33,m0+1,s[1]);k.row(m0+2,35,36,lp2)}
  else if(mu==='thin'){k.row(m0+1,35,37,lp1);k.px(34,m0+1,s[2]);k.row(m0+2,34,37,mo);k.px(33,m0+2,s[2]);k.px(38,m0+2,s[1]);k.row(m0+3,35,37,lp2);k.px(35,m0+3,lpL)}
  else{k.row(m0,34,37,lp1);k.px(33,m0,s[2]);k.px(32,m0,s[2]);k.row(m0+1,34,37,mo);k.px(33,m0+1,s[1]);k.px(38,m0+1,s[1]);k.row(m0+2,35,37,lp2);k.px(34,m0+2,s[3]);k.px(35,m0+2,s[4]);k.pts([[35,m0+3],[36,m0+3]],s[2])}
}
const P=(sk,extra)=>Object.assign({sk:SKIN[sk],lip:LIPS[sk]},extra);

// ---------------- hair helpers (facing right)
// neat side parting, short back and sides (Graham's cut)
function hairParted(k,h,hi){
  k.poly([[16,20],[16,13],[19,8],[24,5],[31,4],[38,4],[44,6],[48,10],[49,15],[48,19],[45,16],[40,13],[34,12],[28,12],[25,14],[23,17],[22,21],[18,22]],h[1]);
  k.clump([[16,19],[16,13],[19,9],[24,6],[26,6],[24,11],[21,15],[19,20]],h[2],h[3],h[1]);
  k.clump([[26,6],[31,4],[38,4],[43,6],[38,8],[31,9],[27,10]],h[2],h[3],h[1]);
  k.clump([[26,10],[32,8],[39,8],[45,10],[48,14],[43,13],[36,11],[29,12]],h[2],h[3],h[1]);
  k.clump([[25,14],[29,12],[35,12],[42,13],[47,16],[48,19],[45,18],[41,16],[35,14],[29,14],[26,16]],h[2],h[3],h[1]);
  k.clump([[18,20],[21,17],[23,17],[23,23],[22,25],[21,23],[19,22]],h[1],h[2],h[0]);
  k.clump([[38,14],[42,14],[44,17],[43,19],[41,17]],h[2],h[3],h[1]);
  k.pts([[20,10],[21,9],[22,8],[29,5],[30,5],[31,5],[33,9],[34,9],[35,9],[31,13],[32,13],[39,14]],hi||h[4]);
  k.pts([[25,7],[25,8],[24,9],[24,10],[23,12]],h[0]);
}
// messy, chunky (George's cut, shorter at the sides)
function hairMessy(k,h,long){
  k.poly([[15,22],[15,13],[18,8],[24,4],[31,3],[39,3],[45,5],[49,10],[50,16],[49,22],[46,17],[40,14],[34,13],[28,13],[25,15],[23,18],[22,23],[18,24]],h[1]);
  k.clump([[15,21],[15,13],[18,8],[23,5],[26,6],[24,11],[21,15],[18,22]],h[2],h[3],h[1]);
  k.clump([[24,6],[30,3],[38,3],[44,5],[39,8],[31,8],[26,10]],h[3],h[4],h[2]);
  k.clump([[26,10],[32,7],[40,7],[46,10],[49,15],[44,14],[37,11],[30,12]],h[3],h[4],h[2]);
  k.clump([[24,16],[27,12],[33,12],[37,13],[35,16],[31,15],[27,17]],h[2],h[3],h[1]);
  k.clump([[35,13],[41,13],[46,16],[48,21],[45,19],[41,16],[37,15]],h[2],h[3],h[1]);
  if(long)k.clump([[16,20],[19,17],[22,18],[22,23],[21,26],[19,23],[17,22]],h[2],h[3],h[1]);
  k.pts([[25,7],[24,9],[23,11]],h[1]);
}
const hairShadow=(k,s,L)=>k.pts(L,s[2]);


// ---------------- extras
function glasses(k,ey,round,fr,frL){
  const y0=ey,y1=ey+4;
  k.row(y0,round?27:26,round?30:31,frL);k.row(y1,round?27:26,round?30:31,fr);for(let y=y0+1;y<y1;y++){k.px(25,y,fr);k.px(32,y,fr)}
  k.row(y0,round?38:37,round?41:42,frL);k.row(y1,round?38:37,round?41:42,fr);for(let y=y0+1;y<y1;y++){k.px(36,y,fr);k.px(43,y,fr)}
  if(round){k.px(26,y0+1,frL);k.px(31,y0+1,fr);k.px(26,y1-1,fr);k.px(31,y1-1,fr);k.px(37,y0+1,frL);k.px(42,y0+1,fr);k.px(37,y1-1,fr);k.px(42,y1-1,fr)}
  k.pts([[33,y0+1],[34,y0+1],[35,y0+1]],fr);k.pts([[24,y0+1],[23,y0+1],[22,y0+1],[21,y0+1]],fr);
  k.px(round?27:26,y0+1,'#eef3f2');k.px(round?38:37,y0+1,'#eef3f2');
}
// short beard growth over the lower face, only on skin
function stubble(k,s,c,y0){const b=hex(c),mix=(h,t)=>{const a=hex(h);return '#'+a.map((v,i)=>Math.round(v*(1-t)+b[i]*t).toString(16).padStart(2,'0')).join('')};
  const m={};[2,3,4].forEach(i=>m[s[i]]=mix(s[i],.38));
  for(let y=y0;y<40;y++)for(let x=20;x<47;x++){const a=k.at(x,y);if(m[a]){const t=(y-y0)/3;if(t<1&&(x*7+y*3)%3)continue;k.px(x,y,(x*5+y*11)%9===0?mix(a,.6):m[a])}}}
// tight curls for short or set hair: strokes over a mass
function curlStrokes(k,L,h){L.forEach(([x,y],i)=>{k.pts([[x-1,y],[x-1,y-1],[x,y-1],[x+1,y-1]],h[3]);k.px(x-1,y-1,i%3?h[3]:h[4]);k.pts([[x+1,y+1],[x,y+1],[x+2,y]],h[1]);k.px(x+1,y+2,h[0])})}
function pinstripe(k,c,y0){for(let y=y0;y<S;y++)for(let x=0;x<S;x++){const a=k.at(x,y);if(x%3===0&&(a===c[2]||a===c[1]||a===c[3]))k.px(x,y,a===c[1]?c[2]:c[3])}}

// ================================================================ CHARACTERS
const C={};
const kid={age:'child',slim:true,dy:2};

// ---- Dez Achterberg: blond, messy, a salesman's grin
C['Desmond Achterberg']=ctx=>{const k=kit(ctx),o=P(1,Object.assign({},kid,{ear:true,eye:EYE.blue,brow:{s:'raised',c:['#a0803e','#c4a45a']},nose:'button',mouth:'grin'})),h=HAIR.blond;
  uniform(k,o.sk,o,'gryffindor');face(k,o);
  hairMessy(k,h);
  // spikier crown, tufts every way
  k.clump([[44,7],[49,5],[48,10]],h[2],h[3],h[1]);k.clump([[19,9],[17,5],[23,6]],h[2],h[3],h[1]);k.clump([[33,4],[36,1],[38,4]],h[3],h[4],h[2]);
  k.clump([[30,13],[33,17],[35,13]],h[2],h[3],h[1]);
  hairShadow(k,o.sk,[[26,18],[27,17],[34,17],[36,17],[40,17],[44,19]]);
  k.finish(false)};
// ---- Felix Wardle: neat parting, precise, apologetic
C['Felix Wardle']=ctx=>{const k=kit(ctx),o=P(0,Object.assign({},kid,{ear:true,eye:EYE.grey,brow:{s:'worried',c:['#2a1c14','#3a2618']},nose:'button',mouth:'tight'})),h=HAIR.dkbrown;
  uniform(k,o.sk,o,'gryffindor');face(k,o);
  hairParted(k,h);
  k.pts([[27,15],[28,14],[29,14],[34,14],[35,15],[40,15],[43,17]],o.sk[2]);
  k.finish(true)};
// ---- Marcus Thistlewood: short black hair, chin up, pleased with himself
C['Marcus Thistlewood']=ctx=>{const k=kit(ctx),o=P(1,Object.assign({},kid,{ear:true,jaw:'wide',eye:EYE.dkbrown,brow:{s:'straight',c:['#14121a','#26232e']},nose:'button',mouth:'smirk'})),h=HAIR.black;
  uniform(k,o.sk,o,'gryffindor');face(k,o);
  k.poly([[17,21],[17,13],[20,8],[25,5],[31,4],[37,4],[43,6],[47,10],[48,15],[47,19],[44,17],[38,15],[30,15],[25,16],[23,18],[22,22],[19,22]],h[1]);
  k.clump([[18,19],[18,13],[21,8],[26,6],[25,10],[22,14],[20,19]],h[2],h[3],h[1]);
  k.clump([[26,6],[31,4],[37,4],[42,6],[37,8],[30,9]],h[2],h[3],h[1]);
  k.clump([[25,11],[31,9],[38,9],[45,11],[47,15],[42,14],[35,13],[28,14]],h[2],h[3],h[1]);
  [[[24,13],[28,12],[27,17]],[[29,13],[33,12],[32,16]],[[34,13],[38,13],[37,16]],[[39,14],[43,15],[41,17]]].forEach(L=>k.clump(L,h[2],h[3],h[1]));   // a short, pushed-forward fringe
  k.pts([[22,8],[23,7],[24,6],[29,5],[30,5],[33,9],[34,9],[39,10],[40,10]],h[4]);k.pts([[20,11],[21,10],[27,7],[28,7],[36,6],[37,6],[44,9],[45,10],[30,12],[42,13]],h[3]);
  k.pts([[28,4],[34,3],[40,5],[45,7]],h[1]);
  k.pts([[21,19],[21,20],[21,21],[22,22]],h[1]);                                         // short sideburn
  k.pts([[26,18],[31,17],[36,17],[41,18],[44,18]],o.sk[2]);
  k.finish(false)};
// ---- Barnaby Fenwick: ginger curls, freckles, a scowl at the world
C['Barnaby Fenwick']=ctx=>{const k=kit(ctx),o=P(2,Object.assign({},kid,{ear:false,eye:EYE.hazel,brow:{s:'scowl',c:['#7a3216','#a04a22'],thick:true},nose:'button',mouth:'frown',freckles:'#a8603e'})),h=HAIR.ginger;
  // a scalloped mass, then curl strokes: a lit arc up-left, a shadow under each
  const M=[[15,30],[13,26],[14,22],[13,18],[15,14],[15,10],[18,7],[21,4],[25,3],[29,1],[33,2],[37,1],[41,3],[45,4],[48,7],[50,10],[50,14],[51,18],[50,22],[48,25],[46,19],[41,17],[35,18],[29,17],[24,19],[21,24],[19,31]];
  k.poly(M,h[1]);
  uniform(k,o.sk,o,'gryffindor');face(k,o);
  k.poly(M,h[2]);
  const cs=[[17,9],[22,5],[27,4],[32,4],[37,3],[42,5],[46,8],[15,14],[20,10],[25,9],[30,8],[35,8],[40,8],[45,11],[49,13],[16,19],[21,15],[26,14],[31,13],[36,13],[41,13],[46,16],[49,19],[15,24],[19,20],[24,18],[29,17],[34,17],[39,17],[44,19],[16,28],[19,25]];
  cs.forEach(([x,y],i)=>{k.pts([[x-1,y],[x-1,y-1],[x,y-1],[x+1,y-1]],h[3]);k.px(x-1,y-1,i%3?h[3]:h[4]);k.pts([[x+1,y+1],[x,y+1],[x+2,y]],h[1]);k.px(x+1,y+2,h[0])});
  k.pts([[20,5],[25,3],[30,2],[36,2],[41,4]],h[4]);
  k.pts([[27,17],[32,17],[33,17],[39,18],[44,19]],o.sk[2]);
  k.finish(true)};
// ---- Wren Kowalczyk: long brown hair, a blunt fringe, deadpan
C['Wren Kowalczyk']=ctx=>{const k=kit(ctx),o=P(1,Object.assign({},kid,{sex:'f',ear:false,eye:EYE.brown,lidded:true,brow:{s:'thin',c:['#3e281f','#5f3f2d']},nose:'button',mouth:'tight'})),h=HAIR.ltbrown;
  k.poly([[14,18],[17,9],[24,5],[33,4],[41,5],[47,9],[50,16],[50,32],[49,46],[46,52],[41,52],[39,46],[37,40],[28,40],[25,46],[22,54],[13,56],[13,40],[13,26]],h[1]);
  uniform(k,o.sk,o,'hufflepuff');face(k,o);
  // fringe, cut straight across
  k.clump([[19,10],[24,6],[33,5],[42,6],[47,10],[47,18],[44,19],[40,19],[34,19],[28,19],[24,19],[21,20]],h[2],h[3],h[1]);
  for(let x=22;x<=46;x+=3){k.px(x,19,h[1]);k.px(x,18,h[1])}
  // hair falling past the face on both sides
  k.clump([[20,12],[23,18],[22,26],[22,36],[23,44],[22,52],[17,55],[14,52],[14,40],[15,26],[16,16]],h[2],h[3],h[1]);
  k.clump([[44,14],[48,16],[49,28],[48,42],[46,50],[43,48],[45,36],[46,24]],h[1],h[2],h[0]);
  k.pts([[27,7],[28,6],[29,6],[30,6],[31,5],[32,5],[33,5],[34,5]],h[4]);
  for(let y=16;y<=48;y++){k.px(17,y,y%7<4?h[3]:h[2])}
  k.row(20,23,45,o.sk[2]);
  k.finish(false)};
// ---- Corin Mallory: sixteen, handsome, generous, swept parting
C['Corin Mallory']=ctx=>{const k=kit(ctx),o=P(1,{age:'teen',ear:true,eye:EYE.blue,brow:{s:'straight',c:['#2e1f19','#45302a']},nose:'straight',mouth:'smile'}),h=HAIR.dkbrown;
  uniform(k,o.sk,o,'ravenclaw');face(k,o);
  k.poly([[16,20],[16,13],[19,7],[25,3],[33,2],[41,3],[46,6],[49,11],[49,17],[47,20],[44,16],[39,13],[33,12],[28,12],[25,14],[23,17],[22,21],[18,22]],h[1]);
  k.clump([[16,19],[16,13],[19,8],[25,4],[27,5],[24,10],[21,15],[19,20]],h[2],h[3],h[1]);
  k.clump([[27,5],[33,2],[41,3],[46,7],[40,7],[33,6]],h[3],h[4],h[2]);
  k.clump([[25,10],[32,6],[40,7],[46,10],[49,15],[44,13],[37,10],[30,11]],h[2],h[3],h[1]);
  k.clump([[24,14],[30,11],[37,11],[43,13],[48,17],[47,20],[43,17],[37,14],[31,14],[27,16]],h[2],h[3],h[1]);
  k.clump([[36,13],[41,14],[43,18],[42,21],[40,17]],h[2],h[3],h[1]);                   // the lock over the brow
  k.clump([[18,20],[21,17],[23,17],[23,23],[22,25],[21,23],[19,22]],h[1],h[2],h[0]);
  k.pts([[20,9],[21,8],[22,7],[29,4],[30,4],[31,4],[32,4],[35,8],[36,8],[37,8],[33,12],[34,12]],h[4]);
  k.pts([[26,17],[27,16],[28,15],[35,15],[36,15],[39,16],[44,19],[45,19]],o.sk[2]);
  k.finish(true)};

// ---- Mrs Ida Glossop: a shopkeeper's smile, a permanent set, beads that may not be what she says
C['Mrs Ida Glossop']=ctx=>{const k=kit(ctx),o=P(1,{sex:'f',slim:true,ear:false,lines:2,eye:EYE.blue,brow:{s:'arched',c:['#6e6c74','#94929a']},nose:'button',mouth:'smile',blush:true}),h=HAIR.grey;
  const M=[[14,30],[13,22],[14,14],[17,8],[23,4],[31,3],[39,3],[45,6],[49,11],[50,18],[49,26],[46,28],[45,19],[40,15],[30,15],[24,17],[21,24],[19,31]];
  k.poly(M,h[1]);
  robes(k,o.sk,o,['#2a1420','#3e1e30','#583048','#744862','#94687e'],{kind:'blouse',V:['#a49680','#c8bca4','#e2d8c2','#f2ecdc']});
  k.pts([[29,41],[30,42],[31,43],[32,43],[33,44],[34,44],[35,43],[36,43],[37,42],[38,41]],'#b8762e');k.pts([[30,42],[32,43],[34,44],[36,43]],'#e0a24a');   // amber beads
  face(k,o);
  k.poly(M,h[2]);
  curlStrokes(k,[[17,10],[22,6],[27,5],[32,4],[37,4],[42,6],[46,9],[15,15],[20,11],[25,9],[30,8],[35,8],[40,8],[45,12],[48,15],[15,20],[20,16],[25,13],[30,12],[35,12],[40,12],[45,16],[48,20],[15,25],[19,21],[47,24],[17,29]],h);
  k.pts([[26,16],[31,15],[36,16],[41,16],[44,19]],o.sk[2]);
  k.pts([[20,50],[21,49],[22,50],[21,51]],'#b8762e');k.px(21,50,'#e8c46a');                  // a 'relic' brooch
  k.finish(true)};
// ---- Absalom Pike: Ministry pinstripe, forms for everything, a neat moustache
C['Absalom Pike']=ctx=>{const k=kit(ctx),o=P(0,{ear:true,lines:1,eye:EYE.grey,brow:{s:'straight',c:['#3e281f','#5f3f2d']},nose:'long',mouth:'tight'}),h=HAIR.brown;
  const N=['#0e1220','#181e33','#232b47','#323c5e','#4a5679'];
  robes(k,o.sk,o,N,{kind:'tie',W:SHIRT,T:['#2e0f22','#4a1838','#66244e','#86386a']});
  pinstripe(k,N,44);
  k.pts([[22,49],[23,48],[24,49],[23,50]],'#c9a23a');k.px(23,49,'#f0d070');                 // Ministry pin
  face(k,o);
  // receding, combed flat, grey at the temples
  k.poly([[16,22],[16,14],[19,9],[24,6],[31,5],[38,5],[44,7],[48,11],[49,16],[47,18],[44,15],[39,12],[33,10],[27,10],[24,12],[22,16],[21,21],[18,23]],h[1]);
  k.clump([[17,20],[17,13],[20,9],[25,7],[27,8],[24,12],[21,16],[19,21]],h[2],h[3],h[1]);
  k.clump([[27,8],[33,6],[40,6],[46,9],[48,14],[44,13],[38,10],[31,9]],h[2],h[3],h[1]);
  for(let x=27;x<46;x+=3)k.px(x,8+Math.round((x-27)/6),h[1]);                               // comb lines
  k.pts([[17,17],[17,18],[18,19],[18,20],[19,21],[47,12],[48,13]],HAIR.grey[3]);             // grey temples
  k.pts([[30,7],[31,7],[32,7],[36,7],[37,7]],h[4]);
  k.pts([[25,13],[26,12],[33,11],[38,12],[43,15]],o.sk[2]);
  k.row(32,33,38,h[1]);k.px(34,32,h[2]);k.px(37,32,h[0]);                                    // pencil moustache
  k.finish(false)};
// ---- Professor Delia Haverstock: Potions, Slytherin, dry, a close silver-black crop
C['Professor Delia Haverstock']=ctx=>{const k=kit(ctx),o=P(3,{sex:'f',slim:true,ear:true,lines:1,eye:EYE.dkbrown,brow:{s:'straight',c:['#14121a','#26232e']},nose:'straight',mouth:'thin'}),h=['#0d0c10','#1a181e','#2a2730','#6e6c74','#a6a4ae'];
  const G=['#0c1a12','#142a1d','#1e3d2b','#2b553d','#3e7055'];
  robes(k,o.sk,o,G,{kind:'high',trim:'#a9b0b3',buttons:[47,51,55,59],btn:'#c8cdd0',btnD:'#7d8487'});
  face(k,o);
  k.px(20,31,'#c8cdd0');                                                                      // silver stud
  const M=[[17,22],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[48,18],[46,17],[41,13],[33,12],[26,13],[23,16],[22,21],[19,23]];
  k.poly(M,h[2]);
  curlStrokes(k,[[19,10],[24,7],[29,6],[34,6],[39,6],[44,9],[19,15],[24,11],[29,10],[34,10],[39,10],[44,13],[47,15],[20,19]],h);
  k.pts([[21,9],[27,6],[33,5],[40,6],[45,9]],h[4]);
  k.pts([[25,15],[26,14],[32,13],[38,14],[43,16]],o.sk[2]);
  k.finish(true)};
// ---- Professor Ambrose Kettering: Defence, ex-Auror, a scar through the brow, kind and blunt
C['Professor Ambrose Kettering']=ctx=>{const k=kit(ctx),o=P(2,{ear:true,lines:1,eye:EYE.hazel,brow:{s:'straight',c:['#3e281f','#5f3f2d'],thick:true},nose:'broad',mouth:'smile'}),h=HAIR.brown;
  const Bn=['#1e140e','#2e2016','#45301f','#5e432b','#7a5a3a'];
  robes(k,o.sk,o,Bn,{kind:'dark',D:['#2a2e36','#3a404a','#4e5662']});
  face(k,o);
  stubble(k,o.sk,'#8a6448',31);
  k.pts([[28,18],[28,19],[27,20],[27,21]],'#e9c2a2');k.pts([[29,19],[28,21]],o.sk[1]);k.pts([[26,26],[26,27],[25,28],[25,29]],'#e9c2a2');k.pts([[27,27],[26,29]],o.sk[1]);  // the scar
  k.poly([[17,21],[17,13],[20,8],[26,5],[34,4],[41,5],[46,8],[48,13],[48,17],[46,16],[41,13],[34,12],[27,12],[24,14],[22,18],[21,22],[19,22]],h[1]);
  k.clump([[18,19],[18,13],[21,9],[26,6],[25,10],[22,14],[20,19]],h[2],h[3],h[1]);
  k.clump([[26,6],[34,4],[41,6],[37,8],[30,9]],h[2],h[3],h[1]);
  k.clump([[25,10],[31,9],[38,9],[45,11],[47,15],[42,14],[35,13],[28,13]],h[2],h[3],h[1]);
  k.pts([[18,15],[18,16],[19,17],[19,18],[20,19],[47,11],[47,12],[30,6],[37,6]],HAIR.grey[3]);   // greying
  k.pts([[21,9],[22,8],[29,5],[30,5],[34,10],[35,10]],h[4]);
  k.pts([[26,15],[27,14],[33,13],[39,14],[44,16]],o.sk[2]);
  k.finish(false)};
// ---- Professor Neville Longbottom: Herbology, Head of Gryffindor; a gardener's cardigan, soil on one cheek
C['Professor Neville Longbottom']=ctx=>{const k=kit(ctx),o=P(1,{ear:true,lines:0,eye:EYE.brown,brow:{s:'raised',c:['#3e281f','#5f3f2d'],thick:true},nose:'broad',mouth:'smile'}),h=HAIR.brown;
  const Mo=['#1e2614','#2e3a1e','#43522c','#5a6b3c','#77894f'];
  robes(k,o.sk,o,Mo,{kind:'tie',W:SHIRT,T:HOUSE.gryffindor.a,stripe:[HOUSE.gryffindor.b,HOUSE.gryffindor.bD]},);
  // a sprig in the pocket
  k.pts([[12,50],[13,49],[13,51],[14,48],[11,49]],'#5e8e3a');k.pts([[12,49],[14,49]],'#86b456');k.pts([[13,52],[13,53]],'#4a3a22');
  k.row(53,10,17,Mo[1]);k.row(52,10,17,Mo[4]);
  face(k,o);
  k.pts([[24,29],[25,30],[25,29]],'#9a7a5a');                                              // soil
  // short, tousled, a fringe that will not stay put
  k.poly([[17,21],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[48,18],[46,18],[42,15],[35,14],[28,14],[25,15],[23,18],[22,22],[19,22]],h[1]);
  k.clump([[18,19],[18,13],[21,8],[26,6],[25,11],[22,15],[20,19]],h[2],h[3],h[1]);
  k.clump([[25,7],[31,4],[38,4],[44,7],[38,9],[30,9]],h[3],h[4],h[2]);
  k.clump([[24,11],[31,8],[39,8],[46,11],[48,16],[42,14],[34,12],[27,13]],h[2],h[3],h[1]);
  [[[23,14],[27,11],[28,18]],[[28,12],[33,11],[32,17]],[[33,12],[38,12],[38,16]],[[38,13],[43,13],[43,18]],[[43,14],[47,15],[47,20]]].forEach(L=>k.clump(L,h[2],h[3],h[1]));
  k.clump([[30,5],[32,1],[35,4]],h[3],h[4],h[2]);k.clump([[42,6],[46,3],[46,8]],h[2],h[3],h[1]);
  k.pts([[21,9],[22,8],[28,6],[29,5],[30,5],[33,9],[34,9],[40,9],[41,10],[25,14],[35,13]],h[4]);
  k.pts([[21,19],[21,20],[21,21]],h[1]);
  k.pts([[26,18],[27,17],[28,17],[36,16],[37,16],[40,17],[44,19],[45,20]],o.sk[2]);
  k.finish(false)};
// ---- Professor Minerva McGonagall: Headmistress; silver hair in a tight bun, square spectacles, tartan at the collar
C['Professor Minerva McGonagall']=ctx=>{const k=kit(ctx),o=P(0,{sex:'f',slim:true,ear:false,lines:2,eye:EYE.grey,brow:{s:'straight',c:['#8a8890','#b0aeb4']},nose:'long',mouth:'thin'}),h=HAIR.white;
  // the bun, at the back of the head
  k.clump([[11,10],[13,6],[17,5],[20,8],[19,13],[14,14]],h[2],h[3],h[1]);k.pts([[13,8],[15,7],[16,10],[14,11]],h[1]);
  const E=['#0a2418','#103624','#185034','#226a46','#348a5e'];
  robes(k,o.sk,o,E,{kind:'high'});
  // tartan band at the collar
  for(let x=25;x<=41;x++)for(let y=38;y<=41;y++){if(k.at(x,y)===E[3]||k.at(x,y)===E[1]||k.at(x,y)===E[4]||k.at(x,y)===E[0]){const c=(x%4===0||y===40)?'#7e1f24':(x+y)%2?'#123a24':'#1d2a20';k.px(x,y,c)}}
  k.pts([[32,42],[33,41],[34,42],[33,43]],'#c9a23a');k.px(33,42,'#3e8a5a');                 // brooch
  face(k,o);
  glasses(k,22,false,'#2a2224','#5a4a46');
  // hair drawn tight back from a centre parting
  k.poly([[18,20],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[47,18],[44,15],[39,12],[33,12],[27,12],[24,14],[22,17],[21,21]],h[2]);
  k.clump([[18,20],[17,13],[20,8],[26,5],[32,5],[28,9],[24,13],[21,18]],h[2],h[3],h[1]);
  k.clump([[33,5],[40,5],[45,8],[48,13],[47,17],[43,13],[37,10]],h[1],h[2],h[0]);
  k.pts([[32,5],[32,6],[32,7],[32,8],[33,9],[33,10],[33,11]],h[0]);
  [[22,10,26,7],[24,13,29,9],[36,8,42,10],[38,12,44,14]].forEach(([a,b,c,d])=>{k.px(a,b,h[1]);k.px(c,d,h[1])});
  k.pts([[23,9],[24,8],[25,7],[38,7],[39,7]],h[4]);
  k.pts([[25,14],[26,13],[33,13],[34,13],[39,14],[43,16]],o.sk[2]);
  k.finish(false)};

// ---- Professor Filius Flitwick: Charms, Deputy Head; tiny, cheerful, a white moustache and flyaway hair
C['Professor Filius Flitwick']=ctx=>{const k=kit(ctx),o=P(0,{ear:true,lines:2,eye:EYE.blue,blush:true,brow:{s:'raised',c:['#cfcdcf','#ebe9e6'],thick:true},nose:'button',mouth:'smile'}),h=HAIR.white;
  const B=['#0f1b38','#182a52','#22396e','#34508e','#4c6aa8'];
  robes(k,o.sk,o,B,{kind:'high',trim:'#b07c40',buttons:[47,51,55,59],btn:'#d09a50',btnD:'#7a5226'});
  face(k,o);
  k.poly([[30,31],[33,30],[36,31],[39,30],[42,32],[41,34],[38,33],[35,34],[32,33],[29,34]],h[2]);k.pts([[31,31],[32,31],[37,31],[38,31]],h[4]);k.pts([[30,33],[41,33]],h[1]);  // moustache
  // flyaway white hair round a bald top
  k.poly([[21,15],[22,10],[26,7],[32,6],[39,7],[44,9],[46,13],[44,13],[37,10],[29,10],[23,13]],o.sk[3]);k.pts([[28,8],[29,8],[30,7],[31,7]],o.sk[5]);k.pts([[26,9],[32,8],[33,8]],o.sk[4]);
  k.poly([[14,24],[13,17],[15,11],[19,8],[22,10],[22,16],[20,22],[18,26]],h[1]);k.clump([[15,22],[14,16],[16,12],[19,10],[21,13],[20,19],[18,24]],h[2],h[3],h[1]);
  k.poly([[44,10],[48,10],[52,14],[52,20],[50,24],[48,20],[46,14]],h[1]);k.clump([[45,11],[48,12],[50,16],[49,21],[47,16]],h[2],h[3],h[1]);
  k.pts([[13,15],[12,13],[16,9],[17,8],[51,12],[53,13],[53,21]],h[2]);k.pts([[15,13],[16,15],[49,14]],h[4]);
  k.finish(false)};
// ---- Professor Moira Penhaligon: Transfiguration, Head of Hufflepuff; warm, exact, braids up in a crown
C['Professor Moira Penhaligon']=ctx=>{const k=kit(ctx),o=P(4,{sex:'f',slim:true,ear:true,lines:1,eye:EYE.dkbrown,brow:{s:'arched',c:['#0d0c10','#1a181e']},nose:'broad',mouth:'smile'}),h=['#0a0908','#161310','#241f1a','#3a332b','#574d41'];
  const Y=['#4a3a0c','#6e5614','#94741e','#b8922c','#d6ae44'];
  robes(k,o.sk,o,Y,{kind:'high',trim:'#1c1a14',buttons:[47,51,55,59],btn:'#1c1a14',btnD:'#0e0d0a'});
  face(k,o);
  k.pts([[19,31],[19,32],[20,33],[19,34],[18,33]],'#d6ae44');k.px(19,33,'#f2d070');           // gold hoop
  // braids wound up into a crown
  k.poly([[18,20],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[47,18],[44,15],[38,13],[30,13],[25,14],[22,17],[21,21]],h[2]);
  for(let i=0;i<9;i++){const x=19+i*3.2,y=8-Math.sin(i/8*Math.PI)*4;k.curl(x,y,2.2,1.8,h)}
  for(let i=0;i<7;i++){const x=22+i*3.6,y=12-Math.sin(i/6*Math.PI)*2;k.curl(x,y,2,1.6,h)}
  k.pts([[22,4],[30,1],[38,2],[45,5]],h[3]);k.clump([[26,1],[31,-1],[36,0],[33,3]],h[2],h[3],h[1]);
  k.pts([[25,15],[26,14],[33,14],[34,14],[40,15],[44,17]],o.sk[2]);
  k.finish(true)};
// ---- Rubeus Hagrid: Keeper of Keys; a wild mane, a tangled beard, eyes like black beetles, moleskin
C['Rubeus Hagrid']=ctx=>{const k=kit(ctx),o=P(1,{ear:false,lines:1,blush:true,eye:['#120c0c','#3a2a26'],brow:{s:'raised',c:['#1a1612','#2e2820'],thick:true},nose:'broad',mouth:'smile'}),h=['#0e0b0a','#1c1714','#2c2520','#463c34','#6a5e54'];
  const Mo=['#1e140e','#33241a','#4a3626','#644a34','#806248'];
  coat(k,Mo,0);k.poly([[27,40],[39,40],[37,50],[36,64],[30,64],[29,50]],Mo[1]);lapels(k,Mo,0,'notch');
  k.poly([[8,40],[10,24],[8,12],[12,5],[20,1],[32,0],[44,1],[52,5],[56,12],[54,24],[56,40],[50,44],[46,30],[18,30],[14,44]],h[1]);   // the mane, behind
  face(k,o);
  // the beard: from the cheekbones down over the chest
  const Bd=[[20,26],[24,29],[28,30],[33,30],[38,30],[42,28],[46,25],[48,32],[50,42],[47,52],[42,60],[36,64],[28,64],[22,58],[18,48],[17,36]];
  k.poly(Bd,h[2]);
  curlStrokes(k,[[21,32],[25,33],[29,36],[34,36],[39,34],[44,31],[20,38],[24,39],[29,41],[34,41],[39,40],[44,37],[47,34],[21,44],[26,46],[31,47],[36,46],[41,45],[46,42],[23,51],[28,53],[33,53],[38,52],[43,50],[27,58],[32,59],[37,58]],h);
  k.row(33,31,37,o.lip[3]);k.pts([[32,32],[33,32],[34,32],[35,32],[36,32]],o.lip[1]);       // the mouth, in the beard
  // the mane over the brow and sides
  k.poly([[10,30],[9,18],[13,8],[21,3],[32,2],[43,3],[51,8],[54,17],[53,30],[48,28],[46,20],[44,15],[38,13],[30,13],[24,15],[21,20],[19,28],[15,34]],h[2]);
  curlStrokes(k,[[14,10],[20,6],[26,5],[32,4],[38,5],[44,6],[50,10],[12,16],[18,11],[24,10],[30,9],[36,9],[42,10],[48,13],[52,17],[12,22],[17,17],[50,20],[12,28],[16,24],[51,26],[22,14],[28,13],[34,13],[40,13],[45,16]],h);
  k.pts([[16,9],[22,4],[30,3],[38,3],[13,14],[46,6]],HAIR.grey[3]);                        // grey coming in
  k.finish(false)};
// ---- Argus Filch: caretaker, older and slower; lank grey hair, pouched pale eyes, a shabby coat
C['Argus Filch']=ctx=>{const k=kit(ctx),o=P(5,{ear:true,lines:2,jaw:'wide',eye:['#8a8c7a','#b4b6a2'],brow:{s:'scowl',c:['#6e6c74','#94929a'],thick:true},nose:'hook',mouth:'frown'}),h=HAIR.grey;
  const Br=['#1a1612','#2a241c','#3c3428','#524838','#6a5e4a'];
  robes(k,o.sk,o,Br,{kind:'high',buttons:[48,53,58],btn:'#6a5e4a',btnD:'#2a241c'});
  k.pts([[30,50],[31,51],[30,52]],Br[1]);k.pts([[40,56],[41,57]],Br[4]);                   // darns
  face(k,o);
  k.pts([[37,23],[38,22],[39,23]],o.sk[1]);                                                 // a vein at the temple, a tic
  // bald on top, lank strands combed down at the sides
  k.poly([[21,15],[22,10],[26,7],[32,6],[39,7],[44,9],[46,13],[44,13],[37,10],[29,10],[23,13]],o.sk[3]);k.pts([[28,8],[29,8],[30,7]],o.sk[4]);
  k.poly([[15,34],[14,22],[16,13],[20,9],[23,11],[22,18],[21,26],[20,34],[18,38]],h[1]);
  for(let x=15;x<=21;x+=2)for(let y=12;y<37;y++)if(k.at(x,y)===h[1])k.px(x,y,h[2]);
  k.poly([[44,10],[48,13],[49,22],[48,32],[46,34],[46,22]],h[1]);for(let y=12;y<34;y+=1)k.px(47,y,y%3?h[2]:h[1]);
  k.pts([[25,9],[27,8],[31,7],[35,7],[39,8],[42,9]],h[2]);                                  // three strands across the top
  k.finish(true)};
// ---- Madam Poppy Pomfrey: matron; a starched cap, grey bun, an apron, has seen everything
C['Madam Poppy Pomfrey']=ctx=>{const k=kit(ctx),o=P(1,{sex:'f',slim:true,ear:false,lines:2,eye:EYE.blue,brow:{s:'straight',c:['#6e6c74','#94929a']},nose:'button',mouth:'tight'}),h=HAIR.grey;
  const Nv=['#0e1424','#182038','#222d4e','#323f68','#4a5884'];
  coat(k,Nv,0);neck(k,o.sk,o);
  k.poly([[28,46],[38,46],[37,64],[29,64]],'#e6e2da');k.poly([[33,46],[38,46],[37,64],[33,64]],'#c4beb4');k.pts([[27,42],[27,43],[28,44],[28,45]],'#e6e2da');k.pts([[39,42],[39,43],[38,44],[38,45]],'#c4beb4');   // apron bib and straps
  k.poly([[26,37],[40,37],[41,42],[25,42]],'#f2efe8');k.poly([[33,37],[40,37],[41,42],[33,42]],'#cfcac0');k.row(42,25,41,'#9c968c');
  k.pts([[16,52],[17,51],[18,52],[17,53]],'#b03a3a');k.px(17,52,'#e8e2d8');                 // a red-cross badge, plain
  face(k,o);
  k.poly([[18,20],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[47,18],[44,15],[38,12],[30,12],[25,14],[22,17],[21,21]],h[2]);
  k.clump([[18,20],[17,13],[21,9],[25,10],[23,14],[21,18]],h[2],h[3],h[1]);k.clump([[42,10],[46,10],[48,14],[47,18],[44,14]],h[1],h[2],h[0]);
  // the cap
  k.poly([[19,9],[23,4],[30,1],[38,1],[45,4],[48,9],[44,10],[38,8],[30,8],[23,10]],'#f4f2ec');k.poly([[38,1],[45,4],[48,9],[44,10],[40,8]],'#cfcac0');
  k.row(10,23,44,'#b9b4aa');k.pts([[26,3],[27,3],[28,2]],'#ffffff');
  k.pts([[26,15],[27,14],[33,13],[34,13],[40,14],[44,16]],o.sk[2]);
  k.finish(false)};
// ---- Madam Irma Pince: librarian; thin, a hooked nose, a severe bun, a glare for whispering
C['Madam Irma Pince']=ctx=>{const k=kit(ctx),o=P(5,{sex:'f',slim:true,ear:false,lines:2,lidded:true,eye:EYE.dkbrown,brow:{s:'scowl',c:['#26232e','#383443']},nose:'long',mouth:'thin'}),h=['#2a2830','#3c3a42','#504e56','#6a6870','#8a8890'];
  const Pl=['#140e16','#201624','#2e2034','#3e2c46','#544060'];
  k.clump([[11,9],[13,5],[17,4],[20,7],[19,12],[14,13]],h[2],h[3],h[1]);
  robes(k,o.sk,o,Pl,{kind:'high',buttons:[46,49,52,55,58,61],btn:'#544060',btnD:'#140e16'});
  face(k,o);
  k.poly([[44,20],[46,18],[46,30],[44,33]],o.sk[1]);                                        // gaunt far cheek
  k.poly([[18,20],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[47,18],[44,15],[38,12],[30,12],[25,14],[22,17],[21,21]],h[2]);
  k.clump([[18,20],[17,13],[20,8],[26,5],[30,6],[26,10],[23,14],[21,18]],h[2],h[3],h[1]);k.clump([[30,6],[40,5],[45,8],[48,13],[47,17],[43,13],[36,9]],h[1],h[2],h[0]);
  k.pts([[23,8],[24,7],[27,6],[36,6],[40,6]],h[4]);
  k.pts([[25,14],[26,13],[32,13],[38,14],[43,16]],o.sk[2]);
  k.finish(true)};
// ---- Madam Rolanda Hooch: flying; cropped grey hair, a hawk's yellow eyes, a whistle on a cord
C['Madam Rolanda Hooch']=ctx=>{const k=kit(ctx),o=P(2,{sex:'f',slim:true,ear:true,lines:1,eye:EYE.amber,brow:{s:'straight',c:['#6e6c74','#94929a']},nose:'long',mouth:'tight'}),h=HAIR.grey;
  const Lt=['#1a120c','#2c1e14','#42301e','#5c442a','#7a5c3a'];
  robes(k,o.sk,o,Lt,{kind:'high',trim:'#c9a23a'});
  k.pts([[30,42],[30,44],[31,46],[32,48],[33,50]],'#8a8a8e');k.pts([[33,51],[34,51],[35,51],[33,52],[34,52]],'#c8c8cc');k.px(35,52,'#8a8a8e');   // whistle
  face(k,o);
  k.poly([[17,22],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[48,18],[46,17],[41,13],[33,12],[27,12],[24,14],[22,18],[21,22],[19,23]],h[1]);
  k.clump([[18,20],[18,13],[21,9],[26,6],[25,10],[22,14],[20,19]],h[2],h[3],h[1]);
  k.clump([[25,7],[33,5],[41,6],[46,10],[48,15],[42,12],[34,10],[27,11]],h[2],h[3],h[1]);
  [[[25,13],[29,11],[28,15]],[[30,12],[35,11],[34,15]],[[36,12],[41,12],[40,15]]].forEach(L=>k.clump(L,h[2],h[3],h[1]));
  k.pts([[21,10],[22,9],[29,6],[30,6],[36,6],[43,9]],h[4]);
  k.pts([[26,16],[30,15],[36,15],[41,16],[44,18]],o.sk[2]);
  k.finish(false)};

function frame(k,bg){for(let i=0;i<S;i++)for(const [x,y] of [[i,0],[i,1],[i,2],[i,S-1],[i,S-2],[i,S-3],[0,i],[1,i],[2,i],[S-1,i],[S-2,i],[S-3,i]]){const e=Math.min(x,y,S-1-x,S-1-y);k.px(x,y,e===0?'#5a4214':e===1?((x+y)%4?'#c9a23a':'#f0d070'):'#8f7028')}}
const portraitBg='#2a2218';
// ---- Cassius Yaxley-Moore: Slytherin; pale, blond, watches Robert with something like recognition
C['Cassius Yaxley-Moore']=ctx=>{const k=kit(ctx),o=P(0,Object.assign({},kid,{ear:true,lidded:true,eye:EYE.grey,brow:{s:'straight',c:['#b8924a','#d8b868']},nose:'button',mouth:'tight'})),h=HAIR.blond;
  uniform(k,o.sk,o,'slytherin');face(k,o);
  k.poly([[17,21],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[48,18],[46,17],[41,14],[33,13],[27,13],[24,15],[22,18],[21,22],[19,22]],h[2]);
  k.clump([[18,19],[18,13],[21,9],[26,6],[24,11],[21,15],[20,19]],h[3],h[4],h[2]);
  k.clump([[26,6],[33,4],[41,6],[46,10],[48,15],[42,12],[34,10],[27,11]],h[3],h[4],h[2]);
  k.pts([[25,7],[25,8],[24,9],[24,10],[23,12]],h[1]);k.pts([[29,5],[30,5],[31,5],[36,9],[37,9]],'#fff0b8');
  k.pts([[26,15],[27,14],[33,14],[39,15],[44,17]],o.sk[2]);
  k.finish(true)};
// ---- Ottilie Nye: Slytherin; quiet, long black hair, misses nothing
C['Ottilie Nye']=ctx=>{const k=kit(ctx),o=P(3,Object.assign({},kid,{sex:'f',ear:false,eye:EYE.dkbrown,brow:{s:'thin',c:['#0d0c12','#19171f']},nose:'button',mouth:'tight'})),h=HAIR.black;
  k.poly([[14,18],[17,9],[24,5],[33,4],[41,5],[47,9],[50,16],[50,32],[49,46],[46,52],[41,52],[39,46],[37,40],[28,40],[25,46],[22,54],[13,56],[13,40],[13,26]],h[1]);
  uniform(k,o.sk,o,'slytherin');face(k,o);
  k.clump([[25,6],[26,12],[24,16],[22,20],[21,26],[21,34],[22,40],[23,46],[22,52],[18,55],[14,53],[13,45],[13,34],[14,22],[16,13],[20,8]],h[2],h[3],h[1]);
  k.clump([[26,6],[32,4],[40,5],[46,9],[48,14],[47,20],[45,22],[43,18],[39,16],[34,15],[30,15],[27,14]],h[2],h[3],h[1]);
  k.pts([[25,7],[25,8],[25,9],[25,10]],h[0]);
  k.pts([[27,7],[28,6],[29,6],[30,5],[31,5],[32,5]],h[4]);for(let y=12;y<=48;y++){k.px(16,y,y<44?h[3]:h[2])}
  k.pts([[27,15],[28,16],[33,16],[34,16],[38,17],[41,18],[42,19],[23,18],[22,21],[22,22]],o.sk[2]);
  k.finish(false)};
// ---- Priya Lightfoot: Gryffindor prefect; fair and tired, a ponytail, the badge
C['Priya Lightfoot']=ctx=>{const k=kit(ctx),o=P(3,{age:'teen',sex:'f',slim:true,ear:true,lines:0,eye:EYE.dkbrown,brow:{s:'worried',c:['#0d0c12','#19171f']},nose:'straight',mouth:'calm'}),h=HAIR.black;
  k.clump([[12,14],[16,10],[19,14],[18,26],[16,34],[13,30],[12,22]],h[2],h[3],h[1]);          // the ponytail, behind
  uniform(k,o.sk,o,'gryffindor');
  k.poly([[21,47],[26,47],[26,51],[23.5,53],[21,51]],'#c9a23a');k.poly([[22,48],[25,48],[25,50],[23.5,52],[22,50]],'#7e1f24');k.px(23,49,'#f0d070');   // prefect badge
  face(k,o);
  k.row(27,26,31,o.sk[2]);k.row(27,37,42,o.sk[2]);                                          // tired
  k.poly([[18,20],[17,13],[20,8],[26,5],[33,4],[40,5],[45,8],[48,13],[47,18],[44,15],[38,13],[30,13],[25,14],[22,17],[21,21]],h[2]);
  k.clump([[18,20],[17,13],[20,8],[26,5],[31,5],[27,9],[23,13],[21,18]],h[2],h[3],h[1]);k.clump([[31,5],[40,5],[45,8],[48,13],[47,17],[43,13],[36,10]],h[1],h[2],h[0]);
  k.pts([[23,8],[24,7],[27,6],[28,6],[36,6]],h[4]);k.pts([[17,14],[18,13],[19,13]],'#c9a23a');   // hair tie
  k.pts([[25,15],[26,14],[33,14],[39,15],[43,16]],o.sk[2]);
  k.finish(true)};
// ---- Owen Gask: Gryffindor prefect; useless and kind, sandy and cheerful
C['Owen Gask']=ctx=>{const k=kit(ctx),o=P(1,{age:'teen',ear:true,lines:0,eye:EYE.blue,brow:{s:'raised',c:['#8a6a32','#b8924a']},nose:'broad',mouth:'grin',freckles:'#c48a68'}),h=HAIR.ltbrown;
  uniform(k,o.sk,o,'gryffindor');
  k.poly([[21,47],[26,47],[26,51],[23.5,53],[21,51]],'#c9a23a');k.poly([[22,48],[25,48],[25,50],[23.5,52],[22,50]],'#7e1f24');k.px(23,49,'#f0d070');
  face(k,o);
  hairMessy(k,h);k.clump([[44,7],[49,5],[48,10]],h[2],h[3],h[1]);k.clump([[33,4],[36,1],[38,4]],h[3],h[4],h[2]);
  k.pts([[26,18],[27,17],[34,17],[36,17],[40,17],[44,19]],o.sk[2]);
  k.finish(false)};
// ---- Sir Rowland Fettiplace: a portrait; cavalier ringlets, a florid face, very easily wounded
C['Sir Rowland Fettiplace']=ctx=>{const k=kit(ctx,portraitBg),o=P(1,{ear:false,lines:1,blush:true,eye:EYE.brown,brow:{s:'worried',c:['#2e1f19','#45302a'],thick:true},nose:'straight',mouth:'tight'}),h=HAIR.dkbrown;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const d=Math.hypot(x-34,y-26);if(d<22)k.px(x,y,d<14?'#3e3222':'#342a1e')}       // varnish glow
  const Dr=['#2a0c10','#3e1218','#561a22','#72262e','#8e3a40'];
  coat(k,Dr,0);neck(k,o.sk,o);
  // falling lace collar
  k.poly([[16,44],[24,40],[33,42],[42,40],[50,44],[46,52],[38,54],[33,52],[28,54],[20,52]],'#ece6d8');k.poly([[33,42],[42,40],[50,44],[46,52],[38,54],[33,52]],'#c8c0ae');
  for(let x=17;x<50;x+=2){k.px(x,x<33?52+((x+1)%3?0:1):53,'#a89e8a')}for(let x=20;x<47;x+=3)k.px(x,47,'#d8d0be');
  k.poly([[30,40],[36,40],[35,44],[31,44]],'#c8c0ae');
  // ringlets, behind and falling over the shoulders
  [[13,14],[12,22],[12,30],[13,38],[14,46],[51,14],[52,22],[52,30],[51,38],[50,46]].forEach(([x,y])=>k.curl(x,y,4,4.5,h));
  face(k,o);
  k.row(32,33,38,h[2]);k.pts([[32,31],[39,31],[31,30],[40,30]],h[2]);k.px(34,32,h[3]);      // upturned moustache
  k.pts([[35,37],[36,37],[35,38],[36,38],[35,39]],h[2]);                                    // pointed beard
  k.poly([[19,20],[18,12],[21,7],[27,4],[35,3],[42,5],[47,9],[48,15],[47,20],[44,16],[38,13],[30,13],[25,15],[22,19]],h[2]);
  curlStrokes(k,[[21,10],[26,7],[31,6],[36,6],[41,7],[45,11],[20,15],[24,12],[29,11],[39,11],[44,14]],h);
  [[17,20],[16,27],[17,34],[47,20],[48,27],[47,34]].forEach(([x,y])=>k.curl(x,y,3.4,4,h));
  frame(k);
  k.finish(false)};
// ---- Dame Euphemia Crouch-Hartley: a portrait, 1640s matron; a linen coif and a great white collar
C['Dame Euphemia Crouch-Hartley']=ctx=>{const k=kit(ctx,portraitBg),o=P(0,{sex:'f',slim:true,ear:false,lines:2,eye:EYE.grey,brow:{s:'straight',c:['#5f3f2d','#82593b']},nose:'long',mouth:'thin'});
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const d=Math.hypot(x-34,y-26);if(d<22)k.px(x,y,d<14?'#3e3222':'#342a1e')}
  const Bk=['#0a0a0c','#121216','#1a1a20','#26262e','#3a3a44'];
  coat(k,Bk,0);neck(k,o.sk,o);
  k.poly([[12,48],[20,42],[33,41],[46,42],[54,48],[48,56],[33,58],[18,56]],'#ece6d8');k.poly([[33,41],[46,42],[54,48],[48,56],[33,58]],'#c8c0ae');
  k.row(41,24,42,'#f6f2e8');for(let x=14;x<53;x+=3)k.px(x,55-Math.round(Math.abs(x-33)/8),'#a89e8a');
  face(k,o);
  // the coif: linen, close round the face, tied under the chin
  k.poly([[17,30],[16,18],[19,9],[25,4],[33,3],[41,4],[47,9],[49,18],[48,30],[45,31],[45,20],[43,14],[37,11],[29,11],[24,13],[22,18],[21,30]],'#ece6d8');
  k.poly([[41,4],[47,9],[49,18],[48,30],[45,31],[45,20],[43,14],[38,9]],'#c8c0ae');
  k.row(12,24,43,'#b8b0a0');k.pts([[22,5],[23,5],[24,4]],'#ffffff');k.pts([[27,6],[31,6],[35,6],[39,7]],'#d8d0c0');
  k.pts([[21,31],[22,33],[24,35],[27,38],[30,40]],'#d8d0c0');k.pts([[45,32],[43,34],[41,36],[38,38]],'#b8b0a0');
  k.pts([[25,14],[26,14],[33,13],[38,14],[42,15]],o.sk[2]);
  frame(k);
  k.finish(true)};
// ---- Pibbit: kitchen elf; enormous ears, lamp eyes, a tea towel tied at the shoulder
C['Pibbit']=ctx=>{const k=kit(ctx);const s=['#2e2a22','#5a5040','#8a7c62','#b3a382','#cdbf9c','#e2d6b6'],L=['#8a6a5a','#a07e6c','#b8968a','#5a3a32'];
  // ears, behind
  k.poly([[22,20],[3,9],[5,15],[10,23],[16,30],[23,31]],s[3]);k.poly([[20,22],[7,13],[10,20],[15,27],[21,29]],'#c79a8a');k.pts([[8,12],[6,11],[5,10]],s[4]);
  k.poly([[44,20],[62,9],[60,15],[55,23],[49,30],[43,31]],s[2]);k.poly([[45,22],[58,13],[55,20],[50,27],[45,29]],'#a87a6c');
  k.pts([[51,24],[52,25]],s[1]);k.px(53,22,s[1]);                                              // a nick in the ear
  // tea towel, checked
  const T=[[4,64],[8,52],[16,46],[26,43],[40,43],[50,46],[58,52],[62,64]];k.poly(T,'#e8e2d4');
  for(let y=43;y<S;y++)for(let x=0;x<S;x++){if(k.at(x,y)!=='#e8e2d4')continue;const c=(Math.floor(x/3)+Math.floor(y/3))%2;if(c)k.px(x,y,x>38?'#5c6e8a':'#7a8eaa')}
  k.poly([[44,44],[50,46],[52,52],[48,54],[45,50]],'#d4cdbd');k.pts([[46,47],[48,49],[47,52]],'#9a937f');   // the knot
  neck(k,s,{slim:true});
  face(k,{sk:s,lip:L,sex:'f',ear:false,eye:['#7a5420','#a87a30'],brow:{s:'raised',c:[s[2],s[2]]},nose:'long',mouth:'smile',lines:1});
  // lamp eyes, far too big for the face
  for(const [cx,f] of [[28.5,1],[39.5,0]]){for(let y=19;y<=27;y++)for(let x=Math.floor(cx-4.5);x<=cx+4.5;x++){const d=((x+.5-cx)/4.5)**2+((y+.5-23)/4.2)**2;if(d<=1)k.px(x,y,d>.75?s[1]:'#f2eee2')}
    for(let y=21;y<=26;y++)for(let x=Math.floor(cx-2.5);x<=cx+2.5;x++){const d=((x+.5-cx)/2.6)**2+((y+.5-23.6)/2.6)**2;if(d<=1)k.px(x,y,d>.55?'#7a5420':'#b8862e')}
    k.pts([[Math.round(cx)-1,23],[Math.round(cx),23],[Math.round(cx)-1,24],[Math.round(cx),24]],'#141210');k.px(Math.round(cx)-2,21,'#ffffff');k.px(Math.round(cx)-1,21,'#ffffff')}
  k.row(18,25,32,s[2]);k.row(18,36,43,s[1]);
  // bald head, a crease or two
  k.poly([[22,15],[24,9],[29,6],[36,6],[41,8],[44,13],[44,17],[22,17]],s[3]);k.pts([[27,8],[28,7],[29,7],[30,7]],s[5]);k.pts([[26,9],[31,8]],s[4]);k.row(13,29,36,s[2]);k.row(15,30,35,s[2]);
  k.finish(false)};

C['Dez Achterberg']=C['Desmond Achterberg'];C['Mr Filch']=C['Argus Filch'];C['Mr Pike']=C['Absalom Pike'];
window.CAST_PORTRAITS=C;
window.HAND_PORTRAITS=Object.assign(window.HAND_PORTRAITS||{},C);
})();
