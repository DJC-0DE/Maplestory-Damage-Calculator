/**
 * Inner Ability UI Generation and Event Handling
 *
 * This file handles all HTML generation and UI event handling for the inner ability tab.
 * Merges functionality from the old presets-ui.js file.
 */

import { innerAbilityStats } from '@data/inner-ability-data.js';
import { gearLabStore } from '@ts/store/gear-lab-store.js';
import { formatNumber } from '@utils/formatters.js';
import { StatCalculationService } from '@ts/services/stat-calculation-service.js';
import type { InnerAbilityLine } from '@ts/types/page/gear-lab/gear-lab.types.js';
import type { InnerAbilityTabName, TableSortState } from '@ts/page/inner-ability/inner-ability.types.js';
import type { BaseStats } from '@ts/types/loadout.js';
import {
    calculatePresetComparisons,
    calculateTheoreticalBest,
    calculateBestCombinations,
    getBaselineStats
} from '@ts/page/inner-ability/inner-ability.js';

// ============================================================================
// STATE
// ============================================================================

let presetSortState: TableSortState['preset'] = { column: 2, ascending: false };
let theoreticalSortState: TableSortState['theoretical'] = { column: 2, ascending: false };

/**
 * Theoretical Best roll visibility filters
 */
interface TheoreticalRollFilters {
    min: boolean;
    mid: boolean;
    max: boolean;
}

// Theoretical Best roll visibility toggles
let theoreticalRollFilters: TheoreticalRollFilters = {
    min: true,
    mid: true,
    max: true
};

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for a single preset line input
 */
function generatePresetLineHTML(presetId: number, lineIndex: number): string {
    const options = innerAbilityStats.map(stat =>
        `<option value="${stat}">${stat}</option>`
    ).join('');

    return `
        <div class="ia-line-card">
            <div class="ia-line-number">Line ${lineIndex + 1}</div>
            <label>Stat</label>
            <select id="preset-${presetId}-line-${lineIndex + 1}-stat" onchange="handlePresetLineChange(${presetId}, ${lineIndex})">
                <option value="">-- Select Stat --</option>
                ${options}
            </select>
            <label>Value</label>
            <input type="number" step="0.1" id="preset-${presetId}-line-${lineIndex + 1}-value" placeholder="0" onchange="handlePresetLineChange(${presetId}, ${lineIndex})">
        </div>
    `;
}

/**
 * Generate HTML for a single preset content card
 */
