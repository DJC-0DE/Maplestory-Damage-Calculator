// Equipment Slot Card Component
import { availableStats } from "@core/constants.js";

/**
 * Create an equipment slot card element
 * @param {Object} slot - Slot configuration { id, name, hasMainStat }
 * @returns {HTMLElement} The slot card element
 */
export function createEquipmentSlot(slot) {
  const card = document.createElement("div");
  card.id = `equipment-slot-${slot.id}`;
  card.className = "equipment-slot-card";

  // Build slot HTML
  let html = `
        <div class="equipment-slot-header">
            <div class="equipment-slot-name">${slot.name}</div>
            <div class="equipment-slot-actions">
                <button onclick="clearSlotData('${slot.id}')" class="equipment-action-btn equipment-btn-clear" title="Clear all data">
                    Clear
                </button>
            </div>
        </div>

        <div class="equipment-inputs-grid">
            <div class="equipment-input-group">
                <label class="equipment-input-label" for="equipment-${slot.id}-attack">Attack</label>
                <input type="number" step="0.1" id="equipment-${slot.id}-attack" value="0" min="0" onchange="saveSlotData('${slot.id}'); notifyStatContributors();" class="equipment-input-field">
            </div>
    `;

  // Add Main Stat field for Ring, Neck, Eye Accessory
  if (slot.hasMainStat) {
    html += `
            <div class="equipment-input-group">
                <label class="equipment-input-label" for="equipment-${slot.id}-main-stat">Main Stat</label>
                <input type="number" step="1" id="equipment-${slot.id}-main-stat" value="0" min="0" onchange="saveSlotData('${slot.id}'); notifyStatContributors();" class="equipment-input-field">
            </div>
        `;
  }

  html += `
        </div>

        <div class="equipment-stats-section">
            <div class="equipment-stats-header">
                <label class="equipment-stats-label">Additional Stats</label>
                <button onclick="addStatLineToSlot('${slot.id}')" class="equipment-action-btn equipment-btn-add">
                    + Add Stat
                </button>
            </div>
            <div id="equipment-${slot.id}-stats-container" class="equipment-stats-container">
                <!-- Stat lines will be added here -->
            </div>
        </div>
    `;

  card.innerHTML = html;

  // Mark this slot as needing initialization (will be checked by loadEquipmentData)
  card.dataset.needsInit = "true";

  return card;
}
