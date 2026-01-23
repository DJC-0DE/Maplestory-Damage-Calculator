/**
 * Companion System Type Definitions
 * Shared types for the companions module
 */

import type { MonsterType } from '@ts/types';

// ============================================================================
// CORE TYPES
// ============================================================================

// Companion-specific class names (PascalCase, different from kebab-case ClassName)
export type CompanionClass =
    | 'Hero' | 'DarkKnight' | 'ArchMageIL' | 'ArchMageFP'
    | 'BowMaster' | 'Marksman' | 'NightLord' | 'Shadower';

export type CompanionRarity = 'Normal' | 'Rare' | 'Epic' | 'Unique' | 'Legendary';
export type CompanionKey = `${CompanionClass}-${CompanionRarity}`;

export type CompanionPresetId =
    | 'preset1' | 'preset2' | 'preset3' | 'preset4' | 'preset5'
    | 'optimal-boss'
    | 'optimal-normal';

// Individual companion state (per companionKey)
export interface CompanionData {
    unlocked: boolean;
    level: number;
}

// Effects returned from companion-data.ts
export interface CompanionEffects {
    inventoryEffect: Record<string, number>;
    equipEffect: Record<string, number>;
    supporterCode?: number;
    supporterIndex?: number;
}

// Preset configuration (1 main + 6 subs)
export interface CompanionPreset {
    main: CompanionKey | null;
    subs: [
        CompanionKey | null,
        CompanionKey | null,
        CompanionKey | null,
        CompanionKey | null,
        CompanionKey | null,
        CompanionKey | null
    ];
}

// Complete companion state for LoadoutData
export interface CompanionState {
    companions: Record<CompanionKey, CompanionData>;
    presets: Record<CompanionPresetId, CompanionPreset>;
    equippedPresetId: CompanionPresetId;
    showPresetDpsComparison: boolean;
    lockedMainCompanion: {
        'optimal-boss': CompanionKey | null;
        'optimal-normal': CompanionKey | null;
    };
}

// DPS calculation results
export interface DpsComparisonResult {
    baselineDps: number;
    currentPresetDps: number;
    newPresetDps: number;
    currentPresetGain: number;
    newPresetGain: number;
    dpsGain: number;
}

export interface BothDpsResults {
    boss: DpsComparisonResult;
    normal: DpsComparisonResult;
}

// ============================================================================
// UI TYPES
// ============================================================================

// Rarity configuration for visual rendering
export interface RarityConfig {
    color: string;
    borderColor: string;
    count: number;
    classes: CompanionClass[];
}

// Processed effect for display
export interface ProcessedEffect {
    stat: string;
    displayName: string;
    value: number | string;
    isPercentage: boolean;
}

// Slot selection info
export interface SelectedSlotInfo {
    presetId: CompanionPresetId;
    type: 'main' | 'sub';
    index: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const COMPANION_CLASSES: CompanionClass[] = [
    'Hero',
    'DarkKnight',
    'ArchMageIL',
    'ArchMageFP',
    'BowMaster',
    'Marksman',
    'NightLord',
    'Shadower'
];

export const COMPANION_RARITIES: CompanionRarity[] = [
    'Normal',
    'Rare',
    'Epic',
    'Unique',
    'Legendary'
];

export const CLASS_DISPLAY_NAMES: Record<CompanionClass, string> = {
    'Hero': 'Hero',
    'DarkKnight': 'Dark Knight',
    'ArchMageIL': 'I/L Mage',
    'ArchMageFP': 'F/P Mage',
    'BowMaster': 'Bow Master',
    'Marksman': 'Marksman',
    'NightLord': 'Night Lord',
    'Shadower': 'Shadower'
};

export const CLASS_ORDER: CompanionClass[] = [
    'Hero',
    'DarkKnight',
    'ArchMageIL',
    'ArchMageFP',
    'BowMaster',
    'Marksman',
    'NightLord',
    'Shadower'
];

export const RARITY_CONFIG: Record<CompanionRarity, RarityConfig> = {
    'Normal': {
        color: '#ffffff',
        borderColor: '#888888',
        count: 4,
        classes: ['Hero', 'ArchMageIL', 'BowMaster', 'Shadower'] // Only first 4 classes
    },
    'Rare': {
        color: '#00ccff',
        borderColor: '#5d87df',
        count: 8,
        classes: CLASS_ORDER // All 8 classes
    },
    'Epic': {
        color: '#bb77ff',
        borderColor: '#7e5ad4',
        count: 8,
        classes: CLASS_ORDER
    },
    'Unique': {
        color: '#ffaa00',
        borderColor: '#e8a019',
        count: 8,
        classes: CLASS_ORDER
    },
    'Legendary': {
        color: '#1fffca',
        borderColor: '#2dbd7a',
        count: 8,
        classes: CLASS_ORDER
    }
};

// Default empty preset
export const EMPTY_PRESET: CompanionPreset = {
    main: null,
    subs: [null, null, null, null, null, null]
};

// Default companion state
export const DEFAULT_COMPANION_STATE: CompanionState = {
    companions: {},
    presets: {
        'preset1': { ...EMPTY_PRESET },
        'preset2': { ...EMPTY_PRESET },
        'preset3': { ...EMPTY_PRESET },
        'preset4': { ...EMPTY_PRESET },
        'preset5': { ...EMPTY_PRESET },
        'optimal-boss': { ...EMPTY_PRESET },
        'optimal-normal': { ...EMPTY_PRESET }
    },
    equippedPresetId: 'preset1',
    showPresetDpsComparison: false,
    lockedMainCompanion: {
        'optimal-boss': null,
        'optimal-normal': null
    }
};
