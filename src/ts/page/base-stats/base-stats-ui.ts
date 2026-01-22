// Base Stats UI - HTML Generation and Event Handlers
// This file handles all HTML generation and UI event handling for the base stats tab

import { getStatType, isDexMainStatClass, isIntMainStatClass, isLukMainStatClass, isStrMainStatClass } from './class-select';
import { generateClassSelectorHTML } from './class-select-ui';
import { generateContentTypeSelectorHTML } from './target-select-ui';
import {
    generateMasterySectionHTML,
    generateMasteryHiddenInputs
} from './mastery-bonus-ui';
import { updateSkillCoefficient } from './base-stats';
import { extractText, parseBaseStatText } from '@ts/utils/ocr';
import { showToast } from '@ts/utils/notifications';
import { loadoutStore } from '@ts/store/loadout.store';
import { STAT_TYPE, STAT, type StatConfig, type StatKey } from '@ts/types/constants';

// Import calculate dynamically to avoid circular dependency
function getCalculateFunction(): (() => void) | undefined {
    return window.calculate;
}

// Stat categories for organizing the UI
const CORE_COMBAT_STATS: StatKey[] = ['ATTACK', 'DEFENSE', 'CRIT_RATE', 'CRIT_DAMAGE', 'ATTACK_SPEED'];
const MAIN_STATS: StatKey[] = ['STR', 'DEX', 'INT', 'LUK'];
const DAMAGE_MODIFIERS: StatKey[] = [
    'STAT_DAMAGE', 'DAMAGE', 'DAMAGE_AMP', 'BASIC_ATTACK_DAMAGE', 'SKILL_DAMAGE',
    'DEF_PEN', 'BOSS_DAMAGE', 'NORMAL_DAMAGE', 'MIN_DAMAGE', 'MAX_DAMAGE', 'FINAL_DAMAGE'
];
const SKILL_LEVELS: StatKey[] = ['SKILL_LEVEL_1ST', 'SKILL_LEVEL_2ND', 'SKILL_LEVEL_3RD', 'SKILL_LEVEL_4TH'];
const MAIN_STAT_PCT: StatKey[] = ['MAIN_STAT_PCT'];

// All visible stat categories combined (for event listeners)
const ALL_VISIBLE_STATS: StatKey[] = [
    ...CORE_COMBAT_STATS,
    ...MAIN_STATS,
    ...DAMAGE_MODIFIERS,
    ...SKILL_LEVELS,
    ...MAIN_STAT_PCT
];

/**
 * Generate HTML for a single stat input row
 */
function generateStatInputHTML(statKey: StatKey): string {
    const stat = STAT[statKey] as StatConfig;  // Cast to access all optional properties
    const infoIcon = stat.info
        ? `<span class="bgstats-info-inline" role="img" aria-label="Info" onclick="openHelpSidebar('${stat.info}')">?</span>`
        : '';

    const onChangeAttr = stat.onChange
        ? 'onchange="updateSkillCoefficient()"'
        : '';

    const hiddenStyle = stat.hidden ? 'style="display: none;"' : '';
    const rowId = stat.rowId ? `id="${stat.rowId}"` : '';
    const minAttr = stat.min !== undefined ? `min="${stat.min}"` : '';
    const stepAttr = stat.step ? `step="${stat.step}"` : '';

    return `
        <div class="bgstats-stat-row" ${rowId} ${hiddenStyle}>
            <label class="bgstats-stat-label">${stat.label} ${infoIcon}</label>
            <input type="${stat.type}" id="${stat.id}" value="${stat.defaultValue}" ${minAttr} ${stepAttr} ${onChangeAttr} class="bgstats-stat-input">
        </div>
    `;
}

/**
 * Generate HTML for stat inputs
 */
function generateStatInputsHTML(): string {
    let html = '';

    // Core Combat Stats
    html += CORE_COMBAT_STATS.map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Main Stats
    html += MAIN_STATS.map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Damage Modifiers
    html += DAMAGE_MODIFIERS.map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Skill Levels
    html += SKILL_LEVELS.map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Main Stat %
    html += MAIN_STAT_PCT.map(generateStatInputHTML).join('');

    // Hidden fields
    html += `
        <input type="hidden" id="primaryMainStat" value="${STAT.PRIMARY_MAIN_STAT.defaultValue}">
        <input type="hidden" id="secondaryMainStat" value="${STAT.SECONDARY_MAIN_STAT.defaultValue}">
        ${generateMasteryHiddenInputs()}
        <input type="hidden" id="skillCoeff" value="0">
    `;

    return html;
}

/**
 * Generate the complete HTML for the base stats tab
 */
