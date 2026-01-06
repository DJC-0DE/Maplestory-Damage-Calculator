// Dark Knight Skills Data
// Auto-generated from game files
// Each skill includes base values and factor indices for level scaling

const DARK_KNIGHT_SKILLS = {
    33010: {
        name: "La Mancha Spear",
        description: "[Basic Attack Effect] Swings a spear to deal [#Red]{1}[-]% damage to [#White]{0}[-] target(s) in front [#White]{2}[-] time(s).",
        triggerType: "None",
        triggerChance: 100, // %
        effects: [
            {
                type: "GetDamageR",
                baseValue: 800,
                factorIndex: 21,
                scalesWithLevel: false,
            },
        ]
    },
    33020: {
        name: "Rush",
        description: "Charges to the front to deal [#Red]{1}[-]% damage to [#White]{0}[-] target(s) and stun them for [#White]{2}[-] sec.",
        triggerType: "None",
        triggerChance: 100, // %
        cooldownMs: 22000,
        effects: [
            {
                type: "GetDamageR",
                baseValue: 6000,
                factorIndex: 12,
                scalesWithLevel: false,
            },
            {
                type: "DashFromMyself",
                stat: "3600",
                baseValue: 0,
            },
            {
                type: "DashFromMyself",
                stat: "3600",
                baseValue: 0,
            },
        ]
    },
    33030: {
        name: "Cross Over Chains",
        description: "Increases Attack by [#Green]{1}[-]% for [#White]{0}[-] sec. If current HP is [#White]{2}[-]% or lower, the Attack increase effect disappears and the damage you take is decreased by [#Green]{3}[-]%.",
        triggerType: "None",
        triggerChance: 100, // %
        cooldownMs: 30000,
        effects: [
            {
                type: "ModStatR",
                stat: "Attack",
                baseValue: 150,
                factorIndex: 21,
                scalesWithLevel: true,
                durationMs: 15000,
                buffState: "CrossOverChain",
            },
            {
                type: "ModStat",
                stat: "Toughness",
                baseValue: 100,
                factorIndex: 21,
                scalesWithLevel: true,
                buffState: "CrossOverChain_2",
            },
        ]
    },
    33040: {
        name: "Evil Eye of Dominant",
        description: "[Must Summon Evil Eye] Enhances the Evil Eye to deal [#Red]{2}[-]% continuous damage to [#White]{1}[-] nearby target(s) every [#White]{0}[-] sec.",
        triggerType: "OnStart",
        triggerChance: 100, // %
        effects: [
            {
                type: "ModSkillEnabled",
                stat: "32020",
                baseValue: 4,
                durationMs: 99999999,
            },
        ]
    },
    33041: {
        name: "Unknown",
        description: "No description",
        triggerType: "None",
        triggerChance: 100, // %
        effects: [
            {
                type: "GetDamageR",
                baseValue: 600,
                factorIndex: 21,
                scalesWithLevel: false,
            },
        ]
    },
    33050: {
        name: "Evil Eye Shock Enhancement",
        description: "The number of Evil Eye Shock targets changes to [#White]{0}[-], and Final Damage is increased by [#Green]{1}[-]%.",
        triggerType: "OnStart",
        triggerChance: 100, // %
        effects: [
            {
                type: "SetSkill",
                stat: "32020",
                baseValue: 1,
                durationMs: 99999999,
            },
            {
                type: "ModSkillStat",
                stat: "32021",
                baseValue: 1,
                factorIndex: 22,
                scalesWithLevel: false,
                durationMs: 99999999,
            },
        ]
    },
    33060: {
        name: "Hex of the Evil Eye",
        description: "Draws the power of the Evil Eye to increase the Attack of allied players by [#Green]{0}[-]% for the summoning duration.",
        triggerType: "OnStart",
        triggerChance: 100, // %
        effects: [
            {
                type: "ModSkillEnabled",
                stat: "32020",
                baseValue: 3,
                durationMs: 99999999,
            },
        ]
    },
    33061: {
        name: "Unknown",
        description: "No description",
        triggerType: "None",
        triggerChance: 100, // %
        effects: [
            {
                type: "ModStatR",
                stat: "Attack",
                baseValue: 150,
                factorIndex: 22,
                scalesWithLevel: true,
                durationMs: 99999999,
                buffState: "BeholdersBuff",
            },
            {
                type: "ModStat",
                stat: "HitChance",
                baseValue: 5,
                durationMs: 99999999,
                buffState: "BeholdersBuff_2",
            },
        ]
    },
    33070: {
        name: "Lord of Darkness",
        description: "When attacking, recovers HP by [#Green]{1}[-]%, and increases Critical Rate by [#Green]{3}[-]% and Critical Damage by [#Green]{4}[-]% for [#White]{2}[-] sec with a [#White]{0}[-]% chance.",
        triggerType: "OnAttack",
        triggerChance: 30, // %
        cooldownMs: 2000,
        effects: [
            {
                type: "ModStat",
                stat: "CriticalChance",
                baseValue: 80,
                factorIndex: 22,
                scalesWithLevel: true,
                durationMs: 5000,
                buffState: "LordOfDarkness",
            },
            {
                type: "GetHealByMaxHpR",
                stat: "15",
                baseValue: 0,
                factorIndex: 22,
                scalesWithLevel: false,
            },
            {
                type: "ModStat",
                stat: "CriticalPower",
                baseValue: 300,
                factorIndex: 22,
                scalesWithLevel: true,
                buffState: "LordOfDarkness_2",
            },
        ]
    },
    33080: {
        name: "Endure",
        description: "Increases Debuff Tolerance by [#Green]{0}[-].",
        triggerType: "OnStart",
        triggerChance: 100, // %
        effects: [
            {
                type: "ModStat",
                stat: "DebuffResist",
                baseValue: 15,
                factorIndex: 22,
                scalesWithLevel: true,
                durationMs: 99999999,
            },
        ]
    },
};

// Helper function to get all factor indices used by Dark Knight skills
function getDarkKnightFactorIndices() {
    const indices = new Set();
    Object.values(DARK_KNIGHT_SKILLS).forEach(skill => {
        skill.effects.forEach(effect => {
            if (effect.factorIndex !== undefined) {
                indices.add(effect.factorIndex);
            }
        });
    });
    return Array.from(indices).sort((a, b) => a - b);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DARK_KNIGHT_SKILLS, getDarkKnightFactorIndices };
}
