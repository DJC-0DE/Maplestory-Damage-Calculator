// Main Entry Point - ES6 Module
// This is the single entry point that orchestrates the entire application

import { initializeRouter } from './router.js';
import { stageDefenses } from './state.js';
import {
    getStats,
    getItemStats,
    getSelectedStageDefense,
    getSelectedClass,
    setSelectedClass,
    getCurrentContentType,
    setCurrentContentType
} from './state.js';
import { calculateDamage } from './calculations/damage-calculations.js';
import { calculateWeaponAttacks } from './calculations/weapon-calculations.js';
import { showToast } from '../utils/notifications.js';
import { calculateStatWeights, calculateStatEquivalency } from './calculations/damage-calculations.js';
import { toggleStatChart } from '../ui/stat-chart.js';
import { loadFromLocalStorage, attachSaveListeners, saveToLocalStorage, exportData, importData, updateAnalysisTabs, getSavedContentTypeData } from './storage.js';
import { rarities, tiers, comparisonItemCount, allItemStatProperties } from './constants.js';
import { updateClassWarning } from './cube/cube-ui.js';
import {
    calculate3rdJobSkillCoefficient,
    calculate4thJobSkillCoefficient,
    getAllDarkKnightSkills,
    DARK_KNIGHT_SKILLS,
    calculateJobSkillPassiveGains
} from './skill-coefficient.js';
import { initializeInnerAbilityAnalysis, switchInnerAbilityTab, toggleLineBreakdown, sortPresetTable, sortTheoreticalTable } from './inner-ability.js';
import { initializeArtifactPotential, sortArtifactTable } from './artifact-potential.js';
import { runScrollSimulation, switchScrollStrategyTab, updateScrollLevelInfo } from './scroll-optimizer.js';
import { initializeArtifacts, switchArtifactPreset, selectArtifactSlot, previewArtifact, equipPreviewedArtifact, cancelPreview, setArtifactStars, setArtifactPotential, clearArtifactSlot } from './artifacts.js';
import {
    initializeCubePotential,
    switchPotentialType,
    selectCubeSlot    
} from './cube/cube-potential.js';
import { runCubeSimulation } from './cube/cube-simulation.js';
import { extractText, parseBaseStatText } from '../utils/ocr.js';
import { loadTheme, toggleTheme } from '../ui/theme.js';
import { initializeHeroPowerPresets, loadHeroPowerPresets, switchPreset, handlePresetEquipped } from '../ui/presets-ui.js';
import { calculateCurrencyUpgrades } from '../ui/weapons-ui.js';
import { toggleSubDetails, toggleDetails } from '../ui/results-display.js';
import { initializeWeapons, updateWeaponBonuses, setWeaponStars, previewStars, resetStarPreview, handleEquippedCheckboxChange, handleWeaponLevelChange } from '../ui/weapons-ui.js';
import { initializeEquipmentSlots, loadEquipmentSlots, unequipItem, equipItem, addEquippedStat, removeEquippedStat, saveEquipmentSlots } from '../ui/equipment-ui.js';
import { calculateEquipmentSlotDPS } from '../ui/results-display.js';
import { switchTab, switchScrollingSubTab } from '../ui/tabs.js';
import { openHelpSidebar, closeHelpSidebar, scrollToSection } from '../ui/help-sidebar.js';
import { displayResults } from '../ui/results-display.js';

// Data extraction functions
// getStats and getItemStats moved to state.js
export { getStats, getItemStats };

export function getWeaponAttackBonus() {
    let totalInventory = 0;
    let equippedBonus = 0;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
            if (!levelInput) return;

            const level = parseInt(levelInput.value) || 0;
            if (level === 0) return;

            const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(rarity, tier, level);
            totalInventory += inventoryAttack;

            if (equippedDisplay && equippedDisplay.style.display !== 'none') {
                equippedBonus = equippedAttack;
            }
        });
    });

    return totalInventory + equippedBonus;
}

// Current content type selection
// currentContentType moved to state.js
export { getCurrentContentType, setCurrentContentType };

