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
    MAX_ITERATIONS: 10000,
    PRECISION: 0.0001
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
    }
}

/**
 * Single source of truth for all stat definitions
 * Provides enum-like access: STAT.ATTACK, STAT.CRIT_RATE, etc.
 * Contains display label, default value, and UI metadata
 */

/**
 * Interface for stat configuration objects
 * All optional properties that can be defined for a stat
 */
export interface StatConfig {
    id: string;
    label: string;
    type: 'number';
    defaultValue: number;
    step?: string;
    min?: number;
    info?: string;
    hidden?: boolean;
    rowId?: string;
    onChange?: boolean;
}

// Define STAT with explicit type assertion to avoid circular reference
export const STAT = {
    // Core Combat Stats
    ATTACK: {
        id: 'attack' as const,
        label: 'Attack',
        type: 'number' as const,
        defaultValue: 500,
    },
    DEFENSE: {
        id: 'defense' as const,
        label: 'Defense',
        type: 'number' as const,
        defaultValue: 0,
        info: 'defense',
    },
    CRIT_RATE: {
        id: 'critRate' as const,
        label: 'Critical Rate (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 15,
    },
    CRIT_DAMAGE: {
        id: 'critDamage' as const,
        label: 'Critical Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 15,
    },
    ATTACK_SPEED: {
        id: 'attackSpeed' as const,
        label: 'Attack Speed (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
    },

    // Main Stats
    STR: {
        id: 'str' as const,
        label: 'STR',
        type: 'number' as const,
        defaultValue: 1000,
        rowId: 'str-row',
    },
    DEX: {
        id: 'dex' as const,
        label: 'DEX',
        type: 'number' as const,
        defaultValue: 0,
        rowId: 'dex-row',
    },
    INT: {
        id: 'int' as const,
        label: 'INT',
        type: 'number' as const,
        defaultValue: 1000,
        rowId: 'int-row',
    },
    LUK: {
        id: 'luk' as const,
        label: 'LUK',
        type: 'number' as const,
        defaultValue: 0,
        rowId: 'luk-row',
    },

    // Damage Modifiers
    STAT_DAMAGE: {
        id: 'statDamage' as const,
        label: 'Stat Prop. Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
    },
    DAMAGE: {
        id: 'damage' as const,
        label: 'Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 10,
    },
    DAMAGE_AMP: {
        id: 'damageAmp' as const,
        label: 'Damage Amplification (x)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
    },
    BASIC_ATTACK_DAMAGE: {
        id: 'basicAttackDamage' as const,
        label: 'Basic Attack Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
        hidden: true,
    },
    SKILL_DAMAGE: {
        id: 'skillDamage' as const,
        label: 'Skill Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
        hidden: true,
    },
    DEF_PEN: {
        id: 'defPen' as const,
        label: 'Defense Penetration (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
        info: 'def-pen',
    },
    BOSS_DAMAGE: {
        id: 'bossDamage' as const,
        label: 'Boss Monster Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 10,
    },
    NORMAL_DAMAGE: {
        id: 'normalDamage' as const,
        label: 'Normal Monster Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
    },
    MIN_DAMAGE: {
        id: 'minDamage' as const,
        label: 'Min Damage Multiplier (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 50,
    },
    MAX_DAMAGE: {
        id: 'maxDamage' as const,
        label: 'Max Damage Multiplier (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 100,
    },
    FINAL_DAMAGE: {
        id: 'finalDamage' as const,
        label: 'Final Damage (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
    },

    // Skill Levels
    SKILL_LEVEL_1ST: {
        id: 'skillLevel1st' as const,
        label: '1st Job Skill Level',
        type: 'number' as const,
        defaultValue: 0,
        min: 0,
        onChange: true,
    },
    SKILL_LEVEL_2ND: {
        id: 'skillLevel2nd' as const,
        label: '2nd Job Skill Level',
        type: 'number' as const,
        defaultValue: 0,
        min: 0,
        onChange: true,
    },
    SKILL_LEVEL_3RD: {
        id: 'skillLevel3rd' as const,
        label: '3rd Job Skill Level',
        type: 'number' as const,
        defaultValue: 0,
        min: 0,
        onChange: true,
    },
    SKILL_LEVEL_4TH: {
        id: 'skillLevel4th' as const,
        label: '4th Job Skill Level',
        type: 'number' as const,
        defaultValue: 0,
        min: 0,
        onChange: true,
    },

    // Main Stat %
    MAIN_STAT_PCT: {
        id: 'mainStatPct' as const,
        label: 'Current Main Stat %',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
        info: 'main-stat-pct',
    },    

    // Hidden/Main Stat Fields
    PRIMARY_MAIN_STAT: {
        id: 'primaryMainStat' as const,
        label: 'Primary Main Stat',
        type: 'number' as const,
        defaultValue: 1000,
    },
    SECONDARY_MAIN_STAT: {
        id: 'secondaryMainStat' as const,
        label: 'Secondary Main Stat',
        type: 'number' as const,
        defaultValue: 0,
    },
    MASTERY: {
        id: 'mastery' as const,
        label: 'Skill Mastery %',
        type: 'number' as const,
        defaultValue: 0,
    }, 
    BOSS_MASTERY: {
        id: 'bossMastery' as const,
        label: 'Skill Mastery (Boss) %',
        type: 'number' as const,
        defaultValue: 0,
    },
    SKILL_COEFFICIENT: {
        id: 'skillCoefficient' as const,
        label: 'Basic Attack Skill Coefficient',
        type: 'number' as const,
        defaultValue: 0,
    },
        FINAL_ATTACK: {
        id: 'finalAttack' as const,
        label: 'Final Attack (%)',
        type: 'number' as const,
        step: '0.1',
        defaultValue: 0,
    },
};

/**
 * Type derived from STAT keys - ensures type safety
 */
export type StatKey = keyof typeof STAT;

/**
 * BaseStats type - uses StatKey enum values
 * All stats with type safety
 */
export type BaseStats = {
    [K in StatKey]: number;
};

/**
 * Helper to get all stat IDs as an array
 */
export const STAT_IDS = Object.values(STAT).map(s => s.id) as readonly string[];

/**
 * Generate BaseStats defaults from STAT constant
 * Uses uppercase StatKey keys to match BaseStats type
 * This is the single source of truth for default values!
 */
export const DEFAULT_BASE_STATS: BaseStats = Object.keys(STAT).reduce((acc, key) => {
    acc[key as StatKey] = STAT[key as StatKey].defaultValue;
    return acc;
}, {} as BaseStats);
