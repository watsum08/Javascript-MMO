import {
  CANVAS_ZOOM,
  MAP_HEIGHT,
  MAP_WIDTH
} from "./constants";
import { InputHandler } from "./game/inputManager";
import { MapManager } from "./mapManager";
import { Player } from "./player";

interface Camera {
    x: number;
    y: number;
}

export class Game {
    public player: Player;
    public input: InputHandler;
    public camera: Camera;

    
    public canvasWidth: number;
    public canvasHeight: number;
    
    private mapManager: MapManager;

    constructor(inputHandler: InputHandler) {
        // Use the inputHandler passed from main.ts
        this.input = inputHandler;

        // Create the mapManager ONCE
        this.mapManager = new MapManager();
        
        // Pass the mapManager to the player
        this.player = new Player(this.mapManager);
        
        this.camera = { x: 0, y: 0 };

        this.canvasWidth = window.innerWidth / CANVAS_ZOOM;
        this.canvasHeight = window.innerHeight / CANVAS_ZOOM;
    }

    update(deltaTime: number): void {
        this.input.update();
        // The player now gets the input handler via the update call
        this.player.update(this.input, deltaTime);

        // Update camera position based on the player
        this.camera.x = this.player.worldX - this.canvasWidth/ 2;
        this.camera.y = this.player.worldY - this.canvasHeight / 2;

        // Clamp camera to map boundaries
        this.camera.x = Math.max(0, Math.min(this.camera.x, MAP_WIDTH - this.canvasWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, MAP_HEIGHT - this.canvasHeight));
    }

    draw(context: CanvasRenderingContext2D): void {
        context.save();
        context.translate(Math.round(-this.camera.x), Math.round(-this.camera.y));

        // Y-sorted draw order
        this.mapManager.drawLayer(context, "BelowPlayer");
        this.player.draw(context);
        this.mapManager.drawLayer(context, "AbovePlayer");

        // Draw debug visuals
        this.mapManager.drawCollisionDebug(context);

        context.restore();
    }
}
