/**
 * Gear Lab Page
 * Orchestration module for the Gear Lab page
 * Follows the pattern established by loadout-page.ts
 */

import { BasePage } from './base-page.js';
import { gearLabStore } from '@ts/store/gear-lab-store.js';
import { initializeInnerAbilityUI, loadInnerAbilityFromStore } from '@ts/page/inner-ability/inner-ability-ui.js';


class GearLabPage extends BasePage {
    private initialized: boolean = false;

    constructor() {
        super('optimization', 'item-comparison');
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
        // Initialize the gearLabStore (migrates from legacy data if needed)
        await gearLabStore.initialize();

        // Initialize the Inner Ability UI
        initializeInnerAbilityUI();

        // Load saved presets from store
        loadInnerAbilityFromStore();
    }
}

// Export singleton instance for use by router and window
export const gearLabPage = new GearLabPage();

// Expose switchToTab method to window for HTML onclick handlers
window.gearLabPageSwitchToTab = (tabName: string) => gearLabPage.switchToTab(tabName);

// Declare the window function for TypeScript
declare global {
    interface Window {
        gearLabPageSwitchToTab: (tabName: string) => void;
    }
}