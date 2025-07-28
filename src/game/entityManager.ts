import { Enemy } from "./enemy";
import { EnemyTypes } from "./enemyTypes";
import { GameObject } from "./gameObject";
import { MapManager } from "./mapManager";

export class EntityManager {
  public allObjects: GameObject[] = [];
  private mapManager: MapManager;

  private nextId: number = 0; // Counter for unique IDs

  constructor(mapManager: MapManager) {
    // For demonstration, let's spawn one enemy using the new system
    this.mapManager = mapManager;
    this.spawn("blue_slime", 500, 300);
  }

  /**
   * Creates a new GameObject, assigns it a unique ID, and adds it to the game world.
   * @param type The type of object to spawn (e.g., 'enemy').
   * @param x The world x-coordinate.
   * @param y The world y-coordinate.
   * @returns The newly created GameObject, or null if the type is unknown.
   */
  public spawn(type: string, x: number, y: number): GameObject | null {
    const id = this.nextId++;
    let newObject: GameObject | null = null;

    const enemyType = EnemyTypes[type];
    if (enemyType) {
      // Create a new Enemy using the data from the enemy type configuration
      newObject = new Enemy(id, x, y, enemyType, this.mapManager, this);
    } else {
      console.error(`Unknown enemy type to spawn: ${type}`);
      return null;
    }

    if (newObject) {
      this.allObjects.push(newObject);
    }

    return newObject;
  }

  public update(deltaTime: number): void {
    // Update all objects
    this.allObjects.forEach((obj) => obj.update(deltaTime));

    // Filter out the dead ones
    this.allObjects = this.allObjects.filter((obj) => obj.isAlive);

    this.allObjects.forEach((obj) => {
      if (obj.id === 2) {
        console.log(`Object id:${obj.id}, X:${obj.worldX}, Y:${obj.worldY}`);
      }
    });
  }

  public draw(context: CanvasRenderingContext2D): void {
    // Draw all objects
    this.allObjects.forEach((obj) => obj.draw(context));
  }

  // Helper to get just the enemies if needed elsewhere (e.g., for player attack collision)
  public getEnemies(): Enemy[] {
    return this.allObjects.filter((obj) => obj instanceof Enemy) as Enemy[];
  }
}
