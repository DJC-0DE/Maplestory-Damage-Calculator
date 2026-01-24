/**
 * Inner Ability Core Logic
 *
 * Pure calculation functions for inner ability stat mapping,
 * preset comparisons, and theoretical best calculations.
 */

import { innerAbilitiesData } from '@data/inner-ability-data.js';
import { gearLabStore } from '@ts/store/gear-lab-store.js';
import { StatCalculationService } from '@ts/services/stat-calculation-service.js';
import type { InnerAbilityLine, PresetComparisonResult, TheoreticalRollResult, BestCombinationResult } from '@ts/types/page/gear-lab/gear-lab.types.js';
import type { BaseStats } from '@ts/types/loadout.js';

// ============================================================================
// STAT MAPPING
// ============================================================================

/**
 * Map an inner ability stat to base stats using StatCalculationService
 * @param statName - Name of the stat (e.g., "Boss Monster Damage")
 * @param value - Value of the stat
 * @param baseStats - Base stats to modify
 * @returns Modified base stats
 */
export function mapInnerAbilityStat(statName: string, value: number, baseStats: BaseStats): BaseStats {
    const service = new StatCalculationService(baseStats);

    switch (statName) {
        case 'Attack Speed':
            // Attack Speed uses diminishing returns with factor 150
            service.addDiminishingReturnStat('attackSpeed', value, 150);
            break;
        case 'Boss Monster Damage':
            service.addPercentageStat('bossDamage', value);
            break;
        case 'Critical Rate':
            service.addPercentageStat('critRate', value);
            break;
        case 'Damage':
            service.addPercentageStat('damage', value);
            break;
        case 'Defense Penetration':
            // Defense Penetration uses diminishing returns with factor 100
            service.addDiminishingReturnStat('defPen', value, 100);
            break;
        case 'Min Damage Multiplier':
            service.addPercentageStat('minDamage', value);
            break;
        case 'Max Damage Multiplier':
            service.addPercentageStat('maxDamage', value);
            break;
        case 'Normal Monster Damage':
            service.addPercentageStat('normalDamage', value);
            break;
        case 'Main Stat':
            // Convert Main Stat to Stat Damage % at 100:1 ratio
            service.addMainStat(value);
            break;
        // Ignored stats: Max HP, Max MP, Accuracy, Evasion, MP Recovery Per Sec,
        // Meso Drop, EXP Gain, Debuff Tolerance, Critical Resistance,
        // Damage Tolerance, Damage Taken Decrease
        default:
            // No effect on damage
            break;
    }

    return service.getStats();
}

/**
 * Apply multiple inner ability lines to base stats
 * @param baseStats - Base stats to modify
 * @param lines - Array of inner ability lines
 * @returns Modified base stats
 */
export function applyInnerAbilityLines(baseStats: BaseStats, lines: InnerAbilityLine[]): BaseStats {
    let modifiedStats = { ...baseStats };

    lines.forEach(line => {
        if (line.stat && line.value) {
            modifiedStats = mapInnerAbilityStat(line.stat, line.value, modifiedStats);
        }
    });

    return modifiedStats;
}

// ============================================================================
// BASELINE CALCULATIONS
// ============================================================================

/**
 * Get baseline stats (base minus equipped inner ability lines)
 * @returns Baseline stats
 */
export function getBaselineStats(): BaseStats {
    // Get base stats from global getStats function
    const baseStats = (window as any).getStats ? (window as any).getStats('base') : {};
    const equippedPresetId = gearLabStore.getEquippedPresetId();

    let baseline = { ...baseStats };

    if (equippedPresetId !== null) {
        const equippedPreset = gearLabStore.getPreset(equippedPresetId);
        if (equippedPreset) {
            equippedPreset.lines.forEach(line => {
                baseline = mapInnerAbilityStat(line.stat, -line.value, baseline);
            });
        }
    }

    return baseline;
}

// ============================================================================
// PRESET COMPARISON CALCULATIONS
// ============================================================================

/**
 * Get all configured presets from store
 * @returns Array of preset data
 */
