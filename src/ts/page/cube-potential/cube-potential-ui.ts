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
import { Chart } from 'chart.js/auto';
import {
    SLOT_NAMES,
    SLOT_SPECIFIC_POTENTIALS,
    EQUIPMENT_POTENTIAL_DATA,
    RANKINGS_PER_PAGE
} from '@ts/page/cube-potential/cube-potential-data.js';
import { calculateRankingsForRarity, runCubeSimulation } from '@ts/page/cube-potential/cube-simulation.js';
import type {
    CubeSlotId,
    PotentialType,
    Rarity,
    PotentialLineEntry
} from '@ts/types/page/gear-lab/gear-lab.types';
import { calculateSlotSetGain } from '@ts/page/cube-potential/cube-potential.js';
import { loadoutStore } from '@ts/store/loadout.store';
import { debounce } from '@ts/utils/event-emitter';

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
            <button id="cube-main-tab-optimal" class="tab-button" style="display:none;" data-tab="optimal">
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
            <h3 class="cube-simulation-title">Cube Potential Optimization Simulator</h3>
            <p class="cube-simulation-description">Simulates different cubing strategies to find the most efficient approach for maximizing damage across all equipment slots. Uses fictional slots that are all set to normal with 0 tries attempted. This does not account for your current slots or their rarities!</p>
        </div>

        <!-- Simulation Controls -->
        <div class="cube-simulation-controls">
            <!-- Simulation Configuration -->
            <div class="sim-config-row" style="display: flex; gap: 20px; margin-bottom: 15px; align-items: center; flex-wrap: wrap;">
                <div class="sim-potential-type" style="display: flex; align-items: center; gap: 10px;">
                    <label style="color: var(--text-secondary);">Potential Type:</label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="radio" name="sim-potential-type" value="regular" checked>
                        <span>Regular</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-left: 10px;">
                        <input type="radio" name="sim-potential-type" value="bonus">
                        <span>Bonus</span>
                    </label>
                </div>
                <div class="sim-use-data" style="display: flex; align-items: center; gap: 6px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="checkbox" id="sim-use-my-data">
                        <span style="color: var(--text-secondary);">Use my current equipment data</span>
                    </label>
                </div>
            </div>

            <div class="cube-simulation-inputs">
                <div class="cube-sim-input-group">
                    <label for="simulation-cube-budget" class="cube-sim-label">Cube Budget</label>
                    <input type="number" id="simulation-cube-budget" value="1000" min="100" max="50000" step="100" class="cube-sim-input">
                </div>
                <div class="cube-sim-input-group">
                    <label for="simulation-count" class="cube-sim-label">Number of Simulations</label>
                    <input type="number" id="simulation-count" value="10" min="100" max="10000" step="100" class="cube-sim-input">
                </div>
            </div>
            <button class="cube-sim-run-btn" id="cube-simulation-run-btn">
                <span class="cube-sim-btn-icon">▶</span>
                <span>Run Simulation</span>
            </button>
        </div>

        <!-- Progress Bar -->
        <div id="cube-simulation-progress" class="cube-progress-bar" style="display: none;">
            <div class="cube-progress-track">
                <div id="cube-simulation-progress-fill" class="cube-progress-fill"></div>
            </div>
            <p id="cube-simulation-progress-text" class="cube-progress-text">Running simulations...</p>
        </div>

        <!-- Results -->
        <div id="cube-simulation-results" class="cube-simulation-results"></div>
    `;
}

/**
 * Generate HTML for the Optimal Strategy tab
 */
function generateOptimalTabHTML(): string {
    return `
        <div class="optimal-config" style="display: flex; gap: 20px; margin-bottom: 20px; align-items: center;">
            <div>
                <label style="color: var(--text-secondary);">Potential Type:</label>
                <select id="optimal-potential-type" style="margin-left: 8px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary);">
                    <option value="regular">Regular</option>
                    <option value="bonus">Bonus</option>
                </select>
            </div>
            <div>
                <label style="color: var(--text-secondary);">Cube Budget:</label>
                <input type="number" id="optimal-cube-budget" min="1" max="9999" value="100" style="margin-left: 8px; width: 100px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary);">
            </div>
        </div>

        <div id="optimal-recommendation" class="optimal-recommendation-panel">
            <!-- Populated dynamically -->
        </div>

        <div id="optimal-sequence" class="optimal-sequence-table">
            <!-- Full optimal sequence table -->
        </div>
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
    setupSimulationButton();

    // Load data from store
    loadCubeDataFromStore();

    // Initial UI update
    updateSlotButtonColors();
    updateCubePotentialUI();
    updateClassWarning();

    // Expose global functions
    exposeGlobalFunctions();

    loadoutStore.on('stat:changed', debounce((_) => {
           clearCubeRankingsCache();
           calculateComparisonAndDisplay();
           const button = document.getElementById("cube-main-tab-comparison");
           button?.click();
    }, 1500));
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
                loadAllRankingsForSummary();
            } else if (tabName === 'rankings') {
                // Ensure selectors are initialized before accessing them
                setupRankingsControls();
                const raritySelector = document.getElementById('cube-rankings-rarity-selector') as HTMLSelectElement;
                if (raritySelector) {
                    const rarity = raritySelector.value as Rarity;
                    displayOrCalculateRankingsForRarity(rarity);
                }
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

    if (!slotSelector) {
        console.error('Rankings slot selector (cube-rankings-slot-selector) not found in DOM');
        return;
    }
    if (!raritySelector) {
        console.error('Rankings rarity selector (cube-rankings-rarity-selector) not found in DOM');
        return;
    }

    // Only populate if not already populated (check if empty)
    if (slotSelector.options.length === 0) {
        // Populate slot selector
        SLOT_NAMES.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.id;
            option.textContent = slot.name;
            slotSelector.appendChild(option);
        });

        // Set default to current slot
        slotSelector.value = currentCubeSlot;

        // Verify the value was set successfully, fallback to first slot if not
        if (!slotSelector.value && SLOT_NAMES.length > 0) {
            slotSelector.value = SLOT_NAMES[0].id;
            console.warn(`currentCubeSlot "${currentCubeSlot}" not found in options, defaulting to "${SLOT_NAMES[0].id}"`);
        }
    }

    // Add event listeners if not already attached (using defensive element lookup)
    if (!slotSelector.hasAttribute('data-listener-attached')) {
        slotSelector.addEventListener('change', () => {
            currentRankingsPage = 1;
            // Defensively get current references to selectors
            const currentRaritySelector = document.getElementById('cube-rankings-rarity-selector') as HTMLSelectElement;
            const currentSlotSelector = document.getElementById('cube-rankings-slot-selector') as HTMLSelectElement;
            if (currentRaritySelector && currentSlotSelector) {
                const rarity = currentRaritySelector.value as Rarity;
                const slotId = currentSlotSelector.value as CubeSlotId;
                // Trigger calculation for the new slot
                displayOrCalculateRankingsForSlotAndRarity(slotId, rarity);
            }
        });
        slotSelector.setAttribute('data-listener-attached', 'true');
    }

    if (!raritySelector.hasAttribute('data-listener-attached')) {
        raritySelector.addEventListener('change', () => {
            currentRankingsPage = 1;
            // Defensively get current references to selectors
            const currentRaritySelector = document.getElementById('cube-rankings-rarity-selector') as HTMLSelectElement;
            const currentSlotSelector = document.getElementById('cube-rankings-slot-selector') as HTMLSelectElement;
            if (currentRaritySelector && currentSlotSelector) {
                const rarity = currentRaritySelector.value as Rarity;
                const slotId = currentSlotSelector.value as CubeSlotId;
                // Trigger calculation for the new rarity
                displayOrCalculateRankingsForSlotAndRarity(slotId, rarity);
            }
        });
        raritySelector.setAttribute('data-listener-attached', 'true');
    }
}

