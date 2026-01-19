// Slot-Specific Comparison Manager
import { getSlotStats, setSlotData } from "@ui/equipment/equipment-tab.js";
import { availableStats } from "@core/constants.js";

// Current selected slot
let currentSlot = "head";

// Equipment slot definitions with Main Stat info
const EQUIPMENT_SLOTS = {
  head: { name: "Head", hasMainStat: false },
  cape: { name: "Cape", hasMainStat: false },
  chest: { name: "Chest", hasMainStat: false },
  shoulders: { name: "Shoulders", hasMainStat: false },
  legs: { name: "Legs", hasMainStat: false },
  belt: { name: "Belt", hasMainStat: false },
  gloves: { name: "Gloves", hasMainStat: false },
  boots: { name: "Boots", hasMainStat: false },
  ring: { name: "Ring", hasMainStat: true },
  neck: { name: "Neck", hasMainStat: true },
  "eye-accessory": { name: "Eye Accessory", hasMainStat: true },
};

// Track if we've been initialized
let initialized = false;

/**
 * Initialize the slot comparison system
 */
export function initializeSlotComparison() {
  // Check if there's a stored slot from navigation (from Equipment tab)
  const storedSlot = sessionStorage.getItem("selectedEquipmentSlot");
  if (storedSlot) {
    currentSlot = storedSlot;
    sessionStorage.removeItem("selectedEquipmentSlot");
  } else {
    // Restore last selected slot from localStorage
    const lastSlot = localStorage.getItem("lastSelectedComparisonSlot");
    if (lastSlot) {
      currentSlot = lastSlot;
    }
  }

  // Update the selector
  const selector = document.getElementById("comparison-slot-selector");
  if (selector) {
    selector.value = currentSlot;
  }

  // Update equipped display
  updateEquippedItemDisplay(currentSlot);

  // Update header
  updateSlotHeader(EQUIPMENT_SLOTS[currentSlot].name);

  // Load items for the current slot AFTER DOM is ready
  // Use requestAnimationFrame to ensure DOM is fully rendered
  requestAnimationFrame(() => {
    window.loadSlotItems(currentSlot);
  });

  initialized = true;
}

/**
 * Check for pending slot navigation (call when Item Comparison tab is shown)
 */
export function checkPendingSlotNavigation() {
  const storedSlot = sessionStorage.getItem("selectedEquipmentSlot");
  if (storedSlot) {
    currentSlot = storedSlot;
    sessionStorage.removeItem("selectedEquipmentSlot");

    // Update the selector
    const selector = document.getElementById("comparison-slot-selector");
    if (selector) {
      selector.value = currentSlot;
    }

    // Update equipped display and load items
    requestAnimationFrame(() => {
      updateEquippedItemDisplay(currentSlot);
      window.loadSlotItems(currentSlot);
      updateSlotHeader(EQUIPMENT_SLOTS[currentSlot].name);
    });
  }
}

// Export for global access
window.checkPendingSlotNavigation = checkPendingSlotNavigation;

/**
 * Switch to a different slot
 * FIXED: Now properly handles persistence without race conditions
 */
export async function switchComparisonSlot(slotId) {
  try {
    // Save current slot selection BEFORE any DOM changes
    localStorage.setItem("lastSelectedComparisonSlot", slotId);

    // Update the selector immediately to reflect the change
    const selector = document.getElementById("comparison-slot-selector");
    if (selector) {
      selector.value = slotId;
    }

    // The state manager handles persistence automatically
    // We don't need to manually save before clearing DOM
    // because loadSlotItems() will load the persisted data

    // Clear UI containers
    const tabsContainer = document.getElementById("comparison-tabs-container");
    const itemsContainer = document.getElementById(
      "comparison-items-container",
    );

    if (tabsContainer) {
      // Clone the add button before clearing to preserve it
      const addButton = tabsContainer.querySelector(
        'button[data-type="add-button"]',
      );
      const addButtonClone = addButton ? addButton.cloneNode(true) : null;
      tabsContainer.innerHTML = "";
      if (addButtonClone) {
        tabsContainer.appendChild(addButtonClone);
      }
    }

    if (itemsContainer) {
      itemsContainer.innerHTML = "";
    }

    // Change slot state
    currentSlot = slotId;

    // Update equipped display
    updateEquippedItemDisplay(slotId);

    // Load items for new slot (this loads from state manager)
    await window.loadSlotItems(slotId);

    // Update header
    updateSlotHeader(EQUIPMENT_SLOTS[slotId].name);
  } catch (error) {
    console.error(`[SlotComparison] Failed to switch slot:`, error);
  }
}

/**
 * Update the equipped item display
 */
