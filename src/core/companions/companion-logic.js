// Companion Logic
// Provides reusable functions for calculating companion preset DPS differences and optimizations
// Used by: Companion Presets UI

import { StatCalculationService } from '@core/services/stat-calculation-service.js';
import { getStats } from '@core/state/state.js';

/**
 * Smart routing helper to apply effects to a StatCalculationService
 * Intelligently routes each stat key to the correct chainable method based on stat type
 *
 * @param {StatCalculationService} service - The service instance
 * @param {Object} effects - Effects object with stat-value pairs
 * @param {boolean} isRemoving - If true, subtract the effects (for removing current effects)
 * @returns {StatCalculationService} Returns the service for chaining
 */
function applyEffectsToService(service, effects, isRemoving = false) {
    if (!effects) return service;

    // Stat type mappings for proper routing to chainable methods
    const statTypes = {
        // Flat attack - applies weapon attack bonus
        attack: (value) => isRemoving
            ? service.subtractAttack(Math.abs(value), true)
            : service.addAttack(value, true),

        // Flat main stat - converts to stat damage (100 main stat = 1% stat damage)
        mainStat: (value) => service.addMainStat(isRemoving ? -Math.abs(value) : value),

        // Main stat % with diminishing returns
        statDamage: (value) => service.addMainStatPct(isRemoving ? -Math.abs(value) : value),

        // Multiplicative stat (Final Damage) - for removal, we need special handling
        // Since multiplicative stats can't be easily reversed, we use subtractStat for removal
        finalDamage: (value) => {
            if (isRemoving) {
                service.subtractStat('finalDamage', value);
            } else {
                service.addMultiplicativeStat('finalDamage', value);
            }
        },

        // Diminishing returns stats - for removal, use subtractStat
        attackSpeed: (value) => {
            if (isRemoving) {
                service.subtractStat('attackSpeed', value);
            } else {
                service.addDiminishingReturnStat('attackSpeed', value, 150);
            }
        },
        defPenMultiplier: (value) => {
            if (isRemoving) {
                service.subtractStat('defPenMultiplier', value);
            } else {
                service.addDiminishingReturnStat('defPenMultiplier', value, 100);
            }
        }
    };

    // Apply each effect using the appropriate method
    Object.entries(effects).forEach(([statKey, value]) => {
        if (value === 0 || value === undefined || value === null) return;

        // Use type-specific handler if available, otherwise default to percentage stat
        if (statTypes[statKey]) {
            statTypes[statKey](value);
        } else {
            // Default: treat as additive percentage stat
            const adjustedValue = isRemoving ? -Math.abs(value) : value;
            service.addPercentageStat(statKey, adjustedValue);
        }
    });

    return service;
}

/**
 * Calculate DPS difference between two effect sets
 * @param {Object} currentEffects - Currently equipped effects (to be removed)
 * @param {Object} newEffects - New effects to apply
 * @param {string} monsterType - 'boss' or 'normal'
 * @returns {Object} DPS comparison results
 */
export function calculateDpsDifference(currentEffects, newEffects, monsterType = 'boss') {
    // Get base stats (which already include current effects)
    const baseStats = getStats('base');

    // Calculate stats without current effects (clean baseline)
    // Start from baseStats and remove current effects
    const baselineService = new StatCalculationService(baseStats, null);
    applyEffectsToService(baselineService, currentEffects, true); // true = removing
    const baselineDps = baselineService.computeDPS(monsterType);

    // Calculate current preset DPS (baseStats already include current effects)
    const currentService = new StatCalculationService(baseStats, null);
    const currentPresetDps = currentService.computeDPS(monsterType);

    // Calculate stats with new effects
    // Start from baseline (no effects) and add new effects
    const newService = new StatCalculationService(baseStats, null);
    applyEffectsToService(newService, currentEffects, true); // Remove current first
    applyEffectsToService(newService, newEffects, false);    // Then add new
    const newPresetDps = newService.computeDPS(monsterType);

    // Calculate gains relative to baseline
    const currentPresetGain = currentPresetDps - baselineDps;
    const newPresetGain = newPresetDps - baselineDps;

    // Calculate absolute percentage difference (in percentage points)
    // This shows the direct difference between the two presets' gains over baseline
    const dpsGain = baselineDps > 0 ? ((newPresetGain - currentPresetGain) / baselineDps) * 100 : 0;

    return {
        baselineDps,
        currentPresetDps,
        newPresetDps,
        currentPresetGain,
        newPresetGain,
        dpsGain
    };
}

