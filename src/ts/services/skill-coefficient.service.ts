// Skill Coefficient Calculator
// Calculates skill damage % based on character level for 3rd and 4th job skills

// Import all class skill data
import { SKILL_LEVEL_FACTOR_TABLE } from '@ts/data/factor-table-data.js';
import {
    HERO_SKILLS,
    DARK_KNIGHT_SKILLS as DK_GENERATED_SKILLS,
    ARCH_MAGE_IL_SKILLS,
    ARCH_MAGE_FP_SKILLS,
    BOWMASTER_SKILLS,
    MARKSMAN_SKILLS,
    NIGHT_LORD_SKILLS,
    SHADOWER_SKILLS
} from '@ts/data/all-class-skills.js';
import { BaseStats, STAT } from '@ts/types';
import { StatCalculationService } from '@ts/services/stat-calculation-service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Factor table type - maps level (as string key) to array of factors
 */
type FactorTable = Record<string, number[]>;

/**
 * Job tier values
 */
type JobTier = 1 | 2 | 3 | 4;

/**
 * Job tier string names
 */
type JobTierString = 'firstJob' | 'secondJob' | 'thirdJob' | 'fourthJob';

/**
 * Skill effect configuration
 */
interface SkillEffect {
    stat: string;
    baseValue: number;
    factorIndex: number;
    type: 'flat' | 'percent' | string;
}

/**
 * Base skill data structure
 */
interface BaseSkillData {
    name: string;
    jobStep?: number;
    skillIndex?: number;
    effects?: SkillEffect[];
    isComplex?: boolean;
    note?: string;
}

/**
 * Skill data from generated class skills (all-class-skills.ts)
 */
interface GeneratedSkillData extends BaseSkillData {
    jobStep: number;
    skillIndex: number;
    effects: SkillEffect[];
    isComplex?: boolean;
    note?: string;
}

/**
 * Class skills collection type
 */
interface ClassSkills {
    [key: string]: GeneratedSkillData;
}

/**
 * Skill configuration with base damage and factor index
 */
interface SkillConfig {
    baseDamage: number;
    factorIndex: number;
    scalesWithLevel: boolean;
}

/**
 * Skill configuration for stat bonuses
 */
interface SkillBonusConfig {
    base: number;
    factorIndex: number;
    scalesWithLevel: boolean;
    isFlat?: boolean;
}

/**
 * Dark Knight skill structure
 */
interface DarkKnightSkill {
    key: string;
    name: string;
    icon: string;
    description: string;
    effects: string[];
    isPassive: boolean;
    jobTier: JobTierString;
    baseDamage?: number;
    factorIndex?: number;
    scalesWithLevel?: boolean;
    attackBonus?: SkillBonusConfig;
    defenseBonus?: SkillBonusConfig;
    damageTakenIncrease?: SkillBonusConfig;
    attackSpeed?: SkillBonusConfig;
    strFromDefense?: SkillBonusConfig;
    minDamageRatio?: SkillBonusConfig;
    toughnessBonus?: SkillBonusConfig;
    hpRecovery?: SkillBonusConfig;
    criticalRate?: SkillBonusConfig;
    criticalDamage?: SkillBonusConfig;
    debuffTolerance?: SkillBonusConfig;
    triggerChance?: number;
}

/**
 * Dark Knight skills collection
 */
interface DarkKnightSkills {
    [key: string]: DarkKnightSkill;
}

/**
 * Skill coefficient breakdown
 */
interface SkillCoefficientBreakdown {
    level: number;
    jobTier: string;
    baseDamage: number;
    baseDamagePercent: number;
    factorIndex: number;
    factor: number;
    multiplier: number;
    finalDamagePercent: number;
    formula: string;
}

/**
 * Hyper Body calculation result
 */
interface HyperBodyResult {
    attackBonus: number;
    defenseBonus: number;
}

/**
 * Lord of Darkness calculation result
 */
interface LordOfDarknessResult {
    hpRecovery: number;
    criticalRate: number;
    criticalDamage: number;
}

/**
 * All Dark Knight skills result
 */
interface AllDarkKnightSkills {
    level: number;
    secondJobSkills: {
        spearSweep: { name: string; damage: string };
        evilEye: { name: string; damageTakenIncrease: string };
        evilEyeShock: { name: string; damage: string };
        hyperBody: { name: string; attackBonus: string; defenseBonus: string };
        weaponAcceleration: { name: string; attackSpeed: string };
        ironWall: { name: string; strFromDefense: string };
        weaponMastery: { name: string; minDamageRatio: string };
        finalAttack: { name: string; damage: string; triggerChance: string };
    };
    thirdJobSkills: {
        laManchaSpear: { name: string; damage: string };
        evilEyeOfDominant: { name: string; damage: string };
        rush: { name: string; damage: string };
        crossOverChains: { name: string; attackBonus: string; toughnessBonus: string };
        evilEyeShockEnhancement: { name: string; damage: string };
        hexOfTheEvilEye: { name: string; attackBonus: string };
        lordOfDarkness: { name: string; hpRecovery: string; criticalRate: string; criticalDamage: string };
        endure: { name: string; debuffTolerance: string };
    };
}

/**
 * Passive skill entry for breakdown
 */
