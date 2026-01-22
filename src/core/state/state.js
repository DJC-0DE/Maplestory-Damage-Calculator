// Pure state extraction - no UI, no calculations

import { itemStatProperties, allItemStatProperties } from '@core/constants.js';
// Handles reading DOM state into structured data

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
        // prefix format: item-{slot}-{itemId}
        // Element IDs are: item-{slot}-{itemId}-stat-{statId}-{type|value}
        for (let i = 1; i <= 10; i++) {
            const typeElem = document.getElementById(`${prefix}-stat-${i}-type`);
            const valueElem = document.getElementById(`${prefix}-stat-${i}-value`);

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

// Companions state
let companionsState = {};

// Optimal preset cache - stores calculated optimal presets to avoid recalculation
let optimalPresetCache = {
    boss: null,
    normal: null,
    lastCompanionsHash: null
};

/**
 * Generate a hash of the current companions state for cache invalidation
 */
function generateCompanionsHash() {
    const companions = getCompanionsState();
    return JSON.stringify(companions);
}

/**
 * Invalidate the optimal preset cache (call when companions change)
 */
export function invalidateOptimalPresetCache() {
    optimalPresetCache.boss = null;
    optimalPresetCache.normal = null;
    optimalPresetCache.lastCompanionsHash = null;
}

/**
 * Get cached optimal preset for a monster type
 * @param {string} monsterType - 'bossDamage' or 'normalDamage'
 * @param {Function} generator - Function to generate the preset if not cached
 * @returns {Object} Optimal preset
 */
export function getCachedOptimalPreset(monsterType, generator) {
    const currentHash = generateCompanionsHash();
    const cacheKey = monsterType === 'bossDamage' ? 'boss' : 'normal';

    // Check if cache is valid
    if (optimalPresetCache.lastCompanionsHash !== currentHash) {
        // Companions have changed, invalidate cache
        invalidateOptimalPresetCache();
    }

    // Return cached value or generate new one
    if (!optimalPresetCache[cacheKey]) {
        optimalPresetCache[cacheKey] = generator();
        optimalPresetCache.lastCompanionsHash = currentHash;
    }

    return optimalPresetCache[cacheKey];
}

/**
 * Ensure default unlocked companions are initialized in state
 * Normal, Rare, and Epic rarities default to unlocked at level 1
 */
function initializeDefaultCompanions() {
    const defaultRarities = ['Normal', 'Rare', 'Epic'];
    const classOrder = ['Hero', 'DarkKnight', 'ArchMageIL', 'ArchMageFP', 'BowMaster', 'Marksman', 'NightLord', 'Shadower'];

    defaultRarities.forEach(rarity => {
        classOrder.forEach(className => {
            const companionKey = `${className}-${rarity}`;
            // Only initialize if not already in state
            if (!companionsState[companionKey]) {
                companionsState[companionKey] = { unlocked: true, level: 1, equipped: false };
            }
        });
    });
}

/**
 * Get all companions state
 */
export function getCompanionsState() {
    initializeDefaultCompanions();
    return companionsState;
}

/**
 * Set companions state (used for loading saved data)
 */
export function setCompanionsState(state) {
    companionsState = state || {};
    // Ensure default companions are initialized after loading saved data
    initializeDefaultCompanions();
    // Invalidate cache when companions state is loaded
    invalidateOptimalPresetCache();
}

/**
 * Update a specific companion
 */
export function updateCompanion(companionKey, data) {
    companionsState[companionKey] = data;
    // Invalidate cache when a companion changes
    invalidateOptimalPresetCache();
}

/**
 * Get a specific companion's data
 * Normal, Rare, and Epic rarities default to unlocked at level 1
 */
export function getCompanion(companionKey) {
    // Ensure default companions are initialized
    initializeDefaultCompanions();

    if (companionsState[companionKey]) {
        return companionsState[companionKey];
    }

    // For Unique and Legendary rarities, default to locked
    return { unlocked: false, level: 1, equipped: false };
}

// Unlockable stats state
let unlockableStatsState = {};

// Stat configurations
const UNLOCKABLE_STAT_CONFIGS = {
    'unlockableAttackSpeed': { displayName: 'Attack Speed', statKey: 'attackSpeed', base: 3, increment: 0.2, maxLevel: 20, isPercentage: true },
    'unlockableCritRate': { displayName: 'Critical Rate', statKey: 'critRate', base: 5, increment: 0.5, maxLevel: 10, isPercentage: true },
    'unlockableMinDamage': { displayName: 'Min Damage Multiplier', statKey: 'minDamage', base: 5, increment: 0.3, maxLevel: 20, isPercentage: true },
    'unlockableMaxDamage': { displayName: 'Max Damage Multiplier', statKey: 'maxDamage', base: 5, increment: 0.3, maxLevel: 20, isPercentage: true },
    'unlockableAccuracy': { displayName: 'Accuracy', statKey: 'accuracy', base: 3, increment: 1, maxLevel: 20, isPercentage: false },
    'unlockableCritDamage': { displayName: 'Critical Damage', statKey: 'critDamage', base: 5, increment: 0.5, maxLevel: 30, isPercentage: true },
    'unlockableNormalDamage': { displayName: 'Normal Monster Damage', statKey: 'normalDamage', base: 5, increment: 0.5, maxLevel: 30, isPercentage: true },
    'unlockableBossDamage': { displayName: 'Boss Monster Damage', statKey: 'bossDamage', base: 5, increment: 0.5, maxLevel: 30, isPercentage: true },
    'unlockableSkillDamage': { displayName: 'Skill Damage', statKey: 'skillCoeff', base: 10, increment: 0.5, maxLevel: 30, isPercentage: true },
    'unlockableDamage': { displayName: 'Damage', statKey: 'damage', base: 10, increment: 0.5, maxLevel: 50, isPercentage: true }
};

export function getUnlockableStatConfigs() { return UNLOCKABLE_STAT_CONFIGS; }
export function getUnlockableStatsState() { return unlockableStatsState; }
export function setUnlockableStatsState(state) { 
    unlockableStatsState = state || {}; }
export function getUnlockableStat(statKey) {
    return unlockableStatsState[statKey] || { unlocked: false, level: 0 };
}
export function updateUnlockableStat(statKey, data) {
    unlockableStatsState[statKey] = data;
}

// Guild bonuses state
let guildBonusesState = {};

// Guild bonus configurations
const GUILD_BONUS_CONFIGS = {
    'guildDamage': { displayName: 'Damage', statKey: 'damage', base: 2, increment: 2, maxLevel: 5, isPercentage: true },
    'guildBossDamage': { displayName: 'Boss Monster Damage', statKey: 'bossDamage', base: 2, increment: 2, maxLevel: 5, isPercentage: true },
    'guildDefPen': { displayName: 'Defense Penetration', statKey: 'defPen', base: 2, increment: 2, maxLevel: 5, isPercentage: true },
    'guildFinalDamage': { displayName: 'Final Damage', statKey: 'finalDamage', base: 3, increment: 3, maxLevel: 3, isPercentage: true, customValues: [3, 6, 10] }
};

export function getGuildBonusConfigs() { return GUILD_BONUS_CONFIGS; }
export function getGuildBonusesState() { return guildBonusesState; }
export function setGuildBonusesState(state) {
    guildBonusesState = state || {};
}
export function getGuildBonus(bonusKey) {
    return guildBonusesState[bonusKey] || { unlocked: false, level: 0 };
}
export function updateGuildBonus(bonusKey, data) {
    guildBonusesState[bonusKey] = data;
}

// Cube Slot Data state
let cubeSlotData = {};

export function getCubeSlotData() {
    return cubeSlotData;
}

export function setCubeSlotData(data) {
    cubeSlotData = data || {};
}

export function initializeCubeSlotData(slotNames) {
    // Initialize all slots with default data (both regular and bonus potential)
    // Also handles migration from old format (no regular/bonus split)
    slotNames.forEach(slot => {
        const defaultSlotData = {
            regular: {
                rarity: 'normal',
                rollCount: 0,
                setA: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                },
                setB: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                }
            },
            bonus: {
                rarity: 'normal',
                rollCount: 0,
                setA: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                },
                setB: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                }
            }
        };

        if (!cubeSlotData[slot.id]) {
            // Slot doesn't exist, initialize with defaults
            cubeSlotData[slot.id] = defaultSlotData;
        } else {
            // Slot exists - check if it's old format (no regular/bonus split)
            if (!cubeSlotData[slot.id].regular && !cubeSlotData[slot.id].bonus) {
                // Old format - migrate to regular potential only
                cubeSlotData[slot.id] = {
                    regular: {
                        rarity: cubeSlotData[slot.id].rarity || 'normal',
                        rollCount: cubeSlotData[slot.id].rollCount || 0,
                        setA: cubeSlotData[slot.id].setA || defaultSlotData.regular.setA,
                        setB: cubeSlotData[slot.id].setB || defaultSlotData.regular.setB
                    },
                    bonus: defaultSlotData.bonus
                };
            } else {
                // New format - ensure both regular and bonus exist, and rollCount is present
                if (!cubeSlotData[slot.id].regular) {
                    cubeSlotData[slot.id].regular = defaultSlotData.regular;
                } else {
                    // Ensure rollCount exists
                    if (typeof cubeSlotData[slot.id].regular.rollCount !== 'number') {
                        cubeSlotData[slot.id].regular.rollCount = 0;
                    }
                }
                if (!cubeSlotData[slot.id].bonus) {
                    cubeSlotData[slot.id].bonus = defaultSlotData.bonus;
                } else {
                    // Ensure rollCount exists
                    if (typeof cubeSlotData[slot.id].bonus.rollCount !== 'number') {
                        cubeSlotData[slot.id].bonus.rollCount = 0;
                    }
                }
            }
        }
    });
}

