// Base Stats UI - HTML Generation and Event Handlers
// This file handles all HTML generation and UI event handling for the base stats tab

import { selectClass, selectJobTier, selectMasteryTab, getStatType } from './class-select.js';
import { updateMasteryBonuses } from './mastery-bonus.js';
import { updateSkillCoefficient } from './base-stats.js';
import { saveToLocalStorage, updateAnalysisTabs } from '@core/state/storage.js';
import { selectContentType, updateStageDropdown } from './target-select.js';
import { extractText, parseBaseStatText } from '@utils/ocr.js';
import { getSelectedClass } from '@core/state/state.js';
import { showToast } from '@utils/notifications.js';
import { syncMainStatsToHidden } from '../main.js';

// Import calculate dynamically to avoid circular dependency
function getCalculateFunction() {
    return window.calculate;
}

// Classes configuration for generating class selector HTML
export const CLASSES = [
    { id: 'hero', name: 'Hero', image: 'media/classes/hero.png' },
    { id: 'dark-knight', name: 'Dark Knight', image: 'media/classes/dk.png' },
    { id: 'bowmaster', name: 'Bowmaster', image: 'media/classes/bowmaster.png' },
    { id: 'marksman', name: 'Marksman', image: 'media/classes/marksman.png' },
    { id: 'night-lord', name: 'Night Lord', image: 'media/classes/nl.png' },
    { id: 'shadower', name: 'Shadower', image: 'media/classes/shadower.png' },
    { id: 'arch-mage-il', name: 'Arch Mage (I/L)', image: 'media/classes/mage-il.png' },
    { id: 'arch-mage-fp', name: 'Arch Mage (F/P)', image: 'media/classes/mage-fp.png' }
];

// Content type configuration for generating content selector HTML
export const CONTENT_TYPES = [
    { id: 'none', name: 'None', icon: '🎯', title: 'Training Dummy' },
    { id: 'stageHunt', name: 'Stage Hunt', icon: '🗺️', title: 'Stage Hunt' },
    { id: 'chapterBoss', name: 'Chapter Boss', icon: '👑', title: 'Chapter Boss' },
    { id: 'worldBoss', name: 'World Boss', icon: '🌍', title: 'World Boss' },
    { id: 'growthDungeon', name: 'Growth Dungeon', icon: '📈', title: 'Growth Dungeon' }
];

// Mastery bonus configuration for 3rd job
const MASTERY_3RD = {
    all: [
        { level: 64, bonus: 10 },
        { level: 68, bonus: 11 },
        { level: 76, bonus: 12 },
        { level: 80, bonus: 13 },
        { level: 88, bonus: 14 },
        { level: 92, bonus: 15 }
    ],
    boss: [
        { level: 72, bonus: 10 },
        { level: 84, bonus: 10 }
    ]
};

// Mastery bonus configuration for 4th job
const MASTERY_4TH = {
    all: [
        { level: 102, bonus: 10 },
        { level: 106, bonus: 11 },
        { level: 116, bonus: 12 },
        { level: 120, bonus: 13 },
        { level: 128, bonus: 14 },
        { level: 132, bonus: 15 }
    ],
    boss: [
        { level: 111, bonus: 10 },
        { level: 124, bonus: 10 }
    ]
};

