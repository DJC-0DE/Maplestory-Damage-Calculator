// Main Entry Point - ES6 Module
// This is the single entry point that orchestrates the entire application

import { initializeRouter } from '@core/router.js';
import {
    getStats,
    getItemStats,
    getSelectedClass,
    getSelectedJobTier
} from '@core/state/state.js';
import { StatCalculationService } from '@core/services/stat-calculation-service.js';
import { showToast } from '@utils/notifications.js';
import { formatDPS } from '@utils/formatters.js';
import { calculateStatWeights } from '@core/calculations/damage-calculations.js';
import { loadFromLocalStorage, attachSaveListeners, saveToLocalStorage, getSavedContentTypeData, finalizeContributedStatsAfterInit } from '@core/state/storage.js';
import {
    getAllDarkKnightSkills,
    DARK_KNIGHT_SKILLS
} from '@core/features/skills/skill-coefficient.js';
import { initializeInnerAbilityAnalysis} from '@core/features/inner-ability/inner-ability.js';
import { initializeScrollingAnalysis } from '@core/features/scrolling/scrolling.js';
import { initializeArtifactPotential } from '@core/features/artifacts/artifact-potential.js';
import { initializeArtifacts } from '@core/features/artifacts/artifacts.js';
import {
    initializeCubePotential
} from '@core/cube/cube-potential.js';
import { applyItemToStats } from '@core/services/item-comparison-service.js';
import {
    populateStageDropdown, selectContentType, updateStageDropdown
} from '@core/base-stats/target-select.js';
import { extractText, parseBaseStatText } from '@utils/ocr.js';
import { loadTheme } from '@utils/theme.js';
import { initializeHeroPowerPresets, loadHeroPowerPresets} from '@ui/presets-ui.js';
import { initializeWeapons, updateWeaponBonuses} from '@core/weapon-levels/weapons-ui.js';
import { initializeEquipmentTab, migrateLegacyData } from '@ui/equipment/equipment-tab.js';
import { initializeSlotComparison, getCurrentSlot } from '@ui/comparison/slot-comparison.js';
import { initializeComparisonState } from '@core/state/comparison-state.js';
import { displayResults } from '@ui/results-display.js';
import { initializeCompanionsUI } from '@ui/companions-ui.js';
import { refreshPresetsUI } from '@ui/companions-presets-ui.js';
import { initializeStatBreakdown, updateStatBreakdown } from '@ui/stat-breakdown-ui.js';
import { updateMasteryBonuses } from './base-stats/mastery-bonus.js';
import { getStatType, isDexMainStatClass, isIntMainStatClass, isLukMainStatClass, isStrMainStatClass, loadSelectedClass, loadSelectedJobTier, selectClass, selectJobTier, selectMasteryTab } from './base-stats/class-select.js';
import { updateSkillCoefficient } from './base-stats/base-stats.js';
import '@utils/tabs.js';
import '@utils/stat-chart.js';
import '@ui/help-sidebar.js';
import '@core/features/scrolling/scroll-optimizer.js';

// Data extraction functions
// getStats and getItemStats moved to state.js
export { getStats, getItemStats };

