import { GameObject } from './gameObject';

export class Enemy extends GameObject {
    private health: number;
    private color: string = 'purple'; // For simple visual representation

    constructor(x: number, y: number, width: number, height: number, health: number = 100) {
        super(x, y, width, height);
        this.health = health;
    }

    public update(deltaTime: number): void {
        // Future AI logic goes here (e.g., move towards the player)
    }

    public draw(context: CanvasRenderingContext2D): void {
        // Draw a simple rectangle for the enemy
        context.fillStyle = this.color;
        context.fillRect(this.worldX - this.width / 2, this.worldY - this.height / 2, this.width, this.height);

        // Draw health bar
        const healthBarWidth = this.width;
        const healthBarHeight = 5;
        const healthPercentage = this.health / 100; // Assuming max health is 100
        
        context.fillStyle = 'red';
        context.fillRect(this.worldX - this.width / 2, this.worldY - this.height / 2 - 10, healthBarWidth, healthBarHeight);
        
        context.fillStyle = 'green';
        context.fillRect(this.worldX - this.width / 2, this.worldY - this.height / 2 - 10, healthBarWidth * healthPercentage, healthBarHeight);
    }

    // Override the base takeDamage method
    public override takeDamage(amount: number): void {
        this.health -= amount;
        console.log(`Enemy took ${amount} damage, has ${this.health} health remaining.`);
        
        if (this.health <= 0) {
            this.isAlive = false;
            console.log("Enemy has been defeated!");
        }
    }
}