// Stage defense functions
export function selectContentType(contentType, skipSave = false) {
    // Update selected state
    setCurrentContentType(contentType);

    // Update UI - remove selected class from all
    document.querySelectorAll('.content-type-selector').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selected class to clicked one
    const selectedEl = document.getElementById(`content-${contentType}`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }

    const subcategorySelect = document.getElementById('target-subcategory');
    const stageSelect = document.getElementById('target-stage-base');
    if (!stageSelect) return;

    // Hide everything first
    if (subcategorySelect) subcategorySelect.style.display = 'none';
    stageSelect.style.display = 'none';

    if (contentType === 'none') {
        stageSelect.value = 'none';
        if (!skipSave) {
            saveToLocalStorage();
            updateAnalysisTabs();
        }
        return;
    }

    // For stageHunt and growthDungeon, show subcategory selector
    if (contentType === 'stageHunt' || contentType === 'growthDungeon') {
        populateSubcategoryDropdown(contentType);
        if (subcategorySelect) subcategorySelect.style.display = 'block';
    } else {
        // For chapterBoss and worldBoss, directly show stage dropdown
        stageSelect.style.display = 'block';
        populateStageDropdown(contentType);
    }

    if (!skipSave) {
        saveToLocalStorage();
        updateAnalysisTabs();
    }
}

// Make functions available globally
window.selectContentType = selectContentType;

export function populateSubcategoryDropdown(contentType) {
    const select = document.getElementById('target-subcategory');
    if (!select) return;

    select.innerHTML = '';

    if (contentType === 'stageHunt') {
        // Group by chapter
        for (let ch = 1; ch <= 28; ch++) {
            const opt = document.createElement('option');
            opt.value = `chapter-${ch}`;
            opt.textContent = `Chapter ${ch}`;
            select.appendChild(opt);
        }
    } else if (contentType === 'growthDungeon') {
        // Group by dungeon type
        const types = ['Weapon', 'EXP', 'Equipment', 'Enhancement', 'Hero Training Ground'];
        types.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = `${type} Stages`;
            select.appendChild(opt);
        });
    }

    // Trigger initial population of stage dropdown
    updateStageDropdown();
}

export function updateStageDropdown(skipSave = false) {
    const subcategorySelect = document.getElementById('target-subcategory');
    const stageSelect = document.getElementById('target-stage-base');
    if (!subcategorySelect || !stageSelect) return;

    const subcategory = subcategorySelect.value;

    if (getCurrentContentType() ==='stageHunt') {
        const chapter = subcategory.replace('chapter-', '');
        populateStageDropdownFiltered('stageHunt', chapter);
    } else if (getCurrentContentType() === 'growthDungeon') {
        populateStageDropdownFiltered('growthDungeon', subcategory);
    }

    stageSelect.style.display = 'block';

    // Save the subcategory selection (unless we're loading from storage)
    if (!skipSave) {
        saveToLocalStorage();
        updateAnalysisTabs();
    }
}

// Make updateStageDropdown available globally
window.updateStageDropdown = updateStageDropdown;

export function populateStageDropdownFiltered(contentType, filter) {
    const select = document.getElementById('target-stage-base');
    if (!select) return;

    select.innerHTML = '';

    let entries = [];
    let prefix = '';

    if (contentType === 'stageHunt') {
        // Filter by chapter
        entries = stageDefenses.stageHunts.filter(e => e.stage.startsWith(`${filter}-`));
        prefix = 'stageHunt';
    } else if (contentType === 'growthDungeon') {
        // Filter by dungeon type
        entries = stageDefenses.growthDungeons.filter(e => e.stage.startsWith(filter));
        prefix = 'growthDungeon';
    }

    entries.forEach(entry => {
        const opt = document.createElement('option');
        const identifier = entry.stage;
        opt.value = `${prefix}-${identifier}`;
        const accuracy = entry.accuracy ? `, Acc: ${entry.accuracy}` : '';

        if(contentType === 'worldBoss')
        {
            opt.textContent = `${identifier} (Def: ${Math.floor(entry.defense * 10)} ${accuracy})`;
        } else {
            opt.textContent = `${identifier} (Def: ${Math.floor(entry.defense * 100)} ${accuracy})`;
        }
   
        select.appendChild(opt);
    });
}

