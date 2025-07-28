// A generic class for any object in the game that can be interacted with.
export abstract class GameObject {
  public id: number;
  public worldX: number;
  public worldY: number;
  public width: number;
  public height: number;
  public isAlive: boolean = true;
  public isCollidable: boolean = true; // NEW: For future object-to-object collision

  constructor(id: number, x: number, y: number, width: number, height: number) {
    this.id = id;
    this.worldX = x;
    this.worldY = y;
    this.width = width;
    this.height = height;
  }

  // Abstract methods that every game object must implement
  public abstract update(deltaTime: number): void;
  public abstract draw(context: CanvasRenderingContext2D): void;

  // A method for when the object is hit
  public takeDamage(amount: number): void {
    // By default, objects do nothing when hit.
    // Subclasses like Enemy will override this.
    console.log("An object took damage, but has no custom takeDamage method.");
  }
}
