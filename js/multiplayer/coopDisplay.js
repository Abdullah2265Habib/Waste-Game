'use strict';

export class CoopDOMDisplay {
    static scale = 15;

    static element(name, className) {
        const elem = document.createElement(name);
        if (className) elem.className = className;
        return elem;
    }

    constructor(parent, level, currentLevelIndex = 0, totalLevels = 4, localPlayerId = 1) {
        this.level = level;
        this.currentLevelIndex = currentLevelIndex;
        this.totalLevels = totalLevels;
        this.localPlayerId = localPlayerId;
        this.wrap = parent.appendChild(CoopDOMDisplay.element('div', 'game coop-game'));
        this.actorLayer = null;
        this.wrap.style.position = 'relative';

        this._setupHUD();
        this.wrap.appendChild(this._drawBackground());
        this.drawFrame();
    }

    _setupHUD() {
        const hudLevel = document.getElementById('hudLevel');
        if (hudLevel) hudLevel.textContent = `Co-Op Level ${this.currentLevelIndex + 1} / ${this.totalLevels}`;

        this._updateCoinsDisplay();
        this._updatePlayerStatusDisplay();
    }

    _updateCoinsDisplay() {
        const hudCoins = document.getElementById('hudCoins');
        if (hudCoins) {
            hudCoins.textContent = `🪙 ${this.level.collectedCoins} / ${this.level.totalCoins}`;
        }
    }

    _updatePlayerStatusDisplay() {
        const p1StatusElem = document.getElementById('hudP1Status');
        if (p1StatusElem && this.level.player1) {
            const p1 = this.level.player1;
            if (!p1.isAlive) {
                p1StatusElem.innerHTML = `<span class="badge-tag tag-p1">P1 (Host)</span> 💀 <span class="status-dead">DOWN</span>`;
            } else if (p1.hasShield) {
                p1StatusElem.innerHTML = `<span class="badge-tag tag-p1">P1 (Host)</span> 🛡️ <span class="status-shield">SHIELD</span>`;
            } else {
                p1StatusElem.innerHTML = `<span class="badge-tag tag-p1">P1 (Host)</span> 💚 <span class="status-alive">ALIVE</span>`;
            }
        }

        const p2StatusElem = document.getElementById('hudP2Status');
        if (p2StatusElem && this.level.player2) {
            const p2 = this.level.player2;
            if (!p2.isAlive) {
                p2StatusElem.innerHTML = `<span class="badge-tag tag-p2">P2</span> 💀 <span class="status-dead">DOWN</span>`;
            } else if (p2.hasShield) {
                p2StatusElem.innerHTML = `<span class="badge-tag tag-p2">P2</span> 🛡️ <span class="status-shield">SHIELD</span>`;
            } else {
                p2StatusElem.innerHTML = `<span class="badge-tag tag-p2">P2</span> 🧡 <span class="status-alive">ALIVE</span>`;
            }
        }
    }

    _drawBackground() {
        const table = CoopDOMDisplay.element('table', 'background');
        table.style.width = this.level.width * CoopDOMDisplay.scale + 'px';
        table.style.height = this.level.height * CoopDOMDisplay.scale + 'px';

        this.level.grid.forEach(row => {
            const rowElement = table.appendChild(CoopDOMDisplay.element('tr'));
            rowElement.style.height = CoopDOMDisplay.scale + 'px';
            row.forEach(type => {
                rowElement.appendChild(CoopDOMDisplay.element('td', type));
            });
        });

        return table;
    }

