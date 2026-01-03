import { weaponRatesPerLevel, weaponBaseAttackEquipped, rarities, tiers } from './constants.js';
import { getSelectedStageDefense } from './main.js';

// Number formatting utility
export function formatNumber(num) {
    return Math.round(num).toLocaleString();
}

// Calculate stat damage gain from main stat % increase
// This is the canonical implementation used by both the predicted damage table and cube potential
export function calculateMainStatPercentGain(mainStatPctIncrease, currentMainStatPct, primaryMainStat, defense, selectedClass) {
    let defenseToMainStat = 0;
    if (selectedClass === 'dark-knight') {
        defenseToMainStat = defense * 0.127;
    }

    // Primary main stat is AFTER applying current main stat %
    // We need to work backwards to find the base main stat (before main stat % multiplier)
    // For Dark Knight: defense contribution is NOT affected by main stat %
    // So: primaryMainStat = (baseMainStat × currentMultiplier) + defenseToMainStat
    // Therefore: baseMainStat = (primaryMainStat - defenseToMainStat) / currentMultiplier

    const currentMultiplier = 1 + currentMainStatPct / 100;
    const baseMainStat = (primaryMainStat - defenseToMainStat) / currentMultiplier;

    // Now calculate the new total with the increased main stat %
    const newMultiplier = 1 + (currentMainStatPct + mainStatPctIncrease) / 100;
    const newTotalMainStat = (baseMainStat * newMultiplier) + defenseToMainStat;

    // Calculate the gain in main stat
    const mainStatGain = newTotalMainStat - primaryMainStat;

    // Convert to stat damage (100 main stat = 1% stat damage)
    const statDamageGain = mainStatGain / 100;

    return statDamageGain;
}

// Get weapon level multiplier based on level (from weapon-damage-stats.txt)
export function getWeaponLevelMultiplier(level) {
    if (!level || level <= 1) return 1.0;
    if (level <= 100) return 1 + (0.3 * (level - 1)) / 100;
    if (level <= 130) return 1 + (30.3 + 0.7 * (level - 101)) / 100;
    if (level <= 155) return 1 + (51.4 + 0.8 * (level - 131)) / 100;
    if (level <= 175) return 1 + (71.5 + 0.9 * (level - 156)) / 100;
    if (level <= 200) return 1 + (89.6 + 1.0 * (level - 176)) / 100;
    return 1 + 113.6 / 100; // Cap at level 200
}

// Get inventory divisor based on rarity
export function getInventoryDivisor(rarity) {
    return ['legendary', 'mystic', 'ancient'].includes(rarity) ? 4 : 3.5;
}

// Calculate weapon attack percentages from level
export function calculateWeaponAttacks(rarity, tier, level) {
    const baseEquipped = weaponBaseAttackEquipped[rarity]?.[tier];
    if (baseEquipped === null || baseEquipped === undefined || !level || level <= 0) {
        return { inventoryAttack: 0, equippedAttack: 0 };
    }

    // Calculate equipped attack: base × level multiplier
    const levelMultiplier = getWeaponLevelMultiplier(level);
    const equippedBeforeRound = baseEquipped * levelMultiplier;

    // Round down to nearest 0.1% (as specified in formula image)
    const equippedAttack = Math.floor(equippedBeforeRound * 10) / 10;

    // Calculate inventory attack: equipped / divisor
    const divisor = getInventoryDivisor(rarity);
    const inventoryAttack = equippedAttack / divisor;

    return { inventoryAttack, equippedAttack };
}

// Get max level based on star rating
export function getMaxLevelForStars(stars) {
    const maxLevels = { 0: 100, 1: 120, 2: 140, 3: 160, 4: 180, 5: 200 };
    return maxLevels[stars] || 100;
}

// Calculate upgrade cost for a weapon at a specific level
export function getUpgradeCost(rarity, tier, level) {
    if (level <= 0) return 0;

    const tierNum = parseInt(tier.replace('t', ''));
    const tierSteps = 4 - tierNum; // T4->0, T3->1, T2->2, T1->3

    // Base costs for T4
    const baseCosts = {
        normal: 10,
        rare: 40,
        epic: 140,
        unique: 490,
        legendary: 1470,
        mystic: 5880,
        ancient: 23520
    };

    const baseCost = baseCosts[rarity];
    if (!baseCost) return 0;

    // Apply tier multiplier (1.2x for each tier above T4)
    const tierAdjustedCost = baseCost * Math.pow(1.2, tierSteps);

    // Apply level-based multiplier
    let levelMultiplier = 1;

    if (level <= 50) {
        // Level 1->2 to 50->51: BaseCost × 1.01^(Level-1)
        levelMultiplier = Math.pow(1.01, level - 1);
    } else if (level <= 100) {
        // Level 51->52 to 100->101: BaseCost × 1.01^49 × 1.015^(Level-50)
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, level - 50);
    } else if (level <= 150) {
        // Level 101->102 to 150->151: BaseCost × 1.01^49 × 1.015^50 × 1.02^(Level-100)
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, 50) * Math.pow(1.02, level - 100);
    } else {
        // Level 151->152 to 199->200: BaseCost × 1.01^49 × 1.015^50 × 1.02^50 × 1.025^(Level-150)
        levelMultiplier = Math.pow(1.01, 49) * Math.pow(1.015, 50) * Math.pow(1.02, 50) * Math.pow(1.025, level - 150);
    }

    const finalCost = tierAdjustedCost * levelMultiplier;

    // Round up to nearest 1 Weapon Enhancer
    return Math.ceil(finalCost);
}

