/* Portraits (24x24), creatures (16x16) and item icons (12x12), all procedural so any spec the GM invents can be drawn. */
const HOUSE_COL={Gryffindor:['#8b1e24','#d9a94b'],Slytherin:['#1a4a2a','#c0c0c0'],Ravenclaw:['#1f3a6a','#b07a30'],Hufflepuff:['#d9b23a','#1a1a1a'],staff:['#2a2434','#9c7a24'],family:['#3a5a8a','#9c7a24'],shop:['#5a3a2a','#c9a24a'],ministry:['#2a2a44','#c0c0c0'],ghost:['#8fb0d8','#dfe8f4'],portrait:['#4a3220','#c9a24a']};
function drawPortrait(cx,sp){
  sp=sp||{}; const W=24,H=24; cx.clearRect(0,0,W,H);
  const r=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(x,y,w,h)};
  const ghost=sp.house==='ghost'||sp.robes==='ghost';
  const [h1,h2]=HOUSE_COL[sp.house]||['#3a3a44','#9a9aa0'];
  let skin=DOLL.skins[Math.max(0,Math.min(4,sp.skin|0))]; if(ghost)skin='#cfdcea';
  let hair=DOLL.hairColours[sp.hair_colour]||DOLL.hairColours.dark_brown; if(sp.hair_colour==='white')hair='#e9e4d8'; if(sp.age==='old'&&!sp.hair_colour)hair='#9a9aa0'; if(ghost)hair='#a8bcd4';
  // frame for portraits
  if(sp.house==='portrait'){r(0,0,W,H,'#c9a24a');r(1,1,W-2,H-2,'#2a1e16');r(2,2,W-4,H-4,'#3a2a1e')}
  // shoulders / robes
  let rb='#1a1418'; if(sp.robes==='muggle_clothes')rb='#3a5a8a'; if(sp.robes==='teacher_robes')rb='#2a2434'; if(sp.robes==='winter_cloak')rb='#3a3a44'; if(sp.robes==='shopkeeper')rb='#5a3a2a'; if(sp.robes==='ministry_robes')rb='#2a2a44'; if(sp.robes==='quidditch_robes')rb=h1; if(sp.robes==='dress_robes')rb='#1e3a2a'; if(ghost)rb='#9fb4cc';
  r(3,18,18,6,rb); r(3,18,2,6,shade(rb,1.3));
  if(sp.robes==='school_robes'||sp.robes==='teacher_robes'||!sp.robes){r(11,18,2,6,h1)}
  if(sp.extra==='cufflinks'){r(4,22,2,1,'#c9a24a');r(18,22,2,1,'#c9a24a')}
  // head
  const hx=7,hy=5,hw=10,hh=12;
  r(hx,hy,hw,hh,skin); r(hx,hy,1,hh,shade(skin,.85)); r(hx,hy+hh-1,hw,1,shade(skin,.85));
  if(sp.age==='old'){r(hx+2,hy+8,2,1,shade(skin,.8));r(hx+6,hy+8,2,1,shade(skin,.8))}
  // eyes mouth
  r(hx+2,hy+5,1,1,'#1a1418'); r(hx+7,hy+5,1,1,'#1a1418'); r(hx+3,hy+9,4,1,shade(skin,.7));
  if(sp.extra==='glasses'){r(hx+1,hy+4,3,3,'#00000000');cx.strokeStyle='#2a2a2a';cx.lineWidth=1;cx.strokeRect(hx+1.5,hy+4.5,3,3);cx.strokeRect(hx+6.5,hy+4.5,3,3);r(hx+5,hy+6,1,1,'#2a2a2a')}
  if(sp.extra==='scar'){r(hx+1,hy+2,1,3,'#a0503a')}
  if(sp.extra==='moustache'){r(hx+2,hy+8,6,1,hair)}
  if(sp.extra==='beard'){r(hx+1,hy+9,8,5,hair);r(hx+2,hy+14,6,3,hair);r(hx+3,hy+9,4,1,shade(skin,.7))}
  // hair
  const st=sp.hair_style||'short';
  if(st!=='bald'){r(hx,hy-1,hw,3,hair);r(hx,hy,1,4,hair);r(hx+hw-1,hy,1,4,hair);r(hx+1,hy-1,hw-2,1,shade(hair,1.25))}
  if(st==='messy'){r(hx-1,hy-2,2,2,hair);r(hx+3,hy-3,2,2,hair);r(hx+7,hy-3,2,3,hair);r(hx+10,hy-2,2,2,hair)}
  if(st==='parted'){r(hx+4,hy-1,1,3,shade(hair,1.3));r(hx,hy,1,6,hair);r(hx+hw-1,hy,1,5,hair)}
  if(st==='curly'){for(let i=0;i<6;i++)r(hx-1+i*2,hy-2+(i%2),2,2,hair);r(hx-1,hy+1,1,5,hair);r(hx+hw,hy+1,1,5,hair)}
  if(st==='long'||sp.extra==='ringlets'){r(hx-1,hy,2,14,hair);r(hx+hw-1,hy,2,14,hair);if(sp.extra==='ringlets'){r(hx-2,hy+6,1,2,hair);r(hx+hw+1,hy+8,1,2,hair);r(hx-2,hy+10,1,2,hair)}}
  // hats
  const hd=sp.head||'none';
  if(hd==='pointed_hat'){r(hx-2,hy-1,hw+4,2,'#1a1418');r(hx,hy-3,hw,2,'#1a1418');r(hx+2,hy-5,hw-4,2,'#1a1418');r(hx+3,hy-7,hw-6,2,'#1a1418');r(hx-2,hy-1,hw+4,1,h1)}
  if(hd==='winter_hat'){r(hx,hy-3,hw,4,h1);r(hx,hy,hw,2,h2);r(hx+3,hy-5,4,2,h2)}
  if(hd==='bowler'){r(hx-2,hy,hw+4,1,'#1a1418');r(hx,hy-3,hw,3,'#1a1418');r(hx,hy-1,hw,1,'#2a2a34')}
  if(hd==='cavalier_hat'){r(hx-3,hy,hw+6,2,'#2a1e16');r(hx,hy-3,hw,3,'#2a1e16');r(hx+8,hy-6,2,4,'#e9d8c0');r(hx+9,hy-7,2,2,'#e9d8c0')}
  if(hd==='bonnet'){r(hx-1,hy-2,hw+2,4,'#e9e4d8');r(hx-1,hy+1,1,8,'#e9e4d8');r(hx+hw,hy+1,1,8,'#e9e4d8')}
  if(ghost){cx.globalCompositeOperation='source-atop';r(0,0,W,H,'rgba(140,170,220,.35)');cx.globalCompositeOperation='source-over'}
}
function drawCreature(cx,key){
  const W=16,H=16; cx.clearRect(0,0,W,H); const r=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(x,y,w,h)};
  switch(key){
    case 'owl': r(5,3,6,9,'#6b4a30');r(5,3,6,2,'#8a6a40');r(5,4,1,1,'#ffd36a');r(10,4,1,1,'#ffd36a');r(7,6,2,1,'#f0a030');r(4,6,1,5,'#5a3a24');r(11,6,1,5,'#5a3a24');r(6,12,1,1,'#3a2616');r(9,12,1,1,'#3a2616');r(6,8,4,3,'#8a6a40');break;
    case 'cat': r(3,8,9,5,'#3a3a3a');r(10,5,4,4,'#3a3a3a');r(10,4,1,1,'#3a3a3a');r(13,4,1,1,'#3a3a3a');r(11,6,1,1,'#7ad07a');r(13,6,1,1,'#7ad07a');r(1,6,2,3,'#3a3a3a');r(1,5,1,1,'#3a3a3a');r(4,13,1,2,'#3a3a3a');r(10,13,1,2,'#3a3a3a');break;
    case 'toad': r(4,7,8,5,'#4f7a3a');r(5,5,2,2,'#4f7a3a');r(9,5,2,2,'#4f7a3a');r(5,5,1,1,'#2a2a2a');r(10,5,1,1,'#2a2a2a');r(3,11,2,2,'#4f7a3a');r(11,11,2,2,'#4f7a3a');r(6,9,4,1,'#6a9a4a');break;
    case 'rat': r(4,8,8,4,'#7a6a5a');r(11,6,3,3,'#7a6a5a');r(13,7,1,1,'#1a1a1a');r(0,9,4,1,'#c9a08a');r(4,12,1,2,'#5a4a3a');r(10,12,1,2,'#5a4a3a');r(12,5,1,1,'#c9a08a');break;
    case 'dog': r(3,6,9,6,'#2a2420');r(10,3,5,5,'#2a2420');r(9,8,2,3,'#2a2420');r(12,5,1,1,'#c9a24a');r(10,2,2,3,'#1a1410');r(4,12,2,3,'#2a2420');r(9,12,2,3,'#2a2420');r(1,5,2,2,'#2a2420');r(13,8,2,2,'#e07a7a');break;
    case 'squid': r(5,2,6,7,'#8a4a6a');r(6,4,1,1,'#f5f5f5');r(9,4,1,1,'#f5f5f5');for(let i=0;i<6;i++)r(3+i*2,9,1,5+(i%2)*2,'#8a4a6a');r(5,3,6,1,'#a86a8a');break;
    case 'pixie': r(6,4,4,5,'#3ea0c0');r(5,9,6,3,'#3ea0c0');r(6,5,1,1,'#1a1a1a');r(9,5,1,1,'#1a1a1a');r(2,5,4,4,'rgba(200,240,255,.7)');r(10,5,4,4,'rgba(200,240,255,.7)');r(6,2,1,2,'#3ea0c0');r(9,2,1,2,'#3ea0c0');r(5,12,2,2,'#3ea0c0');r(9,12,2,2,'#3ea0c0');break;
    case 'flobberworm': for(let i=0;i<10;i++)r(3+i,7+Math.round(Math.sin(i/1.5)),1,3,i%2?'#9aa05a':'#b8b86a');r(3,8,1,1,'#2a2a2a');break;
    case 'bowtruckle': r(7,3,2,3,'#6a8a3a');r(6,6,4,5,'#5a7a2a');r(7,4,1,1,'#1a1a1a');r(4,7,2,1,'#5a7a2a');r(10,7,2,1,'#5a7a2a');r(6,11,1,3,'#5a7a2a');r(9,11,1,3,'#5a7a2a');r(6,2,1,2,'#7aa04a');r(9,2,1,2,'#7aa04a');break;
    case 'poltergeist': r(5,3,6,7,'#f0b040');r(6,5,1,1,'#1a1a1a');r(9,5,1,1,'#1a1a1a');r(6,8,4,1,'#1a1a1a');r(4,2,2,2,'#e05a7a');r(10,2,2,2,'#3ea0c0');r(5,10,6,4,'#f0b040');r(3,10,2,2,'#f0b040');r(11,10,2,2,'#f0b040');r(6,12,1,1,'#e05a7a');r(9,12,1,1,'#3ea0c0');break;
    case 'ghost': r(5,2,6,9,'rgba(200,215,235,.8)');r(4,10,8,4,'rgba(200,215,235,.6)');r(6,5,1,1,'#3a4a6a');r(9,5,1,1,'#3a4a6a');r(7,8,2,1,'#3a4a6a');r(5,13,2,2,'rgba(200,215,235,.4)');r(9,13,2,2,'rgba(200,215,235,.4)');break;
    case 'spider': r(5,5,6,6,'#1a1418');r(6,3,4,3,'#1a1418');r(6,4,1,1,'#c02020');r(9,4,1,1,'#c02020');for(let i=0;i<4;i++){r(1+i,6+i*2,4,1,'#1a1418');r(11,6+i*2,4,1,'#1a1418')}break;
    case 'troll': r(5,1,6,5,'#7a8a5a');r(6,3,1,1,'#1a1a1a');r(9,3,1,1,'#1a1a1a');r(4,6,8,7,'#7a8a5a');r(2,7,2,5,'#7a8a5a');r(12,7,2,5,'#7a8a5a');r(5,13,2,3,'#5a6a3a');r(9,13,2,3,'#5a6a3a');r(13,3,2,9,'#8a6a3a');break;
    default: r(6,6,4,4,'#9a9aa0');
  }
}
function drawIcon(cx,key){
  const W=12,H=12; cx.clearRect(0,0,W,H); const r=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(x,y,w,h)};
  const art={wand:1,school_robes:'robes',winter_cloak:'cloak',quidditch_robes:'qrobes',dress_robes:'drobes',muggle_clothes:'muggle',jumper:'jumper',hoodie:'hoodie',tshirt:'tshirt',house_scarf:'scarf',amulet:'ring',dragonhide_gloves:'gloves',school_shoes:'shoes',boots:'boots',trainers:'trainers',pointed_hat:'hat',winter_hat:'what',broom:'broom',owl:'owl',cat:'cat',toad:'toad'};
  if(art[key]&&art[key]!==1)key=art[key];
  switch(key){
    case 'wand': for(let i=0;i<9;i++)r(1+i,10-i,1,1,i<3?'#5a3a24':'#8a6a3a');r(9,1,2,2,'#ffd36a');break;
    case 'book': r(2,2,8,9,'#7a2a2e');r(2,2,1,9,'#4a1a1e');r(4,4,5,1,'#c9a24a');r(4,6,4,1,'#c9a24a');break;
    case 'potion': r(5,1,2,2,'#e9e0cf');r(4,3,4,2,'#9aa0ad');r(3,5,6,6,'#3ea35c');r(3,5,6,1,'#5ad07a');r(4,10,4,1,'#1f5a33');break;
    case 'frog': r(3,5,6,4,'#4f7a3a');r(4,3,1,2,'#4f7a3a');r(7,3,1,2,'#4f7a3a');r(4,3,1,1,'#1a1a1a');r(7,3,1,1,'#1a1a1a');r(2,9,2,1,'#4f7a3a');r(8,9,2,1,'#4f7a3a');break;
    case 'badge': r(3,2,6,7,'#c0c0c0');r(4,3,4,5,'#1a4a2a');r(5,9,2,2,'#c0c0c0');r(5,4,2,1,'#e9e9e9');break;
    case 'trunk': r(1,4,10,7,'#5a3a24');r(1,4,10,1,'#c9962f');r(5,6,2,2,'#c9962f');r(1,8,10,1,'#3a2616');break;
    case 'letter': r(1,3,10,7,'#f3ead0');r(1,3,10,1,'#c9a24a');r(5,6,2,2,'#8b1e24');r(2,4,8,1,'#d9cfae');break;
    case 'broom': for(let i=0;i<8;i++)r(2+i,9-i,1,1,'#7a5a3a');r(0,9,4,3,'#c9a24a');break;
    case 'cauldron': r(2,4,8,6,'#1a1a1e');r(1,4,10,1,'#3a3a44');r(3,2,6,2,'#3ea35c');r(3,10,2,1,'#1a1a1e');r(7,10,2,1,'#1a1a1e');break;
    case 'key': r(2,3,4,4,'#c9a24a');r(3,4,2,2,'#1a1418');r(6,4,5,1,'#c9a24a');r(9,5,1,2,'#c9a24a');r(7,5,1,1,'#c9a24a');break;
    case 'quill': for(let i=0;i<8;i++)r(2+i,10-i,1,1,'#e9e0cf');r(8,2,2,2,'#f6f3ea');r(1,11,2,1,'#1a1a2a');break;
    case 'coin': r(3,3,6,6,'#c9a24a');r(2,4,8,4,'#c9a24a');r(4,2,4,8,'#c9a24a');r(5,4,2,4,'#8a6a2a');break;
    case 'catalogue': r(2,1,8,10,'#e8dcc0');r(3,3,6,1,'#4a2a6a');r(3,5,6,1,'#8a8a7a');r(3,7,4,1,'#8a8a7a');r(2,1,8,1,'#c9962f');break;
    case 'form': r(2,1,8,10,'#f3ead0');r(3,3,6,1,'#8a8a7a');r(3,5,6,1,'#8a8a7a');r(3,7,6,1,'#8a8a7a');r(7,9,2,1,'#8b1e24');break;
    case 'sweets': r(3,4,6,4,'#e05a7a');r(1,5,2,2,'#e05a7a');r(9,5,2,2,'#e05a7a');r(4,5,2,1,'#f5a0b0');break;
    case 'scarf': for(let i=0;i<5;i++)r(2,1+i*2,5,2,i%2?'#d9a94b':'#8b1e24');r(7,3,3,6,'#8b1e24');r(7,5,3,1,'#d9a94b');break;
    case 'hat': r(0,9,12,2,'#2a2434');r(2,7,8,2,'#2a2434');r(3,5,6,2,'#2a2434');r(4,3,4,2,'#2a2434');r(5,1,2,2,'#2a2434');r(6,0,1,1,'#2a2434');r(0,9,12,1,'#4a4458');r(2,8,8,1,'#8b1e24');r(3,5,1,4,'#4a4458');r(5,1,1,2,'#4a4458');r(4,3,1,2,'#4a4458');break;
    case 'gloves': r(3,3,6,7,'#6a4a2a');r(2,5,2,3,'#6a4a2a');r(4,1,1,3,'#6a4a2a');r(6,1,1,3,'#6a4a2a');r(8,1,1,3,'#6a4a2a');break;
    case 'boots': r(3,1,4,8,'#5a3a24');r(3,9,7,2,'#3a2616');r(3,1,4,1,'#7a5a3a');break;
    case 'cloak': r(2,2,8,9,'#3a3a44');r(5,1,2,2,'#c9a24a');r(2,2,1,9,'#5a5a66');r(2,2,8,1,'#5a5a66');break;
    case 'robes': r(3,1,6,10,'#2a2434');r(3,1,1,10,'#4a4458');r(5,1,2,8,'#8b1e24');r(3,1,6,1,'#4a4458');break;
    case 'qrobes': r(3,1,6,10,'#8b1e24');r(4,4,4,2,'#d9a94b');r(3,1,6,1,'#a12a30');break;
    case 'drobes': r(3,1,6,10,'#1e3a2a');r(5,1,2,8,'#c9a24a');r(3,1,6,1,'#2a4a36');break;
    case 'muggle': r(3,2,6,6,'#3a5a8a');r(4,2,4,1,'#2a4a7a');r(3,8,6,3,'#2a3a6a');r(5,8,2,3,'#3a5a8a');break;
    case 'jumper': r(3,2,6,7,'#6a3a3a');r(4,2,4,1,'#8a5a5a');r(3,8,6,1,'#5a2a2a');r(1,3,2,4,'#6a3a3a');r(9,3,2,4,'#6a3a3a');break;
    case 'hoodie': r(3,3,6,7,'#3a3a3a');r(4,1,4,3,'#2a2a2a');r(5,6,2,1,'#5a5a5a');r(1,4,2,4,'#3a3a3a');r(9,4,2,4,'#3a3a3a');break;
    case 'tshirt': r(3,2,6,7,'#e8e4d8');r(1,2,2,3,'#e8e4d8');r(9,2,2,3,'#e8e4d8');r(5,2,2,1,'#c8c4b8');break;
    case 'shoes': r(2,5,4,4,'#111');r(7,5,4,4,'#111');r(2,5,4,1,'#333');r(7,5,4,1,'#333');r(2,8,4,1,'#2a2a2a');break;
    case 'trainers': r(2,5,4,4,'#f0f0f0');r(7,5,4,4,'#f0f0f0');r(2,5,4,1,'#3a5a8a');r(7,5,4,1,'#3a5a8a');r(2,8,4,1,'#b0b0b0');r(7,8,4,1,'#b0b0b0');break;
    case 'what': r(2,6,8,4,'#8b1e24');r(2,8,8,2,'#d9a94b');r(5,3,3,3,'#d9a94b');r(3,4,6,2,'#8b1e24');break;
    case 'owl': r(4,2,4,7,'#6b4a30');r(4,3,1,1,'#ffd36a');r(7,3,1,1,'#ffd36a');r(5,5,2,1,'#f0a030');r(4,9,1,1,'#3a2616');r(7,9,1,1,'#3a2616');break;
    case 'cat': r(3,6,6,4,'#3a3a3a');r(8,3,3,3,'#3a3a3a');r(8,2,1,1,'#3a3a3a');r(10,2,1,1,'#3a3a3a');r(9,4,1,1,'#7ad07a');break;
    case 'toad': r(3,5,6,4,'#4f7a3a');r(4,4,1,1,'#1a1a1a');r(7,4,1,1,'#1a1a1a');break;
    case 'ring': r(3,4,6,6,'#c9a24a');r(5,6,2,2,'#f6efdf');r(5,2,2,2,'#2f8a5a');break;
    case 'mirror': r(3,1,6,8,'#c9a24a');r(4,2,4,6,'#9ac0d8');r(5,9,2,3,'#c9a24a');break;
    case 'map': r(1,2,10,8,'#e8dcc0');r(3,4,2,1,'#8b1e24');r(6,6,3,1,'#5a3a24');r(2,8,6,1,'#3a5a8a');break;
    case 'candle': r(5,3,2,7,'#f3e6c0');r(5,1,2,2,'#ff8c2a');r(4,10,4,1,'#8a6a3a');break;
    case 'bottle': r(5,1,2,2,'#5a3a24');r(4,3,4,8,'#2a5a7a');r(4,3,4,1,'#4a8aaa');break;
    case 'box': r(2,4,8,7,'#8a6a3a');r(2,4,8,1,'#a8865a');r(2,3,8,1,'#5a3a24');break;
    default: r(4,4,4,4,'#9a9aa0');
  }
}
