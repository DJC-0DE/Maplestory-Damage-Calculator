import { getStatType, isDexMainStatClass, isIntMainStatClass, isLukMainStatClass, isStrMainStatClass } from "./class-select.js";
import { generateClassSelectorHTML } from "./class-select-ui.js";
import { generateContentTypeSelectorHTML } from "./target-select-ui.js";
import {
  generateMasterySectionHTML,
  generateMasteryHiddenInputs
} from "./mastery-bonus-ui.js";
import { updateSkillCoefficient } from "./base-stats.js";
import { extractText, parseBaseStatText } from "@utils/ocr.js";
import { getSelectedClass } from "@core/state/state.js";
import { showToast } from "@utils/notifications.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { STAT_TYPE } from "@ts/types/constants.js";
function getCalculateFunction() {
  return window.calculate;
}
const STAT_INPUTS = [
  // Core Combat Stats
  { id: "attack", label: "Attack", type: "number", value: 500 },
  { id: "defense", label: "Defense", type: "number", value: 0, info: "defense" },
  { id: "critRate", label: "Critical Rate (%)", type: "number", step: "0.1", value: 15 },
  { id: "critDamage", label: "Critical Damage (%)", type: "number", step: "0.1", value: 15 },
  { id: "attackSpeed", label: "Attack Speed (%)", type: "number", step: "0.1", value: 0 },
  // Main Stats
  { id: "str", label: "STR", type: "number", value: 1e3, rowId: "str-row" },
  { id: "dex", label: "DEX", type: "number", value: 0, rowId: "dex-row" },
  { id: "int", label: "INT", type: "number", value: 1e3, rowId: "int-row" },
  { id: "luk", label: "LUK", type: "number", value: 0, rowId: "luk-row" },
  // Damage Modifiers
  { id: "statDamage", label: "Stat Prop. Damage (%)", type: "number", step: "0.1", value: 0 },
  { id: "damage", label: "Damage (%)", type: "number", step: "0.1", value: 10 },
  { id: "damageAmp", label: "Damage Amplification (x)", type: "number", step: "0.1", value: 0 },
  { id: "basicAttackDamage", label: "Basic Attack Damage (%)", type: "number", step: "0.1", value: 0, hidden: true },
  { id: "skillDamage", label: "Skill Damage (%)", type: "number", step: "0.1", value: 0, hidden: true },
  { id: "defPen", label: "Defense Penetration (%)", type: "number", step: "0.1", value: 0, info: "def-pen" },
  { id: "bossDamage", label: "Boss Monster Damage (%)", type: "number", step: "0.1", value: 10 },
  { id: "normalDamage", label: "Normal Monster Damage (%)", type: "number", step: "0.1", value: 0 },
  { id: "minDamage", label: "Min Damage Multiplier (%)", type: "number", step: "0.1", value: 50 },
  { id: "maxDamage", label: "Max Damage Multiplier (%)", type: "number", step: "0.1", value: 100 },
  { id: "finalDamage", label: "Final Damage (%)", type: "number", step: "0.1", value: 0 },
  // Skill Levels
  { id: "skillLevel1st", label: "1st Job Skill Level", type: "number", value: 0, min: 0, onChange: true },
  { id: "skillLevel2nd", label: "2nd Job Skill Level", type: "number", value: 0, min: 0, onChange: true },
  { id: "skillLevel3rd", label: "3rd Job Skill Level", type: "number", value: 0, min: 0, onChange: true },
  { id: "skillLevel4th", label: "4th Job Skill Level", type: "number", value: 0, min: 0, onChange: true },
  // Main Stat %
  { id: "mainStatPct", label: "Current Main Stat %", type: "number", step: "0.1", value: 0, info: "main-stat-pct" }
];
function generateStatInputHTML(stat) {
  const infoIcon = stat.info ? `<span class="bgstats-info-inline" role="img" aria-label="Info" onclick="openHelpSidebar('${stat.info}')">?</span>` : "";
  const onChangeAttr = stat.onChange ? 'onchange="updateSkillCoefficient()"' : "";
  const hiddenStyle = stat.hidden ? 'style="display: none;"' : "";
  const rowId = stat.rowId ? `id="${stat.rowId}"` : "";
  const minAttr = stat.min !== void 0 ? `min="${stat.min}"` : "";
  const stepAttr = stat.step ? `step="${stat.step}"` : "";
  return `
        <div class="bgstats-stat-row" ${rowId} ${hiddenStyle}>
            <label class="bgstats-stat-label">${stat.label} ${infoIcon}</label>
            <input type="${stat.type}" id="${stat.id}" value="${stat.value}" ${minAttr} ${stepAttr} ${onChangeAttr} class="bgstats-stat-input">
        </div>
    `;
}
function generateStatInputsHTML() {
  let html = "";
  html += STAT_INPUTS.filter((s) => ["attack", "defense", "critRate", "critDamage", "attackSpeed"].includes(s.id)).map(generateStatInputHTML).join("");
  html += '<div class="bgstats-divider"></div>';
  html += STAT_INPUTS.filter((s) => ["str", "dex", "int", "luk"].includes(s.id)).map(generateStatInputHTML).join("");
  html += '<div class="bgstats-divider"></div>';
  html += STAT_INPUTS.filter((s) => ["statDamage", "damage", "damageAmp", "basicAttackDamage", "skillDamage", "defPen", "bossDamage", "normalDamage", "minDamage", "maxDamage", "finalDamage"].includes(s.id)).map(generateStatInputHTML).join("");
  html += '<div class="bgstats-divider"></div>';
  html += STAT_INPUTS.filter((s) => ["skillLevel1st", "skillLevel2nd", "skillLevel3rd", "skillLevel4th"].includes(s.id)).map(generateStatInputHTML).join("");
  html += '<div class="bgstats-divider"></div>';
  html += STAT_INPUTS.filter((s) => ["mainStatPct"].includes(s.id)).map(generateStatInputHTML).join("");
  html += `
        <input type="hidden" id="primaryMainStat" value="1000">
        <input type="hidden" id="secondaryMainStat" value="0">
        ${generateMasteryHiddenInputs()}
        <input type="hidden" id="skillCoeff" value="0">
    `;
  return html;
}
function generateBaseStatsHTML() {
  return `
        <!-- Base Stats Container - Premium aesthetic with subtle depth -->
        <div class="bgstats-premium-container bg-transparent p-2">
            <!-- Class Selector - Refined with premium card styling -->
            <div class="bgstats-section bgstats-class-section">
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
                    ${generateClassSelectorHTML()}
                </div>
            </div>
            <div id="debug-ocr"> </div>

            <!-- Character Level and Job Tier - Premium section styling -->
            <div class="bgstats-section bgstats-character-config">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" style="align-items: end;">
                    <div class="input-group">
                        <label class="bgstats-input-label">Character Level</label>
                        <input type="number" id="character-level" value="0" min="0" max="200" class="bgstats-number-input">
                    </div>
                    <div class="input-group">
                        <label class="bgstats-input-label">Job Tier</label>
                        <div class="flex gap-2">
                            <button id="job-tier-3rd" class="bgstats-tier-btn active">
                                3rd Job
                            </button>
                            <button id="job-tier-4th" class="bgstats-tier-btn">
                                4th Job
                            </button>
                        </div>
                    </div>
                    <section class="paste-image-section bgstats-paste-section" id="base-stats-paste-image-section" style="width: 100%;height: 42px; min-height: 42px;">
                        <div class="paste-icon bgstats-paste-btn" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"><strong>Auto-fill Stats</strong> \u{1F4CB}</div>
                        <span class="info-icon bgstats-info-icon" role="img" aria-label="Info" onclick="openHelpSidebar('stats-autofill')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; width: 18px; height: 18px;">?</span>
                    </section>
                </div>
            </div>

            <!-- Sub-tabs for Stats and Skill Mastery -->
            <div class="optimization-sub-tabs" style="display: none;">
                <button class="optimization-sub-tab-button active">Stats</button>
                <button class="optimization-sub-tab-button">Skill Mastery</button>
                <button style="display: none;" class="optimization-sub-tab-button">Skill Details</button>
            </div>

            <!-- Character Stats Sub-tab -->
            <div id="base-stats-character-stats" class="base-stats-subtab active">
                <!-- Two-column container: Stats on left, Target Content on right -->
                <div class="stats-two-column-container">
                    <!-- Left Column: Stats List -->
                    <div class="stats-list-column">
                        ${generateStatInputsHTML()}
                    </div>

                    <!-- Right Column: Skill Mastery and Target Content -->
                    <div class="right-column-stack">
                        ${generateMasterySectionHTML()}

                        <!-- Target Content Type Section - Premium redesign -->
                        <div class="bgstats-target-section">
                            <label class="bgstats-target-label">Target Content Type <span class="bgstats-info-inline" role="img" aria-label="Info" onclick="openHelpSidebar('target-stage')">?</span></label>
                            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
                                ${generateContentTypeSelectorHTML()}
                            </div>
                            <!-- Sub-category selector for Stage Hunts and Growth Dungeons -->
                            <select id="target-subcategory" class="bgstats-select mb-2" style="display: none;">
                                <!-- Populated by JavaScript based on content type -->
                            </select>
                            <!-- Final stage selection -->
                            <select id="target-stage-base" class="bgstats-select" style="display: none;">
                                <!-- Populated by JavaScript based on content type/subcategory selection -->
                            </select>
                        </div>
                    </div>
                    <!-- End Right Column -->
                </div>
            </div>
            <!-- End Character Stats Sub-tab -->

            <!-- Skill Details Sub-tab - Consistent premium styling -->
            <div id="base-stats-skill-details" class="base-stats-subtab" style="display: none;">
                <div class="bgstats-info-banner">
                    <div style="color: var(--text-primary); font-size: 0.9em; line-height: 1.5;">
                        <strong style="color: var(--accent-primary);">Instructions:</strong> Click on a skill to view its description with calculated values based on your character level.
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr; gap: 20px;">
                    <!-- Left Panel: Compact Skill Icons -->
                    <div class="bgstats-skills-panel">
                        <!-- Skills -->
                        <div style="margin-bottom: 15px;">
                            <div class="bgstats-panel-section-title">Skills</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; gap: 6px; flex-wrap: wrap; max-width: 300px;">
                                    <div id="skill-grid-skills-2nd" style="display: contents;"></div>
                                    <div id="skill-grid-skills-3rd" style="display: contents;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Passives -->
                        <div>
                            <div class="bgstats-panel-section-title">Passives</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; gap: 6px; flex-wrap: wrap; max-width: 300px;">
                                    <div id="skill-grid-passives-2nd" style="display: contents;"></div>
                                    <div id="skill-grid-passives-3rd" style="display: contents;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Skill Description -->
                    <div id="skill-description-panel" class="bgstats-description-panel">
                        <div style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">
                            Select a skill to view its details
                        </div>
                    </div>
                </div>
            </div>
            <!-- End Skill Details Sub-tab -->
        </div>
    `;
}
function attachCharacterLevelListener() {
  const levelInput = document.getElementById("character-level");
  if (levelInput) {
    levelInput.addEventListener("change", () => {
      const level = parseInt(levelInput.value) || 0;
      updateSkillCoefficient();
      loadoutStore.updateCharacter({ level });
    });
  }
}
function attachSubTabListeners() {
  const subTabContainer = document.querySelector(".optimization-sub-tabs");
  if (!subTabContainer) return;
  const buttons = subTabContainer.querySelectorAll(".optimization-sub-tab-button");
  const subTabs = {
    "Stats": "character-stats",
    "Skill Mastery": "skill-mastery",
    "Skill Details": "skill-details"
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = subTabs[button.textContent || ""];
      if (tabName) {
        switchBaseStatsSubTab(tabName);
      }
    });
  });
}
function attachPasteAreaListener() {
  const pasteArea = document.getElementById("base-stats-paste-image-section");
  if (!pasteArea) return;
  pasteArea.addEventListener("paste", async (event) => {
    const items = Array.from(event.clipboardData?.items || []);
    const pastedImage = items.filter((x) => x.type.startsWith("image/"))[0];
    if (!pastedImage) return;
    const file = pastedImage.getAsFile();
    if (!file) return;
    const imageURL = URL.createObjectURL(file);
    const extractedText = await extractText(imageURL, false);
    try {
      const parsedStats = parseBaseStatText(extractedText);
      for (const parsedStat of parsedStats) {
        const inputElement = document.getElementById(parsedStat[0]);
        if (inputElement) {
          inputElement.value = parsedStat[1];
          inputElement.style.outline = "2px solid #95b993";
          inputElement.addEventListener("input", () => {
            inputElement.style.outline = "";
          }, { once: true });
          const className = getSelectedClass();
          const primaryInput = document.getElementById("primary-main-stat-base");
          const secondaryInput = document.getElementById("secondary-main-stat-base");
          const statType = getStatType(className, parsedStat[0]);
          if (statType === STAT_TYPE.PRIMARY) {
            primaryInput.value = parsedStat[1] || "1000";
          } else if (statType === STAT_TYPE.SECONDARY) {
            secondaryInput.value = parsedStat[1] || "1000";
          }
        }
      }
      if (parsedStats.length > 0) {
        showToast(`Parsing successful! ${parsedStats.length} stats updated`, true);
      } else {
        showToast("Parsing failed! Make sure you are ONLY screenshotting the stats rows from the Character page and nothing else", false);
      }
      const baseStatUpdates = {};
      for (const parsedStat of parsedStats) {
        const key = parsedStat[0].replace("-base", "");
        const value = parseFloat(parsedStat[1]) || 0;
        baseStatUpdates[key] = value;
      }
      loadoutStore.updateBaseStats(baseStatUpdates);
      const calculate = getCalculateFunction();
      if (calculate) calculate();
    } catch (e) {
      console.error(e);
      showToast(String(e), false);
    }
  });
}
function attachMainStatSyncListeners() {
  const strInput = document.getElementById("str");
  const dexInput = document.getElementById("dex");
  const intInput = document.getElementById("int");
  const lukInput = document.getElementById("luk");
  [strInput, dexInput, intInput, lukInput].forEach((input) => {
    if (input) {
      input.addEventListener("input", () => {
        syncMainStatsToHidden();
        const value = parseFloat(input.value) || 0;
        loadoutStore.updateBaseStat(input.id, value);
      });
    }
  });
}
function attachStatInputListeners() {
  const statInputIds = [
    "attack",
    "defense",
    "critRate",
    "critDamage",
    "attackSpeed",
    "statDamage",
    "damage",
    "damageAmp",
    "defPen",
    "bossDamage",
    "normalDamage",
    "minDamage",
    "maxDamage",
    "finalDamage",
    "skillLevel1st",
    "skillLevel2nd",
    "skillLevel3rd",
    "skillLevel4th",
    "mainStatPct"
  ];
  statInputIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", () => {
        const value = parseFloat(input.value) || 0;
        loadoutStore.updateBaseStat(id, value);
      });
    }
  });
}
function syncMainStatsToHidden() {
  const className = getSelectedClass();
  const strInput = document.getElementById("str");
  const dexInput = document.getElementById("dex");
  const intInput = document.getElementById("int");
  const lukInput = document.getElementById("luk");
  const primaryInput = document.getElementById("primaryMainStat");
  const secondaryInput = document.getElementById("secondaryMainStat");
  if (!primaryInput || !secondaryInput) return;
  if (isStrMainStatClass(className)) {
    if (strInput) primaryInput.value = strInput.value || "1000";
    if (dexInput) secondaryInput.value = dexInput.value || "0";
  } else if (isDexMainStatClass(className)) {
    if (dexInput) primaryInput.value = dexInput.value || "1000";
    if (strInput) secondaryInput.value = strInput.value || "0";
  } else if (isIntMainStatClass(className)) {
    if (intInput) primaryInput.value = intInput.value || "1000";
    if (lukInput) secondaryInput.value = lukInput.value || "0";
  } else if (isLukMainStatClass(className)) {
    if (lukInput) primaryInput.value = lukInput.value || "1000";
    if (dexInput) secondaryInput.value = dexInput.value || "0";
  }
}
function switchBaseStatsSubTab(subTabName) {
  const subTabs = document.querySelectorAll(".base-stats-subtab");
  subTabs.forEach((tab) => {
    tab.style.display = "none";
  });
  const selectedTab = document.getElementById(`base-stats-${subTabName}`);
  if (selectedTab) {
    selectedTab.style.display = "block";
  }
  const buttons = document.querySelectorAll("#setup-base-stats .optimization-sub-tab-button");
  buttons.forEach((button) => {
    button.classList.remove("active");
  });
  const tabIndex = { "character-stats": 0, "skill-mastery": 1, "skill-details": 2 };
  if (tabIndex[subTabName] !== void 0 && buttons[tabIndex[subTabName]]) {
    buttons[tabIndex[subTabName]].classList.add("active");
  }
  if (subTabName === "skill-details") {
    if (window.populateSkillDetails) {
      window.populateSkillDetails();
    }
  }
}
function initializeBaseStatsUI() {
  const container = document.getElementById("setup-base-stats");
  if (!container) {
    console.error("Base stats container not found");
    return;
  }
  container.innerHTML = generateBaseStatsHTML();
}
function loadBaseStatsUI() {
  const character = loadoutStore.getCharacter();
  const baseStats = loadoutStore.getBaseStats();
  const levelInput = document.getElementById("character-level");
  if (levelInput && character.level > 0) {
    levelInput.value = character.level.toString();
  }
  const statInputIds = [
    "attack",
    "defense",
    "crit-rate",
    "crit-damage",
    "attack-speed",
    "str",
    "dex",
    "int",
    "luk",
    "stat-damage",
    "damage",
    "damage-amp",
    "def-pen",
    "boss-damage",
    "normal-damage",
    "min-damage",
    "max-damage",
    "final-damage",
    "skill-level-1st",
    "skill-level-2nd",
    "skill-level-3rd",
    "skill-level-4th",
    "main-stat-pct"
  ];
  const toCamelCase = (key) => {
    return key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  };
  statInputIds.forEach((hyphenatedKey) => {
    const camelCaseKey = toCamelCase(hyphenatedKey);
    if (camelCaseKey in baseStats) {
      const input = document.getElementById(`${hyphenatedKey}-base`);
      if (input) {
        input.value = baseStats[camelCaseKey].toString();
      }
    }
  });
  syncMainStatsToHidden();
}
function attachBaseStatsEventListeners() {
  attachCharacterLevelListener();
  attachSubTabListeners();
  attachPasteAreaListener();
  attachMainStatSyncListeners();
  attachStatInputListeners();
}
window.switchBaseStatsSubTab = switchBaseStatsSubTab;
export {
  attachBaseStatsEventListeners,
  generateBaseStatsHTML,
  initializeBaseStatsUI,
  loadBaseStatsUI,
  syncMainStatsToHidden
};
//# sourceMappingURL=base-stats-ui.js.map
