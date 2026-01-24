const innerAbilityStats = [
  "Accuracy",
  "Attack Speed",
  "Boss Monster Damage",
  "Critical Rate",
  "Critical Resistance",
  "Damage",
  "Damage Taken Decrease",
  "Damage Tolerance",
  "Debuff Tolerance",
  "Defense Penetration",
  "EXP Gain",
  "Evasion",
  "Main Stat",
  "Max Damage Multiplier",
  "Max HP",
  "Max MP",
  "Meso Drop",
  "Min Damage Multiplier",
  "MP Recovery Per Sec",
  "Normal Monster Damage"
];
const innerAbilitiesData = {
  "Mystic": {
    lineRate: 5.2632,
    // Probability of getting a specific line within this rarity (%)
    "Meso Drop": { min: 9, max: 15 },
    "EXP Gain": { min: 9, max: 15 },
    "Defense Penetration": { min: 14, max: 20 },
    "Boss Monster Damage": { min: 28, max: 40 },
    "Normal Monster Damage": { min: 28, max: 40 },
    "Attack Speed": { min: 15, max: 20 },
    "Damage Taken Decrease": { min: 7, max: 10 },
    "Min Damage Multiplier": { min: 28, max: 40 },
    "Max Damage Multiplier": { min: 28, max: 40 },
    "Critical Rate": { min: 15, max: 20 },
    "Critical Resistance": { min: 22.5, max: 30 },
    "Damage": { min: 28, max: 40 },
    "Debuff Tolerance": { min: 18, max: 25 },
    "Main Stat": { min: 1500, max: 2500 },
    "Max HP": { min: 7e4, max: 115e3 },
    "Max MP": { min: 900, max: 1500 },
    "Accuracy": { min: 20, max: 25 },
    "Evasion": { min: 20, max: 25 },
    "MP Recovery Per Sec": { min: 80, max: 150 }
  },
  "Legendary": {
    lineRate: 5.2632,
    // Probability of getting a specific line within this rarity (%)
    "Meso Drop": { min: 5, max: 8 },
    "EXP Gain": { min: 5, max: 8 },
    "Defense Penetration": { min: 8, max: 12 },
    "Boss Monster Damage": { min: 18, max: 25 },
    "Normal Monster Damage": { min: 18, max: 25 },
    "Attack Speed": { min: 10, max: 14 },
    "Damage Taken Decrease": { min: 4, max: 6 },
    "Min Damage Multiplier": { min: 18, max: 25 },
    "Max Damage Multiplier": { min: 18, max: 25 },
    "Critical Rate": { min: 10, max: 14 },
    "Critical Resistance": { min: 15, max: 21 },
    "Damage": { min: 18, max: 25 },
    "Debuff Tolerance": { min: 14, max: 16 },
    "Main Stat": { min: 800, max: 1200 },
    "Max HP": { min: 35e3, max: 65e3 },
    "Max MP": { min: 500, max: 800 },
    "Accuracy": { min: 14, max: 16 },
    "Evasion": { min: 14, max: 16 },
    "MP Recovery Per Sec": { min: 40, max: 60 }
  },
  "Unique": {
    lineRate: 7.1429,
    // Probability of getting a specific line within this rarity (%)
    "Attack Speed": { min: 7, max: 9 },
    "Damage Taken Decrease": { min: 2, max: 3 },
    "Min Damage Multiplier": { min: 12, max: 15 },
    "Max Damage Multiplier": { min: 12, max: 15 },
    "Critical Rate": { min: 7, max: 9 },
    "Critical Resistance": { min: 10.5, max: 13.5 },
    "Damage": { min: 12, max: 15 },
    "Debuff Tolerance": { min: 10, max: 12 },
    "Main Stat": { min: 400, max: 700 },
    "Max HP": { min: 15e3, max: 3e4 },
    "Max MP": { min: 200, max: 400 },
    "Accuracy": { min: 10, max: 12 },
    "Evasion": { min: 10, max: 12 },
    "MP Recovery Per Sec": { min: 21, max: 30 }
  },
  "Epic": {
    lineRate: 8.3333,
    // Probability of getting a specific line within this rarity (%)
    "Min Damage Multiplier": { min: 7, max: 10 },
    "Max Damage Multiplier": { min: 7, max: 10 },
    "Critical Rate": { min: 3, max: 6 },
    "Critical Resistance": { min: 4.5, max: 9 },
    "Damage": { min: 7, max: 10 },
    "Debuff Tolerance": { min: 6, max: 8 },
    "Main Stat": { min: 200, max: 300 },
    "Max HP": { min: 4500, max: 9e3 },
    "Max MP": { min: 100, max: 150 },
    "Accuracy": { min: 6, max: 8 },
    "Evasion": { min: 6, max: 8 },
    "MP Recovery Per Sec": { min: 11, max: 20 }
  },
  "Rare": {
    lineRate: 12,
    // Probability of getting a specific line within this rarity (%)
    "Damage": { min: 3, max: 5 },
    "Damage Tolerance": { min: 4, max: 5 },
    "Main Stat": { min: 100, max: 150 },
    "Max HP": { min: 1800, max: 3e3 },
    "Max MP": { min: 50, max: 70 },
    "Accuracy": { min: 4, max: 5 },
    "Evasion": { min: 4, max: 5 },
    "MP Recovery Per Sec": { min: 6, max: 10 }
  },
  "Normal": {
    lineRate: 16.6667,
    // Probability of getting a specific line within this rarity (%)
    "Main Stat": { min: 40, max: 60 },
    "Max HP": { min: 1200, max: 1500 },
    "Max MP": { min: 30, max: 40 },
    "Accuracy": { min: 2, max: 3 },
    "Evasion": { min: 2, max: 3 },
    "MP Recovery Per Sec": { min: 3, max: 5 }
  }
};
const innerAbilityRarityRates = {
  1: {
    "Normal": 60,
    "Rare": 35,
    "Epic": 4.7,
    "Unique": 0.3,
    "Legendary": 0,
    "Mystic": 0
  },
  2: {
    "Normal": 59.3,
    "Rare": 35,
    "Epic": 5,
    "Unique": 0.7,
    "Legendary": 0,
    "Mystic": 0
  },
  3: {
    "Normal": 50,
    "Rare": 35,
    "Epic": 13.5,
    "Unique": 1.5,
    "Legendary": 0,
    "Mystic": 0
  },
  4: {
    "Normal": 40,
    "Rare": 35,
    "Epic": 22.5,
    "Unique": 2.5,
    "Legendary": 0,
    "Mystic": 0
  },
  5: {
    "Normal": 30,
    "Rare": 32,
    "Epic": 34.3,
    "Unique": 3.5,
    "Legendary": 0.2,
    "Mystic": 0
  },
  6: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 39,
    "Unique": 3.6,
    "Legendary": 0.4,
    "Mystic": 0
  },
  7: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 38.5,
    "Unique": 3.7,
    "Legendary": 0.8,
    "Mystic": 0
  },
  8: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 38.33,
    "Unique": 3.65,
    "Legendary": 1,
    "Mystic": 0.02
  },
  9: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 38.28,
    "Unique": 3.6,
    "Legendary": 1.09,
    "Mystic": 0.03
  },
  10: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 38.23,
    "Unique": 3.55,
    "Legendary": 1.18,
    "Mystic": 0.04
  },
  11: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 38.17,
    "Unique": 3.5,
    "Legendary": 1.27,
    "Mystic": 0.06
  },
  12: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 38.11,
    "Unique": 3.45,
    "Legendary": 1.36,
    "Mystic": 0.08
  },
  13: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 38.05,
    "Unique": 3.4,
    "Legendary": 1.45,
    "Mystic": 0.1
  },
  14: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 37.99,
    "Unique": 3.35,
    "Legendary": 1.54,
    "Mystic": 0.12
  },
  15: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 37.93,
    "Unique": 3.3,
    "Legendary": 1.63,
    "Mystic": 0.14
  },
  16: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 37.87,
    "Unique": 3.25,
    "Legendary": 1.72,
    "Mystic": 0.16
  },
  17: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 37.81,
    "Unique": 3.2,
    "Legendary": 1.81,
    "Mystic": 0.18
  },
  18: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 37.75,
    "Unique": 3.15,
    "Legendary": 1.9,
    "Mystic": 0.2
  },
  19: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 37.69,
    "Unique": 3.1,
    "Legendary": 1.99,
    "Mystic": 0.22
  },
  20: {
    "Normal": 25,
    "Rare": 32,
    "Epic": 37.63,
    "Unique": 3.05,
    "Legendary": 2.08,
    "Mystic": 0.24
  }
};
export {
  innerAbilitiesData,
  innerAbilityRarityRates,
  innerAbilityStats
};
//# sourceMappingURL=inner-ability-data.js.map
