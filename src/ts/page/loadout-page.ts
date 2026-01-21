import {
    initializeBaseStatsUI,
    loadBaseStatsUI,
    attachBaseStatsEventListeners
} from "./base-stats/base-stats-ui";
import {
    initializeClassSelectUI,
    loadClassSelectUI,
    attachClassSelectEventListeners
} from "./base-stats/class-select-ui";
import {
    initializeTargetSelectUI,
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

export async function initializeLoadoutPage(): Promise<void> {
    // Step 0: Initialize the loadout store (migrates data from legacy format if needed)
    await loadoutStore.initialize();

    // Step 1: Initialize all UI elements (HTML generation)
    initializeBaseStatsUI();
    initializeClassSelectUI();
    initializeTargetSelectUI();
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
}