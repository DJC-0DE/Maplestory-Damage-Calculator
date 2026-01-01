// Cube Potential Calculator
// Allows comparing potential lines and ranking all possible combinations

import { slotNames, classMainStatMap, slotSpecificPotentials, rankingsPerPage, RARITY_UPGRADE_RATES, equipmentPotentialData } from './cube-potential-data.js';
import { rarities } from './constants.js';
import { calculateDamage, formatNumber, calculateMainStatPercentGain } from './calculations.js';
import { getSelectedClass } from './main.js';

// Global state
let currentCubeSlot = 'helm';
let currentPotentialType = 'regular'; // 'regular' or 'bonus'
let cubeSlotData = {}; // Stores data for all slots
let rankingsCache = {}; // Cache rankings by slot and rarity: rankingsCache[slotId][rarity]
let rankingsInProgress = {}; // Track which slot+rarity combinations are currently calculating

// Initialize cube potential system
export function initializeCubePotential() {
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
    loadCubePotentialData();

    // Set up slot selector (colors are applied during setup)
    setupCubeSlotSelector();

    // Set up tab switching
    setupCubeTabs();

    // Populate dropdowns for current slot
    updateCubePotentialUI();

    // Check if class is selected and show warning if not
    updateClassWarning();
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
        calculateComparison();
    }

    // If rankings tab is visible, update rankings
    const rankingsContent = document.getElementById('cube-rankings-content');
    if (rankingsContent && rankingsContent.style.display !== 'none') {
        currentRankingsPage = 1;
        displayOrCalculateRankings();
    }
}

// Get rarity color for slot button borders
export function getRarityColor(rarity) {
    const colors = {
        'normal': '#9ca3af',      // Gray
        'rare': '#60a5fa',        // Blue
        'epic': '#a78bfa',        // Purple
        'unique': '#fbbf24',      // Yellow/Gold
        'legendary': '#33ce85',   // Green
        'mystic': '#ff3f42'       // Red
    };
    return colors[rarity] || colors['normal'];
}

// Setup slot selector
export function setupCubeSlotSelector() {
    const slotSelector = document.getElementById('cube-slot-selector');
    if (!slotSelector) return;

    slotSelector.innerHTML = '';

    slotNames.forEach(slot => {
        const slotBtn = document.createElement('button');
        slotBtn.className = 'cube-slot-btn';
        slotBtn.textContent = slot.name;
        slotBtn.dataset.slot = slot.id;

        // Apply rarity color to border (based on current potential type)
        const slotRarity = cubeSlotData[slot.id]?.[currentPotentialType]?.rarity || 'normal';
        const rarityColor = getRarityColor(slotRarity);
        slotBtn.style.borderColor = rarityColor;

        // Apply active state and enhanced glow
        const isActive = slot.id === currentCubeSlot;
        if (isActive) {
            slotBtn.classList.add('active');
            slotBtn.style.boxShadow = `0 4px 16px ${rarityColor}60, 0 0 0 2px ${rarityColor}`;
        } else {
            slotBtn.style.boxShadow = `0 2px 8px ${rarityColor}40`;
        }

        slotBtn.addEventListener('click', () => selectCubeSlot(slot.id));
        slotSelector.appendChild(slotBtn);
    });

    // Setup rarity selector (separate from slot selector now)
    setupRaritySelector();
}

// Update slot button colors (call this when rarity changes)
export function updateSlotButtonColors() {
    slotNames.forEach(slot => {
        const slotBtn = document.querySelector(`.cube-slot-btn[data-slot="${slot.id}"]`);
        if (!slotBtn) return;

        const slotRarity = cubeSlotData[slot.id]?.[currentPotentialType]?.rarity || 'normal';
        const rarityColor = getRarityColor(slotRarity);
        slotBtn.style.borderColor = rarityColor;

        // Apply enhanced glow for active slot, normal glow for others
        const isActive = slot.id === currentCubeSlot;
        if (isActive) {
            slotBtn.style.boxShadow = `0 4px 16px ${rarityColor}60, 0 0 0 2px ${rarityColor}`;
        } else {
            slotBtn.style.boxShadow = `0 2px 8px ${rarityColor}40`;
        }
    });
}

// Setup rarity selector for current slot
export function setupRaritySelector() {
    const raritySelector = document.getElementById('cube-rarity-selector');
    if (!raritySelector) return;

    // Clear existing options
    raritySelector.innerHTML = '';

    const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic'];
    rarities.forEach(rarity => {
        const option = document.createElement('option');
        option.value = rarity;
        option.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1);
        raritySelector.appendChild(option);
    });

    raritySelector.value = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    raritySelector.onchange = (e) => {
        cubeSlotData[currentCubeSlot][currentPotentialType].rarity = e.target.value;
        updateSlotButtonColors(); // Update slot button border colors
        updateCubePotentialUI(); // This will clear invalid lines
        saveCubePotentialData(); // Save after clearing invalid lines

        // If rankings tab is visible, update rankings display
        const rankingsContent = document.getElementById('cube-rankings-content');
        if (rankingsContent && rankingsContent.style.display !== 'none') {
            currentRankingsPage = 1; // Reset to page 1 when rarity changes
            displayOrCalculateRankings();
        }

        // If comparison tab is visible, recalculate comparison (which will trigger rankings load if needed)
        const comparisonContent = document.getElementById('cube-comparison-content');
        if (comparisonContent && comparisonContent.style.display !== 'none') {
            calculateComparison();
        }
    };
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
        currentRankingsPage = 1; // Reset to page 1 when switching slots
        displayOrCalculateRankings();
    }

    // If comparison tab is visible, recalculate comparison (which will trigger rankings load if needed)
    const comparisonContent = document.getElementById('cube-comparison-content');
    if (comparisonContent && comparisonContent.style.display !== 'none') {
        calculateComparison();
    }
}

// Setup tab switching
export function setupCubeTabs() {
    // Main tabs
    const mainSummaryTab = document.getElementById('cube-main-tab-summary');
    const mainSelectedTab = document.getElementById('cube-main-tab-selected');
    const mainSimulationTab = document.getElementById('cube-main-tab-simulation');
    const mainSummaryContent = document.getElementById('cube-main-summary-content');
    const mainSelectedContent = document.getElementById('cube-main-selected-content');
    const mainSimulationContent = document.getElementById('cube-main-simulation-content');

    // Sub-tabs within Selected Slot
    const comparisonTab = document.getElementById('cube-tab-comparison');
    const rankingsTab = document.getElementById('cube-tab-rankings');
    const comparisonContent = document.getElementById('cube-comparison-content');
    const rankingsContent = document.getElementById('cube-rankings-content');

    // Setup main tab switching
    if (mainSummaryTab && mainSelectedTab && mainSimulationTab && mainSummaryContent && mainSelectedContent && mainSimulationContent) {
        mainSummaryTab.addEventListener('click', () => {
            mainSummaryTab.classList.add('active');
            mainSelectedTab.classList.remove('active');
            mainSimulationTab.classList.remove('active');
            mainSummaryContent.style.display = 'block';
            mainSelectedContent.style.display = 'none';
            mainSimulationContent.style.display = 'none';

            // Display summary and start loading any missing rankings
            displayAllSlotsSummary();
            loadAllRankingsForSummary();
        });

        mainSelectedTab.addEventListener('click', () => {
            mainSelectedTab.classList.add('active');
            mainSummaryTab.classList.remove('active');
            mainSimulationTab.classList.remove('active');
            mainSelectedContent.style.display = 'block';
            mainSummaryContent.style.display = 'none';
            mainSimulationContent.style.display = 'none';
        });

        mainSimulationTab.addEventListener('click', () => {
            mainSimulationTab.classList.add('active');
            mainSummaryTab.classList.remove('active');
            mainSelectedTab.classList.remove('active');
            mainSimulationContent.style.display = 'block';
            mainSummaryContent.style.display = 'none';
            mainSelectedContent.style.display = 'none';
        });
    }

    // Setup sub-tab switching within Selected Slot
    if (comparisonTab && rankingsTab && comparisonContent && rankingsContent) {
        comparisonTab.addEventListener('click', () => {
            comparisonTab.classList.add('active');
            rankingsTab.classList.remove('active');
            comparisonContent.style.display = 'block';
            rankingsContent.style.display = 'none';
        });

        rankingsTab.addEventListener('click', () => {
            rankingsTab.classList.add('active');
            comparisonTab.classList.remove('active');
            rankingsContent.style.display = 'block';
            comparisonContent.style.display = 'none';

            // Check if rankings are ready, if not show them (with loading if needed)
            displayOrCalculateRankings();
        });
    }
}

// Update UI for current slot
export function updateCubePotentialUI() {
    const slotData = cubeSlotData[currentCubeSlot][currentPotentialType];
    const rarity = slotData.rarity;

    // Update dropdowns for Set A
    updatePotentialLineDropdowns('setA', rarity);

    // Update dropdowns for Set B
    updatePotentialLineDropdowns('setB', rarity);

    // Restore saved values
    restorePotentialLineValues('setA', slotData.setA);
    restorePotentialLineValues('setB', slotData.setB);

    // Recalculate comparison
    calculateComparison();
}

// Update potential line dropdowns based on rarity
export function updatePotentialLineDropdowns(setName, rarity) {
    const potentialData = equipmentPotentialData[rarity];
    if (!potentialData) return;

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const statSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`);

        if (!statSelect) continue;

        // Clear existing options
        statSelect.innerHTML = '<option value="">-- Select Stat --</option>';

        // Get available stats for this line
        let lineData = [...(potentialData[`line${lineNum}`] || [])];

        // Add slot-specific lines if available (at the top)
        const slotId = currentCubeSlot;
        if (slotSpecificPotentials[slotId] && slotSpecificPotentials[slotId][rarity]) {
            const slotSpecificLines = slotSpecificPotentials[slotId][rarity][`line${lineNum}`];
            if (slotSpecificLines) {
                lineData = [...slotSpecificLines, ...lineData];
            }
        }

        if (!lineData || lineData.length === 0) continue;

        // Build unique stat list with values
        const statOptions = [];
        lineData.forEach(entry => {
            // Check if stat is percentage-based or flat
            const isPercentStat = entry.stat.includes('%');
            const valueSuffix = isPercentStat ? '%' : ''; // Add % only for percentage stats

            const displayText = entry.prime
                ? `${entry.stat} - ${entry.value}${valueSuffix} (Prime)`
                : `${entry.stat} - ${entry.value}${valueSuffix}`;

            statOptions.push({
                key: `${entry.stat}|${entry.value}|${entry.prime}`,
                text: displayText,
                stat: entry.stat,
                value: entry.value,
                prime: entry.prime
            });
        });

        // Add options to dropdown
        statOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.key;
            option.textContent = opt.text;
            option.dataset.stat = opt.stat;
            option.dataset.value = opt.value;
            option.dataset.prime = opt.prime;
            statSelect.appendChild(option);
        });

        // Add change listener
        statSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            if (selectedOption && selectedOption.dataset.value) {
                // Save to slot data
                const [stat, value, prime] = e.target.value.split('|');
                cubeSlotData[currentCubeSlot][currentPotentialType][setName][`line${lineNum}`] = {
                    stat: stat,
                    value: parseFloat(value),
                    prime: prime === 'true'
                };

                saveCubePotentialData();
                calculateComparison();
            } else {
                cubeSlotData[currentCubeSlot][currentPotentialType][setName][`line${lineNum}`] = {
                    stat: '',
                    value: 0,
                    prime: false
                };
                saveCubePotentialData();
                calculateComparison();
            }
        });
    }
}

// Restore saved values to dropdowns
export function restorePotentialLineValues(setName, setData) {
    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const lineData = setData[`line${lineNum}`];
        const statSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`);

        if (!statSelect) continue;

        if (!lineData || !lineData.stat) {
            // No saved data - just ensure dropdown is empty
            statSelect.value = '';
            continue;
        }

        // Find matching option
        const key = `${lineData.stat}|${lineData.value}|${lineData.prime}`;
        const option = Array.from(statSelect.options).find(opt => opt.value === key);

        if (option) {
            // Line exists in this rarity - restore it
            statSelect.value = key;
        } else {
            // Line doesn't exist in this rarity - just clear dropdown (don't touch saved data)
            statSelect.value = '';
        }
    }
}

