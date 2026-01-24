/**
 * Cube Potential - Core Logic
 * Business logic and orchestrator functions for the cube potential system
 */

import { StatCalculationService } from '@ts/services/stat-calculation-service.js';
import { loadoutStore } from '@ts/store/loadout.store';
import { STAT } from '@ts/types/constants';
import {
    CLASS_MAIN_STAT_MAP,
    SLOT_SPECIFIC_POTENTIALS,
    EQUIPMENT_POTENTIAL_DATA,
    SLOT_NAMES,
    NON_COMBAT_POTENTIAL_STATS,
    POTENTIAL_STAT_TO_STAT_ID
} from '@ts/page/cube-potential/cube-potential-data.js';
import type {
    CubeSlotId,
    PotentialType,
    PotentialLine,
    PotentialSet,
    Rarity,
    AllCubeSlotData,
    PotentialLineEntry
} from '@ts/types/page/gear-lab/gear-lab.types';
import type { BaseStats } from '@ts/types/loadout.js';

// ============================================================================
// STATE
// ============================================================================

/**
 * Current cube slot selection
 */
export let currentCubeSlot: CubeSlotId = 'helm';

/**
 * Current potential type selection
 */
export let currentPotentialType: PotentialType = 'regular';

/**
 * Rankings cache - stores calculated rankings by slot and rarity
 * Structure: rankingsCache[slotId][rarity] = RankingEntry[]
 */
export const rankingsCache: Record<CubeSlotId, Record<Rarity, RankingEntry[]>> = {} as any;

/**
 * Track which slot+rarity combinations are currently calculating
 */
export const rankingsInProgress: Record<string, boolean> = {};

/**
 * Ranking entry interface
 */
export interface RankingEntry {
    line1: PotentialLineEntry;
    line2: PotentialLineEntry;
    line3: PotentialLineEntry;
    dpsGain: number;
}

/**
 * Comparison result interface
 */
export interface ComparisonResult {
    setAGain: number;
    setBGain: number;
    setBAbsoluteGain: number;
    deltaGain: number;
    setAStats: any;
    setBStats: any;
    slotId: CubeSlotId;
    rarity: Rarity;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get rarity color for slot button borders
 */
export function getRarityColor(rarity: Rarity): string {
    const colors: Record<Rarity, string> = {
        'normal': '#9ca3af',      // Gray
        'rare': '#60a5fa',        // Blue
        'epic': '#a78bfa',        // Purple
        'unique': '#fbbf24',      // Yellow/Gold
        'legendary': '#33ce85',   // Green
        'mystic': '#ff3f42'       // Red
    };
    return colors[rarity] || colors['normal'];
}

/**
 * Get main stat for current class
 */
export function getMainStatForClass(): string | null {
    const selectedClass = loadoutStore.getSelectedClass();
    if (!selectedClass) return null;
    return CLASS_MAIN_STAT_MAP[selectedClass] || null;
}

/**
 * Get stat ID from potential stat name
 * Returns null if stat has no combat impact or cannot be mapped
 */
export function getStatIdFromPotentialStat(
    potentialStat: string,
    mainStat: string | null
): string | null {
    // Skip non-combat stats
    if (NON_COMBAT_POTENTIAL_STATS.includes(potentialStat as any)) {
        return null;
    }

    // Main stat % maps to statDamage
    if (mainStat && potentialStat === `${mainStat} %`) {
        return STAT.MAIN_STAT_PCT.id;
    }

    // Flat main stat (Str, Dex, Int, Luk without %) - signal to use addMainStat
    if (mainStat && potentialStat === mainStat) {
        return STAT.PRIMARY_MAIN_STAT.id; // Special marker for flat main stat
    }

    // Use the mapping table
    return POTENTIAL_STAT_TO_STAT_ID[potentialStat] || null;
}

/**
 * Check if a potential line exists in a given rarity for a given slot and line number
 */
export function lineExistsInRarity(
    slotId: CubeSlotId,
    rarity: Rarity,
    lineNum: number,
    lineStat: string,
    lineValue: number,
    linePrime: boolean
): boolean {
    if (!lineStat) return false;

    const potentialData = EQUIPMENT_POTENTIAL_DATA[rarity];
    if (!potentialData) return false;

    // Get base potential lines for this line number
    const lineKey = `line${lineNum}` as keyof typeof potentialData;
    let availableLines: PotentialLineEntry[] = [...(potentialData[lineKey] || [])];

    // Add slot-specific lines if available
    if (SLOT_SPECIFIC_POTENTIALS[slotId] && SLOT_SPECIFIC_POTENTIALS[slotId][rarity]) {
        const slotSpecificLines = SLOT_SPECIFIC_POTENTIALS[slotId][rarity][lineKey];
        if (slotSpecificLines) {
            availableLines = [...slotSpecificLines, ...availableLines];
        }
    }

    // Check if this exact line exists
    return availableLines.some(line =>
        line.stat === lineStat &&
        line.value === lineValue &&
        line.prime === linePrime
    );
}

/**
 * Calculate DPS gain for a specific slot's potential set
 */
export function calculateSlotSetGain(
    slotId: CubeSlotId,
    rarity: Rarity,
    setData: PotentialSet,
    currentStats: BaseStats
): { gain: number; stats: BaseStats; baselineStats: BaseStats } {
    const mainStat = getMainStatForClass();

    // Step 1: Calculate baseline by removing this set's contribution from current stats
    const baselineService = new StatCalculationService(currentStats);

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const lineKey = `line${lineNum}` as keyof PotentialSet;
        const line = setData[lineKey];
        if (!line || !line.stat) continue;

        // Only process line if it exists in the current rarity for this slot
        if (!lineExistsInRarity(slotId, rarity, lineNum, line.stat, line.value, line.prime)) continue;

        // Map potential stat to damage stat ID
        const statId = getStatIdFromPotentialStat(line.stat, mainStat);

        // Skip if no combat impact
        if (!statId) continue;

        baselineService.subtractStat(statId, line.value);
    }