// Main calculation orchestration
export function calculate() {
    const baseStats = getStats('base');
    const equippedItem = getItemStats('equipped');

    let resultsHTML = '';

    // Calculate equipped item DPS using StatCalculationService
    const equippedService = new StatCalculationService(baseStats, null);
    const equippedBossResults = equippedService.compute('boss');
    const equippedNormalResults = equippedService.compute('normal');
    const equippedDamageValues = {
        expectedDamageBoss: equippedBossResults.expectedDamage,
        dpsBoss: equippedBossResults.dps,
        expectedDamageNormal: equippedNormalResults.expectedDamage,
        dpsNormal: equippedNormalResults.dps
    };

    resultsHTML += displayResults(equippedItem.name || 'Currently Equipped', baseStats, 'equipped', true, null);

    // Get comparison items for the current slot
    const currentSlot = getCurrentSlot();
    const comparisonItems = [];

    // Find all comparison item tabs for the current slot
    const tabsContainer = document.getElementById('comparison-tabs-container');
    if (tabsContainer) {
        const slotTabs = tabsContainer.querySelectorAll(`[id^="comparison-tab-${currentSlot}-"]`);
        slotTabs.forEach(tab => {
            // Extract itemId from tab ID (format: comparison-tab-{slot}-{itemId})
            const tabIdParts = tab.id.replace('comparison-tab-', '').split('-');
            const itemId = tabIdParts[tabIdParts.length - 1];

            const item = getItemStats(`item-${currentSlot}-${itemId}`);
            if (item) {
                item.id = itemId;
                comparisonItems.push(item);
            }
        });
    }

    comparisonItems.forEach(item => {
        // Build context object for applyItemToStats
        const context = {
            currentClass: getSelectedClass(),
            characterLevel: parseInt(document.getElementById('character-level')?.value) || 0,
            jobTier: getSelectedJobTier(),
            baseSkillLevel1st: parseInt(document.getElementById('skill-level-1st-base')?.value) || 0,
            baseSkillLevel2nd: parseInt(document.getElementById('skill-level-2nd-base')?.value) || 0,
            baseSkillLevel3rd: parseInt(document.getElementById('skill-level-3rd-base')?.value) || 0,
            baseSkillLevel4th: parseInt(document.getElementById('skill-level-4th-base')?.value) || 0,
            defense: parseInt(document.getElementById('defense-base')?.value) || 0
        };

        const itemStats = applyItemToStats(baseStats, equippedItem, item, context);
        resultsHTML += displayResults(item.name || `Item ${item.id}`, itemStats, `item-${currentSlot}-${item.id}`, false, equippedDamageValues);
    });

    document.getElementById('results-container').innerHTML = resultsHTML || '<p style="text-align: center; color: #b3d9ff;">Add comparison items to see results</p>';

    calculateStatWeights('base', baseStats);

    // Refresh preset DPS comparisons when base stats change
    refreshPresetsUI();

    // Update sidebar DPS summary
    const sidebarDpsElement = document.getElementById('sidebar-dps-value');
    if (sidebarDpsElement) {
        sidebarDpsElement.textContent = formatDPS(equippedBossResults.dps);
    }
}

// Donation notification functions
function showDonateNotificationIfNeeded() {
    try {
        const today = new Date().toDateString();
        const lastShown = localStorage.getItem('donateNotificationLastShown');

        if (lastShown !== today) {
            const notification = document.getElementById('donate-notification');
            if (notification) {
                notification.style.display = 'block';

                setTimeout(() => {
                    dismissDonateNotification();
                }, 15000);

                localStorage.setItem('donateNotificationLastShown', today);
            }
        }
    } catch (error) {
        console.error('Error showing donate notification:', error);
    }
}

export function dismissDonateNotification() {
    const notification = document.getElementById('donate-notification');
    if (notification) {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.style.display = 'none';
            notification.style.animation = 'slideIn 0.4s ease-out';
        }, 300);
    }
}

function enableGlobalNumberInputAutoSelect() {
    document.addEventListener('focusin', (e) => {
        const t = e.target;
        if (t && t.tagName === 'INPUT' && t.type === 'number') {
            t.select();
        }
    });
}

// Sync main stat inputs (STR, DEX, INT, LUK) with hidden primary/secondary fields
export function syncMainStatsToHidden() {
    const className = getSelectedClass();
    const strInput = document.getElementById('str-base');
    const dexInput = document.getElementById('dex-base');
    const intInput = document.getElementById('int-base');
    const lukInput = document.getElementById('luk-base');
    const primaryInput = document.getElementById('primary-main-stat-base');
    const secondaryInput = document.getElementById('secondary-main-stat-base');

    if (!primaryInput || !secondaryInput) return;

    // Map class to primary/secondary stats
    if (isStrMainStatClass(className)) {
        // Warriors: STR (primary), DEX (secondary)
        if (strInput) primaryInput.value = strInput.value || 1000;
        if (dexInput) secondaryInput.value = dexInput.value || 0;
    } else if (isDexMainStatClass(className)) {
        // Archers: DEX (primary), STR (secondary)
        if (dexInput) primaryInput.value = dexInput.value || 1000;
        if (strInput) secondaryInput.value = strInput.value || 0;
    } else if (isIntMainStatClass(className)) {
        // Mages: INT (primary), LUK (secondary)
        if (intInput) primaryInput.value = intInput.value || 1000;
        if (lukInput) secondaryInput.value = lukInput.value || 0;
    } else if (isLukMainStatClass(className)) {
        // Thieves: LUK (primary), DEX (secondary)
        if (lukInput) primaryInput.value = lukInput.value || 1000;
        if (dexInput) secondaryInput.value = dexInput.value || 0;
    }
}

