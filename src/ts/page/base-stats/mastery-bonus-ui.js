import { selectMasteryTab } from "./class-select-ui.js";
import { updateMasteryBonuses, calculateMasteryTotals } from "./mastery-bonus.js";
import { MASTERY_3RD, MASTERY_4TH } from "./mastery-constants.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
function generateMasteryTableRows(tier, type) {
  const masteryData = tier === "3rd" ? MASTERY_3RD : MASTERY_4TH;
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
        <div id="mastery-table-${tier}" class="bgstats-mastery-table" ${tier === "4th" ? 'style="display: none;"' : ""}>
            <table class="bgstats-table">
                <thead>
                    <tr>
                        <th class="bgstats-table-th">Level</th>
                        <th class="bgstats-table-th">All Monsters</th>
                        <th class="bgstats-table-th">Boss Only</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateMasteryTableRows(tier, "all")}
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

            ${generateMasteryTableHTML("3rd")}
            ${generateMasteryTableHTML("4th")}
        </div>
    `;
}
function generateMasteryHiddenInputs() {
  return `
        <input type="hidden" id="skill-mastery-base" value="21">
        <input type="hidden" id="skill-mastery-boss-base" value="0">
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
  [64, 68, 76, 80, 88, 92].forEach((level) => {
    const checkbox = document.getElementById(`mastery-3rd-all-${level}`);
    if (checkbox) {
      checkbox.checked = mastery["3rd"].all[level.toString()] ?? false;
    }
  });
  [72, 84].forEach((level) => {
    const checkbox = document.getElementById(`mastery-3rd-boss-${level}`);
    if (checkbox) {
      checkbox.checked = mastery["3rd"].boss[level.toString()] ?? false;
    }
  });
  [102, 106, 116, 120, 128, 132].forEach((level) => {
    const checkbox = document.getElementById(`mastery-4th-all-${level}`);
    if (checkbox) {
      checkbox.checked = mastery["4th"].all[level.toString()] ?? false;
    }
  });
  [111, 124].forEach((level) => {
    const checkbox = document.getElementById(`mastery-4th-boss-${level}`);
    if (checkbox) {
      checkbox.checked = mastery["4th"].boss[level.toString()] ?? false;
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
  const skillMasteryInput = document.getElementById("skill-mastery-base");
  const skillMasteryBossInput = document.getElementById("skill-mastery-boss-base");
  if (skillMasteryInput) {
    skillMasteryInput.value = allTotal.toString();
  }
  if (skillMasteryBossInput) {
    skillMasteryBossInput.value = bossTotal.toString();
  }
}
function attachMasteryTabListeners() {
  const tab3rd = document.getElementById("mastery-tab-3rd");
  const tab4th = document.getElementById("mastery-tab-4th");
  if (tab3rd) {
    tab3rd.addEventListener("click", () => selectMasteryTab("3rd"));
  }
  if (tab4th) {
    tab4th.addEventListener("click", () => selectMasteryTab("4th"));
  }
}
function attachMasteryCheckboxListeners() {
  ["3rd", "4th"].forEach((tier) => {
    const masteryData = tier === "3rd" ? MASTERY_3RD : MASTERY_4TH;
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