// Presets state
let presetsState = {};
let selectedPreset = null;
let selectedSlot = null; // { type: 'main' | 'sub', index: 0-5 }

/**
 * Initialize empty presets
 */
function initializePresets() {
    if (Object.keys(presetsState).length === 0) {
        for (let i = 1; i <= 10; i++) {
            presetsState[`preset${i}`] = {
                main: null,
                subs: [null, null, null, null, null, null]
            };
        }
    }
}

/**
 * Get all presets
 */
export function getPresets() {
    initializePresets();
    return presetsState;
}

/**
 * Get a specific preset
 */
export function getPreset(presetId) {
    initializePresets();
    return presetsState[presetId] || { main: null, subs: [null, null, null, null, null, null] };
}

/**
 * Set presets state (used for loading saved data)
 */
export function setPresetsState(state) {
    presetsState = state || {};
    initializePresets();
}

/**
 * Set a companion to a preset slot
 */
export function setPresetSlot(presetId, slotType, slotIndex, companionKey) {
    initializePresets();
    if (slotType === 'main') {
        presetsState[presetId].main = companionKey;
    } else if (slotType === 'sub') {
        presetsState[presetId].subs[slotIndex] = companionKey;
    }
}

/**
 * Clear a preset slot
 */
export function clearPresetSlot(presetId, slotType, slotIndex) {
    initializePresets();
    if (slotType === 'main') {
        presetsState[presetId].main = null;
    } else if (slotType === 'sub') {
        presetsState[presetId].subs[slotIndex] = null;
    }
}

