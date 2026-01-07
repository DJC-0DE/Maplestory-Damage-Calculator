// Inner Ability stat mapping and calculations

import { innerAbilitiesData } from '../data/inner-ability-data.js';
import { calculateDamage } from './calculations/damage-calculations.js';
import { formatNumber } from '../utils/formatters.js';
import { getStats } from './main.js';

// Map inner ability stats to base stat properties
export function mapInnerAbilityStat(statName, value, baseStats) {
    const modifiedStats = { ...baseStats };

    switch (statName) {
        case 'Attack Speed':
            modifiedStats.attackSpeed += value;
            break;
        case 'Boss Monster Damage':
            modifiedStats.bossDamage += value;
            break;
        case 'Critical Rate':
            modifiedStats.critRate += value;
            break;
        case 'Damage':
            modifiedStats.damage += value;
            break;
        case 'Defense Penetration':
            modifiedStats.defPen += value;
            break;
        case 'Min Damage Multiplier':
            modifiedStats.minDamage += value;
            break;
        case 'Max Damage Multiplier':
            modifiedStats.maxDamage += value;
            break;
        case 'Normal Monster Damage':
            modifiedStats.normalDamage += value;
            break;
        case 'Main Stat':
        {
            // Convert Main Stat to Stat Damage % at 100:1 ratio
            const statDamageBonus = value / 100;
            modifiedStats.statDamage += statDamageBonus;
            break;
        }
        // Ignored stats: Max HP, Max MP, Accuracy, Evasion, MP Recovery Per Sec,
        // Meso Drop, EXP Gain, Debuff Tolerance, Critical Resistance,
        // Damage Tolerance, Damage Taken Decrease
        default:
            // No effect on damage
            break;
    }

    return modifiedStats;
}

// Apply multiple inner ability lines to base stats
export function applyInnerAbilityLines(baseStats, lines) {
    let modifiedStats = { ...baseStats };

    lines.forEach(line => {
        if (line.stat && line.value) {
            modifiedStats = mapInnerAbilityStat(line.stat, line.value, modifiedStats);
        }
    });

    return modifiedStats;
}

// Compute baseline stats (base minus equipped inner ability lines)
export function getBaselineStats() {
    const baseStats = getStats('base');
    const presets = getAllPresets();
    const equippedPreset = presets.find(p => p.isEquipped);

    let baseline = { ...baseStats };
    if (equippedPreset) {
        equippedPreset.lines.forEach(line => {
            baseline = mapInnerAbilityStat(line.stat, -line.value, baseline);
        });
    }

    return baseline;
}

// Get all configured presets
export function getAllPresets() {
    const presets = [];

    for (let i = 1; i <= 10; i++) {
        const isEquipped = document.getElementById(`preset-${i}-equipped`)?.checked || false;
        const lines = [];

        for (let j = 1; j <= 6; j++) {
            const stat = document.getElementById(`preset-${i}-line-${j}-stat`)?.value || '';
            const value = parseFloat(document.getElementById(`preset-${i}-line-${j}-value`)?.value) || 0;

            if (stat && value) {
                lines.push({ stat, value });
            }
        }

        if (lines.length > 0) {
            presets.push({ id: i, isEquipped, lines });
        }
    }

    return presets;
}

