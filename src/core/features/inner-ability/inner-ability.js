// Inner Ability stat mapping and calculations

import { innerAbilitiesData } from "@data/inner-ability-data.js";
import { formatNumber } from "@utils/formatters.js";
import { getStats } from "@core/main.js";
import { StatCalculationService } from "@core/services/stat-calculation-service.js";

window.switchInnerAbilityTab = switchInnerAbilityTab;
window.toggleLineBreakdown = toggleLineBreakdown;
window.sortPresetTable = sortPresetTable;
window.sortTheoreticalTable = sortTheoreticalTable;
window.getAllPresets = getAllPresets;
window.applyInnerAbilityLines = applyInnerAbilityLines;

// Map inner ability stats to base stat properties
export function mapInnerAbilityStat(statName, value, baseStats) {
  // Use StatCalculationService for consistent stat manipulation
  const service = new StatCalculationService(baseStats);

  switch (statName) {
    case "Attack Speed":
      // Attack Speed uses diminishing returns with factor 150
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
      // Defense Penetration uses diminishing returns with factor 100
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
    case "Main Stat": {
      // Convert Main Stat to Stat Damage % at 100:1 ratio
      service.addMainStat(value);
      break;
    }
    // Ignored stats: Max HP, Max MP, Accuracy, Evasion, MP Recovery Per Sec,
    // Meso Drop, EXP Gain, Debuff Tolerance, Critical Resistance,
    // Damage Tolerance, Damage Taken Decrease
    default:
      // No effect on damage
      break;
  }

  return service.getStats();
}

// Apply multiple inner ability lines to base stats
export function applyInnerAbilityLines(baseStats, lines) {
  let modifiedStats = { ...baseStats };

  lines.forEach((line) => {
    if (line.stat && line.value) {
      modifiedStats = mapInnerAbilityStat(line.stat, line.value, modifiedStats);
    }
  });

  return modifiedStats;
}

// Compute baseline stats (base minus equipped inner ability lines)
export function getBaselineStats() {
  const baseStats = getStats("base");
  const presets = getAllPresets();
  const equippedPreset = presets.find((p) => p.isEquipped);

  let baseline = { ...baseStats };
  if (equippedPreset) {
    equippedPreset.lines.forEach((line) => {
      baseline = mapInnerAbilityStat(line.stat, -line.value, baseline);
    });
  }

  return baseline;
}

// Get all configured presets
export function getAllPresets() {
  const presets = [];

  for (let i = 1; i <= 10; i++) {
    const isEquipped =
      document.getElementById(`preset-${i}-equipped`)?.checked || false;
    const lines = [];

    for (let j = 1; j <= 6; j++) {
      const stat =
        document.getElementById(`preset-${i}-line-${j}-stat`)?.value || "";
      const value =
        parseFloat(
          document.getElementById(`preset-${i}-line-${j}-value`)?.value,
        ) || 0;

      if (stat && value) {
        lines.push({ stat, value });
      }
    }

    if (lines.length > 0) {
      presets.push({ id: i, isEquipped, lines });
    }
  }

  return presets;
}

