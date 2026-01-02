// Weapon rates per level calculated from provided data
export const weaponRatesPerLevel = {
    'normal': { 't1': 0.0755, 't2': 0.064, 't3': 0.054, 't4': 0.0455 },
    'rare': { 't1': 0.1952, 't2': 0.1535, 't3': 0.1221, 't4': 0.0959 },
    'epic': { 't1': 0.5144, 't2': 0.6015, 't3': 0.4308, 't4': 0.3033 },
    'unique': { 't1': 1.5573, 't2': 2.7395, 't3': 0.8850, 't4': 0.6686 },
    'legendary': { 't1': 3.9490, 't2': 2.7297, 't3': 3.1824, 't4': 2.5734 },
    'mystic': { 't1': 5.5, 't2': 4.2, 't3': 4.8, 't4': 4.9322 },
    'ancient': { 't1': 6.5, 't2': 5.0, 't3': 5.5, 't4': 6.2 }
};

// Base attack % at level 1 for EQUIPPED weapons (from weapon invent attack formula.png)
export const weaponBaseAttackEquipped = {
    'normal': { 't1': 25, 't2': 21, 't3': 18, 't4': 15 },
    'rare': { 't1': 61.1, 't2': 48.9, 't3': 39.1, 't4': 31.3 },
    'epic': { 't1': 149.3, 't2': 119.4, 't3': 95.5, 't4': 76.4 },
    'unique': { 't1': 426.4, 't2': 328, 't3': 252.3, 't4': 194.1 },
    'legendary': { 't1': 1217.8, 't2': 936.8, 't3': 720.6, 't4': 554.3 },
    'mystic': { 't1': 3810.6, 't2': 2865.1, 't3': 2154.2, 't4': 1619.7 },
    'ancient': { 't1': 2186.6, 't2': 2908.2, 't3': 3867.9, 't4': 5144.3 }
};

export const tiers = ['t4', 't3', 't2', 't1'];
export const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic', 'ancient'];

export const availableStats = [
    { value: 'attack', label: 'Attack' },
    { value: 'main-stat', label: 'Main Stat (100 = 1% Stat Dmg)' },
    { value: 'defense', label: 'Defense (DK: 12.7% → Main Stat)' },
    { value: 'crit-rate', label: 'Critical Rate (%)' },
    { value: 'crit-damage', label: 'Critical Damage (%)' },
    { value: 'skill-level', label: '3rd Job Skill Level (1 lvl = 0.3% Skill Coeff)' },
    { value: 'normal-damage', label: 'Normal Monster Damage (%)' },
    { value: 'boss-damage', label: 'Boss Monster Damage (%)' },
    { value: 'damage', label: 'Damage (%)' }
];

// Rarity colors
export const rarityColors = {
    'Legendary': '#33ce85',
    'Unique': '#ffd26d',
    'Epic': '#9966ff',
    'Rare': '#88bbff',
    'Normal': '#cccccc',
    'Mystic': '#ff3f42',
    'Ancient': '#2266cc'
};

// Import stage data from separate file (auto-generated from game files)
import { stageData } from './stage-data.js';

// Stage defense data - organized by content type
export const stageDefenses = {
    none: {
        label: "None / Training Dummy",
        defense: 0,
        damageReduction: 0,
        accuracy: 0
    },
    // Auto-generated data from game files
    stageHunts: stageData.stageHunts,
    chapterBosses: stageData.chapterBosses,
    worldBosses: stageData.worldBosses,
    growthDungeons: stageData.growthDungeons
};

// Global state variables
export let comparisonItemCount = 0;
export let equippedStatCount = 0;

// Setters for global state (needed since modules can't reassign imported variables)
export function setComparisonItemCount(value) {
    comparisonItemCount = value;
}

export function setEquippedStatCount(value) {
    equippedStatCount = value;
}
