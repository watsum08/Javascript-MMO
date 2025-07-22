export class InputHandler {
    keys;
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
        };
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w')
                this.keys.up = true;
            if (e.key === 'ArrowDown' || e.key === 's')
                this.keys.down = true;
            if (e.key === 'ArrowLeft' || e.key === 'a')
                this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd')
                this.keys.right = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w')
                this.keys.up = false;
            if (e.key === 'ArrowDown' || e.key === 's')
                this.keys.down = false;
            if (e.key === 'ArrowLeft' || e.key === 'a')
                this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd')
                this.keys.right = false;
        });
    }
}
