// Skill Service
// Provides skill coefficient and passive gains calculations for item comparisons

import {
    calculate3rdJobSkillCoefficient,
    calculate4thJobSkillCoefficient,
    calculateJobSkillPassiveGains
} from '@core/features/skills/skill-coefficient.js';

/**
 * SkillCoefficientService - Handles skill coefficient calculations
 *
 * This service calculates the difference in skill coefficients between equipped
 * and comparison items, accounting for both 3rd and 4th job skill levels.
 *
 * Usage:
 *   const service = new SkillCoefficientService();
 *   const diff = service.calculateCoefficientDifference(equippedItem, comparisonItem, context);
 */
export class SkillCoefficientService {
    /**
     * Calculate the difference in skill coefficient between two items
     *
     * @param {Object} equippedItem - Currently equipped item
     * @param {Object} comparisonItem - Item to compare against
     * @param {Object} context - Calculation context
     * @param {number} context.characterLevel - Character level
     * @param {string} context.jobTier - '3rd' or '4th'
     * @param {number} context.baseSkillLevel3rd - Base 3rd job skill level
     * @param {number} context.baseSkillLevel4th - Base 4th job skill level
     * @returns {number} Skill coefficient difference to apply to stats
     */
    calculateCoefficientDifference(equippedItem, comparisonItem, context) {
        const { characterLevel, jobTier, baseSkillLevel3rd, baseSkillLevel4th } = context;

        // Calculate total skill level for 3rd and 4th job
        const equipped3rdJobTotal = baseSkillLevel3rd + (equippedItem.skillLevel3rd || 0) + (equippedItem.skillLevelAll || 0);
        const equipped4thJobTotal = baseSkillLevel4th + (equippedItem.skillLevel4th || 0) + (equippedItem.skillLevelAll || 0);
        const comparison3rdJobTotal = baseSkillLevel3rd + (comparisonItem.skillLevel3rd || 0) + (comparisonItem.skillLevelAll || 0);
        const comparison4thJobTotal = baseSkillLevel4th + (comparisonItem.skillLevel4th || 0) + (comparisonItem.skillLevelAll || 0);

        // Calculate coefficient with equipped item's skill level
        const coeffWithEquipped = jobTier === '4th'
            ? calculate4thJobSkillCoefficient(characterLevel, equipped4thJobTotal)
            : calculate3rdJobSkillCoefficient(characterLevel, equipped3rdJobTotal);

        // Calculate coefficient with comparison item's skill level
        const coeffWithComparison = jobTier === '4th'
            ? calculate4thJobSkillCoefficient(characterLevel, comparison4thJobTotal)
            : calculate3rdJobSkillCoefficient(characterLevel, comparison3rdJobTotal);

        // Return the difference
        return coeffWithComparison - coeffWithEquipped;
    }
}

/**
 * SkillPassiveGainsService - Handles skill passive gains calculations
 *
 * This service calculates the difference in passive stat gains from skill levels
 * between equipped and comparison items.
 *
 * Usage:
 *   const service = new SkillPassiveGainsService();
 *   const result = service.calculatePassiveGainsDifference(equippedItem, comparisonItem, context);
 */
export class SkillPassiveGainsService {
    /**
     * Calculate the difference in passive gains between two items
     *
     * @param {Object} equippedItem - Currently equipped item
     * @param {Object} comparisonItem - Item to compare against
     * @param {Object} context - Calculation context
     * @param {string} context.currentClass - Character class (e.g., 'dark-knight')
     * @param {number} context.characterLevel - Character level
     * @param {number} context.baseSkillLevel1st - Base 1st job skill level
     * @param {number} context.baseSkillLevel2nd - Base 2nd job skill level
     * @param {number} context.baseSkillLevel3rd - Base 3rd job skill level
     * @param {number} context.baseSkillLevel4th - Base 4th job skill level
     * @param {number} context.defense - Defense stat
     * @returns {Object} Passive gains difference
     * @returns {Object} .statChanges - Stat changes to apply (key-value pairs)
     * @returns {Array} .breakdown - Breakdown for UI display
     * @returns {Array} .complexPassives - Complex passives for UI display
     */
    calculatePassiveGainsDifference(equippedItem, comparisonItem, context) {
        const { currentClass, characterLevel, baseSkillLevel1st, baseSkillLevel2nd, baseSkillLevel3rd, baseSkillLevel4th, defense } = context;

        // Calculate the DIFFERENCE in skill levels between equipped and comparison items for each tier
        const skillLevelDiff1st = (comparisonItem.skillLevel1st || 0) - (equippedItem.skillLevel1st || 0);
        const skillLevelDiff2nd = (comparisonItem.skillLevel2nd || 0) - (equippedItem.skillLevel2nd || 0);
        const skillLevelDiff3rd = (comparisonItem.skillLevel3rd || 0) - (equippedItem.skillLevel3rd || 0);
        const skillLevelDiff4th = (comparisonItem.skillLevel4th || 0) - (equippedItem.skillLevel4th || 0);
        const skillLevelDiffAll = (comparisonItem.skillLevelAll || 0) - (equippedItem.skillLevelAll || 0);

        // Only calculate passive gains if there's a difference in any skill level
        const hasSkillLevelDiff = skillLevelDiff1st !== 0 || skillLevelDiff2nd !== 0 || skillLevelDiff3rd !== 0 ||
            skillLevelDiff4th !== 0 || skillLevelDiffAll !== 0;

        if (!hasSkillLevelDiff) {
            return {
                statChanges: {},
                breakdown: [],
                complexPassives: []
            };
        }

        // Calculate gains at base skill level (with equipped item)
        const basePassiveGains = calculateJobSkillPassiveGains(
            currentClass,
            characterLevel,
            {
                firstJob: 0,
                secondJob: 0,
                thirdJob: 0,
                fourthJob: 0,
                allSkills: 0
            },
            { defense }
        );

        // Calculate gains at base + difference
        const bonusPassiveGains = calculateJobSkillPassiveGains(
            currentClass,
            characterLevel,
            {
                firstJob: skillLevelDiff1st,
                secondJob: skillLevelDiff2nd,
                thirdJob: skillLevelDiff3rd,
                fourthJob: skillLevelDiff4th,
                allSkills: skillLevelDiffAll
            },
            { defense }
        );

        // Calculate the difference in passive gains
        const statChanges = {};

        Object.keys(bonusPassiveGains.statChanges).forEach(stat => {
            const baseGain = basePassiveGains.statChanges[stat] || 0;
            const bonusGain = bonusPassiveGains.statChanges[stat] || 0;
            const gainDiff = bonusGain - baseGain;
            statChanges[stat] = gainDiff;
        });

        return {
            statChanges,
            breakdown: bonusPassiveGains.breakdown,
            complexPassives: bonusPassiveGains.complexPassives
        };
    }
}
