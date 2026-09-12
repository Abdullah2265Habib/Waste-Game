'use strict';

import { Vector } from '../bussinessLogic/vector.js';

export class CoopPlayer {
    static playerXSpeed = 10;
    static jumpSpeed = 17;
    static gravity = 30;
    static climbSpeed = 8;

    constructor(pos, playerId = 1) {
        this.playerId = playerId; // 1 = Host (Blue), 2 = Player 2 (Bright Orange)
        this.pos = pos.plus(new Vector(0, -0.5));
        this.size = new Vector(0.5, 1);
        this.speed = new Vector(0, 0);
        this.isCrouched = false;
        this.hasShield = false;
        this.invulnerableTimer = 0;
        this.isAlive = true;
    }

    get type() {
        return 'player';
    }

    _handleCrouch(level, keys) {
        if (!this.isAlive) return;

        if (keys && keys.down) {
            if (!this.isCrouched) {
                this.isCrouched = true;
                this.size = new Vector(0.5, 0.5);
                this.pos = this.pos.plus(new Vector(0, 0.5));
            }
        } else if (this.isCrouched) {
            const standingPos = this.pos.plus(new Vector(0, -0.5));
            const standingSize = new Vector(0.5, 1);
            if (!level.obstacleAt(standingPos, standingSize)) {
                this.isCrouched = false;
                this.pos = standingPos;
                this.size = standingSize;
            }
        }
    }

    _moveX(step, level, keys) {
        if (!this.isAlive) return;
        this.speed.x = 0;
        if (keys && keys.left) this.speed.x -= CoopPlayer.playerXSpeed;
        if (keys && keys.right) this.speed.x += CoopPlayer.playerXSpeed;

        const motion = new Vector(this.speed.x * step, 0);
        const newPos = this.pos.plus(motion);
        const obstacle = level.obstacleAt(newPos, this.size);
        if (obstacle) {
            level.playerTouched(obstacle, this);
        } else {
            this.pos = newPos;
        }
    }

    _isOnLadder(level) {
        return level.actors.some(actor => 
            actor.type === 'ladder' &&
            this.pos.x + this.size.x > actor.pos.x &&
            this.pos.x < actor.pos.x + actor.size.x &&
            this.pos.y + this.size.y > actor.pos.y &&
            this.pos.y < actor.pos.y + actor.size.y
        );
    }

    _moveY(step, level, keys) {
        if (!this.isAlive) return;
        const onLadder = this._isOnLadder(level);

        if (onLadder) {
            this.speed.y = 0;
            if (keys && keys.up) {
                this.speed.y = -CoopPlayer.climbSpeed;
            } else if (keys && keys.down) {
                this.speed.y = CoopPlayer.climbSpeed;
            }

            const motion = new Vector(0, this.speed.y * step);
            const newPos = this.pos.plus(motion);
            const obstacle = level.obstacleAt(newPos, this.size);

            if (obstacle) {
                level.playerTouched(obstacle, this);
            } else {
                this.pos = newPos;
            }
        } else {
            // Gravity pulls player down
            this.speed.y += step * CoopPlayer.gravity;
            const motion = new Vector(0, this.speed.y * step);
            const newPos = this.pos.plus(motion);
            const obstacle = level.obstacleAt(newPos, this.size);

            if (obstacle) {
                level.playerTouched(obstacle, this);
                if (keys && keys.up && this.speed.y > 0) {
                    this.speed.y = -CoopPlayer.jumpSpeed;
                } else {
                    this.speed.y = 0;
                }
            } else {
                this.pos = newPos;
            }
        }
    }

    act(step, level, keys) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer = Math.max(0, this.invulnerableTimer - step);
        }

        if (!this.isAlive) {
            this.pos = this.pos.plus(new Vector(0, step * 2));
            this.size = new Vector(this.size.x, Math.max(0.1, this.size.y - step));
            return;
        }

        const onLadder = this._isOnLadder(level);
        if (!onLadder) {
            this._handleCrouch(level, keys);
        } else if (this.isCrouched) {
            const standingPos = this.pos.plus(new Vector(0, -0.5));
            const standingSize = new Vector(0.5, 1);
            if (!level.obstacleAt(standingPos, standingSize)) {
                this.isCrouched = false;
                this.pos = standingPos;
                this.size = standingSize;
            }
        }

        this._moveX(step, level, keys);
        this._moveY(step, level, keys);

        const otherActor = level.actorAt(this);
        if (otherActor) {
            level.playerTouched(otherActor.type, otherActor, this);
        }
    }

    serialize() {
        return {
            id: this.playerId,
            x: Number(this.pos.x.toFixed(3)),
            y: Number(this.pos.y.toFixed(3)),
            vx: Number(this.speed.x.toFixed(2)),
            vy: Number(this.speed.y.toFixed(2)),
            crouch: this.isCrouched,
            shield: this.hasShield,
            invuln: this.invulnerableTimer > 0,
            alive: this.isAlive
        };
    }

    deserialize(data) {
        if (!data) return;
        this.pos = new Vector(data.x, data.y);
        this.speed = new Vector(data.vx, data.vy);
        this.isCrouched = data.crouch;
        this.hasShield = data.shield;
        this.isAlive = data.alive;
        if (data.crouch) {
            this.size = new Vector(0.5, 0.5);
        } else {
            this.size = new Vector(0.5, 1);
        }
    }
}
