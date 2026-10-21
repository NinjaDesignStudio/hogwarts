/* 3D dice tray. A leather cup (a kinematic physics body with a bottom and walls) follows the finger on a spring,
   lifts when held and sways like a cup in a hand; the d20 rattles inside under rigid-body physics.
   The page decides the number (fair crypto roll). On release we simulate the tip-and-throw to rest out of sight,
   find the face that lands up, and print the rolled number on it at a moment when both swapped faces are
   turned away from the camera, then play the recorded motion. */
import {WebGLRenderer,Scene,PerspectiveCamera,AmbientLight,DirectionalLight,PointLight,Mesh,Group,PlaneGeometry,BoxGeometry,
  CylinderGeometry,CircleGeometry,RingGeometry,IcosahedronGeometry,MeshLambertMaterial,MeshBasicMaterial,CanvasTexture,
  NearestFilter,Vector3,Quaternion,Euler,Raycaster,Vector2,Plane,BackSide,SRGBColorSpace,Color,Fog} from 'three';
import {World,Body,Plane as CPlane,Box,ConvexPolyhedron,Vec3,Material,ContactMaterial,Quaternion as CQuat} from 'cannon-es';

const LW=240, LH=300;            // low-res render size, upscaled with pixelated CSS
const TX=4, TZ=5.2;              // tray half-size (inner)
const DR=0.62;                   // die radius
const STEP=1/120;
const CR=1.25, CT=0.18, CH2=2.3; // cup inner radius, wall thickness, height
const HOLD_Y=1.15;               // cup bottom height while held

let actx=null;
function audio(){try{if(!actx){const AC=window.AudioContext||window.webkitAudioContext;actx=new AC()}if(actx.state==='suspended')actx.resume()}catch(e){actx=null}}
function clack(vol,pitch){
  if(!actx||vol<=0.01)return;
  try{const len=Math.floor(actx.sampleRate*.04),buf=actx.createBuffer(1,len,actx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,4);
    const s=actx.createBufferSource();s.buffer=buf;const f=actx.createBiquadFilter();f.type='bandpass';f.frequency.value=(pitch||2200)+Math.random()*700;f.Q.value=1.6;
    const g=actx.createGain();g.gain.value=Math.min(.6,vol);s.connect(f);f.connect(g);g.connect(actx.destination);s.start()}catch(e){}
}

function woodTexture(){
  const c=document.createElement('canvas');c.width=128;c.height=160;const x=c.getContext('2d');
  x.fillStyle='#5a3a24';x.fillRect(0,0,128,160);
  for(let i=0;i<8;i++){x.fillStyle=i%2?'#563822':'#5e3e26';x.fillRect(i*16,0,16,160);x.fillStyle='#3e2616';x.fillRect(i*16,0,1,160)}
  for(let i=0;i<40;i++){x.fillStyle=i%3?'#6b4a2e':'#4a2e1c';x.fillRect((i*37)%128,(i*53)%160,1,6+(i*7)%14)}
  const t=new CanvasTexture(c);t.magFilter=NearestFilter;t.minFilter=NearestFilter;t.colorSpace=SRGBColorSpace;return t;
}
function feltTexture(){
  const c=document.createElement('canvas');c.width=64;c.height=80;const x=c.getContext('2d');
  x.fillStyle='#24452e';x.fillRect(0,0,64,80);
  for(let i=0;i<220;i++){x.fillStyle=i%2?'#1f3d29':'#2a4f35';x.fillRect((i*29)%64,(i*17)%80,1,1)}
  const t=new CanvasTexture(c);t.magFilter=NearestFilter;t.minFilter=NearestFilter;t.colorSpace=SRGBColorSpace;return t;
}
// atlas: 20 numbered triangles, 5 x 4 cells
const ACOLS=5, AROWS=4, AW=640, AH=512, CW=AW/ACOLS, CH=AH/AROWS;
function atlas(){
  const c=document.createElement('canvas');c.width=AW;c.height=AH;const x=c.getContext('2d');
  x.fillStyle='#efe3c4';x.fillRect(0,0,AW,AH);
  const tris=[];
  for(let n=1;n<=20;n++){
    const i=n-1,col=i%ACOLS,row=Math.floor(i/ACOLS),x0=col*CW,y0=row*CH;
    const s=CW*0.92,h=s*0.866,tx=x0+CW/2,ty=y0+(CH-h)/2;
    const P=[[tx,ty],[tx-s/2,ty+h],[tx+s/2,ty+h]];
    x.strokeStyle='#a8977a';x.lineWidth=7;x.beginPath();x.moveTo(...P[0]);x.lineTo(...P[1]);x.lineTo(...P[2]);x.closePath();x.stroke();
    x.fillStyle='#8c1f25';x.font='bold '+Math.round(h*0.5)+'px Georgia, "Times New Roman", serif';x.textAlign='center';x.textBaseline='middle';
    const cy=ty+h*0.64;x.fillText(String(n),tx,cy);
    if(n===6||n===9){x.fillRect(tx-h*0.13,cy+h*0.2,h*0.26,4)}
    tris.push(P.map(([px,py])=>[px/AW,1-py/AH]));
  }
  const t=new CanvasTexture(c);t.magFilter=NearestFilter;t.minFilter=NearestFilter;t.colorSpace=SRGBColorSpace;t.generateMipmaps=false;
  return {tex:t,tris};
}

