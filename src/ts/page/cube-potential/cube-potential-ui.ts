/**
 * Cube Potential UI
 * HTML generation and event handlers for the cube potential tab
 */

import {
    currentCubeSlot,
    currentPotentialType,
    rankingsCache,
    rankingsInProgress,
    switchPotentialType,
    selectCubeSlot,
    clearCubeRankingsCache,
    getRarityColor,
    calculateComparison,
    getPercentileForGain,
    initializeCubePotential
} from '@ts/page/cube-potential/cube-potential.js';
import { gearLabStore } from '@ts/store/gear-lab-store.js';
import {
    SLOT_NAMES,
    SLOT_SPECIFIC_POTENTIALS,
    EQUIPMENT_POTENTIAL_DATA,
    RANKINGS_PER_PAGE
} from '@ts/page/cube-potential/cube-potential-data.js';
import type {
    CubeSlotId,
    PotentialType,
    Rarity,
    PotentialLine,
    PotentialLineEntry,
    PotentialSet
} from '@ts/types/page/gear-lab/gear-lab.types';
import { StatCalculationService } from '@ts/services/stat-calculation-service.js';
import { lineExistsInRarity, calculateSlotSetGain } from '@ts/page/cube-potential/cube-potential.js';
import { loadoutStore } from '@ts/store/loadout.store';

// ============================================================================
// STATE
// ============================================================================

/**
 * Current page for rankings pagination
 */
let currentRankingsPage = 1;

/**
 * Summary sort column and direction
 */
let summarySortColumn: 'regular' | 'bonus' = 'regular';
let summarySortDescending = true;

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate the complete HTML for the cube potential tab
 */
export function generateCubePotentialHTML(): string {
    return `
        <!-- Class Warning Banner -->
        <div id="cube-class-warning" class="optimization-info-banner optimization-info-banner--warning" style="display: none;">
            <span class="optimization-info-banner-icon">⚠️</span>
            <div>
                <div style="font-weight: 700; font-size: 1em; margin-bottom: 4px;">No Class Selected</div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">Please select your class in the Hero Power section above to use the Cube Potential calculator. Class selection is needed to properly calculate stat damage gains.</div>
            </div>
        </div>

        <!-- Flattened Main Tab Navigation -->
        <div id="tab-container-main" class="cube-main-tabs">
            <button id="cube-main-tab-comparison" class="tab-button active" data-tab="comparison">
                <span class="cube-tab-label">Comparison</span>
            </button>
            <button id="cube-main-tab-rankings" class="tab-button" data-tab="rankings">
                <span class="cube-tab-label">Best Potentials</span>
            </button>
            <button id="cube-main-tab-summary" class="tab-button" data-tab="summary">
                <span class="cube-tab-label">All Slots Summary</span>
            </button>
            <button id="cube-main-tab-simulation" class="tab-button" data-tab="simulation">
                <span class="cube-tab-label">Simulation</span>
            </button>
            <button id="cube-main-tab-optimal" class="tab-button" data-tab="optimal">
                <span class="cube-tab-label">Optimal Strategy</span>
            </button>
        </div>

        <!-- Comparison Tab Content -->
        <div id="cube-comparison-content" class="cube-tab-content active">
            ${generateComparisonTabHTML()}
        </div>

        <!-- Best Potentials Tab Content -->
        <div id="cube-rankings-content" class="cube-tab-content">
            ${generateRankingsTabHTML()}
        </div>

        <!-- All Slots Summary Tab Content -->
        <div id="cube-summary-content" class="cube-tab-content">
            ${generateSummaryTabHTML()}
        </div>

        <!-- Simulation Tab Content -->
        <div id="cube-simulation-content" class="cube-tab-content">
            ${generateSimulationTabHTML()}
        </div>

        <!-- Optimal Strategy Tab Content -->
        <div id="cube-optimal-content" class="cube-tab-content">
            ${generateOptimalTabHTML()}
        </div>
    `;
}

/**
 * Generate HTML for the Comparison tab
 */
