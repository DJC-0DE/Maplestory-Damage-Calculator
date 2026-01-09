// Auto-generated from abilities.txt
// This file contains passive skill data for all classes

export const HERO_SKILLS = {
    IRON_BODY: {
        name: "Iron Body",
        jobStep: 1,
        skillIndex: 11030,
        effects: [
            {
                stat: "defense",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "mainStat",
                baseValue: 30,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    WEAPON_MASTERY: {
        name: "Weapon Mastery",
        jobStep: 2,
        skillIndex: 12050,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    WEAPON_ACCELERATION: {
        name: "Weapon Acceleration",
        jobStep: 2,
        skillIndex: 12060,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    PHYSICAL_TRAINING: {
        name: "Physical Training",
        jobStep: 2,
        skillIndex: 12080,
        effects: [
            {
                stat: "basicAttackDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true
    },    
    FINAL_ATTACK: {
        name: "Final Attack",
        jobStep: 2,
        skillIndex: 12070,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 350,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true
    },
    CHANCE_ATTACK: {
        name: "Chance Attack",
        jobStep: 3,
        skillIndex: 13070,
        effects: [
            {
                stat: "critRate",
                baseValue: 80,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    CHANCE_ATTACK_STATUSDAMAGE: {
        name: "Chance Attack",
        jobStep: 3,
        skillIndex: 13070,
        effects: [
            {
                stat: "statusDamage",
                baseValue: 120,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true
    },
    ADVANCED_FINAL_ATTACK: {
        name: "Advanced Final Attack",
        jobStep: 4,
        skillIndex: 14080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 5000,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true
    },
    ENRAGE: {
        name: "Enrage",
        jobStep: 4,
        skillIndex: 14050,
        effects: [
            {
                stat: "critDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "finalDamage",
                baseValue: 120,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Triggered every 10s, lasts 5s",
    },
    COMBAT_MASTERY: {
        name: "Combat Mastery",
        jobStep: 4,
        skillIndex: 14090,
        effects: [
            {
                stat: "maxDamage",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    COMBAT_MASTERY_SKILLDAMAGE: {
        name: "Combat Mastery (Skill Damage)",
        jobStep: 4,
        skillIndex: 14090,
        effects: [
            {
                stat: "skillDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    POWER_STANCE: {
        name: "Power Stance",
        jobStep: 4,
        skillIndex: 14070,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
};

export const DARK_KNIGHT_SKILLS = {
    IRON_BODY: {
        name: "Iron Body",
        jobStep: 1,
        skillIndex: 31030,
        effects: [
            {
                stat: "defense",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "mainStat",
                baseValue: 30,
                factorIndex: 22,
                type: "flat"
            },
        ],
    },
    WEAPON_MASTERY: {
        name: "Weapon Mastery",
        jobStep: 2,
        skillIndex: 32060,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    WEAPON_ACCELERATION: {
        name: "Weapon Acceleration",
        jobStep: 2,
        skillIndex: 32070,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },    
    FINAL_ATTACK: {
        name: "Final Attack",
        jobStep: 2,
        skillIndex: 32080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 350,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true
    },
    LORD_OF_DARKNESS: {
        name: "Lord of Darkness",
        jobStep: 3,
        skillIndex: 33070,
        effects: [
           {
               stat: "critRate",
               baseValue: 80,
               factorIndex: 22,
               type: "percent"
           },
           {
               stat: "critDamage",
               baseValue: 300,
               factorIndex: 22,
               type: "percent"
           },
        ],
    },
    POWER_STANCE: {
        name: "Power Stance",
        jobStep: 4,
        skillIndex: 34090,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    ADVANCED_FINAL_ATTACK: {
        name: "Advanced Final Attack",
        jobStep: 4,
        skillIndex: 34080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 5000,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true
    },
    BARRICADE_MASTER_SKILLDAMAGE: {
        name: "Barricade Mastery (Skill Damage)",
        jobStep: 4,
        skillIndex: 34090,
        effects: [
            {
                stat: "skillDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true
    },
    BARRICADE_MASTER_MAXDAMAGE: {
        name: "Barricade Mastery (Max Damage)",
        jobStep: 4,
        skillIndex: 34090,
        effects: [
            {
                stat: "maxDamage",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: false
    },
    FINAL_PACT: {
        name: "Final Pact",
        jobStep: 4,
        skillIndex: 34090,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: false
    },
};

export const ARCH_MAGE_IL_SKILLS = {
    MAGIC_GUARD: {
        name: "Magic Guard",
        jobStep: 1,
        skillIndex: 41030,
        effects: [
            {
                stat: "attack",
                baseValue: 120,
                factorIndex: 21,
                type: "percent"
            },
            {
                stat: "defense",
                baseValue: 120,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Active buff, 15 sec duration",
    },
    MAGIC_ACCELERATION: {
        name: "Magic Acceleration",
        jobStep: 2,
        skillIndex: 42050,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    SPELL_MASTERY: {
        name: "Spell Mastery",
        jobStep: 2,
        skillIndex: 42060,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    HIGH_WISDOM: {
        name: "High Wisdom",
        jobStep: 2,
        skillIndex: 42070,
        effects: [
            {
                stat: "critRate",
                baseValue: 80,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    ELEMENTAL_ADAPTING: {
        name: "Elemental Adapting",
        jobStep: 3,
        skillIndex: 43050,
        effects: [
            {
                stat: "defense",
                baseValue: 20,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Provides debuff immunity via periodic shroud",
    },
    MAGIC_CRITICAL: {
        name: "Magic Critical",
        jobStep: 3,
        skillIndex: 43070,
        effects: [
            {
                stat: "critRate",
                baseValue: 80,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "critDamage",
                baseValue: 120,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    ELEMENT_AMPLIFICATION: {
        name: "Element Amplification",
        jobStep: 3,
        skillIndex: 43080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Requires MP >= 50%, costs 10% extra MP",
    },
    BUFF_MASTERY: {
        name: "Buff Mastery",
        jobStep: 4,
        skillIndex: 44070,
        effects: [
              {
                stat: "buffDuration",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Extends buff duration by 10%",
    },
    ARCANE_AIM: {
        name: "Arcane Aim",
        jobStep: 4,
        skillIndex: 44080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "25% chance for 3% final damage, stacks 5x for 10 sec",
    },
    INFINITY: {
        name: "Infinity",
        jobStep: 4,
        skillIndex: 44090,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 30,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Active buff: +15% base, +1% per sec (10 stacks max), 15 sec duration",
    },
};

export const ARCH_MAGE_FP_SKILLS = {
    MAGIC_GUARD: {
        name: "Magic Guard",
        jobStep: 1,
        skillIndex: 51030,
        effects: [
            {
                stat: "attack",
                baseValue: 120,
                factorIndex: 21,
                type: "percent"
            },
            {
                stat: "defense",
                baseValue: 120,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Active buff, 15 sec duration",
    },
    NIMBLE_FEET: {
        name: "Nimble Feet",
        jobStep: 1,
        skillIndex: 51040,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Active buff, 15 sec duration, also +10% speed",
    },
    MAGIC_ACCELERATION: {
        name: "Magic Acceleration",
        jobStep: 2,
        skillIndex: 52050,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    SPELL_MASTERY: {
        name: "Spell Mastery",
        jobStep: 2,
        skillIndex: 52070,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    MEDITATION: {
        name: "Meditation",
        jobStep: 2,
        skillIndex: 52080,
        effects: [
            {
                stat: "attack",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Active buff, increases party attack by 20% for 15 sec",
    },
    ELEMENTAL_ADAPTING: {
        name: "Elemental Adapting",
        jobStep: 3,
        skillIndex: 53050,
        effects: [
            {
                stat: "defense",
                baseValue: 20,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Provides debuff immunity via periodic shroud",
    },
    MAGIC_CRITICAL: {
        name: "Magic Critical",
        jobStep: 3,
        skillIndex: 53070,
        effects: [
            {
                stat: "critRate",
                baseValue: 80,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "critDamage",
                baseValue: 120,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    ELEMENT_AMPLIFICATION: {
        name: "Element Amplification",
        jobStep: 3,
        skillIndex: 53080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Requires MP >= 50%, costs 10% extra MP",
    },
    BUFF_MASTERY: {
        name: "Buff Mastery",
        jobStep: 4,
        skillIndex: 54070,
        effects: [
              {
                stat: "buffDuration",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Extends buff duration by 10%",
    },
    ARCANE_AIM: {
        name: "Arcane Aim",
        jobStep: 4,
        skillIndex: 54080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "25% chance for 3% final damage, stacks 5x for 10 sec",
    },
    INFINITY: {
        name: "Infinity",
        jobStep: 4,
        skillIndex: 54090,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 30,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Active buff: +15% base, +1% per sec (10 stacks max), 15 sec duration",
    },
};

export const BOWMASTER_SKILLS = {
    CRITICAL_SHOT: {
        name: "Critical Shot",
        jobStep: 1,
        skillIndex: 71030,
        effects: [
            {
                stat: "critRate",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    ARCHER_MASTERY: {
        name: "Archer Mastery",
        jobStep: 1,
        skillIndex: 71040,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    BOW_ACCELERATION: {
        name: "Bow Acceleration",
        jobStep: 2,
        skillIndex: 72040,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    BOW_MASTERY: {
        name: "Bow Mastery",
        jobStep: 2,
        skillIndex: 72060,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    FINAL_ATTACK_BOW: {
        name: "Final Attack: Bow",
        jobStep: 2,
        skillIndex: 72070,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 350,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "25% chance to trigger",
    },
    PHYSICAL_TRAINING: {
        name: "Physical Training",
        jobStep: 2,
        skillIndex: 72080,
        effects: [
            {
                stat: "basicAttackDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    EXTREME_ARCHERY_BOW: {
        name: "Extreme Archery: Bow",
        jobStep: 3,
        skillIndex: 73050,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Reduces defense by 10%",
    },
    MORTAL_BLOW: {
        name: "Mortal Blow",
        jobStep: 3,
        skillIndex: 73060,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "After 50 hits, grants 10% final damage for 5 sec",
    },
    MARKSMANSHIP: {
        name: "Marksmanship",
        jobStep: 3,
        skillIndex: 73020,
        effects: [
            {
                stat: "attack",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "20% attack increase against single target",
    },
    ADVANCED_FINAL_ATTACK: {
        name: "Advanced Final Attack",
        jobStep: 4,
        skillIndex: 74060,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 5000,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    ILLUSION_STEP: {
        name: "Illusion Step",
        jobStep: 4,
        skillIndex: 74070,
        effects: [
            {
                stat: "attack",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Alternates with evasion/defense phases",
    },
    ARMOR_BREAK: {
        name: "Armor Break",
        jobStep: 4,
        skillIndex: 74080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ]
    },    
    ARMOR_BREAK_DEFENSEIGNORE: {
        name: "Armor Break (Defense Ignore)",
        jobStep: 4,
        skillIndex: 74080,
        effects: [
            {
                stat: "defenseIgnore",
                baseValue: 100,
                factorIndex: 22,
                type: "percent",
            },
        ],
        isComplex: true
    },
    BOW_EXPERT: {
        name: "Bow Expert",
        jobStep: 4,
        skillIndex: 74090,
        effects: [
            {
                stat: "skillDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "maxDamage",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
};

export const MARKSMAN_SKILLS = {
    CRITICAL_SHOT: {
        name: "Critical Shot",
        jobStep: 1,
        skillIndex: 81030,
        effects: [
            {
                stat: "critRate",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    ARCHER_MASTERY: {
        name: "Archer Mastery",
        jobStep: 1,
        skillIndex: 81040,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    AGILE_CROSSBOWS: {
        name: "Agile Crossbows",
        jobStep: 2,
        skillIndex: 82030,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    SOUL_ARROW_CROSSBOW: {
        name: "Soul Arrow: Crossbow",
        jobStep: 2,
        skillIndex: 82040,
        effects: [
            {
                stat: "attack",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true
    },
    CROSSBOW_MASTERY: {
        name: "Crossbow Mastery",
        jobStep: 2,
        skillIndex: 82050,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    FINAL_ATTACK_CROSSBOW: {
        name: "Final Attack: Crossbow",
        jobStep: 2,
        skillIndex: 82060,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 350,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "25% chance to trigger",
    },
    PHYSICAL_TRAINING: {
        name: "Physical Training",
        jobStep: 2,
        skillIndex: 82070,
        effects: [
            {
                stat: "basicAttackDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    NIMBLE_FEET: {
        name: "Nimble Feet",
        jobStep: 2,
        skillIndex: 82080,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Active buff, 15 sec duration, also +10% speed",
    },
    EXTREME_ARCHERY_CROSSBOW: {
        name: "Extreme Archery: Crossbow",
        jobStep: 3,
        skillIndex: 83050,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Reduces defense by 10%",
    },
    MORTAL_BLOW: {
        name: "Mortal Blow",
        jobStep: 3,
        skillIndex: 83060,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "After 50 hits, grants 10% final damage for 5 sec",
    },
    MARKSMANSHIP: {
        name: "Marksmanship",
        jobStep: 3,
        skillIndex: 83070,
        effects: [
            {
                stat: "attack",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "20% attack increase against single target",
    },
    ADVANCED_FINAL_ATTACK: {
        name: "Advanced Final Attack",
        jobStep: 4,
        skillIndex: 84060,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 5000,
                factorIndex: 21,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    ILLUSION_STEP: {
        name: "Illusion Step",
        jobStep: 4,
        skillIndex: 84070,
        effects: [
            {
                stat: "attack",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Alternates with evasion/defense phases",
    },
    LAST_MAN_STANDING: {
        name: "Last Man Standing",
        jobStep: 4,
        skillIndex: 84080,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "15% final damage, +5% vs single enemy",
    },
    CROSSBOW_EXPERT: {
        name: "Crossbow Expert",
        jobStep: 4,
        skillIndex: 84090,
        effects: [
            {
                stat: "skillDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "maxDamage",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
};

export const NIGHT_LORD_SKILLS = {
    AGILE_CLAWS: {
        name: "Agile Claws",
        jobStep: 2,
        skillIndex: 92050,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    CLAW_MASTERY: {
        name: "Claw Mastery",
        jobStep: 2,
        skillIndex: 92060,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    CRITICAL_THROW: {
        name: "Critical Throw",
        jobStep: 2,
        skillIndex: 92070,
        effects: [
            {
                stat: "critRate",
                baseValue: 60,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "critDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    PHYSICAL_TRAINING: {
        name: "Physical Training",
        jobStep: 2,
        skillIndex: 92080,
        effects: [
            {
                stat: "basicAttackDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    ALCHEMIC_ADRENALINE: {
        name: "Alchemic Adrenaline",
        jobStep: 3,
        skillIndex: 93050,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "attackSpeed",
                baseValue: 80,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Triggered every 10 skill activations, lasts 10 sec",
    },
    ENVELOPING_DARKNESS: {
        name: "Enveloping Darkness",
        jobStep: 3,
        skillIndex: 93060,
        effects: [
            {
                stat: "bossDamage",
                baseValue: 180,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Also +10% Max HP",
    },
    EXPERT_THROWING_STAR_HANDLING: {
        name: "Expert Throwing Star Handling",
        jobStep: 3,
        skillIndex: 93070,
        effects: [
            {
                stat: "attack",
                baseValue: 180,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true
    },
    SHADOW_SHIFTER: {
        name: "Shadow Shifter",
        jobStep: 4,
        skillIndex: 94060,
        effects: [
            {
                stat: "attack",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Also provides counterattack capability",
    },
    CLAW_EXPERT: {
        name: "Claw Expert",
        jobStep: 4,
        skillIndex: 94080,
        effects: [
            {
                stat: "skillDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "maxDamage",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    DARK_HARMONY: {
        name: "Dark Harmony",
        jobStep: 4,
        skillIndex: 94090,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "minDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
};

export const SHADOWER_SKILLS = {
    CRITICAL_EDGE: {
        name: "Critical Edge",
        jobStep: 2,
        skillIndex: 102030,
        effects: [
            {
                stat: "critRate",
                baseValue: 60,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "critDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    AGILE_DAGGERS: {
        name: "Agile Daggers",
        jobStep: 2,
        skillIndex: 102040,
        effects: [
            {
                stat: "attackSpeed",
                baseValue: 50,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    CHANNEL_KARMA: {
        name: "Channel Karma",
        jobStep: 2,
        skillIndex: 102050,
        effects: [
            {
                stat: "attack",
                baseValue: 80,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Also +7% critical resistance",
    },
    DAGGER_MASTERY: {
        name: "Dagger Mastery",
        jobStep: 2,
        skillIndex: 102060,
        effects: [
            {
                stat: "minDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    PHYSICAL_TRAINING: {
        name: "Physical Training",
        jobStep: 2,
        skillIndex: 102070,
        effects: [
            {
                stat: "basicAttackDamage",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
    },
    SHIELD_MASTERY: {
        name: "Shield Mastery",
        jobStep: 2,
        skillIndex: 102080,
        effects: [
            {
                stat: "mainStat",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "Increases LUK by 10% of Defense",
    },
    MESO_MASTERY: {
        name: "Meso Mastery",
        jobStep: 3,
        skillIndex: 103060,
        effects: [
            {
                stat: "attack",
                baseValue: 250,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "25% meso generation chance, 25% attack boost for 5 sec per meso",
    },
    SHADOW_SHIFTER: {
        name: "Shadow Shifter",
        jobStep: 4,
        skillIndex: 104060,
        effects: [
            {
                stat: "attack",
                baseValue: 100,
                factorIndex: 22,
                type: "percent"
            },
        ],
        isComplex: true,
        note: "20% counterattack chance dealing 2500% damage",
    },
    DAGGER_EXPERT: {
        name: "Dagger Expert",
        jobStep: 4,
        skillIndex: 104080,
        effects: [
            {
                stat: "skillDamage",
                baseValue: 150,
                factorIndex: 22,
                type: "percent"
            },
            {
                stat: "maxDamage",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
    SHADOWER_INSTINCT: {
        name: "Shadower Instinct",
        jobStep: 4,
        skillIndex: 104090,
        effects: [
            {
                stat: "finalDamage",
                baseValue: 200,
                factorIndex: 22,
                type: "percent"
            },
        ],
    },
};

