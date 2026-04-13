import GameEnvBackground from '/assets/js/GameEnginev1/essentials/GameEnvBackground.js';
import Player from '/assets/js/GameEnginev1/essentials/Player.js';
import Npc from '/assets/js/GameEnginev1/essentials/Npc.js';
import Barrier from '/assets/js/GameEnginev1/essentials/Barrier.js';
import AiNpc from '/assets/js/GameEnginev1.1/essentials/AiNpc.js';
import Coin from '/assets/js/GameEnginev1.1/Coin.js';

class GameLevelHunt {
    constructor(gameEnv) {
        const path = gameEnv.path;
        const width = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;
        const floorY = Math.floor(height * 0.72);

        // 1. GLOBAL TRACKER
        this.state = { currentStep: 0 };

        // 2. IMPROVED LOGIC HELPER
        const handleNpcInteraction = (npcInstance, requiredStep, nextStep) => {
            if (this.state.currentStep === requiredStep) {
                this.state.currentStep = nextStep;
                npcInstance.showRandomDialogue?.();
            } else if (this.state.currentStep >= nextStep) {
                // If already passed this step, show the dialogue normally
                npcInstance.showRandomDialogue?.();
            } else {
                // STRICT ORDER ENFORCEMENT
                if (npcInstance.dialogueSystem) {
                    const original = npcInstance.dialogues;
                    npcInstance.dialogues = ["Stop! You need to find the previous clue before I can help you."];
                    npcInstance.showRandomDialogue();
                    setTimeout(() => { npcInstance.dialogues = original; }, 2000);
                }
            }
        };

        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/new_gamebg.jpg",
            pixels: { height: 720, width: 1280 }
        };

        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 5,
            STEP_FACTOR: 1000,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 100, y: floorY - Math.floor(height / 5) },
            pixels: { height: 770, width: 513 },
            orientation: { rows: 4, columns: 4 },
            down: { row: 0, start: 0, columns: 3 },
            right: { row: 1, start: 0, columns: 3 },
            left: { row: 2, start: 0, columns: 3 },
            up: { row: 3, start: 0, columns: 3 },
            hitbox: { widthPercentage: 0, heightPercentage: 0 },
            keypress: { up: 87, left: 65, down: 83, right: 68 }
        };

        // Shared config for standard NPCs
        const pewSpriteConfig = {
            pixels: { height: 320, width: 320 },
            orientation: { rows: 4, columns: 4 },
            down: { row: 0, start: 0, columns: 3 },
            right: { row: 1, start: 0, columns: 3 },
            left: { row: 2, start: 0, columns: 3 },
            up: { row: 3, start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 }
        };

        const chillGuyConfig = {
            pixels: { height: 512, width: 384 },
            orientation: { rows: 4, columns: 3 },
            down: { row: 0, start: 0, columns: 3 },
            right: { row: 1, start: 0, columns: 3 },
            left: { row: 2, start: 0, columns: 3 },
            up: { row: 3, start: 0, columns: 3 }
        };

        // --- NPC DEFINITIONS ---

        // CABINET 1 (Step 0)
        const npcData1 = {
            ...chillGuyConfig,
            id: 'Cabinet',
            greeting: "", // Clear greeting to force interact logic
            src: path + "/images/gamify/chillguy.png",
            SCALE_FACTOR: 8,
            INIT_POSITION: { x: width * 0.16, y: height * 0.5 },
            dialogues: ['Step 1: CSSE 1,2 prepares students for the AP pathway using JavaScript.'],
            interact: function() { handleNpcInteraction(this, 0, 1); }
        };

        // CABINET 2 (Step 0 - Alternative)
        const npcData4 = {
            ...chillGuyConfig,
            id: 'Cabinet2',
            greeting: "", 
            src: path + "/images/gamify/chillguy.png",
            SCALE_FACTOR: 8,
            INIT_POSITION: { x: width * 0.16, y: height * 0.25 },
            dialogues: ['Step 1: CSSE 1,2 prepares students for the AP pathway using JavaScript.'],
            interact: function() { handleNpcInteraction(this, 0, 1); }
        };

        // SHIP (Step 1 -> 2)
        const npcData2 = {
            ...pewSpriteConfig,
            id: 'Ship',
            greeting: "",
            src: path + "/images/gamebuilder/sprites/pew.png",
            SCALE_FACTOR: 8,
            INIT_POSITION: { x: width * 0.36, y: height * 0.2 },
            dialogues: ['Step 2: You will engage in engineering skills and peer collaboration.'],
            interact: function() { handleNpcInteraction(this, 1, 2); }
        };

        // DRAWER (Step 2 -> 3)
        const npcData6 = {
            ...pewSpriteConfig,
            id: 'Drawer',
            greeting: "",
            src: path + "/images/gamebuilder/sprites/pew.png",
            SCALE_FACTOR: 8,
            INIT_POSITION: { x: width * 0.36, y: height * 0.5 },
            dialogues: ['Step 3: This course raises awareness of software engineering across fields.'],
            interact: function() { handleNpcInteraction(this, 2, 3); }
        };

        // DRAWER 2 (Step 3 -> 4)
        const npcData7 = {
            ...pewSpriteConfig,
            id: 'Drawer2',
            greeting: "",
            src: path + "/images/gamebuilder/sprites/pew.png",
            SCALE_FACTOR: 8,
            INIT_POSITION: { x: width * 0.36, y: height * 0.8 },
            dialogues: ['Step 4: You can earn Articulated College Credit through Mira Costa.'],
            interact: function() { handleNpcInteraction(this, 3, 4); }
        };

        // DRAWER 3 (Step 4 -> 5)
        const npcData8 = {
            ...pewSpriteConfig,
            id: 'Drawer3',
            greeting: "",
            src: path + "/images/gamebuilder/sprites/pew.png",
            SCALE_FACTOR: 8,
            INIT_POSITION: { x: width * 0.5, y: height * 0.8 },
            dialogues: ["Final Step: Tools include Linux, VSCode, and GitHub. Mission Complete!"],
            interact: function() { handleNpcInteraction(this, 4, 5); }
        };

        const npcData3 = {
            id: "ChillDude",
            greeting: "Beep boop. I'm R2-D2!",
            src: path + "/images/gamify/r2_idle.png",
            SCALE_FACTOR: 4,
            ANIMATION_RATE: 6,
            pixels: { height: 223, width: 505 },
            INIT_POSITION: { x: width * 0.58, y: height * 0.27 },
            orientation: { rows: 1, columns: 1 },
            down: { row: 0, start: 0, columns: 1 },
            up: { row: 0, start: 0, columns: 1 },
            left: { row: 0, start: 0, columns: 1 },
            right: { row: 0, start: 0, columns: 1 },
            hitbox: { widthPercentage: 0.2, heightPercentage: 0.3 },
            expertise: "coding",
            chatHistory: [],
            knowledgeBase: {
                history: [{ question: "What is this game?", answer: "A game to help students learn about their class." }]
            },
            interact: function() { AiNpc.showInteraction(this); }
        };

        const coinData = {
            id: 'coin-prologue',
            INIT_POSITION: { x: 0.18, y: 0.58 },
            width: 40, height: 70,
            color: '#FFD700',
            value: 1
        };

        this.classes = [
            { class: GameEnvBackground, data: bgData },
            { class: Player, data: playerData },
            { class: Npc, data: npcData1 },
            { class: Npc, data: npcData4 }, // Cabinet 2 added back here
            { class: Npc, data: npcData2 },
            { class: Npc, data: npcData6 },
            { class: Npc, data: npcData7 },
            { class: Npc, data: npcData8 },
            { class: AiNpc, data: npcData3 },
            { class: Coin, data: coinData }
        ];
    }
}

export const gameLevelClasses = [GameLevelHunt];
export default GameLevelHunt;