function generateComparisonTabHTML(): string {
    return `
        <!-- Equipment Slot Selector -->
        <div class="cube-slot-selector-wrapper">
            <label for="cube-slot-selector" class="cube-slot-label">Equipment Slot</label>
            <div id="cube-slot-selector" class="cube-slot-buttons-container"></div>
        </div>

        <!-- Context Controls for Comparison Tab (Potential Type & Rarity) -->
        <div id="cube-comparison-controls" class="cube-context-controls" style="display: block;">
            <div class="cube-controls-grid">
                <!-- Potential Type Toggle -->
                <div class="cube-control-group">
                    <label class="cube-control-label">Potential Type</label>
                    <div class="cube-potential-type-buttons">
                        <button id="cube-regular-potential-btn" class="cube-potential-type-btn active">
                            <span class="cube-type-icon">✦</span>
                            <span>Regular</span>
                        </button>
                        <button id="cube-bonus-potential-btn" class="cube-potential-type-btn">
                            <span class="cube-type-icon">✧</span>
                            <span>Bonus</span>
                        </button>
                    </div>
                </div>

                <!-- Rarity Selector -->
                <div class="cube-rarity-row">
                    <div class="cube-control-group">
                        <label for="cube-rarity-selector" class="cube-control-label">Slot Rarity</label>
                        <select id="cube-rarity-selector" class="cube-rarity-select">
                            <option value="normal">Normal</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="unique">Unique</option>
                            <option value="legendary">Legendary</option>
                            <option value="mystic">Mystic</option>
                        </select>
                    </div>

                    <div class="cube-roll-count-container">
                        <label for="cube-roll-count" style="font-size: 0.85em; color: var(--text-secondary);">
                            Rolls at current rarity
                        </label>
                        <input type="number" id="cube-roll-count" min="0" max="999" value="0"
                               style="width: 80px; padding: 8px 12px; border-radius: 8px;
                                      border: 1px solid var(--border-color); background: var(--bg-secondary);
                                      color: var(--text-primary); font-size: 0.95em;">
                    </div>
                </div>
            </div>
        </div>

        <div class="cube-comparison-grid">
            <!-- Set A (Current) Card -->
            <div class="cube-set-card cube-set-card--a">
                <div class="cube-set-card-header">
                    <h3 class="cube-set-card-title">Set A (Current)</h3>
                    <span class="cube-set-card-subtitle">Your configured potential</span>
                </div>

                <div class="cube-set-card-body">
                    <div class="cube-line-input-group">
                        <label class="cube-line-label" for="cube-setA-line1-stat">Line 1</label>
                        <select id="cube-setA-line1-stat" class="cube-line-select"></select>
                    </div>

                    <div class="cube-line-input-group">
                        <label class="cube-line-label" for="cube-setA-line2-stat">Line 2</label>
                        <select id="cube-setA-line2-stat" class="cube-line-select"></select>
                    </div>

                    <div class="cube-line-input-group">
                        <label class="cube-line-label" for="cube-setA-line3-stat">Line 3</label>
                        <select id="cube-setA-line3-stat" class="cube-line-select"></select>
                    </div>
                </div>
            </div>

            <!-- Set B (Comparison) Card -->
            <div class="cube-set-card cube-set-card--b">
                <div class="cube-set-card-header">
                    <h3 class="cube-set-card-title">Set B (Comparison)</h3>
                    <span class="cube-set-card-subtitle">Test alternative potential</span>
                </div>

                <div class="cube-set-card-body">
                    <div class="cube-line-input-group">
                        <label class="cube-line-label" for="cube-setB-line1-stat">Line 1</label>
                        <select id="cube-setB-line1-stat" class="cube-line-select"></select>
                    </div>

                    <div class="cube-line-input-group">
                        <label class="cube-line-label" for="cube-setB-line2-stat">Line 2</label>
                        <select id="cube-setB-line2-stat" class="cube-line-select"></select>
                    </div>

                    <div class="cube-line-input-group">
                        <label class="cube-line-label" for="cube-setB-line3-stat">Line 3</label>
                        <select id="cube-setB-line3-stat" class="cube-line-select"></select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Comparison Results -->
        <div id="cube-comparison-results" class="cube-results-section"></div>
    `;
}

/**
 * Generate HTML for the Rankings tab
 */
