/**
 * Types for the Loadout Store
 * Centralized data structure for loadout configuration
 */

import type { ContentType } from './constants';

/**
 * Job tier types for mastery bonuses
 */
export type MasteryTier = '3rd' | '4th';

/**
 * Mastery bonus type (all monsters vs boss only)
 */
export type MasteryType = 'all' | 'boss';

/**
 * Loadout data structure - centralized state for all loadout-related data
 */
export interface LoadoutData {
    /** Base stat fields (flat key-value for all stat inputs) */
    baseStats: Record<string, number>;

    /** Character metadata */
    character: {
        level: number;
        class: string | null;
        jobTier: '3rd' | '4th';
    };

    /** Weapon data indexed by rarity-tier key */
    weapons: Record<string, {
        level: number;
        stars: number;
        equipped: boolean;
    }>;

    /** Mastery bonus checkboxes */
    mastery: {
        [tier in MasteryTier]: {
            [type in MasteryType]: Record<string, boolean>;
        };
    };

    /** Target/stage selection */
    target: {
        contentType: ContentType;
        subcategory: string | null;
        selectedStage: string | null;
    };

    /** Weapon attack bonus (calculated from weapon levels) */
    weaponAttackBonus: {
        totalAttack: number;
        equippedAttack: number;
    };
}

/**
 * Legacy damageCalculatorData format (for migration/dual-write)
 */
export interface LegacyDamageCalculatorData {
    baseSetup?: Record<string, string | number>;
    weapons?: Record<string, { level: string | number; stars: string | number; equipped?: boolean }>;
    masteryBonuses?: {
        '3rd'?: { all?: Record<string, boolean>; boss?: Record<string, boolean> };
        '4th'?: { all?: Record<string, boolean>; boss?: Record<string, boolean> };
    };
    contentType?: string;
    subcategory?: string;
    selectedStage?: string;
}

/**
 * Default empty loadout data
 */
export const DEFAULT_LOADOUT_DATA: LoadoutData = {
    baseStats: {},
    character: {
        level: 0,
        class: null,
        jobTier: '3rd'
    },
    weapons: {},
    mastery: {
        '3rd': { all: {}, boss: {} },
        '4th': { all: {}, boss: {} }
    },
    target: {
        contentType: 'none',
        subcategory: null,
        selectedStage: null
    },
    weaponAttackBonus: {
        totalAttack: 0,
        equippedAttack: 0
    }
};
