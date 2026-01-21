import {
  initializeBaseStatsUI,
  loadBaseStatsUI,
  attachBaseStatsEventListeners
} from "./base-stats/base-stats-ui.js";
import {
  initializeClassSelectUI,
  loadClassSelectUI,
  attachClassSelectEventListeners
} from "./base-stats/class-select-ui.js";
import {
  initializeTargetSelectUI,
  loadTargetSelectUI,
  attachTargetSelectEventListeners
} from "./base-stats/target-select-ui.js";
import {
  loadMasteryBonusesUI,
  attachMasteryEventListeners
} from "./base-stats/mastery-bonus-ui.js";
import {
  initializeWeaponsUI,
  loadWeaponsUI,
  attachWeaponEventListeners
} from "./weapon-levels/weapon-ui.js";
import {
  initializeWeaponPriorityUI
} from "./weapon-levels/weapon-priority-ui.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
async function initializeLoadoutPage() {
  await loadoutStore.initialize();
  initializeBaseStatsUI();
  initializeClassSelectUI();
  initializeTargetSelectUI();
  initializeWeaponsUI();
  initializeWeaponPriorityUI();
  loadBaseStatsUI();
  loadClassSelectUI();
  loadTargetSelectUI();
  loadMasteryBonusesUI();
  loadWeaponsUI();
  attachBaseStatsEventListeners();
  attachWeaponEventListeners();
  attachClassSelectEventListeners();
  attachTargetSelectEventListeners();
  attachMasteryEventListeners();
}
export {
  initializeLoadoutPage
};
//# sourceMappingURL=loadout-page.js.map
