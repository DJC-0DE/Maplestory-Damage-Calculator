/**
 * Stat Hub Page
 * Orchestration module for the Stat Hub page
 * Follows the pattern established by loadout-page.ts
 */

import { updateStatPredictions } from './stat-hub/stat-predictions-ui';
import { generateStatEquivalencyHTML } from './stat-hub/stat-equivalency-ui';
import { BasePage } from './base-page';


class StatHubPage extends BasePage {
    private initialized: boolean = false;

    constructor() {
        super('predictions', 'stat-tables');
    }


    onPageVisible(tabName: string | null): void {
        // Call parent to handle tab switching
        super.onPageVisible(tabName);

        // Initialize page components on first visit
        if (!this.initialized) {
            this.initializeComponents();
            this.initialized = true;
        }
    }

    private async initializeComponents(): Promise<void> {
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
}

// Export singleton instance for use by router and window
export const statHubPage = new StatHubPage();

// Expose switchToTab method to window for HTML onclick handlers
window.statHubPageSwitchToTab = (tabName: string) => statHubPage.switchToTab(tabName);

// Declare the window function for TypeScript
declare global {
    interface Window {
        statHubPageSwitchToTab: (tabName: string) => void;
    }
}