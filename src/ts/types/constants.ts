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

// Monster Type Constants
export const MONSTER_TYPE = {
    BOSS: 'boss',
    NORMAL: 'normal',
} as const;

export type MonsterType = typeof MONSTER_TYPE[keyof typeof MONSTER_TYPE];

// Mastery Type Constants
export const MASTERY_TYPE = {
    ALL: 'all',
    BOSS: 'boss',
} as const;

export type MasteryTypeValue = typeof MASTERY_TYPE[keyof typeof MASTERY_TYPE];

// ============================================================================
// WEAPON CONSTANTS
// ============================================================================

/** Rarities that use 4-slot inventory divisor */
export const HIGH_TIER_RARITIES: readonly WeaponRarity[] = [
    WEAPON_RARITY.LEGENDARY,
    WEAPON_RARITY.MYSTIC,
    WEAPON_RARITY.ANCIENT
] as const;

/** Inventory divisor for high-tier weapons */
export const INVENTORY_DIVISOR_HIGH_TIER = 4;

/** Inventory divisor for standard weapons */
export const INVENTORY_DIVISOR_STANDARD = 3.5;

/** Maximum weapon upgrade iterations */
export const MAX_WEAPON_UPGRADE_ITERATIONS = 300;

/** Maximum star rating for weapons */
export const MAX_STAR_RATING = 5;

// ============================================================================
// EFFICIENCY THRESHOLDS (for UI color coding)
// ============================================================================

export const EFFICIENCY_THRESHOLD = {
    HIGH: 0.66,
    MEDIUM: 0.33
} as const;

// ============================================================================
// BINARY SEARCH CONSTANTS (stat equivalency)
// ============================================================================

export const BINARY_SEARCH = {
    DEFAULT_MAX: 1000000,
    MAX_ITERATIONS: 100,
    PRECISION: 0.01
} as const;

// ============================================================================
// CONTENT CONSTANTS
// ============================================================================

/** Maximum chapter number for stage hunts */
export const MAX_CHAPTER_NUMBER = 28;

// ============================================================================
// MASTERY LEVEL ARRAYS (derived from MASTERY_3RD/4TH for convenience)
// ============================================================================

export const MASTERY_LEVELS = {
    THIRD: {
        ALL: [64, 68, 76, 80, 88, 92] as const,
        BOSS: [72, 84] as const
    },
    FOURTH: {
        ALL: [102, 106, 116, 120, 128, 132] as const,
        BOSS: [111, 124] as const
    }
} as const;

// ============================================================================
// WINDOW GLOBALS TYPE DECLARATION
// ============================================================================

declare global {
    interface Window {
        // Base stats
        calculate?: () => void;
        updateSkillCoefficient?: () => void;
        switchBaseStatsSubTab?: (subTabName: string) => void;
        populateSkillDetails?: () => void;

        // Class/Target selection
        selectJobTier?: (tier: JobTier) => void;
        selectClass?: (className: ClassName) => void;
        selectMasteryTab?: (tier: JobTier) => void;
        selectContentType?: (contentType: ContentType) => void;
        onSubcategoryChange?: () => void;

        // Mastery
        updateMasteryBonuses?: () => void;

        // Stat hub
        handleStatEquivalencyInput?: (sourceStat: string) => void;
        toggleStatChart?: (statKey: string, label: string, isFlat: boolean) => void;
        sortStatPredictions?: (tableType: string, colIndex: number, th: HTMLElement) => void;

        // Help
        openHelpSidebar?: (topic: string) => void;
    }
}
