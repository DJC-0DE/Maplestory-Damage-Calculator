/**
 * Stat Predictions Logic
 * Business logic for calculating stat damage predictions
 * Separated from UI concerns
 */

import { StatCalculationService } from '@core/services/stat-calculation-service';
import { MONSTER_TYPE } from '@ts/types/constants';
import type { StatWeightResult, StatIncrease, StatsObject } from '@ts/types/page/stat-hub/stat-hub.types';

// Stat key constants for comparisons
const STAT_DAMAGE_KEY = 'stat-damage';
const NORMAL_DAMAGE_KEY = 'normal-damage';
const FINAL_DAMAGE_KEY = 'final-damage';
const ATTACK_SPEED_KEY = 'attack-speed';
const DEF_PEN_KEY = 'def-pen';

// CamelCase versions for StatsObject access
const STAT_DAMAGE_CAMEL = 'statDamage';
const NORMAL_DAMAGE_CAMEL = 'normalDamage';
const FINAL_DAMAGE_CAMEL = 'finalDamage';
const ATTACK_SPEED_CAMEL = 'attackSpeed';
const DEF_PEN_CAMEL = 'defPen';

// Default stat increase values
export const DEFAULT_STAT_INCREASES: StatIncrease = {
    flat: [500, 1000, 2500, 5000, 10000, 15000],
    mainStat: [100, 500, 1000, 2500, 5000, 7500],
    percentage: [1, 5, 10, 25, 50, 75]
};

// Percentage stat configuration
export const PERCENTAGE_STATS = [
    { key: 'skillCoeff', label: 'Skill Coeff' },
    { key: 'skillMastery', label: 'Skill Mastery' },
    { key: 'damage', label: 'Damage' },
    { key: 'finalDamage', label: 'Final Dmg' },
    { key: 'bossDamage', label: 'Boss Dmg' },
    { key: 'normalDamage', label: 'Mob Dmg' },
    { key: 'statDamage', label: 'Main Stat %' },
    { key: 'damageAmp', label: 'Dmg Amp' },
    { key: 'minDamage', label: 'Min Dmg' },
    { key: 'maxDamage', label: 'Max Dmg' },
    { key: 'critRate', label: 'Crit Rate' },
    { key: 'critDamage', label: 'Crit Dmg' },
    { key: 'attackSpeed', label: 'Atk Speed' },
    { key: 'defPen', label: 'Def Pen' }
];

// Multiplicative stats (applied multiplicatively)
export const MULTIPLICATIVE_STATS: Record<string, boolean> = {
    [FINAL_DAMAGE_CAMEL]: true
};

// Diminishing return stats with their denominator values
export const DIMINISHING_RETURN_STATS: Record<string, { denominator: number }> = {
    [ATTACK_SPEED_CAMEL]: { denominator: 150 },
    [DEF_PEN_CAMEL]: { denominator: 100 }
};

/**
 * Calculate attack stat weights
 * Returns array of weight results for each increase value
 */
export function calculateAttackWeights(
    stats: StatsObject,
    baseBossDPS: number,
    increases: number[]
): StatWeightResult[] {
    const results: StatWeightResult[] = [];

    increases.forEach(increase => {
        const service = new StatCalculationService(stats);
        const oldValue = stats.attack;
        const effectiveIncrease = increase * (1 + service.weaponAttackBonus / 100);

        const newDPS = service.addAttack(increase).computeDPS(MONSTER_TYPE.BOSS);
        const newValue = service.getStats().attack;
        const gainPercentage = (newDPS - baseBossDPS) / baseBossDPS * 100;

        results.push({
            statLabel: 'Attack',
            increase,
            oldDPS: baseBossDPS,
            newDPS,
            gainPercentage,
            effectiveIncrease,
            oldValue,
            newValue
        });
    });

    return results;
}

/**
 * Calculate main stat weights
 * Returns array of weight results for each increase value
 */
export function calculateMainStatWeights(
    stats: StatsObject,
    baseBossDPS: number,
    increases: number[]
): StatWeightResult[] {
    const results: StatWeightResult[] = [];

    increases.forEach(increase => {
        const service = new StatCalculationService(stats);
        const actualMainStatGain = service.calculateMainStatIncreaseWithPct(increase);

        const newDPS = service.addMainStat(increase).computeDPS(MONSTER_TYPE.BOSS);
        const gainPercentage = (newDPS - baseBossDPS) / baseBossDPS * 100;

        results.push({
            statLabel: 'Main Stat',
            increase: actualMainStatGain,
            oldDPS: baseBossDPS,
            newDPS,
            gainPercentage,
            effectiveIncrease: actualMainStatGain
        });
    });

    return results;
}

/**
 * Calculate percentage stat weights for a specific stat
 * Returns array of weight results for each increase value
 */
export function calculatePercentageStatWeight(
    stats: StatsObject,
    baseBossDPS: number,
    baseNormalDPS: number,
    statKey: string,
    increases: number[]
): StatWeightResult[] {
    const results: StatWeightResult[] = [];
    const isNormalDamage = statKey === NORMAL_DAMAGE_CAMEL;
    const baseDPS = isNormalDamage ? baseNormalDPS : baseBossDPS;

    increases.forEach(increase => {
        const service = new StatCalculationService(stats);

        // Apply the stat increase based on type
        if (statKey === STAT_DAMAGE_CAMEL) {
            service.addMainStatPct(increase);
        } else if (MULTIPLICATIVE_STATS[statKey]) {
            service.addMultiplicativeStat(statKey, increase);
        } else if (DIMINISHING_RETURN_STATS[statKey]) {
            const factor = DIMINISHING_RETURN_STATS[statKey].denominator;
            service.addDiminishingReturnStat(statKey, increase, factor);
        } else {
            service.addPercentageStat(statKey, increase);
        }

        const monsterType = isNormalDamage ? MONSTER_TYPE.NORMAL : MONSTER_TYPE.BOSS;
        const newDPS = service.computeDPS(monsterType);
        const gainPercentage = (newDPS - baseDPS) / baseDPS * 100;

        const newValue = service.getStats()[statKey];
        const oldValue = stats[statKey];

        results.push({
            statLabel: statKey,
            increase,
            oldDPS: baseDPS,
            newDPS,
            gainPercentage,
            oldValue,
            newValue
        });
    });

    return results;
}

/**
 * Calculate all stat weights for predictions table
 * Returns structured data for both flat and percentage stats
 */
export function calculateAllStatWeights(
    stats: StatsObject
): {
    baseBossDPS: number;
    baseNormalDPS: number;
    attackWeights: StatWeightResult[];
    mainStatWeights: StatWeightResult[];
    percentageWeights: Record<string, StatWeightResult[]>;
} {
    const baseService = new StatCalculationService(stats);
    const baseBossDPS = baseService.baseBossDPS;
    const baseNormalDPS = baseService.baseNormalDPS;

    const attackWeights = calculateAttackWeights(stats, baseBossDPS, DEFAULT_STAT_INCREASES.flat);
    const mainStatWeights = calculateMainStatWeights(stats, baseBossDPS, DEFAULT_STAT_INCREASES.mainStat);

    // Calculate weights for all percentage stats
    const percentageWeights: Record<string, StatWeightResult[]> = {};
    PERCENTAGE_STATS.forEach(stat => {
        percentageWeights[stat.key] = calculatePercentageStatWeight(
            stats,
            baseBossDPS,
            baseNormalDPS,
            stat.key,
            DEFAULT_STAT_INCREASES.percentage
        );
    });

    return {
        baseBossDPS,
        baseNormalDPS,
        attackWeights,
        mainStatWeights,
        percentageWeights
    };
}
