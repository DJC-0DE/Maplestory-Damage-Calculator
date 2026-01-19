// Artifact Potential stat mapping and calculations

import { artifactPotentialData } from '@data/artifact-potential-data.js';
import { formatNumber } from '@utils/formatters.js';
import { getStats } from '@core/main.js';
import { StatCalculationService } from '@core/services/stat-calculation-service.js';

window.sortArtifactTable = sortArtifactTable;

// Map artifact potential stat to base stat properties
export function mapArtifactStat(statName, value, baseStats) {
    // Remove "(prime)" suffix if present for mapping
    const cleanStatName = statName.replace(' (prime)', '');

    // Use StatCalculationService for consistent stat manipulation
    const service = new StatCalculationService(baseStats);

    switch (cleanStatName) {
        case 'Main Stat %':
            // StatCalculationService handles complex main stat % calculations including Dark Knight
            service.addMainStatPct(value);
            break;
        case 'Critical Rate %':
            service.addPercentageStat('critRate', value);
            break;
        case 'Min Damage Multiplier %':
            service.addPercentageStat('minDamage', value);
            break;
        case 'Max Damage Multiplier %':
            service.addPercentageStat('maxDamage', value);
            break;
        case 'Boss Monster Damage %':
            service.addPercentageStat('bossDamage', value);
            break;
        case 'Normal Monster Damage %':
            service.addPercentageStat('normalDamage', value);
            break;
        case 'Damage %':
            service.addPercentageStat('damage', value);
            break;
        case 'Defense Penetration %':
            // Defense Penetration uses diminishing returns with factor 100
            service.addDiminishingReturnStat('defPen', value, 100);
            break;
        // Ignored stats: Damage Taken Decrease %, Defense %, Accuracy, Status Effect Damage %
        default:
            // No effect on damage
            break;
    }

    return service.getStats();
}

// Calculate all possible artifact potential rolls and rank them
export function calculateArtifactPotentialRankings() {
    const baseStats = getStats('base');

    // Calculate baseline damage using StatCalculationService
    const baselineService = new StatCalculationService(baseStats);
    const baselineBossDamage = baselineService.compute('boss');
    const baselineNormalDamage = baselineService.compute('normal');

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
            const testService = new StatCalculationService(modifiedStats);
            const bossDamage = testService.compute('boss');
            const normalDamage = testService.compute('normal');

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

    let html = '<h3 class="title">All Possible Rolls Ranked</h3>';
    html += '<div class="table-scrollable"><div class="artifact-table-container">';
    html += '<table class="table"><thead><tr>';
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
        const badge = `<span class="badge badge--rarity ${rarityClass}">${rarityLetter}</span>`;

        // Rank badge with special styling for top 3
        let rankBadge;
        if (index < 3) {
            rankBadge = `<span class="badge badge--rank-${index + 1}">${index + 1}</span>`;
        } else {
            rankBadge = `<span class="badge">${index + 1}</span>`;
        }

        html += '<tr>';
        html += `<td>${rankBadge}</td>`;
        html += `<td>${badge}${result.stat}</td>`;
        html += `<td>${result.value}</td>`;
        html += `<td>+${formatNumber(result.bossDPSGain)}${result.bossDPSPercentChange !== 0 ? ` <span style="color:#10b981; font-weight:600;">(+${result.bossDPSPercentChange.toFixed(2)}%)</span>` : ''}</td>`;
        html += `<td>+${formatNumber(result.normalDPSGain)}${result.normalDPSPercentChange !== 0 ? ` <span style="color:#10b981; font-weight:600;">(+${result.normalDPSPercentChange.toFixed(2)}%)</span>` : ''}</td>`;
        html += `<td><strong>+${formatNumber(result.avgDPSGain)}</strong>${result.avgDPSPercentChange !== 0 ? ` <span style="color:#10b981; font-weight:600;">(+${result.avgDPSPercentChange.toFixed(2)}%)</span>` : ''}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';
    container.innerHTML = html;
}

// Initialize Artifact Potential Analysis
export function initializeArtifactPotential() {
        renderArtifactPotential();
}
