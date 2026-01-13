// Main Entry Point - ES6 Module
// This is the single entry point that orchestrates the entire application

import { initializeRouter } from '@core/router.js';
import {
    getStats,
    getItemStats,
    getSelectedClass,
    getWeaponAttackBonus,
    getSelectedJobTier
} from '@core/state.js';
import { calculateDamage } from '@core/calculations/damage-calculations.js';
import { showToast } from '@utils/notifications.js';
import { calculateStatWeights } from '@core/calculations/damage-calculations.js';
import { loadFromLocalStorage, attachSaveListeners, saveToLocalStorage, getSavedContentTypeData } from '@core/storage.js';
import { comparisonItemCount, allItemStatProperties } from '@core/constants.js';
import {
    calculate3rdJobSkillCoefficient,
    calculate4thJobSkillCoefficient,
    getAllDarkKnightSkills,
    DARK_KNIGHT_SKILLS,
    calculateJobSkillPassiveGains
} from '@core/skill-coefficient.js';
import { initializeInnerAbilityAnalysis} from '@core/inner-ability.js';
import { initializeArtifactPotential } from '@core/artifact-potential.js';
import { initializeArtifacts } from '@core/artifacts.js';
import {
    initializeCubePotential
} from '@core/cube/cube-potential.js';
import {
    populateStageDropdown, selectContentType, updateStageDropdown
} from '@core/base-stats/target-select.js';
import { extractText, parseBaseStatText } from '@utils/ocr.js';
import { loadTheme } from '@utils/theme.js';
import { initializeHeroPowerPresets, loadHeroPowerPresets} from '@ui/presets-ui.js';
import { initializeWeapons, updateWeaponBonuses} from '@core/weapon-levels/weapons-ui.js';
import { initializeEquipmentSlots, loadEquipmentSlots } from '@ui/equipment-ui.js';
import { displayResults } from '@ui/results-display.js';
import { initializeCompanionsUI } from '@ui/companions-ui.js';
import { updateMasteryBonuses } from './base-stats/mastery-bonus.js';
import { getStatType, isDexMainStatClass, isIntMainStatClass, isLukMainStatClass, isStrMainStatClass, loadSelectedClass, loadSelectedJobTier, selectClass, selectJobTier } from './base-stats/class-select.js';
import { updateSkillCoefficient } from './base-stats/base-stats.js';
import '@utils/tabs.js';
import '@utils/stat-chart.js';
import '@ui/help-sidebar.js';

// Data extraction functions
// getStats and getItemStats moved to state.js
export { getStats, getItemStats };

