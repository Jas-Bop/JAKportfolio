import GameControl from './GameControl.js';
import GameUI from './GameUI.js';
import Leaderboard from '/assets/js/GameEnginev1.1/essentials/Leaderboard.js';

class Game {
    constructor(environment) {
        this.environment = environment;
        this.gameName = environment.gameName || 'TestGame';
        this.path = environment.path;
        this.gameContainer = environment.gameContainer;
        this.gameCanvas = environment.gameCanvas;
        this.pythonURI = environment.pythonURI;
        this.javaURI = environment.javaURI;
        this.fetchOptions = environment.fetchOptions;
        this.uid = null;
        this.id = null;
        this.gname = null;
        this.stats = {
            coinsCollected: 0
        };
        this.leaderboard = null;

        this.initUser();
        const gameLevelClasses = environment.gameLevelClasses;
        this.gameControl = new GameControl(this, gameLevelClasses);
        
        // Initialize GameUI if configuration is provided
        if (environment.gameUI) {
            this.gameUI = new GameUI(this, environment.gameUI);
            this.gameUI.init();
        }

        this.ensureLeaderboardUI();
        this.updateLeaderboard();
        
        this.gameControl.start();
        this._ensureActiveScoreManager();
    }

    static main(environment) {
        return new Game(environment);
    }

    initUser() {
        const pythonURL = this.pythonURI + '/api/id';
        fetch(pythonURL, this.fetchOptions)
            .then(response => {
                if (response.status !== 200) {
                    console.error("HTTP status code: " + response.status);
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.uid = data.uid;

                const javaURL = this.javaURI + '/rpg_answer/person/' + this.uid;
                return fetch(javaURL, this.fetchOptions);
            })
            .then(response => {
                if (!response || !response.ok) {
                    throw new Error(`Spring server response: ${response?.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.id = data.id;
            })
            .catch(error => {
                console.error("Error:", error);
            });
    }

    ensureLeaderboardUI() {
        if (!this.leaderboard) {
            this.leaderboard = new Leaderboard(this.gameControl, {
                gameName: this.environment.gameName || 'TestGame',
                initiallyHidden: false
            });
        }
        this.applyLeaderboardHUDStyle();
        return this.leaderboard;
    }

    applyLeaderboardHUDStyle() {
        const container = document.getElementById('leaderboard-container');
        const header = document.querySelector('#leaderboard-container .leaderboard-header');
        const saveButton = document.getElementById('leaderboard-save-score');
        const toggleButton = document.getElementById('toggle-leaderboard');
        const backButton = document.getElementById('back-btn');
        const content = document.getElementById('leaderboard-content');
        const preview = document.getElementById('leaderboard-preview');
        const title = document.getElementById('leaderboard-title');

        if (!container || !header) return;

        Object.assign(container.style, {
            position: 'fixed',
            top: '75px',
            right: '10px',
            left: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            color: '#fff',
            borderRadius: '8px',
            border: '2px solid #FFD700',
            zIndex: '100000',
            minWidth: '180px',
            boxShadow: 'none'
        });

        Object.assign(header.style, {
            padding: '10px 14px',
            display: 'block'
        });

        if (title) {
            title.style.display = 'block';
            title.style.fontSize = '12px';
            title.style.fontWeight = '700';
            title.style.color = '#FFD700';
            title.style.marginBottom = '6px';
        }

        if (preview) {
            preview.style.display = 'block';
            preview.style.fontSize = '12px';
            preview.style.color = '#fff';
        }

        if (saveButton) {
            Object.assign(saveButton.style, {
                marginTop: '8px',
                marginRight: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                background: '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            });
        }

        if (toggleButton) {
            toggleButton.style.display = 'inline-block';
            toggleButton.textContent = this.leaderboard?.isOpen ? 'Hide Scores' : 'View Scores';
            Object.assign(toggleButton.style, {
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                background: '#ffffff',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            });
        }

        if (backButton) {
            backButton.style.display = 'none';
        }

        if (content) {
            Object.assign(content.style, {
                position: 'fixed',
                top: '130px',
                right: '10px',
                left: 'auto',
                width: '360px',
                maxHeight: '420px',
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.92)',
                border: '2px solid #FFD700',
                borderRadius: '8px',
                zIndex: '100001',
                padding: '12px 16px'
            });
            if (!this.leaderboard?.isOpen) {
                content.classList.add('hidden');
                content.style.display = 'none';
            }
        }
    }

    updateLeaderboard() {
        this.ensureLeaderboardUI();
        const levelIndex = (this.gameControl?.currentLevelIndex ?? 0) + 1;
        const totalLevels = this.gameControl?.levelClasses?.length ?? 0;
        const totalCoins = this.stats?.coinsCollected ?? 0;
        const currentScoreEl = document.getElementById('leaderboard-current-score');
        const coinsPreviewEl = document.getElementById('leaderboard-coins-preview');
        const highScorePreviewEl = document.getElementById('leaderboard-highscore-preview');
        const titleEl = document.getElementById('leaderboard-title');

        if (titleEl) {
            titleEl.textContent = 'Leaderboard';
        }
        if (coinsPreviewEl) {
            coinsPreviewEl.textContent = `Coins Collected: ${totalCoins}`;
        }
        if (highScorePreviewEl) {
            highScorePreviewEl.textContent = `Level: ${levelIndex}/${totalLevels}`;
        }
        if (currentScoreEl) {
            currentScoreEl.textContent = `Coins: ${totalCoins}`;
            currentScoreEl.style.display = 'none';
        }
    }

    async _ensureActiveScoreManager() {
        const activeGameEnv = this.gameControl?.currentLevel?.gameEnv || this.gameControl?.gameEnv;
        if (!activeGameEnv || activeGameEnv.scoreManager) {
            return activeGameEnv?.scoreManager || null;
        }

        const manager = await activeGameEnv.initScoreManager();
        if (manager) {
            manager.updateScoreDisplay(activeGameEnv.stats?.coinsCollected || 0);
        }
        return manager;
    }
}

export default Game;
