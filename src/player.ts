import {
  DEBUG_MODE,
  MAP_HEIGHT,
  MAP_WIDTH,
  PLAYER_ANIMATION_SPEED,
  PLAYER_IDLE_FRAME_COUNT,
  PLAYER_RUN_FRAME_COUNT,
  PLAYER_RUN_SPEED,
  PLAYER_SCALE_FACTOR,
  PLAYER_SPRITE_GAP,
  PLAYER_SPRITE_HEIGHT,
  PLAYER_SPRITE_PADDING,
  PLAYER_SPRITE_WIDTH,
  PLAYER_WALK_FRAME_COUNT,
  PLAYER_WALK_SPEED,
} from "./constants";
import { InputHandler } from "./inputManager";
import { MapManager } from "./mapManager";

// Define the possible states for the player
type PlayerState = "idle" | "walking" | "running";

export class Player {
  // Public properties
  public worldX: number;
  public worldY: number;
  public speed: number;

  // Private properties
  private mapManager: MapManager;
  private scaleFactor: number;

  // Animation state
  private idleImage: HTMLImageElement;
  private walkImage: HTMLImageElement;
  private runImage: HTMLImageElement;
  private currentImage: HTMLImageElement;
  private state: PlayerState;
  private frameX: number;
  private frameY: number;
  private animationTimer: number;
  private animationInterval: number;

  constructor(mapManager: MapManager) {
    this.mapManager = mapManager;
    this.scaleFactor = PLAYER_SCALE_FACTOR;
    this.speed = PLAYER_WALK_SPEED;

    // --- Initialization moved directly into the constructor ---

    // 1. Load Assets
    this.idleImage = document.getElementById(
      "playerIdleSprite"
    ) as HTMLImageElement;
    this.walkImage = document.getElementById(
      "playerWalkSprite"
    ) as HTMLImageElement;
    this.runImage = document.getElementById(
      "playerRunSprite"
    ) as HTMLImageElement;

    // 2. Spawn Player
    const spawnPoint = this.mapManager.findObjectByName("playerSpawn");
    if (spawnPoint) {
      this.worldX = spawnPoint.x;
      this.worldY = spawnPoint.y;
    } else {
      console.warn(
        "Player spawn point not found in Tiled map. Defaulting to center."
      );
      this.worldX = MAP_WIDTH / 2;
      this.worldY = MAP_HEIGHT / 2;
    }

    // 3. Initialize State
    this.state = "idle";
    this.currentImage = this.idleImage;
    this.frameX = 0;
    this.frameY = 0;
    this.animationTimer = 0;
    this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;
  }

  // --- Public Methods ---

  public update(input: InputHandler, deltaTime: number): void {
    if (!deltaTime) return;

    const moveVector = this.handleInput(input);
    this.updateAnimation(deltaTime);
    this.move(moveVector, deltaTime);
    this.enforceMapBoundaries();
  }

  public draw(context: CanvasRenderingContext2D): void {
    const scaledWidth = PLAYER_SPRITE_WIDTH * this.scaleFactor;
    const scaledHeight = PLAYER_SPRITE_HEIGHT * this.scaleFactor;
    const drawX = this.worldX - scaledWidth / 2;
    const drawY = this.worldY - scaledHeight / 2;

    this.drawSprite(context, drawX, drawY, scaledWidth, scaledHeight);

    if (DEBUG_MODE) {
      this.drawDebugBox(context, drawX, drawY, scaledWidth, scaledHeight);
    }
  }

  // --- Private Update Helpers ---

