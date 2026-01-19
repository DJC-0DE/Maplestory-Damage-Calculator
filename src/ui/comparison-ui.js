/**
 * Comparison items UI functionality - Fixed Version
 *
 * This module handles the UI for comparison items while delegating all
 * state management to the centralized comparison-state module.
 *
 * KEY IMPROVEMENTS:
 * - No more silent data loss from race conditions
 * - Proper error handling and validation
 * - State-driven architecture (state → DOM, not DOM → state)
 * - Reliable persistence across tab switches, refreshes, etc.
 */

import { saveToLocalStorage } from "@core/state/storage.js";
import { availableStats } from "@core/constants.js";
import { calculate } from "@core/main.js";
import {
  updateItem,
  removeItem,
  loadSlot,
  getSlotItems,
  getItem,
} from "@core/state/comparison-state.js";
import {
  equipItemFromComparison,
  getCurrentSlot,
} from "@ui/comparison/slot-comparison.js";

// Track active comparison item
let activeComparisonItemId = null;

// Track current slot's items mapping (itemId -> guid)
// This allows us to find the guid from the UI itemId
const currentItemMapping = new Map(); // itemId -> guid

// Configuration object for magic numbers
const COMPARISON_CONFIG = {
  MAX_STATS_PER_ITEM: 6,
  ANIMATION_DURATION_MS: 200,
  MIN_TOUCH_TARGET_SIZE: 44, // px
};

// ============================================================================
// DATA COLLECTION FROM DOM
// ============================================================================

/**
 * Collect item data from DOM elements
 * @param {string} currentSlot - Current equipment slot
 * @param {number} itemId - UI item ID
 * @returns {Object|null} Item data or null if elements not found
 */
function collectItemDataFromDOM(currentSlot, itemId) {
  const nameInput = document.getElementById(
    `item-${currentSlot}-${itemId}-name`,
  );
  const attackInput = document.getElementById(
    `item-${currentSlot}-${itemId}-attack`,
  );
  const statsContainer = document.getElementById(
    `item-${currentSlot}-${itemId}-stats-container`,
  );

  if (!nameInput || !attackInput || !statsContainer) {
    console.error(`[ComparisonUI] Missing DOM elements for item ${itemId}`);
    return null;
  }

  // Collect stats
  const stats = [];
  statsContainer
    .querySelectorAll(`[id^="item-${currentSlot}-${itemId}-stat-"]`)
    .forEach((statDiv) => {
      const typeInput = statDiv.querySelector('[id$="-type"]');
      const valueInput = statDiv.querySelector('[id$="-value"]');
      if (typeInput && valueInput) {
        stats.push({ type: typeInput.value, value: valueInput.value });
      }
    });

  return {
    name: nameInput.value,
    attack: parseFloat(attackInput.value) || 0,
    stats: stats,
  };
}

/**
 * Collect guid from DOM element
 * @param {string} currentSlot - Current equipment slot
 * @param {number} itemId - UI item ID
 * @returns {string|null} Item GUID or null if not found
 */
function getGuidFromItemId(currentSlot, itemId) {
  const itemDiv = document.getElementById(
    `comparison-item-${currentSlot}-${itemId}`,
  );
  if (!itemDiv) {
    console.error(`[ComparisonUI] Item div not found for ${itemId}`);
    return null;
  }
  return itemDiv.dataset.guid || null;
}

// ============================================================================
// SAVE OPERATIONS
// ============================================================================

/**
 * Save single item data from DOM to state
 * This replaces the old debounced save with reliable state management
 * @param {string} guid - Item GUID
 * @returns {Promise<boolean>} True if successful
 */
async function saveSlotItemData(guid) {
  try {
    const currentSlot = getCurrentSlot();

    // Find itemId from guid
    let itemId = null;
    for (const [uiItemId, itemGuid] of currentItemMapping.entries()) {
      if (itemGuid === guid) {
        itemId = uiItemId;
        break;
      }
    }

    if (itemId === null) {
      console.error(`[ComparisonUI] Could not find itemId for guid ${guid}`);
      return false;
    }

    // Collect data from DOM
    const itemData = collectItemDataFromDOM(currentSlot, itemId);
    if (!itemData) {
      return false;
    }

    // Update state (this handles queuing and persistence)
    const success = await updateItem(currentSlot, guid, itemData);

    if (!success) {
      console.error(`[ComparisonUI] Failed to save item ${guid}`);
    }

    return success;
  } catch (error) {
    console.error(`[ComparisonUI] Error saving item:`, error);
    return false;
  }
}