export function generateBaseStatsHTML(): string {
    return `
        <!-- Base Stats Container - Premium aesthetic with subtle depth -->
        <div class="bgstats-premium-container bg-transparent p-2">
            <!-- Class Selector - Refined with premium card styling -->
            <div class="bgstats-section bgstats-class-section">
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
                    ${generateClassSelectorHTML()}
                </div>
            </div>
            <div id="debug-ocr"> </div>

            <!-- Character Level and Job Tier - Premium section styling -->
            <div class="bgstats-section bgstats-character-config">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" style="align-items: end;">
                    <div class="input-group">
                        <label class="bgstats-input-label">Character Level</label>
                        <input type="number" id="character-level" value="0" min="0" max="200" class="bgstats-number-input">
                    </div>
                    <div class="input-group">
                        <label class="bgstats-input-label">Job Tier</label>
                        <div class="flex gap-2">
                            <button id="job-tier-3rd" class="bgstats-tier-btn active">
                                3rd Job
                            </button>
                            <button id="job-tier-4th" class="bgstats-tier-btn">
                                4th Job
                            </button>
                        </div>
                    </div>
                    <section class="paste-image-section bgstats-paste-section" id="stats-paste-image-section" style="width: 100%;height: 42px; min-height: 42px;">
                        <div class="paste-icon bgstats-paste-btn" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"><strong>Auto-fill Stats</strong> 📋</div>
                        <span class="info-icon bgstats-info-icon" role="img" aria-label="Info" onclick="openHelpSidebar('stats-autofill')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; width: 18px; height: 18px;">?</span>
                    </section>
                </div>
            </div>

            <!-- Sub-tabs for Stats and Skill Mastery -->
            <div class="optimization-sub-tabs" style="display: none;">
                <button class="optimization-sub-tab-button active">Stats</button>
                <button class="optimization-sub-tab-button">Skill Mastery</button>
                <button style="display: none;" class="optimization-sub-tab-button">Skill Details</button>
            </div>

            <!-- Character Stats Sub-tab -->
            <div id="stats-character-stats" class="stats-subtab active">
                <!-- Two-column container: Stats on left, Target Content on right -->
                <div class="stats-two-column-container">
                    <!-- Left Column: Stats List -->
                    <div class="stats-list-column">
                        ${generateStatInputsHTML()}
                    </div>

                    <!-- Right Column: Skill Mastery and Target Content -->
                    <div class="right-column-stack">
                        ${generateMasterySectionHTML()}

                        <!-- Target Content Type Section - Premium redesign -->
                        <div class="bgstats-target-section">
                            <label class="bgstats-target-label">Target Content Type <span class="bgstats-info-inline" role="img" aria-label="Info" onclick="openHelpSidebar('target-stage')">?</span></label>
                            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
                                ${generateContentTypeSelectorHTML()}
                            </div>
                            <!-- Sub-category selector for Stage Hunts and Growth Dungeons -->
                            <select id="target-subcategory" class="bgstats-select mb-2" style="display: none;">
                                <!-- Populated by JavaScript based on content type -->
                            </select>
                            <!-- Final stage selection -->
                            <select id="target-stage" class="bgstats-select" style="display: none;">
                                <!-- Populated by JavaScript based on content type/subcategory selection -->
                            </select>
                        </div>
                    </div>
                    <!-- End Right Column -->
                </div>
            </div>
            <!-- End Character Stats Sub-tab -->

            <!-- Skill Details Sub-tab - Consistent premium styling -->
            <div id="stats-skill-details" class="base-stats-subtab" style="display: none;">
                <div class="bgstats-info-banner">
                    <div style="color: var(--text-primary); font-size: 0.9em; line-height: 1.5;">
                        <strong style="color: var(--accent-primary);">Instructions:</strong> Click on a skill to view its description with calculated values based on your character level.
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr; gap: 20px;">
                    <!-- Left Panel: Compact Skill Icons -->
                    <div class="bgstats-skills-panel">
                        <!-- Skills -->
                        <div style="margin-bottom: 15px;">
                            <div class="bgstats-panel-section-title">Skills</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; gap: 6px; flex-wrap: wrap; max-width: 300px;">
                                    <div id="skill-grid-skills-2nd" style="display: contents;"></div>
                                    <div id="skill-grid-skills-3rd" style="display: contents;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Passives -->
                        <div>
                            <div class="bgstats-panel-section-title">Passives</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; gap: 6px; flex-wrap: wrap; max-width: 300px;">
                                    <div id="skill-grid-passives-2nd" style="display: contents;"></div>
                                    <div id="skill-grid-passives-3rd" style="display: contents;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Skill Description -->
                    <div id="skill-description-panel" class="bgstats-description-panel">
                        <div style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">
                            Select a skill to view its details
                        </div>
                    </div>
                </div>
            </div>
            <!-- End Skill Details Sub-tab -->
        </div>
    `;
}

