/**
 * Common Selectors for Base Stats Tests
 * Centralized selector constants for maintainability
 */

// Page and Tab Selectors
export const BASE_URL = "http://localhost:8000";
export const BASE_STATS_URL = `${BASE_URL}/#/setup/base-stats`;

// Class Selectors
export const CLASS_SELECTORS = {
  hero: "#class-hero",
  darkKnight: "#class-dark-knight",
  bowmaster: "#class-bowmaster",
  marksman: "#class-marksman",
  nightLord: "#class-night-lord",
  shadower: "#class-shadower",
  archMageIL: "#class-arch-mage-il",
  archMageFP: "#class-arch-mage-fp",
};

// Job Tier Selectors
export const JOB_TIER_BUTTONS = {
  "3rd": "#job-tier-3rd",
  "4th": "#job-tier-4th",
};

// Mastery Tab Selectors
export const MASTERY_TABS = {
  "3rd": "#mastery-tab-3rd",
  "4th": "#mastery-tab-4th",
};

// Mastery Table Containers
export const MASTERY_TABLES = {
  "3rd": "#mastery-table-3rd",
  "4th": "#mastery-table-4th",
};

// Stat Row Selectors
export const STAT_ROWS = {
  str: "#str-row",
  dex: "#dex-row",
  int: "#int-row",
  luk: "#luk-row",
};

// Core Stat Input Selectors
export const STAT_INPUTS = {
  attack: "#attack-base",
  defense: "#defense-base",
  critRate: "#crit-rate-base",
  critDamage: "#crit-damage-base",
  attackSpeed: "#attack-speed-base",
  str: "#str-base",
  dex: "#dex-base",
  int: "#int-base",
  luk: "#luk-base",
  statDamage: "#stat-damage-base",
  damage: "#damage-base",
  damageAmp: "#damage-amp-base",
  defPen: "#def-pen-base",
  bossDamage: "#boss-damage-base",
  normalDamage: "#normal-damage-base",
  minDamage: "#min-damage-base",
  maxDamage: "#max-damage-base",
  finalDamage: "#final-damage-base",
  mainStatPct: "#main-stat-pct-base",
};

// Skill Level Inputs
export const SKILL_LEVEL_INPUTS = {
  "1st": "#skill-level-1st-base",
  "2nd": "#skill-level-2nd-base",
  "3rd": "#skill-level-3rd-base",
  "4th": "#skill-level-4th-base",
};

// Character Level Input
export const CHARACTER_LEVEL = "#character-level";

// Hidden Field Selectors
export const HIDDEN_FIELDS = {
  primaryMainStat: "#primary-main-stat-base",
  secondaryMainStat: "#secondary-main-stat-base",
  skillMastery: "#skill-mastery-base",
  skillMasteryBoss: "#skill-mastery-boss-base",
  skillCoeff: "#skill-coeff-base",
};

// Mastery Checkbox Selectors - 3rd Job
export const MASTERY_3RD_CHECKBOXES = {
  all64: "#mastery-3rd-all-64",
  all68: "#mastery-3rd-all-68",
  boss72: "#mastery-3rd-boss-72",
  all76: "#mastery-3rd-all-76",
  all80: "#mastery-3rd-all-80",
  boss84: "#mastery-3rd-boss-84",
  all88: "#mastery-3rd-all-88",
  all92: "#mastery-3rd-all-92",
};

// Mastery Checkbox Selectors - 4th Job
export const MASTERY_4TH_CHECKBOXES = {
  all102: "#mastery-4th-all-102",
  all106: "#mastery-4th-all-106",
  boss111: "#mastery-4th-boss-111",
  all116: "#mastery-4th-all-116",
  all120: "#mastery-4th-all-120",
  boss124: "#mastery-4th-boss-124",
  all128: "#mastery-4th-all-128",
  all132: "#mastery-4th-all-132",
};

// Target Content Type Selectors
export const CONTENT_TYPE_SELECTORS = {
  none: "#content-none",
  stageHunt: "#content-stageHunt",
  chapterBoss: "#content-chapterBoss",
  worldBoss: "#content-worldBoss",
  growthDungeon: "#content-growthDungeon",
};

// Target Dropdown Selectors
export const TARGET_DROPDOWNS = {
  subcategory: "#target-subcategory",
  stage: "#target-stage-base",
};

// Tab Button Selectors
export const SETUP_TAB_BUTTONS = {
  baseStats: 'button[data-tab="base-stats"]',
  equipment: 'button[data-tab="equipment"]',
  weaponLevels: 'button[data-tab="weapon-levels"]',
  companions: 'button[data-tab="companions"]',
};

// localStorage Keys
export const STORAGE_KEYS = {
  selectedClass: "selectedClass",
  selectedJobTier: "selectedJobTier",
  characterLevel: "characterLevel",
  currentContentType: "currentContentType",
};
