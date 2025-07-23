// Game-wide constants
export const DEBUG_MODE = true;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = TileMaps.mmoMap.tilewidth; // 32
export const MAP_WIDTH = TileMaps.mmoMap.width * TILE_SIZE; // 92 * 32 = 2944
export const MAP_HEIGHT = TileMaps.mmoMap.height * TILE_SIZE; // 64 * 32 = 2048
// Tileset properties (YOU MUST PROVIDE THIS VALUE)
export const TILESET_COLUMNS = 56; // The number of tile columns in your tileset image
export const TILESET_IMAGE_SRC = 'assets/maps/slatesV2.png';
// Player specific constants
export const PLAYER_SPEED = 0.2;
export const PLAYER_SPRITE_WIDTH = 32;
export const PLAYER_SPRITE_HEIGHT = 32;
export const PLAYER_SPRITE_PADDING = 16;
export const PLAYER_SPRITE_GAP = 32;
export const PLAYER_SCALE_FACTOR = 3;
export const PLAYER_FEET_OFFSET_Y = 28; // Adjust this value to match your sprite's feet
export const PLAYER_ANIMATION_SPEED = 8;
export const PLAYER_IDLE_FRAME_COUNT = 12; // Frames in the idle animation
export const PLAYER_WALK_FRAME_COUNT = 6; // Frames in the walking animation
