import {
  calculateArtifactPotentialRankings,
  getArtifactSortAsc,
  getArtifactSortColumn,
  setArtifactSortColumn,
  toggleArtifactSortAsc
} from "./artifact-potential.js";
import { formatNumber } from "@ts/utils/formatters.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { debounce } from "@ts/utils/event-emitter.js";
function generateRankingRowHTML(result, index) {
  const rarityLetter = result.rarity.charAt(0).toUpperCase();
  const rarityClass = `rarity-${result.rarity.toLowerCase()}`;
  const badge = `<span class="badge badge--rarity ${rarityClass}">${rarityLetter}</span>`;
  let rankBadge;
  if (index < 3) {
    rankBadge = `<span class="badge badge--rank-${index + 1}">${index + 1}</span>`;
  } else {
    rankBadge = `<span class="badge">${index + 1}</span>`;
  }
  const bossPercentHTML = result.bossDPSPercentChange !== 0 ? ` <span style="color:#10b981; font-weight:600;">(+${result.bossDPSPercentChange.toFixed(2)}%)</span>` : "";
  const normalPercentHTML = result.normalDPSPercentChange !== 0 ? ` <span style="color:#10b981; font-weight:600;">(+${result.normalDPSPercentChange.toFixed(2)}%)</span>` : "";
  const avgPercentHTML = result.avgDPSPercentChange !== 0 ? ` <span style="color:#10b981; font-weight:600;">(+${result.avgDPSPercentChange.toFixed(2)}%)</span>` : "";
  return `
        <tr>
            <td>${rankBadge}</td>
            <td>${badge}${result.stat}</td>
            <td>${result.value}</td>
            <td>+${formatNumber(result.bossDPSGain)}${bossPercentHTML}</td>
            <td>+${formatNumber(result.normalDPSGain)}${normalPercentHTML}</td>
            <td><strong>+${formatNumber(result.avgDPSGain)}</strong>${avgPercentHTML}</td>
        </tr>
    `;
}
function generateRankingsTableHTML(results) {
  let html = '<h3 class="title">All Possible Rolls Ranked</h3>';
  html += '<div class="table-wrapper table-scrollable"><div class="artifact-table-container">';
  html += '<table class="table"><thead><tr>';
  html += "<th>Rank</th>";
  html += "<th>Rarity & Stat</th>";
  html += "<th>Value</th>";
  html += '<th class="sortable" onclick="sortArtifactTable(3)">Boss DPS Gain</th>';
  html += '<th class="sortable" onclick="sortArtifactTable(4)">Normal DPS Gain</th>';
  html += '<th class="sortable" onclick="sortArtifactTable(5)">Avg DPS Gain</th>';
  html += "</tr></thead><tbody>";
  results.forEach((result, index) => {
    html += generateRankingRowHTML(result, index);
  });
  html += "</tbody></table></div></div>";
  return html;
}
function sortResults(results) {
  const column = getArtifactSortColumn();
  const ascending = getArtifactSortAsc();
  const sorted = [...results];
  sorted.sort((a, b) => {
    let valA;
    let valB;
    switch (column) {
      case 3:
        valA = a.bossDPSGain;
        valB = b.bossDPSGain;
        break;
      case 4:
        valA = a.normalDPSGain;
        valB = b.normalDPSGain;
        break;
      case 5:
        valA = a.avgDPSGain;
        valB = b.avgDPSGain;
        break;
      default:
        return 0;
    }
    return ascending ? valA - valB : valB - valA;
  });
  return sorted;
}
function renderArtifactPotential() {
  const container = document.getElementById("artifact-potential-container");
  if (!container) return;
  const results = calculateArtifactPotentialRankings();
  const sortedResults = sortResults(results);
  container.innerHTML = generateRankingsTableHTML(sortedResults);
}
function initializeArtifactPotential() {
  renderArtifactPotential();
  loadoutStore.on("stat:changed", debounce((_) => {
    renderArtifactPotential();
  }, 3500));
}
function sortArtifactTable(column) {
  const currentColumn = getArtifactSortColumn();
  if (currentColumn === column) {
    toggleArtifactSortAsc();
  } else {
    setArtifactSortColumn(column);
  }
  renderArtifactPotential();
}
if (typeof window !== "undefined") {
  window.sortArtifactTable = sortArtifactTable;
}
export {
  initializeArtifactPotential,
  renderArtifactPotential,
  sortArtifactTable
};
//# sourceMappingURL=artifact-potential-ui.js.map
