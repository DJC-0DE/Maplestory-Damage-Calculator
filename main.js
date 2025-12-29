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
    // Calculate total attack % bonus from all weapon levels (inventory + equipped)
    let totalInventory = 0;
    let equippedBonus = 0;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
            if (!levelInput) return;

            const level = parseInt(levelInput.value) || 0;
            if (level === 0) return;

            // Get inventory and equipped attack % for this weapon
            const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(rarity, tier, level);
            totalInventory += inventoryAttack;

            // Check if this weapon is equipped based on display visibility
            if (equippedDisplay && equippedDisplay.style.display !== 'none') {
                equippedBonus = equippedAttack;
            }
        });
    });

    // Return total weapon attack % (inventory + equipped)
    return totalInventory + equippedBonus;
}

// Stage defense functions
function populateStageDropdown() {
    const select = document.getElementById('target-stage-base');
    if (!select) return;

    // Clear existing options
    select.innerHTML = '';

    // Default option
    const noneOpt = document.createElement('option');
    noneOpt.value = 'none';
    noneOpt.textContent = 'None / Training Dummy (Def: 0%, DR: 0%)';
    select.appendChild(noneOpt);

    // Stage Hunts group
    const stageHuntsGroup = document.createElement('optgroup');
    stageHuntsGroup.label = 'Stage Hunts';
    stageDefenses.stageHunts.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `stageHunt-${entry.stage}`;
        opt.textContent = `${entry.stage} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        stageHuntsGroup.appendChild(opt);
    });
    select.appendChild(stageHuntsGroup);

    // Chapter Bosses group
    const chapterGroup = document.createElement('optgroup');
    chapterGroup.label = 'Chapter Bosses';
    stageDefenses.chapterBosses.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `chapterBoss-${entry.chapter}`;
        opt.textContent = `Chapter ${entry.chapter} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        chapterGroup.appendChild(opt);
    });
    select.appendChild(chapterGroup);

    // World Bosses group
    const worldBossGroup = document.createElement('optgroup');
    worldBossGroup.label = 'World Bosses';
    stageDefenses.worldBosses.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `worldBoss-${entry.stage}`;
        opt.textContent = `Stage ${entry.stage} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        worldBossGroup.appendChild(opt);
    });
    select.appendChild(worldBossGroup);

    // Boss Raids group
    const bossRaidGroup = document.createElement('optgroup');
    bossRaidGroup.label = 'Boss Raids';
    stageDefenses.bossRaids.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `bossRaid-${entry.boss}`;
        opt.textContent = `${entry.boss} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        bossRaidGroup.appendChild(opt);
    });
    select.appendChild(bossRaidGroup);
}

function getSelectedStageDefense() {
    const select = document.getElementById('target-stage-base');
    if (!select) return { defense: 0, damageReduction: 0 };

    const value = select.value;

    if (value === 'none') {
        return { defense: 0, damageReduction: 0 };
    }

    const [category, identifier] = value.split('-');

    if (category === 'stageHunt') {
        // identifier will be like "1" and we need to reconstruct "1-1"
        const stage = value.replace('stageHunt-', '');
        const entry = stageDefenses.stageHunts.find(e => e.stage === stage);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    } else if (category === 'chapterBoss') {
        const entry = stageDefenses.chapterBosses.find(e => e.chapter === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    } else if (category === 'worldBoss') {
        const entry = stageDefenses.worldBosses.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    } else if (category === 'bossRaid') {
        const entry = stageDefenses.bossRaids.find(e => e.boss === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    }

    return { defense: 0, damageReduction: 0 };
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
    // Populate stage dropdown
    populateStageDropdown();
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
    // Initialize Equipment Slots
    initializeEquipmentSlots();
    // Load equipment slots after initialization
    loadEquipmentSlots();
    // Initialize Artifacts
    initializeArtifacts();
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

// Class Selection
let selectedClass = null;

function selectClass(className) {
    // Remove selected state from all class selectors
    document.querySelectorAll('.class-selector').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selected state to clicked class
    const classElement = document.getElementById(`class-${className}`);
    if (classElement) {
        classElement.classList.add('selected');
        selectedClass = className;

        // Show/hide defense input for Dark Knight
        const defenseInputGroup = document.getElementById('defense-input-group');
        if (defenseInputGroup) {
            if (className === 'dark-knight') {
                defenseInputGroup.style.display = 'flex';
            } else {
                defenseInputGroup.style.display = 'none';
            }
        }

        // Save to localStorage
        try {
            localStorage.setItem('selectedClass', className);
        } catch (error) {
            console.error('Error saving selected class:', error);
        }
    }
}

function loadSelectedClass() {
    try {
        const savedClass = localStorage.getItem('selectedClass');
        if (savedClass) {
            selectClass(savedClass);
        }
    } catch (error) {
        console.error('Error loading selected class:', error);
    }
}

// Load selected class on initialization
document.addEventListener('DOMContentLoaded', () => {
    loadSelectedClass();
});
