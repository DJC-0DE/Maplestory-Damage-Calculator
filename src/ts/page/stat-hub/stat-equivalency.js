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
        service.addAttack(value);
        return service.getStats();
      },
      formatValue: (val) => val.toLocaleString()
    },
    "mainStat": {
      label: "Main Stat",
      getValue: () => getValueFn("mainStat"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addMainStat(value);
        return service.getStats();
      },
      formatValue: (val) => val.toLocaleString()
    },
    "mainStatPct": {
      label: "Main Stat %",
      getValue: () => getValueFn("mainStatPct"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addMainStatPct(value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "skillCoeff": {
      label: "Skill Coefficient",
      getValue: () => getValueFn("skillCoeff"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.SKILL_COEFFICIENT.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "skillMastery": {
      label: "Skill Mastery",
      getValue: () => getValueFn("skillMastery"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.MASTERY.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "damage": {
      label: "Damage",
      getValue: () => getValueFn("damage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "finalDamage": {
      label: "Final Damage",
      getValue: () => getValueFn("finalDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addMultiplicativeStat(STAT.FINAL_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "bossDamage": {
      label: "Boss Damage",
      getValue: () => getValueFn("bossDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.BOSS_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "normalDamage": {
      label: "Monster Damage",
      getValue: () => getValueFn("normalDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.NORMAL_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "damageAmp": {
      label: "Damage Amplification",
      getValue: () => getValueFn("damageAmp"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.DAMAGE_AMP.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}x`
    },
    "minDamage": {
      label: "Min Damage Multiplier",
      getValue: () => getValueFn("minDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.MIN_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "maxDamage": {
      label: "Max Damage Multiplier",
      getValue: () => getValueFn("maxDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.MAX_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "critRate": {
      label: "Critical Rate",
      getValue: () => getValueFn("critRate"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.CRIT_RATE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "critDamage": {
      label: "Critical Damage",
      getValue: () => getValueFn("critDamage"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addPercentageStat(STAT.CRIT_DAMAGE.id, value);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "attackSpeed": {
      label: "Attack Speed",
      getValue: () => getValueFn("attackSpeed"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addDiminishingReturnStat(STAT.ATTACK_SPEED.id, value, 150);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    },
    "defPen": {
      label: "Defense Penetration",
      getValue: () => getValueFn("defPen"),
      applyToStats: (stats, value) => {
        const service = new StatCalculationService(stats);
        service.addDiminishingReturnStat(STAT.DEF_PEN.id, value, 100);
        return service.getStats();
      },
      formatValue: (val) => `${val.toFixed(2)}%`
    }
  };
}
function calculateTargetDPSGain(stats, sourceStat, sourceValue, statConfig) {
  const baseService = new StatCalculationService(stats);
  const baseDPS = baseService.baseBossDPS;
  if (sourceValue === 0) {
    return { baseDPS, targetDPSGain: 0 };
  }
  let newDPS;
  if (sourceStat === "mainStatPct") {
    const modifiedService = new StatCalculationService(stats);
    modifiedService.addMainStatPct(sourceValue);
    newDPS = modifiedService.computeDPS(MONSTER_TYPE.BOSS);
  } else {
    const modifiedStats = statConfig[sourceStat].applyToStats(stats, sourceValue);
    const modifiedService = new StatCalculationService(modifiedStats);
    newDPS = modifiedService.computeDPS(MONSTER_TYPE.BOSS);
  }
  const targetDPSGain = (newDPS - baseDPS) / baseDPS * 100;
  return { baseDPS, targetDPSGain };
}
function calculateEquivalentValue(stats, targetStat, targetDPSGain, statConfig, rowTargetType) {
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
    const baseDPS = rowTargetType === MONSTER_TYPE.BOSS ? modifiedService.baseBossDPS : modifiedService.baseNormalDPS;
    verifyGain = (newDPS - baseDPS) / baseDPS * 100;
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
    if (sourceStat === "statDamage") {
      return;
    }
    if (sourceStat === "bossDamage" && statId === "normalDamage") {
      equivalents[statId] = {
        value: 0,
        label: "Ineffective (Boss DMG \u2260 Monster target)"
      };
      return;
    }
    if (sourceStat === "normalDamage" && statId === "bossDamage") {
      equivalents[statId] = {
        value: 0,
        label: "Ineffective (Monster DMG \u2260 Boss target)"
      };
      return;
    }
    let rowTargetType = MONSTER_TYPE.BOSS;
    if (statId === "normalDamage") {
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
