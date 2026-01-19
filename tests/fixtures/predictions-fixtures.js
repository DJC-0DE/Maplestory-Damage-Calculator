/**
 * Fixtures for Stat Predictions Testing
 * Includes edge case fixtures for hard caps and typical progression states
 */

// Re-export base stats fixtures for reuse
export {
  HERO_LEVEL_60,
  HERO_LEVEL_80,
  HERO_LEVEL_100,
  BOWMASTER_LEVEL_80,
  ARCH_MAGE_IL_LEVEL_90,
  DARK_KNIGHT_LEVEL_100
} from './base-stats.fixtures.js';

/**
 * Edge Case Fixture: Hero at Hard Cap - Crit Rate
 * Tests behavior when crit rate is at 100% (hard cap)
 * Expected: 0% damage gain for any further crit rate increase
 */
export const HERO_CAP_CRIT_RATE = {
  class: 'hero',
  jobTier: '4th',
  level: 100,
  attack: 500,
  defense: 0,
  critRate: 100,        // AT HARD CAP
  critDamage: 80,
  attackSpeed: 0,
  str: 1000,
  dex: 300,
  int: 0,
  luk: 0,
  statDamage: 0,
  damage: 0,
  damageAmp: 0,
  defPen: 0,
  bossDamage: 0,
  normalDamage: 0,
  minDamage: 70,
  maxDamage: 100,
  finalDamage: 0,
  mainStatPct: 0,
  skillLevels: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 30 },
  // No mastery bonuses - minimal setup for clean testing
  mastery: {},
  targetContent: 'none'
};

/**
 * Edge Case Fixture: Hero at Hard Cap - Attack Speed
 * Tests behavior when attack speed is at 150% (hard cap)
 * Expected: 0% damage gain for any further attack speed increase
 */
export const HERO_CAP_ATTACK_SPEED = {
  class: 'hero',
  jobTier: '4th',
  level: 100,
  attack: 500,
  defense: 0,
  critRate: 50,
  critDamage: 50,
  attackSpeed: 150,     // AT HARD CAP
  str: 1000,
  dex: 300,
  int: 0,
  luk: 0,
  statDamage: 0,
  damage: 0,
  damageAmp: 0,
  defPen: 0,
  bossDamage: 0,
  normalDamage: 0,
  minDamage: 70,
  maxDamage: 100,
  finalDamage: 0,
  mainStatPct: 0,
  skillLevels: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 30 },
  mastery: {},
  targetContent: 'none'
};

/**
 * Edge Case Fixture: Hero at Hard Cap - Defense Penetration
 * Tests behavior when def pen is at 100% (hard cap)
 * Expected: 0% damage gain for any further def pen increase
 */
export const HERO_CAP_DEF_PEN = {
  class: 'hero',
  jobTier: '4th',
  level: 100,
  attack: 500,
  defense: 0,
  critRate: 50,
  critDamage: 50,
  attackSpeed: 0,
  str: 1000,
  dex: 300,
  int: 0,
  luk: 0,
  statDamage: 0,
  damage: 0,
  damageAmp: 0,
  defPen: 100,         // AT HARD CAP
  bossDamage: 0,
  normalDamage: 0,
  minDamage: 70,
  maxDamage: 100,
  finalDamage: 0,
  mainStatPct: 0,
  skillLevels: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 30 },
  mastery: {},
  targetContent: 'none'
};

/**
 * Edge Case Fixture: Hero with Minimal Stats
 * Tests behavior with all base stats at zero/minimal values
 * Expected: Graceful handling, no NaN/undefined values
 */
export const HERO_MINIMAL_STATS = {
  class: 'hero',
  jobTier: '3rd',
  level: 10,            // Very low level
  attack: 0,            // All zeros
  defense: 0,
  critRate: 0,
  critDamage: 0,
  attackSpeed: 0,
  str: 0,
  dex: 0,
  int: 0,
  luk: 0,
  statDamage: 0,
  damage: 0,
  damageAmp: 0,
  defPen: 0,
  bossDamage: 0,
  normalDamage: 0,
  minDamage: 20,        // Minimum base multiplier
  maxDamage: 100,
  finalDamage: 0,
  mainStatPct: 0,
  skillLevels: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 0 },
  mastery: {},
  targetContent: 'none'
};

/**
 * Fixture: Hero Near Hard Cap - Crit Rate
 * Tests behavior when crit rate is just below hard cap (95%)
 * Expected: Small damage gain for +5% crit rate to reach cap, then 0% beyond
 */
export const HERO_NEAR_CAP_CRIT_RATE = {
  class: 'hero',
  jobTier: '4th',
  level: 100,
  attack: 500,
  defense: 0,
  critRate: 95,        // Just below hard cap
  critDamage: 80,
  attackSpeed: 0,
  str: 1000,
  dex: 300,
  int: 0,
  luk: 0,
  statDamage: 0,
  damage: 0,
  damageAmp: 0,
  defPen: 0,
  bossDamage: 0,
  normalDamage: 0,
  minDamage: 70,
  maxDamage: 100,
  finalDamage: 0,
  mainStatPct: 0,
  skillLevels: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 30 },
  mastery: {},
  targetContent: 'none'
};

/**
 * Fixture: Well-Geared Hero for Predictions
 * Tests realistic predictions for a well-geared 4th job character
 * Expected: Meaningful damage gain predictions across multiple stats
 */
export const HERO_WELL_GEARED_4TH = {
  class: 'hero',
  jobTier: '4th',
  level: 120,
  attack: 1500,        // Well-geared attack
  defense: 0,
  critRate: 85,        // High but not capped
  critDamage: 90,      // High crit damage
  attackSpeed: 60,     // Good attack speed
  str: 2500,           // Strong main stat
  dex: 800,            // Strong secondary stat
  int: 0,
  luk: 0,
  statDamage: 20,      // Some stat damage
  damage: 35,          // Good damage bonus
  damageAmp: 0,
  defPen: 25,          // Some defense pen
  bossDamage: 80,      // High boss damage
  normalDamage: 40,    // Good mob damage
  minDamage: 75,
  maxDamage: 105,
  finalDamage: 15,     // Some final damage
  mainStatPct: 40,     // Decent main stat %
  skillLevels: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 30 },
  mastery: {
    '4th-all-102': true,
    '4th-all-106': true,
    '4th-boss-111': true,
    '4th-all-116': true
  },
  targetContent: 'worldBoss'
};

/**
 * Fixture: Bowmaster at Hard Cap - Attack Speed
 * Tests attack speed cap on archer class (which benefits greatly from attack speed)
 */
export const BOWMASTER_CAP_ATTACK_SPEED = {
  class: 'bowmaster',
  jobTier: '4th',
  level: 120,
  attack: 1200,
  defense: 0,
  critRate: 90,
  critDamage: 85,
  attackSpeed: 150,    // AT HARD CAP
  str: 50,             // Minimal STR for archer
  dex: 2000,           // Very high DEX
  int: 0,
  luk: 0,
  statDamage: 15,
  damage: 30,
  damageAmp: 0,
  defPen: 20,
  bossDamage: 90,
  normalDamage: 35,
  minDamage: 70,
  maxDamage: 100,
  finalDamage: 10,
  mainStatPct: 50,
  skillLevels: { '1st': 0, '2nd': 0, '3rd': 0, '4th': 30 },
  mastery: {
    '4th-all-102': true,
    '4th-all-106': true,
    '4th-boss-111': true,
    '4th-all-116': true,
    '4th-all-120': true
  },
  targetContent: 'chapterBoss'
};
