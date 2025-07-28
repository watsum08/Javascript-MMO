import {
    DEBUG_MODE,
    ENEMY_ANIMATION_SPEED,
    ENEMY_IDLE_FRAME_COUNT,
    ENEMY_SCALE_FACTOR,
    ENEMY_SPRITE_GAP,
    ENEMY_SPRITE_HEIGHT,
    ENEMY_SPRITE_PADDING,
    ENEMY_SPRITE_WIDTH,
    ENEMY_WALK_FRAME_COUNT,
} from "./constants";
import { EnemyType } from "./enemyTypes";
import { EntityManager } from "./entityManager";
import { GameObject } from "./gameObject";
import { MapManager } from "./mapManager";

type EnemyState = "idle" | "wandering" | "in_combat";

export class Enemy extends GameObject {
  private health: number;
  private maxHealth: number;
  private movementType: "stationary" | "wander_cardinal";
  private mapManager: MapManager;
  private entityManager: EntityManager;

  private state: EnemyState;
  private lastDamageTime: number = 0;
  private combatTimeout: number = 5000;

  // --- Animation Properties ---
  private spriteSheets: Map<string, HTMLImageElement>;
  private currentSpriteSheet: HTMLImageElement;
  private frameX: number = 0;
  private frameY: number = 0; // 0=down, 1=left, 2=right, 3=up
  private animationTimer: number = 0;
  private animationInterval: number = 1000 / ENEMY_ANIMATION_SPEED;

  // Movement Properties
  private moveTargetX: number;
  private moveTargetY: number;
  private speed: number = 50;
  private spawnX: number;
  private spawnY: number;
  private wanderZoneRadius: number = 150;
  private wanderTimer: number = 0;
  private healthRegenPerSec: number;

  // --- Properties for Alternating Cardinal Movement ---
  private cardinalMoveTimer: number = 0;
  private readonly cardinalMoveDuration = 1000; // 500ms bursts
  private currentMoveAxis: "horizontal" | "vertical" = "horizontal";

  constructor(
    id: number,
    x: number,
    y: number,
    type: EnemyType,
    mapManager: MapManager,
    entityManager: EntityManager
  ) {
    const scaledWidth = ENEMY_SPRITE_WIDTH * ENEMY_SCALE_FACTOR;
    const scaledHeight = ENEMY_SPRITE_HEIGHT * ENEMY_SCALE_FACTOR;
    super(id, x, y, scaledWidth, scaledHeight);

    this.maxHealth = type.health;
    this.health = this.maxHealth;
    this.movementType = type.movementType;
    this.mapManager = mapManager;
    this.entityManager = entityManager;

    // Load all sprite sheets for the different states into a map
    this.spriteSheets = new Map();
    this.spriteSheets.set(
      "idle",
      document.getElementById(type.idleSpriteSheetId) as HTMLImageElement
    );
    this.spriteSheets.set(
      "walk",
      document.getElementById(type.walkSpriteSheetId) as HTMLImageElement
    );
    this.spriteSheets.set(
      "combat",
      document.getElementById(type.combatSpriteSheetId) as HTMLImageElement
    );

    this.spawnX = x;
    this.spawnY = y;

    // Set the initial state and sprite sheet
    this.state = this.movementType === "stationary" ? "idle" : "wandering";
    this.currentSpriteSheet = this.spriteSheets.get(
      this.state === "idle" ? "idle" : "walk"
    )!;

    this.moveTargetX = x;
    this.moveTargetY = y;
    this.healthRegenPerSec = this.maxHealth * 0.01;
  }

  public update(deltaTime: number): void {
    this.regenerate(deltaTime);
    this.updateState();
    this.updateAnimation(deltaTime);

    if (this.movementType === "wander_cardinal") {
      this.wanderCardinal(deltaTime);
    }

    this.move(deltaTime);
  }

  // --- Public method to command the enemy to a specific point ---
  public moveTo(x: number, y: number): void {
    this.moveTargetX = x;
    this.moveTargetY = y;
    this.clampMoveTarget(false); // Do NOT enforce the wander zone for direct commands
    this.setState("wandering");

    // Reset movement state for the new path
    this.cardinalMoveTimer = this.cardinalMoveDuration;
    const dx = this.moveTargetX - this.worldX;
    const dy = this.moveTargetY - this.worldY;
    this.currentMoveAxis =
      Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
  }

