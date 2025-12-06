// Artifact Potential stat mapping and calculations

// Map artifact potential stat to base stat properties
function mapArtifactStat(statName, value, baseStats) {
    const modifiedStats = { ...baseStats };

    // Remove "(prime)" suffix if present for mapping
    const cleanStatName = statName.replace(' (prime)', '');

    switch (cleanStatName) {
        case 'Main Stat %':
            // Calculate the additional main stat from the percentage
            const primaryMainStat = parseFloat(document.getElementById('primary-main-stat-base')?.value) || 0;
            const additionalMainStat = primaryMainStat * (value / 100);
            // Convert additional main stat to Stat Damage % at 100:1 ratio
            const statDamageBonus = additionalMainStat / 100;
            modifiedStats.statDamage += statDamageBonus;
            break;
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
function calculateArtifactPotentialRankings() {
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
                    avgDPSGain
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

function sortArtifactTable(column) {
    if (artifactSortColumn === column) {
        artifactSortAsc = !artifactSortAsc;
    } else {
        artifactSortColumn = column;
        artifactSortAsc = false;
    }
    renderArtifactPotential();
}

// Render the Artifact Potential rankings table
function renderArtifactPotential() {
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
        html += `<td class="dps-positive">+${formatNumber(result.bossDPSGain)}</td>`;
        html += `<td class="dps-positive">+${formatNumber(result.normalDPSGain)}</td>`;
        html += `<td class="dps-positive"><strong>+${formatNumber(result.avgDPSGain)}</strong></td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Initialize Artifact Potential Analysis
function initializeArtifactPotential() {
    // Render only if the tab is active
    const tab = document.getElementById('analysis-artifact-potential');
    if (tab && tab.classList.contains('active')) {
        renderArtifactPotential();
    }
}
