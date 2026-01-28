/**
 * Pure logic layer for Companion System
 * Helper functions for calculating companion preset DPS differences and optimizations
 * No DOM dependencies - all functions are pure and testable
 */

import { StatCalculationService } from '@ts/services/stat-calculation-service.js';
import type {
    CompanionEffects,
    CompanionKey,
    CompanionPreset,
    CompanionPresetId,
    DpsComparisonResult,
    BothDpsResults,
    CompanionClass,
    CompanionData
} from '@ts/types/page/companions/companions.types';
import { COMPANION_STAT_KEY_TO_STAT_ID } from '@ts/types/page/companions/companions.types';
import type { MonsterType, BaseStats } from '@ts/types';
import { loadoutStore } from '@ts/store/loadout.store';

// ============================================================================
// IGNORED STATS
// ============================================================================

/**
 * Stats that exist in companion data but should NOT be processed for DPS calculation.
 * These are either non-DPS stats (like MaxHp) or stats not supported by StatCalculationService.
 */
const IGNORED_STATS = new Set<string>([
    'damageInCc',      // Damage in Chaos Chrono - not a DPS stat
    'MaxHp',           // Max HP - survivability, not DPS
    'MaxHpR',          // Max HP % - survivability, not DPS
    'HitChance',       // Hit chance - accuracy, not directly DPS
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Smart routing helper to apply effects to a StatCalculationService
 * Intelligently routes each stat key to the correct chainable method based on stat type
 *
 * @param service - The service instance
 * @param effects - Effects object with stat-value pairs
 * @param isRemoving - If true, subtract the effects (for removing current effects)
 * @returns Returns the service for chaining
 */
function applyEffectsToService(
    service: StatCalculationService,
    effects: Record<string, number>,
    isRemoving: boolean = false
): StatCalculationService {
    if (!effects) return service;

    // Stat type mappings for proper routing to chainable methods
    const statTypes: Record<string, (value: number) => void> = {
        // Flat attack - applies weapon attack bonus
        attack: (value) => isRemoving
            ? service.subtract('attack', Math.abs(value))
            : service.add('attack', value),

        // Flat main stat - converts to stat damage (100 main stat = 1% stat damage)
        mainStat: (value) => service.add('mainStat', isRemoving ? -Math.abs(value) : value),

        // Main stat % with diminishing returns
        statDamage: (value) => service.add('mainStatPct', isRemoving ? -Math.abs(value) : value),

        // Multiplicative stat (Final Damage) - for removal, we use subtract
        finalDamage: (value) => {
            if (isRemoving) {
                service.subtract('finalDamage', value);
            } else {
                service.add('finalDamage', value);
            }
        },

        // Diminishing returns stats - for removal, use subtract
        attackSpeed: (value) => {
            if (isRemoving) {
                service.subtract('attackSpeed', value);
            } else {
                service.add('attackSpeed', value);
            }
        },
        defPenMultiplier: (value) => {
            if (isRemoving) {
                service.subtract('defPenMultiplier', value);
            } else {
                service.add('defPenMultiplier', value);
            }
        }
    };

    // Apply each effect using the appropriate method
    Object.entries(effects).forEach(([statKey, value]) => {
        if (value === 0 || value === undefined || value === null) return;

        // Skip stats that are not relevant for DPS calculation
        if (IGNORED_STATS.has(statKey)) {
            return;
        }

        // Use type-specific handler if available
        if (statTypes[statKey]) {
            statTypes[statKey](value);
        } else {
            // Check if stat has a valid mapping before attempting to add
            const mappedId = COMPANION_STAT_KEY_TO_STAT_ID[statKey];
            if (mappedId) {
                const adjustedValue = isRemoving ? -Math.abs(value) : value;
                service.add(mappedId, adjustedValue);
            } else {
                // Unknown stat - log for debugging but don't throw
                console.debug(`[applyEffectsToService] Unknown companion stat key: ${statKey}, skipping`);
            }
        }
    });

    return service;
}

// ============================================================================
// DPS CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate DPS difference between two effect sets
 * @param currentEffects - Currently equipped effects (to be removed)
 * @param newEffects - New effects to apply
 * @param monsterType - 'boss' or 'normal'
 * @returns DPS comparison results
 */
export function calculateDpsDifference(
    currentEffects: Record<string, number>,
    newEffects: Record<string, number>,
    monsterType: MonsterType = 'boss'
): DpsComparisonResult {
    // Get base stats (which already include current effects)
    const baseStats = loadoutStore.getBaseStats();

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
 * @param currentEffects - Currently equipped effects
 * @param newEffects - New effects to apply
 * @returns Results for both target types
 */
export function calculateBothDpsDifferences(
    currentEffects: Record<string, number>,
    newEffects: Record<string, number>
): BothDpsResults {
    const bossResults = calculateDpsDifference(currentEffects, newEffects, 'boss');
    const normalResults = calculateDpsDifference(currentEffects, newEffects, 'normal');

    return {
        boss: bossResults,
        normal: normalResults
    };
}

// ============================================================================
// PRESET MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Check if a preset has at least one slot filled
 * @param preset - Preset object with main and subs
 * @returns True if at least one slot has a companion
 */
export function presetHasAnyCompanion(preset: CompanionPreset): boolean {
    if (!preset) return false;
    if (preset.main) return true;
    if (preset.subs && preset.subs.some(sub => sub)) return true;
    return false;
}

/**
 * Calculate the total value of a specific stat across all companions in a preset
 * @param preset - Preset object
 * @param targetStat - The stat to sum (e.g., 'bossDamage', 'normalDamage')
 * @param getCompanionEffects - Function to get companion effects
 * @param getCompanion - Function to get companion data
 * @returns Total value of the target stat
 */
export function calculatePresetStatValue(
    preset: CompanionPreset,
    targetStat: string,
    getCompanionEffects: (className: CompanionClass, rarity: string, level: number) => CompanionEffects | null,
    getCompanion: (key: CompanionKey) => CompanionData
): number {
    if (!preset) return 0;

    let total = 0;
    const allSlots: (CompanionKey | null)[] = [preset.main, ...preset.subs];

    allSlots.forEach(companionKey => {
        if (!companionKey) return;

        const [className, rarity] = companionKey.split('-');
        const companionData = getCompanion(companionKey);

        if (!companionData.unlocked) return;

        const level = companionData.level || 1;
        const effects = getCompanionEffects(className as CompanionClass, rarity, level);

        if (effects && effects.equipEffect && effects.equipEffect[targetStat]) {
            total += effects.equipEffect[targetStat];
        }
    });

    return total;
}

/**
 * Generate optimal preset for a specific target using optimized 3-phase algorithm
 * @param targetStat - The stat to maximize ('bossDamage' or 'normalDamage')
 * @param getCompanionEffects - Function to get companion effects
 * @param getCompanion - Function to get companion data
 * @param getMaxCompanionLevel - Function to get max companion level
 * @param lockedMainCompanion - Companion key to force as main, or null to optimize all slots
 * @returns Optimal preset with main and subs filled
 */
export function generateOptimalPreset(
    targetStat: 'bossDamage' | 'normalDamage',
    getCompanionEffects: (className: CompanionClass, rarity: string, level: number) => CompanionEffects | null,
    getCompanion: (key: CompanionKey) => CompanionData,
    getMaxCompanionLevel: () => number,
    lockedMainCompanion: CompanionKey | null = null
): CompanionPreset {
    // Exclude classes that will never be optimal: DarkKnight, Marksman
    const classes: CompanionClass[] = ['Hero', 'ArchMageIL', 'ArchMageFP', 'BowMaster', 'NightLord', 'Shadower'];
    // Only consider Legendary, Unique, Epic (Normal and Rare are never optimal)
    const rarities = ['Legendary', 'Unique', 'Epic'];

    // Determine monster type from target stat
    const monsterType: MonsterType = targetStat === 'bossDamage' ? 'boss' : 'normal';

    // Collect all unlocked companions with their data
    interface UnlockedCompanion {
        companionKey: CompanionKey;
        effects: Record<string, number>;
    }

    const unlockedCompanions: UnlockedCompanion[] = [];

    rarities.forEach(rarity => {
        classes.forEach(className => {
            const companionKey: CompanionKey = `${className}-${rarity}` as CompanionKey;
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

    // Handle locked main companion case
    let lockedMain: UnlockedCompanion | null = null;
    if (lockedMainCompanion) {
        const lockedMainData = unlockedCompanions.find(c => c.companionKey === lockedMainCompanion);
        if (!lockedMainData) {
            // Locked main is no longer valid, return empty preset
            console.warn(`[generateOptimalPreset] Locked main companion ${lockedMainCompanion} not found or not unlocked`);
            return { main: null, subs: [null, null, null, null, null, null] };
        }
        lockedMain = lockedMainData;
        // Remove locked main from candidates (can't duplicate)
        const lockedIndex = unlockedCompanions.indexOf(lockedMainData);
        unlockedCompanions.splice(lockedIndex, 1);
    }

    // Check if we have enough companions to fill all slots
    const minRequired = lockedMain ? 6 : 7;
    if (unlockedCompanions.length < minRequired) {
        console.warn(`[generateOptimalPreset] Only ${unlockedCompanions.length} companions available, filling all available slots`);
        const allKeys = unlockedCompanions.map(c => c.companionKey);
        if (lockedMain) {
            return {
                main: lockedMain.companionKey,
                subs: [
                    allKeys[0] || null,
                    allKeys[1] || null,
                    allKeys[2] || null,
                    allKeys[3] || null,
                    allKeys[4] || null,
                    allKeys[5] || null
                ]
            };
        } else {
            return {
                main: allKeys[0] || null,
                subs: [
                    allKeys[1] || null,
                    allKeys[2] || null,
                    allKeys[3] || null,
                    allKeys[4] || null,
                    allKeys[5] || null,
                    allKeys[6] || null
                ]
            };
        }
    }

    // Get base stats for DPS calculation
    const baseStats = loadoutStore.getBaseStats();
    const baselineService = new StatCalculationService(baseStats, null);
    const baselineDps = baselineService.computeDPS(monsterType);

    // Helper function to generate combinations
    function* generateCombinations(companions: UnlockedCompanion[], size: number, start: number = 0): Generator<UnlockedCompanion[]> {
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

    // =========================================================================
    // PHASE 1: Individual companion scoring
    // =========================================================================

    interface ScoredCompanion {
        companion: UnlockedCompanion;
        individualDps: number;
        dpsGain: number;
    }

    const scoredCompanions: ScoredCompanion[] = unlockedCompanions.map(comp => {
        const service = new StatCalculationService(baseStats, null);
        applyEffectsToService(service, comp.effects, false);
        const dps = service.computeDPS(monsterType);
        const gain = dps - baselineDps;

        return {
            companion: comp,
            individualDps: dps,
            dpsGain: gain
        };
    });

    // Sort by individual DPS contribution
    scoredCompanions.sort((a, b) => b.dpsGain - a.dpsGain);

    // =========================================================================
    // PHASE 2: Smart locking based on marginal gains
    // =========================================================================

    const locked: ScoredCompanion[] = [];
    const pool = [...scoredCompanions];

    // Lock top performers with adaptive threshold
    let prevGain = Infinity;
    const MIN_LOCKED = 2; // Lock at least 2 clear winners
    const MAX_LOCKED = 4; // Lock at most 4 (leave room for optimization)
    const MARGINAL_GAIN_THRESHOLD = 0.6; // Lock if > 60% of previous companion's value
    const MIN_GAIN_PERCENT = 0.008; // Must provide at least 0.8% gain to be locked

    for (let i = 0; i < scoredCompanions.length && locked.length < MAX_LOCKED; i++) {
        const score = scoredCompanions[i];
        const gainPercent = score.dpsGain / baselineDps;

        const shouldLock =
            locked.length < MIN_LOCKED || // Always lock at least 2
            score.dpsGain > prevGain * MARGINAL_GAIN_THRESHOLD || // High marginal value
            gainPercent > MIN_GAIN_PERCENT; // Above minimum threshold

        if (shouldLock) {
            locked.push(score);
            pool.splice(pool.indexOf(score), 1);
            prevGain = score.dpsGain;
        }
    }

    // Track selected companion keys to prevent duplicates
    const selectedKeys = new Set<CompanionKey>();
    if (lockedMain) {
        selectedKeys.add(lockedMain.companionKey);
    }
    locked.forEach(s => selectedKeys.add(s.companion.companionKey));

    // =========================================================================
    // PHASE 3: Restricted combination testing
    // =========================================================================

    // Take top 12-15 from pool for final permutation
    const POOL_SIZE = Math.min(15, unlockedCompanions.length);
    const candidates = locked.concat(pool.slice(0, Math.min(POOL_SIZE - locked.length, pool.length)));

    // Need to select 7 total (or 6 if main is locked)
    const totalSlots = lockedMain ? 6 : 7;
    const numToSelect = totalSlots - locked.length;

    // CRITICAL: Filter out companions already selected (by key comparison) to prevent duplicates
    const remaining: UnlockedCompanion[] = candidates
        .slice(locked.length)
        .map(s => s.companion)
        .filter(comp => !selectedKeys.has(comp.companionKey));

    let bestDps = 0;
    let bestPreset: CompanionPreset = { main: null, subs: [null, null, null, null, null, null] };

    const service = new StatCalculationService(baseStats, null);
    let combinationsTested = 0;
    const maxCombinations = 15000; // Reasonable limit for Phase 3

    // Helper to calculate DPS for a combination
    const calculateDpsForCombination = (companions: UnlockedCompanion[]): number => {
        const totalEffects: Record<string, number> = {};

        companions.forEach(comp => {
            Object.entries(comp.effects).forEach(([stat, value]) => {
                totalEffects[stat] = (totalEffects[stat] || 0) + value;
            });
        });

        service.reset();
        applyEffectsToService(service, totalEffects, false);
        return service.computeDPS(monsterType);
    };

    // Generate combinations of remaining slots
    for (const combination of generateCombinations(remaining, numToSelect)) {
        combinationsTested++;
        if (combinationsTested > maxCombinations) {
            console.warn(`[Phase 3] Reached max combinations limit (${maxCombinations}), using best found so far`);
            break;
        }

        // Combine locked + new combination
        let fullSelection: UnlockedCompanion[];
        if (lockedMain) {
            // Include locked main + locked from Phase 2 + new combination
            fullSelection = [lockedMain, ...locked.map(s => s.companion), ...combination];
        } else {
            fullSelection = locked.map(s => s.companion).concat(combination);
        }

        // Calculate DPS
        const dps = calculateDpsForCombination(fullSelection);

        if (dps > bestDps) {
            bestDps = dps;

            // If main is locked, it should be the main slot
            if (lockedMain) {
                // fullSelection = [lockedMain, ...6 subs]
                // Skip first element (locked main) when creating subs array
                bestPreset = {
                    main: lockedMain.companionKey,
                    subs: fullSelection.slice(1).map(c => c.companionKey) as [
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null
                    ]
                };
            } else {
                // First companion is main, rest are subs
                bestPreset = {
                    main: fullSelection[0].companionKey,
                    subs: fullSelection.slice(1).map(c => c.companionKey) as [
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null,
                        CompanionKey | null
                    ]
                };
            }
        }
    }

    const totalGainPercent = ((bestDps - baselineDps) / baselineDps * 100);

    return bestPreset;
}

// ============================================================================
// PRESET SWAP HELPER
// ============================================================================

/**
 * Swap companion preset effects using StatCalculationService
 *
 * This function calculates new base stats by removing current companion effects
 * and adding new companion effects, using the proper StatCalculationService methods
 * to handle stat-specific logic (weapon bonuses, diminishing returns, etc.)
 *
 * @param currentEffects - Currently equipped companion effects (to remove)
 * @param newEffects - New preset effects (to add)
 * @returns New base stats object to persist via loadoutStore.updateBaseStats()
 *
 * @example
 * // When switching presets with user confirmation that stats are incorporated
 * const newStats = swapCompanionPresetEffects(currentPresetEffects, newPresetEffects);
 * loadoutStore.updateBaseStats(newStats);
 */
export function swapCompanionPresetEffects(
    currentEffects: Record<string, number>,
    newEffects: Record<string, number>
): BaseStats {
    // 1. Get current base stats from loadoutStore
    const baseStats = loadoutStore.getBaseStats();

    // 2. Create StatCalculationService instance with fresh stats
    const service = new StatCalculationService(baseStats, null);

    // 3. Subtract current effects
    Object.entries(currentEffects).forEach(([statKey, value]) => {
        if (value === 0 || value === undefined || value === null) return;

        const mappedId = COMPANION_STAT_KEY_TO_STAT_ID[statKey];
        if (!mappedId) {
            console.warn(`[swapCompanionPresetEffects] Unknown companion stat key: ${statKey}, skipping removal`);
            return;
        }

        service.subtract(mappedId, value);
    });

    // 4. Add new effects
    Object.entries(newEffects).forEach(([statKey, value]) => {
        if (value === 0 || value === undefined || value === null) return;

        const mappedId = COMPANION_STAT_KEY_TO_STAT_ID[statKey];
        if (!mappedId) {
            console.warn(`[swapCompanionPresetEffects] Unknown companion stat key: ${statKey}, skipping addition`);
            return;
        }

        service.add(mappedId, value);
    });

    // 5. Return the modified stats
    return service.getStats();
}