function updateEquippedItemDisplay(slotId) {
  const slotData = getSlotStats(slotId);

  // Update name (now editable)
  const nameInput = document.getElementById("equipped-name");
  if (nameInput) {
    nameInput.value = slotData.name || "Empty";
    nameInput.readOnly = false; // Make editable
    // Remove old onchange and add new one that syncs to Equipment tab
    nameInput.removeAttribute("onchange");
    nameInput.onchange = () => syncEquippedName(slotId);
  }

  // Update attack (now editable)
  const attackInput = document.getElementById("equipped-attack");
  if (attackInput) {
    attackInput.value = slotData.attack || 0;
    attackInput.readOnly = false; // Make editable
    // Remove old onchange and add new one that syncs to Equipment tab
    attackInput.removeAttribute("onchange");
    attackInput.onchange = () => syncEquippedAttack(slotId);
  }

  // Clear and rebuild stat lines
  const statsContainer = document.getElementById("equipped-stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = "";

    if (slotData.statLines && Array.isArray(slotData.statLines)) {
      slotData.statLines.forEach((statLine, index) => {
        addStatLineToEquipped(statLine.type, statLine.value, index + 1);
      });
    }
  }
}

// Sync equipped name changes back to Equipment tab
function syncEquippedName(slotId) {
  const nameInput = document.getElementById("equipped-name");
  if (!nameInput) return;

  setSlotData(slotId, {
    name: nameInput.value,
  });

  // Also update the slot header if the name changed
  updateSlotHeader(nameInput.value || EQUIPMENT_SLOTS[slotId].name);
}

// Sync equipped attack changes back to Equipment tab
function syncEquippedAttack(slotId) {
  const attackInput = document.getElementById("equipped-attack");
  if (!attackInput) return;

  const slotData = getSlotStats(slotId);
  setSlotData(slotId, {
    ...slotData,
    attack: parseFloat(attackInput.value) || 0,
  });
}

/**
 * Add a stat line to the equipped item display
 */
function addStatLineToEquipped(type, value, statId) {
  const container = document.getElementById("equipped-stats-container");
  if (!container) return;

  let optionsHTML = "";
  availableStats.forEach((stat) => {
    const selected = stat.value === type ? "selected" : "";
    optionsHTML += `<option value="${stat.value}" ${selected}>${stat.label}</option>`;
  });

  const statDiv = document.createElement("div");
  statDiv.id = `equipped-stat-${statId}`;
  statDiv.style.cssText =
    "display: grid; grid-template-columns: 1fr 80px; gap: 8px; margin-bottom: 6px; align-items: end;";

  statDiv.innerHTML = `
        <div class="input-group">
            <label style="font-size: 0.8em;">Stat</label>
            <select id="equipped-stat-${statId}-type" disabled style="opacity: 0.7;">
                ${optionsHTML}
            </select>
        </div>
        <div class="input-group">
            <label style="font-size: 0.8em;">Value</label>
            <input type="number" step="0.1" id="equipped-stat-${statId}-value" value="${value}" readonly style="opacity: 0.7;">
        </div>
    `;

  container.appendChild(statDiv);
}

/**
 * Update the slot header display
 */
function updateSlotHeader(slotName) {
  // Could update a subtitle or other UI elements
  const headerElement = document.getElementById("comparison-slot-header");
  if (headerElement) {
    headerElement.textContent = slotName;
  }
}

/**
 * Get the current selected slot
 */
export function getCurrentSlot() {
  return currentSlot;
}

/**
 * Set the current slot without triggering the full slot switching logic
 * Used during initial page load to avoid conflicts with slot comparison system's storage
 */
export function setCurrentSlot(slotId) {
  currentSlot = slotId;

  // Update the selector dropdown
  const selector = document.getElementById("comparison-slot-selector");
  if (selector) {
    selector.value = currentSlot;
  }
}

/**
 * Get slot configuration
 */
export function getSlotConfig(slotId) {
  return EQUIPMENT_SLOTS[slotId];
}

/**
 * Equip an item from comparison to the Equipment tab
 */
export function equipItemFromComparison(itemId) {
  // Get comparison item data using slot-based ID
  const nameInput = document.getElementById(
    `item-${currentSlot}-${itemId}-name`,
  );
  const attackInput = document.getElementById(
    `item-${currentSlot}-${itemId}-attack`,
  );
  const statsContainer = document.getElementById(
    `item-${currentSlot}-${itemId}-stats-container`,
  );

  if (!nameInput || !attackInput || !statsContainer) return;

  // Build item data
  const statLines = [];
  const statElements = statsContainer.querySelectorAll(
    `[id^="item-${currentSlot}-${itemId}-stat-"]`,
  );
  statElements.forEach((statElement) => {
    const typeInput = statElement.querySelector('[id$="-type"]');
    const valueInput = statElement.querySelector('[id$="-value"]');
    if (typeInput && valueInput && typeInput.value && valueInput.value) {
      statLines.push({
        type: typeInput.value,
        value: parseFloat(valueInput.value) || 0,
      });
    }
  });

  const slotConfig = EQUIPMENT_SLOTS[currentSlot];
  const itemData = {
    name: nameInput.value,
    attack: parseFloat(attackInput.value) || 0,
    mainStat: 0,
    statLines,
  };

  // Set the data in the Equipment tab
  setSlotData(currentSlot, itemData);

  // Remove from comparison
  window.removeComparisonItem(itemId);

  // Refresh the equipped display
  updateEquippedItemDisplay(currentSlot);
}

// Export functions for global access
window.switchComparisonSlot = switchComparisonSlot;
window.setCurrentSlot = setCurrentSlot;