function generateRankingsTabHTML(): string {
    return `
        <!-- Controls for Rankings (Independent slot & rarity selectors) -->
        <div id="cube-rankings-controls" class="cube-context-controls" style="display: block;">
            <div class="cube-controls-grid">
                <!-- Slot Selector -->
                <div class="cube-control-group">
                    <label for="cube-rankings-slot-selector" class="cube-control-label">Equipment Slot</label>
                    <select id="cube-rankings-slot-selector" class="cube-rarity-select">
                        <!-- Populated by JavaScript -->
                    </select>
                    <p style="font-size: 0.85em; color: var(--text-secondary); margin-top: var(--cube-space-sm);">
                        Some slots have unique potential lines available only to them
                    </p>
                </div>

                <!-- Rarity Selector -->
                <div class="cube-control-group">
                    <label for="cube-rankings-rarity-selector" class="cube-control-label">Rarity Tier</label>
                    <select id="cube-rankings-rarity-selector" class="cube-rarity-select">
                        <option value="normal">Normal</option>
                        <option value="rare">Rare</option>
                        <option value="epic" selected>Epic</option>
                        <option value="unique">Unique</option>
                        <option value="legendary">Legendary</option>
                        <option value="mystic">Mystic</option>
                    </select>
                    <p style="font-size: 0.85em; color: var(--text-secondary); margin-top: var(--cube-space-sm);">
                        View best combinations for this rarity (independent of saved config)
                    </p>
                </div>
            </div>
        </div>

        <!-- Progress Bar -->
        <div id="cube-rankings-progress" class="cube-progress-bar" style="display: none;">
            <div class="cube-progress-track">
                <div id="cube-rankings-progress-fill" class="cube-progress-fill"></div>
            </div>
            <p id="cube-rankings-progress-text" class="cube-progress-text">Calculating best combinations...</p>
        </div>

        <!-- Rankings Results -->
        <div id="cube-rankings-results" class="cube-rankings-results"></div>
    `;
}

/**
 * Generate HTML for the Summary tab
 */
function generateSummaryTabHTML(): string {
    return `
        <div class="cube-summary-header">
            <h3 class="cube-summary-title">All Slots Potential Summary</h3>
            <p class="cube-summary-description">Overview of Set A DPS gains for all equipment slots (Regular and Bonus Potential)</p>
        </div>

        <!-- Loading Progress -->
        <div id="cube-summary-progress" class="cube-progress-bar" style="display: none;">
            <div class="cube-progress-track">
                <div id="cube-summary-progress-fill" class="cube-progress-fill"></div>
            </div>
            <p id="cube-summary-progress-text" class="cube-progress-text">Loading rankings across all slots...</p>
        </div>

        <div id="cube-summary-results" class="cube-summary-results"></div>
    `;
}

/**
 * Generate HTML for the Simulation tab
 */
function generateSimulationTabHTML(): string {
    return `
        <div class="cube-simulation-header">
            <h3 class="cube-simulation-title">Cube Strategy Simulation</h3>
            <p class="cube-simulation-description">Compare different cubing strategies to find the most efficient approach</p>
        </div>

        <div id="cube-simulation-results" class="cube-simulation-results"></div>
    `;
}

/**
 * Generate HTML for the Optimal Strategy tab
 */
