import { Player } from "./player";

export class UIManager {
  constructor() {
    // The UIManager can be expanded later to manage more UI elements
  }

  // The draw method now accepts the player object
  public draw(context: CanvasRenderingContext2D, player: Player): void {
    this.drawSkillBar(context, player);
  }

  private drawSkillBar(
    context: CanvasRenderingContext2D,
    player: Player
  ): void {
    const numSlots = 6;
    const slotSize = 50;
    const slotGap = 10;
    const barWidth = numSlots * slotSize + (numSlots - 1) * slotGap;

    const barX = (context.canvas.width - barWidth) / 2;
    const barY = context.canvas.height - slotSize - 20;

    for (let i = 0; i < numSlots; i++) {
      const slotX = barX + i * (slotSize + slotGap);

      // Draw the slot background and border
      context.fillStyle = "rgba(0, 0, 0, 0.5)";
      context.fillRect(slotX, barY, slotSize, slotSize);
      context.strokeStyle = "rgba(255, 255, 255, 0.7)";
      context.lineWidth = 2;
      context.strokeRect(slotX, barY, slotSize, slotSize);

      // --- Draw content for the first (basic attack) slot ---
      if (i === 0) {
        // Draw the 'B' placeholder
        context.fillStyle = "white";
        context.font = "bold 24px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("B", slotX + slotSize / 2, barY + slotSize / 2);

        // --- NEW: Cooldown Drawing Logic ---
        const now = Date.now();
        const lastAttack = player.getLastAttackTime();
        const cooldown = player.getAttackCooldown();
        const timeSinceAttack = now - lastAttack;

        if (timeSinceAttack < cooldown) {
          // Calculate remaining cooldown
          const remainingCooldown = cooldown - timeSinceAttack;
          const remainingSeconds = (remainingCooldown / 1000).toFixed(1);

          // Draw the dark overlay
          context.fillStyle = "rgba(0, 0, 0, 0.7)";
          context.fillRect(slotX, barY, slotSize, slotSize);

          // Draw the cooldown text
          context.fillStyle = "white";
          context.font = "bold 20px Arial";
          context.fillText(
            remainingSeconds,
            slotX + slotSize / 2,
            barY + slotSize / 2
          );
        }
      }
    }
  }
}
