import { DEFAULT_GEAR_LAB_DATA } from "@ts/types/page/gear-lab/gear-lab.types.js";
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
   * Migrate data from legacy 'heroPowerPresets' localStorage key to new format
   */
  migrateFromLegacy() {
    console.log("GearLabStore: Migrating from legacy format...");
    const legacyDataStr = localStorage.getItem("heroPowerPresets");
    if (!legacyDataStr) {
      console.log("GearLabStore: No legacy heroPowerPresets found, using defaults");
      return;
    }
    try {
      const legacy = JSON.parse(legacyDataStr);
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
      console.log("GearLabStore: Migration complete, saving to new format...");
      this.saveDualWrite();
      console.log("GearLabStore: Cleaning up old localStorage key...");
      localStorage.removeItem("heroPowerPresets");
      console.log("GearLabStore: Deleted heroPowerPresets key");
    } catch (error) {
      console.error("GearLabStore: Failed to migrate heroPowerPresets:", error);
    }
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