/**
 * Get currently selected slot info
 */
export function getSelectedSlotInfo() {
    if (selectedPreset && selectedSlot) {
        return { presetId: selectedPreset, ...selectedSlot };
    }
    return null;
}

/**
 * Set the selected slot
 */
export function setSelectedSlot(presetId, slotType, slotIndex) {
    selectedPreset = presetId;
    selectedSlot = { type: slotType, index: slotIndex };
}

/**
 * Clear the selected slot
 */
export function clearSelectedSlot() {
    selectedPreset = null;
    selectedSlot = null;
}

// Contributed stats tracking
let ContributedStats = {
    base: {              // Base stats that all classes have
        critDamage: 30,  // Base crit damage is 30%
        minDamage: 65,   // Base min damage multiplier is 65%
        maxDamage: 100   // Base max damage multiplier is 100%
    },
    equipment: {},       // Stats from equipment slots
    scrolling: {},       // Stats from scrolling enhancements
    cubePotential: {},   // Stats from cube potential (regular + bonus)
    Companion: {},       // Stats from equipped companions
    CompanionInventory: {}, // Stats from all unlocked companions (inventory effects)
    InnerAbility: {},    // Stats from equipped inner ability preset
    MainStat: {},        // Primary main stat contribution (1:1 to attack)
    UnlockableStats: {}  // Stats from unlockable levelable stats
};