function generatePresetContentHTML(presetId: number, isActive = false): string {
    const activeClass = isActive ? 'active' : '';

    const linesHTML = Array.from({ length: 6 }, (_, i) =>
        generatePresetLineHTML(presetId, i)
    ).join('');

    return `
        <div class="ia-preset-content ${activeClass}" id="preset-${presetId}-content">
            <div class="ia-preset-card">
                <!-- Currently Equipped Checkbox -->
                <div class="ia-equipped-checkbox-wrapper">
                    <input type="checkbox" id="preset-${presetId}-equipped" onchange="handlePresetEquipped(${presetId})">
                    <label for="preset-${presetId}-equipped">Currently Equipped</label>
                </div>

                <!-- Inner Ability Lines - Premium Grid Layout -->
                <div class="ia-lines-grid">
                    ${linesHTML}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate the complete HTML for the inner ability tab
 */
export function generateInnerAbilityHTML(): string {
    // Generate preset tabs
    const tabsHTML = Array.from({ length: 10 }, (_, i) => {
        const presetId = i + 1;
        const activeClass = presetId === 1 ? 'active' : '';
        return `<button class="ia-preset-tab ${activeClass}" id="preset-tab-${presetId}" onclick="switchPreset(${presetId})">${presetId}</button>`;
    }).join('');

    // Generate preset contents
    const contentsHTML = Array.from({ length: 10 }, (_, i) => {
        const presetId = i + 1;
        return generatePresetContentHTML(presetId, presetId === 1);
    }).join('');

    return `
        <!-- Premium Tab Navigation -->
        <div class="tab-navigation">
            <button id="inner-ability-tab-button" class="tab-button active" onclick="switchInnerAbilityTab('my-ability-pages')">My Ability Pages</button>
            <button id="inner-ability-tab-button" class="tab-button" onclick="switchInnerAbilityTab('preset-comparison')">Preset Comparison</button>
            <button id="inner-ability-tab-button" class="tab-button" onclick="switchInnerAbilityTab('theoretical-best')">Theoretical Best</button>
        </div>

        <!-- My Ability Pages Sub-Tab -->
        <div id="inner-ability-my-ability-pages" class="inner-ability-subtab active">
            <div id="hero-power-presets-container">
                <div class="ia-presets-tabs-container">
                    ${tabsHTML}
                </div>
                ${contentsHTML}
            </div>
        </div>

        <!-- Preset Comparison Sub-Tab -->
        <div id="inner-ability-preset-comparison" class="inner-ability-subtab" style="display: none;">
            <div id="preset-comparison-container">
                <!-- Will be populated by renderPresetComparison() -->
            </div>
        </div>

        <!-- Theoretical Best Sub-Tab -->
        <div id="inner-ability-theoretical-best" class="inner-ability-subtab" style="display: none;">
            <div id="theoretical-best-container">
                <!-- Will be populated by renderTheoreticalBest() -->
            </div>
        </div>
    `;
}

// ============================================================================
// PRESET COMPARISON RENDERING
// ============================================================================

/**
 * Render Preset Comparison table
 */
export function renderPresetComparison(): void {
    const container = document.getElementById('preset-comparison-container');
    if (!container) return;

    const comparisons = calculatePresetComparisons();

    if (comparisons.length === 0) {
        container.innerHTML = '<div class="ia-empty-state">No configured presets found. Add lines to your presets in the My Ability Pages tab.</div>';
        return;
    }

    // Apply sorting based on current column and direction
    const sortedComparisons = [...comparisons].sort((a, b) => {
        let valA: number, valB: number;
        switch (presetSortState.column) {
            case 0: // Rank - sort by boss DPS gain (already sorted)
                valA = a.bossDPSGain;
                valB = b.bossDPSGain;
                break;
            case 1: // Preset
                valA = a.id;
                valB = b.id;
                break;
            case 2: // Boss DPS Gain
                valA = a.bossDPSGain;
                valB = b.bossDPSGain;
                break;
            case 3: // Normal DPS Gain
                valA = a.normalDPSGain;
                valB = b.normalDPSGain;
                break;
            default:
                return 0;
        }
        return presetSortState.ascending ? valA - valB : valB - valA;
    });

    let html = '<div class="table-wrapper">';
    html += '<table class="table"><thead><tr>';
    html += '<th class="sortable" onclick="sortPresetTable(0)">Rank</th>';
    html += '<th class="sortable" onclick="sortPresetTable(1)">Preset</th>';
    html += '<th class="sortable" onclick="sortPresetTable(2)">Boss DPS Gain</th>';
    html += '<th class="sortable" onclick="sortPresetTable(3)">Normal DPS Gain</th>';
    html += '</tr></thead><tbody>';

    // Find equipped preset for percent difference calculation
    const equippedComp = sortedComparisons.find(c => c.isEquipped);
    const equippedBossDPS = equippedComp ? equippedComp.bossDPSGain : null;
    const equippedNormalDPS = equippedComp ? equippedComp.normalDPSGain : null;

    // Helper to render a DPS cell (numeric + percent vs equipped when applicable)
    function makeDpsCell(gain: number, equippedGain: number | null, isEquippedRow: boolean): string {
        if (equippedComp && !isEquippedRow && equippedGain !== null) {
            const percent = equippedGain !== 0 ? ((gain - equippedGain) / equippedGain) * 100 : 0;
            const cls = percent >= 0 ? 'ia-dps-positive' : 'ia-dps-negative';
            return `<td><span class="ia-dps-value ${cls}">+${formatNumber(gain)} <span class="ia-dps-percent">(${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></span></td>`;
        } else {
            // No equipped preset or this is the equipped row — plain value
            return `<td><span class="ia-dps-value">+${formatNumber(gain)}</span></td>`;
        }
    }

    sortedComparisons.forEach((comp, index) => {
        const rankClass = index < 3 ? `badge--rank-${index + 1}` : 'rank-default';
        const rankBadge = `<span class="badge ${rankClass}">${index + 1}</span>`;
        const equippedBadge = comp.isEquipped ? '<span class="ia-equipped-badge">Equipped</span>' : '';

        html += `<tr class="expandable" onclick="toggleLineBreakdown(${comp.id})">`;
        html += `<td>${rankBadge}</td>`;
        html += `<td>Preset ${comp.id}${equippedBadge}</td>`;

        html += makeDpsCell(comp.bossDPSGain, equippedBossDPS, comp.isEquipped);
        html += makeDpsCell(comp.normalDPSGain, equippedNormalDPS, comp.isEquipped);
        html += '</tr>';

        // Line breakdown row
        html += `<tr id="breakdown-${comp.id}" class="ia-line-breakdown-row" style="display: none;"><td colspan="4">`;
        html += '<div class="ia-line-breakdown-content">';
        comp.lineContributions.forEach(line => {
            html += `<div class="ia-line-breakdown-item">`;
            html += `<span class="ia-line-breakdown-stat">${line.stat}: ${line.value}</span>`;
            html += `<span class="ia-line-breakdown-value">+${formatNumber(line.dpsContribution)} DPS</span>`;
            html += `</div>`;
        });
        html += `<div class="ia-line-breakdown-item">`;
        html += `<span class="ia-line-breakdown-stat"><strong>Total</strong></span>`;
        html += `<span class="ia-line-breakdown-value"><strong>+${formatNumber(comp.bossDPSGain)} DPS</strong></span>`;
        html += `</div>`;
        html += '</div></td></tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ============================================================================
// THEORETICAL BEST RENDERING
// ============================================================================

/**
 * Render Theoretical Best table
 */
export function renderTheoreticalBest(): void {
    const container = document.getElementById('theoretical-best-container');
    if (!container) return;

    const results = calculateTheoreticalBest();
    const combinations = calculateBestCombinations();

    // Calculate baseline damage using StatCalculationService
    const baseline = getBaselineStats();
    const baselineService = new StatCalculationService(baseline);
    const baselineBossDamage = baselineService.compute('boss');
    const baselineBossDps = baselineBossDamage.dps;

    // Apply sorting based on current column and direction
    const sortedResults = [...results].sort((a, b) => {
        return theoreticalSortState.ascending ? a.dpsGain - b.dpsGain : b.dpsGain - a.dpsGain;
    });

    // Filter results based on roll type checkboxes
    const filteredResults = sortedResults.filter(result => {
        if (result.roll === 'Min' && !theoreticalRollFilters.min) return false;
        if (result.roll === 'Mid' && !theoreticalRollFilters.mid) return false;
        if (result.roll === 'Max' && !theoreticalRollFilters.max) return false;
        return true;
    });

    let html = '<div class="ia-theoretical-section">';
    html += '<h3 class="title">All Possible Rolls Ranked</h3>';

    // Add roll type checkboxes
    html += '<div class="ia-roll-filters">';
    html += '<label class="ia-roll-filter-label"><input type="checkbox" id="roll-filter-min" onchange="toggleTheoreticalRollFilter(\'min\')" ' + (theoreticalRollFilters.min ? 'checked' : '') + '> Min Rolls</label>';
    html += '<label class="ia-roll-filter-label"><input type="checkbox" id="roll-filter-mid" onchange="toggleTheoreticalRollFilter(\'mid\')" ' + (theoreticalRollFilters.mid ? 'checked' : '') + '> Mid Rolls</label>';
    html += '<label class="ia-roll-filter-label"><input type="checkbox" id="roll-filter-max" onchange="toggleTheoreticalRollFilter(\'max\')" ' + (theoreticalRollFilters.max ? 'checked' : '') + '> Max Rolls</label>';
    html += '</div>';

    html += '<div class="table-scrollable">';
    html += '<table class="table"><thead><tr>';
    html += '<th>Stat & Roll</th>';
    html += '<th>Value</th>';
    html += '<th class="sortable" onclick="sortTheoreticalTable(2)">DPS Gain</th>';
    html += '</tr></thead><tbody>';

    filteredResults.forEach(result => {
        const rarityLetter = result.rarity.charAt(0).toUpperCase();
        const rarityClass = `rarity-${result.rarity.toLowerCase()}`;
        const badge = `<span class="badge badge--rarity ${rarityClass}">${rarityLetter}</span>`;
        const percentClass = result.percentIncrease > 0 ? 'ia-dps-positive' : 'ia-dps-negative';

        html += '<tr>';
        html += `<td>${badge}${result.stat} ${result.roll} Roll</td>`;
        html += `<td class="ia-dps-value">${result.value}</td>`;
        html += `<td><span class="ia-dps-value">+${formatNumber(result.dpsGain)}</span> <span class="${percentClass} ia-dps-percent">(${result.percentIncrease >= 0 ? '+' : ''}${result.percentIncrease.toFixed(2)}%)</span></td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    // Best Combinations
    html += '<div class="ia-theoretical-section">';
    html += '<h3 class="title">Best Possible Combinations</h3>';

    // Unique Only
    html += '<div class="ia-combo-card">';
    html += '<h4><span class="badge badge--rarity rarity-unique">U</span>Best with Unique Only (3 Lines)</h4>';
    html += '<div class="ia-combo-lines">';
    combinations.uniqueOnly.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.uniqueOnly.totalDPS / baselineBossDps) * 100;
        html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.uniqueOnly.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div>';

    // Unique + Legendary
    html += '<div class="ia-combo-card">';
    html += '<h4><span class="badge badge--rarity rarity-unique">U</span><span class="badge badge--rarity rarity-legendary">L</span>Best with Unique + Legendary (Up to 5 Lines)</h4>';
    html += '<div class="ia-combo-lines">';
    combinations.uniqueLegendary.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.uniqueLegendary.totalDPS / baselineBossDps) * 100;
        html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.uniqueLegendary.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div>';

    // Mystic + Legendary + Unique
    html += '<div class="ia-combo-card">';
    html += '<h4><span class="badge badge--rarity rarity-mystic">M</span><span class="badge badge--rarity rarity-legendary">L</span><span class="badge badge--rarity rarity-unique">U</span>Best with Mystic + Legendary + Unique (Up to 6 Lines)</h4>';
    html += '<div class="ia-combo-lines">';
    combinations.mysticLegendaryUnique.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.mysticLegendaryUnique.totalDPS / baselineBossDps) * 100;
        html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.mysticLegendaryUnique.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div>';

    // All Rarities
    html += '<div class="ia-combo-card">';
    html += '<h4>Best with All Rarities (6 Lines)</h4>';
    html += '<div class="ia-combo-lines">';
    combinations.allRarities.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="ia-combo-line"><span class="badge badge--rarity ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.allRarities.totalDPS / baselineBossDps) * 100;
        html += `<div class="ia-combo-total">Total DPS Gain: +${formatNumber(combinations.allRarities.totalDPS)} <span class="ia-dps-percent">(${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div></div>';

    container.innerHTML = html;
}

// ============================================================================
// TAB SWITCHING
// ============================================================================

/**
 * Switch inner ability sub-tabs
 */
export function switchInnerAbilityTab(tabName: InnerAbilityTabName): void {
    const allSubTabContent = document.querySelectorAll('.inner-ability-subtab');
    const allSubTabButtons = document.querySelectorAll('#inner-ability-tab-button');

    // Hide all subtabs
    allSubTabContent.forEach(tab => {
        tab.classList.remove('active');
        (tab as HTMLElement).style.display = 'none';
    });

    // Remove active from all buttons
    allSubTabButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected subtab
    const selectedTab = document.getElementById(`inner-ability-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }

    // Activate button - Find the button by matching the onclick attribute
    allSubTabButtons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(tabName)) {
            btn.classList.add('active');
        }
    });

    // Render content
    if (tabName === 'preset-comparison') {
        renderPresetComparison();
    } else if (tabName === 'theoretical-best') {
        renderTheoreticalBest();
    }
}