export function switchBaseStatsSubTab(subTabName) {
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
    const buttons = document.querySelectorAll('#setup-base-stats .tab-button, #setup-base-stats .optimization-sub-tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    // Activate button - Find the button by matching the onclick attribute
    // This works both when called from a click event and during initialization
    buttons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${subTabName}'`)) {
            btn.classList.add('active');
        }
    });

    // If switching to skill details, populate the skills
    if (subTabName === 'skill-details') {
        populateSkillDetails();
    }
}

// Generate SKILL_DATA from DARK_KNIGHT_SKILLS (consolidated in skill-coefficient.js)
const SKILL_DATA = (() => {
    const allSkills = Object.values(DARK_KNIGHT_SKILLS);

    return {
        skills: {
            secondJob: allSkills.filter(s => !s.isPassive && s.jobTier === 'secondJob'),
            thirdJob: allSkills.filter(s => !s.isPassive && s.jobTier === 'thirdJob')
        },
        passives: {
            secondJob: allSkills.filter(s => s.isPassive && s.jobTier === 'secondJob'),
            thirdJob: allSkills.filter(s => s.isPassive && s.jobTier === 'thirdJob')
        }
    };
})();

function populateSkillDetails() {
    const characterLevel = parseInt(document.getElementById('character-level').value) || 0;

    // Get skill levels for each job tier
    const skillLevel2nd = parseInt(document.getElementById('skill-level-2nd-base')?.value) || 0;
    const skillLevel3rd = parseInt(document.getElementById('skill-level-3rd-base')?.value) || 0;

    // Calculate effective levels for each tier using the same logic as coefficient calculation
    // 2nd Job: min(characterLevel * 3, 90) + skillLevel
    const baseInputLevel2nd = Math.min(characterLevel * 3, 90);
    const effectiveLevel2nd = baseInputLevel2nd + skillLevel2nd;

    // 3rd Job: min((characterLevel - 60) * 3, 120) + skillLevel
    const baseInputLevel3rd = Math.max(0, Math.min((characterLevel - 60) * 3, 120));
    const effectiveLevel3rd = baseInputLevel3rd + skillLevel3rd;

    // Get skills for both tiers (2nd uses its effective level, 3rd uses its effective level)
    const skills2nd = getAllDarkKnightSkills(effectiveLevel2nd);
    const skills3rd = getAllDarkKnightSkills(effectiveLevel3rd);

    // Store both for use in showSkillDescription
    window.currentSkillData = {
        skills2nd,
        skills3rd,
        effectiveLevel2nd,
        effectiveLevel3rd,
        baseInputLevel2nd,
        baseInputLevel3rd,
        characterLevel,
        skillLevel2nd,
        skillLevel3rd
    };

    // Helper function to render skill cards (compact icon-only version)
    const renderSkillCard = (skill, category, jobTier) => {
        return `
            <div class="skill-card" onclick="showSkillDescription('${skill.key}', '${category}', '${jobTier}')"
                 title="${skill.name}"
                 style="width: 48px; height: 48px; padding: 4px; cursor: pointer; border-radius: 8px; border: 2px solid var(--border-color); background: var(--background); transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
                 onmouseover="this.style.borderColor='var(--accent-primary)'; this.style.transform='scale(1.1)'"
                 onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='scale(1)'">
                <img src="${skill.icon}" alt="${skill.name}" style="width: 40px; height: 40px; object-fit: contain;">
            </div>
        `;
    };

    // Populate Skills - 2nd Job
    const skillsGrid2nd = document.getElementById('skill-grid-skills-2nd');
    if (skillsGrid2nd) {
        skillsGrid2nd.innerHTML = SKILL_DATA.skills.secondJob.map(skill =>
            renderSkillCard(skill, 'skills', 'secondJob')
        ).join('');
    }

    // Populate Skills - 3rd Job
    const skillsGrid3rd = document.getElementById('skill-grid-skills-3rd');
    if (skillsGrid3rd) {
        skillsGrid3rd.innerHTML = SKILL_DATA.skills.thirdJob.map(skill =>
            renderSkillCard(skill, 'skills', 'thirdJob')
        ).join('');
    }

    // Populate Passives - 2nd Job
    const passivesGrid2nd = document.getElementById('skill-grid-passives-2nd');
    if (passivesGrid2nd) {
        passivesGrid2nd.innerHTML = SKILL_DATA.passives.secondJob.map(skill =>
            renderSkillCard(skill, 'passives', 'secondJob')
        ).join('');
    }

    // Populate Passives - 3rd Job
    const passivesGrid3rd = document.getElementById('skill-grid-passives-3rd');
    if (passivesGrid3rd) {
        passivesGrid3rd.innerHTML = SKILL_DATA.passives.thirdJob.map(skill =>
            renderSkillCard(skill, 'passives', 'thirdJob')
        ).join('');
    }
}

