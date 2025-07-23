import { TILE_SIZE, TILESET_COLUMNS } from './constants.js';
export class MapManager {
    tileset;
    mapData;
    layers; // This will now only contain valid tile data
    mapWidth;
    mapHeight;
    collisionGrid;
    solidTileIds;
    constructor() {
        this.tileset = document.getElementById('tileset');
        this.mapData = TileMaps.mmoMap;
        this.mapWidth = this.mapData.width;
        this.mapHeight = this.mapData.height;
        this.solidTileIds = new Set();
        this.collisionGrid = [];
        // ✅ SAFER: Filter for valid tile layers only
        this.layers = this.mapData.layers
            .filter((layer) => layer.type === 'tilelayer' && layer.data)
            .map((layer) => layer.data);
        this.parseCollisionData();
        this.buildCollisionGrid();
    }
    parseCollisionData() {
        // This assumes an embedded tileset for simplicity
        const tileset = this.mapData.tilesets[0];
        if (!tileset || !tileset.tiles)
            return;
        for (const tile of tileset.tiles) {
            const hasCollision = tile.properties?.find((p) => p.name === 'collides' && p.value === true);
            if (hasCollision) {
                this.solidTileIds.add(tile.id + tileset.firstgid);
            }
        }
    }
    buildCollisionGrid() {
        this.collisionGrid = Array.from({ length: this.mapHeight }, () => Array(this.mapWidth).fill(false));
        // ✅ SAFER: Iterate only over layers guaranteed to be tile layers
        for (const layer of this.mapData.layers) {
            if (layer.type !== 'tilelayer' || !layer.data)
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
    isSolidTile(worldX, worldY) {
        const col = Math.floor(worldX / TILE_SIZE);
        const row = Math.floor(worldY / TILE_SIZE);
        if (row < 0 || row >= this.mapHeight || col < 0 || col >= this.mapWidth) {
            return true;
        }
        return this.collisionGrid[row][col];
    }
    findObjectByName(name) {
        for (const layer of this.mapData.layers) {
            if (layer.type === 'objectgroup') {
                const foundObject = layer.objects.find((obj) => obj.name === name);
                if (foundObject) {
                    return { x: foundObject.x, y: foundObject.y };
                }
            }
        }
        return null; // Return null if no object with that name is found
    }
    draw(context) {
        // This loop is now safe because this.layers only contains valid data arrays
        for (const layerData of this.layers) {
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
    }
}
