'use strict';

import { CoopPlayer } from './coopPlayer.js';
import { Lava } from '../bussinessLogic/actors/lava.js';
import { Vector } from '../bussinessLogic/vector.js';
import { Coin } from '../bussinessLogic/actors/coin.js';
import { Spring } from '../bussinessLogic/actors/spring.js';
import { Enemy } from '../bussinessLogic/actors/enemy.js';
import { TrackingEnemy } from '../bussinessLogic/actors/trackingEnemy.js';
import { Turret } from '../bussinessLogic/actors/turret.js';
import { Cannon } from '../bussinessLogic/actors/cannon.js';
import { Laser } from '../bussinessLogic/actors/laser.js';
import { Ladder } from '../bussinessLogic/actors/ladder.js';
import { Shield } from '../bussinessLogic/actors/shield.js';

var coopActorChars = {
    '@': 'p1_start',
    '%': 'p2_start',
    o: Coin,
    '=': Lava,
    '|': Lava,
    v: Lava,
    s: Spring,
    e: Enemy,
    t: TrackingEnemy,
    'T': Turret,
    'C': Cannon,
    'H': Laser,
    'V': Laser,
    'L': Ladder,
    'l': Ladder,
    'i': Shield,
    'I': Shield,
    'S': Shield,
};

export class CoopLevel {
    static maxStep = 0.05;

    constructor(plan, difficulty = 'normal') {
        this.width = plan[0].length;
        this.height = plan.length;
        this.grid = [];
        this.actors = [];
        this.difficulty = difficulty;
        this.p1StartPos = null;
        this.p2StartPos = null;

        const speedMult = difficulty === 'hardcore' ? 1.3 : difficulty === 'easy' ? 0.8 : 1.0;

        for (let y = 0; y < this.height; y++) {
            let line = plan[y];
            let gridLine = [];

            for (let x = 0; x < this.width; x++) {
                let ch = line[x];
                let fieldType = null;

                if (ch === '@') {
                    this.p1StartPos = new Vector(x, y);
                } else if (ch === '%') {
                    this.p2StartPos = new Vector(x, y);
                } else {
                    let Actor = coopActorChars[ch];
                    if (Actor && typeof Actor === 'function') {
                        let actorInstance;
                        if (ch === '=' || ch === '|' || ch === 'v') {
                            actorInstance = new Actor(new Vector(x, y), ch);
                            actorInstance.speed = actorInstance.speed.times(speedMult);
                        } else if (ch === 'e' || ch === 't' || ch === 'T' || ch === 'C') {
                            actorInstance = new Actor(new Vector(x, y), speedMult);
                        } else {
                            actorInstance = new Actor(new Vector(x, y), ch);
                        }
                        this.actors.push(actorInstance);
                    } else if (ch === 'x') {
                        fieldType = 'wall';
                    } else if (ch === '!' || ch === '|' || ch === '=' || ch === 'v') {
                        fieldType = 'lava';
                    }
                }

                gridLine.push(fieldType);
            }

            this.grid.push(gridLine);
        }

        // Fallback spawn positions if not explicitly placed
        if (!this.p1StartPos) this.p1StartPos = new Vector(2, 2);
        if (!this.p2StartPos) this.p2StartPos = this.p1StartPos.plus(new Vector(2, 0));

        this.player1 = new CoopPlayer(this.p1StartPos, 1);
        this.player2 = new CoopPlayer(this.p2StartPos, 2);

        this.actors.push(this.player1);
        this.actors.push(this.player2);

        this.totalCoins = this.actors.filter(actor => actor.type === 'coin').length;
        this.collectedCoins = 0;
        this.status = null;
        this.finishDelay = null;
    }

    get players() {
        return [this.player1, this.player2];
    }

    /**
     * Dynamic getter for existing tracking actors (turrets, tracking enemy)
     * Target the nearest living player
     */
    get player() {
        const alivePlayers = this.players.filter(p => p.isAlive);
        if (alivePlayers.length === 0) return this.player1;
        return alivePlayers[0];
    }

    isFinished() {
        return this.status != null && this.finishDelay < 0;
    }

    obstacleAt(pos, size) {
        var xStart = Math.floor(pos.x);
        var xEnd = Math.ceil(pos.x + size.x);
        var yStart = Math.floor(pos.y);
        var yEnd = Math.ceil(pos.y + size.y);

        if (xStart < 0 || xEnd > this.width || yStart < 0) return 'wall';
        if (yEnd > this.height) return 'lava';

        for (var y = yStart; y < yEnd; y++) {
            for (var x = xStart; x < xEnd; x++) {
                var fieldType = this.grid[y][x];
                if (fieldType) return fieldType;
            }
        }
    }

    actorAt(actor) {
        for (var i = 0; i < this.actors.length; i++) {
            var other = this.actors[i];
            if (
                other != actor &&
                actor.pos.x + actor.size.x > other.pos.x &&
                actor.pos.x < other.pos.x + other.size.x &&
                actor.pos.y + actor.size.y > other.pos.y &&
                actor.pos.y < other.pos.y + other.size.y
            ) {
                return other;
            }
        }
    }

    animate(step, localKeys, localPlayerId = 1) {
        if (this.status != null) this.finishDelay -= step;

        while (step > 0) {
            var thisStep = Math.min(step, CoopLevel.maxStep);

            this.actors.forEach((actor) => {
                if (actor === this.player1) {
                    if (localPlayerId === 1) {
                        actor.act(thisStep, this, localKeys);
                    }
                } else if (actor === this.player2) {
                    if (localPlayerId === 2) {
                        actor.act(thisStep, this, localKeys);
                    }
                } else {
                    actor.act(thisStep, this);
                }
            });

            step -= thisStep;
        }

        // Check if both players are dead
        if (!this.player1.isAlive && !this.player2.isAlive && this.status == null) {
            this.status = 'lost';
            this.finishDelay = 1.2;
        }
    }

    playerTouched(type, actor, playerInst) {
        const targetPlayer = playerInst || this.player;
        if (!targetPlayer || !targetPlayer.isAlive) return;

        if (
            type === 'lava' ||
            type === 'enemy' ||
            type === 'trackingEnemy' ||
            type === 'bullet' ||
            type === 'cannonBall' ||
            type === 'explosion' ||
            type === 'laser'
        ) {
            if (targetPlayer.invulnerableTimer > 0) return;

            if (targetPlayer.hasShield) {
                targetPlayer.hasShield = false;
                targetPlayer.invulnerableTimer = 0.8;
                if (type === 'bullet' || type === 'cannonBall' || type === 'explosion') {
                    this.actors = this.actors.filter(other => other != actor);
                }
                return;
            }

            // Player takes fatal hit
            targetPlayer.isAlive = false;

            // Check if BOTH are now dead
            if (!this.player1.isAlive && !this.player2.isAlive) {
                if (this.status == null) {
                    this.status = 'lost';
                    this.finishDelay = 1.2;
                }
            }

        } else if (type === 'shield') {
            this.actors = this.actors.filter(other => other != actor);
            targetPlayer.hasShield = true;

        } else if (type === 'spring') {
            targetPlayer.speed.y = -30;

        } else if (type === 'coin') {
            this.actors = this.actors.filter(other => other != actor);
            this.collectedCoins++;

            if (!this.actors.some(act => act.type === 'coin')) {
                this.status = 'won';
                this.finishDelay = 1.2;
            }
        }
    }
}
