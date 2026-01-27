/**
 * Stat Predictions UI
 * HTML generation and event handling for stat predictions table
 */

import { formatNumber } from '@ts/utils/formatters';
import { calculateAllStatWeights } from './stat-predictions';
import { PERCENTAGE_STATS, MULTIPLICATIVE_STATS, DEFAULT_STAT_INCREASES } from './stat-predictions';
import type { StatWeightResult } from '@ts/types/page/stat-hub/stat-hub.types';
import { loadoutStore } from '@ts/store/loadout.store';
import { debounce } from '@ts/utils/event-emitter';
import { resetCachedCharts } from '@ts/utils/stat-chart';

/**
 * Format a stat increase value with appropriate units
 */
function formatStatValue(value: number, statKey?: string): string {
    if (statKey === 'damageAmp') {
        return `+${value.toFixed(1)}x`;
    }
    return `+${formatNumber(value)}`;
}

/**
 * Generate tooltip text for a stat cell
 */
function generateStatTooltip(
    statKey: string,
    increase: number,
    oldValue: number,
    newValue: number,
    gainPercentage: number,
    effectiveIncrease?: number
): string {
    if (statKey === 'attack') {
        return `+${formatNumber(increase)} Attack\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nEffective: +${formatNumber(effectiveIncrease || 0)}\nGain: ${gainPercentage.toFixed(2)}%`;
    } else if (statKey === 'mainStat') {
        const actualMainStatGain = effectiveIncrease || increase;
        return `+${formatNumber(actualMainStatGain)} Main Stat\n+${formatNumber(actualMainStatGain)} Attack\n+${(actualMainStatGain / 100).toFixed(2)}% Stat Damage\nGain: ${gainPercentage.toFixed(2)}%`;
    } else if (statKey === 'statDamage') {
        const statDamageIncrease = (newValue - oldValue).toFixed(2);
        return `+${increase}% Main Stat\nStat Damage: +${statDamageIncrease}%\nGain: ${gainPercentage.toFixed(2)}%`;
    } else {
        return `+${increase}%\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nGain: ${gainPercentage.toFixed(2)}%`;
    }
}

/**
 * Generate a table cell with gain percentage
 */
function generateGainCell(
    statKey: string,
    increase: number,
    oldValue: number,
    newValue: number,
    gainPercentage: number,
    effectiveIncrease?: number
): string {
    const tooltip = generateStatTooltip(statKey, increase, oldValue, newValue, gainPercentage, effectiveIncrease);
    return `<td title="${tooltip}"><span style="color: var(--text-primary);">+${gainPercentage.toFixed(2)}%</span></td>`;
}

/**
 * Generate a stat row with chart toggle button
 */
function generateStatRow(
    statKey: string,
    statLabel: string,
    isFlat: boolean,
    weights: StatWeightResult[],
    increaseLabel: string
): string {
    let labelContent = statLabel;

    // Add special indicators for certain stat types
    if (MULTIPLICATIVE_STATS[statKey]) {
        labelContent += ` <span style="font-size: 0.7em; opacity: 0.5;" title="Multiplicative">⚡</span>`;
    }

    // Generate the row header with chart toggle button
    let html = `<tr><td><button onclick="toggleStatChart('${statKey}', '${statLabel}', ${isFlat})" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">📊</button>${labelContent}</td>`;

    // Generate cells for each increase value
    weights.forEach(weight => {
        html += generateGainCell(
            statKey,
            weight.increase,
            weight.oldValue ?? 0,
            weight.newValue ?? 0,
            weight.gainPercentage,
            weight.effectiveIncrease
        );
    });

    html += '</tr>';

    // Add chart row
    const colspan = weights.length + 1;
    html += `<tr id="chart-row-${statKey}" class="chart-row" style="display: none;"><td colspan="${colspan}" style="padding: 16px; background: var(--background); border-top: 1px solid var(--table-glass-border);"><canvas id="chart-${statKey}"></canvas></td></tr>`;

    return html;
}

/**
 * Generate the header row for a predictions table
 */