// Calculate preset comparison data
export function calculatePresetComparisons() {
    const presets = getAllPresets();

    if (presets.length === 0) {
        return [];
    }

    // Calculate baseline (base stats without equipped IA)
    let baseline = getBaselineStats();

    // Calculate baseline damage
    const baselineBossDamage = calculateDamage(baseline, 'boss');
    const baselineNormalDamage = calculateDamage(baseline, 'normal');

    const comparisons = [];

    presets.forEach(preset => {
        // Apply this preset's stats to baseline
        const presetStats = applyInnerAbilityLines(baseline, preset.lines);

        // Calculate damage with this preset
        const presetBossDamage = calculateDamage(presetStats, 'boss');
        const presetNormalDamage = calculateDamage(presetStats, 'normal');

        // Calculate DPS gains
        const bossDPSGain = presetBossDamage.dps - baselineBossDamage.dps;
        const normalDPSGain = presetNormalDamage.dps - baselineNormalDamage.dps;

        // Calculate line-by-line contributions
        const lineContributions = preset.lines.map((line, index) => {
            // Calculate damage without this line
            const linesWithoutCurrent = preset.lines.filter((_, i) => i !== index);
            const statsWithoutLine = applyInnerAbilityLines(baseline, linesWithoutCurrent);
            const damageWithoutLine = calculateDamage(statsWithoutLine, 'boss');

            // Calculate damage with this line
            const statsWithLine = applyInnerAbilityLines(baseline, [...linesWithoutCurrent, line]);
            const damageWithLine = calculateDamage(statsWithLine, 'boss');

            const contribution = damageWithLine.dps - damageWithoutLine.dps;

            return {
                stat: line.stat,
                value: line.value,
                dpsContribution: contribution
            };
        });

        comparisons.push({
            id: preset.id,
            isEquipped: preset.isEquipped,
            lines: preset.lines,
            bossDPSGain,
            normalDPSGain,
            lineContributions
        });
    });

    // Sort by boss DPS gain (descending)
    comparisons.sort((a, b) => b.bossDPSGain - a.bossDPSGain);

    return comparisons;
}

// Calculate all theoretical stat possibilities
export function calculateTheoreticalBest() {
    const results = [];

    // Get equipped preset to subtract from base
    const baseline = getBaselineStats();

    // Calculate baseline damage
    const baselineBossDamage = calculateDamage(baseline, 'boss');

    // Iterate through each rarity and stat
    Object.entries(innerAbilitiesData).forEach(([rarity, stats]) => {
        Object.entries(stats).forEach(([statName, ranges]) => {
            const min = ranges.min;
            const max = ranges.max;
            const mid = (min + max) / 2;

            // Calculate DPS for min, mid, max rolls
            [
                { roll: 'Min', value: min },
                { roll: 'Mid', value: mid },
                { roll: 'Max', value: max }
            ].forEach(({ roll, value }) => {
                const modifiedStats = mapInnerAbilityStat(statName, value, baseline);
                const damage = calculateDamage(modifiedStats, 'boss');
                const dpsGain = damage.dps - baselineBossDamage.dps;
                const percentIncrease = dpsGain / baselineBossDamage.dps * 100;

                results.push({
                    stat: statName,
                    rarity,
                    roll,
                    value,
                    dpsGain,
                    percentIncrease
                });
            });
        });
    });

    // Sort by DPS gain (descending) and filter out zero/negative gains
    results.sort((a, b) => b.dpsGain - a.dpsGain);

    // Only return stats that actually increase damage
    return results.filter(r => r.dpsGain > 0);
}

