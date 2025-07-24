export type Direction = 'up' | 'down' | 'left' | 'right';

export class InputHandler {
    // Public state for the Player to read (no changes here)
    public direction: Direction | null = null;
    public isRunning: boolean = false;

    // We use both: a Set for fast "is key down?" checks, and an array for order.
    private activeKeys: Set<string> = new Set();
    private directionKeys: Direction[] = []; // NEW: An array to track the order of direction keys.

    constructor() {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            this.activeKeys.add(key);

            // NEW: Logic to add pressed direction keys to our ordered array
            let pressedDirection: Direction | null = null;
            if (key === 'w' || key === 'arrowup') pressedDirection = 'up';
            else if (key === 's' || key === 'arrowdown') pressedDirection = 'down';
            else if (key === 'a' || key === 'arrowleft') pressedDirection = 'left';
            else if (key === 'd' || key === 'arrowright') pressedDirection = 'right';

            if (pressedDirection) {
                // Remove the key if it already exists to move it to the end
                this.directionKeys = this.directionKeys.filter(d => d !== pressedDirection);
                this.directionKeys.push(pressedDirection);
            }
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            this.activeKeys.delete(key);

            // NEW: Logic to remove released direction keys from our array
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
            this.directionKeys = []; // Also clear the direction keys array
        });
    }

    public update(): void {
        // This logic remains the same
        this.isRunning = this.activeKeys.has('shift');

        // UPDATED: The current direction is now the last key in our ordered array
        if (this.directionKeys.length > 0) {
            this.direction = this.directionKeys[this.directionKeys.length - 1];
        } else {
            this.direction = null;
        }
    }
}