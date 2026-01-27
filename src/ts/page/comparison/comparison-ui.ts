/**
 * Comparison Equipment UI - Pure UI Module
 *
 * This module handles all HTML generation and UI event handling for the
 * equipment comparison tab, keeping it separate from business logic.
 *
 * Responsibilities:
 * - Generate all HTML for the comparison tab
 * - Attach event listeners
 * - Handle user interactions
 * - Render calculation results
 */

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
    getSlotConfig
} from './comparison';
import type { ComparisonItem, EquipmentSlotId, ComparisonStatLine } from '@ts/types/page/gear-lab/gear-lab.types';
import type { StatId } from '@ts/types/constants';
import { generateStatTypeOptionsHTML } from '@ts/page/equipment/equipment';
import { loadoutStore } from '@ts/store/loadout.store';
import { gearLabStore } from '@ts/store/gear-lab-store';
import { showToast } from '@ts/utils/notifications';
import { displayResults } from './results-display';
import { StatCalculationService } from '@ts/services/stat-calculation-service.js';
import type { EquipmentSlotData } from '@ts/types/page/equipment/equipment.types';

// ============================================================================
// STATE
// ============================================================================

/**
 * Current selected slot
 */
let currentSlot: EquipmentSlotId = 'head';

/**
 * Currently active comparison item GUID
 */
let activeItemGuid: string | null = null;

/**
 * Last deleted item for undo functionality
 */
let lastDeletedItem: { slotId: EquipmentSlotId; item: ComparisonItem } | null = null;

/**
 * Undo timeout ID
 */
let undoTimeout: number | null = null;

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate slot selector options HTML
 */
function generateSlotSelectorOptionsHTML(): string {
    return Object.values(EQUIPMENT_SLOTS).map(slot =>
        `<option value="${slot.id}">${slot.name}</option>`
    ).join('');
}

/**
 * Generate the complete HTML for the comparison tab
 */