// Callbacks that are notified when ContributedStats changes
let contributedStatsCallbacks = [];

// Equipped preset tracking
let equippedPresetId = 'preset1'; // Default to preset #1

/**
 * Get ContributedStats dictionary
 */
export function getContributedStats() {
    return ContributedStats;
}

/**
 * Set ContributedStats (used for loading saved data)
 * Always ensures base stats are present
 */
export function setContributedStats(stats) {
    ContributedStats = stats || {};

    // Always ensure base stats are present, even if not in saved data
    if (!ContributedStats.base) {
        ContributedStats.base = {
            critDamage: 30,  // Base crit damage is 30%
            minDamage: 65,   // Base min damage multiplier is 65%
            maxDamage: 100   // Base max damage multiplier is 100%
        };
    } else {
        // Ensure all base stat values are present
        if (typeof ContributedStats.base.critDamage !== 'number') {
            ContributedStats.base.critDamage = 30;
        }
        if (typeof ContributedStats.base.minDamage !== 'number') {
            ContributedStats.base.minDamage = 65;
        }
        if (typeof ContributedStats.base.maxDamage !== 'number') {
            ContributedStats.base.maxDamage = 100;
        }
    }
}

/**
 * Register a callback to be notified when ContributedStats changes
 */
export function onContributedStatsChange(callback) {
    contributedStatsCallbacks.push(callback);
}

/**
 * Notify all registered callbacks that ContributedStats has changed
 * @param {string} source - Optional source of change ('unlockable-stats', 'guild-bonuses', or undefined for external)
 */
function notifyContributedStatsChanged(source) {
    contributedStatsCallbacks.forEach(callback => callback(ContributedStats, source));
}

/**
 * Update equipment contributions in ContributedStats
 * Call this when equipment data changes
 */
export function updateEquipmentContributions(equipmentStats) {
    ContributedStats.equipment = equipmentStats || {};
    notifyContributedStatsChanged();
}

/**
 * Update scrolling contributions in ContributedStats
 * Automatically calculates from slot performance inputs
 */
export function updateScrollingContributions() {
    ContributedStats.scrolling = calculateScrollingContributions();
    notifyContributedStatsChanged();
}

/**
 * Update cube potential contributions in ContributedStats
 * Automatically calculates from cube slot data
 */
export function updateCubePotentialContributions() {
    ContributedStats.cubePotential = calculateCubePotentialContributions();
    notifyContributedStatsChanged();
}

/**
 * Update companion equipped preset contributions in ContributedStats
 * @param {Object} companionEffects - The companion equip effects to set
 */
export function updateCompanionEquippedContributions(companionEffects) {
    ContributedStats.Companion = companionEffects || {};
    notifyContributedStatsChanged();
}

