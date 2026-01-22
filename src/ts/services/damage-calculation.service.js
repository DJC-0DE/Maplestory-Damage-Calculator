import { getSelectedStageDefense } from "./stage-defense.service.js";
function calculateDamage(stats, monsterType) {
  const totalSkillMastery = stats.MASTERY + (monsterType === "boss" ? stats.BOSS_MASTERY : 0);
  const baseDamage = stats.ATTACK * (stats.SKILL_COEFFICIENT / 100) * (1 + totalSkillMastery / 100);
  const damageAmpMultiplier = 1 + stats.DAMAGE_AMP / 100;
  const stageDefense = getSelectedStageDefense();
  const effectiveDefense = stageDefense.defense * (1 - stats.DEF_PEN / 100);
  const damageReduction = 6e3 / (6e3 + effectiveDefense);
  const monsterDamage = monsterType === "boss" ? stats.BOSS_DAMAGE : stats.NORMAL_DAMAGE;
  const finalDamageMultiplier = 1 + stats.FINAL_DAMAGE / 100;
  const baseHitDamage = baseDamage * (1 + stats.STAT_DAMAGE / 100) * (1 + stats.DAMAGE / 100) * (1 + monsterDamage / 100) * damageAmpMultiplier * damageReduction * finalDamageMultiplier;
  const nonCritMin = baseHitDamage * (Math.min(stats.MIN_DAMAGE, stats.MAX_DAMAGE) / 100);
  const nonCritMax = baseHitDamage * (stats.MAX_DAMAGE / 100);
  const nonCritAvg = (nonCritMin + nonCritMax) / 2;
  const critMultiplier = 1 + stats.CRIT_DAMAGE / 100;
  const critMin = nonCritMin * critMultiplier;
  const critMax = nonCritMax * critMultiplier;
  const critAvg = nonCritAvg * critMultiplier;
  const cappedCritRate = Math.min(stats.CRIT_RATE, 100);
  const critRate = cappedCritRate / 100;
  const expectedDamage = nonCritAvg * (1 - critRate) + critAvg * critRate;
  const cappedAttackSpeed = Math.min(stats.ATTACK_SPEED, 150);
  const attackSpeedMultiplier = 1 + cappedAttackSpeed / 100;
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
export {
  calculateDamage
};
//# sourceMappingURL=damage-calculation.service.js.map
