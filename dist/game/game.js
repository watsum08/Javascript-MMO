import { CANVAS_ZOOM } from "./constants.js";
import { EntityManager } from "./entityManager.js";
import { MapManager } from "./mapManager.js";
import { Player } from "./player.js";
import { UIManager } from "./uiManager.js";
export class Game {
    player;
    input;
    camera;
    canvasWidth;
    canvasHeight;
    mapManager;
    entityManager;
    uiManager;
    constructor(inputHandler) {
        // Use the inputHandler passed from main.ts
        this.input = inputHandler;
        // Create the mapManager ONCE
        this.mapManager = new MapManager();
        this.entityManager = new EntityManager(); // 3. Create an instance of the entity manager
        this.uiManager = new UIManager(); // 3. Create an instance of the UI manager
        // load base map
        this.mapManager.loadMap("mmoMap");
        // Pass the mapManager to the player
        this.player = new Player(this.mapManager, this.entityManager);
        this.camera = { x: 0, y: 0 };
        this.canvasWidth = window.innerWidth / CANVAS_ZOOM;
        this.canvasHeight = window.innerHeight / CANVAS_ZOOM;
    }
    update(deltaTime) {
        this.input.update();
        // The player now gets the input handler via the update call
        this.player.update(this.input, deltaTime);
        this.entityManager.update(deltaTime);
        // Update camera position based on the player
        this.camera.x = this.player.worldX - this.canvasWidth / 2;
        this.camera.y = this.player.worldY - this.canvasHeight / 2;
        // Clamp camera to map boundaries
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.mapManager.mapPixelWidth - this.canvasWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.mapManager.mapPixelHeight - this.canvasHeight));
    }
    draw(context) {
        context.save();
        context.translate(Math.round(-this.camera.x), Math.round(-this.camera.y));
        // Y-sorted draw order
        this.mapManager.drawLayer(context, "BelowPlayer");
        // 6. Draw the entities (enemies, etc.)
        this.entityManager.draw(context);
        this.player.draw(context);
        this.mapManager.drawLayer(context, "AbovePlayer");
        // Draw debug visuals
        this.mapManager.drawCollisionDebug(context);
        context.restore();
        // 4. Draw the UI on top of everything, not affected by the camera
        this.uiManager.draw(context, this.player);
    }
}
