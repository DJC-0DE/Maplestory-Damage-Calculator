// Cube Potential Calculator
// Allows comparing potential lines and ranking all possible combinations

// Global state
let currentCubeSlot = 'helm';
let currentPotentialType = 'regular'; // 'regular' or 'bonus'
let cubeSlotData = {}; // Stores data for all slots
let rankingsCache = {}; // Cache rankings by slot and rarity: rankingsCache[slotId][rarity]
let rankingsInProgress = {}; // Track which slot+rarity combinations are currently calculating

// Slot names
const slotNames = [
    { id: 'helm', name: 'Helm' },
    { id: 'cape', name: 'Cape' },
    { id: 'chest', name: 'Chest' },
    { id: 'shoulder', name: 'Shoulder' },
    { id: 'legs', name: 'Legs' },
    { id: 'belt', name: 'Belt' },
    { id: 'gloves', name: 'Gloves' },
    { id: 'boots', name: 'Boots' },
    { id: 'ring', name: 'Ring' },
    { id: 'necklace', name: 'Necklace' },
    { id: 'eye-accessory', name: 'Eye Accessory' }
];

// Class to main stat mapping
const classMainStatMap = {
    'hero': 'Str',
    'dark-knight': 'Str',
    'bowmaster': 'Dex',
    'marksman': 'Dex',
    'night-lord': 'Luk',
    'shadower': 'Luk',
    'arch-mage': 'Int',
    'arch-mage-il': 'Int',
    'arch-mage-fp': 'Int'
};

// Slot-specific potential lines (only available on certain equipment slots)
const slotSpecificPotentials = {
    'cape': {
        epic: {
            line1: [{ stat: "Final Damage %", value: 3, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 3, weight: 0.24, prime: true }],
            line3: [{ stat: "Final Damage %", value: 3, weight: 0.08, prime: true }]
        },
        unique: {
            line1: [{ stat: "Final Damage %", value: 3, weight: 1, prime: true }],
            line2: [{ stat: "Final Damage %", value: 3, weight: 0.24, prime: true }],
            line3: [{ stat: "Final Damage %", value: 3, weight: 0.08, prime: true }]
        }
    }
};

