/**
 * Inner Ability Feature-Specific Types
 *
 * Types used specifically within the inner-ability feature.
 * Store types are in @ts/types/page/gear-lab/gear-lab.types.ts
 */

import type { InnerAbilityLine, PresetComparisonResult, TheoreticalRollResult, BestCombinationResult } from '@ts/types/page/gear-lab/gear-lab.types';

// ============================================================================
// CALCULATION RESULT TYPES
// ============================================================================

/**
 * Extended preset comparison result with additional metadata for UI rendering
 */
export interface ExtendedPresetComparisonResult extends PresetComparisonResult {
    rank?: number;
    percentDifference?: {
        bossDPS: number;
        normalDPS: number;
    };
}

/**
 * Sort configuration for tables
 */
export interface SortConfig {
    column: number;
    ascending: boolean;
}

// ============================================================================
// STAT MAPPING TYPES
// ============================================================================

/**
 * Stat mapping configuration for inner ability
 */
export interface StatMapping {
    statName: string;
    serviceMethod: 'addPercentageStat' | 'addDiminishingReturnStat' | 'addMainStat';
    serviceParam?: string;  // For diminishing returns factor
}

/**
 * Base stats interface for stat calculation service
 */
export interface BaseStats {
    [key: string]: number | string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Tab names for inner ability sub-tabs
 */
export type InnerAbilityTabName = 'my-ability-pages' | 'preset-comparison' | 'theoretical-best';

/**
 * UI state for sorting
 */
export interface TableSortState {
    preset: {
        column: number;
        ascending: boolean;
    };
    theoretical: {
        column: number;
        ascending: boolean;
    };
}
