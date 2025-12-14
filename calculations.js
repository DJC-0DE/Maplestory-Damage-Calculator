// Number formatting utility
function formatNumber(num) {
    return Math.round(num).toLocaleString();
}

// Calculate inventory bonus for a weapon
function calculateInventoryBonus(rarity, tier, level) {
    const rate = weaponRatesPerLevel[rarity][tier];
    if (rate === null || level === 0) return 0;
    return rate * level;
}

// Main damage calculation function
function calculateDamage(stats, monsterType) {
    // Step 1: Calculate Base Damage
    const totalSkillMastery = stats.skillMastery + (monsterType === 'boss' ? stats.skillMasteryBoss : 0);
    const baseDamage = stats.attack * (stats.skillCoeff / 100) * (1 + totalSkillMastery / 100);

    // Step 2: Calculate Base Hit Damage
    // Damage amplification uses square root scaling with diminishing returns
    // Formula: 1.0542 + sqrt(damageAmp) / 50
    const damageAmpMultiplier = 1.05 + Math.sqrt(stats.damageAmp) / 50;

    // NEW: Defense Penetration multiplier (disabled - always 1)
    const defPenMultiplier = 1;

    const monsterDamage = monsterType === 'boss' ? stats.bossDamage : stats.normalDamage;

    const finalDamageMultiplier = 1 + (stats.finalDamage / 100);

    const baseHitDamage = baseDamage *
        (1 + stats.statDamage / 100) * 1.004 *
        (1 + stats.damage / 100) *
        (1 + monsterDamage / 100) *
        damageAmpMultiplier *
        defPenMultiplier *
        finalDamageMultiplier;

    // Step 3: Calculate Non-Crit Damage Range
    const nonCritMin = baseHitDamage * (stats.minDamage / 100);
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
    const attackSpeedMultiplier = 1 + (stats.attackSpeed / 100);
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

// Apply item stats to base stats
function applyItemToStats(baseStats, equippedItem, comparisonItem) {
    // Start with base stats
    const newStats = { ...baseStats };

    // Get weapon attack bonus
    const weaponAttackBonus = getWeaponAttackBonus();
    const weaponMultiplier = 1 + (weaponAttackBonus / 100);

    // Subtract equipped item stats (apply weapon bonus to attack)
    newStats.attack -= equippedItem.attack * weaponMultiplier;
    newStats.critRate -= equippedItem.critRate;
    newStats.critDamage -= equippedItem.critDamage;
    newStats.skillCoeff -= equippedItem.skillLevel * 0.3; // 1 level = 0.3% skill coefficient
    newStats.normalDamage -= equippedItem.normalDamage;
    newStats.bossDamage -= equippedItem.bossDamage;
    newStats.damage -= equippedItem.damage;

    // Add comparison item stats (apply weapon bonus to attack)
    newStats.attack += comparisonItem.attack * weaponMultiplier;
    newStats.critRate += comparisonItem.critRate;
    newStats.critDamage += comparisonItem.critDamage;
    newStats.skillCoeff += comparisonItem.skillLevel * 0.3; // 1 level = 0.3% skill coefficient
    newStats.normalDamage += comparisonItem.normalDamage;
    newStats.bossDamage += comparisonItem.bossDamage;
    newStats.damage += comparisonItem.damage;

    return newStats;
}

// Helper function to find equivalent percentage stat for a target DPS gain
function findEquivalentPercentage(stats, statKey, targetDPSGain, baseDPS, monsterType, multiplicativeStats, diminishingReturnStats) {
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
            modifiedStats[statKey] = ((1 + oldValue / 100) * (1 + mid / 100)) * 100 - 100;
        } else if (diminishingReturnStats[statKey]) {
            const denominator = diminishingReturnStats[statKey].denominator;
            const effectiveIncrease = mid * (1 - oldValue / denominator);
            modifiedStats[statKey] = oldValue + effectiveIncrease;
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
function calculateStatWeights(setup, stats) {
    const baseBossDPS = calculateDamage(stats, 'boss').dps;
    const baseNormalDPS = calculateDamage(stats, 'normal').dps;
    const weaponAttackBonus = getWeaponAttackBonus();

    // Flat attack increases
    const attackIncreases = [500, 1000, 2500, 5000, 10000, 15000, 25000];

    // Flat main stat increases (100 main stat = 1% stat damage)
    const mainStatIncreases = [100, 500, 1000, 2500, 5000, 7500, 10000];

    // Percentage-based stats
    const percentageStats = [
        { key: 'skillCoeff', label: 'Skill Coefficient' },
        { key: 'skillMastery', label: 'Skill Mastery' },
        { key: 'damage', label: 'Damage' },
        { key: 'finalDamage', label: 'Final Damage' },
        { key: 'bossDamage', label: 'Boss Damage' },
        { key: 'normalDamage', label: 'Monster Damage' },
        { key: 'damageAmp', label: 'Damage Amplification' },
        { key: 'minDamage', label: 'Min Damage Multiplier' },
        { key: 'maxDamage', label: 'Max Damage Multiplier' },
        { key: 'critRate', label: 'Critical Rate' },
        { key: 'critDamage', label: 'Critical Damage' },
        { key: 'attackSpeed', label: 'Attack Speed' }
    ];

    const percentIncreases = [1, 5, 10, 25, 50, 75, 100];

    const multiplicativeStats = {
        'finalDamage': true
    };

    const diminishingReturnStats = {
        'attackSpeed': { denominator: 150 }
    };

    let html = '';

    // ========== TABLE 1: FLAT STAT INCREASES ==========
    html += '<div style="margin-bottom: 30px;">';
    html += '<h3 style="color: var(--accent-primary); margin-bottom: 15px; font-size: 1.1em; font-weight: 600;">Flat Stat Increases</h3>';
    html += '<table class="stat-weight-table">';
    html += '<thead><tr><th>Stat</th>';
    for (let i = 0; i < 7; i++) {
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
    html += `<tr><td class="stat-name">Attack</td>`;
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

    // Main Stat increments row
    html += '<tr style="background: rgba(79, 195, 247, 0.15);"><td style="color: #4fc3f7; font-weight: bold;"></td>';
    mainStatIncreases.forEach(inc => {
        html += `<td style="text-align: right; color: #4fc3f7; font-weight: bold;">+${formatNumber(inc)}</td>`;
    });
    html += '</tr>';

    // Main Stat row
    html += `<tr><td class="stat-name">Main Stat (100 = 1% Stat Dmg)</td>`;
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

    html += '</tbody></table>';
    html += '</div>';

    // ========== TABLE 2: PERCENTAGE STAT INCREASES ==========
    html += '<div style="margin-bottom: 30px;">';
    html += '<h3 style="color: var(--accent-primary); margin-bottom: 15px; font-size: 1.1em; font-weight: 600;">Percentage Stat Increases</h3>';
    html += '<table class="stat-weight-table">';
    html += '<thead><tr><th>Stat</th>';
    for (let i = 0; i < 7; i++) {
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
            labelContent += ` <span class="info-icon" role="img" aria-label="Info" title="Increases to this stat are multiplicative rather than additive. This is our best guess at how ${stat.key} is calculated.">ℹ️</span>`;
        } else if (diminishingReturnStats[stat.key]) {
            const info = diminishingReturnStats[stat.key];
            labelContent += ` <span class="info-icon" role="img" aria-label="Info" title="Increases to this stat are additive but have diminishing returns. Final increase = y% × (1 - x/${info.denominator}), where x is the current value and y is the increase amount.">ℹ️</span>`;
        }

        html += `<tr><td class="stat-name">${labelContent}</td>`;

        percentIncreases.forEach(increase => {
            const modifiedStats = { ...stats };
            const oldValue = stats[stat.key];
            if (multiplicativeStats[stat.key]) {
                modifiedStats[stat.key] = ((1 + oldValue / 100) * (1 + increase / 100)) * 100 - 100;
            } else if (diminishingReturnStats[stat.key]) {
                const denominator = diminishingReturnStats[stat.key].denominator;
                const effectiveIncrease = increase * (1 - oldValue / denominator);
                modifiedStats[stat.key] = oldValue + effectiveIncrease;
            } else {
                modifiedStats[stat.key] = oldValue + increase;
            }

            const newValue = modifiedStats[stat.key];
            const newDPS = calculateDamage(modifiedStats, stat.key === "bossDamage" ? 'boss' : 'normal').dps;
            const baseDPS = stat.key === "bossDamage" ? baseBossDPS : baseNormalDPS;
            const gain = ((newDPS - baseDPS) / baseDPS * 100).toFixed(2);

            const tooltip = `+${increase}%\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nOld DPS: ${formatNumber(baseDPS)}, New DPS: ${formatNumber(newDPS)}\nGain: ${gain}%`;

            html += `<td class="gain-cell" title="${tooltip}"><span class="gain-positive">+${gain}%</span></td>`;
        });

        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    // ========== TABLE 3: STAT EQUIVALENCE ==========
    html += '<div style="margin-bottom: 20px;">';
    html += '<h3 style="color: var(--accent-success); margin-bottom: 10px; font-size: 1.1em; font-weight: 600;">Stat Equivalence to Attack</h3>';
    html += '<p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px;">How much of each percentage stat equals the same DPS gain as gaining attack?</p>';
    html += '<table class="stat-weight-table">';
    html += '<thead><tr><th>Percentage Stat</th>';

    // Reference attack amounts for equivalence
    const referenceAttacks = [500, 1000, 2500];
    const attackGains = [];

    referenceAttacks.forEach(attackInc => {
        const modifiedStats = { ...stats };
        const effectiveIncrease = attackInc * (1 + weaponAttackBonus / 100);
        modifiedStats.attack = stats.attack + effectiveIncrease;
        const newDPS = calculateDamage(modifiedStats, 'boss').dps;
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100);
        attackGains.push(gain);
        html += `<th>≈ +${formatNumber(attackInc)} Attack</th>`;
    });

    html += '</tr></thead><tbody>';

    // For each percentage stat, find equivalent
    percentageStats.forEach(stat => {
        html += `<tr><td class="stat-name">${stat.label}</td>`;

        referenceAttacks.forEach((attackInc, index) => {
            const targetGain = attackGains[index];
            const monsterType = stat.key === "bossDamage" ? 'boss' : (stat.key === "normalDamage" ? 'normal' : 'boss');
            const equivalentPct = findEquivalentPercentage(
                stats,
                stat.key,
                targetGain,
                monsterType === 'boss' ? baseBossDPS : baseNormalDPS,
                monsterType,
                multiplicativeStats,
                diminishingReturnStats
            );

            if (equivalentPct === null) {
                html += `<td class="gain-cell" style="color: var(--text-secondary);">N/A</td>`;
            } else {
                const tooltip = `${equivalentPct.toFixed(2)}% ${stat.label}\n≈ ${targetGain.toFixed(2)}% DPS gain\n≈ +${formatNumber(attackInc)} Attack`;
                html += `<td class="gain-cell" title="${tooltip}"><span class="gain-positive">+${equivalentPct.toFixed(2)}%</span></td>`;
            }
        });

        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    document.getElementById(`stat-weights-${setup}`).innerHTML = html;
}
