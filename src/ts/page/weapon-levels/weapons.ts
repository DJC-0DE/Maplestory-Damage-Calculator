/**
 * Pure calculation logic for Weapon Levels system
 * All functions are pure and have no side effects or DOM dependencies
 */

import { WeaponRarity, WeaponTier } from '@ts/types';
import type {
    WeaponLevel,
    StarRating,
    WeaponAttackResult,
    UpgradeGainResult,
    WeaponState,
    UpgradePriorityItem,
    GroupedUpgradeResult,
    UpgradePriorityChainResult,
    CurrencyUpgradeResult,
    WeaponLevels,
    WeaponKey
} from '@ts/types';
import { weaponBaseAttackEquipped, weaponUpgradeCosts, MAX_LEVELS_BY_STARS } from '@ts/types';

/**
 * Get weapon level multiplier based on level
 * @param level - Current weapon level
 * @returns Level multiplier for attack calculation
 */
export function getWeaponLevelMultiplier(level: WeaponLevel): number {
    if (!level || level <= 1) return 1.0;
    if (level <= 100) return 1 + (0.3 * (level - 1)) / 100;
    if (level <= 130) return 1 + (30.3 + 0.7 * (level - 101)) / 100;
    if (level <= 155) return 1 + (51.4 + 0.8 * (level - 131)) / 100;
    if (level <= 175) return 1 + (71.5 + 0.9 * (level - 156)) / 100;
    if (level <= 200) return 1 + (89.6 + 1.0 * (level - 176)) / 100;
    return 1 + 113.6 / 100; // Cap at level 200
}

/**
 * Get inventory divisor based on rarity
 * @param rarity - Weapon rarity
 * @returns Divisor for inventory attack calculation
 */
export function getInventoryDivisor(rarity: WeaponRarity): number {
    return ['legendary', 'mystic', 'ancient'].includes(rarity) ? 4 : 3.5;
}

/**
 * Calculate weapon attack percentages from level
 * @param rarity - Weapon rarity
 * @param tier - Weapon tier
 * @param level - Current weapon level
 * @returns Object with inventoryAttack and equippedAttack percentages
 */
