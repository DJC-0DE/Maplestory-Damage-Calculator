/**
 * Pure logic layer for Class Selection
 * Helper functions to determine class stat types without DOM dependencies
 */

import type { JobTier, ClassName, StatType } from '@ts/types';
import { CLASS, STAT_TYPE } from '@ts/types';

export type { JobTier, ClassName, StatType };

// ============================================================================
// CLASS STAT TYPE VALIDATION
// ============================================================================

export function isStrMainStatClass(className: string): boolean {
    return className === CLASS.HERO || className === CLASS.DARK_KNIGHT;
}

export function isDexMainStatClass(className: string): boolean {
    return className === CLASS.BOWMASTER || className === CLASS.MARKSMAN;
}

export function isIntMainStatClass(className: string): boolean {
    return className === CLASS.ARCH_MAGE_IL || className === CLASS.ARCH_MAGE_FP;
}

export function isLukMainStatClass(className: string): boolean {
    return className === CLASS.NIGHT_LORD || className === CLASS.SHADOWER;
}

// ============================================================================
// STAT TYPE DETERMINATION
// ============================================================================

/**
 * Determine if a stat is primary or secondary for the given class
 */
export function getStatType(className: string, statId: string): StatType {
    if (isStrMainStatClass(className)) {
        if (statId === 'str') return STAT_TYPE.PRIMARY;
        if (statId === 'dex') return STAT_TYPE.SECONDARY;
    } else if (isDexMainStatClass(className)) {
        if (statId === 'dex') return STAT_TYPE.PRIMARY;
        if (statId === 'str') return STAT_TYPE.SECONDARY;
    } else if (isIntMainStatClass(className)) {
        if (statId === 'int') return STAT_TYPE.PRIMARY;
        if (statId === 'luk') return STAT_TYPE.SECONDARY;
    } else if (isLukMainStatClass(className)) {
        if (statId === 'luk') return STAT_TYPE.PRIMARY;
        if (statId === 'dex') return STAT_TYPE.SECONDARY;
    }
    return null;
}

/**
 * Get primary and secondary stat element IDs for a class
 */
export function getMainStatIds(className: ClassName): { primary: string; secondary: string } | null {
    if (isStrMainStatClass(className)) {
        return { primary: 'str', secondary: 'dex' };
    } else if (isDexMainStatClass(className)) {
        return { primary: 'dex', secondary: 'str' };
    } else if (isIntMainStatClass(className)) {
        return { primary: 'int', secondary: 'luk' };
    } else if (isLukMainStatClass(className)) {
        return { primary: 'luk', secondary: 'dex' };
    }
    return null;
}
