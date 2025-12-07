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

// Boss defense lookup table
const bossDefenseTable = {
    "1-4": 16.6472,
    "2-8": 16.6472,
    "3-10": 16.6472,
    "4-10": 22.0428,
    "5-10": 22.5563,
    "6-10": 23.0794,
    "7-10": 23.6124,
    "8-10": 21.3986,
    "9-10": 24.6658,
    "10-10": 25.2096
};

// Normal stage defense overrides
const normalDefenseTable = {
    "1-1": 0,
    "1-2": 0.02,
    "1-3": 0.1
};

// Get enemy defense based on stage key (e.g., "1-4" for Chapter 1, Stage 4)
function getEnemyDefense(stageKey, isBoss = false) {
    if (!stageKey) return 0;
    
    // Parse chapter and stage from key
    const match = stageKey.match(/^(\d+)-(\d+)$/);
    if (!match) return 0;
    
    const chapter = parseInt(match[1], 10);
    const stage = parseInt(match[2], 10);
    
    if (isBoss) {
        // Check boss defense table
        return bossDefenseTable[stageKey] ?? 0;
    } else {
        // Check normal defense override
        if (normalDefenseTable[stageKey] !== undefined) {
            return normalDefenseTable[stageKey];
        }
        
        // Fallback formula for normal stages
        if (chapter <= 1) return 0;
        
        const cappedChapter = Math.min(Math.max(chapter, 2), 28);
        const cappedStage = Math.min(Math.max(stage, 1), 10);
        return 0.3166094 + 3 * (cappedChapter - 2) + (cappedStage - 1) / 3;
    }
}

// Main damage calculation function
function calculateDamage(stats, monsterType) {
    // Step 1: Calculate Base Damage
    const totalSkillMastery = stats.skillMastery + (monsterType === 'boss' ? stats.skillMasteryBoss : 0);
    const baseDamage = stats.attack * (stats.skillCoeff / 100) * (1 + totalSkillMastery / 100);

    // Step 2: Calculate Base Hit Damage
    // Damage amplification uses square root scaling with diminishing returns
    const damageAmpMultiplier = 1.0542 + 0.0198 * Math.sqrt(stats.damageAmp || 0);

    // Defense Penetration calculation
    const isBoss = monsterType === 'boss';
    const enemyDefense = getEnemyDefense(stats.stageKey, isBoss);
    const defensePenetrationPct = Math.max(0, Math.min(stats.defPen || 0, 100));
    const effectiveDefense = enemyDefense * (1 - defensePenetrationPct / 100);
    const defenseMultiplier = 100 / (100 + Math.max(0, effectiveDefense));

    const monsterDamage = isBoss ? stats.bossDamage : stats.normalDamage;

    const baseHitDamage = baseDamage *
        (1 + stats.statDamage / 100) * 1.004 *
        (1 + stats.damage / 100) *
        (1 + monsterDamage / 100) *
        damageAmpMultiplier *
        defenseMultiplier *
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
        defenseMultiplier,
        effectiveDefense,
        enemyDefense,
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
        { key: 'bossDamage', label: 'Boss Damage' },
        { key: 'normalDamage', label: 'Monster Damage' },
        { key: 'damageAmp', label: 'Damage Amplification' },
        { key: 'defPen', label: 'Defense Penetration' },
        { key: 'minDamage', label: 'Min Damage Multiplier' },
        { key: 'maxDamage', label: 'Max Damage Multiplier' },
        { key: 'critRate', label: 'Critical Rate' },
        { key: 'critDamage', label: 'Critical Damage' },
        { key: 'attackSpeed', label: 'Attack Speed' }
    ];

    const percentIncreases = [1, 5, 10, 25, 50, 75, 100];

    let html = '';

    // Single merged table
    html += '<table class="stat-weight-table">';
    html += '<thead><tr><th>Stat</th>';
    for (let i = 0; i < 7; i++) {
        html += `<th>Increase</th>`;
    }
    html += '</tr></thead><tbody>';

    // Flat Increases Section Header
    html += '<tr class="bucket-row"><td colspan="8" class="bucket-label">Flat Stat Increases</td></tr>';

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
        const statDamageIncrease = increase / 100; // 100 main stat = 1% stat damage
        modifiedStats.statDamage = stats.statDamage + statDamageIncrease;
        const newValue = modifiedStats.statDamage;

        const newDPS = calculateDamage(modifiedStats, 'boss').dps;
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100).toFixed(2);

        const tooltip = `+${formatNumber(increase)} Main Stat\n+${statDamageIncrease.toFixed(2)}% Stat Damage\nOld Stat Damage: ${oldValue.toFixed(2)}%, New: ${newValue.toFixed(2)}%\nOld DPS: ${formatNumber(baseBossDPS)}, New DPS: ${formatNumber(newDPS)}\nGain: ${gain}%`;

        html += `<td class="gain-cell" title="${tooltip}"><span class="gain-positive">+${gain}%</span></td>`;
    });
    html += '</tr>';

    // Percentage Section Header
    html += '<tr class="bucket-row"><td colspan="8" class="bucket-label">Percentage Stat Increases</td></tr>';

    // Percentage increments row
    html += '<tr style="background: rgba(79, 195, 247, 0.15);"><td style="color: #4fc3f7; font-weight: bold;"></td>';
    percentIncreases.forEach(inc => {
        html += `<td style="text-align: right; color: #4fc3f7; font-weight: bold;">+${inc}%</td>`;
    });
    html += '</tr>';

    const multiplicativeStats = {
        'attackSpeed': { denominator: 150, },
        'defPen': { denominator: 100, }
    };

    // Percentage stats
    percentageStats.forEach(stat => {
        let labelContent = stat.label;
        if (multiplicativeStats[stat.key]) {
            const info = multiplicativeStats[stat.key];
            labelContent += ` <span class="info-icon" role="img" aria-label="Info" title="Increases to this stat are multiplicative rather than additive, but also have diminishing returns. A line item with 10% in this stat will translate to less than 10% increase on the stats page. Final increase = y% × (1 - x/${info.denominator}), where x is the current value and y is the increase amount.">ℹ️</span>`;
        }

        html += `<tr><td class="stat-name">${labelContent}</td>`;

        percentIncreases.forEach(increase => {
            const modifiedStats = { ...stats };
            const oldValue = stats[stat.key];

            // Special handling for multiplicative stats with diminishing returns
            if (multiplicativeStats[stat.key]) {
                const denominator = multiplicativeStats[stat.key].denominator;
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

    document.getElementById(`stat-weights-${setup}`).innerHTML = html;
}
