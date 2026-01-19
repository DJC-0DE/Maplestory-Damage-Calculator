import { COMPANION_DATA } from "./companion-data.js";

// Expose getCompanionEffects globally for use in state.js
window.getCompanionEffects = null; // Will be set after function definition

/**
 * Get companion effects for a given class, rarity, and level
 * @param {string} className - The companion class (e.g., 'Hero', 'BowMaster', 'NightLord')
 * @param {string} rarity - The rarity ('Normal', 'Rare', 'Epic', 'Unique', 'Legendary')
 * @param {number} level - The companion level (1-300)
 * @returns {Object|null} Object containing inventoryEffect and equipEffect, or null if not found
 */
export function getCompanionEffects(className, rarity, level) {
  // Validate inputs
  if (!COMPANION_DATA.classes.includes(className)) {
    console.warn(
      `Invalid class: ${className}. Available classes:`,
      COMPANION_DATA.classes,
    );
    return null;
  }

  if (!COMPANION_DATA.rarities.includes(rarity)) {
    console.warn(
      `Invalid rarity: ${rarity}. Available rarities:`,
      COMPANION_DATA.rarities,
    );
    return null;
  }

  if (level < 1 || level > COMPANION_DATA.maxLevel) {
    console.warn(
      `Invalid level: ${level}. Must be between 1 and ${COMPANION_DATA.maxLevel}`,
    );
    return null;
  }

  // Get the companion data
  const classData = COMPANION_DATA.data[className];
  if (!classData || !classData[rarity]) {
    return null;
  }

  const rarityData = classData[rarity];
  const levelData = rarityData.levels[level];

  if (!levelData) {
    console.warn(`No data found for level ${level}`);
    return null;
  }

  return {
    inventoryEffect: levelData.inventoryEffect,
    equipEffect: levelData.equipEffect,
    supporterCode: rarityData.supporterCode,
    supporterIndex: rarityData.supporterIndex,
  };
}

/**
 * Get all available companion classes
 * @returns {string[]} Array of class names
 */
export function getCompanionClasses() {
  return [...COMPANION_DATA.classes];
}

/**
 * Get all available rarities
 * @returns {string[]} Array of rarity names
 */
export function getCompanionRarities() {
  return [...COMPANION_DATA.rarities];
}

/**
 * Get maximum companion level
 * @returns {number} Maximum level
 */
export function getMaxCompanionLevel() {
  return COMPANION_DATA.maxLevel;
}

/**
 * Get all data for a specific companion class
 * @param {string} className - The companion class
 * @returns {Object|null} All rarity data for the class, or null if not found
 */
export function getCompanionClassData(className) {
  if (!COMPANION_DATA.classes.includes(className)) {
    console.warn(`Invalid class: ${className}`);
    return null;
  }
  return COMPANION_DATA.data[className];
}

/**
 * Calculate total stats from multiple companions
 * @param {Array} companions - Array of {className, rarity, level, equipped} objects
 * @returns {Object} Object with totalInventoryEffects and totalEquipEffects
 */
export function calculateTotalCompanionEffects(companions) {
  const totalInventoryEffects = {};
  const totalEquipEffects = {};

  companions.forEach(({ className, rarity, level, equipped }) => {
    const effects = getCompanionEffects(className, rarity, level);
    if (!effects) return;

    // Add inventory effects (always active when owned)
    Object.entries(effects.inventoryEffect).forEach(([stat, value]) => {
      totalInventoryEffects[stat] = (totalInventoryEffects[stat] || 0) + value;
    });

    // Add equip effects (only when equipped)
    if (equipped) {
      Object.entries(effects.equipEffect).forEach(([stat, value]) => {
        totalEquipEffects[stat] = (totalEquipEffects[stat] || 0) + value;
      });
    }
  });

  return {
    inventoryEffects: totalInventoryEffects,
    equipEffects: totalEquipEffects,
  };
}

// Export the raw data as well
export { COMPANION_DATA };

// Expose getCompanionEffects globally after module loads
window.getCompanionEffects = getCompanionEffects;
