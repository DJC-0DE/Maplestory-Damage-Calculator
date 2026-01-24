/**
 * Cube Potential Data
 * Constants and configuration data for the cube potential system
 */

import { STAT } from '@ts/types/constants';
import type { CubeSlotConfig, Rarity } from '@ts/types/page/gear-lab/gear-lab.types';

// ============================================================================
// SLOT NAMES
// ============================================================================

/**
 * Equipment slot names
 */
export const SLOT_NAMES: CubeSlotConfig[] = [
    { id: 'helm', name: 'Helm' },
    { id: 'cape', name: 'Cape' },
    { id: 'chest', name: 'Chest' },
    { id: 'shoulder', name: 'Shoulder' },
    { id: 'legs', name: 'Legs' },
    { id: 'belt', name: 'Belt' },
    { id: 'gloves', name: 'Gloves' },
    { id: 'boots', name: 'Boots' },
    { id: 'ring', name: 'Ring' },
    { id: 'necklace', name: 'Necklace' },
    { id: 'eye-accessory', name: 'Eye Accessory' }
];

// ============================================================================
// CLASS TO MAIN STAT MAPPING
// ============================================================================

/**
 * Class to main stat mapping
 */
export const CLASS_MAIN_STAT_MAP: Record<string, string> = {
    'hero': 'Str',
    'dark-knight': 'Str',
    'bowmaster': 'Dex',
    'marksman': 'Dex',
    'night-lord': 'Luk',
    'shadower': 'Luk',
    'arch-mage-il': 'Int',
    'arch-mage-fp': 'Int'
};

// ============================================================================
// POTENTIAL LINE TYPES
// ============================================================================

/**
 * Individual potential line entry
 */
export interface PotentialLineEntry {
    stat: string;
    value: number;
    weight: number;
    prime: boolean;
}

/**
 * Potential lines for a line number
 */
export interface PotentialLines {
    line1?: PotentialLineEntry[];
    line2?: PotentialLineEntry[];
    line3?: PotentialLineEntry[];
}

/**
 * Slot-specific potential data by rarity
 */
export interface SlotSpecificPotentialData {
    normal?: PotentialLines;
    rare?: PotentialLines;
    epic?: PotentialLines;
    unique?: PotentialLines;
    legendary?: PotentialLines;
    mystic?: PotentialLines;
}

/**
 * All slot-specific potentials
 */
export interface SlotSpecificPotentials {
    [slotId: string]: SlotSpecificPotentialData;
}

// ============================================================================
// SLOT-SPECIFIC POTENTIALS
// ============================================================================

/**
 * Slot-specific potential lines (only available on certain equipment slots)
 */
