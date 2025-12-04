// Weapon rates per level calculated from provided data
const weaponRatesPerLevel = {
    'normal': { 't1': 0.0755, 't2': 0.064, 't3': 0.054, 't4': 0.0455 },
    'rare': { 't1': 0.1952, 't2': 0.1535, 't3': 0.1221, 't4': 0.0959 },
    'epic': { 't1': 0.5144, 't2': 0.6015, 't3': 0.4308, 't4': 0.3033 },
    'unique': { 't1': 1.5573, 't2': 2.7395, 't3': 0.8850, 't4': 0.6686 },
    'legendary': { 't1': 3.9490, 't2': 2.7297, 't3': 3.1824, 't4': 2.5734 },
    'mystic': { 't1': null, 't2': null, 't3': null, 't4': 4.9322 }
};

const tiers = ['t4', 't3', 't2', 't1'];
const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic'];

const availableStats = [
    { value: 'attack', label: 'Attack' },
    { value: 'crit-rate', label: 'Critical Rate (%)' },
    { value: 'crit-damage', label: 'Critical Damage (%)' },
    { value: 'skill-level', label: '3rd Job Skill Level' },
    { value: 'normal-damage', label: 'Normal Monster Damage (%)' },
    { value: 'boss-damage', label: 'Boss Monster Damage (%)' },
    { value: 'damage', label: 'Damage (%)' }
];

// Global state variables
let comparisonItemCount = 0;
let equippedStatCount = 0;
