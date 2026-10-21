/* 3D dice tray: a leather cup you drag to shake and release to throw; a d20 under rigid-body physics.
   The page decides the number (fair crypto roll). On release we simulate the throw to rest out of sight,
   see which face lands up, print the rolled number on that face, then play the recorded motion. */
import {WebGLRenderer,Scene,PerspectiveCamera,AmbientLight,DirectionalLight,PointLight,Mesh,Group,PlaneGeometry,BoxGeometry,
  CylinderGeometry,CircleGeometry,IcosahedronGeometry,TorusGeometry,MeshLambertMaterial,MeshBasicMaterial,CanvasTexture,
  NearestFilter,Vector3,Quaternion,Raycaster,Vector2,Plane,BackSide,SRGBColorSpace,Color,Fog} from 'three';
import {World,Body,Plane as CPlane,ConvexPolyhedron,Vec3,Material,ContactMaterial,Quaternion as CQuat} from 'cannon-es';

const LW=240, LH=300;            // low-res render size, upscaled with pixelated CSS
const TX=3.5, TZ=4.5;            // tray half-size (inner)
const DR=0.62;                   // die radius
const STEP=1/120;

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
    ov.innerHTML='<div class="dice-card"><div class="dice-k">'+c.label+'</div><canvas class="d3c" width="'+LW+'" height="'+LH+'"></canvas><div class="dice-res"><span class="dice-tip">Drag the cup to shake it. Let go to throw.</span></div><div class="dice-hint">tap to continue</div></div>';
    document.body.appendChild(ov);
    const cv=ov.querySelector('canvas');
    let renderer;
    try{renderer=new WebGLRenderer({canvas:cv,antialias:false,alpha:false,powerPreference:'low-power'})}catch(e){ov.remove();reject(e);return}
    renderer.setPixelRatio(1);renderer.setSize(LW,LH,false);renderer.outputColorSpace=SRGBColorSpace;
    const scene=new Scene();scene.background=new Color('#120f1c');scene.fog=new Fog('#120f1c',14,26);
    const cam=new PerspectiveCamera(42,LW/LH,0.1,60);const camHome=new Vector3(0,11.5,8.2),lookHome=new Vector3(0,0,0.6);
    cam.up.set(0,0,-1);cam.position.copy(camHome);cam.lookAt(lookHome);
    scene.add(new AmbientLight('#8a7a9a',1.1));
    const key=new DirectionalLight('#fff1d8',1.25);key.position.set(-3,10,6);scene.add(key);
    const candle=new PointLight('#ffb35a',18,18,1.6);candle.position.set(3.2,3,-4.2);scene.add(candle);
    // table and tray
    const disposables=[];
    const wood=woodTexture(),felt=feltTexture();disposables.push(wood,felt);
    const tableMat=new MeshLambertMaterial({map:wood}),feltMat=new MeshLambertMaterial({map:felt}),rimMat=new MeshLambertMaterial({color:'#6b4a2e',flatShading:true});
    const table=new Mesh(new PlaneGeometry(30,30),tableMat);table.rotation.x=-Math.PI/2;table.position.y=-0.02;scene.add(table);
    const floorM=new Mesh(new PlaneGeometry(TX*2,TZ*2),feltMat);floorM.rotation.x=-Math.PI/2;scene.add(floorM);
    const rims=[[0,-TZ-0.25,TX*2+1,0.5],[0,TZ+0.25,TX*2+1,0.5],[-TX-0.25,0,0.5,TZ*2],[TX+0.25,0,0.5,TZ*2]];
    rims.forEach(([x,z,w,d])=>{const m=new Mesh(new BoxGeometry(w,0.7,d),rimMat);m.position.set(x,0.35,z);scene.add(m)});
    // candle prop
    const wax=new Mesh(new CylinderGeometry(0.22,0.22,1.1,8),new MeshLambertMaterial({color:'#e8dcc0',flatShading:true}));wax.position.set(TX+1.3,0.55,-TZ+0.2);scene.add(wax);
    const flame=new Mesh(new CylinderGeometry(0.02,0.1,0.3,6),new MeshBasicMaterial({color:'#ffcf5a'}));flame.position.set(TX+1.3,1.25,-TZ+0.2);scene.add(flame);
    // die mesh
    const geo=new IcosahedronGeometry(DR,0);const A=atlas();disposables.push(A.tex,geo);
    const pos=geo.getAttribute('position');const nf=pos.count/3;
    const uv=geo.getAttribute('uv');
    const labels=[...Array(nf)].map((_,i)=>i+1);
    const applyLabels=()=>{for(let f=0;f<nf;f++){const T=A.tris[labels[f]-1];for(let k=0;k<3;k++)uv.setXY(f*3+k,T[k][0],T[k][1])}uv.needsUpdate=true};
    applyLabels();
    const dieMat=new MeshLambertMaterial({map:A.tex,flatShading:true});
    const die=new Mesh(geo,dieMat);die.visible=false;scene.add(die);
    const shadow=new Mesh(new CircleGeometry(DR*0.95,12),new MeshBasicMaterial({color:'#000',transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=0.01;shadow.visible=false;scene.add(shadow);
    // face data (local)
    const faceN=[],faceUp=[];
    for(let f=0;f<nf;f++){
      const a=new Vector3().fromBufferAttribute(pos,f*3),b=new Vector3().fromBufferAttribute(pos,f*3+1),cc=new Vector3().fromBufferAttribute(pos,f*3+2);
      const cen=a.clone().add(b).add(cc).multiplyScalar(1/3);faceN.push(cen.clone().normalize());faceUp.push(a.clone().sub(cen).normalize());
    }
    // physics
    const world=new World({gravity:new Vec3(0,-32,0)});world.allowSleep=false;
    const mDie=new Material('die'),mFloor=new Material('floor'),mWall=new Material('wall');
    world.addContactMaterial(new ContactMaterial(mDie,mFloor,{friction:0.32,restitution:0.42}));
    world.addContactMaterial(new ContactMaterial(mDie,mWall,{friction:0.1,restitution:0.62}));
    const addPlane=(m,px,py,pz,ax,ay,az,ang)=>{const b=new Body({mass:0,material:m});b.addShape(new CPlane());b.position.set(px,py,pz);if(ax!=null)b.quaternion.setFromAxisAngle(new Vec3(ax,ay,az),ang);world.addBody(b);return b};
    addPlane(mFloor,0,0,0,1,0,0,-Math.PI/2);
    addPlane(mWall,0,0,-TZ,null);                        // far wall, normal +z
    addPlane(mWall,0,0,TZ,0,1,0,Math.PI);                // near wall
    addPlane(mWall,-TX,0,0,0,1,0,Math.PI/2);             // left
    addPlane(mWall,TX,0,0,0,1,0,-Math.PI/2);             // right
    addPlane(mWall,0,9,0,1,0,0,Math.PI/2);               // lid, keeps it in
    const verts=[],vmap=[],faces=[];
    for(let i=0;i<pos.count;i++){const v=new Vector3().fromBufferAttribute(pos,i);let j=verts.findIndex(u=>u.distanceToSquared(v)<1e-8);if(j<0){verts.push(v);j=verts.length-1}vmap.push(j)}
    for(let f=0;f<nf;f++)faces.push([vmap[f*3],vmap[f*3+1],vmap[f*3+2]]);
    const shape=new ConvexPolyhedron({vertices:verts.map(v=>new Vec3(v.x,v.y,v.z)),faces});
    const body=new Body({mass:1,material:mDie,linearDamping:0.08,angularDamping:0.12});body.addShape(shape);
    // cup
    const cup=new Group();
    const leather=new MeshLambertMaterial({color:'#6a3a22',flatShading:true}),inner=new MeshLambertMaterial({color:'#2a160c',side:BackSide,flatShading:true});
    const shell=new Mesh(new CylinderGeometry(0.95,0.78,1.9,12,1,true),leather);shell.position.y=0.95;cup.add(shell);
    const lin=new Mesh(new CylinderGeometry(0.94,0.77,1.88,12,1,true),inner);lin.position.y=0.95;cup.add(lin);
    const base=new Mesh(new CircleGeometry(0.78,12),new MeshLambertMaterial({color:'#2a160c',flatShading:true}));base.rotation.x=-Math.PI/2;base.position.y=0.02;cup.add(base);
    const rim=new Mesh(new TorusGeometry(0.95,0.07,4,12),new MeshLambertMaterial({color:'#c9a24a',flatShading:true}));rim.rotation.x=Math.PI/2;rim.position.y=1.9;cup.add(rim);
    const band=new Mesh(new TorusGeometry(0.9,0.05,4,12),new MeshLambertMaterial({color:'#8c1f25',flatShading:true}));band.rotation.x=Math.PI/2;band.position.y=0.6;cup.add(band);
    cup.position.set(0,0.2,TZ-1.4);scene.add(cup);
    // interaction
    const ray=new Raycaster(),ndc=new Vector2(),hold=new Plane(new Vector3(0,1,0),-0.6),hit=new Vector3();
    let phase=reduce?'roll':'cup', dragging=false, moved=0, hist=[], target=cup.position.clone(), lastV=new Vector3(), shakeT=0;
    const toTable=e=>{const r=cv.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam);if(ray.ray.intersectPlane(hold,hit)){hit.x=Math.max(-TX+1,Math.min(TX-1,hit.x));hit.z=Math.max(-TZ+1,Math.min(TZ-0.9,hit.z));return hit.clone()}return null};
    const onDown=e=>{if(phase!=='cup')return;audio();dragging=true;moved=0;hist=[];cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);const p=toTable(e);if(p){target.set(p.x,0.2,p.z)}e.preventDefault()};
    const onMove=e=>{if(!dragging||phase!=='cup')return;const p=toTable(e);if(!p)return;moved+=Math.hypot(p.x-target.x,p.z-target.z);target.set(p.x,0.2,p.z);e.preventDefault()};
    const onUp=e=>{if(phase==='cup'&&dragging){dragging=false;throwIt()}};
    cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',onUp);
    // throw: simulate to rest, label the up face, then play back
    let frames=[],impacts=[],playT=0,restPose=null;
    function simulate(p0,v0){
      body.position.set(p0.x,p0.y,p0.z);body.velocity.set(v0.x,v0.y,v0.z);
      body.angularVelocity.set((Math.random()-.5)*30,(Math.random()-.5)*30,(Math.random()-.5)*30);
      const q=new CQuat();q.setFromEuler(Math.random()*6.28,Math.random()*6.28,Math.random()*6.28);body.quaternion.copy(q);
      world.addBody(body);
      frames=[];impacts=[];let still=0,n=0,nudges=0;
      const onCol=ev=>{const v=Math.abs(ev.contact.getImpactVelocityAlongNormal());if(v>1.2)impacts.push([n,v,ev.body&&ev.body.mass===0&&ev.body.position.y===0?1800:2600])};
      body.addEventListener('collide',onCol);
      for(n=0;n<120*7;n++){
        world.step(STEP);
        frames.push([body.position.x,body.position.y,body.position.z,body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w]);
        if(body.velocity.length()<0.2&&body.angularVelocity.length()<0.35&&body.position.y<DR+0.05)still++;else still=0;
        if(still>30){
          // cocked against a wall? nudge it and carry on
          const qq=new Quaternion(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);
          const best=Math.max(...faceN.map(nn=>nn.clone().applyQuaternion(qq).y));
          if(best<0.93&&nudges<2){nudges++;const toC=new Vec3(-body.position.x,0,-body.position.z);toC.normalize();body.velocity.set(toC.x*3,4,toC.z*3);body.angularVelocity.set((Math.random()-.5)*8,(Math.random()-.5)*4,(Math.random()-.5)*8);still=0}else break;
        }
      }
      body.removeEventListener('collide',onCol);
      const qf=new Quaternion(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);
      let top=0,ty=-2;faceN.forEach((nn,f)=>{const y=nn.clone().applyQuaternion(qf).y;if(y>ty){ty=y;top=f}});
      const other=labels.indexOf(c.d);labels[other]=labels[top];labels[top]=c.d;applyLabels();
      restPose={top,q:qf,p:new Vector3(body.position.x,body.position.y,body.position.z)};
      window.__dice={frames:frames.length,nudges,top:ty.toFixed(3)};
    }
    let throwAt=0;
    function throwIt(){
      phase='fly';throwAt=performance.now();
      const now=performance.now();const old=hist.find(h=>now-h[0]<=110)||hist[0];
      let v=new Vector3();if(old&&now-old[0]>10){v.set((cup.position.x-old[1])/((now-old[0])/1000),0,(cup.position.z-old[2])/((now-old[0])/1000))}
      let sp=v.length();
      if(sp<3){const toC=new Vector3(-cup.position.x,0,-cup.position.z-1).normalize();v=toC.multiplyScalar(9+Math.random()*4);sp=v.length()}
      if(sp>20)v.multiplyScalar(20/sp);
      const dir=v.clone().normalize();
      const p0=new Vector3(cup.position.x+dir.x*0.6,1.7,cup.position.z+dir.z*0.6);
      simulate(p0,new Vector3(v.x,3+Math.random()*2,v.z));
      tipDir=dir;tipT=0;playT=0;die.visible=true;shadow.visible=true;clack(.25,1500);
      ov.querySelector('.dice-res').innerHTML='';
    }
    let tipDir=null,tipT=0,endT=0,shown=false,done=false,raf=0,last=performance.now(),closeT=null;
    const endCam=new Vector3(),endLook=new Vector3(),yawFix=new Quaternion();let endQ=null,startQ=null,startP=null;
    function prepareEnd(){
      const q=restPose.q;const up=faceUp[restPose.top].clone().applyQuaternion(q);up.y=0;up.normalize();
      const ang=Math.atan2(up.x,-up.z);   // rotate so the number's top points away from the camera (screen up)
      yawFix.setFromAxisAngle(new Vector3(0,1,0),ang);
      startQ=q.clone();endQ=yawFix.clone().multiply(q);startP=restPose.p.clone();
      endLook.copy(restPose.p);endCam.set(restPose.p.x,restPose.p.y+4.4,restPose.p.z+0.001);endLook.y=restPose.p.y+0.35;
    }
    const finish=()=>{if(done)return;done=true;clearTimeout(closeT);ov.classList.add('out');setTimeout(()=>{cancelAnimationFrame(raf);
      try{scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});disposables.forEach(d=>d.dispose&&d.dispose());renderer.dispose();renderer.forceContextLoss()}catch(e){}
      ov.remove();resolve()},180)};
    const showResult=()=>{if(shown)return;shown=true;
      ov.querySelector('.dice-res').innerHTML='<b class="o-'+c.outcomeKey+'">'+c.outcome+'</b><span>'+c.sum+'</span>';
      ov.classList.add('done');closeT=setTimeout(finish,2600)};
    ov.addEventListener('click',e=>{if(performance.now()-throwAt<450)return;if(e.target===cv&&phase==='cup')return;if(shown){finish();return}
      if(phase==='cup'){throwIt()} if(phase==='fly'){playT=frames.length/120}});
    if(reduce){throwIt();playT=frames.length/120}
    const tmpQ=new Quaternion();
    function frame(now){
      if(done)return;const dt=Math.min(0.05,(now-last)/1000);last=now;
      if(phase==='cup'){
        // cup follows the finger with a little lag and leans into the motion
        const prev=cup.position.clone();cup.position.lerp(target,Math.min(1,dt*18));
        const vel=cup.position.clone().sub(prev).multiplyScalar(1/Math.max(dt,1e-3));
        hist.push([now,cup.position.x,cup.position.z]);while(hist.length&&now-hist[0][0]>220)hist.shift();
        cup.rotation.z=-Math.max(-0.5,Math.min(0.5,vel.x*0.04));cup.rotation.x=Math.max(-0.5,Math.min(0.5,vel.z*0.04));
        const acc=vel.clone().sub(lastV).length();lastV.copy(vel);shakeT-=dt;
        if(acc>14&&shakeT<=0){clack(Math.min(.45,acc/90),3000);shakeT=0.07}
        if(!dragging){cup.position.y=0.2+Math.sin(now/400)*0.06}
        die.visible=true;const jig=Math.min(1,acc/40);
        die.position.set(cup.position.x+(Math.random()-.5)*0.3*jig,cup.position.y+0.75+Math.random()*0.25*jig,cup.position.z+(Math.random()-.5)*0.3*jig);
        if(jig>0.05){die.rotation.x+=(Math.random()-.5)*jig*2;die.rotation.y+=(Math.random()-.5)*jig*2;die.rotation.z+=(Math.random()-.5)*jig*2}
      }else if(phase==='fly'){
        // cup tips toward the throw and lifts away
        tipT+=dt;const k=Math.min(1,tipT/0.25);
        if(tipDir){cup.rotation.x=tipDir.z*1.9*k;cup.rotation.z=-tipDir.x*1.9*k;cup.position.y=0.2+Math.max(0,tipT-0.25)*9}
        if(cup.position.y>9)cup.visible=false;
        const prevI=Math.floor(playT*120);playT+=dt;let i=Math.floor(playT*120);
        for(const im of impacts)if(im[0]>prevI&&im[0]<=i)clack(Math.min(.6,im[1]/14),im[2]);
        if(i>=frames.length-1){i=frames.length-1;phase='settle';endT=0;prepareEnd()}
        const F=frames[i];die.position.set(F[0],F[1],F[2]);die.quaternion.set(F[3],F[4],F[5],F[6]);
      }else if(phase==='settle'){
        endT+=dt;const k=Math.min(1,endT/0.6),e=1-Math.pow(1-k,3);
        tmpQ.copy(startQ).slerp(endQ,e);die.quaternion.copy(tmpQ);die.position.set(startP.x,startP.y+0.35*e,startP.z);
        cam.position.lerpVectors(camHome,endCam,e);const lk=lookHome.clone().lerp(endLook,e);cam.lookAt(lk);
        if(k>=1&&!shown)showResult();
      }
      shadow.position.x=die.position.x;shadow.position.z=die.position.z;const hgt=Math.max(0,die.position.y-DR);shadow.scale.setScalar(Math.max(.4,1-hgt*0.12));shadow.material.opacity=Math.max(.08,.38-hgt*0.05);
      flame.scale.y=1+Math.sin(now/90)*0.15;candle.intensity=17+Math.sin(now/130)*2;
      renderer.render(scene,cam);raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
  });
};
