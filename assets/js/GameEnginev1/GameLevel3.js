import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';

class GameLevel3 {

constructor(gameEnv) {

const path   = gameEnv.path;
const width  = gameEnv.innerWidth;
const height = gameEnv.innerHeight;

const baseWidth  = 650;
const baseHeight = 400;
const scaleX = width  / baseWidth;
const scaleY = height / baseHeight;

// ── Cleanup refs ─────────────────────────────────────────────────────────
this._physicsInterval  = null;
this._overlays         = [];
this._styleEl          = null;
this._hud              = null;
this._deathScreen      = null;
this._isDead           = false;
this._won              = false;

// ── Music state ───────────────────────────────────────────────────────────
this._audioCtx      = null;   // Web Audio context
this._musicNodes    = [];     // active oscillator/gain nodes to stop later
this._musicPlaying  = false;
this._musicStarted  = false;
this._musicBtn      = null;
this._scheduleTimer = null;

// ── Physics state ─────────────────────────────────────────────────────────
this._vy             = 0;
this._vx             = 0;
this._onGround       = false;
this._canJump        = true;
this._onMovingPlat   = false;
this._movingPlatVelX = 0;
this._lives          = 3;
this._coins          = 0;

const GRAVITY    = 0.52  * scaleY;
const JUMP_FORCE = -11   * scaleY;
const MOVE_SPEED = 3.8   * scaleX;
const MAX_FALL   = 15    * scaleY;

// ── Key state ─────────────────────────────────────────────────────────────
const keys = { w:false, a:false, d:false, space:false };
this._keyDown = e => {
  if (e.key==='w'||e.key==='W'||e.key==='ArrowUp')    keys.w=true;
  if (e.key==='a'||e.key==='A'||e.key==='ArrowLeft')  keys.a=true;
  if (e.key==='d'||e.key==='D'||e.key==='ArrowRight') keys.d=true;
  if (e.key===' ') { keys.space=true; e.preventDefault(); }
};
this._keyUp = e => {
  if (e.key==='w'||e.key==='W'||e.key==='ArrowUp')    keys.w=false;
  if (e.key==='a'||e.key==='A'||e.key==='ArrowLeft')  keys.a=false;
  if (e.key==='d'||e.key==='D'||e.key==='ArrowRight') keys.d=false;
  if (e.key===' ') keys.space=false;
};
document.addEventListener('keydown', this._keyDown);
document.addEventListener('keyup',   this._keyUp);

// ── Platform builder ───────────────────────────────────────────────────────
const plat = (id, x, y, w, h=12, color='#4a9eff') => ({
  id, color,
  sx: x*scaleX, sy: y*scaleY,
  sw: w*scaleX, sh: h*scaleY,
});

this._platforms = [
  plat('ground', 0,   370, 650, 30, '#2a5a2a'),
  plat('wall_l', 0,   0,   10,  400,'#1a3a1a'),
  plat('wall_r', 640, 0,   10,  400,'#1a3a1a'),
  plat('ceil',   0,   0,   650, 8,  '#1a3a1a'),
  plat('p1',   40,  290, 120, 12, '#4a9eff'),
  plat('p2',  190,  230, 120, 12, '#4a9eff'),
  plat('p4',  490,  155, 100, 12, '#ff9944'),
  plat('p5',  330,  105, 130, 12, '#4a9eff'),
  plat('p6',  150,   60, 130, 12, '#ff9944'),
  plat('goal',500,   60, 125, 12, '#c8a84b'),
];

this._movingPlat = plat('p3_move', 310, 200, 80, 12, '#ff44aa');
this._movingDir  = 1;
this._movingMinX = 300 * scaleX;
this._movingMaxX = 470 * scaleX;
this._movingSpd  = 1.4 * scaleX;

this._spikes = [
  { x:355, y:350, w:20, h:20 },
  { x:385, y:350, w:20, h:20 },
  { x:415, y:350, w:20, h:20 },
  { x:445, y:350, w:20, h:20 },
  { x:475, y:350, w:20, h:20 },
].map(s => ({
  x: s.x * scaleX, y: s.y * scaleY,
  w: s.w * scaleX, h: s.h * scaleY,
  killY: s.y * scaleY + s.h * scaleY * 0.5,
}));

this._coinPositions = [
  { x:90,  y:268 },
  { x:240, y:208 },
  { x:375, y:178 },
  { x:525, y:133 },
  { x:385, y: 83 },
  { x:195, y: 38 },
  { x:555, y: 38 },
].map(c => ({
  x: c.x * scaleX, y: c.y * scaleY,
  w: 14 * scaleX,  h: 14 * scaleY,
  collected: false,
}));

// Flag sits on goal shelf — pole base must equal goal.y (60)
// pole height = 42 scaled units, so flagY = 60 - 42 = 18
this._flagX = 540 * scaleX;
this._flagY =  18 * scaleY;

const bgData = {
  name: 'crater_bg',
  src:  path + '/images/gamebuilder/bg/alien_planet.jpg',
  pixels: { height:772, width:1134 }
};

const playerData = {
  id: 'playerData',
  src: path + '/images/gamebuilder/sprites/astro.png',
  SCALE_FACTOR:   10,
  STEP_FACTOR:    999999,
  ANIMATION_RATE: 60,
  INIT_POSITION:  { x: 30*scaleX, y: 320*scaleY },
  pixels:      { height:770, width:513 },
  orientation: { rows:4, columns:4 },
  down:      { row:0, start:0, columns:3 },
  downRight: { row:2, start:0, columns:3 },
  downLeft:  { row:1, start:0, columns:3 },
  left:      { row:1, start:0, columns:3 },
  right:     { row:2, start:0, columns:3 },
  up:        { row:3, start:0, columns:3 },
  upLeft:    { row:1, start:0, columns:3 },
  upRight:   { row:3, start:0, columns:3 },
  hitbox: { widthPercentage:0.3, heightPercentage:0.3 },
  keypress: { up:87, left:65, down:83, right:68 }
};

this.classes = [
  { class: GameEnvBackground, data: bgData    },
  { class: Player,            data: playerData },
];

// ═══════════════════════════════════════════════════════════════════════════
//  MUSIC SYSTEM
//  Same pattern as PeppaMusic.js — iTunes API fetch, Audio element, toggle.
//  Searches for space/sci-fi game music instead of Peppa Pig.
// ═══════════════════════════════════════════════════════════════════════════

// ── WEB AUDIO MUSIC ENGINE ────────────────────────────────────────────────
//  Generates a looping retro space melody using the Web Audio API.
//  No network requests, no CORS issues, works instantly on user gesture.
//
//  The melody is a simple 16-step sequencer running at 140 BPM.
//  Notes are played on a sawtooth oscillator through a filter and reverb.

// Note frequencies (Hz) for a pentatonic space melody
const NOTE = {
  C3:130.8, D3:146.8, E3:164.8, G3:196.0, A3:220.0,
  C4:261.6, D4:293.7, E4:329.6, G4:392.0, A4:440.0,
  C5:523.3, D5:587.3, G5:784.0, _:0,
};

// 16-step melody pattern (null = rest)
const MELODY = [
  NOTE.C4, NOTE._, NOTE.E4, NOTE.G4,
  NOTE.A4, NOTE._, NOTE.G4, NOTE.E4,
  NOTE.C4, NOTE.D4, NOTE._, NOTE.G4,
  NOTE.E4, NOTE.C4, NOTE.D4, NOTE._,
];

// Bass pattern (plays every 4 steps)
const BASS = [NOTE.C3, NOTE.G3, NOTE.A3, NOTE.G3];

const BPM       = 140;
const STEP_SEC  = 60 / BPM / 2;  // 8th notes

this._startMusic = () => {
  if (this._musicStarted) return;
  try {
    this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this._musicStarted = true;
    this._musicPlaying = true;
    this._runSequencer();
    this._updateMusicBtn();
    console.log('[GameLevel3] Web Audio music started');
  } catch(e) {
    console.warn('[GameLevel3] Web Audio not available:', e);
  }
};

this._runSequencer = () => {
  if (!this._audioCtx || !this._musicPlaying) return;
  const ctx  = this._audioCtx;
  let step   = 0;
  let nextAt = ctx.currentTime + 0.05;

  // Master gain + soft limiter
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);
  this._musicNodes.push(master);

  // Reverb (simple convolver with generated impulse)
  const convolver = ctx.createConvolver();
  const irLen = ctx.sampleRate * 1.2;
  const irBuf = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = irBuf.getChannelData(ch);
    for (let i = 0; i < irLen; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/irLen, 2);
  }
  convolver.buffer = irBuf;
  convolver.connect(master);

