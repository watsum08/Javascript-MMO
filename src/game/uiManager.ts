import { InputManager } from "./inputManager";
import { Player } from "./player";
import { PlayerSkills } from "./skill";

// This array defines which skill goes into which slot.
// The index corresponds to the slot (0-5), and the value is the key from PlayerSkills.
const skillSlotMapping = ["basic", "heavy", null, null, null, null];

export class UIManager {
  constructor() {}

  // The draw method now accepts the InputManager
  public draw(
    context: CanvasRenderingContext2D,
    player: Player,
    input: InputManager
  ): void {
    this.drawSkillBar(context, player, input);
  }

  private drawSkillBar(
    context: CanvasRenderingContext2D,
    player: Player,
    input: InputManager
  ): void {
    const numSlots = 6;
    const slotSize = 32;
    const slotGap = 6;
    const barWidth = numSlots * slotSize + (numSlots - 1) * slotGap;

    const barX = (context.canvas.width - barWidth) / 2;
    const barY = context.canvas.height - slotSize - 20;

    for (let i = 0; i < numSlots; i++) {
      const slotX = barX + i * (slotSize + slotGap);
      const skillKey = skillSlotMapping[i];
      const keybindNumber = (i + 1).toString(); // '1', '2', '3'...

      // --- NEW: Dynamic Border Color Logic ---
      let borderColor = "rgba(255, 255, 255, 0.8)"; // Default color
      if (input.activeSkillNumberKeys.has(keybindNumber)) {
        borderColor = "red"; // Pressed color
      }

      // Draw the slot background and border
      context.fillStyle = "rgba(0, 0, 0, 0.5)";
      context.fillRect(slotX, barY, slotSize, slotSize);
      context.strokeStyle = borderColor; // Use the dynamic color
      context.lineWidth = 1;
      context.strokeRect(slotX, barY, slotSize, slotSize);

      // Draw the keybind number in the top-left corner
      context.fillStyle = "rgba(255, 255, 255, 0.9)";
      context.font = "8px Arial";
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText(keybindNumber, slotX + 2, barY + 2);

      if (skillKey) {
        const skill = PlayerSkills[skillKey];

        // Draw a placeholder for the skill icon
        context.fillStyle = "white";
        context.font = "bold 16px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
          skill.name.charAt(0),
          slotX + slotSize / 2,
          barY + slotSize / 2
        );

        // --- Cooldown Drawing Logic ---
        const now = Date.now();
        const lastAttack = player.getLastAttackTime(skillKey);
        const cooldown = player.getAttackCooldown(skillKey);
        const timeSinceAttack = now - lastAttack;

        if (timeSinceAttack < cooldown) {
          const remainingCooldown = cooldown - timeSinceAttack;
          const remainingSeconds = (remainingCooldown / 1000).toFixed(1);

          // Draw the dark overlay
          context.fillStyle = "rgba(0, 0, 0, 0.7)";
          context.fillRect(slotX, barY, slotSize, slotSize);

          // Draw the cooldown text
          context.fillStyle = "white";
          context.font = "bold 14px Arial";
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