// Get main stat for current class
export function getMainStatForClass() {
    if (!getSelectedClass()) return null;
    return classMainStatMap[getSelectedClass()];
}

// Check if a potential line exists in a given rarity for a given slot and line number
export function lineExistsInRarity(slotId, rarity, lineNum, lineStat, lineValue, linePrime) {
    if (!lineStat) return false;

    const potentialData = equipmentPotentialData[rarity];
    if (!potentialData) return false;

    // Get base potential lines for this line number
    let availableLines = [...(potentialData[`line${lineNum}`] || [])];

    // Add slot-specific lines if available
    if (slotSpecificPotentials[slotId] && slotSpecificPotentials[slotId][rarity]) {
        const slotSpecificLines = slotSpecificPotentials[slotId][rarity][`line${lineNum}`];
        if (slotSpecificLines) {
            availableLines = [...slotSpecificLines, ...availableLines];
        }
    }

    // Check if this exact line exists
    return availableLines.some(line =>
        line.stat === lineStat &&
        line.value === lineValue &&
        line.prime === linePrime
    );
}

// Convert potential stat to damage stat
export function potentialStatToDamageStat(potentialStat, value, accumulatedMainStatPct = 0) {
    const mainStat = getMainStatForClass();
    if (!mainStat) return { stat: null, value: 0, isMainStatPct: false };

    // Map potential stat to damage calculation stat
    const statMap = {
        'Critical Rate %': { stat: 'critRate', value: value },
        'Critical Damage %': { stat: 'critDamage', value: value },
        'Attack Speed %': { stat: 'attackSpeed', value: value },
        'Damage %': { stat: 'damage', value: value },
        'Final Damage %': { stat: 'finalDamage', value: value },
        'Min Damage Multiplier %': { stat: 'minDamage', value: value },
        'Max Damage Multiplier %': { stat: 'maxDamage', value: value },
        'Defense %': { stat: 'defense', value: value },
        'Defense Penetration': { stat: 'defPen', value: value },
        'Max HP %': { stat: 'maxHP', value: value },
        'Max MP %': { stat: 'maxMP', value: value }
    };

    // Check if it's a main stat percentage (only count if matches class main stat)
    if (potentialStat === `${mainStat} %`) {
        // Use the shared calculation function for consistency
        const primaryMainStat = parseFloat(document.getElementById('primary-main-stat-base')?.value) || 0;
        const baseMainStatPct = parseFloat(document.getElementById('main-stat-pct-base')?.value) || 0;
        const defense = parseFloat(document.getElementById('defense-base')?.value) || 0;
        const currentSelectedClass = typeof selectedClass !== 'undefined' ? selectedClass : null;

        // Calculate the current main stat % (base + accumulated from previous lines)
        const currentMainStatPct = baseMainStatPct + accumulatedMainStatPct;

        // Use the shared function to calculate stat damage gain
        const statDamageGain = calculateMainStatPercentGain(
            value,
            currentMainStatPct,
            primaryMainStat,
            defense,
            currentSelectedClass
        );

        return { stat: 'statDamage', value: statDamageGain, isMainStatPct: true };
    }

    // Check if it's a flat stat (convert to stat damage if main stat)
    if (potentialStat === mainStat) {
        return { stat: 'statDamage', value: value / 100, isMainStatPct: false }; // 100 main stat = 1% stat damage
    }

    // Return mapped stat or null if not relevant
    const mapped = statMap[potentialStat] || { stat: null, value: 0 };
    return { ...mapped, isMainStatPct: false };
}

// Calculate comparison between Set A and Set B
export function calculateComparison() {
    if (!getSelectedClass()) {
        updateClassWarning();
        return;
    }

    const slotData = cubeSlotData[currentCubeSlot][currentPotentialType];
    const baseStats = getStats('base');

    // Calculate base DPS (no potential lines)
    const baseDPS = calculateDamage(baseStats, 'boss').dps;

    // Calculate Set A stats and DPS (base + Set A lines that exist in current rarity)
    const setAStats = { ...baseStats };
    let setAAccumulatedMainStatPct = 0; // Track accumulated main stat % for diminishing returns
    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const statSelect = document.getElementById(`cube-setA-line${lineNum}-stat`);
        if (!statSelect || !statSelect.value) continue;

        const line = slotData.setA[`line${lineNum}`];
        if (!line || !line.stat) continue;

        const mapped = potentialStatToDamageStat(line.stat, line.value, setAAccumulatedMainStatPct);
        if (mapped.stat) {
            setAStats[mapped.stat] = (setAStats[mapped.stat] || 0) + mapped.value;
            // Track if this was a main stat % line
            if (mapped.isMainStatPct) {
                setAAccumulatedMainStatPct += line.value;
            }
        }
    }
    const setADPS = calculateDamage(setAStats, 'boss').dps;

    // Calculate Set B stats and DPS (base + Set B lines that exist in current rarity)
    const setBStats = { ...baseStats };
    let setBAccumulatedMainStatPct = 0; // Track accumulated main stat % for diminishing returns
    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const statSelect = document.getElementById(`cube-setB-line${lineNum}-stat`);
        if (!statSelect || !statSelect.value) continue;

        const line = slotData.setB[`line${lineNum}`];
        if (!line || !line.stat) continue;

        const mapped = potentialStatToDamageStat(line.stat, line.value, setBAccumulatedMainStatPct);
        if (mapped.stat) {
            setBStats[mapped.stat] = (setBStats[mapped.stat] || 0) + mapped.value;
            // Track if this was a main stat % line
            if (mapped.isMainStatPct) {
                setBAccumulatedMainStatPct += line.value;
            }
        }
    }
    const setBDPS = calculateDamage(setBStats, 'boss').dps;

    // Calculate gains (both compared to base stats with no potential)
    const setAGain = ((setADPS - baseDPS) / baseDPS * 100);
    const setBGain = ((setBDPS - baseDPS) / baseDPS * 100);
    const deltaGain = setBGain - setAGain;

    // Display results
    displayComparisonResults(setAGain, setBGain, deltaGain, setAStats, setBStats);

    // Start loading rankings in the background if not already loaded
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    if (!rankingsCache[slotId]?.[rarity]) {
        loadRankingsInBackground(slotId, rarity, setAGain, setBGain);
    }

    // If summary tab is visible, update it
    const summaryContent = document.getElementById('cube-summary-content');
    if (summaryContent && summaryContent.style.display !== 'none') {
        displayAllSlotsSummary();
    }
}

// Display comparison results
export function displayComparisonResults(setAGain, setBGain, deltaGain, setAStats, setBStats) {
    const resultsDiv = document.getElementById('cube-comparison-results');
    if (!resultsDiv) return;

    const deltaColor = deltaGain >= 0 ? '#4ade80' : '#f87171';
    const deltaSign = deltaGain >= 0 ? '+' : '';

    // Get ranking comparison for Set A and Set B
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    const rankingsReady = rankingsCache[slotId]?.[rarity];

    const setAComparison = rankingsReady ? getRankingComparison(setAGain, rarity) : { percentile: getLoadingPlaceholder(), details: null, chartData: null };
    const setBComparison = rankingsReady ? getRankingComparison(setBGain, rarity) : { percentile: getLoadingPlaceholder(), details: null, chartData: null };

    // Format stats for display
    const formatStats = (stats) => {
        if (!stats) return '';
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85em; text-align: left;">
                <div><strong>Attack:</strong> ${stats.attack.toFixed(2)}</div>
                <div><strong>Crit Rate:</strong> ${stats.critRate.toFixed(2)}%</div>
                <div><strong>Crit Damage:</strong> ${stats.critDamage.toFixed(2)}%</div>
                <div><strong>Stat Damage:</strong> ${stats.statDamage.toFixed(2)}%</div>
                <div><strong>Damage:</strong> ${stats.damage.toFixed(2)}%</div>
                <div><strong>Final Damage:</strong> ${stats.finalDamage.toFixed(2)}%</div>
                <div><strong>Boss Damage:</strong> ${stats.bossDamage.toFixed(2)}%</div>
                <div><strong>Normal Damage:</strong> ${stats.normalDamage.toFixed(2)}%</div>
                <div><strong>Damage Amp:</strong> ${stats.damageAmp.toFixed(2)}%</div>
                <div><strong>Attack Speed:</strong> ${stats.attackSpeed.toFixed(2)}%</div>
                <div><strong>Def Pen:</strong> ${stats.defPen.toFixed(2)}%</div>
                <div><strong>Skill Coeff:</strong> ${stats.skillCoeff.toFixed(2)}%</div>
                <div><strong>Skill Mastery:</strong> ${stats.skillMastery.toFixed(2)}%</div>
                <div><strong>Skill Mastery Boss:</strong> ${stats.skillMasteryBoss.toFixed(2)}%</div>
                <div><strong>Min Damage:</strong> ${stats.minDamage.toFixed(2)}%</div>
                <div><strong>Max Damage:</strong> ${stats.maxDamage.toFixed(2)}%</div>
            </div>
        `;
    };

    resultsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="background: linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(0, 122, 255, 0.05)); border: 2px solid var(--accent-success); border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px var(--shadow); text-align: center;">
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set A Gain</div>
                <div style="font-size: 1.8em; font-weight: 700; color: ${setAGain >= 0 ? '#4ade80' : '#f87171'};">
                    ${setAGain >= 0 ? '+' : ''}${setAGain.toFixed(2)}%
                </div>
                ${setAComparison.percentile || ''}
                ${setAStats ? `
                    <details style="margin-top: 15px; text-align: left;">
                        <summary style="cursor: pointer; color: var(--accent-primary); font-weight: 600; font-size: 0.9em;">View Stats Used</summary>
                        <div style="margin-top: 10px; padding: 10px; background: rgba(0, 0, 0, 0.1); border-radius: 8px;">
                            ${formatStats(setAStats)}
                        </div>
                    </details>
                ` : ''}
            </div>
            <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.05)); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px var(--shadow); text-align: center;">
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set B Gain</div>
                <div style="font-size: 1.8em; font-weight: 700; color: ${setBGain >= 0 ? '#4ade80' : '#f87171'};">
                    ${setBGain >= 0 ? '+' : ''}${setBGain.toFixed(2)}%
                </div>
                ${setBComparison.percentile || ''}
                ${setBStats ? `
                    <details style="margin-top: 15px; text-align: left;">
                        <summary style="cursor: pointer; color: var(--accent-primary); font-weight: 600; font-size: 0.9em;">View Stats Used</summary>
                        <div style="margin-top: 10px; padding: 10px; background: rgba(0, 0, 0, 0.1); border-radius: 8px;">
                            ${formatStats(setBStats)}
                        </div>
                    </details>
                ` : ''}
            </div>
        </div>

        ${setAComparison.details || setBComparison.details ? `
            <div style="margin-top: 20px;">
                <details style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(88, 86, 214, 0.03)); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; cursor: pointer;">
                    <summary style="font-weight: 600; color: var(--accent-primary); font-size: 1.05em; cursor: pointer; user-select: none;">
                        View Detailed Ranking Comparison
                    </summary>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        ${setAComparison.details ? `
                            <div>
                                <div style="font-weight: 600; margin-bottom: 10px; color: var(--text-primary);">Set A vs Rankings:</div>
                                ${setAComparison.details}
                            </div>
                        ` : ''}
                        ${setBComparison.details ? `
                            <div>
                                <div style="font-weight: 600; margin-bottom: 10px; color: var(--text-primary);">Set B vs Rankings:</div>
                                ${setBComparison.details}
                            </div>
                        ` : ''}
                    </div>
                </details>
            </div>
        ` : ''}
    `;

    // Create distribution charts after DOM is updated
    if (setAComparison.chartData) {
        createDistributionChart(
            setAComparison.chartData.canvasId,
            setAComparison.chartData.dpsGain,
            setAComparison.chartData.rankings
        );
    }
    if (setBComparison.chartData) {
        createDistributionChart(
            setBComparison.chartData.canvasId,
            setBComparison.chartData.dpsGain,
            setBComparison.chartData.rankings
        );
    }
}