/**
 * Attach event listeners to character level input
 */
function attachCharacterLevelListener(): void {
    const levelInput = document.getElementById('character-level') as HTMLInputElement;
    if (levelInput) {
        levelInput.addEventListener('change', () => {
            const level = parseInt(levelInput.value) || 0;
            updateSkillCoefficient();
            // Save via loadout store (auto dual-writes to localStorage)
            loadoutStore.updateCharacter({ level });
        });
    }
}

/**
 * Attach event listeners to sub-tab buttons
 */
//function attachSubTabListeners(): void {
//    const subTabContainer = document.querySelector('.optimization-sub-tabs');
//    if (!subTabContainer) return;
//
//    const buttons = subTabContainer.querySelectorAll('.optimization-sub-tab-button');
//    const subTabs: Record<string, string> = {
//        'Stats': 'character-stats',
//        'Skill Mastery': 'skill-mastery',
//        'Skill Details': 'skill-details'
//    };
//
//    buttons.forEach(button => {
//        button.addEventListener('click', () => {
//            const tabName = subTabs[button.textContent || ''];
//            if (tabName) {
//                switchBaseStatsSubTab(tabName);
//            }
//        });
//    });
//}

/**
 * Attach event listener for paste area (OCR stat extraction)
 */
function attachPasteAreaListener(): void {
    const pasteArea = document.getElementById('stats-paste-image-section');
    if (!pasteArea) return;

    pasteArea.addEventListener('paste', async (event: ClipboardEvent) => {
        const items = Array.from(event.clipboardData?.items || []);
        const pastedImage = items.filter(x => x.type.startsWith("image/"))[0];
        if (!pastedImage) return;

        const file = pastedImage.getAsFile();
        if (!file) return;

        const imageURL = URL.createObjectURL(file);
        const extractedText = await extractText(imageURL, false);
        try {
            const parsedStats = parseBaseStatText(extractedText);
            for (const parsedStat of parsedStats) {
                const inputElement = document.getElementById(parsedStat[0]) as HTMLInputElement;
                if (inputElement) {
                    inputElement.value = parsedStat[1];
                    // Add a permanent outline until the input is changed again
                    inputElement.style.outline = '2px solid #95b993'; // Outline color
                    inputElement.addEventListener('input', () => {
                        inputElement.style.outline = ''; // Reset to default on change
                    }, { once: true });

                    const className = loadoutStore.getCharacter().class;
                    const primaryInput = document.getElementById('primary-main-stat') as HTMLInputElement;
                    const secondaryInput = document.getElementById('secondary-main-stat') as HTMLInputElement;

                    const statType = getStatType(className, parsedStat[0]);
                    if (statType === STAT_TYPE.PRIMARY) {
                        primaryInput.value = parsedStat[1] || '1000';
                    } else if (statType === STAT_TYPE.SECONDARY) {
                        secondaryInput.value = parsedStat[1] || '1000';
                    }
                }
            }

            if (parsedStats.length > 0) {
                showToast(`Parsing successful! ${parsedStats.length} stats updated`, true);
            } else {
                showToast("Parsing failed! Make sure you are ONLY screenshotting the stats rows from the Character page and nothing else", false);
            }

            // Save all parsed stats via loadout store (auto dual-writes to localStorage)
            const baseStatUpdates: Record<string, number> = {};
            for (const parsedStat of parsedStats) {
                const key = parsedStat[0].replace('-base', '');
                const value = parseFloat(parsedStat[1]) || 0;
                baseStatUpdates[key] = value;
            }
            loadoutStore.updateBaseStats(baseStatUpdates);

            const calculate = getCalculateFunction();
            if (calculate) calculate();
        }
        catch (e) {
            console.error(e);
            showToast(String(e), false);
        }
    });
}

/**
 * Attach event listeners to main stat inputs for syncing with hidden fields
 */
function attachMainStatSyncListeners(): void {
    const strInput = document.getElementById('str') as HTMLInputElement;
    const dexInput = document.getElementById('dex') as HTMLInputElement;
    const intInput = document.getElementById('int') as HTMLInputElement;
    const lukInput = document.getElementById('luk') as HTMLInputElement;

    [strInput, dexInput, intInput, lukInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                syncMainStatsToHidden();
                // Save via loadout store (auto dual-writes to localStorage)
                const value = parseFloat(input.value) || 0;
                loadoutStore.updateBaseStat(input.id, value);
            });
        }
    });
}

/**
 * Attach event listeners to all stat inputs for saving to loadout store
 */