window.showDice3D=function(c){
  return new Promise((resolve,reject)=>{
    const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    audio();
    const ov=document.createElement('div');ov.id='dice';ov.className='d3';
    ov.innerHTML='<div class="dice-card"><div class="dice-k">'+c.label+'</div><canvas class="d3c" width="'+LW+'" height="'+LH+'"></canvas><div class="dice-res"><span class="dice-tip">Hold the cup and shake it. Flick and let go to throw.</span></div><div class="dice-hint">tap to continue</div></div>';
    document.body.appendChild(ov);
    const cv=ov.querySelector('canvas');
    let renderer;
    try{renderer=new WebGLRenderer({canvas:cv,antialias:false,alpha:false,powerPreference:'low-power'})}catch(e){ov.remove();reject(e);return}
    renderer.setPixelRatio(1);renderer.setSize(LW,LH,false);renderer.outputColorSpace=SRGBColorSpace;
    const scene=new Scene();scene.background=new Color('#120f1c');scene.fog=new Fog('#120f1c',16,30);
    const cam=new PerspectiveCamera(42,LW/LH,0.1,60);const camHome=new Vector3(0,13.2,9.4),lookHome=new Vector3(0,0,0.7);
    cam.up.set(0,0,-1);cam.position.copy(camHome);cam.lookAt(lookHome);
    scene.add(new AmbientLight('#8a7a9a',1.1));
    const key=new DirectionalLight('#fff1d8',1.25);key.position.set(-3,10,6);scene.add(key);
    const candle=new PointLight('#ffb35a',18,20,1.6);candle.position.set(3.6,3,-4.8);scene.add(candle);
    const disposables=[];
    // table, tray, candle
    const wood=woodTexture(),felt=feltTexture();disposables.push(wood,felt);
    const tableMat=new MeshLambertMaterial({map:wood}),feltMat=new MeshLambertMaterial({map:felt}),rimMat=new MeshLambertMaterial({color:'#6b4a2e',flatShading:true});
    const table=new Mesh(new PlaneGeometry(34,34),tableMat);table.rotation.x=-Math.PI/2;table.position.y=-0.02;scene.add(table);
    const floorM=new Mesh(new PlaneGeometry(TX*2,TZ*2),feltMat);floorM.rotation.x=-Math.PI/2;scene.add(floorM);
    [[0,-TZ-0.25,TX*2+1,0.5],[0,TZ+0.25,TX*2+1,0.5],[-TX-0.25,0,0.5,TZ*2],[TX+0.25,0,0.5,TZ*2]].forEach(([x,z,w,d])=>{const m=new Mesh(new BoxGeometry(w,0.7,d),rimMat);m.position.set(x,0.35,z);scene.add(m)});
    const wax=new Mesh(new CylinderGeometry(0.22,0.22,1.1,8),new MeshLambertMaterial({color:'#e8dcc0',flatShading:true}));wax.position.set(TX+1.3,0.55,-TZ+0.3);scene.add(wax);
    const flame=new Mesh(new CylinderGeometry(0.02,0.1,0.3,6),new MeshBasicMaterial({color:'#ffcf5a'}));flame.position.set(TX+1.3,1.25,-TZ+0.3);scene.add(flame);
    // die
    const geo=new IcosahedronGeometry(DR,0);const A=atlas();disposables.push(A.tex);
    const pos=geo.getAttribute('position'),uv=geo.getAttribute('uv');const nf=pos.count/3;
    const labels=[...Array(nf)].map((_,i)=>i+1);
    const applyLabels=()=>{for(let f=0;f<nf;f++){const T=A.tris[labels[f]-1];for(let k=0;k<3;k++)uv.setXY(f*3+k,T[k][0],T[k][1])}uv.needsUpdate=true};
    applyLabels();
    const die=new Mesh(geo,new MeshLambertMaterial({map:A.tex,flatShading:true}));scene.add(die);
    const shadowMat=()=>new MeshBasicMaterial({color:'#000',transparent:true,opacity:.35,depthWrite:false});
    const dShadow=new Mesh(new CircleGeometry(DR*0.95,12),shadowMat());dShadow.rotation.x=-Math.PI/2;dShadow.position.y=0.01;scene.add(dShadow);
    const faceN=[],faceUp=[];
    for(let f=0;f<nf;f++){const a=new Vector3().fromBufferAttribute(pos,f*3),b=new Vector3().fromBufferAttribute(pos,f*3+1),cc=new Vector3().fromBufferAttribute(pos,f*3+2);
      const cen=a.clone().add(b).add(cc).multiplyScalar(1/3);faceN.push(cen.clone().normalize());faceUp.push(a.clone().sub(cen).normalize())}
    // cup visuals
    const cup=new Group();
    const leather=new MeshLambertMaterial({color:'#6a3a22',flatShading:true}),dark=new MeshLambertMaterial({color:'#2a160c',flatShading:true});
    const shell=new Mesh(new CylinderGeometry(CR+CT,CR+CT-0.08,CH2,16,1,true),leather);shell.position.y=CH2/2;cup.add(shell);
    const lining=new Mesh(new CylinderGeometry(CR,CR,CH2,16,1,true),new MeshLambertMaterial({color:'#2a160c',side:BackSide,flatShading:true}));lining.position.y=CH2/2;cup.add(lining);
    const lip=new Mesh(new RingGeometry(CR,CR+CT,16),new MeshLambertMaterial({color:'#c9a24a',flatShading:true}));lip.rotation.x=-Math.PI/2;lip.position.y=CH2;cup.add(lip);
    const floorIn=new Mesh(new CircleGeometry(CR,16),dark);floorIn.rotation.x=-Math.PI/2;floorIn.position.y=0.24;cup.add(floorIn);
    const floorOut=new Mesh(new CircleGeometry(CR+CT-0.08,16),new MeshLambertMaterial({color:'#4a2616',flatShading:true}));floorOut.rotation.x=Math.PI/2;floorOut.position.y=0.001;cup.add(floorOut);
    const base=new Mesh(new CylinderGeometry(CR+CT-0.06,CR+CT-0.06,0.24,16,1,true),leather);base.position.y=0.12;cup.add(base);
    const band=new Mesh(new CylinderGeometry(CR+CT+0.015,CR+CT-0.005,0.28,16,1,true),new MeshLambertMaterial({color:'#8c1f25',flatShading:true}));band.position.y=0.62;cup.add(band);
    const band2=new Mesh(new CylinderGeometry(CR+CT+0.012,CR+CT+0.008,0.12,16,1,true),new MeshLambertMaterial({color:'#c9a24a',flatShading:true}));band2.position.y=CH2-0.35;cup.add(band2);
    scene.add(cup);
    const cShadow=new Mesh(new CircleGeometry(CR+CT,16),shadowMat());cShadow.rotation.x=-Math.PI/2;cShadow.position.y=0.012;scene.add(cShadow);
    // physics
    const world=new World({gravity:new Vec3(0,-32,0)});world.allowSleep=false;world.solver.iterations=14;
    const mDie=new Material('die'),mFloor=new Material('floor'),mWall=new Material('wall'),mCup=new Material('cup');
    world.addContactMaterial(new ContactMaterial(mDie,mFloor,{friction:0.32,restitution:0.42}));
    world.addContactMaterial(new ContactMaterial(mDie,mWall,{friction:0.1,restitution:0.62}));
    world.addContactMaterial(new ContactMaterial(mDie,mCup,{friction:0.35,restitution:0.5}));
    const addPlane=(m,px,py,pz,ax,ay,az,ang)=>{const b=new Body({mass:0,material:m});b.addShape(new CPlane());b.position.set(px,py,pz);if(ax!=null)b.quaternion.setFromAxisAngle(new Vec3(ax,ay,az),ang);world.addBody(b);return b};
    addPlane(mFloor,0,0,0,1,0,0,-Math.PI/2);addPlane(mWall,0,0,-TZ,null);addPlane(mWall,0,0,TZ,0,1,0,Math.PI);
    addPlane(mWall,-TX,0,0,0,1,0,Math.PI/2);addPlane(mWall,TX,0,0,0,1,0,-Math.PI/2);addPlane(mWall,0,10,0,1,0,0,Math.PI/2);
    const verts=[],vmap=[],faces=[];
    for(let i=0;i<pos.count;i++){const v=new Vector3().fromBufferAttribute(pos,i);let j=verts.findIndex(u=>u.distanceToSquared(v)<1e-8);if(j<0){verts.push(v);j=verts.length-1}vmap.push(j)}
    for(let f=0;f<nf;f++)faces.push([vmap[f*3],vmap[f*3+1],vmap[f*3+2]]);
    const body=new Body({mass:1,material:mDie,linearDamping:0.06,angularDamping:0.1});
    body.addShape(new ConvexPolyhedron({vertices:verts.map(v=>new Vec3(v.x,v.y,v.z)),faces}));
    const cupB=new Body({mass:0,type:Body.KINEMATIC,material:mCup});
    cupB.addShape(new Box(new Vec3(CR+0.05,0.12,CR+0.05)),new Vec3(0,0.12,0));
    const NW=16,seg=2*(CR+CT/2)*Math.tan(Math.PI/NW)+0.08;
    for(let i=0;i<NW;i++){const th=i/NW*Math.PI*2,q=new CQuat();q.setFromAxisAngle(new Vec3(0,1,0),th);
      cupB.addShape(new Box(new Vec3(seg/2,CH2/2,CT/2+0.05)),new Vec3(Math.sin(th)*(CR+CT/2+0.05),CH2/2,Math.cos(th)*(CR+CT/2+0.05)),q)}
    const lid=new Box(new Vec3(CR+0.1,0.12,CR+0.1));cupB.addShape(lid,new Vec3(0,CH2+0.1,0));
    world.addBody(cupB);world.addBody(body);
    // cup state: spring-driven position, spring-driven tilt (the mouth lags and sways like a cup held at the base)
    const P=new Vector3(0,0,TZ-2.1),V=new Vector3(),T=P.clone(),tilt=new Vector2(),tiltV=new Vector2(),acc=new Vector3();
    const eul=new Euler(),tq=new Quaternion(),cq=new Quaternion();
    cupB.position.set(P.x,P.y,P.z);
    body.position.set(P.x,0.24+DR,P.z);{const q=new CQuat();q.setFromEuler(Math.random()*6.28,Math.random()*6.28,Math.random()*6.28);body.quaternion.copy(q)}
    let dragging=false,phase=reduce?'roll':'cup',clackT=0;
    function driveCup(dt,target,heldY){
      // critically damped-ish spring toward the finger
      const w=26,z=0.9;acc.set((target.x-P.x)*w*w-2*z*w*V.x,(heldY-P.y)*w*w*0.5-2*z*w*0.7*V.y,(target.z-P.z)*w*w-2*z*w*V.z);
      V.addScaledVector(acc,dt);if(V.length()>16)V.multiplyScalar(16/V.length());const prev=P.clone();P.addScaledVector(V,dt);
      // tilt: the mouth lags behind the hand's acceleration, then sways back
      const k=0.0011,tx=Math.max(-0.55,Math.min(0.55,-acc.z*k)),tz=Math.max(-0.55,Math.min(0.55,acc.x*k));
      const tw=17,tz2=0.32;tiltV.x+=((tx-tilt.x)*tw*tw-2*tz2*tw*tiltV.x)*dt;tiltV.y+=((tz-tilt.y)*tw*tw-2*tz2*tw*tiltV.y)*dt;tilt.addScaledVector(tiltV,dt);
      eul.set(tilt.x,0,tilt.y,'XYZ');tq.setFromEuler(eul);
      setKinematic(prev,P,tq,dt);
    }
    function setKinematic(prev,p,q,dt){
      cupB.velocity.set((p.x-cupB.position.x)/dt,(p.y-cupB.position.y)/dt,(p.z-cupB.position.z)/dt);
      cq.set(cupB.quaternion.x,cupB.quaternion.y,cupB.quaternion.z,cupB.quaternion.w);
      const d=q.clone().multiply(cq.clone().invert());if(d.w<0){d.x=-d.x;d.y=-d.y;d.z=-d.z;d.w=-d.w}
      const s=Math.sqrt(Math.max(0,1-d.w*d.w)),ang=2*Math.acos(Math.min(1,d.w));
      if(s>1e-6)cupB.angularVelocity.set(d.x/s*ang/dt,d.y/s*ang/dt,d.z/s*ang/dt);else cupB.angularVelocity.set(0,0,0);
    }
    function snapKinematic(p,q){cupB.position.set(p.x,p.y,p.z);cupB.quaternion.set(q.x,q.y,q.z,q.w)}
    let liveImpact=null;
    body.addEventListener('collide',ev=>{if(liveImpact)liveImpact(ev)});
    liveImpact=ev=>{const v=Math.abs(ev.contact.getImpactVelocityAlongNormal());if(v>0.8&&performance.now()-clackT>35){clackT=performance.now();clack(Math.min(.5,v/16),ev.body===cupB?1300:2300)}};
    // pointer
    const ray=new Raycaster(),ndc=new Vector2(),hold=new Plane(new Vector3(0,1,0),-HOLD_Y),hit=new Vector3();
    const LX=TX-(CR+CT)-0.15,LZ=TZ-(CR+CT)-0.15;
    const toTable=e=>{const r=cv.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam);if(ray.ray.intersectPlane(hold,hit)){return new Vector3(Math.max(-LX,Math.min(LX,hit.x)),0,Math.max(-LZ,Math.min(LZ,hit.z)))}return null};
    let grab=new Vector3();
    cv.addEventListener('pointerdown',e=>{if(phase!=='cup')return;audio();dragging=true;cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);const p=toTable(e);if(p){grab.set(P.x-p.x,0,P.z-p.z);if(grab.length()>CR+0.6)grab.set(0,0,0);T.set(p.x+grab.x,0,p.z+grab.z)}e.preventDefault()});
    cv.addEventListener('pointermove',e=>{if(!dragging||phase!=='cup')return;const p=toTable(e);if(p)T.set(Math.max(-LX,Math.min(LX,p.x+grab.x)),0,Math.max(-LZ,Math.min(LZ,p.z+grab.z)));e.preventDefault()});
    const up=()=>{if(phase==='cup'&&dragging){dragging=false;throwIt()}};
    cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    // throw: tip the cup toward the flick, simulate to rest, relabel unseen, then play back
    let frames=[],impacts=[],playT=0,restPose=null,relabelAt=-1,throwAt=0,swap=null;
    function cupScript(t,P0,dir){ // pose of the cup after release
      const k=Math.min(1,t/0.22),e=1-Math.pow(1-k,2);
      const r=Math.max(0,t-0.3);const p=new Vector3(P0.x+dir.x*0.9*e-dir.x*r*r*40,P0.y+(HOLD_Y+0.6-P0.y)*e+r*3,P0.z+dir.z*0.9*e-dir.z*r*r*40);
      const axis=new Vector3(dir.z,0,-dir.x).normalize();const q=new Quaternion().setFromAxisAngle(axis,2.05*e).multiply(tq.clone().slerp(new Quaternion(),e));
      return {p,q};
    }
    function throwIt(){
      phase='fly';throwAt=performance.now();try{cupB.removeShape(lid)}catch(e){}
      let v=new Vector3(V.x,0,V.z),sp=v.length(),dir;
      if(sp<3){dir=new Vector3(-P.x*0.3,0,-1).normalize();sp=11+Math.random()*3}else dir=v.clone().normalize();
      sp=Math.max(8,Math.min(18,sp*1.1));
      const P0=P.clone();frames=[];impacts=[];
      let still=0,nudges=0,n=0,kicked=false,released=false;
      liveImpact=ev=>{const iv=Math.abs(ev.contact.getImpactVelocityAlongNormal());if(iv>1)impacts.push([n,iv,ev.body===cupB?1300:2300])};
      for(n=0;n<120*7;n++){
        const t=n*STEP,cs=cupScript(t+STEP,P0,dir);
        if(t<0.75){setKinematic(null,cs.p,cs.q,STEP)}else if(!released){released=true;world.removeBody(cupB)}
        if(!kicked&&t>=0.1){kicked=true;body.velocity.set(dir.x*sp,5+Math.random()*2,dir.z*sp);body.angularVelocity.set((Math.random()-.5)*28,(Math.random()-.5)*28,(Math.random()-.5)*28)}
        world.step(STEP);
        if(t<0.75)snapKinematic(cs.p,cs.q);
        frames.push([body.position.x,body.position.y,body.position.z,body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w,
          cupB.position.x,released?99:cupB.position.y,cupB.position.z,cupB.quaternion.x,cupB.quaternion.y,cupB.quaternion.z,cupB.quaternion.w]);
        if(t>0.8&&body.velocity.length()<0.2&&body.angularVelocity.length()<0.35&&body.position.y<DR+0.05)still++;else still=0;
        if(still>30){const qq=new Quaternion(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);
          const best=Math.max(...faceN.map(nn=>nn.clone().applyQuaternion(qq).y));
          if(best<0.93&&nudges<2){nudges++;const toC=new Vec3(-body.position.x,0,-body.position.z);toC.normalize();body.velocity.set(toC.x*3,4,toC.z*3);body.angularVelocity.set((Math.random()-.5)*8,(Math.random()-.5)*4,(Math.random()-.5)*8);still=0}else break}
      }
      liveImpact=null;
      const qf=new Quaternion(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);
      let top=0,ty=-2;faceN.forEach((nn,f)=>{const y=nn.clone().applyQuaternion(qf).y;if(y>ty){ty=y;top=f}});
      const other=labels.indexOf(c.d);
      if(other!==top){
        swap=[top,other];
        // first moment after release when both faces face away from the camera
        relabelAt=0;const q=new Quaternion(),dp=new Vector3();
        for(let i=0;i<frames.length;i++){const F=frames[i];q.set(F[3],F[4],F[5],F[6]);dp.set(camHome.x-F[0],camHome.y-F[1],camHome.z-F[2]).normalize();
          if(faceN[top].clone().applyQuaternion(q).dot(dp)<-0.05&&faceN[other].clone().applyQuaternion(q).dot(dp)<-0.05){relabelAt=i;break}}
      }
      restPose={top,q:qf,p:new Vector3(body.position.x,body.position.y,body.position.z)};
      window.__dice={frames:frames.length,nudges,top:ty.toFixed(3),relabelAt};
      playT=0;
      ov.querySelector('.dice-res').innerHTML='';
    }
    const doSwap=()=>{if(!swap)return;const [a,b]=swap;const t=labels[a];labels[a]=labels[b];labels[b]=t;applyLabels();swap=null};
    let endT=0,shown=false,done=false,raf=0,last=performance.now(),closeT=null,accum=0;
    const endCam=new Vector3(),endLook=new Vector3();let endQ=null,startQ=null,startP=null;
    function prepareEnd(){
      doSwap();
      const q=restPose.q;const upv=faceUp[restPose.top].clone().applyQuaternion(q);upv.y=0;upv.normalize();
      const ang=Math.atan2(upv.x,-upv.z);const yaw=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),ang);
      startQ=q.clone();endQ=yaw.multiply(q);startP=restPose.p.clone();
      endLook.set(restPose.p.x,restPose.p.y+0.35,restPose.p.z);endCam.set(restPose.p.x,restPose.p.y+4.4,restPose.p.z+0.001);
    }
    const finish=()=>{if(done)return;done=true;clearTimeout(closeT);ov.classList.add('out');setTimeout(()=>{cancelAnimationFrame(raf);
      try{scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});disposables.forEach(d=>d.dispose&&d.dispose());renderer.dispose();renderer.forceContextLoss()}catch(e){}
      ov.remove();resolve()},180)};
    const showResult=()=>{if(shown)return;shown=true;
      ov.querySelector('.dice-res').innerHTML='<b class="o-'+c.outcomeKey+'">'+c.outcome+'</b><span>'+c.sum+'</span>';
      ov.classList.add('done');closeT=setTimeout(finish,2600)};
    ov.addEventListener('click',e=>{if(performance.now()-throwAt<450)return;if(e.target===cv&&phase==='cup')return;if(shown){finish();return}
      if(phase==='cup'){throwIt()}else if(phase==='fly'){playT=frames.length/120}});
    if(reduce){throwIt();playT=frames.length/120}
    const tmpQ=new Quaternion();
    function frame(now){
      if(done)return;const dt=Math.min(0.05,(now-last)/1000);last=now;
      if(phase==='cup'){
        accum+=dt;let steps=0;
        while(accum>=STEP&&steps<10){for(let h=0;h<2;h++){driveCup(STEP/2,dragging?T:new Vector3(P.x,0,P.z),dragging?HOLD_Y:0);world.step(STEP/2);snapKinematic(P,tq)}accum-=STEP;steps++}
        if(body.position.distanceTo(new Vec3(P.x,body.position.y,P.z))>CR+0.2&&body.position.y<P.y+CH2){body.position.set(P.x,P.y+0.5+DR,P.z);body.velocity.set(V.x,V.y,V.z)}
        if(steps>=10)accum=0;
        die.position.set(body.position.x,body.position.y,body.position.z);die.quaternion.set(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);
        cup.position.copy(P);cup.quaternion.copy(tq);
      }else if(phase==='fly'){
        const prevI=Math.floor(playT*120);playT+=dt;let i=Math.floor(playT*120);
        for(const im of impacts)if(im[0]>prevI&&im[0]<=i)clack(Math.min(.6,im[1]/14),im[2]);
        if(swap&&i>=relabelAt)doSwap();
        if(i>=frames.length-1){i=frames.length-1;phase='settle';endT=0;prepareEnd()}
        const F=frames[i];die.position.set(F[0],F[1],F[2]);die.quaternion.set(F[3],F[4],F[5],F[6]);
        cup.position.set(F[7],F[8],F[9]);cup.quaternion.set(F[10],F[11],F[12],F[13]);cup.visible=F[8]<50&&Math.abs(F[7])<12&&Math.abs(F[9])<14;
      }else if(phase==='settle'){
        endT+=dt;const k=Math.min(1,endT/0.6),e=1-Math.pow(1-k,3);
        tmpQ.copy(startQ).slerp(endQ,e);die.quaternion.copy(tmpQ);die.position.set(startP.x,startP.y+0.35*e,startP.z);
        cam.position.lerpVectors(camHome,endCam,e);cam.lookAt(lookHome.clone().lerp(endLook,e));
        if(k>=1&&!shown)showResult();
      }
      dShadow.position.x=die.position.x;dShadow.position.z=die.position.z;const hgt=Math.max(0,die.position.y-DR);dShadow.scale.setScalar(Math.max(.4,1-hgt*0.12));dShadow.material.opacity=Math.max(.06,.38-hgt*0.06);
      cShadow.visible=cup.visible;cShadow.position.x=cup.position.x;cShadow.position.z=cup.position.z;const ch=Math.max(0,cup.position.y);cShadow.scale.setScalar(Math.max(.5,1-ch*0.08));cShadow.material.opacity=Math.max(.05,.42-ch*0.09);
      flame.scale.y=1+Math.sin(now/90)*0.15;candle.intensity=17+Math.sin(now/130)*2;
      renderer.render(scene,cam);raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
  });
};