interface PassiveBreakdown {
    passive: string;
    stat: string;
    statDisplay?: string;
    baseValue: number;
    bonusValue: number;
    gain: number;
    isPercent: boolean;
    note?: string;
}

/**
 * Complex passive entry
 */
interface ComplexPassive {
    passive: string;
    stat?: string;
    baseValue?: number;
    bonusValue?: number;
    gain?: number;
    isPercent?: boolean;
    note?: string;
}

/**
 * Result from calculateJobSkillPassiveGains
 */
interface JobSkillPassiveGainsResult {
    statChanges: Record<string, number>;
    breakdown: PassiveBreakdown[];
    complexPassives: ComplexPassive[];
    complexStatChanges: Record<string, number>;
}

/**
 * Skill level bonuses object
 */
interface SkillLevelBonuses {
    firstJob?: number;
    secondJob?: number;
    thirdJob?: number;
    fourthJob?: number;
    allSkills?: number;
}

// Map class names to their skill data
const CLASS_TO_SKILLS_MAP: Record<string, ClassSkills> = {
    'hero': HERO_SKILLS,
    'dark-knight': DK_GENERATED_SKILLS,
    'arch-mage-il': ARCH_MAGE_IL_SKILLS,
    'arch-mage-fp': ARCH_MAGE_FP_SKILLS,
    'bowmaster': BOWMASTER_SKILLS,
    'marksman': MARKSMAN_SKILLS,
    'night-lord': NIGHT_LORD_SKILLS,
    'shadower': SHADOWER_SKILLS
};

// 3rd Job Skills Configuration
// All main 3rd job attacking skills share these parameters:
// - Base damage: 800 (represents 80%)
// - Factor index: 21 (index into the Factor array for level scaling)
const THIRD_JOB_SKILLS: SkillConfig = {
    baseDamage: 800,      // Base damage value (divide by 10 to get %)
    factorIndex: 21,      // Index in the Factor array for level scaling
    scalesWithLevel: true
};

// 4th Job Skills Configuration
// All main 4th job attacking skills share these parameters:
// - Base damage: 2900 (represents 290%)
// - Factor index: 22 (index into the Factor array for level scaling)
const FOURTH_JOB_SKILLS: SkillConfig = {
    baseDamage: 2900,     // Base damage value (divide by 10 to get %)
    factorIndex: 21,      // Index in the Factor array for level scaling
    scalesWithLevel: true
};

/**
 * Gets the factor value for a given level
 * Interpolates between known level values if exact level is not in table
 * @param level - Character level
 * @param factorIndex - Index in the factor array to use
 * @returns Factor value (1000 = 1.0x multiplier)
 */
function getFactorForLevel(level: number, factorIndex: number): number {
    // If exact level exists in table, return it
    if (SKILL_LEVEL_FACTOR_TABLE[level]) {
        return SKILL_LEVEL_FACTOR_TABLE[level][factorIndex];
    }

    // Find the two nearest levels to interpolate between
    const levels = Object.keys(SKILL_LEVEL_FACTOR_TABLE).map(Number).sort((a, b) => a - b);

    // Find lower and upper bounds
    let lowerLevel = levels[0];
    let upperLevel = levels[levels.length - 1];

    for (let i = 0; i < levels.length - 1; i++) {
        if (level >= levels[i] && level <= levels[i + 1]) {
            lowerLevel = levels[i];
            upperLevel = levels[i + 1];
            break;
        }
    }

    // If level is below minimum or above maximum, clamp to bounds
    if (level < levels[0]) {
        return SKILL_LEVEL_FACTOR_TABLE[levels[0]][factorIndex];
    }
    if (level > levels[levels.length - 1]) {
        return SKILL_LEVEL_FACTOR_TABLE[levels[levels.length - 1]][factorIndex];
    }

    // Linear interpolation
    const lowerFactor = SKILL_LEVEL_FACTOR_TABLE[lowerLevel][factorIndex];
    const upperFactor = SKILL_LEVEL_FACTOR_TABLE[upperLevel][factorIndex];
    const ratio = (level - lowerLevel) / (upperLevel - lowerLevel);

    return Math.round(lowerFactor + (upperFactor - lowerFactor) * ratio);
}

/**
 * Calculate the input level for skills based on character level and job tier
 * This is used to look up the appropriate factor in the skill level factor table
 * @param characterLevel - Current character level
 * @param jobTier - Job tier (1, 2, 3, or 4)
 * @param skillLevelBonus - Bonus to skill level from items (default 0)
 * @returns Input level for factor table lookup
 */
function calculateSkillInputLevel(characterLevel: number, jobTier: JobTier, skillLevelBonus: number = 0): number {
    let baseInputLevel = 0;

    switch (jobTier) {
        case 1:
            // 1st job skills scale directly with character level (assumption - needs verification)
            baseInputLevel = characterLevel;
            break;
        case 2:
            // 2nd job skills: Similar pattern, starts at level 30
            // Using same formula pattern until exact formula is confirmed
            baseInputLevel = Math.max(0, Math.min((characterLevel - 30) * 3, 120));
            break;
        case 3:
            // 3rd job skills: (characterLevel - 60) * 3, capped at 120
            baseInputLevel = Math.max(0, Math.min((characterLevel - 60) * 3, 120));
            break;
        case 4:
            // 4th job skills: (characterLevel - 100) * 3, no cap
            baseInputLevel = Math.max(0, (characterLevel - 100) * 3);
            break;
        default:
            baseInputLevel = characterLevel;
    }

    return baseInputLevel + skillLevelBonus;
}