// Get loading placeholder for percentile display
export function getLoadingPlaceholder() {
    return `
        <div style="text-align: center; padding: 12px; background: rgba(0, 122, 255, 0.08); border-radius: 8px; margin-top: 10px;">
            <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">Calculating Rankings...</div>
            <div style="font-size: 1.2em; font-weight: 600; color: var(--accent-primary);">
                <span style="opacity: 0.6;">Loading</span>
            </div>
        </div>
    `;
}

// Load rankings in background and update comparison when done
export async function loadRankingsInBackground(slotId, rarity, setAGain, setBGain) {
    // Calculate rankings
    await calculateRankingsForRarity(rarity, slotId);

    // After rankings are calculated, refresh the comparison display if still on same slot/rarity
    if (slotId === currentCubeSlot && rarity === cubeSlotData[currentCubeSlot][currentPotentialType].rarity) {
        // Recalculate comparison to show the new graphs/percentiles
        calculateComparison();
    }
}

// Create distribution chart showing where user's DPS gain falls
export function createDistributionChart(canvasId, dpsGain, rankings) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        setTimeout(() => createDistributionChart(canvasId, dpsGain, rankings), 50);
        return;
    }

    // Create histogram buckets
    const bucketCount = 20;
    const allGains = rankings.map(r => r.dpsGain);
    const minGain = Math.min(...allGains);
    const maxGain = Math.max(...allGains);
    const bucketSize = (maxGain - minGain) / bucketCount;

    const buckets = new Array(bucketCount).fill(0);
    const bucketLabels = [];

    for (let i = 0; i < bucketCount; i++) {
        const bucketStart = minGain + (i * bucketSize);
        bucketLabels.push(bucketStart.toFixed(2));
    }

    // Count rankings in each bucket
    allGains.forEach(gain => {
        const bucketIndex = Math.min(
            Math.floor((gain - minGain) / bucketSize),
            bucketCount - 1
        );
        buckets[bucketIndex]++;
    });

    // Find which bucket the user's DPS gain falls into
    const userBucketIndex = Math.min(
        Math.floor((dpsGain - minGain) / bucketSize),
        bucketCount - 1
    );

    // Create gradient colors - highlight user's bucket
    const backgroundColors = buckets.map((_, idx) => {
        if (idx === userBucketIndex) {
            return 'rgba(251, 191, 36, 0.6)'; // Gold for user's bucket
        }
        return 'rgba(96, 165, 250, 0.4)'; // Blue for others
    });

    const borderColors = buckets.map((_, idx) => {
        if (idx === userBucketIndex) {
            return 'rgba(251, 191, 36, 1)';
        }
        return 'rgba(96, 165, 250, 0.8)';
    });

    // Create chart with logarithmic scale for better visibility of small values
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: bucketLabels,
            datasets: [{
                label: 'Combinations',
                data: buckets,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const idx = context[0].dataIndex;
                            const start = parseFloat(bucketLabels[idx]);
                            const end = start + bucketSize;
                            return `${start.toFixed(2)}% - ${end.toFixed(2)}%`;
                        },
                        label: function(context) {
                            const count = buckets[context.dataIndex];
                            const total = buckets.reduce((a, b) => a + b, 0);
                            const percentage = ((count / total) * 100).toFixed(1);
                            return `${count} combinations (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false, // Hide x-axis labels for cleaner look
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'logarithmic',
                    display: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || (document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#1f2937'),
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            // Only show major tick marks (powers of 10)
                            if (value === 1 || value === 10 || value === 100 || value === 1000 || value === 10000) {
                                return value;
                            }
                            return null;
                        }
                    },
                    grid: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.5)'
                    }
                }
            }
        }
    });
}

// Get ranking comparison for a given DPS gain
export function getRankingComparison(dpsGain, rarity) {
    const slotId = currentCubeSlot;
    const rankings = rankingsCache[slotId]?.[rarity];
    if (!rankings || rankings.length === 0) {
        return { percentile: null, details: null, chartData: null };
    }

    const best = rankings[0].dpsGain;

    // Calculate percentile values (rankings are sorted descending)
    const getPercentile = (p) => {
        const index = Math.floor(rankings.length * (1 - p / 100));
        return rankings[Math.min(index, rankings.length - 1)].dpsGain;
    };

    const p99 = getPercentile(99);
    const p95 = getPercentile(95);
    const p90 = getPercentile(90);
    const p80 = getPercentile(80);
    const p70 = getPercentile(70);
    const p60 = getPercentile(60);
    const median = rankings[Math.floor(rankings.length / 2)].dpsGain;

    // Find percentile
    let percentile = 0;
    for (let i = 0; i < rankings.length; i++) {
        if (rankings[i].dpsGain <= dpsGain) {
            percentile = ((i / rankings.length) * 100).toFixed(1);
            break;
        }
    }
    if (percentile === 0 && dpsGain >= best) percentile = 0;
    if (percentile === 0 && dpsGain < rankings[rankings.length - 1].dpsGain) percentile = 100;

    const canvasId = `cube-distribution-chart-${Math.random().toString(36).substr(2, 9)}`;
    const percentileHTML = `
        <div style="text-align: center; padding: 12px; background: rgba(0, 122, 255, 0.08); border-radius: 8px; margin-top: 10px;">
            <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">Your Percentile</div>
            <div style="font-size: 1.5em; font-weight: 700; color: var(--accent-primary);">Top ${percentile}%</div>
            <div style="margin-top: 12px;">
                <canvas id="${canvasId}" style="max-height: 120px;"></canvas>
            </div>
        </div>
    `;

    const detailsHTML = `
        <div style="font-size: 0.85em; line-height: 1.8; color: var(--text-secondary); padding: 12px; background: rgba(0, 122, 255, 0.03); border-radius: 8px; margin-top: 10px;">
            <div><span style="font-weight: 600;">Best Possible:</span> +${best.toFixed(2)}% <span style="color: ${dpsGain >= best ? '#4ade80' : '#f87171'};">(${((dpsGain / best) * 100).toFixed(1)}%)</span></div>
            <div><span style="font-weight: 600;">P99:</span> +${p99.toFixed(2)}% <span style="color: ${dpsGain >= p99 ? '#4ade80' : '#f87171'};">(${((dpsGain / p99) * 100).toFixed(1)}%)</span></div>
            <div><span style="font-weight: 600;">P95:</span> +${p95.toFixed(2)}% <span style="color: ${dpsGain >= p95 ? '#4ade80' : '#f87171'};">(${((dpsGain / p95) * 100).toFixed(1)}%)</span></div>
            <div><span style="font-weight: 600;">P90:</span> +${p90.toFixed(2)}% <span style="color: ${dpsGain >= p90 ? '#4ade80' : '#f87171'};">(${((dpsGain / p90) * 100).toFixed(1)}%)</span></div>
            <div><span style="font-weight: 600;">P80:</span> +${p80.toFixed(2)}% <span style="color: ${dpsGain >= p80 ? '#4ade80' : '#f87171'};">(${((dpsGain / p80) * 100).toFixed(1)}%)</span></div>
            <div><span style="font-weight: 600;">P70:</span> +${p70.toFixed(2)}% <span style="color: ${dpsGain >= p70 ? '#4ade80' : '#f87171'};">(${((dpsGain / p70) * 100).toFixed(1)}%)</span></div>
            <div><span style="font-weight: 600;">P60:</span> +${p60.toFixed(2)}% <span style="color: ${dpsGain >= p60 ? '#4ade80' : '#f87171'};">(${((dpsGain / p60) * 100).toFixed(1)}%)</span></div>
            <div><span style="font-weight: 600;">Median (P50):</span> +${median.toFixed(2)}% <span style="color: ${dpsGain >= median ? '#4ade80' : '#f87171'};">(${((dpsGain / median) * 100).toFixed(1)}%)</span></div>
        </div>
    `;

    return {
        percentile: percentileHTML,
        details: detailsHTML,
        chartData: {
            canvasId: canvasId,
            dpsGain: dpsGain,
            rankings: rankings
        }
    };
}

// Display rankings or calculate them if not ready
export async function displayOrCalculateRankings() {
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    const key = `${slotId}-${rarity}`;

    // If already calculated, display immediately
    if (rankingsCache[slotId]?.[rarity]) {
        displayRankings(rankingsCache[slotId][rarity], rarity);
        return;
    }

    // If calculation is in progress, show progress bar and wait
    if (rankingsInProgress[key]) {
        const progressBar = document.getElementById('cube-rankings-progress');
        if (progressBar) progressBar.style.display = 'block';

        // Poll until calculation is complete (with timeout after 60 seconds)
        let pollCount = 0;
        const maxPolls = 600; // 60 seconds at 100ms intervals
        const checkInterval = setInterval(() => {
            pollCount++;

            if (rankingsCache[slotId]?.[rarity]) {
                clearInterval(checkInterval);
                displayRankings(rankingsCache[slotId][rarity], rarity);
            } else if (!rankingsInProgress[key]) {
                // Calculation failed or was cancelled, try again
                clearInterval(checkInterval);
                calculateRankings();
            } else if (pollCount >= maxPolls) {
                // Timeout - something went wrong, stop polling
                clearInterval(checkInterval);
                console.error('Rankings calculation timeout');
                if (progressBar) progressBar.style.display = 'none';
            }
        }, 100);
    } else {
        // Not calculated and not in progress, start calculation
        await calculateRankings();
    }
}

// Calculate rankings for current slot's rarity
export async function calculateRankings() {
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    await calculateRankingsForRarity(rarity, slotId);
    displayRankings(rankingsCache[slotId][rarity], rarity);
}

// Calculate rankings for a specific rarity and slot
export async function calculateRankingsForRarity(rarity, slotId = currentCubeSlot) {
    const key = `${slotId}-${rarity}`;

    try {
        // Initialize slot cache if needed
        if (!rankingsCache[slotId]) {
            rankingsCache[slotId] = {};
        }

        // Check if already calculated for this slot and rarity
        if (rankingsCache[slotId][rarity]) {
            return;
        }

        // Check if already calculating this combination
        if (rankingsInProgress[key]) {
            return; // Already calculating, skip
        }

        // Mark as in progress
        rankingsInProgress[key] = true;

        // Check if class is selected
        if (!getSelectedClass()) {
            updateClassWarning();
            delete rankingsInProgress[key];
            return;
        }

        const progressBar = document.getElementById('cube-rankings-progress');
        const progressFill = document.getElementById('cube-rankings-progress-fill');
        const progressText = document.getElementById('cube-rankings-progress-text');
        const resultsDiv = document.getElementById('cube-rankings-results');

        // Only show progress bar if calculating for the currently visible slot
        const isCurrentSlot = slotId === currentCubeSlot;
        if (isCurrentSlot) {
            if (progressBar) progressBar.style.display = 'block';
            if (progressFill) progressFill.style.width = '0%';
            if (progressText) progressText.textContent = 'Calculating... 0%';
            if (resultsDiv) resultsDiv.innerHTML = '';
        }

        const potentialData = equipmentPotentialData[rarity];
        if (!potentialData) {
            if (progressBar) progressBar.style.display = 'none';
            delete rankingsInProgress[key];
            return;
        }

        // Get base potential lines
        let line1Options = [...(potentialData.line1 || [])];
        let line2Options = [...(potentialData.line2 || [])];
        let line3Options = [...(potentialData.line3 || [])];

        // Add slot-specific lines if available for current slot
        if (slotSpecificPotentials[slotId] && slotSpecificPotentials[slotId][rarity]) {
            const slotSpecific = slotSpecificPotentials[slotId][rarity];
            if (slotSpecific.line1) {
                line1Options = [...line1Options, ...slotSpecific.line1];
            }
            if (slotSpecific.line2) {
                line2Options = [...line2Options, ...slotSpecific.line2];
            }
            if (slotSpecific.line3) {
                line3Options = [...line3Options, ...slotSpecific.line3];
            }
        }

        const totalCombinations = line1Options.length * line2Options.length * line3Options.length;
        const rankings = [];
        const baseStats = getStats('base');
        const baseDPS = calculateDamage(baseStats, 'boss').dps;

        let processedCount = 0;
        const batchSize = 50; // Smaller batch for more frequent UI updates

        // Process in batches
        for (let i = 0; i < line1Options.length; i++) {
            for (let j = 0; j < line2Options.length; j++) {
                for (let k = 0; k < line3Options.length; k++) {
                    const combo = {
                        line1: line1Options[i],
                        line2: line2Options[j],
                        line3: line3Options[k]
                    };

                    // Calculate stats for this combination
                    const comboStats = { ...baseStats };
                    let accumulatedMainStatPct = 0;

                    [combo.line1, combo.line2, combo.line3].forEach(line => {
                        const mapped = potentialStatToDamageStat(line.stat, line.value, accumulatedMainStatPct);
                        if (mapped.stat) {
                            comboStats[mapped.stat] = (comboStats[mapped.stat] || 0) + mapped.value;
                            if (mapped.isMainStatPct) {
                                accumulatedMainStatPct += line.value;
                            }
                        }
                    });

                    const comboDPS = calculateDamage(comboStats, 'boss').dps;
                    const gain = ((comboDPS - baseDPS) / baseDPS * 100);

                    rankings.push({
                        line1: combo.line1,
                        line2: combo.line2,
                        line3: combo.line3,
                        dpsGain: gain
                    });

                    processedCount++;

                    // Update progress periodically
                    if (processedCount % batchSize === 0) {
                        const progress = (processedCount / totalCombinations * 100);

                        // Check if user is now viewing this slot's rankings
                        const nowCurrentSlot = slotId === currentCubeSlot;
                        const rankingsContent = document.getElementById('cube-rankings-content');
                        const shouldShowProgress = nowCurrentSlot && rankingsContent && rankingsContent.style.display !== 'none';

                        if (shouldShowProgress) {
                            const progressBar = document.getElementById('cube-rankings-progress');
                            const progressFill = document.getElementById('cube-rankings-progress-fill');
                            const progressText = document.getElementById('cube-rankings-progress-text');

                            if (progressBar) progressBar.style.display = 'block';
                            if (progressFill) progressFill.style.width = `${progress}%`;
                            if (progressText) progressText.textContent = `Calculating... ${Math.round(progress)}%`;
                        }

                        // Allow UI to update
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            }
        }

        // Sort by DPS gain descending
        rankings.sort((a, b) => b.dpsGain - a.dpsGain);

        // Deduplicate: keep only unique combinations of lines (order doesn't matter)
        const seen = new Set();
        const deduplicatedRankings = [];

        for (const combo of rankings) {
            // Create a signature by sorting the 3 lines alphabetically
            const signature = [combo.line1, combo.line2, combo.line3]
                .map(line => `${line.stat}|${line.value}|${line.prime}`)
                .sort()
                .join('||');

            if (!seen.has(signature)) {
                seen.add(signature);
                deduplicatedRankings.push(combo);
            }
        }

        // Filter out combinations with 0% or negligible DPS gain
        const filteredRankings = deduplicatedRankings.filter(combo => combo.dpsGain > 0.01);

        // Cache the filtered results for this slot and rarity
        rankingsCache[slotId][rarity] = filteredRankings;

        // If this is the current slot and rankings tab is visible, display results
        if (isCurrentSlot) {
            const rankingsContent = document.getElementById('cube-rankings-content');
            if (rankingsContent && rankingsContent.style.display !== 'none') {
                displayRankings(filteredRankings, rarity);
            }

            // Hide progress bar
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error calculating rankings:', error);
        if (isCurrentSlot && progressBar) {
            progressBar.style.display = 'none';
        }
    } finally {
        // Always mark as complete and remove from in-progress tracker
        delete rankingsInProgress[key];
    }
}

// Display rankings with pagination
let currentRankingsPage = 1;

export function displayRankings(rankings, rarity) {
    const resultsDiv = document.getElementById('cube-rankings-results');
    if (!resultsDiv) return;

    const totalPages = Math.ceil(rankings.length / rankingsPerPage);
    const startIdx = (currentRankingsPage - 1) * rankingsPerPage;
    const endIdx = Math.min(startIdx + rankingsPerPage, rankings.length);
    const pageRankings = rankings.slice(startIdx, endIdx);

    let html = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: var(--accent-primary); margin-bottom: 10px;">
                Top Potential Combinations for ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Rarity
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.9em;">
                Showing ${startIdx + 1}-${endIdx} of ${rankings.length} unique combinations
            </p>
        </div>
        <table class="stat-weight-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th style="text-align: center;">Line 1</th>
                    <th style="text-align: center;">Line 2</th>
                    <th style="text-align: center;">Line 3</th>
                    <th>DPS Gain</th>
                </tr>
            </thead>
            <tbody>
    `;

    pageRankings.forEach((combo, idx) => {
        const rank = startIdx + idx + 1;
        const formatLine = (line) => {
            const primeTag = line.prime ? ' <span style="color: var(--accent-primary); font-weight: 600;">(Prime)</span>' : '';
            // Check if stat is percentage-based or flat
            const isPercentStat = line.stat.includes('%');
            const valueSuffix = isPercentStat ? '%' : '';
            return `${line.stat}: ${line.value}${valueSuffix}${primeTag}`;
        };

        html += `
            <tr>
                <td style="font-weight: 700; color: var(--accent-primary);">#${rank}</td>
                <td style="text-align: center;">${formatLine(combo.line1)}</td>
                <td style="text-align: center;">${formatLine(combo.line2)}</td>
                <td style="text-align: center;">${formatLine(combo.line3)}</td>
                <td><span class="gain-positive">+${combo.dpsGain.toFixed(2)}%</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px;">
            <button onclick="changeRankingsPage(${currentRankingsPage - 1})"
                    ${currentRankingsPage === 1 ? 'disabled' : ''}
                    class="btn-primary">Previous</button>
            <span style="color: var(--text-secondary);">Page ${currentRankingsPage} of ${totalPages}</span>
            <button onclick="changeRankingsPage(${currentRankingsPage + 1})"
                    ${currentRankingsPage === totalPages ? 'disabled' : ''}
                    class="btn-primary">Next</button>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

export function changeRankingsPage(newPage) {
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    const rankings = rankingsCache[slotId]?.[rarity];
    if (!rankings) return;

    const totalPages = Math.ceil(rankings.length / rankingsPerPage);
    if (newPage < 1 || newPage > totalPages) return;

    currentRankingsPage = newPage;
    displayRankings(rankings, rarity);
}

// Update class warning banner
export function updateClassWarning() {
    const warningBanner = document.getElementById('cube-class-warning');
    if (!warningBanner) return;

    if (!getSelectedClass()) {
        warningBanner.style.display = 'block';
    } else {
        warningBanner.style.display = 'none';
    }
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
        calculateComparison();
    }

    // If rankings tab is visible, recalculate rankings
    const rankingsContent = document.getElementById('cube-rankings-content');
    if (rankingsContent && rankingsContent.style.display !== 'none') {
        currentRankingsPage = 1;
        displayOrCalculateRankings();
    }

    // If summary tab is visible, update summary
    const summaryContent = document.getElementById('cube-summary-content');
    if (summaryContent && summaryContent.style.display !== 'none') {
        displayAllSlotsSummary();
    }
}

// Save cube potential data to localStorage
export function saveCubePotentialData() {
    try {
        localStorage.setItem('cubePotentialData', JSON.stringify(cubeSlotData));
    } catch (error) {
        console.error('Error saving cube potential data:', error);
    }
}

// Global state for summary sorting
let summarySortColumn = 'regular'; // 'regular' or 'bonus'
let summarySortDescending = true;

// Display summary of all slots
export function displayAllSlotsSummary() {
    const resultsDiv = document.getElementById('cube-summary-results');
    if (!resultsDiv) return;

    if (!getSelectedClass()) {
        resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Please select a class to view summary.</p>';
        return;
    }

    const baseStats = getStats('base');
    const baseDPS = calculateDamage(baseStats, 'boss').dps;

    // Calculate DPS gain for each slot + potential type
    const summaryData = [];

    slotNames.forEach(slot => {
        // Regular Potential
        const regularData = cubeSlotData[slot.id].regular;
        const regularStats = { ...baseStats };
        let regularAccumulatedMainStatPct = 0;
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = regularData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;

            // Only apply line if it exists in the current rarity for this slot
            if (!lineExistsInRarity(slot.id, regularData.rarity, lineNum, line.stat, line.value, line.prime)) continue;

            const mapped = potentialStatToDamageStat(line.stat, line.value, regularAccumulatedMainStatPct);
            if (mapped.stat) {
                regularStats[mapped.stat] = (regularStats[mapped.stat] || 0) + mapped.value;
                if (mapped.isMainStatPct) {
                    regularAccumulatedMainStatPct += line.value;
                }
            }
        }
        const regularDPS = calculateDamage(regularStats, 'boss').dps;
        const regularGain = ((regularDPS - baseDPS) / baseDPS * 100);

        // Bonus Potential
        const bonusData = cubeSlotData[slot.id].bonus;
        const bonusStats = { ...baseStats };
        let bonusAccumulatedMainStatPct = 0;
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = bonusData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;

            // Only apply line if it exists in the current rarity for this slot
            if (!lineExistsInRarity(slot.id, bonusData.rarity, lineNum, line.stat, line.value, line.prime)) continue;

            const mapped = potentialStatToDamageStat(line.stat, line.value, bonusAccumulatedMainStatPct);
            if (mapped.stat) {
                bonusStats[mapped.stat] = (bonusStats[mapped.stat] || 0) + mapped.value;
                if (mapped.isMainStatPct) {
                    bonusAccumulatedMainStatPct += line.value;
                }
            }
        }
        const bonusDPS = calculateDamage(bonusStats, 'boss').dps;
        const bonusGain = ((bonusDPS - baseDPS) / baseDPS * 100);

        summaryData.push({
            slotId: slot.id,
            slotName: slot.name,
            regularGain,
            regularRarity: regularData.rarity,
            bonusGain,
            bonusRarity: bonusData.rarity
        });
    });

    // Sort by selected column
    if (summarySortColumn === 'regular') {
        summaryData.sort((a, b) => summarySortDescending ? b.regularGain - a.regularGain : a.regularGain - b.regularGain);
    } else {
        summaryData.sort((a, b) => summarySortDescending ? b.bonusGain - a.bonusGain : a.bonusGain - b.bonusGain);
    }

    // Build HTML table with sortable headers
    const regularSortIndicator = summarySortColumn === 'regular' ? (summarySortDescending ? ' ▼' : ' ▲') : '';
    const bonusSortIndicator = summarySortColumn === 'bonus' ? (summarySortDescending ? ' ▼' : ' ▲') : '';

    let html = `
        <table class="stat-weight-table">
            <thead>
                <tr>
                    <th style="text-align: center;">Slot</th>
                    <th style="text-align: center; cursor: pointer; user-select: none;" onclick="sortSummaryBy('regular')">
                        Regular Potential${regularSortIndicator}<br>
                        <span style="font-size: 0.8em; font-weight: 400;">(Set A Gain)</span>
                    </th>
                    <th style="text-align: center; cursor: pointer; user-select: none;" onclick="sortSummaryBy('bonus')">
                        Bonus Potential${bonusSortIndicator}<br>
                        <span style="font-size: 0.8em; font-weight: 400;">(Set A Gain)</span>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;

    summaryData.forEach((data) => {
        const rarityColor = getRarityColor(data.regularRarity);
        const bonusRarityColor = getRarityColor(data.bonusRarity);

        // Get percentile for regular and bonus
        const regularPercentile = getPercentileForGain(data.slotId, data.regularRarity, data.regularGain);
        const bonusPercentile = getPercentileForGain(data.slotId, data.bonusRarity, data.bonusGain);

        html += `
            <tr>
                <td style="font-weight: 600; text-align: center;">${data.slotName}</td>
                <td style="text-align: center;">
                    <div style="color: ${data.regularGain >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600; margin-bottom: 4px;">
                        ${data.regularGain >= 0 ? '+' : ''}${data.regularGain.toFixed(2)}%
                    </div>
                    <div style="font-size: 0.8em; color: var(--text-secondary);">
                        ${data.regularRarity.charAt(0).toUpperCase() + data.regularRarity.slice(1)}
                        ${regularPercentile}
                    </div>
                </td>
                <td style="text-align: center;">
                    <div style="color: ${data.bonusGain >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600; margin-bottom: 4px;">
                        ${data.bonusGain >= 0 ? '+' : ''}${data.bonusGain.toFixed(2)}%
                    </div>
                    <div style="font-size: 0.8em; color: var(--text-secondary);">
                        ${data.bonusRarity.charAt(0).toUpperCase() + data.bonusRarity.slice(1)}
                        ${bonusPercentile}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    // Calculate total DPS gain from all current potential lines
    const totalStats = { ...baseStats };
    let totalAccumulatedMainStatPct = 0;

    // Add all regular potential stats
    slotNames.forEach(slot => {
        const regularData = cubeSlotData[slot.id].regular;
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = regularData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;
            if (!lineExistsInRarity(slot.id, regularData.rarity, lineNum, line.stat, line.value, line.prime)) continue;

            const mapped = potentialStatToDamageStat(line.stat, line.value, totalAccumulatedMainStatPct);
            if (mapped.stat) {
                totalStats[mapped.stat] = (totalStats[mapped.stat] || 0) + mapped.value;
                if (mapped.isMainStatPct) {
                    totalAccumulatedMainStatPct += line.value;
                }
            }
        }

        // Add all bonus potential stats
        const bonusData = cubeSlotData[slot.id].bonus;
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = bonusData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;
            if (!lineExistsInRarity(slot.id, bonusData.rarity, lineNum, line.stat, line.value, line.prime)) continue;

            const mapped = potentialStatToDamageStat(line.stat, line.value, totalAccumulatedMainStatPct);
            if (mapped.stat) {
                totalStats[mapped.stat] = (totalStats[mapped.stat] || 0) + mapped.value;
                if (mapped.isMainStatPct) {
                    totalAccumulatedMainStatPct += line.value;
                }
            }
        }
    });

    const totalDPS = calculateDamage(totalStats, 'boss').dps;
    const totalGain = ((totalDPS - baseDPS) / baseDPS * 100);

    html += `
        <div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.05)); border: 2px solid rgba(0, 122, 255, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
            <h4 style="color: var(--accent-primary); margin-bottom: 15px; font-size: 1.1em; font-weight: 600;">
                Total Potential DPS Gain
            </h4>
            <div style="text-align: center; padding: 20px; background: rgba(255, 255, 255, 0.5); border-radius: 8px;">
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">
                    Combined DPS gain from all Regular & Bonus Potential lines
                </div>
                <div style="font-size: 2.5em; font-weight: 700; color: ${totalGain >= 0 ? 'var(--accent-success)' : '#f87171'};">
                    ${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)}%
                </div>
                <div style="margin-top: 15px; font-size: 0.85em; color: var(--text-secondary); line-height: 1.6;">
                    This represents the total DPS increase from all current potential lines across all equipment slots,
                    calculated from your base stats (without any potential lines applied).
                </div>
            </div>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

// Load all rankings needed for summary
export async function loadAllRankingsForSummary() {
    if (!getSelectedClass()) return;

    // Collect all unique slot+rarity combinations that need ranking
    const rankingsToLoad = [];

    slotNames.forEach(slot => {
        // Regular potential
        const regularRarity = cubeSlotData[slot.id].regular.rarity;
        const regularKey = `${slot.id}-${regularRarity}`;
        if (!rankingsCache[slot.id]?.[regularRarity] && !rankingsInProgress[regularKey]) {
            rankingsToLoad.push({ slotId: slot.id, rarity: regularRarity, slotName: slot.name, type: 'Regular' });
        }

        // Bonus potential
        const bonusRarity = cubeSlotData[slot.id].bonus.rarity;
        const bonusKey = `${slot.id}-${bonusRarity}`;
        if (!rankingsCache[slot.id]?.[bonusRarity] && !rankingsInProgress[bonusKey]) {
            rankingsToLoad.push({ slotId: slot.id, rarity: bonusRarity, slotName: slot.name, type: 'Bonus' });
        }
    });

    // If nothing to load, we're done
    if (rankingsToLoad.length === 0) return;

    const progressBar = document.getElementById('cube-summary-progress');
    const progressFill = document.getElementById('cube-summary-progress-fill');
    const progressText = document.getElementById('cube-summary-progress-text');

    // Show progress bar
    if (progressBar) progressBar.style.display = 'block';

    const total = rankingsToLoad.length;

    // Calculate each ranking in sequence (to avoid overwhelming the browser)
    for (let i = 0; i < rankingsToLoad.length; i++) {
        const { slotId, rarity, slotName, type } = rankingsToLoad[i];

        // Update progress text
        if (progressText) {
            progressText.textContent = `Loading rankings for ${slotName} (${type} - ${rarity})... ${i + 1}/${total}`;
        }
        if (progressFill) {
            progressFill.style.width = `${((i / total) * 100)}%`;
        }

        await calculateRankingsForRarity(rarity, slotId);

        // Update summary display after each ranking is calculated
        const summaryContent = document.getElementById('cube-summary-content');
        if (summaryContent && summaryContent.style.display !== 'none') {
            displayAllSlotsSummary();
        }
    }

    // Hide progress bar
    if (progressFill) progressFill.style.width = '100%';
    setTimeout(() => {
        if (progressBar) progressBar.style.display = 'none';
    }, 500);
}

// Sort summary table by column
export function sortSummaryBy(column) {
    if (summarySortColumn === column) {
        // Same column - toggle direction
        summarySortDescending = !summarySortDescending;
    } else {
        // Different column - set new column and default to descending
        summarySortColumn = column;
        summarySortDescending = true;
    }
    displayAllSlotsSummary();
}

// Get percentile for a given DPS gain (helper for summary)
export function getPercentileForGain(slotId, rarity, dpsGain) {
    const key = `${slotId}-${rarity}`;
    const rankings = rankingsCache[slotId]?.[rarity];

    // Check if currently loading
    if (rankingsInProgress[key]) {
        return '<span style="color: var(--text-secondary); font-style: italic;">Loading...</span>';
    }

    if (!rankings || rankings.length === 0) {
        return '<span style="color: var(--text-secondary);">—</span>';
    }

    // Find percentile
    let percentile = 0;
    for (let i = 0; i < rankings.length; i++) {
        if (rankings[i].dpsGain <= dpsGain) {
            percentile = ((i / rankings.length) * 100).toFixed(1);
            break;
        }
    }
    if (percentile === 0 && dpsGain >= rankings[0].dpsGain) percentile = 0;
    if (percentile === 0 && dpsGain < rankings[rankings.length - 1].dpsGain) percentile = 100;

    return `<span style="color: var(--accent-primary);">Top ${percentile}%</span>`;
}

// Load cube potential data from localStorage
export function loadCubePotentialData() {
    try {
        const saved = localStorage.getItem('cubePotentialData');
        if (saved) {
            const savedData = JSON.parse(saved);

            // Merge saved data with default structure
            // This ensures new slots get defaults and old slots keep their saved values
            slotNames.forEach(slot => {
                if (savedData[slot.id]) {
                    // Check if it's old format (no regular/bonus split) or new format
                    if (savedData[slot.id].regular || savedData[slot.id].bonus) {
                        // New format with regular and bonus potential
                        cubeSlotData[slot.id] = {
                            regular: savedData[slot.id].regular || cubeSlotData[slot.id].regular,
                            bonus: savedData[slot.id].bonus || cubeSlotData[slot.id].bonus
                        };
                    } else {
                        // Old format - migrate to regular potential only
                        cubeSlotData[slot.id].regular = {
                            rarity: savedData[slot.id].rarity || 'normal',
                            setA: savedData[slot.id].setA || cubeSlotData[slot.id].regular.setA,
                            setB: savedData[slot.id].setB || cubeSlotData[slot.id].regular.setB
                        };
                        // Keep bonus as default (initialized)
                    }
                }
                // If not in saved data, keep the default that was initialized
            });
        }
    } catch (error) {
        console.error('Error loading cube potential data:', error);
    }
}

// ========== SIMULATION LOGIC ==========


// Cache for simulation performance
let simCache = {
    baseStats: null,
    baseDPS: null,
    lineOptionsCache: {}, // Cache merged line options per slot+rarity
    weightCache: {}       // Cache total weights for line options
};

// Initialize simulation cache
export function initSimulationCache() {
    simCache.baseStats = getStats('base');
    simCache.baseDPS = calculateDamage(simCache.baseStats, 'boss').dps;
    simCache.lineOptionsCache = {};
    simCache.weightCache = {};

    // Pre-calculate line options and weights for all slot+rarity combinations
    slotNames.forEach(slotDef => {
        const slotId = slotDef.id;
        rarities.forEach(rarity => {
            const potentialData = equipmentPotentialData[rarity];
            if (!potentialData) return;

            const key = `${slotId}-${rarity}`;
            const cached = {
                line1: potentialData.line1 || [],
                line2: potentialData.line2 || [],
                line3: potentialData.line3 || []
            };

            // Add slot-specific lines
            if (slotSpecificPotentials[slotId]?.[rarity]) {
                const slotSpecific = slotSpecificPotentials[slotId][rarity];
                if (slotSpecific.line1) cached.line1 = [...cached.line1, ...slotSpecific.line1];
                if (slotSpecific.line2) cached.line2 = [...cached.line2, ...slotSpecific.line2];
                if (slotSpecific.line3) cached.line3 = [...cached.line3, ...slotSpecific.line3];
            }

            simCache.lineOptionsCache[key] = cached;

            // Pre-calculate total weights
            simCache.weightCache[`${key}-1`] = cached.line1.reduce((sum, opt) => sum + opt.weight, 0);
            simCache.weightCache[`${key}-2`] = cached.line2.reduce((sum, opt) => sum + opt.weight, 0);
            simCache.weightCache[`${key}-3`] = cached.line3.reduce((sum, opt) => sum + opt.weight, 0);
        });
    });
}

// Simulate using a single cube on a slot
export function simulateCubeOnSlot(slot, slotId) {
    // Try to upgrade rarity
    const upgradeData = RARITY_UPGRADE_RATES[slot.rarity];
    if (upgradeData && Math.random() < upgradeData.rate) {
        slot.rarity = upgradeData.next;
    }

    // Get cached line options
    const key = `${slotId}-${slot.rarity}`;
    const lineOptions = simCache.lineOptionsCache[key];
    if (!lineOptions) return;

    // Roll each line based on weight using cached options
    slot.lines = [
        rollPotentialLineCached(lineOptions.line1, simCache.weightCache[`${key}-1`]),
        rollPotentialLineCached(lineOptions.line2, simCache.weightCache[`${key}-2`]),
        rollPotentialLineCached(lineOptions.line3, simCache.weightCache[`${key}-3`])
    ];

    // Calculate DPS gain for this slot
    slot.dpsGain = calculateSlotDPSGainCached(slot);
}

// Roll a single potential line based on weights (optimized with cached total weight)
export function rollPotentialLineCached(options, totalWeight) {
    if (!options || options.length === 0) return null;

    let random = Math.random() * totalWeight;

    for (const option of options) {
        random -= option.weight;
        if (random <= 0) {
            // Return reference instead of spreading - we don't mutate these
            return option;
        }
    }

    return options[options.length - 1];
}

// Calculate DPS gain for a single slot (optimized with cached base stats)
export function calculateSlotDPSGainCached(slot) {
    const slotStats = { ...simCache.baseStats };
    let accumulatedMainStatPct = 0;
    if (slot.lines) {
        for (let i = 0; i < slot.lines.length; i++) {
            const line = slot.lines[i];
            if (!line) continue;
            const mapped = potentialStatToDamageStat(line.stat, line.value, accumulatedMainStatPct);
            if (mapped.stat) {
                slotStats[mapped.stat] = (slotStats[mapped.stat] || 0) + mapped.value;
                if (mapped.isMainStatPct) {
                    accumulatedMainStatPct += line.value;
                }
            }
        }
    }

    const slotDPS = calculateDamage(slotStats, 'boss').dps;
    return ((slotDPS - simCache.baseDPS) / simCache.baseDPS * 100);
}

// Calculate total DPS gain from all slots (optimized with cached base stats)
export function calculateTotalDPSGain(slots) {
    const totalStats = { ...simCache.baseStats };
    let accumulatedMainStatPct = 0;
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (!slot.lines) continue;

        for (let j = 0; j < slot.lines.length; j++) {
            const line = slot.lines[j];
            if (!line) continue;
            const mapped = potentialStatToDamageStat(line.stat, line.value, accumulatedMainStatPct);
            if (mapped.stat) {
                totalStats[mapped.stat] = (totalStats[mapped.stat] || 0) + mapped.value;
                if (mapped.isMainStatPct) {
                    accumulatedMainStatPct += line.value;
                }
            }
        }
    }

    const totalDPS = calculateDamage(totalStats, 'boss').dps;
    return ((totalDPS - simCache.baseDPS) / simCache.baseDPS * 100);
}

// Strategy 1: Worst First - always upgrade the slot with lowest DPS
export function runWorstFirstStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0
    }));

    // Use all cubes
    for (let i = 0; i < cubeBudget; i++) {
        // Find slot with lowest DPS gain
        let worstSlot = slots[0];
        for (const slot of slots) {
            if (slot.dpsGain < worstSlot.dpsGain) {
                worstSlot = slot;
            }
        }

        // Use cube on worst slot
        simulateCubeOnSlot(worstSlot, worstSlot.id);
    }

    return slots;
}

