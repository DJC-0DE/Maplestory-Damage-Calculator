/**
 * Mastery Bonus UI - HTML Generation and Event Handlers
 * This file handles all HTML generation and UI event handling for mastery bonuses
 */

import { selectMasteryTab } from './class-select-ui';
import { updateMasteryBonuses, calculateMasteryTotals } from './mastery-bonus';
import { MASTERY_3RD, MASTERY_4TH } from './mastery-constants';
import type { MasteryData } from '@ts/types/page/base-stats/base-stats.types';
import type { JobTier } from '@ts/types/index';
import { loadoutStore } from '@ts/store/loadout.store';
import { JOB_TIER, MASTERY_TYPE, MASTERY_LEVELS, STAT } from '@ts/types/constants';
import type { MasteryTypeValue } from '@ts/types/constants';

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for mastery table rows
 */
function generateMasteryTableRows(tier: JobTier, type: MasteryTypeValue): string {
    const masteryData = tier === JOB_TIER.THIRD ? MASTERY_3RD : MASTERY_4TH;
    const items = masteryData[type];

    let rows = '';
    const allLevels = new Set<number>();
    const bossLevels = new Set<number>();

    // Collect all levels from both types
    masteryData.all.forEach(item => allLevels.add(item.level));
    masteryData.boss.forEach(item => bossLevels.add(item.level));

    // Sort all unique levels
    const sortedLevels = Array.from(allLevels).sort((a, b) => a - b);

    // Add boss-only levels that aren't in all
    bossLevels.forEach(level => {
        if (!allLevels.has(level)) {
            sortedLevels.push(level);
        }
    });
    sortedLevels.sort((a, b) => a - b);

    sortedLevels.forEach(level => {
        const allItem = masteryData.all.find(item => item.level === level);
        const bossItem = masteryData.boss.find(item => item.level === level);

        const allCell = allItem
            ? `<label class="bgstats-checkbox-label">
                <input type="checkbox" id="mastery-${tier}-all-${level}" class="bgstats-checkbox">
                <span class="bgstats-checkbox-text">${allItem.bonus}%</span>
               </label>`
            : '—';

        const bossCell = bossItem
            ? `<label class="bgstats-checkbox-label">
                <input type="checkbox" id="mastery-${tier}-boss-${level}" class="bgstats-checkbox">
                <span class="bgstats-checkbox-text">${bossItem.bonus}%</span>
               </label>`
            : '—';

        rows += `
            <tr class="bgstats-table-row">
                <td class="bgstats-table-td level-cell">${level}</td>
                <td class="bgstats-table-td">${allCell}</td>
                <td class="bgstats-table-td ${!bossItem ? 'empty-cell' : ''}">${bossCell}</td>
            </tr>
        `;
    });

    return rows;
}

/**
 * Generate HTML for mastery table
 */
