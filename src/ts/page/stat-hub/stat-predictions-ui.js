import { formatNumber } from "@ts/utils/formatters.js";
import { calculateAllStatWeights } from "./stat-predictions.js";
import { PERCENTAGE_STATS, MULTIPLICATIVE_STATS, DEFAULT_STAT_INCREASES } from "./stat-predictions.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
function formatStatValue(value, statKey) {
  if (statKey === "damageAmp") {
    return `+${value.toFixed(1)}x`;
  }
  return `+${formatNumber(value)}`;
}
function generateStatTooltip(statKey, increase, oldValue, newValue, gainPercentage, effectiveIncrease) {
  if (statKey === "attack") {
    return `+${formatNumber(increase)} Attack
Old: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}
Effective: +${formatNumber(effectiveIncrease || 0)}
Gain: ${gainPercentage.toFixed(2)}%`;
  } else if (statKey === "mainStat") {
    const actualMainStatGain = effectiveIncrease || increase;
    return `+${formatNumber(actualMainStatGain)} Main Stat
+${formatNumber(actualMainStatGain)} Attack
+${(actualMainStatGain / 100).toFixed(2)}% Stat Damage
Gain: ${gainPercentage.toFixed(2)}%`;
  } else if (statKey === "statDamage") {
    const statDamageIncrease = (newValue - oldValue).toFixed(2);
    return `+${increase}% Main Stat
Stat Damage: +${statDamageIncrease}%
Gain: ${gainPercentage.toFixed(2)}%`;
  } else {
    return `+${increase}%
Old: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}
Gain: ${gainPercentage.toFixed(2)}%`;
  }
}
function generateGainCell(statKey, increase, oldValue, newValue, gainPercentage, effectiveIncrease) {
  const tooltip = generateStatTooltip(statKey, increase, oldValue, newValue, gainPercentage, effectiveIncrease);
  return `<td title="${tooltip}"><span style="color: var(--text-primary);">+${gainPercentage.toFixed(2)}%</span></td>`;
}
function generateStatRow(statKey, statLabel, isFlat, weights, increaseLabel) {
  let labelContent = statLabel;
  if (MULTIPLICATIVE_STATS[statKey]) {
    labelContent += ` <span style="font-size: 0.7em; opacity: 0.5;" title="Multiplicative">\u26A1</span>`;
  }
  let html = `<tr><td><button onclick="toggleStatChart('${statKey}', '${statLabel}', ${isFlat})" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">\u{1F4CA}</button>${labelContent}</td>`;
  weights.forEach((weight) => {
    html += generateGainCell(
      statKey,
      weight.increase,
      weight.oldValue ?? 0,
      weight.newValue ?? 0,
      weight.gainPercentage,
      weight.effectiveIncrease
    );
  });
  html += "</tr>";
  const colspan = weights.length + 1;
  html += `<tr id="chart-row-${statKey}" class="chart-row" style="display: none;"><td colspan="${colspan}" style="padding: 16px; background: var(--background); border-top: 1px solid var(--table-glass-border);"><canvas id="chart-${statKey}"></canvas></td></tr>`;
  return html;
}
function generateTableHeader(increases, isPercentage) {
  let html = "<thead><tr><th>Stat</th>";
  increases.forEach((inc, idx) => {
    if (isPercentage) {
      html += `<th onclick="sortStatPredictions('percentage', ${idx + 1}, this)" onmouseover="this.style.background='var(--table-surface-subtle)'" onmouseout="this.style.background='transparent'">+${inc}% <span class="sort-indicator" style="opacity: 0.3; font-size: 0.8em; margin-left: 4px;">\u21C5</span></th>`;
    } else {
      html += `<th>+${formatNumber(inc)} </th>`;
    }
  });
  html += "</tr></thead>";
  return html;
}
function generateFlatStatsSection(weights) {
  let html = '<div class="stat-predictions-section">';
  html += '<h3 style="margin: 0 0 12px 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">Flat Stats</h3>';
  html += '<div class="">';
  html += `<table class="table" id="stat-pred-table-flat">`;
  html += generateTableHeader(DEFAULT_STAT_INCREASES.flat, false);
  html += "<tbody>";
  html += generateStatRow("attack", "Attack", true, weights.attackWeights, "Attack");
  html += "</tbody>";
  html += generateTableHeader(DEFAULT_STAT_INCREASES.mainStat, false);
  html += "<tbody>";
  html += generateStatRow("mainStat", "Main Stat", true, weights.mainStatWeights, "Main Stat");
  html += "</tbody>";
  html += "</table>";
  html += "</div>";
  html += "</div>";
  return html;
}
function generatePercentageStatsSection(weights) {
  let html = '<div class="stat-predictions-section" style="margin-top: 24px;">';
  html += '<h3 style="margin: 0 0 12px 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">Percentage Stats</h3>';
  html += '<div class="">';
  html += `<table class="table" id="stat-pred-table-percentage">`;
  html += '<thead><tr><th style="padding: 8px 10px; font-size: 0.75rem;">Stat</th>';
  DEFAULT_STAT_INCREASES.percentage.forEach((inc, idx) => {
    html += `<th onclick="sortStatPredictions('percentage', ${idx + 1}, this)" onmouseover="this.style.background='var(--table-surface-subtle)'" onmouseout="this.style.background='transparent'">+${inc}% <span class="sort-indicator" style="opacity: 0.3; font-size: 0.8em; margin-left: 4px;">\u21C5</span></th>`;
  });
  html += "</tr></thead><tbody>";
  PERCENTAGE_STATS.forEach((stat) => {
    const statWeights = weights.percentageWeights[stat.key];
    html += generateStatRow(stat.key, stat.label, false, statWeights, `${stat.key}%`);
  });
  html += "</tbody></table>";
  html += "</div>";
  html += "</div>";
  return html;
}
function generateStatPredictionsHTML() {
  const stats = loadoutStore.getBaseStats();
  const weights = calculateAllStatWeights(stats);
  let html = "";
  html += generateFlatStatsSection(weights);
  html += generatePercentageStatsSection(weights);
  return html;
}
function updateStatPredictions() {
  const container = document.getElementById(`stat-weights`);
  if (!container) {
    console.warn(`Stat predictions container not found`);
    return;
  }
  container.innerHTML = generateStatPredictionsHTML();
}
export {
  generateStatPredictionsHTML,
  updateStatPredictions
};
//# sourceMappingURL=stat-predictions-ui.js.map
