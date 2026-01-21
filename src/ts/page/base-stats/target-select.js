import { stageDefenses } from "@core/state/state.js";
import { CONTENT_TYPE, MAX_CHAPTER_NUMBER } from "@ts/types";
function getStageEntries(contentType) {
  switch (contentType) {
    case CONTENT_TYPE.CHAPTER_BOSS:
      return stageDefenses.chapterBosses;
    case CONTENT_TYPE.WORLD_BOSS:
      return stageDefenses.worldBosses;
    case CONTENT_TYPE.STAGE_HUNT:
      return stageDefenses.stageHunts;
    case CONTENT_TYPE.GROWTH_DUNGEON:
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
  if (contentType === CONTENT_TYPE.STAGE_HUNT) {
    const options = [];
    for (let ch = 1; ch <= MAX_CHAPTER_NUMBER; ch++) {
      options.push({
        value: `chapter-${ch}`,
        label: `Chapter ${ch}`
      });
    }
    return options;
  }
  if (contentType === CONTENT_TYPE.GROWTH_DUNGEON) {
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
  if (contentType === CONTENT_TYPE.STAGE_HUNT) {
    entries = filterStageHuntsByChapter(filter);
    prefix = "stageHunt";
  } else if (contentType === CONTENT_TYPE.GROWTH_DUNGEON) {
    entries = filterGrowthDungeonsByType(filter);
    prefix = "growthDungeon";
  } else if (contentType === CONTENT_TYPE.CHAPTER_BOSS) {
    entries = getStageEntries(CONTENT_TYPE.CHAPTER_BOSS);
    prefix = "chapterBoss";
  } else if (contentType === CONTENT_TYPE.WORLD_BOSS) {
    entries = getStageEntries(CONTENT_TYPE.WORLD_BOSS);
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
  if (contentType === CONTENT_TYPE.CHAPTER_BOSS) {
    return `Chapter ${identifier} (Def: ${defense}${accuracy})`;
  }
  if (contentType === CONTENT_TYPE.WORLD_BOSS) {
    return `${identifier} (Def: ${defense}${accuracy})`;
  }
  return `${identifier} (Def: ${defense}${accuracy})`;
}
function requiresSubcategory(contentType) {
  return contentType === CONTENT_TYPE.STAGE_HUNT || contentType === CONTENT_TYPE.GROWTH_DUNGEON;
}
function requiresStageSelection(contentType) {
  return contentType === CONTENT_TYPE.CHAPTER_BOSS || contentType === CONTENT_TYPE.WORLD_BOSS || contentType === CONTENT_TYPE.STAGE_HUNT || contentType === CONTENT_TYPE.GROWTH_DUNGEON;
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
