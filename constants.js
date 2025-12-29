// Weapon rates per level calculated from provided data
const weaponRatesPerLevel = {
    'normal': { 't1': 0.0755, 't2': 0.064, 't3': 0.054, 't4': 0.0455 },
    'rare': { 't1': 0.1952, 't2': 0.1535, 't3': 0.1221, 't4': 0.0959 },
    'epic': { 't1': 0.5144, 't2': 0.6015, 't3': 0.4308, 't4': 0.3033 },
    'unique': { 't1': 1.5573, 't2': 2.7395, 't3': 0.8850, 't4': 0.6686 },
    'legendary': { 't1': 3.9490, 't2': 2.7297, 't3': 3.1824, 't4': 2.5734 },
    'mystic': { 't1': 5.5, 't2': 4.2, 't3': 4.8, 't4': 4.9322 },
    'ancient': { 't1': 6.5, 't2': 5.0, 't3': 5.5, 't4': 6.2 }
};

// Base attack % at level 1 for EQUIPPED weapons (from weapon invent attack formula.png)
const weaponBaseAttackEquipped = {
    'normal': { 't1': 25, 't2': 21, 't3': 18, 't4': 15 },
    'rare': { 't1': 61.1, 't2': 48.9, 't3': 39.1, 't4': 31.3 },
    'epic': { 't1': 149.3, 't2': 119.4, 't3': 95.5, 't4': 76.4 },
    'unique': { 't1': 426.4, 't2': 328, 't3': 252.3, 't4': 194.1 },
    'legendary': { 't1': 1217.8, 't2': 936.8, 't3': 720.6, 't4': 554.3 },
    'mystic': { 't1': 3810.6, 't2': 2865.1, 't3': 2154.2, 't4': 1619.7 },
    'ancient': { 't1': 2186.6, 't2': 2908.2, 't3': 3867.9, 't4': 5144.3 }
};

const tiers = ['t4', 't3', 't2', 't1'];
const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic', 'ancient'];

const availableStats = [
    { value: 'attack', label: 'Attack' },
    { value: 'crit-rate', label: 'Critical Rate (%)' },
    { value: 'crit-damage', label: 'Critical Damage (%)' },
    { value: 'skill-level', label: '3rd Job Skill Level (1 lvl = 0.3% Skill Coeff)' },
    { value: 'normal-damage', label: 'Normal Monster Damage (%)' },
    { value: 'boss-damage', label: 'Boss Monster Damage (%)' },
    { value: 'damage', label: 'Damage (%)' }
];

// Inner abilities stat names (extracted from inner_abilities.json)
const innerAbilityStats = [
    'Accuracy',
    'Attack Speed',
    'Boss Monster Damage',
    'Critical Rate',
    'Critical Resistance',
    'Damage',
    'Damage Taken Decrease',
    'Damage Tolerance',
    'Debuff Tolerance',
    'Defense Penetration',
    'EXP Gain',
    'Evasion',
    'Main Stat',
    'Max Damage Multiplier',
    'Max HP',
    'Max MP',
    'Meso Drop',
    'Min Damage Multiplier',
    'MP Recovery Per Sec',
    'Normal Monster Damage'
];

