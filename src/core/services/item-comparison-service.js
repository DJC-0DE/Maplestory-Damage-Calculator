// Item Comparison Service
// Provides item comparison functionality using StatCalculationService and skill services

import { StatCalculationService } from './stat-calculation-service.js';
import { loadoutStore } from '@ts/store/loadout.store.js';
import { SkillCoefficientService, SkillPassiveGainsService } from './skill-service.js';

// Initialize skill services
const skillCoefficientService = new SkillCoefficientService();
const skillPassiveGainsService = new SkillPassiveGainsService();

/**
 * Apply item comparison to base stats
 * Calculates the stat differences between equipped and comparison items
 *
 * @param {Object} baseStats - The base stats object
 * @param {Object} equippedItem - Currently equipped item
 * @param {Object} comparisonItem - Item to compare against
 * @param {Object} context - Additional context for calculations
 * @param {string} context.currentClass - Character class (e.g., 'dark-knight')
 * @param {number} context.characterLevel - Character level
 * @param {string} context.jobTier - '3rd' or '4th'
 * @param {number} context.baseSkillLevel1st - Base 1st job skill level
 * @param {number} context.baseSkillLevel2nd - Base 2nd job skill level
 * @param {number} context.baseSkillLevel3rd - Base 3rd job skill level
 * @param {number} context.baseSkillLevel4th - Base 4th job skill level
 * @param {number} context.defense - Defense stat
 * @returns {Object} Modified stats copy with item comparison applied
 */
export function applyItemToStats(baseStats, equippedItem, comparisonItem, context) {
    const weaponAttackBonus = loadoutStore.getWeaponAttackBonus().totalAttack;

    // Create StatCalculationService with explicit weapon attack bonus
    const service = new StatCalculationService(baseStats, weaponAttackBonus);

    // === Attack ===
    // Subtract equipped item's attack and add comparison item's attack
    service.subtractAttack(equippedItem.attack || 0, true);
    service.addAttack(comparisonItem.attack || 0, true);

    // === Main Stat ===
    // Calculate main stat difference (Dark Knight defense handled separately)
    let mainStatChange = -(equippedItem.mainStat || 0) + (comparisonItem.mainStat || 0);
    service.addMainStat(mainStatChange);

    // === Defense (with Dark Knight conversion) ===
    // Subtract equipped defense and add comparison defense
    // DK conversion is handled automatically by addDefense/subtractDefense
    service.subtractDefense(equippedItem.defense || 0);
    service.addDefense(comparisonItem.defense || 0);

    // === Skill Coefficient ===
    // Calculate and apply skill coefficient difference
    const skillCoeffContext = {
        characterLevel: context.characterLevel,
        jobTier: context.jobTier,
        baseSkillLevel3rd: context.baseSkillLevel3rd,
        baseSkillLevel4th: context.baseSkillLevel4th
    };
    const skillCoeffDiff = skillCoefficientService.calculateCoefficientDifference(
        equippedItem,
        comparisonItem,
        skillCoeffContext
    );
    service.addPercentageStat('skillCoeff', skillCoeffDiff);

    // === Skill Passive Gains ===
    // Calculate and apply passive stat gains from skill level differences
    const passiveGainsContext = {
        currentClass: context.currentClass,
        characterLevel: context.characterLevel,
        baseSkillLevel1st: context.baseSkillLevel1st,
        baseSkillLevel2nd: context.baseSkillLevel2nd,
        baseSkillLevel3rd: context.baseSkillLevel3rd,
        baseSkillLevel4th: context.baseSkillLevel4th,
        defense: context.defense
    };
    const passiveGainsDiff = skillPassiveGainsService.calculatePassiveGainsDifference(
        equippedItem,
        comparisonItem,
        passiveGainsContext
    );

    // Apply each passive stat gain
    Object.entries(passiveGainsDiff.statChanges).forEach(([stat, value]) => {
        if (value !== 0) {
            service.addPercentageStat(stat, value);
        }
    });

    // === Final Damage (Multiplicative) ===
    // Remove equipped item's multiplicative contribution and add comparison item's
    // Note: We need to handle this specially since final damage is multiplicative
    const currentFinalDamage = service.getStats().finalDamage || 0;
    const equippedFinalDamage = equippedItem.finalDamage || 0;
    const comparisonFinalDamage = comparisonItem.finalDamage || 0;

    // Apply the multiplicative difference using the formula:
    // new = (current / (1 + equipped/100)) * (1 + comparison/100) - 1) * 100
    if (equippedFinalDamage !== 0 || comparisonFinalDamage !== 0) {
        const baseMultiplier = 1 + (currentFinalDamage / 100);
        const equippedMultiplier = 1 + (equippedFinalDamage / 100);
        const comparisonMultiplier = 1 + (comparisonFinalDamage / 100);

        const newMultiplier = (baseMultiplier / equippedMultiplier) * comparisonMultiplier;
        const newFinalDamage = (newMultiplier - 1) * 100;

        service.setStat('finalDamage', newFinalDamage);
    }

    // === Percentage Stats (Explicit Mapping) ===
    // Crit Rate
    service.subtractStat('critRate', equippedItem.critRate || 0);
    service.addPercentageStat('critRate', comparisonItem.critRate || 0);

    // Crit Damage
    service.subtractStat('critDamage', equippedItem.critDamage || 0);
    service.addPercentageStat('critDamage', comparisonItem.critDamage || 0);

    // Boss Damage
    service.subtractStat('bossDamage', equippedItem.bossDamage || 0);
    service.addPercentageStat('bossDamage', comparisonItem.bossDamage || 0);

    // Normal Damage
    service.subtractStat('normalDamage', equippedItem.normalDamage || 0);
    service.addPercentageStat('normalDamage', comparisonItem.normalDamage || 0);

    // Damage (general)
    service.subtractStat('damage', equippedItem.damage || 0);
    service.addPercentageStat('damage', comparisonItem.damage || 0);

    // Min/Max Damage
    service.subtractStat('minDamage', equippedItem.minDamage || 0);
    service.addPercentageStat('minDamage', comparisonItem.minDamage || 0);

    service.subtractStat('maxDamage', equippedItem.maxDamage || 0);
    service.addPercentageStat('maxDamage', comparisonItem.maxDamage || 0);

    // Get the final stats
    const newStats = service.getStats();

    // === Passive Gains Breakdown (for UI) ===
    // Store passive gain breakdown for UI display (only show if there's a difference)
    const hasSkillLevelDiff = (comparisonItem.skillLevel1st || 0) !== (equippedItem.skillLevel1st || 0) ||
        (comparisonItem.skillLevel2nd || 0) !== (equippedItem.skillLevel2nd || 0) ||
        (comparisonItem.skillLevel3rd || 0) !== (equippedItem.skillLevel3rd || 0) ||
        (comparisonItem.skillLevel4th || 0) !== (equippedItem.skillLevel4th || 0) ||
        (comparisonItem.skillLevelAll || 0) !== (equippedItem.skillLevelAll || 0);

    if (hasSkillLevelDiff) {
        newStats.passiveGainsBreakdown = {
            comparison: passiveGainsDiff
        };
    }

    return newStats;
}