// Calculate preset comparison data
export function calculatePresetComparisons() {
  const presets = getAllPresets();

  if (presets.length === 0) {
    return [];
  }

  // Calculate baseline (base stats without equipped IA)
  let baseline = getBaselineStats();

  // Calculate baseline damage using StatCalculationService
  const baselineService = new StatCalculationService(baseline);
  const baselineBossDamage = baselineService.compute("boss");
  const baselineNormalDamage = baselineService.compute("normal");

  const comparisons = [];

  presets.forEach((preset) => {
    // Apply this preset's stats to baseline
    const presetStats = applyInnerAbilityLines(baseline, preset.lines);

    // Calculate damage with this preset using StatCalculationService
    const presetService = new StatCalculationService(presetStats);
    const presetBossDamage = presetService.compute("boss");
    const presetNormalDamage = presetService.compute("normal");

    // Calculate DPS gains
    const bossDPSGain = presetBossDamage.dps - baselineBossDamage.dps;
    const normalDPSGain = presetNormalDamage.dps - baselineNormalDamage.dps;

    // Calculate line-by-line contributions
    const lineContributions = preset.lines.map((line, index) => {
      // Calculate damage without this line
      const linesWithoutCurrent = preset.lines.filter((_, i) => i !== index);
      const statsWithoutLine = applyInnerAbilityLines(
        baseline,
        linesWithoutCurrent,
      );
      const withoutLineService = new StatCalculationService(statsWithoutLine);
      const damageWithoutLine = withoutLineService.compute("boss");

      // Calculate damage with this line
      const statsWithLine = applyInnerAbilityLines(baseline, [
        ...linesWithoutCurrent,
        line,
      ]);
      const withLineService = new StatCalculationService(statsWithLine);
      const damageWithLine = withLineService.compute("boss");

      const contribution = damageWithLine.dps - damageWithoutLine.dps;

      return {
        stat: line.stat,
        value: line.value,
        dpsContribution: contribution,
      };
    });

    comparisons.push({
      id: preset.id,
      isEquipped: preset.isEquipped,
      lines: preset.lines,
      bossDPSGain,
      normalDPSGain,
      lineContributions,
    });
  });

  // Sort by boss DPS gain (descending)
  comparisons.sort((a, b) => b.bossDPSGain - a.bossDPSGain);

  return comparisons;
}

// Calculate all theoretical stat possibilities
export function calculateTheoreticalBest() {
  const results = [];

  // Get equipped preset to subtract from base
  const baseline = getBaselineStats();

  // Calculate baseline damage using StatCalculationService
  const baselineService = new StatCalculationService(baseline);
  const baselineBossDamage = baselineService.compute("boss");

  // Iterate through each rarity and stat
  Object.entries(innerAbilitiesData).forEach(([rarity, stats]) => {
    Object.entries(stats).forEach(([statName, ranges]) => {
      const min = ranges.min;
      const max = ranges.max;
      const mid = (min + max) / 2;

      // Calculate DPS for min, mid, max rolls
      [
        { roll: "Min", value: min },
        { roll: "Mid", value: mid },
        { roll: "Max", value: max },
      ].forEach(({ roll, value }) => {
        const modifiedStats = mapInnerAbilityStat(statName, value, baseline);
        const testService = new StatCalculationService(modifiedStats);
        const damage = testService.compute("boss");
        const dpsGain = damage.dps - baselineBossDamage.dps;
        const percentIncrease = (dpsGain / baselineBossDamage.dps) * 100;

        results.push({
          stat: statName,
          rarity,
          roll,
          value,
          dpsGain,
          percentIncrease,
        });
      });
    });
  });

  // Sort by DPS gain (descending) and filter out zero/negative gains
  results.sort((a, b) => b.dpsGain - a.dpsGain);

  // Only return stats that actually increase damage
  return results.filter((r) => r.dpsGain > 0);
}

