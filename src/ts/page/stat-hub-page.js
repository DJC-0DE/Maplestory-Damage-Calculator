import { updateStatPredictions } from "./stat-hub/stat-predictions-ui.js";
import { generateStatEquivalencyHTML } from "./stat-hub/stat-equivalency-ui.js";
async function initializeStatHubPage() {
  const statWeightsContainer = document.getElementById("stat-weights");
  if (!statWeightsContainer) {
    console.warn("Stat predictions container not found");
  }
  const equivalencyContainer = document.getElementById("predictions-equivalency");
  if (equivalencyContainer) {
    const existingContent = equivalencyContainer.innerHTML;
    const headerMatch = existingContent.match(/<div[^>]*>[\s\S]*?<\/div>\s*<p[^>]*>[\s\S]*?<\/p>/);
    const headerHTML = headerMatch ? headerMatch[0] : "";
    equivalencyContainer.innerHTML = headerHTML + generateStatEquivalencyHTML();
  }
  updateStatPredictions();
}
function refreshStatPredictions() {
  updateStatPredictions();
}
export {
  initializeStatHubPage,
  refreshStatPredictions
};
//# sourceMappingURL=stat-hub-page.js.map