// Apply item stats to base stats
export function applyItemToStats(baseStats, equippedItem, comparisonItem) {
    const newStats = { ...baseStats };
    const weaponAttackBonus = getWeaponAttackBonus();
    const weaponMultiplier = 1 + (weaponAttackBonus / 100);

    // Special handling for mainStat and defense (Dark Knight conversion)
    let mainStatChange = 0;
    mainStatChange -= equippedItem.mainStat;
    mainStatChange += comparisonItem.mainStat;

    // For Dark Knight: defense converts to main stat (but is NOT affected by main stat %)
    const currentClass = getSelectedClass();
    if (currentClass === 'dark-knight') {
        mainStatChange -= equippedItem.defense * 0.127;
        mainStatChange += comparisonItem.defense * 0.127;
    }

    // Convert main stat change to stat damage (100 main stat = 1% stat damage)
    newStats.statDamage += mainStatChange / 100;

    // Apply attack with weapon multiplier
    newStats.attack -= equippedItem.attack * weaponMultiplier;
    newStats.attack += comparisonItem.attack * weaponMultiplier;

    // Apply skillLevel changes using proper coefficient calculation
    // Get character level and current job tier
    const characterLevel = parseInt(document.getElementById('character-level')?.value) || 0;
    const jobTier = getSelectedJobTier();

    // Get all job tier base levels (needed for both coefficient calc and passive gains)
    const baseSkillLevel1st = parseInt(document.getElementById('skill-level-1st-base')?.value) || 0;
    const baseSkillLevel2nd = parseInt(document.getElementById('skill-level-2nd-base')?.value) || 0;
    const baseSkillLevel3rd = parseInt(document.getElementById('skill-level-3rd-base')?.value) || 0;
    const baseSkillLevel4th = parseInt(document.getElementById('skill-level-4th-base')?.value) || 0;
    const defense = parseInt(document.getElementById('defense-base')?.value) || 0;

    // Calculate total skill level for 3rd and 4th job (for coefficient calculation)
    const equipped3rdJobTotal = baseSkillLevel3rd + (equippedItem.skillLevel3rd || 0) + (equippedItem.skillLevelAll || 0);
    const equipped4thJobTotal = baseSkillLevel4th + (equippedItem.skillLevel4th || 0) + (equippedItem.skillLevelAll || 0);
    const comparison3rdJobTotal = baseSkillLevel3rd + (comparisonItem.skillLevel3rd || 0) + (comparisonItem.skillLevelAll || 0);
    const comparison4thJobTotal = baseSkillLevel4th + (comparisonItem.skillLevel4th || 0) + (comparisonItem.skillLevelAll || 0);

    // Calculate coefficient with equipped item's skill level
    const coeffWithEquipped = jobTier === '4th'
        ? calculate4thJobSkillCoefficient(characterLevel, equipped4thJobTotal)
        : calculate3rdJobSkillCoefficient(characterLevel, equipped3rdJobTotal);

    // Calculate coefficient with comparison item's skill level
    const coeffWithComparison = jobTier === '4th'
        ? calculate4thJobSkillCoefficient(characterLevel, comparison4thJobTotal)
        : calculate3rdJobSkillCoefficient(characterLevel, comparison3rdJobTotal);

    // Apply the difference
    newStats.skillCoeff += (coeffWithComparison - coeffWithEquipped);

    // Apply passive skill gains from skill level bonuses
    // Calculate the DIFFERENCE in skill levels between equipped and comparison items for each tier
    const skillLevelDiff1st = (comparisonItem.skillLevel1st || 0) - (equippedItem.skillLevel1st || 0);
    const skillLevelDiff2nd = (comparisonItem.skillLevel2nd || 0) - (equippedItem.skillLevel2nd || 0);
    const skillLevelDiff3rd = (comparisonItem.skillLevel3rd || 0) - (equippedItem.skillLevel3rd || 0);
    const skillLevelDiff4th = (comparisonItem.skillLevel4th || 0) - (equippedItem.skillLevel4th || 0);
    const skillLevelDiffAll = (comparisonItem.skillLevelAll || 0) - (equippedItem.skillLevelAll || 0);

    // Only calculate passive gains if there's a difference in any skill level
    const hasSkillLevelDiff = skillLevelDiff1st !== 0 || skillLevelDiff2nd !== 0 || skillLevelDiff3rd !== 0 ||
        skillLevelDiff4th !== 0 || skillLevelDiffAll !== 0;

    let passiveGainsDiff = { statChanges: {}, breakdown: [], complexPassives: [] };

    if (hasSkillLevelDiff) {
        // Calculate gains at base skill level (with equipped item)
        const basePassiveGains = calculateJobSkillPassiveGains(
            currentClass,
            characterLevel,
            {
                firstJob: 0,
                secondJob: 0,
                thirdJob: 0,
                fourthJob: 0,
                allSkills: 0
            },
            { defense }
        );

        // Calculate gains at base + difference
        const bonusPassiveGains = calculateJobSkillPassiveGains(
            currentClass,
            characterLevel,
            {
                firstJob: skillLevelDiff1st,
                secondJob: skillLevelDiff2nd,
                thirdJob: skillLevelDiff3rd,
                fourthJob: skillLevelDiff4th,
                allSkills: skillLevelDiffAll
            },
            { defense }
        );

        // Calculate the difference in passive gains
        passiveGainsDiff.breakdown = bonusPassiveGains.breakdown;
        passiveGainsDiff.complexPassives = bonusPassiveGains.complexPassives;

        Object.keys(bonusPassiveGains.statChanges).forEach(stat => {
            const baseGain = basePassiveGains.statChanges[stat] || 0;
            const bonusGain = bonusPassiveGains.statChanges[stat] || 0;
            const gainDiff = bonusGain - baseGain;

            passiveGainsDiff.statChanges[stat] = gainDiff;

            if (newStats[stat] !== undefined && gainDiff !== 0) {
                newStats[stat] += gainDiff;
            }
        });
    }

    // Store passive gain breakdown for UI display (only show if there's a difference)
    if (hasSkillLevelDiff) {
        newStats.passiveGainsBreakdown = {
            comparison: passiveGainsDiff
        };
    }

    // Apply final damage multiplicatively (not additively)
    // Final damage formula: (1 + base%) * (1 + equipped%) * (1 + comparison%)
    // We need to remove equipped and add comparison multiplicatively
    const baseFinalDamageMultiplier = 1 + (newStats.finalDamage / 100);
    const equippedFinalDamageMultiplier = 1 + ((equippedItem.finalDamage || 0) / 100);
    const comparisonFinalDamageMultiplier = 1 + ((comparisonItem.finalDamage || 0) / 100);

    // Remove equipped item's multiplicative contribution and add comparison item's
    const newFinalDamageMultiplier = (baseFinalDamageMultiplier / equippedFinalDamageMultiplier) * comparisonFinalDamageMultiplier;
    newStats.finalDamage = (newFinalDamageMultiplier - 1) * 100;

    // Apply all other stats dynamically (excluding finalDamage which we just handled)
    const statsToApply = allItemStatProperties.filter(prop =>
        prop !== 'attack' && prop !== 'mainStat' && prop !== 'defense' &&
        prop !== 'skillLevel1st' && prop !== 'skillLevel2nd' &&
        prop !== 'skillLevel3rd' && prop !== 'skillLevel4th' && prop !== 'skillLevelAll' &&
        prop !== 'finalDamage'
    );

    statsToApply.forEach(prop => {
        if (newStats[prop] !== undefined) {
            newStats[prop] -= equippedItem[prop] || 0;
            newStats[prop] += comparisonItem[prop] || 0;
        }
    });

    return newStats;
}