// Strategy 1b: Worst First (Top 25%) - upgrade worst slot until it reaches top 25% percentile
export async function runWorstFirstTop25Strategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0
    }));

    let cubesUsed = 0;

    // Use all cubes
    while (cubesUsed < cubeBudget) {
        // Find slot with lowest DPS gain
        let worstSlot = slots[0];
        for (const slot of slots) {
            if (slot.dpsGain < worstSlot.dpsGain) {
                worstSlot = slot;
            }
        }

        // Get top 25% threshold for this slot's current rarity
        const threshold = await getTop25PercentileThreshold(worstSlot.id, worstSlot.rarity);

        // Cube worst slot until it reaches top 25% or we run out of cubes
        const startingRarity = worstSlot.rarity;
        while (cubesUsed < cubeBudget && worstSlot.dpsGain < threshold && worstSlot.rarity === startingRarity) {
            simulateCubeOnSlot(worstSlot, worstSlot.id);
            cubesUsed++;
        }

        // If we didn't use any cubes (already at top 25%), use one anyway to move on
        if (cubesUsed < cubeBudget && worstSlot.rarity === startingRarity && worstSlot.dpsGain >= threshold) {
            simulateCubeOnSlot(worstSlot, worstSlot.id);
            cubesUsed++;
        }
    }

    return slots;
}

