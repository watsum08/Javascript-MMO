import { CANVAS_ZOOM } from "./constants.js";
import { Enemy } from "./enemy.js";
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
    constructor(InputManager) {
        // Use the InputManager passed from main.ts
        this.input = InputManager;
        // Create the mapManager ONCE
        this.mapManager = new MapManager();
        this.entityManager = new EntityManager(this.mapManager); // 3. Create an instance of the entity manager
        this.uiManager = new UIManager(); // 3. Create an instance of the UI manager
        // load base map
        this.mapManager.loadMap("mmoMap");
        // Pass the mapManager to the player
        this.player = new Player(this.mapManager, this.entityManager);
        this.camera = { x: 0, y: 0 };
        this.canvasWidth = window.innerWidth / CANVAS_ZOOM;
        this.canvasHeight = window.innerHeight / CANVAS_ZOOM;
        this.entityManager.spawn("red_demon", 100, 200);
        const enemy1 = this.entityManager.spawn("blue_slime", 16, 16);
        if (enemy1 instanceof Enemy) {
            enemy1.moveTo(0, 0);
        }
    }
    update(deltaTime) {
        this.input.update();
        // The player now gets the input handler via the update call
        this.player.update(this.input, deltaTime);
        this.entityManager.update(deltaTime);
        this.entityManager.allObjects.forEach((obj) => {
            if (obj.id === 2 && obj instanceof Enemy) {
                obj.moveTo(this.player.worldX, this.player.worldY);
            }
        });
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
        this.uiManager.draw(context, this.player, this.input);
    }
}
