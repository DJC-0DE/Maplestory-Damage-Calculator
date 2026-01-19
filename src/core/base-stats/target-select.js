import {
  setCurrentContentType,
  getCurrentContentType,
  stageDefenses,
} from "@core/state/state.js";
import { saveToLocalStorage, updateAnalysisTabs } from "@core/state/storage.js";

window.selectContentType = selectContentType;
window.updateStageDropdown = updateStageDropdown;

export function selectContentType(contentType, skipSave = false) {
  // Update selected state
  setCurrentContentType(contentType);

  // Update UI - remove selected class from all
  document.querySelectorAll(".content-type-selector").forEach((el) => {
    el.classList.remove("selected");
  });

  // Add selected class to clicked one
  const selectedEl = document.getElementById(`content-${contentType}`);
  if (selectedEl) {
    selectedEl.classList.add("selected");
  }

  const subcategorySelect = document.getElementById("target-subcategory");
  const stageSelect = document.getElementById("target-stage-base");
  if (!stageSelect) return;

  // Hide everything first
  if (subcategorySelect) subcategorySelect.style.display = "none";
  stageSelect.style.display = "none";

  if (contentType === "none") {
    stageSelect.value = "none";
    if (!skipSave) {
      saveToLocalStorage();
      updateAnalysisTabs();
    }
    return;
  }

  // For stageHunt and growthDungeon, show subcategory selector
  if (contentType === "stageHunt" || contentType === "growthDungeon") {
    populateSubcategoryDropdown(contentType);
    if (subcategorySelect) subcategorySelect.style.display = "block";
  } else {
    // For chapterBoss and worldBoss, directly show stage dropdown
    stageSelect.style.display = "block";
    populateStageDropdown(contentType);
  }

  if (!skipSave) {
    saveToLocalStorage();
    updateAnalysisTabs();
  }
}
export function populateSubcategoryDropdown(contentType) {
  const select = document.getElementById("target-subcategory");
  if (!select) return;

  select.innerHTML = "";

  if (contentType === "stageHunt") {
    // Group by chapter
    for (let ch = 1; ch <= 28; ch++) {
      const opt = document.createElement("option");
      opt.value = `chapter-${ch}`;
      opt.textContent = `Chapter ${ch}`;
      select.appendChild(opt);
    }
  } else if (contentType === "growthDungeon") {
    // Group by dungeon type
    const types = [
      "Weapon",
      "EXP",
      "Equipment",
      "Enhancement",
      "Hero Training Ground",
    ];
    types.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = `${type} Stages`;
      select.appendChild(opt);
    });
  }

  // Trigger initial population of stage dropdown
  updateStageDropdown();
}
export function updateStageDropdown(skipSave = false) {
  const subcategorySelect = document.getElementById("target-subcategory");
  const stageSelect = document.getElementById("target-stage-base");
  if (!subcategorySelect || !stageSelect) return;

  const subcategory = subcategorySelect.value;

  if (getCurrentContentType() === "stageHunt") {
    const chapter = subcategory.replace("chapter-", "");
    populateStageDropdownFiltered("stageHunt", chapter);
  } else if (getCurrentContentType() === "growthDungeon") {
    populateStageDropdownFiltered("growthDungeon", subcategory);
  }

  stageSelect.style.display = "block";

  // Save the subcategory selection (unless we're loading from storage)
  if (!skipSave) {
    saveToLocalStorage();
    updateAnalysisTabs();
  }
}
export function populateStageDropdownFiltered(contentType, filter) {
  const select = document.getElementById("target-stage-base");
  if (!select) return;

  select.innerHTML = "";

  let entries = [];
  let prefix = "";

  if (contentType === "stageHunt") {
    // Filter by chapter
    entries = stageDefenses.stageHunts.filter((e) =>
      e.stage.startsWith(`${filter}-`),
    );
    prefix = "stageHunt";
  } else if (contentType === "growthDungeon") {
    // Filter by dungeon type
    entries = stageDefenses.growthDungeons.filter((e) =>
      e.stage.startsWith(filter),
    );
    prefix = "growthDungeon";
  }

  entries.forEach((entry) => {
    const opt = document.createElement("option");
    const identifier = entry.stage;
    opt.value = `${prefix}-${identifier}`;
    const accuracy = entry.accuracy ? `, Acc: ${entry.accuracy}` : "";

    if (contentType === "worldBoss") {
      opt.textContent = `${identifier} (Def: ${Math.floor(entry.defense * 100)} ${accuracy})`;
    } else {
      opt.textContent = `${identifier} (Def: ${Math.floor(entry.defense * 100)} ${accuracy})`;
    }

    select.appendChild(opt);
  });
}
export function populateStageDropdown(contentType = null) {
  const select = document.getElementById("target-stage-base");
  if (!select) return;

  select.innerHTML = "";

  // If no content type specified, it's the old initialization - select None by default
  if (!contentType) {
    selectContentType("none", true); // Skip save during initialization
    return;
  }

  let entries = [];
  let prefix = "";

  switch (contentType) {
    case "chapterBoss":
      entries = stageDefenses.chapterBosses;
      prefix = "chapterBoss";
      break;
    case "worldBoss":
      entries = stageDefenses.worldBosses;
      prefix = "worldBoss";
      break;
    default:
      return;
  }

  entries.forEach((entry) => {
    const opt = document.createElement("option");
    const identifier = entry.stage || entry.chapter || entry.boss;
    opt.value = `${prefix}-${identifier}`;
    const label =
      contentType === "chapterBoss" ? `Chapter ${identifier}` : identifier;
    const accuracy = entry.accuracy ? `, Acc: ${entry.accuracy}` : "";

    if (contentType === "worldBoss") {
      opt.textContent = `${label} (Def: ${Math.floor(entry.defense * 100)} ${accuracy})`;
    } else {
      opt.textContent = `${label} (Def: ${Math.floor(entry.defense * 100)} ${accuracy})`;
    }

    select.appendChild(opt);
  });
}
