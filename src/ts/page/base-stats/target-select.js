import { stageDefenses } from "@core/state/state.js";
function getStageEntries(contentType) {
  switch (contentType) {
    case "chapterBoss":
      return stageDefenses.chapterBosses;
    case "worldBoss":
      return stageDefenses.worldBosses;
    case "stageHunt":
      return stageDefenses.stageHunts;
    case "growthDungeon":
      return stageDefenses.growthDungeons;
    default:
      return [];
  }
}
function filterStageHuntsByChapter(chapter) {
  return stageDefenses.stageHunts.filter((e) => e.stage.startsWith(`${chapter}-`));
}
function filterGrowthDungeonsByType(dungeonType) {
  return stageDefenses.growthDungeons.filter((e) => e.stage.startsWith(dungeonType));
}
function getSubcategoryOptions(contentType) {
  if (contentType === "stageHunt") {
    const options = [];
    for (let ch = 1; ch <= 28; ch++) {
      options.push({
        value: `chapter-${ch}`,
        label: `Chapter ${ch}`
      });
    }
    return options;
  }
  if (contentType === "growthDungeon") {
    const types = ["Weapon", "EXP", "Equipment", "Enhancement", "Hero Training Ground"];
    return types.map((type) => ({
      value: type,
      label: `${type} Stages`
    }));
  }
  return [];
}
function getFilteredStageEntries(contentType, filter) {
  let entries = [];
  let prefix = "";
  if (contentType === "stageHunt") {
    entries = filterStageHuntsByChapter(filter);
    prefix = "stageHunt";
  } else if (contentType === "growthDungeon") {
    entries = filterGrowthDungeonsByType(filter);
    prefix = "growthDungeon";
  } else if (contentType === "chapterBoss") {
    entries = getStageEntries("chapterBoss");
    prefix = "chapterBoss";
  } else if (contentType === "worldBoss") {
    entries = getStageEntries("worldBoss");
    prefix = "worldBoss";
  }
  return entries.map((entry) => ({
    entry,
    identifier: entry.stage || entry.chapter || entry.boss || "",
    prefix
  }));
}
function formatStageLabel(entry, identifier, contentType) {
  const accuracy = entry.accuracy ? `, Acc: ${entry.accuracy}` : "";
  const defense = Math.floor(entry.defense * 100);
  if (contentType === "chapterBoss") {
    return `Chapter ${identifier} (Def: ${defense}${accuracy})`;
  }
  if (contentType === "worldBoss") {
    return `${identifier} (Def: ${defense}${accuracy})`;
  }
  return `${identifier} (Def: ${defense}${accuracy})`;
}
function requiresSubcategory(contentType) {
  return contentType === "stageHunt" || contentType === "growthDungeon";
}
function requiresStageSelection(contentType) {
  return contentType === "chapterBoss" || contentType === "worldBoss" || contentType === "stageHunt" || contentType === "growthDungeon";
}
export {
  filterGrowthDungeonsByType,
  filterStageHuntsByChapter,
  formatStageLabel,
  getFilteredStageEntries,
  getStageEntries,
  getSubcategoryOptions,
  requiresStageSelection,
  requiresSubcategory
};
//# sourceMappingURL=target-select.js.map