function generateOptimalTabHTML(): string {
    return `
        <div class="cube-optimal-header">
            <h3 class="cube-optimal-title">Optimal Strategy Guidance</h3>
            <p class="cube-optimal-description">Get recommendations on which slots to cube first for maximum DPS gain</p>
        </div>

        <div id="cube-optimal-content-inner" class="cube-optimal-content-inner"></div>
    `;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the cube potential UI
 */
export async function initializeCubePotentialUI(): Promise<void> {
    const container = document.getElementById('optimization-cube-potential');
    if (!container) {
        console.error('Cube potential container not found');
        return;
    }

    // Generate HTML
    container.innerHTML = generateCubePotentialHTML();

    // Initialize core system
    await initializeCubePotential();

    // Setup UI components
    setupSlotSelector();
    setupPotentialTypeButtons();
    setupRaritySelector();
    setupRollCountInput();
    setupPotentialLineDropdowns();
    setupTabNavigation();
    setupRankingsControls();

    // Load data from store
    loadCubeDataFromStore();

    // Initial UI update
    updateSlotButtonColors();
    updateCubePotentialUI();
    updateClassWarning();

    // Expose global functions
    exposeGlobalFunctions();
}

/**
 * Load cube data from store and update UI
 */
function loadCubeDataFromStore(): void {
    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    // Update rarity selector
    const raritySelector = document.getElementById('cube-rarity-selector') as HTMLSelectElement;
    if (raritySelector) {
        raritySelector.value = cubeData[currentCubeSlot][currentPotentialType].rarity;
    }

    // Update roll count input
    const rollCountInput = document.getElementById('cube-roll-count') as HTMLInputElement;
    if (rollCountInput) {
        rollCountInput.value = cubeData[currentCubeSlot][currentPotentialType].rollCount.toString();
    }
}

// ============================================================================
// UI SETUP FUNCTIONS
// ============================================================================

/**
 * Setup equipment slot selector buttons
 */
function setupSlotSelector(): void {
    const slotSelector = document.getElementById('cube-slot-selector');
    if (!slotSelector) return;

    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    slotSelector.innerHTML = '';

    SLOT_NAMES.forEach(slot => {
        const slotBtn = document.createElement('button');
        slotBtn.className = 'cube-slot-btn';
        slotBtn.textContent = slot.name;
        slotBtn.dataset.slot = slot.id;

        // Apply rarity color to border
        const slotRarity = cubeData[slot.id]?.[currentPotentialType]?.rarity || 'normal';
        const rarityColor = getRarityColor(slotRarity);
        slotBtn.style.borderColor = rarityColor;

        // Apply active state
        const isActive = slot.id === currentCubeSlot;
        if (isActive) {
            slotBtn.classList.add('active');
            slotBtn.style.boxShadow = `0 4px 16px ${rarityColor}60, 0 0 0 2px ${rarityColor}`;
        } else {
            slotBtn.style.boxShadow = `0 2px 8px ${rarityColor}40`;
        }

        slotBtn.addEventListener('click', () => {
            selectCubeSlot(slot.id);
            updateSlotButtonColors();
            loadCubeDataFromStore();
            updateCubePotentialUI();
            calculateComparisonAndDisplay();
        });

        slotSelector.appendChild(slotBtn);
    });
}

/**
 * Setup potential type toggle buttons
 */
function setupPotentialTypeButtons(): void {
    const regularBtn = document.getElementById('cube-regular-potential-btn');
    const bonusBtn = document.getElementById('cube-bonus-potential-btn');

    if (regularBtn && bonusBtn) {
        regularBtn.addEventListener('click', () => {
            switchPotentialType('regular');
            updatePotentialTypeButtons();
            loadCubeDataFromStore();
            updateSlotButtonColors();
            updateCubePotentialUI();
            calculateComparisonAndDisplay();
        });

        bonusBtn.addEventListener('click', () => {
            switchPotentialType('bonus');
            updatePotentialTypeButtons();
            loadCubeDataFromStore();
            updateSlotButtonColors();
            updateCubePotentialUI();
            calculateComparisonAndDisplay();
        });
    }
}

/**
 * Setup rarity selector
 */
function setupRaritySelector(): void {
    const raritySelector = document.getElementById('cube-rarity-selector') as HTMLSelectElement;
    if (!raritySelector) return;

    raritySelector.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const newRarity = target.value as Rarity;
        gearLabStore.updateCubeRarity(currentCubeSlot, currentPotentialType, newRarity);

        updateSlotButtonColors();
        updateCubePotentialUI();
        calculateComparisonAndDisplay();
    });
}

/**
 * Setup roll count input
 */
function setupRollCountInput(): void {
    const rollCountInput = document.getElementById('cube-roll-count') as HTMLInputElement;
    if (!rollCountInput) return;

    rollCountInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value) || 0;
        gearLabStore.updateCubeRollCount(currentCubeSlot, currentPotentialType, value);
    });
}

/**
 * Setup potential line dropdowns
 */
function setupPotentialLineDropdowns(): void {
    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    const rarity = cubeData[currentCubeSlot][currentPotentialType].rarity;

    // Setup Set A dropdowns
    updatePotentialLineDropdowns('setA', rarity);

    // Setup Set B dropdowns
    updatePotentialLineDropdowns('setB', rarity);
}