// Calculate best possible combinations
export function calculateBestCombinations() {
    const baseline = getBaselineStats();

    const baselineBossDamage = calculateDamage(baseline, 'boss');

    // Get all possible stats with their max values
    const allPossibleStats = [];
    Object.entries(innerAbilitiesData).forEach(([rarity, stats]) => {
        Object.entries(stats).forEach(([statName, ranges]) => {
            allPossibleStats.push({
                stat: statName,
                rarity,
                value: ranges.max,
                rarityOrder: { 'Mystic': 5, 'Ancient': 4, 'Legendary': 3, 'Unique': 2, 'Epic': 1, 'Rare': 0, 'Normal': 0 }[rarity] || 0
            });
        });
    });

    // Iteratively find best lines accounting for diminishing returns
    function findBestLines(maxLines, allowedRarities) {
        const selectedLines = [];
        let currentStats = { ...baseline };

        for (let i = 0; i < maxLines; i++) {
            let bestLine = null;
            let bestDPSGain = 0;

            // Filter by allowed rarities
            const candidateStats = allPossibleStats.filter(s => allowedRarities.includes(s.rarity));

            // Test each possible stat to see which gives the best gain
            candidateStats.forEach(candidate => {
                const testStats = mapInnerAbilityStat(candidate.stat, candidate.value, currentStats);
                const testDamage = calculateDamage(testStats, 'boss');
                const currentDamage = calculateDamage(currentStats, 'boss');
                const dpsGain = testDamage.dps - currentDamage.dps;

                if (dpsGain > bestDPSGain) {
                    bestDPSGain = dpsGain;
                    bestLine = { ...candidate, dpsGain };
                }
            });

            if (bestLine) {
                selectedLines.push(bestLine);
                // Update current stats to include this line for next iteration
                currentStats = mapInnerAbilityStat(bestLine.stat, bestLine.value, currentStats);
            }
        }

        // Calculate total DPS
        const finalDamage = calculateDamage(currentStats, 'boss');
        const totalDPS = finalDamage.dps - baselineBossDamage.dps;

        return { lines: selectedLines, totalDPS };
    }

    // Scenario 1: Best with Unique only (3 lines)
    const uniqueOnly = findBestLines(3, ['Unique']);

    // Scenario 2: Best with Unique + Legendary (up to 5 lines)
    const uniqueLegendary = findBestLines(5, ['Unique', 'Legendary']);

    // Scenario 3: Best with Unique + Legendary + Mystic (up to 6 lines)
    const mysticLegendaryUnique = findBestLines(6, ['Mystic', 'Legendary', 'Unique']);

    // Scenario 4: Best with all rarities (6 lines)
    const allRarities = findBestLines(6, ['Mystic', 'Legendary', 'Unique', 'Epic', 'Rare', 'Normal']);

    return {
        uniqueOnly,
        uniqueLegendary,
        mysticLegendaryUnique,
        allRarities
    };
}

