// Game-wide constants
export const DEBUG_MODE = true;
export const CANVAS_WIDTH = 450;
export const CANVAS_HEIGHT = 300;
//export const TILE_SIZE: number = TileMaps.mmoMap.tilewidth; // 32
//export const MAP_WIDTH: number = TileMaps.mmoMap.width * TILE_SIZE; // 92 * 32 = 2944
//export const MAP_HEIGHT: number = TileMaps.mmoMap.height * TILE_SIZE; // 64 * 32 = 2048
export const CANVAS_ZOOM = 2.5;
// Tileset properties (YOU MUST PROVIDE THIS VALUE)
export const TILESET_COLUMNS = 56; // The number of tile columns in your tileset image
export const TILESET_IMAGE_SRC = "assets/sprites/maps/slatesV2.png";
export const PLACEHOLDER_IMAGE_SRC = "assets/images/placeholder.svg";
// Player specific constants
export const PLAYER_WALK_SPEED = 0.05;
export const PLAYER_RUN_SPEED = 0.1;
export const PLAYER_SPRITE_WIDTH = 32;
export const PLAYER_SPRITE_HEIGHT = 32;
export const PLAYER_SPRITE_PADDING = 16;
export const PLAYER_SPRITE_GAP = 32;
export const PLAYER_SCALE_FACTOR = 1;
export const PLAYER_FEET_OFFSET_Y = 28; // Adjust this value to match your sprite's feet
export const PLAYER_ANIMATION_SPEED = 8;
export const PLAYER_IDLE_FRAME_COUNT = 12; // Frames in the idle animation
export const PLAYER_WALK_FRAME_COUNT = 6; // Frames in the walking animation
export const PLAYER_RUN_FRAME_COUNT = 8; // The number of frames in your run animation
export const PLAYER_ATTACK_FRAME_COUNT = 8;
// --- Player Stats ---
export const PLAYER_BASE_HEALTH = 150;
export const PLAYER_BASE_MANA = 100;
export const PLAYER_BASE_HEALTH_REGEN = 1.5; // Health per second
export const PLAYER_BASE_MANA_REGEN = 1; // Mana per second
export const PLAYER_BASE_ATTACK_COOLDOWN = 5000;
export const PLAYER_BASE_ATTACK_SPEED = 10;
