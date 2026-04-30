
import GameEnvBackground from '/assets/js/GameEnginev1/essentials/GameEnvBackground.js';
import Player from '/assets/js/GameEnginev1/essentials/Player.js';
import Npc from '/assets/js/GameEnginev1/essentials/Npc.js';
import Coin from '/assets/js/GameEnginev1.1/Coin.js';

class GameLeveltest {
  constructor(gameEnv) {
    const path = gameEnv.path;
    const width = gameEnv.innerWidth;
    const height = gameEnv.innerHeight;

    // ── Background ─────────────────────────
    const backgroundData = {
      name: "custom_bg",
      src: path + "/images/gamify/bg/space.jpeg",
      pixels: { height: 772, width: 1134 }
    };

    const spriteSrc = path + '/images/gamebuilder/sprites/pew.png';
    const alienSpriteSrc = path + '/images/gamebuilder/sprites/ufos.png';
    const meteorSpriteSrc = path + '/images/gamebuilder/sprites/meteorforgame.jpg';

    // ── Meteor Pool ────────────────────────
    const meteorPool = [];
    const POOL_SIZE = 5;

    const spawnY = () => {
      const paddingTop = 80;
      const paddingBottom = 150;
      const usableHeight = height - paddingTop - paddingBottom;
      return Math.floor(Math.random() * usableHeight) + paddingTop;
    };

    const hideMeteor = (m) => {
      if (m.canvas) m.canvas.style.display = 'none';
      m.ignoreCollision = true;
      if (m.spriteData) m.spriteData.meteorActive = false;
    };

    const showMeteor = (m, x, y) => {
      m.position.x = x;
      m.position.y = y;
      m.ignoreCollision = false;
      if (m.spriteData) m.spriteData.meteorActive = true;
      if (m.canvas) m.canvas.style.display = 'block';
    };

    const meteorUpdate = function() {
      if (!this.spriteData?.meteorActive) return;

      this.position.x -= 6;

      if (this.position.x < -100) {
        this.position.x = gameEnv.innerWidth + 100;
        this.position.y = spawnY();
      }
    };

    const makeMeteorData = (i) => ({
      id: `meteor-${i}`,
      src: meteorSpriteSrc,
      SCALE_FACTOR: 10,
      INIT_POSITION: { x: 0, y: 0 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.2, heightPercentage: 0.2 },
      isMeteor: true,
      meteorActive: false,
      update: meteorUpdate
    });

    // ── Player ────────────────────────────
    const playerData = {
      id: 'player-test',
      src: spriteSrc,
      SCALE_FACTOR: 8,
      STEP_FACTOR: 600,
      ANIMATION_RATE: 50,
      INIT_POSITION: { x: 100, y: height / 2 },
      pixels: { height: 320, width: 320 },
      orientation: { rows: 4, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      right: { row: 1, start: 0, columns: 3 },
      left: { row: 2, start: 0, columns: 3 },
      up: { row: 3, start: 0, columns: 3 },
      keypress: { up: 87, left: 65, down: 83, right: 68 }
    };

    // ── Alien ─────────────────────────────
    const alienData = {
  id: 'alien',
  greeting: 'Talk to me and I will call the meteors.',
  src: alienSpriteSrc,
  SCALE_FACTOR: 5,
  ANIMATION_RATE: 50,
  INIT_POSITION: { x: 0.9, y: 0.5 },

  // ✅ RESTORED FULL SPRITE CONFIG
  orientation: { rows: 4, columns: 3 },

  down:  { row: 0, start: 0, columns: 1 },
  right: { row: 0, start: 0, columns: 1 },
  left:  { row: 0, start: 0, columns: 1 },
  up:    { row: 0, start: 0, columns: 1 },

  hitbox: { widthPercentage: 0.25, heightPercentage: 0.25 },

  dialogues: [
    'I can call more meteors if you like.',
    'Ready for some falling rocks?'
  ],

  interact: function () {
    if (this.dialogueSystem) this.showRandomDialogue();

    meteorPool.forEach((m, i) => {
      showMeteor(m, width + i * 120, spawnY());
    });
  }
};

    // ── Coin ──────────────────────────────
    const coinData = {
      id: 'coin-test',
      INIT_POSITION: { x: 0.5, y: 0.2 },
      width: 40,
      height: 40,
      color: '#FFD700'
    };

    // ── Classes ───────────────────────────
    const meteorClasses = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      meteorClasses.push({ class: Npc, data: makeMeteorData(i) });
    }

    this.classes = [
      { class: GameEnvBackground, data: backgroundData },
      { class: Player, data: playerData },
      { class: Coin, data: coinData },
      ...meteorClasses,
      { class: Npc, data: alienData }
    ];

    // ── Initialize ────────────────────────
    this.initialize = () => {
      const found = gameEnv.gameObjects.filter(obj => obj?.spriteData?.isMeteor);
      meteorPool.push(...found);
      meteorPool.forEach(m => hideMeteor(m));

      // ── Flappy Gravity ─────────────────
      const player = gameEnv.gameObjects.find(obj => obj instanceof Player);
      if (!player) return;

      let vy = 0;
      const gravity = 0.8;

      function flap() {
        vy = -12;
      }

      const _originalUpdate = player.update.bind(player);

      player.update = function () {
        const wDown = this.pressedKeys?.[87];
        if (wDown && !this._wWasDown) {
          flap();
        }
        this._wWasDown = !!wDown;

        const maxFall = 14;
        vy = Math.min(vy + gravity, maxFall);

        this.velocity.y = 0;
        this.position.y += vy;

        // floor
        const floor = gameEnv.innerHeight - this.height;
        if (this.position.y >= floor) {
          this.position.y = floor;
          vy = 0;
        }

        // ceiling
        if (this.position.y < 0) {
          this.position.y = 0;
          vy = 0;
        }

        _originalUpdate();
        this.velocity.y = 0;
      };
    };
  }
}

export default GameLeveltest;