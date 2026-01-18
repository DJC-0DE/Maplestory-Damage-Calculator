import { getSelectedStageDefense } from '@core/state.js';
import { formatNumber } from '@utils/formatters.js';
import { getWeaponAttackBonus, getSelectedJobTier } from '@core/state.js';
import { calculateMainStatPercentGain } from '@core/calculations/stat-calculations.js';
import { calculate3rdJobSkillCoefficient, calculate4thJobSkillCoefficient } from '@core/skill-coefficient.js';

window.calculateStatEquivalency = calculateStatEquivalency;

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

    // Defense uses diminishing returns formula: damage dealt = 6000 / (6000 + defense)
    // This ensures defense never reduces damage to zero, even at very high values
    const damageReduction = 6000 / (6000 + effectiveDefense);

    const monsterDamage = monsterType === 'boss' ? stats.bossDamage : stats.normalDamage;

    const finalDamageMultiplier = 1 + (stats.finalDamage / 100);

    const baseHitDamage = baseDamage *
        (1 + stats.statDamage / 100) *
        (1 + stats.damage / 100) *
        (1 + monsterDamage / 100) *
        damageAmpMultiplier *
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
// ULTRA-COMPACT REDESIGN: Horizontal tabbed dashboard with minimal vertical footprint
export function calculateStatWeights(setup, stats) {
    const baseBossDPS = calculateDamage(stats, 'boss').dps;
    const baseNormalDPS = calculateDamage(stats, 'normal').dps;
    const weaponAttackBonus = getWeaponAttackBonus().totalAttack;

    // Get main stat % and related values for proper main stat % calculations
    const mainStatPct = parseFloat(document.getElementById('main-stat-pct-base')?.value) || 0;
    const primaryMainStat = parseFloat(document.getElementById('primary-main-stat-base')?.value) || 0;
    const defense = parseFloat(document.getElementById('defense-base')?.value) || 0;
    const currentSelectedClass = typeof selectedClass !== 'undefined' ? currentSelectedClass() : null;

    // Flat attack increases
    const attackIncreases = [500, 1000, 2500, 5000, 10000, 15000];

    // Flat main stat increases (100 main stat = 1% stat damage)
    const mainStatIncreases = [100, 500, 1000, 2500, 5000, 7500];

    // Percentage-based stats
    const percentageStats = [
        { key: 'skillCoeff', label: 'Skill Coeff' },
        { key: 'skillMastery', label: 'Skill Mastery' },
        { key: 'damage', label: 'Damage' },
        { key: 'finalDamage', label: 'Final Dmg' },
        { key: 'bossDamage', label: 'Boss Dmg' },
        { key: 'normalDamage', label: 'Mob Dmg' },
        { key: 'statDamage', label: 'Main Stat %' },
        { key: 'damageAmp', label: 'Dmg Amp' },
        { key: 'minDamage', label: 'Min Dmg' },
        { key: 'maxDamage', label: 'Max Dmg' },
        { key: 'critRate', label: 'Crit Rate' },
        { key: 'critDamage', label: 'Crit Dmg' },
        { key: 'attackSpeed', label: 'Atk Speed' },
        { key: 'defPen', label: 'Def Pen' }
    ];

    const percentIncreases = [1, 5, 10, 25, 50, 75];

    const multiplicativeStats = {
        'finalDamage': true,
        'defPen': true
    };

    const diminishingReturnStats = {
        'attackSpeed': { denominator: 150 }
    };

    // ============================================
    // ULTRA-COMPACT HORIZONTAL TABBED DASHBOARD
    // ============================================
    let html = '';

    // Tab navigation
    html += '<div class="stat-predictions-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid rgba(255,255,255,0.08);">';
    html += `<button class="stat-pred-tab active" data-tab="flat" onclick="switchStatPredictionTab('${setup}', 'flat')" style="background: transparent; border: none; padding: 10px 16px; font-family: var(--table-font-display); font-weight: 600; font-size: 0.875rem; color: var(--accent-primary); cursor: pointer; border-bottom: 3px solid var(--accent-primary); transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: -0.01em;">Flat Stats</button>`;
    html += `<button class="stat-pred-tab" data-tab="percentage" onclick="switchStatPredictionTab('${setup}', 'percentage')" style="background: transparent; border: none; padding: 10px 16px; font-family: var(--table-font-display); font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); cursor: pointer; border-bottom: 3px solid transparent; transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: -0.01em;">Percentage Stats</button>`;
    html += '</div>';

    // ========== FLAT STATS PANEL ==========
    html += `<div id="stat-pred-panel-${setup}-flat" class="stat-pred-panel active" style="display: block;">`;
    html += '<div class="table-wrapper" style="background: var(--table-surface-base); backdrop-filter: var(--table-glass-blur); border: 1px solid var(--table-glass-border); border-radius: 12px; overflow: hidden; box-shadow: var(--table-glass-shadow);">';
    html += `<table class="table table--compact table--numeric" id="stat-pred-table-${setup}-flat">`;
    html += '<thead><tr><th style="padding: 8px 10px; font-size: 0.75rem;">Stat</th>';
    attackIncreases.forEach((inc, idx) => {
        html += `<th style="padding: 8px 10px; font-size: 0.75rem; text-align: right; cursor: pointer; user-select: none; transition: background 200ms;" onclick="sortStatPredictions('${setup}', 'flat', ${idx + 1}, this)" onmouseover="this.style.background='var(--table-surface-subtle)'" onmouseout="this.style.background='transparent'">+${formatNumber(inc)} <span class="sort-indicator" style="opacity: 0.3; font-size: 0.8em; margin-left: 4px;">⇅</span></th>`;
    });
    html += '</tr></thead><tbody>';

    // Attack row
    html += `<tr><td style="padding: 8px 10px; font-weight: 600; font-size: 0.85rem; color: var(--text-primary);"><button onclick="toggleStatChart('${setup}', 'attack', 'Attack', true)" style="background: none; border: none; cursor: pointer; font-size: 1em; margin-right: 6px; color: var(--accent-primary); opacity: 0.7; transition: opacity 200ms;" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">📊</button>Attack</td>`;
    attackIncreases.forEach(increase => {
        const modifiedStats = { ...stats };
        const oldValue = stats.attack;
        const effectiveIncrease = increase * (1 + weaponAttackBonus / 100);
        modifiedStats.attack = stats.attack + effectiveIncrease;
        const newValue = modifiedStats.attack;

        const newDPS = calculateDamage(modifiedStats, 'boss').dps;
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100).toFixed(2);

        const tooltip = `+${formatNumber(increase)} Attack\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nEffective: +${formatNumber(effectiveIncrease)}\nGain: ${gain}%`;

        html += `<td style="padding: 8px 10px; text-align: right; font-family: var(--table-font-mono); font-weight: 400; font-variant-numeric: tabular-nums; letter-spacing: -0.03em; font-size: 0.85rem;" title="${tooltip}"><span style="color: var(--text-primary);">+${gain}%</span></td>`;
    });
    html += '</tr>';
    html += `<tr id="chart-row-${setup}-attack" class="chart-row" style="display: none;"><td colspan="7" style="padding: 16px; background: var(--background); border-top: 1px solid var(--table-glass-border);"><canvas id="chart-${setup}-attack"></canvas></td></tr>`;

    // Main Stat row
    html += `<tr><td style="padding: 8px 10px; font-weight: 600; font-size: 0.85rem; color: var(--text-primary);"><button onclick="toggleStatChart('${setup}', 'mainStat', 'Main Stat', true)" style="background: none; border: none; cursor: pointer; font-size: 1em; margin-right: 6px; color: var(--accent-primary); opacity: 0.7; transition: opacity 200ms;" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">📊</button>Main Stat</td>`;
    mainStatIncreases.forEach(increase => {
        const modifiedStats = { ...stats };
        const oldValue = stats.statDamage;
        const statDamageIncrease = increase / 100;
        modifiedStats.statDamage = stats.statDamage + statDamageIncrease;
        const newValue = modifiedStats.statDamage;

        const newDPS = calculateDamage(modifiedStats, 'boss').dps;
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100).toFixed(2);

        const tooltip = `+${formatNumber(increase)} Main Stat\n+${statDamageIncrease.toFixed(2)}% Stat Damage\nGain: ${gain}%`;

        html += `<td style="padding: 8px 10px; text-align: right; font-family: var(--table-font-mono); font-weight: 400; font-variant-numeric: tabular-nums; letter-spacing: -0.03em; font-size: 0.85rem;" title="${tooltip}"><span style="color: var(--text-primary);">+${gain}%</span></td>`;
    });
    html += '</tr>';
    html += `<tr id="chart-row-${setup}-mainStat" class="chart-row" style="display: none;"><td colspan="7" style="padding: 16px; background: var(--background); border-top: 1px solid var(--table-glass-border);"><canvas id="chart-${setup}-mainStat"></canvas></td></tr>`;

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';

    // ========== PERCENTAGE STATS PANEL ==========
    html += `<div id="stat-pred-panel-${setup}-percentage" class="stat-pred-panel" style="display: none;">`;
    html += '<div class="table-wrapper" style="background: var(--table-surface-base); backdrop-filter: var(--table-glass-blur); border: 1px solid var(--table-glass-border); border-radius: 12px; overflow: hidden; box-shadow: var(--table-glass-shadow);">';
    html += `<table class="table table--compact table--numeric" id="stat-pred-table-${setup}-percentage">`;
    html += '<thead><tr><th style="padding: 8px 10px; font-size: 0.75rem;">Stat</th>';
    percentIncreases.forEach((inc, idx) => {
        html += `<th style="padding: 8px 10px; font-size: 0.75rem; text-align: right; cursor: pointer; user-select: none; transition: background 200ms;" onclick="sortStatPredictions('${setup}', 'percentage', ${idx + 1}, this)" onmouseover="this.style.background='var(--table-surface-subtle)'" onmouseout="this.style.background='transparent'">+${inc}% <span class="sort-indicator" style="opacity: 0.3; font-size: 0.8em; margin-left: 4px;">⇅</span></th>`;
    });
    html += '</tr></thead><tbody>';

    // Percentage stats rows
    percentageStats.forEach(stat => {
        let labelContent = stat.label;
        if (multiplicativeStats[stat.key]) {
            labelContent += ` <span style="font-size: 0.7em; opacity: 0.5;" title="Multiplicative">⚡</span>`;
        } else if (diminishingReturnStats[stat.key]) {
            //labelContent += ` <span style="font-size: 0.7em; opacity: 0.5;" title="Diminishing returns">📉</span>`;
        }

        html += `<tr><td style="padding: 8px 10px; font-weight: 600; font-size: 0.85rem; color: var(--text-primary);"><button onclick="toggleStatChart('${setup}', '${stat.key}', '${stat.label}', false)" style="background: none; border: none; cursor: pointer; font-size: 1em; margin-right: 6px; color: var(--accent-primary); opacity: 0.7; transition: opacity 200ms;" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">📊</button>${labelContent}</td>`;

        percentIncreases.forEach(increase => {
            let cumulativeGainPct = 0;
            let currentStepStats = { ...stats };
            const baseDPS = stat.key === "bossDamage" ? baseBossDPS : baseNormalDPS;
            let previousDPS = baseDPS;

            let stepSize = increase <= 5 ? 0.1 : 1;
            if (multiplicativeStats[stat.key]) {
                stepSize = increase;
            }

            const numSteps = Math.round(increase / stepSize);

            for (let step = 1; step <= numSteps; step++) {
                const stepIncrease = stepSize;
                const modifiedStats = { ...currentStepStats };
                const oldValue = currentStepStats[stat.key];

                if (stat.key === 'statDamage') {
                    const currentMainStatPctAtStep = mainStatPct + (step - 1) * stepSize;
                    const statDamageGain = calculateMainStatPercentGain(
                        stepIncrease,
                        currentMainStatPctAtStep,
                        primaryMainStat,
                        defense,
                        currentSelectedClass
                    );
                    modifiedStats[stat.key] = oldValue + statDamageGain;
                } else if (multiplicativeStats[stat.key]) {
                    modifiedStats[stat.key] = (((1 + oldValue / 100) * (1 + stepIncrease / 100)) - 1) * 100;
                } else if (diminishingReturnStats[stat.key]) {
                    const factor = diminishingReturnStats[stat.key].denominator;
                    modifiedStats[stat.key] = (1 - (1 - oldValue / factor) * (1 - stepIncrease / factor)) * factor;
                } else {
                    modifiedStats[stat.key] = oldValue + stepIncrease;
                }

                const newDPS = calculateDamage(modifiedStats, stat.key === "bossDamage" ? 'boss' : 'normal').dps;
                const stepGain = ((newDPS - previousDPS) / baseDPS * 100);
                cumulativeGainPct += stepGain;

                currentStepStats = modifiedStats;
                previousDPS = newDPS;
            }

            const gain = cumulativeGainPct.toFixed(2);
            const newValue = currentStepStats[stat.key];
            const oldValue = stats[stat.key];
            const newDPS = previousDPS;

            let tooltip;
            if (stat.key === 'statDamage') {
                const statDamageIncrease = (newValue - oldValue).toFixed(2);
                tooltip = `+${increase}% Main Stat\nStat Damage: +${statDamageIncrease}%\nGain: ${gain}%`;
            } else {
                tooltip = `+${increase}%\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nGain: ${gain}%`;
            }

            html += `<td style="padding: 8px 10px; text-align: right; font-family: var(--table-font-mono); font-weight: 400; font-variant-numeric: tabular-nums; letter-spacing: -0.03em; font-size: 0.85rem;" title="${tooltip}"><span style="color: var(--text-primary);">+${gain}%</span></td>`;
        });

        html += '</tr>';
        html += `<tr id="chart-row-${setup}-${stat.key}" class="chart-row" style="display: none;"><td colspan="7" style="padding: 16px; background: var(--background); border-top: 1px solid var(--table-glass-border);"><canvas id="chart-${setup}-${stat.key}"></canvas></td></tr>`;
    });

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';

    document.getElementById(`stat-weights-${setup}`).innerHTML = html;
}

