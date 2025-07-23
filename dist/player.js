import { DEBUG_MODE, MAP_HEIGHT, MAP_WIDTH, PLAYER_ANIMATION_SPEED, PLAYER_IDLE_FRAME_COUNT, PLAYER_SPRITE_GAP, PLAYER_SPRITE_HEIGHT, PLAYER_SPRITE_PADDING, PLAYER_SPRITE_WIDTH, PLAYER_WALK_FRAME_COUNT, PLAYER_WALK_SPEED } from "./constants.js";
export class Player {
    worldX;
    worldY;
    speed;
    // Animation properties
    idleImage;
    walkImage;
    currentImage; // The currently active spritesheet
    isMoving;
    frameX;
    frameY;
    animationTimer;
    animationInterval;
    mapManager;
    scale;
    constructor(mapManager) {
        this.mapManager = mapManager;
        // Find the spawn point defined in Tiled
        const spawnPoint = this.mapManager.findObjectByName("playerSpawn");
        if (spawnPoint) {
            // If we found it, spawn the player there
            this.worldX = spawnPoint.x;
            this.worldY = spawnPoint.y;
        }
        else {
            // Otherwise, default to the center of the map (fallback)
            console.warn("Player spawn point not found in Tiled map. Defaulting to center.");
            this.worldX = MAP_WIDTH / 2;
            this.worldY = MAP_HEIGHT / 2;
        }
        this.speed = PLAYER_WALK_SPEED;
        // Load both images
        this.idleImage = document.getElementById("playerIdleSprite");
        this.walkImage = document.getElementById("playerWalkSprite");
        // Set initial state
        this.currentImage = this.idleImage;
        this.isMoving = false;
        this.frameX = 0;
        this.frameY = 0;
        this.animationTimer = 0;
        this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;
        this.scale = 1;
    }
    draw(context) {
        const strideX = PLAYER_SPRITE_WIDTH + PLAYER_SPRITE_GAP;
        const strideY = PLAYER_SPRITE_HEIGHT + PLAYER_SPRITE_GAP;
        const scaledWidth = PLAYER_SPRITE_WIDTH * this.scale;
        const scaledHeight = PLAYER_SPRITE_HEIGHT * this.scale;
        const drawX = this.worldX - scaledWidth / 2;
        const drawY = this.worldY - scaledHeight / 2;
        context.drawImage(this.currentImage, PLAYER_SPRITE_PADDING + this.frameX * strideX, PLAYER_SPRITE_PADDING + this.frameY * strideY, PLAYER_SPRITE_WIDTH, PLAYER_SPRITE_HEIGHT, drawX, drawY, scaledWidth, scaledHeight);
        // Only draw the debug collision box if debug mode is on
        if (DEBUG_MODE) {
            context.strokeStyle = "red";
            context.lineWidth = 2;
            context.strokeRect(drawX, drawY, scaledWidth, scaledHeight);
        }
    }
    update(input, deltaTime) {
        if (!deltaTime)
            return;
        const lastKey = input.activeKeys[input.activeKeys.length - 1];
        const wasMoving = this.isMoving;
        this.isMoving = input.activeKeys.length > 0;
        // --- State Transition Logic ---
        // If the player just started moving, switch to the walk animation
        if (this.isMoving && !wasMoving) {
            this.currentImage = this.walkImage;
            this.frameX = 0; // Reset animation frame
        }
        // If the player just stopped moving, switch to the idle animation
        if (!this.isMoving && wasMoving) {
            this.currentImage = this.idleImage;
            this.frameX = 0; // Reset animation frame
        }
        // --- Animation Logic ---
        this.animationTimer += deltaTime;
        if (this.animationTimer > this.animationInterval) {
            const frameCount = this.isMoving
                ? PLAYER_WALK_FRAME_COUNT
                : PLAYER_IDLE_FRAME_COUNT;
            this.frameX = (this.frameX + 1) % frameCount;
            this.animationTimer = 0;
        }
        // --- Movement Logic ---
        let moveX = 0;
        let moveY = 0;
        if (this.isMoving) {
            switch (lastKey) {
                case "down":
                    moveY = 1;
                    this.frameY = 0;
                    break;
                case "left":
                    moveX = -1;
                    this.frameY = 1;
                    break;
                case "right":
                    moveX = 1;
                    this.frameY = 2;
                    break;
                case "up":
                    moveY = -1;
                    this.frameY = 3;
                    break;
            }
        }
        const speed = this.speed * deltaTime;
        // Check if can move or collisions with updated scaled player size
        const scaledWidth = PLAYER_SPRITE_WIDTH * this.scale;
        const scaledHeight = PLAYER_SPRITE_HEIGHT * this.scale;
        // --- Check Horizontal Movement ---
        const nextX = this.worldX + moveX * speed;
        if (moveX !== 0) {
            if (!this.mapManager.isAreaSolid(moveX > 0 ? nextX + scaledWidth / 2 - 1 : nextX - scaledWidth / 2, this.worldY - scaledHeight / 2, 1, scaledHeight)) {
                this.worldX = nextX;
            }
        }
        // --- Check Vertical Movement ---
        const nextY = this.worldY + moveY * speed;
        if (moveY !== 0) {
            if (!this.mapManager.isAreaSolid(this.worldX - scaledWidth / 2, moveY > 0 ? nextY + scaledHeight / 2 - 1 : nextY - scaledHeight / 2, scaledWidth, 1)) {
                this.worldY = nextY;
            }
        }
        // --- Boundary Checks --- (These are now less critical but good for safety)
        if (this.worldX - scaledWidth / 2 < 0)
            this.worldX = scaledWidth / 2;
        if (this.worldX + scaledWidth / 2 > MAP_WIDTH)
            this.worldX = MAP_WIDTH - scaledWidth / 2;
        if (this.worldY - scaledHeight / 2 < 0)
            this.worldY = scaledHeight / 2;
        if (this.worldY + scaledHeight / 2 > MAP_HEIGHT)
            this.worldY = MAP_HEIGHT - scaledHeight / 2;
    }
}