// Store simulation parameters for display
let cubeBudget = 1000;
let simulationCount = 1000;

/**
 * Handle run simulation button click
 */
async function handleRunSimulation(): Promise<void> {
    const budgetInput = document.getElementById('simulation-cube-budget') as HTMLInputElement;
    const countInput = document.getElementById('simulation-count') as HTMLInputElement;
    const potentialTypeInputs = document.querySelectorAll('input[name="sim-potential-type"]');
    const useUserDataCheckbox = document.getElementById('sim-use-my-data') as HTMLInputElement;

    if (!budgetInput || !countInput || !potentialTypeInputs.length) {
        console.error('Simulation inputs not found');
        return;
    }

    cubeBudget = parseInt(budgetInput.value) || 1000;
    simulationCount = parseInt(countInput.value) || 1000;

    let potentialType: 'regular' | 'bonus' = 'regular';
    for (const input of potentialTypeInputs) {
        if ((input as HTMLInputElement).checked) {
            potentialType = (input as HTMLInputElement).value as 'regular' | 'bonus';
            break;
        }
    }

    const useUserData = useUserDataCheckbox?.checked || false;

    const cubeSlotData = gearLabStore.getCubeSlotData();
    if (!cubeSlotData) {
        console.error('Cube slot data not found');
        return;
    }

    // Include base stats which is required by runCubeSimulation
    const baseStats = loadoutStore.getBaseStats();
    const cubeSlotDataWithStats = {
        ...cubeSlotData,
        baseStats
    };

    const results = await runCubeSimulation(
        cubeBudget,
        simulationCount,
        potentialType,
        useUserData,
        cubeSlotDataWithStats
    );

    // Display results (includes chart creation)
    displaySimulationResults(results);
}

