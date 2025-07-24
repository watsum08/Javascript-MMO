import { AudioManager } from "./audioManager.js"; // 1. Import AudioManager
import { TILESET_IMAGE_SRC } from "./constants.js";
import { DebugManager } from "./debugManager.js";
import { Game } from "./game.js";
import { InputHandler } from "./inputManager.js";
window.addEventListener("load", function () {
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    // This function now REQUIRES a context to be passed into it.
    // This makes the dependency explicit.
    function gameLoop(timestamp, context, game, debugManager) {
        let lastTime = 0;
        // We define the actual animation frame logic inside a nested function.
        function animate(currentTime) {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            // Update all managers
            debugManager.update(currentTime);
            game.update(deltaTime);
            // Clear the screen and draw everything
            context.clearRect(0, 0, canvas.width, canvas.height);
            game.draw(context);
            debugManager.draw(context); // Draw debug info on top
            requestAnimationFrame(animate);
        }
        // Start the animation loop.
        lastTime = timestamp;
        requestAnimationFrame(animate);
    }
    const ctx = canvas.getContext("2d");
    // Check for ctx ONE time.
    if (ctx) {
        ctx.imageSmoothingEnabled = false;
        canvas.width = window.innerWidth / 3;
        canvas.height = window.innerHeight / 3;
        // 2. Add the audio tag to the assets
        const assets = document.createElement("div");
        assets.style.display = "none";
        assets.innerHTML = `
            <img id="tileset" src="${TILESET_IMAGE_SRC}">
            <img id="playerIdleSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Idle_full.png">
            <img id="playerWalkSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Walk_full.png">
            <img id="playerRunSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Run_full.png">
            <audio id="backgroundMusic" src="assets/audio/background_music.wav" preload="auto"></audio>
        `;
        document.body.appendChild(assets);
        // 3. Create an instance of the AudioManager
        const audioManager = new AudioManager();
        const tileset = document.getElementById("tileset");
        const playerIdleSprite = document.getElementById("playerIdleSprite");
        const playerWalkSprite = document.getElementById("playerWalkSprite");
        const playerRunSprite = document.getElementById("playerRunSprite");
        // 4. Get the audio element
        const backgroundMusic = document.getElementById("backgroundMusic");
        const allImages = [
            tileset,
            playerIdleSprite,
            playerWalkSprite,
            playerRunSprite,
        ];
        const totalAssets = allImages.length + 1; // +1 for the audio file
        let loadedAssets = 0;
        // 5. Create a shared function to run when any asset is loaded
        function assetLoaded() {
            loadedAssets++;
            if (loadedAssets === totalAssets && ctx) {
                // When all assets are ready, start the music and the game loop
                // --- Create All Game Instances Once ---
                const inputHandler = new InputHandler();
                const game = new Game(inputHandler); // Pass input handler to the game
                const debugManager = new DebugManager(inputHandler, game); // Pass input handler to the debugger
                audioManager.playBackgroundMusic();
                gameLoop(performance.now(), ctx, game, debugManager);
            }
        }
        // Attach the loader function to all images
        allImages.forEach((img) => {
            img.onload = assetLoaded;
        });
        // Attach the loader function to the audio file
        backgroundMusic.addEventListener("canplaythrough", assetLoaded, {
            once: true,
        });
    }
    else {
        // If ctx is null, the game never starts.
        console.error("2D context not found! The game cannot start.");
    }
});