  private updateAnimation(deltaTime: number): void {
    this.animationTimer += deltaTime;
    if (this.animationTimer > this.animationInterval) {
      this.animationTimer = 0;
      this.frameX++;

      // Use the correct frame count based on the current state
      const frameCount =
        this.state === "idle" || this.state === "in_combat"
          ? ENEMY_IDLE_FRAME_COUNT
          : ENEMY_WALK_FRAME_COUNT;
      if (this.frameX >= frameCount) {
        this.frameX = 0;
      }
    }
  }

  private regenerate(deltaTime: number): void {
    if (this.state !== "in_combat" && this.health < this.maxHealth) {
      const regenAmount = this.healthRegenPerSec * (deltaTime / 1000);
      this.health += regenAmount;
      if (this.health > this.maxHealth) {
        this.health = this.maxHealth;
      }
    }
  }

  private updateState(): void {
    if (this.state === "in_combat") {
      if (Date.now() - this.lastDamageTime > this.combatTimeout) {
        const newState =
          this.movementType === "stationary" ? "idle" : "wandering";
        this.setState(newState);
      }
    }
  }

  // Centralized state-setting function to manage sprite sheet changes
  private setState(newState: EnemyState): void {
    if (this.state === newState) return;

    this.state = newState;
    this.frameX = 0; // Reset animation on state change

    switch (newState) {
      case "idle":
        this.currentSpriteSheet = this.spriteSheets.get("idle")!;
        break;
      case "wandering":
        this.currentSpriteSheet = this.spriteSheets.get("walk")!;
        break;
      case "in_combat":
        this.currentSpriteSheet = this.spriteSheets.get("combat")!;
        break;
    }
  }

  private move(deltaTime: number): void {
    if (this.state === "idle" || this.state === "in_combat") return;

    const dx = this.moveTargetX - this.worldX;
    const dy = this.moveTargetY - this.worldY;

    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      this.setState("idle");
      return;
    }

    this.cardinalMoveTimer -= deltaTime;

    // Switch axis if timer expires or if we've reached the target on the current axis
    if (
      this.cardinalMoveTimer <= 0 ||
      (this.currentMoveAxis === "horizontal" && Math.abs(dx) < 2) ||
      (this.currentMoveAxis === "vertical" && Math.abs(dy) < 2)
    ) {
      this.cardinalMoveTimer = this.cardinalMoveDuration;
      // Switch to the other axis
      this.currentMoveAxis =
        this.currentMoveAxis === "horizontal" ? "vertical" : "horizontal";
    }

    const moveAmount = this.speed * (deltaTime / 1000);
    let moved = false;

    // --- Move on the current designated axis ---
    if (this.currentMoveAxis === "horizontal" && Math.abs(dx) > 1) {
      const moveX = Math.sign(dx) * Math.min(moveAmount, Math.abs(dx));
      const nextX = this.worldX + moveX;
      this.frameY = dx > 0 ? 2 : 1; // 2=right, 1=left

      const checkX =
        moveX > 0 ? nextX + this.width / 2 : nextX - this.width / 2;
      if (
        !this.mapManager.isAreaSolid(
          checkX,
          this.worldY - this.height / 2,
          1,
          this.height
        ) &&
        !this.isCollidingWithObject(nextX, this.worldY)
      ) {
        this.worldX = nextX;
        moved = true;
      }
    } else if (this.currentMoveAxis === "vertical" && Math.abs(dy) > 1) {
      const moveY = Math.sign(dy) * Math.min(moveAmount, Math.abs(dy));
      const nextY = this.worldY + moveY;
      this.frameY = dy > 0 ? 0 : 3; // 0=down, 3=up

      const checkY =
        moveY > 0 ? nextY + this.height / 2 : nextY - this.height / 2;
      if (
        !this.mapManager.isAreaSolid(
          this.worldX - this.width / 2,
          checkY,
          this.width,
          1
        ) &&
        !this.isCollidingWithObject(this.worldX, nextY)
      ) {
        this.worldY = nextY;
        moved = true;
      }
    }

