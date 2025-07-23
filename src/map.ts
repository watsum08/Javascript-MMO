import { DEBUG_MODE, TILE_SIZE, TILESET_COLUMNS } from "./constants";

declare const TileMaps: any;

export class MapManager {
  private tileset: HTMLImageElement;
  private mapData: any;
  private layers: { [name: string]: number[] } = {};
  private mapWidth: number;
  private mapHeight: number;
  public collisionGrid: boolean[][];
  private solidTileIds: Set<number>;

  constructor() {
    this.tileset = document.getElementById("tileset") as HTMLImageElement;
    this.mapData = TileMaps.mmoMap;
    this.mapWidth = this.mapData.width;
    this.mapHeight = this.mapData.height;
    this.solidTileIds = new Set<number>();
    this.collisionGrid = [];

    // Change how layers are parsed
    this.mapData.layers.forEach((layerData: any) => {
      if (layerData.type === "tilelayer" && layerData.data) {
        this.layers[layerData.name] = layerData.data;
      }
    });

    this.parseCollisionData();
    this.buildCollisionGrid();
  }

  private parseCollisionData(): void {
    // This assumes an embedded tileset for simplicity
    const tileset = this.mapData.tilesets[0];
    if (!tileset || !tileset.tiles) return;

    for (const tile of tileset.tiles) {
      const hasCollision = tile.properties?.find(
        (p: any) => p.name === "collides" && p.value === true
      );
      if (hasCollision) {
        this.solidTileIds.add(tile.id + tileset.firstgid);
      }
    }
  }

  private buildCollisionGrid(): void {
    this.collisionGrid = Array.from({ length: this.mapHeight }, () =>
      Array(this.mapWidth).fill(false)
    );

    // ✅ SAFER: Iterate only over layers guaranteed to be tile layers
    for (const layer of this.mapData.layers) {
      if (layer.type !== "tilelayer" || !layer.data) continue;

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

  public isAreaSolid(
    worldX: number,
    worldY: number,
    width: number,
    height: number
  ): boolean {
    // Get the tile coordinates for the corners of the bounding box
    const left = Math.floor(worldX / TILE_SIZE);
    const right = Math.floor((worldX + width) / TILE_SIZE);
    const top = Math.floor(worldY / TILE_SIZE);
    const bottom = Math.floor((worldY + height) / TILE_SIZE);

    // Check every tile the area overlaps
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        // Check bounds to prevent errors
        if (
          row < 0 ||
          row >= this.mapHeight ||
          col < 0 ||
          col >= this.mapWidth
        ) {
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

  public findObjectByName(name: string): { x: number; y: number } | null {
    for (const layer of this.mapData.layers) {
      if (layer.type === "objectgroup") {
        const foundObject = layer.objects.find((obj: any) => obj.name === name);
        if (foundObject) {
          return { x: foundObject.x, y: foundObject.y };
        }
      }
    }
    return null; // Return null if no object with that name is found
  }

  public drawLayer(context: CanvasRenderingContext2D, layerName: string) {
    const layerData = this.layers[layerName];
    if (!layerData) return; // Don't draw if the layer doesn't exist
    // This loop is now safe because this.layers only contains valid data arrays
    for (let row = 0; row < this.mapHeight; row++) {
      for (let col = 0; col < this.mapWidth; col++) {
        const tileIndex = row * this.mapWidth + col;
        let tileId = layerData[tileIndex];

        if (tileId === 0) continue;
        tileId--;

        const sourceX = (tileId % TILESET_COLUMNS) * TILE_SIZE;
        const sourceY = Math.floor(tileId / TILESET_COLUMNS) * TILE_SIZE;
        const destX = col * TILE_SIZE;
        const destY = row * TILE_SIZE;

        context.drawImage(
          this.tileset,
          sourceX,
          sourceY,
          TILE_SIZE,
          TILE_SIZE,
          destX,
          destY,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }
  }

  // New method to draw the collision grid
    public drawCollisionDebug(context: CanvasRenderingContext2D): void {
        // Only run this code if debug mode is on
        if (!DEBUG_MODE) return;

        context.fillStyle = 'rgba(0, 0, 255, 0.4)'; // Semi-transparent blue
        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                if (this.collisionGrid[row][col]) {
                    context.fillRect(
                        col * TILE_SIZE,
                        row * TILE_SIZE,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            }
        }
    }
}