export function generateComparisonHTML(): string {
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

// ============================================================================
// UI RENDERING
// ============================================================================

/**
 * Render the equipped item display
 */
function renderEquippedItem(): void {
    const equipmentData = loadoutStore.getEquipmentData();
    const slotData = equipmentData[currentSlot];
    const slotConfig = getSlotConfig(currentSlot);

    // Update header
    const nameInput = document.getElementById('equipped-name') as HTMLInputElement;
    const attackInput = document.getElementById('equipped-attack') as HTMLInputElement;
    const mainStatContainer = document.getElementById('equipped-main-stat-container') as HTMLElement;
    const mainStatInput = document.getElementById('equipped-main-stat') as HTMLInputElement;

    // Use slot data name or default
    if (nameInput) nameInput.value = slotData?.name || 'Equipped Item';
    if (attackInput) attackInput.value = slotData?.attack?.toString() || '0';

    // Show/hide main stat input based on slot config
    if (mainStatContainer && mainStatInput) {
        if (slotConfig?.hasMainStat) {
            mainStatContainer.style.display = '';
            mainStatInput.value = slotData?.mainStat?.toString() || '0';
        } else {
            mainStatContainer.style.display = 'none';
        }
    }

    // Render stat lines from actual equipped item
    const statsContainer = document.getElementById('equipped-stats-container');
    if (statsContainer) {
        statsContainer.innerHTML = '';

        // Show up to 3 stat lines from the equipped item (or more if added)
        const statLines = slotData?.statLines || [];

        // Show at least 3 rows (empty if no data), or more if user added more stats
        const minRows = Math.max(3, statLines.length);
        for (let i = 0; i < minRows; i++) {
            const statLine = statLines[i];
            const statDiv = document.createElement('div');
            statDiv.className = 'equipped-stat-row';
            statDiv.dataset.statIndex = i.toString();
            statDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 80px 32px; gap: 8px; margin-bottom: 6px; align-items: end;';
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

            // Set the stat type select value if we have data
            if (statLine) {
                const typeSelect = statDiv.querySelector('.equipped-stat-type') as HTMLSelectElement;
                if (typeSelect) typeSelect.value = statLine.type;
            }
        }
    }

    // No longer attaching event listeners since inputs are now readonly
    // attachEquippedItemEventListeners();
}

/**
 * Render comparison items for the current slot
 */
function renderComparisonItems(): void {
    const items = getComparisonItems(currentSlot);
    const tabsContainer = document.getElementById('comparison-tabs-container');
    const itemsContainer = document.getElementById('comparison-items-container');

    if (!tabsContainer || !itemsContainer) return;

    // Clear existing items (preserve add button)
    const addButton = tabsContainer.querySelector('[data-type="add-button"]');
    tabsContainer.innerHTML = '';
    if (addButton) {
        tabsContainer.appendChild(addButton);
    }
    itemsContainer.innerHTML = '';

    // Show empty state if no items
    if (items.length === 0) {
        renderEmptyState(itemsContainer);
        return;
    }

    // Render each item
    items.forEach((item, index) => {
        // Create tab
        const tabButton = document.createElement('button');
        tabButton.className = 'comparison-tab-button';
        tabButton.dataset.guid = item.guid;
        tabButton.setAttribute('role', 'tab');
        tabButton.setAttribute('aria-selected', 'false');
        tabButton.setAttribute('aria-controls', `comparison-item-${item.guid}`);
        tabButton.onclick = () => switchToItem(item.guid);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-item-name';
        nameSpan.textContent = item.name;

        const removeButton = document.createElement('button');
        removeButton.className = 'comparison-tab-remove';
        removeButton.setAttribute('aria-label', `Remove ${item.name}`);
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

        // Create item card
        const itemCard = createItemCard(item, index + 1);
        itemsContainer.appendChild(itemCard);
    });

    // Select first item by default
    if (items.length > 0 && !activeItemGuid) {
        switchToItem(items[0].guid);
    } else if (activeItemGuid) {
        switchToItem(activeItemGuid);
    }
}

/**
 * Create an item card element
 */
function createItemCard(item: ComparisonItem, itemNumber: number): HTMLElement {
    const itemDiv = document.createElement('div');
    itemDiv.id = `comparison-item-${item.guid}`;
    itemDiv.dataset.guid = item.guid;
    itemDiv.className = 'comparison-item-card';
    itemDiv.style.display = 'none';
    itemDiv.setAttribute('role', 'tabpanel');
    itemDiv.setAttribute('aria-labelledby', `comparison-tab-${item.guid}`);

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
                <!--<button class="comparison-action-btn comparison-action-btn--equip" aria-label="Equip this item" data-guid="${item.guid}">
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 1 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    </svg>
                    <span>Equip</span>
                </button>-->
            </div>
        </div>
    `;

    // Render stat lines
    const statsContainer = itemDiv.querySelector(`#item-${item.guid}-stats-container`) as HTMLElement;
    if (statsContainer) {
        item.statLines.forEach((statLine, index) => {
            const statDiv = createStatLineElement(item.guid, statLine, index);
            statsContainer.appendChild(statDiv);
        });
    }

    // Attach event listeners using querySelector on the created element
    // to ensure we find the elements in the updated DOM
    attachItemEventListeners(itemDiv);

    return itemDiv;
}

/**
 * Create a stat line element
 */
function createStatLineElement(itemGuid: string, statLine: ComparisonStatLine, index: number): HTMLElement {
    const statDiv = document.createElement('div');
    statDiv.id = `item-${itemGuid}-stat-${index}`;
    statDiv.className = 'comparison-stat-row';
    statDiv.style.cssText = '--animation-order: ' + index;

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

    // Set initial values
    const typeSelect = statDiv.querySelector(`#item-${itemGuid}-stat-${index}-type`) as HTMLSelectElement;
    const valueInput = statDiv.querySelector(`#item-${itemGuid}-stat-${index}-value`) as HTMLInputElement;

    if (typeSelect) typeSelect.value = statLine.type;
    if (valueInput) valueInput.value = statLine.value.toString();

    // Attach event listeners
    if (typeSelect) {
        typeSelect.addEventListener('change', () => updateStatLineFromDOM(itemGuid, index));
    }
    if (valueInput) {
        valueInput.addEventListener('input', () => updateStatLineFromDOM(itemGuid, index));
    }

    // Remove button
    const removeButton = statDiv.querySelector('.comparison-stat-remove') as HTMLButtonElement;
    if (removeButton) {
        removeButton.onclick = () => deleteStatLine(itemGuid, index);
    }

    return statDiv;
}

/**
 * Render empty state
 */
function renderEmptyState(container: HTMLElement): void {
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

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Attach event listeners to the comparison UI
 */
function attachEventListeners(): void {
    // Slot selector
    const slotSelector = document.getElementById('comparison-slot-selector') as HTMLSelectElement;
    if (slotSelector) {
        slotSelector.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            switchSlot(target.value as EquipmentSlotId);
        });
    }

    // Add item button
    const addButton = document.querySelector('[data-type="add-button"]') as HTMLButtonElement;
    if (addButton) {
        addButton.onclick = handleAddItem;
    }

    // Calculate button
    const calculateButton = document.querySelector('.comparison-calculate-btn') as HTMLButtonElement;
    if (calculateButton) {
        calculateButton.onclick = handleCalculate;
    }
}