  // Low-pass filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  filter.Q.value = 1.2;
  filter.connect(convolver);
  filter.connect(master);  // dry signal too

  const playNote = (freq, startTime, duration, type='sawtooth', vol=0.4) => {
    if (!freq || freq === 0) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    // Slight pitch wobble for character
    osc.frequency.setTargetAtTime(freq * 1.002, startTime + 0.01, 0.05);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.setTargetAtTime(0, startTime + duration * 0.7, duration * 0.15);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  };

  const tick = () => {
    if (!this._musicPlaying || !this._audioCtx) return;
    // Schedule ahead 0.2s
    while (nextAt < ctx.currentTime + 0.2) {
      const melodyFreq = MELODY[step % MELODY.length];
      playNote(melodyFreq, nextAt, STEP_SEC * 0.85, 'sawtooth', 0.35);

      // Bass every 4 steps
      if (step % 4 === 0) {
        const bassFreq = BASS[Math.floor(step/4) % BASS.length];
        playNote(bassFreq, nextAt, STEP_SEC * 3.5, 'triangle', 0.5);
      }

      // Hi-hat on every step
      const bufLen = ctx.sampleRate * 0.04;
      const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i=0; i<bufLen; i++) nd[i] = Math.random()*2-1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const hiGain = ctx.createGain();
      const hiFilter = ctx.createBiquadFilter();
      hiFilter.type = 'highpass';
      hiFilter.frequency.value = 8000;
      hiGain.gain.setValueAtTime(step%2===0 ? 0.12 : 0.05, nextAt);
      hiGain.gain.setTargetAtTime(0, nextAt+0.01, 0.02);
      noise.connect(hiFilter);
      hiFilter.connect(hiGain);
      hiGain.connect(master);
      noise.start(nextAt);

      // Kick drum on beat (steps 0 and 8)
      if (step % 8 === 0) {
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(150, nextAt);
        kick.frequency.exponentialRampToValueAtTime(40, nextAt + 0.08);
        kickGain.gain.setValueAtTime(0.8, nextAt);
        kickGain.gain.exponentialRampToValueAtTime(0.001, nextAt + 0.15);
        kick.connect(kickGain);
        kickGain.connect(master);
        kick.start(nextAt);
        kick.stop(nextAt + 0.2);
      }

      nextAt += STEP_SEC;
      step++;
    }
    this._scheduleTimer = setTimeout(tick, 50);
  };
  tick();
};

