import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Barrier from './essentials/Barrier.js';
import Npc from './essentials/Npc.js';
import Coin from '/assets/js/GameEnginev1.1/Coin.js';

class GameLevel2 {

constructor(gameEnv) {

const path = gameEnv.path;
const width = gameEnv.innerWidth;
const height = gameEnv.innerHeight;

const baseWidth = 650;
const baseHeight = 400;

const scaleX = width / baseWidth;
const scaleY = height / baseHeight;

// ── Track interval and images so we can clean them up on destroy ──────────
this._mineInterval = null;
this._mineImages = [];
this._coinCounter = null;

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

function makeMine(id,x,y,w,h){
return {
id:id,
x:x*scaleX,
y:y*scaleY,
width:w*scaleX,
height:h*scaleY,
visible:false, // barrier itself is invisible; we draw an img overlay instead
isMine:true,
hitbox:{widthPercentage:1,heightPercentage:1},
fromOverlay:true
};
}

const bgData = {
name:"custom_bg",
src:path + "/images/gamebuilder/bg/alien_planet.jpg",
pixels:{height:772,width:1134}
};

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

const npcData = {
id:'npc1',
greeting:'Hello!',
src:path + "/images/gamify/chillguy.png",
SCALE_FACTOR:8,
ANIMATION_RATE:50,
INIT_POSITION:{x:431*scaleX, y:106*scaleY},
pixels:{height:512,width:384},
orientation:{rows:4,columns:3},
down:{row:0,start:0,columns:3},
right:{row:1,start:0,columns:3},
left:{row:2,start:0,columns:3},
up:{row:3,start:0,columns:3},
hitbox:{widthPercentage:0.1,heightPercentage:0.2},
dialogues:[
"I will give you another ship. Use it to get back to your homeland. Good luck on your mission, Astro!"
],
reaction:function(){ if(this.dialogueSystem){ this.showReactionDialogue(); } },
interact:function(){ if(this.dialogueSystem){ this.showRandomDialogue(); } }
};

// ── Original barriers ─────────────────────────────────────────────────────
const dbarrier_1  = makeBarrier('dbarrier_1',207,103,10,170);
const dbarrier_2  = makeBarrier('dbarrier_2',3,1,619,5);
const dbarrier_3  = makeBarrier('dbarrier_3',218,104,142,5);
const dbarrier_4  = makeBarrier('dbarrier_4',358,69,6,39);
const dbarrier_5  = makeBarrier('dbarrier_5',359,67,131,4);
const dbarrier_6  = makeBarrier('dbarrier_6',208,269,173,8);
const dbarrier_7  = makeBarrier('dbarrier_7',374,271,9,48);
const dbarrier_8  = makeBarrier('dbarrier_8',480,68,8,118);
const dbarrier_9  = makeBarrier('dbarrier_9',410,163,71,21);
const dbarrier_10 = makeBarrier('dbarrier_10',620,4,8,317);
const dbarrier_11 = makeBarrier('dbarrier_11',381,309,240,13);
const dbarrier_12 = makeBarrier('dbarrier_12',375,247,8,27);
const dbarrier_13 = makeBarrier('dbarrier_13',266,110,14,116);
const dbarrier_14 = makeBarrier('dbarrier_14',82,213,136,14);
const dbarrier_15 = makeBarrier('dbarrier_15',4,102,112,10);
const dbarrier_16 = makeBarrier('dbarrier_16',115,8,23,108);
const dbarrier_17 = makeBarrier('dbarrier_17',227,9,12,11);
const dbarrier_18 = makeBarrier('dbarrier_18',356,50,7,20);

// ── Mines — inside maze boundary only (x:10-610, y:10-310) ─────────────
// Mid-left open (x:10-80, y:115-210)
const mine_6  = makeMine('mine_6',  30,150,15,15);
const mine_7  = makeMine('mine_7',  60,180,15,15);
// Mid-center open (x:270-370, y:115-265)
const mine_8  = makeMine('mine_8', 300,150,15,15);
const mine_9  = makeMine('mine_9', 330,220,15,15);
// Right-center open (x:385-475, y:190-245)
const mine_10 = makeMine('mine_10',420,210,15,15);
// Far-right open (x:490-610, y:190-305)
const mine_11 = makeMine('mine_11',520,220,15,15);
const mine_12 = makeMine('mine_12',570,260,15,15);
// Bottom strip (x:10-370, y:280-310)
const mine_13 = makeMine('mine_13', 50,290,15,15);
const mine_14 = makeMine('mine_14',150,290,15,15);
const mine_15 = makeMine('mine_15',290,290,15,15);
// Bottom-right (x:385-610, y:320-390) — reachable via right corridor
const mine_16 = makeMine('mine_16',430,330,15,15);
const mine_17 = makeMine('mine_17',500,330,15,15);
const mine_18 = makeMine('mine_18',560,330,15,15);

const coinData = {
id: 'coin',
greeting: false,
INIT_POSITION: { x: 0.12, y: 0.14 },
width: 40,
height: 70,
color: '#FFD700',
hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
zIndex: 20,
value: 1
};

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

{ class: Barrier, data: mine_6 },
{ class: Barrier, data: mine_7 },
{ class: Barrier, data: mine_8 },
{ class: Barrier, data: mine_9 },
{ class: Barrier, data: mine_10 },
{ class: Barrier, data: mine_11 },
{ class: Barrier, data: mine_12 },
{ class: Barrier, data: mine_13 },
{ class: Barrier, data: mine_14 },
{ class: Barrier, data: mine_15 },
{ class: Barrier, data: mine_16 },
{ class: Barrier, data: mine_17 },
{ class: Barrier, data: mine_18 },

{ class: Coin, data: coinData },
{ class: Npc, data: npcData }
];

// ── initialize() — attach mine sprite images over each mine Barrier ───────
this.initialize = () => {
  if (!gameEnv.stats) gameEnv.stats = {};
  if (typeof gameEnv.stats.coinsCollected !== 'number') {
    gameEnv.stats.coinsCollected = 0;
  }

  const blockedRects = gameEnv.gameObjects
    .filter(obj => obj instanceof Barrier)
    .map(obj => ({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height
    }));

  const coin = gameEnv.gameObjects.find(obj => obj?.spriteData?.id === 'coin');
  if (coin) {
    const getCoinSize = () => ({
      width: coin.width || 40,
      height: coin.height || 40
    });

    const overlapsBlockedArea = (x, y) => {
      const coinSize = getCoinSize();
      const padding = 8;
      const left = x + padding;
      const top = y + padding;
      const right = x + coinSize.width - padding;
      const bottom = y + coinSize.height - padding;

      return blockedRects.some(rect => (
        left < rect.x + rect.width &&
        right > rect.x &&
        top < rect.y + rect.height &&
        bottom > rect.y
      ));
    };

    const placeCoinSafely = () => {
      const coinSize = getCoinSize();
      const minX = 10;
      const minY = 10;
      const maxX = Math.max(minX, gameEnv.innerWidth - coinSize.width - 10);
      const maxY = Math.max(minY, gameEnv.innerHeight - coinSize.height - 10);

      for (let attempt = 0; attempt < 300; attempt++) {
        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;
        if (!overlapsBlockedArea(x, y)) {
          coin.position.x = x;
          coin.position.y = y;
          coin.resize();
          return true;
        }
      }

      coin.position.x = minX;
      coin.position.y = minY;
      coin.resize();
      return false;
    };

    const originalCollect = coin.collect.bind(coin);
    coin.randomizePosition = placeCoinSafely;
    coin.collect = function() {
      originalCollect();
      updateCoinCounter();
    };
    placeCoinSafely();
  }

  const updateCoinCounter = () => {
    if (!this._coinCounter) return;
    const totalCoins = gameEnv.stats?.coinsCollected || 0;
    this._coinCounter.textContent = `Coins: ${totalCoins}`;
  };

  let counter = document.getElementById('gamelevel2-coin-counter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'gamelevel2-coin-counter';
    document.body.appendChild(counter);
  }
  Object.assign(counter.style, {
    position: 'fixed',
    top: '120px',
    right: '12px',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.75)',
    color: '#FFD700',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '14px',
    border: '2px solid #FFD700',
    borderRadius: '6px',
    zIndex: '100000'
  });
  this._coinCounter = counter;
  updateCoinCounter();