/**
 * Display simulation results with full breakdown
 */
function displaySimulationResults(results: Record<string, any>): void {
    const resultsDiv = document.getElementById('cube-simulation-results');
    if (!resultsDiv) return;

    // Find best strategy
    let bestStrategy = Object.keys(results)[0];
    let bestAvg = results[bestStrategy]?.avgGain || 0;

    for (const strategy of Object.keys(results)) {
        if ((results[strategy]?.avgGain || 0) > bestAvg) {
            bestStrategy = strategy;
            bestAvg = results[strategy]?.avgGain || 0;
        }
    }

    const formatStrategy = (strategyKey: string, name: string, data: any, isBest: boolean): string => {
        const gains = [...(data.totalGains || [])].sort((a: number, b: number) => a - b);
        if (gains.length === 0) return '';

        const min = gains[0];
        const max = gains[gains.length - 1];
        const median = gains[Math.floor(gains.length / 2)];
        const p25 = gains[Math.floor(gains.length * 0.25)];
        const p75 = gains[Math.floor(gains.length * 0.75)];

        // Find simulations for each percentile
        const simulations = data.simulations || [];
        const minSimIdx = simulations.findIndex((s: any) => Math.abs(s.totalGain - min) < 0.01);
        const p25SimIdx = simulations.findIndex((s: any) => Math.abs(s.totalGain - p25) < 0.01);
        const medianSimIdx = simulations.findIndex((s: any) => Math.abs(s.totalGain - median) < 0.01);
        const p75SimIdx = simulations.findIndex((s: any) => Math.abs(s.totalGain - p75) < 0.01);
        const maxSimIdx = simulations.findIndex((s: any) => Math.abs(s.totalGain - max) < 0.01);

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
                        <div class="sim-stat-card">
                            <div class="sim-stat-card-label">Average Gain</div>
                            <div class="sim-stat-card-value">+${data.avgGain.toFixed(2)}%</div>
                        </div>
                        <div class="sim-stat-card">
                            <div class="sim-stat-card-label">Median</div>
                            <div class="sim-stat-card-value sim-stat-card-value--secondary">+${median.toFixed(2)}%</div>
                        </div>
                        <div class="sim-stat-card">
                            <div class="sim-stat-card-label">Min / Max</div>
                            <div class="sim-stat-card-value sim-stat-card-value--secondary">+${min.toFixed(2)}% / +${max.toFixed(2)}%</div>
                        </div>
                        <div class="sim-stat-card">
                            <div class="sim-stat-card-label">P25 / P75</div>
                            <div class="sim-stat-card-value sim-stat-card-value--secondary">+${p25.toFixed(2)}% / +${p75.toFixed(2)}%</div>
                        </div>
                    </div>

                    <!-- Detailed Results Dropdown -->
                    <details class="sim-detail-results" data-strategy="${strategyKey}" style="background: rgba(0, 0, 0, 0.05); border-radius: 8px; padding: 10px; margin-top: 10px;">
                        <summary style="cursor: pointer; font-weight: 600; color: var(--accent-primary); user-select: none; font-size: 0.95em;">
                            View Detailed Results (Slot Stats & Distribution)
                        </summary>
                        <div id="${detailsId}" style="margin-top: 15px;">
                            <!-- Sub-tabs -->
                            <div style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid rgba(0, 0, 0, 0.1); padding-bottom: 0; overflow-x: auto;">
                                <button class="sim-detail-tab active" data-strategy="${strategyKey}" data-tab="distribution" onclick="window.switchSimDetailTab('${strategyKey}', 'distribution')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid var(--accent-primary); cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s; white-space: nowrap;">Distribution</button>
                                <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="min" onclick="window.switchSimDetailTab('${strategyKey}', 'min')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s; white-space: nowrap;">Min (+${min.toFixed(2)}%)</button>
                                <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="p25" onclick="window.switchSimDetailTab('${strategyKey}', 'p25')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s; white-space: nowrap;">P25 (+${p25.toFixed(2)}%)</button>
                                <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="median" onclick="window.switchSimDetailTab('${strategyKey}', 'median')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s; white-space: nowrap;">Median (+${median.toFixed(2)}%)</button>
                                <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="p75" onclick="window.switchSimDetailTab('${strategyKey}', 'p75')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s; white-space: nowrap;">P75 (+${p75.toFixed(2)}%)</button>
                                <button class="sim-detail-tab" data-strategy="${strategyKey}" data-tab="max" onclick="window.switchSimDetailTab('${strategyKey}', 'max')" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: var(--text-primary); transition: all 0.3s; white-space: nowrap;">Max (+${max.toFixed(2)}%)</button>
                            </div>

                            <!-- Distribution Tab -->
                            <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="distribution" style="display: block;">
                                <canvas id="${chartCanvasId}" style="max-height: 300px;"></canvas>
                            </div>

                            <!-- Min Tab -->
                            <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="min" style="display: none;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                    ${minSimIdx >= 0 ? formatSlotDetails(simulations[minSimIdx].slots) : 'No data'}
                                </div>
                            </div>

                            <!-- P25 Tab -->
                            <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="p25" style="display: none;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                    ${p25SimIdx >= 0 ? formatSlotDetails(simulations[p25SimIdx].slots) : 'No data'}
                                </div>
                            </div>

                            <!-- Median Tab -->
                            <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="median" style="display: none;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                    ${medianSimIdx >= 0 ? formatSlotDetails(simulations[medianSimIdx].slots) : 'No data'}
                                </div>
                            </div>

                            <!-- P75 Tab -->
                            <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="p75" style="display: none;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                    ${p75SimIdx >= 0 ? formatSlotDetails(simulations[p75SimIdx].slots) : 'No data'}
                                </div>
                            </div>

                            <!-- Max Tab -->
                            <div class="sim-detail-content" data-strategy="${strategyKey}" data-tab="max" style="display: none;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                    ${maxSimIdx >= 0 ? formatSlotDetails(simulations[maxSimIdx].slots) : 'No data'}
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            </details>
        `;
    };

    // Strategy names and descriptions
    const strategyInfo: Record<string, { name: string; desc: string }> = {
        worstFirst: { name: 'Worst First', desc: 'Always upgrades the slot currently providing the least DPS gain with a single cube at a time.' },
        balancedThreshold: { name: 'Balanced Threshold', desc: 'Keeps all slots within a certain DPS gain range of each other, preventing over-investment in terrible slots.' },
        hybridFastRarity: { name: 'Hybrid: Fast Rarity + Worst First', desc: 'First rushes all slots to Epic rarity, then switches to Worst First strategy for remaining cubes.' },
        rarityWeightedWorstFirst: { name: 'Rarity-Weighted Worst First', desc: 'Like Worst First but factors in how close a slot is to its next rarity upgrade, prioritizing slots near upgrade thresholds.' },
        dpOptimal: { name: 'DP Optimal', desc: 'Mathematically optimal strategy that cubes the slot with highest expected marginal DPS gain, accounting for tier-up probability and future rarity potential.' }
    };

    // Sort strategies by average gain (best first), filtering out dpOptimal
    const sortedStrategies = Object.keys(results)
        .filter(key => key !== 'dpOptimal')
        .sort((a, b) => (results[b]?.avgGain || 0) - (results[a]?.avgGain || 0));

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
                ${Object.keys(strategyInfo).filter(key => key !== 'dpOptimal').map(key => `
                    <p style="margin-top: 8px;"><strong>${strategyInfo[key].name}:</strong> ${strategyInfo[key].desc}</p>
                `).join('')}
            </div>
        </div>
    `;

    // Store for chart creation (charts are created on-demand when tabs are shown)
    (window as any).simulationResultsForCharts = { results, sortedStrategies, strategyInfo };

    // Add event listeners to initialize charts when details are opened
    resultsDiv.querySelectorAll('.sim-detail-results').forEach((details) => {
        const detailsElement = details as HTMLDetailsElement;
        detailsElement.addEventListener('toggle', () => {
            if (detailsElement.open) {
                const strategy = detailsElement.dataset.strategy;
                if (!strategy) return;

                // Initialize chart when details are opened (if not already created)
                const canvas = detailsElement.querySelector('canvas') as HTMLCanvasElement;
                if (canvas && !(canvas as any).chart) {
                    const storedData = (window as any).simulationResultsForCharts;
                    if (storedData && storedData.results && storedData.results[strategy]) {
                        const strategyInfo = storedData.strategyInfo[strategy];
                        const gains = storedData.results[strategy].totalGains;
                        // Small delay to ensure the element is visible
                        setTimeout(() => {
                            createSimulationDistributionChart(canvas.id, gains, strategyInfo.name);
                        }, 50);
                    }
                }

                // Ensure Distribution tab button has active styling
                const distributionTab = detailsElement.querySelector('.sim-detail-tab[data-tab="distribution"]') as HTMLElement;
                if (distributionTab) {
                    distributionTab.classList.add('active');
                    distributionTab.style.borderBottomColor = 'var(--accent-primary)';
                }
            }
        });
    });
}

/**
 * Create simulation distribution histogram chart
 */
function createSimulationDistributionChart(canvasId: string, gains: number[], label: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
        setTimeout(() => createSimulationDistributionChart(canvasId, gains, label), 50);
        return;
    }

    // Create histogram
    const sorted = [...gains].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const bucketCount = 30;

    // Handle case where all gains are the same (avoid division by zero)
    let bucketSize = (max - min) / bucketCount;
    if (bucketSize === 0) {
        // All values are the same, create a single bucket
        bucketSize = 1;
    }

    const buckets = new Array(bucketCount).fill(0);
    const bucketLabels: string[] = [];

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

    // Destroy existing chart if any
    const existingChart = (canvas as any).chart;
    if (existingChart) {
        existingChart.destroy();
    }

    // Create new chart
    (canvas as any).chart = new Chart(canvas, {
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
                        title: function(context: any) {
                            const idx = context[0].dataIndex;
                            const start = parseFloat(bucketLabels[idx]);
                            const end = start + bucketSize;
                            return `${start.toFixed(2)}% - ${end.toFixed(2)}%`;
                        },
                        label: function(context: any) {
                            const count = buckets[context.dataIndex];
                            const total = buckets.reduce((a: number, b: number) => a + b, 0);
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
                    display: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

/**
 * Setup simulation button
 */
function setupSimulationButton(): void {
    const simulationButton = document.getElementById('cube-simulation-run-btn');
    if (!simulationButton) return;

    simulationButton.addEventListener('click', () => {
        handleRunSimulation().catch(err => {
            console.error('Simulation failed:', err);
        });
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
// RANKINGS DISPLAY
// ============================================================================

/**
 * Ranking entry interface
 */
interface RankingEntry {
    line1: PotentialLineEntry;
    line2: PotentialLineEntry;
    line3: PotentialLineEntry;
    dpsGain: number;
}

/**
 * Display rankings with pagination
 */
export function displayRankings(rankings: RankingEntry[], rarity: Rarity): void {
    const resultsDiv = document.getElementById('cube-rankings-results');
    if (!resultsDiv) return;

    const totalPages = Math.ceil(rankings.length / RANKINGS_PER_PAGE);
    const startIdx = (currentRankingsPage - 1) * RANKINGS_PER_PAGE;
    const endIdx = Math.min(startIdx + RANKINGS_PER_PAGE, rankings.length);
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
        const formatLine = (line: PotentialLineEntry): string => {
            const primeTag = line.prime ? ' <span style="color: var(--accent-primary); font-weight: 600;">(Prime)</span>' : '';
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
            <button onclick="window.changeCubeRankingsPage(${currentRankingsPage - 1})"
                    ${currentRankingsPage === 1 ? 'disabled' : ''}
                    class="btn-primary">Previous</button>
            <span style="color: var(--text-secondary);">Page ${currentRankingsPage} of ${totalPages}</span>
            <button onclick="window.changeCubeRankingsPage(${currentRankingsPage + 1})"
                    ${currentRankingsPage === totalPages ? 'disabled' : ''}
                    class="btn-primary">Next</button>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

/**
 * Display or calculate rankings for a specific slot and rarity
 */
export async function displayOrCalculateRankingsForSlotAndRarity(
    slotId: CubeSlotId,
    rarity: Rarity
): Promise<void> {
    // Check if already calculated
    if (rankingsCache[slotId]?.[rarity]) {
        displayRankings(rankingsCache[slotId][rarity], rarity);
        return;
    }

    // If calculation is in progress, show progress bar and wait
    const key = `${slotId}-${rarity}`;
    if (rankingsInProgress[key]) {
        const progressBar = document.getElementById('cube-rankings-progress') as HTMLElement;
        if (progressBar) progressBar.style.display = 'block';

        let pollCount = 0;
        const maxPolls = 600;
        const checkInterval = setInterval(() => {
            pollCount++;

            if (rankingsCache[slotId]?.[rarity]) {
                clearInterval(checkInterval);
                displayRankings(rankingsCache[slotId][rarity], rarity);
            } else if (!rankingsInProgress[key]) {
                clearInterval(checkInterval);
                calculateRankingsForRarity(rarity, slotId).then(() => {
                    if (rankingsCache[slotId]?.[rarity]) {
                        displayRankings(rankingsCache[slotId][rarity], rarity);
                    }
                });
            } else if (pollCount >= maxPolls) {
                clearInterval(checkInterval);
                console.error('Rankings calculation timeout');
                if (progressBar) progressBar.style.display = 'none';
            }
        }, 100);
    } else {
        // Not calculated and not in progress, start calculation
        await calculateRankingsForRarity(rarity, slotId);
        if (rankingsCache[slotId]?.[rarity]) {
            displayRankings(rankingsCache[slotId][rarity], rarity);
        }
    }
}

/**
 * Display rankings for a specific rarity (uses independent selectors)
 */
export async function displayOrCalculateRankingsForRarity(rarity: Rarity): Promise<void> {
    const slotSelector = document.getElementById('cube-rankings-slot-selector') as HTMLSelectElement;
    const slotId = slotSelector ? slotSelector.value as CubeSlotId : currentCubeSlot;
    await displayOrCalculateRankingsForSlotAndRarity(slotId, rarity);
}

/**
 * Change rankings page
 */
export function changeCubeRankingsPage(newPage: number): void {
    changeRankingsPage(newPage);

    // Refresh the display with the new page
    const slotSelector = document.getElementById('cube-rankings-slot-selector') as HTMLSelectElement;
    const raritySelector = document.getElementById('cube-rankings-rarity-selector') as HTMLSelectElement;

    if (slotSelector && raritySelector) {
        const slotId = slotSelector.value as CubeSlotId;
        const rarity = raritySelector.value as Rarity;

        if (rankingsCache[slotId]?.[rarity]) {
            displayRankings(rankingsCache[slotId][rarity], rarity);
        }
    }
}

// ============================================================================
// SUMMARY DISPLAY
// ============================================================================

/**
 * Load rankings for all slots and rarities needed for summary display
 * Skips slots that are already cached or currently being calculated
 */
async function loadAllRankingsForSummary(): Promise<void> {
    if (!loadoutStore.getSelectedClass()) {
        return; // Don't load rankings if no class is selected
    }

    const cubeData = gearLabStore.getCubeSlotData();
    if (!cubeData) return;

    const progressBar = document.getElementById('cube-summary-progress') as HTMLElement;
    const progressFill = document.getElementById('cube-summary-progress-fill') as HTMLElement;
    const progressText = document.getElementById('cube-summary-progress-text') as HTMLElement;

    // Collect all unique slot+rarity combinations that need to be calculated
    const calculationsNeeded: Array<{ slotId: CubeSlotId; rarity: Rarity }> = [];

    SLOT_NAMES.forEach(slot => {
        ['regular', 'bonus'].forEach(potentialType => {
            const rarity = cubeData[slot.id][potentialType as PotentialType].rarity;
            const key = `${slot.id}-${rarity}`;

            // Skip if already cached or currently in progress
            if (!rankingsCache[slot.id]?.[rarity] && !rankingsInProgress[key]) {
                calculationsNeeded.push({ slotId: slot.id, rarity });
            }
        });
    });

    if (calculationsNeeded.length === 0) {
        return; // All rankings already loaded or in progress
    }

    // Show progress bar
    if (progressBar) progressBar.style.display = 'block';
    if (progressText) progressText.textContent = `Loading rankings for ${calculationsNeeded.length} slot(s)...`;

    // Track completed count with proper synchronization
    let completed = 0;
    const total = calculationsNeeded.length;

    // Process calculations in parallel (but don't wait for all to complete before showing initial results)
    const promises = calculationsNeeded.map(async ({ slotId, rarity }) => {
        try {
            await calculateRankingsForRarity(rarity, slotId);
        } catch (error) {
            console.error(`Failed to load rankings for ${slotId}-${rarity}:`, error);
        } finally {
            // Increment completed count and update progress
            completed++;
            if (progressFill && progressBar) {
                progressFill.style.width = `${(completed / total) * 100}%`;
            }
            if (progressText) {
                progressText.textContent = `Loading rankings... ${completed}/${total}`;
            }
        }
    });

    // Wait for all calculations to complete
    await Promise.all(promises);

    // Hide progress bar and refresh summary with updated rankings
    if (progressBar) progressBar.style.display = 'none';
    displayAllSlotsSummary();
}

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
        const regularResult = calculateSlotSetGain(slot.id, regularData.rarity, regularData.setA, regularData.setA, currentStats);
        const regularGain = regularResult.gain;

        // Bonus Potential
        const bonusData = cubeData[slot.id].bonus;
        const bonusResult = calculateSlotSetGain(slot.id, bonusData.rarity, bonusData.setA, bonusData.setA, currentStats);
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
        // Format regular potential display
        let regularDisplay: string;
        if (data.regularGain === 0) {
            regularDisplay = '<span style="color: var(--text-secondary); font-size: 0.9em;">No stats</span>';
        } else {
            const regularPercentile = getPercentileForGain(data.slotId, data.regularRarity, data.regularGain, rankingsCache, rankingsInProgress);
            regularDisplay = `
                <span style="color: ${data.regularGain >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600;">
                    ${data.regularGain >= 0 ? '+' : ''}${data.regularGain.toFixed(2)}%
                </span>
                <span style="font-size: 0.8em; color: var(--text-secondary); margin: 0 4px;">
                    ${data.regularRarity.charAt(0).toUpperCase() + data.regularRarity.slice(1)}
                </span>
                <span style="font-size: 0.8em;">
                    ${regularPercentile}
                </span>
            `;
        }

        // Format bonus potential display
        let bonusDisplay: string;
        if (data.bonusGain === 0) {
            bonusDisplay = '<span style="color: var(--text-secondary); font-size: 0.9em;">No stats</span>';
        } else {
            const bonusPercentile = getPercentileForGain(data.slotId, data.bonusRarity, data.bonusGain, rankingsCache, rankingsInProgress);
            bonusDisplay = `
                <span style="color: ${data.bonusGain >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600;">
                    ${data.bonusGain >= 0 ? '+' : ''}${data.bonusGain.toFixed(2)}%
                </span>
                <span style="font-size: 0.8em; color: var(--text-secondary); margin: 0 4px;">
                    ${data.bonusRarity.charAt(0).toUpperCase() + data.bonusRarity.slice(1)}
                </span>
                <span style="font-size: 0.8em;">
                    ${bonusPercentile}
                </span>
            `;
        }

        html += `
            <tr>
                <td style="font-weight: 600; text-align: center;">${data.slotName}</td>
                <td style="text-align: center;">${regularDisplay}</td>
                <td style="text-align: center;">${bonusDisplay}</td>
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
    (window as any).changeCubeRankingsPage = changeCubeRankingsPage;
    (window as any).switchSimDetailTab = switchSimDetailTab;
}

/**
 * Change rankings page
 */
export function changeRankingsPage(newPage: number): void {
    currentRankingsPage = newPage;
    // Rankings display will be updated when tab is visible
}

// ============================================================================
// SIMULATION DISPLAY HELPERS
// ============================================================================

/**
 * Format slot details for simulation display
 */
export function formatSlotDetails(slots: any[]): string {
    return slots.map((slot) => {
        const linesHTML = slot.lines && slot.lines.length > 0
            ? slot.lines.map((line: PotentialLineEntry | null, i: number) => {
                if (!line) return '';
                const isPercentStat = line.stat.includes('%');
                const valueSuffix = isPercentStat ? '%' : '';
                const primeTag = line.prime ? ' <span style="color: var(--accent-primary); font-weight: 600;">(P)</span>' : '';
                return `L${i+1}: ${line.stat} ${line.value}${valueSuffix}${primeTag}`;
            }).join('<br>')
            : 'No lines';

        return `
            <div class="sim-slot-card">
                <div class="sim-slot-card-header">
                    ${slot.name} [${slot.rarity.toUpperCase()}]
                </div>
                <div class="sim-slot-card-lines">
                    ${linesHTML}
                </div>
                <div class="sim-slot-card-gain">
                    DPS Gain: +${slot.dpsGain.toFixed(2)}%
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Switch between simulation detail tabs
 */
export function switchSimDetailTab(strategy: string, tab: string): void {
    // Update tab buttons
    document.querySelectorAll(`.sim-detail-tab[data-strategy="${strategy}"]`).forEach(btn => {
        const button = btn as HTMLElement;
        if (button.dataset.tab === tab) {
            button.classList.add('active');
            button.style.borderBottomColor = 'var(--accent-primary)';
        } else {
            button.classList.remove('active');
            button.style.borderBottomColor = 'transparent';
        }
    });

    // Find the specific details container for this strategy
    const detailsContainer = document.getElementById(`sim-details-${strategy}`);
    if (!detailsContainer) {
        console.error(`Details container for strategy "${strategy}" not found`);
        return;
    }

    // Update content visibility - only within this strategy's details container
    detailsContainer.querySelectorAll(`.sim-detail-content[data-strategy="${strategy}"]`).forEach(content => {
        const element = content as HTMLElement;
        const shouldShow = element.dataset.tab === tab;
        element.style.display = shouldShow ? 'block' : 'none';

        // Create chart when Distribution tab is shown (charts don't render properly in hidden elements)
        if (shouldShow && tab === 'distribution') {
            const canvas = element.querySelector('canvas') as HTMLCanvasElement;
            if (canvas && !(canvas as any).chart) {
                // Get the stored simulation results and create the chart
                const storedData = (window as any).simulationResultsForCharts;
                if (storedData && storedData.results && storedData.results[strategy]) {
                    const strategyInfo = storedData.strategyInfo[strategy];
                    const gains = storedData.results[strategy].totalGains;
                    // Small delay to ensure the element is visible
                    setTimeout(() => {
                        createSimulationDistributionChart(canvas.id, gains, strategyInfo.name);
                    }, 50);
                }
            }
        }
    });
}