// Strategy 2: Rarity by Rarity - upgrade all slots to same rarity tier with top 25% percentile before moving to next tier
export async function runRarityByRarityStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0
    }));

    let cubesUsed = 0;
    // Start from rare since all slots begin at normal
    const rarityProgression = ['rare', 'epic', 'unique', 'legendary', 'mystic'];

    // For each rarity tier
    for (const targetRarity of rarityProgression) {
        if (cubesUsed >= cubeBudget) break;

        // Get all slots that haven't reached this rarity yet
        const slotsToUpgrade = slots.filter(slot => {
            const currentIndex = rarityProgression.indexOf(slot.rarity);
            const targetIndex = rarityProgression.indexOf(targetRarity);
            // Include slots at normal (index -1) or below target
            return currentIndex < targetIndex || slot.rarity === 'normal';
        });

        if (slotsToUpgrade.length === 0) continue;

        // Upgrade each slot to target rarity with top 25% percentile
        for (const slot of slotsToUpgrade) {
            if (cubesUsed >= cubeBudget) break;

            // First, get slot to the target rarity
            while (cubesUsed < cubeBudget && slot.rarity !== targetRarity) {
                const currentRarity = slot.rarity;
                simulateCubeOnSlot(slot, slot.id);
                cubesUsed++;

                // If we reached or passed target rarity, break
                const currentIndex = rarityProgression.indexOf(slot.rarity);
                const targetIndex = rarityProgression.indexOf(targetRarity);
                if (currentIndex >= targetIndex) break;
            }

            // Now get it to top 25% percentile for this rarity
            if (slot.rarity === targetRarity && cubesUsed < cubeBudget) {
                const threshold = await getTop25PercentileThreshold(slot.id, targetRarity);

                while (cubesUsed < cubeBudget && slot.dpsGain < threshold && slot.rarity === targetRarity) {
                    simulateCubeOnSlot(slot, slot.id);
                    cubesUsed++;
                }
            }
        }
    }

    // If we have leftover cubes, distribute randomly
    while (cubesUsed < cubeBudget) {
        const randomSlot = slots[Math.floor(Math.random() * slots.length)];
        simulateCubeOnSlot(randomSlot, randomSlot.id);
        cubesUsed++;
    }

    return slots;
}

