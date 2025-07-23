import { CANVAS_HEIGHT, CANVAS_WIDTH, TILESET_IMAGE_SRC } from './constants.js';
import { Game } from './game.js';
window.addEventListener('load', function () {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    // This function now REQUIRES a context to be passed into it.
    // This makes the dependency explicit.
    function gameLoop(timestamp, context) {
        const game = new Game(); // Assuming Game class setup is simple
        let lastTime = 0;
        // We define the actual animation frame logic inside a nested function.
        function animate(currentTime) {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            // Use the 'context' parameter that was passed in. It's guaranteed to be valid.
            context.clearRect(0, 0, canvas.width, canvas.height);
            game.update(deltaTime);
            game.draw(context);
            requestAnimationFrame(animate);
        }
        // Start the animation loop.
        lastTime = timestamp;
        requestAnimationFrame(animate);
    }
    const ctx = canvas.getContext('2d');
    // Check for ctx ONE time.
    if (ctx) { // ✅ THIS IS THE KEY FOR CRISP PIXEL ART
        // Disable anti-aliasing to keep pixels sharp when scaling
        ctx.imageSmoothingEnabled = false;
        // Since ctx is valid here, we can start the game loop
        // and pass the valid `ctx` as the required argument.
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const assets = document.createElement('div');
        assets.style.display = 'none';
        assets.innerHTML = `
        <img id="tileset" src="${TILESET_IMAGE_SRC}">
        <img id="playerIdleSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Idle_full.png">
        <img id="playerWalkSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Walk_full.png">
    `;
        document.body.appendChild(assets);
        const tileset = document.getElementById('tileset');
        const playerIdleSprite = document.getElementById('playerIdleSprite');
        const playerWalkSprite = document.getElementById('playerWalkSprite');
        // Wait for ALL images to be ready before starting
        const allImages = [tileset, playerIdleSprite, playerWalkSprite];
        let loadedImages = 0;
        allImages.forEach(img => {
            img.onload = () => {
                loadedImages++;
                if (loadedImages === allImages.length) {
                    gameLoop(performance.now(), ctx);
                }
            };
        });
    }
    else {
        // If ctx is null, the game never starts.
        console.error('2D context not found! The game cannot start.');
    }
});