// Calculate inventory attack gain from spending resources
export function calculateUpgradeGain(rarity, tier, currentLevel, stars, resources) {
    if (currentLevel <= 0) {
        return { levelsGained: 0, newLevel: currentLevel, attackGain: 0, resourcesUsed: 0, efficiency: 0, singleLevelCost: 0 };
    }

    const maxLevel = getMaxLevelForStars(stars);

    // Check the cost of the next level
    const nextLevelCost = getUpgradeCost(rarity, tier, currentLevel);

    // If the next level costs more than available resources, show gain for that level anyway
    if (nextLevelCost > resources && currentLevel < maxLevel) {
        const currentAttack = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
        const nextLevelAttack = calculateWeaponAttacks(rarity, tier, currentLevel + 1).inventoryAttack;
        const attackGain = nextLevelAttack - currentAttack;

        return {
            levelsGained: 0,
            newLevel: currentLevel,
            attackGain: attackGain,
            resourcesUsed: 0,
            efficiency: 0,
            singleLevelCost: nextLevelCost,
            isUnaffordable: true
        };
    }

    let level = currentLevel;
    let remainingResources = resources;
    let totalCost = 0;
    let iterations = 0;
    const maxIterations = 300; // Prevent infinite loops

    // Simulate upgrades until we run out of resources or hit max level
    while (level < maxLevel && remainingResources > 0 && iterations < maxIterations) {
        const cost = getUpgradeCost(rarity, tier, level);
        if (cost <= 0 || cost > remainingResources) break;

        remainingResources -= cost;
        totalCost += cost;
        level++;
        iterations++;
    }

    // Calculate attack gain
    const currentAttack = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
    const newAttack = calculateWeaponAttacks(rarity, tier, level).inventoryAttack;
    const attackGain = newAttack - currentAttack;

    return {
        levelsGained: level - currentLevel,
        newLevel: level,
        attackGain: attackGain,
        resourcesUsed: totalCost,
        efficiency: totalCost > 0 ? attackGain / (totalCost / 1000) : 0,
        singleLevelCost: 0,
        isUnaffordable: false
    };
}

// Calculate inventory bonus for a weapon
export function calculateInventoryBonus(rarity, tier, level) {
    const rate = weaponRatesPerLevel[rarity][tier];
    if (rate === null || level === 0) return 0;
    return rate * level;
}
 