/**
 * Update companion inventory contributions in ContributedStats
 * Automatically calculates from all unlocked companions
 */
export function updateCompanionInventoryContributions() {
    ContributedStats.CompanionInventory = calculateCompanionInventoryContributions();
    notifyContributedStatsChanged();
}

/**
 * Update inner ability contributions in ContributedStats
 * Automatically calculates from equipped preset
 */
export function updateInnerAbilityContributions() {
    ContributedStats.InnerAbility = calculateInnerAbilityContributions();
    notifyContributedStatsChanged();
}

/**
 * Update main stat contributions in ContributedStats
 * Automatically calculates from base stat inputs
 */
export function updateMainStatContributions() {
    ContributedStats.MainStat = calculateMainStatContribution();
    notifyContributedStatsChanged();
}

/**
 * Update all contributions that can be calculated automatically
 * This is useful for initialization or when multiple sources might have changed
 */
export function updateAllContributions() {
    ContributedStats.scrolling = calculateScrollingContributions();
    ContributedStats.cubePotential = calculateCubePotentialContributions();
    ContributedStats.CompanionInventory = calculateCompanionInventoryContributions();
    ContributedStats.InnerAbility = calculateInnerAbilityContributions();
    ContributedStats.MainStat = calculateMainStatContribution();
    ContributedStats.UnlockableStats = calculateUnlockableStatsContributions();
    ContributedStats.GuildBonuses = calculateGuildBonusesContributions();

    // Note: equipment and Companion are updated separately by their respective UIs

    notifyContributedStatsChanged();
}

/**
 * Get currently equipped preset ID
 */
export function getEquippedPresetId() {
    return equippedPresetId;
}

/**
 * Set equipped preset ID
 */
export function setEquippedPresetId(presetId) {
    equippedPresetId = presetId;
}

// Preset DPS comparison toggle state
let showPresetDpsComparison = false;

/**
 * Get whether to show DPS comparison for presets
 */
export function getShowPresetDpsComparison() {
    return showPresetDpsComparison;
}

/**
 * Set whether to show DPS comparison for presets
 */
export function setShowPresetDpsComparison(show) {
    showPresetDpsComparison = show;
}

// Locked main companion state for optimal presets
let lockedMainForOptimalBoss = null;
let lockedMainForOptimalNormal = null;

/**
 * Get locked main companion for optimal preset
 * @param {string} optimalType - 'optimal-boss' or 'optimal-normal'
 */
export function getLockedMainCompanion(optimalType) {
    if (optimalType === 'optimal-boss') {
        return lockedMainForOptimalBoss;
    } else if (optimalType === 'optimal-normal') {
        return lockedMainForOptimalNormal;
    }
    return null;
}

/**
 * Set locked main companion for optimal preset
 * @param {string} optimalType - 'optimal-boss' or 'optimal-normal'
 * @param {string|null} companionKey - Companion key or null to clear
 */
export function setLockedMainCompanion(optimalType, companionKey) {
    if (optimalType === 'optimal-boss') {
        lockedMainForOptimalBoss = companionKey;
    } else if (optimalType === 'optimal-normal') {
        lockedMainForOptimalNormal = companionKey;
    }
}


/**
 * Calculate total scrolling contributions from all equipment slots
 * Sums up attack, main stat, and damage amp from all slot performance inputs
 */
export function calculateScrollingContributions() {
    const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];
    const contributions = {
        attack: 0,
        statDamage: 0,  // main stat converts to stat damage (100 main stat = 1%)
        damageAmp: 0
    };

    slotNames.forEach(slotId => {
        const attack = parseFloat(document.getElementById(`slot-${slotId}-attack`)?.value) || 0;
        const mainStat = parseFloat(document.getElementById(`slot-${slotId}-main-stat`)?.value) || 0;
        const damageAmp = parseFloat(document.getElementById(`slot-${slotId}-damage-amp`)?.value) || 0;

        contributions.attack += attack;
        contributions.statDamage += mainStat / 100;  // 100 main stat = 1% stat damage
        contributions.damageAmp += damageAmp;
    });

    return contributions;
}

