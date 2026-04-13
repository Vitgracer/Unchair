/**
 * Bubble Popping Gameplay Logic
 */

class Bubble {
    constructor(minX, maxX, minY) {
        this.radius = Math.random() * 20 + 20; // 20-40px
        this.x = Math.random() * (maxX - minX - this.radius * 2) + minX + this.radius;
        this.y = (minY !== undefined) ? minY - this.radius : -this.radius;
        // Speed is now in Pixels Per Second (approx 120-240px/sec)
        this.speed = Math.random() * 120 + 60; 
        this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
        this.isPopped = false;
        this.popTimer = 0;
    }

    update(dt) {
        if (!this.isPopped) {
            this.y += this.speed * dt;
        } else {
            this.popTimer += dt * 60; // Keep pop timer roughly frame-based for logic
        }
    }

    checkCollision(point) {
        if (!point || this.isPopped) return false;
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.radius) {
            this.isPopped = true;
            return true;
        }
        return false;
    }
}

export class GameplayManager {
    constructor() {
        this.bubbles = [];
        this.score = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = 1500; // spawn every 1.5s
        this.gameStarted = false;
        this.playArea = { minX: 0, maxX: 800 }; // Default
    }

    start() {
        this.gameStarted = true;
        this.bubbles = [];
        this.score = 0;
    }

    update(canvasWidth, canvasHeight, handPoints, playArea = null, dt) {
        if (!this.gameStarted || !dt) return;
        
        if (playArea) {
            this.playArea = playArea;
        }

        const now = performance.now();
        if (now - this.lastSpawnTime > this.spawnInterval) {
            this.bubbles.push(new Bubble(this.playArea.minX, this.playArea.maxX, this.playArea.minY));
            this.lastSpawnTime = now;
        }

        this.bubbles.forEach(bubble => {
            bubble.update(dt);
            
            // Check collision with each hand point
            handPoints.forEach(point => {
                if (bubble.checkCollision(point)) {
                    this.score += 10;
                }
            });
        });

        // Remove bubbles that are off-screen or popped
        const maxY = (this.playArea.minY !== undefined && this.playArea.size !== undefined) 
            ? this.playArea.minY + this.playArea.size 
            : canvasHeight;

        this.bubbles = this.bubbles.filter(bubble => 
            bubble.y < maxY + bubble.radius && 
            (!bubble.isPopped || bubble.popTimer < 10)
        );
    }

    getScore() {
        return this.score;
    }

    getBubbles() {
        return this.bubbles;
    }
}
