const STORAGE_KEY_MAPPING = {
  attack: "attack",
  critRate: "crit-rate",
  critDamage: "crit-damage",
  statDamage: "stat-damage",
  damage: "damage",
  damageAmp: "damage-amp",
  attackSpeed: "attack-speed",
  defPen: "def-pen",
  bossDamage: "boss-damage",
  normalDamage: "normal-damage",
  skillCoeff: "skill-coeff",
  skillMastery: "skill-mastery",
  skillMasteryBoss: "skill-mastery-boss",
  minDamage: "min-damage",
  maxDamage: "max-damage",
  primaryMainStat: "primary-main-stat",
  secondaryMainStat: "secondary-main-stat",
  finalDamage: "final-damage",
  targetStage: "target-stage",
  defense: "defense",
  mainStatPct: "main-stat-pct",
  skillLevel1st: "skill-level-1st",
  skillLevel2nd: "skill-level-2nd",
  skillLevel3rd: "skill-level-3rd",
  skillLevel4th: "skill-level-4th",
  str: "str",
  dex: "dex",
  int: "int",
  luk: "luk",
  characterLevel: "character-level"
};
const STORAGE_KEY_TO_STAT_PROPERTY = Object.entries(
  STORAGE_KEY_MAPPING
).reduce((acc, [statKey, storageKey]) => {
  acc[storageKey] = statKey;
  return acc;
}, {});
const STAT_KEYS = Object.keys(STORAGE_KEY_MAPPING);
const STORAGE_KEYS = Object.values(STORAGE_KEY_MAPPING);
const BASE_SETUP_FIELDS = [
  "attack",
  "crit-rate",
  "crit-damage",
  "stat-damage",
  "damage",
  "damage-amp",
  "attack-speed",
  "def-pen",
  "boss-damage",
  "normal-damage",
  "skill-coeff",
  "skill-mastery",
  "skill-mastery-boss",
  "min-damage",
  "max-damage",
  "primary-main-stat",
  "secondary-main-stat",
  "final-damage",
  "target-stage",
  "defense",
  "main-stat-pct",
  "skill-level-1st",
  "skill-level-2nd",
  "skill-level-3rd",
  "skill-level-4th",
  "str",
  "dex",
  "int",
  "luk"
];
export {
  BASE_SETUP_FIELDS,
  STAT_KEYS,
  STORAGE_KEYS,
  STORAGE_KEY_MAPPING,
  STORAGE_KEY_TO_STAT_PROPERTY
};
//# sourceMappingURL=types.js.map
