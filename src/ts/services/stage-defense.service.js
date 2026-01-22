import { CONTENT_TYPE } from "@ts/types";
import { stageData } from "@data/stage-data.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
const stageDefenses = {
  none: {
    label: "None / Training Dummy",
    defense: 0,
    damageReduction: 0,
    accuracy: 0
  },
  stageHunts: stageData.stageHunts,
  chapterBosses: stageData.chapterBosses,
  worldBosses: stageData.worldBosses,
  growthDungeons: stageData.growthDungeons
};
function getSelectedStageDefense() {
  const target = loadoutStore.getTarget();
  if (target.contentType === CONTENT_TYPE.NONE) {
    return { defense: 0, damageReduction: 0 };
  }
  const [category, ...rest] = target.selectedStage.split("-");
  const identifier = rest.join("-");
  if (target.contentType === "stageHunt") {
    const entry = stageDefenses.stageHunts.find((e) => e.stage === identifier);
    return entry ? { defense: entry.defense * 100, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
  } else if (target.contentType === "chapterBoss") {
    const entry = stageDefenses.chapterBosses.find((e) => e.chapter === identifier);
    return entry ? { defense: entry.defense * 100, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
  } else if (target.contentType === "worldBoss") {
    const entry = stageDefenses.worldBosses.find((e) => e.stage === identifier);
    return entry ? { defense: entry.defense * 10, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
  } else if (target.contentType === "growthDungeon") {
    const entry = stageDefenses.growthDungeons.find((e) => e.stage === identifier);
    return entry ? { defense: entry.defense * 100, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
  }
  return { defense: 0, damageReduction: 0 };
}
export {
  getSelectedStageDefense,
  stageDefenses
};
//# sourceMappingURL=stage-defense.service.js.map
