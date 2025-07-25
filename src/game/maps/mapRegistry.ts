// This object will hold all the loaded tile map data.
export const TileMaps: Record<string, any> = {};

// A registry for callback functions that want to know when a map is loaded.
const onLoadCallbacks: ((name: string, data: any) => void)[] = [];

/**
 * Call this function from your map files to add their data to the registry.
 * It will also notify any listeners that a new map is ready.
 * @param name The name of the map.
 * @param data The map data object (usually from a Tiled export).
 */
export function registerTileMap(name: string, data: any): void {
  console.log(`Loading tilemap: ${name}`);
  TileMaps[name] = data;

  // Call all registered callbacks to notify them of the new map.
  for (const callback of onLoadCallbacks) {
    callback(name, data);
  }
}

/**
 * Any part of your game that needs to react to a map being loaded
 * can use this function to register a callback.
 * @param callback The function to execute when a map is loaded.
 */
export function onTileMapLoaded(
  callback: (name: string, data: any) => void
): void {
  onLoadCallbacks.push(callback);
}