// Get top 25% percentile threshold for a slot and rarity
export async function getTop25PercentileThreshold(slotId, rarity) {
    // Ensure rankings are calculated for this slot and rarity
    if (!rankingsCache[slotId]?.[rarity]) {
        await calculateRankingsForRarity(rarity, slotId);
    }

    const rankings = rankingsCache[slotId]?.[rarity];
    if (!rankings || rankings.length === 0) return 0;

    // Top 25% means we want to be in the top quartile
    const index = Math.floor(rankings.length * 0.25);
    return rankings[index].dpsGain;
}

// Strategy 3: Best First - focus on slots that are already performing well
export function runBestFirstStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0
    }));

    // Use all cubes
    for (let i = 0; i < cubeBudget; i++) {
        // Find slot with highest DPS gain
        let bestSlot = slots[0];
        for (const slot of slots) {
            if (slot.dpsGain > bestSlot.dpsGain) {
                bestSlot = slot;
            }
        }

        // Use cube on best slot
        simulateCubeOnSlot(bestSlot, bestSlot.id);
    }

    return slots;
}

// Strategy 4: Balanced Threshold - keep all slots within a certain range of each other
export function runBalancedThresholdStrategy(cubeBudget, threshold = 10) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0
    }));

    // Use all cubes
    for (let i = 0; i < cubeBudget; i++) {
        // Find the average DPS gain
        const avgDPS = slots.reduce((sum, slot) => sum + slot.dpsGain, 0) / slots.length;

        // Find slot that is furthest below average (but prioritize those below threshold)
        let targetSlot = slots[0];
        let maxDeficit = avgDPS - targetSlot.dpsGain;

        for (const slot of slots) {
            const deficit = avgDPS - slot.dpsGain;
            if (deficit > maxDeficit) {
                maxDeficit = deficit;
                targetSlot = slot;
            }
        }

        // Use cube on target slot
        simulateCubeOnSlot(targetSlot, targetSlot.id);
    }

    return slots;
}

// Strategy 5: Rarity-Weighted Worst First - considers proximity to rarity upgrades
export function runRarityWeightedWorstFirstStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0,
        cubesAtCurrentRarity: 0
    }));

    const rarityOrder = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic'];
    const expectedCubesForUpgrade = {
        'normal': 1 / 0.06,      // ~16.7 cubes
        'rare': 1 / 0.03333,     // ~30 cubes
        'epic': 1 / 0.0167,      // ~60 cubes
        'unique': 1 / 0.006,     // ~167 cubes
        'legendary': 1 / 0.0021  // ~476 cubes
    };

    // Use all cubes
    for (let i = 0; i < cubeBudget; i++) {
        // Calculate weighted score for each slot
        let bestSlot = slots[0];
        let bestScore = Infinity;

        for (const slot of slots) {
            // Lower DPS is worse (want to improve it)
            let score = slot.dpsGain;

            // If slot is close to upgrading, reduce its score (make it more attractive)
            if (expectedCubesForUpgrade[slot.rarity]) {
                const upgradeProgress = slot.cubesAtCurrentRarity / expectedCubesForUpgrade[slot.rarity];
                // Bonus for being close to upgrade (up to 50% reduction in score)
                score = score * (1 - upgradeProgress * 0.5);
            }

            if (score < bestScore) {
                bestScore = score;
                bestSlot = slot;
            }
        }

        // Track cubes used at current rarity
        const oldRarity = bestSlot.rarity;
        simulateCubeOnSlot(bestSlot, bestSlot.id);

        if (bestSlot.rarity === oldRarity) {
            bestSlot.cubesAtCurrentRarity++;
        } else {
            bestSlot.cubesAtCurrentRarity = 0;
        }
    }

    return slots;
}

