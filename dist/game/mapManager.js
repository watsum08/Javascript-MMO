import { DEBUG_MODE, TILESET_COLUMNS } from "./constants.js";
import { TileMaps } from "./maps/mapRegistry.js";
import "./maps/mmoMap.js";
export class MapManager {
    // --- Public properties to be accessed by other classes ---
    mapWidth = 0;
    mapHeight = 0;
    tileSize = 0; // This will replace the hardcoded TILE_SIZE
    mapPixelWidth = 0; // Total width in pixels
    mapPixelHeight = 0; // Total height in pixels
    // --- Private properties ---
    tileset;
    mapData;
    layers = {};
    collisionGrid = [];
    solidTileIds = new Set();
    constructor() {
        this.tileset = document.getElementById("tileset");
    }
    loadMap(mapName) {
        const mapData = TileMaps[mapName];
        if (!mapData) {
            console.error(`Map data for "${mapName}" not found!`);
            return;
        }
        this.mapData = mapData;
        // --- CORRECTED: Set the public properties based on loaded map data ---
        // These properties should store the dimensions in TILES, not pixels.
        this.mapWidth = this.mapData.width;
        this.mapHeight = this.mapData.height;
        this.tileSize = this.mapData.tilewidth;
        this.mapPixelWidth = this.mapWidth * this.tileSize;
        this.mapPixelHeight = this.mapHeight * this.tileSize;
        this.layers = {};
        this.mapData.layers.forEach((layerData) => {
            if (layerData.type === "tilelayer" && layerData.data) {
                this.layers[layerData.name] = layerData.data;
            }
        });
        this.parseCollisionData();
        this.buildCollisionGrid();
    }
    parseCollisionData() {
        const tileset = this.mapData.tilesets[0];
        if (!tileset || !tileset.tiles)
            return;
        this.solidTileIds.clear();
        for (const tile of tileset.tiles) {
            const hasCollision = tile.properties?.find((p) => p.name === "collides" && p.value === true);
            if (hasCollision) {
                this.solidTileIds.add(tile.id + tileset.firstgid);
            }
        }
    }
    buildCollisionGrid() {
        // Now this loop iterates over tiles, which is correct and fast.
        this.collisionGrid = Array.from({ length: this.mapHeight }, () => Array(this.mapWidth).fill(false));
        for (const layer of this.mapData.layers) {
            if (layer.type !== "tilelayer" || !layer.data)
                continue;
            for (let row = 0; row < this.mapHeight; row++) {
                for (let col = 0; col < this.mapWidth; col++) {
                    const tileId = layer.data[row * this.mapWidth + col];
                    if (this.solidTileIds.has(tileId)) {
                        this.collisionGrid[row][col] = true;
                    }
                }
            }
        }
    }
    isAreaSolid(worldX, worldY, width, height) {
        const left = Math.floor(worldX / this.tileSize);
        const right = Math.floor((worldX + width) / this.tileSize);
        const top = Math.floor(worldY / this.tileSize);
        const bottom = Math.floor((worldY + height) / this.tileSize);
        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (row < 0 || row >= this.mapHeight ||
                    col < 0 || col >= this.mapWidth) {
                    return true;
                }
                if (this.collisionGrid[row] && this.collisionGrid[row][col]) {
                    return true;
                }
            }
        }
        return false;
    }
    findObjectByName(name) {
        // --- FIX: Add a guard clause to prevent crash if map isn't loaded ---
        if (!this.mapData) {
            console.error("findObjectByName was called before a map was loaded into MapManager.");
            return null;
        }
        for (const layer of this.mapData.layers) {
            if (layer.type === "objectgroup") {
                const foundObject = layer.objects.find((obj) => obj.name === name);
                if (foundObject) {
                    return { x: foundObject.x, y: foundObject.y };
                }
            }
        }
        return null;
    }
    drawLayer(context, layerName) {
        const layerData = this.layers[layerName];
        if (!layerData)
            return;
        // This loop is also now correct and fast.
        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                const tileIndex = row * this.mapWidth + col;
                let tileId = layerData[tileIndex];
                if (tileId === 0)
                    continue;
                tileId--;
                const sourceX = (tileId % TILESET_COLUMNS) * this.tileSize;
                const sourceY = Math.floor(tileId / TILESET_COLUMNS) * this.tileSize;
                const destX = col * this.tileSize;
                const destY = row * this.tileSize;
                context.drawImage(this.tileset, sourceX, sourceY, this.tileSize, this.tileSize, destX, destY, this.tileSize, this.tileSize);
            }
        }
    }
    drawCollisionDebug(context) {
        if (!DEBUG_MODE)
            return;
        context.fillStyle = 'rgba(0, 0, 255, 0.4)';
        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                if (this.collisionGrid[row][col]) {
                    context.fillRect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }
}
