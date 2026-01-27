import {
  getComparisonItems,
  addComparisonItem,
  updateComparisonItem,
  removeComparisonItem,
  addStatLine,
  removeStatLine,
  calculateAllItemsDamage,
  calculateEquippedDamage,
  EQUIPMENT_SLOTS,
  generateDefaultItemName,
  getSlotConfig,
  showEquipConfirmModal
} from "./comparison.js";
import { STAT } from "@ts/types/constants.js";
import { generateStatTypeOptionsHTML } from "@ts/page/equipment/equipment.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { showToast } from "@ts/utils/notifications.js";
import { displayResults } from "./results-display.js";
import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
let currentSlot = "head";
let activeItemGuid = null;
let lastDeletedItem = null;
let undoTimeout = null;
function generateSlotSelectorOptionsHTML() {
  return Object.values(EQUIPMENT_SLOTS).map(
    (slot) => `<option value="${slot.id}">${slot.name}</option>`
  ).join("");
}
function generateComparisonHTML() {
  return `
        <!-- Slot Selector with Improved Visual Hierarchy -->
        <div class="comparison-slot-selector-wrapper">
            <div class="comparison-slot-selector-inner">
                <label for="comparison-slot-selector" class="comparison-slot-label">Equipment Slot</label>
                <select id="comparison-slot-selector" class="comparison-slot-select" aria-label="Select equipment slot to compare">
                    ${generateSlotSelectorOptionsHTML()}
                </select>
            </div>
        </div>

        <!-- Two Column Layout with Improved Spacing -->
        <div class="comparison-columns-wrapper">
            <!-- Equipped Item Card -->
            <div class="comparison-column">
                <h3 class="comparison-column-header comparison-column-header--equipped">Currently Equipped</h3>
                <p class="equipped-description">
                    Equipped item stats are assumed to be included in your Base Stats tab inputs.
                    To edit equipped items, go to the <a href="#equipment" class="equipped-link" data-navigable="true">Equipment tab</a>.
                </p>
                <div class="equipped-item-card">
                    <div class="equipped-card-header">
                        <div class="equipped-card-title-row">
                            <span class="equipped-card-title">Equipped Item</span>
                            <span class="equipped-card-subtitle">(stats in base setup)</span>
                        </div>
                    </div>
                    <div class="equipped-inputs-row">
                        <div class="input-group equipped-input-group">
                            <label for="equipped-name" class="equipped-label">Name</label>
                            <input type="text" id="equipped-name" value="Current Item" aria-label="Equipped item name" maxlength="50" readonly>
                        </div>
                        <div class="input-group equipped-input-group">
                            <label for="equipped-attack" class="equipped-label">Attack</label>
                            <input type="number" id="equipped-attack" value="0" aria-label="Equipped item attack value" readonly>
                        </div>
                        <div id="equipped-main-stat-container" class="input-group equipped-input-group" style="display: none;">
                            <label for="equipped-main-stat" class="equipped-label">Main Stat</label>
                            <input type="number" step="1" id="equipped-main-stat" value="0" aria-label="Equipped item main stat value" readonly>
                        </div>
                    </div>
                    <div class="equipped-stats-header">
                        <label class="equipped-stats-label">Additional Stats</label>
                        <button id="equipped-add-stat-btn" class="comparison-action-btn comparison-action-btn--add" aria-label="Add stat to equipped item" disabled style="opacity: 0.5; cursor: not-allowed;">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            </svg>
                            <span>Add Stat</span>
                        </button>
                    </div>
                    <div id="equipped-stats-container" class="equipped-stats-container"></div>
                </div>
            </div>

            <!-- Comparison Items Column -->
            <div class="comparison-column">
                <h3 class="comparison-column-header comparison-column-header--comparison">Comparison Items</h3>
                <!-- Tab Navigation with Enhanced Accessibility -->
                <div id="comparison-tabs-container" class="comparison-tabs-container" role="tablist" aria-label="Comparison item tabs">
                    <button class="comparison-add-tab-btn" data-type="add-button" aria-label="Add new comparison item">
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        <span>Add Item</span>
                    </button>
                </div>
                <!-- Comparison Items Content -->
                <div id="comparison-items-container" class="comparison-items-container" role="presentation"></div>
            </div>
        </div>

        <!-- Calculate Button with Enhanced Styling -->
        <button class="comparison-calculate-btn" aria-label="Calculate damage for all comparison items">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 1 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            <span>Calculate All</span>
        </button>

        <!-- Results Section with Improved Visual Separation -->
        <div class="comparison-results-section">
            <h3 class="comparison-results-title">Comparison Results</h3>
            <div id="results-container" class="comparison-results-grid">
                <!-- Results will be populated by JavaScript -->
            </div>
            <div id="results-loading-spinner" class="comparison-loading-spinner" style="display: none;" aria-live="polite" aria-busy="false">
                <div class="spinner"></div>
                <p class="loading-text">Calculating damage...</p>
            </div>
        </div>
    `;
}
function renderEquippedItem() {
  const equipmentData = loadoutStore.getEquipmentData();
  const slotData = equipmentData[currentSlot];
  const slotConfig = getSlotConfig(currentSlot);
  const nameInput = document.getElementById("equipped-name");
  const attackInput = document.getElementById("equipped-attack");
  const mainStatContainer = document.getElementById("equipped-main-stat-container");
  const mainStatInput = document.getElementById("equipped-main-stat");
  if (nameInput) nameInput.value = slotData?.name || "Equipped Item";
  if (attackInput) attackInput.value = slotData?.attack?.toString() || "0";
  if (mainStatContainer && mainStatInput) {
    if (slotConfig?.hasMainStat) {
      mainStatContainer.style.display = "";
      mainStatInput.value = slotData?.mainStat?.toString() || "0";
    } else {
      mainStatContainer.style.display = "none";
    }
  }
  const statsContainer = document.getElementById("equipped-stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = "";
    const statLines = slotData?.statLines || [];
    const minRows = Math.max(3, statLines.length);
    for (let i = 0; i < minRows; i++) {
      const statLine = statLines[i];
      const statDiv = document.createElement("div");
      statDiv.className = "equipped-stat-row";
      statDiv.dataset.statIndex = i.toString();
      statDiv.style.cssText = "display: grid; grid-template-columns: 1fr 80px 32px; gap: 8px; margin-bottom: 6px; align-items: end;";
      statDiv.innerHTML = `
                <div class="input-group">
                    <label style="font-size: 0.8em;">Stat</label>
                    <select class="equipped-stat-type" data-stat-index="${i}" disabled style="opacity: 0.5; cursor: not-allowed;">
                        ${generateStatTypeOptionsHTML()}
                    </select>
                </div>
                <div class="input-group">
                    <label style="font-size: 0.8em;">Value</label>
                    <input type="number" step="0.1" class="equipped-stat-value" data-stat-index="${i}" value="${statLine?.value || 0}" readonly>
                </div>
                <button class="equipped-stat-remove" data-stat-index="${i}" aria-label="Remove stat line" title="Remove stat line" disabled style="opacity: 0.5; cursor: not-allowed;">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                </button>
            `;
      statsContainer.appendChild(statDiv);
      if (statLine) {
        const typeSelect = statDiv.querySelector(".equipped-stat-type");
        if (typeSelect) typeSelect.value = statLine.type;
      }
    }
  }
}
function renderComparisonItems() {
  const items = getComparisonItems(currentSlot);
  const tabsContainer = document.getElementById("comparison-tabs-container");
  const itemsContainer = document.getElementById("comparison-items-container");
  if (!tabsContainer || !itemsContainer) return;
  const addButton = tabsContainer.querySelector('[data-type="add-button"]');
  tabsContainer.innerHTML = "";
  if (addButton) {
    tabsContainer.appendChild(addButton);
  }
  itemsContainer.innerHTML = "";
  if (items.length === 0) {
    renderEmptyState(itemsContainer);
    return;
  }
  items.forEach((item, index) => {
    const tabButton = document.createElement("button");
    tabButton.className = "comparison-tab-button";
    tabButton.dataset.guid = item.guid;
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-selected", "false");
    tabButton.setAttribute("aria-controls", `comparison-item-${item.guid}`);
    tabButton.onclick = () => switchToItem(item.guid);
    const nameSpan = document.createElement("span");
    nameSpan.className = "tab-item-name";
    nameSpan.textContent = item.name;
    const removeButton = document.createElement("button");
    removeButton.className = "comparison-tab-remove";
    removeButton.setAttribute("aria-label", `Remove ${item.name}`);
    removeButton.onclick = (e) => {
      e.stopPropagation();
      deleteItem(item.guid);
    };
    removeButton.innerHTML = `
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
        `;
    tabButton.appendChild(nameSpan);
    tabButton.appendChild(removeButton);
    tabsContainer.insertBefore(tabButton, addButton);
    const itemCard = createItemCard(item, index + 1);
    itemsContainer.appendChild(itemCard);
  });
  if (items.length > 0 && !activeItemGuid) {
    switchToItem(items[0].guid);
  } else if (activeItemGuid) {
    switchToItem(activeItemGuid);
  }
}
function createItemCard(item, itemNumber) {
  const itemDiv = document.createElement("div");
  itemDiv.id = `comparison-item-${item.guid}`;
  itemDiv.dataset.guid = item.guid;
  itemDiv.className = "comparison-item-card";
  itemDiv.style.display = "none";
  itemDiv.setAttribute("role", "tabpanel");
  itemDiv.setAttribute("aria-labelledby", `comparison-tab-${item.guid}`);
  itemDiv.innerHTML = `
        <div class="comparison-card-inner">
            <div class="comparison-card-header">
                <div class="comparison-inputs-row">
                    <div class="input-group comparison-input-group">
                        <label for="item-${item.guid}-name">Name</label>
                        <input type="text" id="item-${item.guid}-name" value="${item.name}"
                            maxlength="50" aria-label="Item name" data-guid="${item.guid}">
                    </div>
                    <div class="input-group comparison-input-group">
                        <label for="item-${item.guid}-attack">Attack</label>
                        <input type="number" id="item-${item.guid}-attack" value="${item.attack}"
                            aria-label="Item attack value" data-guid="${item.guid}">
                    </div>
                </div>
            </div>

            <div id="item-${item.guid}-stats-container" class="comparison-stats-container"></div>

            <div class="comparison-card-actions">
                <button class="comparison-action-btn comparison-action-btn--add" aria-label="Add stat to item" data-guid="${item.guid}">
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                    <span>Add Stat</span>
                </button>
                <button style="display:none;" class="comparison-action-btn comparison-action-btn--equip" aria-label="Equip this item" data-guid="${item.guid}">
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 1 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    </svg>
                    <span>Equip</span>
                </button>
            </div>
        </div>
    `;
  const statsContainer = itemDiv.querySelector(`#item-${item.guid}-stats-container`);
  if (statsContainer) {
    item.statLines.forEach((statLine, index) => {
      const statDiv = createStatLineElement(item.guid, statLine, index);
      statsContainer.appendChild(statDiv);
    });
  }
  attachItemEventListeners(itemDiv);
  return itemDiv;
}
function createStatLineElement(itemGuid, statLine, index) {
  const statDiv = document.createElement("div");
  statDiv.id = `item-${itemGuid}-stat-${index}`;
  statDiv.className = "comparison-stat-row";
  statDiv.style.cssText = "--animation-order: " + index;
  statDiv.innerHTML = `
        <div class="input-group comparison-stat-group">
            <label for="item-${itemGuid}-stat-${index}-type" class="comparison-stat-label">Stat Type</label>
            <select id="item-${itemGuid}-stat-${index}-type" aria-label="Stat type" data-guid="${itemGuid}" data-stat-index="${index}">
                ${generateStatTypeOptionsHTML()}
            </select>
        </div>
        <div class="input-group comparison-stat-group">
            <label for="item-${itemGuid}-stat-${index}-value" class="comparison-stat-label">Value</label>
            <input type="number" step="0.1" id="item-${itemGuid}-stat-${index}-value" value="${statLine.value}" aria-label="Stat value" data-guid="${itemGuid}" data-stat-index="${index}">
        </div>
        <button class="comparison-stat-remove" aria-label="Remove stat" data-guid="${itemGuid}" data-stat-index="${index}">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
        </button>
    `;
  const typeSelect = statDiv.querySelector(`#item-${itemGuid}-stat-${index}-type`);
  const valueInput = statDiv.querySelector(`#item-${itemGuid}-stat-${index}-value`);
  if (typeSelect) typeSelect.value = statLine.type;
  if (valueInput) valueInput.value = statLine.value.toString();
  if (typeSelect) {
    typeSelect.addEventListener("change", () => updateStatLineFromDOM(itemGuid, index));
  }
  if (valueInput) {
    valueInput.addEventListener("input", () => updateStatLineFromDOM(itemGuid, index));
  }
  const removeButton = statDiv.querySelector(".comparison-stat-remove");
  if (removeButton) {
    removeButton.onclick = () => deleteStatLine(itemGuid, index);
  }
  return statDiv;
}
function renderEmptyState(container) {
  container.innerHTML = `
        <div class="comparison-empty-state">
            <div class="comparison-empty-icon">
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
            </div>
            <p class="comparison-empty-text">No comparison items yet</p>
            <p class="comparison-empty-subtext">Add items to compare with your equipped gear</p>
        </div>
    `;
}
function attachEventListeners() {
  const slotSelector = document.getElementById("comparison-slot-selector");
  if (slotSelector) {
    slotSelector.addEventListener("change", (e) => {
      const target = e.target;
      switchSlot(target.value);
    });
  }
  const addButton = document.querySelector('[data-type="add-button"]');
  if (addButton) {
    addButton.onclick = handleAddItem;
  }
  const calculateButton = document.querySelector(".comparison-calculate-btn");
  if (calculateButton) {
    calculateButton.onclick = handleCalculate;
  }
}
function attachItemEventListeners(itemDiv) {
  const guid = itemDiv.dataset.guid;
  if (!guid) return;
  const nameInput = itemDiv.querySelector(`#item-${guid}-name`);
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      updateItemName(guid, nameInput.value);
      updateTabName(guid, nameInput.value);
    });
  }
  const attackInput = itemDiv.querySelector(`#item-${guid}-attack`);
  if (attackInput) {
    attackInput.addEventListener("input", () => {
      updateItemAttack(guid, parseFloat(attackInput.value) || 0);
      triggerAutoCalculate();
    });
  }
  const addStatButton = itemDiv.querySelector(`[data-guid="${guid}"].comparison-action-btn--add`);
  if (addStatButton) {
    addStatButton.onclick = () => handleAddStatLine(guid);
  }
  const equipButton = itemDiv.querySelector(`[data-guid="${guid}"].comparison-action-btn--equip`);
  if (equipButton) {
    equipButton.onclick = () => handleEquipItem(guid);
  }
}
function handleAddItem() {
  const items = getComparisonItems(currentSlot);
  const defaultName = generateDefaultItemName(currentSlot, items.length);
  const newItem = addComparisonItem(currentSlot, {
    name: defaultName,
    attack: 0,
    mainStat: 0,
    statLines: []
  });
  renderComparisonItems();
  switchToItem(newItem.guid);
  triggerAutoCalculate();
}
function convertEquippedToComparisonItem(equippedItem) {
  if (!equippedItem?.name) return null;
  return {
    name: equippedItem.name,
    attack: equippedItem.attack,
    mainStat: equippedItem.mainStat || 0,
    statLines: equippedItem.statLines?.map((sl) => ({
      type: sl.type,
      value: sl.value
    })) || []
  };
}
function handleAddStatLine(guid) {
  const item = getComparisonItems(currentSlot).find((i) => i.guid === guid);
  if (!item) return;
  addStatLine(currentSlot, guid, { type: "attack", value: 0 });
  renderItemStatLines(guid);
  triggerAutoCalculate();
}
async function handleEquipItem(guid) {
  const item = getComparisonItems(currentSlot).find((i) => i.guid === guid);
  if (!item) return;
  const userChoice = await showEquipConfirmModal(currentSlot, item);
  if (userChoice === "cancel") {
    return;
  }
  const equipmentData = loadoutStore.getEquipmentData();
  const equippedItem = equipmentData[currentSlot];
  if (equippedItem) {
    const oldItemAsComparison = convertEquippedToComparisonItem(equippedItem);
    if (oldItemAsComparison) {
      addComparisonItem(currentSlot, oldItemAsComparison);
    }
  }
  if (userChoice === "yes") {
    const baseStats = loadoutStore.getBaseStats();
    const subtractService = new StatCalculationService(baseStats);
    if (equippedItem) {
      subtractService.subtract(STAT.ATTACK.id, equippedItem.attack);
      subtractService.subtract(STAT.PRIMARY_MAIN_STAT.id, equippedItem.mainStat || 0);
      equippedItem.statLines?.forEach((statLine) => {
        subtractService.subtract(statLine.type, statLine.value);
      });
    }
    const addService = new StatCalculationService(subtractService.getStats());
    addService.add(STAT.ATTACK.id, item.attack);
    addService.add(STAT.PRIMARY_MAIN_STAT.id, item.mainStat);
    item.statLines.forEach((statLine) => {
      addService.add(statLine.type, statLine.value);
    });
    loadoutStore.updateBaseStats(addService.getStats());
  }
  loadoutStore.updateEquipment(currentSlot, {
    name: item.name,
    attack: item.attack,
    mainStat: item.mainStat,
    statLines: item.statLines.map((sl) => ({
      type: sl.type,
      value: sl.value
    }))
  });
  removeComparisonItem(currentSlot, guid);
  renderComparisonItems();
  renderEquippedItem();
  handleCalculate();
  showToast(`Equipped ${item.name}`, true);
}
function handleCalculate() {
  const resultsContainer = document.getElementById("results-container");
  const loadingSpinner = document.getElementById("results-loading-spinner");
  if (!resultsContainer || !loadingSpinner) return;
  loadingSpinner.style.display = "flex";
  loadingSpinner.setAttribute("aria-busy", "true");
  resultsContainer.style.display = "none";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        const results = calculateAllItemsDamage(currentSlot);
        const equippedResult = calculateEquippedDamage(currentSlot);
        resultsContainer.innerHTML = "";
        const equippedDamageValues = equippedResult ? {
          dpsBoss: 0,
          expectedDamageBoss: 0,
          dpsNormal: 0,
          expectedDamageNormal: 0
        } : null;
        if (equippedResult && equippedDamageValues) {
          const service = new StatCalculationService(equippedResult.stats);
          const bossResults = service.compute("boss");
          const normalResults = service.compute("normal");
          equippedDamageValues.dpsBoss = bossResults.dps;
          equippedDamageValues.expectedDamageBoss = bossResults.expectedDamage;
          equippedDamageValues.dpsNormal = normalResults.dps;
          equippedDamageValues.expectedDamageNormal = normalResults.expectedDamage;
        }
        if (equippedResult) {
          resultsContainer.innerHTML += displayResults(equippedResult.name, equippedResult.stats, "equipped", true, null);
        }
        results.forEach((result) => {
          resultsContainer.innerHTML += displayResults(
            result.name,
            result.stats,
            result.guid,
            false,
            equippedDamageValues,
            result.passiveGains
          );
        });
        loadingSpinner.style.display = "none";
        loadingSpinner.setAttribute("aria-busy", "false");
        resultsContainer.style.display = "grid";
      } catch (error) {
        console.error("Calculation failed:", error);
        loadingSpinner.style.display = "none";
        loadingSpinner.setAttribute("aria-busy", "false");
        resultsContainer.style.display = "grid";
        resultsContainer.innerHTML = `
                    <div class="calculation-error" style="grid-column: 1 / -1; padding: var(--comp-space-lg); text-align: center;">
                        <p style="color: var(--text-secondary); margin: 0;">Calculation failed. Please try again.</p>
                    </div>
                `;
      }
    });
  });
}
let autoCalculateTimeout = null;
function triggerAutoCalculate() {
  if (autoCalculateTimeout) {
    clearTimeout(autoCalculateTimeout);
  }
  autoCalculateTimeout = window.setTimeout(() => {
    handleCalculate();
  }, 500);
}
function switchSlot(slotId) {
  localStorage.setItem("lastSelectedComparisonSlot", slotId);
  currentSlot = slotId;
  activeItemGuid = null;
  const slotSelector = document.getElementById("comparison-slot-selector");
  if (slotSelector) {
    slotSelector.value = slotId;
  }
  renderEquippedItem();
  renderComparisonItems();
  handleCalculate();
}
function switchToItem(guid) {
  activeItemGuid = guid;
  const allItems = document.querySelectorAll(".comparison-item-card");
  allItems.forEach((item) => {
    item.style.display = "none";
  });
  const allTabs = document.querySelectorAll(".comparison-tab-button");
  allTabs.forEach((tab) => {
    tab.classList.remove("active");
    tab.setAttribute("aria-selected", "false");
  });
  const selectedItem = document.getElementById(`comparison-item-${guid}`);
  if (selectedItem) {
    selectedItem.style.display = "block";
  }
  const selectedTab = document.querySelector(`[data-guid="${guid}"].comparison-tab-button`);
  if (selectedTab) {
    selectedTab.classList.add("active");
    selectedTab.setAttribute("aria-selected", "true");
  }
}
function deleteItem(guid) {
  const items = getComparisonItems(currentSlot);
  const item = items.find((i) => i.guid === guid);
  if (!item) return;
  lastDeletedItem = { slotId: currentSlot, item };
  removeComparisonItem(currentSlot, guid);
  if (undoTimeout) {
    clearTimeout(undoTimeout);
  }
  renderComparisonItems();
  showUndoButton(item.name);
  undoTimeout = window.setTimeout(() => {
    hideUndoButton();
    lastDeletedItem = null;
  }, 1e4);
}
function showUndoButton(itemName) {
  hideUndoButton();
  const undoButton = document.createElement("button");
  undoButton.id = "comparison-undo-btn";
  undoButton.className = "comparison-undo-btn";
  undoButton.innerHTML = `
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
        </svg>
        <span>Undo</span>
    `;
  undoButton.onclick = handleUndo;
  const calculateButton = document.querySelector(".comparison-calculate-btn");
  if (calculateButton && calculateButton.parentElement) {
    calculateButton.parentElement.insertBefore(undoButton, calculateButton.nextSibling);
  }
}
function hideUndoButton() {
  const undoButton = document.getElementById("comparison-undo-btn");
  if (undoButton) {
    undoButton.remove();
  }
}
function handleUndo() {
  if (!lastDeletedItem) return;
  addComparisonItem(lastDeletedItem.slotId, lastDeletedItem.item);
  if (lastDeletedItem.slotId !== currentSlot) {
    switchSlot(lastDeletedItem.slotId);
  }
  lastDeletedItem = null;
  if (undoTimeout) {
    clearTimeout(undoTimeout);
    undoTimeout = null;
  }
  hideUndoButton();
  renderComparisonItems();
  showToast("Item restored", true);
}
function deleteStatLine(guid, statIndex) {
  removeStatLine(currentSlot, guid, statIndex);
  renderItemStatLines(guid);
  triggerAutoCalculate();
}
function updateItemName(guid, name) {
  updateComparisonItem(currentSlot, guid, { name });
}
function updateItemAttack(guid, attack) {
  updateComparisonItem(currentSlot, guid, { attack });
}
function updateStatLineFromDOM(guid, statIndex) {
  const statLineElement = document.getElementById(`item-${guid}-stat-${statIndex}`);
  if (!statLineElement) return;
  const typeSelect = statLineElement.querySelector(`#item-${guid}-stat-${statIndex}-type`);
  const valueInput = statLineElement.querySelector(`#item-${guid}-stat-${statIndex}-value`);
  if (!typeSelect || !valueInput) return;
  const item = getComparisonItems(currentSlot).find((i) => i.guid === guid);
  if (!item) return;
  const updatedStatLines = [...item.statLines];
  updatedStatLines[statIndex] = {
    type: typeSelect.value,
    value: parseFloat(valueInput.value) || 0
  };
  updateComparisonItem(currentSlot, guid, { statLines: updatedStatLines });
}
function updateTabName(guid, name) {
  const tab = document.querySelector(`[data-guid="${guid}"].comparison-tab-button`);
  if (tab) {
    const nameSpan = tab.querySelector(".tab-item-name");
    if (nameSpan) {
      nameSpan.textContent = name;
    }
  }
}
function renderItemStatLines(guid) {
  const item = getComparisonItems(currentSlot).find((i) => i.guid === guid);
  if (!item) return;
  const statsContainer = document.getElementById(`item-${guid}-stats-container`);
  if (!statsContainer) return;
  statsContainer.innerHTML = "";
  item.statLines.forEach((statLine, index) => {
    const statDiv = createStatLineElement(guid, statLine, index);
    statsContainer.appendChild(statDiv);
  });
}
function initializeComparisonUI() {
  const container = document.getElementById("optimization-item-comparison");
  if (!container) {
    console.error("Comparison container not found");
    return;
  }
  container.innerHTML = generateComparisonHTML();
  const savedSlot = localStorage.getItem("lastSelectedComparisonSlot");
  if (savedSlot && EQUIPMENT_SLOTS[savedSlot]) {
    currentSlot = savedSlot;
  }
  const slotSelector = document.getElementById("comparison-slot-selector");
  if (slotSelector) {
    slotSelector.value = currentSlot;
  }
  attachEventListeners();
  renderEquippedItem();
  renderComparisonItems();
  handleCalculate();
}
function checkPendingSlotNavigation() {
  const storedSlot = sessionStorage.getItem("selectedEquipmentSlot");
  if (storedSlot && EQUIPMENT_SLOTS[storedSlot]) {
    sessionStorage.removeItem("selectedEquipmentSlot");
    switchSlot(storedSlot);
  } else {
    handleCalculate();
  }
}
window.checkPendingSlotNavigation = checkPendingSlotNavigation;
export {
  checkPendingSlotNavigation,
  generateComparisonHTML,
  initializeComparisonUI
};
//# sourceMappingURL=comparison-ui.js.map
