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

const baseWidth  = 650;
const baseHeight = 400;

const scaleX = width  / baseWidth;
const scaleY = height / baseHeight;

// ── State ─────────────────────────────────────────────────────────────────
this._mineInterval  = null;
this._mineImages    = [];   // DOM img elements for mines
this._coinCounter   = null;
this._wallOverlays  = [];
this._blackjackEl   = null;
this._blackjackOpen = false;
this._playerWon     = false;
this._metNpc        = false;  // mines only appear after meeting NPC
this._minesActive   = false;  // true once mines are dropped
this._shipEl        = null;   // the ship DOM element
this._chips         = 50;
this._chipGoal      = 100;

// ── Mine data (positions on base grid) ───────────────────────────────────
// Placed throughout the maze corridors the player must walk back through
this._mineData = [
  { id:'mine_1',  x:  60, y: 320 },
  { id:'mine_2',  x: 110, y: 250 },
  { id:'mine_3',  x: 220, y:  50 },
  { id:'mine_4',  x: 280, y: 200 },
  { id:'mine_5',  x: 220, y: 320 },
  { id:'mine_6',  x: 380, y: 230 },
  { id:'mine_7',  x: 420, y: 310 },
  { id:'mine_8',  x: 540, y:  80 },
  { id:'mine_9',  x: 580, y: 300 },
  { id:'mine_10', x: 460, y: 360 },
].map(m => ({
  id: m.id,
  x: m.x * scaleX, y: m.y * scaleY,
  width: 16 * scaleX, height: 16 * scaleY,
}));

// Ship spawn = player spawn point (bottom-left open cell)
this._shipX = 50 * scaleX;
this._shipY = 320 * scaleY;

// ── Wall helpers ──────────────────────────────────────────────────────────
const W = 8;
function hwall(id, x, y, len) {
  return { id, x:x*scaleX, y:y*scaleY, width:len*scaleX, height:W*scaleY,
           visible:true, hitbox:{widthPercentage:0,heightPercentage:0}, fromOverlay:true };
}
function vwall(id, x, y, len) {
  return { id, x:x*scaleX, y:y*scaleY, width:W*scaleX, height:len*scaleY,
           visible:true, hitbox:{widthPercentage:0,heightPercentage:0}, fromOverlay:true };
}

const b_top    = hwall('b_top',    0,   0,   650);
const b_bottom = hwall('b_bottom', 0,   392, 650);
const b_left   = vwall('b_left',   0,   0,   400);
const b_right  = vwall('b_right',  642, 0,   400);
const v1_top = vwall('v1_top', 160, 0,   220);
const v1_bot = vwall('v1_bot', 160, 282, 58);
const h1     = hwall('h1',       8, 220, 152);
const v2_top = vwall('v2_top', 320, 0,   140);
const v2_bot = vwall('v2_bot', 320, 220, 120);
const h2     = hwall('h2',     160, 140, 160);
const h3     = hwall('h3',     160, 282, 160);
const v3_top = vwall('v3_top', 480, 0,   150);
const v3_bot = vwall('v3_bot', 480, 230, 110);
const h4     = hwall('h4',     320, 150, 160);
const h5     = hwall('h5',     320, 340, 160);
const h6     = hwall('h6',     488, 230, 154);

const bgData = {
  name: 'custom_bg',
  src:  path + '/images/gamebuilder/bg/alien_planet.jpg',
  pixels: { height: 772, width: 1134 }
};

const playerData = {
  id: 'playerData',
  src: path + '/images/gamebuilder/sprites/astro.png',
  SCALE_FACTOR: 8, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
  INIT_POSITION: { x: 30*scaleX, y: 340*scaleY },
  pixels: { height:770, width:513 },
  orientation: { rows:4, columns:4 },
  down:      { row:0, start:0, columns:3 },
  downRight: { row:2, start:0, columns:3, rotate: Math.PI/16 },
  downLeft:  { row:1, start:0, columns:3, rotate:-Math.PI/16 },
  left:      { row:1, start:0, columns:3 },
  right:     { row:2, start:0, columns:3 },
  up:        { row:3, start:0, columns:3 },
  upLeft:    { row:1, start:0, columns:3, rotate: Math.PI/16 },
  upRight:   { row:3, start:0, columns:3, rotate:-Math.PI/16 },
  hitbox:    { widthPercentage:0.2, heightPercentage:0.2 },
  keypress:  { up:87, left:65, down:83, right:68 }
};

const self = this;

