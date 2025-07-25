// Maps the keyboard input ('1', '2', etc.) to the skill identifier from your skill config.
const keyToSkillMap = {
    "1": "basic",
    "2": "heavy",
    // '3': 'fireball', // Example for future skills
    // '4': 'iceNova',
    // '5': 'heal',
    // '6': 'dash',
};
export class InputManager {
    // Public state for the Player to read
    direction = null;
    isRunning = false;
    skillJustPressed = null; // Will hold the skill key ('basic', 'heavy') for one frame
    activeSkillNumberKeys = new Set(); // Add this property
    // Private state
    activeKeys = new Set();
    directionKeys = [];
    constructor() {
        window.addEventListener("keydown", (e) => {
            if (e.repeat)
                return;
            const key = e.key.toLowerCase();
            this.activeKeys.add(key);
            // Handle direction keys for ordering
            let pressedDirection = null;
            if (key === "w" || key === "arrowup")
                pressedDirection = "up";
            else if (key === "s" || key === "arrowdown")
                pressedDirection = "down";
            else if (key === "a" || key === "arrowleft")
                pressedDirection = "left";
            else if (key === "d" || key === "arrowright")
                pressedDirection = "right";
            if (pressedDirection && !this.directionKeys.includes(pressedDirection)) {
                this.directionKeys.push(pressedDirection);
            }
        });
        window.addEventListener("keyup", (e) => {
            const key = e.key.toLowerCase();
            this.activeKeys.delete(key);
            // Handle direction keys for ordering
            let releasedDirection = null;
            if (key === "w" || key === "arrowup")
                releasedDirection = "up";
            else if (key === "s" || key === "arrowdown")
                releasedDirection = "down";
            else if (key === "a" || key === "arrowleft")
                releasedDirection = "left";
            else if (key === "d" || key === "arrowright")
                releasedDirection = "right";
            if (releasedDirection) {
                this.directionKeys = this.directionKeys.filter((d) => d !== releasedDirection);
            }
        });
        window.addEventListener("blur", () => {
            this.activeKeys.clear();
            this.directionKeys = [];
        });
    }
    update() {
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
        }
        else {
            this.direction = null;
        }
    }
}
