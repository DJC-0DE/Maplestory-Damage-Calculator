// Pure state extraction - no UI, no calculations
import { stageData } from '../data/stage-data.js';
// Handles reading DOM state into structured data

let currentContentType = 'none';
let selectedClass = null;

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

export function getStats(setup) {
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
    const stats = {
        name: document.getElementById(`${prefix}-name`)?.value || '',
        attack: parseFloat(document.getElementById(`${prefix}-attack`)?.value) || 0,
        mainStat: 0,
        defense: 0,
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
        for (let i = 1; i <= 10; i++) {
            const typeElem = document.getElementById(`equipped-stat-${i}-type`);
            const valueElem = document.getElementById(`equipped-stat-${i}-value`);

            if (typeElem && valueElem) {
                const statType = typeElem.value;
                const value = parseFloat(valueElem.value) || 0;

                switch (statType) {
                    case 'attack': stats.attack += value; break;
                    case 'main-stat': stats.mainStat += value; break;
                    case 'defense': stats.defense += value; break;
                    case 'crit-rate': stats.critRate += value; break;
                    case 'crit-damage': stats.critDamage += value; break;
                    case 'skill-level': stats.skillLevel += value; break;
                    case 'normal-damage': stats.normalDamage += value; break;
                    case 'boss-damage': stats.bossDamage += value; break;
                    case 'damage': stats.damage += value; break;
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

                switch (statType) {
                    case 'attack': stats.attack += value; break;
                    case 'main-stat': stats.mainStat += value; break;
                    case 'defense': stats.defense += value; break;
                    case 'crit-rate': stats.critRate += value; break;
                    case 'crit-damage': stats.critDamage += value; break;
                    case 'skill-level': stats.skillLevel += value; break;
                    case 'normal-damage': stats.normalDamage += value; break;
                    case 'boss-damage': stats.bossDamage += value; break;
                    case 'damage': stats.damage += value; break;
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
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'chapterBoss') {
        const entry = stageDefenses.chapterBosses.find(e => e.chapter === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'worldBoss') {
        const entry = stageDefenses.worldBosses.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'growthDungeon') {
        const entry = stageDefenses.growthDungeons.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    }

    return { defense: 0, damageReduction: 0 };
}
