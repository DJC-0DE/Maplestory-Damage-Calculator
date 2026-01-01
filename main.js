// Main Entry Point - ES6 Module
// This is the single entry point that orchestrates the entire application

import { rarities, tiers, stageDefenses, availableStats, comparisonItemCount, setComparisonItemCount } from './constants.js';
import { calculateDamage, calculateWeaponAttacks, calculateStatWeights, formatNumber, toggleStatChart } from './calculations.js';
import { loadFromLocalStorage, attachSaveListeners, saveToLocalStorage, exportData, importData } from './storage.js';
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

// Stage defense functions
export function populateStageDropdown() {
    const select = document.getElementById('target-stage-base');
    if (!select) return;

    select.innerHTML = '';

    const noneOpt = document.createElement('option');
    noneOpt.value = 'none';
    noneOpt.textContent = 'None / Training Dummy (Def: 0%, DR: 0%)';
    select.appendChild(noneOpt);

    const stageHuntsGroup = document.createElement('optgroup');
    stageHuntsGroup.label = 'Stage Hunts';
    stageDefenses.stageHunts.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `stageHunt-${entry.stage}`;
        opt.textContent = `${entry.stage} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        stageHuntsGroup.appendChild(opt);
    });
    select.appendChild(stageHuntsGroup);

    const chapterGroup = document.createElement('optgroup');
    chapterGroup.label = 'Chapter Bosses';
    stageDefenses.chapterBosses.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `chapterBoss-${entry.chapter}`;
        opt.textContent = `Chapter ${entry.chapter} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        chapterGroup.appendChild(opt);
    });
    select.appendChild(chapterGroup);

    const worldBossGroup = document.createElement('optgroup');
    worldBossGroup.label = 'World Bosses';
    stageDefenses.worldBosses.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `worldBoss-${entry.stage}`;
        opt.textContent = `Stage ${entry.stage} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        worldBossGroup.appendChild(opt);
    });
    select.appendChild(worldBossGroup);

    const bossRaidGroup = document.createElement('optgroup');
    bossRaidGroup.label = 'Boss Raids';
    stageDefenses.bossRaids.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = `bossRaid-${entry.boss}`;
        opt.textContent = `${entry.boss} (Def: ${entry.defense}%, DR: ${entry.damageReduction}%)`;
        bossRaidGroup.appendChild(opt);
    });
    select.appendChild(bossRaidGroup);
}

export function getSelectedStageDefense() {
    const select = document.getElementById('target-stage-base');
    if (!select) return { defense: 0, damageReduction: 0 };

    const value = select.value;

    if (value === 'none') {
        return { defense: 0, damageReduction: 0 };
    }

    const [category, identifier] = value.split('-');

    if (category === 'stageHunt') {
        const stage = value.replace('stageHunt-', '');
        const entry = stageDefenses.stageHunts.find(e => e.stage === stage);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    } else if (category === 'chapterBoss') {
        const entry = stageDefenses.chapterBosses.find(e => e.chapter === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    } else if (category === 'worldBoss') {
        const entry = stageDefenses.worldBosses.find(e => e.stage === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    } else if (category === 'bossRaid') {
        const entry = stageDefenses.bossRaids.find(e => e.boss === identifier);
        return entry ? { defense: entry.defense, damageReduction: entry.damageReduction } : { defense: 0, damageReduction: 0 };
    }

    return { defense: 0, damageReduction: 0 };
}

// Apply item stats to base stats
export function applyItemToStats(baseStats, equippedItem, comparisonItem) {
    const newStats = { ...baseStats };
    const weaponAttackBonus = getWeaponAttackBonus();
    const weaponMultiplier = 1 + (weaponAttackBonus / 100);

    // Subtract equipped item
    newStats.attack -= equippedItem.attack * weaponMultiplier;
    newStats.statDamage -= equippedItem.mainStat / 100;
    newStats.statDamage -= (equippedItem.defense * 12.7) / 100;
    newStats.critRate -= equippedItem.critRate;
    newStats.critDamage -= equippedItem.critDamage;
    newStats.skillCoeff -= equippedItem.skillLevel * 0.3;
    newStats.normalDamage -= equippedItem.normalDamage;
    newStats.bossDamage -= equippedItem.bossDamage;
    newStats.damage -= equippedItem.damage;

    // Add comparison item
    newStats.attack += comparisonItem.attack * weaponMultiplier;
    newStats.statDamage += comparisonItem.mainStat / 100;
    newStats.statDamage += (comparisonItem.defense * 12.7) / 100;
    newStats.critRate += comparisonItem.critRate;
    newStats.critDamage += comparisonItem.critDamage;
    newStats.skillCoeff += comparisonItem.skillLevel * 0.3;
    newStats.normalDamage += comparisonItem.normalDamage;
    newStats.bossDamage += comparisonItem.bossDamage;
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
    populateStageDropdown();
    enableGlobalNumberInputAutoSelect();
    const loaded = loadFromLocalStorage();
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
window.getWeaponAttackBonus = getWeaponAttackBonus;
window.renderPresetComparison = renderPresetComparison;
window.renderTheoreticalBest = renderTheoreticalBest;
window.renderArtifactPotential = renderArtifactPotential;
window.clearCubeRankingsCache = clearCubeRankingsCache;
