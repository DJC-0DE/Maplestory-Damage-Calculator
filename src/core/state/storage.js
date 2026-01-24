import { calculate } from '@core/main.js';
import { renderTheoreticalBest, renderPresetComparison } from '@ts/page/inner-ability/inner-ability-ui.js';
import { renderArtifactPotential } from '@core/features/artifacts/artifact-potential.js';
import { clearCubeRankingsCache } from '@core/cube/cube-potential.js';
import { addEquippedStat } from '@ui/equipment-ui.js';
import { rarities, tiers, equippedStatCount } from '@core/constants.js';
import { getCompanionsState, setCompanionsState, getPresets, setPresetsState, getEquippedPresetId, setEquippedPresetId, getContributedStats, setContributedStats, getShowPresetDpsComparison, setShowPresetDpsComparison, getLockedMainCompanion, setLockedMainCompanion, updateAllContributions, updateCompanionEquippedContributions, getUnlockableStatsState, setUnlockableStatsState, getGuildBonusesState, setGuildBonusesState, getCubeSlotData, setCubeSlotData, setCharacterLevel } from './state.js';
import { refreshCompanionsUI } from '@ts/page/companions/companions-ui.js';

// Equipment slots that have comparison items
window.saveToLocalStorage = saveToLocalStorage;
window.updateAnalysisTabs = updateAnalysisTabs;
window.exportData = exportData;
window.importData = importData;

// Flag to prevent saving during load
let isLoading = false;

