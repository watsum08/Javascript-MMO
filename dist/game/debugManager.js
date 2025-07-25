export class DebugManager {
    fps = 0;
    frameCount = 0;
    lastFpsUpdateTime = 0;
    InputManager;
    game;
    constructor(InputManager, gameInstance) {
        this.InputManager = InputManager;
        this.game = gameInstance;
    }
    update(currentTime) {
        // Calculate FPS once per second
        this.frameCount++;
        if (currentTime - this.lastFpsUpdateTime > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdateTime = currentTime;
        }
    }
    draw(context) {
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations
        const font = "bold 12px Arial";
        const color = "darkgreen";
        const margin = 10;
        // Draw FPS
        context.font = font;
        context.fillStyle = color;
        context.fillText(`FPS: ${this.fps}`, this.game.canvasWidth - 60, 15);
        // Draw InputManager state
        const keysText = "direction: " + `${this.InputManager.direction}`;
        context.fillText(keysText, margin, 50);
        context.restore();
    }
}
