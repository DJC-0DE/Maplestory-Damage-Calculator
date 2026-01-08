import { weaponRatesPerLevel, weaponBaseAttackEquipped } from '../constants.js';

// Get weapon level multiplier based on level (from weapon-damage-stats.txt)
export function getWeaponLevelMultiplier(level) {
    if (!level || level <= 1) return 1.0;
    if (level <= 100) return 1 + (0.3 * (level - 1)) / 100;
    if (level <= 130) return 1 + (30.3 + 0.7 * (level - 101)) / 100;
    if (level <= 155) return 1 + (51.4 + 0.8 * (level - 131)) / 100;
    if (level <= 175) return 1 + (71.5 + 0.9 * (level - 156)) / 100;
    if (level <= 200) return 1 + (89.6 + 1.0 * (level - 176)) / 100;
    return 1 + 113.6 / 100; // Cap at level 200
}

// Get inventory divisor based on rarity
export function getInventoryDivisor(rarity) {
    return ['legendary', 'mystic', 'ancient'].includes(rarity) ? 4 : 3.5;
}

// Calculate weapon attack percentages from level
export function calculateWeaponAttacks(rarity, tier, level) {
    const baseEquipped = weaponBaseAttackEquipped[rarity]?.[tier];
    if (baseEquipped === null || baseEquipped === undefined || !level || level <= 0) {
        return { inventoryAttack: 0, equippedAttack: 0 };
    }

    // Calculate equipped attack: base × level multiplier
    const levelMultiplier = getWeaponLevelMultiplier(level);
    const equippedBeforeRound = baseEquipped * levelMultiplier;

    // Round down to nearest 0.1% (as specified in formula image)
    const equippedAttack = Math.floor(equippedBeforeRound * 10) / 10;

    // Calculate inventory attack: equipped / divisor
    const divisor = getInventoryDivisor(rarity);
    const inventoryAttack = equippedAttack / divisor;

    return { inventoryAttack, equippedAttack };
}

// Get max level based on star rating
export function getMaxLevelForStars(stars) {
    const maxLevels = { 0: 100, 1: 120, 2: 140, 3: 160, 4: 180, 5: 200 };
    return maxLevels[stars] || 100;
}

// Calculate upgrade cost for a weapon at a specific level
export function getUpgradeCost(rarity, tier, level) {
    if (level <= 0) return 0;

    const tierNum = parseInt(tier.replace('t', ''));
    const tierSteps = 4 - tierNum; // T4->0, T3->1, T2->2, T1->3

    // Base costs for T4
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

    // Apply tier multiplier (1.2x for each tier above T4)
    const tierAdjustedCost = baseCost * Math.pow(1.2, tierSteps);

    // Apply level-based multiplier
    let levelMultiplier = 1;

    if (level <= 50) {
        // Level 1->2 to 50->51: BaseCost × 1.01^(Level-1)
        levelMultiplier = Math.pow(1.01, level - 1);
    } else if (level <= 100) {
        // Level 51->52 to 100->101: BaseCost × 1.01^49 × 1.015^(Level-50)
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, level - 50);
    } else if (level <= 150) {
        // Level 101->102 to 150->151: BaseCost × 1.01^49 × 1.015^50 × 1.02^(Level-100)
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, 50) * Math.pow(1.02, level - 100);
    } else {
        // Level 151->152 to 199->200: BaseCost × 1.01^49 × 1.015^50 × 1.02^50 × 1.025^(Level-150)
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, 50) * Math.pow(1.02, 50) * Math.pow(1.025, level - 150);
    }

    const finalCost = tierAdjustedCost * levelMultiplier;

    // Round up to nearest 1 Weapon Enhancer
    return Math.ceil(finalCost);
}

// Calculate inventory attack gain from spending resources
export function calculateUpgradeGain(rarity, tier, currentLevel, stars, resources) {
    if (currentLevel <= 0) {
        return { levelsGained: 0, newLevel: currentLevel, attackGain: 0, resourcesUsed: 0, efficiency: 0, singleLevelCost: 0 };
    }

    const maxLevel = getMaxLevelForStars(stars);

    // Check the cost of the next level
    const nextLevelCost = getUpgradeCost(rarity, tier, currentLevel);

    // If the next level costs more than available resources, show gain for that level anyway
    if (nextLevelCost > resources && currentLevel < maxLevel) {
        const currentAttack = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
        const nextLevelAttack = calculateWeaponAttacks(rarity, tier, currentLevel + 1).inventoryAttack;
        const attackGain = nextLevelAttack - currentAttack;

        return {
            levelsGained: 0,
            newLevel: currentLevel,
            attackGain: attackGain,
            resourcesUsed: 0,
            efficiency: 0,
            singleLevelCost: nextLevelCost,
            isUnaffordable: true
        };
    }

    let level = currentLevel;
    let remainingResources = resources;
    let totalCost = 0;
    let iterations = 0;
    const maxIterations = 300; // Prevent infinite loops

    // Simulate upgrades until we run out of resources or hit max level
    while (level < maxLevel && remainingResources > 0 && iterations < maxIterations) {
        const cost = getUpgradeCost(rarity, tier, level);
        if (cost <= 0 || cost > remainingResources) break;

        remainingResources -= cost;
        totalCost += cost;
        level++;
        iterations++;
    }

    // Calculate attack gain
    const currentAttack = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
    const newAttack = calculateWeaponAttacks(rarity, tier, level).inventoryAttack;
    const attackGain = newAttack - currentAttack;

    return {
        levelsGained: level - currentLevel,
        newLevel: level,
        attackGain: attackGain,
        resourcesUsed: totalCost,
        efficiency: totalCost > 0 ? attackGain / (totalCost / 1000) : 0,
        singleLevelCost: 0,
        isUnaffordable: false
    };
}

// Calculate inventory bonus for a weapon
export function calculateInventoryBonus(rarity, tier, level) {
    const rate = weaponRatesPerLevel[rarity][tier];
    if (rate === null || level === 0) return 0;
    return rate * level;
}