const npcData = {
  id: 'npc1',
  greeting: 'Hello, stranger...',
  src: path + '/images/gamify/chillguy.png',
  SCALE_FACTOR: 8, ANIMATION_RATE: 50,
  INIT_POSITION: { x: 530*scaleX, y: 30*scaleY },
  pixels: { height:512, width:384 },
  orientation: { rows:4, columns:3 },
  down:  { row:0, start:0, columns:3 },
  right: { row:1, start:0, columns:3 },
  left:  { row:2, start:0, columns:3 },
  up:    { row:3, start:0, columns:3 },
  hitbox: { widthPercentage:0.1, heightPercentage:0.2 },
  dialogues: [
    "A deal's a deal, Astro. The Zephyr-9 is waiting at your spawn point — she's fuelled and ready. Get home safe."
  ],
  reaction: function () {
    if (self._playerWon) {
      if (this.dialogueSystem) this.showReactionDialogue();
    } else {
      self._openBlackjack(false);
    }
  },
  interact: function () {
    if (self._playerWon) {
      if (this.dialogueSystem) this.showRandomDialogue();
    } else {
      self._openBlackjack(false);
    }
  }
};

const coinData = {
  id:'coin', greeting:false,
  INIT_POSITION:{x:0.25,y:0.25},
  width:40, height:70, color:'#FFD700',
  hitbox:{widthPercentage:0,heightPercentage:0},
  zIndex:20, value:1
};

this.classes = [
  { class: GameEnvBackground, data: bgData    },
  { class: Player,            data: playerData },
  { class: Barrier, data: b_top    }, { class: Barrier, data: b_bottom },
  { class: Barrier, data: b_left   }, { class: Barrier, data: b_right  },
  { class: Barrier, data: v1_top   }, { class: Barrier, data: v1_bot   },
  { class: Barrier, data: h1       },
  { class: Barrier, data: v2_top   }, { class: Barrier, data: v2_bot   },
  { class: Barrier, data: h2       }, { class: Barrier, data: h3       },
  { class: Barrier, data: v3_top   }, { class: Barrier, data: v3_bot   },
  { class: Barrier, data: h4       }, { class: Barrier, data: h5       },
  { class: Barrier, data: h6       },
  { class: Coin, data: coinData },
  { class: Npc,  data: npcData  }
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — spawn/remove mines and ship
// ═══════════════════════════════════════════════════════════════════════════

this._spawnMines = () => {
  if (this._minesActive) return;
  this._minesActive = true;
  const container = gameEnv.container || gameEnv.gameContainer;
  if (!container) return;
  const mineSrc = path + '/images/gamebuilder/sprites/Mine.jpg';
  for (const mine of this._mineData) {
    const img = document.createElement('img');
    img.src = mineSrc;
    img.style.position      = 'absolute';
    img.style.width         = mine.width  + 'px';
    img.style.height        = mine.height + 'px';
    img.style.left          = mine.x + 'px';
    img.style.top           = ((gameEnv.top || 0) + mine.y) + 'px';
    img.style.zIndex        = '12';
    img.style.pointerEvents = 'none';
    img.dataset.mineId      = mine.id;
    // Fade in
    img.style.opacity       = '0';
    img.style.transition    = 'opacity 0.6s';
    container.appendChild(img);
    this._mineImages.push(img);
    requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; }));
  }
};

this._removeMines = () => {
  this._minesActive = false;
  for (const img of this._mineImages) {
    img.style.transition = 'opacity 0.5s';
    img.style.opacity = '0';
    setTimeout(() => img.remove(), 600);
  }
  this._mineImages = [];
};

this._spawnShip = () => {
  if (this._shipEl) return;
  const container = gameEnv.container || gameEnv.gameContainer;
  if (!container) return;

  const ship = document.createElement('div');
  ship.id = 'zephyr-ship';
  Object.assign(ship.style, {
    position:   'absolute',
    left:       this._shipX + 'px',
    top:        ((gameEnv.top || 0) + this._shipY) + 'px',
    width:      (60 * scaleX) + 'px',
    height:     (50 * scaleY) + 'px',
    zIndex:     '20',
    pointerEvents: 'none',
    fontSize:   Math.round(40 * Math.min(scaleX, scaleY)) + 'px',
    textAlign:  'center',
    lineHeight: '1',
    filter:     'drop-shadow(0 0 12px rgba(0,200,255,0.9)) drop-shadow(0 0 24px rgba(0,150,255,0.5))',
    opacity:    '0',
    transition: 'opacity 0.8s, transform 0.8s',
    transform:  'translateY(20px)',
    userSelect: 'none',
  });
  ship.textContent = '🚀';

  // Pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shipPulse {
      0%,100% { filter: drop-shadow(0 0 10px rgba(0,200,255,0.8)) drop-shadow(0 0 20px rgba(0,150,255,0.4)); }
      50%      { filter: drop-shadow(0 0 20px rgba(0,220,255,1.0)) drop-shadow(0 0 40px rgba(0,180,255,0.7)); }
    }
    #zephyr-ship { animation: shipPulse 2s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
  this._shipStyle = style;

  // Label
  const label = document.createElement('div');
  Object.assign(label.style, {
    position:   'absolute',
    left:       this._shipX + 'px',
    top:        ((gameEnv.top || 0) + this._shipY - 22 * scaleY) + 'px',
    width:      (90 * scaleX) + 'px',
    zIndex:     '20',
    fontFamily: "'Press Start 2P', monospace",
    fontSize:   Math.round(7 * Math.min(scaleX, scaleY)) + 'px',
    color:      '#00ddff',
    textAlign:  'center',
    pointerEvents: 'none',
    textShadow: '0 0 8px rgba(0,200,255,0.9)',
    opacity:    '0',
    transition: 'opacity 0.8s',
    whiteSpace: 'nowrap',
  });
  label.textContent = 'ZEPHYR-9';
  label.id = 'zephyr-label';

  container.appendChild(ship);
  container.appendChild(label);
  this._shipEl    = ship;
  this._shipLabel = label;

  // Animate in
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ship.style.opacity   = '1';
    ship.style.transform = 'translateY(0)';
    label.style.opacity  = '1';
  }));
};