// Stat input configuration for generating stat input HTML
const STAT_INPUTS = [
    // Core Combat Stats
    { id: 'attack-base', label: 'Attack', type: 'number', value: 500 },
    { id: 'defense-base', label: 'Defense', type: 'number', value: 0, info: 'defense' },
    { id: 'crit-rate-base', label: 'Critical Rate (%)', type: 'number', step: '0.1', value: 15 },
    { id: 'crit-damage-base', label: 'Critical Damage (%)', type: 'number', step: '0.1', value: 15 },
    { id: 'attack-speed-base', label: 'Attack Speed (%)', type: 'number', step: '0.1', value: 0 },
    // Main Stats
    { id: 'str-base', label: 'STR', type: 'number', value: 1000, rowId: 'str-row' },
    { id: 'dex-base', label: 'DEX', type: 'number', value: 0, rowId: 'dex-row' },
    { id: 'int-base', label: 'INT', type: 'number', value: 1000, rowId: 'int-row' },
    { id: 'luk-base', label: 'LUK', type: 'number', value: 0, rowId: 'luk-row' },
    // Damage Modifiers
    { id: 'stat-damage-base', label: 'Stat Prop. Damage (%)', type: 'number', step: '0.1', value: 0 },
    { id: 'damage-base', label: 'Damage (%)', type: 'number', step: '0.1', value: 10 },
    { id: 'damage-amp-base', label: 'Damage Amplification (x)', type: 'number', step: '0.1', value: 0 },
    { id: 'basic-attack-damage-base', label: 'Basic Attack Damage (%)', type: 'number', step: '0.1', value: 0, hidden: true },
    { id: 'skill-damage-base', label: 'Skill Damage (%)', type: 'number', step: '0.1', value: 0, hidden: true },
    { id: 'def-pen-base', label: 'Defense Penetration (%)', type: 'number', step: '0.1', value: 0, info: 'def-pen' },
    { id: 'boss-damage-base', label: 'Boss Monster Damage (%)', type: 'number', step: '0.1', value: 10 },
    { id: 'normal-damage-base', label: 'Normal Monster Damage (%)', type: 'number', step: '0.1', value: 0 },
    { id: 'min-damage-base', label: 'Min Damage Multiplier (%)', type: 'number', step: '0.1', value: 50 },
    { id: 'max-damage-base', label: 'Max Damage Multiplier (%)', type: 'number', step: '0.1', value: 100 },
    { id: 'final-damage-base', label: 'Final Damage (%)', type: 'number', step: '0.1', value: 0 },
    // Skill Levels
    { id: 'skill-level-1st-base', label: '1st Job Skill Level', type: 'number', value: 0, min: 0, onChange: true },
    { id: 'skill-level-2nd-base', label: '2nd Job Skill Level', type: 'number', value: 0, min: 0, onChange: true },
    { id: 'skill-level-3rd-base', label: '3rd Job Skill Level', type: 'number', value: 0, min: 0, onChange: true },
    { id: 'skill-level-4th-base', label: '4th Job Skill Level', type: 'number', value: 0, min: 0, onChange: true },
    // Main Stat %
    { id: 'main-stat-pct-base', label: 'Current Main Stat %', type: 'number', step: '0.1', value: 0, info: 'main-stat-pct' }
];

/**
 * Generate HTML for class selector cards
 */
function generateClassSelectorHTML() {
    return CLASSES.map(cls => `
        <div id="class-${cls.id}" class="class-selector bgstats-class-card" title="${cls.title || cls.name}">
            <div class="bgstats-class-image-wrapper">
                <img src="${cls.image}" alt="${cls.name}" class="bgstats-class-image">
            </div>
            <span class="bgstats-class-name">${cls.name}</span>
        </div>
    `).join('');
}

/**
 * Generate HTML for content type selector cards
 */
function generateContentTypeSelectorHTML() {
    return CONTENT_TYPES.map(content => `
        <div id="content-${content.id}" class="content-type-selector bgstats-content-card" title="${content.title}">
            <span class="bgstats-content-icon">${content.icon}</span>
            <span class="bgstats-content-name">${content.name}</span>
        </div>
    `).join('');
}

/**
 * Generate HTML for a single stat input row
 */
function generateStatInputHTML(stat) {
    const infoIcon = stat.info
        ? `<span class="bgstats-info-inline" role="img" aria-label="Info" onclick="openHelpSidebar('${stat.info}')">?</span>`
        : '';

    const onChangeAttr = stat.onChange
        ? 'onchange="updateSkillCoefficient(); saveToLocalStorage()"'
        : '';

    const hiddenStyle = stat.hidden ? 'style="display: none;"' : '';
    const rowId = stat.rowId ? `id="${stat.rowId}"` : '';
    const minAttr = stat.min !== undefined ? `min="${stat.min}"` : '';
    const stepAttr = stat.step ? `step="${stat.step}"` : '';

    return `
        <div class="bgstats-stat-row" ${rowId} ${hiddenStyle}>
            <label class="bgstats-stat-label">${stat.label} ${infoIcon}</label>
            <input type="${stat.type}" id="${stat.id}" value="${stat.value}" ${minAttr} ${stepAttr} ${onChangeAttr} class="bgstats-stat-input">
        </div>
    `;
}

/**
 * Generate HTML for stat inputs
 */
