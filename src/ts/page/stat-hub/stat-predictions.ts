/**
 * Stat Predictions Logic
 * Business logic for calculating stat damage predictions
 * Separated from UI concerns
 */

import { StatCalculationService } from '@ts/services/stat-calculation-service';
import { BaseStats } from '@ts/types';
import { MONSTER_TYPE, STAT, type StatKey } from '@ts/types/constants';
import type { StatWeightResult, StatIncrease } from '@ts/types/page/stat-hub/stat-hub.types';

/**
 * Convert lowercase stat ID to StatKey (uppercase)
 * Maps 'attack' -> 'ATTACK', 'critRate' -> 'CRIT_RATE', etc.
 */
function idToStatKey(id: string): StatKey {
    for (const key of Object.keys(STAT) as StatKey[]) {
        if (STAT[key].id === id) {
            return key;
        }
    }
    throw new Error(`Unknown stat ID: ${id}`);
}

// Default stat increase values
export const DEFAULT_STAT_INCREASES: StatIncrease = {
    flat: [500, 1000, 2500, 5000, 10000, 15000],
    mainStat: [100, 500, 1000, 2500, 5000, 7500],
    percentage: [1, 5, 10, 25, 50, 75]
};

// Percentage stat configuration
export const PERCENTAGE_STATS = [
    { key: STAT.SKILL_COEFFICIENT.id, label: 'Skill Coeff' },
    { key: STAT.MASTERY.id, label: 'Skill Mastery' },
    { key: STAT.DAMAGE.id, label: 'Damage' },
    { key: STAT.FINAL_DAMAGE.id, label: 'Final Dmg' },
    { key: STAT.BOSS_DAMAGE.id, label: 'Boss Dmg' },
    { key: STAT.NORMAL_DAMAGE.id, label: 'Mob Dmg' },
    { key: STAT.STAT_DAMAGE.id, label: 'Main Stat %' },
    { key: STAT.DAMAGE_AMP.id, label: 'Dmg Amp' },
    { key: STAT.MIN_DAMAGE.id, label: 'Min Dmg' },
    { key: STAT.MAX_DAMAGE.id, label: 'Max Dmg' },
    { key: STAT.CRIT_RATE.id, label: 'Crit Rate' },
    { key: STAT.CRIT_DAMAGE.id, label: 'Crit Dmg' },
    { key: STAT.ATTACK_SPEED.id, label: 'Atk Speed' },
    { key: STAT.DEF_PEN.id, label: 'Def Pen' }
];

// Multiplicative stats (applied multiplicatively)
export const MULTIPLICATIVE_STATS: Record<string, boolean> = {
    [STAT.FINAL_DAMAGE.id]: true
};

// Diminishing return stats with their denominator values
export const DIMINISHING_RETURN_STATS: Record<string, { denominator: number }> = {
    [STAT.ATTACK_SPEED.id]: { denominator: 150 },
    [STAT.DEF_PEN.id]: { denominator: 100 }
};

/**
 * Calculate attack stat weights
 * Returns array of weight results for each increase value
 */
export function calculateAttackWeights(
    stats: BaseStats,
    baseBossDPS: number,
    increases: number[]
): StatWeightResult[] {
    const results: StatWeightResult[] = [];

    increases.forEach(increase => {
        const service = new StatCalculationService(stats);
        const oldValue = stats.ATTACK;
        const effectiveIncrease = increase * (1 + service.weaponAttackBonus / 100);

        const newDPS = service.addAttack(increase).computeDPS(MONSTER_TYPE.BOSS);
        const newValue = service.getStats().ATTACK;
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
    stats: BaseStats,
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
    stats: BaseStats,
    baseBossDPS: number,
    baseNormalDPS: number,
    statKey: string,
    increases: number[]
): StatWeightResult[] {
    const results: StatWeightResult[] = [];
    const isNormalDamage = statKey === STAT.NORMAL_DAMAGE.id;
    const baseDPS = isNormalDamage ? baseNormalDPS : baseBossDPS;

    increases.forEach(increase => {
        const service = new StatCalculationService(stats);

        // Apply the stat increase based on type
        if (statKey === STAT.STAT_DAMAGE.id) {
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

        const actualStatKey = idToStatKey(statKey);
        const newValue = service.getStats()[actualStatKey];
        const oldValue = stats[actualStatKey];

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
    stats: BaseStats
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