// Main damage calculation function
export function calculateDamage(stats, monsterType) {
    // Step 1: Calculate Base Damage
    const totalSkillMastery = stats.skillMastery + (monsterType === 'boss' ? stats.skillMasteryBoss : 0);
    const baseDamage = stats.attack * (stats.skillCoeff / 100) * (1 + totalSkillMastery / 100);
 
    // Step 2: Calculate Base Hit Damage
    const damageAmpMultiplier = 1 + stats.damageAmp / 100;
 
    // Get selected stage's defense values
    const stageDefense = getSelectedStageDefense();

    // Defense Penetration: Reduce enemy's effective defense
    const effectiveDefense = stageDefense.defense * (1 - stats.defPen / 100);

    // Defense uses diminishing returns formula: damage dealt = 100 / (100 + defense)
    // This ensures defense never reduces damage to zero, even at very high values
    const defPenMultiplier = 100 / (100 + effectiveDefense);

    // Damage Reduction: 1 - damageReduction%
    const damageReduction = 1 - (stageDefense.damageReduction / 100);
 
    const monsterDamage = monsterType === 'boss' ? stats.bossDamage : stats.normalDamage;
 
    const finalDamageMultiplier = 1 + (stats.finalDamage / 100);
 
    const baseHitDamage = baseDamage *
        (1 + stats.statDamage / 100) *
        (1 + stats.damage / 100) *
        (1 + monsterDamage / 100) *
        damageAmpMultiplier *
        defPenMultiplier *
        damageReduction *
        finalDamageMultiplier;
 
    // Step 3: Calculate Non-Crit Damage Range
    const nonCritMin = baseHitDamage * (Math.min(stats.minDamage, stats.maxDamage) / 100);
    const nonCritMax = baseHitDamage * (stats.maxDamage / 100);
    const nonCritAvg = (nonCritMin + nonCritMax) / 2;
 
    // Step 4: Calculate Crit Damage
    const critMultiplier = 1 + (stats.critDamage / 100);
    const critMin = nonCritMin * critMultiplier;
    const critMax = nonCritMax * critMultiplier;
    const critAvg = nonCritAvg * critMultiplier;
 
    // Step 5: Calculate Expected Damage
    // Cap critical rate at 100%
    const cappedCritRate = Math.min(stats.critRate, 100);
    const critRate = cappedCritRate / 100;
    const expectedDamage = nonCritAvg * (1 - critRate) + critAvg * critRate;
 
    // Step 6: Calculate DPS
    // Attack speed uses formula: AS = 150(1 - ∏(1 - s/150)) with hard cap at 150%
    // Any attack speed over 150% is capped and ignored
    const cappedAttackSpeed = Math.min(stats.attackSpeed, 150);
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
        defPenMultiplier,
        attackSpeedMultiplier,
        finalDamageMultiplier
    };
}
// Helper function to find equivalent percentage stat for a target DPS gain
export function findEquivalentPercentage(stats, statKey, targetDPSGain, baseDPS, monsterType, multiplicativeStats, diminishingReturnStats) {
    // Binary search for the percentage increase needed
    let low = 0;
    let high = 1000; // Max search limit
    let iterations = 0;
    const maxIterations = 50;
    const tolerance = 0.01; // 0.01% tolerance
 
    while (iterations < maxIterations && high - low > tolerance) {
        const mid = (low + high) / 2;
        const modifiedStats = { ...stats };
        const oldValue = stats[statKey];
 
        if (multiplicativeStats[statKey]) {
            modifiedStats[statKey] = (((1 + oldValue / 100) * (1 + mid / 100)) - 1) * 100;
        } else if (diminishingReturnStats[statKey]) {
            const factor = diminishingReturnStats[statKey].denominator;
            modifiedStats[statKey] = (1 - (1 - oldValue / factor) * (1 - mid / factor)) * factor;
        } else {
            modifiedStats[statKey] = oldValue + mid;
        }
 
        const newDPS = calculateDamage(modifiedStats, monsterType).dps;
        const actualGain = ((newDPS - baseDPS) / baseDPS * 100);
 
        if (Math.abs(actualGain - targetDPSGain) < tolerance) {
            return mid;
        } else if (actualGain < targetDPSGain) {
            low = mid;
        } else {
            high = mid;
        }
 
        iterations++;
    }
 
    // Check if we found a reasonable value
    const finalMid = (low + high) / 2;
    if (finalMid > 500) {
        return null; // Unrealistic value
    }
 
    return finalMid;
}
 
