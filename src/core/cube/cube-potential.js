// Cube Potential Calculator - Orchestrator
// Coordinates between UI and business logic components

import { slotNames } from './cube-potential-data.js';
import { getSelectedClass } from '../main.js';
import { loadCubePotentialData, calculateComparison, getRarityColor } from './cube-logic.js';
import { setupCubeSlotSelector, updateSlotButtonColors, setupCubeTabs, updateCubePotentialUI, displayComparisonResults, displayOrCalculateRankings, updateClassWarning, displayAllSlotsSummary, loadRankingsInBackground } from './cube-ui.js';

// Global state - shared with UI and logic modules
export let currentCubeSlot = 'helm';
export let currentPotentialType = 'regular'; // 'regular' or 'bonus'
export let cubeSlotData = {}; // Stores data for all slots
export let rankingsCache = {}; // Cache rankings by slot and rarity: rankingsCache[slotId][rarity]
export let rankingsInProgress = {}; // Track which slot+rarity combinations are currently calculating

// Initialize cube potential system
export async function initializeCubePotential() {
    // Initialize all slots with default data (both regular and bonus potential)
    slotNames.forEach(slot => {
        cubeSlotData[slot.id] = {
            regular: {
                rarity: 'normal',
                setA: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                },
                setB: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                }
            },
            bonus: {
                rarity: 'normal',
                setA: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                },
                setB: {
                    line1: { stat: '', value: 0 },
                    line2: { stat: '', value: 0 },
                    line3: { stat: '', value: 0 }
                }
            }
        };
    });

    // Load saved data from localStorage
    loadCubePotentialData(cubeSlotData, slotNames);

    // Set up slot selector (colors are applied during setup)
    setupCubeSlotSelector();

    // Set up tab switching
    await setupCubeTabs();

    // Populate dropdowns for current slot
    updateCubePotentialUI();

    // Check if class is selected and show warning if not
    updateClassWarning();
}

// Clear rankings cache and recalculate if needed (called when base stats change)
export function clearCubeRankingsCache() {
    // Clear all cached rankings
    rankingsCache = {};

    // Also clear in-progress trackers
    rankingsInProgress = {};

    // If comparison tab is visible, recalculate (which will reload rankings)
    const comparisonContent = document.getElementById('cube-comparison-content');
    if (comparisonContent && comparisonContent.style.display !== 'none') {
        calculateComparisonOrchestrator();
    }

    // If rankings tab is visible, recalculate rankings
    const rankingsContent = document.getElementById('cube-rankings-content');
    if (rankingsContent && rankingsContent.style.display !== 'none') {
        displayOrCalculateRankings();
    }

    // If summary tab is visible, update summary
    const summaryContent = document.getElementById('cube-main-summary-content');
    if (summaryContent && summaryContent.style.display !== 'none') {
        displayAllSlotsSummary();
    }
}

// Switch between regular and bonus potential
export function switchPotentialType(type) {
    currentPotentialType = type;

    // Update button states
    document.getElementById('cube-regular-potential-btn').classList.toggle('active', type === 'regular');
    document.getElementById('cube-bonus-potential-btn').classList.toggle('active', type === 'bonus');

    // Update UI for current potential type
    updateCubePotentialUI();

    // Update rarity selector
    const raritySelector = document.getElementById('cube-rarity-selector');
    if (raritySelector) {
        raritySelector.value = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    }

    // Update slot button colors based on current potential type
    updateSlotButtonColors();

    // If comparison tab is visible, recalculate
    const comparisonContent = document.getElementById('cube-comparison-content');
    if (comparisonContent && comparisonContent.style.display !== 'none') {
        calculateComparisonOrchestrator();
    }

    // If rankings tab is visible, update rankings
    const rankingsContent = document.getElementById('cube-rankings-content');
    if (rankingsContent && rankingsContent.style.display !== 'none') {
        displayOrCalculateRankings();
    }
}

// Select a cube slot
export function selectCubeSlot(slotId) {
    currentCubeSlot = slotId;

    // Update active state on buttons
    document.querySelectorAll('.cube-slot-btn').forEach(btn => {
        const isActive = btn.dataset.slot === slotId;
        btn.classList.toggle('active', isActive);

        // Enhance glow for active slot
        if (isActive) {
            const slotRarity = cubeSlotData[slotId]?.[currentPotentialType]?.rarity || 'normal';
            const rarityColor = getRarityColor(slotRarity);
            btn.style.boxShadow = `0 4px 16px ${rarityColor}60, 0 0 0 2px ${rarityColor}`;
        } else {
            const slotRarity = cubeSlotData[btn.dataset.slot]?.[currentPotentialType]?.rarity || 'normal';
            const rarityColor = getRarityColor(slotRarity);
            btn.style.boxShadow = `0 2px 8px ${rarityColor}40`;
        }
    });

    // Update rarity selector
    const raritySelector = document.getElementById('cube-rarity-selector');
    if (raritySelector) {
        raritySelector.value = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    }

    // Update UI for this slot
    updateCubePotentialUI();

    // If rankings tab is visible, update rankings display
    const rankingsContent = document.getElementById('cube-rankings-content');
    if (rankingsContent && rankingsContent.style.display !== 'none') {
        displayOrCalculateRankings();
    }

    // If comparison tab is visible, recalculate comparison (which will trigger rankings load if needed)
    const comparisonContent = document.getElementById('cube-comparison-content');
    if (comparisonContent && comparisonContent.style.display !== 'none') {
        calculateComparisonOrchestrator();
    }
}

// Calculate comparison between Set A and Set B (orchestrator)
export function calculateComparisonOrchestrator() {
    if (!getSelectedClass()) {
        updateClassWarning();
        return;
    }

    // Use the business logic function to calculate the comparison
    const results = calculateComparison(cubeSlotData, currentCubeSlot, currentPotentialType, rankingsCache);

    if (!results) return;

    // Display results
    displayComparisonResults(results.setAGain, results.setBGain, results.deltaGain, results.setAStats, results.setBStats);

    // Start loading rankings in the background if not already loaded
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    if (!rankingsCache[slotId]?.[rarity]) {
        loadRankingsInBackground(slotId, rarity, results.setAGain, results.setBGain);
    }

    // If summary tab is visible, update it
    const summaryContent = document.getElementById('cube-main-summary-content');
    if (summaryContent && summaryContent.style.display !== 'none') {
        displayAllSlotsSummary();
    }
}
