export class AudioManager {
    private backgroundMusic: HTMLAudioElement | null = null;

    constructor() {
        this.backgroundMusic = document.getElementById('backgroundMusic') as HTMLAudioElement;
    }

    public playBackgroundMusic(): void {
        if (!this.backgroundMusic) {
            console.error("Background music element not found!");
            return;
        }

        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3; // Set a reasonable volume

        const playPromise = this.backgroundMusic.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Background music autoplay was blocked by the browser.", error);
                // If autoplay fails, show a button to let the user start the music.
                this.createPlayButton();
            });
        }
    }

    private createPlayButton(): void {
        // Avoid creating multiple buttons
        if (document.getElementById('playMusicBtn')) return;

        const button = document.createElement('button');
        button.id = 'playMusicBtn';
        button.textContent = '▶ Play Music';
        // Simple styling to place it on the screen
        button.style.position = 'fixed';
        button.style.top = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        button.style.padding = '10px 15px';
        button.style.fontSize = '16px';
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        button.style.color = 'white';
        button.style.border = '1px solid white';
        button.style.borderRadius = '8px';
        button.style.cursor = 'pointer';

        document.body.appendChild(button);

        button.addEventListener('click', () => {
            this.backgroundMusic?.play();
            button.remove();
        }, { once: true });
    }
}