/**
 * Switch between preset tabs (1-10)
 */
export function switchPreset(presetId: number): void {
    // Hide all preset contents
    for (let i = 1; i <= 10; i++) {
        const content = document.getElementById(`preset-${i}-content`);
        const tab = document.getElementById(`preset-tab-${i}`);

        if (content) content.classList.remove('active');
        if (tab) tab.classList.remove('active');
    }

    // Show selected preset
    const selectedContent = document.getElementById(`preset-${presetId}-content`);
    const selectedTab = document.getElementById(`preset-tab-${presetId}`);

    if (selectedContent) selectedContent.classList.add('active');
    if (selectedTab) selectedTab.classList.add('active');
}

// ============================================================================
// PRESET HANDLERS
// ============================================================================

/**
 * Handle preset equipped checkbox change
 */
export function handlePresetEquipped(presetId: number): void {
    const checkbox = document.getElementById(`preset-${presetId}-equipped`) as HTMLInputElement;

    if (checkbox.checked) {
        // Uncheck all other presets
        for (let i = 1; i <= 10; i++) {
            if (i !== presetId) {
                const otherCheckbox = document.getElementById(`preset-${i}-equipped`) as HTMLInputElement;
                const otherTab = document.getElementById(`preset-tab-${i}`);

                if (otherCheckbox) otherCheckbox.checked = false;
                if (otherTab) otherTab.classList.remove('equipped');
            }
        }

        // Mark this preset tab as equipped
        const tab = document.getElementById(`preset-tab-${presetId}`);
        if (tab) tab.classList.add('equipped');

        // Update store
        gearLabStore.setEquippedPreset(presetId);
    } else {
        // Unmark this preset tab
        const tab = document.getElementById(`preset-tab-${presetId}`);
        if (tab) tab.classList.remove('equipped');

        // Update store
        gearLabStore.setEquippedPreset(null);
    }

    // Update comparison tables
    renderPresetComparison();
    renderTheoreticalBest();
}

