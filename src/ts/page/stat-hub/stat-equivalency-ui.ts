/**
 * Stat Equivalency UI
 * HTML generation and event handling for stat equivalency calculator
 */

import { calculateEquivalency, createStatConfig, calculateTargetDPSGain } from './stat-equivalency';
import type { EquivalencyStatConfig } from '@ts/types/page/stat-hub/stat-hub.types';
import { loadoutStore } from '@ts/store/loadout.store';

// Constants for equivalency UI
const EQUIV_PREFIX = 'equiv';

// Stat input configuration for UI generation
interface StatInputConfig {
    id: string;
    label: string;
    default: number;
    step: number;
    min: number;
    info?: string;
}

interface EquivalencyInputs {
    flat: StatInputConfig[];
    percentage: StatInputConfig[];
}

const EQUIVALENCY_INPUTS: EquivalencyInputs = {
    flat: [
        { id: `${EQUIV_PREFIX}Attack`, label: 'Attack', default: 1000, step: 100, min: 0 },
        { id: `${EQUIV_PREFIX}MainStat`, label: 'Main Stat (100 = 1% Stat Dmg)', default: 500, step: 50, min: 0 }
    ],
    percentage: [
        { id: `${EQUIV_PREFIX}SkillCoeff`, label: 'Skill Coefficient (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}SkillMastery`, label: 'Skill Mastery (%)', default: 5, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}Damage`, label: 'Damage (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}FinalDamage`, label: 'Final Damage (%)', default: 10, step: 1, min: 0, info: 'Increases to this stat are multiplicative rather than additive.' },
        { id: `${EQUIV_PREFIX}BossDamage`, label: 'Boss Damage (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}NormalDamage`, label: 'Monster Damage (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}MainStatPct`, label: 'Main Stat %', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}DamageAmp`, label: 'Damage Amplification (x)', default: 1, step: 0.1, min: 0 },
        { id: `${EQUIV_PREFIX}MinDamage`, label: 'Min Damage Multiplier (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}MaxDamage`, label: 'Max Damage Multiplier (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}CritRate`, label: 'Critical Rate (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}CritDamage`, label: 'Critical Damage (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}AttackSpeed`, label: 'Attack Speed (%)', default: 10, step: 1, min: 0 },
        { id: `${EQUIV_PREFIX}DefPen`, label: 'Defense Penetration (%)', default: 10, step: 1, min: 0 }
    ]
};

/**
 * Generate HTML for a stat input row
 */
function generateStatInputHTML(input: StatInputConfig): string {
    const infoIcon = input.info
        ? `<span class="info-icon" role="img" aria-label="Info" title="${input.info}">ℹ️</span>`
        : '';

    return `
        <div class="stat-row">
            <label>${input.label} ${infoIcon}</label>
            <input
                type="number"
                id="${input.id}"
                value="${input.default}"
                min="${input.min}"
                step="${input.step}"
                oninput="handleStatEquivalencyInput('${extractStatKey(input.id)}')"
            >
        </div>
    `;
}

/**
 * Extract stat key from input ID
 * Convert from equivCritRate format to critRate format
 */
function extractStatKey(inputId: string): string {
    // Remove 'equiv' prefix and convert first character to lowercase
    // equivCritRate → critRate
    return inputId.charAt(EQUIV_PREFIX.length).toLowerCase() + inputId.slice(EQUIV_PREFIX.length + 1);
}

/**
 * Get stat value from DOM input
 * Constructs input ID from stat key: critRate → equivCritRate
 */
function getStatValueFromDOM(statId: string): number {
    // Convert statId to input ID: capitalize first char after equiv
    const inputId = EQUIV_PREFIX + statId.charAt(0).toUpperCase() + statId.slice(1);
    const element = document.getElementById(inputId) as HTMLInputElement;
    return parseFloat(element?.value) || 0;
}

/**
 * Generate HTML for flat stats inputs section
 */
function generateFlatStatsSection(): string {
    let html = `
        <div style="margin-bottom: 24px;">
            <h4 style="color: var(--accent-primary); font-weight: 700; margin-bottom: 12px; font-size: 1em; text-transform: uppercase; letter-spacing: 0.05em;">Flat Stats</h4>
            <div class="stats-list-column">
    `;

    EQUIVALENCY_INPUTS.flat.forEach(input => {
        html += generateStatInputHTML(input);
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Generate HTML for percentage stats inputs section
 */
function generatePercentageStatsSection(): string {
    let html = `
        <div>
            <h4 style="color: var(--accent-primary); font-weight: 700; margin-bottom: 12px; font-size: 1em; text-transform: uppercase; letter-spacing: 0.05em;">Percentage Stats</h4>
            <div class="stats-list-column">
    `;

    EQUIVALENCY_INPUTS.percentage.forEach(input => {
        html += generateStatInputHTML(input);
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Generate results display HTML
 */
function generateResultsPlaceholderHTML(): string {
    return `
        <div style="text-align: center; color: var(--text-secondary); padding: 60px 20px;">
            <div style="font-size: 4em; margin-bottom: 20px; opacity: 0.4;">📊</div>
            <p style="font-size: 1.1em;">Enter a value in any stat field to see the equivalent damage gain across all stats.</p>
        </div>
    `;
}

/**
 * Generate complete HTML for stat equivalency calculator
 */
export function generateStatEquivalencyHTML(): string {
    let html = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: var(--accent-primary); margin-bottom: 10px; font-size: 1.2em; font-weight: 600;">
                ✨ Stat Equivalency Calculator
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.9em; line-height: 1.6;">
                Enter a value for any stat below to see what that gain translates to for all other stats. Perfect for comparing upgrade paths and understanding relative stat values.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column: Input Fields -->
            <div>
    `;

    html += generateFlatStatsSection();
    html += generatePercentageStatsSection();

    html += `
            </div>

            <!-- Right Column: Results Display -->
            <div style="position: sticky; top: 20px;">
                <h4 style="color: var(--accent-success); font-weight: 700; margin-bottom: 12px; font-size: 1em; text-transform: uppercase; letter-spacing: 0.05em;">Results</h4>
                <div id="equivalency-results" style="border-radius: 12px; padding: 20px; min-height: 500px;">
    `;

    html += generateResultsPlaceholderHTML();

    html += `
                </div>
            </div>
        </div>
    `;

    return html;
}

/**
 * Generate HTML for equivalency results table
 */
function generateEquivalencyResultsHTML(
    sourceStat: string,
    sourceValue: number,
    statConfig: Record<string, EquivalencyStatConfig>,
    targetDPSGain: number,
    equivalents: Record<string, { value: number; label: string }>
): string {
    let html = '<div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.05)); border: 2px solid rgba(0, 122, 255, 0.2); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">';

    // Header section
    html += '<div style="text-align: center; margin-bottom: 25px;">';
    html += `<div style="font-size: 1.4em; font-weight: 700; color: var(--accent-primary); margin-bottom: 10px;">`;
    html += `${statConfig[sourceStat].formatValue(sourceValue)} ${statConfig[sourceStat].label}`;
    html += '</div>';
    html += `<div style="font-size: 1.1em; color: var(--accent-success); font-weight: 600;">`;
    html += `= ${targetDPSGain.toFixed(2)}% DPS Gain`;
    html += '</div>';
    html += '</div>';

    // Results table
    html += '<table class="table" style="margin: 0;">';
    html += '<thead><tr>';
    html += '<th style="text-align: left; font-size: 1em;">Equivalent Stat</th>';
    html += '<th style="text-align: right; font-size: 1em;">Required Amount</th>';
    html += '<th style="text-align: right; font-size: 1em;">DPS Gain</th>';
    html += '</tr></thead><tbody>';

    // Generate rows for each equivalent stat
    Object.entries(equivalents).forEach(([statId, result]) => {
        const statConfigItem = statConfig[statId];
        html += '<tr>';
        html += `<td style="font-weight: 600;">${statConfigItem.label}</td>`;

        if (result.value === 0 && result.label.includes('Ineffective')) {
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--text-secondary); font-style: italic;">-</td>`;
            html += `<td style="text-align: right; color: var(--text-secondary); font-style: italic;">${result.label}</td>`;
        } else if (result.label === 'Unable to match') {
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--text-secondary); font-style: italic;">-</td>`;
            html += `<td style="text-align: right; color: var(--text-secondary); font-style: italic;">Unable to match</td>`;
        } else {
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--accent-primary); font-weight: 600;">${statConfigItem.formatValue(result.value)}</td>`;
            html += `<td style="text-align: right;"><span class="gain-positive">${result.label}</span></td>`;
        }

        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    return html;
}

/**
 * Update stat equivalency display
 */
export function updateStatEquivalency(sourceStat: string): void {
    const stats = loadoutStore.getBaseStats();
    const sourceValue = getStatValueFromDOM(sourceStat);

    if (sourceValue === 0) {
        const resultsContainer = document.getElementById('equivalency-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = generateResultsPlaceholderHTML();
        }
        return;
    }

    const statConfig = createStatConfig(getStatValueFromDOM);
    const result = calculateEquivalency(stats, sourceStat, sourceValue, statConfig);

    if (!result) {
        const resultsContainer = document.getElementById('equivalency-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = generateResultsPlaceholderHTML();
        }
        return;
    }

    // Recalculate to get actual DPS gain
    const { targetDPSGain } = calculateTargetDPSGain(stats, sourceStat, sourceValue, statConfig);

    const html = generateEquivalencyResultsHTML(
        sourceStat,
        sourceValue,
        statConfig,
        targetDPSGain,
        result.equivalents
    );

    const resultsContainer = document.getElementById('equivalency-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = html;
    }
}

/**
 * Handle stat equivalency input change
 */
export function handleStatEquivalencyInput(sourceStat: string): void {
    updateStatEquivalency(sourceStat);
}

window.handleStatEquivalencyInput = handleStatEquivalencyInput;