    _drawActors() {
        const wrap = CoopDOMDisplay.element('div');

        this.level.actors.forEach(actor => {
            const rect = wrap.appendChild(CoopDOMDisplay.element('div', 'actor ' + actor.type));
            rect.style.width = actor.size.x * CoopDOMDisplay.scale + 'px';
            rect.style.height = actor.size.y * CoopDOMDisplay.scale + 'px';
            rect.style.left = actor.pos.x * CoopDOMDisplay.scale + 'px';
            rect.style.top = actor.pos.y * CoopDOMDisplay.scale + 'px';

            if (actor.type === 'player') {
                if (actor.playerId === 2) {
                    rect.classList.add('player-orange'); // Bright orange for player 2
                } else {
                    rect.classList.add('player-blue'); // Cyan/blue for player 1
                }

                if (!actor.isAlive) {
                    rect.classList.add('player-dead');
                }
                if (actor.hasShield) {
                    rect.classList.add('has-shield');
                }
                if (actor.invulnerableTimer > 0) {
                    rect.classList.add('invulnerable');
                }

                // Overhead Player Tag
                const tag = rect.appendChild(CoopDOMDisplay.element('div', `player-tag tag-${actor.playerId === 2 ? 'p2' : 'p1'}`));
                tag.textContent = actor.playerId === 2 ? 'P2 (ORANGE)' : 'P1 (BLUE)';

            } else if (actor.type === 'turret') {
                const barrel = rect.appendChild(CoopDOMDisplay.element('div', 'turret-barrel'));
                barrel.style.transform = `rotate(${actor.angle}rad)`;
            } else if (actor.type === 'cannon') {
                const barrel = rect.appendChild(CoopDOMDisplay.element('div', 'cannon-barrel'));
                barrel.style.transform = `rotate(${actor.angle}rad)`;
            } else if (actor.type === 'bullet' && actor.angle !== undefined) {
                rect.style.transform = `rotate(${actor.angle}rad)`;
            } else if (actor.type === 'cannonBall' && actor.angle !== undefined) {
                rect.style.transform = `rotate(${actor.angle}rad)`;
            } else if (actor.type === 'explosion') {
                const scale = actor.progress !== undefined ? actor.progress : 1;
                const opacity = 1 - (actor.progress || 0);
                rect.style.transform = `scale(${0.3 + scale * 0.7})`;
                rect.style.opacity = Math.max(0.1, opacity);
            } else if (actor.emitterPos) {
                rect.classList.add('laser-beam', `laser-${actor.axis}`);
                const emitter = wrap.appendChild(CoopDOMDisplay.element('div', `actor laser-emitter laser-${actor.axis} ${actor.state}`));
                emitter.style.width = CoopDOMDisplay.scale + 'px';
                emitter.style.height = CoopDOMDisplay.scale + 'px';
                emitter.style.left = actor.emitterPos.x * CoopDOMDisplay.scale + 'px';
                emitter.style.top = actor.emitterPos.y * CoopDOMDisplay.scale + 'px';
                emitter.appendChild(CoopDOMDisplay.element('div', 'laser-nozzle'));
                emitter.appendChild(CoopDOMDisplay.element('div', 'laser-barrel'));

                if (actor.beamPos && actor.beamSize) {
                    rect.style.width = actor.beamSize.x * CoopDOMDisplay.scale + 'px';
                    rect.style.height = actor.beamSize.y * CoopDOMDisplay.scale + 'px';
                    rect.style.left = actor.beamPos.x * CoopDOMDisplay.scale + 'px';
                    rect.style.top = actor.beamPos.y * CoopDOMDisplay.scale + 'px';
                }

                if (actor.state === 'off') {
                    rect.style.display = 'none';
                } else {
                    rect.style.display = 'block';
                    rect.appendChild(CoopDOMDisplay.element('div', 'laser-energy-flow'));
                }
            }
        });

        return wrap;
    }

    drawFrame() {
        if (this.actorLayer) {
            this.wrap.removeChild(this.actorLayer);
        }
        this.actorLayer = this.wrap.appendChild(this._drawActors());
        this.wrap.className = 'game coop-game ' + (this.level.status || '');
        this._updateCoinsDisplay();
        this._updatePlayerStatusDisplay();
        this._scrollCamera();
    }

    _scrollCamera() {
        const width = this.wrap.clientWidth;
        const height = this.wrap.clientHeight;
        const margin = width / 3;

        const left = this.wrap.scrollLeft;
        const right = left + width;
        const top = this.wrap.scrollTop;
        const bottom = top + height;

        // Follow local player or centroid between alive players
        const myPlayer = this.localPlayerId === 2 ? this.level.player2 : this.level.player1;
        let focalPlayer = myPlayer && myPlayer.isAlive ? myPlayer : this.level.player;

        if (!focalPlayer) return;
        const center = focalPlayer.pos.plus(focalPlayer.size.times(0.5)).times(CoopDOMDisplay.scale);

        if (center.x < left + margin) {
            this.wrap.scrollLeft = center.x - margin;
        } else if (center.x > right - margin) {
            this.wrap.scrollLeft = center.x + margin - width;
        }

        if (center.y < top + margin) {
            this.wrap.scrollTop = center.y - margin;
        } else if (center.y > bottom - margin) {
            this.wrap.scrollTop = center.y + margin - height;
        }
    }

    clear() {
        if (this.wrap && this.wrap.parentNode) {
            this.wrap.parentNode.removeChild(this.wrap);
        }
    }
}