function generateMasteryTableHTML(tier: JobTier): string {
    return `
        <div id="mastery-table-${tier}" class="bgstats-mastery-table" ${tier === JOB_TIER.FOURTH ? 'style="display: none;"' : ''}>
            <table class="bgstats-table">
                <thead>
                    <tr>
                        <th class="bgstats-table-th">Level</th>
                        <th class="bgstats-table-th">All Monsters</th>
                        <th class="bgstats-table-th">Boss Only</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateMasteryTableRows(tier, MASTERY_TYPE.ALL)}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Generate the complete HTML for the mastery bonus section
 */
export function generateMasterySectionHTML(): string {
    return `
        <!-- Skill Mastery Section - Premium redesign -->
        <div class="bgstats-mastery-section">
            <label class="bgstats-mastery-title">Skill Mastery Bonus <span class="bgstats-info-inline" role="img" aria-label="Info" onclick="openHelpSidebar('skill-mastery')">?</span></label>

            <!-- Mastery Job Tabs - Unified control -->
            <div class="bgstats-mastery-tabs">
                <button id="mastery-tab-3rd" class="bgstats-mastery-tab active">3rd Job</button>
                <button id="mastery-tab-4th" class="bgstats-mastery-tab">4th Job</button>
            </div>

            ${generateMasteryTableHTML(JOB_TIER.THIRD)}
            ${generateMasteryTableHTML(JOB_TIER.FOURTH)}
        </div>
    `;
}

/**
 * Generate HTML for hidden mastery inputs
 */
export function generateMasteryHiddenInputs(): string {
    return `
        <input type="hidden" id="mastery" value="21">
        <input type="hidden" id="bossMastery" value="0">
    `;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Load mastery bonuses UI from saved checkbox states
 */
export function loadMasteryBonusesUI(): void {
    const currentTier = loadoutStore.getSelectedJobTier() as JobTier;

    // Load checkbox states from store
    loadMasteryCheckboxesFromStore(currentTier);

    // Calculate totals and update display
    const { allTotal, bossTotal } = calculateMasteryTotals(currentTier);
    updateMasteryDisplay(currentTier, allTotal, bossTotal);
}

/**
 * Load mastery checkbox states from the loadout store
 */
function loadMasteryCheckboxesFromStore(tier: JobTier): void {
    const mastery = loadoutStore.getMastery();

    // Load 3rd Job "All Monsters" checkboxes
    MASTERY_LEVELS.THIRD.ALL.forEach(level => {
        const checkbox = document.getElementById(`mastery-${JOB_TIER.THIRD}-all-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery[JOB_TIER.THIRD].all[level.toString()] ?? false;
        }
    });

    // Load 3rd Job "Boss Only" checkboxes
    MASTERY_LEVELS.THIRD.BOSS.forEach(level => {
        const checkbox = document.getElementById(`mastery-${JOB_TIER.THIRD}-boss-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery[JOB_TIER.THIRD].boss[level.toString()] ?? false;
        }
    });

    // Load 4th Job "All Monsters" checkboxes
    MASTERY_LEVELS.FOURTH.ALL.forEach(level => {
        const checkbox = document.getElementById(`mastery-${JOB_TIER.FOURTH}-all-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery[JOB_TIER.FOURTH].all[level.toString()] ?? false;
        }
    });

    // Load 4th Job "Boss Only" checkboxes
    MASTERY_LEVELS.FOURTH.BOSS.forEach(level => {
        const checkbox = document.getElementById(`mastery-${JOB_TIER.FOURTH}-boss-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery[JOB_TIER.FOURTH].boss[level.toString()] ?? false;
        }
    });
}

/**
 * Update the UI display elements with mastery bonus totals
 */
export function updateMasteryDisplay(tier: JobTier, allTotal: number, bossTotal: number): void {
    // Update display totals for the current tier
    const allTotalDisplay = document.getElementById(`mastery-${tier}-all-total`);
    const bossTotalDisplay = document.getElementById(`mastery-${tier}-boss-total`);

    if (allTotalDisplay) {
        allTotalDisplay.textContent = `${allTotal}%`;
    }
    if (bossTotalDisplay) {
        bossTotalDisplay.textContent = `${bossTotal}%`;
    }

    // Update hidden inputs that are used by the calculation engine
    const skillMasteryInput = document.getElementById('mastery') as HTMLInputElement;
    const skillMasteryBossInput = document.getElementById('bossMastery') as HTMLInputElement;

    if (skillMasteryInput) {
        skillMasteryInput.value = allTotal.toString();
        loadoutStore.updateBaseStat(STAT.MASTERY.id, allTotal);
    }
    if (skillMasteryBossInput) {
        skillMasteryBossInput.value = bossTotal.toString();
        loadoutStore.updateBaseStat(STAT.BOSS_MASTERY.id, bossTotal);
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Attach event listeners to mastery tab buttons
 */
export function attachMasteryTabListeners(): void {
    const tab3rd = document.getElementById('mastery-tab-3rd');
    const tab4th = document.getElementById('mastery-tab-4th');

    if (tab3rd) {
        tab3rd.addEventListener('click', () => selectMasteryTab(JOB_TIER.THIRD));
    }
    if (tab4th) {
        tab4th.addEventListener('click', () => selectMasteryTab(JOB_TIER.FOURTH));
    }
}

/**
 * Attach event listeners to mastery checkboxes
 */
export function attachMasteryCheckboxListeners(): void {
    ([JOB_TIER.THIRD, JOB_TIER.FOURTH] as const).forEach(tier => {
        const masteryData = tier === JOB_TIER.THIRD ? MASTERY_3RD : MASTERY_4TH;

        masteryData.all.forEach(item => {
            const checkbox = document.getElementById(`mastery-${tier}-all-${item.level}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => updateMasteryBonuses());
            }
        });

        masteryData.boss.forEach(item => {
            const checkbox = document.getElementById(`mastery-${tier}-boss-${item.level}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => updateMasteryBonuses());
            }
        });
    });
}

/**
 * Attach all event listeners for mastery UI
 */
export function attachMasteryEventListeners(): void {
    attachMasteryTabListeners();
    attachMasteryCheckboxListeners();
}
