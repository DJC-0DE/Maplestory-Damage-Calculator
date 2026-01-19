/**
 * Stat Input Service
 * Provides a clean interface for modifying stat input fields programmatically
 */

/**
 * Enum of all possible stats that can be modified
 */
export const Stat = {
    ATTACK: 'Attack',
    ATTACK_POWER: 'AttackPower',
    ATTACK_POWER_EXCLUDE_BOSS: 'AttackPowerExcludeBoss',
    ATTACK_POWER_IN_CC: 'AttackPowerInCc',
    ATTACK_POWER_TO_BOSS: 'AttackPowerToBoss',
    ATTACK_SPEED: 'AttackSpeed',
    CRITICAL_CHANCE: 'CriticalChance',
    HIT_CHANCE: 'HitChance',
    MAIN_STAT: 'MainStat',
    MAX_DAMAGE_RATIO: 'MaxDamageRatio',
    MAX_HP: 'MaxHp',
    MAX_HP_R: 'MaxHpR',
    MIN_DAMAGE_RATIO: 'MinDamageRatio',
};

/**
 * Mapping from Stat enum to input element IDs
 * Stats not in this map don't have corresponding input fields
 */
const STAT_INPUT_MAP = {
    [Stat.ATTACK]: 'attack-base',
    [Stat.ATTACK_POWER]: 'damage-base',
    [Stat.ATTACK_POWER_EXCLUDE_BOSS]: 'normal-damage-base',
    [Stat.ATTACK_POWER_IN_CC]: null, // No input field
    [Stat.ATTACK_POWER_TO_BOSS]: 'boss-damage-base',
    [Stat.ATTACK_SPEED]: 'attack-speed-base',
    [Stat.CRITICAL_CHANCE]: 'crit-rate-base',
    [Stat.HIT_CHANCE]: null, // No input field
    [Stat.MAIN_STAT]: 'primary-main-stat-base',
    [Stat.MAX_DAMAGE_RATIO]: 'max-damage-base',
    [Stat.MAX_HP]: null, // No input field
    [Stat.MAX_HP_R]: null, // No input field
    [Stat.MIN_DAMAGE_RATIO]: 'min-damage-base',
};

/**
 * Get input element for a given stat
 * @param {Stat} stat - The stat enum value
 * @returns {HTMLElement|null} The input element or null if not found
 */
function getInputForStat(stat) {
    const inputId = STAT_INPUT_MAP[stat];
    if (!inputId) {
        return null;
    }
    return document.getElementById(inputId);
}

/**
 * Add value to a stat input
 * @param {Stat} stat - The stat enum value
 * @param {number} amount - The amount to add
 * @returns {boolean} True if successful, false if stat has no input or input not found
 */
export function addStat(stat, amount) {
    const input = getInputForStat(stat);
    if (!input) {
        return false;
    }

    const currentValue = parseFloat(input.value) || 0;
    const newValue = currentValue + amount;
    input.value = newValue;

    // Trigger events to update calculations
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
}

/**
 * Subtract value from a stat input
 * @param {Stat} stat - The stat enum value
 * @param {number} amount - The amount to subtract
 * @returns {boolean} True if successful, false if stat has no input or input not found
 */
export function subtractStat(stat, amount) {
    const input = getInputForStat(stat);
    if (!input) {
        return false;
    }

    const currentValue = parseFloat(input.value) || 0;
    const newValue = Math.max(0, currentValue - amount);
    input.value = newValue;

    // Trigger events to update calculations
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
}

/**
 * Set a stat input to a specific value
 * @param {Stat} stat - The stat enum value
 * @param {number} value - The value to set
 * @returns {boolean} True if successful, false if stat has no input or input not found
 */
export function setStat(stat, value) {
    const input = getInputForStat(stat);
    if (!input) {
        return false;
    }

    input.value = Math.max(0, value);

    // Trigger events to update calculations
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
}

/**
 * Get current value of a stat input
 * @param {Stat} stat - The stat enum value
 * @returns {number|null} Current value or null if stat has no input or input not found
 */
export function getStat(stat) {
    const input = getInputForStat(stat);
    if (!input) {
        return null;
    }

    return parseFloat(input.value) || 0;
}

/**
 * Apply multiple stat changes at once
 * @param {Object.<Stat, number>} changes - Object mapping stats to their changes (positive or negative)
 * @returns {Object} Object with success count and failed stats
 */
export function applyStatChanges(changes) {
    let successCount = 0;
    const failedStats = [];

    for (const [stat, amount] of Object.entries(changes)) {
        if (amount > 0) {
            if (addStat(stat, amount)) {
                successCount++;
            } else {
                failedStats.push(stat);
            }
        } else if (amount < 0) {
            if (subtractStat(stat, Math.abs(amount))) {
                successCount++;
            } else {
                failedStats.push(stat);
            }
        }
    }

    return { successCount, failedStats };
}

/**
 * Check if a stat has a corresponding input field
 * @param {Stat} stat - The stat enum value
 * @returns {boolean} True if stat has an input field
 */
export function hasInputField(stat) {
    return STAT_INPUT_MAP[stat] !== null;
}

/**
 * Get all stats that have input fields
 * @returns {Stat[]} Array of stat enum values that have input fields
 */
export function getStatsWithInputs() {
    return Object.entries(STAT_INPUT_MAP)
        .filter(([_, inputId]) => inputId !== null)
        .map(([stat, _]) => stat);
}
