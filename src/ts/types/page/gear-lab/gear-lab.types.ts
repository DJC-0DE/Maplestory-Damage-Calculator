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
    // Future: cubeStrategies, scrollOptimization, etc.
}

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
    }
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