// Calculate stat weights - generates HTML for stat damage predictions
export function calculateStatWeights(setup, stats) {
    const baseBossDPS = calculateDamage(stats, 'boss').dps;
    const baseNormalDPS = calculateDamage(stats, 'normal').dps;
    const weaponAttackBonus = getWeaponAttackBonus();

    // Get main stat % and related values for proper main stat % calculations
    const mainStatPct = parseFloat(document.getElementById('main-stat-pct-base')?.value) || 0;
    const primaryMainStat = parseFloat(document.getElementById('primary-main-stat-base')?.value) || 0;
    const defense = parseFloat(document.getElementById('defense-base')?.value) || 0;
    // Use global selectedClass variable (set by selectClass() function)
    const currentSelectedClass = typeof selectedClass !== 'undefined' ? selectedClass : null;

    // Flat attack increases
    const attackIncreases = [500, 1000, 2500, 5000, 10000, 15000];

    // Flat main stat increases (100 main stat = 1% stat damage)
    const mainStatIncreases = [100, 500, 1000, 2500, 5000, 7500];
 
    // Percentage-based stats
    const percentageStats = [
        { key: 'skillCoeff', label: 'Skill Coefficient' },
        { key: 'skillMastery', label: 'Skill Mastery' },
        { key: 'damage', label: 'Damage' },
        { key: 'finalDamage', label: 'Final Damage' },
        { key: 'bossDamage', label: 'Boss Damage' },
        { key: 'normalDamage', label: 'Monster Damage' },
        { key: 'statDamage', label: 'Main Stat %' },
        { key: 'damageAmp', label: 'Damage Amplification' },
        { key: 'minDamage', label: 'Min Damage Multiplier' },
        { key: 'maxDamage', label: 'Max Damage Multiplier' },
        { key: 'critRate', label: 'Critical Rate' },
        { key: 'critDamage', label: 'Critical Damage' },
        { key: 'attackSpeed', label: 'Attack Speed' },
        { key: 'defPen', label: 'Defense Penetration' }
    ];

    const percentIncreases = [1, 5, 10, 25, 50, 75];

    const multiplicativeStats = {
        'finalDamage': true
    };
 
    const diminishingReturnStats = {
        'attackSpeed': { denominator: 150 },
        'defPenMultiplier': { denominator: 100 }
    };
 
    let html = '';
 
    // ========== TABLE 1: FLAT STAT INCREASES ==========
    html += '<div style="margin-bottom: 30px;">';
    html += '<h3 style="color: var(--accent-primary); margin-bottom: 15px; font-size: 1.1em; font-weight: 600;">Flat Stat Increases</h3>';
    html += '<table class="stat-weight-table">';
    html += '<thead><tr><th>Stat</th>';
    for (let i = 0; i < 6; i++) {
        html += `<th>Increase</th>`;
    }
    html += '</tr></thead><tbody>';
 
    // Attack increments row
    html += '<tr style="background: rgba(79, 195, 247, 0.15);"><td style="color: #4fc3f7; font-weight: bold;"></td>';
    attackIncreases.forEach(inc => {
        html += `<td style="text-align: right; color: #4fc3f7; font-weight: bold;">+${formatNumber(inc)}</td>`;
    });
    html += '</tr>';
 
    // Attack row
    html += `<tr><td class="stat-name"><button onclick="toggleStatChart('${setup}', 'attack', 'Attack', true)" style="background: none; border: none; cursor: pointer; font-size: 1.2em; margin-right: 8px; color: var(--accent-primary);" title="Toggle graph">📊</button>Attack</td>`;
    attackIncreases.forEach(increase => {
        const modifiedStats = { ...stats };
        const oldValue = stats.attack;
        const effectiveIncrease = increase * (1 + weaponAttackBonus / 100);
        modifiedStats.attack = stats.attack + effectiveIncrease;
        const newValue = modifiedStats.attack;
 
        const newDPS = calculateDamage(modifiedStats, 'boss').dps;
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100).toFixed(2);
 
        const tooltip = `+${formatNumber(increase)} Attack\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nEffective increase (with ${weaponAttackBonus.toFixed(1)}% weapon bonus): +${formatNumber(effectiveIncrease)}\nOld DPS: ${formatNumber(baseBossDPS)}, New DPS: ${formatNumber(newDPS)}\nGain: ${gain}%`;
 
        html += `<td class="gain-cell" title="${tooltip}"><span class="gain-positive">+${gain}%</span></td>`;
    });
    html += '</tr>';
    html += `<tr id="chart-row-${setup}-attack" style="display: none;"><td colspan="7" style="padding: 20px; background: var(--background);"><canvas id="chart-${setup}-attack"></canvas></td></tr>`;

    // Main Stat increments row
    html += '<tr style="background: rgba(79, 195, 247, 0.15);"><td style="color: #4fc3f7; font-weight: bold;"></td>';
    mainStatIncreases.forEach(inc => {
        html += `<td style="text-align: right; color: #4fc3f7; font-weight: bold;">+${formatNumber(inc)}</td>`;
    });
    html += '</tr>';
 
    // Main Stat row
    html += `<tr><td class="stat-name"><button onclick="toggleStatChart('${setup}', 'mainStat', 'Main Stat', true)" style="background: none; border: none; cursor: pointer; font-size: 1.2em; margin-right: 8px; color: var(--accent-primary);" title="Toggle graph">📊</button>Main Stat (100 = 1% Stat Dmg)</td>`;
    mainStatIncreases.forEach(increase => {
        const modifiedStats = { ...stats };
        const oldValue = stats.statDamage;
        const statDamageIncrease = increase / 100;
        modifiedStats.statDamage = stats.statDamage + statDamageIncrease;
        const newValue = modifiedStats.statDamage;
 
        const newDPS = calculateDamage(modifiedStats, 'boss').dps;
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100).toFixed(2);
 
        const tooltip = `+${formatNumber(increase)} Main Stat\n+${statDamageIncrease.toFixed(2)}% Stat Damage\nOld Stat Damage: ${oldValue.toFixed(2)}%, New: ${newValue.toFixed(2)}%\nOld DPS: ${formatNumber(baseBossDPS)}, New DPS: ${formatNumber(newDPS)}\nGain: ${gain}%`;
 
        html += `<td class="gain-cell" title="${tooltip}"><span class="gain-positive">+${gain}%</span></td>`;
    });
    html += '</tr>';
    html += `<tr id="chart-row-${setup}-mainStat" style="display: none;"><td colspan="7" style="padding: 20px; background: var(--background);"><canvas id="chart-${setup}-mainStat"></canvas></td></tr>`;

    html += '</tbody></table>';
    html += '</div>';
 
    // ========== TABLE 2: PERCENTAGE STAT INCREASES ==========
    html += '<div style="margin-bottom: 30px;">';
    html += '<h3 style="color: var(--accent-primary); margin-bottom: 15px; font-size: 1.1em; font-weight: 600;">Percentage Stat Increases</h3>';
    html += '<table class="stat-weight-table">';
    html += '<thead><tr><th>Stat</th>';
    for (let i = 0; i < 6; i++) {
        html += `<th>Increase</th>`;
    }
    html += '</tr></thead><tbody>';
 
    // Percentage increments row
    html += '<tr style="background: rgba(79, 195, 247, 0.15);"><td style="color: #4fc3f7; font-weight: bold;"></td>';
    percentIncreases.forEach(inc => {
        html += `<td style="text-align: right; color: #4fc3f7; font-weight: bold;">+${inc}%</td>`;
    });
    html += '</tr>';
 
    // Percentage stats
    percentageStats.forEach(stat => {
        let labelContent = stat.label;
        if (multiplicativeStats[stat.key]) {
            labelContent += ` <span class="info-icon" role="img" aria-label="Info" title="Increases to this stat are multiplicative rather than additive.">ℹ️</span>`;
        } else if (diminishingReturnStats[stat.key]) {
            const info = diminishingReturnStats[stat.key];
            labelContent += ` <span class="info-icon" role="img" aria-label="Info" title="Increases to this stat are multiplicative, but have diminishing returns.">ℹ️</span>`;
        }
 
        html += `<tr><td class="stat-name"><button onclick="toggleStatChart('${setup}', '${stat.key}', '${stat.label}', false)" style="background: none; border: none; cursor: pointer; font-size: 1.2em; margin-right: 8px; color: var(--accent-primary);" title="Toggle graph">📊</button>${labelContent}</td>`;
 
        percentIncreases.forEach(increase => {
            // Calculate cumulative gain by stepping through 1% at a time
            let cumulativeGainPct = 0;
            let currentStepStats = { ...stats };
            const baseDPS = stat.key === "bossDamage" ? baseBossDPS : baseNormalDPS;
            let previousDPS = baseDPS;

            // Step through in 1% increments (or 0.1% for small increases)
            const stepSize = increase <= 5 ? 0.1 : 1;
            const numSteps = Math.round(increase / stepSize);

            for (let step = 1; step <= numSteps; step++) {
                const stepIncrease = stepSize;
                const modifiedStats = { ...currentStepStats };
                const oldValue = currentStepStats[stat.key];

                // Special handling for Main Stat % - it's additive with existing Main Stat % bonuses
                if (stat.key === 'statDamage') {
                    // Use the shared calculation function
                    const currentMainStatPctAtStep = mainStatPct + (step - 1) * stepSize;
                    const statDamageGain = calculateMainStatPercentGain(
                        stepIncrease,
                        currentMainStatPctAtStep,
                        primaryMainStat,
                        defense,
                        currentSelectedClass
                    );

                    // Apply the gain to current stat damage
                    modifiedStats[stat.key] = oldValue + statDamageGain;
                } else if (multiplicativeStats[stat.key]) {
                    modifiedStats[stat.key] = (((1 + oldValue / 100) * (1 + stepIncrease / 100)) - 1) * 100;
                } else if (diminishingReturnStats[stat.key]) {
                    const factor = diminishingReturnStats[stat.key].denominator;
                    // Use the formula to combine the current value with the new source
                    modifiedStats[stat.key] = (1 - (1 - oldValue / factor) * (1 - stepIncrease / factor)) * factor;
                } else {
                    modifiedStats[stat.key] = oldValue + stepIncrease;
                }

                const newDPS = calculateDamage(modifiedStats, stat.key === "bossDamage" ? 'boss' : 'normal').dps;
                const stepGain = ((newDPS - previousDPS) / baseDPS * 100);
                cumulativeGainPct += stepGain;

                // Update for next iteration
                currentStepStats = modifiedStats;
                previousDPS = newDPS;
            }

            const gain = cumulativeGainPct.toFixed(2);
            const newValue = currentStepStats[stat.key];

            // Create tooltip - special handling for Main Stat %
            const oldValue = stats[stat.key];
            const newDPS = previousDPS;

            let tooltip;
            if (stat.key === 'statDamage') {
                const statDamageIncrease = (newValue - oldValue).toFixed(2);
                tooltip = `+${increase}% Main Stat\nStat Damage increase: +${statDamageIncrease}%\nOld Stat Damage: ${formatNumber(oldValue)}%, New: ${formatNumber(newValue)}%\nOld DPS: ${formatNumber(baseDPS)}, New DPS: ${formatNumber(newDPS)}\nGain: ${gain}%`;
            } else {
                tooltip = `+${increase}%\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nOld DPS: ${formatNumber(baseDPS)}, New DPS: ${formatNumber(newDPS)}\nGain: ${gain}%`;
            }

            html += `<td class="gain-cell" title="${tooltip}"><span class="gain-positive">+${gain}%</span></td>`;
        });

        html += '</tr>';
        html += `<tr id="chart-row-${setup}-${stat.key}" style="display: none;"><td colspan="7" style="padding: 20px; background: var(--background);"><canvas id="chart-${setup}-${stat.key}"></canvas></td></tr>`;
    });
 
    html += '</tbody></table>';
    html += '</div>';
 
 
    document.getElementById(`stat-weights-${setup}`).innerHTML = html;
}

