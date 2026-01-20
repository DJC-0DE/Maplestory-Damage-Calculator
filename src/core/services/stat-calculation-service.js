// StatCalculationService - Unified stat modification service
// Provides a consistent, chainable API for modifying stats before calculating DPS

import { calculateDamage } from '@core/calculations/damage-calculations.js';
import { calculateMainStatPercentGain } from '@core/calculations/stat-calculations.js';
import { getWeaponAttackBonus, getSelectedClass } from '@core/state/state.js';

/**
 * StatCalculationService - A unified service for stat manipulation
 *
 * This class provides a consistent, chainable API for modifying stats before
 * calling calculateDamage(). It eliminates the duplication and inconsistency
 * of stat manipulation patterns across the codebase.
 *
 * Usage:
 *   const service = new StatCalculationService(baseStats);
 *   const result = service.addAttack(500).addMainStat(1000).computeDPS('boss');
 *   const dpsGain = ((result.dps - baseDPS) / baseDPS * 100);
 */
export class StatCalculationService {
    /**
     * @param {Object} baseStats - The base stats object to modify
     * @param {number|null} [weaponAttackBonus=null] - Weapon attack bonus percentage (null = auto-fetch from state)
     */
    constructor(baseStats, weaponAttackBonus) {
        // Clone the stats to avoid mutating the original
        this.stats = { ...baseStats };

        // Handle weaponAttackBonus: explicit value or auto-fetch from state
        if (weaponAttackBonus !== null && weaponAttackBonus !== undefined) {
            // Explicit override provided
            this.weaponAttackBonus = weaponAttackBonus;
        } else {
            // Auto-fetch from state
            const result = getWeaponAttackBonus().totalAttack;

            if (typeof result !== 'number' || isNaN(result) || result < 0) {
                console.error('getWeaponAttackBonus returned unexpected value:', result, '- treating as 0');
                this.weaponAttackBonus = 0;
            } else {
                this.weaponAttackBonus = result;
            }
        }

        // Read context values from stats object or state
        this.context = {
            mainStatPct: baseStats.mainStatPct || 0,
            primaryMainStat: baseStats.mainStat || 0,
            defense: baseStats.defense || 0,
            selectedClass: getSelectedClass()
        };

        // Calculate base DPS for both monster types
        const baseDamage = calculateDamage(baseStats, 'boss');
        this.baseBossDPS = baseDamage.dps;
        this.baseNormalDPS = calculateDamage(baseStats, 'normal').dps;
    }

    /**
     * Add flat attack with optional weapon attack bonus application
     * @param {number} value - Attack value to add
     * @param {boolean} applyWeaponBonus - Whether to apply weapon attack bonus (default: true)
     * @returns {StatCalculationService} Returns this for chaining
     */
    addAttack(value, applyWeaponBonus = true) {
        const effective = applyWeaponBonus
            ? value * (1 + this.weaponAttackBonus / 100)
            : value;
        this.stats.attack += effective;
        return this;
    }

    /**
     * Add main stat (flat value, converts to stat damage)
     * 100 main stat = 1% stat damage
     * @param {number} value - Main stat value to add
     * @returns {StatCalculationService} Returns this for chaining
     */
    addMainStat(value) {
        const statDamageIncrease = value / 100;
        this.stats.statDamage += statDamageIncrease;
        return this;
    }

    /**
     * Add main stat % with proper diminishing returns calculation
     * @param {number} value - Main stat % to add
     * @returns {StatCalculationService} Returns this for chaining
     */
    addMainStatPct(value) {
        const statDamageGain = calculateMainStatPercentGain(
            value,
            this.context.mainStatPct,
            this.context.primaryMainStat,
            this.context.defense,
            this.context.selectedClass
        );
        this.stats.statDamage += statDamageGain;
        return this;
    }

    calculateMainStatIncreaseWithPct(value)
    {
        const mainStatPct = this.context.mainStatPct;
        const mainStatWithPctIncrease = value * (1 + mainStatPct / 100);
        return mainStatWithPctIncrease;
    }

    /**
     * Add a percentage-based stat (additive)
     * @param {string} statKey - The stat key (e.g., 'bossDamage', 'critRate')
     * @param {number} value - Value to add
     * @returns {StatCalculationService} Returns this for chaining
     */
    addPercentageStat(statKey, value) {
        this.stats[statKey] = (this.stats[statKey] || 0) + value;
        return this;
    }

    /**
     * Add a multiplicative stat (like Final Damage)
     * Uses formula: newValue = ((1 + old/100) * (1 + value/100) - 1) * 100
     * @param {string} statKey - The stat key
     * @param {number} value - Value to add
     * @returns {StatCalculationService} Returns this for chaining
     */
    addMultiplicativeStat(statKey, value) {
        const oldValue = this.stats[statKey] || 0;
        const newValue = (((1 + oldValue / 100) * (1 + value / 100)) - 1) * 100;
        this.stats[statKey] = newValue;
        return this;
    }

