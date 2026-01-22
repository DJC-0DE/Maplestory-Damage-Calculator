import { CONTENT_TYPE, JOB_TIER, MASTERY_TYPE, DEFAULT_BASE_STATS } from "./constants.js";
const DEFAULT_LOADOUT_DATA = {
  baseStats: DEFAULT_BASE_STATS,
  character: {
    level: 0,
    class: null,
    jobTier: JOB_TIER.THIRD
  },
  weapons: {},
  mastery: {
    [JOB_TIER.THIRD]: { [MASTERY_TYPE.ALL]: {}, [MASTERY_TYPE.BOSS]: {} },
    [JOB_TIER.FOURTH]: { [MASTERY_TYPE.ALL]: {}, [MASTERY_TYPE.BOSS]: {} }
  },
  target: {
    contentType: CONTENT_TYPE.NONE,
    subcategory: null,
    selectedStage: null
  },
  weaponAttackBonus: {
    totalAttack: 0,
    equippedAttack: 0
  }
};
export {
  DEFAULT_LOADOUT_DATA
};
//# sourceMappingURL=loadout.js.map