this._toggleMusic = () => {
  if (!this._musicStarted) {
    this._startMusic();
  } else if (this._musicPlaying) {
    // Pause — suspend the audio context
    this._musicPlaying = false;
    if (this._scheduleTimer) { clearTimeout(this._scheduleTimer); this._scheduleTimer=null; }
    this._audioCtx && this._audioCtx.suspend();
    this._updateMusicBtn();
  } else {
    // Resume
    this._musicPlaying = true;
    this._audioCtx && this._audioCtx.resume();
    this._runSequencer();
    this._updateMusicBtn();
  }
};

this._updateMusicBtn = () => {
  if (!this._musicBtn) return;
  this._musicBtn.textContent = this._musicPlaying ? '🔊 Music' : '🔇 Music';
  this._musicBtn.style.background  = this._musicPlaying ? 'rgba(0,200,120,0.25)' : 'rgba(0,0,0,0.55)';
  this._musicBtn.style.borderColor = this._musicPlaying ? '#00ff88' : '#445544';
  this._musicBtn.style.color       = this._musicPlaying ? '#00ff88' : '#667766';
};

this._stopAndCleanMusic = () => {
  this._musicPlaying = false;
  if (this._scheduleTimer) { clearTimeout(this._scheduleTimer); this._scheduleTimer=null; }
  if (this._audioCtx) {
    try { this._audioCtx.close(); } catch(_) {}
    this._audioCtx = null;
  }
  this._musicNodes = [];
  this._musicStarted = false;
  if (this._musicBtn) { this._musicBtn.remove(); this._musicBtn=null; }
};

