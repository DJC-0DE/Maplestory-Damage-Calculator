import { loadoutStore } from "@ts/store/loadout.store.js";
import { calculateJobSkillPassiveGains } from "@ts/services/skill-coefficient.service.js";
import { STAT } from "@ts/types/constants.js";
import { calculateDamage } from "./damage-calculation.service.js";
const _StatCalculationService = class _StatCalculationService {
  /**
   * Convert lowercase stat ID to StatKey (uppercase)
   * Maps 'attack' -> 'ATTACK', 'critRate' -> 'CRIT_RATE', etc.
   */
  static idToStatKey(id) {
    for (const key of Object.keys(STAT)) {
      if (STAT[key].id === id) {
        return key;
      }
    }
    throw new Error(`Unknown stat ID: ${id}`);
  }
  /**
   * @param baseStats - The base stats object to modify
   * @param weaponAttackBonus - Weapon attack bonus percentage (undefined = auto-fetch from state)
   */
  constructor(baseStats, weaponAttackBonus) {
    this.stats = { ...baseStats };
    if (weaponAttackBonus !== void 0) {
      this.weaponAttackBonus = weaponAttackBonus;
    } else {
      const result = loadoutStore.getWeaponAttackBonus().totalAttack;
      if (typeof result !== "number" || isNaN(result) || result < 0) {
        console.error("loadoutStore.getWeaponAttackBonus returned unexpected value:", result, "- treating as 0");
        this.weaponAttackBonus = 0;
      } else {
        this.weaponAttackBonus = result;
      }
    }
    this.context = {
      mainStatPct: baseStats.MAIN_STAT_PCT || 0,
      primaryMainStat: baseStats.PRIMARY_MAIN_STAT || 0,
      defense: baseStats.DEFENSE || 0,
      selectedClass: loadoutStore.getSelectedClass()
    };
    const baseDamage = calculateDamage(baseStats, "boss");
    this.baseBossDPS = baseDamage.dps;
    this.baseNormalDPS = calculateDamage(baseStats, "normal").dps;
  }
  /**
   * Add flat attack with optional weapon attack bonus application
   * @param value - Attack value to add
   * @param applyWeaponBonus - Whether to apply weapon attack bonus (default: true)
   * @returns Returns this for chaining
   */
  addAttack(value, applyWeaponBonus = true) {
    let finalAttackBonus = 0;
    let classFinalAttackBonus = 0;
    const result = calculateJobSkillPassiveGains(
      this.context.selectedClass,
      loadoutStore.getCharacterLevel(),
      {
        firstJob: this.stats.SKILL_LEVEL_1ST,
        secondJob: this.stats.SKILL_LEVEL_2ND,
        thirdJob: this.stats.SKILL_LEVEL_3RD,
        fourthJob: this.stats.SKILL_LEVEL_4TH
      }
    );
    if (result.complexStatChanges) {
      classFinalAttackBonus = result.complexStatChanges["finalAttack"] ?? 0;
    }
    if (classFinalAttackBonus != 0) {
      finalAttackBonus = 1 + classFinalAttackBonus / 100;
    }
    const effective = applyWeaponBonus ? value * (1 + this.weaponAttackBonus / 100) * finalAttackBonus : value;
    this.stats.ATTACK += effective;
    return this;
  }
  /**
   * Add main stat (flat value, converts to stat damage)
   * 100 main stat = 1% stat damage
   * @param value - Main stat value to add
   * @returns Returns this for chaining
   */
  addMainStat(value) {
    const increaseWithMainstatPct = this.calculateMainStatIncreaseWithPct(value);
    const statDamageIncrease = increaseWithMainstatPct / 100;
    this.stats.PRIMARY_MAIN_STAT += increaseWithMainstatPct;
    this.addAttack(increaseWithMainstatPct);
    this.stats.STAT_DAMAGE += statDamageIncrease;
    return this;
  }
  /**
   * Add main stat % with proper diminishing returns calculation
   * @param value - Main stat % to add
   * @returns Returns this for chaining
   */
  addMainStatPct(value) {
    const mainStatGain = this.calculateMainStatPercentGain(
      value,
      this.context.mainStatPct,
      this.context.primaryMainStat,
      this.context.defense,
      this.context.selectedClass
    );
    const statDamageIncrease = mainStatGain / 100;
    this.addAttack(mainStatGain);
    this.stats.STAT_DAMAGE += statDamageIncrease;
    this.stats.PRIMARY_MAIN_STAT += mainStatGain;
    this.context.mainStatPct += value;
    return this;
  }
  calculateMainStatIncreaseWithPct(value) {
    const mainStatPct = this.context.mainStatPct;
    const mainStatWithPctIncrease = value * (1 + mainStatPct / 100);
    return mainStatWithPctIncrease;
  }
  /**
   * Add a percentage-based stat (additive)
   * @param statId - The stat ID (e.g., 'bossDamage', 'critRate')
   * @param value - Value to add
   * @returns Returns this for chaining
   */
  addPercentageStat(statId, value) {
    const statKey = _StatCalculationService.idToStatKey(statId);
    this.stats[statKey] = (this.stats[statKey] || 0) + value;
    return this;
  }
  /**
   * Add a multiplicative stat (like Final Damage)
   * Uses formula: newValue = ((1 + old/100) * (1 + value/100) - 1) * 100
   * @param statId - The stat ID
   * @param value - Value to add
   * @returns Returns this for chaining
   */
  addMultiplicativeStat(statId, value) {
    const statKey = _StatCalculationService.idToStatKey(statId);
    const oldValue = this.stats[statKey] || 0;
    const newValue = ((1 + oldValue / 100) * (1 + value / 100) - 1) * 100;
    this.stats[statKey] = newValue;
    return this;
  }
  /**
   * Add a stat with diminishing returns (like Attack Speed)
   * Uses formula: newValue = (1 - (1 - old/factor) * (1 - value/factor)) * factor
   * @param statId - The stat ID
   * @param value - Value to add
   * @param factor - Diminishing returns factor (e.g., 150 for attack speed)
   * @returns Returns this for chaining
   */
  addDiminishingReturnStat(statId, value, factor) {
    const statKey = _StatCalculationService.idToStatKey(statId);
    const oldValue = this.stats[statKey] || 0;
    const newValue = (1 - (1 - oldValue / factor) * (1 - value / factor)) * factor;
    this.stats[statKey] = newValue;
    return this;
  }
  /**
   * Subtract a flat stat value
   * @param statId - The stat ID
   * @param value - Value to subtract
   * @returns Returns this for chaining
   */
  subtractStat(statId, value) {
    const statKey = _StatCalculationService.idToStatKey(statId);
    this.stats[statKey] -= value;
    return this;
  }
  /**
   * Subtract attack with optional weapon attack bonus application
   * @param value - Attack value to subtract
   * @param applyWeaponBonus - Whether to apply weapon attack bonus (default: true)
   * @returns Returns this for chaining
   */
  subtractAttack(value) {
    let finalAttackBonus = 0;
    let classFinalAttackBonus = 0;
    const result = calculateJobSkillPassiveGains(
      this.context.selectedClass,
      loadoutStore.getCharacterLevel(),
      {
        firstJob: this.stats.SKILL_LEVEL_1ST,
        secondJob: this.stats.SKILL_LEVEL_2ND,
        thirdJob: this.stats.SKILL_LEVEL_3RD,
        fourthJob: this.stats.SKILL_LEVEL_4TH
      }
    );
    if (result.complexStatChanges) {
      classFinalAttackBonus = result.complexStatChanges["finalAttack"] ?? 0;
    }
    if (classFinalAttackBonus != 0) {
      finalAttackBonus = 1 + classFinalAttackBonus / 100;
    }
    const effective = value * (1 + this.weaponAttackBonus / 100) * finalAttackBonus;
    this.stats.ATTACK -= effective;
    return this;
  }
  /**
   * Subtract main stat (flat value, converts to stat damage)
   * 100 main stat = 1% stat damage
   * @param value - Main stat value to subtract
   * @returns Returns this for chaining
   */
  subtractMainStat(value) {
    const increaseWithMainstatPct = this.calculateMainStatIncreaseWithPct(value);
    const statDamageIncrease = increaseWithMainstatPct / 100;
    this.stats.PRIMARY_MAIN_STAT -= increaseWithMainstatPct;
    this.subtractAttack(increaseWithMainstatPct);
    this.stats.STAT_DAMAGE -= statDamageIncrease;
    return this;
  }
  /**
   * Subtract main stat % with proper diminishing returns calculation
   * @param value - Main stat % to subtract
   * @returns Returns this for chaining
   */
  subtractMainStatPct(value) {
    const mainStatGain = this.calculateMainStatPercentGain(
      value,
      this.context.mainStatPct,
      this.context.primaryMainStat,
      this.context.defense,
      this.context.selectedClass
    );
    const statDamageIncrease = mainStatGain / 100;
    this.subtractAttack(mainStatGain);
    this.stats.STAT_DAMAGE -= statDamageIncrease;
    this.stats.PRIMARY_MAIN_STAT -= mainStatGain;
    this.context.mainStatPct -= value;
    return this;
  }
  /**
   * Subtract a multiplicative stat (like Final Damage)
   * Uses formula: newValue = ((1 + old/100) / (1 + value/100) - 1) * 100
   * This reverses the addition of a multiplicative stat
   * @param statKey - The stat key
   * @param value - Value to subtract (the multiplicative contribution to remove)
   * @returns Returns this for chaining
   */
  subtractMultiplicativeStat(statKey, value) {
    const oldValue = this.stats[statKey] || 0;
    const newValue = ((1 + oldValue / 100) / (1 + value / 100) - 1) * 100;
    this.stats[statKey] = newValue;
    return this;
  }
  /**
   * Add defense with Dark Knight conversion to main stat
   * For Dark Knight: defense converts to main stat (but is NOT affected by main stat %)
   * Conversion rate: 1 defense = 0.127 main stat
   * Then converted to stat damage: 100 main stat = 1% stat damage
   * @param value - Defense value to add
   * @returns Returns this for chaining
   */
  addDefense(value) {
    this.stats.DEFENSE = (this.stats.DEFENSE || 0) + value;
    if (this.context.selectedClass === "dark-knight") {
      const mainStatFromDefense = value * _StatCalculationService.DARK_KNIGHT_DEFENSE_CONVERSION_RATE;
      const statDamageIncrease = mainStatFromDefense / 100;
      this.stats.STAT_DAMAGE += statDamageIncrease;
    }
    return this;
  }
  /**
   * Subtract defense with Dark Knight conversion to main stat
   * For Dark Knight: defense converts to main stat (but is NOT affected by main stat %)
   * Conversion rate: 1 defense = 0.127 main stat
   * Then converted to stat damage: 100 main stat = 1% stat damage
   * @param value - Defense value to subtract
   * @returns Returns this for chaining
   */
  subtractDefense(value) {
    this.stats.DEFENSE = (this.stats.DEFENSE || 0) - value;
    if (this.context.selectedClass === "dark-knight") {
      const mainStatFromDefense = value * _StatCalculationService.DARK_KNIGHT_DEFENSE_CONVERSION_RATE;
      const statDamageDecrease = mainStatFromDefense / 100;
      this.stats.STAT_DAMAGE -= statDamageDecrease;
    }
    return this;
  }
  /**
   * Set a stat to a specific value
   * @param statKey - The stat key
   * @param value - Value to set
   * @returns Returns this for chaining
   */
  setStat(statKey, value) {
    this.stats[statKey] = value;
    return this;
  }
  /**
   * Get a copy of the current stats
   * @returns Copy of current stats
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Compute damage and return the full result object
   * @param monsterType - 'boss' or 'normal' (default: 'boss')
   * @returns Result from calculateDamage (includes dps, expectedDamage, etc.)
   */
  compute(monsterType = "boss") {
    return calculateDamage(this.stats, monsterType);
  }
  /**
   * Calculate DPS only (shorthand for compute().dps)
   * @param monsterType - 'boss' or 'normal' (default: 'boss')
   * @returns DPS value
   */
  computeDPS(monsterType = "boss") {
    return this.compute(monsterType).dps;
  }
  /**
   * Calculate DPS gain compared to base stats
   * @param baseDPS - Base DPS to compare against
   * @param monsterType - 'boss' or 'normal' (default: 'boss')
   * @returns DPS gain as percentage
   */
  computeDPSGain(baseDPS, monsterType = "boss") {
    const newDPS = this.computeDPS(monsterType);
    return (newDPS - baseDPS) / baseDPS * 100;
  }
  /**
   * Reset stats to original base stats
   * @returns Returns this for chaining
   */
  reset() {
    if (!this._originalStats) {
      this._originalStats = { ...this.stats };
    }
    this.stats = { ...this._originalStats };
    return this;
  }
  calculateMainStatPercentGain(mainStatPctIncrease, currentMainStatPct, primaryMainStat, defense, selectedClass) {
    let defenseToMainStat = 0;
    if (selectedClass === "dark-knight") {
      defenseToMainStat = defense * 0.127;
    }
    const currentMultiplier = 1 + currentMainStatPct / 100;
    const baseMainStat = (primaryMainStat - defenseToMainStat) / currentMultiplier;
    const newMultiplier = 1 + (currentMainStatPct + mainStatPctIncrease) / 100;
    const newTotalMainStat = baseMainStat * newMultiplier + defenseToMainStat;
    const mainStatGain = newTotalMainStat - primaryMainStat;
    return mainStatGain;
  }
};
_StatCalculationService.DARK_KNIGHT_DEFENSE_CONVERSION_RATE = 0.127;
let StatCalculationService = _StatCalculationService;
function createStatService(baseStats, options = {}) {
  const { weaponAttackBonus } = options;
  return new StatCalculationService(baseStats, weaponAttackBonus);
}
class CumulativeStatCalculator {
  constructor() {
    this.seriesState = null;
  }
  /**
   * Initialize a new calculation series
   * @param baseStats - Starting stats
   * @param options - Configuration
   */
  startSeries(baseStats, options = {}) {
    const { weaponAttackBonus = 0, monsterType = "boss", numSteps = 50 } = options;
    const baseDamage = calculateDamage(baseStats, monsterType);
    const baseDPS = baseDamage.dps;
    this.seriesState = {
      baseStats: { ...baseStats },
      baseDPS,
      previousDPS: baseDPS,
      cumulativeStats: { ...baseStats },
      weaponAttackBonus,
      monsterType,
      numSteps,
      mainStatPct: baseStats.MAIN_STAT_PCT || 0,
      primaryMainStat: baseStats.PRIMARY_MAIN_STAT || 0,
      defense: baseStats.DEFENSE || 0,
      selectedClass: loadoutStore.getSelectedClass(),
      previousCumulativeIncrease: 0
    };
  }
  /**
   * Calculate the next step in the series
   * @param statKey - Stat being modified
   * @param cumulativeIncrease - Total increase at this step
   * @param currentStep - Current step index (0-based)
   * @param isFlat - Whether this is a flat stat (attack/mainStat)
   * @returns Chart-ready point {cumulativeIncrease, gainPerUnit}
   */
  nextStep(statKey, cumulativeIncrease, currentStep, isFlat) {
    if (!this.seriesState) {
      throw new Error("Must call startSeries() before nextStep()");
    }
    const stepIncrease = cumulativeIncrease - this.seriesState.previousCumulativeIncrease;
    let currentDPS;
    if (isFlat) {
      if (statKey === "attack") {
        currentDPS = this._stepAttack(cumulativeIncrease, stepIncrease);
      } else if (statKey === "mainStat") {
        currentDPS = this._stepMainStat(cumulativeIncrease, stepIncrease);
      } else {
        throw new Error(`Unknown flat stat: ${statKey}`);
      }
    } else {
      if (statKey === "statDamage") {
        currentDPS = this._stepMainStatPct(cumulativeIncrease, stepIncrease);
      } else if (statKey === "finalDamage") {
        currentDPS = this._stepMultiplicative(statKey, cumulativeIncrease, stepIncrease);
      } else if (statKey === "attackSpeed" || statKey === "defPenMultiplier") {
        const factor = statKey === "attackSpeed" ? 150 : 100;
        currentDPS = this._stepDiminishing(statKey, cumulativeIncrease, stepIncrease, factor);
      } else {
        currentDPS = this._stepAdditive(statKey, cumulativeIncrease, stepIncrease);
      }
    }
    const marginalGain = (currentDPS - this.seriesState.previousDPS) / this.seriesState.previousDPS * 100;
    const actualStepSize = isFlat ? statKey === "attack" ? stepIncrease / 500 : stepIncrease / 100 : stepIncrease;
    const gainPerUnit = actualStepSize > 0 ? marginalGain / actualStepSize : 0;
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
    modifiedStats.ATTACK += effectiveIncrease;
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
    modifiedStats.STAT_DAMAGE += statDamageIncrease;
    this.seriesState.cumulativeStats = modifiedStats;
    return calculateDamage(modifiedStats, this.seriesState.monsterType).dps;
  }
  /**
   * Handle main stat % step with diminishing returns
   * @private
   */
  _stepMainStatPct(cumulativeIncrease, stepIncrease) {
    const prevCumulativeIncrease = this.seriesState.previousCumulativeIncrease;
    const mainStatGain = this.calculateMainStatPercentGain(
      stepIncrease,
      this.seriesState.mainStatPct + prevCumulativeIncrease,
      this.seriesState.primaryMainStat,
      this.seriesState.defense,
      this.seriesState.selectedClass
    );
    this.seriesState.cumulativeStats.PRIMARY_MAIN_STAT += mainStatGain;
    this.seriesState.cumulativeStats.ATTACK += mainStatGain;
    this.seriesState.cumulativeStats.STAT_DAMAGE += mainStatGain / 100;
    this.seriesState.cumulativeStats = { ...this.seriesState.cumulativeStats };
    return calculateDamage(this.seriesState.cumulativeStats, this.seriesState.monsterType).dps;
  }
  /**
   * Handle multiplicative stat (like finalDamage)
   * @private
   */
  _stepMultiplicative(statKey, cumulativeIncrease, stepIncrease) {
    const oldValue = this.seriesState.cumulativeStats[statKey] || 0;
    const newValue = ((1 + oldValue / 100) * (1 + stepIncrease / 100) - 1) * 100;
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
  addMainStat(mainStatGain) {
    if (!this.seriesState) {
      throw new Error("Series not initialized - must call startSeries() first");
    }
    const increaseWithMainstatPct = this.calculateMainStatIncreaseWithPct(mainStatGain);
    const statDamageIncrease = increaseWithMainstatPct / 100;
    this.seriesState.cumulativeStats.PRIMARY_MAIN_STAT += increaseWithMainstatPct;
    this.seriesState.cumulativeStats.ATTACK += increaseWithMainstatPct;
    this.seriesState.cumulativeStats.STAT_DAMAGE += statDamageIncrease;
  }
  calculateMainStatIncreaseWithPct(value) {
    const mainStatPct = this.seriesState.mainStatPct;
    const mainStatWithPctIncrease = value * (1 + mainStatPct / 100);
    return mainStatWithPctIncrease;
  }
  calculateMainStatPercentGain(mainStatPctIncrease, currentMainStatPct, primaryMainStat, defense, selectedClass) {
    let defenseToMainStat = 0;
    if (selectedClass === "dark-knight") {
      defenseToMainStat = defense * 0.127;
    }
    const currentMultiplier = 1 + currentMainStatPct / 100;
    const baseMainStat = (primaryMainStat - defenseToMainStat) / currentMultiplier;
    const newMultiplier = 1 + (currentMainStatPct + mainStatPctIncrease) / 100;
    const newTotalMainStat = baseMainStat * newMultiplier + defenseToMainStat;
    const mainStatGain = newTotalMainStat - primaryMainStat;
    return mainStatGain;
  }
}
export {
  CumulativeStatCalculator,
  StatCalculationService,
  createStatService
};
//# sourceMappingURL=stat-calculation-service.js.map