// Inner abilities data with min/max values per rarity
const innerAbilitiesData = {
	"Mystic": {
		"Meso Drop": { "min": 9, "max": 15 },
        "EXP Gain": { "min": 9, "max": 15 },
        "Defense Penetration": { "min": 14, "max": 20 },
        "Boss Monster Damage": { "min": 28, "max": 40 },
        "Normal Monster Damage": { "min": 28, "max": 40 },
        "Attack Speed": { "min": 15, "max": 20 },
        "Damage Taken Decrease": { "min": 7, "max": 10 },
        "Min Damage Multiplier": { "min": 28, "max": 40 },
        "Max Damage Multiplier": { "min": 28, "max": 40 },
        "Critical Rate": { "min": 15, "max": 20 },
        "Critical Resistance": { "min": 22.5, "max": 30 },
        "Damage": { "min": 28, "max": 40 },
        "Debuff Tolerance": { "min": 18, "max": 25 },
        "Main Stat": { "min": 1500, "max": 2500 },
        "Max HP": { "min": 70000, "max": 115000 },
        "Max MP": { "min": 900, "max": 1500 },
        "Accuracy": { "min": 20, "max": 25 },
        "Evasion": { "min": 20, "max": 25 },
        "MP Recovery Per Sec": { "min": 80, "max": 150 }
	},
    "Legendary": {
        "Meso Drop": { "min": 5, "max": 8 },
        "EXP Gain": { "min": 5, "max": 8 },
        "Defense Penetration": { "min": 8, "max": 12 },
        "Boss Monster Damage": { "min": 18, "max": 25 },
        "Normal Monster Damage": { "min": 18, "max": 25 },
        "Attack Speed": { "min": 10, "max": 14 },
        "Damage Taken Decrease": { "min": 4, "max": 6 },
        "Min Damage Multiplier": { "min": 18, "max": 25 },
        "Max Damage Multiplier": { "min": 18, "max": 25 },
        "Critical Rate": { "min": 10, "max": 14 },
        "Critical Resistance": { "min": 15, "max": 21 },
        "Damage": { "min": 18, "max": 25 },
        "Debuff Tolerance": { "min": 14, "max": 16 },
        "Main Stat": { "min": 800, "max": 1200 },
        "Max HP": { "min": 35000, "max": 65000 },
        "Max MP": { "min": 500, "max": 800 },
        "Accuracy": { "min": 14, "max": 16 },
        "Evasion": { "min": 14, "max": 16 },
        "MP Recovery Per Sec": { "min": 40, "max": 60 }
    },
    "Unique": {
        "Attack Speed": { "min": 7, "max": 9 },
        "Damage Taken Decrease": { "min": 2, "max": 3 },
        "Min Damage Multiplier": { "min": 12, "max": 15 },
        "Max Damage Multiplier": { "min": 12, "max": 15 },
        "Critical Rate": { "min": 7, "max": 9 },
        "Critical Resistance": { "min": 10.5, "max": 13.5 },
        "Damage": { "min": 12, "max": 15 },
        "Debuff Tolerance": { "min": 10, "max": 12 },
        "Main Stat": { "min": 400, "max": 700 },
        "Max HP": { "min": 15000, "max": 30000 },
        "Max MP": { "min": 200, "max": 400 },
        "Accuracy": { "min": 10, "max": 12 },
        "Evasion": { "min": 10, "max": 12 },
        "MP Recovery Per Sec": { "min": 21, "max": 30 }
    },
    "Epic": {
        "Min Damage Multiplier": { "min": 7, "max": 10 },
        "Max Damage Multiplier": { "min": 7, "max": 10 },
        "Critical Rate": { "min": 3, "max": 6 },
        "Critical Resistance": { "min": 4.5, "max": 9 },
        "Damage": { "min": 7, "max": 10 },
        "Debuff Tolerance": { "min": 6, "max": 8 },
        "Main Stat": { "min": 200, "max": 300 },
        "Max HP": { "min": 4500, "max": 9000 },
        "Max MP": { "min": 100, "max": 150 },
        "Accuracy": { "min": 6, "max": 8 },
        "Evasion": { "min": 6, "max": 8 },
        "MP Recovery Per Sec": { "min": 11, "max": 20 }
    },
    "Rare": {
        "Damage": { "min": 3, "max": 5 },
        "Damage Tolerance": { "min": 4, "max": 5 },
        "Main Stat": { "min": 100, "max": 150 },
        "Max HP": { "min": 1800, "max": 3000 },
        "Max MP": { "min": 50, "max": 70 },
        "Accuracy": { "min": 4, "max": 5 },
        "Evasion": { "min": 4, "max": 5 },
        "MP Recovery Per Sec": { "min": 6, "max": 10 }
    },
    "Normal": {
        "Main Stat": { "min": 40, "max": 60 },
        "Max HP": { "min": 1200, "max": 1500 },
        "Max MP": { "min": 30, "max": 40 },
        "Accuracy": { "min": 2, "max": 3 },
        "Evasion": { "min": 2, "max": 3 },
        "MP Recovery Per Sec": { "min": 3, "max": 5 }
    }
};

