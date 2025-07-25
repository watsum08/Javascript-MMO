import { AudioManager } from "./audioManager"; // 1. Import AudioManager
import {
  CANVAS_ZOOM,
  PLACEHOLDER_IMAGE_SRC,
  TILESET_IMAGE_SRC,
} from "./constants";
import { DebugManager } from "./debugManager";
import { Game } from "./game";
import { InputManager } from "./inputManager";

window.addEventListener("load", function () {
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  // This function now REQUIRES a context to be passed into it.
  // This makes the dependency explicit.
  function gameLoop(
    timestamp: number,
    context: CanvasRenderingContext2D,
    game: Game,
    debugManager: DebugManager
  ): void {
    let lastTime = 0;

    // We define the actual animation frame logic inside a nested function.
    function animate(currentTime: number) {
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
    canvas.width = window.innerWidth / CANVAS_ZOOM;
    canvas.height = window.innerHeight / CANVAS_ZOOM;

    // 2. Add the audio tag to the assets
    const assets = document.createElement("div");
    assets.style.display = "none";
    assets.innerHTML = `
            <img id="tileset" src="${TILESET_IMAGE_SRC}">
            <img id="playerIdleSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Idle_full.png">
            <img id="playerWalkSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Walk_full.png">
            <img id="playerRunSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Run_full.png">
            <img id="playerAttackSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Attack_full.png">
            <img id="playerHeavyAttackSprite" src="assets/sprites/player/Swordsman_lvl1/Swordsman_lvl1_Walk_Attack_full.png">
            <audio id="backgroundMusic" src="assets/audio/background_music.mp3" preload="auto"></audio>
        `;
    document.body.appendChild(assets);

    // 3. Create an instance of the AudioManager
    const audioManager = new AudioManager();

    const tileset = document.getElementById("tileset") as HTMLImageElement;
    const playerIdleSprite = document.getElementById(
      "playerIdleSprite"
    ) as HTMLImageElement;
    const playerWalkSprite = document.getElementById(
      "playerWalkSprite"
    ) as HTMLImageElement;
    const playerRunSprite = document.getElementById(
      "playerRunSprite"
    ) as HTMLImageElement;
    // 4. Get the audio element
    const backgroundMusic = document.getElementById(
      "backgroundMusic"
    ) as HTMLAudioElement;

    const allImages = [
      tileset,
      playerIdleSprite,
      playerWalkSprite,
      playerRunSprite,
    ];
    const totalAssets = allImages.length + 1; // +1 for the audio file
    let loadedAssets = 0;

    const inputManager = new InputManager();
    const game = new Game(inputManager);
    const debugManager = new DebugManager(inputManager, game);

    function assetHandled() {
      loadedAssets++;
      if (loadedAssets === totalAssets && ctx) {
        // This block will now run even if an asset had a 404 error
        audioManager.playBackgroundMusic();
        gameLoop(performance.now(), ctx, game, debugManager);
      }
    }

    // Attach the loader and error functions to all images
    allImages.forEach((img) => {
      // This function will be called if the image loads successfully
      img.onload = assetHandled;

      // This function will be called if the image fails to load (e.g., 404 error)
      img.onerror = () => {
        console.error(
          `Failed to load image: ${img.src}. Using placeholder instead.`
        );

        // Prevent a potential infinite loop if the placeholder is also broken
        img.onerror = null;

        // Tell the broken image to load the placeholder instead.
        // The `img.onload` event will fire again when the placeholder is ready.
        img.src = PLACEHOLDER_IMAGE_SRC;
      };
    });

    // Do the same for the audio file
    backgroundMusic.addEventListener("canplaythrough", assetHandled, {
      once: true,
    });
    backgroundMusic.onerror = () => {
      console.error(`Failed to load audio: ${backgroundMusic.src}`);
      assetHandled(); // IMPORTANT: Still count it as "handled"
    };
  } else {
    // If ctx is null, the game never starts.
    console.error("2D context not found! The game cannot start.");
  }
});
