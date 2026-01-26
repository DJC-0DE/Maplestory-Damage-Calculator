import { MONSTER_TYPE, BINARY_SEARCH, STAT } from "@ts/types/constants.js";
import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
const STAT_MAXIMUMS = {
  "critRate": 100,
  "critDamage": 500,
  "attackSpeed": 130,
  "bossDamage": null,
  "normalDamage": null,
  "damage": null,
  "finalDamage": null,
  "statDamage": null,
  "damageAmp": null,
  "minDamage": 100,
  "maxDamage": 100,
  "skillCoeff": 1e3,
  "skillMastery": 100,
  "attack": 1e5,
  "mainStat": 5e5,
  "mainStatPct": 1e3,
  "defPen": 100
};
function createStatConfig(getValueFn) {
  return {
    "attack": {
      label: "Attack",
      getValue: () => getValueFn("attack"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add("attack", value);
        return service.getStats();
      },
      formatValue: (val) => val.toFixed(1)
    },
    "mainStat": {
      label: "Main Stat",
      getValue: () => getValueFn("mainStat"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add("mainStat", value);
        return service.getStats();
      },
      formatValue: (val) => val.toFixed(1)
    },
    "mainStatPct": {
      label: "Main Stat %",
      getValue: () => getValueFn("mainStatPct"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add("mainStatPct", value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "skillCoeff": {
      label: "Skill Coefficient",
      getValue: () => getValueFn("skillCoeff"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.SKILL_COEFFICIENT.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "skillMastery": {
      label: "Skill Mastery",
      getValue: () => getValueFn("mastery"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.MASTERY.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "damage": {
      label: "Damage",
      getValue: () => getValueFn("damage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "finalDamage": {
      label: "Final Damage",
      getValue: () => getValueFn("finalDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.FINAL_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "bossDamage": {
      label: "Boss Damage",
      getValue: () => getValueFn("bossDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.BOSS_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "normalDamage": {
      label: "Monster Damage",
      getValue: () => getValueFn("normalDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.NORMAL_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "damageAmp": {
      label: "Damage Amplification",
      getValue: () => getValueFn("damageAmp"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.DAMAGE_AMP.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}x`
    },
    "minDamage": {
      label: "Min Damage Multiplier",
      getValue: () => getValueFn("minDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.MIN_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "maxDamage": {
      label: "Max Damage Multiplier",
      getValue: () => getValueFn("maxDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.MAX_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "critRate": {
      label: "Critical Rate",
      getValue: () => getValueFn("critRate"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.CRIT_RATE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "critDamage": {
      label: "Critical Damage",
      getValue: () => getValueFn("critDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.CRIT_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "attackSpeed": {
      label: "Attack Speed",
      getValue: () => getValueFn("attackSpeed"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.ATTACK_SPEED.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    },
    "defPen": {
      label: "Defense Penetration",
      getValue: () => getValueFn("defPen"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.add(STAT.DEF_PEN.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(1)}%`
    }
  };
}
function calculateTargetDPSGain(stats, sourceStat, sourceValue, statConfig) {
  const baseService = new StatCalculationService(stats);
  const monsterType = STAT.NORMAL_DAMAGE.id === sourceStat ? MONSTER_TYPE.NORMAL : MONSTER_TYPE.BOSS;
  let baseDPS = monsterType === MONSTER_TYPE.BOSS ? baseService.baseBossDPS : baseService.baseNormalDPS;
  if (sourceValue === 0) {
    return { baseDPS, targetDPSGain: 0 };
  }
  let newDPS;
  if (sourceStat === STAT.MAIN_STAT_PCT.id) {
    const modifiedService = new StatCalculationService(stats);
    modifiedService.add(STAT.MAIN_STAT_PCT.id, sourceValue);
    newDPS = modifiedService.computeDPS(monsterType);
  } else {
    const modifiedStats = statConfig[sourceStat].applyToStats(stats, sourceValue);
    const modifiedService = new StatCalculationService(modifiedStats);
    newDPS = modifiedService.computeDPS(monsterType);
  }
  const targetDPSGain = (newDPS - baseDPS) / baseDPS * 100;
  return { baseDPS, targetDPSGain };
}
function calculateEquivalentValue(stats, targetStat, targetDPSGain, statConfig, rowTargetType) {
  const originalService = new StatCalculationService(stats);
  const originalBaseDPS = rowTargetType === MONSTER_TYPE.BOSS ? originalService.baseBossDPS : originalService.baseNormalDPS;
  if (originalBaseDPS === 0) {
    return { equivalentValue: 0, verifyGain: 0, unableToMatch: true };
  }
  const statMax = STAT_MAXIMUMS[targetStat];
  let equivalentValue = 0;
  let unableToMatch = false;
  let verifyGain = 0;
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
    verifyGain = (newDPS - originalBaseDPS) / originalBaseDPS * 100;
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
function calculateEquivalency(stats, sourceStat, sourceValue, statConfig) {
  if (sourceValue === 0) {
    return null;
  }
  const { baseDPS, targetDPSGain } = calculateTargetDPSGain(stats, sourceStat, sourceValue, statConfig);
  const equivalents = {};
  Object.entries(statConfig).forEach(([statId, statConfigItem]) => {
    if (statId === sourceStat) return;
    if (sourceStat === STAT.STAT_DAMAGE.id) {
      return;
    }
    if (sourceStat === STAT.BOSS_DAMAGE.id && statId === STAT.NORMAL_DAMAGE.id) {
      equivalents[statId] = {
        value: 0,
        label: "Ineffective (Boss DMG \u2260 Monster target)"
      };
      return;
    }
    if (sourceStat === STAT.NORMAL_DAMAGE.id && statId === STAT.BOSS_DAMAGE.id) {
      equivalents[statId] = {
        value: 0,
        label: "Ineffective (Monster DMG \u2260 Boss target)"
      };
      return;
    }
    let rowTargetType = MONSTER_TYPE.BOSS;
    if (statId === STAT.NORMAL_DAMAGE.id) {
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
      label: unableToMatch ? "Unable to match" : `+${verifyGain.toFixed(2)}%`
    };
  });
  return {
    sourceStat,
    sourceValue,
    equivalents
  };
}
export {
  calculateEquivalency,
  calculateEquivalentValue,
  calculateTargetDPSGain,
  createStatConfig
};
//# sourceMappingURL=stat-equivalency.js.map
