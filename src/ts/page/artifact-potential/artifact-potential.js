import { artifactPotentialData } from "@ts/data/artifact-potential-data.js";
import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { IGNORED_ARTIFACT_STATS } from "@ts/types/page/artifact-potential/artifact-potential.types.js";
function mapArtifactStat(statName, value, baseStats) {
  const cleanStatName = statName.replace(" (prime)", "");
  const service = new StatCalculationService(baseStats);
  switch (cleanStatName) {
    case "Main Stat %":
      service.add("mainStatPct", value);
      break;
    case "Critical Rate %":
      service.add("critRate", value);
      break;
    case "Min Damage Multiplier %":
      service.add("minDamage", value);
      break;
    case "Max Damage Multiplier %":
      service.add("maxDamage", value);
      break;
    case "Boss Monster Damage %":
      service.add("bossDamage", value);
      break;
    case "Normal Monster Damage %":
      service.add("normalDamage", value);
      break;
    case "Damage %":
      service.add("damage", value);
      break;
    case "Defense Penetration %":
      service.add("defPen", value);
      break;
    // Ignored stats: Damage Taken Decrease %, Defense %, Accuracy, Status Effect Damage %
    default:
      break;
  }
  return service.getStats();
}
function getBaselineStats() {
  return loadoutStore.getBaseStats();
}
function calculateArtifactPotentialRankings() {
  const baseStats = getBaselineStats();
  const baselineService = new StatCalculationService(baseStats);
  const baselineBossDamage = baselineService.compute("boss");
  const baselineNormalDamage = baselineService.compute("normal");
  const results = [];
  Object.entries(artifactPotentialData).forEach(([rarity, stats]) => {
    Object.entries(stats).forEach(([statName, value]) => {
      if (IGNORED_ARTIFACT_STATS.includes(statName)) {
        return;
      }
      const modifiedStats = mapArtifactStat(statName, value, baseStats);
      const testService = new StatCalculationService(modifiedStats);
      const bossDamage = testService.compute("boss");
      const normalDamage = testService.compute("normal");
      const bossDPSGain = bossDamage.dps - baselineBossDamage.dps;
      const normalDPSGain = normalDamage.dps - baselineNormalDamage.dps;
      const avgDPSGain = (bossDPSGain + normalDPSGain) / 2;
      const bossDPSPercentChange = baselineBossDamage.dps > 0 ? bossDPSGain / baselineBossDamage.dps * 100 : 0;
      const normalDPSPercentChange = baselineNormalDamage.dps > 0 ? normalDPSGain / baselineNormalDamage.dps * 100 : 0;
      const avgDPSPercentChange = (bossDPSPercentChange + normalDPSPercentChange) / 2;
      if (avgDPSGain > 0) {
        let displayName = statName;
        if (statName.includes("(prime)")) {
          displayName = statName.replace(" (prime)", " (Prime)");
        }
        results.push({
          rarity,
          stat: displayName,
          value: `${value}%`,
          bossDPSGain,
          normalDPSGain,
          avgDPSGain,
          bossDPSPercentChange,
          normalDPSPercentChange,
          avgDPSPercentChange
        });
      }
    });
  });
  results.sort((a, b) => b.avgDPSGain - a.avgDPSGain);
  return results;
}
let artifactSortColumn = 5;
let artifactSortAsc = false;
function getArtifactSortColumn() {
  return artifactSortColumn;
}
function setArtifactSortColumn(column) {
  artifactSortColumn = column;
}
function getArtifactSortAsc() {
  return artifactSortAsc;
}
function toggleArtifactSortAsc() {
  artifactSortAsc = !artifactSortAsc;
}
export {
  calculateArtifactPotentialRankings,
  getArtifactSortAsc,
  getArtifactSortColumn,
  getBaselineStats,
  mapArtifactStat,
  setArtifactSortColumn,
  toggleArtifactSortAsc
};
//# sourceMappingURL=artifact-potential.js.map