/**
 * Calculate DPS for both boss and normal targets
 * @param {Object} currentEffects - Currently equipped effects
 * @param {Object} newEffects - New effects to apply
 * @returns {Object} Results for both target types
 */
export function calculateBothDpsDifferences(currentEffects, newEffects) {
    const bossResults = calculateDpsDifference(currentEffects, newEffects, 'boss');
    const normalResults = calculateDpsDifference(currentEffects, newEffects, 'normal');

    return {
        boss: bossResults,
        normal: normalResults
    };
}

/**
 * Check if a preset has at least one slot filled
 * @param {Object} preset - Preset object with main and subs
 * @returns {boolean} True if at least one slot has a companion
 */
export function presetHasAnyCompanion(preset) {
    if (!preset) return false;
    if (preset.main) return true;
    if (preset.subs && preset.subs.some(sub => sub)) return true;
    return false;
}

/**
 * Calculate the total value of a specific stat across all companions in a preset
 * @param {Object} preset - Preset object
 * @param {string} targetStat - The stat to sum (e.g., 'bossDamage', 'normalDamage')
 * @param {Function} getCompanionEffects - Function to get companion effects
 * @param {Function} getCompanion - Function to get companion data
 * @returns {number} Total value of the target stat
 */
export function calculatePresetStatValue(preset, targetStat, getCompanionEffects, getCompanion) {
    if (!preset) return 0;

    let total = 0;
    const allSlots = [preset.main, ...preset.subs];

    allSlots.forEach(companionKey => {
        if (!companionKey) return;

        const [className, rarity] = companionKey.split('-');
        const companionData = getCompanion(companionKey);

        if (!companionData.unlocked) return;

        const level = companionData.level || 1;
        const effects = getCompanionEffects(className, rarity, level);

        if (effects && effects.equipEffect && effects.equipEffect[targetStat]) {
            total += effects.equipEffect[targetStat];
        }
    });

    return total;
}

/**
 * Generate optimal preset for a specific target by calculating actual DPS
 * @param {string} targetStat - The stat to maximize ('bossDamage' or 'normalDamage')
 * @param {Object} getCompanionEffects - Function to get companion effects
 * @param {Object} getCompanion - Function to get companion data
 * @param {number} maxLevel - Max companion level
 * @param {string|null} lockedMainCompanion - Companion key to force as main, or null to optimize all slots
 * @returns {Object} Optimal preset with main and subs filled
 */