/**
 * Attach event listeners to an item card
 */
function attachItemEventListeners(itemDiv: HTMLElement): void {
    const guid = itemDiv.dataset.guid;
    if (!guid) return;

    // Name input
    const nameInput = itemDiv.querySelector(`#item-${guid}-name`) as HTMLInputElement;
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            updateItemName(guid, nameInput.value);
            updateTabName(guid, nameInput.value);
        });
    }

    // Attack input
    const attackInput = itemDiv.querySelector(`#item-${guid}-attack`) as HTMLInputElement;
    if (attackInput) {
        attackInput.addEventListener('input', () => {
            updateItemAttack(guid, parseFloat(attackInput.value) || 0);
            triggerAutoCalculate();
        });
    }

    // Add stat button
    const addStatButton = itemDiv.querySelector(`[data-guid="${guid}"].comparison-action-btn--add`) as HTMLButtonElement;
    if (addStatButton) {
        addStatButton.onclick = () => handleAddStatLine(guid);
    }

    // Equip button
    const equipButton = itemDiv.querySelector(`[data-guid="${guid}"].comparison-action-btn--equip`) as HTMLButtonElement;
    if (equipButton) {
        equipButton.onclick = () => handleEquipItem(guid);
    }
}

/**
 * Handle add item button click
 */
function handleAddItem(): void {
    const items = getComparisonItems(currentSlot);
    const defaultName = generateDefaultItemName(currentSlot, items.length);

    const newItem = addComparisonItem(currentSlot, {
        name: defaultName,
        attack: 0,
        mainStat: 0,
        statLines: []
    });

    // Re-render items
    renderComparisonItems();

    // Switch to the new item
    switchToItem(newItem.guid);

    // Auto-calculate
    triggerAutoCalculate();
}

/**
 * Handle add stat line button click
 */
function handleAddStatLine(guid: string): void {
    const item = getComparisonItems(currentSlot).find(i => i.guid === guid);
    if (!item) return;

    // Add empty stat line
    addStatLine(currentSlot, guid, { type: 'attack', value: 0 });

    // Re-render the item's stat lines
    renderItemStatLines(guid);

    // Auto-calculate
    triggerAutoCalculate();
}

/**
 * Handle equip button click
 */
function handleEquipItem(guid: string): void {
    const item = getComparisonItems(currentSlot).find(i => i.guid === guid);
    if (!item) return;

    // Update equipment slot with item data
    gearLabStore.updateEquipmentSlot(currentSlot, {
        attack: item.attack,
        mainStat: item.mainStat,
        damageAmp: 0
    });

    // Remove the comparison item
    removeComparisonItem(currentSlot, guid);

    // Re-render
    renderComparisonItems();
    renderEquippedItem();

    showToast(`Equipped ${item.name}`, true);
}

/**
 * Handle calculate button click
 */
function handleCalculate(): void {
    const resultsContainer = document.getElementById('results-container');
    const loadingSpinner = document.getElementById('results-loading-spinner');

    if (!resultsContainer || !loadingSpinner) return;

    // Show loading spinner, hide results
    loadingSpinner.style.display = 'flex';
    loadingSpinner.setAttribute('aria-busy', 'true');
    resultsContainer.style.display = 'none';

    // Use double requestAnimationFrame to ensure spinner is rendered before blocking calculation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            try {
                // Calculate results
                const results = calculateAllItemsDamage(currentSlot);
                const equippedResult = calculateEquippedDamage(currentSlot);

                // Clear results container
                resultsContainer.innerHTML = '';

                // Extract equipped damage values for comparison
                const equippedDamageValues = equippedResult ? {
                    dpsBoss: 0,
                    expectedDamageBoss: 0,
                    dpsNormal: 0,
                    expectedDamageNormal: 0
                } : null;

                // Calculate equipped damage values from the equipped result stats
                if (equippedResult && equippedDamageValues) {
                    const service = new StatCalculationService(equippedResult.stats);
                    const bossResults = service.compute('boss');
                    const normalResults = service.compute('normal');
                    equippedDamageValues.dpsBoss = bossResults.dps;
                    equippedDamageValues.expectedDamageBoss = bossResults.expectedDamage;
                    equippedDamageValues.dpsNormal = normalResults.dps;
                    equippedDamageValues.expectedDamageNormal = normalResults.expectedDamage;
                }

                // Render equipped result (no comparison needed)
                if (equippedResult) {
                    resultsContainer.innerHTML += displayResults(equippedResult.name, equippedResult.stats, 'equipped', true, null);
                }

                // Render comparison item results with equipped damage values for comparison
                results.forEach(result => {
                    resultsContainer.innerHTML += displayResults(
                        result.name,
                        result.stats,
                        result.guid,
                        false,
                        equippedDamageValues,
                        result.passiveGains
                    );
                });

                // Hide loading spinner, show results
                loadingSpinner.style.display = 'none';
                loadingSpinner.setAttribute('aria-busy', 'false');
                resultsContainer.style.display = 'grid';
            } catch (error) {
                console.error('Calculation failed:', error);
                loadingSpinner.style.display = 'none';
                loadingSpinner.setAttribute('aria-busy', 'false');
                resultsContainer.style.display = 'grid';
                resultsContainer.innerHTML = `
                    <div class="calculation-error" style="grid-column: 1 / -1; padding: var(--comp-space-lg); text-align: center;">
                        <p style="color: var(--text-secondary); margin: 0;">Calculation failed. Please try again.</p>
                    </div>
                `;
            }
        });
    });
}

