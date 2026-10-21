/* Spell tree: schools, prerequisites, when each is taught, and the situational card the GM uses. */
const SPELLS=[
 // ---- Charms ----
 {id:'lumos',name:'Lumos',school:'Charms',year:1,when:'Charms, week 1',prereq:[],mp:1,effect:'Wand-tip light.',strong:'Dark corridors, the dungeons, reading under the covers.',weak:'Sneaking: it shows exactly where you are. Does nothing in daylight.',flourish:'Mastered: a flare bright enough to dazzle for a second.'},
 {id:'nox',name:'Nox',school:'Charms',year:1,when:'with Lumos',prereq:['lumos'],mp:0,effect:'Puts the light out.',strong:'Hiding the instant a door opens.',weak:'Nothing; it is a courtesy spell.',flourish:'Mastered: douses every candle in reach.'},
 {id:'wingardium',name:'Wingardium Leviosa',school:'Charms',year:1,when:'Charms, week 3',prereq:['lumos'],mp:1,effect:'Lifts and moves a light object.',strong:'Keys out of reach, a quill across a room, a club over a troll.',weak:'Anything heavier than a chair. Living things, badly.',flourish:'Mastered: two objects at once.'},
 {id:'alohomora',name:'Alohomora',school:'Charms',year:1,when:'Charms, week 6',prereq:['wingardium'],mp:1,effect:'Opens ordinary locks.',strong:'Classroom doors, trunks, Filch’s cupboard.',weak:'Fails outright on a charmed or warded lock, and some locks tell their owner.',flourish:'Mastered: silent, and no scratch on the lock.'},
 {id:'colloportus',name:'Colloportus',school:'Charms',year:1,when:'Learn from an older student or Dez’s book',prereq:['alohomora'],mp:1,effect:'Seals a door.',strong:'Buying a minute in a chase.',weak:'A teacher opens it with a look.',flourish:'Mastered: the door also sticks for whoever tries next.'},
 {id:'incendio',name:'Incendio',school:'Charms',year:1,when:'Charms, week 8',prereq:['wingardium'],mp:1,effect:'A small flame.',strong:'Devil’s Snare, a cold night, a letter you want gone.',weak:'Anywhere with parchment, hay or Graham’s binder. Attracts attention.',flourish:'Mastered: a controlled jet, not a sputter.'},
 {id:'reparo',name:'Reparo',school:'Charms',year:1,when:'Charms, week 10',prereq:['incendio'],mp:1,effect:'Mends a broken object.',strong:'Broken items in your inventory (restores condition), glasses, a cracked phial.',weak:'Anything magical or alive. Cannot un-burn.',flourish:'Mastered: fixes a whole dropped tray at once.'},
 {id:'scourgify',name:'Scourgify',school:'Charms',year:1,when:'Learn from Wren or a prefect',prereq:['reparo'],mp:1,effect:'Cleans.',strong:'Evidence, mud, Filch’s goodwill (lowers business Heat by one when used on his corridor).',weak:'Used on a person it is an insult.',flourish:'Mastered: a room in a minute.'},
 {id:'lumos_maxima',name:'Lumos Maxima',school:'Charms',year:3,when:'Charms, Year 3',prereq:['lumos','incendio'],mp:2,effect:'A thrown ball of light.',strong:'The Forest at night; blinding something that hunts by sight.',weak:'Announces you to everything for a mile.',flourish:'Mastered: it hangs in the air and follows you.'},
 {id:'accio',name:'Accio',school:'Charms',year:4,when:'Charms, Year 4',prereq:['wingardium','alohomora'],mp:2,effect:'Summons an object to your hand.',strong:'A wand knocked away, evidence across a room, a broom.',weak:'Anything charmed against it, anything held tight.',flourish:'Mastered: from another room.'},
 {id:'silencio',name:'Silencio',school:'Charms',year:5,when:'Charms, Year 5',prereq:['colloportus'],mp:2,effect:'Silences a person or thing.',strong:'A portrait that would tell, a squeaky hinge, an enemy mid-spell.',weak:'Holds for a minute at most on a wizard.',flourish:'Mastered: an area, not a target.'},
 {id:'aguamenti',name:'Aguamenti',school:'Charms',year:6,when:'Charms, Year 6',prereq:['incendio','reparo'],mp:2,effect:'Water from the wand.',strong:'Fire, thirst, a cauldron about to go.',weak:'Nothing much; it is a tool.',flourish:'Mastered: a jet that knocks a man over.'},
 // ---- Transfiguration ----
 {id:'match',name:'Match to Needle',school:'Transfiguration',year:1,when:'Transfiguration, all autumn',prereq:[],mp:1,effect:'The first transfiguration.',strong:'Earning Penhaligon’s respect. Not much else.',weak:'Everything practical.',flourish:'Mastered: any small object to any small object.'},
 {id:'avifors',name:'Avifors',school:'Transfiguration',year:2,when:'Transfiguration, Year 2',prereq:['match'],mp:2,effect:'Small object into a bird.',strong:'A distraction, a message, a cat’s attention.',weak:'The bird has its own ideas.',flourish:'Mastered: a flock.'},
 {id:'vera_verto',name:'Vera Verto',school:'Transfiguration',year:2,when:'Transfiguration, Year 2',prereq:['match'],mp:2,effect:'Animal into a goblet.',strong:'Hiding a pet from Filch for an hour.',weak:'The pet remembers.',flourish:'Mastered: reversible at will.'},
 {id:'draconifors',name:'Draconifors',school:'Transfiguration',year:4,when:'Transfiguration, Year 4',prereq:['avifors','vera_verto'],mp:3,effect:'Statue into a small dragon.',strong:'A duel you are losing, a locked room with a statue in it.',weak:'It is a small dragon. It does not take orders.',flourish:'Mastered: it takes one order.'},
 // ---- Defence ----
 {id:'flipendo',name:'Flipendo',school:'Defence',year:1,when:'Defence, week 14',prereq:[],mp:1,effect:'Knockback jinx.',strong:'A shove at range, a door, a pixie, a boy your own size.',weak:'Anything bigger than you; anything with a shield.',flourish:'Mastered: knocks a wand loose too.'},
 {id:'expelliarmus',name:'Expelliarmus',school:'Defence',year:1,when:'Defence, February',prereq:['flipendo'],mp:2,effect:'Disarms.',strong:'Any duel. Hornbeam and heartstring like this one.',weak:'A wandless threat (a troll, a dog, Peeves).',flourish:'Mastered: the wand flies to your hand.'},
 {id:'petrificus',name:'Petrificus Totalus',school:'Defence',year:1,when:'Defence, April',prereq:['expelliarmus'],mp:2,effect:'Full body-bind.',strong:'Ending a fight without a mark; a witness you need still.',weak:'Misses a moving target more than it hits; useless on ghosts.',flourish:'Mastered: silent.'},
 {id:'rictusempra',name:'Rictusempra',school:'Defence',year:2,when:'Duelling practice, Year 2',prereq:['flipendo'],mp:1,effect:'Tickling charm.',strong:'A duel you want to end in laughter; a bully in front of a crowd.',weak:'Someone who is already angry gets angrier.',flourish:'Mastered: it holds until you say stop.'},
 {id:'finite',name:'Finite Incantatem',school:'Defence',year:2,when:'Defence, Year 2',prereq:['petrificus'],mp:1,effect:'Ends a spell.',strong:'Undoing a jinx on a friend, a Who Said That? marble, a trick step.',weak:'Curses above your year. Nothing cast by a teacher.',flourish:'Mastered: ends every small spell in the room.'},
 {id:'riddikulus',name:'Riddikulus',school:'Defence',year:3,when:'Defence, Year 3',prereq:['finite'],mp:2,effect:'Turns a Boggart into a joke.',strong:'Boggarts only. Also, oddly, your own nerves.',weak:'Everything that is not a Boggart.',flourish:'Mastered: the joke lands for the whole room.'},
 {id:'protego',name:'Protego',school:'Defence',year:4,when:'Defence, Year 4',prereq:['expelliarmus','finite'],mp:2,effect:'Shield charm.',strong:'Any duel; turning a jinx back.',weak:'Physical things: a Bludger goes straight through.',flourish:'Mastered: covers a friend too.'},
 {id:'stupefy',name:'Stupefy',school:'Defence',year:4,when:'Defence, Year 4',prereq:['petrificus'],mp:3,effect:'Stuns.',strong:'Ending a duel; a creature coming at you.',weak:'A giant, a troll, a dragon: they shrug it off.',flourish:'Mastered: through a Protego.'},
 {id:'patronus',name:'Expecto Patronum',school:'Defence',year:5,when:'Not taught. Learn it from someone who can.',prereq:['protego','stupefy'],mp:4,effect:'A guardian of light.',strong:'Dementors, despair, a message across the country.',weak:'Costs more Magic than a first-year has. Fails when you are afraid.',flourish:'Mastered: it takes a shape.'},
 {id:'levicorpus',name:'Levicorpus',school:'Defence',year:5,when:'Learn it from a book nobody should have',prereq:['wingardium','flipendo'],mp:2,effect:'Hoists someone by the ankle.',strong:'Humiliating a bully; emptying his pockets.',weak:'A teacher sees it and you are the bully.',flourish:'Mastered: nonverbal.'},
 {id:'reducto',name:'Reducto',school:'Defence',year:4,when:'Defence, Year 4',prereq:['flipendo','incendio'],mp:3,effect:'Blasts a solid object apart.',strong:'A wall, a door, a statue in your way.',weak:'People: it is a crime. Anything you wanted intact.',flourish:'Mastered: a hole, not a crater.'},
 // ---- Hexes & oddments ----
 {id:'diffindo',name:'Diffindo',school:'Hexes',year:1,when:'Learn from Dez (he found it in a book)',prereq:['wingardium'],mp:1,effect:'Severs.',strong:'Rope, a strap, a bag of stock in someone else’s hand.',weak:'Near skin it is dangerous; near a teacher it is detention.',flourish:'Mastered: a clean cut, nothing else touched.'},
 {id:'tarantallegra',name:'Tarantallegra',school:'Hexes',year:2,when:'Duelling practice, Year 2',prereq:['rictusempra'],mp:1,effect:'Makes the legs dance.',strong:'Stopping someone running.',weak:'They can still cast.',flourish:'Mastered: both of them.'},
 {id:'episkey',name:'Episkey',school:'Hexes',year:6,when:'Hospital wing, Year 6',prereq:['reparo'],mp:2,effect:'Heals a small injury.',strong:'A nosebleed, a split lip, 2 Health back.',weak:'Anything a curse did.',flourish:'Mastered: 4 Health.'},
];
const SPELL_BY_ID=Object.fromEntries(SPELLS.map(s=>[s.id,s]));
const SPELL_BY_NAME=Object.fromEntries(SPELLS.map(s=>[s.name.toLowerCase(),s]));
function drawSpell(cx,id){
  const W=12,H=12; cx.clearRect(0,0,W,H); const r=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(x,y,w,h)};
  const G='#ffd36a',B='#5f9ad0',R='#d94b52',P='#a06ad0',N='#9a9aa0',F='#ff8c2a',W1='#f6f3ea',D='#2a2434',GR='#6fb26a';
  switch(id){
    case 'lumos': r(5,5,2,2,W1);r(5,2,2,2,G);r(5,8,2,2,G);r(2,5,2,2,G);r(8,5,2,2,G);r(3,3,1,1,G);r(8,3,1,1,G);r(3,8,1,1,G);r(8,8,1,1,G);break;
    case 'nox': r(3,3,6,6,D);r(4,4,4,4,'#0b1026');r(8,2,1,1,N);break;
    case 'wingardium': r(5,7,2,4,'#e9e0cf');r(5,3,2,4,'#e9e0cf');r(4,2,4,1,'#e9e0cf');r(3,3,1,1,G);r(8,3,1,1,G);r(2,5,1,1,G);r(9,5,1,1,G);r(6,1,1,1,W1);break;
    case 'alohomora': r(3,6,6,5,G);r(4,3,1,3,N);r(7,2,1,2,N);r(4,2,4,1,N);r(5,8,2,2,D);break;
    case 'colloportus': r(3,6,6,5,N);r(4,3,1,3,N);r(7,3,1,3,N);r(4,2,4,1,N);r(5,8,2,2,D);break;
    case 'incendio': r(5,8,2,3,F);r(4,6,4,3,F);r(5,3,2,3,F);r(6,1,1,2,F);r(5,7,2,2,G);break;
    case 'reparo': r(3,4,6,6,'#9ac0d8');r(4,5,4,4,'#7aa0b8');r(5,3,2,1,'#9ac0d8');r(6,6,1,1,W1);r(7,5,1,1,W1);r(4,8,1,1,W1);break;
    case 'scourgify': r(2,2,3,3,W1);r(6,1,2,2,W1);r(7,5,3,3,W1);r(3,7,2,2,W1);r(3,3,1,1,B);r(8,6,1,1,B);break;
    case 'lumos_maxima': r(4,4,4,4,W1);r(3,3,6,6,'rgba(255,211,106,.6)');r(5,0,2,2,G);r(5,10,2,2,G);r(0,5,2,2,G);r(10,5,2,2,G);break;
    case 'accio': r(2,5,7,2,G);r(7,3,2,2,G);r(7,7,2,2,G);r(9,4,1,4,W1);break;
    case 'silencio': r(3,3,6,6,'#e7b98f');r(4,7,4,1,D);r(2,2,8,1,R);break;
    case 'aguamenti': r(5,1,2,2,B);r(4,3,4,3,B);r(3,6,6,4,'#2f5f8a');r(4,7,1,1,W1);break;
    case 'match': r(2,9,1,1,F);r(3,8,1,1,'#8a6a3a');r(4,7,1,1,'#8a6a3a');r(5,6,1,1,'#8a6a3a');r(7,4,1,1,N);r(8,3,1,1,N);r(9,2,1,1,W1);r(6,5,1,1,'#8a6a3a');break;
    case 'avifors': r(3,5,5,3,'#8a6a40');r(8,4,2,2,'#8a6a40');r(10,5,1,1,F);r(1,4,3,2,'#8a6a40');r(5,8,1,2,'#8a6a40');break;
    case 'vera_verto': r(4,2,4,4,G);r(5,6,2,3,G);r(3,9,6,1,G);r(2,1,1,1,'#3a3a3a');r(9,1,1,1,'#3a3a3a');break;
    case 'draconifors': r(3,5,6,4,'#2f8a5a');r(8,3,3,3,'#2f8a5a');r(10,4,1,1,R);r(1,4,2,2,'#2f8a5a');r(4,9,1,2,'#2f8a5a');r(7,9,1,2,'#2f8a5a');r(5,3,2,2,'#2f8a5a');break;
    case 'flipendo': r(5,5,2,2,R);r(2,5,2,2,R);r(8,5,2,2,R);r(5,2,2,2,R);r(5,8,2,2,R);r(1,1,1,1,R);r(10,10,1,1,R);r(1,10,1,1,R);r(10,1,1,1,R);break;
    case 'expelliarmus': for(let i=0;i<6;i++)r(2+i,8-i,1,1,'#8a6a3a');r(8,1,2,2,R);r(9,4,1,1,R);r(10,2,1,1,R);break;
    case 'petrificus': r(5,1,2,2,'#e7b98f');r(4,3,4,6,'#4a4a56');r(4,9,1,2,'#4a4a56');r(7,9,1,2,'#4a4a56');r(3,4,1,4,'#4a4a56');r(8,4,1,4,'#4a4a56');break;
    case 'rictusempra': r(3,3,6,6,'#e7b98f');r(4,5,1,1,D);r(7,5,1,1,D);r(4,7,4,1,D);r(5,8,2,1,R);r(1,2,1,1,P);r(10,2,1,1,P);break;
    case 'finite': r(3,3,1,1,R);r(4,4,1,1,R);r(5,5,2,2,R);r(7,7,1,1,R);r(8,8,1,1,R);r(8,3,1,1,R);r(7,4,1,1,R);r(4,7,1,1,R);r(3,8,1,1,R);break;
    case 'riddikulus': r(2,4,8,5,P);r(3,5,2,2,W1);r(7,5,2,2,W1);r(4,8,4,1,W1);r(1,2,2,2,G);r(9,2,2,2,G);break;
    case 'protego': r(3,2,6,6,'rgba(95,154,208,.5)');r(4,8,4,2,'rgba(95,154,208,.5)');r(3,2,6,1,B);r(3,2,1,6,B);r(8,2,1,6,B);r(4,8,4,1,B);r(5,10,2,1,B);break;
    case 'stupefy': r(1,5,10,2,R);r(9,4,2,4,'#ff8a8a');r(2,4,1,1,'#ff8a8a');r(4,6,1,1,'#ff8a8a');break;
    case 'patronus': r(2,5,7,4,'#cfe8ff');r(8,3,3,3,'#cfe8ff');r(9,1,1,2,'#cfe8ff');r(10,1,1,2,'#cfe8ff');r(3,9,1,2,'#cfe8ff');r(7,9,1,2,'#cfe8ff');r(1,2,1,1,W1);r(5,1,1,1,W1);break;
    case 'levicorpus': r(5,1,2,2,'#e7b98f');r(4,3,4,5,'#4a4a56');r(3,8,1,1,'#4a4a56');r(8,8,1,1,'#4a4a56');r(5,9,2,2,'#e7b98f');r(6,0,1,1,R);break;
    case 'reducto': r(4,4,4,4,R);r(1,1,2,2,N);r(9,1,2,2,N);r(1,9,2,2,N);r(9,9,2,2,N);r(5,5,2,2,G);break;
    case 'diffindo': for(let i=0;i<9;i++)r(1+i,10-i,1,1,W1);r(2,2,3,1,'#8a6a3a');r(2,3,3,1,'#8a6a3a');r(7,7,3,1,'#8a6a3a');r(7,8,3,1,'#8a6a3a');break;
    case 'tarantallegra': r(3,2,2,6,'#4a4a56');r(7,1,2,6,'#4a4a56');r(2,8,3,2,'#1a1418');r(7,7,3,2,'#1a1418');r(1,4,1,1,P);r(10,3,1,1,P);break;
    case 'episkey': r(5,2,2,8,GR);r(2,5,8,2,GR);r(5,5,2,2,W1);break;
    default: r(4,4,4,4,N);
  }
}
