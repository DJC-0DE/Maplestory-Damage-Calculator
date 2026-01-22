import { SKILL_LEVEL_FACTOR_TABLE } from "@ts/data/factor-table-data.js";
import {
  HERO_SKILLS,
  DARK_KNIGHT_SKILLS as DK_GENERATED_SKILLS,
  ARCH_MAGE_IL_SKILLS,
  ARCH_MAGE_FP_SKILLS,
  BOWMASTER_SKILLS,
  MARKSMAN_SKILLS,
  NIGHT_LORD_SKILLS,
  SHADOWER_SKILLS
} from "@ts/data/all-class-skills.js";
const CLASS_TO_SKILLS_MAP = {
  "hero": HERO_SKILLS,
  "dark-knight": DK_GENERATED_SKILLS,
  "arch-mage-il": ARCH_MAGE_IL_SKILLS,
  "arch-mage-fp": ARCH_MAGE_FP_SKILLS,
  "bowmaster": BOWMASTER_SKILLS,
  "marksman": MARKSMAN_SKILLS,
  "night-lord": NIGHT_LORD_SKILLS,
  "shadower": SHADOWER_SKILLS
};
const THIRD_JOB_SKILLS = {
  baseDamage: 800,
  // Base damage value (divide by 10 to get %)
  factorIndex: 21,
  // Index in the Factor array for level scaling
  scalesWithLevel: true
};
const FOURTH_JOB_SKILLS = {
  baseDamage: 2900,
  // Base damage value (divide by 10 to get %)
  factorIndex: 21,
  // Index in the Factor array for level scaling
  scalesWithLevel: true
};
function getFactorForLevel(level, factorIndex) {
  if (SKILL_LEVEL_FACTOR_TABLE[level]) {
    return SKILL_LEVEL_FACTOR_TABLE[level][factorIndex];
  }
  const levels = Object.keys(SKILL_LEVEL_FACTOR_TABLE).map(Number).sort((a, b) => a - b);
  let lowerLevel = levels[0];
  let upperLevel = levels[levels.length - 1];
  for (let i = 0; i < levels.length - 1; i++) {
    if (level >= levels[i] && level <= levels[i + 1]) {
      lowerLevel = levels[i];
      upperLevel = levels[i + 1];
      break;
    }
  }
  if (level < levels[0]) {
    return SKILL_LEVEL_FACTOR_TABLE[levels[0]][factorIndex];
  }
  if (level > levels[levels.length - 1]) {
    return SKILL_LEVEL_FACTOR_TABLE[levels[levels.length - 1]][factorIndex];
  }
  const lowerFactor = SKILL_LEVEL_FACTOR_TABLE[lowerLevel][factorIndex];
  const upperFactor = SKILL_LEVEL_FACTOR_TABLE[upperLevel][factorIndex];
  const ratio = (level - lowerLevel) / (upperLevel - lowerLevel);
  return Math.round(lowerFactor + (upperFactor - lowerFactor) * ratio);
}
function calculateSkillInputLevel(characterLevel, jobTier, skillLevelBonus = 0) {
  let baseInputLevel = 0;
  switch (jobTier) {
    case 1:
      baseInputLevel = characterLevel;
      break;
    case 2:
      baseInputLevel = Math.max(0, Math.min((characterLevel - 30) * 3, 120));
      break;
    case 3:
      baseInputLevel = Math.max(0, Math.min((characterLevel - 60) * 3, 120));
      break;
    case 4:
      baseInputLevel = Math.max(0, (characterLevel - 100) * 3);
      break;
    default:
      baseInputLevel = characterLevel;
  }
  return baseInputLevel + skillLevelBonus;
}
function calculate3rdJobSkillCoefficient(characterLevel, skillLevel = 0) {
  const baseDamagePercent = THIRD_JOB_SKILLS.baseDamage / 10;
  const inputLevel = calculateSkillInputLevel(characterLevel, 3, skillLevel);
  const factor = getFactorForLevel(inputLevel, THIRD_JOB_SKILLS.factorIndex);
  const multiplier = factor / 1e3;
  return baseDamagePercent * multiplier;
}
function calculate4thJobSkillCoefficient(characterLevel, skillLevel = 0) {
  const baseDamagePercent = FOURTH_JOB_SKILLS.baseDamage / 10;
  const inputLevel = calculateSkillInputLevel(characterLevel, 4, skillLevel);
  const factor = getFactorForLevel(inputLevel, FOURTH_JOB_SKILLS.factorIndex);
  const multiplier = factor / 1e3;
  return baseDamagePercent * multiplier;
}
function getSkillCoefficientBreakdown(level, jobTier) {
  const config = jobTier === "4th" ? FOURTH_JOB_SKILLS : THIRD_JOB_SKILLS;
  const factor = getFactorForLevel(level, config.factorIndex);
  const baseDamagePercent = config.baseDamage / 10;
  const multiplier = factor / 1e3;
  const finalDamage = baseDamagePercent * multiplier;
  return {
    level,
    jobTier,
    baseDamage: config.baseDamage,
    baseDamagePercent,
    factorIndex: config.factorIndex,
    factor,
    multiplier,
    finalDamagePercent: finalDamage,
    formula: `${baseDamagePercent}% \xD7 (${factor} / 1000) = ${finalDamage.toFixed(2)}%`
  };
}
const DARK_KNIGHT_SKILLS = {
  // 2nd Job Active Skills
  SPEAR_SWEEP: {
    key: "spearSweep",
    name: "Spear Sweep",
    icon: "media/skills/dark knight/Skill_Spear_Sweep.png",
    description: "Performs a sweeping attack with your spear.",
    effects: ["Damage: {damage}"],
    isPassive: false,
    jobTier: "secondJob",
    baseDamage: 400,
    factorIndex: 21,
    scalesWithLevel: true
  },
  EVIL_EYE: {
    key: "evilEye",
    name: "Evil Eye",
    icon: "media/skills/dark knight/Skill_Evil_Eye.png",
    description: "Summons an Evil Eye that increases damage taken by enemies.",
    effects: ["Damage Taken Increase: {damageTakenIncrease}"],
    isPassive: false,
    jobTier: "secondJob",
    damageTakenIncrease: { base: 150, factorIndex: 21, scalesWithLevel: true }
  },
  EVIL_EYE_SHOCK: {
    key: "evilEyeShock",
    name: "Evil Eye Shock",
    icon: "media/skills/dark knight/Skill_Evil_Eye_Shock.png",
    description: "The Evil Eye releases a shock attack.",
    effects: ["Damage: {damage}"],
    isPassive: false,
    jobTier: "secondJob",
    baseDamage: 700,
    factorIndex: 12,
    scalesWithLevel: true
  },
  HYPER_BODY: {
    key: "hyperBody",
    name: "Hyper Body",
    icon: "media/skills/dark knight/Skill_Hyper_Body.png",
    description: "Increases your attack and defense temporarily.",
    effects: ["Attack Bonus: {attackBonus}", "Defense Bonus: {defenseBonus}"],
    isPassive: false,
    jobTier: "secondJob",
    attackBonus: { base: 120, factorIndex: 21, scalesWithLevel: true },
    defenseBonus: { base: 150, factorIndex: 21, scalesWithLevel: true }
  },
  // 2nd Job Passive Skills
  WEAPON_ACCELERATION: {
    key: "weaponAcceleration",
    name: "Weapon Acceleration",
    icon: "media/skills/dark knight/Skill_Weapon_Acceleration_(Dark_Knight).png",
    description: "Increases your attack speed.",
    effects: ["Attack Speed: {attackSpeed}"],
    isPassive: true,
    jobTier: "secondJob",
    attackSpeed: { base: 50, factorIndex: 22, scalesWithLevel: true }
  },
  IRON_WALL: {
    key: "ironWall",
    name: "Iron Wall",
    icon: "media/skills/dark knight/Skill_Iron_Wall.png",
    description: "Converts a portion of your Defense into STR.",
    effects: ["STR from Defense: {strFromDefense}"],
    isPassive: true,
    jobTier: "secondJob",
    strFromDefense: { base: 100, factorIndex: 22, scalesWithLevel: true }
  },
  WEAPON_MASTERY: {
    key: "weaponMastery",
    name: "Weapon Mastery",
    icon: "media/skills/dark knight/Skill_Weapon_Mastery_(Dark_Knight).png",
    description: "Increases your minimum damage ratio.",
    effects: ["Min Damage Ratio: {minDamageRatio}"],
    isPassive: true,
    jobTier: "secondJob",
    minDamageRatio: { base: 150, factorIndex: 22, scalesWithLevel: true }
  },
  FINAL_ATTACK: {
    key: "finalAttack",
    name: "Final Attack",
    icon: "media/skills/dark knight/Skill_Final_Attack.png",
    description: "Has a chance to trigger an additional attack.",
    effects: ["Damage: {damage}", "Trigger Chance: 25%"],
    isPassive: true,
    jobTier: "secondJob",
    baseDamage: 350,
    factorIndex: 21,
    scalesWithLevel: true,
    triggerChance: 25
  },
  // 3rd Job Skills
  LA_MANCHA_SPEAR: {
    key: "laManchaSpear",
    name: "La Mancha Spear",
    icon: "media/skills/dark knight/Skill_La_Mancha_Spear.png",
    description: "Your primary 3rd job attack skill.",
    effects: ["Damage: {damage}"],
    isPassive: false,
    jobTier: "thirdJob",
    baseDamage: 800,
    factorIndex: 21,
    scalesWithLevel: true
  },
  EVIL_EYE_OF_DOMINANT: {
    key: "evilEyeOfDominant",
    name: "Evil Eye of Dominant",
    icon: "media/skills/dark knight/Skill_Evil_Eye_of_Dominant.png",
    description: "Enhanced Evil Eye attack.",
    effects: ["Damage: {damage}"],
    isPassive: false,
    jobTier: "thirdJob",
    baseDamage: 600,
    factorIndex: 21,
    scalesWithLevel: true
  },
  RUSH: {
    key: "rush",
    name: "Rush",
    icon: "media/skills/dark knight/Skill_Rush_(Dark_Knight).png",
    description: "Rush forward and attack enemies.",
    effects: ["Damage: {damage}"],
    isPassive: false,
    jobTier: "thirdJob",
    baseDamage: 6e3,
    factorIndex: 12,
    scalesWithLevel: true
  },
  CROSS_OVER_CHAINS: {
    key: "crossOverChains",
    name: "Cross Over Chains",
    icon: "media/skills/dark knight/Skill_Cross_Over_Chains.png",
    description: "Increases attack and toughness.",
    effects: ["Attack Bonus: {attackBonus}", "Toughness Bonus: {toughnessBonus}"],
    isPassive: false,
    jobTier: "thirdJob",
    attackBonus: { base: 150, factorIndex: 21, scalesWithLevel: true },
    toughnessBonus: { base: 100, factorIndex: 21, scalesWithLevel: true }
  },
  EVIL_EYE_SHOCK_ENHANCEMENT: {
    key: "evilEyeShockEnhancement",
    name: "Evil Eye Shock Enhancement",
    icon: "media/skills/dark knight/Skill_Evil_Eye_Shock_Enhancement.png",
    description: "Significantly enhances Evil Eye Shock damage.",
    effects: ["Damage: {damage}"],
    isPassive: false,
    jobTier: "thirdJob",
    baseDamage: 1075,
    factorIndex: 22,
    scalesWithLevel: true
  },
  HEX_OF_THE_EVIL_EYE: {
    key: "hexOfTheEvilEye",
    name: "Hex of the Evil Eye",
    icon: "media/skills/dark knight/Skill_Hex_of_the_Evil_Eye.png",
    description: "Evil Eye places a hex that increases attack.",
    effects: ["Attack Bonus: {attackBonus}"],
    isPassive: false,
    jobTier: "thirdJob",
    attackBonus: { base: 150, factorIndex: 22, scalesWithLevel: true }
  },
  LORD_OF_DARKNESS: {
    key: "lordOfDarkness",
    name: "Lord of Darkness",
    icon: "media/skills/dark knight/Skill_Lord_of_Darkness.png",
    description: "Passive skill that enhances HP recovery and critical stats.",
    effects: ["HP Recovery: {hpRecovery}", "Critical Rate: {criticalRate}", "Critical Damage: {criticalDamage}"],
    isPassive: true,
    jobTier: "thirdJob",
    hpRecovery: { base: 15, factorIndex: 22, scalesWithLevel: false },
    criticalRate: { base: 80, factorIndex: 22, scalesWithLevel: true },
    criticalDamage: { base: 300, factorIndex: 22, scalesWithLevel: true }
  },
  ENDURE: {
    key: "endure",
    name: "Endure",
    icon: "media/skills/dark knight/Skill_Endure.png",
    description: "Increases Debuff Tolerance.",
    effects: ["Debuff Tolerance: {debuffTolerance}"],
    isPassive: true,
    jobTier: "thirdJob",
    debuffTolerance: { base: 15, factorIndex: 22, scalesWithLevel: true, isFlat: true }
  }
};
function calculateSkillValue(baseValue, factorIndex, level, scalesWithLevel = true, isFlat = false) {
  if (!scalesWithLevel) {
    return isFlat ? baseValue : baseValue / 10;
  }
  const factor = getFactorForLevel(level, factorIndex);
  const base = isFlat ? baseValue : baseValue / 10;
  const multiplier = factor / 1e3;
  return base * multiplier;
}
function calculateSpearSweep(level) {
  const config = DARK_KNIGHT_SKILLS.SPEAR_SWEEP;
  return calculateSkillValue(config.baseDamage, config.factorIndex, level);
}
function calculateEvilEye(level) {
  const config = DARK_KNIGHT_SKILLS.EVIL_EYE.damageTakenIncrease;
  return calculateSkillValue(config.base, config.factorIndex, level);
}
function calculateEvilEyeShock(level) {
  const config = DARK_KNIGHT_SKILLS.EVIL_EYE_SHOCK;
  return calculateSkillValue(config.baseDamage, config.factorIndex, level);
}
function calculateHyperBody(level) {
  const config = DARK_KNIGHT_SKILLS.HYPER_BODY;
  return {
    attackBonus: calculateSkillValue(config.attackBonus.base, config.attackBonus.factorIndex, level),
    defenseBonus: calculateSkillValue(config.defenseBonus.base, config.defenseBonus.factorIndex, level)
  };
}
function calculateWeaponAcceleration(level) {
  const config = DARK_KNIGHT_SKILLS.WEAPON_ACCELERATION.attackSpeed;
  return calculateSkillValue(config.base, config.factorIndex, level);
}
function calculateIronWall(level) {
  const config = DARK_KNIGHT_SKILLS.IRON_WALL.strFromDefense;
  return calculateSkillValue(config.base, config.factorIndex, level);
}
function calculateWeaponMastery(level) {
  const config = DARK_KNIGHT_SKILLS.WEAPON_MASTERY.minDamageRatio;
  return calculateSkillValue(config.base, config.factorIndex, level);
}
function calculateFinalAttack(level) {
  const config = DARK_KNIGHT_SKILLS.FINAL_ATTACK;
  return calculateSkillValue(config.baseDamage, config.factorIndex, level, config.scalesWithLevel);
}
function calculateLaManchaSpear(level) {
  const config = DARK_KNIGHT_SKILLS.LA_MANCHA_SPEAR;
  return calculateSkillValue(config.baseDamage, config.factorIndex, level, config.scalesWithLevel);
}
function calculateEvilEyeOfDominant(level) {
  const config = DARK_KNIGHT_SKILLS.EVIL_EYE_OF_DOMINANT;
  return calculateSkillValue(config.baseDamage, config.factorIndex, level, config.scalesWithLevel);
}
function calculateRush(level) {
  const config = DARK_KNIGHT_SKILLS.RUSH;
  return calculateSkillValue(config.baseDamage, config.factorIndex, level, config.scalesWithLevel);
}
function calculateCrossOverChainsAttack(level) {
  const config = DARK_KNIGHT_SKILLS.CROSS_OVER_CHAINS.attackBonus;
  return calculateSkillValue(config.base, config.factorIndex, level);
}
function calculateCrossOverChainsToughness(level) {
  const config = DARK_KNIGHT_SKILLS.CROSS_OVER_CHAINS.toughnessBonus;
  return calculateSkillValue(config.base, config.factorIndex, level);
}
function calculateEvilEyeShockEnhancement(level) {
  const config = DARK_KNIGHT_SKILLS.EVIL_EYE_SHOCK_ENHANCEMENT;
  return calculateSkillValue(config.baseDamage, config.factorIndex, level, config.scalesWithLevel);
}
function calculateHexOfTheEvilEye(level) {
  const config = DARK_KNIGHT_SKILLS.HEX_OF_THE_EVIL_EYE.attackBonus;
  return calculateSkillValue(config.base, config.factorIndex, level);
}
function calculateLordOfDarkness(level) {
  const config = DARK_KNIGHT_SKILLS.LORD_OF_DARKNESS;
  return {
    hpRecovery: calculateSkillValue(
      config.hpRecovery.base,
      config.hpRecovery.factorIndex,
      level,
      config.hpRecovery.scalesWithLevel
    ),
    criticalRate: calculateSkillValue(
      config.criticalRate.base,
      config.criticalRate.factorIndex,
      level
    ),
    criticalDamage: calculateSkillValue(
      config.criticalDamage.base,
      config.criticalDamage.factorIndex,
      level
    )
  };
}
function calculateEndure(level) {
  const config = DARK_KNIGHT_SKILLS.ENDURE.debuffTolerance;
  return calculateSkillValue(config.base, config.factorIndex, level, config.scalesWithLevel, config.isFlat);
}
function getAllDarkKnightSkills(level) {
  const lordOfDarkness = calculateLordOfDarkness(level);
  const hyperBody = calculateHyperBody(level);
  return {
    level,
    secondJobSkills: {
      spearSweep: {
        name: "Spear Sweep",
        damage: calculateSpearSweep(level).toFixed(2) + "%"
      },
      evilEye: {
        name: "Evil Eye",
        damageTakenIncrease: calculateEvilEye(level).toFixed(2) + "%"
      },
      evilEyeShock: {
        name: "Evil Eye Shock",
        damage: calculateEvilEyeShock(level).toFixed(2) + "%"
      },
      hyperBody: {
        name: "Hyper Body",
        attackBonus: hyperBody.attackBonus.toFixed(2) + "%",
        defenseBonus: hyperBody.defenseBonus.toFixed(2) + "%"
      },
      weaponAcceleration: {
        name: "Weapon Acceleration",
        attackSpeed: calculateWeaponAcceleration(level).toFixed(2) + "%"
      },
      ironWall: {
        name: "Iron Wall",
        strFromDefense: calculateIronWall(level).toFixed(2) + "%"
      },
      weaponMastery: {
        name: "Weapon Mastery",
        minDamageRatio: calculateWeaponMastery(level).toFixed(2) + "%"
      },
      finalAttack: {
        name: "Final Attack",
        damage: calculateFinalAttack(level).toFixed(2) + "%",
        triggerChance: "25%"
      }
    },
    thirdJobSkills: {
      laManchaSpear: {
        name: "La Mancha Spear",
        damage: calculateLaManchaSpear(level).toFixed(2) + "%"
      },
      evilEyeOfDominant: {
        name: "Evil Eye of Dominant",
        damage: calculateEvilEyeOfDominant(level).toFixed(2) + "%"
      },
      rush: {
        name: "Rush",
        damage: calculateRush(level).toFixed(2) + "%"
      },
      crossOverChains: {
        name: "Cross Over Chains",
        attackBonus: calculateCrossOverChainsAttack(level).toFixed(2) + "%",
        toughnessBonus: calculateCrossOverChainsToughness(level).toFixed(2) + "%"
      },
      evilEyeShockEnhancement: {
        name: "Evil Eye Shock Enhancement",
        damage: calculateEvilEyeShockEnhancement(level).toFixed(2) + "%"
      },
      hexOfTheEvilEye: {
        name: "Hex of the Evil Eye",
        attackBonus: calculateHexOfTheEvilEye(level).toFixed(2) + "%"
      },
      lordOfDarkness: {
        name: "Lord of Darkness",
        hpRecovery: lordOfDarkness.hpRecovery.toFixed(2) + "%",
        criticalRate: lordOfDarkness.criticalRate.toFixed(2) + "%",
        criticalDamage: lordOfDarkness.criticalDamage.toFixed(2) + "%"
      },
      endure: {
        name: "Endure",
        debuffTolerance: calculateEndure(level).toFixed(0)
      }
    }
  };
}
function getPassivesByTier(classSkills, jobTier) {
  const passives = [];
  for (const [skillKey, skillData] of Object.entries(classSkills)) {
    if (skillData.jobStep === jobTier && !skillData.isComplex) {
      passives.push({
        skillKey,
        name: skillData.name,
        skillData
      });
    }
  }
  return passives;
}
function getComplexPassivesByTier(classSkills, jobTier) {
  const passives = [];
  for (const [skillKey, skillData] of Object.entries(classSkills)) {
    if (skillData.jobStep === jobTier && skillData.isComplex) {
      passives.push({
        skillKey,
        name: skillData.name,
        skillData
      });
    }
  }
  return passives;
}
function calculateJobSkillPassiveGains(className, characterLevel, skillLevelBonuses, currentStats = {}) {
  const classSkills = CLASS_TO_SKILLS_MAP[className];
  if (!classSkills) {
    return {
      statChanges: {},
      breakdown: [],
      complexPassives: [],
      complexStatChanges: {}
    };
  }
  const statChanges = {};
  const breakdown = [];
  const complexPassives = [];
  const complexStatChanges = {};
  complexStatChanges["finalAttack"] = 0;
  const jobTiers = [1, 2, 3, 4];
  const jobTierNames = ["firstJob", "secondJob", "thirdJob", "fourthJob"];
  const allSkillsBonus = skillLevelBonuses.allSkills || 0;
  for (let i = 0; i < jobTiers.length; i++) {
    const tierNumber = jobTiers[i];
    const tierName = jobTierNames[i];
    const tierBonus = (skillLevelBonuses[tierName] || 0) + allSkillsBonus;
    const passives = getPassivesByTier(classSkills, tierNumber);
    for (const { name, skillData } of passives) {
      const baseInputLevel = calculateSkillInputLevel(characterLevel, tierNumber, 0);
      const bonusInputLevel = calculateSkillInputLevel(characterLevel, tierNumber, tierBonus);
      for (const effect of skillData.effects) {
        const isFlat = effect.type === "flat";
        const baseValue = calculateSkillValue(
          effect.baseValue,
          effect.factorIndex,
          baseInputLevel,
          true,
          // scalesWithLevel - always true for passives
          isFlat
        );
        const bonusValue = calculateSkillValue(
          effect.baseValue,
          effect.factorIndex,
          bonusInputLevel,
          true,
          // scalesWithLevel - always true for passives
          isFlat
        );
        const statGain = bonusValue - baseValue;
        const calculatorStat = effect.stat;
        if (calculatorStat === "defense" && currentStats.defense) {
          const baseStrGain = currentStats.defense * baseValue / 100;
          const bonusStrGain = currentStats.defense * bonusValue / 100;
          const strGain = bonusStrGain - baseStrGain;
          const baseStatDamage = baseStrGain / 100;
          const bonusStatDamage = bonusStrGain / 100;
          const statDamageGain = bonusStatDamage - baseStatDamage;
          if (!statChanges["statDamage"]) statChanges["statDamage"] = 0;
          statChanges["statDamage"] += statDamageGain;
          breakdown.push({
            passive: name,
            stat: "statDamage",
            statDisplay: "Stat Damage",
            baseValue: baseStatDamage,
            bonusValue: bonusStatDamage,
            gain: statDamageGain,
            isPercent: true,
            note: `${baseValue.toFixed(2)}% \u2192 ${bonusValue.toFixed(2)}% DEF conversion = ${baseStrGain.toFixed(0)} \u2192 ${bonusStrGain.toFixed(0)} STR`
          });
        } else {
          if (!statChanges[calculatorStat]) statChanges[calculatorStat] = 0;
          statChanges[calculatorStat] += statGain;
          const isPercent = ["attackSpeed", "minDamage", "maxDamage", "critRate", "critDamage", "statDamage", "finalDamage", "damage", "bossDamage", "normalDamage", "skillDamage", "damageAmp", "basicAttackDamage"].includes(calculatorStat);
          breakdown.push({
            passive: name,
            stat: calculatorStat,
            baseValue,
            bonusValue,
            gain: statGain,
            isPercent
          });
        }
      }
    }
    const complexPassivesForTier = getComplexPassivesByTier(classSkills, tierNumber);
    for (const { name, skillData } of complexPassivesForTier) {
      const baseInputLevel = calculateSkillInputLevel(characterLevel, tierNumber, 0);
      const bonusInputLevel = calculateSkillInputLevel(characterLevel, tierNumber, tierBonus);
      if (skillData.effects && skillData.effects.length > 0) {
        for (const effect of skillData.effects) {
          const isFlat = effect.type === "flat";
          const baseValue = calculateSkillValue(
            effect.baseValue,
            effect.factorIndex,
            baseInputLevel,
            true,
            isFlat
          );
          const bonusValue = calculateSkillValue(
            effect.baseValue,
            effect.factorIndex,
            bonusInputLevel,
            true,
            isFlat
          );
          const gain = bonusValue - baseValue;
          const calculatorStat = effect.stat;
          if (calculatorStat.toLowerCase() === "finalattack") {
            complexStatChanges["finalAttack"] += bonusValue;
          }
          complexPassives.push({
            passive: name,
            stat: calculatorStat,
            baseValue,
            bonusValue,
            gain,
            isPercent: !isFlat,
            note: skillData.note || ""
          });
        }
      } else {
        complexPassives.push({
          passive: name,
          note: skillData.note || "Complex passive"
        });
      }
    }
  }
  return {
    statChanges,
    breakdown,
    complexPassives,
    complexStatChanges
  };
}
export {
  DARK_KNIGHT_SKILLS,
  calculate3rdJobSkillCoefficient,
  calculate4thJobSkillCoefficient,
  calculateCrossOverChainsAttack,
  calculateCrossOverChainsToughness,
  calculateEndure,
  calculateEvilEye,
  calculateEvilEyeOfDominant,
  calculateEvilEyeShock,
  calculateEvilEyeShockEnhancement,
  calculateFinalAttack,
  calculateHexOfTheEvilEye,
  calculateHyperBody,
  calculateIronWall,
  calculateJobSkillPassiveGains,
  calculateLaManchaSpear,
  calculateLordOfDarkness,
  calculateRush,
  calculateSpearSweep,
  calculateWeaponAcceleration,
  calculateWeaponMastery,
  getAllDarkKnightSkills,
  getSkillCoefficientBreakdown
};
//# sourceMappingURL=skill-coefficient.service.js.map