// Initialize cube potential system
function initializeCubePotential() {
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
function switchPotentialType(type) {
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
function getRarityColor(rarity) {
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
function setupCubeSlotSelector() {
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
function updateSlotButtonColors() {
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
function setupRaritySelector() {
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
        saveCubePotentialData();
        updateSlotButtonColors(); // Update slot button border colors
        updateCubePotentialUI();

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
function selectCubeSlot(slotId) {
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
function setupCubeTabs() {
    const comparisonTab = document.getElementById('cube-tab-comparison');
    const rankingsTab = document.getElementById('cube-tab-rankings');
    const summaryTab = document.getElementById('cube-tab-summary');
    const comparisonContent = document.getElementById('cube-comparison-content');
    const rankingsContent = document.getElementById('cube-rankings-content');
    const summaryContent = document.getElementById('cube-summary-content');

    if (comparisonTab && rankingsTab && summaryTab && comparisonContent && rankingsContent && summaryContent) {
        comparisonTab.addEventListener('click', () => {
            comparisonTab.classList.add('active');
            rankingsTab.classList.remove('active');
            summaryTab.classList.remove('active');
            comparisonContent.style.display = 'block';
            rankingsContent.style.display = 'none';
            summaryContent.style.display = 'none';
        });

        rankingsTab.addEventListener('click', () => {
            rankingsTab.classList.add('active');
            comparisonTab.classList.remove('active');
            summaryTab.classList.remove('active');
            rankingsContent.style.display = 'block';
            comparisonContent.style.display = 'none';
            summaryContent.style.display = 'none';

            // Check if rankings are ready, if not show them (with loading if needed)
            displayOrCalculateRankings();
        });

        summaryTab.addEventListener('click', () => {
            summaryTab.classList.add('active');
            comparisonTab.classList.remove('active');
            rankingsTab.classList.remove('active');
            summaryContent.style.display = 'block';
            comparisonContent.style.display = 'none';
            rankingsContent.style.display = 'none';

            // Display summary and start loading any missing rankings
            displayAllSlotsSummary();
            loadAllRankingsForSummary();
        });
    }
}

// Update UI for current slot
function updateCubePotentialUI() {
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
function updatePotentialLineDropdowns(setName, rarity) {
    const potentialData = equipmentPotentialData[rarity];
    if (!potentialData) return;

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const statSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`);

        if (!statSelect) continue;

        // Clear existing options
        statSelect.innerHTML = '<option value="">-- Select Stat --</option>';

        // Get available stats for this line
        let lineData = [...(potentialData[`line${lineNum}`] || [])];

        // Add slot-specific lines if available
        const slotId = currentCubeSlot;
        if (slotSpecificPotentials[slotId] && slotSpecificPotentials[slotId][rarity]) {
            const slotSpecificLines = slotSpecificPotentials[slotId][rarity][`line${lineNum}`];
            if (slotSpecificLines) {
                lineData = [...lineData, ...slotSpecificLines];
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
            }
        });
    }
}

// Restore saved values to dropdowns
function restorePotentialLineValues(setName, setData) {
    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const lineData = setData[`line${lineNum}`];
        if (!lineData || !lineData.stat) continue;

        const statSelect = document.getElementById(`cube-${setName}-line${lineNum}-stat`);

        if (!statSelect) continue;

        // Find matching option
        const key = `${lineData.stat}|${lineData.value}|${lineData.prime}`;
        const option = Array.from(statSelect.options).find(opt => opt.value === key);

        if (option) {
            statSelect.value = key;
        }
    }
}

// Get main stat for current class
function getMainStatForClass() {
    if (!selectedClass) return null;
    return classMainStatMap[selectedClass];
}

// Convert potential stat to damage stat
function potentialStatToDamageStat(potentialStat, value) {
    const mainStat = getMainStatForClass();
    if (!mainStat) return { stat: null, value: 0 };

    // Map potential stat to damage calculation stat
    const statMap = {
        'Critical Rate %': { stat: 'critRate', value: value },
        'Attack Speed %': { stat: 'attackSpeed', value: value },
        'Damage %': { stat: 'damage', value: value },
        'Final Damage %': { stat: 'finalDamage', value: value },
        'Min Damage Multiplier %': { stat: 'minDamage', value: value },
        'Max Damage Multiplier %': { stat: 'maxDamage', value: value },
        'Defense %': { stat: 'defense', value: value },
        'Max HP %': { stat: 'maxHP', value: value },
        'Max MP %': { stat: 'maxMP', value: value }
    };

    // Check if it's a main stat percentage (only count if matches class main stat)
    if (potentialStat === `${mainStat} %`) {
        return { stat: 'statDamage', value: value };
    }

    // Check if it's a flat stat (convert to stat damage if main stat)
    if (potentialStat === mainStat) {
        return { stat: 'statDamage', value: value / 100 }; // 100 main stat = 1% stat damage
    }

    // Return mapped stat or null if not relevant
    return statMap[potentialStat] || { stat: null, value: 0 };
}

// Calculate comparison between Set A and Set B
function calculateComparison() {
    if (!selectedClass) {
        updateClassWarning();
        return;
    }

    const slotData = cubeSlotData[currentCubeSlot][currentPotentialType];
    const baseStats = getStats('base');

    // Calculate base DPS (no potential lines)
    const baseDPS = calculateDamage(baseStats, 'boss').dps;

    // Calculate Set A stats and DPS (base + Set A lines)
    const setAStats = { ...baseStats };
    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const line = slotData.setA[`line${lineNum}`];
        if (!line || !line.stat) continue;

        const mapped = potentialStatToDamageStat(line.stat, line.value);
        if (mapped.stat) {
            setAStats[mapped.stat] = (setAStats[mapped.stat] || 0) + mapped.value;
        }
    }
    const setADPS = calculateDamage(setAStats, 'boss').dps;

    // Calculate Set B stats and DPS (base + Set B lines)
    const setBStats = { ...baseStats };
    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const line = slotData.setB[`line${lineNum}`];
        if (!line || !line.stat) continue;

        const mapped = potentialStatToDamageStat(line.stat, line.value);
        if (mapped.stat) {
            setBStats[mapped.stat] = (setBStats[mapped.stat] || 0) + mapped.value;
        }
    }
    const setBDPS = calculateDamage(setBStats, 'boss').dps;

    // Calculate gains (both compared to base stats with no potential)
    const setAGain = ((setADPS - baseDPS) / baseDPS * 100);
    const setBGain = ((setBDPS - baseDPS) / baseDPS * 100);
    const deltaGain = setBGain - setAGain;

    // Display results
    displayComparisonResults(setAGain, setBGain, deltaGain);

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
function displayComparisonResults(setAGain, setBGain, deltaGain) {
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

    resultsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="background: linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(0, 122, 255, 0.05)); border: 2px solid var(--accent-success); border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px var(--shadow); text-align: center;">
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set A Gain</div>
                <div style="font-size: 1.8em; font-weight: 700; color: ${setAGain >= 0 ? '#4ade80' : '#f87171'};">
                    ${setAGain >= 0 ? '+' : ''}${setAGain.toFixed(2)}%
                </div>
                ${setAComparison.percentile || ''}
            </div>
            <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.05)); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px var(--shadow); text-align: center;">
                <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">Set B Gain</div>
                <div style="font-size: 1.8em; font-weight: 700; color: ${setBGain >= 0 ? '#4ade80' : '#f87171'};">
                    ${setBGain >= 0 ? '+' : ''}${setBGain.toFixed(2)}%
                </div>
                ${setBComparison.percentile || ''}
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
function getLoadingPlaceholder() {
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
async function loadRankingsInBackground(slotId, rarity, setAGain, setBGain) {
    // Calculate rankings
    await calculateRankingsForRarity(rarity, slotId);

    // After rankings are calculated, refresh the comparison display if still on same slot/rarity
    if (slotId === currentCubeSlot && rarity === cubeSlotData[currentCubeSlot][currentPotentialType].rarity) {
        // Recalculate comparison to show the new graphs/percentiles
        calculateComparison();
    }
}

// Create distribution chart showing where user's DPS gain falls
function createDistributionChart(canvasId, dpsGain, rankings) {
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
                        color: 'rgba(255, 255, 255, 0.5)',
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
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Get ranking comparison for a given DPS gain
function getRankingComparison(dpsGain, rarity) {
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
async function displayOrCalculateRankings() {
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
async function calculateRankings() {
    const slotId = currentCubeSlot;
    const rarity = cubeSlotData[currentCubeSlot][currentPotentialType].rarity;
    await calculateRankingsForRarity(rarity, slotId);
    displayRankings(rankingsCache[slotId][rarity], rarity);
}

// Calculate rankings for a specific rarity and slot
async function calculateRankingsForRarity(rarity, slotId = currentCubeSlot) {
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
        if (!selectedClass) {
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

                    [combo.line1, combo.line2, combo.line3].forEach(line => {
                        const mapped = potentialStatToDamageStat(line.stat, line.value);
                        if (mapped.stat) {
                            comboStats[mapped.stat] = (comboStats[mapped.stat] || 0) + mapped.value;
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

        // Cache the deduplicated results for this slot and rarity
        rankingsCache[slotId][rarity] = deduplicatedRankings;

        // If this is the current slot and rankings tab is visible, display results
        if (isCurrentSlot) {
            const rankingsContent = document.getElementById('cube-rankings-content');
            if (rankingsContent && rankingsContent.style.display !== 'none') {
                displayRankings(rankings, rarity);
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
const rankingsPerPage = 25;

function displayRankings(rankings, rarity) {
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

function changeRankingsPage(newPage) {
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
function updateClassWarning() {
    const warningBanner = document.getElementById('cube-class-warning');
    if (!warningBanner) return;

    if (!selectedClass) {
        warningBanner.style.display = 'block';
    } else {
        warningBanner.style.display = 'none';
    }
}

// Clear rankings cache and recalculate if needed (called when base stats change)
function clearCubeRankingsCache() {
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
function saveCubePotentialData() {
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
function displayAllSlotsSummary() {
    const resultsDiv = document.getElementById('cube-summary-results');
    if (!resultsDiv) return;

    if (!selectedClass) {
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
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = regularData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;
            const mapped = potentialStatToDamageStat(line.stat, line.value);
            if (mapped.stat) {
                regularStats[mapped.stat] = (regularStats[mapped.stat] || 0) + mapped.value;
            }
        }
        const regularDPS = calculateDamage(regularStats, 'boss').dps;
        const regularGain = ((regularDPS - baseDPS) / baseDPS * 100);

        // Bonus Potential
        const bonusData = cubeSlotData[slot.id].bonus;
        const bonusStats = { ...baseStats };
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
            const line = bonusData.setA[`line${lineNum}`];
            if (!line || !line.stat) continue;
            const mapped = potentialStatToDamageStat(line.stat, line.value);
            if (mapped.stat) {
                bonusStats[mapped.stat] = (bonusStats[mapped.stat] || 0) + mapped.value;
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

    resultsDiv.innerHTML = html;
}

// Load all rankings needed for summary
async function loadAllRankingsForSummary() {
    if (!selectedClass) return;

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
function sortSummaryBy(column) {
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
function getPercentileForGain(slotId, rarity, dpsGain) {
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
function loadCubePotentialData() {
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
