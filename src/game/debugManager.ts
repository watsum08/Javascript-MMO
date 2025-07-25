import { Game } from "./game";
import { InputManager } from "./inputManager";

export class DebugManager {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = 0;
  private InputManager: InputManager;
  private game: Game;

  constructor(InputManager: InputManager, gameInstance: Game) {
    this.InputManager = InputManager;
    this.game = gameInstance;
  }

  public update(currentTime: number): void {
    // Calculate FPS once per second
    this.frameCount++;
    if (currentTime - this.lastFpsUpdateTime > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdateTime = currentTime;
    }
  }

  public draw(context: CanvasRenderingContext2D): void {
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
