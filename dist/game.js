import { CANVAS_HEIGHT, CANVAS_WIDTH, MAP_HEIGHT, MAP_WIDTH, } from "./constants.js";
import { InputHandler } from "./input.js";
import { MapManager } from "./map.js";
import { Player } from "./player.js";
export class Game {
    player;
    input;
    camera;
    mapManager; // Add a map manager property
    constructor() {
        this.mapManager = new MapManager();
        this.player = new Player(this.mapManager);
        this.input = new InputHandler();
        this.mapManager = new MapManager(); // Create an instance of the map manager
        this.camera = { x: 0, y: 0 };
    }
    update(deltaTime) {
        this.player.update(this.input, deltaTime);
        this.camera.x = this.player.worldX - CANVAS_WIDTH / 2;
        this.camera.y = this.player.worldY - CANVAS_HEIGHT / 2;
        // Clamp camera
        if (this.camera.x < 0)
            this.camera.x = 0;
        if (this.camera.y < 0)
            this.camera.y = 0;
        if (this.camera.x + CANVAS_WIDTH > MAP_WIDTH)
            this.camera.x = MAP_WIDTH - CANVAS_WIDTH;
        if (this.camera.y + CANVAS_HEIGHT > MAP_HEIGHT)
            this.camera.y = MAP_HEIGHT - CANVAS_HEIGHT;
    }
    draw(context) {
        context.save();
        context.translate(Math.round(-this.camera.x), Math.round(-this.camera.y));
        // The Y-sorted draw order
        this.mapManager.drawLayer(context, "BelowPlayer");
        this.player.draw(context);
        this.mapManager.drawLayer(context, "AbovePlayer");
        // Draw the map collision boxes on top of everything for visibility
        this.mapManager.drawCollisionDebug(context);
        context.restore();
    }
}