export const SLOT_SPECIFIC_POTENTIALS: SlotSpecificPotentials = {
    'cape': {
        epic: {
            line1: [{ stat: "Final Damage %", value: 3, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 3, weight: 0.24, prime: true }],
            line3: [{ stat: "Final Damage %", value: 3, weight: 0.08, prime: true }]
        },
        unique: {
            line1: [{ stat: "Final Damage %", value: 5, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 5, weight: 0.24, prime: true }, { stat: "Final Damage %", value: 3, weight: 0.76, prime: false }],
            line3: [{ stat: "Final Damage %", value: 5, weight: 0.08, prime: true }, { stat: "Final Damage %", value: 3, weight: 0.92, prime: false }]
        },
        legendary: {
            line1: [{ stat: "Final Damage %", value: 8, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 8, weight: 0.24, prime: true }, { stat: "Final Damage %", value: 5, weight: 0.76, prime: false }],
            line3: [{ stat: "Final Damage %", value: 8, weight: 0.08, prime: true }, { stat: "Final Damage %", value: 5, weight: 0.92, prime: false }]
        },
        mystic: {
            line1: [{ stat: "Final Damage %", value: 12, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 12, weight: 0.24, prime: true }, { stat: "Final Damage %", value: 8, weight: 0.76, prime: false }],
            line3: [{ stat: "Final Damage %", value: 12, weight: 0.08, prime: true }, { stat: "Final Damage %", value: 8, weight: 0.92, prime: false }]
        }
    },
    'gloves': {
        epic: {
            line1: [{ stat: "Critical Damage %", value: 10, weight: 1, prime: true }],
            line2: [{ stat: "Critical Damage %", value: 10, weight: 0.24, prime: true }],
            line3: [{ stat: "Critical Damage %", value: 10, weight: 0.08, prime: true }]
        },
        unique: {
            line1: [{ stat: "Critical Damage %", value: 20, weight: 1, prime: true }],
            line2: [{ stat: "Critical Damage %", value: 20, weight: 0.24, prime: true }, { stat: "Critical Damage %", value: 10, weight: 0.76, prime: false }],
            line3: [{ stat: "Critical Damage %", value: 20, weight: 0.08, prime: true }, { stat: "Critical Damage %", value: 10, weight: 0.92, prime: false }]
        },
        legendary: {
            line1: [{ stat: "Critical Damage %", value: 30, weight: 1, prime: true }],
            line2: [{ stat: "Critical Damage %", value: 30, weight: 0.24, prime: true }, { stat: "Critical Damage %", value: 20, weight: 0.76, prime: false }],
            line3: [{ stat: "Critical Damage %", value: 30, weight: 0.08, prime: true }, { stat: "Critical Damage %", value: 20, weight: 0.92, prime: false }]
        },
        mystic: {
            line1: [{ stat: "Critical Damage %", value: 50, weight: 1, prime: true }],
            line2: [{ stat: "Critical Damage %", value: 50, weight: 0.24, prime: true }, { stat: "Critical Damage %", value: 30, weight: 0.76, prime: false }],
            line3: [{ stat: "Critical Damage %", value: 50, weight: 0.08, prime: true }, { stat: "Critical Damage %", value: 30, weight: 0.92, prime: false }]
        }
    },
    'legs': {
        epic: {
            line1: [{ stat: "Final Damage %", value: 3, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 3, weight: 0.24, prime: true }],
            line3: [{ stat: "Final Damage %", value: 3, weight: 0.08, prime: true }]
        },
        unique: {
            line1: [{ stat: "Final Damage %", value: 5, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 5, weight: 0.24, prime: true }, { stat: "Final Damage %", value: 3, weight: 0.76, prime: false }],
            line3: [{ stat: "Final Damage %", value: 5, weight: 0.08, prime: true }, { stat: "Final Damage %", value: 3, weight: 0.92, prime: false }]
        },
        legendary: {
            line1: [{ stat: "Final Damage %", value: 8, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 8, weight: 0.24, prime: true }, { stat: "Final Damage %", value: 5, weight: 0.76, prime: false }],
            line3: [{ stat: "Final Damage %", value: 8, weight: 0.08, prime: true }, { stat: "Final Damage %", value: 5, weight: 0.92, prime: false }]
        },
        mystic: {
            line1: [{ stat: "Final Damage %", value: 12, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 12, weight: 0.24, prime: true }, { stat: "Final Damage %", value: 8, weight: 0.76, prime: false }],
            line3: [{ stat: "Final Damage %", value: 12, weight: 0.08, prime: true }, { stat: "Final Damage %", value: 8, weight: 0.92, prime: false }]
        }
    },
    'shoulder': {
        unique: {
            line1: [{ stat: "Defense Penetration", value: 8, weight: 1, prime: true }],
            line2: [{ stat: "Defense Penetration", value: 8, weight: 0.24, prime: true }],
            line3: [{ stat: "Defense Penetration", value: 8, weight: 0.08, prime: true }]
        },
        legendary: {
            line1: [{ stat: "Defense Penetration", value: 12, weight: 1, prime: true }],
            line2: [{ stat: "Defense Penetration", value: 12, weight: 0.24, prime: true }, { stat: "Defense Penetration", value: 8, weight: 0.76, prime: false }],
            line3: [{ stat: "Defense Penetration", value: 12, weight: 0.08, prime: true }, { stat: "Defense Penetration", value: 8, weight: 0.92, prime: false }]
        },
        mystic: {
            line1: [{ stat: "Defense Penetration", value: 20, weight: 1, prime: true }],
            line2: [{ stat: "Defense Penetration", value: 20, weight: 0.24, prime: true }, { stat: "Defense Penetration", value: 12, weight: 0.76, prime: false }],
            line3: [{ stat: "Defense Penetration", value: 20, weight: 0.08, prime: true }, { stat: "Defense Penetration", value: 12, weight: 0.92, prime: false }]
        }
    }
};

// ============================================================================
// RANKINGS PAGINATION
// ============================================================================

/**
 * Number of rankings to display per page
 */
export const RANKINGS_PER_PAGE = 25;

// ============================================================================
// RARITY UPGRADE PROBABILITIES
// ============================================================================

/**
 * Rarity upgrade configuration
 */
export interface RarityUpgradeRate {
    next: Rarity;
    rate: number;
    max: number;
}

/**
 * Rarity upgrade rates for each tier
 */
export const RARITY_UPGRADE_RATES: Record<Rarity, RarityUpgradeRate> = {
    'normal': { next: 'rare', rate: 0.06, max: 30 },
    'rare': { next: 'epic', rate: 0.03333, max: 60 },
    'epic': { next: 'unique', rate: 0.0167, max: 120 },
    'unique': { next: 'legendary', rate: 0.006, max: 333 },
    'legendary': { next: 'mystic', rate: 0.0021, max: 714 },
    'mystic': { next: 'mystic', rate: 0, max: 0 } // Can't upgrade any higher!
};

// ============================================================================
// EQUIPMENT POTENTIAL DATA
// ============================================================================

/**
 * Equipment potential data by rarity
 * Structure: { rarity: { line1: [...], line2: [...], line3: [...] } }
 * Each line contains array of { stat, value, weight, prime }
 */