/**
 * Calculates the skill coefficient (damage %) for 3rd job skills
 * All main 3rd job attacking skills use the same scaling:
 * - Intrepid Slash (Hero)
 * - Ice Strike (I/L Mage)
 * - Explosion (F/P Mage)
 * - Midnight Carnival (Night Lord)
 * - Wind Arrow II (Bowmaster)
 * - Piercing Arrow II (Marksman)
 * - La Mancha Spear (Dark Knight)
 *
 * Formula:
 * - Input level = min((characterLevel - 60) * 3, 120) + skillLevel
 * - Coefficient = Base damage (80%) * (factor at input level / 1000)
 *
 * @param characterLevel - Character level (1-200)
 * @param skillLevel - Skill level bonus (default 0)
 * @returns Skill damage percentage (e.g., 110.08 for 110.08%)
 */
export function calculate3rdJobSkillCoefficient(characterLevel: number, skillLevel: number = 0): number {
    const baseDamagePercent = THIRD_JOB_SKILLS.baseDamage / 10;

    // Calculate input level for factor table using shared helper
    const inputLevel = calculateSkillInputLevel(characterLevel, 3, skillLevel);

    // Get factor from table using the input level
    const factor = getFactorForLevel(inputLevel, THIRD_JOB_SKILLS.factorIndex);
    const multiplier = factor / 1000;

    return baseDamagePercent * multiplier;
}

/**
 * Calculates the skill coefficient (damage %) for 4th job skills
 * All main 4th job attacking skills use the same scaling
 *
 * Formula:
 * - Input level = (characterLevel - 100) * 3 + skillLevel
 * - Coefficient = Base damage (290%) * (factor at input level / 1000)
 *
 * @param characterLevel - Character level (1-200)
 * @param skillLevel - Skill level bonus (default 0)
 * @returns Skill damage percentage
 */
export function calculate4thJobSkillCoefficient(characterLevel: number, skillLevel: number = 0): number {
    const baseDamagePercent = FOURTH_JOB_SKILLS.baseDamage / 10;

    // Calculate input level for factor table using shared helper
    const inputLevel = calculateSkillInputLevel(characterLevel, 4, skillLevel);

    // Get factor from table using the input level
    const factor = getFactorForLevel(inputLevel, FOURTH_JOB_SKILLS.factorIndex);
    const multiplier = factor / 1000;

    return baseDamagePercent * multiplier;
}

/**
 * Gets detailed calculation breakdown for debugging
 * @param level - Character level
 * @param jobTier - '3rd' or '4th'
 * @returns Breakdown of calculation steps
 */
export function getSkillCoefficientBreakdown(level: number, jobTier: '3rd' | '4th'): SkillCoefficientBreakdown {
    const config = jobTier === '4th' ? FOURTH_JOB_SKILLS : THIRD_JOB_SKILLS;
    const factor = getFactorForLevel(level, config.factorIndex);
    const baseDamagePercent = config.baseDamage / 10;
    const multiplier = factor / 1000;
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
        formula: `${baseDamagePercent}% × (${factor} / 1000) = ${finalDamage.toFixed(2)}%`
    };
}

// ============================================================================
// DARK KNIGHT SPECIFIC SKILLS
// ============================================================================

/**
 * Dark Knight skill configurations with UI data
 * Factor indices: 12, 21, 22
 */
