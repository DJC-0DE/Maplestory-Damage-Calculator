// Main Entry Point - ES6 Module
// This is the single entry point that orchestrates the entire application

import { rarities, tiers, stageDefenses, comparisonItemCount } from './constants.js';
import { calculateDamage, calculateWeaponAttacks, calculateStatWeights, toggleStatChart, calculateStatEquivalency } from './calculations.js';
import { loadFromLocalStorage, attachSaveListeners, saveToLocalStorage, exportData, importData, updateAnalysisTabs, getSavedContentTypeData } from './storage.js';
import {
    calculate3rdJobSkillCoefficient,
    calculate4thJobSkillCoefficient,
    getAllDarkKnightSkills,
    DARK_KNIGHT_SKILLS
} from './skill-coefficient.js';
import {
    loadTheme,
    initializeHeroPowerPresets,
    initializeWeapons,
    updateWeaponBonuses,
    loadHeroPowerPresets,
    initializeEquipmentSlots,
    loadEquipmentSlots,
    saveEquipmentSlots,
    calculateEquipmentSlotDPS,
    displayResults,
    switchTab,
    switchScrollingSubTab,
    toggleTheme,
    unequipItem,
    equipItem,
    addEquippedStat,
    removeEquippedStat,
    addComparisonItem,
    removeComparisonItem,
    addComparisonItemStat,
    removeComparisonItemStat,
    setWeaponStars,
    previewStars,
    resetStarPreview,
    handleEquippedCheckboxChange,
    handleWeaponLevelChange,
    calculateCurrencyUpgrades,
    toggleSubDetails,
    toggleDetails,
    switchPreset,
    handlePresetEquipped,
    openHelpSidebar,
    closeHelpSidebar,
    scrollToSection
} from './ui.js';
import { initializeInnerAbilityAnalysis, switchInnerAbilityTab, toggleLineBreakdown, sortPresetTable, sortTheoreticalTable } from './inner-ability.js';
import { initializeArtifactPotential, sortArtifactTable } from './artifact-potential.js';
import { runScrollSimulation, switchScrollStrategyTab, updateScrollLevelInfo } from './scroll-optimizer.js';
import { initializeArtifacts, switchArtifactPreset, selectArtifactSlot, previewArtifact, equipPreviewedArtifact, cancelPreview, setArtifactStars, setArtifactPotential, clearArtifactSlot } from './artifacts.js';
import {
    initializeCubePotential,
    switchPotentialType,
    selectCubeSlot,
    updateClassWarning,
    runCubeSimulation
} from './cube-potential.js';

// Data extraction functions
export function getStats(setup) {
    return {
        attack: parseFloat(document.getElementById(`attack-${setup}`).value),
        critRate: parseFloat(document.getElementById(`crit-rate-${setup}`).value),
        critDamage: parseFloat(document.getElementById(`crit-damage-${setup}`).value),
        statDamage: parseFloat(document.getElementById(`stat-damage-${setup}`).value),
        damage: parseFloat(document.getElementById(`damage-${setup}`).value),
        finalDamage: parseFloat(document.getElementById(`final-damage-${setup}`).value),
        damageAmp: parseFloat(document.getElementById(`damage-amp-${setup}`).value),
        attackSpeed: parseFloat(document.getElementById(`attack-speed-${setup}`).value),
        defPen: parseFloat(document.getElementById(`def-pen-${setup}`).value),
        bossDamage: parseFloat(document.getElementById(`boss-damage-${setup}`).value),
        normalDamage: parseFloat(document.getElementById(`normal-damage-${setup}`).value),
        skillCoeff: parseFloat(document.getElementById(`skill-coeff-${setup}`).value),
        skillMastery: parseFloat(document.getElementById(`skill-mastery-${setup}`).value),
        skillMasteryBoss: parseFloat(document.getElementById(`skill-mastery-boss-${setup}`).value),
        minDamage: parseFloat(document.getElementById(`min-damage-${setup}`).value),
        maxDamage: parseFloat(document.getElementById(`max-damage-${setup}`).value)
    };
}

export function getItemStats(prefix) {
    const stats = {
        name: document.getElementById(`${prefix}-name`)?.value || '',
        attack: parseFloat(document.getElementById(`${prefix}-attack`)?.value) || 0,
        mainStat: 0,
        defense: 0,
        critRate: 0,
        critDamage: 0,
        skillLevel: 0,
        normalDamage: 0,
        bossDamage: 0,
        damage: 0
    };

    // Get stats from dropdown selections
    if (prefix === 'equipped') {
        // Get equipped item stats
        for (let i = 1; i <= 10; i++) {
            const typeElem = document.getElementById(`equipped-stat-${i}-type`);
            const valueElem = document.getElementById(`equipped-stat-${i}-value`);

            if (typeElem && valueElem) {
                const statType = typeElem.value;
                const value = parseFloat(valueElem.value) || 0;

                switch (statType) {
                    case 'attack': stats.attack += value; break;
                    case 'main-stat': stats.mainStat += value; break;
                    case 'defense': stats.defense += value; break;
                    case 'crit-rate': stats.critRate += value; break;
                    case 'crit-damage': stats.critDamage += value; break;
                    case 'skill-level': stats.skillLevel += value; break;
                    case 'normal-damage': stats.normalDamage += value; break;
                    case 'boss-damage': stats.bossDamage += value; break;
                    case 'damage': stats.damage += value; break;
                }
            }
        }
    } else {
        // Get comparison item stats
        const itemId = prefix.split('-')[1];
        for (let i = 1; i <= 10; i++) {
            const typeElem = document.getElementById(`item-${itemId}-stat-${i}-type`);
            const valueElem = document.getElementById(`item-${itemId}-stat-${i}-value`);

            if (typeElem && valueElem) {
                const statType = typeElem.value;
                const value = parseFloat(valueElem.value) || 0;

                switch (statType) {
                    case 'attack': stats.attack += value; break;
                    case 'main-stat': stats.mainStat += value; break;
                    case 'defense': stats.defense += value; break;
                    case 'crit-rate': stats.critRate += value; break;
                    case 'crit-damage': stats.critDamage += value; break;
                    case 'skill-level': stats.skillLevel += value; break;
                    case 'normal-damage': stats.normalDamage += value; break;
                    case 'boss-damage': stats.bossDamage += value; break;
                    case 'damage': stats.damage += value; break;
                }
            }
        }
    }

    return stats;
}

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
let currentContentType = 'none';

