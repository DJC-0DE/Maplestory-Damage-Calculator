// Data extraction functions
function getStats(setup) {
    return {
        attack: parseFloat(document.getElementById(`attack-${setup}`).value),
        critRate: parseFloat(document.getElementById(`crit-rate-${setup}`).value),
        critDamage: parseFloat(document.getElementById(`crit-damage-${setup}`).value),
        statDamage: parseFloat(document.getElementById(`stat-damage-${setup}`).value),
        damage: parseFloat(document.getElementById(`damage-${setup}`).value),
        finalDamage: parseFloat(document.getElementById(`final-damage-${setup}`).value), 
        damageAmp: parseFloat(document.getElementById(`damage-amp-${setup}`).value),
        attackSpeed: parseFloat(document.getElementById(`attack-speed-${setup}`).value),
        defPen: parseFloat(document.getElementById(`def-pen-${setup}`).value),
        stageKey: document.getElementById(`stage-select-${setup}`).value,
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
            const inventoryInput = document.getElementById(`inventory-${rarity}-${tier}`);
            const equippedCheckbox = document.getElementById(`equipped-${rarity}-${tier}`);
            const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

            if (inventoryInput) {
                const inventoryBonus = parseFloat(inventoryInput.value) || 0;
                totalInventory += inventoryBonus;

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

// Populate stage select dropdown
function populateStageSelect() {
    const stageSelect = document.getElementById('stage-select-base');
    if (!stageSelect) return;
    
    // Clear existing options except the first one
    while (stageSelect.options.length > 1) {
        stageSelect.remove(1);
    }
    
    // Define stages with their keys and labels
    const stages = [
       
    ];
    
    // Generate stages for chapters 2-10
    for (let chapter = 1; chapter <= 28; chapter++) {
        const maxStage = chapter === 1 ? 4 : 10;
        for (let stage = 1; stage <= maxStage; stage++) {
            const key = `${chapter}-${stage}`;
            const isBoss = stage === maxStage;
            const label = isBoss ? `Chapter ${chapter} - Boss` : `Chapter ${chapter} - Stage ${stage}`;
            
            let defense;
            if (isBoss) {
                // Use boss defense table
                const bossDefenses = {
                    '2-8': 16.6472, '3-10': 16.6472, '4-10': 22.0428,
                    '5-10': 22.5563, '6-10': 23.0794, '7-10': 23.6124,
                    '8-10': 21.3986, '9-10': 24.6658, '10-10': 25.2096
                };
                defense = bossDefenses[key] ?? 0;
            } else {
                // Calculate normal defense
                const cappedChapter = Math.min(Math.max(chapter, 2), 28);
                const cappedStage = Math.min(Math.max(stage, 1), 10);
                defense = 0.3166094 + 3 * (cappedChapter - 2) + (cappedStage - 1) / 3;
            }
            
            stages.push({ key, label, defense, isBoss });
        }
    }
    
    // Add options to select
    stages.forEach(stage => {
        const option = document.createElement('option');
        option.value = stage.key;
        option.textContent = `${stage.label} (Def: ${stage.defense.toFixed(2)})`;
        stageSelect.appendChild(option);
    });
}

// Initialize application
window.onload = function () {
    // Load theme first
    loadTheme();
    // Initialize hero power presets
    initializeHeroPowerPresets();
    initializeWeapons();
    // Populate stage select dropdown
    populateStageSelect();
    // Enable auto-select for all numeric inputs across the app
    enableGlobalNumberInputAutoSelect();
    // Load saved data from localStorage
    const loaded = loadFromLocalStorage();
    // Load hero power presets from localStorage
    loadHeroPowerPresets();
    // Initialize Inner Ability Analysis
    initializeInnerAbilityAnalysis();
    // Initialize Artifact Potential
    initializeArtifactPotential();
    // Attach save listeners to all inputs
    attachSaveListeners();
    // Update weapon bonuses if data was loaded
    if (loaded) {
        updateWeaponBonuses();
    } else {
        calculate();
    }
};

function enableGlobalNumberInputAutoSelect() {
    document.addEventListener('focusin', (e) => {
        const t = e.target;
        if (t && t.tagName === 'INPUT' && t.type === 'number') {
            t.select();
        }
    });
}
