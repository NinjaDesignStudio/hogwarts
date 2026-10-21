/* Paper doll: 32x48 pixel sprite drawn from a look + equipment art keys. */
const DOLL={
  skins:['#f6dcc6','#f1d2b6','#e3b995','#d4a57e','#c99470','#a87650','#8a5a3a','#5e3c28'],
  hairColours:{black:'#1b1a1f',dark_brown:'#3a2616',brown:'#5a3a24',light_brown:'#7a5434',auburn:'#8a3a22',ginger:'#c4582a',blond:'#d9b25c',platinum:'#e6dab0',grey:'#9a9aa0'},
  hairStyles:['short','messy','parted','swept','spiky','curly','long','buzz'],
  eyeColours:{brown:'#5a3a1e',dark_brown:'#2e1c10',hazel:'#7a6a2a',green:'#3f7a46',blue:'#3a6aa8',grey:'#7a8a96'},
  house:{Gryffindor:['#8b1e24','#d9a94b'],Slytherin:['#1a4a2a','#c0c0c0'],Ravenclaw:['#1f3a6a','#b07a30'],Hufflepuff:['#d9b23a','#1a1a1a']}
};
function drawDoll(cx,look,eq,house){
  look=look||{}; eq=eq||{};
  const W=32,H=54; cx.clearRect(0,0,W,H);
  const r=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(x,y+6,w,h)};
  const skin=DOLL.skins[Math.max(0,Math.min(DOLL.skins.length-1,look.skin|0))], skinSh=shade(skin,.82);
  const hair=DOLL.hairColours[look.hair_colour]||DOLL.hairColours.dark_brown, hairHi=shade(hair,1.25);
  const [h1,h2]=DOLL.house[house]||['#3a3a44','#9a9aa0'];
  const robes=eq.robes||'school_robes', head=eq.head||'none', neck=eq.neck||'none', hands=eq.hands||'none', feet=eq.feet||'school_shoes', comp=eq.companion||'none';
  const outline='#1a1418';
  // broom behind
  if(eq.broom==='broom'){for(let i=0;i<26;i++)r(5+i,42-i,2,1,i%5?'#7a5a3a':'#5a3a24');for(let i=0;i<6;i++)r(0+i,41+i,7-i,1,'#c9a24a');r(2,47,5,1,'#9a7a3a')}
  // legs & feet
  const trousers=(robes==='muggle_clothes'||robes==='jumper'||robes==='hoodie'||robes==='tshirt')?'#2a3a6a':'#1a1418';
  r(12,34,3,8,trousers); r(17,34,3,8,trousers);
  if(feet==='boots'){r(11,40,5,6,'#5a3a24');r(16,40,5,6,'#5a3a24');r(11,40,5,1,'#7a5a3a');r(16,40,5,1,'#7a5a3a')}
  else if(feet==='trainers'){r(11,43,5,3,'#f0f0f0');r(16,43,5,3,'#f0f0f0');r(11,43,5,1,'#3a5a8a');r(16,43,5,1,'#3a5a8a');r(11,45,5,1,'#b0b0b0');r(16,45,5,1,'#b0b0b0');r(15,44,1,1,'#3a5a8a');r(20,44,1,1,'#3a5a8a')}
  else if(feet==='school_shoes'){r(11,43,5,3,'#111');r(16,43,5,3,'#111');r(11,43,5,1,'#333');r(16,43,5,1,'#333')}
  else {r(12,43,3,3,skinSh);r(17,43,3,3,skinSh)}
  // body
  let bc='#1a1418', bhi='#2a2430', trim=h1;
  if(robes==='winter_cloak'){bc='#3a3a44';bhi='#4a4a56';trim='#5a5a66'}
  if(robes==='quidditch_robes'){bc=h1;bhi=shade(h1,1.25);trim=h2}
  if(robes==='dress_robes'){bc='#1e3a2a';bhi='#2a4a36';trim='#c9a24a'}
  if(robes==='muggle_clothes'){bc='#3a5a8a';bhi='#4a6a9a';trim='#3a5a8a'}
  if(robes==='jumper'){bc='#6a3a3a';bhi='#7a4a4a';trim='#6a3a3a'}
  if(robes==='hoodie'){bc='#3a3a3a';bhi='#4a4a4a';trim='#3a3a3a'}
  if(robes==='tshirt'){bc='#e8e4d8';bhi='#f6f3ea';trim='#e8e4d8'}
  r(9,17,14,18,bc); r(9,17,2,18,bhi); r(8,19,1,15,bc); r(23,19,1,15,bc);
  if(robes==='school_robes'||robes==='dress_robes'){r(15,17,2,14,trim); r(11,17,10,2,trim)} // lining & collar
  if(robes==='winter_cloak'){r(14,19,4,2,'#c9a24a')} // clasp
  if(robes==='hoodie'){r(11,16,10,3,'#2a2a2a');r(13,22,6,1,'#5a5a5a')}
  if(robes==='jumper'){r(11,17,10,1,'#8a5a5a');r(9,30,14,2,'#5a2a2a')}
  if(robes==='tshirt'){r(12,34,8,2,'#3a5a8a')}
  if(robes==='muggle_clothes'){r(11,17,10,2,'#2a4a7a');r(9,34,14,1,'#2a3a6a')}
  if(robes==='quidditch_robes'){r(11,22,10,3,h2)}
  // arms
  r(6,19,3,13,bc); r(23,19,3,13,bc); r(6,19,1,13,bhi);
  // hands
  const hc=hands==='dragonhide_gloves'?'#6a4a2a':skin;
  r(6,32,3,3,hc); r(23,32,3,3,hc);
  // wand in right hand
  if(eq.wand!=='none'){for(let i=0;i<7;i++)r(26+i*.5|0,31-i,1,1,'#7a5a3a')}
  // neck
  r(14,15,4,3,skinSh);
  if(neck==='house_scarf'){for(let i=0;i<4;i++)r(10+i*3,15,3,3,i%2?h2:h1);r(20,15,3,8,h1);r(20,18,3,2,h2);r(20,21,3,2,h2)}
  if(neck==='amulet'){r(13,16,1,1,'#c9a24a');r(18,16,1,1,'#c9a24a');r(14,17,4,1,'#c9a24a');r(15,18,2,2,'#2f8a5a')}
  // head
  r(11,6,10,10,skin); r(11,6,1,10,skinSh); r(11,15,10,1,skinSh);
  // eyes, brows, marks, mouth
  const iris=DOLL.eyeColours[look.eye_colour]||'#1a1418';
  r(13,10,2,1,iris); r(17,10,2,1,iris); r(14,10,1,1,shade(iris,1.2)); r(17,10,1,1,shade(iris,1.2));
  const brow=shade(hair,.85);
  const specs=look.glasses==='round'||look.glasses==='square';
  if(look.brows==='thick'){r(12,8,3,1,brow);r(17,8,3,1,brow);if(!specs){r(13,9,1,1,brow);r(18,9,1,1,brow)}} else {r(13,8,2,1,brow);r(17,8,2,1,brow)}
  const marks=Array.isArray(look.marks)?look.marks:[];
  if(marks.includes('freckles')){const f=shade(skin,.66);r(12,11,1,1,f);r(14,12,1,1,f);r(17,12,1,1,f);r(19,11,1,1,f)}
  if(marks.includes('mole'))r(19,12,1,1,shade(skin,.45));
  if(marks.includes('scar')){r(18,7,1,1,'#e2b0a6');r(18,8,1,1,'#e2b0a6')}
  r(14,13,3,1,shade(skin,.7));
  // glasses
  if(look.glasses==='round'){const g='#b09460';r(13,9,2,1,g);r(13,11,2,1,g);r(17,9,2,1,g);r(17,11,2,1,g);r(12,10,1,1,g);r(15,10,2,1,g);r(19,10,1,1,g)}
  if(look.glasses==='square'){const g='#7a5636';r(12,9,8,1,g);r(12,10,1,1,g);r(19,10,1,1,g);r(15,10,2,1,shade(skin,.8));r(13,11,2,1,shade(skin,.88));r(17,11,2,1,shade(skin,.88))}
  // hair
  const st=look.hair_style||'short';
  if(st==='buzz'){r(11,5,10,2,shade(hair,.9)); r(11,6,1,2,shade(hair,.9)); r(20,6,1,2,shade(hair,.9)); for(let i=0;i<5;i++)r(12+i*2,5,1,1,hairHi)}
  else {r(11,5,10,3,hair); r(11,6,1,4,hair); r(20,6,1,4,hair); r(12,5,8,1,hairHi)}
  if(st==='swept'){r(16,4,5,1,hair);r(12,7,6,1,hair);r(12,8,3,1,hair);r(12,9,1,1,hair);r(14,6,5,1,hairHi);r(20,7,1,3,hair)}
  if(st==='spiky'){[[11,3],[13,2],[15,3],[17,2],[19,3]].forEach(([x,y])=>{r(x,y,1,6-y,hair);r(x,y,1,1,hairHi)});r(12,8,1,1,hair);r(16,8,1,1,hair);r(19,8,1,1,hair)}
  if(st==='messy'){r(10,4,2,2,hair);r(13,3,2,2,hair);r(17,3,2,3,hair);r(20,4,2,2,hair);r(10,8,1,3,hair);r(21,7,1,4,hair);r(12,8,1,1,hair);r(19,8,1,2,hair);r(15,8,1,1,hairHi)}
  if(st==='parted'){r(15,5,1,3,hairHi);r(11,6,1,7,hair);r(20,6,1,6,hair);r(12,8,2,1,hair);r(19,8,1,1,hair)}
  if(st==='curly'){for(let i=0;i<6;i++)r(10+i*2,4+(i%2),2,2,hair);r(10,7,1,6,hair);r(21,7,1,6,hair);r(9,9,1,3,hair);r(22,9,1,3,hair);r(10,11,1,1,hairHi);r(21,12,1,1,hairHi)}
  if(st==='long'){r(9,6,3,16,hair);r(20,6,3,16,hair);r(9,21,2,2,hair);r(21,21,2,2,hair);r(10,8,1,1,hairHi);r(21,10,1,1,hairHi)}
  // hat
  // hats sit on top of the head; hair below the brim stays visible
  if(head==='pointed_hat'){r(7,4,18,2,'#2a2434');r(10,2,12,2,'#2a2434');r(11,0,10,2,'#2a2434');r(12,-2,7,2,'#2a2434');r(14,-4,4,2,'#2a2434');r(16,-6,2,2,'#2a2434');r(7,4,18,1,'#4a4458');r(10,3,12,1,'#6a4a2a');r(11,0,1,2,'#4a4458');r(12,-2,1,2,'#4a4458');r(14,-4,1,2,'#4a4458')}
  if(head==='winter_hat'){r(10,1,12,5,h1);r(10,4,12,2,h2);r(14,-1,4,2,h2)}
  // companion
  if(comp==='owl'){r(2,12,4,5,'#6b4a30');r(2,12,4,1,'#8a6a40');r(2,13,1,1,'#ffd36a');r(5,13,1,1,'#ffd36a');r(3,14,2,1,'#f0a030');r(2,17,1,1,'#3a2616');r(5,17,1,1,'#3a2616')}
  if(comp==='cat'){r(26,40,6,4,'#3a3a3a');r(27,38,4,3,'#3a3a3a');r(27,37,1,1,'#3a3a3a');r(30,37,1,1,'#3a3a3a');r(28,39,1,1,'#7ad07a');r(30,39,1,1,'#7ad07a');r(31,41,1,3,'#3a3a3a')}
  if(comp==='toad'){r(1,31,4,3,'#4f7a3a');r(1,30,1,1,'#2a2a2a');r(4,30,1,1,'#2a2a2a')}
  // outline pass (selective): head and body edges
  r(11,6,10,1,shade(skin,.6));
}
function shade(hex,k){const n=parseInt(hex.slice(1),16);let R=(n>>16)&255,G=(n>>8)&255,B=n&255;R=Math.min(255,R*k|0);G=Math.min(255,G*k|0);B=Math.min(255,B*k|0);return '#'+((1<<24)|(R<<16)|(G<<8)|B).toString(16).slice(1)}