/**
 * Trigger auto-calculate with debounce
 */
let autoCalculateTimeout: number | null = null;
function triggerAutoCalculate(): void {
    if (autoCalculateTimeout) {
        clearTimeout(autoCalculateTimeout);
    }

    autoCalculateTimeout = window.setTimeout(() => {
        handleCalculate();
    }, 500);
}

/**
 * Switch to a different slot
 */
function switchSlot(slotId: EquipmentSlotId): void {
    // Save current slot selection
    localStorage.setItem('lastSelectedComparisonSlot', slotId);

    // Update current slot
    currentSlot = slotId;
    activeItemGuid = null;

    // Update selector
    const slotSelector = document.getElementById('comparison-slot-selector') as HTMLSelectElement;
    if (slotSelector) {
        slotSelector.value = slotId;
    }

    // Re-render
    renderEquippedItem();
    renderComparisonItems();

    // Auto-calculate results for new slot
    handleCalculate();
}

/**
 * Switch to a specific item tab
 */
function switchToItem(guid: string): void {
    activeItemGuid = guid;

    // Hide all items
    const allItems = document.querySelectorAll('.comparison-item-card');
    allItems.forEach(item => {
        (item as HTMLElement).style.display = 'none';
    });

    // Deactivate all tabs
    const allTabs = document.querySelectorAll('.comparison-tab-button');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    // Show selected item
    const selectedItem = document.getElementById(`comparison-item-${guid}`);
    if (selectedItem) {
        selectedItem.style.display = 'block';
    }

    // Activate selected tab
    const selectedTab = document.querySelector(`[data-guid="${guid}"].comparison-tab-button`);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.setAttribute('aria-selected', 'true');
    }
}

/**
 * Delete an item
 */
function deleteItem(guid: string): void {
    const items = getComparisonItems(currentSlot);
    const item = items.find(i => i.guid === guid);
    if (!item) return;

    // Store for undo
    lastDeletedItem = { slotId: currentSlot, item };

    // Remove from store
    removeComparisonItem(currentSlot, guid);

    // Clear any existing undo timeout
    if (undoTimeout) {
        clearTimeout(undoTimeout);
    }

    // Re-render
    renderComparisonItems();

    // Show undo button
    showUndoButton(item.name);

    // Set undo timeout
    undoTimeout = window.setTimeout(() => {
        hideUndoButton();
        lastDeletedItem = null;
    }, 10000);
}

/**
 * Show the undo button
 */
function showUndoButton(itemName: string): void {
    // Remove existing undo button if present
    hideUndoButton();

    // Create undo button
    const undoButton = document.createElement('button');
    undoButton.id = 'comparison-undo-btn';
    undoButton.className = 'comparison-undo-btn';
    undoButton.innerHTML = `
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
        </svg>
        <span>Undo</span>
    `;
    undoButton.onclick = handleUndo;

    // Find a good place to insert it - after the calculate button
    const calculateButton = document.querySelector('.comparison-calculate-btn');
    if (calculateButton && calculateButton.parentElement) {
        calculateButton.parentElement.insertBefore(undoButton, calculateButton.nextSibling);
    }
}

/**
 * Hide the undo button
 */
function hideUndoButton(): void {
    const undoButton = document.getElementById('comparison-undo-btn');
    if (undoButton) {
        undoButton.remove();
    }
}

/**
 * Handle undo button click
 */
