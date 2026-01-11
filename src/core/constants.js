// Base attack % at level 1 for EQUIPPED weapons
export const weaponBaseAttackEquipped = {
    'normal': { 't1': 25, 't2': 21, 't3': 18, 't4': 15 },
    'rare': { 't1': 61.1, 't2': 48.9, 't3': 39.1, 't4': 31.3 },
    'epic': { 't1': 149.3, 't2': 119.4, 't3': 95.5, 't4': 76.4 },
    'unique': { 't1': 426.4, 't2': 328, 't3': 252.3, 't4': 194.1 },
    'legendary': { 't1': 1217.8, 't2': 936.8, 't3': 720.6, 't4': 554.3 },
    'mystic': { 't1': 3810.6, 't2': 2865.1, 't3': 2154.2, 't4': 1619.7 },
    'ancient': { 't1': 0, 't2': 9375.5, 't3': 6944.8, 't4': 5144.3 }
};

export const tiers = ['t4', 't3', 't2', 't1'];
export const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic', 'ancient'];

export const availableStats = [
    { value: 'attack', label: 'Attack' },
    { value: 'main-stat', label: 'Main Stat (100 = 1% Stat Dmg)' },
    { value: 'defense', label: 'Defense (DK: 12.7% → Main Stat)' },
    { value: 'crit-rate', label: 'Critical Rate (%)' },
    { value: 'crit-damage', label: 'Critical Damage (%)' },
    { value: 'skill-level-1st', label: '1st Job Skill Level' },
    { value: 'skill-level-2nd', label: '2nd Job Skill Level' },
    { value: 'skill-level-3rd', label: '3rd Job Skill Level' },
    { value: 'skill-level-4th', label: '4th Job Skill Level' },
    { value: 'skill-level-all', label: 'All Skill Levels' },
    { value: 'normal-damage', label: 'Normal Monster Damage (%)' },
    { value: 'boss-damage', label: 'Boss Monster Damage (%)' },
    { value: 'damage', label: 'Damage (%)' },
    { value: 'final-damage', label: 'Final Damage (%)' },
    { value: 'min-damage', label: 'Min Damage Multiplier (%)' },
    { value: 'max-damage', label: 'Max Damage Multiplier (%)' }
];

// Map of stat type values to their property names in item stat objects
export const itemStatProperties = {
    'attack': 'attack',
    'main-stat': 'mainStat',
    'defense': 'defense',
    'crit-rate': 'critRate',
    'crit-damage': 'critDamage',
    'skill-level-1st': 'skillLevel1st',
    'skill-level-2nd': 'skillLevel2nd',
    'skill-level-3rd': 'skillLevel3rd',
    'skill-level-4th': 'skillLevel4th',
    'skill-level-all': 'skillLevelAll',
    'normal-damage': 'normalDamage',
    'boss-damage': 'bossDamage',
    'damage': 'damage',
    'final-damage': 'finalDamage',
    'min-damage': 'minDamage',
    'max-damage': 'maxDamage'
};

// List of all stat properties that can exist on an item (for iteration)
export const allItemStatProperties = [
    'attack', 'mainStat', 'defense', 'critRate', 'critDamage',
    'skillLevel1st', 'skillLevel2nd', 'skillLevel3rd', 'skillLevel4th', 'skillLevelAll',
    'normalDamage', 'bossDamage', 'damage', 'finalDamage',
    'minDamage', 'maxDamage'
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
