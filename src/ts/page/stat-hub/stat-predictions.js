import { StatCalculationService } from "@core/services/stat-calculation-service.js";
import { MONSTER_TYPE } from "@ts/types/constants.js";
const STAT_DAMAGE_KEY = "stat-damage";
const NORMAL_DAMAGE_KEY = "normal-damage";
const FINAL_DAMAGE_KEY = "final-damage";
const ATTACK_SPEED_KEY = "attack-speed";
const DEF_PEN_KEY = "def-pen";
const STAT_DAMAGE_CAMEL = "statDamage";
const NORMAL_DAMAGE_CAMEL = "normalDamage";
const FINAL_DAMAGE_CAMEL = "finalDamage";
const ATTACK_SPEED_CAMEL = "attackSpeed";
const DEF_PEN_CAMEL = "defPen";
const DEFAULT_STAT_INCREASES = {
  flat: [500, 1e3, 2500, 5e3, 1e4, 15e3],
  mainStat: [100, 500, 1e3, 2500, 5e3, 7500],
  percentage: [1, 5, 10, 25, 50, 75]
};
const PERCENTAGE_STATS = [
  { key: "skillCoeff", label: "Skill Coeff" },
  { key: "skillMastery", label: "Skill Mastery" },
  { key: "damage", label: "Damage" },
  { key: "finalDamage", label: "Final Dmg" },
  { key: "bossDamage", label: "Boss Dmg" },
  { key: "normalDamage", label: "Mob Dmg" },
  { key: "statDamage", label: "Main Stat %" },
  { key: "damageAmp", label: "Dmg Amp" },
  { key: "minDamage", label: "Min Dmg" },
  { key: "maxDamage", label: "Max Dmg" },
  { key: "critRate", label: "Crit Rate" },
  { key: "critDamage", label: "Crit Dmg" },
  { key: "attackSpeed", label: "Atk Speed" },
  { key: "defPen", label: "Def Pen" }
];
const MULTIPLICATIVE_STATS = {
  [FINAL_DAMAGE_CAMEL]: true
};
const DIMINISHING_RETURN_STATS = {
  [ATTACK_SPEED_CAMEL]: { denominator: 150 },
  [DEF_PEN_CAMEL]: { denominator: 100 }
};
function calculateAttackWeights(stats, baseBossDPS, increases) {
  const results = [];
  increases.forEach((increase) => {
    const service = new StatCalculationService(stats);
    const oldValue = stats.attack;
    const effectiveIncrease = increase * (1 + service.weaponAttackBonus / 100);
    const newDPS = service.addAttack(increase).computeDPS(MONSTER_TYPE.BOSS);
    const newValue = service.getStats().attack;
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
  const isNormalDamage = statKey === NORMAL_DAMAGE_CAMEL;
  const baseDPS = isNormalDamage ? baseNormalDPS : baseBossDPS;
  increases.forEach((increase) => {
    const service = new StatCalculationService(stats);
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
