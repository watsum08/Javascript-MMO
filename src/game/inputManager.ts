export type Direction = "up" | "down" | "left" | "right";

// Maps the keyboard input ('1', '2', etc.) to the skill identifier from your skill config.
const keyToSkillMap: Record<string, string> = {
  "1": "basic",
  "2": "heavy",
  // '3': 'fireball', // Example for future skills
  // '4': 'iceNova',
  // '5': 'heal',
  // '6': 'dash',
};

export class InputManager {
  // Public state for the Player to read
  public direction: Direction | null = null;
  public isRunning: boolean = false;
  public skillJustPressed: string | null = null; // Will hold the skill key ('basic', 'heavy') for one frame
  public activeSkillNumberKeys: Set<string> = new Set(); // Add this property

  // Private state
  private activeKeys: Set<string> = new Set();
  private directionKeys: Direction[] = [];

  constructor() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      this.activeKeys.add(key);

      // Handle direction keys for ordering
      let pressedDirection: Direction | null = null;
      if (key === "w" || key === "arrowup") pressedDirection = "up";
      else if (key === "s" || key === "arrowdown") pressedDirection = "down";
      else if (key === "a" || key === "arrowleft") pressedDirection = "left";
      else if (key === "d" || key === "arrowright") pressedDirection = "right";

      if (pressedDirection && !this.directionKeys.includes(pressedDirection)) {
        this.directionKeys.push(pressedDirection);
      }
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      this.activeKeys.delete(key);

      // Handle direction keys for ordering
      let releasedDirection: Direction | null = null;
      if (key === "w" || key === "arrowup") releasedDirection = "up";
      else if (key === "s" || key === "arrowdown") releasedDirection = "down";
      else if (key === "a" || key === "arrowleft") releasedDirection = "left";
      else if (key === "d" || key === "arrowright") releasedDirection = "right";

      if (releasedDirection) {
        this.directionKeys = this.directionKeys.filter(
          (d) => d !== releasedDirection
        );
      }
    });

    window.addEventListener("blur", () => {
      this.activeKeys.clear();
      this.directionKeys = [];
    });
  }

  public update(): void {
    // Reset the sets each frame
    this.skillJustPressed = null;
    this.activeSkillNumberKeys.clear();

    // Check which number keys (1-6) are currently being held down
    for (let i = 1; i <= 6; i++) {
      const key = i.toString();
      if (this.activeKeys.has(key)) {
        this.activeSkillNumberKeys.add(key); // Add '1', '2', etc. to the set
      }
    }

    // Separately, check if a pressed key corresponds to a skill to be activated
    if (this.activeSkillNumberKeys.size > 0) {
      // This logic can be adjusted, e.g., to prioritize the first key pressed
      for (const key of this.activeSkillNumberKeys) {
        if (keyToSkillMap[key]) {
          this.skillJustPressed = keyToSkillMap[key];
          break; // Only handle one skill activation per frame
        }
      }
    }

    //MOVEMENT RUNNING WALKING
    this.isRunning = this.activeKeys.has("shift");

    // Determine direction based on the last key pressed
    if (this.directionKeys.length > 0) {
      this.direction = this.directionKeys[this.directionKeys.length - 1];
    } else {
      this.direction = null;
    }
  }
}