    /**
     * Add a stat with diminishing returns (like Attack Speed)
     * Uses formula: newValue = (1 - (1 - old/factor) * (1 - value/factor)) * factor
     * @param {string} statKey - The stat key
     * @param {number} value - Value to add
     * @param {number} factor - Diminishing returns factor (e.g., 150 for attack speed)
     * @returns {StatCalculationService} Returns this for chaining
     */
    addDiminishingReturnStat(statKey, value, factor) {
        const oldValue = this.stats[statKey] || 0;
        const newValue = (1 - (1 - oldValue / factor) * (1 - value / factor)) * factor;
        this.stats[statKey] = newValue;
        return this;
    }

    /**
     * Subtract a flat stat value
     * @param {string} statKey - The stat key
     * @param {number} value - Value to subtract
     * @returns {StatCalculationService} Returns this for chaining
     */
    subtractStat(statKey, value) {
        this.stats[statKey] -= value;
        return this;
    }

    /**
     * Subtract attack with optional weapon attack bonus application
     * @param {number} value - Attack value to subtract
     * @param {boolean} applyWeaponBonus - Whether to apply weapon attack bonus (default: true)
     * @returns {StatCalculationService} Returns this for chaining
     */
    subtractAttack(value, applyWeaponBonus = true) {
        const effective = applyWeaponBonus
            ? value * (1 + this.weaponAttackBonus / 100)
            : value;
        this.stats.attack -= effective;
        return this;
    }

    /**
     * Subtract a multiplicative stat (like Final Damage)
     * Uses formula: newValue = ((1 + old/100) / (1 + value/100) - 1) * 100
     * This reverses the addition of a multiplicative stat
     * @param {string} statKey - The stat key
     * @param {number} value - Value to subtract (the multiplicative contribution to remove)
     * @returns {StatCalculationService} Returns this for chaining
     */
    subtractMultiplicativeStat(statKey, value) {
        const oldValue = this.stats[statKey] || 0;
        const newValue = (((1 + oldValue / 100) / (1 + value / 100)) - 1) * 100;
        this.stats[statKey] = newValue;
        return this;
    }

    /**
     * Add defense with Dark Knight conversion to main stat
     * For Dark Knight: defense converts to main stat (but is NOT affected by main stat %)
     * Conversion rate: 1 defense = 0.127 main stat
     * Then converted to stat damage: 100 main stat = 1% stat damage
     * @param {number} value - Defense value to add
     * @returns {StatCalculationService} Returns this for chaining
     */
    addDefense(value) {
        // Add the defense value itself
        this.stats.defense = (this.stats.defense || 0) + value;

        // For Dark Knight: convert defense to main stat, then to stat damage
        if (this.context.selectedClass === 'dark-knight') {
            const mainStatFromDefense = value * 0.127;
            const statDamageIncrease = mainStatFromDefense / 100;
            this.stats.statDamage += statDamageIncrease;
        }

        return this;
    }

    /**
     * Subtract defense with Dark Knight conversion to main stat
     * For Dark Knight: defense converts to main stat (but is NOT affected by main stat %)
     * Conversion rate: 1 defense = 0.127 main stat
     * Then converted to stat damage: 100 main stat = 1% stat damage
     * @param {number} value - Defense value to subtract
     * @returns {StatCalculationService} Returns this for chaining
     */
    subtractDefense(value) {
        // Subtract the defense value itself
        this.stats.defense = (this.stats.defense || 0) - value;

        // For Dark Knight: convert defense to main stat, then to stat damage
        if (this.context.selectedClass === 'dark-knight') {
            const mainStatFromDefense = value * 0.127;
            const statDamageDecrease = mainStatFromDefense / 100;
            this.stats.statDamage -= statDamageDecrease;
        }

        return this;
    }

    /**
     * Set a stat to a specific value
     * @param {string} statKey - The stat key
     * @param {number} value - Value to set
     * @returns {StatCalculationService} Returns this for chaining
     */
    setStat(statKey, value) {
        this.stats[statKey] = value;
        return this;
    }

    /**
     * Get a copy of the current stats
     * @returns {Object} Copy of current stats
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Compute damage and return the full result object
     * @param {string} monsterType - 'boss' or 'normal' (default: 'boss')
     * @returns {Object} Result from calculateDamage (includes dps, expectedDamage, etc.)
     */
    compute(monsterType = 'boss') {
        return calculateDamage(this.stats, monsterType);
    }

    /**
     * Calculate DPS only (shorthand for compute().dps)
     * @param {string} monsterType - 'boss' or 'normal' (default: 'boss')
     * @returns {number} DPS value
     */
    computeDPS(monsterType = 'boss') {
        return this.compute(monsterType).dps;
    }

