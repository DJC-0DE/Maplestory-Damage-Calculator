import { slotNames, rankingsPerPage, slotSpecificPotentials, equipmentPotentialData } from '@core/cube/cube-potential-data.js';
import { calculateDamage } from '@core/calculations/damage-calculations.js';
import { getStats } from '@core/main.js';
import { getSelectedClass, getCubeSlotData } from '@core/state.js';
import { lineExistsInRarity, potentialStatToDamageStat, getRarityColor, getPercentileForGain, calculateSlotSetGain } from '@core/cube/cube-logic.js';
import { calculateRankingsForRarity, calculateRankings } from '@core/cube/cube-simulation.js';
import { currentCubeSlot, currentPotentialType, rankingsCache, rankingsInProgress, calculateComparisonOrchestrator, selectCubeSlot } from '@core/cube/cube-potential.js';
import { saveToLocalStorage } from '@core/storage.js';

// Global state for summary sorting
let summarySortColumn = 'regular'; // 'regular' or 'bonus'
let summarySortDescending = true;

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

// Setup slot selector
export function setupCubeSlotSelector() {
    const slotSelector = document.getElementById('cube-slot-selector');
    if (!slotSelector) return;

    const cubeSlotData = getCubeSlotData();

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
    const cubeSlotData = getCubeSlotData();

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

    const cubeSlotData = getCubeSlotData();
    raritySelector.value = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    raritySelector.onchange = (e) => {
        const cubeSlotData = getCubeSlotData();
        cubeSlotData[currentCubeSlot][currentPotentialType].rarity = e.target.value;
        updateSlotButtonColors(); // Update slot button border colors
        updateCubePotentialUI(); // This will clear invalid lines
        saveToLocalStorage(); // Save after clearing invalid lines

        // If rankings tab is visible, update rankings display
        const rankingsContent = document.getElementById('cube-rankings-content');
        if (rankingsContent && rankingsContent.style.display !== 'none') {
            currentRankingsPage = 1; // Reset to page 1 when rarity changes
            displayOrCalculateRankings();
        }

        // If comparison tab is visible, recalculate comparison (which will trigger rankings load if needed)
        const comparisonContent = document.getElementById('cube-comparison-content');
        if (comparisonContent && comparisonContent.style.display !== 'none') {
            calculateComparisonOrchestrator();
        }
    };
}

// Setup tab switching - flattened 4-tab structure
export async function setupCubeTabs() {
    // Main tabs (flattened structure)
    const comparisonTab = document.getElementById('cube-main-tab-comparison');
    const rankingsTab = document.getElementById('cube-main-tab-rankings');
    const summaryTab = document.getElementById('cube-main-tab-summary');
    const simulationTab = document.getElementById('cube-main-tab-simulation');

    // Tab content sections
    const comparisonContent = document.getElementById('cube-comparison-content');
    const rankingsContent = document.getElementById('cube-rankings-content');
    const summaryContent = document.getElementById('cube-summary-content');
    const simulationContent = document.getElementById('cube-simulation-content');

    // Control sections (Comparison has its own controls, Rankings has independent rarity)
    const comparisonControls = document.getElementById('cube-comparison-controls');
    const rankingsControls = document.getElementById('cube-rankings-controls');

    // Setup independent rankings rarity selector
    setupRankingsRaritySelector();

    // Ensure comparison tab is active by default
    if (comparisonTab) comparisonTab.classList.add('active');

    // Setup tab switching
    if (comparisonTab && rankingsTab && summaryTab && simulationTab &&
        comparisonContent && rankingsContent && summaryContent && simulationContent) {

        // Comparison tab click
        comparisonTab.addEventListener('click', () => {
            switchCubeTab('comparison', {
                comparisonTab, rankingsTab, summaryTab, simulationTab
            }, {
                comparisonContent, rankingsContent, summaryContent, simulationContent
            }, comparisonControls, rankingsControls);
        });

        // Rankings tab click
        rankingsTab.addEventListener('click', () => {
            switchCubeTab('rankings', {
                comparisonTab, rankingsTab, summaryTab, simulationTab
            }, {
                comparisonContent, rankingsContent, summaryContent, simulationContent
            }, comparisonControls, rankingsControls);

            // Sync rankings slot selector with current selected slot from Comparison tab
            const rankingsSlotSelector = document.getElementById('cube-rankings-slot-selector');
            if (rankingsSlotSelector) {
                rankingsSlotSelector.value = currentCubeSlot;
            }

            // Check if rankings are ready, if not show them (with loading if needed)
            displayOrCalculateRankings();
        });

        // Summary tab click
        summaryTab.addEventListener('click', async () => {
            switchCubeTab('summary', {
                comparisonTab, rankingsTab, summaryTab, simulationTab
            }, {
                comparisonContent, rankingsContent, summaryContent, simulationContent
            }, comparisonControls, rankingsControls);

            // Display summary and start loading any missing rankings
            displayAllSlotsSummary();
            await loadAllRankingsForSummary();
        });

        // Simulation tab click
        simulationTab.addEventListener('click', () => {
            switchCubeTab('simulation', {
                comparisonTab, rankingsTab, summaryTab, simulationTab
            }, {
                comparisonContent, rankingsContent, summaryContent, simulationContent
            }, comparisonControls, rankingsControls);
        });
    }
}

