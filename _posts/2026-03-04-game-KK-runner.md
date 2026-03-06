---
layout: post
codemirror: true
title: Game Runner Examples
description: Learn game development using the GameEngine framework in a contained educational environment. Build game levels, add characters, and create interactive experiences with live code editing and debugging controls.
permalink: /rpg/game

---

## Define Game Runner in a Lesson

Game Runner integrates your GameEngine framework for teaching game development. Define **challenge** and **code** variables, then pass them to the include with a unique **runner_id**.

### Game Runner Architecture

#### HTML Component

- File: `_includes/game-runner.html`
- Reusable component for GameEngine integration
- Automatically creates gameContainer and gameCanvas
- Provides game controls: Start, Pause/Resume, Stop, Reset
- Level selector dropdown for switching between game levels

#### SCSS Styling

- Main file: `_sass/open-coding/forms/game-runner.scss`
- Uses runner-base mixin for consistency
- Game output constrained to 400-600px height for education
- Canvas automatically sized and centered
- Color-coded buttons: Green (Start), Yellow (Pause), Red (Stop)

#### Game Output Area

The game renders in a constrained canvas for educational purposes:

- Min height: 400px
- Max height: 600px
- Canvas max height: 580px
- Black background with accent-colored border
- Automatically centers the canvas
- Scrollable if content exceeds container

#### Controls

- **▶ Start**: Runs the game code and starts the game engine
- **⏸ Pause / ▶ Resume**: Pauses and resumes game execution
- **■ Stop**: Stops the game and clears the canvas
- **↻ Reset**: Resets code to original and stops the game
- **Level Selector**: Dropdown to switch between game levels
- **📋 Copy**: Copy code to clipboard
- **🗑️ Clear**: Clear the editor

#### Code Structure

Your game code must export two things:

1. **GameControl**: Your GameControl class (usually imported)
2. **gameLevelClasses**: Array of game level classes

```javascript
import GameControl from '/assets/js/GameEnginev1/essentials/GameControl.js';
import GameLevelBasic from '/assets/js/GameEnginev1/GameLevelBasic.js';

export const GameControl = GameControl;
export const gameLevelClasses = [GameLevelBasic];
```

---

## Basic Game: Background, Custom Player

{% capture challenge1 %}
Run the basic game. Use WASD or arrow keys to move Chill Guy around the desert. Walk up to R2D2 to trigger an interaction!
{% endcapture %}

{% capture code1 %}
// Import for GameRunner
import GameControl from '/assets/js/GameEnginev1/essentials/GameControl.js';
// Level Code
import GameEnvBackground from '/assets/js/GameEnginev1/essentials/GameEnvBackground.js';
import Player from '/assets/js/GameEnginev1/essentials/Player.js';
import Npc from '/assets/js/GameEnginev1/essentials/Npc.js';
import Barrier from '/assets/js/GameEnginev1/essentials/Barrier.js';

