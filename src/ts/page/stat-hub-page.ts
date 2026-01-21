/**
 * Stat Hub Page
 * Orchestration module for the Stat Hub page
 * Follows the pattern established by loadout-page.ts
 */

import { updateStatPredictions } from './stat-hub/stat-predictions-ui';
import { generateStatEquivalencyHTML } from './stat-hub/stat-equivalency-ui';

/**
 * Initialize the Stat Hub page
 * This function generates all HTML and attaches event listeners
 */
export async function initializeStatHubPage(): Promise<void> {
    const statWeightsContainer = document.getElementById('stat-weights');
    if (!statWeightsContainer) {
        console.warn('Stat predictions container not found');
    }

    const equivalencyContainer = document.getElementById('predictions-equivalency');
    if (equivalencyContainer) {
        // Clear existing static HTML and replace with dynamic HTML
        const existingContent = equivalencyContainer.innerHTML;
        // Keep the header/description, replace the rest
        const headerMatch = existingContent.match(/<div[^>]*>[\s\S]*?<\/div>\s*<p[^>]*>[\s\S]*?<\/p>/);
        const headerHTML = headerMatch ? headerMatch[0] : '';

        equivalencyContainer.innerHTML = headerHTML + generateStatEquivalencyHTML();
    }    

    updateStatPredictions();
}

/**
 * Update stat predictions table
 * Call this when base stats change
 */
export function refreshStatPredictions(): void {
    updateStatPredictions();
}