// Calculate best possible combinations
export function calculateBestCombinations() {
  const baseline = getBaselineStats();

  // Calculate baseline damage using StatCalculationService
  const baselineService = new StatCalculationService(baseline);
  const baselineBossDamage = baselineService.compute("boss");

  // Get all possible stats with their max values
  const allPossibleStats = [];
  Object.entries(innerAbilitiesData).forEach(([rarity, stats]) => {
    Object.entries(stats).forEach(([statName, ranges]) => {
      allPossibleStats.push({
        stat: statName,
        rarity,
        value: ranges.max,
        rarityOrder:
          {
            Mystic: 5,
            Ancient: 4,
            Legendary: 3,
            Unique: 2,
            Epic: 1,
            Rare: 0,
            Normal: 0,
          }[rarity] || 0,
      });
    });
  });

  // Iteratively find best lines accounting for diminishing returns
  function findBestLines(maxLines, allowedRarities) {
    const selectedLines = [];
    let currentStats = { ...baseline };

    for (let i = 0; i < maxLines; i++) {
      let bestLine = null;
      let bestDPSGain = 0;

      // Filter by allowed rarities
      const candidateStats = allPossibleStats.filter((s) =>
        allowedRarities.includes(s.rarity),
      );

      // Test each possible stat to see which gives the best gain
      candidateStats.forEach((candidate) => {
        const testStats = mapInnerAbilityStat(
          candidate.stat,
          candidate.value,
          currentStats,
        );
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
        // Update current stats to include this line for next iteration
        currentStats = mapInnerAbilityStat(
          bestLine.stat,
          bestLine.value,
          currentStats,
        );
      }
    }

    // Calculate total DPS using StatCalculationService
    const finalService = new StatCalculationService(currentStats);
    const finalDamage = finalService.compute("boss");
    const totalDPS = finalDamage.dps - baselineBossDamage.dps;

    return { lines: selectedLines, totalDPS };
  }

  // Scenario 1: Best with Unique only (3 lines)
  const uniqueOnly = findBestLines(3, ["Unique"]);

  // Scenario 2: Best with Unique + Legendary (up to 5 lines)
  const uniqueLegendary = findBestLines(5, ["Unique", "Legendary"]);

  // Scenario 3: Best with Unique + Legendary + Mystic (up to 6 lines)
  const mysticLegendaryUnique = findBestLines(6, [
    "Mystic",
    "Legendary",
    "Unique",
  ]);

  // Scenario 4: Best with all rarities (6 lines)
  const allRarities = findBestLines(6, [
    "Mystic",
    "Legendary",
    "Unique",
    "Epic",
    "Rare",
    "Normal",
  ]);

  return {
    uniqueOnly,
    uniqueLegendary,
    mysticLegendaryUnique,
    allRarities,
  };
}

// Switch inner ability sub-tabs
export function switchInnerAbilityTab(tabName) {
  const allSubTabContent = document.querySelectorAll(".inner-ability-subtab");
  const allSubTabButtons = document.querySelectorAll(
    "#inner-ability-tab-button",
  );

  // Hide all subtabs
  allSubTabContent.forEach((tab) => {
    tab.classList.remove("active");
    tab.style.display = "none";
  });

  // Remove active from all buttons - update to use new tab-button class
  allSubTabButtons.forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected subtab
  const selectedTab = document.getElementById(`inner-ability-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.add("active");
    selectedTab.style.display = "block";
  }

  // Activate button - Find the button by matching the onclick attribute
  // This works both when called from a click event and during initialization
  allSubTabButtons.forEach((btn) => {
    const onclickAttr = btn.getAttribute("onclick");
    if (onclickAttr && onclickAttr.includes(`${tabName}`)) {
      btn.classList.add("active");
    }
  });

  // Render content
  if (tabName === "preset-comparison") {
    renderPresetComparison();
  } else if (tabName === "theoretical-best") {
    renderTheoreticalBest();
  }
}

// Render Preset Comparison table
export function renderPresetComparison() {
  const container = document.getElementById("preset-comparison-container");
  if (!container) return;

  const comparisons = calculatePresetComparisons();

  if (comparisons.length === 0) {
    container.innerHTML =
      '<div class="ia-empty-state">No configured presets found. Add lines to your presets in the My Ability Pages tab.</div>';
    return;
  }

  // Apply sorting based on current column and direction
  comparisons.sort((a, b) => {
    let valA, valB;
    switch (presetSortColumn) {
      case 0: // Rank - sort by boss DPS gain (already sorted)
        valA = a.bossDPSGain;
        valB = b.bossDPSGain;
        break;
      case 1: // Preset
        valA = a.id;
        valB = b.id;
        break;
      case 2: // Boss DPS Gain
        valA = a.bossDPSGain;
        valB = b.bossDPSGain;
        break;
      case 3: // Normal DPS Gain
        valA = a.normalDPSGain;
        valB = b.normalDPSGain;
        break;
      default:
        return 0;
    }
    return presetSortAsc ? valA - valB : valB - valA;
  });

  let html = '<div class="table-wrapper">';
  html += '<table class="table"><thead><tr>';
  html += '<th class="sortable" onclick="sortPresetTable(0)">Rank</th>';
  html += '<th class="sortable" onclick="sortPresetTable(1)">Preset</th>';
  html +=
    '<th class="sortable" onclick="sortPresetTable(2)">Boss DPS Gain</th>';
  html +=
    '<th class="sortable" onclick="sortPresetTable(3)">Normal DPS Gain</th>';
  html += "</tr></thead><tbody>";

  // Find equipped preset for percent difference calculation
  const equippedComp = comparisons.find((c) => c.isEquipped);
  const equippedBossDPS = equippedComp ? equippedComp.bossDPSGain : null;
  const equippedNormalDPS = equippedComp ? equippedComp.normalDPSGain : null;

  // helper to render a DPS cell (numeric + percent vs equipped when applicable)
  function makeDpsCell(gain, equippedGain, isEquippedRow) {
    if (equippedComp && !isEquippedRow) {
      const percent =
        equippedGain !== 0 ? ((gain - equippedGain) / equippedGain) * 100 : 0;
      const cls = percent >= 0 ? "ia-dps-positive" : "ia-dps-negative";
      return `<td><span class="ia-dps-value ${cls}">+${formatNumber(gain)} <span class="ia-dps-percent">(${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%)</span></span></td>`;
    } else {
      // No equipped preset or this is the equipped row — plain value
      return `<td><span class="ia-dps-value">+${formatNumber(gain)}</span></td>`;
    }
  }

  comparisons.forEach((comp, index) => {
    const rankClass = index < 3 ? `badge--rank-${index + 1}` : "rank-default";
    const rankBadge = `<span class="badge ${rankClass}">${index + 1}</span>`;
    const equippedBadge = comp.isEquipped
      ? '<span class="ia-equipped-badge">Equipped</span>'
      : "";

    html += `<tr class="expandable" onclick="toggleLineBreakdown(${comp.id})">`;
    html += `<td>${rankBadge}</td>`;
    html += `<td>Preset ${comp.id}${equippedBadge}</td>`;

    html += makeDpsCell(comp.bossDPSGain, equippedBossDPS, comp.isEquipped);
    html += makeDpsCell(comp.normalDPSGain, equippedNormalDPS, comp.isEquipped);
    html += "</tr>";

    // Line breakdown row
    html += `<tr id="breakdown-${comp.id}" class="ia-line-breakdown-row" style="display: none;"><td colspan="4">`;
    html += '<div class="ia-line-breakdown-content">';
    comp.lineContributions.forEach((line) => {
      html += `<div class="ia-line-breakdown-item">`;
      html += `<span class="ia-line-breakdown-stat">${line.stat}: ${line.value}</span>`;
      html += `<span class="ia-line-breakdown-value">+${formatNumber(line.dpsContribution)} DPS</span>`;
      html += `</div>`;
    });
    html += `<div class="ia-line-breakdown-item">`;
    html += `<span class="ia-line-breakdown-stat"><strong>Total</strong></span>`;
    html += `<span class="ia-line-breakdown-value"><strong>+${formatNumber(comp.bossDPSGain)} DPS</strong></span>`;
    html += `</div>`;
    html += "</div></td></tr>";
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

// Render Theoretical Best table
export function renderTheoreticalBest() {
  const container = document.getElementById("theoretical-best-container");
  if (!container) return;

  const results = calculateTheoreticalBest();
  const combinations = calculateBestCombinations();

  // Calculate baseline damage using StatCalculationService
  const baselineService = new StatCalculationService(getBaselineStats());
  const baselineBossDamage = baselineService.compute("boss");
  const baselineBossDps = baselineBossDamage.dps;
  // Apply sorting based on current column and direction
  if (theoreticalSortColumn === 2) {
    results.sort((a, b) => {
      return theoreticalSortAsc ? a.dpsGain - b.dpsGain : b.dpsGain - a.dpsGain;
    });
  }

  let html = '<div class="ia-theoretical-section">';
  html += '<h3 class="title">All Possible Rolls Ranked</h3>';
  html += '<div class="table-scrollable">';
  html += '<table class="table"><thead><tr>';
  html += "<th>Stat & Roll</th>";
  html += "<th>Value</th>";
  html +=
    '<th class="sortable" onclick="sortTheoreticalTable(2)">DPS Gain</th>';
  html += "</tr></thead><tbody>";

  results.forEach((result) => {
    const rarityLetter = result.rarity.charAt(0).toUpperCase();
    const rarityClass = `rarity-${result.rarity.toLowerCase()}`;
    const badge = `<span class="badge badge--rarity ${rarityClass}">${rarityLetter}</span>`;
    const percentClass =
      result.percentIncrease > 0 ? "ia-dps-positive" : "ia-dps-negative";

    html += "<tr>";
    html += `<td>${badge}${result.stat} ${result.roll} Roll</td>`;
    html += `<td class="ia-dps-value">${result.value}</td>`;
    html += `<td><span class="ia-dps-value">+${formatNumber(result.dpsGain)}</span> <span class="${percentClass} ia-dps-percent">(${result.percentIncrease >= 0 ? "+" : ""}${result.percentIncrease.toFixed(2)}%)</span></td>`;
    html += "</tr>";
  });

  html += "</tbody></table></div></div>";

  // Best Combinations
  html += '<div class="ia-theoretical-section">';
  html += '<h3 class="title">Best Possible Combinations</h3>';

  // Unique Only
  html += '<div class="ia-combo-card">';
  html +=
    '<h4><span class="badge badge--rarity rarity-unique">U</span>Best with Unique Only (3 Lines)</h4>';
  html += '<div class="ia-combo-lines">';
  combinations.uniqueOnly.lines.forEach((line) => {
    const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
    html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
  });
  html += "</div>";
  {
    const percent = (combinations.uniqueOnly.totalDPS / baselineBossDps) * 100;
    html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.uniqueOnly.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%)</span></div>`;
  }
  html += "</div>";

  // Unique + Legendary
  html += '<div class="ia-combo-card">';
  html +=
    '<h4><span class="badge badge--rarity rarity-unique">U</span><span class="badge badge--rarity rarity-legendary">L</span>Best with Unique + Legendary (Up to 5 Lines)</h4>';
  html += '<div class="ia-combo-lines">';
  combinations.uniqueLegendary.lines.forEach((line) => {
    const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
    html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
  });
  html += "</div>";
  {
    const percent =
      (combinations.uniqueLegendary.totalDPS / baselineBossDps) * 100;
    html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.uniqueLegendary.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%)</span></div>`;
  }
  html += "</div>";

  // Mystic + Legendary + Unique
  html += '<div class="ia-combo-card">';
  html +=
    '<h4><span class="badge badge--rarity rarity-mystic">M</span><span class="badge badge--rarity rarity-legendary">L</span><span class="badge badge--rarity rarity-unique">U</span>Best with Mystic + Legendary + Unique (Up to 6 Lines)</h4>';
  html += '<div class="ia-combo-lines">';
  combinations.mysticLegendaryUnique.lines.forEach((line) => {
    const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
    html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
  });
  html += "</div>";
  {
    const percent =
      (combinations.mysticLegendaryUnique.totalDPS / baselineBossDps) * 100;
    html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.mysticLegendaryUnique.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%)</span></div>`;
  }
  html += "</div>";

  // All Rarities
  html += '<div class="ia-combo-card">';
  html += "<h4>Best with All Rarities (6 Lines)</h4>";
  html += '<div class="ia-combo-lines">';
  combinations.allRarities.lines.forEach((line) => {
    const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
    html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
  });
  html += "</div>";
  {
    const percent = (combinations.allRarities.totalDPS / baselineBossDps) * 100;
    html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.allRarities.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%)</span></div>`;
  }
  html += "</div></div>";

  container.innerHTML = html;
}

// Toggle line breakdown visibility
export function toggleLineBreakdown(presetId) {
  const row = document.getElementById(`breakdown-${presetId}`);
  if (row) {
    row.style.display = row.style.display === "none" ? "table-row" : "none";
  }
}

// Sort preset table
let presetSortColumn = 2;
let presetSortAsc = false;

export function sortPresetTable(column) {
  if (presetSortColumn === column) {
    presetSortAsc = !presetSortAsc;
  } else {
    presetSortColumn = column;
    presetSortAsc = false;
  }
  renderPresetComparison();
}

// Sort theoretical table
let theoreticalSortColumn = 2;
let theoreticalSortAsc = false;

export function sortTheoreticalTable(column) {
  if (theoreticalSortColumn === column) {
    theoreticalSortAsc = !theoreticalSortAsc;
  } else {
    theoreticalSortColumn = column;
    theoreticalSortAsc = false;
  }
  renderTheoreticalBest();
}

// Initialize Inner Ability Analysis
export function initializeInnerAbilityAnalysis() {
  // Pre-render other tabs
  renderPresetComparison();
  renderTheoreticalBest();
}
