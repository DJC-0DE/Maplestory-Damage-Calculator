import { calculateDamage } from '../core/calculations/damage-calculations.js';
import { calculateMainStatPercentGain } from '../core/calculations/stat-calculations.js';
import { getStats, getSelectedClass } from '../core/state.js';
import { getWeaponAttackBonus } from '../core/main.js';

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
                const currentSelectedClass = typeof selectedClass !== 'undefined' ? getSelectedClass() : null;

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