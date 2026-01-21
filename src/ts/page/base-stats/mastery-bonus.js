import { updateAnalysisTabs } from "@core/state/storage.js";
import { getSelectedJobTier } from "@core/state/state.js";
import { MASTERY_BONUSES } from "./mastery-constants.js";
import { updateMasteryDisplay } from "./mastery-bonus-ui.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
if (typeof window !== "undefined") {
  window.updateMasteryBonuses = updateMasteryBonuses;
}
function updateMasteryBonuses() {
  const currentTier = getSelectedJobTier();
  const { allTotal, bossTotal } = calculateMasteryTotals(currentTier);
  updateMasteryDisplay(currentTier, allTotal, bossTotal);
  saveMasteryCheckboxesToStore(currentTier);
  updateAnalysisTabs();
}
function saveMasteryCheckboxesToStore(tier) {
  const tierData = MASTERY_BONUSES[tier];
  if (!tierData) return;
  for (const [level] of Object.entries(tierData.all)) {
    const checkbox = document.getElementById(`mastery-${tier}-all-${level}`);
    if (checkbox) {
      loadoutStore.updateMasteryCheckbox(tier, "all", level, checkbox.checked);
    }
  }
  for (const [level] of Object.entries(tierData.boss)) {
    const checkbox = document.getElementById(`mastery-${tier}-boss-${level}`);
    if (checkbox) {
      loadoutStore.updateMasteryCheckbox(tier, "boss", level, checkbox.checked);
    }
  }
}
function calculateMasteryTotals(tier) {
  let allTotal = 0;
  let bossTotal = 0;
  const tierData = MASTERY_BONUSES[tier];
  if (!tierData) {
    return { allTotal, bossTotal };
  }
  for (const [level, bonus] of Object.entries(tierData.all)) {
    const checkbox = document.getElementById(`mastery-${tier}-all-${level}`);
    if (checkbox && checkbox.checked) {
      allTotal += bonus;
    }
  }
  for (const [level, bonus] of Object.entries(tierData.boss)) {
    const checkbox = document.getElementById(`mastery-${tier}-boss-${level}`);
    if (checkbox && checkbox.checked) {
      bossTotal += bonus;
    }
  }
  return { allTotal, bossTotal };
}
export {
  calculateMasteryTotals,
  updateMasteryBonuses
};
//# sourceMappingURL=mastery-bonus.js.map