export function populateStageDropdown(contentType = null) {
    const select = document.getElementById('target-stage-base');
    if (!select) return;

    select.innerHTML = '';

    // If no content type specified, it's the old initialization - select None by default
    if (!contentType) {
        selectContentType('none', true); // Skip save during initialization
        return;
    }

    let entries = [];
    let prefix = '';

    switch(contentType) {
        case 'chapterBoss':
            entries = stageDefenses.chapterBosses;
            prefix = 'chapterBoss';
            break;
        case 'worldBoss':
            entries = stageDefenses.worldBosses;
            prefix = 'worldBoss';
            break;
        default:
            return;
    }

    entries.forEach(entry => {
        const opt = document.createElement('option');
        const identifier = entry.stage || entry.chapter || entry.boss;
        opt.value = `${prefix}-${identifier}`;
        const label = contentType === 'chapterBoss' ? `Chapter ${identifier}` : identifier;
        const accuracy = entry.accuracy ? `, Acc: ${entry.accuracy}` : '';

        if(contentType === 'worldBoss')
        {
            opt.textContent = `${label} (Def: ${Math.floor(entry.defense * 10)} ${accuracy})`;
        } else {
            opt.textContent = `${label} (Def: ${Math.floor(entry.defense * 100)} ${accuracy})`;
        }
        
        select.appendChild(opt);
    });
}

// getSelectedStageDefense moved to state.js
export { getSelectedStageDefense };

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

// Class Selection
// selectedClass moved to state.js
export { getSelectedClass };

export function selectClass(className) {
    document.querySelectorAll('.class-selector').forEach(el => {
        el.classList.remove('selected');
    });

    const classElement = document.getElementById(`class-${className}`);
    if (classElement) {
        classElement.classList.add('selected');
        setSelectedClass(className);

        const defenseInputGroup = document.getElementById('defense-input-group');
        if (defenseInputGroup) {
            if (className === 'dark-knight') {
                defenseInputGroup.style.display = 'flex';
            } else {
                defenseInputGroup.style.display = 'none';
            }
        }

        // Show/hide main stats based on class
        const strRow = document.getElementById('str-row');
        const dexRow = document.getElementById('dex-row');
        const intRow = document.getElementById('int-row');
        const lukRow = document.getElementById('luk-row');

        // Hide all first
        if (strRow) strRow.style.display = 'none';
        if (dexRow) dexRow.style.display = 'none';
        if (intRow) intRow.style.display = 'none';
        if (lukRow) lukRow.style.display = 'none';

        // Show relevant stats based on class
        if (className === 'hero' || className === 'dark-knight') {
            // Warriors: STR (primary), DEX (secondary)
            if (strRow) strRow.style.display = 'flex';
            if (dexRow) dexRow.style.display = 'flex';
        } else if (className === 'bowmaster' || className === 'marksman') {
            // Archers: DEX (primary), STR (secondary)
            if (dexRow) dexRow.style.display = 'flex';
            if (strRow) strRow.style.display = 'flex';
        } else if (className === 'arch-mage-il' || className === 'arch-mage-fp') {
            // Mages: INT (primary), LUK (secondary)
            if (intRow) intRow.style.display = 'flex';
            if (lukRow) lukRow.style.display = 'flex';
        } else if (className === 'night-lord' || className === 'shadower') {
            // Thieves: LUK (primary), DEX (secondary)
            if (lukRow) lukRow.style.display = 'flex';
            if (dexRow) dexRow.style.display = 'flex';
        }

        // Sync new stat inputs with hidden primary/secondary fields
        syncMainStatsToHidden();

        try {
            localStorage.setItem('selectedClass', className);
        } catch (error) {
            console.error('Error saving selected class:', error);
        }

        // Update class warning in cube potential tab
        updateClassWarning();
    }
}

// Sync main stat inputs (STR, DEX, INT, LUK) with hidden primary/secondary fields
function syncMainStatsToHidden() {
    const className = getSelectedClass();
    const strInput = document.getElementById('str-base');
    const dexInput = document.getElementById('dex-base');
    const intInput = document.getElementById('int-base');
    const lukInput = document.getElementById('luk-base');
    const primaryInput = document.getElementById('primary-main-stat-base');
    const secondaryInput = document.getElementById('secondary-main-stat-base');

    if (!primaryInput || !secondaryInput) return;

    // Map class to primary/secondary stats
    if (className === 'hero' || className === 'dark-knight') {
        // Warriors: STR (primary), DEX (secondary)
        if (strInput) primaryInput.value = strInput.value || 1000;
        if (dexInput) secondaryInput.value = dexInput.value || 0;
    } else if (className === 'bowmaster' || className === 'marksman') {
        // Archers: DEX (primary), STR (secondary)
        if (dexInput) primaryInput.value = dexInput.value || 1000;
        if (strInput) secondaryInput.value = strInput.value || 0;
    } else if (className === 'arch-mage-il' || className === 'arch-mage-fp') {
        // Mages: INT (primary), LUK (secondary)
        if (intInput) primaryInput.value = intInput.value || 1000;
        if (lukInput) secondaryInput.value = lukInput.value || 0;
    } else if (className === 'night-lord' || className === 'shadower') {
        // Thieves: LUK (primary), DEX (secondary)
        if (lukInput) primaryInput.value = lukInput.value || 1000;
        if (dexInput) secondaryInput.value = dexInput.value || 0;
    }
}