// Base setup fields that need to be saved/loaded/monitored
const BASE_SETUP_FIELDS = [
    'attack', 'crit-rate', 'crit-damage', 'stat-damage', 'damage',
    'damage-amp', 'attack-speed', 'def-pen', 'boss-damage',
    'normal-damage', 'skill-coeff', 'skill-mastery', 'skill-mastery-boss',
    'min-damage', 'max-damage', 'primary-main-stat', 'secondary-main-stat', 'final-damage',
    'target-stage', 'defense', 'main-stat-pct',
    'skill-level-1st', 'skill-level-2nd', 'skill-level-3rd', 'skill-level-4th',
    'str', 'dex', 'int', 'luk'
];
/*
// Save all data to localStorage
export function saveToLocalStorage() {
    // Don't save if we're currently loading data
    if (isLoading) {
        return;
    }

    const data = {
        baseSetup: {},
        equippedItem: {},
        weapons: {},
        contentType: null,
        subcategory: null,
        selectedStage: null
    };

    // Save Base Setup
    BASE_SETUP_FIELDS.forEach(field => {
        const element = document.getElementById(`${field}-base`);
        if (element) {
            data.baseSetup[field] = element.value;
        }
    });

    // Save Character Level (does not have -base suffix)
    const characterLevelElement = document.getElementById('character-level');
    if (characterLevelElement) {
        data.baseSetup['character-level'] = characterLevelElement.value;
    }

    // Save content type and subcategory
    const contentTypeElements = document.querySelectorAll('.content-type-selector.selected');
    if (contentTypeElements.length > 0) {
        const selectedId = contentTypeElements[0].id;
        data.contentType = selectedId.replace('content-', '');
    }

    const subcategorySelect = document.getElementById('target-subcategory');
    if (subcategorySelect && subcategorySelect.style.display !== 'none') {
        data.subcategory = subcategorySelect.value;
    }

    // Save the selected stage from the stage dropdown
    const stageSelect = document.getElementById('target-stage-base');
    if (stageSelect && stageSelect.style.display !== 'none' && stageSelect.value) {
        data.selectedStage = stageSelect.value;
    }

    // Save Equipped Item
    data.equippedItem.name = document.getElementById('equipped-name')?.value || '';
    data.equippedItem.attack = document.getElementById('equipped-attack')?.value || '0';
    data.equippedItem.stats = [];

    for (let i = 1; i <= 10; i++) {
        const typeElem = document.getElementById(`equipped-stat-${i}-type`);
        const valueElem = document.getElementById(`equipped-stat-${i}-value`);

        if (typeElem && valueElem) {
            data.equippedItem.stats.push({
                type: typeElem.value,
                value: valueElem.value
            });
        }
    }

    // Save Weapons
    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
            const equippedCheckbox = document.getElementById(`equipped-checkbox-${rarity}-${tier}`);

            if (levelInput) {
                const key = `${rarity}-${tier}`;
                const starsValue = starsInput ? starsInput.value : '5';
                data.weapons[key] = {
                    level: levelInput.value,
                    stars: starsValue,
                    equipped: equippedCheckbox ? equippedCheckbox.checked : false
                };
            }
        });
    });

    // Save Equipment Slots
    const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];
    data.equipmentSlots = {};

    slotNames.forEach(slotId => {
        const attackInput = document.getElementById(`slot-${slotId}-attack`);
        const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
        const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

        data.equipmentSlots[slotId] = {
            attack: attackInput ? parseFloat(attackInput.value) || 0 : 0,
            mainStat: mainStatInput ? parseFloat(mainStatInput.value) || 0 : 0,
            damageAmp: damageAmpInput ? parseFloat(damageAmpInput.value) || 0 : 0
        };
    });

    // Save Mastery Bonus Checkboxes for both 3rd and 4th job
    data.masteryBonuses = {
        '3rd': {
            all: {},
            boss: {}
        },
        '4th': {
            all: {},
            boss: {}
        }
    };

    // Save 3rd Job "All Monsters" checkboxes
    [64, 68, 76, 80, 88, 92].forEach(level => {
        const checkbox = document.getElementById(`mastery-3rd-all-${level}`);
        if (checkbox) {
            data.masteryBonuses['3rd'].all[level] = checkbox.checked;
        }
    });

    // Save 3rd Job "Boss Only" checkboxes
    [72, 84].forEach(level => {
        const checkbox = document.getElementById(`mastery-3rd-boss-${level}`);
        if (checkbox) {
            data.masteryBonuses['3rd'].boss[level] = checkbox.checked;
        }
    });

    // Save 4th Job "All Monsters" checkboxes
    [102, 106, 116, 120, 128, 132].forEach(level => {
        const checkbox = document.getElementById(`mastery-4th-all-${level}`);
        if (checkbox) {
            data.masteryBonuses['4th'].all[level] = checkbox.checked;
        }
    });

    // Save 4th Job "Boss Only" checkboxes
    [111, 124].forEach(level => {
        const checkbox = document.getElementById(`mastery-4th-boss-${level}`);
        if (checkbox) {
            data.masteryBonuses['4th'].boss[level] = checkbox.checked;
        }
    });

    // Save Companions
    data.companions = getCompanionsState();

    // Save Companions Presets
    data.companionsPresets = getPresets();

    // Save Equipped Preset ID and Contributed Stats
    data.equippedPresetId = getEquippedPresetId();
    data.contributedStats = getContributedStats();
    data.showPresetDpsComparison = getShowPresetDpsComparison();

    // Save Locked Main Companions for optimal presets
    data.lockedMainForOptimalBoss = getLockedMainCompanion('optimal-boss');
    data.lockedMainForOptimalNormal = getLockedMainCompanion('optimal-normal');

    // Save Special Stats
    data.unlockableStats = getUnlockableStatsState();

    // Save Guild Bonuses
    data.guildBonuses = getGuildBonusesState();

    localStorage.setItem('damageCalculatorData', JSON.stringify(data));

    // Save Cube Potential Data to separate localStorage key
    localStorage.setItem('cubePotentialData', JSON.stringify(getCubeSlotData()));
}

// Load data from localStorage
export function loadFromLocalStorage() {
    const savedData = localStorage.getItem('damageCalculatorData');
    if (!savedData) {
        return false;
    }

    // Set flag to prevent saving during load
    isLoading = true;

    try {
        const data = JSON.parse(savedData);

              // Load Cube Potential Data from separate localStorage key
        const cubePotentialData = localStorage.getItem('cubePotentialData');
        if (cubePotentialData) {
            try {
                const parsedCubeData = JSON.parse(cubePotentialData);
                setCubeSlotData(parsedCubeData);
            } catch (e) {
                console.error('Error loading cube potential data:', e);
            }
        }

        // Load Equipped Item
        if (data.equippedItem) {
            document.getElementById('equipped-name').value = data.equippedItem.name || '';
            document.getElementById('equipped-attack').value = data.equippedItem.attack || '0';

            if (data.equippedItem.stats && data.equippedItem.stats.length > 0) {
                data.equippedItem.stats.forEach(stat => {
                    addEquippedStat();
                    const typeElem = document.getElementById(`equipped-stat-${equippedStatCount}-type`);
                    const valueElem = document.getElementById(`equipped-stat-${equippedStatCount}-value`);

                    if (typeElem) typeElem.value = stat.type;
                    if (valueElem) valueElem.value = stat.value;
                });
            }
        }

        // Load Equipment Slots
        if (data.equipmentSlots) {
            const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];

            slotNames.forEach(slotId => {
                if (data.equipmentSlots[slotId]) {
                    const attackInput = document.getElementById(`slot-${slotId}-attack`);
                    const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
                    const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

                    if (attackInput) attackInput.value = data.equipmentSlots[slotId].attack || 0;
                    if (mainStatInput) mainStatInput.value = data.equipmentSlots[slotId].mainStat || 0;
                    if (damageAmpInput) damageAmpInput.value = data.equipmentSlots[slotId].damageAmp || 0;
                }
            });
        }

        // Load Equipped Preset ID
        if (data.equippedPresetId) {
            setEquippedPresetId(data.equippedPresetId);
        }

        // Load Contributed Stats
        if (data.contributedStats) {
            setContributedStats(data.contributedStats);
        }
        
        // Load Special Stats
        if (data.unlockableStats) {
            setUnlockableStatsState(data.unlockableStats);
        }

        // Load Guild Bonuses
        if (data.guildBonuses) {
            setGuildBonusesState(data.guildBonuses);
        }       

        // Note: We don't call updateAllContributions() here because cube potential and companions
        // modules haven't initialized yet. This will be called after all modules are ready.

        return true;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return false;
    } finally {
        // Always clear the flag when done loading
        isLoading = false;
    }
}
*/
// Update analysis tabs when base stats change
export function updateAnalysisTabs() {
    // Update Inner Ability Analysis
    renderPresetComparison();
    renderTheoreticalBest();

    // Update Artifact Potential
    renderArtifactPotential();

    // Clear Cube Potential rankings cache (stats changed, so rankings need recalculation)
    if (typeof clearCubeRankingsCache === 'function') {
        clearCubeRankingsCache();
    }

    // Recalculate all comparisons
    calculate();
}

