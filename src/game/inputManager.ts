export type Direction = 'up' | 'down' | 'left' | 'right';

export class InputHandler {
    // Public state for the Player to read
    public direction: Direction | null = null;
    public isRunning: boolean = false;
    public attackPressed: boolean = false; // NEW: Track the attack key

    // Private state to track raw key presses
    private activeKeys: Set<string> = new Set();
    private directionKeys: Direction[] = []; 

    constructor() {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            
            // Add the key to the set if it's not already there
            if (!this.activeKeys.has(key)) {
                this.activeKeys.add(key);

                // Handle direction keys for ordering
                let pressedDirection: Direction | null = null;
                if (key === 'w' || key === 'arrowup') pressedDirection = 'up';
                else if (key === 's' || key === 'arrowdown') pressedDirection = 'down';
                else if (key === 'a' || key === 'arrowleft') pressedDirection = 'left';
                else if (key === 'd' || key === 'arrowright') pressedDirection = 'right';

                if (pressedDirection) {
                    this.directionKeys.push(pressedDirection);
                }
            }
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            this.activeKeys.delete(key);

            // Handle direction keys for ordering
            let releasedDirection: Direction | null = null;
            if (key === 'w' || key === 'arrowup') releasedDirection = 'up';
            else if (key === 's' || key === 'arrowdown') releasedDirection = 'down';
            else if (key === 'a' || key === 'arrowleft') releasedDirection = 'left';
            else if (key === 'd' || key === 'arrowright') releasedDirection = 'right';

            if (releasedDirection) {
                this.directionKeys = this.directionKeys.filter(d => d !== releasedDirection);
            }
        });

        window.addEventListener('blur', () => {
            this.activeKeys.clear();
            this.directionKeys = [];
        });
    }

    public update(): void {
        // Check for movement and modifier keys
        this.isRunning = this.activeKeys.has('shift');
        this.attackPressed = this.activeKeys.has(' '); // Check for Spacebar

        // Determine direction based on the last key pressed
        if (this.directionKeys.length > 0) {
            this.direction = this.directionKeys[this.directionKeys.length - 1];
        } else {
            this.direction = null;
        }
    }
}
