import { setCurrentContentType, getCurrentContentType } from "@core/state/state.js";
import { updateAnalysisTabs } from "@core/state/storage.js";
import {
  getSubcategoryOptions,
  getFilteredStageEntries,
  formatStageLabel,
  requiresSubcategory
} from "./target-select.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
const CONTENT_TYPES = [
  { id: "none", name: "None", icon: "\u{1F3AF}", title: "Training Dummy" },
  { id: "stageHunt", name: "Stage Hunt", icon: "\u{1F5FA}\uFE0F", title: "Stage Hunt" },
  { id: "chapterBoss", name: "Chapter Boss", icon: "\u{1F451}", title: "Chapter Boss" },
  { id: "worldBoss", name: "World Boss", icon: "\u{1F30D}", title: "World Boss" },
  { id: "growthDungeon", name: "Growth Dungeon", icon: "\u{1F4C8}", title: "Growth Dungeon" }
];
if (typeof window !== "undefined") {
  window.selectContentType = selectContentType;
  window.onSubcategoryChange = onSubcategoryChange;
}
function selectContentType(contentType) {
  setCurrentContentType(contentType);
  updateContentTypeSelectionUI(contentType);
  configureDropdownsForContentType(contentType);
  loadoutStore.updateTarget({ contentType });
  updateAnalysisTabs();
}
function onSubcategoryChange() {
  const subcategorySelect = document.getElementById("target-subcategory");
  const stageSelect = document.getElementById("target-stage-base");
  if (!subcategorySelect || !stageSelect) return;
  const subcategory = subcategorySelect.value;
  const currentContentType = getCurrentContentType();
  if (currentContentType === "stageHunt") {
    const chapter = subcategory.replace("chapter-", "");
    populateStageDropdownFiltered("stageHunt", chapter);
  } else if (currentContentType === "growthDungeon") {
    populateStageDropdownFiltered("growthDungeon", subcategory);
  }
  stageSelect.style.display = "block";
  loadoutStore.updateTarget({ subcategory });
  updateAnalysisTabs();
}
function initializeTargetSelectUI() {
  const target = loadoutStore.getTarget();
  if (!target || !target.contentType) {
    initializeWithDefaultState();
    return;
  }
  initializeWithSavedState({ contentType: target.contentType, subcategory: target.subcategory, selectedStage: target.selectedStage });
}
function loadTargetSelectUI() {
  const target = loadoutStore.getTarget();
  if (!target || !target.contentType) {
    loadDefaultSelectionUI();
    return;
  }
  restoreSavedSelectionUI({ contentType: target.contentType, subcategory: target.subcategory, selectedStage: target.selectedStage });
}
function initializeWithDefaultState() {
  setCurrentContentType("none");
}
function initializeWithSavedState(savedData) {
  const { contentType } = savedData;
  setCurrentContentType(contentType);
}
function loadDefaultSelectionUI() {
  updateContentTypeSelectionUI("none");
  const stageSelect = document.getElementById("target-stage-base");
  if (stageSelect) {
    stageSelect.value = "none";
  }
}
function restoreSavedSelectionUI(savedData) {
  const { contentType, subcategory, selectedStage } = savedData;
  updateContentTypeSelectionUI(contentType);
  configureDropdownsForContentType(contentType);
  if (subcategory && requiresSubcategory(contentType)) {
    const subcategorySelect = document.getElementById("target-subcategory");
    if (subcategorySelect) {
      subcategorySelect.value = subcategory;
      const currentContentType = getCurrentContentType();
      if (currentContentType === "stageHunt") {
        const chapter = subcategory.replace("chapter-", "");
        populateStageDropdownFiltered("stageHunt", chapter);
      } else if (currentContentType === "growthDungeon") {
        populateStageDropdownFiltered("growthDungeon", subcategory);
      }
      const stageSelect = document.getElementById("target-stage-base");
      if (stageSelect) {
        stageSelect.style.display = "block";
      }
    }
  }
  if (selectedStage) {
    const stageSelect = document.getElementById("target-stage-base");
    if (stageSelect) {
      stageSelect.value = selectedStage;
    }
  }
}
function updateContentTypeSelectionUI(contentType) {
  document.querySelectorAll(".content-type-selector").forEach((el) => {
    el.classList.remove("selected");
  });
  const selectedEl = document.getElementById(`content-${contentType}`);
  if (selectedEl) {
    selectedEl.classList.add("selected");
  }
  const subcategorySelect = document.getElementById("target-subcategory");
  const stageSelect = document.getElementById("target-stage-base");
  if (subcategorySelect) subcategorySelect.style.display = "none";
  if (stageSelect) stageSelect.style.display = "none";
}
function configureDropdownsForContentType(contentType) {
  const subcategorySelect = document.getElementById("target-subcategory");
  const stageSelect = document.getElementById("target-stage-base");
  if (!stageSelect) return;
  if (contentType === "none") {
    stageSelect.value = "none";
    return;
  }
  if (requiresSubcategory(contentType)) {
    populateSubcategoryDropdown(contentType);
    if (subcategorySelect) subcategorySelect.style.display = "block";
  } else {
    stageSelect.style.display = "block";
    populateStageDropdown(contentType);
  }
}
function populateSubcategoryDropdown(contentType) {
  const select = document.getElementById("target-subcategory");
  if (!select) return;
  select.innerHTML = "";
  const options = getSubcategoryOptions(contentType);
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  });
}
function populateStageDropdown(contentType) {
  const select = document.getElementById("target-stage-base");
  if (!select) return;
  select.innerHTML = "";
  const entries = getFilteredStageEntries(contentType, contentType);
  entries.forEach(({ entry, identifier, prefix }) => {
    const opt = document.createElement("option");
    opt.value = `${prefix}-${identifier}`;
    opt.textContent = formatStageLabel(entry, identifier, contentType);
    select.appendChild(opt);
  });
}
function populateStageDropdownFiltered(contentType, filter) {
  const select = document.getElementById("target-stage-base");
  if (!select) return;
  select.innerHTML = "";
  const entries = getFilteredStageEntries(contentType, filter);
  entries.forEach(({ entry, identifier, prefix }) => {
    const opt = document.createElement("option");
    opt.value = `${prefix}-${identifier}`;
    opt.textContent = formatStageLabel(entry, identifier, contentType);
    select.appendChild(opt);
  });
}
function attachContentTypeSelectorListeners() {
  CONTENT_TYPES.forEach((content) => {
    const element = document.getElementById(`content-${content.id}`);
    if (element) {
      element.addEventListener("click", () => selectContentType(content.id));
    }
  });
}
function attachTargetContentListeners() {
  const subcategorySelect = document.getElementById("target-subcategory");
  const stageSelect = document.getElementById("target-stage-base");
  if (subcategorySelect) {
    subcategorySelect.addEventListener("change", () => onSubcategoryChange());
  }
  if (stageSelect) {
    stageSelect.addEventListener("change", () => {
      const stageValue = stageSelect.value;
      loadoutStore.updateTarget({ selectedStage: stageValue });
      updateAnalysisTabs();
    });
  }
}
function attachTargetSelectEventListeners() {
  attachContentTypeSelectorListeners();
  attachTargetContentListeners();
}
function generateContentTypeSelectorHTML() {
  return CONTENT_TYPES.map((content) => `
        <div id="content-${content.id}" class="content-type-selector bgstats-content-card" title="${content.title}">
            <span class="bgstats-content-icon">${content.icon}</span>
            <span class="bgstats-content-name">${content.name}</span>
        </div>
    `).join("");
}
export {
  attachTargetSelectEventListeners,
  generateContentTypeSelectorHTML,
  initializeTargetSelectUI,
  loadTargetSelectUI,
  onSubcategoryChange,
  selectContentType
};
//# sourceMappingURL=target-select-ui.js.map
