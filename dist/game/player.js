import { DEBUG_MODE, PLAYER_ANIMATION_SPEED, PLAYER_ATTACK_FRAME_COUNT, PLAYER_BASE_ATTACK_COOLDOWN, PLAYER_BASE_ATTACK_SPEED, PLAYER_IDLE_FRAME_COUNT, PLAYER_RUN_FRAME_COUNT, PLAYER_RUN_SPEED, PLAYER_SCALE_FACTOR, PLAYER_SPRITE_GAP, PLAYER_SPRITE_HEIGHT, PLAYER_SPRITE_PADDING, PLAYER_SPRITE_WIDTH, PLAYER_WALK_FRAME_COUNT, PLAYER_WALK_SPEED, } from "./constants.js";
export class Player {
    worldX;
    worldY;
    speed;
    mapManager;
    entityManager;
    scaleFactor;
    width;
    height;
    idleImage;
    walkImage;
    runImage;
    attackImage;
    currentImage;
    state;
    frameX;
    frameY;
    animationTimer;
    animationInterval;
    lastAttackTime;
    attackCooldown;
    attackSpeed;
    attackHitbox = null; // NEW: To store the current attack hitbox for debugging
    constructor(mapManager, entityManager) {
        this.mapManager = mapManager;
        this.entityManager = entityManager;
        this.scaleFactor = PLAYER_SCALE_FACTOR;
        this.speed = PLAYER_WALK_SPEED;
        this.idleImage = document.getElementById("playerIdleSprite");
        this.walkImage = document.getElementById("playerWalkSprite");
        this.runImage = document.getElementById("playerRunSprite");
        this.attackImage = document.getElementById("playerAttackSprite");
        const spawnPoint = this.mapManager.findObjectByName("playerSpawn");
        if (spawnPoint) {
            this.worldX = spawnPoint.x;
            this.worldY = spawnPoint.y;
        }
        else {
            console.warn("Player spawn point not found. Defaulting to center.");
            this.worldX = this.mapManager.mapPixelWidth / 2;
            this.worldY = this.mapManager.mapPixelHeight / 2;
        }
        this.state = "idle";
        this.currentImage = this.idleImage;
        this.frameX = 0;
        this.frameY = 0;
        this.animationTimer = 0;
        this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;
        this.width = PLAYER_SPRITE_WIDTH * this.scaleFactor;
        this.height = PLAYER_SPRITE_HEIGHT * this.scaleFactor;
        this.lastAttackTime = 0;
        this.attackCooldown = PLAYER_BASE_ATTACK_COOLDOWN;
        this.attackSpeed = PLAYER_BASE_ATTACK_SPEED;
    }
    // --- NEW: Public Getters for UI ---
    getLastAttackTime() {
        return this.lastAttackTime;
    }
    getAttackCooldown() {
        return this.attackCooldown;
    }
    update(input, deltaTime) {
        if (!deltaTime)
            return;
        this.updateScaledSize();
        const moveVector = this.handleInput(input);
        this.updateAnimation(deltaTime);
        this.move(moveVector, deltaTime);
        this.enforceMapBoundaries();
    }
    draw(context) {
        const drawX = this.worldX - this.width / 2;
        const drawY = this.worldY - this.height / 2;
        this.drawSprite(context, drawX, drawY);
        if (DEBUG_MODE) {
            this.drawDebugInfo(context);
        }
    }
    handleInput(input) {
        if (this.state === "attacking") {
            return { x: 0, y: 0 };
        }
        if (input.attackPressed && this.canAttack()) {
            this.performAttack("basic");
            return { x: 0, y: 0 };
        }
        const direction = input.direction;
        const isRunning = input.isRunning;
        let newState = "idle";
        if (direction && isRunning) {
            newState = "running";
        }
        else if (direction) {
            newState = "walking";
        }
        this.setState(newState);
        let moveX = 0;
        let moveY = 0;
        if (input.direction) {
            switch (input.direction) {
                case "down":
                    this.frameY = 0;
                    break;
                case "left":
                    this.frameY = 1;
                    break;
                case "right":
                    this.frameY = 2;
                    break;
                case "up":
                    this.frameY = 3;
                    break;
            }
        }
        if (this.state === "walking" || this.state === "running") {
            switch (input.direction) {
                case "down":
                    moveY = 1;
                    break;
                case "left":
                    moveX = -1;
                    break;
                case "right":
                    moveX = 1;
                    break;
                case "up":
                    moveY = -1;
                    break;
            }
        }
        return { x: moveX, y: moveY };
    }
    setState(newState) {
        if (this.state === newState)
            return;
        this.state = newState;
        this.frameX = 0;
        switch (this.state) {
            case "idle":
                this.speed = 0;
                this.currentImage = this.idleImage;
                this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;
                break;
            case "walking":
                this.speed = PLAYER_WALK_SPEED;
                this.currentImage = this.walkImage;
                this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;
                break;
            case "running":
                this.speed = PLAYER_RUN_SPEED;
                this.currentImage = this.runImage;
                this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;
                break;
        }
    }
    performAttack(attackType) {
        this.state = "attacking";
        this.frameX = 0;
        this.lastAttackTime = Date.now();
        this.currentImage = this.attackImage;
        this.speed = 0;
        this.animationInterval = 1000 / this.attackSpeed;
        // --- UPDATED: Precise Hitbox Calculation ---
        const hitbox = { x: 0, y: 0, width: 0, height: 0 };
        const playerLeft = this.worldX - this.width / 2;
        const playerTop = this.worldY - this.height / 2;
        // frameY: 0=down, 1=left, 2=right, 3=up
        switch (this.frameY) {
            case 0: // Down
                hitbox.width = this.width;
                hitbox.height = this.height / 2;
                hitbox.x = playerLeft;
                hitbox.y = this.worldY; // Start at player's vertical center
                break;
            case 1: // Left
                hitbox.width = this.width / 2;
                hitbox.height = this.height;
                hitbox.x = playerLeft;
                hitbox.y = playerTop;
                break;
            case 2: // Right
                hitbox.width = this.width / 2;
                hitbox.height = this.height;
                hitbox.x = this.worldX; // Start at player's horizontal center
                hitbox.y = playerTop;
                break;
            case 3: // Up
                hitbox.width = this.width;
                hitbox.height = this.height / 2;
                hitbox.x = playerLeft;
                hitbox.y = playerTop;
                break;
        }
        this.attackHitbox = hitbox; // Save for debugging
        // Check for collision with each enemy using the new hitbox
        for (const enemy of this.entityManager.enemies) {
            const enemyLeft = enemy.worldX - enemy.width / 2;
            const enemyTop = enemy.worldY - enemy.height / 2;
            if (hitbox.x < enemyLeft + enemy.width &&
                hitbox.x + hitbox.width > enemyLeft &&
                hitbox.y < enemyTop + enemy.height &&
                hitbox.y + hitbox.height > enemyTop) {
                enemy.takeDamage(25);
            }
        }
    }
    canAttack() {
        const now = Date.now();
        return now - this.lastAttackTime > this.attackCooldown;
    }
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > this.animationInterval) {
            this.animationTimer = 0;
            this.frameX++;
            let frameCount = 0;
            switch (this.state) {
                case "idle":
                    frameCount = PLAYER_IDLE_FRAME_COUNT;
                    break;
                case "walking":
                    frameCount = PLAYER_WALK_FRAME_COUNT;
                    break;
                case "running":
                    frameCount = PLAYER_RUN_FRAME_COUNT;
                    break;
                case "attacking":
                    frameCount = PLAYER_ATTACK_FRAME_COUNT;
                    break;
            }
            if (this.frameX >= frameCount) {
                if (this.state === "attacking") {
                    this.attackHitbox = null; // Clear hitbox after attack
                    this.setState("idle");
                }
                else {
                    this.frameX = 0;
                }
            }
        }
    }
    drawDebugInfo(context) {
        const drawX = this.worldX - this.width / 2;
        const drawY = this.worldY - this.height / 2;
        // Draw the collision box
        context.strokeStyle = "red";
        context.lineWidth = 2;
        context.strokeRect(drawX, drawY, this.width, this.height);
        // Draw the attack cooldown
        const now = Date.now();
        const remainingCooldown = Math.max(0, this.lastAttackTime + this.attackCooldown - now);
        const remainingSeconds = (remainingCooldown / 1000).toFixed(1);
        context.fillStyle = "white";
        context.font = "14px Arial";
        context.textAlign = "center";
        context.fillText(`Cooldown: ${remainingSeconds}s`, this.worldX, drawY - 10);
        // NEW: Draw the attack hitbox when attacking
        if (this.state === "attacking" && this.attackHitbox) {
            context.strokeStyle = "cyan";
            context.lineWidth = 1;
            context.strokeRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
        }
    }
    updateScaledSize() {
        this.width = PLAYER_SPRITE_WIDTH * this.scaleFactor;
        this.height = PLAYER_SPRITE_HEIGHT * this.scaleFactor;
    }
    move(moveVector, deltaTime) {
        const speed = this.speed * deltaTime;
        const nextX = this.worldX + moveVector.x * speed;
        if (moveVector.x !== 0) {
            const checkX = moveVector.x > 0 ? nextX + this.width / 2 : nextX - this.width / 2;
            if (!this.mapManager.isAreaSolid(checkX, this.worldY - this.height / 2, 1, this.height)) {
                this.worldX = nextX;
            }
        }
        const nextY = this.worldY + moveVector.y * speed;
        if (moveVector.y !== 0) {
            const checkY = moveVector.y > 0 ? nextY + this.height / 2 : nextY - this.height / 2;
            if (!this.mapManager.isAreaSolid(this.worldX - this.width / 2, checkY, this.width, 1)) {
                this.worldY = nextY;
            }
        }
    }
    enforceMapBoundaries() {
        this.worldX = Math.max(this.width / 2, Math.min(this.worldX, this.mapManager.mapPixelWidth - this.width / 2));
        this.worldY = Math.max(this.height / 2, Math.min(this.worldY, this.mapManager.mapPixelHeight - this.height / 2));
    }
    drawSprite(context, drawX, drawY) {
        const strideX = PLAYER_SPRITE_WIDTH + PLAYER_SPRITE_GAP;
        const strideY = PLAYER_SPRITE_HEIGHT + PLAYER_SPRITE_GAP;
        context.drawImage(this.currentImage, PLAYER_SPRITE_PADDING + this.frameX * strideX, PLAYER_SPRITE_PADDING + this.frameY * strideY, PLAYER_SPRITE_WIDTH, PLAYER_SPRITE_HEIGHT, drawX, drawY, this.width, this.height);
    }
}