export function showSkillDescription(skillKey, category, jobTier) {
    // Use the stored skill data if available, otherwise recalculate
    if (!window.currentSkillData) {
        populateSkillDetails();
    }

    const { skills2nd, skills3rd, effectiveLevel2nd, effectiveLevel3rd, baseInputLevel2nd, baseInputLevel3rd, characterLevel, skillLevel2nd, skillLevel3rd } = window.currentSkillData;

    // Get the skill data from the appropriate category and job tier
    const skillDataList = SKILL_DATA[category][jobTier];
    const skillData = skillDataList.find(s => s.key === skillKey);

    if (!skillData) return;

    // Use the appropriate skill set based on job tier
    const allSkills = jobTier === 'secondJob' ? skills2nd : skills3rd;
    const effectiveLevel = jobTier === 'secondJob' ? effectiveLevel2nd : effectiveLevel3rd;
    const baseInputLevel = jobTier === 'secondJob' ? baseInputLevel2nd : baseInputLevel3rd;
    const skillLevel = jobTier === 'secondJob' ? skillLevel2nd : skillLevel3rd;

    const skillValues = jobTier === 'secondJob'
        ? allSkills.secondJobSkills[skillKey]
        : allSkills.thirdJobSkills[skillKey];

    if (!skillValues) return;

    // Map skill values to effect placeholders
    const effectsHTML = skillData.effects.map(effect => {
        let filledEffect = effect;

        // Replace placeholders with actual values
        Object.keys(skillValues).forEach(key => {
            if (key !== 'name') {
                const placeholder = `{${key}}`;
                if (filledEffect.includes(placeholder)) {
                    filledEffect = filledEffect.replace(placeholder, skillValues[key]);
                }
            }
        });

        return `<div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 0.95em;">
            ${filledEffect}
        </div>`;
    }).join('');

    // Determine the skill type label
    const categoryLabel = category === 'skills' ? 'Skill' : 'Passive';
    const jobLabel = jobTier === 'secondJob' ? '2nd Job' : '3rd Job';

    const panel = document.getElementById('skill-description-panel');
    if (panel) {
        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${skillData.icon}" alt="${skillData.name}" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 10px;">
                <h3 style="color: var(--accent-primary); font-size: 1.3em; font-weight: 700; margin-bottom: 5px;">
                    ${skillData.name}
                </h3>
                <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 5px;">
                    ${jobLabel} ${categoryLabel}
                </div>
                <div style="color: var(--text-secondary); font-size: 0.85em;">
                    ${jobTier === 'secondJob'
                ? `Character Level: ${characterLevel} → Input Level: ${baseInputLevel}${skillLevel > 0 ? ` + ${skillLevel} Skill = ${effectiveLevel}` : ''}`
                : `Character Level: ${characterLevel} → Input Level: ${baseInputLevel}${skillLevel > 0 ? ` + ${skillLevel} Skill = ${effectiveLevel}` : ''}`
            }
                </div>
            </div>
            <div style="background: rgba(0, 122, 255, 0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="color: var(--text-secondary); font-size: 0.9em; line-height: 1.6;">
                    ${skillData.description}
                </div>
            </div>
            <div style="background: var(--background); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
                <div style="font-weight: 600; color: var(--accent-primary); margin-bottom: 10px; font-size: 0.95em;">
                    Effects:
                </div>
                ${effectsHTML}
            </div>
        `;
    }
}

// Initialize application
window.onload = function () {
    initializeRouter(); // Initialize routing system first
    loadTheme();
    loadSelectedClass();
    initializeHeroPowerPresets();
    initializeWeapons();
    populateStageDropdown(); // This sets contentType to 'none' without saving
    enableGlobalNumberInputAutoSelect();
    const loaded = loadFromLocalStorage();

    // Restore content type AFTER loading data (to avoid overwriting during load)
    if (loaded) {
        const contentTypeData = getSavedContentTypeData();
        if (contentTypeData && contentTypeData.contentType) {
            selectContentType(contentTypeData.contentType, true); // Skip save, just restore UI

            // Restore subcategory if applicable
            if (contentTypeData.subcategory && (contentTypeData.contentType === 'stageHunt' || contentTypeData.contentType === 'growthDungeon')) {
                const subcategorySelect = document.getElementById('target-subcategory');
                if (subcategorySelect) {
                    subcategorySelect.value = contentTypeData.subcategory;
                    updateStageDropdown(true); // Skip save during load
                }
            }

            // Restore the selected stage from the dropdown
            if (contentTypeData.selectedStage) {
                const stageSelect = document.getElementById('target-stage-base');
                if (stageSelect) {
                    stageSelect.value = contentTypeData.selectedStage;
                }
            }
        }
    }

    loadHeroPowerPresets();
    initializeInnerAbilityAnalysis();
    initializeScrollingAnalysis();
    initializeArtifactPotential();
    initializeEquipmentTab();
    initializeComparisonState(); // Initialize comparison state manager before UI
    initializeSlotComparison();
    migrateLegacyData();
    initializeArtifacts();
    initializeCubePotential();
    initializeCompanionsUI();

    // After all modules are initialized, finalize ContributedStats with data from localStorage
    // This must happen after cube potential and companions initialize so their data is available
    if (loaded) {
        finalizeContributedStatsAfterInit();
    }

    initializeStatBreakdown();
    attachSaveListeners();
    if (loaded) {
        updateWeaponBonuses();
    } else {
        calculate();
    }
    showDonateNotificationIfNeeded();

    loadSelectedJobTier();
    updateSkillCoefficient();
};

document.addEventListener('DOMContentLoaded', () => {
    const pasteArea = document.getElementById('base-stats-paste-image-section');

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
            calculate();
        }
        catch (e) {
            console.error(e);
            showToast(e, false);
        }

    });

    // Add event listeners to main stat inputs to sync with hidden fields
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

    // Initialize main stat visibility on page load
    const selectedClass = getSelectedClass();
    if (selectedClass) {
        selectClass(selectedClass);
    }
});

// Expose functions to window for HTML onclick handlers
window.showSkillDescription = showSkillDescription;
window.selectClass = selectClass;
window.selectJobTier = selectJobTier;
window.selectMasteryTab = selectMasteryTab;
window.updateMasteryBonuses = updateMasteryBonuses;
window.updateSkillCoefficient = updateSkillCoefficient;
window.switchBaseStatsSubTab = switchBaseStatsSubTab;
window.dismissDonateNotification = dismissDonateNotification;
window.calculate = calculate;
