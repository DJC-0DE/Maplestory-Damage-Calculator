// Test helpers - loads calculation functions for testing
// Uses ACTUAL formulas from calculations.js

// Load ACTUAL constants from constants.js
const weaponBaseAttackEquipped = {
    'normal': { 't1': 25, 't2': 21, 't3': 18, 't4': 15 },
    'rare': { 't1': 61.1, 't2': 48.9, 't3': 39.1, 't4': 31.3 },
    'epic': { 't1': 149.3, 't2': 119.4, 't3': 95.5, 't4': 76.4 },
    'unique': { 't1': 426.4, 't2': 328, 't3': 252.3, 't4': 194.1 },
    'legendary': { 't1': 1217.8, 't2': 936.8, 't3': 720.6, 't4': 554.3 },
    'mystic': { 't1': 3810.6, 't2': 2865.1, 't3': 2154.2, 't4': 1619.7 },
    'ancient': { 't1': 2186.6, 't2': 2908.2, 't3': 3867.9, 't4': 5144.3 }
};

const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic', 'ancient'];
const tiers = ['t4', 't3', 't2', 't1'];

// ACTUAL weapon calculation functions from calculations.js
function getWeaponLevelMultiplier(level) {
    if (!level || level <= 1) return 1.0;
    if (level <= 100) return 1 + (0.3 * (level - 1)) / 100;
    if (level <= 130) return 1 + (30.3 + 0.7 * (level - 101)) / 100;
    if (level <= 155) return 1 + (51.4 + 0.8 * (level - 131)) / 100;
    if (level <= 175) return 1 + (71.5 + 0.9 * (level - 156)) / 100;
    if (level <= 200) return 1 + (89.6 + 1.0 * (level - 176)) / 100;
    return 1 + 113.6 / 100; // Cap at level 200
}

function getInventoryDivisor(rarity) {
    return ['legendary', 'mystic', 'ancient'].includes(rarity) ? 4 : 3.5;
}

function calculateWeaponAttacks(rarity, tier, level) {
    const baseEquipped = weaponBaseAttackEquipped[rarity]?.[tier];
    if (baseEquipped === null || baseEquipped === undefined || !level || level <= 0) {
        return { inventoryAttack: 0, equippedAttack: 0 };
    }

    const levelMultiplier = getWeaponLevelMultiplier(level);
    const equippedBeforeRound = baseEquipped * levelMultiplier;
    const equippedAttack = Math.floor(equippedBeforeRound * 10) / 10;
    const divisor = getInventoryDivisor(rarity);
    const inventoryAttack = equippedAttack / divisor;

    return { inventoryAttack, equippedAttack };
}

function getMaxLevelForStars(stars) {
    const maxLevels = { 0: 100, 1: 120, 2: 140, 3: 160, 4: 180, 5: 200 };
    return maxLevels[stars] || 100;
}

function getUpgradeCost(rarity, tier, level) {
    if (level <= 0) return 0;

    const tierNum = parseInt(tier.replace('t', ''));
    const tierSteps = 4 - tierNum;

    const baseCosts = {
        normal: 10,
        rare: 40,
        epic: 140,
        unique: 490,
        legendary: 1470,
        mystic: 5880,
        ancient: 23520
    };

    const baseCost = baseCosts[rarity];
    if (!baseCost) return 0;

    const tierAdjustedCost = baseCost * Math.pow(1.2, tierSteps);

    let levelMultiplier = 1;

    if (level <= 50) {
        levelMultiplier = Math.pow(1.01, level - 1);
    } else if (level <= 100) {
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, level - 50);
    } else if (level <= 150) {
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, 50) * Math.pow(1.02, level - 100);
    } else {
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, 50) * Math.pow(1.02, 50) * Math.pow(1.025, level - 150);
    }

    const finalCost = tierAdjustedCost * levelMultiplier;
    return Math.ceil(finalCost);
}

// Calculate multi-level upgrade gain (what you get from spending resources)
function calculateUpgradeGain(rarity, tier, currentLevel, stars, resources) {
    if (currentLevel <= 0) {
        return { levelsGained: 0, newLevel: currentLevel, attackGain: 0, resourcesUsed: 0, efficiency: 0 };
    }

    const maxLevel = getMaxLevelForStars(stars);

    let level = currentLevel;
    let remainingResources = resources;
    let totalCost = 0;
    let iterations = 0;
    const maxIterations = 300;

    while (level < maxLevel && remainingResources > 0 && iterations < maxIterations) {
        const cost = getUpgradeCost(rarity, tier, level);
        if (cost <= 0 || cost > remainingResources) break;

        remainingResources -= cost;
        totalCost += cost;
        level++;
        iterations++;
    }

    const currentAttack = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
    const newAttack = calculateWeaponAttacks(rarity, tier, level).inventoryAttack;
    const attackGain = newAttack - currentAttack;

    return {
        levelsGained: level - currentLevel,
        newLevel: level,
        attackGain: attackGain,
        resourcesUsed: totalCost,
        efficiency: totalCost > 0 ? attackGain / (totalCost / 1000) : 0
    };
}

// Calculate multi-level upgrade efficiency (per 1k shards)
function calculateUpgradeEfficiency(rarity, tier, level, stars = 5, resources = 1000) {
    const upgradeGain = calculateUpgradeGain(rarity, tier, level, stars, resources);
    return upgradeGain.attackGain; // Already per 1k if resources = 1000
}

// Simulate upgrade priority algorithm
function simulateUpgradePriority(weaponStates, numUpgrades = 100) {
    const weaponLevels = {};
    const weaponMaxLevels = {};

    // Initialize levels
    weaponStates.forEach(ws => {
        const key = `${ws.rarity}-${ws.tier}`;
        weaponLevels[key] = ws.level;
        weaponMaxLevels[key] = ws.maxLevel || getMaxLevelForStars(ws.stars || 5);
    });

    const upgradeSequence = [];

    for (let i = 0; i < numUpgrades; i++) {
        let bestWeapon = null;
        let bestEfficiency = 0;

        weaponStates.forEach(ws => {
            const key = `${ws.rarity}-${ws.tier}`;
            const currentLevel = weaponLevels[key];
            const maxLevel = weaponMaxLevels[key];

            if (currentLevel >= maxLevel) return;

            const upgradeGain = calculateUpgradeGain(ws.rarity, ws.tier, currentLevel, ws.stars || 5, 1000);
            const efficiency = upgradeGain.attackGain;

            if (efficiency > bestEfficiency) {
                bestEfficiency = efficiency;
                bestWeapon = { rarity: ws.rarity, tier: ws.tier, key };
            }
        });

        if (!bestWeapon) break;

        upgradeSequence.push(bestWeapon);
        weaponLevels[bestWeapon.key]++;
    }

    return upgradeSequence;
}

module.exports = {
    weaponBaseAttackEquipped,
    rarities,
    tiers,
    getWeaponLevelMultiplier,
    getInventoryDivisor,
    calculateWeaponAttacks,
    getMaxLevelForStars,
    getUpgradeCost,
    calculateUpgradeGain,
    calculateUpgradeEfficiency,
    simulateUpgradePriority
};