  private handleInput(input: InputHandler): { x: number; y: number } {
    const previousState = this.state;

    // 1. Read the high-level state directly from the input manager
    const direction = input.direction;
    const isRunning = input.isRunning;

    // 2. Determine the player's state
    if (direction && isRunning) {
      this.state = "running";
    } else if (direction) {
      this.state = "walking";
    } else {
      this.state = "idle";
    }

    // 3. Set properties based on the current state
    switch (this.state) {
      case "idle":
        this.speed = 0;
        this.currentImage = this.idleImage;
        break;
      case "walking":
        this.speed = PLAYER_WALK_SPEED;
        this.currentImage = this.walkImage;
        break;
      case "running":
        this.speed = PLAYER_RUN_SPEED;
        this.currentImage = this.runImage;
        break;
    }

    // 4. Reset animation frame ONLY when the state actually changes
    if (this.state !== previousState) {
      this.frameX = 0;
    }

    // 5. Determine movement vector and sprite direction
    let moveX = 0;
    let moveY = 0;
    if (direction) {
      switch (direction) {
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

    return { x: moveX, y: moveY };
  }

  private updateAnimation(deltaTime: number): void {
    this.animationTimer += deltaTime;
    if (this.animationTimer > this.animationInterval) {
      let frameCount = PLAYER_IDLE_FRAME_COUNT;
      if (this.state === "walking") {
        frameCount = PLAYER_WALK_FRAME_COUNT;
      } else if (this.state === "running") {
        frameCount = PLAYER_RUN_FRAME_COUNT;
      }

      this.frameX = (this.frameX + 1) % frameCount;
      this.animationTimer = 0;
    }
  }

  private move(moveVector: { x: number; y: number }, deltaTime: number): void {
    const speed = this.speed * deltaTime;
    const scaledWidth = PLAYER_SPRITE_WIDTH * this.scaleFactor;
    const scaledHeight = PLAYER_SPRITE_HEIGHT * this.scaleFactor;

    // Check horizontal movement
    const nextX = this.worldX + moveVector.x * speed;
    if (moveVector.x !== 0) {
      const checkX =
        moveVector.x > 0 ? nextX + scaledWidth / 2 : nextX - scaledWidth / 2;
      if (
        !this.mapManager.isAreaSolid(
          checkX,
          this.worldY - scaledHeight / 2,
          1,
          scaledHeight
        )
      ) {
        this.worldX = nextX;
      }
    }

    // Check vertical movement
    const nextY = this.worldY + moveVector.y * speed;
    if (moveVector.y !== 0) {
      const checkY =
        moveVector.y > 0 ? nextY + scaledHeight / 2 : nextY - scaledHeight / 2;
      if (
        !this.mapManager.isAreaSolid(
          this.worldX - scaledWidth / 2,
          checkY,
          scaledWidth,
          1
        )
      ) {
        this.worldY = nextY;
      }
    }
  }

  private enforceMapBoundaries(): void {
    const scaledWidth = PLAYER_SPRITE_WIDTH * this.scaleFactor;
    const scaledHeight = PLAYER_SPRITE_HEIGHT * this.scaleFactor;

    this.worldX = Math.max(
      scaledWidth / 2,
      Math.min(this.worldX, MAP_WIDTH - scaledWidth / 2)
    );
    this.worldY = Math.max(
      scaledHeight / 2,
      Math.min(this.worldY, MAP_HEIGHT - scaledHeight / 2)
    );
  }

  // --- Private Drawing Helpers ---

  private drawSprite(
    context: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    scaledWidth: number,
    scaledHeight: number
  ): void {
    const strideX = PLAYER_SPRITE_WIDTH + PLAYER_SPRITE_GAP;
    const strideY = PLAYER_SPRITE_HEIGHT + PLAYER_SPRITE_GAP;

    context.drawImage(
      this.currentImage,
      PLAYER_SPRITE_PADDING + this.frameX * strideX,
      PLAYER_SPRITE_PADDING + this.frameY * strideY,
      PLAYER_SPRITE_WIDTH,
      PLAYER_SPRITE_HEIGHT,
      drawX,
      drawY,
      scaledWidth,
      scaledHeight
    );
  }

  private drawDebugBox(
    context: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    scaledWidth: number,
    scaledHeight: number
  ): void {
    context.strokeStyle = "red";
    context.lineWidth = 2;
    context.strokeRect(drawX, drawY, scaledWidth, scaledHeight);
  }
}
