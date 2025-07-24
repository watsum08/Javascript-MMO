import { DEBUG_MODE, TILE_SIZE, TILESET_COLUMNS } from "./constants.js";
export class MapManager {
    tileset;
    mapData;
    layers = {};
    mapWidth;
    mapHeight;
    collisionGrid;
    solidTileIds;
    constructor() {
        this.tileset = document.getElementById("tileset");
        this.mapData = TileMaps.mmoMap;
        this.mapWidth = this.mapData.width;
        this.mapHeight = this.mapData.height;
        this.solidTileIds = new Set();
        this.collisionGrid = [];
        // Change how layers are parsed
        this.mapData.layers.forEach((layerData) => {
            if (layerData.type === "tilelayer" && layerData.data) {
                this.layers[layerData.name] = layerData.data;
            }
        });
        this.parseCollisionData();
        this.buildCollisionGrid();
    }
    parseCollisionData() {
        // This assumes an embedded tileset for simplicity
        const tileset = this.mapData.tilesets[0];
        if (!tileset || !tileset.tiles)
            return;
        for (const tile of tileset.tiles) {
            const hasCollision = tile.properties?.find((p) => p.name === "collides" && p.value === true);
            if (hasCollision) {
                this.solidTileIds.add(tile.id + tileset.firstgid);
            }
        }
    }
    buildCollisionGrid() {
        this.collisionGrid = Array.from({ length: this.mapHeight }, () => Array(this.mapWidth).fill(false));
        // ✅ SAFER: Iterate only over layers guaranteed to be tile layers
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
        // Get the tile coordinates for the corners of the bounding box
        const left = Math.floor(worldX / TILE_SIZE);
        const right = Math.floor((worldX + width) / TILE_SIZE);
        const top = Math.floor(worldY / TILE_SIZE);
        const bottom = Math.floor((worldY + height) / TILE_SIZE);
        // Check every tile the area overlaps
        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                // Check bounds to prevent errors
                if (row < 0 ||
                    row >= this.mapHeight ||
                    col < 0 ||
                    col >= this.mapWidth) {
                    return true; // Treat out-of-bounds as solid
                }
                // If any tile in the area is solid, return true
                if (this.collisionGrid[row][col]) {
                    return true;
                }
            }
        }
        // If we checked all the tiles and none were solid, the area is clear
        return false;
    }
    findObjectByName(name) {
        for (const layer of this.mapData.layers) {
            if (layer.type === "objectgroup") {
                const foundObject = layer.objects.find((obj) => obj.name === name);
                if (foundObject) {
                    return { x: foundObject.x, y: foundObject.y };
                }
            }
        }
        return null; // Return null if no object with that name is found
    }
    drawLayer(context, layerName) {
        const layerData = this.layers[layerName];
        if (!layerData)
            return; // Don't draw if the layer doesn't exist
        // This loop is now safe because this.layers only contains valid data arrays
        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                const tileIndex = row * this.mapWidth + col;
                let tileId = layerData[tileIndex];
                if (tileId === 0)
                    continue;
                tileId--;
                const sourceX = (tileId % TILESET_COLUMNS) * TILE_SIZE;
                const sourceY = Math.floor(tileId / TILESET_COLUMNS) * TILE_SIZE;
                const destX = col * TILE_SIZE;
                const destY = row * TILE_SIZE;
                context.drawImage(this.tileset, sourceX, sourceY, TILE_SIZE, TILE_SIZE, destX, destY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    // New method to draw the collision grid
    drawCollisionDebug(context) {
        // Only run this code if debug mode is on
        if (!DEBUG_MODE)
            return;
        context.fillStyle = 'rgba(0, 0, 255, 0.4)'; // Semi-transparent blue
        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                if (this.collisionGrid[row][col]) {
                    context.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}
