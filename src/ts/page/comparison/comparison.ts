/**
 * Comparison Equipment - Pure Logic Module
 *
 * This module contains all business logic for comparison equipment,
 * separate from UI rendering and event handling.
 *
 * Responsibilities:
 * - Validation of comparison items
 * - Damage calculations
 * - Data transformations
 * - Import/export utilities
 */

import type { ComparisonItem, ComparisonStatLine, EquipmentSlotId } from '@ts/types/page/gear-lab/gear-lab.types';
import { gearLabStore } from '@ts/store/gear-lab-store';
import { StatCalculationService } from '@ts/services/stat-calculation-service';
import { BaseStats, STAT } from '@ts/types';
import { loadoutStore } from '@ts/store/loadout.store';
import { calculatePassiveGainsForItem } from '@ts/services/item-comparison.service';
import type { StatId } from '@ts/types/constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of a damage calculation for a comparison item
 */
export interface ComparisonCalculationResult {
    guid: string;
    name: string;
    bossDPS: number;
    normalDPS: number;
    bossExpectedDamage: number;
    normalExpectedDamage: number;
    stats: BaseStats;
    passiveGains?: {
        statChanges: Record<string, number>;
        breakdown: Array<{
            passive: string;
            stat: string;
            statDisplay?: string;
            baseValue: number;
            bonusValue: number;
            gain: number;
            isPercent: boolean;
            note?: string;
        }>;
        complexPassives: Array<{
            passive: string;
            stat?: string;
            baseValue?: number;
            bonusValue?: number;
            gain?: number;
            isPercent?: boolean;
            note?: string;
        }>;
        complexStatChanges: Record<string, number>;
    };
}

/**
 * Equipment slot configuration
 */