  const mineSrc = path + '/images/gamebuilder/sprites/Mine.jpg';
  this._mineImages = []; // reset in case initialize is called more than once
  for (const obj of gameEnv.gameObjects) {
    if (!obj.canvas?.id?.startsWith('mine_')) continue;
    // Also tag the instance so detection can use it as a fallback
    obj.isMine = true;

    const img = document.createElement('img');
    img.src = mineSrc;
    img.style.position = 'absolute';
    img.style.width = obj.width + 'px';
    img.style.height = obj.height + 'px';
    img.style.left = obj.x + 'px';
    img.style.top = ((gameEnv.top || 0) + obj.y) + 'px';
    img.style.zIndex = '12';
    img.style.pointerEvents = 'none';
    img.dataset.mineId = obj.canvas.id;
    const container = gameEnv.container || gameEnv.gameContainer;
    if (container) {
      container.appendChild(img);
      this._mineImages.push(img); // track so we can remove on destroy
    }
  }
};

// ── destroy() — stop detection and remove mine images from the DOM ────────
this.destroy = () => {
  // Stop the mine detection interval
  if (this._mineInterval !== null) {
    clearInterval(this._mineInterval);
    this._mineInterval = null;
  }
  if (this._coinCounter && this._coinCounter.parentNode) {
    this._coinCounter.parentNode.removeChild(this._coinCounter);
  }
  this._coinCounter = null;
  // Remove all mine overlay images
  for (const img of this._mineImages) {
    img.remove();
  }
  this._mineImages = [];
};

