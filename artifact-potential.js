// Artifact Potential stat mapping and calculations

import { artifactPotentialData } from './artifact-potential-data.js';
import { calculateDamage, formatNumber } from './calculations.js';
import { getSelectedClass, getStats } from './main.js';

// Map artifact potential stat to base stat properties
export function mapArtifactStat(statName, value, baseStats) {
    const modifiedStats = { ...baseStats };

    // Remove "(prime)" suffix if present for mapping
    const cleanStatName = statName.replace(' (prime)', '');

    switch (cleanStatName) {
        case 'Main Stat %':
        {
            // Main stat % bonuses are additive with each other
            // Primary Main Stat already includes current main stat % bonuses
            const primaryMainStat = parseFloat(document.getElementById('primary-main-stat-base')?.value) || 0;
            const mainStatPct = parseFloat(document.getElementById('main-stat-pct-base')?.value) || 0;
            let currentTotalMainStat = primaryMainStat;
            let defenseToMainStat = 0;

            // Dark Knight: 12.7% of defense is converted to main stat but doesn't scale with Main Stat %
            if (getSelectedClass() === 'dark-knight') {
                const defense = parseFloat(document.getElementById('defense-base')?.value) || 0;
                defenseToMainStat = defense * 0.127;
            }

            // Calculate the affected portion (total minus defense conversion for DK)
            const affectedPortion = currentTotalMainStat - defenseToMainStat;

            // Calculate ratio of new multiplier to current multiplier
            const currentMultiplier = 1 + mainStatPct / 100;
            const newMultiplier = 1 + (mainStatPct + value) / 100;
            const ratio = newMultiplier / currentMultiplier;

            // Apply ratio to affected portion, then add back defense portion
            const newAffectedPortion = affectedPortion * ratio;
            const newTotalMainStat = newAffectedPortion + defenseToMainStat;

            // Convert to stat damage (100 main stat = 1% stat damage)
            const currentStatDamageFromMainStat = currentTotalMainStat / 100;
            const newStatDamageFromMainStat = newTotalMainStat / 100;

            // Calculate the gain in stat damage and apply it
            const statDamageBonus = newStatDamageFromMainStat - currentStatDamageFromMainStat;
            modifiedStats.statDamage += statDamageBonus;
            break;
        }
        case 'Critical Rate %':
            modifiedStats.critRate += value;
            break;
        case 'Min Damage Multiplier %':
            modifiedStats.minDamage += value;
            break;
        case 'Max Damage Multiplier %':
            modifiedStats.maxDamage += value;
            break;
        case 'Boss Monster Damage %':
            modifiedStats.bossDamage += value;
            break;
        case 'Normal Monster Damage %':
            modifiedStats.normalDamage += value;
            break;
        case 'Damage %':
            modifiedStats.damage += value;
            break;
        case 'Defense Penetration %':
            modifiedStats.defPen += value;
            break;
        // Ignored stats: Damage Taken Decrease %, Defense %, Accuracy, Status Effect Damage %
        default:
            // No effect on damage
            break;
    }

    return modifiedStats;
}

// Calculate all possible artifact potential rolls and rank them
export function calculateArtifactPotentialRankings() {
    const baseStats = getStats('base');
    const baselineBossDamage = calculateDamage(baseStats, 'boss');
    const baselineNormalDamage = calculateDamage(baseStats, 'normal');

    const results = [];

    // Process each rarity tier
    Object.entries(artifactPotentialData).forEach(([rarity, stats]) => {
        Object.entries(stats).forEach(([statName, value]) => {
            // Skip stats that don't affect damage
            const ignoredStats = [
                'Damage Taken Decrease %',
                'Damage Taken Decrease % (prime)',
                'Defense %',
                'Defense % (prime)',
                'Accuracy',
                'Accuracy (prime)',
                'Status Effect Damage %',
                'Status Effect Damage % (prime)'
            ];

            if (ignoredStats.includes(statName)) {
                return;
            }

            // Apply this stat and calculate DPS gains
            const modifiedStats = mapArtifactStat(statName, value, baseStats);
            const bossDamage = calculateDamage(modifiedStats, 'boss');
            const normalDamage = calculateDamage(modifiedStats, 'normal');

            const bossDPSGain = bossDamage.dps - baselineBossDamage.dps;
            const normalDPSGain = normalDamage.dps - baselineNormalDamage.dps;
            const avgDPSGain = (bossDPSGain + normalDPSGain) / 2;

            const bossDPSPercentChange = baselineBossDamage.dps > 0 ? (bossDPSGain / baselineBossDamage.dps) * 100 : 0;
            const normalDPSPercentChange = baselineNormalDamage.dps > 0 ? (normalDPSGain / baselineNormalDamage.dps) * 100 : 0;
            const avgDPSPercentChange = (bossDPSPercentChange + normalDPSPercentChange) / 2;

            // Only include stats that give positive DPS gain
            if (avgDPSGain > 0) {
                // Format the display name
                let displayName = statName;
                if (statName.includes('(prime)')) {
                    displayName = statName.replace(' (prime)', ' (Prime)');
                }

                results.push({
                    rarity,
                    stat: displayName,
                    value: value + '%',
                    bossDPSGain,
                    normalDPSGain,
                    avgDPSGain,
                    bossDPSPercentChange,
                    normalDPSPercentChange,
                    avgDPSPercentChange
                });
            }
        });
    });

    // Sort by average DPS gain (descending)
    results.sort((a, b) => b.avgDPSGain - a.avgDPSGain);

    return results;
}