export function calculateWeaponAttacks(
    rarity: WeaponRarity,
    tier: WeaponTier,
    level: WeaponLevel
): WeaponAttackResult {
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

/**
 * Get max level based on star rating
 * @param stars - Star rating (0-5)
 * @returns Maximum weapon level for the given star rating
 */
export function getMaxLevelForStars(stars: StarRating): WeaponLevel {
    return MAX_LEVELS_BY_STARS[stars] ?? 100;
}

/**
 * Calculate upgrade cost for a weapon at a specific level
 * @param rarity - Weapon rarity
 * @param tier - Weapon tier
 * @param level - Current weapon level
 * @returns Cost in shards to upgrade to the next level
 */
export function getUpgradeCost(
    rarity: WeaponRarity,
    tier: WeaponTier,
    level: WeaponLevel
): number {
    const tierNum = parseInt(tier.replace('t', ''));
    const cost = weaponUpgradeCosts[rarity]?.[tierNum]?.[level + 1];
    return cost ?? 0;
}

/**
 * Calculate inventory attack gain from spending resources
 * @param rarity - Weapon rarity
 * @param tier - Weapon tier
 * @param currentLevel - Current weapon level
 * @param stars - Star rating (0-5)
 * @param resources - Available resources (shards)
 * @param isEquipped - Whether this weapon is equipped
 * @returns Upgrade gain calculation result
 */
export function calculateUpgradeGain(
    rarity: WeaponRarity,
    tier: WeaponTier,
    currentLevel: WeaponLevel,
    stars: StarRating,
    resources: number,
    isEquipped = false
): UpgradeGainResult {
    if (currentLevel <= 0) {
        return {
            levelsGained: 0,
            newLevel: currentLevel,
            attackGain: 0,
            equippedAttackGain: 0,
            resourcesUsed: 0,
            efficiency: 0,
            singleLevelCost: 0,
            isUnaffordable: false
        };
    }

    const maxLevel = getMaxLevelForStars(stars);

    // Check the cost of the next level
    const nextLevelCost = getUpgradeCost(rarity, tier, currentLevel);

    // If the next level costs more than available resources, show gain for that level anyway
    if (nextLevelCost > resources && currentLevel < maxLevel) {
        const currentAttack = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
        const nextLevelAttack = calculateWeaponAttacks(rarity, tier, currentLevel + 1).inventoryAttack;
        const attackGain = nextLevelAttack - currentAttack;

        // Calculate equipped attack gain if equipped
        const currentEquippedAttack = calculateWeaponAttacks(rarity, tier, currentLevel).equippedAttack;
        const nextEquippedAttack = calculateWeaponAttacks(rarity, tier, currentLevel + 1).equippedAttack;
        const equippedAttackGain = isEquipped ? (nextEquippedAttack - currentEquippedAttack) : 0;

        return {
            levelsGained: 0,
            newLevel: currentLevel,
            attackGain,
            equippedAttackGain,
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

    // Calculate equipped attack gain if equipped
    const currentEquippedAttack = calculateWeaponAttacks(rarity, tier, currentLevel).equippedAttack;
    const newEquippedAttack = calculateWeaponAttacks(rarity, tier, level).equippedAttack;
    const equippedAttackGain = isEquipped ? (newEquippedAttack - currentEquippedAttack) : 0;

    return {
        levelsGained: level - currentLevel,
        newLevel: level,
        attackGain,
        equippedAttackGain,
        resourcesUsed: totalCost,
        efficiency: totalCost > 0 ? attackGain / (totalCost / 1000) : 0,
        singleLevelCost: 0,
        isUnaffordable: false
    };
}

/**
 * Calculate the upgrade priority chain
 * Determines the most efficient upgrade sequence for a given number of upgrades
 * @param weaponStates - Array of current weapon states
 * @param numUpgrades - Number of upgrades to simulate (default: 100)
 * @returns Priority chain calculation result
 */
export function calculateUpgradePriorityChain(
    weaponStates: WeaponState[],
    numUpgrades = 100
): UpgradePriorityChainResult {
    const upgradeSequence: UpgradePriorityItem[] = [];
    const weaponLevels: Record<string, WeaponLevel> = {};
    const weaponMaxLevels: Record<string, WeaponLevel> = {};
    const weaponEquippedStates: Record<string, boolean> = {};

    // Initialize current levels, max levels, and equipped states
    weaponStates.forEach(ws => {
        const key = `${ws.rarity}-${ws.tier}`;
        weaponLevels[key] = ws.level;
        weaponMaxLevels[key] = ws.maxLevel;
        weaponEquippedStates[key] = ws.isEquipped ?? false;
    });

    for (let i = 0; i < numUpgrades; i++) {
        let bestWeapon: UpgradePriorityItem | null = null;
        let bestEfficiency = 0;

        // Recalculate efficiency for ALL weapons at their current levels
        weaponStates.forEach(ws => {
            const key = `${ws.rarity}-${ws.tier}` as WeaponKey;
            const currentLevel = weaponLevels[key];
            const maxLevel = weaponMaxLevels[key];
            const isEquipped = weaponEquippedStates[key];

            // Skip if at max level
            if (currentLevel >= maxLevel) return;

            // Calculate multi-level efficiency (what 1k shards gets you from current level)
            const upgradeGain = calculateUpgradeGain(
                ws.rarity,
                ws.tier,
                currentLevel,
                ws.stars,
                1000,
                isEquipped
            );

            let efficiency: number;
            if (upgradeGain.isUnaffordable) {
                // Normalize to per 1k when single level costs more than 1k
                const inventoryEfficiency = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
                const equippedEfficiency = (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
                efficiency = inventoryEfficiency + equippedEfficiency;
            } else {
                efficiency = upgradeGain.attackGain + upgradeGain.equippedAttackGain; // Already per 1k
            }

            if (efficiency > bestEfficiency) {
                bestEfficiency = efficiency;
                bestWeapon = {
                    rarity: ws.rarity,
                    tier: ws.tier,
                    key,
                    cost: getUpgradeCost(ws.rarity, ws.tier, currentLevel)
                };
            }
        });

        // If no weapon can be upgraded, stop
        if (!bestWeapon) break;

        // Record this upgrade and increment by 1 level
        upgradeSequence.push(bestWeapon);
        weaponLevels[bestWeapon.key]++;
    }

    // Group consecutive upgrades to the same weapon
    const groupedUpgrades = groupUpgradesByWeapon(upgradeSequence);

    return {
        upgradeSequence,
        groupedUpgrades,
        finalWeaponLevels: weaponLevels
    };
}

/**
 * Group consecutive upgrades by weapon
 * @param upgradeSequence - Array of individual upgrades
 * @returns Array of grouped upgrade results
 */
export function groupUpgradesByWeapon(
    upgradeSequence: UpgradePriorityItem[]
): GroupedUpgradeResult[] {
    const groupedUpgrades: GroupedUpgradeResult[] = [];
    let currentGroup: GroupedUpgradeResult | null = null;

    upgradeSequence.forEach(upgrade => {
        if (!currentGroup || currentGroup.rarity !== upgrade.rarity || currentGroup.tier !== upgrade.tier) {
            if (currentGroup) {
                groupedUpgrades.push(currentGroup);
            }
            currentGroup = {
                rarity: upgrade.rarity,
                tier: upgrade.tier,
                count: 1
            };
        } else {
            currentGroup.count++;
        }
    });

    if (currentGroup) {
        groupedUpgrades.push(currentGroup);
    }

    return groupedUpgrades;
}

/**
 * Calculate currency upgrade optimization
 * Simulates spending a given amount of currency on the most efficient upgrades
 * @param weaponStates - Array of current weapon states
 * @param currency - Available currency (shards)
 * @returns Currency upgrade calculation result
 */
export function calculateCurrencyUpgrades(
    weaponStates: WeaponState[],
    currency: number
): CurrencyUpgradeResult | null {
    if (!weaponStates.length || currency <= 0) {
        return null;
    }

    const upgradeSequence: UpgradePriorityItem[] = [];
    const weaponLevels: Record<string, WeaponLevel> = {};
    const weaponMaxLevels: Record<string, WeaponLevel> = {};
    const weaponEquippedStates: Record<string, boolean> = {};
    let remainingCurrency = currency;

    // Initialize current levels, max levels, and equipped states
    weaponStates.forEach(ws => {
        const key = `${ws.rarity}-${ws.tier}`;
        weaponLevels[key] = ws.level;
        weaponMaxLevels[key] = ws.maxLevel;
        weaponEquippedStates[key] = ws.isEquipped ?? false;
    });

    // Keep upgrading until we run out of currency
    while (remainingCurrency > 0) {
        let bestWeapon: UpgradePriorityItem | null = null;
        let bestEfficiency = 0;

        // Find the most efficient upgrade based on 1k shard potential
        weaponStates.forEach(ws => {
            const key = `${ws.rarity}-${ws.tier}` as WeaponKey;
            const currentLevel = weaponLevels[key];
            const maxLevel = weaponMaxLevels[key];
            const isEquipped = weaponEquippedStates[key];

            if (currentLevel >= maxLevel) return;

            // Calculate multi-level efficiency (what 1k shards gets you from current level)
            const upgradeGain = calculateUpgradeGain(
                ws.rarity,
                ws.tier,
                currentLevel,
                ws.stars,
                1000,
                isEquipped
            );

            let efficiency: number;
            if (upgradeGain.isUnaffordable) {
                // Normalize to per 1k when single level costs more than 1k
                const inventoryEfficiency = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
                const equippedEfficiency = (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
                efficiency = inventoryEfficiency + equippedEfficiency;
            } else {
                efficiency = upgradeGain.attackGain + upgradeGain.equippedAttackGain; // Already per 1k
            }

            if (efficiency > bestEfficiency) {
                bestEfficiency = efficiency;
                bestWeapon = {
                    rarity: ws.rarity,
                    tier: ws.tier,
                    key,
                    cost: getUpgradeCost(ws.rarity, ws.tier, currentLevel)
                };
            }
        });

        // If no weapon can be upgraded, stop
        if (!bestWeapon) break;

        // Check if we can afford this upgrade
        if (bestWeapon.cost > remainingCurrency) break;

        // Apply this upgrade (1 level at a time)
        upgradeSequence.push(bestWeapon);
        weaponLevels[bestWeapon.key]++;
        remainingCurrency -= bestWeapon.cost;
    }

    if (upgradeSequence.length === 0) {
        return null;
    }

    // Calculate total attack gain
    let totalAttackGain = 0;
    upgradeSequence.forEach(upgrade => {
        const prevLevel = weaponLevels[upgrade.key] - 1;
        const currentAttack = calculateWeaponAttacks(upgrade.rarity, upgrade.tier, prevLevel).inventoryAttack;
        const nextAttack = calculateWeaponAttacks(upgrade.rarity, upgrade.tier, weaponLevels[upgrade.key]).inventoryAttack;
        totalAttackGain += nextAttack - currentAttack;
    });

    return {
        totalAttackGain,
        dpsGainPct: 0, // To be calculated by UI layer
        upgradeSequence,
        weaponLevels,
        remainingCurrency
    };
}

/**
 * Calculate total weapon attack bonus from weapon levels
 * @param weaponLevels - Object mapping rarity-tier keys to levels
 * @param equippedWeaponKey - Key of the currently equipped weapon (if any)
 * @returns Total weapon attack bonus (inventory + equipped)
 */
export function calculateTotalWeaponAttackBonus(
    weaponLevels: WeaponLevels,
    equippedWeaponKey: string | null
): { inventoryAttack: number; equippedAttack: number; totalAttack: number } {
    let totalInventory = 0;
    let equippedAttack = 0;

    Object.entries(weaponLevels).forEach(([key, level]) => {
        if (level === 0) return;

        const [rarity, tier] = key.split('-') as [WeaponRarity, WeaponTier];
        const { inventoryAttack, equippedAttack: atk } = calculateWeaponAttacks(rarity, tier, level);

        totalInventory += inventoryAttack;

        // If this weapon is equipped, add its equipped attack
        if (key === equippedWeaponKey) {
            equippedAttack = atk;
        }
    });

    return {
        inventoryAttack: totalInventory,
        equippedAttack,
        totalAttack: totalInventory + equippedAttack
    };
}