    /**
     * Calculate DPS gain compared to base stats
     * @param {number} baseDPS - Base DPS to compare against
     * @param {string} monsterType - 'boss' or 'normal' (default: 'boss')
     * @returns {number} DPS gain as percentage
     */
    computeDPSGain(baseDPS, monsterType = 'boss') {
        const newDPS = this.computeDPS(monsterType);
        return ((newDPS - baseDPS) / baseDPS * 100);
    }

    /**
     * Reset stats to original base stats
     * @returns {StatCalculationService} Returns this for chaining
     */
    reset() {
        // We need to store the original stats
        if (!this._originalStats) {
            this._originalStats = { ...this.stats };
        }
        this.stats = { ...this._originalStats };
        return this;
    }
}

/**
 * Factory function to create a StatCalculationService with common setup
 * @param {Object} baseStats - Base stats
 * @param {Object} options - Configuration options
 * @param {number|null} [options.weaponAttackBonus=null] - Weapon attack bonus (null = auto-fetch from state)
 * @returns {StatCalculationService}
 */
export function createStatService(baseStats, options = {}) {
    const { weaponAttackBonus = null } = options;
    return new StatCalculationService(baseStats, weaponAttackBonus);
}

/**
 * CumulativeStatCalculator - Specialized calculator for stat weight charts
 *
 * This class handles cumulative stat calculations across multiple iterations,
 * maintaining internal state to track progression. Designed specifically for
 * generating chart data points that show marginal DPS gains.
 *
 * Usage:
 *   const calculator = new CumulativeStatCalculator();
 *   calculator.startSeries(baseStats, { weaponAttackBonus, monsterType, numSteps });
 *
 *   for (let i = 0; i <= numPoints; i++) {
 *       const point = calculator.nextStep('attack', cumulativeIncrease, i, true);
 *       dataPoints.push(point); // point = { x: cumulativeIncrease, y: gainPerUnit }
 *   }
 */
export class CumulativeStatCalculator {
    constructor() {
        this.seriesState = null;
    }

    /**
     * Initialize a new calculation series
     * @param {Object} baseStats - Starting stats
     * @param {Object} options - Configuration
     * @param {number} options.weaponAttackBonus - Weapon attack bonus %
     * @param {string} options.monsterType - 'boss' or 'normal'
     * @param {number} options.numSteps - Total number of steps
     */
    startSeries(baseStats, options = {}) {
        const { weaponAttackBonus = 0, monsterType = 'boss', numSteps = 50 } = options;

        const baseDamage = calculateDamage(baseStats, monsterType);
        const baseDPS = baseDamage.dps;

        this.seriesState = {
            baseStats: { ...baseStats },
            baseDPS: baseDPS,
            previousDPS: baseDPS,
            cumulativeStats: { ...baseStats },
            weaponAttackBonus: weaponAttackBonus,
            monsterType: monsterType,
            numSteps: numSteps,
            mainStatPct: baseStats.mainStatPct || 0,
            primaryMainStat: baseStats.mainStat || 0,
            defense: baseStats.defense || 0,
            selectedClass: getSelectedClass(),
            previousCumulativeIncrease: 0
        };
    }

    /**
     * Calculate the next step in the series
     * @param {string} statKey - Stat being modified
     * @param {number} cumulativeIncrease - Total increase at this step
     * @param {number} currentStep - Current step index (0-based)
     * @param {boolean} isFlat - Whether this is a flat stat (attack/mainStat)
     * @returns {{x: number, y: number}} Chart-ready point {cumulativeIncrease, gainPerUnit}
     */
    nextStep(statKey, cumulativeIncrease, currentStep, isFlat) {
        if (!this.seriesState) {
            throw new Error('Must call startSeries() before nextStep()');
        }

        const stepIncrease = cumulativeIncrease - this.seriesState.previousCumulativeIncrease;

        // Route to appropriate type-specific method
        let currentDPS;
        if (isFlat) {
            if (statKey === 'attack') {
                currentDPS = this._stepAttack(cumulativeIncrease, stepIncrease);
            } else if (statKey === 'mainStat') {
                currentDPS = this._stepMainStat(cumulativeIncrease, stepIncrease);
            } else {
                throw new Error(`Unknown flat stat: ${statKey}`);
            }
        } else {
            if (statKey === 'statDamage') {
                currentDPS = this._stepMainStatPct(cumulativeIncrease, stepIncrease);
            } else if (statKey === 'finalDamage') {
                currentDPS = this._stepMultiplicative(statKey, cumulativeIncrease, stepIncrease);
            } else if (statKey === 'attackSpeed' || statKey === 'defPenMultiplier') {
                const factor = statKey === 'attackSpeed' ? 150 : 100;
                currentDPS = this._stepDiminishing(statKey, cumulativeIncrease, stepIncrease, factor);
            } else {
                // Default: additive stat
                currentDPS = this._stepAdditive(statKey, cumulativeIncrease, stepIncrease);
            }
        }

        // Calculate marginal gain relative to previous DPS
        const marginalGain = ((currentDPS - this.seriesState.previousDPS) / this.seriesState.previousDPS * 100);

        // Calculate gain per unit
        // For attack: per 500, for mainStat: per 100, for percentage stats: per 1%
        const actualStepSize = isFlat
            ? (statKey === 'attack' ? stepIncrease / 500 : stepIncrease / 100)
            : stepIncrease;

        const gainPerUnit = actualStepSize > 0 ? marginalGain / actualStepSize : 0;

        // Update state for next iteration
        this.seriesState.previousDPS = currentDPS;
        this.seriesState.previousCumulativeIncrease = cumulativeIncrease;

        return {
            x: cumulativeIncrease,
            y: parseFloat(gainPerUnit.toFixed(2))
        };
    }