/**
 * Handle preset line change
 */
export function handlePresetLineChange(presetId: number, lineIndex: number): void {
    const statSelect = document.getElementById(`preset-${presetId}-line-${lineIndex + 1}-stat`) as HTMLSelectElement;
    const valueInput = document.getElementById(`preset-${presetId}-line-${lineIndex + 1}-value`) as HTMLInputElement;

    const stat = statSelect?.value || '';
    const value = parseFloat(valueInput?.value) || 0;

    // Update store
    gearLabStore.updatePresetLine(presetId, lineIndex, { stat, value });

    // Update comparison tables
    renderPresetComparison();
    renderTheoreticalBest();
}

// ============================================================================
// TABLE INTERACTIONS
// ============================================================================

/**
 * Toggle line breakdown visibility
 */
export function toggleLineBreakdown(presetId: number): void {
    const row = document.getElementById(`breakdown-${presetId}`) as HTMLElement;
    if (row) {
        row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
    }
}

/**
 * Sort preset table
 */
export function sortPresetTable(column: number): void {
    if (presetSortState.column === column) {
        presetSortState.ascending = !presetSortState.ascending;
    } else {
        presetSortState.column = column;
        presetSortState.ascending = false;
    }
    renderPresetComparison();
}

/**
 * Sort theoretical table
 */