/**
 * Calculate total cube potential contributions from all slots
 * Sums up both regular and bonus potential stats
 */
export function calculateCubePotentialContributions() {
    // Access cubeSlotData from window if available (set by cube-potential.js)
    if (!window.cubeSlotData) {
        return {};  // No cube data available
    }

    const cubeSlotData = window.cubeSlotData;
    const slotIds = Object.keys(cubeSlotData);
    const contributions = {};

    slotIds.forEach(slotId => {
        const slotData = cubeSlotData[slotId];
        if (!slotData) return;

        // Process both regular and bonus potential
        ['regular', 'bonus'].forEach(potentialType => {
            const potentialData = slotData[potentialType];
            if (!potentialData) return;

            // Determine which set is active (default to setA)
            const activeSet = potentialData.setA || potentialData.setB;
            if (!activeSet) return;

            // Check if active set has any actual data (lines with stats)
            const hasAnyData = activeSet.line1?.stat || activeSet.line2?.stat || activeSet.line3?.stat;
            if (!hasAnyData) return;

            let accumulatedMainStatPct = 0;

            // Process each line
            for (let lineNum = 1; lineNum <= 3; lineNum++) {
                const line = activeSet[`line${lineNum}`];
                if (!line || !line.stat) continue;

                // Use the cube logic's mapping function if available
                const mapped = window.potentialStatToDamageStat?.(
                    line.stat,
                    line.value,
                    accumulatedMainStatPct
                );

                if (mapped && mapped.stat && mapped.value > 0) {
                    contributions[mapped.stat] = (contributions[mapped.stat] || 0) + mapped.value;

                    // Track main stat % accumulation for subsequent lines
                    if (mapped.isMainStatPct) {
                        accumulatedMainStatPct += line.value;
                    }
                }
            }
        });
    });

    return contributions;
}

/**
 * Calculate companion inventory effects (all unlocked companions)
 * This is separate from equipped preset contributions
 */
export function calculateCompanionInventoryContributions() {
    if (!window.getCompanionEffects) {
        return {}; // Companions module not loaded yet
    }

    const companionsState = getCompanionsState();
    const inventoryEffects = {};

    Object.entries(companionsState).forEach(([companionKey, data]) => {
        if (!data.unlocked) return;
        const [className, rarity] = companionKey.split('-');
        const level = data.level || 1;
        const effects = window.getCompanionEffects(className, rarity, level);
        if (effects && effects.inventoryEffect) {
            Object.entries(effects.inventoryEffect).forEach(([stat, value]) => {
                inventoryEffects[stat] = (inventoryEffects[stat] || 0) + value;
            });
        }
    });

    return inventoryEffects;
}

/**
 * Calculate inner ability contributions from equipped preset
 */
export function calculateInnerAbilityContributions() {
    if (!window.getAllPresets || !window.applyInnerAbilityLines) {
        return {}; // Inner ability module not loaded yet
    }

    const presets = window.getAllPresets();
    const equippedPreset = presets.find(p => p.isEquipped);

    if (!equippedPreset) return {};

    const contributions = {
        attackSpeed: 0,
        bossDamage: 0,
        critRate: 0,
        damage: 0,
        defPen: 0,
        minDamage: 0,
        maxDamage: 0,
        normalDamage: 0,
        statDamage: 0
    };

    // Apply each line from the equipped preset
    equippedPreset.lines.forEach(line => {
        if (!line.stat || !line.value) return;

        const stat = line.stat;
        const value = line.value;

        // Map inner ability stat to contribution stat
        switch (stat) {
            case 'Attack Speed':
                contributions.attackSpeed += value;
                break;
            case 'Boss Monster Damage':
                contributions.bossDamage += value;
                break;
            case 'Critical Rate':
                contributions.critRate += value;
                break;
            case 'Damage':
                contributions.damage += value;
                break;
            case 'Defense Penetration':
                contributions.defPen += value;
                break;
            case 'Min Damage Multiplier':
                contributions.minDamage += value;
                break;
            case 'Max Damage Multiplier':
                contributions.maxDamage += value;
                break;
            case 'Normal Monster Damage':
                contributions.normalDamage += value;
                break;
            case 'Main Stat':
                // Convert Main Stat to Stat Damage % at 100:1 ratio
                contributions.statDamage += value / 100;
                break;
        }
    });

    // Remove zero values
    Object.keys(contributions).forEach(key => {
        if (contributions[key] === 0) {
            delete contributions[key];
        }
    });

    return contributions;
}