function generateStatInputsHTML() {
    let html = '';

    // Core Combat Stats
    html += STAT_INPUTS.filter(s => ['attack-base', 'defense-base', 'crit-rate-base', 'crit-damage-base', 'attack-speed-base'].includes(s.id))
        .map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Main Stats
    html += STAT_INPUTS.filter(s => ['str-base', 'dex-base', 'int-base', 'luk-base'].includes(s.id))
        .map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Damage Modifiers
    html += STAT_INPUTS.filter(s => ['stat-damage-base', 'damage-base', 'damage-amp-base', 'basic-attack-damage-base', 'skill-damage-base', 'def-pen-base', 'boss-damage-base', 'normal-damage-base', 'min-damage-base', 'max-damage-base', 'final-damage-base'].includes(s.id))
        .map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Skill Levels
    html += STAT_INPUTS.filter(s => ['skill-level-1st-base', 'skill-level-2nd-base', 'skill-level-3rd-base', 'skill-level-4th-base'].includes(s.id))
        .map(generateStatInputHTML).join('');
    html += '<div class="bgstats-divider"></div>';

    // Main Stat %
    html += STAT_INPUTS.filter(s => ['main-stat-pct-base'].includes(s.id))
        .map(generateStatInputHTML).join('');

    // Hidden fields
    html += `
        <input type="hidden" id="primary-main-stat-base" value="1000">
        <input type="hidden" id="secondary-main-stat-base" value="0">
        <input type="hidden" id="skill-mastery-base" value="21">
        <input type="hidden" id="skill-mastery-boss-base" value="0">
        <input type="hidden" id="skill-coeff-base" value="0">
    `;

    return html;
}

/**
 * Generate HTML for mastery table rows
 */
function generateMasteryTableRows(tier, type) {
    const masteryData = tier === '3rd' ? MASTERY_3RD : MASTERY_4TH;
    const items = masteryData[type];

    let rows = '';
    const allLevels = new Set();
    const bossLevels = new Set();

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
function generateMasteryTableHTML(tier) {
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
                    ${generateMasteryTableRows(tier)}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Generate the complete HTML for the base stats tab
 */
export function generateBaseStatsHTML() {
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
                    <section class="paste-image-section bgstats-paste-section" id="base-stats-paste-image-section" style="width: 100%;height: 42px; min-height: 42px;">
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
            <div id="base-stats-character-stats" class="base-stats-subtab active">
                <!-- Two-column container: Stats on left, Target Content on right -->
                <div class="stats-two-column-container">
                    <!-- Left Column: Stats List -->
                    <div class="stats-list-column">
                        ${generateStatInputsHTML()}
                    </div>

                    <!-- Right Column: Skill Mastery and Target Content -->
                    <div class="right-column-stack">
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
                            <select id="target-stage-base" class="bgstats-select" style="display: none;">
                                <!-- Populated by JavaScript based on content type/subcategory selection -->
                            </select>
                        </div>
                    </div>
                    <!-- End Right Column -->
                </div>
            </div>
            <!-- End Character Stats Sub-tab -->

            <!-- Skill Details Sub-tab - Consistent premium styling -->
            <div id="base-stats-skill-details" class="base-stats-subtab" style="display: none;">
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
 * Attach event listeners to class selector cards
 */
function attachClassSelectorListeners() {
    CLASSES.forEach(cls => {
        const element = document.getElementById(`class-${cls.id}`);
        if (element) {
            element.addEventListener('click', () => selectClass(cls.id));
        }
    });
}

/**
 * Attach event listeners to content type selector cards
 */
function attachContentTypeSelectorListeners() {
    CONTENT_TYPES.forEach(content => {
        const element = document.getElementById(`content-${content.id}`);
        if (element) {
            element.addEventListener('click', () => selectContentType(content.id));
        }
    });
}

/**
 * Attach event listeners to job tier buttons
 */
function attachJobTierListeners() {
    const tier3rd = document.getElementById('job-tier-3rd');
    const tier4th = document.getElementById('job-tier-4th');

    if (tier3rd) {
        tier3rd.addEventListener('click', () => selectJobTier('3rd'));
    }
    if (tier4th) {
        tier4th.addEventListener('click', () => selectJobTier('4th'));
    }
}

/**
 * Attach event listeners to mastery tab buttons
 */
function attachMasteryTabListeners() {
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
function attachMasteryCheckboxListeners() {
    ['3rd', '4th'].forEach(tier => {
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
 * Attach event listeners to character level input
 */
function attachCharacterLevelListener() {
    const levelInput = document.getElementById('character-level');
    if (levelInput) {
        levelInput.addEventListener('change', () => {
            updateSkillCoefficient();
            saveToLocalStorage();
        });
    }
}

/**
 * Attach event listeners to sub-tab buttons
 */
function attachSubTabListeners() {
    const subTabContainer = document.querySelector('.optimization-sub-tabs');
    if (!subTabContainer) return;

    const buttons = subTabContainer.querySelectorAll('.optimization-sub-tab-button');
    const subTabs = {
        'Stats': 'character-stats',
        'Skill Mastery': 'skill-mastery',
        'Skill Details': 'skill-details'
    };

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = subTabs[button.textContent];
            if (tabName) {
                switchBaseStatsSubTab(tabName);
            }
        });
    });
}

/**
 * Attach event listeners to target content dropdowns
 */
function attachTargetContentListeners() {
    const subcategorySelect = document.getElementById('target-subcategory');
    const stageSelect = document.getElementById('target-stage-base');

    if (subcategorySelect) {
        subcategorySelect.addEventListener('change', () => updateStageDropdown());
    }

    if (stageSelect) {
        stageSelect.addEventListener('change', () => {
            saveToLocalStorage();
            updateAnalysisTabs();
        });
    }
}

/**
 * Attach event listener for paste area (OCR stat extraction)
 */
function attachPasteAreaListener() {
    const pasteArea = document.getElementById('base-stats-paste-image-section');
    if (!pasteArea) return;

    pasteArea.addEventListener('paste', async (event) => {
        const items = Array.from(event.clipboardData.items);
        const pastedImage = items.filter(x => x.type.startsWith("image/"))[0];
        if (!pastedImage) return;

        const file = pastedImage.getAsFile();
        const imageURL = URL.createObjectURL(file);
        const extractedText = await extractText(imageURL, false);
        try {
            const parsedStats = parseBaseStatText(extractedText);
            for (const parsedStat of parsedStats) {
                const inputElement = document.getElementById(parsedStat[0]);
                if (inputElement) {
                    inputElement.value = parsedStat[1];
                    // Add a permanent outline until the input is changed again
                    inputElement.style.outline = '2px solid #95b993'; // Outline color
                    inputElement.addEventListener('input', () => {
                        inputElement.style.outline = ''; // Reset to default on change
                    }, { once: true });

                    const className = getSelectedClass();
                    const primaryInput = document.getElementById('primary-main-stat-base');
                    const secondaryInput = document.getElementById('secondary-main-stat-base');

                    const statType = getStatType(className, parsedStat[0]);
                    if (statType === 'primary') {
                        primaryInput.value = parsedStat[1] || 1000;
                    } else if (statType === 'secondary') {
                        secondaryInput.value = parsedStat[1] || 1000;
                    }
                }
            }

            if (parsedStats.length > 0) {
                showToast(`Parsing successful! ${parsedStats.length} stats updated`, true);
            } else {
                showToast("Parsing failed! Make sure you are ONLY screenshotting the stats rows from the Character page and nothing else", false);
            }

            saveToLocalStorage();
            const calculate = getCalculateFunction();
            if (calculate) calculate();
        }
        catch (e) {
            console.error(e);
            showToast(e, false);
        }
    });
}

/**
 * Attach event listeners to main stat inputs for syncing with hidden fields
 */
function attachMainStatSyncListeners() {
    const strInput = document.getElementById('str-base');
    const dexInput = document.getElementById('dex-base');
    const intInput = document.getElementById('int-base');
    const lukInput = document.getElementById('luk-base');

    [strInput, dexInput, intInput, lukInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                syncMainStatsToHidden();
                saveToLocalStorage();
            });
        }
    });
}