export function sortTheoreticalTable(column: number): void {
    if (theoreticalSortState.column === column) {
        theoreticalSortState.ascending = !theoreticalSortState.ascending;
    } else {
        theoreticalSortState.column = column;
        theoreticalSortState.ascending = false;
    }
    renderTheoreticalBest();
}

/**
 * Toggle theoretical roll filter (min/mid/max)
 */
export function toggleTheoreticalRollFilter(rollType: 'min' | 'mid' | 'max'): void {
    theoreticalRollFilters[rollType] = !theoreticalRollFilters[rollType];
    renderTheoreticalBest();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the inner ability UI
 */
export function initializeInnerAbilityUI(): void {
    const container = document.getElementById('optimization-inner-ability');
    if (!container) {
        console.error('Inner ability container not found');
        return;
    }

    // Generate HTML
    container.innerHTML = generateInnerAbilityHTML();
}

/**
 * Load inner ability data from store and populate UI
 */
export function loadInnerAbilityFromStore(): void {
    const presets = gearLabStore.getInnerAbilityPresets();

    Object.entries(presets).forEach(([presetIdStr, preset]) => {
        const presetId = parseInt(presetIdStr);

        // Set equipped checkbox
        const equippedCheckbox = document.getElementById(`preset-${presetId}-equipped`) as HTMLInputElement;
        const tab = document.getElementById(`preset-tab-${presetId}`);

        if (equippedCheckbox) {
            equippedCheckbox.checked = preset.isEquipped;
            if (preset.isEquipped && tab) {
                tab.classList.add('equipped');
            }
        }

        // Set lines
        preset.lines.forEach((line, index) => {
            const statSelect = document.getElementById(`preset-${presetId}-line-${index + 1}-stat`) as HTMLSelectElement;
            const valueInput = document.getElementById(`preset-${presetId}-line-${index + 1}-value`) as HTMLInputElement;

            if (statSelect) statSelect.value = line.stat;
            if (valueInput) valueInput.value = line.value.toString();
        });
    });

    // Pre-render comparison tables
    renderPresetComparison();
    renderTheoreticalBest();
}

/**
 * Attach event listeners for inner ability UI
 */
export function attachInnerAbilityEventListeners(): void {
    // Event listeners are attached via onclick attributes in generated HTML
    // Additional event listeners can be added here if needed
}

// ============================================================================
// WINDOW EXPORTS
// ============================================================================

// Export functions to window for HTML onclick compatibility
if (typeof window !== 'undefined') {
    (window as any).switchInnerAbilityTab = switchInnerAbilityTab;
    (window as any).toggleLineBreakdown = toggleLineBreakdown;
    (window as any).sortPresetTable = sortPresetTable;
    (window as any).sortTheoreticalTable = sortTheoreticalTable;
    (window as any).toggleTheoreticalRollFilter = toggleTheoreticalRollFilter;
    (window as any).switchPreset = switchPreset;
    (window as any).handlePresetEquipped = handlePresetEquipped;
    (window as any).handlePresetLineChange = handlePresetLineChange;
}