// Switch inner ability sub-tabs
export function switchInnerAbilityTab(tabName) {
    // Hide all subtabs
    document.querySelectorAll('.inner-ability-subtab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });

    // Remove active from all buttons
    document.querySelectorAll('#analysis-inner-ability .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected subtab
    const selectedTab = document.getElementById(`inner-ability-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }

    // Activate button
    event.target.classList.add('active');

    // Render content
    if (tabName === 'preset-comparison') {
        renderPresetComparison();
    } else if (tabName === 'theoretical-best') {
        renderTheoreticalBest();
    }
}

// Render Preset Comparison table
export function renderPresetComparison() {
    const container = document.getElementById('preset-comparison-container');
    if (!container) return;

    const comparisons = calculatePresetComparisons();

    if (comparisons.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No configured presets found. Add lines to your presets in the My Ability Pages tab.</p>';
        return;
    }

    // Apply sorting based on current column and direction
    comparisons.sort((a, b) => {
        let valA, valB;
        switch (presetSortColumn) {
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
        return presetSortAsc ? valA - valB : valB - valA;
    });

    let html = '<table class="ia-table"><thead><tr>';
    html += '<th class="sortable" onclick="sortPresetTable(0)">Rank</th>';
    html += '<th class="sortable" onclick="sortPresetTable(1)">Preset</th>';
    html += '<th class="sortable" onclick="sortPresetTable(2)">Boss DPS Gain</th>';
    html += '<th class="sortable" onclick="sortPresetTable(3)">Normal DPS Gain</th>';
    html += '</tr></thead><tbody>';

    // Find equipped preset for percent difference calculation
    const equippedComp = comparisons.find(c => c.isEquipped);
    const equippedBossDPS = equippedComp ? equippedComp.bossDPSGain : null;
    const equippedNormalDPS = equippedComp ? equippedComp.normalDPSGain : null;

    // helper to render a DPS cell (numeric + percent vs equipped when applicable)
    function makeDpsCell(gain, equippedGain, isEquippedRow) {
        if (equippedComp && !isEquippedRow) {
            const percent = equippedGain !== 0 ? ((gain - equippedGain) / equippedGain) * 100 : 0;
            const cls = percent >= 0 ? 'dps-positive' : 'dps-negative';
            return `<td><span class="${cls}">+${formatNumber(gain)} <span style="font-weight:600; opacity:0.85; font-size:0.85em;"> (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></span></td>`;
        } else {
            // No equipped preset or this is the equipped row — plain value
            return `<td>+${formatNumber(gain)}</td>`;
        }
    }

    comparisons.forEach((comp, index) => {
        const rankBadge = index < 3 ? `<span class="preset-rank rank-${index + 1}">${index + 1}</span>` : `<span class="preset-rank">${index + 1}</span>`;
        const equippedBadge = comp.isEquipped ? '<span class="preset-equipped-badge" style="margin-left: 8px;">Equipped</span>' : '';

        html += `<tr class="expandable" onclick="toggleLineBreakdown(${comp.id})">`;
        html += `<td>${rankBadge}</td>`;
        html += `<td>Preset ${comp.id}${equippedBadge}</td>`;

        html += makeDpsCell(comp.bossDPSGain, equippedBossDPS, comp.isEquipped);
        html += makeDpsCell(comp.normalDPSGain, equippedNormalDPS, comp.isEquipped);
        html += '</tr>';

        // Line breakdown row
        html += `<tr id="breakdown-${comp.id}" style="display: none;"><td colspan="4">`;
        html += '<div class="line-breakdown expanded">';
        comp.lineContributions.forEach(line => {
            html += `<div class="line-breakdown-item">`;
            html += `<span>${line.stat}: ${line.value}</span>`;
            html += `<span class="dps-positive">+${formatNumber(line.dpsContribution)} DPS</span>`;
            html += `</div>`;
        });
        html += `<div class="line-breakdown-item">`;
        html += `<span><strong>Total</strong></span>`;
        html += `<span class="dps-positive"><strong>+${formatNumber(comp.bossDPSGain)} DPS</strong></span>`;
        html += `</div>`;
        html += '</div></td></tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Render Theoretical Best table
export function renderTheoreticalBest() {
    const container = document.getElementById('theoretical-best-container');
    if (!container) return;

    const results = calculateTheoreticalBest();
    const combinations = calculateBestCombinations();

    const baselineBossDamage = calculateDamage(getBaselineStats(), 'boss');
    const baselineBossDps = baselineBossDamage.dps;
    // Apply sorting based on current column and direction
    if (theoreticalSortColumn === 2) {
        results.sort((a, b) => {
            return theoreticalSortAsc ? a.dpsGain - b.dpsGain : b.dpsGain - a.dpsGain;
        });
    }

    let html = '<h3 style="margin-bottom: 15px;">All Possible Rolls Ranked</h3>';
    html += '<div style="max-height: 600px; overflow-y: auto; border-radius: 12px;">';
    html += '<table class="ia-table"><thead><tr>';
    html += '<th>Stat & Roll</th>';
    html += '<th>Value</th>';
    html += '<th class="sortable" onclick="sortTheoreticalTable(2)">DPS Gain</th>';
    html += '</tr></thead><tbody>';

    results.forEach(result => {
        const rarityLetter = result.rarity.charAt(0).toUpperCase();
        const rarityClass = `rarity-${result.rarity.toLowerCase()}`;
        const badge = `<span class="rarity-badge ${rarityClass}">${rarityLetter}</span>`;

        html += '<tr>';
        html += `<td>${badge}${result.stat} ${result.roll} Roll</td>`;
        html += `<td>${result.value}</td>`;
        html += `<td>+${formatNumber(result.dpsGain)} <span class="${result.percentIncrease > 0 ? 'dps-positive' : 'dps-negative'}" style="font-weight:600; opacity:0.85; font-size:0.85em;"> (${result.percentIncrease >= 0 ? '+' : ''}${result.percentIncrease.toFixed(2)}%)</span></td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Best Combinations
    html += '<h3 style="margin-top: 30px; margin-bottom: 15px;">Best Possible Combinations</h3>';

    // Unique Only
    html += '<div class="combo-card">';
    html += '<h4><span class="rarity-badge rarity-unique">U</span>Best with Unique Only (3 Lines)</h4>';
    html += '<div class="combo-lines">';
    combinations.uniqueOnly.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="combo-line"><span class="rarity-badge ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.uniqueOnly.totalDPS / baselineBossDps) * 100;
        const cls = percent >= 0 ? 'dps-positive' : 'dps-negative';
        html += `<div class="combo-total">Total DPS Gain: +${formatNumber(combinations.uniqueOnly.totalDPS)} <span class="${cls}" style="font-weight:600; opacity:0.85; font-size:0.95em;"> (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div>';

    // Unique + Legendary
    html += '<div class="combo-card">';
    html += '<h4><span class="rarity-badge rarity-unique">U</span><span class="rarity-badge rarity-legendary">L</span>Best with Unique + Legendary (Up to 5 Lines)</h4>';
    html += '<div class="combo-lines">';
    combinations.uniqueLegendary.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="combo-line"><span class="rarity-badge ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.uniqueLegendary.totalDPS / baselineBossDps) * 100;
        const cls = percent >= 0 ? 'dps-positive' : 'dps-negative';
        html += `<div class="combo-total">Total DPS Gain: +${formatNumber(combinations.uniqueLegendary.totalDPS)} <span class="${cls}" style="font-weight:600; opacity:0.85; font-size:0.95em;"> (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div>';

    // Mystic + Legendary + Unique
    html += '<div class="combo-card">';
    html += '<h4><span class="rarity-badge rarity-mystic">M</span><span class="rarity-badge rarity-legendary">L</span><span class="rarity-badge rarity-unique">U</span>Best with Mystic + Legendary + Unique (Up to 6 Lines)</h4>';
    html += '<div class="combo-lines">';
    combinations.mysticLegendaryUnique.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="combo-line"><span class="rarity-badge ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.mysticLegendaryUnique.totalDPS / baselineBossDps) * 100;
        const cls = percent >= 0 ? 'dps-positive' : 'dps-negative';
        html += `<div class="combo-total">Total DPS Gain: +${formatNumber(combinations.mysticLegendaryUnique.totalDPS)} <span class="${cls}" style="font-weight:600; opacity:0.85; font-size:0.95em;"> (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div>';

    // All Rarities
    html += '<div class="combo-card">';
    html += '<h4>Best with All Rarities (6 Lines)</h4>';
    html += '<div class="combo-lines">';
    combinations.allRarities.lines.forEach(line => {
        const rarityClass = `rarity-${line.rarity.toLowerCase()}`;
        html += `<div class="combo-line"><span class="rarity-badge ${rarityClass}">${line.rarity.charAt(0)}</span>${line.stat}: ${line.value}</div>`;
    });
    html += '</div>';
    {
        const percent = (combinations.allRarities.totalDPS / baselineBossDps) * 100;
        const cls = percent >= 0 ? 'dps-positive' : 'dps-negative';
        html += `<div class="combo-total">Total DPS Gain: +${formatNumber(combinations.allRarities.totalDPS)} <span class="${cls}" style="font-weight:600; opacity:0.85; font-size:0.95em;"> (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)</span></div>`;
    }
    html += '</div>';

    container.innerHTML = html;
}

// Toggle line breakdown visibility
export function toggleLineBreakdown(presetId) {
    const row = document.getElementById(`breakdown-${presetId}`);
    if (row) {
        row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
    }
}

// Sort preset table
let presetSortColumn = 2;
let presetSortAsc = false;

export function sortPresetTable(column) {
    if (presetSortColumn === column) {
        presetSortAsc = !presetSortAsc;
    } else {
        presetSortColumn = column;
        presetSortAsc = false;
    }
    renderPresetComparison();
}

// Sort theoretical table
let theoreticalSortColumn = 2;
let theoreticalSortAsc = false;

export function sortTheoreticalTable(column) {
    if (theoreticalSortColumn === column) {
        theoreticalSortAsc = !theoreticalSortAsc;
    } else {
        theoreticalSortColumn = column;
        theoreticalSortAsc = false;
    }
    renderTheoreticalBest();
}

// Initialize Inner Ability Analysis
export function initializeInnerAbilityAnalysis() {
    renderPresetComparison();
    renderTheoreticalBest();
}

