import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { STAT } from "@ts/types/constants.js";
import {
  CLASS_MAIN_STAT_MAP,
  SLOT_SPECIFIC_POTENTIALS,
  EQUIPMENT_POTENTIAL_DATA,
  SLOT_NAMES,
  NON_COMBAT_POTENTIAL_STATS,
  POTENTIAL_STAT_TO_STAT_ID
} from "@ts/page/cube-potential/cube-potential-data.js";
let currentCubeSlot = "helm";
let currentPotentialType = "regular";
const rankingsCache = {};
const rankingsInProgress = {};
function getRarityColor(rarity) {
  const colors = {
    "normal": "#9ca3af",
    // Gray
    "rare": "#60a5fa",
    // Blue
    "epic": "#a78bfa",
    // Purple
    "unique": "#fbbf24",
    // Yellow/Gold
    "legendary": "#33ce85",
    // Green
    "mystic": "#ff3f42"
    // Red
  };
  return colors[rarity] || colors["normal"];
}
function getMainStatForClass() {
  const selectedClass = loadoutStore.getSelectedClass();
  if (!selectedClass) return null;
  return CLASS_MAIN_STAT_MAP[selectedClass] || null;
}
function getStatIdFromPotentialStat(potentialStat, mainStat) {
  if (NON_COMBAT_POTENTIAL_STATS.includes(potentialStat)) {
    return null;
  }
  if (mainStat && potentialStat === `${mainStat} %`) {
    return STAT.MAIN_STAT_PCT.id;
  }
  if (mainStat && potentialStat === mainStat) {
    return STAT.PRIMARY_MAIN_STAT.id;
  }
  return POTENTIAL_STAT_TO_STAT_ID[potentialStat] || null;
}
function lineExistsInRarity(slotId, rarity, lineNum, lineStat, lineValue, linePrime) {
  if (!lineStat) return false;
  const potentialData = EQUIPMENT_POTENTIAL_DATA[rarity];
  if (!potentialData) return false;
  const lineKey = `line${lineNum}`;
  let availableLines = [...potentialData[lineKey] || []];
  if (SLOT_SPECIFIC_POTENTIALS[slotId] && SLOT_SPECIFIC_POTENTIALS[slotId][rarity]) {
    const slotSpecificLines = SLOT_SPECIFIC_POTENTIALS[slotId][rarity][lineKey];
    if (slotSpecificLines) {
      availableLines = [...slotSpecificLines, ...availableLines];
    }
  }
  return availableLines.some(
    (line) => line.stat === lineStat && line.value === lineValue && line.prime === linePrime
  );
}
function calculateSlotSetGain(slotId, rarity, setData, currentStats) {
  const mainStat = getMainStatForClass();
  const baselineService = new StatCalculationService(currentStats);
  for (let lineNum = 1; lineNum <= 3; lineNum++) {
    const lineKey = `line${lineNum}`;
    const line = setData[lineKey];
    if (!line || !line.stat) continue;
    if (!lineExistsInRarity(slotId, rarity, lineNum, line.stat, line.value, line.prime)) continue;
    const statId = getStatIdFromPotentialStat(line.stat, mainStat);
    if (!statId) continue;
    baselineService.subtractStat(statId, line.value);
  }
  const baselineDPS = baselineService.computeDPS("boss");
  const setService = new StatCalculationService(baselineService.getStats());
  for (let lineNum = 1; lineNum <= 3; lineNum++) {
    const lineKey = `line${lineNum}`;
    const line = setData[lineKey];
    if (!line || !line.stat) continue;
    if (!lineExistsInRarity(slotId, rarity, lineNum, line.stat, line.value, line.prime)) continue;
    const statId = getStatIdFromPotentialStat(line.stat, mainStat);
    if (!statId) continue;
    setService.addPercentageStat(statId, line.value);
  }
  const setDPS = setService.computeDPS("boss");
  const gain = (setDPS - baselineDPS) / baselineDPS * 100;
  return { gain, stats: setService.getStats(), baselineStats: baselineService.getStats() };
}
function calculateComparison(cubeSlotData, currentCubeSlot2, currentPotentialType2) {
  const selectedClass = loadoutStore.getSelectedClass();
  if (!selectedClass) {
    return null;
  }
  if (Object.keys(cubeSlotData).length === 0) {
    return null;
  }
  const slotData = cubeSlotData[currentCubeSlot2][currentPotentialType2];
  const currentStats = loadoutStore.getBaseStats();
  const rarity = slotData.rarity;
  const setAResult = calculateSlotSetGain(currentCubeSlot2, rarity, slotData.setA, currentStats);
  const setAGain = setAResult.gain;
  const setAStats = setAResult.stats;
  const baselineStats = setAResult.baselineStats;
  const setBResult = calculateSlotSetGain(currentCubeSlot2, rarity, slotData.setB, baselineStats);
  const setBStats = setBResult.stats;
  const baselineDPS = new StatCalculationService(baselineStats).computeDPS("boss");
  const setADPS = new StatCalculationService(setAStats).computeDPS("boss");
  const setBDPS = new StatCalculationService(setBStats).computeDPS("boss");
  const setBAbsoluteGain = (setBDPS - baselineDPS) / baselineDPS * 100;
  const setBGain = (setBDPS - setADPS) / setADPS * 100;
  const deltaGain = setBGain - setAGain;
  return {
    setAGain,
    setBGain,
    setBAbsoluteGain,
    // For ranking comparison
    deltaGain,
    setAStats,
    setBStats,
    slotId: currentCubeSlot2,
    rarity: cubeSlotData[currentCubeSlot2][currentPotentialType2].rarity
  };
}
function getPercentileForGain(slotId, rarity, dpsGain, rankingsCache2, rankingsInProgress2) {
  const key = `${slotId}-${rarity}`;
  const rankings = rankingsCache2[slotId]?.[rarity];
  if (rankingsInProgress2[key]) {
    return '<span style="color: var(--text-secondary); font-style: italic;">Loading...</span>';
  }
  if (!rankings || rankings.length === 0) {
    return '<span style="color: var(--text-secondary);">\u2014</span>';
  }
  let percentileValue = 0;
  for (let i = 0; i < rankings.length; i++) {
    if (rankings[i].dpsGain <= dpsGain) {
      percentileValue = i / rankings.length * 100;
      break;
    }
  }
  if (percentileValue === 0 && dpsGain >= rankings[0].dpsGain) percentileValue = 0;
  if (percentileValue === 0 && dpsGain < rankings[rankings.length - 1].dpsGain) percentileValue = 100;
  const percentile = percentileValue.toFixed(1);
  return `<span style="color: var(--accent-primary);">Top ${percentile}%</span>`;
}
async function initializeCubePotential() {
  console.log("Cube Potential: Initialization complete");
}
function clearCubeRankingsCache() {
  for (const slotId of SLOT_NAMES) {
    if (rankingsCache[slotId.id]) {
      rankingsCache[slotId.id] = {};
    }
  }
  for (const key in rankingsInProgress) {
    delete rankingsInProgress[key];
  }
  console.log("Cube Potential: Rankings cache cleared");
}
function switchPotentialType(type) {
  currentPotentialType = type;
}
function selectCubeSlot(slotId) {
  currentCubeSlot = slotId;
}
export {
  calculateComparison,
  calculateSlotSetGain,
  clearCubeRankingsCache,
  currentCubeSlot,
  currentPotentialType,
  getMainStatForClass,
  getPercentileForGain,
  getRarityColor,
  getStatIdFromPotentialStat,
  initializeCubePotential,
  lineExistsInRarity,
  rankingsCache,
  rankingsInProgress,
  selectCubeSlot,
  switchPotentialType
};
//# sourceMappingURL=cube-potential.js.map
