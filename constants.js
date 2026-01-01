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

// Stage defense data
export const stageDefenses = {
    none: {
        label: "None / Training Dummy",
        defense: 0,
        damageReduction: 0
    },
    stageHunts: [
        { stage: "1-1", defense: 0.00, damageReduction: 16.681 },
        { stage: "1-2", defense: 0.00, damageReduction: 16.722 },
        { stage: "1-3", defense: 0.61, damageReduction: 16.329 },
        { stage: "2-1", defense: 0.61, damageReduction: 16.461 },
        { stage: "2-7", defense: 2.37, damageReduction: 16.604 },
        { stage: "3-1", defense: 3.89, damageReduction: 16.153 },
        { stage: "3-9", defense: 5.58, damageReduction: 16.762 },
        { stage: "4-1", defense: 6.08, damageReduction: 16.595 },
        { stage: "4-9", defense: 7.97, damageReduction: 16.954 },
        { stage: "5-1", defense: 8.44, damageReduction: 16.804 },
        { stage: "5-9", defense: 10.16, damageReduction: 17.221 },
        { stage: "6-1", defense: 10.13, damageReduction: 17.471 },
        { stage: "6-9", defense: 12.15, damageReduction: 17.563 },
        { stage: "7-1", defense: 12.12, damageReduction: 17.805 },
        { stage: "7-9", defense: 13.99, damageReduction: 17.946 },
        { stage: "8-1", defense: 13.96, damageReduction: 18.188 },
        { stage: "8-9", defense: 15.68, damageReduction: 18.397 },
        { stage: "9-1", defense: 15.65, damageReduction: 18.630 },
        { stage: "9-9", defense: 16.88, damageReduction: 19.197 },
        { stage: "10-1", defense: 17.21, damageReduction: 19.114 },
        { stage: "10-9", defense: 18.35, damageReduction: 19.690 },
        { stage: "11-1", defense: 18.66, damageReduction: 19.623 },
        { stage: "11-9", defense: 19.72, damageReduction: 20.232 },
        { stage: "12-1", defense: 20.01, damageReduction: 20.157 },
        { stage: "12-9", defense: 20.99, damageReduction: 20.782 },
        { stage: "13-1", defense: 20.96, damageReduction: 20.999 },
        { stage: "13-9", defense: 22.19, damageReduction: 21.358 },
        { stage: "14-1", defense: 22.15, damageReduction: 21.566 },
        { stage: "14-9", defense: 23.30, damageReduction: 21.958 },
        { stage: "15-1", defense: 23.26, damageReduction: 22.158 },
        { stage: "15-9", defense: 24.34, damageReduction: 22.559 },
        { stage: "16-1", defense: 24.30, damageReduction: 22.767 },
        { stage: "16-9", defense: 25.06, damageReduction: 23.418 },
        { stage: "17-1", defense: 25.28, damageReduction: 23.376 },
        { stage: "17-9", defense: 26.00, damageReduction: 24.027 },
        { stage: "18-1", defense: 26.20, damageReduction: 24.002 },
        { stage: "18-9", defense: 26.88, damageReduction: 24.680 },
        { stage: "19-1", defense: 27.08, damageReduction: 24.653 }
    ],
    chapterBosses: [
        { chapter: "12", defense: 23.46, damageReduction: 17.327 },
        { chapter: "15", defense: 24.28, damageReduction: 17.907 },
        { chapter: "16", defense: 24.72, damageReduction: 17.931 },
        { chapter: "17", defense: 24.89, damageReduction: 18.209 },
        { chapter: "18", defense: 25.05, damageReduction: 18.493 }
    ],
    worldBosses: [
        { stage: "11", defense: 53.48, damageReduction: 81.451 },
        { stage: "12", defense: 53.49, damageReduction: 84.113 }
    ],
    bossRaids: [
        { boss: "Zakum", defense: 34.816, damageReduction: 99.998832 }
    ]
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
