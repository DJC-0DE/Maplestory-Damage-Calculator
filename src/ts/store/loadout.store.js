import { DEFAULT_LOADOUT_DATA } from "@ts/types/loadout.js";
import { CONTENT_TYPE, JOB_TIER, MASTERY_TYPE } from "@ts/types/constants.js";
const _LoadoutStore = class _LoadoutStore {
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  constructor() {
    this.isInitialized = false;
    this.data = JSON.parse(JSON.stringify(DEFAULT_LOADOUT_DATA));
  }
  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  /**
   * Initialize store - loads from localStorage, handles migration
   * Call this at the top of loadout-page init
   *
   * @returns Promise that resolves when initialization is complete
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn("LoadoutStore already initialized");
      return;
    }
    const newData = localStorage.getItem("loadout-data");
    if (newData) {
      try {
        this.data = JSON.parse(newData);
        console.log("LoadoutStore: Loaded from new format (loadout-data)");
      } catch (e) {
        console.error("LoadoutStore: Failed to parse loadout-data, falling back to migration", e);
        this.migrateFromLegacy();
      }
    } else {
      this.migrateFromLegacy();
    }
    this.validateAndFillDefaults();
    this.isInitialized = true;
    console.log("LoadoutStore: Initialization complete", this.data);
  }
  /**
   * Migrate data from legacy localStorage keys to new format
   */
  migrateFromLegacy() {
    console.log("LoadoutStore: Migrating from legacy format...");
    const legacyDataStr = localStorage.getItem("damageCalculatorData");
    const selectedClass = localStorage.getItem("selectedClass");
    const selectedJobTier = localStorage.getItem("selectedJobTier");
    if (!legacyDataStr && !selectedClass && !selectedJobTier) {
      console.log("LoadoutStore: No legacy data found, using defaults");
      return;
    }
    const legacy = legacyDataStr ? JSON.parse(legacyDataStr) : {};
    if (legacy.baseSetup) {
      Object.entries(legacy.baseSetup).forEach(([key, value]) => {
        if (typeof value === "number") {
          this.data.baseStats[key] = value;
        } else if (typeof value === "string") {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) {
            this.data.baseStats[key] = parsed;
          }
        }
      });
    }
    if (legacy.weapons) {
      Object.entries(legacy.weapons).forEach(([key, weapon]) => {
        this.data.weapons[key] = {
          level: typeof weapon.level === "number" ? weapon.level : parseInt(weapon.level) || 0,
          stars: typeof weapon.stars === "number" ? weapon.stars : parseInt(weapon.stars) || 0,
          equipped: weapon.equipped || false
        };
      });
    }
    if (legacy.masteryBonuses) {
      const tiers = [JOB_TIER.THIRD, JOB_TIER.FOURTH];
      const types = [MASTERY_TYPE.ALL, MASTERY_TYPE.BOSS];
      tiers.forEach((tier) => {
        types.forEach((type) => {
          const tierData = legacy.masteryBonuses[tier];
          if (tierData && tierData[type]) {
            this.data.mastery[tier][type] = { ...tierData[type] };
          }
        });
      });
    }
    if (legacy.contentType) {
      this.data.target.contentType = legacy.contentType;
    }
    if (legacy.subcategory) {
      this.data.target.subcategory = legacy.subcategory;
    }
    if (legacy.selectedStage) {
      this.data.target.selectedStage = legacy.selectedStage;
    }
    if (selectedClass) {
      this.data.character.class = selectedClass;
    }
    if (selectedJobTier) {
      this.data.character.jobTier = selectedJobTier;
    }
    console.log("LoadoutStore: Migration complete, saving to new format...");
    this.saveDualWrite();
  }
  /**
   * Migrate stat keys from legacy hyphenated format to camelCase
   * Called during initialization - completely transparent to consumers
   */
  migrateStatKeys() {
    const migratedStats = {};
    let hasMigrations = false;
    Object.entries(this.data.baseStats).forEach(([key, value]) => {
      const newKey = _LoadoutStore.STAT_KEY_MIGRATION[key];
      if (newKey) {
        migratedStats[newKey] = value;
        hasMigrations = true;
      } else {
        migratedStats[key] = value;
      }
    });
    if (hasMigrations) {
      this.data.baseStats = migratedStats;
      console.log("LoadoutStore: Migrated stat keys to camelCase format");
    }
  }
  /**
   * Validate data structure and fill missing fields with defaults
   */
  validateAndFillDefaults() {
    this.migrateStatKeys();
    const defaults = DEFAULT_LOADOUT_DATA;
    if (!this.data.baseStats) {
      this.data.baseStats = {};
    }
    if (!this.data.character) {
      this.data.character = { ...defaults.character };
    }
    if (typeof this.data.character.level !== "number") {
      this.data.character.level = defaults.character.level;
    }
    if (this.data.character.class === void 0) {
      this.data.character.class = defaults.character.class;
    }
    if (!this.data.character.jobTier || ![JOB_TIER.THIRD, JOB_TIER.FOURTH].includes(this.data.character.jobTier)) {
      this.data.character.jobTier = defaults.character.jobTier;
    }
    if (!this.data.weapons) {
      this.data.weapons = {};
    }
    if (!this.data.mastery) {
      this.data.mastery = { ...defaults.mastery };
    }
    [JOB_TIER.THIRD, JOB_TIER.FOURTH].forEach((tier) => {
      if (!this.data.mastery[tier]) {
        this.data.mastery[tier] = { [MASTERY_TYPE.ALL]: {}, [MASTERY_TYPE.BOSS]: {} };
      }
      [MASTERY_TYPE.ALL, MASTERY_TYPE.BOSS].forEach((type) => {
        if (!this.data.mastery[tier][type]) {
          this.data.mastery[tier][type] = {};
        }
      });
    });
    if (!this.data.target) {
      this.data.target = { ...defaults.target };
    }
    if (!this.data.target.contentType) {
      this.data.target.contentType = CONTENT_TYPE.NONE;
    }
    if (!this.data.weaponAttackBonus) {
      this.data.weaponAttackBonus = { ...defaults.weaponAttackBonus };
    }
    if (typeof this.data.weaponAttackBonus.totalAttack !== "number") {
      this.data.weaponAttackBonus.totalAttack = defaults.weaponAttackBonus.totalAttack;
    }
    if (typeof this.data.weaponAttackBonus.equippedAttack !== "number") {
      this.data.weaponAttackBonus.equippedAttack = defaults.weaponAttackBonus.equippedAttack;
    }
  }
  // ========================================================================
  // GETTERS - Return pre-hydrated data with safe defaults
  // ========================================================================
  /**
   * Get all base stats as key-value object
   * @returns Record of stat key → value (0 if not set)
   */
  getBaseStats() {
    return { ...this.data.baseStats };
  }
  /**
   * Get a single base stat value
   * @param key - Stat key (e.g., "attack-base", "crit-rate-base")
   * @returns Stat value (0 if not set)
   */
  getBaseStat(key) {
    return this.data.baseStats[key] ?? 0;
  }
  /**
   * Get all weapons data
   * @returns Weapons object indexed by rarity-tier key
   */
  getWeapons() {
    return { ...this.data.weapons };
  }
  /**
   * Get single weapon data
   * @param key - Weapon key (e.g., "legendary-t4")
   * @returns Weapon data or null if not found
   */
  getWeapon(key) {
    return this.data.weapons[key] ? { ...this.data.weapons[key] } : null;
  }
  /**
   * Get mastery bonuses
   * @returns Complete mastery bonus object
   */
  getMastery() {
    return JSON.parse(JSON.stringify(this.data.mastery));
  }
  /**
   * Get specific mastery checkbox state
   * @param tier - Mastery tier ('3rd' or '4th')
   * @param type - Mastery type ('all' or 'boss')
   * @param level - Mastery level (e.g., '64', '124')
   * @returns Checkbox state (false if not set)
   */
  getMasteryCheckbox(tier, type, level) {
    return this.data.mastery[tier][type][level] ?? false;
  }
  /**
   * Get target selection
   * @returns Target selection object
   */
  getTarget() {
    return { ...this.data.target };
  }
  /**
   * Get character metadata
   * @returns Character metadata object
   */
  getCharacter() {
    return { ...this.data.character };
  }
  /**
   * Get selected class
   * @returns Selected class name or null
   */
  getSelectedClass() {
    return this.data.character.class;
  }
  /**
   * Get selected job tier
   * @returns Job tier ('3rd' or '4th')
   */
  getSelectedJobTier() {
    return this.data.character.jobTier;
  }
  /**
   * Get character level
   * @returns Character level
   */
  getCharacterLevel() {
    return this.data.character.level;
  }
  /**
   * Get weapon attack bonus
   * @returns Weapon attack bonus object with totalAttack and equippedAttack
   */
  getWeaponAttackBonus() {
    return { ...this.data.weaponAttackBonus };
  }
  /**
   * Get entire loadout data (for export/debugging)
   * @returns Deep clone of loadout data
   */
  getAllData() {
    return JSON.parse(JSON.stringify(this.data));
  }
  // ========================================================================
  // SETTERS - Partial updates with immediate save
  // ========================================================================
  /**
   * Update multiple base stats at once
   * @param updates - Object mapping stat keys (camelCase or legacy format) to values
   */
  updateBaseStats(updates) {
    const migratedUpdates = {};
    Object.entries(updates).forEach(([key, value]) => {
      const migratedKey = _LoadoutStore.STAT_KEY_MIGRATION[key] ?? key;
      migratedUpdates[migratedKey] = value;
    });
    Object.assign(this.data.baseStats, migratedUpdates);
    this.saveDualWrite();
  }
  /**
   * Update single base stat
   * @param key - Stat key in camelCase (e.g., "attack", "critRate")
   * @param value - New value
   */
  updateBaseStat(key, value) {
    const migratedKey = _LoadoutStore.STAT_KEY_MIGRATION[key] ?? key;
    this.data.baseStats[migratedKey] = value;
    this.saveDualWrite();
  }
  /**
   * Update weapon data
   * @param key - Weapon key (e.g., "legendary-t4")
   * @param data - Partial weapon data to update
   */
  updateWeapon(key, data) {
    if (!this.data.weapons[key]) {
      this.data.weapons[key] = { level: 0, stars: 0, equipped: false };
    }
    this.data.weapons[key] = { ...this.data.weapons[key], ...data };
    this.saveDualWrite();
  }
  /**
   * Update mastery checkbox state
   * @param tier - Mastery tier ('3rd' or '4th')
   * @param type - Mastery type ('all' or 'boss')
   * @param level - Mastery level (e.g., '64', '124')
   * @param checked - Checkbox state
   */
  updateMasteryCheckbox(tier, type, level, checked) {
    this.data.mastery[tier][type][level] = checked;
    this.saveDualWrite();
  }
  /**
   * Update target selection
   * @param data - Partial target data
   */
  updateTarget(data) {
    Object.assign(this.data.target, data);
    this.saveDualWrite();
  }
  /**
   * Update character metadata
   * @param data - Partial character data
   */
  updateCharacter(data) {
    Object.assign(this.data.character, data);
    this.saveDualWrite();
  }
  /**
   * Set selected class
   * @param className - Class name or null
   */
  setSelectedClass(className) {
    this.data.character.class = className;
    this.saveDualWrite();
  }
  /**
   * Set selected job tier
   * @param jobTier - Job tier ('3rd' or '4th')
   */
  setSelectedJobTier(jobTier) {
    this.data.character.jobTier = jobTier;
    this.saveDualWrite();
  }
  /**
   * Set character level
   * @param level - Character level
   */
  setCharacterLevel(level) {
    this.data.character.level = level;
    this.saveDualWrite();
  }
  /**
   * Update weapon attack bonus
   * @param data - Partial weapon attack bonus data
   */
  updateWeaponAttackBonus(data) {
    Object.assign(this.data.weaponAttackBonus, data);
    this.saveDualWrite();
  }
  // ========================================================================
  // PERSISTENCE - Dual-write (new + legacy)
  // ========================================================================
  /**
   * Save to localStorage (dual-write: new + legacy format)
   */
  saveDualWrite() {
    localStorage.setItem("loadout-data", JSON.stringify(this.data));
    const legacyFormat = this.convertToLegacyFormat();
    localStorage.setItem("damageCalculatorData", JSON.stringify(legacyFormat));
    if (this.data.character.class) {
      localStorage.setItem("selectedClass", this.data.character.class);
    }
    localStorage.setItem("selectedJobTier", this.data.character.jobTier);
  }
  /**
   * Convert new LoadoutData to legacy damageCalculatorData format
   * Used for dual-write backward compatibility
   */
  convertToLegacyFormat() {
    const legacy = {
      baseSetup: { ...this.data.baseStats },
      weapons: {},
      masteryBonuses: {
        [JOB_TIER.THIRD]: {
          [MASTERY_TYPE.ALL]: { ...this.data.mastery[JOB_TIER.THIRD][MASTERY_TYPE.ALL] },
          [MASTERY_TYPE.BOSS]: { ...this.data.mastery[JOB_TIER.THIRD][MASTERY_TYPE.BOSS] }
        },
        [JOB_TIER.FOURTH]: {
          [MASTERY_TYPE.ALL]: { ...this.data.mastery[JOB_TIER.FOURTH][MASTERY_TYPE.ALL] },
          [MASTERY_TYPE.BOSS]: { ...this.data.mastery[JOB_TIER.FOURTH][MASTERY_TYPE.BOSS] }
        }
      },
      contentType: this.data.target.contentType === CONTENT_TYPE.NONE ? void 0 : this.data.target.contentType,
      subcategory: this.data.target.subcategory ?? void 0,
      selectedStage: this.data.target.selectedStage ?? void 0
    };
    Object.entries(this.data.weapons).forEach(([key, weapon]) => {
      legacy.weapons[key] = {
        level: weapon.level,
        stars: weapon.stars,
        equipped: weapon.equipped
      };
    });
    return legacy;
  }
  // ========================================================================
  // TESTING/DEBUGGING HELPERS
  // ========================================================================
  /**
   * Reset store to defaults (for testing)
   */
  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_LOADOUT_DATA));
    this.saveDualWrite();
  }
  /**
   * Check if store is initialized
   */
  isReady() {
    return this.isInitialized;
  }
};
// ========================================================================
// PRIVATE MIGRATION MAP
// ========================================================================
/**
 * Migration map: legacy hyphenated keys → new camelCase keys
 * Used internally during data loading/migration
 */
