/**
 * Artifact Potential Core Logic
 *
 * Pure calculation functions for artifact potential stat mapping
 * and DPS gain rankings.
 */

import { artifactPotentialData } from '@ts/data/artifact-potential-data.js';
import { StatCalculationService } from '@ts/services/stat-calculation-service.js';
import { loadoutStore } from '@ts/store/loadout.store.js';
import type { BaseStats } from '@ts/types/loadout.js';
import type {
    ArtifactRankingResult,
    ArtifactStatName,
    ArtifactRarity
} from '@ts/types/page/artifact-potential/artifact-potential.types.js';
import { IGNORED_ARTIFACT_STATS } from '@ts/types/page/artifact-potential/artifact-potential.types.js';

// ============================================================================
// STAT MAPPING
// ============================================================================

/**
 * Map an artifact potential stat to base stats using StatCalculationService
 * @param statName - Name of the stat (e.g., "Main Stat %", "Boss Monster Damage %")
 * @param value - Value of the stat
 * @param baseStats - Base stats to modify
 * @returns Modified base stats
 */
export function mapArtifactStat(statName: string, value: number, baseStats: BaseStats): BaseStats {
    // Remove "(prime)" suffix if present for mapping
    const cleanStatName = statName.replace(' (prime)', '');

    // Use StatCalculationService for consistent stat manipulation
    const service = new StatCalculationService(baseStats);

    switch (cleanStatName) {
        case 'Main Stat %':
            // StatCalculationService handles complex main stat % calculations including Dark Knight
            service.add('mainStatPct', value);
            break;
        case 'Critical Rate %':
            service.add('critRate', value);
            break;
        case 'Min Damage Multiplier %':
            service.add('minDamage', value);
            break;
        case 'Max Damage Multiplier %':
            service.add('maxDamage', value);
            break;
        case 'Boss Monster Damage %':
            service.add('bossDamage', value);
            break;
        case 'Normal Monster Damage %':
            service.add('normalDamage', value);
            break;
        case 'Damage %':
            service.add('damage', value);
            break;
        case 'Defense Penetration %':
            // Defense Penetration uses diminishing returns with factor 100
            service.add('defPen', value);
            break;
        // Ignored stats: Damage Taken Decrease %, Defense %, Accuracy, Status Effect Damage %
        default:
            // No effect on damage
            break;
    }

    return service.getStats();
}

// ============================================================================
// RANKING CALCULATIONS
// ============================================================================

/**
 * Calculate baseline stats from loadout store
 * @returns Base stats
 */
export function getBaselineStats(): BaseStats {
    return loadoutStore.getBaseStats();
}

/**
 * Calculate all possible artifact potential rolls and rank them
 * @returns Array of ranking results sorted by average DPS gain
 */
export function calculateArtifactPotentialRankings(): ArtifactRankingResult[] {
    const baseStats = getBaselineStats();

    // Calculate baseline damage using StatCalculationService
    const baselineService = new StatCalculationService(baseStats);
    const baselineBossDamage = baselineService.compute('boss');
    const baselineNormalDamage = baselineService.compute('normal');

    const results: ArtifactRankingResult[] = [];

    // Process each rarity tier
    Object.entries(artifactPotentialData).forEach(([rarity, stats]) => {
        Object.entries(stats).forEach(([statName, value]) => {
            // Skip stats that don't affect damage
            if (IGNORED_ARTIFACT_STATS.includes(statName as ArtifactStatName)) {
                return;
            }

            // Apply this stat and calculate DPS gains
            const modifiedStats = mapArtifactStat(statName, value as number, baseStats);
            const testService = new StatCalculationService(modifiedStats);
            const bossDamage = testService.compute('boss');
            const normalDamage = testService.compute('normal');

            const bossDPSGain = bossDamage.dps - baselineBossDamage.dps;
            const normalDPSGain = normalDamage.dps - baselineNormalDamage.dps;
            const avgDPSGain = (bossDPSGain + normalDPSGain) / 2;

            const bossDPSPercentChange = baselineBossDamage.dps > 0 ? (bossDPSGain / baselineBossDamage.dps) * 100 : 0;
            const normalDPSPercentChange = baselineNormalDamage.dps > 0 ? (normalDPSGain / baselineNormalDamage.dps) * 100 : 0;
            const avgDPSPercentChange = (bossDPSPercentChange + normalDPSPercentChange) / 2;

            // Only include stats that give positive DPS gain
            if (avgDPSGain > 0) {
                // Format the display name
                let displayName = statName;
                if (statName.includes('(prime)')) {
                    displayName = statName.replace(' (prime)', ' (Prime)');
                }

                results.push({
                    rarity: rarity as ArtifactRarity,
                    stat: displayName,
                    value: `${value}%`,
                    bossDPSGain,
                    normalDPSGain,
                    avgDPSGain,
                    bossDPSPercentChange,
                    normalDPSPercentChange,
                    avgDPSPercentChange
                });
            }
        });
    });

    // Sort by average DPS gain (descending)
    results.sort((a, b) => b.avgDPSGain - a.avgDPSGain);

    return results;
}

// ============================================================================
// SORTING STATE
// ============================================================================

let artifactSortColumn = 5;
let artifactSortAsc = false;

/**
 * Get current sort column
 */
export function getArtifactSortColumn(): number {
    return artifactSortColumn;
}

/**
 * Set sort column
 */
export function setArtifactSortColumn(column: number): void {
    artifactSortColumn = column;
}

/**
 * Get sort direction
 */
export function getArtifactSortAsc(): boolean {
    return artifactSortAsc;
}

/**
 * Toggle sort direction
 */
export function toggleArtifactSortAsc(): void {
    artifactSortAsc = !artifactSortAsc;
}

// ============================================================================
// WINDOW EXPORTS
// ============================================================================
