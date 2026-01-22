import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
import { MONSTER_TYPE, STAT } from "@ts/types/constants.js";
function idToStatKey(id) {
  for (const key of Object.keys(STAT)) {
    if (STAT[key].id === id) {
      return key;
    }
  }
  throw new Error(`Unknown stat ID: ${id}`);
}
const DEFAULT_STAT_INCREASES = {
  flat: [500, 1e3, 2500, 5e3, 1e4, 15e3],
  mainStat: [100, 500, 1e3, 2500, 5e3, 7500],
  percentage: [1, 5, 10, 25, 50, 75]
};
const PERCENTAGE_STATS = [
  { key: STAT.SKILL_COEFFICIENT.id, label: "Skill Coeff" },
  { key: STAT.MASTERY.id, label: "Skill Mastery" },
  { key: STAT.DAMAGE.id, label: "Damage" },
  { key: STAT.FINAL_DAMAGE.id, label: "Final Dmg" },
  { key: STAT.BOSS_DAMAGE.id, label: "Boss Dmg" },
  { key: STAT.NORMAL_DAMAGE.id, label: "Mob Dmg" },
  { key: STAT.STAT_DAMAGE.id, label: "Main Stat %" },
  { key: STAT.DAMAGE_AMP.id, label: "Dmg Amp" },
  { key: STAT.MIN_DAMAGE.id, label: "Min Dmg" },
  { key: STAT.MAX_DAMAGE.id, label: "Max Dmg" },
  { key: STAT.CRIT_RATE.id, label: "Crit Rate" },
  { key: STAT.CRIT_DAMAGE.id, label: "Crit Dmg" },
  { key: STAT.ATTACK_SPEED.id, label: "Atk Speed" },
  { key: STAT.DEF_PEN.id, label: "Def Pen" }
];
const MULTIPLICATIVE_STATS = {
  [STAT.FINAL_DAMAGE.id]: true
};
const DIMINISHING_RETURN_STATS = {
  [STAT.ATTACK_SPEED.id]: { denominator: 150 },
  [STAT.DEF_PEN.id]: { denominator: 100 }
};
function calculateAttackWeights(stats, baseBossDPS, increases) {
  const results = [];
  increases.forEach((increase) => {
    const service = new StatCalculationService(stats);
    const oldValue = stats.ATTACK;
    const effectiveIncrease = increase * (1 + service.weaponAttackBonus / 100);
    const newDPS = service.addAttack(increase).computeDPS(MONSTER_TYPE.BOSS);
    const newValue = service.getStats().ATTACK;
    const gainPercentage = (newDPS - baseBossDPS) / baseBossDPS * 100;
    results.push({
      statLabel: "Attack",
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
function calculateMainStatWeights(stats, baseBossDPS, increases) {
  const results = [];
  increases.forEach((increase) => {
    const service = new StatCalculationService(stats);
    const actualMainStatGain = service.calculateMainStatIncreaseWithPct(increase);
    const newDPS = service.addMainStat(increase).computeDPS(MONSTER_TYPE.BOSS);
    const gainPercentage = (newDPS - baseBossDPS) / baseBossDPS * 100;
    results.push({
      statLabel: "Main Stat",
      increase: actualMainStatGain,
      oldDPS: baseBossDPS,
      newDPS,
      gainPercentage,
      effectiveIncrease: actualMainStatGain
    });
  });
  return results;
}
function calculatePercentageStatWeight(stats, baseBossDPS, baseNormalDPS, statKey, increases) {
  const results = [];
  const isNormalDamage = statKey === STAT.NORMAL_DAMAGE.id;
  const baseDPS = isNormalDamage ? baseNormalDPS : baseBossDPS;
  increases.forEach((increase) => {
    const service = new StatCalculationService(stats);
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
function calculateAllStatWeights(stats) {
  const baseService = new StatCalculationService(stats);
  const baseBossDPS = baseService.baseBossDPS;
  const baseNormalDPS = baseService.baseNormalDPS;
  const attackWeights = calculateAttackWeights(stats, baseBossDPS, DEFAULT_STAT_INCREASES.flat);
  const mainStatWeights = calculateMainStatWeights(stats, baseBossDPS, DEFAULT_STAT_INCREASES.mainStat);
  const percentageWeights = {};
  PERCENTAGE_STATS.forEach((stat) => {
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
export {
  DEFAULT_STAT_INCREASES,
  DIMINISHING_RETURN_STATS,
  MULTIPLICATIVE_STATS,
  PERCENTAGE_STATS,
  calculateAllStatWeights,
  calculateAttackWeights,
  calculateMainStatWeights,
  calculatePercentageStatWeight
};
//# sourceMappingURL=stat-predictions.js.map