export const DARK_KNIGHT_SKILLS: DarkKnightSkills = {
    // 2nd Job Active Skills
    SPEAR_SWEEP: {
        key: 'spearSweep',
        name: "Spear Sweep",
        icon: 'media/skills/dark knight/Skill_Spear_Sweep.png',
        description: 'Performs a sweeping attack with your spear.',
        effects: ['Damage: {damage}'],
        isPassive: false,
        jobTier: 'secondJob',
        baseDamage: 400,
        factorIndex: 21,
        scalesWithLevel: true
    },

    EVIL_EYE: {
        key: 'evilEye',
        name: "Evil Eye",
        icon: 'media/skills/dark knight/Skill_Evil_Eye.png',
        description: 'Summons an Evil Eye that increases damage taken by enemies.',
        effects: ['Damage Taken Increase: {damageTakenIncrease}'],
        isPassive: false,
        jobTier: 'secondJob',
        damageTakenIncrease: { base: 150, factorIndex: 21, scalesWithLevel: true  }
    },

    EVIL_EYE_SHOCK: {
        key: 'evilEyeShock',
        name: "Evil Eye Shock",
        icon: 'media/skills/dark knight/Skill_Evil_Eye_Shock.png',
        description: 'The Evil Eye releases a shock attack.',
        effects: ['Damage: {damage}'],
        isPassive: false,
        jobTier: 'secondJob',
        baseDamage: 700,
        factorIndex: 12,
        scalesWithLevel: true
    },

    HYPER_BODY: {
        key: 'hyperBody',
        name: "Hyper Body",
        icon: 'media/skills/dark knight/Skill_Hyper_Body.png',
        description: 'Increases your attack and defense temporarily.',
        effects: ['Attack Bonus: {attackBonus}', 'Defense Bonus: {defenseBonus}'],
        isPassive: false,
        jobTier: 'secondJob',
        attackBonus: { base: 120, factorIndex: 21, scalesWithLevel: true },
        defenseBonus: { base: 150, factorIndex: 21, scalesWithLevel: true  }
    },

    // 2nd Job Passive Skills
    WEAPON_ACCELERATION: {
        key: 'weaponAcceleration',
        name: "Weapon Acceleration",
        icon: 'media/skills/dark knight/Skill_Weapon_Acceleration_(Dark_Knight).png',
        description: 'Increases your attack speed.',
        effects: ['Attack Speed: {attackSpeed}'],
        isPassive: true,
        jobTier: 'secondJob',
        attackSpeed: { base: 50, factorIndex: 22 , scalesWithLevel: true }
    },

    IRON_WALL: {
        key: 'ironWall',
        name: "Iron Wall",
        icon: 'media/skills/dark knight/Skill_Iron_Wall.png',
        description: 'Converts a portion of your Defense into STR.',
        effects: ['STR from Defense: {strFromDefense}'],
        isPassive: true,
        jobTier: 'secondJob',
        strFromDefense: { base: 100, factorIndex: 22, scalesWithLevel: true  }
    },

    WEAPON_MASTERY: {
        key: 'weaponMastery',
        name: "Weapon Mastery",
        icon: 'media/skills/dark knight/Skill_Weapon_Mastery_(Dark_Knight).png',
        description: 'Increases your minimum damage ratio.',
        effects: ['Min Damage Ratio: {minDamageRatio}'],
        isPassive: true,
        jobTier: 'secondJob',
        minDamageRatio: { base: 150, factorIndex: 22, scalesWithLevel: true  }
    },

    FINAL_ATTACK: {
        key: 'finalAttack',
        name: "Final Attack",
        icon: 'media/skills/dark knight/Skill_Final_Attack.png',
        description: 'Has a chance to trigger an additional attack.',
        effects: ['Damage: {damage}', 'Trigger Chance: 25%'],
        isPassive: true,
        jobTier: 'secondJob',
        baseDamage: 350,
        factorIndex: 21,
        scalesWithLevel: true,
        triggerChance: 25
    },

    // 3rd Job Skills
    LA_MANCHA_SPEAR: {
        key: 'laManchaSpear',
        name: "La Mancha Spear",
        icon: 'media/skills/dark knight/Skill_La_Mancha_Spear.png',
        description: 'Your primary 3rd job attack skill.',
        effects: ['Damage: {damage}'],
        isPassive: false,
        jobTier: 'thirdJob',
        baseDamage: 800,
        factorIndex: 21,
        scalesWithLevel: true
    },

    EVIL_EYE_OF_DOMINANT: {
        key: 'evilEyeOfDominant',
        name: "Evil Eye of Dominant",
        icon: 'media/skills/dark knight/Skill_Evil_Eye_of_Dominant.png',
        description: 'Enhanced Evil Eye attack.',
        effects: ['Damage: {damage}'],
        isPassive: false,
        jobTier: 'thirdJob',
        baseDamage: 600,
        factorIndex: 21,
        scalesWithLevel: true
    },

    RUSH: {
        key: 'rush',
        name: "Rush",
        icon: 'media/skills/dark knight/Skill_Rush_(Dark_Knight).png',
        description: 'Rush forward and attack enemies.',
        effects: ['Damage: {damage}'],
        isPassive: false,
        jobTier: 'thirdJob',
        baseDamage: 6000,
        factorIndex: 12,
        scalesWithLevel: true
    },

    CROSS_OVER_CHAINS: {
        key: 'crossOverChains',
        name: "Cross Over Chains",
        icon: 'media/skills/dark knight/Skill_Cross_Over_Chains.png',
        description: 'Increases attack and toughness.',
        effects: ['Attack Bonus: {attackBonus}', 'Toughness Bonus: {toughnessBonus}'],
        isPassive: false,
        jobTier: 'thirdJob',
        attackBonus: { base: 150, factorIndex: 21, scalesWithLevel: true },
        toughnessBonus: { base: 100, factorIndex: 21, scalesWithLevel: true  }
    },

    EVIL_EYE_SHOCK_ENHANCEMENT: {
        key: 'evilEyeShockEnhancement',
        name: "Evil Eye Shock Enhancement",
        icon: 'media/skills/dark knight/Skill_Evil_Eye_Shock_Enhancement.png',
        description: 'Significantly enhances Evil Eye Shock damage.',
        effects: ['Damage: {damage}'],
        isPassive: false,
        jobTier: 'thirdJob',
        baseDamage: 1075,
        factorIndex: 22,
        scalesWithLevel: true
    },

    HEX_OF_THE_EVIL_EYE: {
        key: 'hexOfTheEvilEye',
        name: "Hex of the Evil Eye",
        icon: 'media/skills/dark knight/Skill_Hex_of_the_Evil_Eye.png',
        description: 'Evil Eye places a hex that increases attack.',
        effects: ['Attack Bonus: {attackBonus}'],
        isPassive: false,
        jobTier: 'thirdJob',
        attackBonus: { base: 150, factorIndex: 22, scalesWithLevel: true }
    },

    LORD_OF_DARKNESS: {
        key: 'lordOfDarkness',
        name: "Lord of Darkness",
        icon: 'media/skills/dark knight/Skill_Lord_of_Darkness.png',
        description: 'Passive skill that enhances HP recovery and critical stats.',
        effects: ['HP Recovery: {hpRecovery}', 'Critical Rate: {criticalRate}', 'Critical Damage: {criticalDamage}'],
        isPassive: true,
        jobTier: 'thirdJob',
        hpRecovery: { base: 15, factorIndex: 22, scalesWithLevel: false },
        criticalRate: { base: 80, factorIndex: 22, scalesWithLevel: true },
        criticalDamage: { base: 300, factorIndex: 22, scalesWithLevel: true }
    },

    ENDURE: {
        key: 'endure',
        name: "Endure",
        icon: 'media/skills/dark knight/Skill_Endure.png',
        description: 'Increases Debuff Tolerance.',
        effects: ['Debuff Tolerance: {debuffTolerance}'],
        isPassive: true,
        jobTier: 'thirdJob',
        debuffTolerance: { base: 15, factorIndex: 22, scalesWithLevel: true, isFlat: true }
    }
};

