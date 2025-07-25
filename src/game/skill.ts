// Defines the structure for any skill in the game
export interface Skill {
    name: string;
    damage: number;
    cooldown: number; // Base cooldown in milliseconds
    frameCount: number;
    animationSpeed: number; // Frames per second
    spriteSheetId: string; // The ID of the <img> tag for the animation
}

// The central "Skill Book" for the player.
// To add a new skill, you just need to add a new entry here.
export const PlayerSkills: Record<string, Skill> = {
    'basic': {
        name: 'Basic Attack',
        damage: 25,
        cooldown: 5000, // 5 seconds
        frameCount: 6,
        animationSpeed: 15,
        spriteSheetId: 'playerAttackSprite'
    },
    'heavy': {
        name: 'Heavy Attack',
        damage: 60,
        cooldown: 12000, // 12 seconds
        frameCount: 8, // Assuming heavy attack has more frames
        animationSpeed: 10, // Assuming heavy attack is slower
        spriteSheetId: 'playerHeavyAttackSprite'
    }
};