// Artifact Potential data with values per rarity
const artifactPotentialData = {
    "Mystic": {
        "Main Stat %": 10,
        "Damage Taken Decrease %": 5,
        "Defense %": 10,
        "Accuracy": 10,
        "Critical Rate %": 10,
        "Min Damage Multiplier %": 10,
        "Max Damage Multiplier %": 10,
        "Boss Monster Damage %": 20,
        "Normal Monster Damage %": 20,
        "Status Effect Damage %": 20,
        "Damage %": 20,
        "Defense Penetration %": 10,
        "Main Stat % (prime)": 12,
        "Damage Taken Decrease % (prime)": 6,
        "Defense % (prime)": 12,
        "Accuracy (prime)": 12,
        "Critical Rate % (prime)": 12,
        "Min Damage Multiplier % (prime)": 12,
        "Max Damage Multiplier % (prime)": 12,
        "Boss Monster Damage % (prime)": 24,
        "Normal Monster Damage % (prime)": 24,
        "Status Effect Damage % (prime)": 24,
        "Damage % (prime)": 24,
        "Defense Penetration % (prime)": 12
    },
    "Legendary": {
        "Main Stat %": 7,
        "Damage Taken Decrease %": 3.5,
        "Defense %": 7,
        "Accuracy": 7,
        "Critical Rate %": 7,
        "Min Damage Multiplier %": 7,
        "Max Damage Multiplier %": 7,
        "Boss Monster Damage %": 14,
        "Normal Monster Damage %": 14,
        "Status Effect Damage %": 14,
        "Damage %": 14,
        "Defense Penetration %": 7
    },
    "Unique": {
        "Main Stat %": 4.5,
        "Damage Taken Decrease %": 2.3,
        "Defense %": 4.5,
        "Accuracy": 4,
        "Critical Rate %": 4.5,
        "Min Damage Multiplier %": 4.5,
        "Max Damage Multiplier %": 4.5,
        "Boss Monster Damage %": 9,
        "Normal Monster Damage %": 9,
        "Status Effect Damage %": 9,
        "Damage %": 9,
        "Defense Penetration %": 4.5
    },
    "Epic": {
        "Main Stat %": 3,
        "Damage Taken Decrease %": 1.5,
        "Defense %": 3,
        "Accuracy": 3,
        "Critical Rate %": 3,
        "Min Damage Multiplier %": 3,
        "Max Damage Multiplier %": 3,
        "Boss Monster Damage %": 6,
        "Normal Monster Damage %": 6,
        "Status Effect Damage %": 6,
        "Damage %": 6,
        "Defense Penetration %": 3
    },
    "Rare": {
        "Main Stat %": 2,
        "Damage Taken Decrease %": 1,
        "Defense %": 2,
        "Accuracy": 2,
        "Critical Rate %": 2,
        "Min Damage Multiplier %": 2,
        "Max Damage Multiplier %": 2,
        "Boss Monster Damage %": 4,
        "Normal Monster Damage %": 4,
        "Status Effect Damage %": 4,
        "Damage %": 4,
        "Defense Penetration %": 2
    }
};

// Rarity colors
const rarityColors = {
    'Legendary': '#33ce85',
    'Unique': '#ffd26d',
    'Epic': '#9966ff',
    'Rare': '#6699ff',
    'Normal': '#ffffff',
    'Mystic': '#ff3f42',
    'Ancient': '#3882ff'
};

