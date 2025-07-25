import {
  DEBUG_MODE,
  PLAYER_ANIMATION_SPEED,
  PLAYER_BASE_HEALTH,
  PLAYER_BASE_HEALTH_REGEN,
  PLAYER_BASE_MANA,
  PLAYER_BASE_MANA_REGEN,
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
import { EntityManager } from "./entityManager";
import { InputManager } from "./inputManager";
import { MapManager } from "./mapManager";
import { PlayerSkills } from "./skill";

type PlayerState = "idle" | "walking" | "running" | "attacking";

interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Player {
  public worldX: number;
  public worldY: number;
  public speed: number;

  // --- Public Stats for UI ---
  public health: number;
  public maxHealth: number;
  public mana: number;
  public maxMana: number;

  private mapManager: MapManager;
  private entityManager: EntityManager;
  private scaleFactor: number;
  private width: number;
  private height: number;

  private spriteSheets: Map<string, HTMLImageElement>;
  private currentImage: HTMLImageElement;
  private state: PlayerState;
  private frameX: number;
  private frameY: number;
  private animationTimer: number;
  private animationInterval: number;

  private skillCooldowns: Map<string, number>;
  private baseAttackCooldownMultiplier: number = 1.0;
  private attackHitbox: Hitbox | null = null;

  private healthRegenRate: number;
  private manaRegenRate: number;

  constructor(mapManager: MapManager, entityManager: EntityManager) {
    this.mapManager = mapManager;
    this.entityManager = entityManager;
    this.scaleFactor = PLAYER_SCALE_FACTOR;
    this.speed = PLAYER_WALK_SPEED;

    // --- Initialize Health and Mana ---
    this.maxHealth = PLAYER_BASE_HEALTH;
    this.health = this.maxHealth;
    this.maxMana = PLAYER_BASE_MANA;
    this.mana = this.maxMana;
    this.healthRegenRate = PLAYER_BASE_HEALTH_REGEN;
    this.manaRegenRate = PLAYER_BASE_MANA_REGEN;

    this.spriteSheets = new Map();
    for (const skillKey in PlayerSkills) {
      const skill = PlayerSkills[skillKey];
      const imageElement = document.getElementById(
        skill.spriteSheetId
      ) as HTMLImageElement;
      if (imageElement) {
        this.spriteSheets.set(skillKey, imageElement);
      }
    }
    // Also load the base sprites
    this.spriteSheets.set(
      "idle",
      document.getElementById("playerIdleSprite") as HTMLImageElement
    );
    this.spriteSheets.set(
      "walk",
      document.getElementById("playerWalkSprite") as HTMLImageElement
    );
    this.spriteSheets.set(
      "run",
      document.getElementById("playerRunSprite") as HTMLImageElement
    );

    const spawnPoint = this.mapManager.findObjectByName("playerSpawn");
    if (spawnPoint) {
      this.worldX = spawnPoint.x;
      this.worldY = spawnPoint.y;
    } else {
      console.warn("Player spawn point not found.");
      this.worldX = this.mapManager.mapPixelWidth / 2;
      this.worldY = this.mapManager.mapPixelHeight / 2;
    }

    this.state = "idle";
    this.currentImage = this.spriteSheets.get("idle")!;
    this.frameX = 0;
    this.frameY = 0;
    this.animationTimer = 0;
    this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;

    this.width = PLAYER_SPRITE_WIDTH * this.scaleFactor;
    this.height = PLAYER_SPRITE_HEIGHT * this.scaleFactor;

    this.skillCooldowns = new Map();
    for (const skillKey in PlayerSkills) {
      this.skillCooldowns.set(skillKey, 0);
    }
  }

  public getLastAttackTime(skillKey: string): number {
    return this.skillCooldowns.get(skillKey) || 0;
  }
  public getAttackCooldown(skillKey: string): number {
    const skill = PlayerSkills[skillKey];
    return skill ? skill.cooldown * this.baseAttackCooldownMultiplier : 0;
  }

  public update(input: InputManager, deltaTime: number): void {
    if (!deltaTime) return;
    this.regenerate(deltaTime); // NEW: Regenerate health and mana
    this.updateScaledSize();
    const moveVector = this.handleInput(input);
    this.updateAnimation(deltaTime);
    this.move(moveVector, deltaTime);
    this.enforceMapBoundaries();
  }

  public draw(context: CanvasRenderingContext2D): void {
    const drawX = this.worldX - this.width / 2;
    const drawY = this.worldY - this.height / 2;
    this.drawSprite(context, drawX, drawY);
    if (DEBUG_MODE) {
      this.drawDebugInfo(context);
    }
  }

  private handleInput(input: InputManager): { x: number; y: number } {
    if (this.state === "attacking") {
      return { x: 0, y: 0 };
    }

    if (input.skillJustPressed && this.canAttack(input.skillJustPressed)) {
      this.performAttack(input.skillJustPressed);
      return { x: 0, y: 0 };
    }

    const direction = input.direction;
    const isRunning = input.isRunning;
    let newState: PlayerState = "idle";
    if (direction && isRunning) {
      newState = "running";
    } else if (direction) {
      newState = "walking";
    }
    this.setState(newState);

    let moveX = 0,
      moveY = 0;
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

  private setState(newState: PlayerState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.frameX = 0;
    this.animationInterval = 1000 / PLAYER_ANIMATION_SPEED;

    switch (this.state) {
      case "idle":
        this.speed = 0;
        this.currentImage = this.spriteSheets.get("idle")!;
        break;
      case "walking":
        this.speed = PLAYER_WALK_SPEED;
        this.currentImage = this.spriteSheets.get("walk")!;
        break;
      case "running":
        this.speed = PLAYER_RUN_SPEED;
        this.currentImage = this.spriteSheets.get("run")!;
        break;
    }
  }

  private updateAnimation(deltaTime: number): void {
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
          for (const key in PlayerSkills) {
            if (this.currentImage === this.spriteSheets.get(key)) {
              frameCount = PlayerSkills[key].frameCount;
              break;
            }
          }
          break;
      }
      if (this.frameX >= frameCount) {
        if (this.state === "attacking") {
          this.attackHitbox = null;
          this.setState("idle");
        } else {
          this.frameX = 0;
        }
      }
    }
  }

  private drawDebugInfo(context: CanvasRenderingContext2D): void {
    const drawX = this.worldX - this.width / 2;
    const drawY = this.worldY - this.height / 2;
    context.strokeStyle = "red";
    context.lineWidth = 2;
    context.strokeRect(drawX, drawY, this.width, this.height);
    if (this.state === "attacking" && this.attackHitbox) {
      context.strokeStyle = "cyan";
      context.lineWidth = 1;
      context.strokeRect(
        this.attackHitbox.x,
        this.attackHitbox.y,
        this.attackHitbox.width,
        this.attackHitbox.height
      );
    }
  }

  private updateScaledSize(): void {
    this.width = PLAYER_SPRITE_WIDTH * this.scaleFactor;
    this.height = PLAYER_SPRITE_HEIGHT * this.scaleFactor;
  }
  private move(moveVector: { x: number; y: number }, deltaTime: number): void {
    const speed = this.speed * deltaTime;
    const nextX = this.worldX + moveVector.x * speed;
    if (moveVector.x !== 0) {
      const checkX =
        moveVector.x > 0 ? nextX + this.width / 2 : nextX - this.width / 2;
      if (
        !this.mapManager.isAreaSolid(
          checkX,
          this.worldY - this.height / 2,
          1,
          this.height
        )
      ) {
        this.worldX = nextX;
      }
    }
    const nextY = this.worldY + moveVector.y * speed;
    if (moveVector.y !== 0) {
      const checkY =
        moveVector.y > 0 ? nextY + this.height / 2 : nextY - this.height / 2;
      if (
        !this.mapManager.isAreaSolid(
          this.worldX - this.width / 2,
          checkY,
          this.width,
          1
        )
      ) {
        this.worldY = nextY;
      }
    }
  }
  private enforceMapBoundaries(): void {
    this.worldX = Math.max(
      this.width / 2,
      Math.min(this.worldX, this.mapManager.mapPixelWidth - this.width / 2)
    );
    this.worldY = Math.max(
      this.height / 2,
      Math.min(this.worldY, this.mapManager.mapPixelHeight - this.height / 2)
    );
  }
  private drawSprite(
    context: CanvasRenderingContext2D,
    drawX: number,
    drawY: number
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
      this.width,
      this.height
    );
  }

  private performAttack(skillKey: string): void {
    const skill = PlayerSkills[skillKey];
    if (!skill) return;

    // --- UPDATED: Subtract mana cost ---
    this.mana -= skill.manaCost;

    this.state = "attacking";
    this.frameX = 0;
    this.skillCooldowns.set(skillKey, Date.now());
    this.currentImage = this.spriteSheets.get(skillKey)!;
    this.speed = 0;
    this.animationInterval = 1000 / skill.animationSpeed;

    const hitbox: Hitbox = { x: 0, y: 0, width: 0, height: 0 };
    const playerLeft = this.worldX - this.width / 2;
    const playerTop = this.worldY - this.height / 2;

    switch (this.frameY) {
      case 0:
        hitbox.width = this.width;
        hitbox.height = this.height / 2;
        hitbox.x = playerLeft;
        hitbox.y = this.worldY;
        break;
      case 1:
        hitbox.width = this.width / 2;
        hitbox.height = this.height;
        hitbox.x = playerLeft;
        hitbox.y = playerTop;
        break;
      case 2:
        hitbox.width = this.width / 2;
        hitbox.height = this.height;
        hitbox.x = this.worldX;
        hitbox.y = playerTop;
        break;
      case 3:
        hitbox.width = this.width;
        hitbox.height = this.height / 2;
        hitbox.x = playerLeft;
        hitbox.y = playerTop;
        break;
    }
    this.attackHitbox = hitbox;

    for (const enemy of this.entityManager.enemies) {
      const enemyLeft = enemy.worldX - enemy.width / 2;
      const enemyTop = enemy.worldY - enemy.height / 2;
      if (
        hitbox.x < enemyLeft + enemy.width &&
        hitbox.x + hitbox.width > enemyLeft &&
        hitbox.y < enemyTop + enemy.height &&
        hitbox.y + hitbox.height > enemyTop
      ) {
        enemy.takeDamage(skill.damage);
      }
    }
  }

  private canAttack(skillKey: string): boolean {
    const lastUse = this.skillCooldowns.get(skillKey) || 0;
    const cooldown = this.getAttackCooldown(skillKey);
    return Date.now() - lastUse > cooldown;
  }

  private regenerate(deltaTime: number): void {
    // Regenerate health
    if (this.health < this.maxHealth) {
      this.health += this.healthRegenRate * (deltaTime / 1000);
      if (this.health > this.maxHealth) {
        this.health = this.maxHealth;
      }
    }
    // Regenerate mana
    if (this.mana < this.maxMana) {
      this.mana += this.manaRegenRate * (deltaTime / 1000);
      if (this.mana > this.maxMana) {
        this.mana = this.maxMana;
      }
    }
  }
}
