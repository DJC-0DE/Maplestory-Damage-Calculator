import { BasePage } from "./base-page.js";
import { gearLabStore } from "@ts/store/gear-lab-store.js";
import { initializeInnerAbilityUI, loadInnerAbilityFromStore } from "@ts/page/inner-ability/inner-ability-ui.js";
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
    loadInnerAbilityFromStore();
  }
}
const gearLabPage = new GearLabPage();
window.gearLabPageSwitchToTab = (tabName) => gearLabPage.switchToTab(tabName);
export {
  gearLabPage
};
//# sourceMappingURL=gear-lab-page.js.map
