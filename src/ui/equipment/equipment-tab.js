// Equipment Tab - Main equipment configuration UI
import { createEquipmentSlot } from './equipment-slot.js';
import { updateEquipmentSummary } from './equipment-summary.js';
import { saveToLocalStorage } from '@core/state/storage.js';
import {
    updateEquipmentContributions,
    updateAllContributions
} from '@core/state/state.js';
import { navigateTo } from '@core/router.js';
import { availableStats } from '@core/constants.js';

// Equipment slot definitions
const EQUIPMENT_SLOTS = [
    { id: 'head', name: 'Head', hasMainStat: false },
    { id: 'cape', name: 'Cape', hasMainStat: false },
    { id: 'chest', name: 'Chest', hasMainStat: false },
    { id: 'shoulders', name: 'Shoulders', hasMainStat: false },
    { id: 'legs', name: 'Legs', hasMainStat: false },
    { id: 'belt', name: 'Belt', hasMainStat: false },
    { id: 'gloves', name: 'Gloves', hasMainStat: false },
    { id: 'boots', name: 'Boots', hasMainStat: false },
    { id: 'ring', name: 'Ring', hasMainStat: true },
    { id: 'neck', name: 'Neck', hasMainStat: true },
    { id: 'eye-accessory', name: 'Eye Accessory', hasMainStat: true }
];

let equipmentData = {};

/**
 * Initialize the equipment tab
 */
export function initializeEquipmentTab() {
    const container = document.getElementById('equipment-slots-container');
    if (!container) return;

    // Create slot cards
    EQUIPMENT_SLOTS.forEach(slot => {
        const slotCard = createEquipmentSlot(slot);
        container.appendChild(slotCard);
    });

    // Load saved equipment data
    loadEquipmentData();

    // Attach event listeners for stat contribution updates
    attachStatListeners();

    // Initial stat contribution calculation
    notifyStatContributors();

    // Initial summary update
    updateEquipmentSummary();
}

/**
 * Attach listeners for stat changes
 */
function attachStatListeners() {
    EQUIPMENT_SLOTS.forEach(slot => {
        const slotElement = document.getElementById(`equipment-slot-${slot.id}`);
        if (!slotElement) return;

        // Listen for input changes
        const inputs = slotElement.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => {
                saveSlotData(slot.id);
                notifyStatContributors();
            }, 300));
        });
    });
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Save data for a specific slot
 */
function saveSlotData(slotId) {
    const slot = EQUIPMENT_SLOTS.find(s => s.id === slotId);
    if (!slot) return;

    const slotElement = document.getElementById(`equipment-slot-${slotId}`);
    if (!slotElement) return;

    // Get attack value
    const attackInput = document.getElementById(`equipment-${slotId}-attack`);
    const attack = attackInput ? parseFloat(attackInput.value) || 0 : 0;

    // Get main stat (if applicable)
    let mainStat = 0;
    if (slot.hasMainStat) {
        const mainStatInput = document.getElementById(`equipment-${slotId}-main-stat`);
        mainStat = mainStatInput ? parseFloat(mainStatInput.value) || 0 : 0;
    }

    // Get stat lines
    const statLines = [];
    const statsContainer = document.getElementById(`equipment-${slotId}-stats-container`);
    if (statsContainer) {
        // Use more specific selector to match only stat divs, not nested inputs
        const statElements = statsContainer.querySelectorAll(`[id^="equipment-${slotId}-stat-"]:not([id*="-type"]):not([id*="-value"])`);
        statElements.forEach(statElement => {
            const typeInput = statElement.querySelector('[id$="-type"]');
            const valueInput = statElement.querySelector('[id$="-value"]');
            if (typeInput && valueInput && typeInput.value && valueInput.value) {
                statLines.push({
                    type: typeInput.value,
                    value: parseFloat(valueInput.value) || 0
                });
            }
        });
    }

    // Store the data
    equipmentData[slotId] = {
        name: document.getElementById(`equipment-${slotId}-name`)?.value || '',
        attack,
        mainStat,
        statLines
    };

    // Save to localStorage
    localStorage.setItem(`equipped.${slotId}`, JSON.stringify(equipmentData[slotId]));
}

/**
 * Load equipment data from localStorage
 */
function loadEquipmentData() {
    EQUIPMENT_SLOTS.forEach(slot => {
        const saved = localStorage.getItem(`equipped.${slot.id}`);
        const slotElement = document.getElementById(`equipment-slot-${slot.id}`);

        if (saved) {
            try {
                equipmentData[slot.id] = JSON.parse(saved);
                populateSlotWithData(slot.id, equipmentData[slot.id]);
                // Clear the init flag since we loaded saved data
                if (slotElement) slotElement.dataset.needsInit = 'false';
            } catch (e) {
                console.error(`Failed to load equipment data for ${slot.id}:`, e);
            }
        } else if (slotElement && slotElement.dataset.needsInit === 'true') {
            // No saved data and slot needs initialization - add default stat lines
            const statsContainer = document.getElementById(`equipment-${slot.id}-stats-container`);
            if (statsContainer && statsContainer.children.length === 0) {
                for (let i = 0; i < 3; i++) {
                    addStatLineToSlot(slot.id);
                }
            }
            slotElement.dataset.needsInit = 'false';
        }
    });
}