export const EQUIPMENT_POTENTIAL_DATA: Record<Rarity, PotentialLines> = {
    normal: {
        line1: [
            { stat: "Critical Rate %", value: 3, weight: 2.5, prime: false },
            { stat: "Attack Speed %", value: 3, weight: 2.5, prime: false },
            { stat: "Damage %", value: 5, weight: 4, prime: false },
            { stat: "Min Damage Multiplier %", value: 3, weight: 4, prime: false },
            { stat: "Max Damage Multiplier %", value: 3, weight: 4, prime: false },
            { stat: "Str %", value: 3, weight: 4.5, prime: false },
            { stat: "Dex %", value: 3, weight: 4.5, prime: false },
            { stat: "Int %", value: 3, weight: 4.5, prime: false },
            { stat: "Luk %", value: 3, weight: 4.5, prime: false },
            { stat: "Defense %", value: 3, weight: 9, prime: false },
            { stat: "Max HP %", value: 6, weight: 9, prime: false },
            { stat: "Max MP %", value: 3, weight: 9, prime: false },
            { stat: "Str", value: 50, weight: 9.5, prime: false },
            { stat: "Dex", value: 50, weight: 9.5, prime: false },
            { stat: "Int", value: 50, weight: 9.5, prime: false },
            { stat: "Luk", value: 50, weight: 9.5, prime: false }
        ]
    },
    rare: {
        line1: [
            { stat: "Critical Rate %", value: 4.5, weight: 2.5, prime: true },
            { stat: "Attack Speed %", value: 3.5, weight: 2.5, prime: true },
            { stat: "Damage %", value: 8, weight: 4, prime: true },
            { stat: "Min Damage Multiplier %", value: 6, weight: 4, prime: true },
            { stat: "Max Damage Multiplier %", value: 6, weight: 4, prime: true },
            { stat: "Str %", value: 4.5, weight: 4.5, prime: true },
            { stat: "Dex %", value: 4.5, weight: 4.5, prime: true },
            { stat: "Int %", value: 4.5, weight: 4.5, prime: true },
            { stat: "Luk %", value: 4.5, weight: 4.5, prime: true },
            { stat: "Defense %", value: 4.5, weight: 9, prime: true },
            { stat: "Max HP %", value: 9, weight: 9, prime: true },
            { stat: "Max MP %", value: 4.5, weight: 9, prime: true },
            { stat: "Str", value: 100, weight: 9.5, prime: true },
            { stat: "Dex", value: 100, weight: 9.5, prime: true },
            { stat: "Int", value: 100, weight: 9.5, prime: true },
            { stat: "Luk", value: 100, weight: 9.5, prime: true }
        ],
        line2: [
            { stat: "Critical Rate %", value: 3, weight: 1.9, prime: false },
            { stat: "Critical Rate %", value: 4.5, weight: 0.6, prime: true },
            { stat: "Attack Speed %", value: 3, weight: 1.9, prime: false },
            { stat: "Attack Speed %", value: 3.5, weight: 0.6, prime: true },
            { stat: "Damage %", value: 5, weight: 3.04, prime: false },
            { stat: "Damage %", value: 8, weight: 0.96, prime: true },
            { stat: "Min Damage Multiplier %", value: 3, weight: 3.04, prime: false },
            { stat: "Min Damage Multiplier %", value: 6, weight: 0.96, prime: true },
            { stat: "Max Damage Multiplier %", value: 3, weight: 3.04, prime: false },
            { stat: "Max Damage Multiplier %", value: 6, weight: 0.96, prime: true },
            { stat: "Str %", value: 3, weight: 3.42, prime: false },
            { stat: "Str %", value: 4.5, weight: 1.08, prime: true },
            { stat: "Dex %", value: 3, weight: 3.42, prime: false },
            { stat: "Dex %", value: 4.5, weight: 1.08, prime: true },
            { stat: "Int %", value: 3, weight: 3.42, prime: false },
            { stat: "Int %", value: 4.5, weight: 1.08, prime: true },
            { stat: "Luk %", value: 3, weight: 3.42, prime: false },
            { stat: "Luk %", value: 4.5, weight: 1.08, prime: true },
            { stat: "Defense %", value: 3, weight: 6.84, prime: false },
            { stat: "Defense %", value: 4.5, weight: 2.16, prime: true },
            { stat: "Max HP %", value: 6, weight: 6.84, prime: false },
            { stat: "Max HP %", value: 9, weight: 2.16, prime: true },
            { stat: "Max MP %", value: 3, weight: 6.84, prime: false },
            { stat: "Max MP %", value: 4.5, weight: 2.16, prime: true },
            { stat: "Str", value: 50, weight: 7.22, prime: false },
            { stat: "Str", value: 100, weight: 2.28, prime: true },
            { stat: "Dex", value: 50, weight: 7.22, prime: false },
            { stat: "Dex", value: 100, weight: 2.28, prime: true },
            { stat: "Int", value: 50, weight: 7.22, prime: false },
            { stat: "Int", value: 100, weight: 2.28, prime: true },
            { stat: "Luk", value: 50, weight: 7.22, prime: false },
            { stat: "Luk", value: 100, weight: 2.28, prime: true }
        ],
        line3: [
            { stat: "Critical Rate %", value: 3, weight: 2.3, prime: false },
            { stat: "Critical Rate %", value: 4.5, weight: 0.2, prime: true },
            { stat: "Attack Speed %", value: 3, weight: 2.3, prime: false },
            { stat: "Attack Speed %", value: 3.5, weight: 0.2, prime: true },
            { stat: "Damage %", value: 5, weight: 3.68, prime: false },
            { stat: "Damage %", value: 8, weight: 0.32, prime: true },
            { stat: "Min Damage Multiplier %", value: 3, weight: 3.68, prime: false },
            { stat: "Min Damage Multiplier %", value: 6, weight: 0.32, prime: true },
            { stat: "Max Damage Multiplier %", value: 3, weight: 3.68, prime: false },
            { stat: "Max Damage Multiplier %", value: 6, weight: 0.32, prime: true },
            { stat: "Str %", value: 3, weight: 4.14, prime: false },
            { stat: "Str %", value: 4.5, weight: 0.36, prime: true },
            { stat: "Dex %", value: 3, weight: 4.14, prime: false },
            { stat: "Dex %", value: 4.5, weight: 0.36, prime: true },
            { stat: "Int %", value: 3, weight: 4.14, prime: false },
            { stat: "Int %", value: 4.5, weight: 0.36, prime: true },
            { stat: "Luk %", value: 3, weight: 4.14, prime: false },
            { stat: "Luk %", value: 4.5, weight: 0.36, prime: true },
            { stat: "Defense %", value: 3, weight: 8.28, prime: false },
            { stat: "Defense %", value: 4.5, weight: 0.72, prime: true },
            { stat: "Max HP %", value: 6, weight: 8.28, prime: false },
            { stat: "Max HP %", value: 9, weight: 0.72, prime: true },
            { stat: "Max MP %", value: 3, weight: 8.28, prime: false },
            { stat: "Max MP %", value: 4.5, weight: 0.72, prime: true },
            { stat: "Str", value: 50, weight: 8.74, prime: false },
            { stat: "Str", value: 100, weight: 0.76, prime: true },
            { stat: "Dex", value: 50, weight: 8.74, prime: false },
            { stat: "Dex", value: 100, weight: 0.76, prime: true },
            { stat: "Int", value: 50, weight: 8.74, prime: false },
            { stat: "Int", value: 100, weight: 0.76, prime: true },
            { stat: "Luk", value: 50, weight: 8.74, prime: false },
            { stat: "Luk", value: 100, weight: 0.76, prime: true }
        ]
    },
    epic: {
        line1: [
            { stat: "Critical Rate %", value: 6, weight: 2.5, prime: true },
            { stat: "Attack Speed %", value: 4, weight: 2.5, prime: true },
            { stat: "Damage %", value: 12, weight: 4, prime: true },
            { stat: "Min Damage Multiplier %", value: 8, weight: 4, prime: true },
            { stat: "Max Damage Multiplier %", value: 8, weight: 4, prime: true },
            { stat: "Str %", value: 6, weight: 4.5, prime: true },
            { stat: "Dex %", value: 6, weight: 4.5, prime: true },
            { stat: "Int %", value: 6, weight: 4.5, prime: true },
            { stat: "Luk %", value: 6, weight: 4.5, prime: true },
            { stat: "Defense %", value: 6, weight: 9, prime: true },
            { stat: "Max HP %", value: 12, weight: 9, prime: true },
            { stat: "Max MP %", value: 6, weight: 9, prime: true },
            { stat: "Str", value: 200, weight: 9.25, prime: true },
            { stat: "Dex", value: 200, weight: 9.25, prime: true },
            { stat: "Int", value: 200, weight: 9.25, prime: true },
            { stat: "Luk", value: 200, weight: 9.25, prime: true }
        ],
        line2: [
            { stat: "Critical Rate %", value: 4.5, weight: 1.9, prime: false },
            { stat: "Critical Rate %", value: 6, weight: 0.6, prime: true },
            { stat: "Attack Speed %", value: 3.5, weight: 1.9, prime: false },
            { stat: "Attack Speed %", value: 4, weight: 0.6, prime: true },
            { stat: "Damage %", value: 8, weight: 3.04, prime: false },
            { stat: "Damage %", value: 12, weight: 0.96, prime: true },
            { stat: "Min Damage Multiplier %", value: 6, weight: 3.04, prime: false },
            { stat: "Min Damage Multiplier %", value: 8, weight: 0.96, prime: true },
            { stat: "Max Damage Multiplier %", value: 6, weight: 3.04, prime: false },
            { stat: "Max Damage Multiplier %", value: 8, weight: 0.96, prime: true },
            { stat: "Str %", value: 4.5, weight: 3.42, prime: false },
            { stat: "Str %", value: 6, weight: 1.08, prime: true },
            { stat: "Dex %", value: 4.5, weight: 3.42, prime: false },
            { stat: "Dex %", value: 6, weight: 1.08, prime: true },
            { stat: "Int %", value: 4.5, weight: 3.42, prime: false },
            { stat: "Int %", value: 6, weight: 1.08, prime: true },
            { stat: "Luk %", value: 4.5, weight: 3.42, prime: false },
            { stat: "Luk %", value: 6, weight: 1.08, prime: true },
            { stat: "Defense %", value: 4.5, weight: 6.84, prime: false },
            { stat: "Defense %", value: 6, weight: 2.16, prime: true },
            { stat: "Max HP %", value: 9, weight: 6.84, prime: false },
            { stat: "Max HP %", value: 12, weight: 2.16, prime: true },
            { stat: "Max MP %", value: 4.5, weight: 6.84, prime: false },
            { stat: "Max MP %", value: 6, weight: 2.16, prime: true },
            { stat: "Str", value: 100, weight: 7.22, prime: false },
            { stat: "Str", value: 200, weight: 2.22, prime: true },
            { stat: "Dex", value: 100, weight: 7.22, prime: false },
            { stat: "Dex", value: 200, weight: 2.22, prime: true },
            { stat: "Int", value: 100, weight: 7.22, prime: false },
            { stat: "Int", value: 200, weight: 2.22, prime: true },
            { stat: "Luk", value: 100, weight: 7.22, prime: false },
            { stat: "Luk", value: 200, weight: 2.22, prime: true }
        ],
        line3: [
            { stat: "Critical Rate %", value: 4.5, weight: 2.3, prime: false },
            { stat: "Critical Rate %", value: 6, weight: 0.2, prime: true },
            { stat: "Attack Speed %", value: 3.5, weight: 2.3, prime: false },
            { stat: "Attack Speed %", value: 4, weight: 0.2, prime: true },
            { stat: "Damage %", value: 8, weight: 3.68, prime: false },
            { stat: "Damage %", value: 12, weight: 0.32, prime: true },
            { stat: "Min Damage Multiplier %", value: 6, weight: 3.68, prime: false },
            { stat: "Min Damage Multiplier %", value: 8, weight: 0.32, prime: true },
            { stat: "Max Damage Multiplier %", value: 6, weight: 3.68, prime: false },
            { stat: "Max Damage Multiplier %", value: 8, weight: 0.32, prime: true },
            { stat: "Str %", value: 4.5, weight: 4.14, prime: false },
            { stat: "Str %", value: 6, weight: 0.36, prime: true },
            { stat: "Dex %", value: 4.5, weight: 4.14, prime: false },
            { stat: "Dex %", value: 6, weight: 0.36, prime: true },
            { stat: "Int %", value: 4.5, weight: 4.14, prime: false },
            { stat: "Int %", value: 6, weight: 0.36, prime: true },
            { stat: "Luk %", value: 4.5, weight: 4.14, prime: false },
            { stat: "Luk %", value: 6, weight: 0.36, prime: true },
            { stat: "Defense %", value: 4.5, weight: 8.28, prime: false },
            { stat: "Defense %", value: 6, weight: 0.72, prime: true },
            { stat: "Max HP %", value: 9, weight: 8.28, prime: false },
            { stat: "Max HP %", value: 12, weight: 0.72, prime: true },
            { stat: "Max MP %", value: 4.5, weight: 8.28, prime: false },
            { stat: "Max MP %", value: 6, weight: 0.72, prime: true },
            { stat: "Str", value: 100, weight: 8.74, prime: false },
            { stat: "Str", value: 200, weight: 0.74, prime: true },
            { stat: "Dex", value: 100, weight: 8.74, prime: false },
            { stat: "Dex", value: 200, weight: 0.74, prime: true },
            { stat: "Int", value: 100, weight: 8.74, prime: false },
            { stat: "Int", value: 200, weight: 0.74, prime: true },
            { stat: "Luk", value: 100, weight: 8.74, prime: false },
            { stat: "Luk", value: 200, weight: 0.74, prime: true }
        ]
    },
    unique: {
        line1: [
            { stat: "Critical Rate %", value: 9, weight: 2.5, prime: true },
            { stat: "Attack Speed %", value: 5, weight: 2.5, prime: true },
            { stat: "Damage %", value: 18, weight: 4, prime: true },
            { stat: "Min Damage Multiplier %", value: 10, weight: 4, prime: true },
            { stat: "Max Damage Multiplier %", value: 10, weight: 4, prime: true },
            { stat: "Str %", value: 9, weight: 4.5, prime: true },
            { stat: "Dex %", value: 9, weight: 4.5, prime: true },
            { stat: "Int %", value: 9, weight: 4.5, prime: true },
            { stat: "Luk %", value: 9, weight: 4.5, prime: true },
            { stat: "Defense %", value: 9, weight: 9, prime: true },
            { stat: "Max HP %", value: 15, weight: 9, prime: true },
            { stat: "Max MP %", value: 9, weight: 9, prime: true },
            { stat: "Str", value: 400, weight: 9.25, prime: true },
            { stat: "Dex", value: 400, weight: 9.25, prime: true },
            { stat: "Int", value: 400, weight: 9.25, prime: true },
            { stat: "Luk", value: 400, weight: 9.25, prime: true }
        ],
        line2: [
            { stat: "Critical Rate %", value: 6, weight: 1.9, prime: false },
            { stat: "Critical Rate %", value: 9, weight: 0.6, prime: true },
            { stat: "Attack Speed %", value: 4, weight: 1.9, prime: false },
            { stat: "Attack Speed %", value: 5, weight: 0.6, prime: true },
            { stat: "Damage %", value: 12, weight: 3.04, prime: false },
            { stat: "Damage %", value: 18, weight: 0.96, prime: true },
            { stat: "Min Damage Multiplier %", value: 8, weight: 3.04, prime: false },
            { stat: "Min Damage Multiplier %", value: 10, weight: 0.96, prime: true },
            { stat: "Max Damage Multiplier %", value: 8, weight: 3.04, prime: false },
            { stat: "Max Damage Multiplier %", value: 10, weight: 0.96, prime: true },
            { stat: "Str %", value: 6, weight: 3.42, prime: false },
            { stat: "Str %", value: 9, weight: 1.08, prime: true },
            { stat: "Dex %", value: 6, weight: 3.42, prime: false },
            { stat: "Dex %", value: 9, weight: 1.08, prime: true },
            { stat: "Int %", value: 6, weight: 3.42, prime: false },
            { stat: "Int %", value: 9, weight: 1.08, prime: true },
            { stat: "Luk %", value: 6, weight: 3.42, prime: false },
            { stat: "Luk %", value: 9, weight: 1.08, prime: true },
            { stat: "Defense %", value: 6, weight: 6.84, prime: false },
            { stat: "Defense %", value: 9, weight: 2.16, prime: true },
            { stat: "Max HP %", value: 12, weight: 6.84, prime: false },
            { stat: "Max HP %", value: 15, weight: 2.16, prime: true },
            { stat: "Max MP %", value: 6, weight: 6.84, prime: false },
            { stat: "Max MP %", value: 9, weight: 2.16, prime: true },
            { stat: "Str", value: 200, weight: 7.03, prime: false },
            { stat: "Str", value: 400, weight: 2.22, prime: true },
            { stat: "Dex", value: 200, weight: 7.03, prime: false },
            { stat: "Dex", value: 400, weight: 2.22, prime: true },
            { stat: "Int", value: 200, weight: 7.03, prime: false },
            { stat: "Int", value: 400, weight: 2.22, prime: true },
            { stat: "Luk", value: 200, weight: 7.03, prime: false },
            { stat: "Luk", value: 400, weight: 2.22, prime: true }
        ],
        line3: [
            { stat: "Critical Rate %", value: 6, weight: 2.3, prime: false },
            { stat: "Critical Rate %", value: 9, weight: 0.2, prime: true },
            { stat: "Attack Speed %", value: 4, weight: 2.3, prime: false },
            { stat: "Attack Speed %", value: 5, weight: 0.2, prime: true },
            { stat: "Damage %", value: 12, weight: 3.68, prime: false },
            { stat: "Damage %", value: 18, weight: 0.32, prime: true },
            { stat: "Min Damage Multiplier %", value: 8, weight: 3.68, prime: false },
            { stat: "Min Damage Multiplier %", value: 10, weight: 0.32, prime: true },
            { stat: "Max Damage Multiplier %", value: 8, weight: 3.68, prime: false },
            { stat: "Max Damage Multiplier %", value: 10, weight: 0.32, prime: true },
            { stat: "Str %", value: 6, weight: 4.14, prime: false },
            { stat: "Str %", value: 9, weight: 0.36, prime: true },
            { stat: "Dex %", value: 6, weight: 4.14, prime: false },
            { stat: "Dex %", value: 9, weight: 0.36, prime: true },
            { stat: "Int %", value: 6, weight: 4.14, prime: false },
            { stat: "Int %", value: 9, weight: 0.36, prime: true },
            { stat: "Luk %", value: 6, weight: 4.14, prime: false },
            { stat: "Luk %", value: 9, weight: 0.36, prime: true },
            { stat: "Defense %", value: 6, weight: 8.28, prime: false },
            { stat: "Defense %", value: 9, weight: 0.72, prime: true },
            { stat: "Max HP %", value: 12, weight: 8.28, prime: false },
            { stat: "Max HP %", value: 15, weight: 0.72, prime: true },
            { stat: "Max MP %", value: 6, weight: 8.28, prime: false },
            { stat: "Max MP %", value: 9, weight: 0.72, prime: true },
            { stat: "Str", value: 200, weight: 8.51, prime: false },
            { stat: "Str", value: 400, weight: 0.74, prime: true },
            { stat: "Dex", value: 200, weight: 8.51, prime: false },
            { stat: "Dex", value: 400, weight: 0.74, prime: true },
            { stat: "Int", value: 200, weight: 8.51, prime: false },
            { stat: "Int", value: 400, weight: 0.74, prime: true },
            { stat: "Luk", value: 200, weight: 8.51, prime: false },
            { stat: "Luk", value: 400, weight: 0.74, prime: true }
        ]
    },
    legendary: {
        line1: [
            { stat: "Critical Rate %", value: 12, weight: 2.5, prime: false },
            { stat: "Attack Speed %", value: 7, weight: 2.5, prime: false },
            { stat: "Damage %", value: 25, weight: 4, prime: false },
            { stat: "Min Damage Multiplier %", value: 15, weight: 4, prime: false },
            { stat: "Max Damage Multiplier %", value: 15, weight: 4, prime: false },
            { stat: "Str %", value: 12, weight: 4.5, prime: false },
            { stat: "Dex %", value: 12, weight: 4.5, prime: false },
            { stat: "Int %", value: 12, weight: 4.5, prime: false },
            { stat: "Luk %", value: 12, weight: 4.5, prime: false },
            { stat: "Defense %", value: 12, weight: 9, prime: false },
            { stat: "Max HP %", value: 20, weight: 9, prime: false },
            { stat: "Max MP %", value: 12, weight: 9, prime: false },
            { stat: "Str", value: 600, weight: 9.25, prime: false },
            { stat: "Dex", value: 600, weight: 9.25, prime: false },
            { stat: "Int", value: 600, weight: 9.25, prime: false },
            { stat: "Luk", value: 600, weight: 9.25, prime: false }
        ],
        line2: [
            { stat: "Critical Rate %", value: 9, weight: 1.9, prime: false },
            { stat: "Critical Rate %", value: 12, weight: 0.6, prime: true },
            { stat: "Attack Speed %", value: 5, weight: 1.9, prime: false },
            { stat: "Attack Speed %", value: 7, weight: 0.6, prime: true },
            { stat: "Damage %", value: 18, weight: 3.04, prime: false },
            { stat: "Damage %", value: 25, weight: 0.96, prime: true },
            { stat: "Min Damage Multiplier %", value: 10, weight: 3.04, prime: false },
            { stat: "Min Damage Multiplier %", value: 15, weight: 0.96, prime: true },
            { stat: "Max Damage Multiplier %", value: 10, weight: 3.04, prime: false },
            { stat: "Max Damage Multiplier %", value: 15, weight: 0.96, prime: true },
            { stat: "Str %", value: 9, weight: 3.42, prime: false },
            { stat: "Str %", value: 12, weight: 1.08, prime: true },
            { stat: "Dex %", value: 9, weight: 3.42, prime: false },
            { stat: "Dex %", value: 12, weight: 1.08, prime: true },
            { stat: "Int %", value: 9, weight: 3.42, prime: false },
            { stat: "Int %", value: 12, weight: 1.08, prime: true },
            { stat: "Luk %", value: 9, weight: 3.42, prime: false },
            { stat: "Luk %", value: 12, weight: 1.08, prime: true },
            { stat: "Defense %", value: 9, weight: 6.84, prime: false },
            { stat: "Defense %", value: 12, weight: 2.16, prime: true },
            { stat: "Max HP %", value: 15, weight: 6.84, prime: false },
            { stat: "Max HP %", value: 20, weight: 2.16, prime: true },
            { stat: "Max MP %", value: 9, weight: 6.84, prime: false },
            { stat: "Max MP %", value: 12, weight: 2.16, prime: true },
            { stat: "Str", value: 400, weight: 7.03, prime: false },
            { stat: "Str", value: 600, weight: 2.22, prime: true },
            { stat: "Dex", value: 400, weight: 7.03, prime: false },
            { stat: "Dex", value: 600, weight: 2.22, prime: true },
            { stat: "Int", value: 400, weight: 7.03, prime: false },
            { stat: "Int", value: 600, weight: 2.22, prime: true },
            { stat: "Luk", value: 400, weight: 7.03, prime: false },
            { stat: "Luk", value: 600, weight: 2.22, prime: true }
        ],
        line3: [
            { stat: "Critical Rate %", value: 9, weight: 2.3, prime: false },
            { stat: "Critical Rate %", value: 12, weight: 0.2, prime: true },
            { stat: "Attack Speed %", value: 5, weight: 2.3, prime: false },
            { stat: "Attack Speed %", value: 7, weight: 0.2, prime: true },
            { stat: "Damage %", value: 18, weight: 3.68, prime: false },
            { stat: "Damage %", value: 25, weight: 0.32, prime: true },
            { stat: "Min Damage Multiplier %", value: 10, weight: 3.68, prime: false },
            { stat: "Min Damage Multiplier %", value: 15, weight: 0.32, prime: true },
            { stat: "Max Damage Multiplier %", value: 10, weight: 3.68, prime: false },
            { stat: "Max Damage Multiplier %", value: 15, weight: 0.32, prime: true },
            { stat: "Str %", value: 9, weight: 4.14, prime: false },
            { stat: "Str %", value: 12, weight: 0.36, prime: true },
            { stat: "Dex %", value: 9, weight: 4.14, prime: false },
            { stat: "Dex %", value: 12, weight: 0.36, prime: true },
            { stat: "Int %", value: 9, weight: 4.14, prime: false },
            { stat: "Int %", value: 12, weight: 0.36, prime: true },
            { stat: "Luk %", value: 9, weight: 4.14, prime: false },
            { stat: "Luk %", value: 12, weight: 0.36, prime: true },
            { stat: "Defense %", value: 9, weight: 8.28, prime: false },
            { stat: "Defense %", value: 12, weight: 0.72, prime: true },
            { stat: "Max HP %", value: 15, weight: 8.28, prime: false },
            { stat: "Max HP %", value: 20, weight: 0.72, prime: true },
            { stat: "Max MP %", value: 9, weight: 8.28, prime: false },
            { stat: "Max MP %", value: 12, weight: 0.72, prime: true },
            { stat: "Str", value: 400, weight: 8.51, prime: false },
            { stat: "Str", value: 600, weight: 0.74, prime: true },
            { stat: "Dex", value: 400, weight: 8.51, prime: false },
            { stat: "Dex", value: 600, weight: 0.74, prime: true },
            { stat: "Int", value: 400, weight: 8.51, prime: false },
            { stat: "Int", value: 600, weight: 0.74, prime: true },
            { stat: "Luk", value: 400, weight: 8.51, prime: false },
            { stat: "Luk", value: 600, weight: 0.74, prime: true }
        ]
    },
    mystic: {
        line1: [
            { stat: "Critical Rate %", value: 15, weight: 2.5, prime: false },
            { stat: "Attack Speed %", value: 10, weight: 2.5, prime: false },
            { stat: "Damage %", value: 35, weight: 4, prime: false },
            { stat: "Min Damage Multiplier %", value: 25, weight: 4, prime: false },
            { stat: "Max Damage Multiplier %", value: 25, weight: 4, prime: false },
            { stat: "Str %", value: 15, weight: 4.5, prime: false },
            { stat: "Dex %", value: 15, weight: 4.5, prime: false },
            { stat: "Int %", value: 15, weight: 4.5, prime: false },
            { stat: "Luk %", value: 15, weight: 4.5, prime: false },
            { stat: "Defense %", value: 15, weight: 9, prime: false },
            { stat: "Max HP %", value: 25, weight: 9, prime: false },
            { stat: "Max MP %", value: 15, weight: 9, prime: false },
            { stat: "Str", value: 1000, weight: 9.25, prime: false },
            { stat: "Dex", value: 1000, weight: 9.25, prime: false },
            { stat: "Int", value: 1000, weight: 9.25, prime: false },
            { stat: "Luk", value: 1000, weight: 9.25, prime: false }
        ],
        line2: [
            { stat: "Critical Rate %", value: 12, weight: 1.9, prime: false },
            { stat: "Critical Rate %", value: 15, weight: 0.6, prime: true },
            { stat: "Attack Speed %", value: 7, weight: 1.9, prime: false },
            { stat: "Attack Speed %", value: 10, weight: 0.6, prime: true },
            { stat: "Damage %", value: 25, weight: 3.04, prime: false },
            { stat: "Damage %", value: 35, weight: 0.96, prime: true },
            { stat: "Min Damage Multiplier %", value: 15, weight: 3.04, prime: false },
            { stat: "Min Damage Multiplier %", value: 25, weight: 0.96, prime: true },
            { stat: "Max Damage Multiplier %", value: 15, weight: 3.04, prime: false },
            { stat: "Max Damage Multiplier %", value: 25, weight: 0.96, prime: true },
            { stat: "Str %", value: 12, weight: 3.42, prime: false },
            { stat: "Str %", value: 15, weight: 1.08, prime: true },
            { stat: "Dex %", value: 12, weight: 3.42, prime: false },
            { stat: "Dex %", value: 15, weight: 1.08, prime: true },
            { stat: "Int %", value: 12, weight: 3.42, prime: false },
            { stat: "Int %", value: 15, weight: 1.08, prime: true },
            { stat: "Luk %", value: 12, weight: 3.42, prime: false },
            { stat: "Luk %", value: 15, weight: 1.08, prime: true },
            { stat: "Defense %", value: 12, weight: 6.84, prime: false },
            { stat: "Defense %", value: 15, weight: 2.16, prime: true },
            { stat: "Max HP %", value: 20, weight: 6.84, prime: false },
            { stat: "Max HP %", value: 25, weight: 2.16, prime: true },
            { stat: "Max MP %", value: 12, weight: 6.84, prime: false },
            { stat: "Max MP %", value: 15, weight: 2.16, prime: true },
            { stat: "Str", value: 600, weight: 7.03, prime: false },
            { stat: "Str", value: 1000, weight: 2.22, prime: true },
            { stat: "Dex", value: 600, weight: 7.03, prime: false },
            { stat: "Dex", value: 1000, weight: 2.22, prime: true },
            { stat: "Int", value: 600, weight: 7.03, prime: false },
            { stat: "Int", value: 1000, weight: 2.22, prime: true },
            { stat: "Luk", value: 600, weight: 7.03, prime: false },
            { stat: "Luk", value: 1000, weight: 2.22, prime: true }
        ],
        line3: [
            { stat: "Critical Rate %", value: 12, weight: 2.3, prime: false },
            { stat: "Critical Rate %", value: 15, weight: 0.2, prime: true },
            { stat: "Attack Speed %", value: 7, weight: 2.3, prime: false },
            { stat: "Attack Speed %", value: 10, weight: 0.2, prime: true },
            { stat: "Damage %", value: 25, weight: 3.68, prime: false },
            { stat: "Damage %", value: 35, weight: 0.32, prime: true },
            { stat: "Min Damage Multiplier %", value: 15, weight: 3.68, prime: false },
            { stat: "Min Damage Multiplier %", value: 25, weight: 0.32, prime: true },
            { stat: "Max Damage Multiplier %", value: 15, weight: 3.68, prime: false },
            { stat: "Max Damage Multiplier %", value: 25, weight: 0.32, prime: true },
            { stat: "Str %", value: 12, weight: 4.14, prime: false },
            { stat: "Str %", value: 15, weight: 0.36, prime: true },
            { stat: "Dex %", value: 12, weight: 4.14, prime: false },
            { stat: "Dex %", value: 15, weight: 0.36, prime: true },
            { stat: "Int %", value: 12, weight: 4.14, prime: false },
            { stat: "Int %", value: 15, weight: 0.36, prime: true },
            { stat: "Luk %", value: 12, weight: 4.14, prime: false },
            { stat: "Luk %", value: 15, weight: 0.36, prime: true },
            { stat: "Defense %", value: 12, weight: 8.28, prime: false },
            { stat: "Defense %", value: 15, weight: 0.72, prime: true },
            { stat: "Max HP %", value: 20, weight: 8.28, prime: false },
            { stat: "Max HP %", value: 25, weight: 0.72, prime: true },
            { stat: "Max MP %", value: 12, weight: 8.28, prime: false },
            { stat: "Max MP %", value: 15, weight: 0.72, prime: true },
            { stat: "Str", value: 600, weight: 8.51, prime: false },
            { stat: "Str", value: 1000, weight: 0.74, prime: true },
            { stat: "Dex", value: 600, weight: 8.51, prime: false },
            { stat: "Dex", value: 1000, weight: 0.74, prime: true },
            { stat: "Int", value: 600, weight: 8.51, prime: false },
            { stat: "Int", value: 1000, weight: 0.74, prime: true },
            { stat: "Luk", value: 600, weight: 8.51, prime: false },
            { stat: "Luk", value: 1000, weight: 0.74, prime: true }
        ]
    }
};

