/**
 * Stat Equivalency Logic
 * Business logic for calculating stat equivalency
 * Separated from UI concerns
 */

import { MONSTER_TYPE, BINARY_SEARCH, STAT } from '@ts/types/constants';
import type { EquivalencyStatConfig, EquivalencyResult } from '@ts/types/page/stat-hub/stat-hub.types';
import type { MonsterType } from '@ts/types/constants';
import { BaseStats } from '@ts/types';
import { StatCalculationService } from '@ts/services/stat-calculation-service';

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
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addAttack(value);
                return service.getStats();
            },
            formatValue: (val: number) => val.toFixed(1)
        },
        'mainStat': {
            label: 'Main Stat',
            getValue: () => getValueFn('mainStat'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addMainStat(value);
                return service.getStats();
            },
            formatValue: (val: number) => val.toFixed(1)
        },
        'mainStatPct': {
            label: 'Main Stat %',
            getValue: () => getValueFn('mainStatPct'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addMainStatPct(value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'skillCoeff': {
            label: 'Skill Coefficient',
            getValue: () => getValueFn('skillCoeff'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.SKILL_COEFFICIENT.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'skillMastery': {
            label: 'Skill Mastery',
            getValue: () => getValueFn('skillMastery'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.MASTERY.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'damage': {
            label: 'Damage',
            getValue: () => getValueFn('damage'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.DAMAGE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'finalDamage': {
            label: 'Final Damage',
            getValue: () => getValueFn('finalDamage'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addMultiplicativeStat(STAT.FINAL_DAMAGE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'bossDamage': {
            label: 'Boss Damage',
            getValue: () => getValueFn('bossDamage'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.BOSS_DAMAGE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'normalDamage': {
            label: 'Monster Damage',
            getValue: () => getValueFn('normalDamage'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.NORMAL_DAMAGE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'damageAmp': {
            label: 'Damage Amplification',
            getValue: () => getValueFn('damageAmp'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.DAMAGE_AMP.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}x`
        },
        'minDamage': {
            label: 'Min Damage Multiplier',
            getValue: () => getValueFn('minDamage'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.MIN_DAMAGE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'maxDamage': {
            label: 'Max Damage Multiplier',
            getValue: () => getValueFn('maxDamage'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.MAX_DAMAGE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'critRate': {
            label: 'Critical Rate',
            getValue: () => getValueFn('critRate'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.CRIT_RATE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'critDamage': {
            label: 'Critical Damage',
            getValue: () => getValueFn('critDamage'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat(STAT.CRIT_DAMAGE.id, value);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'attackSpeed': {
            label: 'Attack Speed',
            getValue: () => getValueFn('attackSpeed'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addDiminishingReturnStat(STAT.ATTACK_SPEED.id, value, 150);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        },
        'defPen': {
            label: 'Defense Penetration',
            getValue: () => getValueFn('defPen'),
            applyToStats: (stats: BaseStats, value: number) => {
                const service = new StatCalculationService(stats);
                service.addDiminishingReturnStat(STAT.DEF_PEN.id, value, 100);
                return service.getStats();
            },
            formatValue: (val: number) => `${val.toFixed(1)}%`
        }
    };
}

/**
 * Calculate target DPS gain from a source stat increase
 */
export function calculateTargetDPSGain(
    stats: BaseStats,
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
    stats: BaseStats,
    targetStat: string,
    targetDPSGain: number,
    statConfig: Record<string, EquivalencyStatConfig>,
    rowTargetType: MonsterType
): { equivalentValue: number; verifyGain: number; unableToMatch: boolean } {
    // Capture original base DPS before any modifications
    const originalService = new StatCalculationService(stats);
    const originalBaseDPS = rowTargetType === MONSTER_TYPE.BOSS ?
        originalService.baseBossDPS :
        originalService.baseNormalDPS;

    // Guard against division by zero
    if (originalBaseDPS === 0) {
        return { equivalentValue: 0, verifyGain: 0, unableToMatch: true };
    }

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

        verifyGain = ((newDPS - originalBaseDPS) / originalBaseDPS) * 100;

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
    stats: BaseStats,
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

        if(sourceStat === 'statDamage')
        {
            return;
        }

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