// Global save function
window.saveSlotItemData = function (guid) {
  saveSlotItemData(guid);
};

// ============================================================================
// LOAD OPERATIONS
// ============================================================================

/**
 * Load items for a specific slot from state
 * @param {string} slotId - Equipment slot ID
 * @returns {Promise<boolean>} True if successful
 */
window.loadSlotItems = async function (slotId) {
  try {
    // Clear current mapping
    currentItemMapping.clear();

    // Clear UI
    const tabsContainer = document.getElementById("comparison-tabs-container");
    const itemsContainer = document.getElementById(
      "comparison-items-container",
    );

    if (tabsContainer) {
      // Preserve the add button
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

    // Load items from state
    const items = await loadSlot(slotId);

    if (items.length === 0) {
      showEmptyComparisonState();
      return true;
    }

    hideEmptyComparisonState();

    const currentSlot = getCurrentSlot();

    // Create UI for each item
    items.forEach((itemData, index) => {
      const itemId = index + 1;
      const guid = itemData.guid;

      // Store mapping
      currentItemMapping.set(itemId, guid);

      // Create tab
      const tabButton = createComparisonTab(
        currentSlot,
        itemId,
        guid,
        itemData.name,
      );
      const tabsContainer = document.getElementById(
        "comparison-tabs-container",
      );
      const addButton = tabsContainer.querySelector(
        'button[data-type="add-button"]',
      );
      tabsContainer.insertBefore(tabButton, addButton);

      // Create item card
      const itemDiv = createComparisonItemCard(
        currentSlot,
        itemId,
        guid,
        itemData,
      );
      document
        .getElementById("comparison-items-container")
        .appendChild(itemDiv);

      // Load stats
      const statsContainer = document.getElementById(
        `item-${currentSlot}-${itemId}-stats-container`,
      );
      if (itemData.stats && itemData.stats.length > 0) {
        statsContainer.innerHTML = "";
        itemData.stats.forEach((statData, statIndex) => {
          addComparisonItemStat(itemId);
          const statId = statIndex + 1;
          const typeInput = document.getElementById(
            `item-${currentSlot}-${itemId}-stat-${statId}-type`,
          );
          const valueInput = document.getElementById(
            `item-${currentSlot}-${itemId}-stat-${statId}-value`,
          );
          if (typeInput) {
            typeInput.value = statData.type;
            typeInput.setAttribute("onchange", `saveSlotItemData('${guid}')`);
          }
          if (valueInput) {
            valueInput.value = statData.value;
            valueInput.setAttribute("onchange", `saveSlotItemData('${guid}')`);
          }
        });
      }

      // Select first item by default
      if (index === 0) {
        switchComparisonItemTab(itemId);
      }
    });

    return true;
  } catch (error) {
    console.error(`[ComparisonUI] Failed to load slot ${slotId}:`, error);
    showEmptyComparisonState();
    return false;
  }
};

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Get current slot's item count from UI
 * @returns {number} Number of items
 */
function getSlotItemCount() {
  return currentItemMapping.size;
}

/**
 * Update item name in tab when name input changes
 * @param {number} itemId - UI item ID
 */
export function updateComparisonItemTabName(itemId) {
  const currentSlot = getCurrentSlot();
  const nameInput = document.getElementById(
    `item-${currentSlot}-${itemId}-name`,
  );
  const tabButton = document.getElementById(
    `comparison-tab-${currentSlot}-${itemId}`,
  );

  if (nameInput && tabButton) {
    const nameSpan = tabButton.querySelector(".tab-item-name");
    if (nameSpan) {
      nameSpan.textContent = nameInput.value || `Item ${itemId}`;
    }
  }

  saveToLocalStorage();
}
window.updateComparisonItemTabName = updateComparisonItemTabName;

/**
 * Switch to a specific comparison item tab
 * @param {number} itemId - UI item ID
 */
export function switchComparisonItemTab(itemId) {
  const currentSlot = getCurrentSlot();

  // Hide all items
  const allItems = document.querySelectorAll(
    `[id^="comparison-item-${currentSlot}-"]`,
  );
  allItems.forEach((item) => {
    item.style.display = "none";
  });

  // Deactivate all tabs
  const allTabs = document.querySelectorAll(
    `[id^="comparison-tab-${currentSlot}-"]`,
  );
  allTabs.forEach((tab) => {
    tab.classList.remove("active");
    tab.setAttribute("aria-selected", "false");
  });

  // Show selected item
  const selectedItem = document.getElementById(
    `comparison-item-${currentSlot}-${itemId}`,
  );
  if (selectedItem) {
    selectedItem.style.display = "block";
    activeComparisonItemId = itemId;
  }

  // Activate selected tab
  const selectedTab = document.getElementById(
    `comparison-tab-${currentSlot}-${itemId}`,
  );
  if (selectedTab) {
    selectedTab.classList.add("active");
    selectedTab.setAttribute("aria-selected", "true");
  }
}
window.switchComparisonItemTab = switchComparisonItemTab;

// ============================================================================
// DOM CREATION
// ============================================================================

/**
 * Generate a unique GUID for a new item
 * @returns {string} GUID
 */
function generateGuid() {
  return "item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a comparison tab button
 * @param {string} currentSlot - Current equipment slot
 * @param {number} itemId - UI item ID
 * @param {string} guid - Item GUID
 * @param {string} name - Item name
 * @returns {HTMLElement} Tab button element
 */
function createComparisonTab(currentSlot, itemId, guid, name) {
  const tabButton = document.createElement("button");
  tabButton.id = `comparison-tab-${currentSlot}-${itemId}`;
  tabButton.dataset.guid = guid;
  tabButton.className = "comparison-tab-button";
  tabButton.setAttribute("role", "tab");
  tabButton.setAttribute("aria-selected", "false");
  tabButton.setAttribute(
    "aria-controls",
    `comparison-item-${currentSlot}-${itemId}`,
  );
  tabButton.onclick = () => switchComparisonItemTab(itemId);

  const nameSpan = document.createElement("span");
  nameSpan.className = "tab-item-name";
  nameSpan.textContent = name || `Item ${itemId}`;

  const removeButton = document.createElement("button");
  removeButton.className = "comparison-tab-remove";
  removeButton.setAttribute("aria-label", `Remove ${name || `Item ${itemId}`}`);
  removeButton.onclick = (e) => {
    e.stopPropagation();
    removeComparisonItem(itemId);
  };
  removeButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
    `;

  tabButton.appendChild(nameSpan);
  tabButton.appendChild(removeButton);

  return tabButton;
}

/**
 * Create a comparison item card
 * @param {string} currentSlot - Current equipment slot
 * @param {number} itemId - UI item ID
 * @param {string} guid - Item GUID
 * @param {Object} itemData - Item data
 * @returns {HTMLElement} Item card element
 */
function createComparisonItemCard(
  currentSlot,
  itemId,
  guid,
  itemData = { name: "", attack: 0, stats: [] },
) {
  const itemDiv = document.createElement("div");
  itemDiv.id = `comparison-item-${currentSlot}-${itemId}`;
  itemDiv.dataset.guid = guid;
  itemDiv.className = "comparison-item-card";
  itemDiv.style.display = "none";
  itemDiv.setAttribute("role", "tabpanel");
  itemDiv.setAttribute(
    "aria-labelledby",
    `comparison-tab-${currentSlot}-${itemId}`,
  );

  itemDiv.innerHTML = `
        <div class="comparison-card-inner">
            <div class="comparison-card-header">
                <div class="comparison-inputs-row">
                    <div class="input-group comparison-input-group">
                        <label for="item-${currentSlot}-${itemId}-name">Name</label>
                        <input type="text" id="item-${currentSlot}-${itemId}-name" value="${itemData.name || `Item ${itemId}`}"
                            maxlength="50"
                            onchange="updateComparisonItemTabName(${itemId}); saveSlotItemData('${guid}')"
                            aria-label="Item name" />
                    </div>
                    <div class="input-group comparison-input-group">
                        <label for="item-${currentSlot}-${itemId}-attack">Attack</label>
                        <input type="number" id="item-${currentSlot}-${itemId}-attack" value="${itemData.attack || 0}"
                            onchange="saveSlotItemData('${guid}')"
                            aria-label="Item attack value" />
                    </div>
                </div>
            </div>

            <div id="item-${currentSlot}-${itemId}-stats-container" class="comparison-stats-container"></div>

            <div class="comparison-card-actions">
                <button onclick="addComparisonItemStat(${itemId})" class="comparison-action-btn comparison-action-btn--add" aria-label="Add stat to item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                    <span>Add Stat</span>
                </button>
                <button onclick="equipItem(${itemId})" class="comparison-action-btn comparison-action-btn--equip" aria-label="Equip this item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    </svg>
                    <span>Equip</span>
                </button>
            </div>
        </div>
    `;

  return itemDiv;
}

// ============================================================================
// ITEM OPERATIONS
// ============================================================================

/**
 * Add a new comparison item
 */
export async function addComparisonItem() {
  try {
    const currentSlot = getCurrentSlot();
    const itemId = getSlotItemCount() + 1;
    const guid = generateGuid();

    hideEmptyComparisonState();

    // Create UI
    const tabsContainer = document.getElementById("comparison-tabs-container");
    const tabButton = createComparisonTab(
      currentSlot,
      itemId,
      guid,
      `Item ${itemId}`,
    );

    const addButton = tabsContainer.querySelector(
      'button[data-type="add-button"]',
    );
    tabsContainer.insertBefore(tabButton, addButton);

    const itemDiv = createComparisonItemCard(currentSlot, itemId, guid);
    document.getElementById("comparison-items-container").appendChild(itemDiv);

    // Update mapping
    currentItemMapping.set(itemId, guid);

    // Save to state
    await updateItem(currentSlot, guid, {
      name: `Item ${itemId}`,
      attack: 0,
      stats: [],
    });

    switchComparisonItemTab(itemId);
  } catch (error) {
    console.error("[ComparisonUI] Failed to add comparison item:", error);
  }
}
window.addComparisonItem = addComparisonItem;

/**
 * Remove a comparison item
 * @param {number} itemId - UI item ID
 */
export async function removeComparisonItem(itemId) {
  try {
    const currentSlot = getCurrentSlot();
    const guid = getGuidFromItemId(currentSlot, itemId);

    if (!guid) {
      console.error(`[ComparisonUI] Could not find guid for item ${itemId}`);
      return;
    }

    const item = document.getElementById(
      `comparison-item-${currentSlot}-${itemId}`,
    );
    const tab = document.getElementById(
      `comparison-tab-${currentSlot}-${itemId}`,
    );

    if (item && tab) {
      // Animate out
      item.style.opacity = "0";
      tab.style.opacity = "0";

      setTimeout(async () => {
        item.remove();
        tab.remove();
        currentItemMapping.delete(itemId);

        // Update state
        await removeItem(currentSlot, guid);

        if (activeComparisonItemId === itemId) {
          const remainingTabs = document.querySelectorAll(
            `[id^="comparison-tab-${currentSlot}-"]`,
          );

          if (remainingTabs.length > 0) {
            const firstTabId = parseInt(
              remainingTabs[0].id.replace(`comparison-tab-${currentSlot}-`, ""),
            );
            switchComparisonItemTab(firstTabId);
          } else {
            activeComparisonItemId = null;
            showEmptyComparisonState();
          }
        }

        calculate();
      }, COMPARISON_CONFIG.ANIMATION_DURATION_MS);
    }
  } catch (error) {
    console.error("[ComparisonUI] Failed to remove comparison item:", error);
  }
}
window.removeComparisonItem = removeComparisonItem;

/**
 * Add a stat to a comparison item
 * @param {number} itemId - UI item ID
 */
export async function addComparisonItemStat(itemId) {
  try {
    const currentSlot = getCurrentSlot();
    const container = document.getElementById(
      `item-${currentSlot}-${itemId}-stats-container`,
    );
    const currentStats = container.children.length;

    if (currentStats >= COMPARISON_CONFIG.MAX_STATS_PER_ITEM) {
      alert(
        `Maximum ${COMPARISON_CONFIG.MAX_STATS_PER_ITEM} stats allowed per item`,
      );
      return;
    }

    const guid = getGuidFromItemId(currentSlot, itemId);
    if (!guid) {
      console.error(`[ComparisonUI] Could not find guid for item ${itemId}`);
      return;
    }

    let statId = 1;
    while (
      document.getElementById(`item-${currentSlot}-${itemId}-stat-${statId}`)
    ) {
      statId++;
    }

    const statDiv = document.createElement("div");
    statDiv.id = `item-${currentSlot}-${itemId}-stat-${statId}`;
    statDiv.className = "comparison-stat-row";
    statDiv.style.cssText = "--animation-order: " + statId;

    let optionsHTML = "";
    availableStats.forEach((stat) => {
      optionsHTML += `<option value="${stat.value}">${stat.label}</option>`;
    });

    statDiv.innerHTML = `
            <div class="input-group comparison-stat-group">
                <label for="item-${currentSlot}-${itemId}-stat-${statId}-type" class="comparison-stat-label">Stat Type</label>
                <select id="item-${currentSlot}-${itemId}-stat-${statId}-type" aria-label="Stat type">
                    ${optionsHTML}
                </select>
            </div>
            <div class="input-group comparison-stat-group">
                <label for="item-${currentSlot}-${itemId}-stat-${statId}-value" class="comparison-stat-label">Value</label>
                <input type="number" step="0.1" id="item-${currentSlot}-${itemId}-stat-${statId}-value" value="0" aria-label="Stat value">
            </div>
            <button onclick="removeComparisonItemStat(${itemId}, ${statId})" class="comparison-stat-remove" aria-label="Remove stat">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
            </button>
        `;

    container.appendChild(statDiv);

    const typeInput = document.getElementById(
      `item-${currentSlot}-${itemId}-stat-${statId}-type`,
    );
    const valueInput = document.getElementById(
      `item-${currentSlot}-${itemId}-stat-${statId}-value`,
    );

    typeInput.onchange = () => saveSlotItemData(guid);
    valueInput.onchange = () => saveSlotItemData(guid);

    // Save after adding stat
    await saveSlotItemData(guid);
  } catch (error) {
    console.error("[ComparisonUI] Failed to add comparison item stat:", error);
  }
}
window.addComparisonItemStat = addComparisonItemStat;

/**
 * Remove a stat from a comparison item
 * @param {number} itemId - UI item ID
 * @param {number} statId - Stat ID
 */
export async function removeComparisonItemStat(itemId, statId) {
  try {
    const currentSlot = getCurrentSlot();
    const guid = getGuidFromItemId(currentSlot, itemId);

    if (!guid) {
      console.error(`[ComparisonUI] Could not find guid for item ${itemId}`);
      return;
    }

    const stat = document.getElementById(
      `item-${currentSlot}-${itemId}-stat-${statId}`,
    );
    if (stat) {
      stat.style.opacity = "0";
      stat.style.transform = "translateX(-20px)";
      setTimeout(async () => {
        stat.remove();
        // Save after removing stat
        await saveSlotItemData(guid);
      }, COMPARISON_CONFIG.ANIMATION_DURATION_MS);
    }
  } catch (error) {
    console.error(
      "[ComparisonUI] Failed to remove comparison item stat:",
      error,
    );
  }
}
window.removeComparisonItemStat = removeComparisonItemStat;

// ============================================================================
// EMPTY STATE
// ============================================================================

/**
 * Show empty state when no comparison items exist
 */
function showEmptyComparisonState() {
  const container = document.getElementById("comparison-items-container");
  if (container && container.children.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "comparison-empty-state";
    emptyState.innerHTML = `
            <div class="comparison-empty-icon">
                <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
            </div>
            <p class="comparison-empty-text">No comparison items yet</p>
            <p class="comparison-empty-subtext">Add items to compare with your equipped gear</p>
        `;
    container.appendChild(emptyState);
  }
}

/**
 * Remove empty state when items are added
 */
function hideEmptyComparisonState() {
  const container = document.getElementById("comparison-items-container");
  if (container) {
    const emptyStates = container.querySelectorAll(".comparison-empty-state");
    emptyStates.forEach((state) => state.remove());
  }
}