// Setup independent selectors for Rankings tab
function setupRankingsRaritySelector() {
    const raritySelector = document.getElementById('cube-rankings-rarity-selector');
    const slotSelector = document.getElementById('cube-rankings-slot-selector');

    if (!raritySelector || !slotSelector) return;

    // Populate slot selector
    slotNames.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.id;
        option.textContent = slot.name;
        slotSelector.appendChild(option);
    });

    // Set default to current slot (from Comparison tab)
    slotSelector.value = currentCubeSlot;

    // Slot selector change handler
    slotSelector.addEventListener('change', () => {
        currentRankingsPage = 1; // Reset to page 1 when slot changes
        // Read both values from DOM to ensure we have latest
        const slotId = slotSelector.value;
        const rarity = raritySelector.value;

        // Sync back to global state for consistency with Comparison tab
        if (slotId !== currentCubeSlot) {
            currentCubeSlot = slotId;
            updateSlotButtonColors();
        }

        displayOrCalculateRankingsForSlotAndRarity(slotId, rarity);
    });

    // Rarity selector change handler
    raritySelector.addEventListener('change', () => {
        currentRankingsPage = 1; // Reset to page 1 when rarity changes
        // Read both values from DOM to ensure we have latest
        const slotId = slotSelector.value;
        const rarity = raritySelector.value;
        displayOrCalculateRankingsForSlotAndRarity(slotId, rarity);
    });
}

// Display rankings for a specific slot and rarity (independent of saved slot data)
export function displayOrCalculateRankingsForSlotAndRarity(slotId, rarity) {
    // If already calculated, display immediately
    if (rankingsCache[slotId]?.[rarity]) {
        displayRankings(rankingsCache[slotId][rarity], rarity);
        return;
    }

    // If calculation is in progress, show progress bar and wait
    const key = `${slotId}-${rarity}`;
    if (rankingsInProgress[key]) {
        const progressBar = document.getElementById('cube-rankings-progress');
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
                calculateRankingsForRarity(rarity, slotId);
            } else if (pollCount >= maxPolls) {
                clearInterval(checkInterval);
                console.error('Rankings calculation timeout');
                if (progressBar) progressBar.style.display = 'none';
            }
        }, 100);
    } else {
        // Not calculated and not in progress, start calculation
        calculateRankingsForRarity(rarity, slotId);
    }
}

// Display rankings for a specific rarity (uses independent selectors)
export function displayOrCalculateRankingsForRarity(rarity) {
    const slotSelector = document.getElementById('cube-rankings-slot-selector');
    const slotId = slotSelector ? slotSelector.value : currentCubeSlot;
    displayOrCalculateRankingsForSlotAndRarity(slotId, rarity);
}

// Helper function to switch tabs
function switchCubeTab(activeTabName, tabs, contents, comparisonControls, rankingsControls) {
    const { comparisonTab, rankingsTab, summaryTab, simulationTab } = tabs;
    const { comparisonContent, rankingsContent, summaryContent, simulationContent } = contents;

    // Remove active class from all tabs
    comparisonTab.classList.remove('active');
    rankingsTab.classList.remove('active');
    summaryTab.classList.remove('active');
    simulationTab.classList.remove('active');

    // Hide all content
    comparisonContent.classList.remove('active');
    rankingsContent.classList.remove('active');
    summaryContent.classList.remove('active');
    simulationContent.classList.remove('active');

    // Hide all control sections
    if (comparisonControls) comparisonControls.style.display = 'none';
    if (rankingsControls) rankingsControls.style.display = 'none';

    // Activate selected tab
    switch (activeTabName) {
        case 'comparison':
            comparisonTab.classList.add('active');
            comparisonContent.classList.add('active');
            if (comparisonControls) comparisonControls.style.display = 'block';
            break;
        case 'rankings':
            rankingsTab.classList.add('active');
            rankingsContent.classList.add('active');
            if (rankingsControls) rankingsControls.style.display = 'block';
            break;
        case 'summary':
            summaryTab.classList.add('active');
            summaryContent.classList.add('active');
            break;
        case 'simulation':
            simulationTab.classList.add('active');
            simulationContent.classList.add('active');
            break;
    }
}

