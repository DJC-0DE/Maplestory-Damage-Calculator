/**
 * Constants for the application
 * Type-safe constant values used throughout the codebase
 */

// Job Tier Constants
export const JOB_TIER = {
    THIRD: '3rd',
    FOURTH: '4th',
} as const;

export type JobTier = typeof JOB_TIER[keyof typeof JOB_TIER];

// Class Name Constants
export const CLASS = {
    HERO: 'hero',
    DARK_KNIGHT: 'dark-knight',
    BOWMASTER: 'bowmaster',
    MARKSMAN: 'marksman',
    NIGHT_LORD: 'night-lord',
    SHADOWER: 'shadower',
    ARCH_MAGE_IL: 'arch-mage-il',
    ARCH_MAGE_FP: 'arch-mage-fp',
} as const;

export type ClassName = typeof CLASS[keyof typeof CLASS];

// Content Type Constants
export const CONTENT_TYPE = {
    NONE: 'none',
    STAGE_HUNT: 'stageHunt',
    CHAPTER_BOSS: 'chapterBoss',
    WORLD_BOSS: 'worldBoss',
    GROWTH_DUNGEON: 'growthDungeon',
} as const;

export type ContentType = typeof CONTENT_TYPE[keyof typeof CONTENT_TYPE];

// Stat Type Constants
export const STAT_TYPE = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
} as const;

export type StatTypeValue = typeof STAT_TYPE[keyof typeof STAT_TYPE];
export type StatType = StatTypeValue | null;

// Weapon Rarity Constants
export const WEAPON_RARITY = {
    NORMAL: 'normal',
    RARE: 'rare',
    EPIC: 'epic',
    UNIQUE: 'unique',
    LEGENDARY: 'legendary',
    MYSTIC: 'mystic',
    ANCIENT: 'ancient',
} as const;

export type WeaponRarity = typeof WEAPON_RARITY[keyof typeof WEAPON_RARITY];

// Weapon Tier Constants
export const WEAPON_TIER = {
    T1: 't1',
    T2: 't2',
    T3: 't3',
    T4: 't4',
} as const;

export type WeaponTier = typeof WEAPON_TIER[keyof typeof WEAPON_TIER];
