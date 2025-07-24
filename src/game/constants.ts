// Assume TileMaps is loaded from mmoMap.js
declare const TileMaps: any;

// Game-wide constants
export const DEBUG_MODE: boolean = true;
export const CANVAS_WIDTH: number = 450;
export const CANVAS_HEIGHT: number = 300;
export const TILE_SIZE: number = TileMaps.mmoMap.tilewidth; // 32
export const MAP_WIDTH: number = TileMaps.mmoMap.width * TILE_SIZE; // 92 * 32 = 2944
export const MAP_HEIGHT: number = TileMaps.mmoMap.height * TILE_SIZE; // 64 * 32 = 2048
export const CANVAS_ZOOM: number = 3;

// Tileset properties (YOU MUST PROVIDE THIS VALUE)
export const TILESET_COLUMNS: number = 56; // The number of tile columns in your tileset image
export const TILESET_IMAGE_SRC: string = "assets/sprites/maps/slatesV2.png";
export const PLACEHOLDER_IMAGE_SRC: string = "assets/images/placeholder.svg";

// Player specific constants
export const PLAYER_WALK_SPEED: number = 0.05;
export const PLAYER_RUN_SPEED: number = 0.10;

export const PLAYER_SPRITE_WIDTH: number = 32;
export const PLAYER_SPRITE_HEIGHT: number = 32;
export const PLAYER_SPRITE_PADDING: number = 16;
export const PLAYER_SPRITE_GAP: number = 32;
export const PLAYER_SCALE_FACTOR: number = 1;
export const PLAYER_FEET_OFFSET_Y: number = 28; // Adjust this value to match your sprite's feet

export const PLAYER_ANIMATION_SPEED: number = 8;
export const PLAYER_IDLE_FRAME_COUNT: number = 12; // Frames in the idle animation
export const PLAYER_WALK_FRAME_COUNT: number = 6; // Frames in the walking animation
export const PLAYER_RUN_FRAME_COUNT: number = 8; // The number of frames in your run animation