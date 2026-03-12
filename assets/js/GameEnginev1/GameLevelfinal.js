import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';

class GameLevelfinal {
    constructor(gameEnv) {
        const path = gameEnv.path;
        const self = this;

        this.deathTriggered = false;
        this.killerActive = false;
        this.killerElement = null;
        this.deathOverlay = null;

        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/pixelgameimgforgame.jpg",
            pixels: { height: 772, width: 1134 }
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
            right: { row: 1, start: 0, columns: 3 },
            left: { row: 2, start: 0, columns: 3 },
            up: { row: 3, start: 0, columns: 3 },

            downRight: { row: 1, start: 0, columns: 3, rotate: Math.PI / 16 },
            downLeft: { row: 2, start: 0, columns: 3, rotate: -Math.PI / 16 },
            upRight: { row: 3, start: 0, columns: 3, rotate: -Math.PI / 16 },
            upLeft: { row: 3, start: 0, columns: 3, rotate: Math.PI / 16 },

            hitbox: { widthPercentage: 0.2, heightPercentage: 0.2 },
            keypress: { up: 87, left: 65, down: 83, right: 68 }
        };

        const npcData1 = {
            id: 'AI',
            greeting: 'ah',
            src: path + "/images/gamify/chillguy.png",
            SCALE_FACTOR: 8,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 500, y: 300 },
            pixels: { height: 512, width: 384 },
            orientation: { rows: 4, columns: 3 },

            down: { row: 0, start: 0, columns: 3 },
            right: { row: 1, start: 0, columns: 3 },
            left: { row: 2, start: 0, columns: 3 },
            up: { row: 3, start: 0, columns: 3 },

            upRight: { row: 3, start: 0, columns: 3 },
            downRight: { row: 1, start: 0, columns: 3 },
            upLeft: { row: 2, start: 0, columns: 3 },
            downLeft: { row: 0, start: 0, columns: 3 },

            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: [
                'Nice moonwalk. It would be a shame to lose that walk of perfection but too bad. Die. Not all games have a happy ending!!!🔥🔥🔥'
            ],

            reaction: function () {
                if (this.dialogueSystem) {
                    this.showReactionDialogue();
                } else {
                    console.log(this.greeting);
                }
            },