/**
 * Populate a slot with saved data
 */
function populateSlotWithData(slotId, data) {
    if (!data) return;

    // Set name
    const nameInput = document.getElementById(`equipment-${slotId}-name`);
    if (nameInput) nameInput.value = data.name || '';

    // Set attack
    const attackInput = document.getElementById(`equipment-${slotId}-attack`);
    if (attackInput) attackInput.value = data.attack || 0;

    // Set main stat
    const mainStatInput = document.getElementById(`equipment-${slotId}-main-stat`);
    if (mainStatInput) mainStatInput.value = data.mainStat || 0;

    // Clear existing stat lines
    const statsContainer = document.getElementById(`equipment-${slotId}-stats-container`);
    if (statsContainer) {
        statsContainer.innerHTML = '';

        // Add saved stat lines (only what was saved, no auto-filling)
        if (data.statLines && Array.isArray(data.statLines)) {
            data.statLines.forEach(statLine => {
                addStatLineToSlot(slotId);
                const statCount = statsContainer.children.length;
                const typeInput = document.getElementById(`equipment-${slotId}-stat-${statCount}-type`);
                const valueInput = document.getElementById(`equipment-${slotId}-stat-${statCount}-value`);
                if (typeInput) typeInput.value = statLine.type;
                if (valueInput) valueInput.value = statLine.value;
            });
        }
    }
}

/**
 * Add a stat line to a slot
 */
function addStatLineToSlot(slotId) {
    const statsContainer = document.getElementById(`equipment-${slotId}-stats-container`);
    if (!statsContainer) return;

    const currentCount = statsContainer.children.length;
    const statId = currentCount + 1;

    const statDiv = document.createElement('div');
    statDiv.id = `equipment-${slotId}-stat-${statId}`;
    statDiv.className = 'equipment-stat-line';

    // Build options from available stats
    let optionsHTML = '';
    availableStats.forEach(stat => {
        optionsHTML += `<option value="${stat.value}">${stat.label}</option>`;
    });

    statDiv.innerHTML = `
        <div class="equipment-input-group equipment-stat-type-select">
            <select id="equipment-${slotId}-stat-${statId}-type" onchange="saveSlotData('${slotId}'); notifyStatContributors();" class="equipment-input-field equipment-select-field">
                ${optionsHTML}
            </select>
        </div>
        <div class="equipment-input-group">
            <input type="number" step="0.1" id="equipment-${slotId}-stat-${statId}-value" value="0" onchange="saveSlotData('${slotId}'); notifyStatContributors();" class="equipment-input-field equipment-stat-value-input">
        </div>
        <button onclick="removeStatLineFromSlot('${slotId}', ${statId})" class="equipment-btn-delete equipment-stat-delete-btn" title="Remove stat line">✕</button>
    `;

    statsContainer.appendChild(statDiv);
}

/**
 * Remove a stat line from a slot
 */
function removeStatLineFromSlot(slotId, statId) {
    const statElement = document.getElementById(`equipment-${slotId}-stat-${statId}`);
    if (statElement) {
        statElement.remove();
        saveSlotData(slotId);
        notifyStatContributors();
    }
}

/**
 * Clear all data for a slot
 */
function clearSlotData(slotId) {
    equipmentData[slotId] = {
        name: '',
        attack: 0,
        mainStat: 0,
        statLines: []
    };
    populateSlotWithData(slotId, equipmentData[slotId]);
    localStorage.setItem(`equipped.${slotId}`, JSON.stringify(equipmentData[slotId]));
    notifyStatContributors();
    updateEquipmentSummary();
}

/**
 * Get stats for a specific slot
 */
export function getSlotStats(slotId) {
    if (!equipmentData[slotId]) {
        return {
            name: '',
            attack: 0,
            mainStat: 0,
            statLines: []
        };
    }

    return equipmentData[slotId];
}

/**
 * Get all equipment data
 */
export function getAllEquipmentData() {
    return equipmentData;
}

/**
 * Set equipment data for a slot (for syncing from Item Comparison)
 */
export function setSlotData(slotId, data) {
    equipmentData[slotId] = data;
    populateSlotWithData(slotId, data);
    localStorage.setItem(`equipped.${slotId}`, JSON.stringify(data));
    notifyStatContributors();
    updateEquipmentSummary();
}

