import { comparisonItemCount, equippedStatCount, setComparisonItemCount, setEquippedStatCount, rarities, tiers } from './constants.js';
import { addEquippedStat, addComparisonItem, addComparisonItemStat, handleWeaponLevelChange, handleEquippedCheckboxChange, updateEquippedWeaponIndicator } from './ui.js';

// Base setup fields that need to be saved/loaded/monitored
const BASE_SETUP_FIELDS = [
    'attack', 'crit-rate', 'crit-damage', 'stat-damage', 'damage',
    'damage-amp', 'attack-speed', 'def-pen', 'boss-damage',
    'normal-damage', 'skill-coeff', 'skill-mastery', 'skill-mastery-boss',
    'min-damage', 'max-damage', 'primary-main-stat', 'secondary-main-stat', 'final-damage',
    'target-stage', 'defense', 'main-stat-pct'
];

// Save all data to localStorage
export function saveToLocalStorage() {
    const data = {
        baseSetup: {},
        equippedItem: {},
        comparisonItems: [],
        comparisonItemCount: comparisonItemCount,
        weapons: {}
    };

    // Save Base Setup
    BASE_SETUP_FIELDS.forEach(field => {
        const element = document.getElementById(`${field}-base`);
        if (element) {
            data.baseSetup[field] = element.value;
        }
    });

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

    // Save Comparison Items
    for (let i = 1; i <= comparisonItemCount; i++) {
        const element = document.getElementById(`comparison-item-${i}`);
        if (element) {
            const item = {
                id: i,
                name: document.getElementById(`item-${i}-name`)?.value || '',
                attack: document.getElementById(`item-${i}-attack`)?.value || '0',
                stats: []
            };

            for (let j = 1; j <= 10; j++) {
                const typeElem = document.getElementById(`item-${i}-stat-${j}-type`);
                const valueElem = document.getElementById(`item-${i}-stat-${j}-value`);

                if (typeElem && valueElem) {
                    item.stats.push({
                        type: typeElem.value,
                        value: valueElem.value
                    });
                }
            }

            data.comparisonItems.push(item);
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
                data.weapons[key] = {
                    level: levelInput.value,
                    stars: starsInput ? starsInput.value : '5',
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

    localStorage.setItem('damageCalculatorData', JSON.stringify(data));
}

// Load data from localStorage
export function loadFromLocalStorage() {
    const savedData = localStorage.getItem('damageCalculatorData');
    if (!savedData) {
        return false;
    }

    try {
        const data = JSON.parse(savedData);

        // Load Base Setup
        if (data.baseSetup) {
            BASE_SETUP_FIELDS.forEach(field => {
                const element = document.getElementById(`${field}-base`);
                if (element && data.baseSetup[field] !== undefined) {
                    element.value = data.baseSetup[field];
                }
            });
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

        // Load Comparison Items
        if (data.comparisonItems && data.comparisonItems.length > 0) {
            data.comparisonItems.forEach(item => {
                addComparisonItem();
                document.getElementById(`item-${comparisonItemCount}-name`).value = item.name || '';
                document.getElementById(`item-${comparisonItemCount}-attack`).value = item.attack || '0';

                if (item.stats && item.stats.length > 0) {
                    item.stats.forEach(stat => {
                        addComparisonItemStat(comparisonItemCount);
                        const container = document.getElementById(`item-${comparisonItemCount}-stats-container`);
                        const statCount = container.children.length;

                        const typeElem = document.getElementById(`item-${comparisonItemCount}-stat-${statCount}-type`);
                        const valueElem = document.getElementById(`item-${comparisonItemCount}-stat-${statCount}-value`);

                        if (typeElem) typeElem.value = stat.type;
                        if (valueElem) valueElem.value = stat.value;
                    });
                }
            });
        }

        // Load Weapons
        if (data.weapons) {
            rarities.forEach(rarity => {
                tiers.forEach(tier => {
                    const key = `${rarity}-${tier}`;
                    const weaponData = data.weapons[key];

                    if (weaponData) {
                        const levelInput = document.getElementById(`level-${rarity}-${tier}`);
                        const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
                        const equippedCheckbox = document.getElementById(`equipped-checkbox-${rarity}-${tier}`);

                        // Set stars first
                        if (starsInput) {
                            const defaultStars = ['legendary', 'mystic', 'ancient'].includes(rarity) ? 1 : 5;
                            const stars = weaponData.stars !== undefined ? weaponData.stars : defaultStars;
                            starsInput.value = stars;

                            // Update star display (1-5 stars)
                            for (let i = 1; i <= 5; i++) {
                                const starElem = document.getElementById(`star-${rarity}-${tier}-${i}`);
                                if (starElem) {
                                    starElem.style.opacity = i <= stars ? '1' : '0.3';
                                }
                            }
                        }

                        // Then set level
                        if (levelInput) {
                            levelInput.value = weaponData.level || '0';
                            // Trigger the level change handler to update displays
                            handleWeaponLevelChange(rarity, tier);
                        }

                        // Restore equipped state
                        if (equippedCheckbox && weaponData.equipped) {
                            equippedCheckbox.checked = true;
                            handleEquippedCheckboxChange(rarity, tier);
                        }
                    }
                });
            });
        }

        // Update equipped weapon indicator after loading
        updateEquippedWeaponIndicator();

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

        return true;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return false;
    }
}

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

// Export all local storage data to clipboard
export function exportData() {
    const allData = {
        damageCalculatorData: localStorage.getItem('damageCalculatorData'),
        heroPowerPresets: localStorage.getItem('heroPowerPresets'),
        cubePotentialData: localStorage.getItem('cubePotentialData'),
        selectedClass: localStorage.getItem('selectedClass'),
        theme: localStorage.getItem('theme')
    };

    // Parse JSON strings so they're not double-stringified
    Object.keys(allData).forEach(key => {
        if (allData[key]) {
            try {
                allData[key] = JSON.parse(allData[key]);
            } catch (e) {
                // If it's not JSON (like theme which is just a string), keep as is
            }
        }
    });

    const jsonString = JSON.stringify(allData, null, 2);

    navigator.clipboard.writeText(jsonString).then(() => {
        alert('✅ Data copied to clipboard! You can now paste it on another device.');
    }).catch(err => {
        console.error('Failed to copy data:', err);
        alert('❌ Failed to copy data. Please check console for details.');
    });
}

// Import data from clipboard to local storage
export function importData() {
    navigator.clipboard.readText().then(text => {
        try {
            const data = JSON.parse(text);

            // Validate the data structure
            if (!data.damageCalculatorData && !data.heroPowerPresets && !data.cubePotentialData) {
                throw new Error('Invalid data format');
            }

            // Confirm before overwriting
            if (!confirm('⚠️ This will overwrite your current data. Are you sure you want to continue?')) {
                return;
            }

            // Import each piece of data (stringify if it's an object)
            if (data.damageCalculatorData) {
                const dataString = typeof data.damageCalculatorData === 'string'
                    ? data.damageCalculatorData
                    : JSON.stringify(data.damageCalculatorData);
                localStorage.setItem('damageCalculatorData', dataString);
            }
            if (data.heroPowerPresets) {
                const dataString = typeof data.heroPowerPresets === 'string'
                    ? data.heroPowerPresets
                    : JSON.stringify(data.heroPowerPresets);
                localStorage.setItem('heroPowerPresets', dataString);
            }
            if (data.cubePotentialData) {
                const dataString = typeof data.cubePotentialData === 'string'
                    ? data.cubePotentialData
                    : JSON.stringify(data.cubePotentialData);
                localStorage.setItem('cubePotentialData', dataString);
            }
            if (data.selectedClass) {
                localStorage.setItem('selectedClass', data.selectedClass);
            }
            if (data.theme) {
                localStorage.setItem('theme', data.theme);
            }

            alert('✅ Data imported successfully! Refreshing page...');
            location.reload();
        } catch (err) {
            console.error('Failed to import data:', err);
            alert('❌ Failed to import data. Please make sure you copied valid data.');
        }
    }).catch(err => {
        console.error('Failed to read clipboard:', err);
        alert('❌ Failed to read clipboard. Please make sure you have data copied.');
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

    // Attach to equipped item name and attack
    const equippedName = document.getElementById('equipped-name');
    const equippedAttack = document.getElementById('equipped-attack');
    if (equippedName) equippedName.addEventListener('input', saveToLocalStorage);
    if (equippedAttack) equippedAttack.addEventListener('input', saveToLocalStorage);
}
