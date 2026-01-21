/**
 * Strongly typed interface for all character stats
 * Uses clean camelCase property names without hyphens
 */
export interface Stat {
    attack: string;
    critRate: string;
    critDamage: string;
    statDamage: string;
    damage: string;
    damageAmp: string;
    attackSpeed: string;
    defPen: string;
    bossDamage: string;
    normalDamage: string;
    skillCoeff: string;
    skillMastery: string;
    skillMasteryBoss: string;
    minDamage: string;
    maxDamage: string;
    mainStat: string;
    secondaryStat: string;
    finalDamage: string;
    targetStage: string;
    defense: string;
    mainStatPct: string;
    skillLevel1st: string;
    skillLevel2nd: string;
    skillLevel3rd: string;
    skillLevel4th: string;
    str: string;
    dex: string;
    int: string;
    luk: string;
    characterLevel: string;
}

/**
 * Base setup fields in camelCase (used for element IDs, stat keys, storage)
 */
export const BASE_SETUP_FIELDS = [
    'attack', 'critRate', 'critDamage', 'statDamage', 'damage',
    'damageAmp', 'attackSpeed', 'defPen', 'bossDamage',
    'normalDamage', 'skillCoeff', 'skillMastery', 'skillMasteryBoss',
    'minDamage', 'maxDamage', 'mainStat', 'secondaryStat', 'finalDamage',
    'targetStage', 'defense', 'mainStatPct',
    'skillLevel1st', 'skillLevel2nd', 'skillLevel3rd', 'skillLevel4th',
    'str', 'dex', 'int', 'luk', 'characterLevel'
] as const;

export type StatKey = typeof BASE_SETUP_FIELDS[number];

/**
 * Get DOM element ID for a stat (same as stat key after cleanup)
 */
export function getStatElementId(stat: StatKey): string {
    return stat;
}
