/**
 * Stat Hub Type Definitions
 * Shared types for the stat-hub module (stat predictions and equivalency)
 */

import { BaseStats } from "@ts/types/loadout";

// Stat increase values for predictions table
export interface StatIncrease {
    flat: number[];
    percentage: number[];
    mainStat: number[];
}

// Stat configuration for equivalency calculator
export interface EquivalencyStatConfig {
    label: string;
    getValue: () => number;
    applyToStats: (stats: BaseStats, value: number) => BaseStats;
    formatValue: (val: number) => string;
}

// Stat weight calculation result
export interface StatWeightResult {
    statLabel: string;
    increase: number;
    oldDPS: number;
    newDPS: number;
    gainPercentage: number;
    effectiveIncrease?: number;
    oldValue?: number;
    newValue?: number;
}

// Prediction table column configuration
export interface PredictionColumn {
    label: string;
    increase: number;
}

// Stat predictions data structure
export interface StatPredictionsData {
    flatStats: StatWeightResult[];
    percentageStats: StatWeightResult[];
}

// Equivalency calculation result
export interface EquivalencyResult {
    sourceStat: string;
    sourceValue: number;
    equivalents: Record<string, {
        value: number;
        label: string;
    }>;
}
