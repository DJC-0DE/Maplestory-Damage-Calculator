/**
 * Types for the Loadout Store
 * Centralized data structure for loadout configuration
 */

import { CONTENT_TYPE, JOB_TIER, MASTERY_TYPE, DEFAULT_BASE_STATS, type ContentType, type JobTier, type MasteryTypeValue, type StatKey as StatKeyFromConstants, type BaseStats as BaseStatsFromConstants } from './constants';

// Re-export for backward compatibility
export type StatKey = StatKeyFromConstants;
export type BaseStats = BaseStatsFromConstants;

/**
 * Job tier types for mastery bonuses
 */
export type MasteryTier = JobTier;

/**
 * Mastery bonus type (all monsters vs boss only)
 */
export type MasteryType = MasteryTypeValue;

/**
 * Loadout data structure - centralized state for all loadout-related data
 */
export interface LoadoutData {
    /** Base stat fields (typed with all stat keys from STAT constant) */
    baseStats: BaseStats;

    /** Character metadata */
    character: {
        level: number;
        class: string | null;
        jobTier: JobTier;
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
        [JOB_TIER.THIRD]?: { [MASTERY_TYPE.ALL]?: Record<string, boolean>; [MASTERY_TYPE.BOSS]?: Record<string, boolean> };
        [JOB_TIER.FOURTH]?: { [MASTERY_TYPE.ALL]?: Record<string, boolean>; [MASTERY_TYPE.BOSS]?: Record<string, boolean> };
    };
    contentType?: string;
    subcategory?: string;
    selectedStage?: string;
}

/**
 * Default empty loadout data
 */
export const DEFAULT_LOADOUT_DATA: LoadoutData = {
    baseStats: DEFAULT_BASE_STATS as BaseStats,
    character: {
        level: 0,
        class: null,
        jobTier: JOB_TIER.THIRD
    },
    weapons: {},
    mastery: {
        [JOB_TIER.THIRD]: { [MASTERY_TYPE.ALL]: {}, [MASTERY_TYPE.BOSS]: {} },
        [JOB_TIER.FOURTH]: { [MASTERY_TYPE.ALL]: {}, [MASTERY_TYPE.BOSS]: {} }
    },
    target: {
        contentType: CONTENT_TYPE.NONE,
        subcategory: null,
        selectedStage: null
    },
    weaponAttackBonus: {
        totalAttack: 0,
        equippedAttack: 0
    }
};
