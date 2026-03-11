import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';

class GameLeveltest {
  constructor(gameEnv) {
    const path = gameEnv.path;
    const width = gameEnv.innerWidth;
    const height = gameEnv.innerHeight;

    // Use a simple background color (no image required)
    const backgroundData = {
      // No src means GameEnvBackground will draw a solid fill
    };

    const spriteSrc = path + '/images/gamebuilder/sprites/pew.png';

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

    const npcData = {
      id: 'meteor',
      greeting: 'Hello! I am a meteor.',
      src: spriteSrc,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 50,
      INIT_POSITION: { x: 500, y: 300 },
      pixels: { height: 320, width: 320 },
      orientation: { rows: 4, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      right: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
      left: { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
      up: { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: ['I am a test meteor.'],
      reaction: function() {
        if (this.dialogueSystem) {
          this.showReactionDialogue();
        } else {
          console.log(this.greeting);
        }
      },
      interact: function() {
        if (this.dialogueSystem) {
          this.showRandomDialogue();
        }
      },
      speed: 2,
      direction: -1,
      update: function() {
        // Use the metadata direction/speed values stored on spriteData
        const direction = this.spriteData?.direction || -1;
        const speed = this.spriteData?.speed || 2;
        const width = this.spriteData?.pixels?.width || 0;

        this.position.x += direction * speed;

        // When the meteor reaches the left boundary, teleport it to the right edge immediately
        // (prevents it from disappearing completely off-screen)
        if (this.position.x < 0) {
          this.position.x = this.gameEnv.innerWidth - width;
          this.spriteData.direction = -1;
        }
      }
    };

    this.classes = [
      { class: GameEnvBackground, data: backgroundData },
      { class: Player, data: playerData },
      { class: Npc, data: npcData }
    ];
  }
}

export default GameLeveltest;