export function getAllPresets(): Array<{ id: number; isEquipped: boolean; lines: InnerAbilityLine[] }> {
    const presets = gearLabStore.getInnerAbilityPresets();
    return Object.values(presets);
}

/**
 * Calculate preset comparison data
 * @returns Array of preset comparison results sorted by boss DPS gain
 */
export function calculatePresetComparisons(): PresetComparisonResult[] {
    const presets = getAllPresets();

    if (presets.length === 0) {
        return [];
    }

    // Calculate baseline (base stats without equipped IA)
    const baseline = getBaselineStats();

    // Calculate baseline damage using StatCalculationService
    const baselineService = new StatCalculationService(baseline);
    const baselineBossDamage = baselineService.compute('boss');
    const baselineNormalDamage = baselineService.compute('normal');

    const comparisons: PresetComparisonResult[] = [];

    presets.forEach(preset => {
        // Apply this preset's stats to baseline
        const presetStats = applyInnerAbilityLines(baseline, preset.lines);

        // Calculate damage with this preset using StatCalculationService
        const presetService = new StatCalculationService(presetStats);
        const presetBossDamage = presetService.compute('boss');
        const presetNormalDamage = presetService.compute('normal');

        // Calculate DPS gains
        const bossDPSGain = presetBossDamage.dps - baselineBossDamage.dps;
        const normalDPSGain = presetNormalDamage.dps - baselineNormalDamage.dps;

        // Calculate line-by-line contributions
        const lineContributions = preset.lines.map((line, index) => {
            // Calculate damage without this line
            const linesWithoutCurrent = preset.lines.filter((_, i) => i !== index);
            const statsWithoutLine = applyInnerAbilityLines(baseline, linesWithoutCurrent);
            const withoutLineService = new StatCalculationService(statsWithoutLine);
            const damageWithoutLine = withoutLineService.compute('boss');

            // Calculate damage with this line
            const linesWithLine = [...linesWithoutCurrent, line];
            const statsWithLine = applyInnerAbilityLines(baseline, linesWithLine);
            const withLineService = new StatCalculationService(statsWithLine);
            const damageWithLine = withLineService.compute('boss');

            const contribution = damageWithLine.dps - damageWithoutLine.dps;

            return {
                stat: line.stat,
                value: line.value,
                dpsContribution: contribution
            };
        });

        comparisons.push({
            id: preset.id,
            isEquipped: preset.isEquipped,
            lines: preset.lines,
            bossDPSGain,
            normalDPSGain,
            lineContributions
        });
    });

    // Sort by boss DPS gain (descending)
    comparisons.sort((a, b) => b.bossDPSGain - a.bossDPSGain);

    return comparisons;
}

// ============================================================================
// THEORETICAL BEST CALCULATIONS
// ============================================================================

/**
 * Calculate all theoretical stat possibilities
 * @returns Array of theoretical roll results sorted by DPS gain
 */
export function calculateTheoreticalBest(): TheoreticalRollResult[] {
    const results: TheoreticalRollResult[] = [];

    // Get baseline stats
    const baseline = getBaselineStats();

    // Calculate baseline damage using StatCalculationService
    const baselineService = new StatCalculationService(baseline);
    const baselineBossDamage = baselineService.compute('boss');

    // Iterate through each rarity and stat
    Object.entries(innerAbilitiesData).forEach(([rarity, rarityData]) => {
        Object.entries(rarityData).forEach(([statName, range]) => {
            // Skip lineRate property
            if (statName === 'lineRate') return;

            const { min, max } = range as { min: number; max: number };
            const mid = (min + max) / 2;

            // Calculate DPS for min, mid, max rolls
            [
                { roll: 'Min' as const, value: min },
                { roll: 'Mid' as const, value: mid },
                { roll: 'Max' as const, value: max }
            ].forEach(({ roll, value }) => {
                const modifiedStats = mapInnerAbilityStat(statName, value, baseline);
                const testService = new StatCalculationService(modifiedStats);
                const damage = testService.compute('boss');
                const dpsGain = damage.dps - baselineBossDamage.dps;
                const percentIncrease = dpsGain / baselineBossDamage.dps * 100;

                results.push({
                    stat: statName,
                    rarity,
                    roll,
                    value,
                    dpsGain,
                    percentIncrease
                });
            });
        });
    });

    // Sort by DPS gain (descending) and filter out zero/negative gains
    results.sort((a, b) => b.dpsGain - a.dpsGain);

    // Only return stats that actually increase damage
    return results.filter(r => r.dpsGain > 0);
}

