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

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for mastery table rows
 */
function generateMasteryTableRows(tier: '3rd' | '4th', type: 'all' | 'boss'): string {
    const masteryData = tier === '3rd' ? MASTERY_3RD : MASTERY_4TH;
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
function generateMasteryTableHTML(tier: '3rd' | '4th'): string {
    return `
        <div id="mastery-table-${tier}" class="bgstats-mastery-table" ${tier === '4th' ? 'style="display: none;"' : ''}>
            <table class="bgstats-table">
                <thead>
                    <tr>
                        <th class="bgstats-table-th">Level</th>
                        <th class="bgstats-table-th">All Monsters</th>
                        <th class="bgstats-table-th">Boss Only</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateMasteryTableRows(tier, 'all')}
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

            ${generateMasteryTableHTML('3rd')}
            ${generateMasteryTableHTML('4th')}
        </div>
    `;
}

/**
 * Generate HTML for hidden mastery inputs
 */
export function generateMasteryHiddenInputs(): string {
    return `
        <input type="hidden" id="skill-mastery-base" value="21">
        <input type="hidden" id="skill-mastery-boss-base" value="0">
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
    [64, 68, 76, 80, 88, 92].forEach(level => {
        const checkbox = document.getElementById(`mastery-3rd-all-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery['3rd'].all[level.toString()] ?? false;
        }
    });

    // Load 3rd Job "Boss Only" checkboxes
    [72, 84].forEach(level => {
        const checkbox = document.getElementById(`mastery-3rd-boss-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery['3rd'].boss[level.toString()] ?? false;
        }
    });

    // Load 4th Job "All Monsters" checkboxes
    [102, 106, 116, 120, 128, 132].forEach(level => {
        const checkbox = document.getElementById(`mastery-4th-all-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery['4th'].all[level.toString()] ?? false;
        }
    });

    // Load 4th Job "Boss Only" checkboxes
    [111, 124].forEach(level => {
        const checkbox = document.getElementById(`mastery-4th-boss-${level}`) as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = mastery['4th'].boss[level.toString()] ?? false;
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
    const skillMasteryInput = document.getElementById('skill-mastery-base') as HTMLInputElement;
    const skillMasteryBossInput = document.getElementById('skill-mastery-boss-base') as HTMLInputElement;

    if (skillMasteryInput) {
        skillMasteryInput.value = allTotal.toString();
    }
    if (skillMasteryBossInput) {
        skillMasteryBossInput.value = bossTotal.toString();
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
        tab3rd.addEventListener('click', () => selectMasteryTab('3rd'));
    }
    if (tab4th) {
        tab4th.addEventListener('click', () => selectMasteryTab('4th'));
    }
}

/**
 * Attach event listeners to mastery checkboxes
 */
export function attachMasteryCheckboxListeners(): void {
    (['3rd', '4th'] as const).forEach(tier => {
        const masteryData = tier === '3rd' ? MASTERY_3RD : MASTERY_4TH;

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
