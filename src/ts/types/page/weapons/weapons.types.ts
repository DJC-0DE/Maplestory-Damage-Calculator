/**
 * Type definitions for Weapon Levels system
 * All interfaces and types for weapon calculations, UI state, and data structures
 */

import { WeaponRarity, WeaponTier } from "@ts/types";

/**
 * Data tier number used in cost calculations (inverted from game tier)
 * T4 -> 1, T3 -> 2, T2 -> 3, T1 -> 4
 */
export type DataTierNumber = '1' | '2' | '3' | '4';

/**
 * Weapon key combining rarity and tier
 */
export type WeaponKey = `${WeaponRarity}-${WeaponTier}`;

/**
 * Star rating (0-5)
 */
export type StarRating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Weapon level (0-200)
 */
export type WeaponLevel = number;

/**
 * Result of weapon attack calculation
 */
export interface WeaponAttackResult {
    /** Inventory attack percentage */
    inventoryAttack: number;
    /** Equipped attack percentage */
    equippedAttack: number;
}

/**
 * Result of upgrade gain calculation
 */
export interface UpgradeGainResult {
    /** Number of levels gained */
    levelsGained: number;
    /** New weapon level after upgrade */
    newLevel: number;
    /** Attack gain in inventory */
    attackGain: number;
    /** Attack gain when equipped */
    equippedAttackGain: number;
    /** Total resources used */
    resourcesUsed: number;
    /** Efficiency: attack gain per 1k resources */
    efficiency: number;
    /** Cost of a single level (when unaffordable) */
    singleLevelCost: number;
    /** Whether the next level is unaffordable with available resources */
    isUnaffordable: boolean;
}

/**
 * Current state of a weapon
 */
export interface WeaponState {
    /** Weapon rarity */
    rarity: WeaponRarity;
    /** Weapon tier */
    tier: WeaponTier;
    /** Current weapon level */
    level: WeaponLevel;
    /** Star rating (0-5) */
    stars: StarRating;
    /** Maximum level for current star rating */
    maxLevel: WeaponLevel;
    isEquipped: boolean;
}

/**
 * Upgrade priority result for a single weapon
 */
export interface UpgradePriorityItem {
    /** Weapon rarity */
    rarity: WeaponRarity;
    /** Weapon tier */
    tier: WeaponTier;
    /** Weapon key for lookup */
    key: WeaponKey;
    /** Cost to upgrade this weapon by 1 level */
    cost: number;
}

/**
 * Grouped upgrade priority result
 */
export interface GroupedUpgradeResult {
    /** Weapon rarity */
    rarity: WeaponRarity;
    /** Weapon tier */
    tier: WeaponTier;
    /** Number of consecutive upgrades */
    count: number;
}

/**
 * Result of upgrade priority calculation
 */
export interface UpgradePriorityChainResult {
    /** Sequence of individual upgrades */
    upgradeSequence: UpgradePriorityItem[];
    /** Grouped upgrades for display */
    groupedUpgrades: GroupedUpgradeResult[];
    /** Final weapon levels after all upgrades */
    finalWeaponLevels: Record<WeaponKey, WeaponLevel>;
}

/**
 * Result of currency upgrade calculation
 */
export interface CurrencyUpgradeResult {
    /** Total inventory attack gained */
    totalAttackGain: number;
    /** DPS gain percentage */
    dpsGainPct: number;
    /** Upgrade sequence */
    upgradeSequence: UpgradePriorityItem[];
    /** Final weapon levels */
    weaponLevels: Record<WeaponKey, WeaponLevel>;
    /** Remaining currency */
    remainingCurrency: number;
}

/**
 * Weapon upgrade cost data structure
 * Maps: rarity -> data tier number -> level -> cost
 */
export interface WeaponUpgradeCosts {
    [rarity: string]: {
        [dataTier: string]: {
            [level: string]: number;
        };
    };
}

/**
 * Base equipped attack for weapons at level 1
 * Maps: rarity -> tier -> base attack percentage
 */
export interface WeaponBaseAttackEquipped {
    [rarity: string]: {
        [tier: string]: number;
    };
}

/**
 * Rarity color mapping
 */
export interface RarityColors {
    [rarity: string]: string;
}

/**
 * Weapon levels stored in state/localStorage
 * Maps weapon key to level
 */
export interface WeaponLevels {
    [key: string]: WeaponLevel;
}

/**
 * Window global function declarations for HTML onclick handlers
 */
declare global {
    interface Window {
        /** Set weapon star rating */
        setWeaponStars: (rarity: WeaponRarity, tier: WeaponTier, stars: StarRating) => void;
        /** Preview star rating on hover */
        previewStars: (rarity: WeaponRarity, tier: WeaponTier, stars: StarRating) => void;
        /** Reset star preview on mouse leave */
        resetStarPreview: (rarity: WeaponRarity, tier: WeaponTier) => void;
        /** Handle equipped checkbox change */
        handleEquippedCheckboxChange: (rarity: WeaponRarity, tier: WeaponTier) => void;
        /** Handle weapon level input change */
        handleWeaponLevelChange: (rarity: WeaponRarity, tier: WeaponTier) => void;
        /** Calculate currency upgrades */
        calculateCurrencyUpgrades: (weaponStates: WeaponState[], currency: number) => CurrencyUpgradeResult;
        /** Switch weapon levels sub-tab */
        switchWeaponLevelsTab: (tabName: string) => void;
    }
}

export {};
