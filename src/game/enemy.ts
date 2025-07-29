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

  // 1. Keep track of the last “locked” target:
  private lastLockedTargetX: number;
  private lastLockedTargetY: number;

  // in Enemy class:
  private readonly minBurst = 200; // ms
  private readonly maxBurst = 500; // ms

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

  // --- NEW: Properties for Timed Cardinal Movement ---
  private cardinalMoveTimer: number = 0;
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

    this.lastLockedTargetX = x;
    this.lastLockedTargetY = y;
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

  // 2. Update moveTo() so it only resets on a significant change:
  public moveTo(x: number, y: number): void {
    // Always update the raw target coords
    this.moveTargetX = x;
    this.moveTargetY = y;
    this.clampMoveTarget(false);
    this.setState("wandering");

    // If the “locked” target hasn’t moved by at least 1px, bail out
    const dx = x - this.lastLockedTargetX;
    const dy = y - this.lastLockedTargetY;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      // only the raw target changed by <1px, so don’t reset the timer
      return;
    }

    // Otherwise it’s a new “burst,” so lock it and reset the axis+timer
    this.lastLockedTargetX = this.moveTargetX;
    this.lastLockedTargetY = this.moveTargetY;
    this.resetMovementPath();
  }

  private updateAnimation(deltaTime: number): void {
    this.animationTimer += deltaTime;
    if (this.animationTimer > this.animationInterval) {
      this.animationTimer = 0;
      this.frameX++;

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

  private setState(newState: EnemyState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.frameX = 0;

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

  // helper to factor out collision checks + sprite‐direction
  private tryMove(deltaX: number, deltaY: number): boolean {
    const nextX = this.worldX + deltaX;
    const nextY = this.worldY + deltaY;

    const canMoveX =
      deltaX === 0 ||
      (!this.mapManager.isAreaSolid(
        nextX + (deltaX > 0 ? this.width / 2 : -this.width / 2),
        this.worldY - this.height / 2,
        1,
        this.height
      ) &&
        !this.isCollidingWithObject(nextX, this.worldY));

    const canMoveY =
      deltaY === 0 ||
      (!this.mapManager.isAreaSolid(
        this.worldX - this.width / 2,
        nextY + (deltaY > 0 ? this.height / 2 : -this.height / 2),
        this.width,
        1
      ) &&
        !this.isCollidingWithObject(this.worldX, nextY));

    if (deltaX !== 0 && canMoveX) {
      this.worldX = nextX;
      this.frameY = deltaX > 0 ? 2 : 1;
      return true;
    } else if (deltaY !== 0 && canMoveY) {
      this.worldY = nextY;
      this.frameY = deltaY > 0 ? 0 : 3;
      return true;
    }

    // couldn't move
    return false;
  }

  public move(deltaTime: number): void {
    if (this.state !== "wandering") return;

    const dx = this.moveTargetX - this.worldX;
    const dy = this.moveTargetY - this.worldY;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      this.setState("idle");
      return;
    }

    // countdown burst timer
    this.cardinalMoveTimer -= deltaTime;
    if (this.cardinalMoveTimer <= 0) {
      this.switchMoveAxis();
    }

    const moveAmount = this.speed * (deltaTime / 1000);
    let moved = false;

    // attempt current axis
    if (this.currentMoveAxis === "horizontal" && Math.abs(dx) > 1) {
      const stepX = Math.sign(dx) * Math.min(moveAmount, Math.abs(dx));
      moved = this.tryMove(stepX, 0);
    } else if (this.currentMoveAxis === "vertical" && Math.abs(dy) > 1) {
      const stepY = Math.sign(dy) * Math.min(moveAmount, Math.abs(dy));
      moved = this.tryMove(0, stepY);
    }

    // if blocked on your axis, flip & try the other one
    if (!moved) {
      const originalAxis = this.currentMoveAxis;
      const flipped = originalAxis === "horizontal" ? "vertical" : "horizontal";
      this.currentMoveAxis = flipped;

      if (flipped === "horizontal" && Math.abs(dx) > 1) {
        const stepX = Math.sign(dx) * Math.min(moveAmount, Math.abs(dx));
        moved = this.tryMove(stepX, 0);
      } else if (flipped === "vertical" && Math.abs(dy) > 1) {
        const stepY = Math.sign(dy) * Math.min(moveAmount, Math.abs(dy));
        moved = this.tryMove(0, stepY);
      }

      // if that second axis move succeeded, keep the new axis and reset burst timer
      if (moved) {
        this.resetMovementPath(); // optionally you can give a fresh burst on the new axis
      } else {
        // still didn't move → truly stuck, pick a new wander point
        this.findNewWanderTarget();
      }
    }
  }

  private switchMoveAxis(): void {
    // flip axis
    this.currentMoveAxis =
      this.currentMoveAxis === "horizontal" ? "vertical" : "horizontal";
    // new random burst, 200–500 ms
    this.cardinalMoveTimer =
      this.minBurst + Math.random() * (this.maxBurst - this.minBurst);
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
    this.moveTo(targetX, targetY);
  }

  private resetMovementPath(): void {
    // choose burst length between minBurst and maxBurst
    this.cardinalMoveTimer =
      this.minBurst + Math.random() * (this.maxBurst - this.minBurst);

    const dx = this.moveTargetX - this.worldX;
    const dy = this.moveTargetY - this.worldY;
    // tie‐breaker: exactly diagonal → start horizontal
    this.currentMoveAxis =
      Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
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
