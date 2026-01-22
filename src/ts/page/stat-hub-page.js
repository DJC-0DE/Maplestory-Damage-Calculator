import { updateStatPredictions } from "./stat-hub/stat-predictions-ui.js";
import { generateStatEquivalencyHTML } from "./stat-hub/stat-equivalency-ui.js";
import { BasePage } from "./base-page.js";
class StatHubPage extends BasePage {
  constructor() {
    super("predictions", "stat-tables");
    this.initialized = false;
  }
  onPageVisible(tabName) {
    super.onPageVisible(tabName);
    if (!this.initialized) {
      this.initializeComponents();
      this.initialized = true;
    }
  }
  async initializeComponents() {
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
}
const statHubPage = new StatHubPage();
window.statHubPageSwitchToTab = (tabName) => statHubPage.switchToTab(tabName);
export {
  statHubPage
};
//# sourceMappingURL=stat-hub-page.js.map
