/**
 * Stat Equivalency Logic
 * Business logic for calculating stat equivalency
 * Separated from UI concerns
 */

import { StatCalculationService } from '@core/services/stat-calculation-service';
import { MONSTER_TYPE, BINARY_SEARCH } from '@ts/types/constants';
import type { EquivalencyStatConfig, EquivalencyResult, StatsObject } from '@ts/types/page/stat-hub/stat-hub.types';
import type { MonsterType } from '@ts/types/constants';

// Define stat maximums for realistic capping
const STAT_MAXIMUMS: Record<string, number | null> = {
    'critRate': 100,
    'critDamage': 500,
    'attackSpeed': 130,
    'bossDamage': null,
    'normalDamage': null,
    'damage': null,
    'finalDamage': null,
    'statDamage': null,
    'damageAmp': null,
    'minDamage': 100,
    'maxDamage': 100,
    'skillCoeff': 1000,
    'skillMastery': 100,
    'attack': 100000,
    'mainStat': 500000,
    'mainStatPct': 1000,
    'defPen': 100
};

/**
 * Create stat configuration object
 * This defines how each stat is accessed and modified
 */
export function createStatConfig(
    getValueFn: (statId: string) => number
): Record<string, EquivalencyStatConfig> {
    return {
        'attack': {
            label: 'Attack',
            getValue: () => getValueFn('attack'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addAttack(value);
                return service.getStats();
            },
            formatValue: (val: number) => val.toLocaleString()
        },
        'mainStat': {
            label: 'Main Stat',
            getValue: () => getValueFn('mainStat'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addMainStat(value);
                return service.getStats();
            },
            formatValue: (val: number) => val.toLocaleString()
        },
        'mainStatPct': {
            label: 'Main Stat %',
            getValue: () => getValueFn('mainStatPct'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addMainStatPct(value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'skillCoeff': {
            label: 'Skill Coefficient',
            getValue: () => getValueFn('skillCoeff'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('skillCoeff', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'skillMastery': {
            label: 'Skill Mastery',
            getValue: () => getValueFn('skillMastery'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('skillMastery', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'damage': {
            label: 'Damage',
            getValue: () => getValueFn('damage'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('damage', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'finalDamage': {
            label: 'Final Damage',
            getValue: () => getValueFn('finalDamage'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addMultiplicativeStat('finalDamage', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'bossDamage': {
            label: 'Boss Damage',
            getValue: () => getValueFn('bossDamage'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('bossDamage', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'normalDamage': {
            label: 'Monster Damage',
            getValue: () => getValueFn('normalDamage'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('normalDamage', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'damageAmp': {
            label: 'Damage Amplification',
            getValue: () => getValueFn('damageAmp'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('damageAmp', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}x`
        },
        'minDamage': {
            label: 'Min Damage Multiplier',
            getValue: () => getValueFn('minDamage'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('minDamage', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'maxDamage': {
            label: 'Max Damage Multiplier',
            getValue: () => getValueFn('maxDamage'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('maxDamage', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'critRate': {
            label: 'Critical Rate',
            getValue: () => getValueFn('critRate'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('critRate', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'critDamage': {
            label: 'Critical Damage',
            getValue: () => getValueFn('critDamage'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('critDamage', value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'attackSpeed': {
            label: 'Attack Speed',
            getValue: () => getValueFn('attackSpeed'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addDiminishingReturnStat('attackSpeed', value, 150);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        },
        'defPen': {
            label: 'Defense Penetration',
            getValue: () => getValueFn('defPen'),
            applyToStats: (stats: StatsObject, value: number) => {
                const service = new StatCalculationService(stats);
                service.addDiminishingReturnStat('defPen', value, 100);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(2)}%`
        }
    };
}

/**
 * Calculate target DPS gain from a source stat increase
 */
export function calculateTargetDPSGain(
    stats: StatsObject,
    sourceStat: string,
    sourceValue: number,
    statConfig: Record<string, EquivalencyStatConfig>
): { baseDPS: number; targetDPSGain: number } {
    const baseService = new StatCalculationService(stats);
    const baseDPS = baseService.baseBossDPS;

    if (sourceValue === 0) {
        return { baseDPS, targetDPSGain: 0 };
    }

    // For mainStatPct, we need to apply to a fresh service
    let newDPS: number;
    if (sourceStat === 'mainStatPct') {
        const modifiedService = new StatCalculationService(stats);
        modifiedService.addMainStatPct(sourceValue);
        newDPS = modifiedService.computeDPS(MONSTER_TYPE.BOSS);
    } else {
        const modifiedStats = statConfig[sourceStat].applyToStats(stats, sourceValue);
        const modifiedService = new StatCalculationService(modifiedStats);
        newDPS = modifiedService.computeDPS(MONSTER_TYPE.BOSS);
    }

    const targetDPSGain = ((newDPS - baseDPS) / baseDPS) * 100;

    return { baseDPS, targetDPSGain };
}

/**
 * Calculate equivalent value for a target stat
 */
export function calculateEquivalentValue(
    stats: StatsObject,
    targetStat: string,
    targetDPSGain: number,
    statConfig: Record<string, EquivalencyStatConfig>,
    rowTargetType: MonsterType
): { equivalentValue: number; verifyGain: number; unableToMatch: boolean } {
    const statMax = STAT_MAXIMUMS[targetStat];
    let equivalentValue = 0;
    let unableToMatch = false;
    let verifyGain = 0;

    // Use binary search for efficiency
    let low = 0;
    let high = statMax || BINARY_SEARCH.DEFAULT_MAX;
    let iterations = 0;
    const maxIterations = BINARY_SEARCH.MAX_ITERATIONS;

    while (iterations < maxIterations) {
        equivalentValue = (low + high) / 2;
        iterations++;

        const modifiedStats = statConfig[targetStat].applyToStats(stats, equivalentValue);
        const modifiedService = new StatCalculationService(modifiedStats);
        const newDPS = modifiedService.computeDPS(rowTargetType);
        const baseDPS = rowTargetType === MONSTER_TYPE.BOSS ?
            modifiedService.baseBossDPS :
            modifiedService.baseNormalDPS;

        verifyGain = ((newDPS - baseDPS) / baseDPS) * 100;

        if (Math.abs(verifyGain - targetDPSGain) < BINARY_SEARCH.PRECISION) {
            break;
        }

        if (verifyGain < targetDPSGain) {
            if (statMax && high >= statMax) {
                unableToMatch = true;
                break;
            }
            low = equivalentValue;
        } else {
            high = equivalentValue;
        }
    }

    return { equivalentValue, verifyGain, unableToMatch };
}

/**
 * Calculate full equivalency results
 */
export function calculateEquivalency(
    stats: StatsObject,
    sourceStat: string,
    sourceValue: number,
    statConfig: Record<string, EquivalencyStatConfig>
): EquivalencyResult | null {
    if (sourceValue === 0) {
        return null;
    }

    const { baseDPS, targetDPSGain } = calculateTargetDPSGain(stats, sourceStat, sourceValue, statConfig);

    const equivalents: Record<string, { value: number; label: string }> = {};

    Object.entries(statConfig).forEach(([statId, statConfigItem]) => {
        if (statId === sourceStat) return;

        // Handle cross-stat incompatibility
        if (sourceStat === 'bossDamage' && statId === 'normalDamage') {
            equivalents[statId] = {
                value: 0,
                label: 'Ineffective (Boss DMG ≠ Monster target)'
            };
            return;
        }

        if (sourceStat === 'normalDamage' && statId === 'bossDamage') {
            equivalents[statId] = {
                value: 0,
                label: 'Ineffective (Monster DMG ≠ Boss target)'
            };
            return;
        }

        // Determine target type for this stat row
        let rowTargetType: MonsterType = MONSTER_TYPE.BOSS;

        if (statId === 'normalDamage') {
            rowTargetType = MONSTER_TYPE.NORMAL;
        }

        const { equivalentValue, verifyGain, unableToMatch } = calculateEquivalentValue(
            stats,
            statId,
            targetDPSGain,
            statConfig,
            rowTargetType
        );

        equivalents[statId] = {
            value: equivalentValue,
            label: unableToMatch ? 'Unable to match' : `+${verifyGain.toFixed(2)}%`
        };
    });

    return {
        sourceStat,
        sourceValue,
        equivalents
    };
}
