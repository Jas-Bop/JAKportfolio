import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';

class GameLeveltest {
  constructor(gameEnv) {
    const path = gameEnv.path;
    const width = gameEnv.innerWidth;
    const height = gameEnv.innerHeight;

    // Use a simple background image
    const backgroundData = {
      name: "custom_bg",
      src: path + "/images/gamify/bg/space.jpeg",
      pixels: { height: 772, width: 1134 }
    };

    const spriteSrc = path + '/images/gamebuilder/sprites/pew.png';
    const alienSpriteSrc = path + '/images/gamebuilder/sprites/ufos.png';

    const spawnY = (avoidY = null, avoidRadius = 80) => {
      // Keep meteors within the visible vertical range
      const padding = 50;
      let y;
      let attempts = 0;

      do {
        y = Math.floor(Math.random() * (height - padding * 2)) + padding;
        attempts += 1;
      } while (avoidY !== null && Math.abs(y - avoidY) < avoidRadius && attempts < 10);

      return y;
    };

    let meteorCounter = 0;
    let _respawnInProgress = false;
    let _survivalTimeout = null;
    let _survivedMessageShown = false;

    const resetSurvivalTimer = () => {
      if (_survivedMessageShown) return;
      if (_survivalTimeout) {
        clearTimeout(_survivalTimeout);
      }
      _survivalTimeout = setTimeout(() => {
        // Show the ‘You have done well…’ message once
        if (_survivedMessageShown) return;
        _survivedMessageShown = true;

        const message = document.createElement('div');
        Object.assign(message.style, {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#00FF00',
          padding: '25px',
          borderRadius: '12px',
          fontFamily: "'Press Start 2P', sans-serif",
          fontSize: '18px',
          textAlign: 'center',
          zIndex: '99999',
          border: '3px solid #00FF00',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
          width: '360px'
        });
        message.innerHTML = `
          <div style="margin-bottom: 15px; font-size: 22px;">✅ You have done well</div>
          <div style="font-size: 16px;">You may pass.</div>
        `;
        document.body.appendChild(message);

        setTimeout(() => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, 8000);
      }, 60000);
    };

    const clearMeteorsExceptBase = () => {
      // Keep one meteor as the “base” meteor and remove the rest.
      const baseMeteor = gameEnv.gameObjects.find(obj => obj.spriteData?.isMeteor && obj.spriteData?.isBaseMeteor);
      gameEnv.gameObjects.slice().forEach(obj => {
        if (obj.spriteData?.isMeteor && !obj.spriteData?.isBaseMeteor) {
          if (typeof obj.destroy === 'function') obj.destroy();
        }
      });

      if (baseMeteor) {
        baseMeteor.position.x = width + 200;
        baseMeteor.position.y = spawnY();
        if (baseMeteor.spriteData) {
          baseMeteor.spriteData.direction = -1;
        }
      }
    };

    const createMeteorData = (startX, startY, isBase = false) => {
      meteorCounter += 1;
      return {
        id: `meteor-${meteorCounter}`,
        greeting: 'I am a meteor.',
        src: spriteSrc,
        SCALE_FACTOR: 16,
        ANIMATION_RATE: 50,
        INIT_POSITION: { x: startX, y: startY },
        pixels: { height: 160, width: 160 },
        orientation: { rows: 4, columns: 4 },
        down: { row: 0, start: 0, columns: 3 },
        right: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
        left: { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
        up: { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
        hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
        isMeteor: true,
        isBaseMeteor: isBase,
        ignoreCollision: true,
        collisionDelay: 30,
        dialogues: ['I am a test meteor.'],
        reaction: () => {
          if (_respawnInProgress) return;

          const player = gameEnv.gameObjects.find(obj => obj instanceof Player);
          if (!player) return;

          _respawnInProgress = true;

          clearMeteorsExceptBase();

          const deathMessage = document.createElement('div');
          Object.assign(deathMessage.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#FF0000',
            padding: '25px',
            borderRadius: '12px',
            fontFamily: "'Press Start 2P', sans-serif",
            fontSize: '18px',
            textAlign: 'center',
            zIndex: '99999',
            border: '3px solid #FF0000',
            boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
            width: '340px'
          });
          deathMessage.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 24px;">☠️ YOU DIED ☠️</div>
            <div style="margin-bottom: 10px;">The meteor hit you!</div>
            <div style="font-size: 14px;">Respawning in 2 seconds...</div>
          `;
          document.body.appendChild(deathMessage);

          if (_survivalTimeout) {
            clearTimeout(_survivalTimeout);
            _survivalTimeout = null;
          }

          setTimeout(() => {
            if (deathMessage.parentNode) {
              deathMessage.parentNode.removeChild(deathMessage);
            }

            if (player.position) {
              player.position.x = _respawnPosition.x;
              player.position.y = _respawnPosition.y;
            }
            if (player.velocity) {
              player.velocity.x = 0;
              player.velocity.y = 0;
            }
            if (player.pressedKeys) {
              player.pressedKeys = {};
            }

            _respawnInProgress = false;

            // Restart the survival timer now that player is alive again
            resetSurvivalTimer();
          }, 2000);
        },
        interact: function() {
          if (this.dialogueSystem) {
            this.showRandomDialogue();
          }
        },
        speed: 10,
        direction: -1,
        update: function() {
          // Initialize collision grace settings (once)
          if (this.collisionDelay === undefined) {
            this.collisionDelay = this.collisionDelay ?? this.spriteData?.collisionDelay ?? 30;
            this.ignoreCollision = this.ignoreCollision ?? this.spriteData?.ignoreCollision ?? true;
          }

          // Reduce collision grace timer; this prevents instant death on spawn
          if (this.collisionDelay > 0) {
            this.collisionDelay -= 1;
            if (this.collisionDelay === 0) {
              this.ignoreCollision = false;
              if (this.spriteData) {
                this.spriteData.ignoreCollision = false;
              }
            }
          }

          const direction = this.spriteData?.direction || -1;
          const speed = this.spriteData?.speed || 2;
          const width = this.spriteData?.pixels?.width || 0;

          this.position.x += direction * speed;

          // When the meteor reaches the left boundary, teleport it to the right edge immediately
          // (prevents it from disappearing completely off-screen)
          if (this.position.x < 0) {
            this.position.x = this.gameEnv.innerWidth + width;
            this.position.y = spawnY();
            this.spriteData.direction = -1;
          }
        }
      };
    };

    const spawnMeteors = (count = 2) => {
      const player = gameEnv.gameObjects.find(obj => obj instanceof Player);
      const avoidY = player ? player.position.y : null;
      const avoidRadius = player ? Math.max(player.height, player.width) * 1.5 : 80;

      // Ensure existing meteors don't instantly kill the player when we summon more
      gameEnv.gameObjects.forEach(obj => {
        if (obj?.spriteData?.isMeteor) {
          obj.ignoreCollision = true;
          obj.collisionDelay = 30;
          // Move existing meteors away to avoid overlap with player
          obj.position.x = width + 200;
          obj.position.y = spawnY(avoidY, avoidRadius);
        }
      });

      for (let i = 0; i < count; i++) {
        // Spawn off the right edge, far enough to avoid instant collision
        const minStartX = width + 200;
        const safeStartX = player ? Math.max(minStartX, player.position.x + player.width + 200) : minStartX;
        const startX = safeStartX + (i * 80);
        const meteorData = createMeteorData(startX, spawnY(avoidY, avoidRadius));
        const meteor = new Npc(meteorData, gameEnv);
        gameEnv.gameObjects.push(meteor);
      }
    };

    const playerData = {
      id: 'player-test',
      greeting: 'Use WASD to move',
      src: spriteSrc,
      SCALE_FACTOR: 8,
      STEP_FACTOR: 1000,
      ANIMATION_RATE: 50,
      INIT_POSITION: { x: 50, y: height - height / 8 },
      pixels: { height: 320, width: 320 },
      orientation: { rows: 4, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      right: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
      left: { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
      up: { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.2, heightPercentage: 0.2 },
      keypress: { up: 87, left: 65, down: 83, right: 68 }
    };

    // Prevent repeated death triggers while the player is respawning
    const _respawnPosition = { ...playerData.INIT_POSITION };

    const meteorData = createMeteorData(width + 200, spawnY(), true);

    const alienData = {
      id: 'alien',
      greeting: 'Talk to me and I will call the meteors.',
      src: alienSpriteSrc,
      SCALE_FACTOR: 5,
      ANIMATION_RATE: 50,
      INIT_POSITION: { x: 0.9, y: 0.5 },
      // UFO sprite sheet (4 rows x 3 columns) - show just the first frame
      orientation: { rows: 4, columns: 3 },
      down: { row: 0, start: 0, columns: 1 },
      right: { row: 0, start: 0, columns: 1 },
      left: { row: 0, start: 0, columns: 1 },
      up: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.25, heightPercentage: 0.25 },
      dialogues: [
        'I can call more meteors if you like.',
        'Ready for some falling rocks?'
      ],
      interact: function() {
        if (this.dialogueSystem) {
          this.showRandomDialogue();
        }
        // Summon 2-3 new meteors at random heights
        spawnMeteors(2 + Math.floor(Math.random() * 2));

        // Start/refresh the survival timer (only starts after talking to the alien)
        resetSurvivalTimer();
      }
    };

    this.classes = [
      { class: GameEnvBackground, data: backgroundData },
      { class: Player, data: playerData },
      { class: Npc, data: meteorData },
      { class: Npc, data: alienData }
    ];

  }
}


export default GameLeveltest;