// ═══════════════════════════════════════════════════════════════════════════
//  initialize()
// ═══════════════════════════════════════════════════════════════════════════
this.initialize = () => {
  const container = gameEnv.container || gameEnv.gameContainer;
  if (!container) return;

  // CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes flagWave {
      0%,100%{ transform:skewX(0deg);  }
      40%    { transform:skewX(-8deg); }
      70%    { transform:skewX(6deg);  }
    }
    @keyframes coinSpin {
      0%  { transform:scaleX(1);   }
      50% { transform:scaleX(0.1); }
      100%{ transform:scaleX(1);   }
    }
    @keyframes movGlow {
      0%,100%{ box-shadow:0 0 8px rgba(255,68,170,0.6); }
      50%    { box-shadow:0 0 20px rgba(255,68,170,1.0);}
    }
    .l3-mov { animation: movGlow 1.5s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
  this._styleEl = style;

  const top = gameEnv.top || 0;
  const self = this;

  // ── Music toggle button ───────────────────────────────────────────────────
  // Styled to match the game's neon sci-fi aesthetic, not default browser look
  const musicBtn = document.createElement('button');
  musicBtn.textContent = '🔇 Music';
  Object.assign(musicBtn.style, {
    position:    'fixed',
    top:         '12px',
    right:       '12px',
    zIndex:      '100002',
    padding:     '7px 14px',
    fontFamily:  "'Press Start 2P', monospace",
    fontSize:    Math.round(8 * Math.min(scaleX, scaleY)) + 'px',
    background:  'rgba(0,0,0,0.55)',
    color:       '#667766',
    border:      '1px solid #445544',
    borderRadius:'8px',
    cursor:      'pointer',
    letterSpacing:'1px',
    transition:  'all 0.2s',
    // Prevent the keydown handler eating the spacebar when button is focused
    outline:     'none',
  });
  // Unfocus after click so spacebar goes back to jumping
  musicBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    musicBtn.blur();
    await self._toggleMusic();
  });
  document.body.appendChild(musicBtn);
  this._musicBtn = musicBtn;

  // Auto-start on first user interaction (Web Audio requires a gesture)
  const autoStart = () => { self._startMusic(); };
  window.addEventListener('keydown', autoStart, { once:true });
  window.addEventListener('click',   autoStart, { once:true });
  window.addEventListener('touchstart', autoStart, { once:true });

  // ── Draw static platforms ──────────────────────────────────────────────
  for (const p of this._platforms) {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:'absolute',
      left: p.sx + 'px', top: (top + p.sy) + 'px',
      width: p.sw + 'px', height: p.sh + 'px',
      background: p.color,
      borderRadius: (p.id==='ground'||p.id==='ceil') ? '0' : '4px',
      zIndex: '8', pointerEvents: 'none',
      boxShadow: p.color==='#2a5a2a' ? 'inset 0 3px 0 rgba(100,200,100,0.3)'
               : p.color==='#c8a84b' ? '0 0 14px rgba(200,168,75,0.7)'
               : p.color==='#1a3a1a' ? 'none'
               : 'inset 0 2px 0 rgba(255,255,255,0.2)',
      border: p.color==='#c8a84b' ? '1px solid rgba(200,168,75,0.9)'
            : p.color==='#1a3a1a' ? 'none'
            : '1px solid rgba(255,255,255,0.1)',
    });
    container.appendChild(el);
    this._overlays.push(el);
    p._el = el;
  }

  // ── Draw moving platform ───────────────────────────────────────────────
  const mp = this._movingPlat;
  const mpEl = document.createElement('div');
  Object.assign(mpEl.style, {
    position:'absolute', left: mp.sx+'px', top: (top+mp.sy)+'px',
    width: mp.sw+'px', height: mp.sh+'px',
    background: mp.color, borderRadius:'4px', zIndex:'8',
    pointerEvents:'none', border:'1px solid rgba(255,100,200,0.5)',
  });
  mpEl.classList.add('l3-mov');
  container.appendChild(mpEl);
  this._overlays.push(mpEl);
  mp._el = mpEl;

  const mpLbl = document.createElement('div');
  Object.assign(mpLbl.style, {
    position:'absolute', top:(top+mp.sy-18*scaleY)+'px', left:mp.sx+'px',
    width:mp.sw+'px', fontSize: Math.round(6*Math.min(scaleX,scaleY))+'px',
    color:'#ff88cc', textAlign:'center', pointerEvents:'none',
    fontFamily:"'Press Start 2P',monospace", zIndex:'9',
    textShadow:'0 0 6px rgba(255,68,170,0.8)',
  });
  mpLbl.textContent = '~ MOVING ~';
  container.appendChild(mpLbl);
  this._overlays.push(mpLbl);
  mp._lblEl = mpLbl;

  // ── Draw spikes ────────────────────────────────────────────────────────
  for (const sp of this._spikes) {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:'absolute',
      left: sp.x+'px', top: (top+sp.y)+'px',
      width: sp.w+'px', height: sp.h+'px',
      background: '#ff3333',
      clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
      zIndex:'9', pointerEvents:'none',
      filter:'drop-shadow(0 0 5px rgba(255,50,50,0.9))',
    });
    container.appendChild(el);
    this._overlays.push(el);
    sp._el = el;
  }

  // ── Draw flag ──────────────────────────────────────────────────────────
  const pole = document.createElement('div');
  Object.assign(pole.style, {
    position:'absolute', left: this._flagX+'px',
    top: (top+this._flagY)+'px',
    width:(3*scaleX)+'px', height:(42*scaleY)+'px',
    background:'#aaa', zIndex:'10', pointerEvents:'none',
    boxShadow:'0 0 6px rgba(200,200,200,0.4)',
  });
  container.appendChild(pole);
  this._overlays.push(pole);

  const banner = document.createElement('div');
  Object.assign(banner.style, {
    position:'absolute',
    left: (this._flagX + 3*scaleX)+'px',
    top:  (top + this._flagY)+'px',
    width:(24*scaleX)+'px', height:(16*scaleY)+'px',
    background:'#00ff88', borderRadius:'0 3px 3px 0',
    zIndex:'10', pointerEvents:'none',
    transformOrigin:'left center',
    animation:'flagWave 1.2s ease-in-out infinite',
    boxShadow:'0 0 12px rgba(0,255,136,0.8)',
  });
  container.appendChild(banner);
  this._overlays.push(banner);

  const goalLbl = document.createElement('div');
  Object.assign(goalLbl.style, {
    position:'absolute',
    left:(this._flagX - 8*scaleX)+'px',
    top:(top + this._flagY + 46*scaleY)+'px',
    width:(50*scaleX)+'px',
    fontFamily:"'Press Start 2P',monospace",
    fontSize: Math.round(7*Math.min(scaleX,scaleY))+'px',
    color:'#c8a84b', textAlign:'center', pointerEvents:'none', zIndex:'10',
    textShadow:'0 0 8px rgba(200,168,75,0.9)',
  });
  goalLbl.textContent = 'GOAL';
  container.appendChild(goalLbl);
  this._overlays.push(goalLbl);

  // ── Draw coins ─────────────────────────────────────────────────────────
  for (const c of this._coinPositions) {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:'absolute', left:c.x+'px', top:(top+c.y)+'px',
      width:c.w+'px', height:c.h+'px',
      background:'#FFD700', borderRadius:'50%', zIndex:'11',
      pointerEvents:'none', boxShadow:'0 0 8px rgba(255,215,0,0.8)',
      animation:'coinSpin 1.4s linear infinite',
      border:'2px solid rgba(255,255,255,0.4)',
    });
    container.appendChild(el);
    this._overlays.push(el);
    c._el = el;
  }

  // ── HUD ────────────────────────────────────────────────────────────────
  const hud = document.createElement('div');
  Object.assign(hud.style, {
    position:'fixed', top:'12px', left:'12px',
    fontFamily:"'Press Start 2P',monospace",
    fontSize: Math.round(10*Math.min(scaleX,scaleY))+'px',
    color:'#e8ffe8', zIndex:'100001', pointerEvents:'none',
    textShadow:'0 0 6px rgba(0,0,0,0.8)', lineHeight:'2.2',
  });
  document.body.appendChild(hud);
  this._hud = hud;
  this._updateHud();

  // Title flash
  const titleEl = document.createElement('div');
  Object.assign(titleEl.style, {
    position:'fixed', top:'50%', left:'50%',
    transform:'translate(-50%,-50%)',
    fontFamily:"'Press Start 2P',monospace",
    fontSize: Math.round(18*Math.min(scaleX,scaleY))+'px',
    color:'#00ff88', textAlign:'center', zIndex:'200000',
    textShadow:'0 0 20px rgba(0,255,136,0.9)',
    pointerEvents:'none', transition:'opacity 1s',
  });
  titleEl.innerHTML = `
    <div>CRATER FALLS</div>
    <div style="font-size:0.5em;color:#aaffcc;margin-top:10px">
      W / ↑ jump &nbsp;·&nbsp; A D / ← → move
    </div>`;
  document.body.appendChild(titleEl);
  this._overlays.push(titleEl);
  setTimeout(()=>{ titleEl.style.opacity='0'; }, 2200);
  setTimeout(()=>{ titleEl.remove(); this._overlays=this._overlays.filter(e=>e!==titleEl); }, 3300);

  // ═══════════════════════════════════════════════════════════════════════
  //  PHYSICS LOOP
  // ═══════════════════════════════════════════════════════════════════════
  this._physicsInterval = setInterval(() => {
    if (self._isDead || self._won) return;

    const player = gameEnv.gameObjects.find(o => o instanceof Player);
    if (!player) return;

    const pw = player.width  || 32;
    const ph = player.height || 42;
    let px = player.position.x;
    let py = player.position.y;

    // 1. Move moving platform, capture velocity
    const prevMpX = mp.sx;
    mp.sx += self._movingSpd * self._movingDir;
    if (mp.sx >= self._movingMaxX) { mp.sx = self._movingMaxX; self._movingDir = -1; }
    if (mp.sx <= self._movingMinX) { mp.sx = self._movingMinX; self._movingDir =  1; }
    self._movingPlatVelX = mp.sx - prevMpX;
    if (mp._el) { mp._el.style.left = mp.sx+'px'; mp._lblEl.style.left = mp.sx+'px'; }

    // 2. Horizontal input
    if      (keys.a) self._vx = -MOVE_SPEED;
    else if (keys.d) self._vx =  MOVE_SPEED;
    else             self._vx =  0;

    // 3. Jump
    if ((keys.w || keys.space) && self._onGround && self._canJump) {
      self._vy = JUMP_FORCE;
      self._onGround = false;
      self._canJump  = false;
    }
    if (!keys.w && !keys.space) self._canJump = true;

    // 4. Gravity
    self._vy = Math.min(self._vy + GRAVITY, MAX_FALL);

    // 5. Proposed position
    let nx = px + self._vx;
    let ny = py + self._vy;

    // 6. Platform collision
    const allPlats = [...self._platforms, mp];
    self._onGround     = false;
    self._onMovingPlat = false;

    for (const p of allPlats) {
      const psx=p.sx, psy=p.sy, psw=p.sw, psh=p.sh;

      // Top landing
      if (self._vy >= 0) {
        const prevFeet=py+ph, newFeet=ny+ph;
        const inX = nx+pw*0.2 < psx+psw && nx+pw*0.8 > psx;
        if (inX && prevFeet <= psy+2 && newFeet >= psy) {
          ny=psy-ph; self._vy=0; self._onGround=true;
          if (p.id==='p3_move') self._onMovingPlat=true;
        }
      }

      // Ceiling
      if (self._vy < 0) {
        const platBottom=psy+psh;
        const inX=nx+pw*0.1 < psx+psw && nx+pw*0.9 > psx;
        if (inX && py>=platBottom && ny<platBottom) { ny=platBottom; self._vy=0; }
      }

      // Walls
      const vertOverlap = ny+ph*0.05 < psy+psh && ny+ph*0.95 > psy;
      if (vertOverlap) {
        if (px+pw<=psx+12 && nx+pw>psx)      { nx=psx-pw;   self._vx=0; }
        if (px>=psx+psw-12 && nx<psx+psw)    { nx=psx+psw;  self._vx=0; }
      }
    }

    // 7. Moving platform carry
    if (self._onMovingPlat) nx += self._movingPlatVelX;

    // 8. Fall death
    if (ny > height+20) { self._die('Fell into the crater!'); return; }

    // 9. Spike death — check resolved feet
    const feetY=ny+ph, footL=nx+pw*0.2, footR=nx+pw*0.8;
    for (const sp of self._spikes) {
      if (feetY>=sp.killY && feetY<=sp.y+sp.h+8 && footR>sp.x+2 && footL<sp.x+sp.w-2) {
        self._die('Spiked!'); return;
      }
    }

    // 10. Coin collection
    const pcx=nx+pw/2, pcy=ny+ph/2;
    for (const c of self._coinPositions) {
      if (c.collected) continue;
      if (pcx>c.x && pcx<c.x+c.w && pcy>c.y && pcy<c.y+c.h) {
        c.collected=true;
        c._el.style.opacity='0'; c._el.style.transition='opacity 0.3s';
        setTimeout(()=>c._el.remove(),350);
        self._coins++; self._updateHud();
      }
    }

    // 11. Flag — player must be standing on goal platform near the pole
    const fx=self._flagX+12*scaleX;          // pole centre x
    const fBase=self._flagY+42*scaleY;       // pole base y = goal platform top
    const inFlagX = nx+pw > fx-40*scaleX && nx < fx+40*scaleX;
    const inFlagY = ny+ph > fBase-8*scaleY  && ny+ph < fBase+ph+4*scaleY;
    if (inFlagX && inFlagY && self._onGround) { self._winLevel(); return; }

    // 12. Write position
    player.position.x=nx; player.position.y=ny;
    if      (self._vx<0) player.setAnimation&&player.setAnimation('left');
    else if (self._vx>0) player.setAnimation&&player.setAnimation('right');

  }, 16);
};

