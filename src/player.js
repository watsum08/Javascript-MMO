import { MAP_HEIGHT, MAP_WIDTH, PLAYER_COLOR, PLAYER_RADIUS, PLAYER_SPEED } from './constants';
export class Player {
    worldX;
    worldY;
    radius;
    speed;
    color;
    constructor() {
        this.worldX = MAP_WIDTH / 2;
        this.worldY = MAP_HEIGHT / 2;
        this.radius = PLAYER_RADIUS;
        this.speed = PLAYER_SPEED;
        this.color = PLAYER_COLOR;
    }
    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.worldX, this.worldY, this.radius, 0, Math.PI * 2);
        context.fill();
    }
    update(input, deltaTime) {
        if (!deltaTime)
            return;
        let moveX = 0;
        let moveY = 0;
        if (input.keys.up)
            moveY -= 1;
        if (input.keys.down)
            moveY += 1;
        if (input.keys.left)
            moveX -= 1;
        if (input.keys.right)
            moveX += 1;
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        if (length > 0) {
            moveX = (moveX / length);
            moveY = (moveY / length);
        }
        this.worldX += moveX * this.speed * deltaTime;
        this.worldY += moveY * this.speed * deltaTime;
        // Boundary checks
        if (this.worldX - this.radius < 0)
            this.worldX = this.radius;
        if (this.worldX + this.radius > MAP_WIDTH)
            this.worldX = MAP_WIDTH - this.radius;
        if (this.worldY - this.radius < 0)
            this.worldY = this.radius;
        if (this.worldY + this.radius > MAP_HEIGHT)
            this.worldY = MAP_HEIGHT - this.radius;
    }
}
