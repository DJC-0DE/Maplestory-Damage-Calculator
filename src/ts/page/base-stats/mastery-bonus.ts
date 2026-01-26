import { MASTERY_BONUSES } from './mastery-constants';
import { updateMasteryDisplay } from './mastery-bonus-ui';
import type { JobTier } from '@ts/types/index';
import type { MasteryBonuses } from '@ts/types/page/base-stats/base-stats.types';
import { loadoutStore } from '@ts/store/loadout.store';
import { MASTERY_TYPE, STAT } from '@ts/types/constants';

if (typeof window !== 'undefined') {
    window.updateMasteryBonuses = updateMasteryBonuses;
}

// ============================================================================
// UPDATE METHODS
// ============================================================================

/**
 * Update mastery bonuses from checkbox states and save
 * Call this when user interacts with mastery checkboxes
 */
export function updateMasteryBonuses(): void {
    const currentTier = loadoutStore.getCharacter().jobTier as JobTier;
    const { allTotal, bossTotal } = calculateMasteryTotals(currentTier);

    updateMasteryDisplay(currentTier, allTotal, bossTotal);

    // Save mastery checkbox states via loadout store (auto dual-writes to localStorage)
    saveMasteryCheckboxesToStore(currentTier);
}

/**
 * Save current mastery checkbox states to the loadout store
 */
function saveMasteryCheckboxesToStore(tier: JobTier): void {
    const tierData = MASTERY_BONUSES[tier];
    if (!tierData) return;

    // Save "All Monsters" checkboxes
    for (const [level] of Object.entries(tierData.all)) {
        const checkbox = document.getElementById(`mastery-${tier}-all-${level}`) as HTMLInputElement;
        if (checkbox) {
            loadoutStore.updateMasteryCheckbox(tier, MASTERY_TYPE.ALL, level, checkbox.checked);
        }
    }

    // Save "Boss Only" checkboxes
    for (const [level] of Object.entries(tierData.boss)) {
        const checkbox = document.getElementById(`mastery-${tier}-boss-${level}`) as HTMLInputElement;
        if (checkbox) {
            loadoutStore.updateMasteryCheckbox(tier, MASTERY_TYPE.BOSS, level, checkbox.checked);
        }
    }
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate mastery bonus totals from checked checkboxes
 */
export function calculateMasteryTotals(tier: JobTier): { allTotal: number; bossTotal: number } {
    let allTotal = 0;
    let bossTotal = 0;

    const tierData = MASTERY_BONUSES[tier];

    // Guard: if tier doesn't exist in MASTERY_BONUSES, return zeros
    if (!tierData) {
        return { allTotal, bossTotal };
    }

    // Sum up "All Monsters" bonuses
    for (const [level, bonus] of Object.entries(tierData.all)) {
        const checkbox = document.getElementById(`mastery-${tier}-all-${level}`) as HTMLInputElement;
        if (checkbox && checkbox.checked) {
            allTotal += bonus;
        }
    }

    // Sum up "Boss Only" bonuses
    for (const [level, bonus] of Object.entries(tierData.boss)) {
        const checkbox = document.getElementById(`mastery-${tier}-boss-${level}`) as HTMLInputElement;
        if (checkbox && checkbox.checked) {
            bossTotal += bonus;
        }
    }

    return { allTotal, bossTotal };
}
