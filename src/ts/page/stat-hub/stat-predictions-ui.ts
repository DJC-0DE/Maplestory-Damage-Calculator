/**
 * Stat Predictions UI
 * HTML generation and event handling for stat predictions table
 */

import { formatNumber } from '@ts/utils/formatters';
import { calculateAllStatWeights } from './stat-predictions';
import { PERCENTAGE_STATS, MULTIPLICATIVE_STATS, DEFAULT_STAT_INCREASES } from './stat-predictions';
import type { StatWeightResult } from '@ts/types/page/stat-hub/stat-hub.types';
import { loadoutStore } from '@ts/store/loadout.store';

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
    html += '<div class="">';
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
    html += '<div class="">';
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
}