/**
 * Setup tab navigation
 */
function setupTabNavigation(): void {
    const tabs = document.querySelectorAll('.cube-main-tabs .tab-button');
    const contents = document.querySelectorAll('.cube-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            if (!tabName) return;

            // Update active states
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(`cube-${tabName}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Handle tab-specific initialization
            if (tabName === 'summary') {
                displayAllSlotsSummary();
            }
        });
    });
}

/**
 * Setup rankings controls
 */
function setupRankingsControls(): void {
    const slotSelector = document.getElementById('cube-rankings-slot-selector') as HTMLSelectElement;
    const raritySelector = document.getElementById('cube-rankings-rarity-selector') as HTMLSelectElement;

    if (!slotSelector || !raritySelector) return;

    // Populate slot selector
    SLOT_NAMES.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.id;
        option.textContent = slot.name;
        slotSelector.appendChild(option);
    });

    // Set default to current slot
    slotSelector.value = currentCubeSlot;

    // Add event listeners
    slotSelector.addEventListener('change', () => {
        currentRankingsPage = 1;
        // Rankings will be calculated on demand when tab is visible
    });

    raritySelector.addEventListener('change', () => {
        currentRankingsPage = 1;
        // Rankings will be calculated on demand when tab is visible
    });
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Update slot button colors based on rarity
 */
export function updateSlotButtonColors(): void {
    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    SLOT_NAMES.forEach(slot => {
        const slotBtn = document.querySelector(`.cube-slot-btn[data-slot="${slot.id}"]`) as HTMLElement;
        if (!slotBtn) return;

        const slotRarity = cubeData[slot.id]?.[currentPotentialType]?.rarity || 'normal';
        const rarityColor = getRarityColor(slotRarity);
        slotBtn.style.borderColor = rarityColor;

        const isActive = slot.id === currentCubeSlot;
        if (isActive) {
            slotBtn.style.boxShadow = `0 4px 16px ${rarityColor}60, 0 0 0 2px ${rarityColor}`;
        } else {
            slotBtn.style.boxShadow = `0 2px 8px ${rarityColor}40`;
        }
    });
}

/**
 * Update potential type button states
 */
function updatePotentialTypeButtons(): void {
    const regularBtn = document.getElementById('cube-regular-potential-btn');
    const bonusBtn = document.getElementById('cube-bonus-potential-btn');

    if (regularBtn && bonusBtn) {
        regularBtn.classList.toggle('active', currentPotentialType === 'regular');
        bonusBtn.classList.toggle('active', currentPotentialType === 'bonus');
    }
}

/**
 * Update potential line dropdowns for a set
 */
function updatePotentialLineDropdowns(setName: 'setA' | 'setB', rarity: Rarity): void {
    const potentialData = EQUIPMENT_POTENTIAL_DATA[rarity];
    if (!potentialData) return;

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const statSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`) as HTMLSelectElement;
        if (!statSelect) continue;

        // Clear existing options
        statSelect.innerHTML = '<option value="">-- Select Stat --</option>';

        // Get available stats for this line
        const lineKey = `line${lineNum}` as 'line1' | 'line2' | 'line3';
        let lineData: PotentialLineEntry[] = [...(potentialData[lineKey] || [])];

        // Add slot-specific lines if available
        if (SLOT_SPECIFIC_POTENTIALS[currentCubeSlot] && SLOT_SPECIFIC_POTENTIALS[currentCubeSlot][rarity]) {
            const slotSpecificLines = SLOT_SPECIFIC_POTENTIALS[currentCubeSlot][rarity][lineKey as keyof typeof SLOT_SPECIFIC_POTENTIALS[CubeSlotId][Rarity]];
            if (slotSpecificLines) {
                lineData = [...slotSpecificLines, ...lineData];
            }
        }

        if (!lineData || lineData.length === 0) continue;

        // Build unique stat list with values
        const statOptions = new Map<string, { text: string; stat: string; value: number; prime: boolean }>();

        lineData.forEach(entry => {
            const isPercentStat = entry.stat.includes('%');
            const valueSuffix = isPercentStat ? '%' : '';
            const displayText = entry.prime
                ? `${entry.stat} - ${entry.value}${valueSuffix} (Prime)`
                : `${entry.stat} - ${entry.value}${valueSuffix}`;

            const key = `${entry.stat}|${entry.value}|${entry.prime}`;
            statOptions.set(key, {
                text: displayText,
                stat: entry.stat,
                value: entry.value,
                prime: entry.prime
            });
        });

        // Add options to dropdown
        statOptions.forEach((opt, key) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = opt.text;
            option.dataset.stat = opt.stat;
            option.dataset.value = opt.value.toString();
            option.dataset.prime = opt.prime.toString();
            statSelect.appendChild(option);
        });

        // Add change listener
        statSelect.addEventListener('change', (e) => {
            const selectedOption = statSelect.selectedOptions[0];
            if (selectedOption && selectedOption.dataset.value) {
                const [stat, value, prime] = (e.target as HTMLSelectElement).value.split('|');
                gearLabStore.updateCubeLine(
                    currentCubeSlot,
                    currentPotentialType,
                    setName,
                    lineNum as 1 | 2 | 3,
                    { stat, value: parseFloat(value), prime: prime === 'true' }
                );
            } else {
                gearLabStore.updateCubeLine(
                    currentCubeSlot,
                    currentPotentialType,
                    setName,
                    lineNum as 1 | 2 | 3,
                    { stat: '', value: 0, prime: false }
                );
            }

            calculateComparisonAndDisplay();
        });
    }

    // Restore saved values
    restorePotentialLineValues(setName);
}