function attachStatInputListeners(): void {
    // Use the centralized ALL_VISIBLE_STATS array
    ALL_VISIBLE_STATS.forEach(statKey => {
        const statId = STAT[statKey].id;
        const input = document.getElementById(statId) as HTMLInputElement;
        if (input) {
            input.addEventListener('input', () => {
                const value = parseFloat(input.value) || 0;
                loadoutStore.updateBaseStat(statId, value);
            });
        }
    });
}

// Sync main stat inputs (STR, DEX, INT, LUK) with hidden primary/secondary fields
export function syncMainStatsToHidden() {
    const className = loadoutStore.getCharacter().class;
    const strInput = document.getElementById('str') as HTMLInputElement;
    const dexInput = document.getElementById('dex') as HTMLInputElement;
    const intInput = document.getElementById('int') as HTMLInputElement;
    const lukInput = document.getElementById('luk') as HTMLInputElement;
    const primaryInput = document.getElementById('primaryMainStat') as HTMLInputElement;
    const secondaryInput = document.getElementById('secondaryMainStat') as HTMLInputElement;

    if (!primaryInput || !secondaryInput) return;

    // Map class to primary/secondary stats
    if (isStrMainStatClass(className)) {
        // Warriors: STR (primary), DEX (secondary)
        if (strInput) primaryInput.value = strInput.value || '1000';
        if (dexInput) secondaryInput.value = dexInput.value || '0';
    } else if (isDexMainStatClass(className)) {
        // Archers: DEX (primary), STR (secondary)
        if (dexInput) primaryInput.value = dexInput.value || '1000';
        if (strInput) secondaryInput.value = strInput.value || '0';
    } else if (isIntMainStatClass(className)) {
        // Mages: INT (primary), LUK (secondary)
        if (intInput) primaryInput.value = intInput.value || '1000';
        if (lukInput) secondaryInput.value = lukInput.value || '0';
    } else if (isLukMainStatClass(className)) {
        // Thieves: LUK (primary), DEX (secondary)
        if (lukInput) primaryInput.value = lukInput.value || '1000';
        if (dexInput) secondaryInput.value = dexInput.value || '0';
    }
}

/**
 * Switch between base stats sub-tabs
 */
//function switchBaseStatsSubTab(subTabName: string): void {
//    // Hide all sub-tabs
//    const subTabs = document.querySelectorAll('.stats-subtab');
//    subTabs.forEach(tab => {
    //    (tab as HTMLElement).style.display = 'none';
//    });
//
//    // Show the selected sub-tab
//    const selectedTab = document.getElementById(`stats-${subTabName}`);
//    if (selectedTab) {
   //     selectedTab.style.display = 'block';
//    }
//
//    // Update button states - get the parent container's buttons
//    const buttons = document.querySelectorAll('#setup-stats .optimization-tab-button');
//    buttons.forEach(button => {
     //   button.classList.remove('active');
//    });
//
//    // Activate button by index
//    const tabIndex: Record<string, number> = { 'character-stats': 0, 'skill-mastery': 1, 'skill-details': 2 };
//    if (tabIndex[subTabName] !== undefined && buttons[tabIndex[subTabName]]) {
      //  buttons[tabIndex[subTabName]].classList.add('active');
//    }
//
//    // If switching to skill details, populate the skills (handled by main.js)
//    if (subTabName === 'skill-details') {
        // Trigger populateSkillDetails from main.js via window
        if (window.populateSkillDetails) {
            window.populateSkillDetails();
        }
//    }
//}

/**
 * Initialize the base stats UI - generates HTML only
 */
export function initializeBaseStatsUI(): void {
    const container = document.getElementById('setup-base-stats');
    if (!container) {
        console.error('Base stats container not found');
        return;
    }

    // Generate HTML only - no event listeners attached here
    container.innerHTML = generateBaseStatsHTML();
}

/**
 * Load base stats UI from saved state
 */
export function loadBaseStatsUI(): void {
    const character = loadoutStore.getCharacter();
    const baseStats = loadoutStore.getBaseStats();

    // Load character level
    const levelInput = document.getElementById('character-level') as HTMLInputElement;
    if (levelInput && character.level > 0) {
        levelInput.value = character.level.toString();
    }

    // Load all stat inputs from store using STAT constant as source of truth
    Object.entries(STAT).forEach(([statKey, stat]) => {
        const value = baseStats[statKey as StatKey];
        const input = document.getElementById(stat.id) as HTMLInputElement;
        if (input) {
            input.value = value.toString();
        }
    });

    // Sync main stats to hidden fields
    syncMainStatsToHidden();
}

/**
 * Attach all event listeners for the base stats UI
 */
export function attachBaseStatsEventListeners(): void {
    attachCharacterLevelListener();
   // attachSubTabListeners();
    attachPasteAreaListener();
    attachMainStatSyncListeners();
    attachStatInputListeners();
}
