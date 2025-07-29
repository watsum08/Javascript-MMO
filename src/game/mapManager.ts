import { DEBUG_MODE } from "./constants";
import { TileMaps } from "./maps/mapRegistry";
import "./maps/mmoMap";

// Interface to hold processed tileset data
interface TilesetData {
  image: HTMLImageElement;
  firstgid: number;
  columns: number;
  tileSize: number;
}

export class MapManager {
  // --- Public properties ---
  public mapPixelWidth: number = 0;
  public mapPixelHeight: number = 0;

  // --- Private properties ---
  private mapData: any;
  private layers: { [name: string]: number[] } = {};
  public collisionGrid: boolean[][] = [];
  private solidTileIds: Set<number> = new Set();
  private tilesets: TilesetData[] = []; // Will hold all loaded tilesets

  constructor() {
    // The constructor is now empty. All logic is moved to loadMap.
  }

  public loadMap(mapName: string): void {
    const mapData = TileMaps[mapName];
    if (!mapData) {
      console.error(`Map data for "${mapName}" not found!`);
      return;
    }

    this.mapData = mapData;
    this.mapPixelWidth = this.mapData.width * this.mapData.tilewidth;
    this.mapPixelHeight = this.mapData.height * this.mapData.tilewidth;

    // --- Load and process all tilesets defined in the map data ---
    this.tilesets = this.mapData.tilesets.map((ts: any) => {
      // Tiled exports a long file path, we need to get just the filename.
      const imageName = ts.image.split("/").pop().split(".")[0];
      const image = document.getElementById(imageName) as HTMLImageElement;
      if (!image) {
        console.error(
          `Tileset image with ID "${imageName}" not found in HTML!`
        );
      }
      return {
        image: image,
        firstgid: ts.firstgid,
        columns: ts.columns,
        tileSize: ts.tilewidth, // Assuming square tiles
      };
    });

    // Sort tilesets by firstgid in descending order for correct lookup
    this.tilesets.sort((a, b) => b.firstgid - a.firstgid);

    // Parse layers
    this.layers = {};
    this.mapData.layers.forEach((layerData: any) => {
      if (layerData.type === "tilelayer" && layerData.data) {
        this.layers[layerData.name] = layerData.data;
      }
    });

    this.parseCollisionData();
    this.buildCollisionGrid();
  }

  // Helper function to find the correct tileset for a given tile ID
  private findTilesetForGid(gid: number): TilesetData | null {
    // Since the tilesets are sorted by firstgid descending, the first one we find is the correct one.
    return this.tilesets.find((ts) => gid >= ts.firstgid) || null;
  }

  public drawLayer(context: CanvasRenderingContext2D, layerName: string): void {
    const layerData = this.layers[layerName];
    if (!layerData) return;

    const mapWidth = this.mapData.width;
    const mapHeight = this.mapData.height;

    for (let row = 0; row < mapHeight; row++) {
      for (let col = 0; col < mapWidth; col++) {
        const tileGid = layerData[row * mapWidth + col];

        if (tileGid === 0) continue; // 0 means no tile

        const tileset = this.findTilesetForGid(tileGid);
        if (!tileset || !tileset.image) continue; // Skip if tileset or its image is not found

        // Calculate the local ID within the tileset
        const localTileId = tileGid - tileset.firstgid;

        const sourceX = (localTileId % tileset.columns) * tileset.tileSize;
        const sourceY =
          Math.floor(localTileId / tileset.columns) * tileset.tileSize;
        const destX = col * this.mapData.tilewidth;
        const destY = row * this.mapData.tileheight;

        context.drawImage(
          tileset.image,
          sourceX,
          sourceY,
          tileset.tileSize,
          tileset.tileSize,
          destX,
          destY,
          this.mapData.tilewidth,
          this.mapData.tileheight
        );
      }
    }
  }

  // --- UPDATED: This method now iterates through ALL tilesets ---
  private parseCollisionData(): void {
    this.solidTileIds.clear(); // Reset the set
    // Iterate over each tileset in the map data
    for (const tileset of this.mapData.tilesets) {
      if (!tileset.tiles) continue;

      for (const tile of tileset.tiles) {
        const hasCollision = tile.properties?.find(
          (p: any) => p.name === "collides" && p.value === true
        );
        if (hasCollision) {
          // Add the global tile ID (gid) to the set
          this.solidTileIds.add(tile.id + tileset.firstgid);
        }
      }
    }
  }

  private buildCollisionGrid(): void {
    const mapWidth = this.mapData.width;
    const mapHeight = this.mapData.height;
    this.collisionGrid = Array.from({ length: mapHeight }, () =>
      Array(mapWidth).fill(false)
    );

    for (const layer of this.mapData.layers) {
      if (layer.type !== "tilelayer" || !layer.data) continue;

      for (let row = 0; row < mapHeight; row++) {
        for (let col = 0; col < mapWidth; col++) {
          const tileId = layer.data[row * mapWidth + col];
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
    const tileSize = this.mapData.tilewidth;
    const left = Math.floor(worldX / tileSize);
    const right = Math.floor((worldX + width) / tileSize);
    const top = Math.floor(worldY / tileSize);
    const bottom = Math.floor((worldY + height) / tileSize);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (
          row < 0 ||
          row >= this.mapData.height ||
          col < 0 ||
          col >= this.mapData.width
        ) {
          return true; // Treat out-of-bounds as solid
        }
        if (this.collisionGrid[row] && this.collisionGrid[row][col]) {
          return true;
        }
      }
    }
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
    return null;
  }

  public drawCollisionDebug(context: CanvasRenderingContext2D): void {
    if (!DEBUG_MODE) return;
    const tileSize = this.mapData.tilewidth;
    context.fillStyle = "rgba(0, 0, 255, 0.4)";
    for (let row = 0; row < this.mapData.height; row++) {
      for (let col = 0; col < this.mapData.width; col++) {
        if (this.collisionGrid[row][col]) {
          context.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
      }
    }
  }
}
