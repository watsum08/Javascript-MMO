// Defines the structure for any enemy type in the game
export interface EnemyType {
  health: number;
  width: number;
  height: number;
  color: string;
  movementType: "stationary" | "wander_cardinal"; // We can add more later, like 'chase'
  idleSpriteSheetId: string;
  walkSpriteSheetId: string;
  combatSpriteSheetId: string;
}

// The central configuration for all enemy types.
// To add a new enemy, you just need to add a new entry here.
export const EnemyTypes: Record<string, EnemyType> = {
  blue_slime: {
    health: 100,
    width: 32,
    height: 32,
    color: "#3498db", // A nice blue color
    movementType: "stationary",
    idleSpriteSheetId: "blue-slime-idle-sprite",
    walkSpriteSheetId: "blue-slime-walk-sprite",
    combatSpriteSheetId: "blue-slime-idle-sprite",
  },
  red_demon: {
    health: 200,
    width: 48,
    height: 48,
    color: "#c0392b", // A deep red color
    movementType: "wander_cardinal", // UPDATED: This one now moves cardinally
    idleSpriteSheetId: "red-demon-idle-sprite",
    walkSpriteSheetId: "red-demon-walk-sprite",
    combatSpriteSheetId: "red-demon-idle-sprite",
  },
};