// ═══════════════════════════════════════════════════════════════════════════
// BLACKJACK ENGINE
// ═══════════════════════════════════════════════════════════════════════════

this._openBlackjack = (isRematch = false) => {
  if (this._blackjackOpen) return;
  this._blackjackOpen = true;

  // Mark that player has met NPC — mines will appear when blackjack closes
  this._metNpc = true;

  const suits  = ['♠','♥','♦','♣'];
  const ranks  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  let deck = [];
  for (const s of suits) for (const r of ranks) deck.push({ rank:r, suit:s });
  for (let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}

  const cardVal = r => { if(['J','Q','K'].includes(r)) return 10; if(r==='A') return 11; return parseInt(r); };
  const handTotal = hand => {
    let t=0,a=0;
    for(const c of hand){t+=cardVal(c.rank);if(c.rank==='A')a++;}
    while(t>21&&a>0){t-=10;a--;}
    return t;
  };

  let playerHand=[], dealerHand=[], deckIdx=0, currentBet=0, gameStarted=false;
  const draw=()=>deck[deckIdx++];

  // ── Overlay ───────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id='bj-overlay';
  Object.assign(overlay.style,{
    position:'fixed',inset:'0',background:'rgba(0,0,0,0.88)',
    zIndex:'200000',display:'flex',alignItems:'center',justifyContent:'center',
    fontFamily:"'Press Start 2P','Courier New',monospace",
  });

  const panel = document.createElement('div');
  Object.assign(panel.style,{
    background:'#060d12',border:'2px solid #c8a84b',
    boxShadow:'0 0 50px rgba(200,168,75,0.25),inset 0 0 30px rgba(200,168,75,0.04)',
    borderRadius:'18px',padding:'28px 32px',
    width:'520px',maxWidth:'96vw',color:'#e8dfc0',
    userSelect:'none',position:'relative',
  });

  // ── Story intro (first open only) ─────────────────────────────────────────
  if (!isRematch) {
    const storyBox = document.createElement('div');
    Object.assign(storyBox.style,{
      position:'absolute',inset:'0',background:'#060d12',borderRadius:'18px',
      padding:'32px',zIndex:'10',display:'flex',flexDirection:'column',
      justifyContent:'center',color:'#e8dfc0',
    });
    const lines=[
      {t:'ZEPHYR STATION — OUTER RIM',s:'color:#c8a84b;font-size:11px;letter-spacing:3px;margin-bottom:20px;text-align:center'},
      {t:'"Astro. I know why you\'re here."',s:'font-size:10px;line-height:2;color:#aad4aa;margin-bottom:12px'},
      {t:'"Your ship is gone — blown to dust by the Void Wraiths over Sector 7. I\'m the only one on this rock with a working vessel: the Zephyr-9."',s:'font-size:9px;line-height:2;color:#c8c0a0;margin-bottom:12px'},
      {t:'"Nothing\'s free out here. Beat me at blackjack — double your 50 credits to 100 — and she\'s yours."',s:'font-size:9px;line-height:2;color:#c8c0a0;margin-bottom:12px'},
      {t:'"Lose? You still walk... but I\'ll be scattering mines across the maze before you leave. Your choice."',s:'font-size:9px;line-height:2;color:#ff9966;margin-bottom:20px'},
    ];
    for(const l of lines){const p=document.createElement('div');p.textContent=l.t;p.style.cssText=l.s;storyBox.appendChild(p);}
    const startBtn=document.createElement('button');
    startBtn.textContent="LET'S PLAY";
    Object.assign(startBtn.style,{background:'transparent',border:'2px solid #c8a84b',color:'#c8a84b',padding:'12px 28px',borderRadius:'8px',fontFamily:"'Press Start 2P',monospace",fontSize:'12px',cursor:'pointer',letterSpacing:'2px',alignSelf:'center',marginTop:'8px',transition:'all 0.15s'});
    startBtn.onmouseenter=()=>{startBtn.style.background='#c8a84b';startBtn.style.color='#000';};
    startBtn.onmouseleave=()=>{startBtn.style.background='transparent';startBtn.style.color='#c8a84b';};
    startBtn.onclick=()=>storyBox.remove();
    storyBox.appendChild(startBtn);
    panel.appendChild(storyBox);
  }

  // ── Header with chip tracker ───────────────────────────────────────────────
  const header=document.createElement('div');
  Object.assign(header.style,{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'});
  const titleBlock=document.createElement('div');
  titleBlock.innerHTML=`<div style="font-size:16px;color:#c8a84b;letter-spacing:3px;">♠ BLACKJACK ♠</div><div style="font-size:8px;color:#887755;margin-top:4px;letter-spacing:1px;">ZEPHYR STATION CASINO</div>`;
  const chipBlock=document.createElement('div');chipBlock.style.textAlign='right';
  const chipDisplay=document.createElement('div');Object.assign(chipDisplay.style,{fontSize:'11px',color:'#c8a84b'});
  const goalBar=document.createElement('div');goalBar.style.marginTop='6px';goalBar.style.width='140px';
  const goalLabel=document.createElement('div');Object.assign(goalLabel.style,{fontSize:'8px',color:'#665544',marginBottom:'3px',textAlign:'right'});
  goalLabel.textContent=`GOAL: ${self._chipGoal} CREDITS`;
  const barOuter=document.createElement('div');Object.assign(barOuter.style,{height:'6px',background:'#1a1208',borderRadius:'3px',border:'1px solid #443322',overflow:'hidden'});
  const barInner=document.createElement('div');Object.assign(barInner.style,{height:'100%',background:'#c8a84b',borderRadius:'3px',transition:'width 0.4s'});
  barOuter.appendChild(barInner);goalBar.appendChild(goalLabel);goalBar.appendChild(barOuter);
  const updateChipDisplay=()=>{
    const pct=Math.min(100,(self._chips/self._chipGoal)*100);
    chipDisplay.textContent=`💰 ${self._chips} CREDITS`;
    barInner.style.width=pct+'%';
    chipDisplay.style.color=self._chips<20?'#ff6644':'#c8a84b';
  };
  updateChipDisplay();
  chipBlock.appendChild(chipDisplay);chipBlock.appendChild(goalBar);
  header.appendChild(titleBlock);header.appendChild(chipBlock);
  panel.appendChild(header);

  // ── Bet section ───────────────────────────────────────────────────────────
  const betSection=document.createElement('div');
  Object.assign(betSection.style,{background:'#0c1a0c',border:'1px solid #2a3a1a',borderRadius:'10px',padding:'12px 16px',marginBottom:'18px',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'});
  const betLabel=document.createElement('div');betLabel.textContent='BET:';Object.assign(betLabel.style,{fontSize:'9px',color:'#887755',letterSpacing:'2px'});
  const betDisplay=document.createElement('div');betDisplay.textContent='0 ◆';Object.assign(betDisplay.style,{fontSize:'13px',color:'#ffdd77',minWidth:'70px'});
  const dealBtn=document.createElement('button');dealBtn.textContent='DEAL';dealBtn.disabled=true;
  Object.assign(dealBtn.style,{background:'transparent',border:'2px solid #c8a84b',color:'#c8a84b',padding:'8px 16px',borderRadius:'8px',fontFamily:"'Press Start 2P',monospace",fontSize:'10px',cursor:'pointer',marginLeft:'auto',opacity:'0.4',transition:'all 0.15s'});
  dealBtn.onmouseenter=()=>{if(!dealBtn.disabled){dealBtn.style.background='#c8a84b';dealBtn.style.color='#000';}};
  dealBtn.onmouseleave=()=>{dealBtn.style.background='transparent';dealBtn.style.color='#c8a84b';};

  const makeBetBtn=(amt)=>{
    const b=document.createElement('button');b.textContent=`+${amt}`;
    Object.assign(b.style,{background:'#1a2a0a',border:'1px solid #4a6a2a',color:'#aad466',padding:'5px 10px',borderRadius:'6px',fontFamily:"'Press Start 2P',monospace",fontSize:'9px',cursor:'pointer',transition:'all 0.1s'});
    b.onmouseenter=()=>{b.style.background='#2a4a12';b.style.borderColor='#8aba44';};
    b.onmouseleave=()=>{b.style.background='#1a2a0a';b.style.borderColor='#4a6a2a';};
    b.onclick=()=>{
      if(gameStarted) return;
      const next=currentBet+amt;
      if(next>self._chips) return;
      currentBet=next;betDisplay.textContent=`${currentBet} ◆`;
      dealBtn.disabled=false;dealBtn.style.opacity='1';
    };
    return b;
  };
  const clearBetBtn=document.createElement('button');clearBetBtn.textContent='CLEAR';
  Object.assign(clearBetBtn.style,{background:'transparent',border:'1px solid #553322',color:'#885544',padding:'5px 10px',borderRadius:'6px',fontFamily:"'Press Start 2P',monospace",fontSize:'9px',cursor:'pointer'});
  clearBetBtn.onclick=()=>{if(gameStarted)return;currentBet=0;betDisplay.textContent='0 ◆';dealBtn.disabled=true;dealBtn.style.opacity='0.4';};
  [betLabel,...[5,10,20].map(makeBetBtn),betDisplay,clearBetBtn,dealBtn].forEach(el=>betSection.appendChild(el));
  panel.appendChild(betSection);

  // ── Card sections ──────────────────────────────────────────────────────────
  const makeSection=(label)=>{
    const wrap=document.createElement('div');wrap.style.marginBottom='14px';
    const lbl=document.createElement('div');lbl.textContent=label;Object.assign(lbl.style,{fontSize:'8px',color:'#665544',marginBottom:'8px',letterSpacing:'2px'});
    const cards=document.createElement('div');Object.assign(cards.style,{display:'flex',alignItems:'flex-start',minHeight:'86px',flexWrap:'wrap',gap:'4px'});
    const score=document.createElement('div');Object.assign(score.style,{fontSize:'9px',color:'#aaa890',marginTop:'6px',minHeight:'14px'});
    wrap.appendChild(lbl);wrap.appendChild(cards);wrap.appendChild(score);
    return {wrap,cards,score};
  };
  const dealerSec=makeSection("ZEPHYR'S HAND");
  const playerSec=makeSection('YOUR HAND');
  panel.appendChild(dealerSec.wrap);
  panel.appendChild(playerSec.wrap);

  const status=document.createElement('div');
  Object.assign(status.style,{textAlign:'center',fontSize:'10px',minHeight:'18px',color:'#ffdd44',marginBottom:'14px',letterSpacing:'1px'});
  panel.appendChild(status);

  // ── Action buttons ─────────────────────────────────────────────────────────
  const btnRow=document.createElement('div');Object.assign(btnRow.style,{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'});
  const makeBtn=(label,color)=>{
    const btn=document.createElement('button');btn.textContent=label;
    Object.assign(btn.style,{background:'transparent',border:`2px solid ${color}`,color:color,padding:'9px 18px',borderRadius:'8px',fontFamily:"'Press Start 2P',monospace",fontSize:'10px',cursor:'pointer',letterSpacing:'1px',transition:'all 0.15s'});
    btn.onmouseenter=()=>{btn.style.background=color;btn.style.color='#000';};
    btn.onmouseleave=()=>{btn.style.background='transparent';btn.style.color=color;};
    return btn;
  };
  const hitBtn=makeBtn('HIT','#44dd88');
  const standBtn=makeBtn('STAND','#ddaa33');
  const newRndBtn=makeBtn('NEW ROUND','#44aaff');
  hitBtn.style.display='none';standBtn.style.display='none';newRndBtn.style.display='none';
  btnRow.appendChild(hitBtn);btnRow.appendChild(standBtn);btnRow.appendChild(newRndBtn);
  panel.appendChild(btnRow);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  this._blackjackEl=overlay;

  // ── Card renderer ──────────────────────────────────────────────────────────
  const makeCard=(rank,suit,hidden=false)=>{
    const card=document.createElement('div');
    const isRed=suit==='♥'||suit==='♦';
    Object.assign(card.style,{display:'inline-flex',flexDirection:'column',justifyContent:'space-between',width:'52px',height:'76px',background:hidden?'repeating-linear-gradient(45deg,#0c1a0c,#0c1a0c 4px,#0f2010 4px,#0f2010 8px)':'#f5f0e6',border:hidden?'1px solid #2a3a2a':'1px solid #bbb',borderRadius:'7px',padding:'5px',color:hidden?'#2a3a2a':(isRed?'#c0392b':'#1a1a2e'),fontSize:'12px',fontWeight:'bold',boxShadow:hidden?'none':'2px 3px 8px rgba(0,0,0,0.5)',fontFamily:'Georgia,serif'});
    if(hidden){card.innerHTML='<div style="font-size:18px;text-align:center;margin-top:16px;color:#2a3a2a;opacity:0.4">✦</div>';}
    else{card.innerHTML=`<div style="line-height:1">${rank}</div><div style="font-size:18px;text-align:center;line-height:1">${suit}</div><div style="transform:rotate(180deg);line-height:1">${rank}</div>`;}
    return card;
  };

  const render=(revealDealer=false)=>{
    dealerSec.cards.innerHTML='';playerSec.cards.innerHTML='';
    dealerHand.forEach((c,i)=>dealerSec.cards.appendChild(makeCard(c.rank,c.suit,!revealDealer&&i===1)));
    playerHand.forEach(c=>playerSec.cards.appendChild(makeCard(c.rank,c.suit)));
    playerSec.score.textContent=`Total: ${handTotal(playerHand)}`;
    dealerSec.score.textContent=revealDealer?`Total: ${handTotal(dealerHand)}`:`Showing: ${cardVal(dealerHand[0].rank)}`;
  };

  // ── Close blackjack and apply consequences ─────────────────────────────────
  const closeAndApply=(won)=>{
    overlay.remove();
    self._blackjackEl=null;
    self._blackjackOpen=false;

    // Always spawn the ship at the start point
    self._spawnShip();

    if(won){
      // WIN — clear all mines, show victory dialogue
      self._playerWon=true;
      self._removeMines();
      const npc=gameEnv.gameObjects.find(o=>o?.spriteData?.id==='npc1');
      if(npc&&npc.dialogueSystem) npc.showRandomDialogue();
    } else {
      // LOSE — drop mines, player must dodge back to ship
      self._spawnMines();
      // Show a brief overlay message
      const warn=document.createElement('div');
      Object.assign(warn.style,{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        background:'rgba(0,0,0,0.9)',border:'2px solid #ff4444',borderRadius:'12px',
        padding:'24px 32px',zIndex:'200001',fontFamily:"'Press Start 2P',monospace",
        textAlign:'center',color:'#fff',maxWidth:'400px',
      });
      warn.innerHTML=`
        <div style="font-size:24px;margin-bottom:12px;">⚠️</div>
        <div style="font-size:11px;color:#ff6644;letter-spacing:2px;margin-bottom:12px;">DEAL BROKEN</div>
        <div style="font-size:8px;color:#cc9988;line-height:2.2;margin-bottom:16px">
          "You lost, Astro. I scattered mines through the maze — enjoy the walk back to your ship."
        </div>
        <div style="font-size:8px;color:#886655;line-height:2">The Zephyr-9 is waiting at your spawn point. Reach it to escape.</div>`;
      const okBtn=document.createElement('button');
      okBtn.textContent='UNDERSTOOD';
      Object.assign(okBtn.style,{background:'transparent',border:'2px solid #ff4444',color:'#ff4444',padding:'8px 20px',borderRadius:'8px',fontFamily:"'Press Start 2P',monospace",fontSize:'9px',cursor:'pointer',marginTop:'16px',transition:'all 0.15s'});
      okBtn.onmouseenter=()=>{okBtn.style.background='#ff4444';okBtn.style.color='#000';};
      okBtn.onmouseleave=()=>{okBtn.style.background='transparent';okBtn.style.color='#ff4444';};
      okBtn.onclick=()=>warn.remove();
      warn.appendChild(okBtn);
      document.body.appendChild(warn);
    }
  };

  // ── Round end logic ────────────────────────────────────────────────────────
  const endRound=(msg,outcome)=>{
    hitBtn.style.display='none';standBtn.style.display='none';
    if(outcome==='win'){self._chips+=currentBet;status.style.color='#44ff88';}
    else if(outcome==='lose'){self._chips-=currentBet;status.style.color='#ff4444';}
    else{status.style.color='#ffdd44';}
    status.textContent=msg+`  |  Credits: ${self._chips}`;
    updateChipDisplay();
    currentBet=0;betDisplay.textContent='0 ◆';

    // ── Win condition ──────────────────────────────────────────────────────
    if(self._chips>=self._chipGoal){
      status.textContent='';
      showVictory();
      return;
    }
    // ── Broke condition ────────────────────────────────────────────────────
    if(self._chips<=0){
      self._chips=0;
      showBroke();
      return;
    }
    betSection.style.opacity='1';betSection.style.pointerEvents='auto';
    dealBtn.disabled=true;dealBtn.style.opacity='0.4';
    newRndBtn.style.display='inline-block';
    gameStarted=false;
  };

  // ── Victory ────────────────────────────────────────────────────────────────
  const showVictory=()=>{
    panel.innerHTML='';
    Object.assign(panel.style,{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'300px',textAlign:'center',boxShadow:'0 0 80px rgba(200,168,75,0.6),inset 0 0 30px rgba(200,168,75,0.1)'});
    panel.innerHTML=`
      <div style="font-size:40px;margin-bottom:16px;">🚀</div>
      <div style="font-size:14px;color:#c8a84b;letter-spacing:3px;margin-bottom:12px;">YOU WIN!</div>
      <div style="font-size:9px;color:#aaa890;line-height:2;margin-bottom:8px;max-width:340px">${self._chips} credits. The Zephyr-9 is yours.</div>
      <div style="font-size:9px;color:#887766;line-height:2;margin-bottom:24px;max-width:340px">"I've cleared the mines. Safe travels, Astro — don't make me regret this."</div>`;
    const claimBtn=makeBtn('CLAIM THE ZEPHYR-9','#c8a84b');
    claimBtn.style.fontSize='10px';
    claimBtn.onclick=()=>closeAndApply(true);
    panel.appendChild(claimBtn);
  };

  // ── Broke (out of chips — loses but can still leave) ──────────────────────
  const showBroke=()=>{
    panel.innerHTML='';
    Object.assign(panel.style,{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'300px',textAlign:'center',boxShadow:'0 0 60px rgba(255,60,60,0.3)'});
    panel.innerHTML=`
      <div style="font-size:36px;margin-bottom:16px;">💸</div>
      <div style="font-size:13px;color:#ff5533;letter-spacing:3px;margin-bottom:12px;">BROKE</div>
      <div style="font-size:9px;color:#cc8877;line-height:2;margin-bottom:8px;max-width:360px">"Out of credits. You lose the ship deal."</div>
      <div style="font-size:9px;color:#995544;line-height:2;margin-bottom:24px;max-width:360px">"But I'm not heartless — I parked the Zephyr-9 back at your start point anyway. You'll just have to dodge what I left in the maze..."</div>`;
    const leaveBtn=makeBtn('FACE THE MINES','#ff5533');
    leaveBtn.style.fontSize='10px';
    leaveBtn.onclick=()=>closeAndApply(false);
    panel.appendChild(leaveBtn);
  };

  // ── Deal ───────────────────────────────────────────────────────────────────
  dealBtn.onclick=()=>{
    if(currentBet===0) return;
    gameStarted=true;
    betSection.style.opacity='0.5';betSection.style.pointerEvents='none';
    newRndBtn.style.display='none';
    playerHand=[draw(),draw()];dealerHand=[draw(),draw()];
    render(false);status.textContent='';
    const pt=handTotal(playerHand),dt=handTotal(dealerHand);
    if(pt===21&&dt===21){render(true);endRound('PUSH — both blackjack!','push');return;}
    if(pt===21){render(true);endRound('BLACKJACK! You win! 🎉','win');return;}
    if(dt===21){render(true);endRound('Dealer blackjack! You lose.','lose');return;}
    hitBtn.style.display='inline-block';standBtn.style.display='inline-block';
  };

  hitBtn.onclick=()=>{
    playerHand.push(draw());const pt=handTotal(playerHand);render(false);
    if(pt>21){render(true);endRound('BUST! Over 21.','lose');}
    else if(pt===21){dealerPlay();}
  };

  const dealerPlay=()=>{
    while(handTotal(dealerHand)<17) dealerHand.push(draw());
    render(true);
    const pt=handTotal(playerHand),dt=handTotal(dealerHand);
    if(dt>21)       endRound('Dealer busts! You win! 🎉','win');
    else if(pt>dt)  endRound('You win! 🎉','win');
    else if(pt===dt)endRound("Push — it's a tie.",'push');
    else            endRound('Dealer wins.','lose');
  };
  standBtn.onclick=dealerPlay;

  newRndBtn.onclick=()=>{
    newRndBtn.style.display='none';
    deckIdx=0;
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    dealerSec.cards.innerHTML='';playerSec.cards.innerHTML='';
    dealerSec.score.textContent='';playerSec.score.textContent='';
    status.textContent='Place your bet and deal.';status.style.color='#887755';
    dealBtn.disabled=true;dealBtn.style.opacity='0.4';betDisplay.textContent='0 ◆';currentBet=0;gameStarted=false;
  };
};

// ── initialize() ──────────────────────────────────────────────────────────
this.initialize = () => {
  if (!gameEnv.stats) gameEnv.stats = {};
  if (typeof gameEnv.stats.coinsCollected !== 'number') gameEnv.stats.coinsCollected = 0;

  const container = gameEnv.container || gameEnv.gameContainer;

  // Neon wall overlays
  this._wallOverlays=[];
  if(container){
    for(const obj of gameEnv.gameObjects){
      if(!(obj instanceof Barrier)) continue;
      const el=document.createElement('div');
      el.style.position='absolute';el.style.left=obj.x+'px';
      el.style.top=((gameEnv.top||0)+obj.y)+'px';el.style.width=obj.width+'px';
      el.style.height=obj.height+'px';el.style.zIndex='5';el.style.pointerEvents='none';
      el.style.borderRadius='3px';
      el.style.background='linear-gradient(135deg,rgba(0,255,255,0.18),rgba(0,180,220,0.30))';
      el.style.border='1px solid rgba(0,255,255,0.6)';
      el.style.boxShadow='0 0 7px rgba(0,255,255,0.45),inset 0 0 4px rgba(0,255,255,0.15)';
      container.appendChild(el);this._wallOverlays.push(el);
    }
  }

  // Coin placement
  const blockedRects=gameEnv.gameObjects.filter(o=>o instanceof Barrier).map(o=>({x:o.x,y:o.y,width:o.width,height:o.height}));
  const coin=gameEnv.gameObjects.find(o=>o?.spriteData?.id==='coin');
  if(coin){
    const sz=()=>({width:coin.width||40,height:coin.height||40});
    const overlaps=(x,y)=>{const{width:cw,height:ch}=sz();const p=8;return blockedRects.some(r=>x+p<r.x+r.width&&x+cw-p>r.x&&y+p<r.y+r.height&&y+ch-p>r.y);};
    const place=()=>{const{width:cw,height:ch}=sz();const minX=20,minY=20,maxX=Math.max(20,gameEnv.innerWidth-cw-20),maxY=Math.max(20,gameEnv.innerHeight-ch-20);for(let i=0;i<300;i++){const x=Math.random()*(maxX-minX)+minX,y=Math.random()*(maxY-minY)+minY;if(!overlaps(x,y)){coin.position.x=x;coin.position.y=y;coin.resize();return;}}coin.position.x=20;coin.position.y=20;coin.resize();};
    const orig=coin.collect.bind(coin);
    coin.randomizePosition=place;coin.collect=function(){orig();updateCounter();};place();
  }

  const updateCounter=()=>{if(!this._coinCounter)return;this._coinCounter.textContent=`Coins: ${gameEnv.stats?.coinsCollected||0}`;};
  let counter=document.getElementById('gamelevel2-coin-counter');
  if(!counter){counter=document.createElement('div');counter.id='gamelevel2-coin-counter';document.body.appendChild(counter);}
  Object.assign(counter.style,{position:'fixed',top:'120px',right:'12px',padding:'8px 14px',background:'rgba(0,0,0,0.82)',color:'#FFD700',fontFamily:"'Press Start 2P',monospace",fontSize:'13px',border:'2px solid #FFD700',borderRadius:'6px',boxShadow:'0 0 10px rgba(255,215,0,0.35)',zIndex:'100000'});
  this._coinCounter=counter;updateCounter();

  // NOTE: mines are NOT spawned here — they only appear after meeting the NPC
};

// ── destroy() ─────────────────────────────────────────────────────────────
this.destroy = () => {
  if(this._mineInterval!==null){clearInterval(this._mineInterval);this._mineInterval=null;}
  for(const img of this._mineImages) img.remove();
  this._mineImages=[];
  for(const el of this._wallOverlays) el.remove();
  this._wallOverlays=[];
  if(this._blackjackEl){this._blackjackEl.remove();this._blackjackEl=null;}
  this._blackjackOpen=false;
  if(this._shipEl){this._shipEl.remove();this._shipEl=null;}
  if(this._shipLabel){this._shipLabel.remove();this._shipLabel=null;}
  if(this._shipStyle){this._shipStyle.remove();this._shipStyle=null;}
  if(this._coinCounter?.parentNode)this._coinCounter.parentNode.removeChild(this._coinCounter);
  this._coinCounter=null;
};

// ── Mine detection — only active when _minesActive is true ────────────────
this._mineInterval=setInterval(()=>{
  if(!this._minesActive) return;  // no mines before meeting NPC

  const player=gameEnv.gameObjects.find(o=>o instanceof Player);
  if(!player) return;
  const px=player.position.x+(player.width||0)/2;
  const py=player.position.y+(player.height||0)/2;
  for(const mine of this._mineData){
    if(px>mine.x&&px<mine.x+mine.width&&py>mine.y&&py<mine.y+mine.height){
      clearInterval(this._mineInterval);this._mineInterval=null;
      const boom=document.createElement('div');
      Object.assign(boom.style,{position:'fixed',top:'0',left:'0',width:'100vw',height:'100vh',backgroundColor:'rgba(255,80,0,0.75)',zIndex:'99999',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'Press Start 2P',monospace",color:'#fff',textAlign:'center'});
      boom.innerHTML=`<div style="font-size:72px;margin-bottom:16px;">💥</div><div style="font-size:32px;color:#FFD700;letter-spacing:4px;">BOOM!</div><div style="font-size:15px;margin-top:14px;">You stepped on a landmine.</div><div style="font-size:11px;margin-top:10px;opacity:0.8;">Restarting...</div>`;
      document.body.appendChild(boom);
      setTimeout(()=>location.reload(),1500);
      break;
    }
  }
},50);

}
}

export const gameLevelClasses = [GameLevel2];
export default GameLevel2;