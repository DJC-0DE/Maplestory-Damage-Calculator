const JOB_TIER = {
  THIRD: "3rd",
  FOURTH: "4th"
};
const CLASS = {
  HERO: "hero",
  DARK_KNIGHT: "dark-knight",
  BOWMASTER: "bowmaster",
  MARKSMAN: "marksman",
  NIGHT_LORD: "night-lord",
  SHADOWER: "shadower",
  ARCH_MAGE_IL: "arch-mage-il",
  ARCH_MAGE_FP: "arch-mage-fp"
};
const CONTENT_TYPE = {
  NONE: "none",
  STAGE_HUNT: "stageHunt",
  CHAPTER_BOSS: "chapterBoss",
  WORLD_BOSS: "worldBoss",
  GROWTH_DUNGEON: "growthDungeon"
};
const STAT_TYPE = {
  PRIMARY: "primary",
  SECONDARY: "secondary"
};
const WEAPON_RARITY = {
  NORMAL: "normal",
  RARE: "rare",
  EPIC: "epic",
  UNIQUE: "unique",
  LEGENDARY: "legendary",
  MYSTIC: "mystic",
  ANCIENT: "ancient"
};
const WEAPON_TIER = {
  T1: "t1",
  T2: "t2",
  T3: "t3",
  T4: "t4"
};
const MONSTER_TYPE = {
  BOSS: "boss",
  NORMAL: "normal"
};
const MASTERY_TYPE = {
  ALL: "all",
  BOSS: "boss"
};
const HIGH_TIER_RARITIES = [
  WEAPON_RARITY.LEGENDARY,
  WEAPON_RARITY.MYSTIC,
  WEAPON_RARITY.ANCIENT
];
const INVENTORY_DIVISOR_HIGH_TIER = 4;
const INVENTORY_DIVISOR_STANDARD = 3.5;
const MAX_WEAPON_UPGRADE_ITERATIONS = 300;
const MAX_STAR_RATING = 5;
const EFFICIENCY_THRESHOLD = {
  HIGH: 0.66,
  MEDIUM: 0.33
};
const BINARY_SEARCH = {
  DEFAULT_MAX: 1e6,
  MAX_ITERATIONS: 100,
  PRECISION: 0.01
};
const MAX_CHAPTER_NUMBER = 28;
const MASTERY_LEVELS = {
  THIRD: {
    ALL: [64, 68, 76, 80, 88, 92],
    BOSS: [72, 84]
  },
  FOURTH: {
    ALL: [102, 106, 116, 120, 128, 132],
    BOSS: [111, 124]
  }
};
export {
  BINARY_SEARCH,
  CLASS,
  CONTENT_TYPE,
  EFFICIENCY_THRESHOLD,
  HIGH_TIER_RARITIES,
  INVENTORY_DIVISOR_HIGH_TIER,
  INVENTORY_DIVISOR_STANDARD,
  JOB_TIER,
  MASTERY_LEVELS,
  MASTERY_TYPE,
  MAX_CHAPTER_NUMBER,
  MAX_STAR_RATING,
  MAX_WEAPON_UPGRADE_ITERATIONS,
  MONSTER_TYPE,
  STAT_TYPE,
  WEAPON_RARITY,
  WEAPON_TIER
};
//# sourceMappingURL=constants.js.map