// Note: Normal lines 2 and 3 use the same data as line 1
EQUIPMENT_POTENTIAL_DATA.normal.line2 = EQUIPMENT_POTENTIAL_DATA.normal.line1;
EQUIPMENT_POTENTIAL_DATA.normal.line3 = EQUIPMENT_POTENTIAL_DATA.normal.line1;

// ============================================================================
// POTENTIAL STAT TO STAT ID MAPPING
// ============================================================================

/**
 * Potential stat names that have no combat impact and should be skipped
 */
export const NON_COMBAT_POTENTIAL_STATS = [
    'Max HP %',
    'Max MP %'
] as const;

/**
 * Map potential stat names to STAT constant IDs
 * Uses the STAT.id values from constants.ts
 */
export const POTENTIAL_STAT_TO_STAT_ID: Record<string, string> = {
    'Critical Rate %': STAT.CRIT_RATE.id,
    'Critical Damage %': STAT.CRIT_DAMAGE.id,
    'Attack Speed %': STAT.ATTACK_SPEED.id,
    'Damage %': STAT.DAMAGE.id,
    'Final Damage %': STAT.FINAL_DAMAGE.id,
    'Min Damage Multiplier %': STAT.MIN_DAMAGE.id,
    'Max Damage Multiplier %': STAT.MAX_DAMAGE.id,
    'Defense %': STAT.DEFENSE.id,
    'Defense Penetration': STAT.DEF_PEN.id,
    'Boss Monster Damage %': STAT.BOSS_DAMAGE.id,
    'Normal Monster Damage %': STAT.NORMAL_DAMAGE.id
};