    /**
     * Handle attack stat step with weapon bonus
     * @private
     */
    _stepAttack(cumulativeIncrease, stepIncrease) {
        const effectiveIncrease = stepIncrease * (1 + this.seriesState.weaponAttackBonus / 100);
        const modifiedStats = { ...this.seriesState.cumulativeStats };
        modifiedStats.attack += effectiveIncrease;

        this.seriesState.cumulativeStats = modifiedStats;
        return calculateDamage(modifiedStats, this.seriesState.monsterType).dps;
    }

    /**
     * Handle main stat step (converts to statDamage)
     * @private
     */
    _stepMainStat(cumulativeIncrease, stepIncrease) {
        const statDamageIncrease = stepIncrease / 100;
        const modifiedStats = { ...this.seriesState.cumulativeStats };
        modifiedStats.statDamage += statDamageIncrease;

        this.seriesState.cumulativeStats = modifiedStats;
        return calculateDamage(modifiedStats, this.seriesState.monsterType).dps;
    }

    /**
     * Handle main stat % step with diminishing returns
     * @private
     */
    _stepMainStatPct(cumulativeIncrease, stepIncrease) {
        const prevCumulativeIncrease = this.seriesState.previousCumulativeIncrease;
        const statDamageGain = calculateMainStatPercentGain(
            stepIncrease,
            this.seriesState.mainStatPct + prevCumulativeIncrease,
            this.seriesState.primaryMainStat,
            this.seriesState.defense,
            this.seriesState.selectedClass
        );

        const modifiedStats = { ...this.seriesState.cumulativeStats };
        modifiedStats.statDamage = (modifiedStats.statDamage || 0) + statDamageGain;

        this.seriesState.cumulativeStats = modifiedStats;
        return calculateDamage(modifiedStats, this.seriesState.monsterType).dps;
    }

    /**
     * Handle multiplicative stat (like finalDamage)
     * @private
     */
    _stepMultiplicative(statKey, cumulativeIncrease, stepIncrease) {
        const oldValue = this.seriesState.cumulativeStats[statKey] || 0;
        const newValue = (((1 + oldValue / 100) * (1 + stepIncrease / 100)) - 1) * 100;

        const modifiedStats = { ...this.seriesState.cumulativeStats };
        modifiedStats[statKey] = newValue;

        this.seriesState.cumulativeStats = modifiedStats;
        return calculateDamage(modifiedStats, this.seriesState.monsterType).dps;
    }

    /**
     * Handle diminishing returns stat (like attackSpeed)
     * @private
     */
    _stepDiminishing(statKey, cumulativeIncrease, stepIncrease, factor) {
        const oldValue = this.seriesState.cumulativeStats[statKey] || 0;
        const newValue = (1 - (1 - oldValue / factor) * (1 - stepIncrease / factor)) * factor;

        const modifiedStats = { ...this.seriesState.cumulativeStats };
        modifiedStats[statKey] = newValue;

        this.seriesState.cumulativeStats = modifiedStats;
        return calculateDamage(modifiedStats, this.seriesState.monsterType).dps;
    }

    /**
     * Handle additive stat (like bossDamage, critRate)
     * @private
     */
    _stepAdditive(statKey, cumulativeIncrease, stepIncrease) {
        const oldValue = this.seriesState.cumulativeStats[statKey] || 0;
        const newValue = oldValue + stepIncrease;

        const modifiedStats = { ...this.seriesState.cumulativeStats };
        modifiedStats[statKey] = newValue;

        this.seriesState.cumulativeStats = modifiedStats;
        return calculateDamage(modifiedStats, this.seriesState.monsterType).dps;
    }

    /**
     * Reset the calculator state
     */
    reset() {
        this.seriesState = null;
    }
}
