import { CANVAS_HEIGHT, CANVAS_WIDTH, MAP_HEIGHT, MAP_WIDTH } from './constants';
import { InputHandler } from './input.js';
import { Player } from './player.js';

interface Camera {
    x: number;
    y: number;
}

export class Game {
    public player: Player;
    public input: InputHandler;
    public backgroundImage: HTMLImageElement;
    public camera: Camera;

    constructor() {
        this.player = new Player();
        this.input = new InputHandler();
        this.backgroundImage = document.getElementById('backgroundImage') as HTMLImageElement;
        this.camera = { x: 0, y: 0 };
    }

    update(deltaTime: number): void {
        this.player.update(this.input, deltaTime);

        this.camera.x = this.player.worldX - CANVAS_WIDTH / 2;
        this.camera.y = this.player.worldY - CANVAS_HEIGHT / 2;

        // Clamp camera
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.y < 0) this.camera.y = 0;
        if (this.camera.x + CANVAS_WIDTH > MAP_WIDTH) this.camera.x = MAP_WIDTH - CANVAS_WIDTH;
        if (this.camera.y + CANVAS_HEIGHT > MAP_HEIGHT) this.camera.y = MAP_HEIGHT - CANVAS_HEIGHT;
    }

    draw(context: CanvasRenderingContext2D): void {
        context.save();
        context.translate(-this.camera.x, -this.camera.y);
        context.drawImage(this.backgroundImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.player.draw(context);
        context.restore();
    }
}