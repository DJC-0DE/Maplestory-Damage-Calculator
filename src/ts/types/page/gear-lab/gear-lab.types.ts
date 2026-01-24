/**
 * Gear Lab Store Types
 *
 * Centralized types for the gearLabStore which manages Inner Ability presets
 * and will be extensible for future Gear Lab features.
 */

// ============================================================================
// INNER ABILITY TYPES
// ============================================================================

/**
 * Individual inner ability line (stat + value)
 */
export interface InnerAbilityLine {
    stat: string;  // e.g., "Boss Monster Damage"
    value: number;  // e.g., 40
}

/**
 * A complete inner ability preset (1-10)
 */
export interface InnerAbilityPreset {
    id: number;  // 1-10
    isEquipped: boolean;
    lines: InnerAbilityLine[];  // Up to 6 lines, can be empty
}

/**
 * Result from preset comparison calculation
 */
export interface PresetComparisonResult {
    id: number;
    isEquipped: boolean;
    lines: InnerAbilityLine[];
    bossDPSGain: number;
    normalDPSGain: number;
    lineContributions: Array<{
        stat: string;
        value: number;
        dpsContribution: number;
    }>;
}

/**
 * Result from theoretical best calculation
 */
export interface TheoreticalRollResult {
    stat: string;
    rarity: string;  // 'Mystic', 'Legendary', etc.
    roll: 'Min' | 'Mid' | 'Max';
    value: number;
    dpsGain: number;
    percentIncrease: number;
}

/**
 * Best combination result
 */
export interface BestCombinationResult {
    lines: Array<{
        stat: string;
        rarity: string;
        value: number;
        dpsGain?: number;
    }>;
    totalDPS: number;
}

// ============================================================================
// CUBE POTENTIAL TYPES
// ============================================================================

/**
 * Equipment slot ID type
 */
export type CubeSlotId =
    | 'helm' | 'cape' | 'chest' | 'shoulder' | 'legs' | 'belt'
    | 'gloves' | 'boots' | 'ring' | 'necklace' | 'eye-accessory';

/**
 * Potential type
 */
export type PotentialType = 'regular' | 'bonus';

/**
 * Rarity tier
 */
export type Rarity = 'normal' | 'rare' | 'epic' | 'unique' | 'legendary' | 'mystic';

/**
 * Individual potential line
 */
export interface PotentialLine {
    stat: string;
    value: number;
    prime: boolean;
}

/**
 * Potential line entry for rankings
 */
export interface PotentialLineEntry {
    stat: string;
    value: number;
    prime: boolean;
}

/**
 * A potential set (3 lines)
 */
export interface PotentialSet {
    line1: PotentialLine;
    line2: PotentialLine;
    line3: PotentialLine;
}

/**
 * Empty potential line
 */
export const EMPTY_POTENTIAL_LINE: PotentialLine = {
    stat: '',
    value: 0,
    prime: false
};

/**
 * Empty potential set
 */
export const EMPTY_POTENTIAL_SET: PotentialSet = {
    line1: { ...EMPTY_POTENTIAL_LINE },
    line2: { ...EMPTY_POTENTIAL_LINE },
    line3: { ...EMPTY_POTENTIAL_LINE }
};

/**
 * Potential type data (contains both regular and bonus potential)
 */
export interface PotentialTypeData {
    rarity: Rarity;
    rollCount: number;
    setA: PotentialSet;
    setB: PotentialSet;
}

/**
 * Equipment slot configuration
 */
export interface CubeSlotConfig {
    id: CubeSlotId;
    name: string;
}

/**
 * Cube slot data (contains both regular and bonus potential)
 */
export interface CubeSlotData {
    regular: PotentialTypeData;
    bonus: PotentialTypeData;
}

/**
 * All cube slot data
 */
export type AllCubeSlotData = Record<CubeSlotId, CubeSlotData>;

/**
 * Legacy cube slot data format (for migration)
 */