/**
 * Switch between base stats sub-tabs
 */
function switchBaseStatsSubTab(subTabName) {
    // Hide all sub-tabs
    const subTabs = document.querySelectorAll('.base-stats-subtab');
    subTabs.forEach(tab => {
        tab.style.display = 'none';
    });

    // Show the selected sub-tab
    const selectedTab = document.getElementById(`base-stats-${subTabName}`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Update button states - get the parent container's buttons
    const buttons = document.querySelectorAll('#setup-base-stats .optimization-sub-tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    // Activate button by index
    const tabIndex = { 'character-stats': 0, 'skill-mastery': 1, 'skill-details': 2 }[subTabName];
    if (tabIndex !== undefined && buttons[tabIndex]) {
        buttons[tabIndex].classList.add('active');
    }

    // If switching to skill details, populate the skills (handled by main.js)
    if (subTabName === 'skill-details') {
        // Trigger populateSkillDetails from main.js via window
        if (window.populateSkillDetails) {
            window.populateSkillDetails();
        }
    }
}

/**
 * Initialize the base stats UI
 */
export function initializeBaseStatsUI() {
    const container = document.getElementById('setup-base-stats');
    if (!container) {
        console.error('Base stats container not found');
        return;
    }

    // Generate HTML
    container.innerHTML = generateBaseStatsHTML();

    // Attach all event listeners
    attachClassSelectorListeners();
    attachContentTypeSelectorListeners();
    attachJobTierListeners();
    attachMasteryTabListeners();
    attachMasteryCheckboxListeners();
    attachCharacterLevelListener();
    attachSubTabListeners();
    attachTargetContentListeners();
    attachPasteAreaListener();
    attachMainStatSyncListeners();
}

// Expose switchBaseStatsSubTab to window for global access
window.switchBaseStatsSubTab = switchBaseStatsSubTab;