// Store chart instances
const statWeightCharts = {};

// Toggle stat weight chart visibility
export function toggleStatChart(setup, statKey, statLabel, isFlat = false) {
    const chartId = `chart-${setup}-${statKey}`;
    const rowId = `chart-row-${setup}-${statKey}`;
    const chartRow = document.getElementById(rowId);

    if (!chartRow) return;

    // Toggle visibility
    if (chartRow.style.display === 'none') {
        chartRow.style.display = 'table-row';

        // Create chart if it doesn't exist
        if (!statWeightCharts[chartId]) {
            renderStatChart(setup, statKey, statLabel, isFlat);
        }
    } else {
        chartRow.style.display = 'none';
    }
}

// Generate chart data for a stat
export function generateStatChartData(setup, statKey, statLabel, isFlat) {
    const stats = getStats(setup);
    const baseBossDPS = calculateDamage(stats, 'boss').dps;
    const weaponAttackBonus = getWeaponAttackBonus();

    const multiplicativeStats = {
        'finalDamage': true
    };

    const diminishingReturnStats = {
        'attackSpeed': { denominator: 150 },
        'defPenMultiplier': { denominator: 100 }
    };

    // Generate data points
    const dataPoints = [];
    const numPoints = 50;
    const minIncrease = isFlat ? (statKey === 'attack' ? 500 : 100) : 1;  // Start at 500 for attack, 100 for mainStat, 1% for percentage stats
    const maxIncrease = isFlat ? (statKey === 'attack' ? 15000 : 7500) : 75;  // Cap at 75% for percentage, 15000 for attack, 7500 for mainStat

    // Calculate baseline DPS at +0% (for first marginal gain calculation)
    const monsterTypeBase = statKey === 'bossDamage' ? 'boss' : (statKey === 'normalDamage' ? 'normal' : 'boss');
    const baseDPS = monsterTypeBase === 'boss' ? baseBossDPS : calculateDamage(stats, 'normal').dps;
    let previousDPS = baseDPS;
    let cumulativeStats = { ...stats };
    let cumulativeIncrease = 0;

    for (let i = 0; i <= numPoints; i++) {
        // For attack, use fixed 500 steps; for others, divide the range
        const stepIncrease = isFlat && statKey === 'attack'
            ? 500
            : (i === 0 ? minIncrease : (maxIncrease - minIncrease) / numPoints);
        cumulativeIncrease += stepIncrease;

        // Stop if we've exceeded the max for attack
        if (isFlat && statKey === 'attack' && cumulativeIncrease > maxIncrease) {
            break;
        }

        const modifiedStats = { ...cumulativeStats };

        let effectiveStepIncrease = stepIncrease;

        if (isFlat) {
            if (statKey === 'attack') {
                effectiveStepIncrease = stepIncrease * (1 + weaponAttackBonus / 100);
                modifiedStats.attack = cumulativeStats.attack + effectiveStepIncrease;
            } else if (statKey === 'mainStat') {
                const statDamageIncrease = stepIncrease / 100;
                modifiedStats.statDamage = cumulativeStats.statDamage + statDamageIncrease;
            }
        } else {
            const oldValue = cumulativeStats[statKey];
            if (statKey === 'statDamage') {
                // Use the shared calculation function
                const mainStatPct = parseFloat(document.getElementById('main-stat-pct-base')?.value) || 0;
                const primaryMainStat = parseFloat(document.getElementById('primary-main-stat-base')?.value) || 0;
                const defense = parseFloat(document.getElementById('defense-base')?.value) || 0;
                const currentSelectedClass = typeof selectedClass !== 'undefined' ? selectedClass : null;

                const prevCumulativeIncrease = cumulativeIncrease - stepIncrease;
                const statDamageGain = calculateMainStatPercentGain(
                    stepIncrease,
                    mainStatPct + prevCumulativeIncrease,
                    primaryMainStat,
                    defense,
                    currentSelectedClass
                );

                modifiedStats[statKey] = oldValue + statDamageGain;
            } else if (multiplicativeStats[statKey]) {
                modifiedStats[statKey] = (((1 + oldValue / 100) * (1 + stepIncrease / 100)) - 1) * 100;
            } else if (diminishingReturnStats[statKey]) {
                const factor = diminishingReturnStats[statKey].denominator;
                modifiedStats[statKey] = (1 - (1 - oldValue / factor) * (1 - stepIncrease / factor)) * factor;
            } else {
                modifiedStats[statKey] = oldValue + stepIncrease;
            }
        }

        // Save cumulative stats for next iteration
        cumulativeStats = { ...modifiedStats };

        const monsterType = statKey === 'bossDamage' ? 'boss' : (statKey === 'normalDamage' ? 'normal' : 'boss');
        const currentDPS = calculateDamage(modifiedStats, monsterType).dps;

        // Calculate marginal gain (gain from previous point to this point) relative to PREVIOUS DPS
        // This shows: "at this power level, adding 1% more gives X% DPS increase"
        const marginalGain = ((currentDPS - previousDPS) / previousDPS * 100);

        // Use the base step increment (weapon bonus is already in DPS calculation)
        // For attack: per 500, for mainStat: per 100, for percentage stats: per 1%
        const actualStepSize = isFlat
            ? (statKey === 'attack' ? stepIncrease / 500 : stepIncrease / 100)
            : stepIncrease;

        const gainPerUnit = actualStepSize > 0 ? marginalGain / actualStepSize : 0;

        dataPoints.push({
            x: cumulativeIncrease,
            y: parseFloat(gainPerUnit.toFixed(2))
        });

        previousDPS = currentDPS;
    }

    return dataPoints;
}