// ── Mine detection ────────────────────────────────────────────────────────
this._mineInterval = setInterval(() => {

  const player = gameEnv.gameObjects.find(o => o instanceof Player);
  if (!player) return;

  let exploded = false;
  for (const obj of gameEnv.gameObjects) {
    if (exploded) break;
    // Mines have canvas ids starting with 'mine_'
    if (!(obj.canvas?.id?.startsWith('mine_'))) continue;

    // Use player center for more forgiving collision
    const px = player.position.x + (player.width  || 0) / 2;
    const py = player.position.y + (player.height || 0) / 2;
    const bx = obj.x;
    const by = obj.y;
    const bw = obj.width;
    const bh = obj.height;

    if (px > bx && px < bx + bw && py > by && py < by + bh) {
      exploded = true;
      // Stop the interval immediately so it doesn't fire again during reload
      clearInterval(this._mineInterval);
      this._mineInterval = null;

      const boom = document.createElement('div');
      Object.assign(boom.style, {
        position:'fixed', top:'0', left:'0',
        width:'100vw', height:'100vh',
        backgroundColor:'rgba(255,80,0,0.75)',
        zIndex:'99999',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        fontFamily:"'Press Start 2P', monospace",
        color:'#fff', textAlign:'center'
      });
      boom.innerHTML = `
        <div style="font-size:72px;margin-bottom:16px;">💥</div>
        <div style="font-size:32px;color:#FFD700;letter-spacing:4px;">BOOM!</div>
        <div style="font-size:15px;margin-top:14px;">You stepped on a landmine.</div>
        <div style="font-size:11px;margin-top:10px;opacity:0.8;">Restarting...</div>`;
      document.body.appendChild(boom);
      setTimeout(() => location.reload(), 1500);
    }
  }

}, 50);

}

}

export const gameLevelClasses = [GameLevel2];
export default GameLevel2;