/**
 * Calculate skill effect value based on level
 * @param baseValue - Base value from skill data
 * @param factorIndex - Factor table index (12, 21, or 22)
 * @param level - Character level
 * @param scalesWithLevel - Whether the skill scales with level (default: true)
 * @param isFlat - Whether the value is a flat number (not a percentage) (default: false)
 * @returns Calculated value
 */
function calculateSkillValue(baseValue: number, factorIndex: number, level: number, scalesWithLevel: boolean = true, isFlat: boolean = false): number {
    if (!scalesWithLevel) {
        return isFlat ? baseValue : baseValue / 10; // Convert to percentage unless it's a flat value
    }

    const factor = getFactorForLevel(level, factorIndex);
    const base = isFlat ? baseValue : baseValue / 10;
    const multiplier = factor / 1000;

    return base * multiplier;
}

// ============================================================================
// 2ND JOB DARK KNIGHT SKILLS
// ============================================================================

/**
 * Calculate Spear Sweep damage
 * @param level - Character level
 * @returns Damage percentage
 */
export function calculateSpearSweep(level: number): number {
    const config = DARK_KNIGHT_SKILLS.SPEAR_SWEEP;
    return calculateSkillValue(config.baseDamage, config.factorIndex, level);
}

/**
 * Calculate Evil Eye damage taken increase
 * @param level - Character level
 * @returns Damage taken increase percentage
 */
export function calculateEvilEye(level: number): number {
    const config = DARK_KNIGHT_SKILLS.EVIL_EYE.damageTakenIncrease;
    return calculateSkillValue(config.base, config.factorIndex, level);
}

/**
 * Calculate Evil Eye Shock damage
 * @param level - Character level
 * @returns Damage percentage
 */
export function calculateEvilEyeShock(level: number): number {
    const config = DARK_KNIGHT_SKILLS.EVIL_EYE_SHOCK;
    return calculateSkillValue(config.baseDamage!, config.factorIndex!, level);
}

/**
 * Calculate Hyper Body bonuses
 * @param level - Character level
 * @returns Attack and Defense bonuses
 */
export function calculateHyperBody(level: number): HyperBodyResult {
    const config = DARK_KNIGHT_SKILLS.HYPER_BODY;
    return {
        attackBonus: calculateSkillValue(config.attackBonus!.base, config.attackBonus!.factorIndex, level),
        defenseBonus: calculateSkillValue(config.defenseBonus!.base, config.defenseBonus!.factorIndex, level)
    };
}

/**
 * Calculate Weapon Acceleration attack speed bonus
 * @param level - Character level
 * @returns Attack speed percentage
 */
export function calculateWeaponAcceleration(level: number): number {
    const config = DARK_KNIGHT_SKILLS.WEAPON_ACCELERATION.attackSpeed!;
    return calculateSkillValue(config.base, config.factorIndex, level);
}

/**
 * Calculate Iron Wall STR bonus from Defense
 * @param level - Character level
 * @returns Percentage of Defense converted to STR
 */
export function calculateIronWall(level: number): number {
    const config = DARK_KNIGHT_SKILLS.IRON_WALL.strFromDefense!;
    return calculateSkillValue(config.base, config.factorIndex, level);
}

/**
 * Calculate Weapon Mastery min damage ratio bonus
 * @param level - Character level
 * @returns Min damage ratio percentage
 */
export function calculateWeaponMastery(level: number): number {
    const config = DARK_KNIGHT_SKILLS.WEAPON_MASTERY.minDamageRatio!;
    return calculateSkillValue(config.base, config.factorIndex, level);
}

/**
 * Calculate Final Attack damage
 * @param level - Character level
 * @returns Damage percentage
 */
export function calculateFinalAttack(level: number): number {
    const config = DARK_KNIGHT_SKILLS.FINAL_ATTACK;
    return calculateSkillValue(config.baseDamage!, config.factorIndex!, level, config.scalesWithLevel!);
}