// Strategy 6: Greedy Marginal Gain - always pick slot with highest expected return per cube
export function runGreedyMarginalGainStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0,
        cubesUsed: 0
    }));

    // Use all cubes
    for (let i = 0; i < cubeBudget; i++) {
        // Calculate expected marginal gain for each slot
        let bestSlot = slots[0];
        let bestMarginalGain = -Infinity;

        for (const slot of slots) {
            // Estimate marginal gain: lower current DPS = higher potential gain
            // Also factor in diminishing returns (more cubes used = lower marginal gain)
            const basePotential = 100 - slot.dpsGain; // How much room for growth
            const diminishingFactor = 1 / (1 + slot.cubesUsed * 0.01); // Diminishing returns
            const marginalGain = basePotential * diminishingFactor;

            if (marginalGain > bestMarginalGain) {
                bestMarginalGain = marginalGain;
                bestSlot = slot;
            }
        }

        // Use cube on best marginal gain slot
        simulateCubeOnSlot(bestSlot, bestSlot.id);
        bestSlot.cubesUsed++;
    }

    return slots;
}

// Strategy 7: Hybrid Fast Rarity + Worst First
export async function runHybridFastRarityStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0
    }));

    let cubesUsed = 0;
    const targetRarity = 'epic'; // Get all slots to epic first
    const rarityProgression = ['rare', 'epic', 'unique', 'legendary', 'mystic'];

    // Phase 1: Rush all slots to target rarity
    for (const slot of slots) {
        while (cubesUsed < cubeBudget && slot.rarity !== targetRarity) {
            const currentRarity = slot.rarity;
            simulateCubeOnSlot(slot, slot.id);
            cubesUsed++;

            // Check if we reached target
            const currentIndex = rarityProgression.indexOf(slot.rarity);
            const targetIndex = rarityProgression.indexOf(targetRarity);
            if (currentIndex >= targetIndex) break;
        }

        if (cubesUsed >= cubeBudget) break;
    }

    // Phase 2: Use remaining cubes with Worst First strategy
    while (cubesUsed < cubeBudget) {
        // Find slot with lowest DPS gain
        let worstSlot = slots[0];
        for (const slot of slots) {
            if (slot.dpsGain < worstSlot.dpsGain) {
                worstSlot = slot;
            }
        }

        simulateCubeOnSlot(worstSlot, worstSlot.id);
        cubesUsed++;
    }

    return slots;
}

// Strategy 8: Adaptive Target Chasing
export async function runAdaptiveTargetChasingStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0,
        target: 0
    }));

    let cubesUsed = 0;

    // Use all cubes
    while (cubesUsed < cubeBudget) {
        // Update targets based on current rarity
        for (const slot of slots) {
            // Set target to top 50% for current rarity
            const threshold = await getTop25PercentileThreshold(slot.id, slot.rarity);
            slot.target = threshold * 2; // Aim for top 50% (2x the top 25% threshold)
        }

        // Find slot furthest from its target
        let targetSlot = slots[0];
        let maxDeficit = targetSlot.target - targetSlot.dpsGain;

        for (const slot of slots) {
            const deficit = slot.target - slot.dpsGain;
            if (deficit > maxDeficit) {
                maxDeficit = deficit;
                targetSlot = slot;
            }
        }

        simulateCubeOnSlot(targetSlot, targetSlot.id);
        cubesUsed++;
    }

    return slots;
}

// Strategy 9: High-Variance Gambling
export function runHighVarianceGamblingStrategy(cubeBudget) {
    // Initialize all slots to normal with no lines
    const slots = slotNames.map(slotDef => ({
        id: slotDef.id,
        name: slotDef.name,
        rarity: 'normal',
        lines: [],
        dpsGain: 0,
        cubesAtCurrentRarity: 0
    }));

    const expectedCubesForUpgrade = {
        'normal': 1 / 0.06,      // ~16.7 cubes
        'rare': 1 / 0.03333,     // ~30 cubes
        'epic': 1 / 0.0167,      // ~60 cubes
        'unique': 1 / 0.006,     // ~167 cubes
        'legendary': 1 / 0.0021  // ~476 cubes
    };

    // Use all cubes
    for (let i = 0; i < cubeBudget; i++) {
        // Weight slots by proximity to rarity upgrade
        const weights = slots.map(slot => {
            if (!expectedCubesForUpgrade[slot.rarity]) return 1;

            const upgradeProgress = slot.cubesAtCurrentRarity / expectedCubesForUpgrade[slot.rarity];
            // Heavily weight slots close to upgrading (exponential)
            return Math.pow(2, upgradeProgress * 5);
        });

        // Select slot based on weights
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        let selectedSlot = slots[0];

        for (let j = 0; j < slots.length; j++) {
            random -= weights[j];
            if (random <= 0) {
                selectedSlot = slots[j];
                break;
            }
        }

        // Track cubes used at current rarity
        const oldRarity = selectedSlot.rarity;
        simulateCubeOnSlot(selectedSlot, selectedSlot.id);

        if (selectedSlot.rarity === oldRarity) {
            selectedSlot.cubesAtCurrentRarity++;
        } else {
            selectedSlot.cubesAtCurrentRarity = 0;
        }
    }

    return slots;
}

// Pre-load all rankings needed for simulation
export async function preloadRankingsForSimulation() {
    const rarities = ['rare', 'epic', 'unique', 'legendary', 'mystic'];
    const progressText = document.getElementById('cube-simulation-progress-text');

    // Create list of all slot-rarity combinations that need loading
    const toLoad = [];
    for (const slot of slotNames) {
        for (const rarity of rarities) {
            if (!rankingsCache[slot.id]?.[rarity]) {
                toLoad.push({ slot, rarity });
            }
        }
    }

    const total = toLoad.length;
    let loaded = 0;

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < toLoad.length; i += batchSize) {
        const batch = toLoad.slice(i, i + batchSize);

        // Run batch in parallel
        await Promise.all(batch.map(async ({ slot, rarity }) => {
            await calculateRankingsForRarity(rarity, slot.id);
            loaded++;
            if (progressText) {
                progressText.textContent = `Pre-loading rankings: ${loaded}/${total} complete`;
            }
        }));
    }
}