class GameLevelCustom {
    constructor(gameEnv) {
        const path = gameEnv.path;
        const width = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/grass_place.jpg",
            pixels: { height: 360, width: 639 }
        };

        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 5,
            STEP_FACTOR: 1000,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 100, y: 300 },
            pixels: { height: 770, width: 513 },
            orientation: { rows: 4, columns: 4 },
            down: { row: 0, start: 0, columns: 3 },
            downRight: { row: 1, start: 0, columns: 3, rotate: Math.PI/16 },
            downLeft: { row: 0, start: 0, columns: 3, rotate: -Math.PI/16 },
            left: { row: 1, start: 0, columns: 3 },
            right: { row: 2, start: 0, columns: 3 },
            up: { row: 3, start: 0, columns: 3 },
            upLeft: { row: 2, start: 0, columns: 3, rotate: Math.PI/16 },
            upRight: { row: 3, start: 0, columns: 3, rotate: -Math.PI/16 },
            hitbox: { widthPercentage: 0.2, heightPercentage: 0.2 },
            keypress: { up: 38, left: 37, down: 40, right: 39 }
            };

        const npcData1 = {
            id: 'Chill',
            greeting: 'I\'m a chill guy',
            src: path + "/images/gamify/chillguy.png",
            SCALE_FACTOR: 8,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 500, y: 300 },
            pixels: { height: 512, width: 384 },
            orientation: { rows: 4, columns: 3 },
            down: { row: 0, start: 0, columns: 3 },
            right: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
            left: { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
            up: { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
            upRight: { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
            downRight: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
            upLeft: { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
            downLeft: { row: 0, start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: ['I\'m a chill guy'],
            reaction: function() { if (this.dialogueSystem) { this.showReactionDialogue(); } else { console.log(this.greeting); } },
            interact: function() { if (this.dialogueSystem) { this.showRandomDialogue(); } }
        };
        const dbarrier_1 = {
            id: 'dbarrier_1', x: 23, y: 108, width: 258, height: 84, visible: true /* BUILDER_DEFAULT */,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };
this.classes = [      { class: GameEnvBackground, data: bgData },
      { class: Player, data: playerData },
      { class: Npc, data: npcData1 },
      { class: Barrier, data: dbarrier_1 }
];

        /* BUILDER_ONLY_START */
        // Post object summary to builder (debugging visibility of NPCs/walls)
        try {
            setTimeout(() => {
                try {
                    const objs = Array.isArray(gameEnv?.gameObjects) ? gameEnv.gameObjects : [];
                    const summary = objs.map(o => ({ cls: o?.constructor?.name || 'Unknown', id: o?.canvas?.id || '', z: o?.canvas?.style?.zIndex || '' }));
                    if (window && window.parent) window.parent.postMessage({ type: 'rpg:objects', summary }, '*');
                } catch (_) {}
            }, 250);
        } catch (_) {}
        // Report environment metrics (like top offset) to builder
        try {
            if (window && window.parent) {
                try {
                    const rect = (gameEnv && gameEnv.container && gameEnv.container.getBoundingClientRect) ? gameEnv.container.getBoundingClientRect() : { top: gameEnv.top || 0, left: 0 };
                    window.parent.postMessage({ type: 'rpg:env-metrics', top: rect.top, left: rect.left }, '*');
                } catch (_) {
                    try { window.parent.postMessage({ type: 'rpg:env-metrics', top: gameEnv.top, left: 0 }, '*'); } catch (__){ }
                }
            }
        } catch (_) {}
        // Listen for in-game wall visibility toggles from builder
        try {
            window.addEventListener('message', (e) => {
                if (!e || !e.data) return;
                if (e.data.type === 'rpg:toggle-walls') {
                    const show = !!e.data.visible;
                    if (Array.isArray(gameEnv?.gameObjects)) {
                        for (const obj of gameEnv.gameObjects) {
                            if (obj instanceof Barrier) {
                                obj.visible = show;
                            }
                        }
                    }
                } else if (e.data.type === 'rpg:set-drawn-barriers') {
                    const arr = Array.isArray(e.data.barriers) ? e.data.barriers : [];
                    // Track overlay barriers locally so we can remove/replace
                    window.__overlayBarriers = window.__overlayBarriers || [];
                    // Remove previous overlay barriers
                    try {
                        for (const ob of window.__overlayBarriers) {
                            if (ob && typeof ob.destroy === 'function') ob.destroy();
                        }
                    } catch (_) {}
                    window.__overlayBarriers = [];
                    // Add new overlay barriers
                    for (const bd of arr) {
                        try {
                            const data = {
                                id: bd.id,
                                x: bd.x,
                                y: bd.y,
                                width: bd.width,
                                height: bd.height,
                                visible: !!bd.visible,
                                hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
                                fromOverlay: true
                            };
                            const bobj = new Barrier(data, gameEnv);
                            gameEnv.gameObjects.push(bobj);
                            window.__overlayBarriers.push(bobj);
                        } catch (_) {}
                    }
                }
            });
        } catch (_) {}
        /* BUILDER_ONLY_END */
    }
}

## Combine Game Levels: Connected levels via ESC key

{% capture challenge2 %}
Run the basic game. Use WASD or arrow keys to move Chill Guy around the desert. Walk up to R2D2 to trigger an interaction!
{% endcapture %}

{% capture code2 %}
import GameControl from "/assets/js/GameEnginev1/essentials/GameControl.js";
import GameLevelWater from "/assets/js/GameEnginev1/GameLevelWater.js";
import GameLevelParallaxFish from "/assets/js/GameEnginev1/GameLevelParallaxFish.js";
export const gameLevelClasses = [GameLevelWater, GameLevelParallaxFish];
export { GameControl };
{% endcapture %}

{% include game-runner.html
   runner_id="game2"
   challenge=challenge2
   code=code2
%}

## Best Practices

### Import Structure

Always import necessary GameEngine modules:

```javascript
import GameControl from '/assets/js/GameEnginev1/essentials/GameControl.js';
import GameLevelBasic from '/assets/js/GameEnginev1/GameLevelBasic.js';
```

### Export Requirements

Your code must export:

```javascript
export { GameControl };
export const gameLevelClasses = [GameLevelBasic, GameLevelWater];
```

### Level Class Structure

Each level class needs a constructor that defines:

- Background data
- Player/character data
- NPC data
- Collectible items
- The `this.classes` array with all game objects

### Game Controls

- **WASD or Arrow Keys**: Move the player
- **Space**: Jump (if implemented in level)
- **E or Enter**: Interact with NPCs
- **Esc**: Pause menu (if implemented)

### Debugging

Use the game controls to debug:

- **Pause**: Stop to examine game state
- **Stop**: Clear and restart fresh
- **Reset**: Restore original code
- **Console**: Check browser console (F12) for errors

---

## Teaching Tips

### Progressive Learning Path

1. **Run Existing Levels**: Start with GameLevelBasic
2. **Multi-Level Games**: Add multiple levels with selector
3. **Modify Levels**: Change player position, speed, sprites
4. **Custom Levels**: Create entirely new levels
5. **Add Interactions**: Add NPCs with dialogue
6. **Game Mechanics**: Implement collectibles, enemies, physics

### Common Modifications

**Change Player Start Position:**

```javascript
INIT_POSITION: { x: 200, y: 300 }
```

**Adjust Player Speed:**

```javascript
STEP_FACTOR: 500  // Faster movement
```

**Different Background:**

```javascript
src: path + "/images/gamify/water.png"
```

### Game Development Concepts

The GameEngine teaches:

- **Object-Oriented Programming**: Classes, inheritance, composition
- **Game Loop**: Update and render cycles
- **Sprite Animation**: Frame-based animation
- **Collision Detection**: Hitboxes and interaction
- **Event Handling**: Keyboard input, user interactions
- **State Management**: Game state, level transitions

### Troubleshooting

**Game won't start:**

- Check console for import errors
- Verify all import paths start with `/assets/`
- Ensure exports are correct

**Player not moving:**

- Check keypress configuration
- Verify STEP_FACTOR is set
- Check hitbox doesn't block movement

**Canvas is blank:**

- Verify background image path
- Check canvas dimensions
- Look for JavaScript errors in console