// Job Tier Selection
let selectedJobTier = '3rd';

export function getSelectedJobTier() {
    return selectedJobTier;
}

export function selectJobTier(tier) {
    document.querySelectorAll('.job-tier-btn').forEach(el => {
        el.classList.remove('active');
    });

    const tierElement = document.getElementById(`job-tier-${tier}`);
    if (tierElement) {
        tierElement.classList.add('active');
        selectedJobTier = tier;

        // Show/hide appropriate mastery table
        const mastery3rdTable = document.getElementById('mastery-table-3rd');
        const mastery4thTable = document.getElementById('mastery-table-4th');

        if (mastery3rdTable && mastery4thTable) {
            if (tier === '3rd') {
                mastery3rdTable.style.display = 'block';
                mastery4thTable.style.display = 'none';
            } else if (tier === '4th') {
                mastery3rdTable.style.display = 'none';
                mastery4thTable.style.display = 'block';
            }
        }

        // Update skill coefficient for the new tier
        updateSkillCoefficient();

        // Update mastery bonuses for the new tier
        updateMasteryBonuses();

        try {
            localStorage.setItem('selectedJobTier', tier);
        } catch (error) {
            console.error('Error saving selected job tier:', error);
        }

        saveToLocalStorage();
        updateAnalysisTabs();
    }
}

export function updateSkillCoefficient() {
    const levelInput = document.getElementById('character-level');
    const coefficientInput = document.getElementById('skill-coeff-base');

    if (!levelInput || !coefficientInput) return;

    const characterLevel = parseInt(levelInput.value) || 0;
    const jobTier = getSelectedJobTier();

    // Get the skill level for the selected job tier
    let skillLevel = 0;
    if (jobTier === '4th') {
        const skillLevelInput = document.getElementById('skill-level-4th-base');
        skillLevel = parseInt(skillLevelInput?.value) || 0;
    } else {
        const skillLevelInput = document.getElementById('skill-level-3rd-base');
        skillLevel = parseInt(skillLevelInput?.value) || 0;
    }

    let coefficient;
    if (jobTier === '4th') {
        coefficient = calculate4thJobSkillCoefficient(characterLevel, skillLevel);
    } else {
        coefficient = calculate3rdJobSkillCoefficient(characterLevel, skillLevel);
    }

    coefficientInput.value = coefficient.toFixed(2);
}

