import { BaseStats } from "@ts/types";
import { getSelectedStageDefense } from "./stage-defense.service";

// Main damage calculation function
export function calculateDamage(stats: BaseStats, monsterType) {
    // Step 1: Calculate Base Damage
    const totalSkillMastery = stats.MASTERY + (monsterType === 'boss' ? stats.BOSS_MASTERY : 0);
    const baseDamage = stats.ATTACK * (stats.SKILL_COEFFICIENT / 100) * (1 + totalSkillMastery / 100);

    // Step 2: Calculate Base Hit Damage
    const damageAmpMultiplier = 1 + stats.DAMAGE_AMP / 100;

    // Get selected stage's defense values
    const stageDefense = getSelectedStageDefense();

    // Defense Penetration: Reduce enemy's effective defense
    const effectiveDefense = stageDefense.defense * (1 - stats.DEF_PEN / 100);

    // Defense uses diminishing returns formula: damage dealt = 6000 / (6000 + defense)
    // This ensures defense never reduces damage to zero, even at very high values
    const damageReduction = 6000 / (6000 + effectiveDefense);

    const monsterDamage = monsterType === 'boss' ? stats.BOSS_DAMAGE : stats.NORMAL_DAMAGE;

    const finalDamageMultiplier = 1 + (stats.FINAL_DAMAGE / 100);

    const baseHitDamage = baseDamage *
        (1 + stats.STAT_DAMAGE / 100) *
        (1 + stats.DAMAGE / 100) *
        (1 + monsterDamage / 100) *
        damageAmpMultiplier *
        damageReduction *
        finalDamageMultiplier;

    // Step 3: Calculate Non-Crit Damage Range
    const nonCritMin = baseHitDamage * (Math.min(stats.MIN_DAMAGE, stats.MAX_DAMAGE) / 100);
    const nonCritMax = baseHitDamage * (stats.MAX_DAMAGE / 100);
    const nonCritAvg = (nonCritMin + nonCritMax) / 2;

    // Step 4: Calculate Crit Damage
    const critMultiplier = 1 + (stats.CRIT_DAMAGE / 100);
    const critMin = nonCritMin * critMultiplier;
    const critMax = nonCritMax * critMultiplier;
    const critAvg = nonCritAvg * critMultiplier;

    // Step 5: Calculate Expected Damage
    // Cap critical rate at 100%
    const cappedCritRate = Math.min(stats.CRIT_RATE, 100);
    const critRate = cappedCritRate / 100;
    const expectedDamage = nonCritAvg * (1 - critRate) + critAvg * critRate;

    // Step 6: Calculate DPS
    // Attack speed uses formula: AS = 150(1 - ∏(1 - s/150)) with hard cap at 150%
    // Any attack speed over 150% is capped and ignored
    const cappedAttackSpeed = Math.min(stats.ATTACK_SPEED, 150);
    const attackSpeedMultiplier = 1 + (cappedAttackSpeed / 100);
    const dps = expectedDamage * attackSpeedMultiplier;

    return {
        baseDamage,
        baseHitDamage,
        nonCritMin,
        nonCritMax,
        nonCritAvg,
        critMin,
        critMax,
        critAvg,
        expectedDamage,
        dps,
        damageAmpMultiplier,
        attackSpeedMultiplier,
        finalDamageMultiplier
    };
}