// Main calculation orchestration
export function calculate() {
    const baseStats = getStats('base');
    const equippedItem = getItemStats('equipped');

    let resultsHTML = '';

    const equippedBossResults = calculateDamage(baseStats, 'boss');
    const equippedNormalResults = calculateDamage(baseStats, 'normal');
    const equippedDamageValues = {
        expectedDamageBoss: equippedBossResults.expectedDamage,
        dpsBoss: equippedBossResults.dps,
        expectedDamageNormal: equippedNormalResults.expectedDamage,
        dpsNormal: equippedNormalResults.dps
    };

    resultsHTML += displayResults(equippedItem.name || 'Currently Equipped', baseStats, 'equipped', true, null);

    const comparisonItems = [];
    for (let i = 1; i <= comparisonItemCount; i++) {
        const element = document.getElementById(`comparison-item-${i}`);
        if (element) {
            const item = getItemStats(`item-${i}`);
            item.id = i;
            comparisonItems.push(item);
        }
    }

    comparisonItems.forEach(item => {
        const itemStats = applyItemToStats(baseStats, equippedItem, item);
        resultsHTML += displayResults(item.name || `Item ${item.id}`, itemStats, `item-${item.id}`, false, equippedDamageValues);
    });

    document.getElementById('results-container').innerHTML = resultsHTML || '<p style="text-align: center; color: #b3d9ff;">Add comparison items to see results</p>';

    calculateStatWeights('base', baseStats);
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
    const buttons = document.querySelectorAll('#setup-base-stats .tab-button');
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
    initializeArtifactPotential();
    initializeEquipmentSlots();
    loadEquipmentSlots();
    initializeArtifacts();
    initializeCubePotential();
    initializeCompanionsUI();
    attachSaveListeners();
    if (loaded) {
        updateWeaponBonuses();
    } else {
        calculate();
    }
    showDonateNotificationIfNeeded();
    loadSelectedClass();
    loadSelectedJobTier();
    updateSkillCoefficient();

    // Force initialize all default active tabs to ensure CSS applies correctly
    // This fixes issues where Tailwind CDN loads after custom CSS
    initializeDefaultTabStates();
};

// Initialize default tab active states on page load
function initializeDefaultTabStates() {
    // Use requestAnimationFrame to ensure DOM is ready and Tailwind has loaded
    requestAnimationFrame(() => {
        // Find all tab button containers
        const tabContainers = [
            document.querySelector('#analysis-inner-ability .flex.flex-wrap'),
            document.querySelector('#analysis-scroll-optimizer .flex.flex-wrap'),
            document.querySelector('#analysis-cube-potential #tab-container-main'),
            document.querySelector('#analysis-cube-potential #tab-container-cube-tab'),
            document.querySelector('#cube-main-selected-content .flex.flex-wrap:has(#cube-tab-comparison)')
        ].filter(Boolean);

        tabContainers.forEach(container => {
            const buttons = container.querySelectorAll('.tab-button');
            if (buttons.length > 0) {
                // Ensure first button in each container has active class
                const firstButton = buttons[0];
                if (!firstButton.classList.contains('active')) {
                    firstButton.classList.add('active');
                }
            }
        });
    });
}

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
            console.log('Parsed Stats:', parsedStats);
            for (const parsedStat of parsedStats) {
                console.log(`Setting ${parsedStat[0]} to ${parsedStat[1]}`);
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
                console.log("No supported stats were parsed from the extracted text.");
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
window.updateMasteryBonuses = updateMasteryBonuses;
window.updateSkillCoefficient = updateSkillCoefficient;
window.switchBaseStatsSubTab = switchBaseStatsSubTab;
window.dismissDonateNotification = dismissDonateNotification;
window.calculate = calculate;
