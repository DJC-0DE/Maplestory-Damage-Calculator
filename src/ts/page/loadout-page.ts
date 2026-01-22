import { BasePage } from "./base-page";
import {
    initializeBaseStatsUI,
    loadBaseStatsUI,
    attachBaseStatsEventListeners
} from "./base-stats/base-stats-ui";
import {
    loadClassSelectUI,
    attachClassSelectEventListeners
} from "./base-stats/class-select-ui";
import {
    loadTargetSelectUI,
    attachTargetSelectEventListeners
} from "./base-stats/target-select-ui";
import {
    loadMasteryBonusesUI,
    attachMasteryEventListeners
} from "./base-stats/mastery-bonus-ui";
import {
    initializeWeaponsUI,
    loadWeaponsUI,
    attachWeaponEventListeners
} from "./weapon-levels/weapon-ui";
import {
    initializeWeaponPriorityUI
} from "./weapon-levels/weapon-priority-ui";
import { loadoutStore } from "@ts/store/loadout.store";

/**
 * LoadoutPage - Manages the Loadout/Setup page
 * Extends BasePage to get consistent lifecycle and tab management
 */
class LoadoutPage extends BasePage {
    private initialized: boolean = false;

    constructor() {
        super('setup', 'base-stats');
    }

    /**
     * Lifecycle: Called after page is visible
     * Initialize the page on first visit, switch tabs on subsequent visits
     */
    onPageVisible(tabName: string | null): void {
        // Call parent to handle tab switching
        super.onPageVisible(tabName);

        // Initialize page components on first visit
        if (!this.initialized) {
            this.initializeComponents();
            this.initialized = true;
        }
    }

    /**
     * Initialize all page components (HTML, state, event listeners)
     * Called once on first page visit
     */
    private async initializeComponents(): Promise<void> {
        // Step 0: Initialize the loadout store (migrates data from legacy format if needed)
        await loadoutStore.initialize();

        // Step 1: Initialize all UI elements (HTML generation)
        initializeBaseStatsUI();
        initializeWeaponsUI(); // Handles tab HTML and weapon grid
        initializeWeaponPriorityUI(); // Initialize priority UI

        // Step 2: Load UI from saved state
        loadBaseStatsUI();
        loadClassSelectUI();
        loadTargetSelectUI();
        loadMasteryBonusesUI();
        loadWeaponsUI();

        // Step 3: Attach all event listeners (must be last to avoid triggering during load)
        attachBaseStatsEventListeners();
        attachWeaponEventListeners();
        attachClassSelectEventListeners();
        attachTargetSelectEventListeners();
        attachMasteryEventListeners();

        // Debug: Verify store is working
        const baseStats = loadoutStore.getBaseStats();
        console.log('Loadout page initialized. Base stats loaded:', baseStats.ATTACK);
    }
}

// Export singleton instance for use by router and window
export const loadoutPage = new LoadoutPage();

// Expose switchToTab method to window for HTML onclick handlers
window.loadoutSwitchToTab = (tabName: string) => loadoutPage.switchToTab(tabName);

// Declare the window function for TypeScript
declare global {
    interface Window {
        loadoutSwitchToTab: (tabName: string) => void;
    }
}