_LoadoutStore.STAT_KEY_MIGRATION = {
  // Hyphenated → camelCase
  "crit-rate": "critRate",
  "crit-damage": "critDamage",
  "stat-damage": "statDamage",
  "damage-amp": "damageAmp",
  "attack-speed": "attackSpeed",
  "def-pen": "defPen",
  "boss-damage": "bossDamage",
  "normal-damage": "normalDamage",
  "skill-coeff": "skillCoeff",
  "skill-mastery": "skillMastery",
  "skill-mastery-boss": "skillMasteryBoss",
  "min-damage": "minDamage",
  "max-damage": "maxDamage",
  "primary-main-stat": "primaryMainStat",
  "secondary-main-stat": "secondaryMainStat",
  "final-damage": "finalDamage",
  "target-stage": "targetStage",
  "main-stat-pct": "mainStatPct",
  "skill-level-1st": "skillLevel1st",
  "skill-level-2nd": "skillLevel2nd",
  "skill-level-3rd": "skillLevel3rd",
  "skill-level-4th": "skillLevel4th",
  "character-level": "characterLevel",
  "basic-attack-damage": "basicAttackDamage",
  "skill-damage": "skillDamage"
};
let LoadoutStore = _LoadoutStore;
const loadoutStore = new LoadoutStore();
export {
  LoadoutStore,
  loadoutStore
};
//# sourceMappingURL=loadout.store.js.map
