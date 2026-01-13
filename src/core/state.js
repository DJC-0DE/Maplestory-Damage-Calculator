// Pure state extraction - no UI, no calculations
import { stageData } from '@data/stage-data.js';
import { calculateWeaponAttacks } from '@core/weapon-levels/weapon-calculations.js';
import { itemStatProperties, allItemStatProperties, rarities, tiers } from '@core/constants.js';
// Handles reading DOM state into structured data

let currentContentType = 'none';
let selectedClass = null;
let selectedJobTier = '3rd';

export function getCurrentContentType() {
    return currentContentType;
}

export function setCurrentContentType(type) {
    currentContentType = type;
}

export function getSelectedClass() {
    return selectedClass;
}

export function setSelectedClass(className) {
    selectedClass = className;
}

export function setSelectedJobTier(jobTier) {
    selectedJobTier = jobTier;
}

export function getSelectedJobTier() {
    return selectedJobTier;
}

export function getStats(setup) {
    return {
        attack: parseFloat(document.getElementById(`attack-${setup}`).value) || 0,
        critRate: parseFloat(document.getElementById(`crit-rate-${setup}`).value) || 0,
        critDamage: parseFloat(document.getElementById(`crit-damage-${setup}`).value) || 0,
        statDamage: parseFloat(document.getElementById(`stat-damage-${setup}`).value) || 0,
        damage: parseFloat(document.getElementById(`damage-${setup}`).value) || 0,
        finalDamage: parseFloat(document.getElementById(`final-damage-${setup}`).value) || 0,
        damageAmp: parseFloat(document.getElementById(`damage-amp-${setup}`).value) || 0,
        attackSpeed: parseFloat(document.getElementById(`attack-speed-${setup}`).value) || 0,
        defPen: parseFloat(document.getElementById(`def-pen-${setup}`).value) || 0,
        bossDamage: parseFloat(document.getElementById(`boss-damage-${setup}`).value) || 0,
        normalDamage: parseFloat(document.getElementById(`normal-damage-${setup}`).value) || 0,
        skillCoeff: parseFloat(document.getElementById(`skill-coeff-${setup}`).value) || 0,
        skillMastery: parseFloat(document.getElementById(`skill-mastery-${setup}`).value) || 0,
        skillMasteryBoss: parseFloat(document.getElementById(`skill-mastery-boss-${setup}`).value) || 0,
        minDamage: parseFloat(document.getElementById(`min-damage-${setup}`).value) || 0,
        maxDamage: parseFloat(document.getElementById(`max-damage-${setup}`).value) || 0
    };
}

// Stage defense data - organized by content type
export const stageDefenses = {
    none: {
        label: "None / Training Dummy",
        defense: 0,
        damageReduction: 0,
        accuracy: 0
    },
    // Auto-generated data from game files
    stageHunts: stageData.stageHunts,
    chapterBosses: stageData.chapterBosses,
    worldBosses: stageData.worldBosses,
    growthDungeons: stageData.growthDungeons
};

export function getItemStats(prefix) {
    // Initialize stats object with all properties set to 0
    const stats = {
        name: document.getElementById(`${prefix}-name`)?.value || '',
        attack: parseFloat(document.getElementById(`${prefix}-attack`)?.value) || 0
    };

    // Initialize all stat properties to 0
    allItemStatProperties.forEach(prop => {
        if (prop !== 'attack') { // attack already handled above
            stats[prop] = 0;
        }
    });

    // Get stats from dropdown selections
    if (prefix === 'equipped') {
        // Get equipped item stats
        for (let i = 1; i <= 10; i++) {
            const typeElem = document.getElementById(`equipped-stat-${i}-type`);
            const valueElem = document.getElementById(`equipped-stat-${i}-value`);

            if (typeElem && valueElem) {
                const statType = typeElem.value;
                const value = parseFloat(valueElem.value) || 0;
                const propName = itemStatProperties[statType];

                if (propName) {
                    stats[propName] += value;
                }
            }
        }
    } else {
        // Get comparison item stats
        const itemId = prefix.split('-')[1];
        for (let i = 1; i <= 10; i++) {
            const typeElem = document.getElementById(`item-${itemId}-stat-${i}-type`);
            const valueElem = document.getElementById(`item-${itemId}-stat-${i}-value`);

            if (typeElem && valueElem) {
                const statType = typeElem.value;
                const value = parseFloat(valueElem.value) || 0;
                const propName = itemStatProperties[statType];

                if (propName) {
                    stats[propName] += value;
                }
            }
        }
    }

    return stats;
}

export function getSelectedStageDefense() {
    // If none is selected, return early
    if (currentContentType === 'none') {
        return { defense: 0, damageReduction: 0 };
    }

    const select = document.getElementById('target-stage-base');
    if (!select) return { defense: 0, damageReduction: 0 };

    const value = select.value;

    if (value === 'none') {
        return { defense: 0, damageReduction: 0 };
    }

    const [category, ...rest] = value.split('-');
    const identifier = rest.join('-'); // Handle identifiers with dashes like "1000-1"

    if (category === 'stageHunt') {
        const entry = stageDefenses.stageHunts.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense * 100, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'chapterBoss') {
        const entry = stageDefenses.chapterBosses.find(e => e.chapter === identifier);
        return entry ? { defense: entry.defense * 100, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'worldBoss') {
        const entry = stageDefenses.worldBosses.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense * 10, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'growthDungeon') {
        const entry = stageDefenses.growthDungeons.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense * 100, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    }

    return { defense: 0, damageReduction: 0 };
}

// Companions state
let companionsState = {};

/**
 * Get all companions state
 */
export function getCompanionsState() {
    return companionsState;
}

/**
 * Set companions state (used for loading saved data)
 */
export function setCompanionsState(state) {
    companionsState = state || {};
}

/**
 * Update a specific companion
 */
export function updateCompanion(companionKey, data) {
    companionsState[companionKey] = data;
}

/**
 * Get a specific companion's data
 */
export function getCompanion(companionKey) {
    return companionsState[companionKey] || { unlocked: false, level: 1, equipped: false };
}
export function getWeaponAttackBonus() {
    let totalInventory = 0;
    let equippedBonus = 0;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
            if (!levelInput) return;

            const level = parseInt(levelInput.value) || 0;
            if (level === 0) return;

            const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(rarity, tier, level);
            totalInventory += inventoryAttack;

            if (equippedDisplay && equippedDisplay.style.display !== 'none') {
                equippedBonus = equippedAttack;
            }
        });
    });

    return totalInventory + equippedBonus;
}