// ============================================================================
// 3RD JOB DARK KNIGHT SKILLS
// ============================================================================

/**
 * Calculate Dark Knight La Mancha Spear damage
 * @param level - Character level
 * @returns Damage percentage
 */
export function calculateLaManchaSpear(level: number): number {
    const config = DARK_KNIGHT_SKILLS.LA_MANCHA_SPEAR;
    return calculateSkillValue(config.baseDamage!, config.factorIndex!, level, config.scalesWithLevel!);
}

/**
 * Calculate Evil Eye of Dominant damage
 * @param level - Character level
 * @returns Damage percentage
 */
export function calculateEvilEyeOfDominant(level: number): number {
    const config = DARK_KNIGHT_SKILLS.EVIL_EYE_OF_DOMINANT;
    return calculateSkillValue(config.baseDamage!, config.factorIndex!, level, config.scalesWithLevel!);
}

/**
 * Calculate Dark Knight Rush damage
 * @param level - Character level
 * @returns Damage percentage
 */
export function calculateRush(level: number): number {
    const config = DARK_KNIGHT_SKILLS.RUSH;
    return calculateSkillValue(config.baseDamage!, config.factorIndex!, level, config.scalesWithLevel!);
}

/**
 * Calculate Cross Over Chains attack bonus
 * @param level - Character level
 * @returns Attack bonus percentage
 */
export function calculateCrossOverChainsAttack(level: number): number {
    const config = DARK_KNIGHT_SKILLS.CROSS_OVER_CHAINS.attackBonus!;
    return calculateSkillValue(config.base, config.factorIndex, level);
}

/**
 * Calculate Cross Over Chains toughness bonus
 * @param level - Character level
 * @returns Toughness bonus percentage
 */
export function calculateCrossOverChainsToughness(level: number): number {
    const config = DARK_KNIGHT_SKILLS.CROSS_OVER_CHAINS.toughnessBonus!;
    return calculateSkillValue(config.base, config.factorIndex, level);
}

/**
 * Calculate Evil Eye Shock Enhancement damage
 * @param level - Character level
 * @returns Damage percentage
 */
export function calculateEvilEyeShockEnhancement(level: number): number {
    const config = DARK_KNIGHT_SKILLS.EVIL_EYE_SHOCK_ENHANCEMENT;
    return calculateSkillValue(config.baseDamage!, config.factorIndex!, level, config.scalesWithLevel!);
}

/**
 * Calculate Hex of the Evil Eye attack bonus
 * @param level - Character level
 * @returns Attack bonus percentage
 */
export function calculateHexOfTheEvilEye(level: number): number {
    const config = DARK_KNIGHT_SKILLS.HEX_OF_THE_EVIL_EYE.attackBonus!;
    return calculateSkillValue(config.base, config.factorIndex, level);
}

/**
 * Calculate Lord of Darkness effects
 * @param level - Character level
 * @returns Object with HP recovery, crit rate, and crit damage
 */
export function calculateLordOfDarkness(level: number): LordOfDarknessResult {
    const config = DARK_KNIGHT_SKILLS.LORD_OF_DARKNESS;

    return {
        hpRecovery: calculateSkillValue(
            config.hpRecovery!.base,
            config.hpRecovery!.factorIndex,
            level,
            config.hpRecovery!.scalesWithLevel
        ),
        criticalRate: calculateSkillValue(
            config.criticalRate!.base,
            config.criticalRate!.factorIndex,
            level
        ),
        criticalDamage: calculateSkillValue(
            config.criticalDamage!.base,
            config.criticalDamage!.factorIndex,
            level
        )
    };
}

/**
 * Calculate Endure debuff tolerance
 * @param level - Character level
 * @returns Debuff tolerance
 */
export function calculateEndure(level: number): number {
    const config = DARK_KNIGHT_SKILLS.ENDURE.debuffTolerance!;
    return calculateSkillValue(config.base, config.factorIndex, level, config.scalesWithLevel, config.isFlat!);
}

/**
 * Get all Dark Knight skill values at a specific level
 * @param level - Character level
 * @returns All Dark Knight skill values
 */