export function updateMasteryBonuses() {
    // Get current job tier
    const currentTier = getSelectedJobTier();

    // Define mastery bonuses for each tier and level
    const masteryBonuses = {
        '3rd': {
            all: {
                64: 10,
                68: 11,
                76: 12,
                80: 13,
                88: 14,
                92: 15
            },
            boss: {
                72: 10,
                84: 10
            }
        },
        '4th': {
            all: {
                102: 10,
                106: 11,
                116: 12,
                120: 13,
                128: 14,
                132: 15
            },
            boss: {
                111: 10,
                124: 10
            }
        }
    };

    // Calculate totals for the current tier
    let allTotal = 0;
    let bossTotal = 0;

    const tierData = masteryBonuses[currentTier];

    // Sum up "All Monsters" bonuses
    for (const [level, bonus] of Object.entries(tierData.all)) {
        const checkbox = document.getElementById(`mastery-${currentTier}-all-${level}`);
        if (checkbox && checkbox.checked) {
            allTotal += bonus;
        }
    }

    // Sum up "Boss Only" bonuses
    for (const [level, bonus] of Object.entries(tierData.boss)) {
        const checkbox = document.getElementById(`mastery-${currentTier}-boss-${level}`);
        if (checkbox && checkbox.checked) {
            bossTotal += bonus;
        }
    }

    // Update display totals for the current tier
    const allTotalDisplay = document.getElementById(`mastery-${currentTier}-all-total`);
    const bossTotalDisplay = document.getElementById(`mastery-${currentTier}-boss-total`);

    if (allTotalDisplay) {
        allTotalDisplay.textContent = `${allTotal}%`;
    }
    if (bossTotalDisplay) {
        bossTotalDisplay.textContent = `${bossTotal}%`;
    }

    // Update hidden inputs that are used by the calculation engine
    const skillMasteryInput = document.getElementById('skill-mastery-base');
    const skillMasteryBossInput = document.getElementById('skill-mastery-boss-base');

    if (skillMasteryInput) {
        skillMasteryInput.value = allTotal;
    }
    if (skillMasteryBossInput) {
        skillMasteryBossInput.value = bossTotal;
    }

    // Save to localStorage and recalculate
    saveToLocalStorage();
    updateAnalysisTabs();
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

function loadSelectedClass() {
    try {
        const savedClass = localStorage.getItem('selectedClass');
        if (savedClass) {
            selectClass(savedClass);
        }
    } catch (error) {
        console.error('Error loading selected class:', error);
    }
}

function loadSelectedJobTier() {
    try {
        const savedTier = localStorage.getItem('selectedJobTier');
        if (savedTier) {
            selectJobTier(savedTier);
        }
    } catch (error) {
        console.error('Error loading selected job tier:', error);
    }
}

// exportData and importData are now imported above

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
                }
            }

            if (parsedStats.length > 0) {
                showToast(`Parsing successful! ${parsedStats.length} stats updated`, true);
            } else {
                console.log("No supported stats were parsed from the extracted text.");
                showToast("Parsing failed! Make sure you are ONLY screenshotting the stats rows from the Character page and nothing else", false);
            }
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
window.switchTab = switchTab;
window.switchScrollingSubTab = switchScrollingSubTab;
window.toggleTheme = toggleTheme;
window.unequipItem = unequipItem;
window.equipItem = equipItem;
window.addEquippedStat = addEquippedStat;
window.removeEquippedStat = removeEquippedStat;
window.saveEquipmentSlots = saveEquipmentSlots;
window.calculateEquipmentSlotDPS = calculateEquipmentSlotDPS;
window.setWeaponStars = setWeaponStars;
window.previewStars = previewStars;
window.resetStarPreview = resetStarPreview;
window.handleEquippedCheckboxChange = handleEquippedCheckboxChange;
window.handleWeaponLevelChange = handleWeaponLevelChange;
window.calculateCurrencyUpgrades = calculateCurrencyUpgrades;
window.toggleSubDetails = toggleSubDetails;
window.toggleDetails = toggleDetails;
window.switchPreset = switchPreset;
window.handlePresetEquipped = handlePresetEquipped;
window.openHelpSidebar = openHelpSidebar;
window.closeHelpSidebar = closeHelpSidebar;
window.scrollToSection = scrollToSection;
window.toggleStatChart = toggleStatChart;
window.switchInnerAbilityTab = switchInnerAbilityTab;
window.toggleLineBreakdown = toggleLineBreakdown;
window.sortPresetTable = sortPresetTable;
window.sortTheoreticalTable = sortTheoreticalTable;
window.sortArtifactTable = sortArtifactTable;
window.runScrollSimulation = runScrollSimulation;
window.switchScrollStrategyTab = switchScrollStrategyTab;
window.updateScrollLevelInfo = updateScrollLevelInfo;
window.switchArtifactPreset = switchArtifactPreset;
window.selectArtifactSlot = selectArtifactSlot;
window.previewArtifact = previewArtifact;
window.equipPreviewedArtifact = equipPreviewedArtifact;
window.cancelPreview = cancelPreview;
window.setArtifactStars = setArtifactStars;
window.setArtifactPotential = setArtifactPotential;
window.clearArtifactSlot = clearArtifactSlot;
window.switchPotentialType = switchPotentialType;
window.selectCubeSlot = selectCubeSlot;
window.runCubeSimulation = runCubeSimulation;
window.selectClass = selectClass;
window.selectJobTier = selectJobTier;
window.updateMasteryBonuses = updateMasteryBonuses;
window.updateSkillCoefficient = updateSkillCoefficient;
window.switchBaseStatsSubTab = switchBaseStatsSubTab;
window.dismissDonateNotification = dismissDonateNotification;
window.exportData = exportData;
window.importData = importData;
window.showSkillDescription = showSkillDescription;
window.saveToLocalStorage = saveToLocalStorage;
window.updateAnalysisTabs = updateAnalysisTabs;
window.calculateStatEquivalency = calculateStatEquivalency;
window.calculate = calculate;