/**
 * Restore saved values to potential line dropdowns
 */
function restorePotentialLineValues(setName: 'setA' | 'setB'): void {
    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    const setData = cubeData[currentCubeSlot][currentPotentialType][setName];

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const lineKey = `line${lineNum}` as 'line1' | 'line2' | 'line3';
        const line = setData[lineKey];
        const statSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`) as HTMLSelectElement;

        if (!statSelect) continue;

        if (!line || !line.stat) {
            statSelect.value = '';
            continue;
        }

        // Find matching option
        const key = `${line.stat}|${line.value}|${line.prime}`;
        const option = Array.from(statSelect.options).find(opt => opt.value === key);

        if (option) {
            statSelect.value = key;
        } else {
            statSelect.value = '';
        }
    }
}

/**
 * Update cube potential UI
 */
export function updateCubePotentialUI(): void {
    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    const rarity = cubeData[currentCubeSlot][currentPotentialType].rarity;

    // Update dropdowns for Set A and Set B
    updatePotentialLineDropdowns('setA', rarity);
    updatePotentialLineDropdowns('setB', rarity);

    // Calculate and display comparison
    calculateComparisonAndDisplay();
}

/**
 * Update class warning banner
 */
export function updateClassWarning(): void {
    const warningBanner = document.getElementById('cube-class-warning');
    if (!warningBanner) return;

    if (!loadoutStore.getSelectedClass()) {
        warningBanner.style.display = 'block';
    } else {
        warningBanner.style.display = 'none';
    }
}

// ============================================================================
// COMPARISON DISPLAY
// ============================================================================

/**
 * Calculate comparison and display results
 */
function calculateComparisonAndDisplay(): void {
    if (!loadoutStore.getSelectedClass()) {
        updateClassWarning();
        return;
    }

    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    const result = calculateComparison(cubeData, currentCubeSlot, currentPotentialType);
    if (!result) return;

    displayComparisonResults(result);
}

/**
 * Display comparison results
 */
function displayComparisonResults(result: {
    setAGain: number;
    setBGain: number;
    setBAbsoluteGain: number;
    deltaGain: number;
    setAStats: any;
    setBStats: any;
}): void {
    const resultsDiv = document.getElementById('cube-comparison-results');
    if (!resultsDiv) return;

    const { setAGain, setBGain, setBAbsoluteGain } = result;

    resultsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="background: linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(0, 122, 255, 0.05)); border: 2px solid var(--accent-success); border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px var(--shadow); text-align: center;">
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set A Gain<br><span style="font-size: 0.85em;">(vs Baseline)</span></div>
                <div style="font-size: 1.8em; font-weight: 700; color: ${setAGain >= 0 ? '#4ade80' : '#f87171'};">
                    ${setAGain >= 0 ? '+' : ''}${setAGain.toFixed(2)}%
                </div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.05)); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px var(--shadow); text-align: center;">
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set B Gain<br><span style="font-size: 0.85em;">(vs Set A)</span></div>
                <div style="font-size: 1.8em; font-weight: 700; color: ${setBGain >= 0 ? '#4ade80' : '#f87171'};">
                    ${setBGain >= 0 ? '+' : ''}${setBGain.toFixed(2)}%
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// SUMMARY DISPLAY
// ============================================================================

/**
 * Display summary of all slots
 */
function displayAllSlotsSummary(): void {
    const resultsDiv = document.getElementById('cube-summary-results');
    if (!resultsDiv) return;

    if (!loadoutStore.getSelectedClass()) {
        resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Please select a class to view summary.</p>';
        return;
    }

    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    const currentStats = loadoutStore.getBaseStats();

    // Calculate DPS gain for each slot + potential type
    const summaryData: Array<{
        slotId: CubeSlotId;
        slotName: string;
        regularGain: number;
        regularRarity: Rarity;
        bonusGain: number;
        bonusRarity: Rarity;
    }> = [];

    SLOT_NAMES.forEach(slot => {
        // Regular Potential
        const regularData = cubeData[slot.id].regular;
        const regularResult = calculateSlotSetGain(slot.id, regularData.rarity, regularData.setA, currentStats);
        const regularGain = regularResult.gain;

        // Bonus Potential
        const bonusData = cubeData[slot.id].bonus;
        const bonusResult = calculateSlotSetGain(slot.id, bonusData.rarity, bonusData.setA, currentStats);
        const bonusGain = bonusResult.gain;

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
                    <th style="text-align: center; cursor: pointer; user-select: none;" onclick="window.sortCubeSummaryBy('regular')">
                        Regular Potential${regularSortIndicator}<br>
                        <span style="font-size: 0.8em; font-weight: 400;">(Set A Gain)</span>
                    </th>
                    <th style="text-align: center; cursor: pointer; user-select: none;" onclick="window.sortCubeSummaryBy('bonus')">
                        Bonus Potential${bonusSortIndicator}<br>
                        <span style="font-size: 0.8em; font-weight: 400;">(Set A Gain)</span>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;

    summaryData.forEach((data) => {
        html += `
            <tr>
                <td style="font-weight: 600; text-align: center;">${data.slotName}</td>
                <td style="text-align: center;">
                    <div style="color: ${data.regularGain >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600; margin-bottom: 4px;">
                        ${data.regularGain >= 0 ? '+' : ''}${data.regularGain.toFixed(2)}%
                    </div>
                    <div style="font-size: 0.8em; color: var(--text-secondary);">
                        ${data.regularRarity.charAt(0).toUpperCase() + data.regularRarity.slice(1)}
                    </div>
                </td>
                <td style="text-align: center;">
                    <div style="color: ${data.bonusGain >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600; margin-bottom: 4px;">
                        ${data.bonusGain >= 0 ? '+' : ''}${data.bonusGain.toFixed(2)}%
                    </div>
                    <div style="font-size: 0.8em; color: var(--text-secondary);">
                        ${data.bonusRarity.charAt(0).toUpperCase() + data.bonusRarity.slice(1)}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    resultsDiv.innerHTML = html;
}

/**
 * Sort summary by column
 */
export function sortCubeSummaryBy(column: 'regular' | 'bonus'): void {
    if (summarySortColumn === column) {
        summarySortDescending = !summarySortDescending;
    } else {
        summarySortColumn = column;
        summarySortDescending = true;
    }
    displayAllSlotsSummary();
}

// ============================================================================
// GLOBAL FUNCTION EXPOSURE
// ============================================================================

/**
 * Expose functions to window for HTML onclick handlers
 */
function exposeGlobalFunctions(): void {
    (window as any).switchCubePotentialType = switchPotentialType;
    (window as any).selectCubeSlot = selectCubeSlot;
    (window as any).sortCubeSummaryBy = sortCubeSummaryBy;
    (window as any).changeCubeRankingsPage = changeRankingsPage;
}

/**
 * Change rankings page
 */
export function changeRankingsPage(newPage: number): void {
    currentRankingsPage = newPage;
    // Rankings display will be updated when tab is visible
}