export function getAllDarkKnightSkills(level: number): AllDarkKnightSkills {
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

// ============================================================================
// JOB SKILL PASSIVE GAINS FOR DPS CALCULATION
// ============================================================================

/**
 * Get DPS-relevant passives from generated class skills by job tier
 * Works with the new format from all-class-skills.js
 * @param classSkills - The skill data object for a class (e.g., HERO_SKILLS)
 * @param jobTier - Numeric job tier (1, 2, 3, or 4)
 * @returns Array of passive skill objects with DPS-relevant effects
 */
function getPassivesByTier(classSkills: ClassSkills, jobTier: JobTier): Array<{ skillKey: string; name: string; skillData: GeneratedSkillData }> {
    const passives: Array<{ skillKey: string; name: string; skillData: GeneratedSkillData }> = [];

    for (const [skillKey, skillData] of Object.entries(classSkills)) {
        // Only include skills from the specified job tier that are DPS relevant
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

/**
 * Get DPS-relevant complex passives from generated class skills by job tier
 * @param classSkills - The skill data object for a class (e.g., HERO_SKILLS)
 * @param jobTier - Numeric job tier (1, 2, 3, or 4)
 * @returns Array of complex passive skill objects
 */
function getComplexPassivesByTier(classSkills: ClassSkills, jobTier: JobTier): Array<{ skillKey: string; name: string; skillData: GeneratedSkillData }> {
    const passives: Array<{ skillKey: string; name: string; skillData: GeneratedSkillData }> = [];

    for (const [skillKey, skillData] of Object.entries(classSkills)) {
        // Only include complex skills from the specified job tier
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

/**
 * Calculate passive stat gains from job skill level bonuses
 * @param className - Class name (e.g., 'dark-knight')
 * @param characterLevel - Current character level
 * @param skillLevelBonuses - Object with jobTier keys and skill level bonus values
 *   Example: { firstJob: 0, secondJob: 1, thirdJob: 2, fourthJob: 0, allSkills: 1 }
 * @param currentStats - Current character stats (needed for Iron Wall defense → STR conversion)
 * @returns Object with stat changes and breakdown
 *   Example: {
 *     statChanges: { attackSpeed: 6.5, minDamage: 19.5, critRate: 10.4, critDamage: 39 },
 *     breakdown: [{ passive: "Weapon Acceleration", stat: "attackSpeed", gain: 6.5 }],
 *     complexPassives: [{ passive: "Final Attack", note: "25% chance to proc 45.5% damage" }]
 *   }
 */
export function calculateJobSkillPassiveGains(
    className: string,
    characterLevel: number,
    skillLevelBonuses: SkillLevelBonuses,
    baseStats: BaseStats
): JobSkillPassiveGainsResult {
    // Get the class skills data
    const classSkills = CLASS_TO_SKILLS_MAP[className];

    if (!classSkills) {
        return {
            statChanges: {},
            breakdown: [],
            complexPassives: [],
            complexStatChanges: {}
        };
    }

    const statChanges: Record<string, number> = {};
    const breakdown: PassiveBreakdown[] = [];
    const complexPassives: ComplexPassive[] = [];
    const complexStatChanges: Record<string, number> = {};
    complexStatChanges['finalAttack'] = 0;

    const jobTiers: JobTier[] = [1, 2, 3, 4];
    const jobTierNames: JobTierString[] = ['firstJob', 'secondJob', 'thirdJob', 'fourthJob'];
    const allSkillsBonus = skillLevelBonuses.allSkills || 0;

    for (let i = 0; i < jobTiers.length; i++) {
        const tierNumber = jobTiers[i];
        const tierName = jobTierNames[i];
        const tierBonus = (skillLevelBonuses[tierName] || 0) + allSkillsBonus;

        // Get regular passives for this tier
        const passives = getPassivesByTier(classSkills, tierNumber as JobTier);

        for (const { name, skillData } of passives) {
            // Calculate input levels for factor table lookup using shared helper
            const baseInputLevel = calculateSkillInputLevel(characterLevel, tierNumber as JobTier, 0);
            const bonusInputLevel = calculateSkillInputLevel(characterLevel, tierNumber as JobTier, tierBonus);

            // Process each effect in the skill's effects array
            for (const effect of skillData.effects) {
                // The 'type' field is "flat" or "percent"
                const isFlat = effect.type === 'flat';

                // Calculate the stat value at base input level
                const baseValue = calculateSkillValue(
                    effect.baseValue,
                    effect.factorIndex,
                    baseInputLevel,
                    true,  // scalesWithLevel - always true for passives
                    isFlat
                );

                // Calculate the stat value at bonus input level
                const bonusValue = calculateSkillValue(
                    effect.baseValue,
                    effect.factorIndex,
                    bonusInputLevel,
                    true,  // scalesWithLevel - always true for passives
                    isFlat
                );

                const statGain = bonusValue - baseValue;
                const calculatorStat = effect.stat;

                // Special handling for defense stat (converts to mainStat for Dark Knight)
                if (calculatorStat === 'defense') {
                    // Calculate the actual defense increase (as a flat number)
                    const defenseValue = statGain; // This is the defense % value from the skill
                    const mainStatIncrease = (baseStats.DEFENSE || 0) * (defenseValue / 100);

                    // Use StatCalculationService to apply defense core
                    // The circular dependency is avoided by using calculateFinalAttackBonusFromJobSkills
                    // which doesn't create a StatCalculationService
                    // Pass 0 for weaponAttackBonus to avoid double-application (bonus will be applied later)
                    const statService = new StatCalculationService(baseStats, 0);
                    const beforeStats = statService.getStats();

                    // Add the defense - for Dark Knight this will convert to main stat, attack, and stat damage
                    statService.add(STAT.PRIMARY_MAIN_STAT.id, mainStatIncrease);
                    const afterStats = statService.getStats();

                    // Calculate the gains by comparing before and after
                    const mainStatGain = afterStats.PRIMARY_MAIN_STAT - beforeStats.PRIMARY_MAIN_STAT;
                    const statDamageGain = afterStats.STAT_DAMAGE - beforeStats.STAT_DAMAGE;
                    const attackGain = afterStats.ATTACK - beforeStats.ATTACK;

                    // Add gains to statChanges
                    if (!statChanges['mainStat']) statChanges['mainStat'] = 0;
                    statChanges['mainStat'] += mainStatGain;
                    if (!statChanges['statDamage']) statChanges['statDamage'] = 0;
                    statChanges['statDamage'] += statDamageGain;
                    if (!statChanges['attack']) statChanges['attack'] = 0;
                    statChanges['attack'] += attackGain;

                    breakdown.push({
                        passive: name,
                        stat: 'defense',
                        statDisplay: 'Defense',
                        baseValue: baseValue,
                        bonusValue: bonusValue,
                        gain: statGain,
                        isPercent: true,
                        note: `+${statGain.toFixed(2)} DEF% → +${mainStatGain.toFixed(0)} Main Stat, +${statDamageGain.toFixed(2)}% Stat Damage, +${attackGain.toFixed(0)} ATK`
                    });
                } else {
                    // Standard stat gain
                    if (!statChanges[calculatorStat]) statChanges[calculatorStat] = 0;
                    statChanges[calculatorStat] += statGain;

                    // Determine if this stat should display with % sign
                    const isPercent = ['attackSpeed', 'minDamage', 'maxDamage', 'critRate', 'critDamage', 'statDamage', 'finalDamage', 'damage', 'bossDamage', 'normalDamage', 'skillDamage', 'damageAmp', 'basicAttackDamage'].includes(calculatorStat);

                    breakdown.push({
                        passive: name,
                        stat: calculatorStat,
                        baseValue: baseValue,
                        bonusValue: bonusValue,
                        gain: statGain,
                        isPercent: isPercent
                    });
                }
            }
        }

        // Get complex passives for this tier (these have notes/conditions and are shown separately)
        const complexPassivesForTier = getComplexPassivesByTier(classSkills, tierNumber as JobTier);

        for (const { name, skillData } of complexPassivesForTier) {
            const baseInputLevel = calculateSkillInputLevel(characterLevel, tierNumber as JobTier, 0);
            const bonusInputLevel = calculateSkillInputLevel(characterLevel, tierNumber as JobTier, tierBonus);

            // Complex passives are just shown with their note
            // If they have effects, we calculate the difference to show the gain
            if (skillData.effects && skillData.effects.length > 0) {
                for (const effect of skillData.effects) {
                    const isFlat = effect.type === 'flat';

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

                    if (calculatorStat.toLowerCase() === 'finalattack')
                    {
                        complexStatChanges['finalAttack'] += bonusValue;
                    }

                    complexPassives.push({
                        passive: name,
                        stat: calculatorStat,
                        baseValue: baseValue,
                        bonusValue: bonusValue,
                        gain: gain,
                        isPercent: !isFlat,
                        note: skillData.note || ''
                    });
                }
            } else {
                // Just show the note for complex passives with no effects
                complexPassives.push({
                    passive: name,
                    note: skillData.note || 'Complex passive'
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

/**
 * Calculate final attack bonus from job skills without creating a StatCalculationService
 * This directly calculates the Final Attack skill value to avoid circular dependencies
 * @param className - Class name
 * @param characterLevel - Character level
 * @param skillLevels - Skill level bonuses
 * @returns Final attack bonus multiplier (e.g., 1.45 for 45% bonus)
 */
export function calculateFinalAttackBonusFromJobSkills(
    className: string | null,
    characterLevel: number,
    skillLevels: {
        firstJob?: number;
        secondJob?: number;
        thirdJob?: number;
        fourthJob?: number;
        allSkills?: number;
    }
): number {
    if (!className) return 1;

    const classSkills = CLASS_TO_SKILLS_MAP[className];
    if (!classSkills) return 1;

    let finalAttackBonus = 0;

    // Check all job tiers for Final Attack skills
    const jobTiers: JobTier[] = [1, 2, 3, 4];
    const jobTierNames: JobTierString[] = ['firstJob', 'secondJob', 'thirdJob', 'fourthJob'];
    const allSkillsBonus = skillLevels.allSkills || 0;

    for (let i = 0; i < jobTiers.length; i++) {
        const tierNumber = jobTiers[i];
        const tierName = jobTierNames[i];
        const tierBonus = (skillLevels[tierName] || 0) + allSkillsBonus;

        // Get complex passives for this tier (Final Attack is a complex passive)
        for (const [skillKey, skillData] of Object.entries(classSkills)) {
            if (skillData.jobStep === tierNumber && skillData.isComplex) {
                // Check if this is a Final Attack skill (by checking effect stat)
                const hasFinalAttack = skillData.effects?.some(
                    effect => effect.stat.toLowerCase() === 'finalattack'
                );

                if (hasFinalAttack && skillData.effects) {
                    const effect = skillData.effects[0]; // Final Attack skills have one effect
                    const bonusInputLevel = calculateSkillInputLevel(characterLevel, tierNumber, tierBonus);

                    const bonusValue = calculateSkillValue(
                        effect.baseValue,
                        effect.factorIndex,
                        bonusInputLevel,
                        true,
                        effect.type === 'flat'
                    );

                    finalAttackBonus += bonusValue;
                }
            }
        }
    }

    if (finalAttackBonus !== 0) {
        return (1 + finalAttackBonus / 100);
    }

    return 1;
}