// Artifacts data
const artifactsData = [
    {
        name: "Charm of the undead",
        imageName: "charm-of-the-undead.png",
        descriptions: [
            "Attack by 10% for 5 sec every 10 sec",
            "Attack by 12% for 5 sec every 10 sec",
            "Attack by 14% for 5 sec every 10 sec",
            "Attack by 16% for 5 sec every 10 sec",
            "Attack by 18% for 5 sec every 10 sec",
            "Attack by 20% for 5 sec every 10 sec"
        ]
    },
    {
        name: "Contract of Darkness",
        imageName: "contract-of-darkness.png",
        descriptions: [
            "When attacking a boss, increases criticial rate by 8%",
            "When attacking a boss, increases criticial rate by 9.6%",
            "When attacking a boss, increases criticial rate by 11.2%",
            "When attacking a boss, increases criticial rate by 12.8%",
            "When attacking a boss, increases criticial rate by 14.4%",
            "When attacking a boss, increases criticial rate by 16%"
        ]
    },
    {
        name: "Rainbow-colored Snail Shell",
        imageName: "rainbow-snail-shell.png",
        descriptions: [
            "At the start of battle, increases Critical Rate by 15% and Critical Damage by 20% for 15 sec",
            "At the start of battle, increases Critical Rate by 18% and Critical Damage by 24% for 15 sec",
            "At the start of battle, increases Critical Rate by 21% and Critical Damage by 28% for 15 sec",
            "At the start of battle, increases Critical Rate by 24% and Critical Damage by 32% for 15 sec",
            "At the start of battle, increases Critical Rate by 27% and Critical Damage by 36% for 15 sec",
            "At the start of battle, increases Critical Rate by 30% and Critical Damage by 40% for 15 sec"
        ]
    },
    {
        name: "Hexagon Necklace",
        imageName: "hexagon-necklace.png",
        descriptions: [
            "Increases damage by 15% of the current value for 30 sec every 20 sec. This effect stacks up to 3 times.",
            "Increases damage by 18% of the current value for 30 sec every 20 sec. This effect stacks up to 3 times.",
            "Increases damage by 21% of the current value for 30 sec every 20 sec. This effect stacks up to 3 times.",
            "Increases damage by 24% of the current value for 30 sec every 20 sec. This effect stacks up to 3 times.",
            "Increases damage by 27% of the current value for 30 sec every 20 sec. This effect stacks up to 3 times.",
            "Increases damage by 30% of the current value for 30 sec every 20 sec. This effect stacks up to 3 times."
        ]
    },
    {
        name: "Arwen's Glass Shoes",
        imageName: "arwen-glass-shoe.png",
        descriptions: [
            "Increases the summoning duration of Companions by 20%",
            "Increases the summoning duration of Companions by 24%",
            "Increases the summoning duration of Companions by 28%",
            "Increases the summoning duration of Companions by 32%",
            "Increases the summoning duration of Companions by 36%",
            "Increases the summoning duration of Companions by 40%"
        ]
    },
    {
        name: "Mushmom's Cap",
        imageName: "mushmom-hat.png",
        descriptions: [
            "Increases accuracy by 5, and when attacking increases damage by 1% for each Accuracy exceeding the target's Evasion. This is applied up to 20%",
            "Increases accuracy by 6, and when attacking increases damage by 1.2% for each Accuracy exceeding the target's Evasion. This is applied up to 24%",
            "Increases accuracy by 7, and when attacking increases damage by 1.4% for each Accuracy exceeding the target's Evasion. This is applied up to 28%",
            "Increases accuracy by 8, and when attacking increases damage by 1.6% for each Accuracy exceeding the target's Evasion. This is applied up to 32%",
            "Increases accuracy by 9, and when attacking increases damage by 1.8% for each Accuracy exceeding the target's Evasion. This is applied up to 36%",
            "Increases accuracy by 10, and when attacking increases damage by 2% for each Accuracy exceeding the target's Evasion. This is applied up to 40%"
        ]
    },
    {
        name: "Clear Spring Water",
        imageName: "clear-spring-water.png",
        descriptions: [
            "[Growth Dungeon] Increases Final Damage in battle by 10%.",
            "[Growth Dungeon] Increases Final Damage in battle by 12%.",
            "[Growth Dungeon] Increases Final Damage in battle by 14%.",
            "[Growth Dungeon] Increases Final Damage in battle by 16%.",
            "[Growth Dungeon] Increases Final Damage in battle by 18%.",
            "[Growth Dungeon] Increases Final Damage in battle by 20%."
        ]
    },
    {
        name: "Athena Pierce's Old Gloves",
        imageName: "helena-glove.png",
        descriptions: [
            "Increases Attack Speed by 8% and Max Damage Multiplier by 25% of Attack Speed",
            "Increases Attack Speed by 9.6% and Max Damage Multiplier by 30% of Attack Speed",
            "Increases Attack Speed by 11.2% and Max Damage Multiplier by 35% of Attack Speed",
            "Increases Attack Speed by 12.8% and Max Damage Multiplier by 40% of Attack Speed",
            "Increases Attack Speed by 14.4% and Max Damage Multiplier by 45% of Attack Speed",
            "Increases Attack Speed by 16% and Max Damage Multiplier by 50% of Attack Speed"
        ]
    },
    {
        name: "Chalice",
        imageName: "holy-grail.png",
        descriptions: [
            "When defeating a target, increases Final Damage by 15% for 30 sec with a 2% chance. Activates with a 100% chance if the defeeated target is a boss.",
            "When defeating a target, increases Final Damage by 18% for 30 sec with a 2% chance. Activates with a 100% chance if the defeeated target is a boss.",
            "When defeating a target, increases Final Damage by 21% for 30 sec with a 2% chance. Activates with a 100% chance if the defeeated target is a boss.",
            "When defeating a target, increases Final Damage by 24% for 30 sec with a 2% chance. Activates with a 100% chance if the defeeated target is a boss.",
            "When defeating a target, increases Final Damage by 27% for 30 sec with a 2% chance. Activates with a 100% chance if the defeeated target is a boss.",
            "When defeating a target, increases Final Damage by 30% for 30 sec with a 2% chance. Activates with a 100% chance if the defeeated target is a boss."
        ]
    },
    {
        name: "Old Music Box",
        imageName: "old-music-box.png",
        descriptions: [
            "When inflicted with debuffs, removes 1 debuff(s) and increases attack by 25% for 25 sec. Cooldown: 20 sec",
            "When inflicted with debuffs, removes 1 debuff(s) and increases attack by 30% for 25 sec. Cooldown: 20 sec",
            "When inflicted with debuffs, removes 1 debuff(s) and increases attack by 35% for 25 sec. Cooldown: 20 sec",
            "When inflicted with debuffs, removes 1 debuff(s) and increases attack by 40% for 25 sec. Cooldown: 20 sec",
            "When inflicted with debuffs, removes 1 debuff(s) and increases attack by 45% for 25 sec. Cooldown: 20 sec",
            "When inflicted with debuffs, removes 1 debuff(s) and increases attack by 50% for 25 sec. Cooldown: 20 sec"
        ]
    },
    {
        name: "Silver Pendant",
        imageName: "silver-pendant.png",
        descriptions: [
            "When attacking, increases the target's damage taken by 10% for 5 sec and decreases their HP Recovery by 5% for 30 sec with a 15% chance. This is applied individually up to 5 times.",
            "When attacking, increases the target's damage taken by 12% for 5 sec and decreases their HP Recovery by 6% for 30 sec with a 15% chance. This is applied individually up to 5 times.",
            "When attacking, increases the target's damage taken by 14% for 5 sec and decreases their HP Recovery by 7% for 30 sec with a 15% chance. This is applied individually up to 5 times.",
            "When attacking, increases the target's damage taken by 16% for 5 sec and decreases their HP Recovery by 8% for 30 sec with a 15% chance. This is applied individually up to 5 times.",
            "When attacking, increases the target's damage taken by 18% for 5 sec and decreases their HP Recovery by 9% for 30 sec with a 15% chance. This is applied individually up to 5 times.",
            "When attacking, increases the target's damage taken by 20% for 5 sec and decreases their HP Recovery by 10% for 30 sec with a 15% chance. This is applied individually up to 5 times."
        ]
    },
    {
        name: "Star Rock",
        imageName: "star-rock.png",
        descriptions: [
            "Increases damage taken by 20% and Boss Monster Damage by 50%.",
            "Increases damage taken by 24% and Boss Monster Damage by 60%.",
            "Increases damage taken by 28% and Boss Monster Damage by 70%.",
            "Increases damage taken by 32% and Boss Monster Damage by 80%.",
            "Increases damage taken by 36% and Boss Monster Damage by 90%.",
            "Increases damage taken by 40% and Boss Monster Damage by 100%."
        ]
    },
    {
        name: "The Book of Ancient",
        imageName: "ancient-book.png",
        descriptions: [
            "Increases Critical Rate by 10% and Critical Damage by 30% of Critical Rate.",
            "Increases Critical Rate by 12% and Critical Damage by 36% of Critical Rate.",
            "Increases Critical Rate by 14% and Critical Damage by 42% of Critical Rate.",
            "Increases Critical Rate by 16% and Critical Damage by 48% of Critical Rate.",
            "Increases Critical Rate by 18% and Critical Damage by 54% of Critical Rate.",
            "Increases Critical Rate by 20% and Critical Damage by 60% of Critical Rate."
        ]
    },
    {
        name: "Lunar Dew",
        imageName: "lunar-dew.png",
        descriptions: [
            "When taking damage, recovers 3% HP and becomes immune to damage for 1 sec with a 5% chance. Cooldown 5 sec",
            "When taking damage, recovers 3.6% HP and becomes immune to damage for 1.2 sec with a 5% chance. Cooldown 5 sec",
            "When taking damage, recovers 4.2% HP and becomes immune to damage for 1.4 sec with a 5% chance. Cooldown 5 sec",
            "When taking damage, recovers 4.8% HP and becomes immune to damage for 1.6 sec with a 5% chance. Cooldown 5 sec",
            "When taking damage, recovers 5.4% HP and becomes immune to damage for 1.8 sec with a 5% chance. Cooldown 5 sec",
            "When taking damage, recovers 6% HP and becomes immune to damage for 2 sec with a 5% chance. Cooldown 5 sec"
        ]
    },
    {
        name: "Fire Flower",
        imageName: "fire-herb.png",
        descriptions: [
            "For every every nearby target, increases Final Damage by 1%. This is applied up to 10 targets.",
            "For every every nearby target, increases Final Damage by 1.2%. This is applied up to 10 targets.",
            "For every every nearby target, increases Final Damage by 1.4%. This is applied up to 10 targets.",
            "For every every nearby target, increases Final Damage by 1.6%. This is applied up to 10 targets.",
            "For every every nearby target, increases Final Damage by 1.8%. This is applied up to 10 targets.",
            "For every every nearby target, increases Final Damage by 2%. This is applied up to 10 targets."
        ]
    },
    {
        name: "Soul Contract",
        imageName: "soul-contract.png",
        descriptions: [
            "[Chapter Hunt] Decreases skill cooldown in battle by 20%.",
            "[Chapter Hunt] Decreases skill cooldown in battle by 24%.",
            "[Chapter Hunt] Decreases skill cooldown in battle by 28%.",
            "[Chapter Hunt] Decreases skill cooldown in battle by 32%.",
            "[Chapter Hunt] Decreases skill cooldown in battle by 36%.",
            "[Chapter Hunt] Decreases skill cooldown in battle by 40%."
        ]
    },
    {
        name: "Lit Lamp",
        imageName: "lit-lamp.png",
        descriptions: [
            "[World Boss] Increases Final Damage in battle by 20%",
            "[World Boss] Increases Final Damage in battle by 24%",
            "[World Boss] Increases Final Damage in battle by 28%",
            "[World Boss] Increases Final Damage in battle by 32%",
            "[World Boss] Increases Final Damage in battle by 36%",
            "[World Boss] Increases Final Damage in battle by 40%"
        ]
    },
    {
        name: "Soul Pouch",
        imageName: "soul-pouch.png",
        descriptions: [
            "[Arena] Increases Final Damage in battle by 20%",
            "[Arena] Increases Final Damage in battle by 24%",
            "[Arena] Increases Final Damage in battle by 28%",
            "[Arena] Increases Final Damage in battle by 32%",
            "[Arena] Increases Final Damage in battle by 36%",
            "[Arena] Increases Final Damage in battle by 40%"
        ]
    },
    {
        name: "Ancient Text Piece",
        imageName: "ancient-text-piece.png",
        descriptions: [
            "[Guild Conquest] Increases Final Damage in battle by 20%",
            "[Guild Conquest] Increases Final Damage in battle by 24%",
            "[Guild Conquest] Increases Final Damage in battle by 28%",
            "[Guild Conquest] Increases Final Damage in battle by 32%",
            "[Guild Conquest] Increases Final Damage in battle by 36%",
            "[Guild Conquest] Increases Final Damage in battle by 40%"
        ]
    },
    {
        name: "Icy Soul Rock",
        imageName: "icy-soul-rock.png",
        descriptions: [
            "Recovers 1% MP every 2 sec. When your MP is 50% or higher, increases Critical Damage by 20%, and when your MP is 75% or higher, the effect is doubled.",
            "Recovers 1% MP every 2 sec. When your MP is 50% or higher, increases Critical Damage by 24%, and when your MP is 75% or higher, the effect is doubled.",
            "Recovers 1% MP every 2 sec. When your MP is 50% or higher, increases Critical Damage by 28%, and when your MP is 75% or higher, the effect is doubled.",
            "Recovers 1% MP every 2 sec. When your MP is 50% or higher, increases Critical Damage by 32%, and when your MP is 75% or higher, the effect is doubled.",
            "Recovers 1% MP every 2 sec. When your MP is 50% or higher, increases Critical Damage by 36%, and when your MP is 75% or higher, the effect is doubled.",
            "Recovers 1% MP every 2 sec. When your MP is 50% or higher, increases Critical Damage by 40%, and when your MP is 75% or higher, the effect is doubled."
        ]
    },
    {
        name: "Flaming Lava",
        imageName: "flaming-lava.png",
        descriptions: [
            "When attacking, if the target has a buff that is not a barrier, increases Final Damage by 4%; if the target has a debuff, increases by 8%; if the target has a barrier, increases by 60%.",
            "When attacking, if the target has a buff that is not a barrier, increases Final Damage by 4.8%; if the target has a debuff, increases by 9.6%; if the target has a barrier, increases by 72%.",
            "When attacking, if the target has a buff that is not a barrier, increases Final Damage by 5.6%; if the target has a debuff, increases by 11.2%; if the target has a barrier, increases by 84%.",
            "When attacking, if the target has a buff that is not a barrier, increases Final Damage by 6.4%; if the target has a debuff, increases by 12.8%; if the target has a barrier, increases by 96%.",
            "When attacking, if the target has a buff that is not a barrier, increases Final Damage by 7.2%; if the target has a debuff, increases by 14.4%; if the target has a barrier, increases by 108%.",
            "When attacking, if the target has a buff that is not a barrier, increases Final Damage by 8%; if the target has a debuff, increases by 16%; if the target has a barrier, increases by 120%."
        ]
    },
    {
        name: "Sayram's Necklace",
        imageName: "seyran-necklace.png",
        descriptions: [
            "When there are 2 or more nearby targets, increases Normal Monster Damage by 30%. When there is 1 target, increases Boss Monster Damage by 10%.",
            "When there are 2 or more nearby targets, increases Normal Monster Damage by 36%. When there is 1 target, increases Boss Monster Damage by 12%.",
            "When there are 2 or more nearby targets, increases Normal Monster Damage by 42%. When there is 1 target, increases Boss Monster Damage by 14%.",
            "When there are 2 or more nearby targets, increases Normal Monster Damage by 48%. When there is 1 target, increases Boss Monster Damage by 16%.",
            "When there are 2 or more nearby targets, increases Normal Monster Damage by 54%. When there is 1 target, increases Boss Monster Damage by 18%.",
            "When there are 2 or more nearby targets, increases Normal Monster Damage by 60%. When there is 1 target, increases Boss Monster Damage by 20%."
        ]
    }
];

// Stage defense data
const stageDefenses = {
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
let comparisonItemCount = 0;
let equippedStatCount = 0;
