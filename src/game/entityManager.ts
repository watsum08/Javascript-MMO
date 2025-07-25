import { Enemy } from './enemy';
import { GameObject } from './gameObject';

export class EntityManager {
    public enemies: Enemy[] = [];
    public allObjects: GameObject[] = []; 
    // You can add other arrays here later, e.g., public destroyableObjects: DestroyableObject[] = [];

    constructor() {
        // For demonstration, let's spawn one enemy
        this.enemies.push(new Enemy(500, 300, 32, 32));
    }

    public update(deltaTime: number): void {
        // Update all enemies and filter out the dead ones
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    }

    public draw(context: CanvasRenderingContext2D): void {
        this.enemies.forEach(enemy => enemy.draw(context));
    }
}