// Stage defense functions
export function selectContentType(contentType, skipSave = false) {
    // Update selected state
    currentContentType = contentType;

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

    if (currentContentType === 'stageHunt') {
        const chapter = subcategory.replace('chapter-', '');
        populateStageDropdownFiltered('stageHunt', chapter);
    } else if (currentContentType === 'growthDungeon') {
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
        opt.textContent = `${identifier} (Def: ${entry.defense}%${accuracy})`;
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
        opt.textContent = `${label} (Def: ${entry.defense}%${accuracy})`;
        select.appendChild(opt);
    });
}

export function getSelectedStageDefense() {
    // If none is selected, return early
    if (currentContentType === 'none') {
        return { defense: 0, damageReduction: 0 };
    }

    const select = document.getElementById('target-stage-base');
    if (!select) return { defense: 0, damageReduction: 0 };

    const value = select.value;

    if (value === 'none') {
        return { defense: 0, damageReduction: 0 };
    }

    const [category, ...rest] = value.split('-');
    const identifier = rest.join('-'); // Handle identifiers with dashes like "1000-1"

    if (category === 'stageHunt') {
        const entry = stageDefenses.stageHunts.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'chapterBoss') {
        const entry = stageDefenses.chapterBosses.find(e => e.chapter === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'worldBoss') {
        const entry = stageDefenses.worldBosses.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    } else if (category === 'growthDungeon') {
        const entry = stageDefenses.growthDungeons.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction || 0 } : { defense: 0, damageReduction: 0 };
    }

    return { defense: 0, damageReduction: 0 };
}

// Apply item stats to base stats
export function applyItemToStats(baseStats, equippedItem, comparisonItem) {
    const newStats = { ...baseStats };
    const weaponAttackBonus = getWeaponAttackBonus();
    const weaponMultiplier = 1 + (weaponAttackBonus / 100);

    // For Dark Knight, defense from items needs to be handled specially
    // because it affects main stat which is then multiplied by main stat %
    let mainStatChange = 0;

    // Calculate main stat change from flat main stat on items
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

    // Apply other stats
    newStats.attack -= equippedItem.attack * weaponMultiplier;
    newStats.attack += comparisonItem.attack * weaponMultiplier;

    newStats.critRate -= equippedItem.critRate;
    newStats.critRate += comparisonItem.critRate;

    newStats.critDamage -= equippedItem.critDamage;
    newStats.critDamage += comparisonItem.critDamage;

    // Skill coefficient is already handled by equip/unequip buttons modifying skill-coeff-base
    // So we don't need to apply it here in the comparison
    // newStats.skillCoeff -= equippedItem.skillLevel * 0.3;
    // newStats.skillCoeff += comparisonItem.skillLevel * 0.3;

    newStats.normalDamage -= equippedItem.normalDamage;
    newStats.normalDamage += comparisonItem.normalDamage;

    newStats.bossDamage -= equippedItem.bossDamage;
    newStats.bossDamage += comparisonItem.bossDamage;

    newStats.damage -= equippedItem.damage;
    newStats.damage += comparisonItem.damage;

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
let selectedClass = null;

export function getSelectedClass() {
    return selectedClass;
}

export function selectClass(className) {
    document.querySelectorAll('.class-selector').forEach(el => {
        el.classList.remove('selected');
    });

    const classElement = document.getElementById(`class-${className}`);
    if (classElement) {
        classElement.classList.add('selected');
        selectedClass = className;

        const defenseInputGroup = document.getElementById('defense-input-group');
        if (defenseInputGroup) {
            if (className === 'dark-knight') {
                defenseInputGroup.style.display = 'flex';
            } else {
                defenseInputGroup.style.display = 'none';
            }
        }

        try {
            localStorage.setItem('selectedClass', className);
        } catch (error) {
            console.error('Error saving selected class:', error);
        }

        // Update class warning in cube potential tab
        updateClassWarning();
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

    // Find and activate the clicked button
    event.target.classList.add('active');

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
};

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
window.addComparisonItem = addComparisonItem;
window.removeComparisonItem = removeComparisonItem;
window.addComparisonItemStat = addComparisonItemStat;
window.removeComparisonItemStat = removeComparisonItemStat;
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
