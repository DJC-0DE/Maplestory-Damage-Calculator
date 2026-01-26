import { selectMasteryTab } from "./class-select-ui.js";
import { updateMasteryBonuses, calculateMasteryTotals } from "./mastery-bonus.js";
import { MASTERY_3RD, MASTERY_4TH } from "./mastery-constants.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { JOB_TIER, MASTERY_TYPE, MASTERY_LEVELS, STAT } from "@ts/types/constants.js";
function generateMasteryTableRows(tier, type) {
  const masteryData = tier === JOB_TIER.THIRD ? MASTERY_3RD : MASTERY_4TH;
  const items = masteryData[type];
  let rows = "";
  const allLevels = /* @__PURE__ */ new Set();
  const bossLevels = /* @__PURE__ */ new Set();
  masteryData.all.forEach((item) => allLevels.add(item.level));
  masteryData.boss.forEach((item) => bossLevels.add(item.level));
  const sortedLevels = Array.from(allLevels).sort((a, b) => a - b);
  bossLevels.forEach((level) => {
    if (!allLevels.has(level)) {
      sortedLevels.push(level);
    }
  });
  sortedLevels.sort((a, b) => a - b);
  sortedLevels.forEach((level) => {
    const allItem = masteryData.all.find((item) => item.level === level);
    const bossItem = masteryData.boss.find((item) => item.level === level);
    const allCell = allItem ? `<label class="bgstats-checkbox-label">
                <input type="checkbox" id="mastery-${tier}-all-${level}" class="bgstats-checkbox">
                <span class="bgstats-checkbox-text">${allItem.bonus}%</span>
               </label>` : "\u2014";
    const bossCell = bossItem ? `<label class="bgstats-checkbox-label">
                <input type="checkbox" id="mastery-${tier}-boss-${level}" class="bgstats-checkbox">
                <span class="bgstats-checkbox-text">${bossItem.bonus}%</span>
               </label>` : "\u2014";
    rows += `
            <tr class="bgstats-table-row">
                <td class="bgstats-table-td level-cell">${level}</td>
                <td class="bgstats-table-td">${allCell}</td>
                <td class="bgstats-table-td ${!bossItem ? "empty-cell" : ""}">${bossCell}</td>
            </tr>
        `;
  });
  return rows;
}
function generateMasteryTableHTML(tier) {
  return `
        <div id="mastery-table-${tier}" class="bgstats-mastery-table" ${tier === JOB_TIER.FOURTH ? 'style="display: none;"' : ""}>
            <table class="bgstats-table">
                <thead>
                    <tr>
                        <th class="bgstats-table-th">Level</th>
                        <th class="bgstats-table-th">All Monsters</th>
                        <th class="bgstats-table-th">Boss Only</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateMasteryTableRows(tier, MASTERY_TYPE.ALL)}
                </tbody>
            </table>
        </div>
    `;
}
function generateMasterySectionHTML() {
  return `
        <!-- Skill Mastery Section - Premium redesign -->
        <div class="bgstats-mastery-section">
            <label class="bgstats-mastery-title">Skill Mastery Bonus <span class="bgstats-info-inline" role="img" aria-label="Info" onclick="openHelpSidebar('skill-mastery')">?</span></label>

            <!-- Mastery Job Tabs - Unified control -->
            <div class="bgstats-mastery-tabs">
                <button id="mastery-tab-3rd" class="bgstats-mastery-tab active">3rd Job</button>
                <button id="mastery-tab-4th" class="bgstats-mastery-tab">4th Job</button>
            </div>

            ${generateMasteryTableHTML(JOB_TIER.THIRD)}
            ${generateMasteryTableHTML(JOB_TIER.FOURTH)}
        </div>
    `;
}
function generateMasteryHiddenInputs() {
  return `
        <input type="hidden" id="mastery" value="21">
        <input type="hidden" id="bossMastery" value="0">
    `;
}
function loadMasteryBonusesUI() {
  const currentTier = loadoutStore.getSelectedJobTier();
  loadMasteryCheckboxesFromStore(currentTier);
  const { allTotal, bossTotal } = calculateMasteryTotals(currentTier);
  updateMasteryDisplay(currentTier, allTotal, bossTotal);
}
function loadMasteryCheckboxesFromStore(tier) {
  const mastery = loadoutStore.getMastery();
  MASTERY_LEVELS.THIRD.ALL.forEach((level) => {
    const checkbox = document.getElementById(`mastery-${JOB_TIER.THIRD}-all-${level}`);
    if (checkbox) {
      checkbox.checked = mastery[JOB_TIER.THIRD].all[level.toString()] ?? false;
    }
  });
  MASTERY_LEVELS.THIRD.BOSS.forEach((level) => {
    const checkbox = document.getElementById(`mastery-${JOB_TIER.THIRD}-boss-${level}`);
    if (checkbox) {
      checkbox.checked = mastery[JOB_TIER.THIRD].boss[level.toString()] ?? false;
    }
  });
  MASTERY_LEVELS.FOURTH.ALL.forEach((level) => {
    const checkbox = document.getElementById(`mastery-${JOB_TIER.FOURTH}-all-${level}`);
    if (checkbox) {
      checkbox.checked = mastery[JOB_TIER.FOURTH].all[level.toString()] ?? false;
    }
  });
  MASTERY_LEVELS.FOURTH.BOSS.forEach((level) => {
    const checkbox = document.getElementById(`mastery-${JOB_TIER.FOURTH}-boss-${level}`);
    if (checkbox) {
      checkbox.checked = mastery[JOB_TIER.FOURTH].boss[level.toString()] ?? false;
    }
  });
}
function updateMasteryDisplay(tier, allTotal, bossTotal) {
  const allTotalDisplay = document.getElementById(`mastery-${tier}-all-total`);
  const bossTotalDisplay = document.getElementById(`mastery-${tier}-boss-total`);
  if (allTotalDisplay) {
    allTotalDisplay.textContent = `${allTotal}%`;
  }
  if (bossTotalDisplay) {
    bossTotalDisplay.textContent = `${bossTotal}%`;
  }
  const skillMasteryInput = document.getElementById("mastery");
  const skillMasteryBossInput = document.getElementById("bossMastery");
  if (skillMasteryInput) {
    skillMasteryInput.value = allTotal.toString();
    loadoutStore.updateBaseStat(STAT.MASTERY.id, allTotal);
  }
  if (skillMasteryBossInput) {
    skillMasteryBossInput.value = bossTotal.toString();
    loadoutStore.updateBaseStat(STAT.BOSS_MASTERY.id, bossTotal);
  }
}
function attachMasteryTabListeners() {
  const tab3rd = document.getElementById("mastery-tab-3rd");
  const tab4th = document.getElementById("mastery-tab-4th");
  if (tab3rd) {
    tab3rd.addEventListener("click", () => selectMasteryTab(JOB_TIER.THIRD));
  }
  if (tab4th) {
    tab4th.addEventListener("click", () => selectMasteryTab(JOB_TIER.FOURTH));
  }
}
function attachMasteryCheckboxListeners() {
  [JOB_TIER.THIRD, JOB_TIER.FOURTH].forEach((tier) => {
    const masteryData = tier === JOB_TIER.THIRD ? MASTERY_3RD : MASTERY_4TH;
    masteryData.all.forEach((item) => {
      const checkbox = document.getElementById(`mastery-${tier}-all-${item.level}`);
      if (checkbox) {
        checkbox.addEventListener("change", () => updateMasteryBonuses());
      }
    });
    masteryData.boss.forEach((item) => {
      const checkbox = document.getElementById(`mastery-${tier}-boss-${item.level}`);
      if (checkbox) {
        checkbox.addEventListener("change", () => updateMasteryBonuses());
      }
    });
  });
}
function attachMasteryEventListeners() {
  attachMasteryTabListeners();
  attachMasteryCheckboxListeners();
}
export {
  attachMasteryCheckboxListeners,
  attachMasteryEventListeners,
  attachMasteryTabListeners,
  generateMasteryHiddenInputs,
  generateMasterySectionHTML,
  loadMasteryBonusesUI,
  updateMasteryDisplay
};
//# sourceMappingURL=mastery-bonus-ui.js.map
