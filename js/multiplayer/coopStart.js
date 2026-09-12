'use strict';

import { LEVELS_COOP } from './coopLevelsData.js';
import { AnimationRunner } from '../frontEndRendering/animation.js';
import { KeyTracker } from '../bussinessLogic/keyTracker.js';
import { CoopDOMDisplay } from './coopDisplay.js';
import { CoopLevel } from './coopLevel.js';
import { CoopStorage } from './coopStorage.js';
import { coopNet } from './network.js';

class CoopGameManager {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.isHost = urlParams.get('host') === 'true';
        this.roomCode = (urlParams.get('room') || '').toUpperCase().trim();
        this.currentLevelIndex = parseInt(urlParams.get('level') || '0', 10);
        this.localPlayerId = this.isHost ? 1 : 2;
        this.difficulty = localStorage.getItem('fateRunnerDifficulty') || 'normal';

        this.level = null;
        this.display = null;
        this.keyTracker = new KeyTracker();
        this.isRunning = false;

        this._setupHUDMeta();
        this._initNetworkAndStart();
    }

    _setupHUDMeta() {
        const roomBadge = document.getElementById('hudRoomCode');
        if (roomBadge) roomBadge.textContent = `ROOM: ${this.roomCode}`;

        const roleBadge = document.getElementById('hudRole');
        if (roleBadge) {
            roleBadge.textContent = this.isHost ? 'HOST (BLUE) - CONNECTING...' : 'PLAYER 2 (ORANGE) - CONNECTING...';
            roleBadge.className = `hud-item role-badge ${this.isHost ? 'role-host' : 'role-p2'}`;
        }
    }

    async _initNetworkAndStart() {
        if (!this.roomCode) {
            alert('Missing Room Code. Returning to lobby.');
            window.location.href = 'coopLobby.html';
            return;
        }

        this._bindNetworkEvents();
        this._startLevel(this.currentLevelIndex);

        try {
            if (this.isHost) {
                await coopNet.createRoom(this.roomCode);
            } else {
                await coopNet.joinRoom(this.roomCode);
            }
        } catch (e) {
            console.warn('[CoopGameManager] WebRTC connect notice:', e);
        }
    }

    _bindNetworkEvents() {
        coopNet.on('connected', () => {
            console.log('[CoopGameManager] WebRTC DataChannel connected successfully!');
            const roleBadge = document.getElementById('hudRole');
            if (roleBadge) {
                roleBadge.textContent = this.isHost ? 'HOST (BLUE) - ONLINE' : 'PLAYER 2 (ORANGE) - ONLINE';
            }
        });

        // Ping tracker
        setInterval(() => coopNet.sendPing(), 1000);
        coopNet.on('ping_updated', (ping) => {
            const pingElem = document.getElementById('hudPing');
            if (pingElem) pingElem.textContent = `📶 ${ping}ms`;
        });

        if (this.isHost) {
            // Host receives Orange Player 2's direct position and state
            coopNet.on('P2_STATE', (state) => {
                if (this.level && this.level.player2 && state) {
                    this.level.player2.deserialize(state);
                }
            });
        } else {
            // Player 2 receives Host Player 1's direct position and state
            coopNet.on('P1_STATE', (state) => {
                if (this.level && this.level.player1 && state) {
                    this.level.player1.deserialize(state);
                }
            });

            // Player 2 receives World state (coins, game status)
            coopNet.on('WORLD_SYNC', (data) => {
                if (this.level && data) {
                    this.level.collectedCoins = data.coins;
                    if (data.status) this.level.status = data.status;
                }
            });

            coopNet.on('LEVEL_CHANGE', (data) => {
                this.currentLevelIndex = data.levelIndex;
                this._startLevel(this.currentLevelIndex);
            });

            coopNet.on('RESET_TO_LEVEL_1', () => {
                alert('⚠️ Both players died! Game resetting to Level 1.');
                this.currentLevelIndex = 0;
                this._startLevel(0);
            });
        }

        coopNet.on('disconnected', () => {
            const roleBadge = document.getElementById('hudRole');
            if (roleBadge) roleBadge.textContent = 'DISCONNECTED';
            const overlay = document.getElementById('disconnectModal');
            if (overlay) overlay.classList.add('active');
        });
    }

    _startLevel(index) {
        if (this.display) {
            this.display.clear();
        }

        if (index >= LEVELS_COOP.length) {
            alert('🏆 VICTORY! You and your partner have conquered all Co-Op levels!');
            CoopStorage.recordLevelCleared(index - 1, 0);
            window.location.href = 'coopLobby.html';
            return;
        }

        this.level = new CoopLevel(LEVELS_COOP[index], this.difficulty);
        this.display = new CoopDOMDisplay(
            document.body,
            this.level,
            index,
            LEVELS_COOP.length,
            this.localPlayerId
        );

        this.isRunning = true;

        const frameStep = (step) => {
            if (!this.isRunning) return false;

            const myKeys = {
                left: !!this.keyTracker.keys.left,
                right: !!this.keyTracker.keys.right,
                up: !!this.keyTracker.keys.up,
                down: !!this.keyTracker.keys.down
            };

            if (this.isHost) {
                // Host runs local physics for Player 1 and world hazards
                this.level.animate(step, myKeys, 1);
                this.display.drawFrame();

                // Broadcast Player 1 state and World state
                if (coopNet.isConnected && this.level.player1) {
                    coopNet.send('P1_STATE', this.level.player1.serialize());
                    coopNet.send('WORLD_SYNC', {
                        coins: this.level.collectedCoins,
                        status: this.level.status
                    });
                }

                if (this.level.isFinished()) {
                    this.isRunning = false;
                    this.display.clear();
                    this._handleLevelEnd(this.level.status);
                    return false;
                }
            } else {
                // Player 2 runs local physics for Player 2 and world hazards
                this.level.animate(step, myKeys, 2);
                this.display.drawFrame();

                // Send Player 2 position and movement to Host
                if (coopNet.isConnected && this.level.player2) {
                    coopNet.send('P2_STATE', this.level.player2.serialize());
                }

                if (this.level.isFinished()) {
                    this.isRunning = false;
                    this.display.clear();
                    return false;
                }
            }
        };

        AnimationRunner.run(frameStep);
    }

    _handleLevelEnd(status) {
        if (status === 'lost') {
            CoopStorage.recordBothDiedReset();
            coopNet.send('RESET_TO_LEVEL_1', {});
            alert('💀 Both players perished! Resetting to Level 1.');
            this.currentLevelIndex = 0;
            this._startLevel(0);

        } else if (status === 'won') {
            CoopStorage.recordLevelCleared(this.currentLevelIndex, this.level.collectedCoins);
            this.currentLevelIndex++;
            coopNet.send('LEVEL_CHANGE', { levelIndex: this.currentLevelIndex });
            this._startLevel(this.currentLevelIndex);
        }
    }
}

window.addEventListener('load', () => {
    new CoopGameManager();
});
