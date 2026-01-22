import { CumulativeStatCalculator, ChartPoint } from '@ts/services/stat-calculation-service';
import { loadoutStore } from '@ts/store/loadout.store.js';
import { Chart, ChartType, ChartData, ChartOptions } from 'chart.js/auto';

// Store chart instances with proper typing
const statWeightCharts: Record<string, Chart> = {};

// Toggle stat weight chart visibility
export function toggleStatChart(statKey: string, statLabel: string, isFlat: boolean = false): void {
    const chartId = `chart-${statKey}`;
    const rowId = `chart-row-${statKey}`;
    const chartRow = document.getElementById(rowId);

    if (!chartRow) return;

    // Toggle visibility
    if (chartRow.style.display === 'none') {
        chartRow.style.display = 'table-row';

        // Create chart if it doesn't exist
        if (!statWeightCharts[chartId]) {
            renderStatChart(statKey, statLabel, isFlat);
        }
    } else {
        chartRow.style.display = 'none';
    }
}

// Generate chart data for a stat
export function generateStatChartData(statKey: string, statLabel: string, isFlat: boolean): ChartPoint[] {
    const stats = loadoutStore.getBaseStats();
    const weaponAttackBonus = loadoutStore.getWeaponAttackBonus().totalAttack;
    const monsterType: 'boss' | 'normal' = statKey === 'bossDamage' ? 'boss' :
                       (statKey === 'normalDamage' ? 'normal' : 'boss');

    const calculator = new CumulativeStatCalculator();
    const numPoints = 50;
    const minIncrease = isFlat ? (statKey === 'attack' ? 500 : 100) : 1;
    const maxIncrease = isFlat ? (statKey === 'attack' ? 15000 : 7500) : 75;

    calculator.startSeries(stats, { weaponAttackBonus, monsterType, numSteps: numPoints });

    const dataPoints: ChartPoint[] = [];
    let cumulativeIncrease = 0;

    for (let i = 0; i <= numPoints; i++) {
        const stepIncrease = isFlat && statKey === 'attack'
            ? 500
            : (i === 0 ? minIncrease : (maxIncrease - minIncrease) / numPoints);

        cumulativeIncrease += stepIncrease;

        if (isFlat && statKey === 'attack' && cumulativeIncrease > maxIncrease) {
            break;
        }

        const point = calculator.nextStep(statKey, cumulativeIncrease, i, isFlat);
        dataPoints.push(point);
    }

    return dataPoints;
}

// Render stat weight chart
export function renderStatChart(statKey: string, statLabel: string, isFlat: boolean): void {
    const chartId = `chart-${statKey}`;
    const canvas = document.getElementById(chartId) as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = generateStatChartData(statKey, statLabel, isFlat);

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
        type: 'line' as ChartType,
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
        } as ChartData<'line'>,
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
        } as ChartOptions<'line'>
    });
}
