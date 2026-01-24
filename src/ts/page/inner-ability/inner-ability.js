import { innerAbilitiesData } from "@data/inner-ability-data.js";
import { gearLabStore } from "@ts/store/gear-lab-store.js";
import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
function mapInnerAbilityStat(statName, value, baseStats) {
  const service = new StatCalculationService(baseStats);
  switch (statName) {
    case "Attack Speed":
      service.addDiminishingReturnStat("attackSpeed", value, 150);
      break;
    case "Boss Monster Damage":
      service.addPercentageStat("bossDamage", value);
      break;
    case "Critical Rate":
      service.addPercentageStat("critRate", value);
      break;
    case "Damage":
      service.addPercentageStat("damage", value);
      break;
    case "Defense Penetration":
      service.addDiminishingReturnStat("defPen", value, 100);
      break;
    case "Min Damage Multiplier":
      service.addPercentageStat("minDamage", value);
      break;
    case "Max Damage Multiplier":
      service.addPercentageStat("maxDamage", value);
      break;
    case "Normal Monster Damage":
      service.addPercentageStat("normalDamage", value);
      break;
    case "Main Stat":
      service.addMainStat(value);
      break;
    // Ignored stats: Max HP, Max MP, Accuracy, Evasion, MP Recovery Per Sec,
    // Meso Drop, EXP Gain, Debuff Tolerance, Critical Resistance,
    // Damage Tolerance, Damage Taken Decrease
    default:
      break;
  }
  return service.getStats();
}
function applyInnerAbilityLines(baseStats, lines) {
  let modifiedStats = { ...baseStats };
  lines.forEach((line) => {
    if (line.stat && line.value) {
      modifiedStats = mapInnerAbilityStat(line.stat, line.value, modifiedStats);
    }
  });
  return modifiedStats;
}
function getBaselineStats() {
  const baseStats = window.getStats ? window.getStats("base") : {};
  const equippedPresetId = gearLabStore.getEquippedPresetId();
  let baseline = { ...baseStats };
  if (equippedPresetId !== null) {
    const equippedPreset = gearLabStore.getPreset(equippedPresetId);
    if (equippedPreset) {
      equippedPreset.lines.forEach((line) => {
        baseline = mapInnerAbilityStat(line.stat, -line.value, baseline);
      });
    }
  }
  return baseline;
}
function getAllPresets() {
  const presets = gearLabStore.getInnerAbilityPresets();
  return Object.values(presets);
}
function calculatePresetComparisons() {
  const presets = getAllPresets();
  if (presets.length === 0) {
    return [];
  }
  const baseline = getBaselineStats();
  const baselineService = new StatCalculationService(baseline);
  const baselineBossDamage = baselineService.compute("boss");
  const baselineNormalDamage = baselineService.compute("normal");
  const comparisons = [];
  presets.forEach((preset) => {
    const presetStats = applyInnerAbilityLines(baseline, preset.lines);
    const presetService = new StatCalculationService(presetStats);
    const presetBossDamage = presetService.compute("boss");
    const presetNormalDamage = presetService.compute("normal");
    const bossDPSGain = presetBossDamage.dps - baselineBossDamage.dps;
    const normalDPSGain = presetNormalDamage.dps - baselineNormalDamage.dps;
    const lineContributions = preset.lines.map((line, index) => {
      const linesWithoutCurrent = preset.lines.filter((_, i) => i !== index);
      const statsWithoutLine = applyInnerAbilityLines(baseline, linesWithoutCurrent);
      const withoutLineService = new StatCalculationService(statsWithoutLine);
      const damageWithoutLine = withoutLineService.compute("boss");
      const linesWithLine = [...linesWithoutCurrent, line];
      const statsWithLine = applyInnerAbilityLines(baseline, linesWithLine);
      const withLineService = new StatCalculationService(statsWithLine);
      const damageWithLine = withLineService.compute("boss");
      const contribution = damageWithLine.dps - damageWithoutLine.dps;
      return {
        stat: line.stat,
        value: line.value,
        dpsContribution: contribution
      };
    });
    comparisons.push({
      id: preset.id,
      isEquipped: preset.isEquipped,
      lines: preset.lines,
      bossDPSGain,
      normalDPSGain,
      lineContributions
    });
  });
  comparisons.sort((a, b) => b.bossDPSGain - a.bossDPSGain);
  return comparisons;
}
function calculateTheoreticalBest() {
  const results = [];
  const baseline = getBaselineStats();
  const baselineService = new StatCalculationService(baseline);
  const baselineBossDamage = baselineService.compute("boss");
  Object.entries(innerAbilitiesData).forEach(([rarity, rarityData]) => {
    Object.entries(rarityData).forEach(([statName, range]) => {
      if (statName === "lineRate") return;
      const { min, max } = range;
      const mid = (min + max) / 2;
      [
        { roll: "Min", value: min },
        { roll: "Mid", value: mid },
        { roll: "Max", value: max }
      ].forEach(({ roll, value }) => {
        const modifiedStats = mapInnerAbilityStat(statName, value, baseline);
        const testService = new StatCalculationService(modifiedStats);
        const damage = testService.compute("boss");
        const dpsGain = damage.dps - baselineBossDamage.dps;
        const percentIncrease = dpsGain / baselineBossDamage.dps * 100;
        results.push({
          stat: statName,
          rarity,
          roll,
          value,
          dpsGain,
          percentIncrease
        });
      });
    });
  });
  results.sort((a, b) => b.dpsGain - a.dpsGain);
  return results.filter((r) => r.dpsGain > 0);
}
function calculateBestCombinations() {
  const baseline = getBaselineStats();
  const baselineService = new StatCalculationService(baseline);
  const baselineBossDamage = baselineService.compute("boss");
  const allPossibleStats = [];
  Object.entries(innerAbilitiesData).forEach(([rarity, rarityData]) => {
    Object.entries(rarityData).forEach(([statName, range]) => {
      if (statName === "lineRate") return;
      const { max } = range;
      allPossibleStats.push({
        stat: statName,
        rarity,
        value: max,
        rarityOrder: { "Mystic": 5, "Ancient": 4, "Legendary": 3, "Unique": 2, "Epic": 1, "Rare": 0, "Normal": 0 }[rarity] || 0
      });
    });
  });
  function findBestLines(maxLines, allowedRarities) {
    const selectedLines = [];
    let currentStats = { ...baseline };
    for (let i = 0; i < maxLines; i++) {
      let bestLine = null;
      let bestDPSGain = 0;
      const candidateStats = allPossibleStats.filter((s) => allowedRarities.includes(s.rarity));
      candidateStats.forEach((candidate) => {
        const testStats = mapInnerAbilityStat(candidate.stat, candidate.value, currentStats);
        const testService = new StatCalculationService(testStats);
        const currentService = new StatCalculationService(currentStats);
        const testDamage = testService.compute("boss");
        const currentDamage = currentService.compute("boss");
        const dpsGain = testDamage.dps - currentDamage.dps;
        if (dpsGain > bestDPSGain) {
          bestDPSGain = dpsGain;
          bestLine = { ...candidate, dpsGain };
        }
      });
      if (bestLine) {
        selectedLines.push(bestLine);
        currentStats = mapInnerAbilityStat(bestLine.stat, bestLine.value, currentStats);
      }
    }
    const finalService = new StatCalculationService(currentStats);
    const finalDamage = finalService.compute("boss");
    const totalDPS = finalDamage.dps - baselineBossDamage.dps;
    return { lines: selectedLines, totalDPS };
  }
  const uniqueOnly = findBestLines(3, ["Unique"]);
  const uniqueLegendary = findBestLines(5, ["Unique", "Legendary"]);
  const mysticLegendaryUnique = findBestLines(6, ["Mystic", "Legendary", "Unique"]);
  const allRarities = findBestLines(6, ["Mystic", "Legendary", "Unique", "Epic", "Rare", "Normal"]);
  return {
    uniqueOnly,
    uniqueLegendary,
    mysticLegendaryUnique,
    allRarities
  };
}
export {
  applyInnerAbilityLines,
  calculateBestCombinations,
  calculatePresetComparisons,
  calculateTheoreticalBest,
  getAllPresets,
  getBaselineStats,
  mapInnerAbilityStat
};
//# sourceMappingURL=inner-ability.js.map