/**
 * Called after all modules have initialized to recalculate contributions
 * This ensures ContributedStats is populated with data from localStorage
 */
export function finalizeContributedStatsAfterInit() {
    // Recalculate all auto-calculated contributions (cube, scrolling, inventory, etc.)
    updateAllContributions();

    // Update companion equipped contributions for the current preset
    const currentPresetId = getEquippedPresetId();
    if (currentPresetId && typeof window.getPresetEquipEffects === 'function') {
        const presetEffects = window.getPresetEquipEffects(currentPresetId);
        updateCompanionEquippedContributions(presetEffects);
    }
}

/**
 * Export comparison items from all equipment slots
 * @returns {Object} Object mapping slot IDs to their items arrays
 */
function exportComparisonItems() {
    const EQUIPMENT_SLOTS = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];
    const comparisonItems = {};

    EQUIPMENT_SLOTS.forEach(slotId => {
        const storageKey = `comparisonItems.${slotId}`;
        const data = localStorage.getItem(storageKey);

        if (data) {
            try {
                comparisonItems[slotId] = JSON.parse(data);
            } catch (e) {
                console.warn(`Failed to parse comparison items for ${slotId}:`, e);
                comparisonItems[slotId] = null;
            }
        } else {
            comparisonItems[slotId] = null;
        }
    });

    return comparisonItems;
}



/**
 * Import comparison items for all equipment slots
 * @param {Object} comparisonItems - Object mapping slot IDs to their items arrays
 */
function importComparisonItems(comparisonItems) {
    const EQUIPMENT_SLOTS = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];

    EQUIPMENT_SLOTS.forEach(slotId => {
        const storageKey = `comparisonItems.${slotId}`;

        // Clear existing comparison items for this slot
        localStorage.removeItem(storageKey);

        // Import new data if it exists
        if (comparisonItems && comparisonItems[slotId]) {
            try {
                const items = comparisonItems[slotId];

                // Validate it's an array
                if (!Array.isArray(items)) {
                    console.warn(`Invalid comparison items format for ${slotId}: expected array`);
                    return;
                }

                // Validate each item has required fields
                const validItems = items.filter(item => {
                    return item &&
                           typeof item === 'object' &&
                           item.guid &&
                           typeof item.version === 'number' &&
                           item.name !== undefined &&
                           typeof item.attack === 'number' &&
                           Array.isArray(item.stats);
                });

                if (validItems.length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(validItems));
                }
            } catch (e) {
                console.error(`Failed to import comparison items for ${slotId}:`, e);
            }
        }
    });
}


// Attach save listeners to base setup inputs
export function attachSaveListeners() {
    // Attach to base setup inputs
    BASE_SETUP_FIELDS.forEach(field => {
        const element = document.getElementById(`${field}-base`);
        if (element) {
            element.addEventListener('input', () => {
                saveToLocalStorage();
                updateAnalysisTabs();
            });
        }
    });

    // Attach to character level (does not have -base suffix)
    const characterLevelElement = document.getElementById('character-level');
    if (characterLevelElement) {
        characterLevelElement.addEventListener('input', () => {
            setCharacterLevel(characterLevelElement.value);
            saveToLocalStorage();
            updateAnalysisTabs();
        });
    }

    // Attach to equipped item name and attack
    const equippedName = document.getElementById('equipped-name');
    const equippedAttack = document.getElementById('equipped-attack');
    if (equippedName) equippedName.addEventListener('input', saveToLocalStorage);
    if (equippedAttack) equippedAttack.addEventListener('input', saveToLocalStorage);
}