export interface LegacyCubeSlotData {
    regular: {
        rarity: Rarity;
        rollCount: number;
        setA: PotentialSet;
        setB: PotentialSet;
    };
    bonus: {
        rarity: Rarity;
        rollCount: number;
        setA: PotentialSet;
        setB: PotentialSet;
    };
}

// ============================================================================
// STORE DATA STRUCTURE
// ============================================================================

/**
 * Complete gear lab data structure
 * Designed to be extensible for future Gear Lab features
 */
export interface GearLabData {
    innerAbility: {
        presets: Record<number, InnerAbilityPreset>;
    };
    cubePotential: AllCubeSlotData;
    // Future: cubeStrategies, scrollOptimization, etc.
}

/**
 * Default potential type data
 */
const DEFAULT_POTENTIAL_TYPE_DATA: PotentialTypeData = {
    rarity: 'normal',
    rollCount: 0,
    setA: { ...EMPTY_POTENTIAL_SET },
    setB: { ...EMPTY_POTENTIAL_SET }
};

/**
 * Default cube slot data
 */
const DEFAULT_CUBE_SLOT_DATA: CubeSlotData = {
    regular: { ...DEFAULT_POTENTIAL_TYPE_DATA },
    bonus: { ...DEFAULT_POTENTIAL_TYPE_DATA }
};

/**
 * Create default cube slot data for all slots
 */
const createDefaultCubeSlotData = (): AllCubeSlotData => ({
    helm: { ...DEFAULT_CUBE_SLOT_DATA },
    cape: { ...DEFAULT_CUBE_SLOT_DATA },
    chest: { ...DEFAULT_CUBE_SLOT_DATA },
    shoulder: { ...DEFAULT_CUBE_SLOT_DATA },
    legs: { ...DEFAULT_CUBE_SLOT_DATA },
    belt: { ...DEFAULT_CUBE_SLOT_DATA },
    gloves: { ...DEFAULT_CUBE_SLOT_DATA },
    boots: { ...DEFAULT_CUBE_SLOT_DATA },
    ring: { ...DEFAULT_CUBE_SLOT_DATA },
    necklace: { ...DEFAULT_CUBE_SLOT_DATA },
    'eye-accessory': { ...DEFAULT_CUBE_SLOT_DATA }
});

/**
 * Default gear lab data
 */
export const DEFAULT_GEAR_LAB_DATA: GearLabData = {
    innerAbility: {
        presets: {
            1: { id: 1, isEquipped: false, lines: [] },
            2: { id: 2, isEquipped: false, lines: [] },
            3: { id: 3, isEquipped: false, lines: [] },
            4: { id: 4, isEquipped: false, lines: [] },
            5: { id: 5, isEquipped: false, lines: [] },
            6: { id: 6, isEquipped: false, lines: [] },
            7: { id: 7, isEquipped: false, lines: [] },
            8: { id: 8, isEquipped: false, lines: [] },
            9: { id: 9, isEquipped: false, lines: [] },
            10: { id: 10, isEquipped: false, lines: [] },
        }
    },
    cubePotential: createDefaultCubeSlotData()
};

// ============================================================================
// LEGACY DATA TYPES (for migration)
// ============================================================================

/**
 * Legacy heroPowerPresets format from localStorage
 */
export interface LegacyHeroPowerPresets {
    [presetId: string]: {
        isEquipped: boolean;
        lines: Array<{
            stat: string;
            value: number;
        }>;
    };
}

/**
 * Legacy cube slot data from localStorage
 * Matches the old format stored by state.js
 */
export interface LegacyCubePotentialData {
    [slotId: string]: {
        regular: {
            rarity: Rarity;
            rollCount: number;
            setA: PotentialSet;
            setB: PotentialSet;
        };
        bonus: {
            rarity: Rarity;
            rollCount: number;
            setA: PotentialSet;
            setB: PotentialSet;
        };
    };
}
