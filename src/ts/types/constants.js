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
const STAT = {
  // Core Combat Stats
  ATTACK: {
    id: "attack",
    label: "Attack",
    type: "number",
    defaultValue: 500
  },
  DEFENSE: {
    id: "defense",
    label: "Defense",
    type: "number",
    defaultValue: 0,
    info: "defense"
  },
  CRIT_RATE: {
    id: "critRate",
    label: "Critical Rate (%)",
    type: "number",
    step: "0.1",
    defaultValue: 15
  },
  CRIT_DAMAGE: {
    id: "critDamage",
    label: "Critical Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 15
  },
  ATTACK_SPEED: {
    id: "attackSpeed",
    label: "Attack Speed (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0
  },
  // Main Stats
  STR: {
    id: "str",
    label: "STR",
    type: "number",
    defaultValue: 1e3,
    rowId: "str-row"
  },
  DEX: {
    id: "dex",
    label: "DEX",
    type: "number",
    defaultValue: 0,
    rowId: "dex-row"
  },
  INT: {
    id: "int",
    label: "INT",
    type: "number",
    defaultValue: 1e3,
    rowId: "int-row"
  },
  LUK: {
    id: "luk",
    label: "LUK",
    type: "number",
    defaultValue: 0,
    rowId: "luk-row"
  },
  // Damage Modifiers
  STAT_DAMAGE: {
    id: "statDamage",
    label: "Stat Prop. Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0
  },
  DAMAGE: {
    id: "damage",
    label: "Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 10
  },
  DAMAGE_AMP: {
    id: "damageAmp",
    label: "Damage Amplification (x)",
    type: "number",
    step: "0.1",
    defaultValue: 0
  },
  BASIC_ATTACK_DAMAGE: {
    id: "basicAttackDamage",
    label: "Basic Attack Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0,
    hidden: true
  },
  SKILL_DAMAGE: {
    id: "skillDamage",
    label: "Skill Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0,
    hidden: true
  },
  DEF_PEN: {
    id: "defPen",
    label: "Defense Penetration (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0,
    info: "def-pen"
  },
  BOSS_DAMAGE: {
    id: "bossDamage",
    label: "Boss Monster Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 10
  },
  NORMAL_DAMAGE: {
    id: "normalDamage",
    label: "Normal Monster Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0
  },
  MIN_DAMAGE: {
    id: "minDamage",
    label: "Min Damage Multiplier (%)",
    type: "number",
    step: "0.1",
    defaultValue: 50
  },
  MAX_DAMAGE: {
    id: "maxDamage",
    label: "Max Damage Multiplier (%)",
    type: "number",
    step: "0.1",
    defaultValue: 100
  },
  FINAL_DAMAGE: {
    id: "finalDamage",
    label: "Final Damage (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0
  },
  // Skill Levels
  SKILL_LEVEL_1ST: {
    id: "skillLevel1st",
    label: "1st Job Skill Level",
    type: "number",
    defaultValue: 0,
    min: 0,
    onChange: true
  },
  SKILL_LEVEL_2ND: {
    id: "skillLevel2nd",
    label: "2nd Job Skill Level",
    type: "number",
    defaultValue: 0,
    min: 0,
    onChange: true
  },
  SKILL_LEVEL_3RD: {
    id: "skillLevel3rd",
    label: "3rd Job Skill Level",
    type: "number",
    defaultValue: 0,
    min: 0,
    onChange: true
  },
  SKILL_LEVEL_4TH: {
    id: "skillLevel4th",
    label: "4th Job Skill Level",
    type: "number",
    defaultValue: 0,
    min: 0,
    onChange: true
  },
  // Main Stat %
  MAIN_STAT_PCT: {
    id: "mainStatPct",
    label: "Current Main Stat %",
    type: "number",
    step: "0.1",
    defaultValue: 0,
    info: "main-stat-pct"
  },
  // Hidden/Main Stat Fields
  PRIMARY_MAIN_STAT: {
    id: "primaryMainStat",
    label: "Primary Main Stat",
    type: "number",
    defaultValue: 1e3
  },
  SECONDARY_MAIN_STAT: {
    id: "secondaryMainStat",
    label: "Secondary Main Stat",
    type: "number",
    defaultValue: 0
  },
  MASTERY: {
    id: "mastery",
    label: "Skill Mastery %",
    type: "number",
    defaultValue: 0
  },
  BOSS_MASTERY: {
    id: "bossMastery",
    label: "Skill Mastery (Boss) %",
    type: "number",
    defaultValue: 0
  },
  SKILL_COEFFICIENT: {
    id: "skillCoefficient",
    label: "Basic Attack Skill Coefficient",
    type: "number",
    defaultValue: 0
  },
  FINAL_ATTACK: {
    id: "finalAttack",
    label: "Final Attack (%)",
    type: "number",
    step: "0.1",
    defaultValue: 0
  }
};
const STAT_IDS = Object.values(STAT).map((s) => s.id);
const DEFAULT_BASE_STATS = Object.keys(STAT).reduce((acc, key) => {
  acc[key] = STAT[key].defaultValue;
  return acc;
}, {});
export {
  BINARY_SEARCH,
  CLASS,
  CONTENT_TYPE,
  DEFAULT_BASE_STATS,
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
  STAT,
  STAT_IDS,
  STAT_TYPE,
  WEAPON_RARITY,
  WEAPON_TIER
};
//# sourceMappingURL=constants.js.map