// Render stat weight chart
export function renderStatChart(setup, statKey, statLabel, isFlat) {
    const chartId = `chart-${setup}-${statKey}`;
    const canvas = document.getElementById(chartId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = generateStatChartData(setup, statKey, statLabel, isFlat);

    // Destroy existing chart if it exists
    if (statWeightCharts[chartId]) {
        statWeightCharts[chartId].destroy();
    }

    // Get theme colors
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#d1d5db';

    // Determine the per-unit label based on stat type
    const perUnitLabel = isFlat ? (statKey === 'attack' ? '500' : '100') : '1%';

    // Create new chart
    statWeightCharts[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: `${statLabel} → DPS Gain per ${perUnitLabel}`,
                data: data,
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const increase = context.parsed.x.toFixed(2);
                            const gainPerUnit = context.parsed.y.toFixed(2);
                            return `At +${increase}${isFlat ? '' : '%'}: ${gainPerUnit}% DPS per ${perUnitLabel} added`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: isFlat ? (statKey === 'attack' ? 500 : 100) : 1,
                    title: {
                        display: true,
                        text: `Total Increase in ${statLabel}${isFlat ? '' : ' (%)'}`,
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `DPS Gain (%) per ${perUnitLabel} Added`,
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// Calculate stat equivalency - shows what other stats equal a given stat increase
export function calculateStatEquivalency(sourceStat) {
    // Get base stats from inputs
    const stats = {
        attack: parseFloat(document.getElementById('attack-base').value),
        critRate: parseFloat(document.getElementById('crit-rate-base').value),
        critDamage: parseFloat(document.getElementById('crit-damage-base').value),
        statDamage: parseFloat(document.getElementById('stat-damage-base').value),
        damage: parseFloat(document.getElementById('damage-base').value),
        damageAmp: parseFloat(document.getElementById('damage-amp-base').value),
        attackSpeed: parseFloat(document.getElementById('attack-speed-base').value),
        defPen: parseFloat(document.getElementById('def-pen-base')?.value || 0),
        bossDamage: parseFloat(document.getElementById('boss-damage-base').value),
        normalDamage: parseFloat(document.getElementById('normal-damage-base').value),
        skillCoeff: parseFloat(document.getElementById('skill-coeff-base').value),
        skillMastery: parseFloat(document.getElementById('skill-mastery-base').value),
        skillMasteryBoss: parseFloat(document.getElementById('skill-mastery-boss-base').value),
        minDamage: parseFloat(document.getElementById('min-damage-base').value),
        maxDamage: parseFloat(document.getElementById('max-damage-base').value),
        finalDamage: parseFloat(document.getElementById('final-damage-base').value)
    };

    const baseBossDPS = calculateDamage(stats, 'boss').dps;
    const weaponAttackBonus = getWeaponAttackBonus();

    // Map of stat IDs to their properties
    const statMapping = {
        'attack': {
            label: 'Attack',
            getValue: () => parseFloat(document.getElementById('equiv-attack').value) || 0,
            applyToStats: (stats, value) => {
                const effectiveIncrease = value * (1 + weaponAttackBonus / 100);
                return { ...stats, attack: stats.attack + effectiveIncrease };
            },
            formatValue: (val) => formatNumber(val)
        },
        'main-stat': {
            label: 'Main Stat',
            getValue: () => parseFloat(document.getElementById('equiv-main-stat').value) || 0,
            applyToStats: (stats, value) => {
                const statDamageIncrease = value / 100;
                return { ...stats, statDamage: stats.statDamage + statDamageIncrease };
            },
            formatValue: (val) => formatNumber(val)
        },
        'skill-level': {
            label: '3rd Job Skill +',
            getValue: () => parseFloat(document.getElementById('equiv-skill-level').value) || 0,
            applyToStats: (stats, value) => {
                const skillCoeffIncrease = value * 0.3; // 1 skill level = 0.3% skill coefficient
                return { ...stats, skillCoeff: stats.skillCoeff + skillCoeffIncrease };
            },
            formatValue: (val) => `+${Math.round(val)}`
        },
        'crit-rate': {
            label: 'Critical Rate',
            getValue: () => parseFloat(document.getElementById('equiv-crit-rate').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, critRate: stats.critRate + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'crit-damage': {
            label: 'Critical Damage',
            getValue: () => parseFloat(document.getElementById('equiv-crit-damage').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, critDamage: stats.critDamage + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'attack-speed': {
            label: 'Attack Speed',
            getValue: () => parseFloat(document.getElementById('equiv-attack-speed').value) || 0,
            applyToStats: (stats, value) => {
                const factor = 150;
                const newValue = (1 - (1 - stats.attackSpeed / factor) * (1 - value / factor)) * factor;
                return { ...stats, attackSpeed: newValue };
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%',
            isDiminishing: true
        },
        'damage': {
            label: 'Damage',
            getValue: () => parseFloat(document.getElementById('equiv-damage').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, damage: stats.damage + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'final-damage': {
            label: 'Final Damage',
            getValue: () => parseFloat(document.getElementById('equiv-final-damage').value) || 0,
            applyToStats: (stats, value) => {
                const newValue = (((1 + stats.finalDamage / 100) * (1 + value / 100)) - 1) * 100;
                return { ...stats, finalDamage: newValue };
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%',
            isMultiplicative: true
        },
        'boss-damage': {
            label: 'Boss Damage',
            getValue: () => parseFloat(document.getElementById('equiv-boss-damage').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, bossDamage: stats.bossDamage + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'damage-amp': {
            label: 'Damage Amplification',
            getValue: () => parseFloat(document.getElementById('equiv-damage-amp').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, damageAmp: stats.damageAmp + value }),
            formatValue: (val) => `${val.toFixed(2)}x`,
            suffix: 'x'
        }
    };

    // Get the source stat value and calculate target DPS gain
    const sourceValue = statMapping[sourceStat].getValue();
    if (sourceValue === 0) {
        document.getElementById('equivalency-results').innerHTML = '';
        return;
    }

    const modifiedStats = statMapping[sourceStat].applyToStats(stats, sourceValue);
    const newDPS = calculateDamage(modifiedStats, 'boss').dps;
    const targetDPSGain = ((newDPS - baseBossDPS) / baseBossDPS * 100);

    // Build HTML for results
    let html = '<div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.05)); border: 2px solid rgba(0, 122, 255, 0.2); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">';

    html += '<div style="text-align: center; margin-bottom: 25px;">';
    html += `<div style="font-size: 1.4em; font-weight: 700; color: var(--accent-primary); margin-bottom: 10px;">`;
    html += `${statMapping[sourceStat].formatValue(sourceValue)} ${statMapping[sourceStat].label}`;
    html += '</div>';
    html += `<div style="font-size: 1.1em; color: var(--accent-success); font-weight: 600;">`;
    html += `= ${targetDPSGain.toFixed(2)}% DPS Gain`;
    html += '</div>';
    html += '</div>';

    html += '<table class="stat-weight-table" style="margin: 0;">';
    html += '<thead><tr>';
    html += '<th style="text-align: left; font-size: 1em;">Equivalent Stat</th>';
    html += '<th style="text-align: right; font-size: 1em;">Required Amount</th>';
    html += '<th style="text-align: right; font-size: 1em;">DPS Gain</th>';
    html += '</tr></thead><tbody>';

    // Calculate equivalents for all other stats
    Object.entries(statMapping).forEach(([statId, statConfig]) => {
        if (statId === sourceStat) return; // Skip the source stat

        // Binary search for equivalent value
        let low = 0;
        let high = statId === 'attack' ? 100000 : (statId === 'main-stat' ? 50000 : 1000);
        let iterations = 0;
        const maxIterations = 50;
        const tolerance = 0.01;

        while (iterations < maxIterations && high - low > tolerance) {
            const mid = (low + high) / 2;
            const testStats = statConfig.applyToStats(stats, mid);
            const testDPS = calculateDamage(testStats, 'boss').dps;
            const actualGain = ((testDPS - baseBossDPS) / baseBossDPS * 100);

            if (Math.abs(actualGain - targetDPSGain) < tolerance) {
                break;
            } else if (actualGain < targetDPSGain) {
                low = mid;
            } else {
                high = mid;
            }

            iterations++;
        }

        const equivalentValue = (low + high) / 2;

        // Verify the equivalent value produces similar DPS gain
        const verifyStats = statConfig.applyToStats(stats, equivalentValue);
        const verifyDPS = calculateDamage(verifyStats, 'boss').dps;
        const verifyGain = ((verifyDPS - baseBossDPS) / baseBossDPS * 100);

        let icon = '';

        if (statConfig.isMultiplicative) {
            icon = ' <span style="font-size: 0.9em; opacity: 0.7;" title="Multiplicative stat">ℹ️</span>';
        } else if (statConfig.isDiminishing) {
            icon = ' <span style="font-size: 0.9em; opacity: 0.7;" title="Diminishing returns">ℹ️</span>';
        }

        html += '<tr>';
        html += `<td style="font-weight: 600;">${statConfig.label}${icon}</td>`;
        html += `<td style="text-align: right; font-size: 1.05em; color: var(--accent-primary); font-weight: 600;">${statConfig.formatValue(equivalentValue)}</td>`;
        html += `<td style="text-align: right;"><span class="gain-positive">+${verifyGain.toFixed(2)}%</span></td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    document.getElementById('equivalency-results').innerHTML = html;
}