// Update UI for current slot
export function updateCubePotentialUI() {
    const cubeSlotData = getCubeSlotData();
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
    calculateComparisonOrchestrator();
}

// Update potential line dropdowns based on rarity
export function updatePotentialLineDropdowns(setName, rarity) {
    const potentialData = equipmentPotentialData[rarity];
    if (!potentialData) return;

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const statSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`);

        if (!statSelect) continue;

        // Remove old event listeners by cloning the element
        const newStatSelect = statSelect.cloneNode(false);
        statSelect.parentNode.replaceChild(newStatSelect, statSelect);
        const cleanStatSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`);

        // Clear existing options
        cleanStatSelect.innerHTML = '<option value="">-- Select Stat --</option>';

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
            cleanStatSelect.appendChild(option);
        });

        // Add change listener
        cleanStatSelect.addEventListener('change', (e) => {
            const cubeSlotData = getCubeSlotData();
            const selectedOption = e.target.selectedOptions[0];
            if (selectedOption && selectedOption.dataset.value) {
                // Save to slot data
                const [stat, value, prime] = e.target.value.split('|');
                cubeSlotData[currentCubeSlot][currentPotentialType][setName][`line${lineNum}`] = {
                    stat: stat,
                    value: parseFloat(value),
                    prime: prime === 'true'
                };

                saveToLocalStorage();
                calculateComparisonOrchestrator();
            } else {
                cubeSlotData[currentCubeSlot][currentPotentialType][setName][`line${lineNum}`] = {
                    stat: '',
                    value: 0,
                    prime: false
                };
                saveToLocalStorage();
                calculateComparisonOrchestrator();
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

// Display comparison results
export function displayComparisonResults(setAGain, setBGain, setBAbsoluteGain, deltaGain, setAStats, setBStats) {
    const resultsDiv = document.getElementById('cube-comparison-results');
    if (!resultsDiv) return;

    const cubeSlotData = getCubeSlotData();

    // Get ranking comparison for Set A and Set B
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    const rankingsReady = rankingsCache[slotId]?.[rarity];

    const setAComparison = rankingsReady ? getRankingComparison(setAGain, rarity) : { percentile: getLoadingPlaceholder(), details: null, chartData: null };
    // Use setBAbsoluteGain for ranking comparison (since rankings are based on absolute gains from base)
    const setBComparison = rankingsReady ? getRankingComparison(setBAbsoluteGain, rarity) : { percentile: getLoadingPlaceholder(), details: null, chartData: null };

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
                <div><strong>Def Pen:</strong> ${stats.defPen.toFixed(2)}</div>
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
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set A Gain<br><span style="font-size: 0.85em;">(vs Baseline)</span></div>
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
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set B Gain<br><span style="font-size: 0.85em;">(vs Set A)</span></div>
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
export async function loadRankingsInBackground(slotId, rarity) {
    // Calculate rankings (wait for completion)
    await calculateRankingsForRarity(rarity, slotId);

    const cubeSlotData = getCubeSlotData();

    // After rankings are calculated, refresh the comparison display if still on same slot/rarity
    if (slotId === currentCubeSlot && rarity === cubeSlotData[currentCubeSlot][currentPotentialType].rarity) {
        // Recalculate comparison to show the new graphs/percentiles
        calculateComparisonOrchestrator();
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

// Display rankings or calculate them if not ready (uses independent selectors)
export function displayOrCalculateRankings() {
    const raritySelector = document.getElementById('cube-rankings-rarity-selector');
    const slotSelector = document.getElementById('cube-rankings-slot-selector');

    const rarity = raritySelector ? raritySelector.value : 'epic';
    const slotId = slotSelector ? slotSelector.value : currentCubeSlot;
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
                calculateRankingsForRarity(rarity, slotId);
            } else if (pollCount >= maxPolls) {
                // Timeout - something went wrong, stop polling
                clearInterval(checkInterval);
                console.error('Rankings calculation timeout');
                if (progressBar) progressBar.style.display = 'none';
            }
        }, 100);
    } else {
        // Not calculated and not in progress, start calculation
        calculateRankingsForRarity(rarity, slotId);
    }
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

// Load all rankings needed for summary
export async function loadAllRankingsForSummary() {
    if (!getSelectedClass()) return;

    const cubeSlotData = getCubeSlotData();

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
    if (rankingsToLoad.length === 0) {
        return;
    }

    const progressBar = document.getElementById('cube-summary-progress');
    const progressFill = document.getElementById('cube-summary-progress-fill');
    const progressText = document.getElementById('cube-summary-progress-text');

    // Show progress bar
    if (progressBar) progressBar.style.display = 'block';

    const total = rankingsToLoad.length;

    // Create all promises to run in parallel
    const promises = rankingsToLoad.map((item, index) =>
        (async () => {
            try {
                const { slotId, rarity, slotName, type } = item;

                // Update progress text
                if (progressText) {
                    progressText.textContent = `Loading rankings for ${slotName} (${type} - ${rarity})... ${index + 1}/${total}`;
                }
                if (progressFill) {
                    progressFill.style.width = `${((index / total) * 100)}%`;
                }

                await calculateRankingsForRarity(rarity, slotId);
            } catch (error) {
                console.error(`Promise ${index} error for ${item.slotName} (${item.type}):`, error);
            }
        })()
    );

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error("Promise.all failed:", error);
    }

    // Update summary display after all rankings are calculated
    const summaryContent = document.getElementById('cube-main-summary-content');
    if (summaryContent && summaryContent.style.display !== 'none') {
        displayAllSlotsSummary();
    }

    // Hide progress bar
    if (progressFill) progressFill.style.width = '100%';
    setTimeout(() => {
        if (progressBar) progressBar.style.display = 'none';
    }, 500);
}

export function changeRankingsPage(newPage) {
    const raritySelector = document.getElementById('cube-rankings-rarity-selector');
    const slotSelector = document.getElementById('cube-rankings-slot-selector');

    const rarity = raritySelector ? raritySelector.value : 'epic';
    const slotId = slotSelector ? slotSelector.value : currentCubeSlot;
    const rankings = rankingsCache[slotId]?.[rarity];
    if (!rankings) return;

    const totalPages = Math.ceil(rankings.length / rankingsPerPage);
    if (newPage < 1 || newPage > totalPages) return;

    currentRankingsPage = newPage;
    displayRankings(rankings, rarity);
}

// Format slot details for display
export function formatSlotDetails(slots) {
    return slots.map((slot) => {
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
window.switchSimDetailTab = switchSimDetailTab;

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
window.sortSummaryBy = sortSummaryBy;

// Display summary of all slots
export function displayAllSlotsSummary() {
    const resultsDiv = document.getElementById('cube-summary-results');
    if (!resultsDiv) return;

    if (!getSelectedClass()) {
        resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Please select a class to view summary.</p>';
        return;
    }

    const cubeSlotData = getCubeSlotData();
    const currentStats = getStats('base');

    // Calculate DPS gain for each slot + potential type
    const summaryData = [];

    slotNames.forEach(slot => {
        // Regular Potential - use shared calculation function
        const regularData = cubeSlotData[slot.id].regular;
        const regularResult = calculateSlotSetGain(slot.id, regularData.rarity, regularData.setA, currentStats);
        const regularGain = regularResult.gain;

        // Bonus Potential - use shared calculation function
        const bonusData = cubeSlotData[slot.id].bonus;
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
        // Get percentile for regular and bonus
        const regularPercentile = getPercentileForGain(data.slotId, data.regularRarity, data.regularGain, rankingsCache, rankingsInProgress);
        const bonusPercentile = getPercentileForGain(data.slotId, data.bonusRarity, data.bonusGain, rankingsCache, rankingsInProgress);

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

    // Calculate total DPS gain: current stats (includes all potential) vs baseline (no potential)
    // Step 1: Calculate baseline by removing ALL slots' potential from current stats
    const baselineStats = { ...currentStats };
    let accumulatedMainStatPct = 0;

    // Subtract all regular potential stats
    slotNames.forEach(slot => {
        const regularData = cubeSlotData[slot.id].regular;
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = regularData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;
            if (!lineExistsInRarity(slot.id, regularData.rarity, lineNum, line.stat, line.value, line.prime)) continue;

            const mapped = potentialStatToDamageStat(line.stat, line.value, accumulatedMainStatPct);
            if (mapped.stat) {
                baselineStats[mapped.stat] = (baselineStats[mapped.stat] || 0) - mapped.value;
                if (mapped.isMainStatPct) {
                    accumulatedMainStatPct += line.value;
                }
            }
        }

        // Subtract all bonus potential stats
        const bonusData = cubeSlotData[slot.id].bonus;
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = bonusData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;
            if (!lineExistsInRarity(slot.id, bonusData.rarity, lineNum, line.stat, line.value, line.prime)) continue;

            const mapped = potentialStatToDamageStat(line.stat, line.value, accumulatedMainStatPct);
            if (mapped.stat) {
                baselineStats[mapped.stat] = (baselineStats[mapped.stat] || 0) - mapped.value;
                if (mapped.isMainStatPct) {
                    accumulatedMainStatPct += line.value;
                }
            }
        }
    });

    const currentDPS = calculateDamage(currentStats, 'boss').dps;
    const baselineDPS = calculateDamage(baselineStats, 'boss').dps;
    const totalGain = ((currentDPS - baselineDPS) / baselineDPS * 100);

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
