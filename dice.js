/* Dice tray: a pixel d20 thrown onto a table, with simple physics. showDice(check) -> Promise */
(function(){
'use strict';
const FONT={0:['111','101','101','101','111'],1:['010','110','010','010','111'],2:['111','001','111','100','111'],3:['111','001','011','001','111'],4:['101','101','111','001','001'],
  5:['111','100','111','001','111'],6:['111','100','111','101','111'],7:['111','001','010','010','010'],8:['111','101','111','101','111'],9:['111','101','111','001','111']};
const W=160,H=90,FLOOR=68,R=12;
let actx=null;
function audio(){try{if(!actx){const AC=window.AudioContext||window.webkitAudioContext;actx=new AC()}if(actx.state==='suspended')actx.resume()}catch(e){actx=null}return actx}
function clack(vol){
  const ac=actx; if(!ac)return;
  try{const len=Math.floor(ac.sampleRate*.035),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
    const src=ac.createBufferSource();src.buffer=buf;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1800+Math.random()*900;f.Q.value=1.4;
    const g=ac.createGain();g.gain.value=Math.min(.5,vol);src.connect(f);f.connect(g);g.connect(ac.destination);src.start()}catch(e){}
}
function table(cx){
  // back wall
  cx.fillStyle='#120f1c';cx.fillRect(0,0,W,H);
  for(let y=0;y<50;y+=6)for(let x=(y/6%2)*8;x<W;x+=16){cx.fillStyle='#1a1628';cx.fillRect(x,y,15,5)}
  // candle glow
  const g=cx.createRadialGradient(132,30,2,132,30,40);g.addColorStop(0,'rgba(255,190,90,.35)');g.addColorStop(1,'rgba(255,190,90,0)');cx.fillStyle=g;cx.fillRect(90,0,70,60);
  cx.fillStyle='#e8dcc0';cx.fillRect(130,38,4,10);cx.fillStyle='#ffcf5a';cx.fillRect(131,34,2,3);cx.fillStyle='#fff3c0';cx.fillRect(131,35,2,1);
  // table top
  cx.fillStyle='#5a3a24';cx.fillRect(0,50,W,H-50);
  for(let y=52;y<H;y+=7){cx.fillStyle='#4a2e1c';cx.fillRect(0,y,W,1)}
  for(let i=0;i<14;i++){cx.fillStyle='#6b4a2e';cx.fillRect((i*37)%W,53+(i*5)%30,10+(i*7)%14,1)}
  cx.fillStyle='#7a5636';cx.fillRect(0,50,W,1);cx.fillStyle='#2e1c10';cx.fillRect(0,49,W,1);
}
function digits(cx,n,col){
  const s=String(n),w=s.length*4-1;let x0=-Math.floor(w/2);
  cx.fillStyle=col;
  for(const ch of s){FONT[ch].forEach((row,yy)=>{for(let xx=0;xx<3;xx++)if(row[xx]==='1')cx.fillRect(x0+xx,yy-2,1,1)});x0+=4}
}
function die(cx,x,y,ang,n){
  // shadow
  const hgt=Math.max(0,FLOOR-y);cx.fillStyle='rgba(0,0,0,'+(0.35-Math.min(.25,hgt/200))+')';
  cx.beginPath();cx.ellipse(x,FLOOR+R-2,R*(1-Math.min(.5,hgt/120)),3,0,0,Math.PI*2);cx.fill();
  cx.save();cx.translate(Math.round(x),Math.round(y));cx.rotate(ang);
  const V=[...Array(6)].map((_,k)=>{const a=-Math.PI/2+k*Math.PI/3;return [Math.cos(a)*R,Math.sin(a)*R]});
  const T=[-Math.PI/2,Math.PI/6,Math.PI*5/6].map(a=>[Math.cos(a)*R*.62,Math.sin(a)*R*.62]);
  const poly=(pts,fill)=>{cx.beginPath();pts.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.fillStyle=fill;cx.fill()};
  poly(V,'#b9a98a');
  poly([V[5],V[0],T[0]],'#efe3c4'); poly([V[4],V[5],T[0],T[2]],'#e2d4b0'); poly([V[0],V[1],T[1],T[0]],'#d2c29c');
  poly([V[3],V[4],T[2]],'#c8b892'); poly([V[1],V[2],T[1]],'#a8987a'); poly([V[2],V[3],T[2],T[1]],'#9a8a6c');
  poly(T,'#f6efdc');
  cx.strokeStyle='#5a4a32';cx.lineWidth=1;cx.beginPath();V.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.stroke();
  cx.strokeStyle='rgba(90,74,50,.6)';cx.beginPath();cx.moveTo(T[0][0],T[0][1]);cx.lineTo(T[1][0],T[1][1]);cx.lineTo(T[2][0],T[2][1]);cx.closePath();cx.stroke();
  digits(cx,n,'#8c1f25');
  cx.restore();
}
window.showDice=function(c){
  return new Promise(res=>{
    const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    audio();
    const ov=document.createElement('div');ov.id='dice';
    ov.innerHTML='<div class="dice-card"><div class="dice-k">'+c.label+'</div><canvas width="'+W+'" height="'+H+'"></canvas><div class="dice-res"></div><div class="dice-hint">tap to continue</div></div>';
    document.body.appendChild(ov);
    const cv=ov.querySelector('canvas'),cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;
    let x=-14,y=18,vx=118+Math.random()*30,vy=-30-Math.random()*30,ang=0,va=14+Math.random()*6,face=1+Math.floor(Math.random()*20),flick=0,t=0,settled=false,snap=null,shown=false,done=false,last=performance.now(),closeT=null;
    const finish=()=>{if(done)return;done=true;clearTimeout(closeT);ov.classList.add('out');setTimeout(()=>{ov.remove();res()},180)};
    const showResult=()=>{if(shown)return;shown=true;
      ov.querySelector('.dice-res').innerHTML='<b class="o-'+c.outcomeKey+'">'+c.outcome+'</b><span>'+c.sum+'</span>';
      ov.classList.add('done');closeT=setTimeout(finish,2200)};
    ov.addEventListener('click',()=>{if(!settled){settled=true;snap=0;ang=0;x=Math.max(30,Math.min(130,x));y=FLOOR;face=c.d;showResult()}else finish()});
    if(reduce){settled=true;x=80;y=FLOOR;face=c.d;table(cx);die(cx,x,y,0,face);showResult();return}
    const step=now=>{
      if(done)return;
      const dt=Math.min(1/30,(now-last)/1000);last=now;t+=dt;
      if(!settled){
        vy+=520*dt;x+=vx*dt;y+=vy*dt;ang+=va*dt;
        if(y>=FLOOR){y=FLOOR;if(vy>55){clack(vy/500);vy=-vy*.42;vx*=.72;va=va*.6+(Math.random()-.5)*4}else{vy=0;vx*=Math.pow(.04,dt);va=vx/R}}
        if(x>W-R-4&&vx>0){x=W-R-4;vx=-vx*.5;va=-va*.6;clack(.15)}
        flick+=dt;if(flick>.06){flick=0;face=1+Math.floor(Math.random()*20)}
        if((y>=FLOOR&&vy===0&&Math.abs(vx)<8)||t>2.2){settled=true;face=c.d;snap=Math.round(ang/(Math.PI/3))*(Math.PI/3)}
      }else if(snap!=null){ang+=(snap-ang)*Math.min(1,dt*12);if(Math.abs(snap-ang)<.01){ang=snap;if(!shown)setTimeout(showResult,200)}}
      table(cx);
      const drawAng=settled&&snap!=null?ang:ang;
      die(cx,x,y,drawAng,face);
      // keep the number upright once settled
      if(settled&&snap!=null){cx.save();cx.translate(Math.round(x),Math.round(y));cx.rotate(ang);cx.fillStyle='#f6efdc';
        const T=[-Math.PI/2,Math.PI/6,Math.PI*5/6].map(a=>[Math.cos(a)*R*.62,Math.sin(a)*R*.62]);cx.beginPath();T.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.fill();cx.restore();
        cx.save();cx.translate(Math.round(x),Math.round(y));digits(cx,face,'#8c1f25');cx.restore()}
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
};
})();