// Run simulation
export async function runCubeSimulation() {
    if (!getSelectedClass()) {
        alert('Please select a class in the Character Setup section first.');
        return;
    }

    const cubeBudget = parseInt(document.getElementById('simulation-cube-budget').value);
    const simulationCount = parseInt(document.getElementById('simulation-count').value);

    const progressBar = document.getElementById('cube-simulation-progress');
    const progressFill = document.getElementById('cube-simulation-progress-fill');
    const progressText = document.getElementById('cube-simulation-progress-text');
    const runBtn = document.getElementById('cube-simulation-run-btn');

    // Disable button and show progress
    runBtn.disabled = true;
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Starting simulation...';

    // Results storage
    const results = {
        worstFirst: { totalGains: [], simulations: [], avgGain: 0, slotDistribution: {} },
        balancedThreshold: { totalGains: [], simulations: [], avgGain: 0, slotDistribution: {} },
        hybridFastRarity: { totalGains: [], simulations: [], avgGain: 0, slotDistribution: {} },
        rarityWeightedWorstFirst: { totalGains: [], simulations: [], avgGain: 0, slotDistribution: {} }
    };

    try {
        // Initialize simulation cache for performance
        progressText.textContent = 'Initializing simulation cache...';
        initSimulationCache();

        // Run all strategies in parallel
        progressText.textContent = 'Running all strategies in parallel...';
        progressFill.style.width = '0%';
        const batchSize = 50;

        // Track completion for all strategies
        const strategyProgress = {
            worstFirst: 0,
            balancedThreshold: 0,
            hybridFastRarity: 0,
            rarityWeightedWorstFirst: 0
        };

        // Run all simulations for all strategies in parallel
        const allPromises = [];

        // Create all simulation promises for all strategies
        for (let i = 0; i < simulationCount; i++) {
            // Worst First
            allPromises.push(
                new Promise(resolve => {
                    const slots = runWorstFirstStrategy(cubeBudget);
                    const totalGain = calculateTotalDPSGain(slots);
                    resolve({ strategy: 'worstFirst', slots, totalGain });
                })
            );

            // Balanced Threshold
            allPromises.push(
                new Promise(resolve => {
                    const slots = runBalancedThresholdStrategy(cubeBudget);
                    const totalGain = calculateTotalDPSGain(slots);
                    resolve({ strategy: 'balancedThreshold', slots, totalGain });
                })
            );

            // Hybrid Fast Rarity
            allPromises.push(
                (async () => {
                    const slots = await runHybridFastRarityStrategy(cubeBudget);
                    const totalGain = calculateTotalDPSGain(slots);
                    return { strategy: 'hybridFastRarity', slots, totalGain };
                })()
            );

            // Rarity-Weighted Worst First
            allPromises.push(
                new Promise(resolve => {
                    const slots = runRarityWeightedWorstFirstStrategy(cubeBudget);
                    const totalGain = calculateTotalDPSGain(slots);
                    resolve({ strategy: 'rarityWeightedWorstFirst', slots, totalGain });
                })
            );
        }

        // Process all promises in batches to avoid overwhelming the browser
        const totalSimulations = allPromises.length;
        let completedSimulations = 0;

        for (let i = 0; i < totalSimulations; i += batchSize) {
            const batch = allPromises.slice(i, Math.min(i + batchSize, totalSimulations));
            const batchResults = await Promise.all(batch);

            // Distribute results to appropriate strategy
            batchResults.forEach(result => {
                const strategy = result.strategy;
                if (results[strategy]) {
                    results[strategy].totalGains.push(result.totalGain);
                    results[strategy].simulations.push(result);
                    strategyProgress[strategy]++;
                }
            });

            completedSimulations += batch.length;
            const progress = (completedSimulations / totalSimulations) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Running all strategies: ${completedSimulations}/${totalSimulations} completed`;
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Calculate averages for all strategies
        Object.keys(results).forEach(strategy => {
            results[strategy].avgGain = results[strategy].totalGains.reduce((a, b) => a + b, 0) / simulationCount;
        });

        // Hide progress
        progressFill.style.width = '100%';
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 500);

        // Display results
        displaySimulationResults(results, cubeBudget, simulationCount);

    } catch (error) {
        console.error('Error running simulation:', error);
        alert('Error running simulation. Check console for details.');
    } finally {
        runBtn.disabled = false;
    }
}

// Format slot details for display
export function formatSlotDetails(slots) {
    return slots.map((slot, idx) => {
        const linesHTML = slot.lines && slot.lines.length > 0
            ? slot.lines.map((line, i) => {
                if (!line) return '';
                const isPercentStat = line.stat.includes('%');
                const valueSuffix = isPercentStat ? '%' : '';
                const primeTag = line.prime ? ' <span style="color: var(--accent-primary); font-weight: 600;">(P)</span>' : '';
                return `L${i+1}: ${line.stat} ${line.value}${valueSuffix}${primeTag}`;
            }).join('<br>')
            : 'No lines';

        return `
            <div style="background: rgba(255, 255, 255, 0.5); border-radius: 8px; padding: 10px; font-size: 0.85em;">
                <div style="font-weight: 700; color: var(--accent-primary); margin-bottom: 5px;">
                    ${slot.name} [${slot.rarity.toUpperCase()}]
                </div>
                <div style="color: var(--text-secondary); line-height: 1.5; margin-bottom: 5px;">
                    ${linesHTML}
                </div>
                <div style="color: var(--accent-success); font-weight: 600;">
                    DPS Gain: +${slot.dpsGain.toFixed(2)}%
                </div>
            </div>
        `;
    }).join('');
}

// Create distribution chart
export function createSimulationDistributionChart(canvasId, gains, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        setTimeout(() => createSimulationDistributionChart(canvasId, gains, label), 50);
        return;
    }

    // Create histogram
    const sorted = [...gains].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const bucketCount = 30;
    const bucketSize = (max - min) / bucketCount;

    const buckets = new Array(bucketCount).fill(0);
    const bucketLabels = [];

    for (let i = 0; i < bucketCount; i++) {
        const bucketStart = min + (i * bucketSize);
        bucketLabels.push(bucketStart.toFixed(2));
    }

    sorted.forEach(gain => {
        const bucketIndex = Math.min(
            Math.floor((gain - min) / bucketSize),
            bucketCount - 1
        );
        buckets[bucketIndex]++;
    });

    // Get theme colors
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#1f2937';
    const gridColor = isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.5)';

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: bucketLabels,
            datasets: [{
                label: 'Simulations',
                data: buckets,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${label} - DPS Gain Distribution`,
                    color: textColor,
                    font: { size: 14, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const idx = context[0].dataIndex;
                            const start = parseFloat(bucketLabels[idx]);
                            const end = start + bucketSize;
                            return `${start.toFixed(2)}% - ${end.toFixed(2)}%`;
                        },
                        label: function(context) {
                            const count = buckets[context.dataIndex];
                            const total = buckets.reduce((a, b) => a + b, 0);
                            const percentage = ((count / total) * 100).toFixed(1);
                            return `${count} simulations (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        color: textColor,
                        font: { size: 10 }
                    },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// Display simulation results
export function displaySimulationResults(results, cubeBudget, simulationCount) {
    const resultsDiv = document.getElementById('cube-simulation-results');
    if (!resultsDiv) return;

    // Find best strategy
    let bestStrategy = Object.keys(results)[0];
    let bestAvg = results[bestStrategy].avgGain;

    Object.keys(results).forEach(strategy => {
        if (results[strategy].avgGain > bestAvg) {
            bestStrategy = strategy;
            bestAvg = results[strategy].avgGain;
        }
    });

    const formatStrategy = (strategyKey, name, data, isBest) => {
        const gains = [...data.totalGains].sort((a, b) => a - b);
        const min = gains[0];
        const max = gains[gains.length - 1];
        const median = gains[Math.floor(gains.length / 2)];
        const p25 = gains[Math.floor(gains.length * 0.25)];
        const p75 = gains[Math.floor(gains.length * 0.75)];

        // Find simulations for each percentile
        const minSimIdx = data.simulations.findIndex(s => s.totalGain === min);
        const p25SimIdx = data.simulations.findIndex(s => Math.abs(s.totalGain - p25) < 0.01);
        const medianSimIdx = data.simulations.findIndex(s => Math.abs(s.totalGain - median) < 0.01);
        const p75SimIdx = data.simulations.findIndex(s => Math.abs(s.totalGain - p75) < 0.01);
        const maxSimIdx = data.simulations.findIndex(s => s.totalGain === max);

        const detailsId = `sim-details-${strategyKey}`;
        const chartCanvasId = `sim-chart-${strategyKey}`;

        return `
            <details style="background: linear-gradient(135deg, ${isBest ? 'rgba(52, 199, 89, 0.1), rgba(0, 122, 255, 0.05)' : 'rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.05)'}); border: 2px solid ${isBest ? 'var(--accent-success)' : 'rgba(59, 130, 246, 0.3)'}; border-radius: 12px; margin-bottom: 12px; transition: all 0.3s;">
                <summary style="cursor: pointer; padding: 16px 20px; user-select: none; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                        <span style="color: ${isBest ? 'var(--accent-success)' : 'var(--accent-primary)'}; font-size: 1.05em; font-weight: 700;">
                            ${isBest ? '⭐ ' : ''}${name}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 20px; font-size: 0.95em; flex-shrink: 0;">
                        <div style="text-align: right;">
                            <span style="color: var(--text-secondary); font-size: 0.85em;">Avg:</span>
                            <span style="color: ${isBest ? 'var(--accent-success)' : 'var(--accent-primary)'}; font-weight: 700; margin-left: 6px;">+${data.avgGain.toFixed(2)}%</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: var(--text-secondary); font-size: 0.85em;">Range:</span>
                            <span style="color: var(--text-primary); font-weight: 600; margin-left: 6px;">+${min.toFixed(2)}% - +${max.toFixed(2)}%</span>
                        </div>
                    </div>
                </summary>

                <div style="padding: 0 20px 20px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); margin-top: -5px; padding-top: 20px;">
                    <!-- Stats Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 15px;">
                        <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.5); border-radius: 8px;">
                            <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">Average Gain</div>
                            <div style="font-size: 1.5em; font-weight: 700; color: var(--accent-primary);">+${data.avgGain.toFixed(2)}%</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.5); border-radius: 8px;">
                            <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">Median</div>
                            <div style="font-size: 1.3em; font-weight: 700; color: var(--text-primary);">+${median.toFixed(2)}%</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.5); border-radius: 8px;">
                            <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">Min / Max</div>
                            <div style="font-size: 1.1em; font-weight: 600; color: var(--text-primary);">+${min.toFixed(2)}% / +${max.toFixed(2)}%</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.5); border-radius: 8px;">
                            <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">P25 / P75</div>
                            <div style="font-size: 1.1em; font-weight: 600; color: var(--text-primary);">+${p25.toFixed(2)}% / +${p75.toFixed(2)}%</div>
                        </div>
                    </div>

                    <!-- Detailed Results Dropdown -->
                    <details style="background: rgba(0, 0, 0, 0.05); border-radius: 8px; padding: 10px; margin-top: 10px;">
                        <summary style="cursor: pointer; font-weight: 600; color: var(--accent-primary); user-select: none; font-size: 0.95em;">
                            View Detailed Results (Slot Stats & Distribution)
                        </summary>
                        <div id="${detailsId}" style="margin-top: 15px;">
                        <!-- Sub-tabs -->
                        <div style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid rgba(0, 0, 0, 0.1); padding-bottom: 0;">
                            <button class="sim-detail-tab active" data-strategy="${strategyKey}" data-tab="distribution" onclick="switchSimDetailTab('${strategyKey}', 'distribution')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s;">Distribution</button>
                            <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="min" onclick="switchSimDetailTab('${strategyKey}', 'min')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s;">Min (+${min.toFixed(2)}%)</button>
                            <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="p25" onclick="switchSimDetailTab('${strategyKey}', 'p25')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s;">P25 (+${p25.toFixed(2)}%)</button>
                            <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="median" onclick="switchSimDetailTab('${strategyKey}', 'median')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s;">Median (+${median.toFixed(2)}%)</button>
                            <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="p75" onclick="switchSimDetailTab('${strategyKey}', 'p75')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s;">P75 (+${p75.toFixed(2)}%)</button>
                            <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="max" onclick="switchSimDetailTab('${strategyKey}', 'max')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s;">Max (+${max.toFixed(2)}%)</button>
                        </div>

                        <!-- Distribution Tab -->
                        <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="distribution" style="display: block;">
                            <canvas id="${chartCanvasId}" style="max-height: 300px;"></canvas>
                        </div>

                        <!-- Min Tab -->
                        <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="min" style="display: none;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                ${minSimIdx >= 0 ? formatSlotDetails(data.simulations[minSimIdx].slots) : 'No data'}
                            </div>
                        </div>

                        <!-- P25 Tab -->
                        <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="p25" style="display: none;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                ${p25SimIdx >= 0 ? formatSlotDetails(data.simulations[p25SimIdx].slots) : 'No data'}
                            </div>
                        </div>

                        <!-- Median Tab -->
                        <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="median" style="display: none;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                ${medianSimIdx >= 0 ? formatSlotDetails(data.simulations[medianSimIdx].slots) : 'No data'}
                            </div>
                        </div>

                        <!-- P75 Tab -->
                        <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="p75" style="display: none;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                ${p75SimIdx >= 0 ? formatSlotDetails(data.simulations[p75SimIdx].slots) : 'No data'}
                            </div>
                        </div>

                        <!-- Max Tab -->
                        <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="max" style="display: none;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                ${maxSimIdx >= 0 ? formatSlotDetails(data.simulations[maxSimIdx].slots) : 'No data'}
                            </div>
                        </div>
                        </div>
                    </details>
                </div>
            </details>
        `;
    };

    // Strategy names and descriptions
    const strategyInfo = {
        worstFirst: { name: 'Worst First', desc: 'Always upgrades the slot currently providing the least DPS gain with a single cube at a time.' },
        balancedThreshold: { name: 'Balanced Threshold', desc: 'Keeps all slots within a certain DPS gain range of each other, preventing over-investment in terrible slots.' },
        hybridFastRarity: { name: 'Hybrid: Fast Rarity + Worst First', desc: 'First rushes all slots to Epic rarity, then switches to Worst First strategy for remaining cubes.' },
        rarityWeightedWorstFirst: { name: 'Rarity-Weighted Worst First', desc: 'Like Worst First but factors in how close a slot is to its next rarity upgrade, prioritizing slots near upgrade thresholds.' }
    };

    // Sort strategies by average gain (best first)
    const sortedStrategies = Object.keys(results).sort((a, b) => results[b].avgGain - results[a].avgGain);

    resultsDiv.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: var(--accent-primary); margin-bottom: 10px; font-size: 1.2em; font-weight: 600;">
                Simulation Results
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.9em;">
                Cube Budget: ${cubeBudget} | Simulations: ${simulationCount}
            </p>
        </div>

        ${sortedStrategies.map(strategyKey => {
            const info = strategyInfo[strategyKey];
            return formatStrategy(strategyKey, info.name, results[strategyKey], strategyKey === bestStrategy);
        }).join('')}

        <div style="background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(75, 0, 130, 0.05)); border: 2px solid rgba(138, 43, 226, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
            <h4 style="color: var(--accent-primary); margin-bottom: 10px;">Strategy Descriptions</h4>
            <div style="color: var(--text-secondary); font-size: 0.9em; line-height: 1.6;">
                ${Object.keys(strategyInfo).map(key => `
                    <p style="margin-top: 8px;"><strong>${strategyInfo[key].name}:</strong> ${strategyInfo[key].desc}</p>
                `).join('')}
            </div>
        </div>
    `;

    // Create charts after DOM is updated
    setTimeout(() => {
        sortedStrategies.forEach(strategyKey => {
            const info = strategyInfo[strategyKey];
            createSimulationDistributionChart(`sim-chart-${strategyKey}`, results[strategyKey].totalGains, info.name);
        });
    }, 100);
}

// Switch between detail tabs
export function switchSimDetailTab(strategy, tab) {
    // Update tab buttons
    document.querySelectorAll(`.sim-detail-tab[data-strategy="${strategy}"]`).forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
            btn.style.borderBottomColor = 'var(--accent-primary)';
        } else {
            btn.classList.remove('active');
            btn.style.borderBottomColor = 'transparent';
        }
    });

    // Update content visibility
    document.querySelectorAll(`.sim-detail-content[data-strategy="${strategy}"]`).forEach(content => {
        content.style.display = content.dataset.tab === tab ? 'block' : 'none';
    });
}