/**
 * Calculate main stat contribution to attack (1:1 ratio)
 * Returns the maximum of STR/DEX/INT/LUK
 */
export function calculateMainStatContribution() {
    const str = parseFloat(document.getElementById('str-base')?.value) || 0;
    const dex = parseFloat(document.getElementById('dex-base')?.value) || 0;
    const int = parseFloat(document.getElementById('int-base')?.value) || 0;
    const luk = parseFloat(document.getElementById('luk-base')?.value) || 0;

    const maxStat = Math.max(str, dex, int, luk);
    return maxStat > 0 ? { attack: maxStat } : {};
}

/**
 * Calculate unlockable stats contributions
 * Returns stat bonuses from unlocked, leveled stats
 */
export function calculateUnlockableStatsContributions() {
    const contributions = {};

    Object.entries(UNLOCKABLE_STAT_CONFIGS).forEach(([unlockableKey, config]) => {
        const statData = getUnlockableStat(unlockableKey);

        if (statData.unlocked && statData.level > 0) {
            const value = config.base + (statData.level * config.increment);
            const statKey = config.statKey;
            contributions[statKey] = (contributions[statKey] || 0) + value;
        }
    });

    return contributions;
}

/**
 * Update unlockable stats contributions in ContributedStats
 * Call this when unlockable stats change
 */
export function updateUnlockableStatsContributions() {
    ContributedStats.UnlockableStats = calculateUnlockableStatsContributions();
    notifyContributedStatsChanged('unlockable-stats');
}

/**
 * Calculate guild bonuses contributions
 * Returns stat bonuses from unlocked, leveled guild bonuses
 */
export function calculateGuildBonusesContributions() {
    const contributions = {};

    Object.entries(GUILD_BONUS_CONFIGS).forEach(([guildKey, config]) => {
        const bonusData = getGuildBonus(guildKey);

        if (bonusData.unlocked && bonusData.level > 0) {
            let value;
            if (config.customValues) {
                // Use custom values array (for final damage: 3, 6, 10)
                value = config.customValues[bonusData.level - 1] || 0;
            } else {
                // Use base + level * increment
                value = config.base + (bonusData.level * config.increment);
            }
            const statKey = config.statKey;
            contributions[statKey] = (contributions[statKey] || 0) + value;
        }
    });

    return contributions;
}

/**
 * Update guild bonuses contributions in ContributedStats
 * Call this when guild bonuses change
 */
export function updateGuildBonusesContributions() {
    ContributedStats.GuildBonuses = calculateGuildBonusesContributions();
    notifyContributedStatsChanged('guild-bonuses');
}


// ================================================================================================
// TEST HELPERS - Expose functions to window for Playwright UI testing
// ================================================================================================
if (typeof window !== 'undefined') {
    window.getContributedStats = getContributedStats;
    window.updateEquipmentContributions = updateEquipmentContributions;
    window.updateCompanionEquippedContributions = updateCompanionEquippedContributions;
    window.updateScrollingContributions = updateScrollingContributions;
    window.updateCubePotentialContributions = updateCubePotentialContributions;
    window.updateInnerAbilityContributions = updateInnerAbilityContributions;
}