// Tab switching function for stat predictions
window.switchStatPredictionTab = function(setup, tabName) {
    // Update tab buttons
    const container = document.getElementById(`stat-weights-${setup}`);
    const tabs = container.querySelectorAll('.stat-pred-tab');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
            tab.style.color = 'var(--accent-primary)';
            tab.style.borderBottomColor = 'var(--accent-primary)';
        } else {
            tab.classList.remove('active');
            tab.style.color = 'var(--text-secondary)';
            tab.style.borderBottomColor = 'transparent';
        }
    });

    // Update panels
    const panels = container.querySelectorAll('.stat-pred-panel');
    panels.forEach(panel => {
        if (panel.id === `stat-pred-panel-${setup}-${tabName}`) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    });
};

// Column sorting for stat predictions tables
window.sortStatPredictions = function(setup, tabName, colIndex, headerElement) {
    const tableId = `stat-pred-table-${setup}-${tabName}`;
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Get all data rows (exclude chart rows)
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.classList.contains('chart-row'));

    // Parse numeric values from the clicked column and create row data
    const rowData = rows.map(row => {
        const cell = row.querySelector(`td:nth-child(${colIndex + 1})`);
        if (!cell) return { row, value: -Infinity };

        const span = cell.querySelector('span');
        const text = span ? span.textContent : cell.textContent;
        // Extract numeric value (handles "+1.23%" format)
        const value = parseFloat(text.replace(/[+%]/g, ''));
        return { row, value };
    });

    // Determine sort direction
    const currentSort = headerElement.dataset.sort || 'none';
    let newDirection = 'asc';

    if (currentSort === 'asc') {
        newDirection = 'desc';
    } else if (currentSort === 'desc') {
        newDirection = 'asc'; // Toggle back to asc
    }

    // Sort rows based on values
    rowData.sort((a, b) => {
        if (newDirection === 'asc') {
            return a.value - b.value;
        } else {
            return b.value - a.value;
        }
    });

    // Reorder rows in DOM (keeping chart rows with their data rows)
    rowData.forEach((item, index) => {
        const dataRow = item.row;
        const chartRow = dataRow.nextElementSibling;
        tbody.appendChild(dataRow);
        if (chartRow && chartRow.classList.contains('chart-row')) {
            tbody.appendChild(chartRow);
        }
    });

    // Update sort indicators
    const tableHeaders = table.querySelectorAll('th .sort-indicator');
    tableHeaders.forEach(indicator => {
        indicator.textContent = '⇅';
        indicator.style.opacity = '0.3';
    });

    const clickedIndicator = headerElement.querySelector('.sort-indicator');
    if (clickedIndicator) {
        clickedIndicator.textContent = newDirection === 'asc' ? '▲' : '▼';
        clickedIndicator.style.opacity = '1';
    }

    // Store sort state
    headerElement.dataset.sort = newDirection;
};

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
    const weaponAttackBonus = getWeaponAttackBonus().totalAttack;

    // Map of stat IDs to their properties (ordered to match Stat Predictions tables)
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
        'skill-coeff': {
            label: 'Skill Coefficient',
            getValue: () => parseFloat(document.getElementById('equiv-skill-coeff').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, skillCoeff: stats.skillCoeff + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'skill-mastery': {
            label: 'Skill Mastery',
            getValue: () => parseFloat(document.getElementById('equiv-skill-mastery').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, skillMastery: stats.skillMastery + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
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
        'normal-damage': {
            label: 'Monster Damage',
            getValue: () => parseFloat(document.getElementById('equiv-normal-damage').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, normalDamage: stats.normalDamage + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'stat-damage': {
            label: 'Main Stat %',
            getValue: () => parseFloat(document.getElementById('equiv-stat-damage').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, statDamage: stats.statDamage + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'damage-amp': {
            label: 'Damage Amplification',
            getValue: () => parseFloat(document.getElementById('equiv-damage-amp').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, damageAmp: stats.damageAmp + value }),
            formatValue: (val) => `${val.toFixed(2)}x`,
            suffix: 'x'
        },
        'min-damage': {
            label: 'Min Damage Multiplier',
            getValue: () => parseFloat(document.getElementById('equiv-min-damage').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, minDamage: stats.minDamage + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'max-damage': {
            label: 'Max Damage Multiplier',
            getValue: () => parseFloat(document.getElementById('equiv-max-damage').value) || 0,
            applyToStats: (stats, value) => ({ ...stats, maxDamage: stats.maxDamage + value }),
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
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
        'def-pen': {
            label: 'Defense Penetration',
            getValue: () => parseFloat(document.getElementById('equiv-def-pen').value) || 0,
            applyToStats: (stats, value) => 
                { 
                    const newValue = (((1 + stats.defPen / 100) * (1 + value / 100)) - 1) * 100;
                    return { ...stats, defPen: newValue };
                }
            ,
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%',
            isMultiplicative: true
        }
    };

    // Determine target type based on source stat
    const targetType = sourceStat === 'normal-damage' ? 'normal' : 'boss';

    // Get the source stat value and calculate target DPS gain
    const sourceValue = statMapping[sourceStat].getValue();
    if (sourceValue === 0) {
        document.getElementById('equivalency-results').innerHTML = '';
        return;
    }

    const baseDPS = calculateDamage(stats, targetType).dps;
    const modifiedStats = statMapping[sourceStat].applyToStats(stats, sourceValue);
    const newDPS = calculateDamage(modifiedStats, targetType).dps;
    const targetDPSGain = ((newDPS - baseDPS) / baseDPS * 100);

    // Build HTML for results
    let html = '<div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.05)); border: 2px solid rgba(0, 122, 255, 0.2); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">';
    html += '<div style="text-align: center; margin-bottom: 25px;">';
    html += `<div style="font-size: 1.4em; font-weight: 700; color: var(--accent-primary); margin-bottom: 10px;">`;
    html += `${statMapping[sourceStat].formatValue(sourceValue)} ${statMapping[sourceStat].label}`;
    html += '</div>';
    html += `<div style="font-size: 1.1em; color: var(--accent-success); font-weight: 600;">`;
    html += `= ${targetDPSGain.toFixed(2)}% DPS Gain (${targetType === 'boss' ? 'Boss' : 'Monster'} Target)`;
    html += '</div>';
    html += '</div>';

    html += '<table class="table" style="margin: 0;">';
    html += '<thead><tr>';
    html += '<th style="text-align: left; font-size: 1em;">Equivalent Stat</th>';
    html += '<th style="text-align: right; font-size: 1em;">Required Amount</th>';
    html += '<th style="text-align: right; font-size: 1em;">DPS Gain</th>';
    html += '</tr></thead><tbody>';

    // Define stat maximums for realistic capping
    const statMaximums = {
        'crit-rate': 100,  // Crit rate caps at 100%
        'crit-damage': 500, // Realistic max for crit damage
        'attack-speed': 130, // Attack speed has diminishing returns, realistic max
        'boss-damage': null, // No realistic cap for boss damage when comparing monster dmg
        'normal-damage': null, // No realistic cap for monster damage when comparing boss dmg
        'damage': null, // No realistic cap
        'final-damage': null, // No realistic cap
        'stat-damage': null, // No realistic cap
        'damage-amp': null, // No realistic cap
        'min-damage': 100, // Min damage multiplier caps at 100%
        'max-damage': 100, // Max damage multiplier caps at 100%
        'skill-coeff': 1000, // Reasonable max
        'skill-mastery': 100, // Reasonable max
        'attack': 100000, // Very high but finite
        'main-stat': 500000, // Very high but finite,
        'def-pen': 100
    };

    // Calculate equivalents for all other stats
    Object.entries(statMapping).forEach(([statId, statConfig]) => {
        if (statId === sourceStat) return; // Skip the source stat

        // Get the max value for this stat (if capped)
        let maxValue = statMaximums[statId];
        if (maxValue === null) {
            // Use default high values for uncapped stats
            maxValue = statId === 'attack' ? 100000 : (statId === 'main-stat' ? 50000 : 1000);
        }

        // Special handling for crit rate - calculate room to cap
        let isCritRateCapped = false;
        if (statId === 'crit-rate') {
            const currentCritRate = stats.critRate;
            maxValue = Math.max(0, 100 - currentCritRate); // Can only increase up to 100%
            isCritRateCapped = currentCritRate >= 100;
        }

        // Binary search for equivalent value
        let low = 0;
        let high = maxValue;
        let iterations = 0;
        const maxIterations = 50;
        const tolerance = 0.01;

        while (iterations < maxIterations && high - low > tolerance) {
            const mid = (low + high) / 2;
            const testStats = statConfig.applyToStats(stats, mid);
            const testDPS = calculateDamage(testStats, targetType).dps;
            const actualGain = ((testDPS - baseDPS) / baseDPS * 100);

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

        // Check if we hit the cap and still can't reach target gain
        const verifyStats = statConfig.applyToStats(stats, equivalentValue);
        const verifyDPS = calculateDamage(verifyStats, targetType).dps;
        const verifyGain = ((verifyDPS - baseDPS) / baseDPS * 100);

        // If we're at the cap and still below target gain, show as unable to match
        // Use relative tolerance for small caps
        const atCap = maxValue > 0 && (equivalentValue / maxValue) > 0.999; // Within 0.1% of max
        const unableToMatch = atCap && verifyGain < targetDPSGain * 0.99; // Within 1% tolerance

        let icon = '';

        if (statConfig.isMultiplicative) {
            icon = ' <span style="font-size: 0.9em; opacity: 0.7;" title="Multiplicative stat">ℹ️</span>';
        } else if (statConfig.isDiminishing) {
            //icon = ' <span style="font-size: 0.9em; opacity: 0.7;" title="Diminishing returns">ℹ️</span>';
        }

        html += '<tr>';
        html += `<td style="font-weight: 600;">${statConfig.label}${icon}</td>`;

        if (unableToMatch) {
            // Show "-" when stat can't match the target gain
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--text-secondary); font-style: italic;">-</td>`;
            html += `<td style="text-align: right; color: var(--text-secondary); font-style: italic;">Unable to match</td>`;
        } else {
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--accent-primary); font-weight: 600;">${statConfig.formatValue(equivalentValue)}</td>`;
            html += `<td style="text-align: right;"><span class="gain-positive">+${verifyGain.toFixed(2)}%</span></td>`;
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    document.getElementById('equivalency-results').innerHTML = html;
}