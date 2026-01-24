import { DEFAULT_GEAR_LAB_DATA, EMPTY_POTENTIAL_LINE } from "@ts/types/page/gear-lab/gear-lab.types.js";
class GearLabStore {
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  constructor() {
    this.isInitialized = false;
    this.data = JSON.parse(JSON.stringify(DEFAULT_GEAR_LAB_DATA));
  }
  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  /**
   * Initialize store - loads from localStorage, handles migration
   * Call this at the top of the application initialization
   *
   * @returns Promise that resolves when initialization is complete
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn("GearLabStore already initialized");
      return;
    }
    const newData = localStorage.getItem("gear-lab-data");
    if (newData) {
      try {
        this.data = JSON.parse(newData);
        console.log("GearLabStore: Loaded from new format (gear-lab-data)");
      } catch (e) {
        console.error("GearLabStore: Failed to parse gear-lab-data, falling back to migration", e);
        this.migrateFromLegacy();
      }
    } else {
      this.migrateFromLegacy();
    }
    this.validateAndFillDefaults();
    this.isInitialized = true;
    console.log("GearLabStore: Initialization complete", this.data);
  }
  /**
   * Migrate data from legacy localStorage keys to new format
   */
  migrateFromLegacy() {
    console.log("GearLabStore: Migrating from legacy format...");
    const legacyInnerAbilityStr = localStorage.getItem("heroPowerPresets");
    if (legacyInnerAbilityStr) {
      try {
        const legacy = JSON.parse(legacyInnerAbilityStr);
        Object.entries(legacy).forEach(([key, preset]) => {
          const presetId = parseInt(key);
          if (presetId >= 1 && presetId <= 10) {
            this.data.innerAbility.presets[presetId] = {
              id: presetId,
              isEquipped: preset.isEquipped || false,
              lines: preset.lines || []
            };
          }
        });
        console.log("GearLabStore: Inner Ability migration complete");
        localStorage.removeItem("heroPowerPresets");
        console.log("GearLabStore: Deleted heroPowerPresets key");
      } catch (error) {
        console.error("GearLabStore: Failed to migrate heroPowerPresets:", error);
      }
    } else {
      console.log("GearLabStore: No legacy heroPowerPresets found");
    }
    this.migrateCubePotentialFromLegacy();
    console.log("GearLabStore: Migration complete, saving to new format...");
    this.saveDualWrite();
  }
  /**
   * Migrate cube potential data from legacy format
   */
  migrateCubePotentialFromLegacy() {
    const legacyDataStr = localStorage.getItem("cubePotentialData");
    if (!legacyDataStr) {
      console.log("GearLabStore: No legacy cubePotentialData found in localStorage");
      return;
    }
    try {
      const legacyCubeData = JSON.parse(legacyDataStr);
      Object.entries(legacyCubeData).forEach(([slotId, slotData]) => {
        if (this.isValidCubeSlotId(slotId)) {
          this.data.cubePotential[slotId] = {
            regular: {
              rarity: slotData.regular.rarity || "normal",
              rollCount: slotData.regular.rollCount || 0,
              setA: this.validatePotentialSet(slotData.regular.setA),
              setB: this.validatePotentialSet(slotData.regular.setB)
            },
            bonus: {
              rarity: slotData.bonus.rarity || "normal",
              rollCount: slotData.bonus.rollCount || 0,
              setA: this.validatePotentialSet(slotData.bonus.setA),
              setB: this.validatePotentialSet(slotData.bonus.setB)
            }
          };
        }
      });
      console.log("GearLabStore: Cube potential migration complete");
      localStorage.removeItem("cubePotentialData");
      console.log("GearLabStore: Deleted cubePotentialData key");
    } catch (error) {
      console.error("GearLabStore: Failed to migrate cube potential:", error);
    }
  }
  /**
   * Validate if a string is a valid CubeSlotId
   */
  isValidCubeSlotId(slotId) {
    const validSlots = ["helm", "cape", "chest", "shoulder", "legs", "belt", "gloves", "boots", "ring", "necklace", "eye-accessory"];
    return validSlots.includes(slotId);
  }
  /**
   * Validate and sanitize a potential set
   */
  validatePotentialSet(set) {
    return {
      line1: this.validatePotentialLine(set?.line1),
      line2: this.validatePotentialLine(set?.line2),
      line3: this.validatePotentialLine(set?.line3)
    };
  }
  /**
   * Validate and sanitize a potential line
   */
  validatePotentialLine(line) {
    if (!line || typeof line.stat !== "string") {
      return { ...EMPTY_POTENTIAL_LINE };
    }
    return {
      stat: line.stat || "",
      value: typeof line.value === "number" ? line.value : 0,
      prime: Boolean(line.prime)
    };
  }
  /**
   * Validate data structure and fill missing fields with defaults
   */
  validateAndFillDefaults() {
    const defaults = DEFAULT_GEAR_LAB_DATA;
    if (!this.data.innerAbility?.presets) {
      this.data.innerAbility = {
        presets: { ...defaults.innerAbility.presets }
      };
    }
    for (let i = 1; i <= 10; i++) {
      if (!this.data.innerAbility.presets[i]) {
        this.data.innerAbility.presets[i] = {
          id: i,
          isEquipped: false,
          lines: []
        };
      } else {
        const preset = this.data.innerAbility.presets[i];
        if (typeof preset.id !== "number") preset.id = i;
        if (typeof preset.isEquipped !== "boolean") preset.isEquipped = false;
        if (!Array.isArray(preset.lines)) preset.lines = [];
      }
    }
    const equippedPresets = Object.values(this.data.innerAbility.presets).filter((p) => p.isEquipped);
    if (equippedPresets.length > 1) {
      equippedPresets.slice(1).forEach((p) => p.isEquipped = false);
      console.warn("GearLabStore: Multiple presets equipped, keeping only first");
    }
    if (!this.data.cubePotential) {
      this.data.cubePotential = { ...defaults.cubePotential };
    }
    const validSlots = ["helm", "cape", "chest", "shoulder", "legs", "belt", "gloves", "boots", "ring", "necklace", "eye-accessory"];
    validSlots.forEach((slotId) => {
      if (!this.data.cubePotential[slotId]) {
        this.data.cubePotential[slotId] = { ...defaults.cubePotential[slotId] };
      } else {
        const slot = this.data.cubePotential[slotId];
        ["regular", "bonus"].forEach((potentialType) => {
          if (!slot[potentialType]) {
            slot[potentialType] = { ...defaults.cubePotential[slotId][potentialType] };
          } else {
            const typeData = slot[potentialType];
            if (!this.isValidRarity(typeData.rarity)) {
              typeData.rarity = "normal";
            }
            if (typeof typeData.rollCount !== "number") {
              typeData.rollCount = 0;
            }
            typeData.setA = this.validatePotentialSet(typeData.setA);
            typeData.setB = this.validatePotentialSet(typeData.setB);
          }
        });
      }
    });
  }
  /**
   * Validate if a string is a valid Rarity
   */
  isValidRarity(rarity) {
    const validRarities = ["normal", "rare", "epic", "unique", "legendary", "mystic"];
    return validRarities.includes(rarity);
  }
  // ========================================================================
  // GETTERS - Return pre-hydrated data with safe defaults
  // ========================================================================
  /**
   * Get all inner ability presets
   * @returns All 10 presets as a record
   */
  getInnerAbilityPresets() {
    return JSON.parse(JSON.stringify(this.data.innerAbility.presets));
  }
  /**
   * Get a single preset
   * @param id - Preset ID (1-10)
   * @returns Preset data or null if not found
   */
  getPreset(id) {
    const preset = this.data.innerAbility.presets[id];
    return preset ? JSON.parse(JSON.stringify(preset)) : null;
  }
  /**
   * Get the currently equipped preset ID
   * @returns Equipped preset ID (1-10) or null if none equipped
   */
  getEquippedPresetId() {
    const equipped = Object.values(this.data.innerAbility.presets).find((p) => p.isEquipped);
    return equipped ? equipped.id : null;
  }
  /**
   * Get all data (for export/debugging)
   * @returns Deep clone of gear lab data
   */
  getAllData() {
    return JSON.parse(JSON.stringify(this.data));
  }
  // ========================================================================
  // SETTERS - Partial updates with immediate save
  // ========================================================================
  /**
   * Update a preset
   * @param id - Preset ID (1-10)
   * @param data - Partial preset data to update
   */
  updatePreset(id, data) {
    if (id < 1 || id > 10) {
      console.error(`GearLabStore: Invalid preset ID ${id}`);
      return;
    }
    if (!this.data.innerAbility.presets[id]) {
      this.data.innerAbility.presets[id] = {
        id,
        isEquipped: false,
        lines: []
      };
    }
    this.data.innerAbility.presets[id] = {
      ...this.data.innerAbility.presets[id],
      ...data,
      id
      // Ensure id cannot be changed
    };
    if (data.isEquipped === true) {
      for (let i = 1; i <= 10; i++) {
        if (i !== id) {
          this.data.innerAbility.presets[i].isEquipped = false;
        }
      }
    }
    this.saveDualWrite();
  }
  /**
   * Update a single line in a preset
   * @param presetId - Preset ID (1-10)
   * @param lineIndex - Line index (0-5)
   * @param line - Line data
   */
  updatePresetLine(presetId, lineIndex, line) {
    if (presetId < 1 || presetId > 10) {
      console.error(`GearLabStore: Invalid preset ID ${presetId}`);
      return;
    }
    if (lineIndex < 0 || lineIndex > 5) {
      console.error(`GearLabStore: Invalid line index ${lineIndex}`);
      return;
    }
    const preset = this.data.innerAbility.presets[presetId];
    if (!preset) {
      console.error(`GearLabStore: Preset ${presetId} not found`);
      return;
    }
    if (!preset.lines) {
      preset.lines = [];
    }
    while (preset.lines.length <= lineIndex) {
      preset.lines.push({ stat: "", value: 0 });
    }
    preset.lines[lineIndex] = line;
    this.saveDualWrite();
  }
  /**
   * Set which preset is equipped
   * @param id - Preset ID to equip (1-10), or null to unequip all
   */
  setEquippedPreset(id) {
    if (id !== null && (id < 1 || id > 10)) {
      console.error(`GearLabStore: Invalid preset ID ${id}`);
      return;
    }
    for (let i = 1; i <= 10; i++) {
      this.data.innerAbility.presets[i].isEquipped = false;
    }
    if (id !== null) {
      this.data.innerAbility.presets[id].isEquipped = true;
    }
    this.saveDualWrite();
  }
  // ========================================================================
  // CUBE POTENTIAL GETTERS
  // ========================================================================
  /**
   * Get all cube slot data
   * @returns Deep clone of all cube slot data
   */
  getCubeSlotData() {
    return JSON.parse(JSON.stringify(this.data.cubePotential));
  }
  /**
   * Get data for a specific cube slot
   * @param slotId - Equipment slot ID
   * @returns Cube slot data or null if not found
   */
  getCubeSlot(slotId) {
    const slot = this.data.cubePotential[slotId];
    return slot ? JSON.parse(JSON.stringify(slot)) : null;
  }
  // ========================================================================
  // CUBE POTENTIAL SETTERS
  // ========================================================================
  /**
   * Update rarity for a slot's potential type
   * @param slotId - Equipment slot ID
   * @param potentialType - 'regular' or 'bonus'
   * @param rarity - New rarity value
   */
  updateCubeRarity(slotId, potentialType, rarity) {
    if (!this.data.cubePotential[slotId]) {
      console.error(`GearLabStore: Invalid slot ID ${slotId}`);
      return;
    }
    this.data.cubePotential[slotId][potentialType].rarity = rarity;
    this.data.cubePotential[slotId][potentialType].rollCount = 0;
    this.saveDualWrite();
  }
  /**
   * Update roll count for a slot's potential type
   * @param slotId - Equipment slot ID
   * @param potentialType - 'regular' or 'bonus'
   * @param rollCount - New roll count value
   */
  updateCubeRollCount(slotId, potentialType, rollCount) {
    if (!this.data.cubePotential[slotId]) {
      console.error(`GearLabStore: Invalid slot ID ${slotId}`);
      return;
    }
    this.data.cubePotential[slotId][potentialType].rollCount = rollCount;
    this.saveDualWrite();
  }
  /**
   * Update a potential line for a slot's potential type and set
   * @param slotId - Equipment slot ID
   * @param potentialType - 'regular' or 'bonus'
   * @param setName - 'setA' or 'setB'
   * @param lineNumber - Line number (1, 2, or 3)
   * @param line - Line data
   */
  updateCubeLine(slotId, potentialType, setName, lineNumber, line) {
    if (!this.data.cubePotential[slotId]) {
      console.error(`GearLabStore: Invalid slot ID ${slotId}`);
      return;
    }
    const lineKey = `line${lineNumber}`;
    this.data.cubePotential[slotId][potentialType][setName][lineKey] = line;
    this.saveDualWrite();
  }
  /**
   * Update an entire potential set for a slot's potential type
   * @param slotId - Equipment slot ID
   * @param potentialType - 'regular' or 'bonus'
   * @param setName - 'setA' or 'setB'
   * @param set - Complete potential set
   */
  updateCubeSet(slotId, potentialType, setName, set) {
    if (!this.data.cubePotential[slotId]) {
      console.error(`GearLabStore: Invalid slot ID ${slotId}`);
      return;
    }
    this.data.cubePotential[slotId][potentialType][setName] = set;
    this.saveDualWrite();
  }
  // ========================================================================
  // PERSISTENCE
  // ========================================================================
  /**
   * Save to localStorage
   */
  saveDualWrite() {
    localStorage.setItem("gear-lab-data", JSON.stringify(this.data));
  }
  // ========================================================================
  // TESTING/DEBUGGING HELPERS
  // ========================================================================
  /**
   * Reset store to defaults (for testing)
   */
  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_GEAR_LAB_DATA));
    this.saveDualWrite();
  }
  /**
   * Check if store is initialized
   */
  isReady() {
    return this.isInitialized;
  }
}
const gearLabStore = new GearLabStore();
export {
  GearLabStore,
  gearLabStore
};
//# sourceMappingURL=gear-lab-store.js.map
