import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
function applyEffectsToService(service, effects, isRemoving = false) {
  if (!effects) return service;
  const statTypes = {
    // Flat attack - applies weapon attack bonus
    attack: (value) => isRemoving ? service.subtractAttack(Math.abs(value)) : service.addAttack(value, true),
    // Flat main stat - converts to stat damage (100 main stat = 1% stat damage)
    mainStat: (value) => service.addMainStat(isRemoving ? -Math.abs(value) : value),
    // Main stat % with diminishing returns
    statDamage: (value) => service.addMainStatPct(isRemoving ? -Math.abs(value) : value),
    // Multiplicative stat (Final Damage) - for removal, we need special handling
    // Since multiplicative stats can't be easily reversed, we use subtractStat for removal
    finalDamage: (value) => {
      if (isRemoving) {
        service.subtractStat("finalDamage", value);
      } else {
        service.addMultiplicativeStat("finalDamage", value);
      }
    },
    // Diminishing returns stats - for removal, use subtractStat
    attackSpeed: (value) => {
      if (isRemoving) {
        service.subtractStat("attackSpeed", value);
      } else {
        service.addDiminishingReturnStat("attackSpeed", value, 150);
      }
    },
    defPenMultiplier: (value) => {
      if (isRemoving) {
        service.subtractStat("defPenMultiplier", value);
      } else {
        service.addDiminishingReturnStat("defPenMultiplier", value, 100);
      }
    }
  };
  Object.entries(effects).forEach(([statKey, value]) => {
    if (value === 0 || value === void 0 || value === null) return;
    if (statTypes[statKey]) {
      statTypes[statKey](value);
    } else {
      const adjustedValue = isRemoving ? -Math.abs(value) : value;
      service.addPercentageStat(statKey, adjustedValue);
    }
  });
  return service;
}
function calculateDpsDifference(currentEffects, newEffects, monsterType = "boss") {
  const baseStats = loadoutStore.getBaseStats();
  const baselineService = new StatCalculationService(baseStats, null);
  applyEffectsToService(baselineService, currentEffects, true);
  const baselineDps = baselineService.computeDPS(monsterType);
  const currentService = new StatCalculationService(baseStats, null);
  const currentPresetDps = currentService.computeDPS(monsterType);
  const newService = new StatCalculationService(baseStats, null);
  applyEffectsToService(newService, currentEffects, true);
  applyEffectsToService(newService, newEffects, false);
  const newPresetDps = newService.computeDPS(monsterType);
  const currentPresetGain = currentPresetDps - baselineDps;
  const newPresetGain = newPresetDps - baselineDps;
  const dpsGain = baselineDps > 0 ? (newPresetGain - currentPresetGain) / baselineDps * 100 : 0;
  return {
    baselineDps,
    currentPresetDps,
    newPresetDps,
    currentPresetGain,
    newPresetGain,
    dpsGain
  };
}
function calculateBothDpsDifferences(currentEffects, newEffects) {
  const bossResults = calculateDpsDifference(currentEffects, newEffects, "boss");
  const normalResults = calculateDpsDifference(currentEffects, newEffects, "normal");
  return {
    boss: bossResults,
    normal: normalResults
  };
}
function presetHasAnyCompanion(preset) {
  if (!preset) return false;
  if (preset.main) return true;
  if (preset.subs && preset.subs.some((sub) => sub)) return true;
  return false;
}
function calculatePresetStatValue(preset, targetStat, getCompanionEffects, getCompanion) {
  if (!preset) return 0;
  let total = 0;
  const allSlots = [preset.main, ...preset.subs];
  allSlots.forEach((companionKey) => {
    if (!companionKey) return;
    const [className, rarity] = companionKey.split("-");
    const companionData = getCompanion(companionKey);
    if (!companionData.unlocked) return;
    const level = companionData.level || 1;
    const effects = getCompanionEffects(className, rarity, level);
    if (effects && effects.equipEffect && effects.equipEffect[targetStat]) {
      total += effects.equipEffect[targetStat];
    }
  });
  return total;
}
function generateOptimalPreset(targetStat, getCompanionEffects, getCompanion, getMaxCompanionLevel, lockedMainCompanion = null) {
  const classes = ["Hero", "ArchMageIL", "ArchMageFP", "BowMaster", "NightLord", "Shadower"];
  const rarities = ["Legendary", "Unique", "Epic"];
  const monsterType = targetStat === "bossDamage" ? "boss" : "normal";
  const unlockedCompanions = [];
  rarities.forEach((rarity) => {
    classes.forEach((className) => {
      const companionKey = `${className}-${rarity}`;
      const companionData = getCompanion(companionKey);
      if (!companionData.unlocked) return;
      const level = companionData.level || getMaxCompanionLevel();
      const effects = getCompanionEffects(className, rarity, level);
      if (!effects || !effects.equipEffect) return;
      unlockedCompanions.push({
        companionKey,
        effects: effects.equipEffect
      });
    });
  });
  if (unlockedCompanions.length === 0) {
    return { main: null, subs: [null, null, null, null, null, null] };
  }
  const baseStats = loadoutStore.getBaseStats();
  let bestDps = 0;
  let bestPreset = { main: null, subs: [null, null, null, null, null, null] };
  function* generateCombinations(companions, size, start = 0) {
    if (size === 0) {
      yield [];
      return;
    }
    for (let i = start; i < companions.length; i++) {
      for (const rest of generateCombinations(companions, size - 1, i + 1)) {
        yield [companions[i], ...rest];
      }
    }
  }
  if (lockedMainCompanion) {
    const lockedMainData = unlockedCompanions.find((c) => c.companionKey === lockedMainCompanion);
    if (!lockedMainData) {
      return { main: null, subs: [null, null, null, null, null, null] };
    }
    const subCandidates = unlockedCompanions.filter((c) => c.companionKey !== lockedMainCompanion);
    const maxCombinationsToTest = 5e4;
    let combinationsTested = 0;
    const service = new StatCalculationService(baseStats, null);
    for (const subCombination of generateCombinations(subCandidates, 6)) {
      combinationsTested++;
      if (combinationsTested > maxCombinationsToTest) {
        console.warn(`Reached max combinations limit (${maxCombinationsToTest}), using best found so far`);
        break;
      }
      const totalEffects = {};
      Object.entries(lockedMainData.effects).forEach(([stat, value]) => {
        totalEffects[stat] = (totalEffects[stat] || 0) + value;
      });
      subCombination.forEach((comp) => {
        Object.entries(comp.effects).forEach(([stat, value]) => {
          totalEffects[stat] = (totalEffects[stat] || 0) + value;
        });
      });
      service.reset();
      applyEffectsToService(service, totalEffects, false);
      const dps = service.computeDPS(monsterType);
      if (dps > bestDps) {
        bestDps = dps;
        bestPreset = {
          main: lockedMainCompanion,
          subs: subCombination.map((c) => c.companionKey)
        };
      }
    }
  } else {
    const maxCombinationsToTest = 5e4;
    let combinationsTested = 0;
    const service = new StatCalculationService(baseStats, null);
    for (const combination of generateCombinations(unlockedCompanions, 7)) {
      combinationsTested++;
      if (combinationsTested > maxCombinationsToTest) {
        console.warn(`Reached max combinations limit (${maxCombinationsToTest}), using best found so far`);
        break;
      }
      const mainCompanion = combination[0];
      const subCompanions = combination.slice(1);
      const totalEffects = {};
      Object.entries(mainCompanion.effects).forEach(([stat, value]) => {
        totalEffects[stat] = (totalEffects[stat] || 0) + value;
      });
      subCompanions.forEach((comp) => {
        Object.entries(comp.effects).forEach(([stat, value]) => {
          totalEffects[stat] = (totalEffects[stat] || 0) + value;
        });
      });
      service.reset();
      applyEffectsToService(service, totalEffects, false);
      const dps = service.computeDPS(monsterType);
      if (dps > bestDps) {
        bestDps = dps;
        bestPreset = {
          main: mainCompanion.companionKey,
          subs: subCompanions.map((c) => c.companionKey)
        };
      }
    }
  }
  return bestPreset;
}
export {
  calculateBothDpsDifferences,
  calculateDpsDifference,
  calculatePresetStatValue,
  generateOptimalPreset,
  presetHasAnyCompanion
};
//# sourceMappingURL=companion.js.map