export function generateOptimalPreset(targetStat, getCompanionEffects, getCompanion, getMaxCompanionLevel, lockedMainCompanion = null) {
    const classes = ['Hero', 'DarkKnight', 'ArchMageIL', 'ArchMageFP', 'BowMaster', 'Marksman', 'NightLord', 'Shadower'];
    const rarities = ['Legendary', 'Unique', 'Epic'];

    // Determine monster type from target stat
    const monsterType = targetStat === 'bossDamage' ? 'boss' : 'normal';

    // Collect all unlocked companions with their data
    const unlockedCompanions = [];

    rarities.forEach(rarity => {
        classes.forEach(className => {
            const companionKey = `${className}-${rarity}`;
            const companionData = getCompanion(companionKey);

            // Only consider unlocked companions
            if (!companionData.unlocked) return;

            const level = companionData.level || getMaxCompanionLevel();
            const effects = getCompanionEffects(className, rarity, level);

            if (!effects || !effects.equipEffect) return;

            unlockedCompanions.push({
                companionKey,
                effects: effects.equipEffect
            });
        });
    });

    // If no unlocked companions, return empty preset
    if (unlockedCompanions.length === 0) {
        return { main: null, subs: [null, null, null, null, null, null] };
    }

    // Get base stats for DPS calculation
    const baseStats = getStats('base');
    let bestDps = 0;
    let bestPreset = { main: null, subs: [null, null, null, null, null, null] };

    // Helper function to generate combinations
    function* generateCombinations(companions, size, start = 0) {
        if (size === 0) {
            yield [];
            return;
        }
        for (let i = start; i < companions.length; i++) {
            for (const rest of generateCombinations(companions, size - 1, i + 1)) {
                yield [companions[i], ...rest];
            }
        }
    }

    // Handle locked main companion case
    if (lockedMainCompanion) {
        // Validate locked main is still unlocked
        const lockedMainData = unlockedCompanions.find(c => c.companionKey === lockedMainCompanion);
        if (!lockedMainData) {
            // Locked main is no longer valid, return empty preset
            return { main: null, subs: [null, null, null, null, null, null] };
        }

        // Filter out the locked main from sub candidates (can't duplicate)
        const subCandidates = unlockedCompanions.filter(c => c.companionKey !== lockedMainCompanion);

        // For performance, limit to reasonable number of combinations
        const maxCombinationsToTest = 50000;
        let combinationsTested = 0;

        // Test each combination of 6 subs (main is locked)
        for (const subCombination of generateCombinations(subCandidates, 6)) {
            combinationsTested++;
            if (combinationsTested > maxCombinationsToTest) {
                console.warn(`Reached max combinations limit (${maxCombinationsToTest}), using best found so far`);
                break;
            }

            // Calculate total effects for this preset
            const totalEffects = {};

            // Add locked main companion effects
            Object.entries(lockedMainData.effects).forEach(([stat, value]) => {
                totalEffects[stat] = (totalEffects[stat] || 0) + value;
            });

            // Add sub companion effects
            subCombination.forEach(comp => {
                Object.entries(comp.effects).forEach(([stat, value]) => {
                    totalEffects[stat] = (totalEffects[stat] || 0) + value;
                });
            });

            // Apply effects to base stats and calculate DPS
            const service = new StatCalculationService(baseStats, null);
            applyEffectsToService(service, totalEffects, false);
            const dps = service.computeDPS(monsterType);

            // Track best
            if (dps > bestDps) {
                bestDps = dps;
                bestPreset = {
                    main: lockedMainCompanion,
                    subs: subCombination.map(c => c.companionKey)
                };
            }
        }
    } else {
        // No locked main - test all 7 slots
        // For performance, limit to reasonable number of combinations
        const maxCombinationsToTest = 50000;
        let combinationsTested = 0;

        // Test each combination of 7 companions
        for (const combination of generateCombinations(unlockedCompanions, 7)) {
            combinationsTested++;
            if (combinationsTested > maxCombinationsToTest) {
                console.warn(`Reached max combinations limit (${maxCombinationsToTest}), using best found so far`);
                break;
            }

            // First companion is main, rest are subs
            const mainCompanion = combination[0];
            const subCompanions = combination.slice(1);

            // Calculate total effects for this preset
            const totalEffects = {};

            // Add main companion effects
            Object.entries(mainCompanion.effects).forEach(([stat, value]) => {
                totalEffects[stat] = (totalEffects[stat] || 0) + value;
            });

            // Add sub companion effects
            subCompanions.forEach(comp => {
                Object.entries(comp.effects).forEach(([stat, value]) => {
                    totalEffects[stat] = (totalEffects[stat] || 0) + value;
                });
            });

            // Apply effects to base stats and calculate DPS
            const service = new StatCalculationService(baseStats, null);
            applyEffectsToService(service, totalEffects, false);
            const dps = service.computeDPS(monsterType);

            // Track best
            if (dps > bestDps) {
                bestDps = dps;
                bestPreset = {
                    main: mainCompanion.companionKey,
                    subs: subCompanions.map(c => c.companionKey)
                };
            }
        }
    }

    return bestPreset;
}