/**
 * Notify that stats have changed
 * This updates ContributedStats and notifies all listeners
 */
function notifyStatContributors() {
    // Calculate equipment contributions
    const equipmentStats = calculateAllContributions();

    // Update equipment contributions in ContributedStats (this also updates all auto-calculated sources)
    updateEquipmentContributions(equipmentStats);

    // Update all other contributions that can be calculated automatically
    updateAllContributions();

    // Update the equipment summary display
    updateEquipmentSummary();
}

/**
 * Calculate all stat contributions from equipment
 */
function calculateAllContributions() {
    const contributions = {};

    EQUIPMENT_SLOTS.forEach(slot => {
        const slotData = equipmentData[slot.id];
        if (!slotData) return;

        const slotStats = {
            attack: slotData.attack || 0
        };

        // Add main stat if applicable
        if (slot.hasMainStat && slotData.mainStat) {
            slotStats.mainStat = slotData.mainStat;
        }

        // Add stat lines
        if (slotData.statLines) {
            slotData.statLines.forEach(statLine => {
                const statKey = getStatKey(statLine.type);
                if (statKey) {
                    slotStats[statKey] = (slotStats[statKey] || 0) + statLine.value;
                }
            });
        }

        contributions[slot.id] = slotStats;
    });

    return contributions;
}

/**
 * Convert stat type string to property key
 */
function getStatKey(statType) {
    const statMap = {
        'attack': 'attack',
        'main-stat': 'mainStat',
        'defense': 'defense',
        'crit-rate': 'critRate',
        'crit-damage': 'critDamage',
        'skill-level-1st': 'skillLevel1st',
        'skill-level-2nd': 'skillLevel2nd',
        'skill-level-3rd': 'skillLevel3rd',
        'skill-level-4th': 'skillLevel4th',
        'skill-level-all': 'skillLevelAll',
        'normal-damage': 'normalDamage',
        'boss-damage': 'bossDamage',
        'damage': 'damage',
        'final-damage': 'finalDamage',
        'min-damage': 'minDamage',
        'max-damage': 'maxDamage'
    };
    return statMap[statType];
}

/**
 * Navigate to Item Comparison with a specific slot selected
 */
function navigateToComparison(slotId) {
    // Set the selected slot in sessionStorage for Item Comparison to pick up
    sessionStorage.setItem('selectedEquipmentSlot', slotId);

    // Navigate to Gear Lab page using the router
    navigateTo('optimization');

    // Switch to Item Comparison tab after navigation
    // Use requestAnimationFrame to wait for DOM to be ready
    const switchTab = () => {
        // Find and click the Item Comparison tab button
        const tabButtons = document.querySelectorAll('[onclick*="item-comparison"]');
        let found = false;
        tabButtons.forEach(btn => {
            if (btn.getAttribute('onclick').includes("'item-comparison'")) {
                btn.click();
                found = true;
            }
        });
        // If not found, try again on next animation frame
        if (!found) {
            requestAnimationFrame(switchTab);
        }
    };
    requestAnimationFrame(switchTab);
}

/**
 * Migrate legacy comparison data to main storage
 */
export function migrateLegacyData() {
    // Check if we've already migrated
    if (localStorage.getItem('equipmentDataMigrated')) {
        return;
    }

    // Migrate comparison items to main storage
    const legacyComparison = localStorage.getItem('comparison-items');
    if (legacyComparison) {
        try {
            const items = JSON.parse(legacyComparison);
            // Load existing main storage
            const mainData = localStorage.getItem('damageCalculatorData');
            const data = mainData ? JSON.parse(mainData) : { comparisonItems: {} };

            // Migrate to head slot in main storage
            if (!data.comparisonItems) {
                data.comparisonItems = {};
            }
            data.comparisonItems['head'] = items;

            // Save back to main storage
            localStorage.setItem('damageCalculatorData', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to migrate comparison items:', e);
        }
    }

    // Migrate equipped item to Head slot
    const legacyEquipped = localStorage.getItem('equipped-item');
    if (legacyEquipped) {
        try {
            const item = JSON.parse(legacyEquipped);
            localStorage.setItem('equipped.head', JSON.stringify(item));
        } catch (e) {
            console.error('Failed to migrate equipped item:', e);
        }
    }

    // Mark migration as complete
    localStorage.setItem('equipmentDataMigrated', 'true');
}

// Export functions for global access
window.saveSlotData = saveSlotData;
window.addStatLineToSlot = addStatLineToSlot;
window.removeStatLineFromSlot = removeStatLineFromSlot;
window.clearSlotData = clearSlotData;
window.navigateToComparison = navigateToComparison;
window.loadEquipmentData = loadEquipmentData;
window.notifyStatContributors = notifyStatContributors;