    // If we were supposed to move but couldn't, find a new target
    if (!moved) {
      this.findNewWanderTarget();
    }
  }

  private wanderCardinal(deltaTime: number): void {
    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0 && this.state === "idle") {
      this.findNewWanderTarget();
    }
  }

  private findNewWanderTarget(): void {
    const wanderRadius = 100;
    let targetX, targetY;
    if (Math.random() > 0.5) {
      targetX = this.spawnX + (Math.random() - 0.5) * 2 * wanderRadius;
      targetY = this.spawnY;
    } else {
      targetX = this.spawnX;
      targetY = this.spawnY + (Math.random() - 0.5) * 2 * wanderRadius;
    }
    this.wanderTimer = 2000 + Math.random() * 3000;
    // Use the public moveTo function to start the new path
    this.moveTo(targetX, targetY);
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.drawSprite(context);

    if (DEBUG_MODE) {
      this.drawDebugInfo(context);
    } else if (this.state === "in_combat") {
      this.drawHealthBar(context);
    }
  }

  private drawSprite(context: CanvasRenderingContext2D): void {
    const drawX = this.worldX - this.width / 2;
    const drawY = this.worldY - this.height / 2;

    const strideX = ENEMY_SPRITE_WIDTH + ENEMY_SPRITE_GAP;
    const strideY = ENEMY_SPRITE_HEIGHT + ENEMY_SPRITE_GAP;

    context.drawImage(
      this.currentSpriteSheet,
      ENEMY_SPRITE_PADDING + this.frameX * strideX,
      ENEMY_SPRITE_PADDING + this.frameY * strideY,
      ENEMY_SPRITE_WIDTH,
      ENEMY_SPRITE_HEIGHT,
      drawX,
      drawY,
      this.width,
      this.height
    );
  }

  private drawDebugInfo(context: CanvasRenderingContext2D): void {
    // Draw collision box
    const drawX = this.worldX - this.width / 2;
    const drawY = this.worldY - this.height / 2;
    context.strokeStyle = "blue";
    context.lineWidth = 1;
    context.strokeRect(drawX, drawY, this.width, this.height);

    this.drawHealthBar(context);
  }

  private drawHealthBar(context: CanvasRenderingContext2D): void {
    const healthBarWidth = this.width;
    const healthBarHeight = 5;
    const healthPercentage = this.health / this.maxHealth;

    context.fillStyle = "red";
    context.fillRect(
      this.worldX - this.width / 2,
      this.worldY - this.height / 2 - 10,
      healthBarWidth,
      healthBarHeight
    );

    context.fillStyle = "green";
    context.fillRect(
      this.worldX - this.width / 2,
      this.worldY - this.height / 2 - 10,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
  }

  public override takeDamage(amount: number): void {
    this.health -= amount;
    this.setState("in_combat");
    this.lastDamageTime = Date.now();
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  private isCollidingWithObject(proposedX: number, proposedY: number): boolean {
    const thisLeft = proposedX - this.width / 2;
    const thisRight = proposedX + this.width / 2;
    const thisTop = proposedY - this.height / 2;
    const thisBottom = proposedY + this.height / 2;
    for (const other of this.entityManager.allObjects) {
      if (other.id === this.id || !other.isCollidable) continue;
      const otherLeft = other.worldX - other.width / 2;
      const otherRight = other.worldX + other.width / 2;
      const otherTop = other.worldY - other.height / 2;
      const otherBottom = other.worldY + other.height / 2;
      if (
        thisRight > otherLeft &&
        thisLeft < otherRight &&
        thisBottom > otherTop &&
        thisTop < otherBottom
      ) {
        return true;
      }
    }
    return false;
  }

  // UPDATED: This now accepts a boolean to control wander zone enforcement
  private clampMoveTarget(enforceWanderZone: boolean): void {
    if (enforceWanderZone) {
      const dx = this.moveTargetX - this.spawnX;
      const dy = this.moveTargetY - this.spawnY;
      const distFromSpawn = Math.sqrt(dx * dx + dy * dy);
      if (distFromSpawn > this.wanderZoneRadius) {
        this.moveTargetX =
          this.spawnX + (dx / distFromSpawn) * this.wanderZoneRadius;
        this.moveTargetY =
          this.spawnY + (dy / distFromSpawn) * this.wanderZoneRadius;
      }
    }

    // Always clamp to map boundaries
    this.moveTargetX = Math.max(
      this.width / 2,
      Math.min(this.moveTargetX, this.mapManager.mapPixelWidth - this.width / 2)
    );
    this.moveTargetY = Math.max(
      this.height / 2,
      Math.min(
        this.moveTargetY,
        this.mapManager.mapPixelHeight - this.height / 2
      )
    );
  }
}
