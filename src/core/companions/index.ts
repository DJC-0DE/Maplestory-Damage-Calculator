import { COMPANION_DATA, type CompanionLevelData } from './companion-data.js';
import type { CompanionKey, CompanionClass } from '@ts/types/page/companions/companions.types';

/**
 * Get companion effects for a given class, rarity, and level
 * @param className - The companion class (e.g., 'Hero', 'BowMaster', 'NightLord')
 * @param rarity - The rarity ('Normal', 'Rare', 'Epic', 'Unique', 'Legendary')
 * @param level - The companion level (1-300)
 * @returns Object containing inventoryEffect and equipEffect, or null if not found
 */
export function getCompanionEffects(
    className: string,
    rarity: string,
    level: number
): CompanionEffects | null {
    // Validate inputs
    if (!COMPANION_DATA.classes.includes(className as ClassName)) {
        console.warn(`Invalid class: ${className}. Available classes:`, COMPANION_DATA.classes);
        return null;
    }

    if (!COMPANION_DATA.rarities.includes(rarity)) {
        console.warn(`Invalid rarity: ${rarity}. Available rarities:`, COMPANION_DATA.rarities);
        return null;
    }

    if (level < 1 || level > COMPANION_DATA.maxLevel) {
        console.warn(`Invalid level: ${level}. Must be between 1 and ${COMPANION_DATA.maxLevel}`);
        return null;
    }

    // Get the companion data
    const classData = COMPANION_DATA.data[className as ClassName];
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
        supporterIndex: rarityData.supporterIndex
    };
}

/**
 * Get all available companion classes
 * @returns Array of class names
 */
export function getCompanionClasses(): CompanionClass[] {
    return [...COMPANION_DATA.classes] as CompanionClass[];
}

/**
 * Get all available rarities
 * @returns Array of rarity names
 */
export function getCompanionRarities(): string[] {
    return [...COMPANION_DATA.rarities];
}

/**
 * Get maximum companion level
 * @returns Maximum level
 */
export function getMaxCompanionLevel(): number {
    return COMPANION_DATA.maxLevel;
}

/**
 * Get all data for a specific companion class
 * @param className - The companion class
 * @returns All rarity data for the class, or null if not found
 */
export function getCompanionClassData(className: string): CompanionClassData | null {
    if (!COMPANION_DATA.classes.includes(className as ClassName)) {
        console.warn(`Invalid class: ${className}`);
        return null;
    }
    return COMPANION_DATA.data[className as ClassName];
}

/**
 * Calculate total stats from multiple companions
 * @param companions - Array of {className, rarity, level, equipped} objects
 * @returns Object with totalInventoryEffects and totalEquipEffects
 */
export function calculateTotalCompanionEffects(
    companions: Array<{ className: string; rarity: string; level: number; equipped: boolean }>
): { inventoryEffects: Record<string, number>; equipEffects: Record<string, number> } {
    const totalInventoryEffects: Record<string, number> = {};
    const totalEquipEffects: Record<string, number> = {};

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
        equipEffects: totalEquipEffects
    };
}

// Export the raw data as well
export { COMPANION_DATA };

// Export types from companion-data
export type { CompanionLevelData, CompanionRarityData, CompanionClassData, CompanionDataRoot } from './companion-data.js';

// Expose getCompanionEffects globally after module loads
(window as any).getCompanionEffects = getCompanionEffects;
