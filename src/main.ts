import { AudioManager } from './audio'; // 1. Import AudioManager
import { CANVAS_HEIGHT, CANVAS_WIDTH, TILESET_IMAGE_SRC } from './constants';
import { Game } from './game';

window.addEventListener('load', function () {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // This function now REQUIRES a context to be passed into it.
    // This makes the dependency explicit.
    function gameLoop(timestamp: number, context: CanvasRenderingContext2D): void {
        const game = new Game(); // Assuming Game class setup is simple
        let lastTime = 0;

        // We define the actual animation frame logic inside a nested function.
        function animate(currentTime: number) {
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
    if (ctx) {
        ctx.imageSmoothingEnabled = false;
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        // 2. Add the audio tag to the assets
        const assets = document.createElement('div');
        assets.style.display = 'none';
        assets.innerHTML = `
            <img id="tileset" src="${TILESET_IMAGE_SRC}">
            <img id="playerIdleSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Idle_full.png">
            <img id="playerWalkSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Walk_full.png">
            <audio id="backgroundMusic" src="assets/audio/background_music.mp3" preload="auto"></audio>
        `;
        document.body.appendChild(assets);

        // 3. Create an instance of the AudioManager
        const audioManager = new AudioManager();

        const tileset = document.getElementById('tileset') as HTMLImageElement;
        const playerIdleSprite = document.getElementById('playerIdleSprite') as HTMLImageElement;
        const playerWalkSprite = document.getElementById('playerWalkSprite') as HTMLImageElement;
        // 4. Get the audio element
        const backgroundMusic = document.getElementById('backgroundMusic') as HTMLAudioElement;

        const allImages = [tileset, playerIdleSprite, playerWalkSprite];
        const totalAssets = allImages.length + 1; // +1 for the audio file
        let loadedAssets = 0;

        // 5. Create a shared function to run when any asset is loaded
        function assetLoaded() {
            loadedAssets++;
            if (loadedAssets === totalAssets && ctx) {
                // When all assets are ready, start the music and the game loop
                audioManager.playBackgroundMusic();
                gameLoop(performance.now(), ctx);
            }
        }

        // Attach the loader function to all images
        allImages.forEach(img => {
            img.onload = assetLoaded;
        });

        // Attach the loader function to the audio file
        backgroundMusic.addEventListener('canplaythrough', assetLoaded, { once: true });

    } else {
        // If ctx is null, the game never starts.
        console.error('2D context not found! The game cannot start.');
    }
});