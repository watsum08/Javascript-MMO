// Define a type for the structure of the keys object for clarity
type KeyStates = {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
};

export class InputHandler {
    public keys: KeyStates;

    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
        };

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = true;
            if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = true;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = false;
            if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = false;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
        });
    }
}