// Sort artifact potential table
let artifactSortColumn = 5;
let artifactSortAsc = false;

export function sortArtifactTable(column) {
    if (artifactSortColumn === column) {
        artifactSortAsc = !artifactSortAsc;
    } else {
        artifactSortColumn = column;
        artifactSortAsc = false;
    }
    renderArtifactPotential();
}

// Render the Artifact Potential rankings table
export function renderArtifactPotential() {
    const container = document.getElementById('artifact-potential-container');
    if (!container) return;

    const results = calculateArtifactPotentialRankings();

    // Apply sorting based on current column and direction
    results.sort((a, b) => {
        let valA, valB;
        switch (artifactSortColumn) {
            case 3: // Boss DPS Gain
                valA = a.bossDPSGain;
                valB = b.bossDPSGain;
                break;
            case 4: // Normal DPS Gain
                valA = a.normalDPSGain;
                valB = b.normalDPSGain;
                break;
            case 5: // Avg DPS Gain
                valA = a.avgDPSGain;
                valB = b.avgDPSGain;
                break;
            default:
                return 0;
        }
        return artifactSortAsc ? valA - valB : valB - valA;
    });

    let html = '<h3 style="margin-bottom: 15px;">All Possible Rolls Ranked</h3>';
    html += '<div style="max-height: 600px; overflow-y: auto; border-radius: 12px;">';
    html += '<table class="ia-table"><thead><tr>';
    html += '<th>Rank</th>';
    html += '<th>Rarity & Stat</th>';
    html += '<th>Value</th>';
    html += '<th class="sortable" onclick="sortArtifactTable(3)">Boss DPS Gain</th>';
    html += '<th class="sortable" onclick="sortArtifactTable(4)">Normal DPS Gain</th>';
    html += '<th class="sortable" onclick="sortArtifactTable(5)">Avg DPS Gain</th>';
    html += '</tr></thead><tbody>';

    results.forEach((result, index) => {
        const rarityLetter = result.rarity.charAt(0).toUpperCase();
        const rarityClass = `rarity-${result.rarity.toLowerCase()}`;
        const badge = `<span class="rarity-badge ${rarityClass}">${rarityLetter}</span>`;

        // Rank badge with special styling for top 3
        let rankBadge;
        if (index < 3) {
            rankBadge = `<span class="preset-rank rank-${index + 1}">${index + 1}</span>`;
        } else {
            rankBadge = `<span class="preset-rank">${index + 1}</span>`;
        }

        html += '<tr>';
        html += `<td>${rankBadge}</td>`;
        html += `<td>${badge}${result.stat}</td>`;
        html += `<td>${result.value}</td>`;
        html += `<td>+${formatNumber(result.bossDPSGain)}${result.bossDPSPercentChange !== 0 ? ` <span class="dps-positive" style="font-weight:600; opacity:0.85; font-size:0.85em;">(+${result.bossDPSPercentChange.toFixed(2)}%)</span>` : ''}</td>`;
        html += `<td>+${formatNumber(result.normalDPSGain)}${result.normalDPSPercentChange !== 0 ? ` <span class="dps-positive" style="font-weight:600; opacity:0.85; font-size:0.85em;">(+${result.normalDPSPercentChange.toFixed(2)}%)</span>` : ''}</td>`;
        html += `<td><strong>+${formatNumber(result.avgDPSGain)}</strong>${result.avgDPSPercentChange !== 0 ? ` <span class="dps-positive" style="font-weight:600; opacity:0.85; font-size:0.85em;">(+${result.avgDPSPercentChange.toFixed(2)}%)</span>` : ''}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Initialize Artifact Potential Analysis
export function initializeArtifactPotential() {
    // Render only if the tab is active
    const tab = document.getElementById('analysis-artifact-potential');
    if (tab && tab.classList.contains('active')) {
        renderArtifactPotential();
    }
}