export interface EquipmentSlotConfig {
    id: EquipmentSlotId;
    name: string;
    hasMainStat: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Equipment slot configurations
 */
export const EQUIPMENT_SLOTS: Record<EquipmentSlotId, EquipmentSlotConfig> = {
    head: { id: 'head', name: 'Head', hasMainStat: false },
    cape: { id: 'cape', name: 'Cape', hasMainStat: false },
    chest: { id: 'chest', name: 'Chest', hasMainStat: false },
    shoulders: { id: 'shoulders', name: 'Shoulders', hasMainStat: false },
    legs: { id: 'legs', name: 'Legs', hasMainStat: false },
    belt: { id: 'belt', name: 'Belt', hasMainStat: false },
    gloves: { id: 'gloves', name: 'Gloves', hasMainStat: false },
    boots: { id: 'boots', name: 'Boots', hasMainStat: false },
    ring: { id: 'ring', name: 'Ring', hasMainStat: true },
    neck: { id: 'neck', name: 'Neck', hasMainStat: true },
    'eye-accessory': { id: 'eye-accessory', name: 'Eye Accessory', hasMainStat: true }
};

/**
 * Maximum number of stat lines allowed per item
 */
export const MAX_STAT_LINES = 10;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a comparison item
 * @param item - Item to validate
 * @returns True if valid, false otherwise
 */
export function validateComparisonItem(item: ComparisonItem): boolean {
    if (!item.guid || typeof item.guid !== 'string') return false;
    if (!item.name || typeof item.name !== 'string') return false;
    if (typeof item.attack !== 'number' || item.attack < 0) return false;
    if (typeof item.mainStat !== 'number' || item.mainStat < 0) return false;
    if (!Array.isArray(item.statLines)) return false;

    // Validate stat lines
    for (const statLine of item.statLines) {
        if (typeof statLine.type !== 'string') return false;
        if (typeof statLine.value !== 'number') return false;
    }

    return true;
}

/**
 * Validate a stat line
 * @param statLine - Stat line to validate
 * @returns True if valid, false otherwise
 */
export function validateStatLine(statLine: ComparisonStatLine): boolean {
    return typeof statLine.type === 'string' && typeof statLine.value === 'number';
}

// ============================================================================
// DATA RETRIEVAL
// ============================================================================

/**
 * Get comparison items for a slot
 * @param slotId - Equipment slot ID
 * @returns Array of comparison items
 */
export function getComparisonItems(slotId: EquipmentSlotId): ComparisonItem[] {
    return gearLabStore.getComparisonItems(slotId);
}

/**
 * Get a specific comparison item
 * @param slotId - Equipment slot ID
 * @param guid - Item GUID
 * @returns Item data or null if not found
 */
export function getComparisonItem(slotId: EquipmentSlotId, guid: string): ComparisonItem | null {
    return gearLabStore.getComparisonItem(slotId, guid);
}

/**
 * Get equipped item data for a slot from the loadout store
 * @param slotId - Equipment slot ID
 * @returns Equipment data with attack, mainStat, and statLines, or null if slot is empty
 */
export function getEquippedItemData(slotId: EquipmentSlotId): {
    attack: number;
    mainStat: number;
    statLines: Array<{ type: string; value: number }>;
} | null {
    const equipmentData = loadoutStore.getEquipmentData();
    const slotData = equipmentData[slotId];
    if (!slotData) return null;

    // Convert StatLine[] to generic format expected by calculation service
    const statLines = (slotData.statLines || []).map(sl => ({
        type: sl.type,
        value: sl.value
    }));

    return {
        attack: slotData.attack,
        mainStat: slotData.mainStat || 0,
        statLines
    };
}

// ============================================================================
// ITEM OPERATIONS
// ============================================================================

/**
 * Add a new comparison item
 * @param slotId - Equipment slot ID
 * @param item - Item data (without guid)
 * @returns The created item with generated guid
 */
export function addComparisonItem(
    slotId: EquipmentSlotId,
    item: Omit<ComparisonItem, 'guid'>
): ComparisonItem {
    return gearLabStore.addComparisonItem(slotId, item);
}

/**
 * Update a comparison item
 * @param slotId - Equipment slot ID
 * @param guid - Item GUID
 * @param data - Partial item data to update
 * @returns True if successful, false otherwise
 */
export function updateComparisonItem(
    slotId: EquipmentSlotId,
    guid: string,
    data: Partial<ComparisonItem>
): boolean {
    return gearLabStore.updateComparisonItem(slotId, guid, data);
}

/**
 * Remove a comparison item
 * @param slotId - Equipment slot ID
 * @param guid - Item GUID
 * @returns True if successful, false otherwise
 */
export function removeComparisonItem(slotId: EquipmentSlotId, guid: string): boolean {
    return gearLabStore.removeComparisonItem(slotId, guid);
}

/**
 * Clear all comparison items for a slot
 * @param slotId - Equipment slot ID
 */
export function clearComparisonItems(slotId: EquipmentSlotId): void {
    gearLabStore.clearComparisonItems(slotId);
}

// ============================================================================
// STAT LINE OPERATIONS
// ============================================================================

/**
 * Add a stat line to a comparison item
 * @param slotId - Equipment slot ID
 * @param guid - Item GUID
 * @param statLine - Stat line data
 * @returns True if successful, false otherwise
 */
export function addStatLine(
    slotId: EquipmentSlotId,
    guid: string,
    statLine: ComparisonStatLine
): boolean {
    const item = getComparisonItem(slotId, guid);
    if (!item) return false;

    // Check max stat lines
    if (item.statLines.length >= MAX_STAT_LINES) {
        console.warn(`Maximum ${MAX_STAT_LINES} stat lines allowed per item`);
        return false;
    }

    return gearLabStore.addComparisonItemStatLine(slotId, guid, statLine);
}

/**
 * Remove a stat line from a comparison item
 * @param slotId - Equipment slot ID
 * @param guid - Item GUID
 * @param statLineIndex - Index of stat line to remove
 * @returns True if successful, false otherwise
 */
export function removeStatLine(
    slotId: EquipmentSlotId,
    guid: string,
    statLineIndex: number
): boolean {
    return gearLabStore.removeComparisonItemStatLine(slotId, guid, statLineIndex);
}

// ============================================================================
// DAMAGE CALCULATIONS
// ============================================================================

/**
 * Calculate damage for a comparison item
 * @param slotId - Equipment slot ID
 * @param item - Comparison item data
 * @returns Calculation result
 */
export function calculateItemDamage(
    slotId: EquipmentSlotId,
    item: ComparisonItem
): ComparisonCalculationResult {
    // Get base stats and context
    const baseStats = loadoutStore.getBaseStats();
    const currentClass = loadoutStore.getSelectedClass();
    const characterLevel = loadoutStore.getCharacterLevel();

    // Calculate using StatCalculationService
    const service = new StatCalculationService(baseStats);

    // Remove equipped item stats from this slot to ensure clean comparison
    const equippedData = getEquippedItemData(slotId);
    if (equippedData) {
        // Subtract equipped item's attack and main stat
        service.subtract(STAT.ATTACK.id, equippedData.attack);
        service.subtract(STAT.PRIMARY_MAIN_STAT.id, equippedData.mainStat);

        // Subtract equipped item's stat lines
        equippedData.statLines.forEach(statLine => {
            service.subtract(statLine.type, statLine.value);
        });
    }

    // Add comparison item attack and main stat
    service.add(STAT.ATTACK.id, item.attack);
    service.add(STAT.PRIMARY_MAIN_STAT.id, item.mainStat);

    // Add comparison item stat lines
    item.statLines.forEach(statLine => {
        service.add(statLine.type, statLine.value);
    });

    // Calculate passive gains from job skill levels
    let passiveGains: ComparisonCalculationResult['passiveGains'] = undefined;

    if (currentClass) {
        const passiveResult = calculatePassiveGainsForItem(item, {
            currentClass,
            characterLevel,
            baseStats
        });

        // Apply non-complex passive stat gains
        Object.entries(passiveResult.statChanges).forEach(([stat, value]) => {
            if (value !== 0) {
                service.add(stat, value);
            }
        });

        // Store passive gains for UI display (including complex passives)
        if (passiveResult.breakdown.length > 0 || passiveResult.complexPassives.length > 0) {
            passiveGains = {
                statChanges: passiveResult.statChanges,
                breakdown: passiveResult.breakdown,
                complexPassives: passiveResult.complexPassives,
                complexStatChanges: passiveResult.complexStatChanges
            };
        }
    }

    const bossResult = service.compute('boss');
    const normalResult = service.compute('normal');

    return {
        guid: item.guid,
        name: item.name,
        bossDPS: bossResult.dps,
        normalDPS: normalResult.dps,
        bossExpectedDamage: bossResult.expectedDamage,
        normalExpectedDamage: normalResult.expectedDamage,
        stats: service.getStats(),
        passiveGains
    };
}

/**
 * Calculate damage for all comparison items in a slot
 * @param slotId - Equipment slot ID
 * @returns Array of calculation results
 */
export function calculateAllItemsDamage(slotId: EquipmentSlotId): ComparisonCalculationResult[] {
    const items = getComparisonItems(slotId);
    return items.map(item => calculateItemDamage(slotId, item));
}

/**
 * Calculate equipped item damage
 *
 * IMPORTANT: Base stats include the equipped item's direct stat contributions
 * (attack, main stat, stat lines) but do NOT automatically include passive gains
 * from skill level bonuses. We need to calculate and apply those passive gains
 * explicitly, just like we do for comparison items.
 *
 * @param slotId - Equipment slot ID
 * @returns Calculation result or null if no equipped data
 */
export function calculateEquippedDamage(slotId: EquipmentSlotId): ComparisonCalculationResult | null {
    const equippedData = getEquippedItemData(slotId);
    if (!equippedData) return null;

    const baseStats = loadoutStore.getBaseStats();
    const currentClass = loadoutStore.getSelectedClass();
    const characterLevel = loadoutStore.getCharacterLevel();

    // Base stats include the equipped item's direct stat contribution
    const service = new StatCalculationService(baseStats);

    // Calculate passive gains from equipped item's job skill levels (if any)
    let passiveGains: ComparisonCalculationResult['passiveGains'] = undefined;

    if (currentClass) {
        // Convert equipped data to ComparisonItem format for passive calculation
        const equippedAsComparisonItem: ComparisonItem = {
            guid: 'equipped',
            name: 'Equipped Item',
            attack: equippedData.attack,
            mainStat: equippedData.mainStat,
            statLines: equippedData.statLines.map(sl => ({
                type: sl.type as StatId,
                value: sl.value
            }))
        };

        const passiveResult = calculatePassiveGainsForItem(equippedAsComparisonItem, {
            currentClass,
            characterLevel,
            baseStats
        });

        // Apply non-complex passive stat gains
        Object.entries(passiveResult.statChanges).forEach(([stat, value]) => {
            if (value !== 0) {
                service.add(stat, value);
            }
        });

        // Store passive gains for UI display (including complex passives)
        if (passiveResult.breakdown.length > 0 || passiveResult.complexPassives.length > 0) {
            passiveGains = {
                statChanges: passiveResult.statChanges,
                breakdown: passiveResult.breakdown,
                complexPassives: passiveResult.complexPassives,
                complexStatChanges: passiveResult.complexStatChanges
            };
        }
    }

    const bossResult = service.compute('boss');
    const normalResult = service.compute('normal');

    return {
        guid: 'equipped',
        name: 'Equipped Item',
        bossDPS: bossResult.dps,
        normalDPS: normalResult.dps,
        bossExpectedDamage: bossResult.expectedDamage,
        normalExpectedDamage: normalResult.expectedDamage,
        stats: service.getStats(),
        passiveGains
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get slot configuration by ID
 * @param slotId - Equipment slot ID
 * @returns Slot configuration or null if not found
 */
export function getSlotConfig(slotId: EquipmentSlotId): EquipmentSlotConfig | null {
    return EQUIPMENT_SLOTS[slotId] || null;
}

/**
 * Get all slot configurations
 * @returns Array of all slot configurations
 */
export function getAllSlotConfigs(): EquipmentSlotConfig[] {
    return Object.values(EQUIPMENT_SLOTS);
}

/**
 * Generate a default item name for a new comparison item
 * @param slotId - Equipment slot ID
 * @param itemCount - Current number of items in the slot
 * @returns Default item name
 */
export function generateDefaultItemName(slotId: EquipmentSlotId, itemCount: number): string {
    return `Item ${itemCount + 1}`;
}
