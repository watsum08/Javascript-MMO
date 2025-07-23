type Direction = 'up' | 'down' | 'left' | 'right';

export class InputHandler {
    // This array will store active keys in the order they are pressed.
    public activeKeys: Direction[] = [];

    constructor() {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            let key: Direction | null = null;
            if (e.key === 'ArrowUp' || e.key === 'w') key = 'up';
            if (e.key === 'ArrowDown' || e.key === 's') key = 'down';
            if (e.key === 'ArrowLeft' || e.key === 'a') key = 'left';
            if (e.key === 'ArrowRight' || e.key === 'd') key = 'right';

            if (key) {
                // Remove the key if it already exists to move it to the end.
                this.activeKeys = this.activeKeys.filter(k => k !== key);
                // Add the newly pressed key to the end of the list.
                this.activeKeys.push(key);
            }
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            let key: Direction | null = null;
            if (e.key === 'ArrowUp' || e.key === 'w') key = 'up';
            if (e.key === 'ArrowDown' || e.key === 's') key = 'down';
            if (e.key === 'ArrowLeft' || e.key === 'a') key = 'left';
            if (e.key === 'ArrowRight' || e.key === 'd') key = 'right';

            if (key) {
                // When a key is released, remove it from the array.
                this.activeKeys = this.activeKeys.filter(k => k !== key);
            }
        });
    }
}