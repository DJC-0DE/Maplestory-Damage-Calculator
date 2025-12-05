// Data extraction functions
function getStats(setup) {
    return {
        attack: parseFloat(document.getElementById(`attack-${setup}`).value),
        critRate: parseFloat(document.getElementById(`crit-rate-${setup}`).value),
        critDamage: parseFloat(document.getElementById(`crit-damage-${setup}`).value),
        statDamage: parseFloat(document.getElementById(`stat-damage-${setup}`).value),
        damage: parseFloat(document.getElementById(`damage-${setup}`).value),
        damageAmp: parseFloat(document.getElementById(`damage-amp-${setup}`).value),
        attackSpeed: parseFloat(document.getElementById(`attack-speed-${setup}`).value),
        defPen: parseFloat(document.getElementById(`def-pen-${setup}`).value),
        bossDamage: parseFloat(document.getElementById(`boss-damage-${setup}`).value),
        normalDamage: parseFloat(document.getElementById(`normal-damage-${setup}`).value),
        skillCoeff: parseFloat(document.getElementById(`skill-coeff-${setup}`).value),
        skillMastery: parseFloat(document.getElementById(`skill-mastery-${setup}`).value),
        skillMasteryBoss: parseFloat(document.getElementById(`skill-mastery-boss-${setup}`).value),
        minDamage: parseFloat(document.getElementById(`min-damage-${setup}`).value),
        maxDamage: parseFloat(document.getElementById(`max-damage-${setup}`).value)
    };
}

function getItemStats(prefix) {
    const stats = {
        name: document.getElementById(`${prefix}-name`)?.value || '',
        attack: parseFloat(document.getElementById(`${prefix}-attack`)?.value) || 0,
        critRate: 0,
        critDamage: 0,
        skillLevel: 0,
        normalDamage: 0,
        bossDamage: 0,
        damage: 0
    };

    // Get stats from dropdown selections
    if (prefix === 'equipped') {
        // Get equipped item stats
        for (let i = 1; i <= 10; i++) {  // Check up to 10 (more than max)
            const typeElem = document.getElementById(`equipped-stat-${i}-type`);
            const valueElem = document.getElementById(`equipped-stat-${i}-value`);

            if (typeElem && valueElem) {
                const statType = typeElem.value;
                const value = parseFloat(valueElem.value) || 0;

                switch (statType) {
                    case 'attack':
                        stats.attack += value;
                        break;
                    case 'crit-rate':
                        stats.critRate += value;
                        break;
                    case 'crit-damage':
                        stats.critDamage += value;
                        break;
                    case 'skill-level':
                        stats.skillLevel += value;
                        break;
                    case 'normal-damage':
                        stats.normalDamage += value;
                        break;
                    case 'boss-damage':
                        stats.bossDamage += value;
                        break;
                    case 'damage':
                        stats.damage += value;
                        break;
                }
            }
        }
    } else {
        // Get comparison item stats (prefix is like "item-1")
        const itemId = prefix.split('-')[1];
        for (let i = 1; i <= 10; i++) {
            const typeElem = document.getElementById(`item-${itemId}-stat-${i}-type`);
            const valueElem = document.getElementById(`item-${itemId}-stat-${i}-value`);

            if (typeElem && valueElem) {
                const statType = typeElem.value;
                const value = parseFloat(valueElem.value) || 0;

                switch (statType) {
                    case 'attack':
                        stats.attack += value;
                        break;
                    case 'crit-rate':
                        stats.critRate += value;
                        break;
                    case 'crit-damage':
                        stats.critDamage += value;
                        break;
                    case 'skill-level':
                        stats.skillLevel += value;
                        break;
                    case 'normal-damage':
                        stats.normalDamage += value;
                        break;
                    case 'boss-damage':
                        stats.bossDamage += value;
                        break;
                    case 'damage':
                        stats.damage += value;
                        break;
                }
            }
        }
    }

    return stats;
}

function getWeaponAttackBonus() {
    let totalInventory = 0;
    let equippedBonus = 0;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const equippedCheckbox = document.getElementById(`equipped-${rarity}-${tier}`);
            const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

            if (levelInput) {
                const level = parseFloat(levelInput.value) || 0;
                totalInventory += calculateInventoryBonus(rarity, tier, level);

                if (equippedCheckbox && equippedCheckbox.checked && equippedInput) {
                    equippedBonus = parseFloat(equippedInput.value) || 0;
                }
            }
        });
    });

    return totalInventory + equippedBonus;
}

// Main calculation orchestration
function calculate() {
    const baseStats = getStats('base');
    const equippedItem = getItemStats('equipped');

    let resultsHTML = '';

    // Calculate equipped item's reference values for comparison
    const equippedBossResults = calculateDamage(baseStats, 'boss');
    const equippedNormalResults = calculateDamage(baseStats, 'normal');
    const equippedDamageValues = {
        expectedDamageBoss: equippedBossResults.expectedDamage,
        dpsBoss: equippedBossResults.dps,
        expectedDamageNormal: equippedNormalResults.expectedDamage,
        dpsNormal: equippedNormalResults.dps
    };

    // Display equipped item results
    resultsHTML += displayResults(equippedItem.name || 'Currently Equipped', baseStats, 'equipped', true, null);

    // Get all comparison items
    const comparisonItems = [];
    for (let i = 1; i <= comparisonItemCount; i++) {
        const element = document.getElementById(`comparison-item-${i}`);
        if (element) {
            const item = getItemStats(`item-${i}`);
            item.id = i;
            comparisonItems.push(item);
        }
    }

    // Display each comparison item
    comparisonItems.forEach(item => {
        const itemStats = applyItemToStats(baseStats, equippedItem, item);
        resultsHTML += displayResults(item.name || `Item ${item.id}`, itemStats, `item-${item.id}`, false, equippedDamageValues);
    });

    document.getElementById('results-container').innerHTML = resultsHTML || '<p style="text-align: center; color: #b3d9ff;">Add comparison items to see results</p>';

    // Calculate stat weights for base setup
    calculateStatWeights('base', baseStats);
}

// Initialize application
window.onload = function () {
    // Load theme first
    loadTheme();
    // Initialize hero power presets
    initializeHeroPowerPresets();
    initializeWeapons();
    // Load saved data from localStorage
    const loaded = loadFromLocalStorage();
    // Load hero power presets from localStorage
    loadHeroPowerPresets();
    // Initialize Inner Ability Analysis
    initializeInnerAbilityAnalysis();
    // Attach save listeners to all inputs
    attachSaveListeners();
    // Update weapon bonuses if data was loaded
    if (loaded) {
        updateWeaponBonuses();
    } else {
        calculate();
    }
};