function handleUndo(): void {
    if (!lastDeletedItem) return;

    // Restore the item
    addComparisonItem(lastDeletedItem.slotId, lastDeletedItem.item);

    // Switch to that slot if different
    if (lastDeletedItem.slotId !== currentSlot) {
        switchSlot(lastDeletedItem.slotId);
    }

    // Clear the deleted item and timeout
    lastDeletedItem = null;
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
    }

    // Hide the undo button
    hideUndoButton();

    // Re-render
    renderComparisonItems();

    // Show confirmation
    showToast('Item restored', true);
}

/**
 * Delete a stat line
 */
function deleteStatLine(guid: string, statIndex: number): void {
    removeStatLine(currentSlot, guid, statIndex);

    // Re-render the item's stat lines
    renderItemStatLines(guid);

    // Auto-calculate
    triggerAutoCalculate();
}

/**
 * Update item name
 */
function updateItemName(guid: string, name: string): void {
    updateComparisonItem(currentSlot, guid, { name });
}

/**
 * Update item attack
 */
function updateItemAttack(guid: string, attack: number): void {
    updateComparisonItem(currentSlot, guid, { attack });
}

/**
 * Update stat line from DOM
 */
function updateStatLineFromDOM(guid: string, statIndex: number): void {
    // Find the stat line element and use scoped queries
    const statLineElement = document.getElementById(`item-${guid}-stat-${statIndex}`);
    if (!statLineElement) return;

    const typeSelect = statLineElement.querySelector(`#item-${guid}-stat-${statIndex}-type`) as HTMLSelectElement;
    const valueInput = statLineElement.querySelector(`#item-${guid}-stat-${statIndex}-value`) as HTMLInputElement;

    if (!typeSelect || !valueInput) return;

    const item = getComparisonItems(currentSlot).find(i => i.guid === guid);
    if (!item) return;

    // Update the stat line in the array
    const updatedStatLines = [...item.statLines];
    updatedStatLines[statIndex] = {
        type: typeSelect.value as StatId,
        value: parseFloat(valueInput.value) || 0
    };

    updateComparisonItem(currentSlot, guid, { statLines: updatedStatLines });
}

/**
 * Update tab name
 */
function updateTabName(guid: string, name: string): void {
    const tab = document.querySelector(`[data-guid="${guid}"].comparison-tab-button`);
    if (tab) {
        const nameSpan = tab.querySelector('.tab-item-name');
        if (nameSpan) {
            nameSpan.textContent = name;
        }
    }
}

/**
 * Render stat lines for a specific item
 */
function renderItemStatLines(guid: string): void {
    const item = getComparisonItems(currentSlot).find(i => i.guid === guid);
    if (!item) return;

    const statsContainer = document.getElementById(`item-${guid}-stats-container`) as HTMLElement;
    if (!statsContainer) return;

    statsContainer.innerHTML = '';

    item.statLines.forEach((statLine, index) => {
        const statDiv = createStatLineElement(guid, statLine, index);
        statsContainer.appendChild(statDiv);
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the comparison UI
 */
export function initializeComparisonUI(): void {
    const container = document.getElementById('optimization-item-comparison');
    if (!container) {
        console.error('Comparison container not found');
        return;
    }

    // Generate HTML
    container.innerHTML = generateComparisonHTML();

    // Load saved slot selection
    const savedSlot = localStorage.getItem('lastSelectedComparisonSlot') as EquipmentSlotId;
    if (savedSlot && EQUIPMENT_SLOTS[savedSlot]) {
        currentSlot = savedSlot;
    }

    // Update slot selector
    const slotSelector = document.getElementById('comparison-slot-selector') as HTMLSelectElement;
    if (slotSelector) {
        slotSelector.value = currentSlot;
    }

    // Attach event listeners
    attachEventListeners();

    // Render initial state
    renderEquippedItem();
    renderComparisonItems();

    // Auto-calculate results on initialization
    handleCalculate();
}

/**
 * Check for pending slot navigation (call when Item Comparison tab is shown)
 */
export function checkPendingSlotNavigation(): void {
    const storedSlot = sessionStorage.getItem('selectedEquipmentSlot') as EquipmentSlotId;
    if (storedSlot && EQUIPMENT_SLOTS[storedSlot]) {
        sessionStorage.removeItem('selectedEquipmentSlot');
        switchSlot(storedSlot);
    } else {
        // No pending navigation, just refresh results
        handleCalculate();
    }
}

// Export for global access
(window as any).checkPendingSlotNavigation = checkPendingSlotNavigation;
