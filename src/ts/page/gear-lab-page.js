import { BasePage } from "./base-page.js";
import { gearLabStore } from "@ts/store/gear-lab-store.js";
import { initializeInnerAbilityUI, loadInnerAbilityFromStore } from "@ts/page/inner-ability/inner-ability-ui.js";
import { initializeArtifactPotential } from "./artifact-potential/artifact-potential-ui.js";
import { initializeCubePotentialUI } from "@ts/page/cube-potential/cube-potential-ui.js";
class GearLabPage extends BasePage {
  constructor() {
    super("optimization", "item-comparison");
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
    await gearLabStore.initialize();
    initializeInnerAbilityUI();
    initializeArtifactPotential();
    initializeCubePotentialUI();
    loadInnerAbilityFromStore();
  }
}
const gearLabPage = new GearLabPage();
window.gearLabPageSwitchToTab = (tabName) => gearLabPage.switchToTab(tabName);
export {
  gearLabPage
};
//# sourceMappingURL=gear-lab-page.js.map
