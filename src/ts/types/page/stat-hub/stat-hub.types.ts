/**
 * Stat Hub Type Definitions
 * Shared types for the stat-hub module (stat predictions and equivalency)
 */

/**
 * Stats object returned by getStats() and used by StatCalculationService
 * All numeric values representing character stats
 */
export interface StatsObject {
    attack: number;
    critRate: number;
    critDamage: number;
    statDamage: number;
    mainStat: number;
    damage: number;
    finalDamage: number;
    damageAmp: number;
    attackSpeed: number;
    defPen: number;
    bossDamage: number;
    normalDamage: number;
    skillCoeff: number;
    skillMastery: number;
    skillMasteryBoss: number;
    minDamage: number;
    maxDamage: number;
    defense: number;
    mainStatPct: number;
    firstJob: number;
    secondJob: number;
    thirdJob: number;
    fourthJob: number;
}

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
    applyToStats: (stats: StatsObject, value: number) => StatsObject;
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
