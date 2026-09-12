'use strict';

/**
 * Robust WebRTC UDP/DataChannel Network Layer for 2-Player Co-Op.
 * Fixed handshake lifecycle: bidirectional connection acknowledgement,
 * automatic retries, and instant Player 2 detection on host.
 */

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.stunprotocol.org:3478' }
];

export class CoopNetwork {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.roomCode = null;
        this.peerId = null;
        this.listeners = new Map();
        this.isConnected = false;
        this.pingMs = 0;
        this.retryTimeout = null;
        this.handshakeInterval = null;
        this._retriedOnce = false;
    }

    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    emit(eventType, data) {
        const cbs = this.listeners.get(eventType);
        if (cbs) {
            cbs.forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error(`[CoopNetwork] Error in listener for ${eventType}:`, e);
                }
            });
        }
    }

    _generateRoomCode() {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    createRoom(existingCode = null) {
        return new Promise((resolve, reject) => {
            this.isHost = true;
            if (existingCode) {
                this.roomCode = existingCode.toUpperCase().trim();
            } else if (!this.roomCode) {
                this.roomCode = this._generateRoomCode();
            }

            const hostPeerId = `fr-coop-v2-${this.roomCode.toLowerCase()}`;

            if (typeof window.Peer === 'undefined') {
                reject(new Error('WebRTC PeerJS library not loaded.'));
                return;
            }

            if (this.peer && !this.peer.destroyed && this.peerId === hostPeerId) {
                console.log('[CoopNetwork] Host peer already active with ID:', hostPeerId);
                resolve({ roomCode: this.roomCode, peerId: this.peerId });
                return;
            }

            if (this.peer) {
                try { this.peer.destroy(); } catch (e) {}
            }

            console.log('[CoopNetwork] Creating stable host peer:', hostPeerId);

            this.peer = new window.Peer(hostPeerId, {
                debug: 1,
                config: {
                    iceServers: ICE_SERVERS,
                    iceCandidatePoolSize: 10
                }
            });

            this.peer.on('open', (id) => {
                this.peerId = id;
                this._retriedOnce = false;
                console.log('[CoopNetwork] Host room online with ID:', id, 'Room:', this.roomCode);
                resolve({ roomCode: this.roomCode, peerId: id });
            });

            this.peer.on('connection', (conn) => {
                console.log('[CoopNetwork] Host received incoming connection from peer:', conn.peer);
                this._setupDataChannel(conn);
            });

            this.peer.on('error', (err) => {
                console.error('[CoopNetwork] Host peer error:', err);
                if (err.type === 'unavailable-id') {
                    if (!existingCode && !this._retriedOnce) {
                        this._retriedOnce = true;
                        this.roomCode = this._generateRoomCode();
                        setTimeout(() => {
                            this.createRoom().then(resolve).catch(reject);
                        }, 500);
                    } else {
                        reject(err);
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    joinRoom(code, maxRetries = 15) {
        return new Promise((resolve, reject) => {
            this.isHost = false;
            this.roomCode = code.toUpperCase().trim();
            const hostPeerId = `fr-coop-v2-${this.roomCode.toLowerCase()}`;

            if (typeof window.Peer === 'undefined') {
                reject(new Error('WebRTC PeerJS library not loaded.'));
                return;
            }

            if (this.peer) {
                try { this.peer.destroy(); } catch (e) {}
            }

            let attempt = 0;
            let resolved = false;

            this.peer = new window.Peer({
                debug: 1,
                config: {
                    iceServers: ICE_SERVERS,
                    iceCandidatePoolSize: 10
                }
            });

            const tryConnect = () => {
                if (resolved || !this.peer || this.peer.destroyed) return;
                attempt++;
                console.log(`[CoopNetwork] Connecting to host: ${hostPeerId} (Attempt ${attempt}/${maxRetries})...`);

                const conn = this.peer.connect(hostPeerId, {
                    reliable: true,
                    serialization: 'json'
                });

                // Set up event listeners immediately on connection
                this._setupDataChannel(conn);

                let openTimer = setTimeout(() => {
                    if (!this.isConnected && attempt < maxRetries && !resolved) {
                        console.warn('[CoopNetwork] Connection attempt timed out, retrying in 1s...');
                        try { conn.close(); } catch (e) {}
                        this.retryTimeout = setTimeout(tryConnect, 1000);
                    } else if (!this.isConnected && !resolved) {
                        reject(new Error('Unable to connect to host across network.'));
                    }
                }, 3500);

                const onConnOpen = () => {
                    clearTimeout(openTimer);
                    if (!resolved) {
                        resolved = true;
                        console.log('[CoopNetwork] Successfully connected to host over WebRTC DataChannel!');

                        // Periodically send PLAYER_JOINED handshake until acknowledged by host
                        if (this.handshakeInterval) clearInterval(this.handshakeInterval);
                        this.handshakeInterval = setInterval(() => {
                            if (!this.isConnected) {
                                clearInterval(this.handshakeInterval);
                                return;
                            }
                            this.send('PLAYER_JOINED', { playerId: 2, name: 'Player 2 (Orange)' });
                        }, 400);

                        this.on('HOST_ACK', () => {
                            if (this.handshakeInterval) {
                                clearInterval(this.handshakeInterval);
                                this.handshakeInterval = null;
                            }
                        });
                        this.on('START_GAME', () => {
                            if (this.handshakeInterval) {
                                clearInterval(this.handshakeInterval);
                                this.handshakeInterval = null;
                            }
                        });

                        resolve({ roomCode: this.roomCode, hostId: hostPeerId });
                    }
                };

                if (conn.open) {
                    onConnOpen();
                } else {
                    conn.on('open', onConnOpen);
                }

                conn.on('error', (err) => {
                    console.warn('[CoopNetwork] Connection attempt error:', err);
                    clearTimeout(openTimer);
                    if (!resolved && attempt < maxRetries) {
                        this.retryTimeout = setTimeout(tryConnect, 1200);
                    }
                });
            };

            this.peer.on('open', (id) => {
                this.peerId = id;
                tryConnect();
            });

            this.peer.on('error', (err) => {
                console.error('[CoopNetwork] Client peer error:', err);
                if (!resolved && attempt < maxRetries) {
                    this.retryTimeout = setTimeout(tryConnect, 1500);
                } else if (!resolved) {
                    reject(err);
                }
            });
        });
    }

    _setupDataChannel(conn) {
        this.connection = conn;

        const onOpen = () => {
            if (this.isConnected) return;
            this.isConnected = true;
            console.log(`[CoopNetwork] Connection OPEN (isHost: ${this.isHost})`);
            this.emit('connected', { isHost: this.isHost, roomCode: this.roomCode });

            if (this.isHost) {
                // Host immediately knows Player 2 connected!
                this.emit('PLAYER_JOINED', { playerId: 2, name: 'Player 2 (Orange)' });
                this.send('HOST_ACK', { roomCode: this.roomCode });
            } else {
                this.send('PLAYER_JOINED', { playerId: 2, name: 'Player 2 (Orange)' });
            }
        };

        if (conn.open) {
            onOpen();
        } else {
            conn.on('open', onOpen);
        }

        conn.on('data', (packet) => {
            if (!packet || typeof packet !== 'object') return;

            if (!this.isConnected) {
                this.isConnected = true;
                this.emit('connected', { isHost: this.isHost, roomCode: this.roomCode });
            }

            if (packet.type === 'PING') {
                this.send('PONG', { time: packet.time });
                return;
            }
            if (packet.type === 'PONG') {
                this.pingMs = Math.round(performance.now() - packet.time);
                this.emit('ping_updated', this.pingMs);
                return;
            }

            if (packet.type === 'PLAYER_JOINED') {
                console.log('[CoopNetwork] Host received PLAYER_JOINED packet:', packet.payload);
                if (this.isHost) {
                    this.emit('PLAYER_JOINED', packet.payload || { playerId: 2 });
                    this.send('HOST_ACK', { roomCode: this.roomCode });
                }
                return;
            }

            if (packet.type === 'HOST_ACK') {
                console.log('[CoopNetwork] Client received HOST_ACK from host');
                this.emit('HOST_ACK', packet.payload);
                return;
            }

            this.emit(packet.type, packet.payload);
        });

        conn.on('close', () => {
            console.warn('[CoopNetwork] DataChannel closed');
            this.isConnected = false;
            this.emit('disconnected', {});
        });

        conn.on('error', (err) => {
            console.error('[CoopNetwork] DataChannel error:', err);
            this.emit('error', err);
        });
    }

    send(type, payload = {}) {
        if (this.connection && this.connection.open) {
            try {
                this.connection.send({ type, payload });
            } catch (e) {
                console.warn('[CoopNetwork] Send packet error:', e);
            }
        }
    }

    sendPing() {
        if (this.isConnected) {
            this.send('PING', { time: performance.now() });
        }
    }

    disconnect() {
        if (this.handshakeInterval) {
            clearInterval(this.handshakeInterval);
            this.handshakeInterval = null;
        }
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }
        if (this.connection) {
            try { this.connection.close(); } catch (e) {}
            this.connection = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        this.isConnected = false;
    }
}

export const coopNet = new CoopNetwork();
