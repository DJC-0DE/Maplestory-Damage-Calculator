import { updateSkillCoefficient } from "./base-stats.js";
import { updateMasteryBonuses } from "./mastery-bonus.js";
import { CLASS, JOB_TIER } from "@ts/types/constants.js";
import {
  isStrMainStatClass,
  isDexMainStatClass,
  isIntMainStatClass,
  isLukMainStatClass
} from "./class-select.js";
import { syncMainStatsToHidden } from "./base-stats-ui.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
const CLASSES = [
  { id: CLASS.HERO, name: "Hero", image: "media/classes/hero.png" },
  { id: CLASS.DARK_KNIGHT, name: "Dark Knight", image: "media/classes/dk.png" },
  { id: CLASS.BOWMASTER, name: "Bowmaster", image: "media/classes/bowmaster.png" },
  { id: CLASS.MARKSMAN, name: "Marksman", image: "media/classes/marksman.png" },
  { id: CLASS.NIGHT_LORD, name: "Night Lord", image: "media/classes/nl.png" },
  { id: CLASS.SHADOWER, name: "Shadower", image: "media/classes/shadower.png" },
  { id: CLASS.ARCH_MAGE_IL, name: "Arch Mage (I/L)", image: "media/classes/mage-il.png" },
  { id: CLASS.ARCH_MAGE_FP, name: "Arch Mage (F/P)", image: "media/classes/mage-fp.png" }
];
if (typeof window !== "undefined") {
  window.selectJobTier = selectJobTier;
  window.selectClass = selectClass;
  window.selectMasteryTab = selectMasteryTab;
}
function selectJobTier(tier) {
  loadoutStore.updateCharacter({ jobTier: tier });
  updateJobTierButtonUI(tier);
  updateMasteryTableVisibility(tier);
  updateMasteryTabUI(tier);
  updateSkillCoefficient();
  updateMasteryBonuses();
}
function selectClass(className) {
  loadoutStore.updateCharacter({ class: className });
  updateClassSelectionUI(className);
  updateClassUI(className);
  try {
  } catch (error) {
  }
}
function selectMasteryTab(tier) {
  updateMasteryTabUI(tier);
  updateMasteryTableVisibility(tier);
}
function initializeClassSelectUI() {
  const character = loadoutStore.getCharacter();
  if (character.jobTier) {
    initializeJobTierState(character.jobTier);
  }
  if (character.class) {
    initializeClassState(character.class);
  }
}
function loadClassSelectUI() {
  const character = loadoutStore.getCharacter();
  if (character.jobTier) {
    restoreJobTierSelection(character.jobTier);
  }
  if (character.class) {
    restoreClassSelection(character.class);
  }
}
function initializeJobTierState(tier) {
  loadoutStore.updateCharacter({ jobTier: tier });
}
function initializeClassState(className) {
  loadoutStore.updateCharacter({ class: className });
}
function restoreJobTierSelection(tier) {
  updateJobTierButtonUI(tier);
  updateMasteryTableVisibility(tier);
  updateMasteryTabUI(tier);
  updateSkillCoefficient();
}
function restoreClassSelection(className) {
  updateClassSelectionUI(className);
  updateClassUI(className);
}
function updateJobTierButtonUI(tier) {
  document.querySelectorAll(".bgstats-tier-btn").forEach((el) => {
    el.classList.remove("active");
  });
  const tierElement = document.getElementById(`job-tier-${tier}`);
  if (tierElement) {
    tierElement.classList.add("active");
  }
}
function updateClassSelectionUI(className) {
  document.querySelectorAll(".class-selector").forEach((el) => {
    el.classList.remove("selected");
  });
  const classElement = document.getElementById(`class-${className}`);
  if (classElement) {
    classElement.classList.add("selected");
  }
}
function updateMasteryTabUI(tier) {
  document.querySelectorAll(".bgstats-mastery-tab").forEach((el) => {
    el.classList.remove("active");
  });
  const masteryTab = document.getElementById(`mastery-tab-${tier}`);
  if (masteryTab) {
    masteryTab.classList.add("active");
  }
}
function updateMasteryTableVisibility(tier) {
  const mastery3rdTable = document.getElementById("mastery-table-3rd");
  const mastery4thTable = document.getElementById("mastery-table-4th");
  if (!mastery3rdTable || !mastery4thTable) return;
  if (tier === JOB_TIER.THIRD) {
    mastery3rdTable.style.display = "block";
    mastery4thTable.style.display = "none";
  } else if (tier === JOB_TIER.FOURTH) {
    mastery3rdTable.style.display = "none";
    mastery4thTable.style.display = "block";
  }
}
function updateClassUI(className) {
  const defenseInputGroup = document.getElementById("defense-input-group");
  if (defenseInputGroup) {
    defenseInputGroup.style.display = className === CLASS.DARK_KNIGHT ? "flex" : "none";
  }
  const strRow = document.getElementById("str-row");
  const dexRow = document.getElementById("dex-row");
  const intRow = document.getElementById("int-row");
  const lukRow = document.getElementById("luk-row");
  if (strRow) strRow.style.display = "none";
  if (dexRow) dexRow.style.display = "none";
  if (intRow) intRow.style.display = "none";
  if (lukRow) lukRow.style.display = "none";
  if (isStrMainStatClass(className)) {
    if (strRow) strRow.style.display = "flex";
    if (dexRow) dexRow.style.display = "flex";
  } else if (isDexMainStatClass(className)) {
    if (dexRow) dexRow.style.display = "flex";
    if (strRow) strRow.style.display = "flex";
  } else if (isIntMainStatClass(className)) {
    if (intRow) intRow.style.display = "flex";
    if (lukRow) lukRow.style.display = "flex";
  } else if (isLukMainStatClass(className)) {
    if (lukRow) lukRow.style.display = "flex";
    if (dexRow) dexRow.style.display = "flex";
  }
  syncMainStatsToHidden();
}
function attachClassSelectorListeners() {
  CLASSES.forEach((cls) => {
    const element = document.getElementById(`class-${cls.id}`);
    if (element) {
      element.addEventListener("click", () => selectClass(cls.id));
    }
  });
}
function attachJobTierListeners() {
  const tier3rd = document.getElementById("job-tier-3rd");
  const tier4th = document.getElementById("job-tier-4th");
  if (tier3rd) {
    tier3rd.addEventListener("click", () => selectJobTier(JOB_TIER.THIRD));
  }
  if (tier4th) {
    tier4th.addEventListener("click", () => selectJobTier(JOB_TIER.FOURTH));
  }
}
function attachClassSelectEventListeners() {
  attachClassSelectorListeners();
  attachJobTierListeners();
}
function generateClassSelectorHTML() {
  return CLASSES.map((cls) => `
        <div id="class-${cls.id}" class="class-selector bgstats-class-card" title="${cls.title || cls.name}">
            <div class="bgstats-class-image-wrapper">
                <img src="${cls.image}" alt="${cls.name}" class="bgstats-class-image">
            </div>
            <span class="bgstats-class-name">${cls.name}</span>
        </div>
    `).join("");
}
export {
  attachClassSelectEventListeners,
  generateClassSelectorHTML,
  initializeClassSelectUI,
  loadClassSelectUI,
  selectClass,
  selectJobTier,
  selectMasteryTab
};
//# sourceMappingURL=class-select-ui.js.map