            interact: function () {
                if (this.dialogueSystem) {
                    this.showRandomDialogue();
                }

                // Start kill sequence only once
                if (!self.killerActive && !self.deathTriggered) {
                    self.killerActive = true;
                    setTimeout(() => {
                        self.spawnRandomKiller(gameEnv, path);
                    }, 700);
                }
            }
        };

        this.classes = [
            { class: GameEnvBackground, data: bgData },
            { class: Player, data: playerData },
            { class: Npc, data: npcData1 }
        ];

        /* BUILDER_ONLY_START */
        try {
            setTimeout(() => {
                try {
                    const objs = Array.isArray(gameEnv?.gameObjects) ? gameEnv.gameObjects : [];
                    const summary = objs.map(o => ({
                        cls: o?.constructor?.name || 'Unknown',
                        id: o?.canvas?.id || '',
                        z: o?.canvas?.style?.zIndex || ''
                    }));

                    if (window && window.parent) {
                        window.parent.postMessage({ type: 'rpg:objects', summary }, '*');
                    }
                } catch (_) {}
            }, 250);
        } catch (_) {}

        try {
            if (window && window.parent) {
                try {
                    const rect =
                        (gameEnv && gameEnv.container && gameEnv.container.getBoundingClientRect)
                            ? gameEnv.container.getBoundingClientRect()
                            : { top: gameEnv.top || 0, left: 0 };

                    window.parent.postMessage(
                        { type: 'rpg:env-metrics', top: rect.top, left: rect.left },
                        '*'
                    );
                } catch (_) {
                    try {
                        window.parent.postMessage(
                            { type: 'rpg:env-metrics', top: gameEnv.top, left: 0 },
                            '*'
                        );
                    } catch (__ ) {}
                }
            }
        } catch (_) {}

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

                    window.__overlayBarriers = window.__overlayBarriers || [];

                    try {
                        for (const ob of window.__overlayBarriers) {
                            if (ob && typeof ob.destroy === 'function') {
                                ob.destroy();
                            }
                        }
                    } catch (_) {}

                    window.__overlayBarriers = [];

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

    getPlayerCanvas(gameEnv) {
        if (!Array.isArray(gameEnv?.gameObjects)) return null;

        for (const obj of gameEnv.gameObjects) {
            if (obj?.canvas?.id === 'playerData') return obj.canvas;
            if (obj instanceof Player && obj?.canvas) return obj.canvas;
        }

        return null;
    }

    getContainer(gameEnv) {
        return gameEnv?.container || document.body;
    }

    spawnRandomKiller(gameEnv, path) {
        const container = this.getContainer(gameEnv);
        const playerCanvas = this.getPlayerCanvas(gameEnv);

        if (!container || !playerCanvas) return;

        container.style.position = container.style.position || 'relative';

        const killerSprites = [
            path + "/images/gamify/chillguy.png",
            path + "/images/gamebuilder/sprites/astro.png",
            path + "/images/gamebuilder/sprites/astro.png"
        ];

        const randomSprite = killerSprites[Math.floor(Math.random() * killerSprites.length)];

        const killer = document.createElement('img');
        killer.src = randomSprite;
        killer.alt = "killer";
        killer.style.position = 'absolute';
        killer.style.width = '80px';
        killer.style.height = '80px';
        killer.style.zIndex = '9999';
        killer.style.pointerEvents = 'none';
        killer.style.transition = 'transform 0.1s linear';

        const containerRect = container.getBoundingClientRect();
        const spawnSide = Math.floor(Math.random() * 4);

        let x = 0;
        let y = 0;

        if (spawnSide === 0) {
            x = -90; // left
            y = Math.random() * Math.max(50, containerRect.height - 90);
        } else if (spawnSide === 1) {
            x = containerRect.width + 10; // right
            y = Math.random() * Math.max(50, containerRect.height - 90);
        } else if (spawnSide === 2) {
            x = Math.random() * Math.max(50, containerRect.width - 90);
            y = -90; // top
        } else {
            x = Math.random() * Math.max(50, containerRect.width - 90);
            y = containerRect.height + 10; // bottom
        }

        killer.style.left = `${x}px`;
        killer.style.top = `${y}px`;

        container.appendChild(killer);
        this.killerElement = killer;

        const speed = 5;

        const moveKiller = () => {
            if (this.deathTriggered || !this.killerElement) return;

            const playerRect = playerCanvas.getBoundingClientRect();
            const containerNow = container.getBoundingClientRect();

            const targetX =
                playerRect.left - containerNow.left + (playerRect.width / 2) - 40;
            const targetY =
                playerRect.top - containerNow.top + (playerRect.height / 2) - 40;

            const dx = targetX - x;
            const dy = targetY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 25) {
                this.showDeathMessage(gameEnv);
                return;
            }

            if (distance > 0) {
                x += (dx / distance) * speed;
                y += (dy / distance) * speed;
            }

            killer.style.left = `${x}px`;
            killer.style.top = `${y}px`;

            if (dx < 0) {
                killer.style.transform = 'scaleX(-1)';
            } else {
                killer.style.transform = 'scaleX(1)';
            }

            requestAnimationFrame(moveKiller);
        };

        requestAnimationFrame(moveKiller);
    }

    showDeathMessage(gameEnv) {
        if (this.deathTriggered) return;
        this.deathTriggered = true;

        const container = this.getContainer(gameEnv);

        if (this.killerElement) {
            this.killerElement.style.transform += ' scale(1.2)';
        }

        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.72)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.color = 'white';
        overlay.style.fontFamily = 'monospace';
        overlay.style.textAlign = 'center';

        overlay.innerHTML = `
            <div style="font-size: 56px; font-weight: bold; color: red; margin-bottom: 12px;">
                YOU DIED
            </div>
            <div style="font-size: 22px; max-width: 80%;">
                A random sprite appeared and ended your journey.
            </div>
        `;

        container.appendChild(overlay);
        this.deathOverlay = overlay;

        // Optional: stop movement by blocking keys after death
        if (!window.__deathKeyBlockerAdded) {
            window.__deathKeyBlockerAdded = true;
            document.addEventListener(
                'keydown',
                function (e) {
                    if (document.querySelector('[data-death-screen="true"]')) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                },
                true
            );
        }

        overlay.setAttribute('data-death-screen', 'true');
    }
}

export const gameLevelClasses = [GameLevelfinal];
export default GameLevelfinal;