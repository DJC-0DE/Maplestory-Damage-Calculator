// Main Entry Point - ES6 Module
// This is the single entry point that orchestrates the entire application

import { rarities, tiers, stageDefenses, availableStats, comparisonItemCount, setComparisonItemCount } from './constants.js';
import { calculateDamage, calculateWeaponAttacks, calculateStatWeights, formatNumber, toggleStatChart, calculateStatEquivalency } from './calculations.js';
import { loadFromLocalStorage, attachSaveListeners, saveToLocalStorage, exportData, importData, updateAnalysisTabs, getSavedContentTypeData } from './storage.js';
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
    updateUpgradePriorityChain,
    calculateCurrencyUpgrades,
    toggleSubDetails,
    toggleDetails,
    switchPreset,
    handlePresetEquipped,
    openHelpSidebar,
    closeHelpSidebar,
    scrollToSection
} from './ui.js';
import { initializeInnerAbilityAnalysis, switchInnerAbilityTab, toggleLineBreakdown, sortPresetTable, sortTheoreticalTable, renderPresetComparison, renderTheoreticalBest } from './inner-ability.js';
import { initializeArtifactPotential, renderArtifactPotential, sortArtifactTable } from './artifact-potential.js';
import { runScrollSimulation, switchScrollStrategyTab, updateScrollLevelInfo } from './scroll-optimizer.js';
import { initializeArtifacts, switchArtifactPreset, selectArtifactSlot, previewArtifact, equipPreviewedArtifact, cancelPreview, setArtifactStars, setArtifactPotential, clearArtifactSlot } from './artifacts.js';
import {
    initializeCubePotential,
    switchPotentialType,
    selectCubeSlot,
    calculateComparison,
    displayOrCalculateRankings,
    displayAllSlotsSummary,
    saveCubePotentialData,
    loadCubePotentialData,
    clearCubeRankingsCache,
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

    newStats.skillCoeff -= equippedItem.skillLevel * 0.3;
    newStats.skillCoeff += comparisonItem.skillLevel * 0.3;

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
        console.log('[LOAD] Retrieved content type data:', contentTypeData);
        if (contentTypeData && contentTypeData.contentType) {
            console.log('[LOAD] Restoring content type:', contentTypeData.contentType);
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
                    console.log('[LOAD] Restored selected stage:', contentTypeData.selectedStage);
                }
            }
        } else {
            console.log('[LOAD] No content type to restore');
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
};

// Expose functions to window for HTML onclick handlers
window.switchTab = switchTab;
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
window.calculate = calculate;
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
window.dismissDonateNotification = dismissDonateNotification;
window.exportData = exportData;
window.importData = importData;
window.getStats = getStats;
window.getItemStats = getItemStats;
window.getWeaponAttackBonus = getWeaponAttackBonus;
window.renderPresetComparison = renderPresetComparison;
window.renderTheoreticalBest = renderTheoreticalBest;
window.renderArtifactPotential = renderArtifactPotential;
window.clearCubeRankingsCache = clearCubeRankingsCache;
window.saveToLocalStorage = saveToLocalStorage;
window.updateAnalysisTabs = updateAnalysisTabs;
window.calculateStatEquivalency = calculateStatEquivalency;