/**
 * Calculate best possible combinations
 * @returns Object containing best combinations for different scenarios
 */
export function calculateBestCombinations(): {
    uniqueOnly: BestCombinationResult;
    uniqueLegendary: BestCombinationResult;
    mysticLegendaryUnique: BestCombinationResult;
    allRarities: BestCombinationResult;
} {
    const baseline = getBaselineStats();

    // Calculate baseline damage using StatCalculationService
    const baselineService = new StatCalculationService(baseline);
    const baselineBossDamage = baselineService.compute('boss');

    // Get all possible stats with their max values
    const allPossibleStats: Array<{ stat: string; rarity: string; value: number; rarityOrder: number }> = [];
    Object.entries(innerAbilitiesData).forEach(([rarity, rarityData]) => {
        Object.entries(rarityData).forEach(([statName, range]) => {
            // Skip lineRate property
            if (statName === 'lineRate') return;

            const { max } = range as { min: number; max: number };
            allPossibleStats.push({
                stat: statName,
                rarity,
                value: max,
                rarityOrder: { 'Mystic': 5, 'Ancient': 4, 'Legendary': 3, 'Unique': 2, 'Epic': 1, 'Rare': 0, 'Normal': 0 }[rarity] || 0
            });
        });
    });

    // Iteratively find best lines accounting for diminishing returns
    function findBestLines(maxLines: number, allowedRarities: string[]): BestCombinationResult {
        const selectedLines: Array<{ stat: string; rarity: string; value: number; dpsGain: number }> = [];
        let currentStats = { ...baseline };

        for (let i = 0; i < maxLines; i++) {
            let bestLine: { stat: string; rarity: string; value: number; dpsGain: number } | null = null;
            let bestDPSGain = 0;

            // Filter by allowed rarities
            const candidateStats = allPossibleStats.filter(s => allowedRarities.includes(s.rarity));

            // Test each possible stat to see which gives the best gain
            candidateStats.forEach(candidate => {
                const testStats = mapInnerAbilityStat(candidate.stat, candidate.value, currentStats);
                const testService = new StatCalculationService(testStats);
                const currentService = new StatCalculationService(currentStats);
                const testDamage = testService.compute('boss');
                const currentDamage = currentService.compute('boss');
                const dpsGain = testDamage.dps - currentDamage.dps;

                if (dpsGain > bestDPSGain) {
                    bestDPSGain = dpsGain;
                    bestLine = { ...candidate, dpsGain };
                }
            });

            if (bestLine) {
                selectedLines.push(bestLine);
                // Update current stats to include this line for next iteration
                currentStats = mapInnerAbilityStat(bestLine.stat, bestLine.value, currentStats);
            }
        }

        // Calculate total DPS using StatCalculationService
        const finalService = new StatCalculationService(currentStats);
        const finalDamage = finalService.compute('boss');
        const totalDPS = finalDamage.dps - baselineBossDamage.dps;

        return { lines: selectedLines, totalDPS };
    }

    // Scenario 1: Best with Unique only (3 lines)
    const uniqueOnly = findBestLines(3, ['Unique']);

    // Scenario 2: Best with Unique + Legendary (up to 5 lines)
    const uniqueLegendary = findBestLines(5, ['Unique', 'Legendary']);

    // Scenario 3: Best with Unique + Legendary + Mystic (up to 6 lines)
    const mysticLegendaryUnique = findBestLines(6, ['Mystic', 'Legendary', 'Unique']);

    // Scenario 4: Best with all rarities (6 lines)
    const allRarities = findBestLines(6, ['Mystic', 'Legendary', 'Unique', 'Epic', 'Rare', 'Normal']);

    return {
        uniqueOnly,
        uniqueLegendary,
        mysticLegendaryUnique,
        allRarities
    };
}
