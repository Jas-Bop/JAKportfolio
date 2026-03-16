import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Barrier from './essentials/Barrier.js';
import Npc from './essentials/Npc.js';

class GameLevelCustom {

constructor(gameEnv) {

const path = gameEnv.path;
const width = gameEnv.innerWidth;
const height = gameEnv.innerHeight;

/* BASE SIZE OF YOUR MAZE */

const baseWidth = 650;
const baseHeight = 400;

const scaleX = width / baseWidth;
const scaleY = height / baseHeight;

/* BARRIER HELPER */

function makeBarrier(id,x,y,w,h){
return {
id:id,
x:x*scaleX,
y:y*scaleY,
width:w*scaleX,
height:h*scaleY,
visible:true,
hitbox:{widthPercentage:0.0,heightPercentage:0.0},
fromOverlay:true
};
}

/* MINE HELPER */

function makeMine(id,x,y,w,h){
return {
id:id,
x:x*scaleX,
y:y*scaleY,
width:w*scaleX,
height:h*scaleY,
visible:false,
isMine:true,
hitbox:{widthPercentage:1,heightPercentage:1},
fromOverlay:true
};
}

/* BACKGROUND */

const bgData = {
name:"custom_bg",
src:path + "/images/gamebuilder/bg/alien_planet.jpg",
pixels:{height:772,width:1134}
};

/* PLAYER */

const playerData = {
id:'playerData',
src:path + "/images/gamebuilder/sprites/astro.png",
SCALE_FACTOR:8,
STEP_FACTOR:1000,
ANIMATION_RATE:50,
INIT_POSITION:{x:100*scaleX,y:300*scaleY},
pixels:{height:770,width:513},
orientation:{rows:4,columns:4},
down:{row:0,start:0,columns:3},
downRight:{row:2,start:0,columns:3,rotate:Math.PI/16},
downLeft:{row:1,start:0,columns:3,rotate:-Math.PI/16},
left:{row:1,start:0,columns:3},
right:{row:2,start:0,columns:3},
up:{row:3,start:0,columns:3},
upLeft:{row:1,start:0,columns:3,rotate:Math.PI/16},
upRight:{row:3,start:0,columns:3,rotate:-Math.PI/16},
hitbox:{widthPercentage:0.2,heightPercentage:0.2},
keypress:{up:87,left:65,down:83,right:68}
};

/* NPC */

const npcData = {

id:'npc1',
greeting:'Hello!',

src:path + "/images/gamify/chillguy.png",

SCALE_FACTOR:8,
ANIMATION_RATE:50,

INIT_POSITION:{
x:431*scaleX,
y:106*scaleY
},

pixels:{
height:512,
width:384
},

orientation:{rows:4,columns:3},

down:{row:0,start:0,columns:3},
right:{row:1,start:0,columns:3},
left:{row:2,start:0,columns:3},
up:{row:3,start:0,columns:3},

hitbox:{
widthPercentage:0.1,
heightPercentage:0.2
},

dialogues:[
"Hello!",
"Watch out for mines!",
"This maze is dangerous!"
],

reaction:function(){
if(this.dialogueSystem){
this.showReactionDialogue();
}
},

interact:function(){
if(this.dialogueSystem){
this.showRandomDialogue();
}
}

};

/* BARRIERS */

const dbarrier_1 = makeBarrier('dbarrier_1',207,103,10,170);
const dbarrier_2 = makeBarrier('dbarrier_2',3,1,619,5);
const dbarrier_3 = makeBarrier('dbarrier_3',218,104,142,5);
const dbarrier_4 = makeBarrier('dbarrier_4',358,69,6,39);
const dbarrier_5 = makeBarrier('dbarrier_5',359,67,131,4);
const dbarrier_6 = makeBarrier('dbarrier_6',208,269,173,8);
const dbarrier_7 = makeBarrier('dbarrier_7',374,271,9,48);
const dbarrier_8 = makeBarrier('dbarrier_8',480,68,8,118);
const dbarrier_9 = makeBarrier('dbarrier_9',410,163,71,21);
const dbarrier_10 = makeBarrier('dbarrier_10',620,4,8,317);
const dbarrier_11 = makeBarrier('dbarrier_11',381,309,240,13);
const dbarrier_12 = makeBarrier('dbarrier_12',375,247,8,27);
const dbarrier_13 = makeBarrier('dbarrier_13',266,110,14,116);
const dbarrier_14 = makeBarrier('dbarrier_14',82,213,136,14);
const dbarrier_15 = makeBarrier('dbarrier_15',4,102,112,10);
const dbarrier_16 = makeBarrier('dbarrier_16',115,8,23,108);
const dbarrier_17 = makeBarrier('dbarrier_17',227,9,12,11);
const dbarrier_18 = makeBarrier('dbarrier_18',356,50,7,20);

/* MINES */

const mine_1 = makeMine('mine_1',150,200,40,40);
const mine_2 = makeMine('mine_2',320,180,40,40);
const mine_3 = makeMine('mine_3',500,260,40,40);

/* GAME OBJECT LIST */

this.classes = [

{ class: GameEnvBackground, data: bgData },
{ class: Player, data: playerData },

{ class: Barrier, data: dbarrier_1 },
{ class: Barrier, data: dbarrier_2 },
{ class: Barrier, data: dbarrier_3 },
{ class: Barrier, data: dbarrier_4 },
{ class: Barrier, data: dbarrier_5 },
{ class: Barrier, data: dbarrier_6 },
{ class: Barrier, data: dbarrier_7 },
{ class: Barrier, data: dbarrier_8 },
{ class: Barrier, data: dbarrier_9 },
{ class: Barrier, data: dbarrier_10 },
{ class: Barrier, data: dbarrier_11 },
{ class: Barrier, data: dbarrier_12 },
{ class: Barrier, data: dbarrier_13 },
{ class: Barrier, data: dbarrier_14 },
{ class: Barrier, data: dbarrier_15 },
{ class: Barrier, data: dbarrier_16 },
{ class: Barrier, data: dbarrier_17 },
{ class: Barrier, data: dbarrier_18 },

{ class: Barrier, data: mine_1 },
{ class: Barrier, data: mine_2 },
{ class: Barrier, data: mine_3 },

{ class: Npc, data: npcData }

];

/* MINE DETECTION */

setInterval(()=>{

const player = gameEnv.gameObjects.find(o=>o instanceof Player);
if(!player) return;

for(const obj of gameEnv.gameObjects){

if(obj.data?.isMine){

const px = player.position.x;
const py = player.position.y;

const bx = obj.data.x;
const by = obj.data.y;
const bw = obj.data.width;
const bh = obj.data.height;

if(px > bx && px < bx+bw && py > by && py < by+bh){

alert("💥 BOOM! You stepped on a landmine!");
location.reload();

}

}

}

},50);

}

}

export const gameLevelClasses=[GameLevelCustom];
export default GameLevelCustom;