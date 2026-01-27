/**
 * Artifact Potential UI - HTML Generation and Rendering
 * This file handles all HTML generation and rendering for the artifact potential tab
 */

import { calculateArtifactPotentialRankings, getArtifactSortAsc, getArtifactSortColumn } from './artifact-potential.js';
import { formatNumber } from '@ts/utils/formatters.js';
import type { ArtifactRankingResult } from '@ts/types/page/artifact-potential/artifact-potential.types.js';
import { loadoutStore } from '@ts/store/loadout.store.js';
import { debounce } from '@ts/utils/event-emitter.js';

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for a single ranking row
 */
function generateRankingRowHTML(result: ArtifactRankingResult, index: number): string {
    const rarityLetter = result.rarity.charAt(0).toUpperCase();
    const rarityClass = `rarity-${result.rarity.toLowerCase()}`;
    const badge = `<span class="badge badge--rarity ${rarityClass}">${rarityLetter}</span>`;

    // Rank badge with special styling for top 3
    let rankBadge: string;
    if (index < 3) {
        rankBadge = `<span class="badge badge--rank-${index + 1}">${index + 1}</span>`;
    } else {
        rankBadge = `<span class="badge">${index + 1}</span>`;
    }

    const bossPercentHTML = result.bossDPSPercentChange !== 0
        ? ` <span style="color:#10b981; font-weight:600;">(+${result.bossDPSPercentChange.toFixed(2)}%)</span>`
        : '';

    const normalPercentHTML = result.normalDPSPercentChange !== 0
        ? ` <span style="color:#10b981; font-weight:600;">(+${result.normalDPSPercentChange.toFixed(2)}%)</span>`
        : '';

    const avgPercentHTML = result.avgDPSPercentChange !== 0
        ? ` <span style="color:#10b981; font-weight:600;">(+${result.avgDPSPercentChange.toFixed(2)}%)</span>`
        : '';

    return `
        <tr>
            <td>${rankBadge}</td>
            <td>${badge}${result.stat}</td>
            <td>${result.value}</td>
            <td>+${formatNumber(result.bossDPSGain)}${bossPercentHTML}</td>
            <td>+${formatNumber(result.normalDPSGain)}${normalPercentHTML}</td>
            <td><strong>+${formatNumber(result.avgDPSGain)}</strong>${avgPercentHTML}</td>
        </tr>
    `;
}

/**
 * Generate HTML for the artifact potential rankings table
 */
function generateRankingsTableHTML(results: ArtifactRankingResult[]): string {
    let html = '<h3 class="title">All Possible Rolls Ranked</h3>';
    html += '<div class="table-wrapper table-scrollable"><div class="artifact-table-container">';
    html += '<table class="table"><thead><tr>';
    html += '<th>Rank</th>';
    html += '<th>Rarity & Stat</th>';
    html += '<th>Value</th>';
    html += '<th class="sortable" onclick="sortArtifactTable(3)">Boss DPS Gain</th>';
    html += '<th class="sortable" onclick="sortArtifactTable(4)">Normal DPS Gain</th>';
    html += '<th class="sortable" onclick="sortArtifactTable(5)">Avg DPS Gain</th>';
    html += '</tr></thead><tbody>';

    results.forEach((result, index) => {
        html += generateRankingRowHTML(result, index);
    });

    html += '</tbody></table></div></div>';
    return html;
}

/**
 * Sort results array based on current sort column and direction
 */
function sortResults(results: ArtifactRankingResult[]): ArtifactRankingResult[] {
    const column = getArtifactSortColumn();
    const ascending = getArtifactSortAsc();

    const sorted = [...results];
    sorted.sort((a, b) => {
        let valA: number;
        let valB: number;
        switch (column) {
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
        return ascending ? valA - valB : valB - valA;
    });

    return sorted;
}

/**
 * Render the Artifact Potential rankings table
 */
export function renderArtifactPotential(): void {
    const container = document.getElementById('artifact-potential-container');
    if (!container) return;

    const results = calculateArtifactPotentialRankings();

    // Apply sorting based on current column and direction
    const sortedResults = sortResults(results);

    container.innerHTML = generateRankingsTableHTML(sortedResults);
}

/**
 * Initialize Artifact Potential Analysis
 */
export function initializeArtifactPotential(): void {
    renderArtifactPotential();

    loadoutStore.on('stat:changed', debounce((_) => {
        renderArtifactPotential();
    }, 3500));
}