// ── HUD ──────────────────────────────────────────────────────────────────────
this._updateHud = () => {
  if (!this._hud) return;
  const hearts='❤️'.repeat(this._lives)+'🖤'.repeat(Math.max(0,3-this._lives));
  this._hud.innerHTML=`
    <div>${hearts}</div>
    <div style="color:#FFD700">🪙 ${this._coins} / ${this._coinPositions.length}</div>
    <div style="color:#aaffcc;font-size:0.7em;margin-top:2px">CRATER FALLS</div>`;
};

// ── Die ───────────────────────────────────────────────────────────────────────
this._die = (reason) => {
  if (this._isDead || this._won) return;
  this._lives--;
  this._updateHud();

  if (this._lives <= 0) {
    this._isDead = true;
    const screen = document.createElement('div');
    Object.assign(screen.style, {
      position:'fixed',inset:'0',background:'rgba(0,0,0,0.92)',
      zIndex:'300000',display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',
      fontFamily:"'Press Start 2P',monospace",color:'#fff',textAlign:'center',
    });
    screen.innerHTML=`
      <div style="font-size:44px;margin-bottom:16px">💀</div>
      <div style="font-size:18px;color:#ff4444;letter-spacing:4px;margin-bottom:12px">GAME OVER</div>
      <div style="font-size:9px;color:#cc6655;line-height:2.2;margin-bottom:24px">${reason}<br>No lives remaining.</div>
      <div style="font-size:8px;color:#444">Restarting...</div>`;
    document.body.appendChild(screen);
    this._deathScreen=screen;
    this._stopAndCleanMusic();
    setTimeout(()=>location.reload(),2500);
    return;
  }

  const flash=document.createElement('div');
  Object.assign(flash.style,{position:'fixed',inset:'0',background:'rgba(255,50,50,0.45)',zIndex:'300000',pointerEvents:'none',transition:'opacity 0.4s'});
  document.body.appendChild(flash);
  setTimeout(()=>{flash.style.opacity='0';},50);
  setTimeout(()=>{flash.remove();},500);

  const player=gameEnv.gameObjects.find(o=>o instanceof Player);
  if (player) { player.position.x=30*scaleX; player.position.y=320*scaleY; }
  this._vy=0; this._vx=0; this._onGround=false;
};