    const baselineDPS = baselineService.computeDPS('boss');

    // Step 2: Calculate stats with this set applied to baseline
    const setService = new StatCalculationService(baselineService.getStats());

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const lineKey = `line${lineNum}` as keyof PotentialSet;
        const line = setData[lineKey];
        if (!line || !line.stat) continue;

        if (!lineExistsInRarity(slotId, rarity, lineNum, line.stat, line.value, line.prime)) continue;

        // Map potential stat to damage stat ID
        const statId = getStatIdFromPotentialStat(line.stat, mainStat);

        // Skip if no combat impact
        if (!statId) continue;

        setService.addPercentageStat(statId, line.value);
    }

    const setDPS = setService.computeDPS('boss');
    const gain = ((setDPS - baselineDPS) / baselineDPS * 100);

    return { gain, stats: setService.getStats(), baselineStats: baselineService.getStats() };
}

/**
 * Calculate comparison between Set A and Set B
 */
export function calculateComparison(
    cubeSlotData: AllCubeSlotData,
    currentCubeSlot: CubeSlotId,
    currentPotentialType: PotentialType
): ComparisonResult | null {
    const selectedClass = loadoutStore.getSelectedClass();
    if (!selectedClass) {
        return null;
    }

    if (Object.keys(cubeSlotData).length === 0) {
        return null;
    }

    const slotData = cubeSlotData[currentCubeSlot][currentPotentialType];
    const currentStats = loadoutStore.getBaseStats();
    const rarity = slotData.rarity;

    // Use shared function to calculate Set A
    const setAResult = calculateSlotSetGain(currentCubeSlot, rarity, slotData.setA, currentStats);
    const setAGain = setAResult.gain;
    const setAStats = setAResult.stats;
    const baselineStats = setAResult.baselineStats;

    // Calculate Set B using the same baseline
    const setBResult = calculateSlotSetGain(currentCubeSlot, rarity, slotData.setB, baselineStats);
    const setBStats = setBResult.stats;

    const baselineDPS = new StatCalculationService(baselineStats).computeDPS('boss');
    const setADPS = new StatCalculationService(setAStats).computeDPS('boss');
    const setBDPS = new StatCalculationService(setBStats).computeDPS('boss');

    // Calculate gains
    // Set B Absolute Gain: compared to baseline (for ranking comparison)
    const setBAbsoluteGain = ((setBDPS - baselineDPS) / baselineDPS * 100);
    // Set B Relative Gain: compared to Set A (shows the delta when swapping from A to B)
    const setBGain = ((setBDPS - setADPS) / setADPS * 100);
    const deltaGain = setBGain - setAGain;

    return {
        setAGain,
        setBGain,
        setBAbsoluteGain, // For ranking comparison
        deltaGain,
        setAStats,
        setBStats,
        slotId: currentCubeSlot,
        rarity: cubeSlotData[currentCubeSlot][currentPotentialType].rarity
    };
}

/**
 * Get percentile for a given DPS gain (helper for summary)
 */
export function getPercentileForGain(
    slotId: CubeSlotId,
    rarity: Rarity,
    dpsGain: number,
    rankingsCache: Record<CubeSlotId, Record<Rarity, RankingEntry[]>>,
    rankingsInProgress: Record<string, boolean>
): string {
    const key = `${slotId}-${rarity}`;
    const rankings = rankingsCache[slotId]?.[rarity];

    // Check if currently loading
    if (rankingsInProgress[key]) {
        return '<span style="color: var(--text-secondary); font-style: italic;">Loading...</span>';
    }

    if (!rankings || rankings.length === 0) {
        return '<span style="color: var(--text-secondary);">—</span>';
    }

    // Find percentile
    let percentileValue = 0;
    for (let i = 0; i < rankings.length; i++) {
        if (rankings[i].dpsGain <= dpsGain) {
            percentileValue = ((i / rankings.length) * 100);
            break;
        }
    }
    if (percentileValue === 0 && dpsGain >= rankings[0].dpsGain) percentileValue = 0;
    if (percentileValue === 0 && dpsGain < rankings[rankings.length - 1].dpsGain) percentileValue = 100;

    const percentile = percentileValue.toFixed(1);
    return `<span style="color: var(--accent-primary);">Top ${percentile}%</span>`;
}

// ============================================================================
// ORCHESTRATOR FUNCTIONS
// ============================================================================

/**
 * Initialize cube potential system
 */
export async function initializeCubePotential(): Promise<void> {
    // Initial setup is handled by gear-lab-store initialization
    console.log('Cube Potential: Initialization complete');
}

/**
 * Clear rankings cache and recalculate if needed
 */
export function clearCubeRankingsCache(): void {
    // Clear all cached rankings
    for (const slotId of SLOT_NAMES) {
        if (rankingsCache[slotId.id]) {
            rankingsCache[slotId.id] = {} as any;
        }
    }

    // Clear in-progress trackers
    for (const key in rankingsInProgress) {
        delete rankingsInProgress[key];
    }

    console.log('Cube Potential: Rankings cache cleared');
}

/**
 * Switch between regular and bonus potential
 */
export function switchPotentialType(type: PotentialType): void {
    currentPotentialType = type;
}

/**
 * Select a cube slot
 */
export function selectCubeSlot(slotId: CubeSlotId): void {
    currentCubeSlot = slotId;
}