function generateTableHeader(increases: number[], isPercentage: boolean): string {
    let html = '<thead><tr><th>Stat</th>';

    increases.forEach((inc, idx) => {
        if (isPercentage) {
            html += `<th onclick="sortStatPredictions('percentage', ${idx + 1}, this)" onmouseover="this.style.background='var(--table-surface-subtle)'" onmouseout="this.style.background='transparent'">+${inc}% <span class="sort-indicator" style="opacity: 0.3; font-size: 0.8em; margin-left: 4px;">⇅</span></th>`;
        } else {
            html += `<th>+${formatNumber(inc)} </th>`;
        }
    });

    html += '</tr></thead>';
    return html;
}

/**
 * Generate HTML for flat stats section
 */
function generateFlatStatsSection(weights: ReturnType<typeof calculateAllStatWeights>): string {
    let html = '<div class="stat-predictions-section">';
    html += '<h3 style="margin: 0 0 12px 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">Flat Stats</h3>';
    html += '<div class="table-wrapper">';
    html += `<table class="table" id="stat-pred-table-flat">`;

    // Attack table
    html += generateTableHeader(DEFAULT_STAT_INCREASES.flat, false);
    html += '<tbody>';
    html += generateStatRow('attack', 'Attack', true, weights.attackWeights, 'Attack');
    html += '</tbody>';

    // Main stat table
    html += generateTableHeader(DEFAULT_STAT_INCREASES.mainStat, false);
    html += '<tbody>';
    html += generateStatRow('mainStat', 'Main Stat', true, weights.mainStatWeights, 'Main Stat');
    html += '</tbody>';

    html += '</table>';
    html += '</div>';
    html += '</div>';

    return html;
}

/**
 * Generate HTML for percentage stats section
 */
function generatePercentageStatsSection(weights: ReturnType<typeof calculateAllStatWeights>): string {
    let html = '<div class="stat-predictions-section" style="margin-top: 24px;">';
    html += '<h3 style="margin: 0 0 12px 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">Percentage Stats</h3>';
    html += '<div class="table-wrapper">';
    html += `<table class="table" id="stat-pred-table-percentage">`;

    html += '<thead><tr><th style="padding: 8px 10px; font-size: 0.75rem;">Stat</th>';
    DEFAULT_STAT_INCREASES.percentage.forEach((inc, idx) => {
        html += `<th onclick="sortStatPredictions('percentage', ${idx + 1}, this)" onmouseover="this.style.background='var(--table-surface-subtle)'" onmouseout="this.style.background='transparent'">+${inc}% <span class="sort-indicator" style="opacity: 0.3; font-size: 0.8em; margin-left: 4px;">⇅</span></th>`;
    });
    html += '</tr></thead><tbody>';

    // Generate rows for each percentage stat
    PERCENTAGE_STATS.forEach(stat => {
        const statWeights = weights.percentageWeights[stat.key];
        html += generateStatRow(stat.key, stat.label, false, statWeights, `${stat.key}%`);
    });

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';

    return html;
}

/**
 * Generate complete HTML for stat predictions table
 */
export function generateStatPredictionsHTML(): string {
    const stats = loadoutStore.getBaseStats();
    const weights = calculateAllStatWeights(stats);

    let html = '';
    html += generateFlatStatsSection(weights);
    html += generatePercentageStatsSection(weights);

    return html;
}

/**
 * Update the stat predictions table with new calculations
 */
export function updateStatPredictions(): void {
    const container = document.getElementById(`stat-weights`);
    if (!container) {
        console.warn(`Stat predictions container not found`);
        return;
    }

    container.innerHTML = generateStatPredictionsHTML();

    loadoutStore.on('stat:changed', debounce((_) => {
        resetCachedCharts();
        container.innerHTML = generateStatPredictionsHTML();
    }, 700));
}

// Column sorting for stat predictions tables
window.sortStatPredictions = function(tableType: string, colIndex: number, th: HTMLElement): void {
    const tableId = `stat-pred-table-${tableType}`;
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
    const currentSort = th.dataset.sort || 'none';
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
    tableHeaders.forEach((indicator: HTMLElement) => {
        indicator.textContent = '⇅';
        indicator.style.opacity = '0.3';
    });

    const clickedIndicator: HTMLElement = th.querySelector('.sort-indicator');
    if (clickedIndicator) {
        clickedIndicator.textContent = newDirection === 'asc' ? '▲' : '▼';
        clickedIndicator.style.opacity = '1';
    }

    // Store sort state
    th.dataset.sort = newDirection;
};
