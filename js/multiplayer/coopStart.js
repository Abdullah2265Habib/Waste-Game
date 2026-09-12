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
        this.peerKeys = { left: false, right: false, up: false, down: false };
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
                // Pass existing room code so host maintains the lobby room ID
                await coopNet.createRoom(this.roomCode);
            } else {
                await coopNet.joinRoom(this.roomCode);
            }
        } catch (e) {
            console.warn('[CoopGameManager] WebRTC direct connect warning:', e);
        }
    }

    _bindNetworkEvents() {
        // Connection status
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
            // Host receives Orange Player 2 input keys over WebRTC UDP
            coopNet.on('P2_KEYS', (keys) => {
                if (keys) {
                    this.peerKeys = keys;
                }
            });
        } else {
            // Player 2 receives Host authoritative snapshot over WebRTC UDP
            coopNet.on('STATE_SYNC', (state) => {
                this._applyHostState(state);
            });

            coopNet.on('P1_KEYS', (keys) => {
                if (keys) {
                    this.peerKeys = keys;
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
                // Host sends P1 keys and runs physics for both players
                coopNet.send('P1_KEYS', myKeys);

                const p1Keys = myKeys;
                const p2Keys = this.peerKeys;

                this.level.animate(step, p1Keys, p2Keys);
                this.display.drawFrame();

                // Broadcast authoritative position and state over UDP DataChannel
                this._broadcastState();

                if (this.level.isFinished()) {
                    this.isRunning = false;
                    this.display.clear();
                    this._handleLevelEnd(this.level.status);
                    return false;
                }
            } else {
                // Player 2: send input keys to host over UDP
                coopNet.send('P2_KEYS', myKeys);

                const p1Keys = this.peerKeys;
                const p2Keys = myKeys;

                // Client prediction
                this.level.animate(step, p1Keys, p2Keys);
                this.display.drawFrame();

                if (this.level.isFinished()) {
                    this.isRunning = false;
                    this.display.clear();
                    return false;
                }
            }
        };

        AnimationRunner.run(frameStep);
    }

    _broadcastState() {
        if (!this.level || !coopNet.isConnected) return;

        const packet = {
            coins: this.level.collectedCoins,
            status: this.level.status,
            p1: this.level.player1.serialize(),
            p2: this.level.player2.serialize()
        };

        coopNet.send('STATE_SYNC', packet);
    }

    _applyHostState(state) {
        if (!this.level || !state) return;

        this.level.collectedCoins = state.coins;
        if (state.p1 && this.level.player1) this.level.player1.deserialize(state.p1);
        if (state.p2 && this.level.player2) this.level.player2.deserialize(state.p2);
        if (state.status) this.level.status = state.status;
    }

    _handleLevelEnd(status) {
        if (status === 'lost') {
            // Both players died! Reset to Level 1
            CoopStorage.recordBothDiedReset();
            coopNet.send('RESET_TO_LEVEL_1', {});
            alert('💀 Both players perished! Resetting to Level 1.');
            this.currentLevelIndex = 0;
            this._startLevel(0);

        } else if (status === 'won') {
            // Level cleared!
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