// ── Win ───────────────────────────────────────────────────────────────────────
this._winLevel = () => {
  if (this._won) return;
  this._won = true;
  this._stopAndCleanMusic();

  const screen=document.createElement('div');
  Object.assign(screen.style,{
    position:'fixed',inset:'0',background:'#000',zIndex:'300000',
    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
    fontFamily:"'Press Start 2P',monospace",color:'#fff',textAlign:'center',
    opacity:'0',transition:'opacity 1s',
  });
  const total=this._coinPositions.length;
  const pct=Math.round((this._coins/total)*100);
  const grade=pct===100?'★ PERFECT ★':pct>=70?'GREAT!':pct>=40?'GOOD':'CLEAR';
  screen.innerHTML=`
    <div style="font-size:50px;margin-bottom:18px">🚀</div>
    <div style="font-size:16px;color:#00ff88;letter-spacing:4px;margin-bottom:14px">LEVEL CLEAR!</div>
    <div style="font-size:11px;color:#c8a84b;letter-spacing:2px;margin-bottom:20px">${grade}</div>
    <div style="font-size:9px;color:#88ccaa;line-height:2.6;margin-bottom:8px">
      Coins: ${this._coins} / ${total}<br>
      Lives: ${'❤️'.repeat(this._lives)}
    </div>
    <div style="font-size:8px;color:#334433;margin-top:16px">Proceeding...</div>`;
  document.body.appendChild(screen);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{screen.style.opacity='1';}));
  setTimeout(()=>{
    if      (typeof gameEnv.nextLevel==='function')     gameEnv.nextLevel();
    else if (typeof gameEnv.loadNextLevel==='function') gameEnv.loadNextLevel();
    else if (gameEnv.gameControl?.next)                 gameEnv.gameControl.next();
    else if (typeof gameEnv.loadLevel==='function')     gameEnv.loadLevel('GameLevelFinal');
    else if (gameEnv.gameControl?.loadLevel)            gameEnv.gameControl.loadLevel('GameLevelFinal');
    else window.dispatchEvent(new CustomEvent('loadLevel',{detail:'GameLevelFinal'}));
  },3200);
};

// ── destroy() ─────────────────────────────────────────────────────────────────
this.destroy = () => {
  if (this._physicsInterval) { clearInterval(this._physicsInterval); this._physicsInterval=null; }
  document.removeEventListener('keydown', this._keyDown);
  document.removeEventListener('keyup',   this._keyUp);
  this._stopAndCleanMusic();
  for (const el of this._overlays) { try { el.remove(); } catch(_){} }
  this._overlays=[];
  if (this._styleEl)     { this._styleEl.remove();     this._styleEl=null;     }
  if (this._hud)         { this._hud.remove();         this._hud=null;         }
  if (this._deathScreen) { this._deathScreen.remove(); this._deathScreen=null; }
};

} // end constructor
} // end class

export const gameLevelClasses = [GameLevel3];
export default GameLevel3;