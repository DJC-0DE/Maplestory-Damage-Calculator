import { STORAGE_KEY_TO_STAT_PROPERTY, STORAGE_KEY_MAPPING } from "@ts/types";
class StatStore {
  constructor() {
    this.stats = this.getInitialStats();
    this.listeners = /* @__PURE__ */ new Set();
  }
  getInitialStats() {
    return {
      attack: "0",
      critRate: "0",
      critDamage: "0",
      statDamage: "0",
      damage: "0",
      damageAmp: "0",
      attackSpeed: "0",
      defPen: "0",
      bossDamage: "0",
      normalDamage: "0",
      skillCoeff: "0",
      skillMastery: "0",
      skillMasteryBoss: "0",
      minDamage: "0",
      maxDamage: "0",
      primaryMainStat: "0",
      secondaryMainStat: "0",
      finalDamage: "0",
      targetStage: "",
      defense: "0",
      mainStatPct: "0",
      skillLevel1st: "0",
      skillLevel2nd: "0",
      skillLevel3rd: "0",
      skillLevel4th: "0",
      str: "0",
      dex: "0",
      int: "0",
      luk: "0",
      characterLevel: "0"
    };
  }
  /**
   * Load stats from localStorage and populate the store
   * Maps localStorage keys (with hyphens) to camelCase Stat properties
   */
  loadStatsFromLocalStorage() {
    const savedData = localStorage.getItem("damageCalculatorData");
    if (!savedData) {
      return false;
    }
    try {
      const data = JSON.parse(savedData);
      if (data.baseSetup) {
        Object.keys(data.baseSetup).forEach((storageKey) => {
          const statKey = STORAGE_KEY_TO_STAT_PROPERTY[storageKey];
          if (statKey && statKey in this.stats) {
            this.stats[statKey] = data.baseSetup[storageKey];
          }
        });
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error loading stats from localStorage:", e);
      return false;
    }
  }
  /**
   * Get the current stats object
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Get a specific stat value
   */
  getStat(key) {
    return this.stats[key];
  }
  /**
   * Update a specific stat value
   */
  setStat(key, value) {
    this.stats[key] = value;
    this.notify();
  }
  /**
   * Update multiple stats at once
   */
  setStats(updates) {
    Object.keys(updates).forEach((key) => {
      if (key in this.stats) {
        this.stats[key] = updates[key];
      }
    });
    this.notify();
  }
  /**
   * Sync stats from DOM elements (useful for manual refresh)
   * Maps DOM element IDs (with hyphens and -base suffix) to camelCase Stat properties
   */
  syncFromDOM() {
    Object.entries(STORAGE_KEY_MAPPING).forEach(([statKey, storageKey]) => {
      const elementId = statKey === "characterLevel" ? storageKey : `${storageKey}-base`;
      const element = document.getElementById(elementId);
      if (element) {
        this.stats[statKey] = element.innerText;
      }
    });
  }
  /**
   * Subscribe to stat changes
   * @returns Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /**
   * Notify all listeners of stat changes
   */
  notify() {
    this.listeners.forEach((listener) => listener(this.getStats()));
  }
  /**
   * Reset all stats to initial values
   */
  reset() {
    this.stats = this.getInitialStats();
    this.notify();
  }
}
const statStore = new StatStore();
export {
  StatStore,
  statStore
};
//# sourceMappingURL=stat.store.js.map
