// Scroll Optimizer - Level 65 Scrolls Only
// This module simulates different scrolling strategies and calculates damage gains

// Scroll definitions (Level 65 only)
const SCROLLS_L65 = {
    'L65_70': { name: '70% Level 65', baseSuccess: 0.70, cost: 250, attack: 100, damageAmp: 0 },
    'L65_30': { name: '30% Level 65', baseSuccess: 0.30, cost: 300, attack: 200, damageAmp: 0.1 }
};

const GLOBAL_SUCCESS_BONUS = 0.02;
const BONUS_AT_SLOT_5 = 0.10;
const BONUS_AT_SLOT_10 = 0.20;
const RESET_COST = 50;
const NUM_SLOTS = 10;

// Calculate success rate for a scroll at a specific slot
function getScrollSuccessRate(scroll, slotNumber) {
    let rate = scroll.baseSuccess + GLOBAL_SUCCESS_BONUS;
    if (slotNumber === 5) rate += BONUS_AT_SLOT_5;
    if (slotNumber === 10) rate += BONUS_AT_SLOT_10;
    return Math.min(rate, 1.0); // Cap at 100%
}

// Attempt one complete scroll run (all 10 slots)
function attemptScrollRun(strategy, budget, traceUsed) {
    let totalAttack = 0;
    let totalDamageAmp = 0;
    let successfulSlots = 0;
    let failedSlots = 0;
    let attemptCost = 0;
    const slotResults = [];

    for (let slot = 1; slot <= NUM_SLOTS; slot++) {
        const scrollType = strategy.selectScroll(slot, successfulSlots, failedSlots, traceUsed + attemptCost, budget);
        const scroll = SCROLLS_L65[scrollType];

        // Check if we can afford this scroll
        if (traceUsed + attemptCost + scroll.cost > budget) {
            // Out of budget mid-attempt
            for (let s = slot; s <= NUM_SLOTS; s++) {
                slotResults.push({ slot: s, success: false, unfunded: true });
            }
            break;
        }

        attemptCost += scroll.cost;
        const successRate = getScrollSuccessRate(scroll, slot);
        const success = Math.random() < successRate;

        slotResults.push({
            slot,
            scrollType,
            success,
            attack: success ? scroll.attack : 0,
            damageAmp: success ? scroll.damageAmp : 0,
            successRate: successRate * 100,
            unfunded: false
        });

        if (success) {
            totalAttack += scroll.attack;
            totalDamageAmp += scroll.damageAmp;
            successfulSlots++;
        } else {
            failedSlots++;
        }
    }

    return {
        totalAttack,
        totalDamageAmp,
        successfulSlots,
        failedSlots,
        attemptCost,
        slotResults
    };
}

// Simulate with reset strategy
function simulateScrollWithResets(strategy, budget) {
    let traceUsed = 0;
    let resetCount = 0;
    let finalResult = null;
    let attemptCount = 0;

    while (traceUsed < budget) {
        attemptCount++;
        const result = attemptScrollRun(strategy, budget, traceUsed);

        // Check if we ran out of budget during attempt
        if (traceUsed + result.attemptCost > budget) {
            if (finalResult) {
                return { ...finalResult, resetCount, attemptCount };
            } else {
                return {
                    totalAttack: 0,
                    totalDamageAmp: 0,
                    successfulSlots: 0,
                    failedSlots: NUM_SLOTS,
                    traceUsed: 0,
                    resetCount: 0,
                    attemptCount: 0,
                    slotResults: []
                };
            }
        }

        traceUsed += result.attemptCost;
        finalResult = { ...result, traceUsed };

        // Strategy decides whether to reset
        const shouldReset = strategy.shouldReset(result, traceUsed, budget);

        if (!shouldReset) {
            break;
        }

        // Try to reset
        if (traceUsed + RESET_COST <= budget) {
            traceUsed += RESET_COST;
            resetCount++;
        } else {
            break;
        }
    }

    return { ...finalResult, resetCount, attemptCount };
}

// Create strategy variations for L65 scrolls only
//
// POTENTIAL REDUNDANCIES TO WATCH FOR:
// - "Slot 10 Priority" vs "70% L65 - Reset <7": Slot 10 Priority adds an extra condition,
//   but might perform very similarly in practice
// - "First 2 30% then Bonus 10" vs "First 2 30% then Bonus 5&10": Similar strategies,
//   one just adds slot 5
// - Multiple damage amp thresholds (0.3%, 0.5%, 0.7%, 1.0%): Will behave similarly
//   but optimal threshold depends on budget
//
function createL65Strategies() {
    const strategies = [];

    // 70% L65 strategies with various reset thresholds (all reset if first 2 fail)
    const thresholds70 = [10, 9, 8, 7, 6];
    for (const threshold of thresholds70) {
        strategies.push({
            id: `L65_70_reset_${threshold}`,
            name: `70% L65 - Reset <${threshold}`,
            description: `70% L65 scrolls. Reset if fewer than ${threshold} slots succeed OR if first 2 slots fail.`,
            selectScroll: () => 'L65_70',
            shouldReset: (result) => {
                // Reset if first 2 slots both failed
                if (result.slotResults.length >= 2) {
                    const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                    if (first2Failed) return true;
                }
                return result.successfulSlots < threshold;
            }
        });
    }

    // 30% L65 strategies with various reset thresholds
    const thresholds30 = [10, 9, 8, 7, 6, 5, 4];
    for (const threshold of thresholds30) {
        strategies.push({
            id: `L65_30_reset_${threshold}`,
            name: `30% L65 - Reset <${threshold}`,
            description: `30% L65 scrolls. Reset if fewer than ${threshold} slots succeed.`,
            selectScroll: () => 'L65_30',
            shouldReset: (result) => result.successfulSlots < threshold
        });
    }

    // First 2 slots 30% strategies - reset if first 2 don't both succeed
    strategies.push({
        id: 'first2_30_bonus_both',
        name: 'First 2 30% then Bonus 5&10',
        description: '30% L65 on slots 1-2. Reset if both first 2 fail. Then 30% on slots 5&10, 70% on others. Reset if <8 total success.',
        selectScroll: (slot) => {
            if (slot <= 2) return 'L65_30';
            if (slot === 5 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    strategies.push({
        id: 'first2_30_then_70',
        name: 'First 2 30% then 70%',
        description: '30% L65 on slots 1-2. Reset if both first 2 fail. Then 70% L65 on remaining slots. Reset if <8 total success.',
        selectScroll: (slot) => (slot <= 2) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    strategies.push({
        id: 'first2_30_then_70_strict',
        name: 'First 2 30% then 70% (Strict)',
        description: '30% L65 on slots 1-2. Reset if ANY of first 2 fail. Then 70% L65 on remaining. Reset if <9 total success.',
        selectScroll: (slot) => (slot <= 2) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 1 && !result.slotResults[0].success) return true;
            if (result.slotResults.length >= 2 && !result.slotResults[1].success) return true;
            return result.successfulSlots < 9;
        }
    });

    strategies.push({
        id: 'first2_30_bonus10_only',
        name: 'First 2 30% then Bonus 10',
        description: '30% L65 on slots 1-2. Reset if both fail. Then 30% on slot 10, 70% on others. Reset if <8 success.',
        selectScroll: (slot) => {
            if (slot <= 2) return 'L65_30';
            if (slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    // Mixed strategies using bonus slots (original)
    strategies.push({
        id: 'bonus_both',
        name: 'Bonus Slots 5&10',
        description: '30% L65 on slots 5 and 10 (bonus slots), 70% L65 on others. Reset if <8 success OR first 2 slots fail.',
        selectScroll: (slot) => (slot === 5 || slot === 10) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    strategies.push({
        id: 'bonus_10',
        name: 'Bonus Slot 10 Only',
        description: '30% L65 on slot 10 only, 70% L65 on others. Reset if <8 success OR first 2 slots fail.',
        selectScroll: (slot) => (slot === 10) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    // Damage amp focused strategy
    strategies.push({
        id: 'damage_amp_hunter',
        name: 'Damage Amp Hunter',
        description: '30% L65 scrolls. Reset if damage amp < 0.5%.',
        selectScroll: () => 'L65_30',
        shouldReset: (result) => result.totalDamageAmp < 0.5
    });

    // Slot 10 priority strategy (NOTE: May be redundant with 70% L65 - Reset <7)
    strategies.push({
        id: 'slot10_priority',
        name: 'Slot 10 Priority',
        description: '70% L65 scrolls. Reset if <7 success OR slot 10 fails OR first 2 slots fail.',
        selectScroll: () => 'L65_70',
        shouldReset: (result) => {
            // Reset if first 2 slots both failed
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            if (result.successfulSlots < 7) return true;
            const slot10 = result.slotResults.find(s => s.slot === 10);
            if (slot10 && !slot10.success && !slot10.unfunded) return true;
            return false;
        }
    });

    // NEW: Progressive fallback - start aggressive, fall back on failure
    strategies.push({
        id: 'progressive_fallback',
        name: 'Progressive Fallback',
        description: '30% L65 until first failure, then switch to 70% L65 for remaining slots. Reset if <7 success or first 2 fail.',
        selectScroll: (slot, successfulSlots, failedSlots) => {
            return failedSlots === 0 ? 'L65_30' : 'L65_70';
        },
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 7;
        }
    });

    // NEW: First 3 slots 30% - more early aggression
    strategies.push({
        id: 'first3_30_then_70',
        name: 'First 3 30% then 70%',
        description: '30% L65 on slots 1-3. Reset if first 2 fail. Then 70% L65. Reset if <8 success.',
        selectScroll: (slot) => (slot <= 3) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    // NEW: First 4 slots 30% - even more early aggression
    strategies.push({
        id: 'first4_30_then_70',
        name: 'First 4 30% then 70%',
        description: '30% L65 on slots 1-4. Reset if first 2 fail. Then 70% L65. Reset if <8 success.',
        selectScroll: (slot) => (slot <= 4) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    // NEW: Slot 5 priority - leverage the +10% bonus
    strategies.push({
        id: 'slot5_priority_30',
        name: 'Slot 5 Priority 30%',
        description: '30% L65 on slot 5 (+10% bonus = 42% success), 70% elsewhere. Reset if slot 5 fails OR <8 success or first 2 fail.',
        selectScroll: (slot) => (slot === 5) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            const slot5 = result.slotResults.find(s => s.slot === 5);
            if (slot5 && !slot5.success && !slot5.unfunded) return true;
            return result.successfulSlots < 8;
        }
    });

    // NEW: Only use 30% on the two bonus slots (5 and 10)
    strategies.push({
        id: 'only_bonus_slots_30',
        name: 'Only Bonus Slots 30%',
        description: '30% L65 ONLY on slots 5&10 (best success rates: 42% and 52%), 70% everywhere else. Reset if either bonus slot fails OR <8 success or first 2 fail.',
        selectScroll: (slot) => (slot === 5 || slot === 10) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            // Reset if slot 5 or 10 failed
            const slot5 = result.slotResults.find(s => s.slot === 5);
            const slot10 = result.slotResults.find(s => s.slot === 10);
            if (slot5 && !slot5.success && !slot5.unfunded) return true;
            if (slot10 && !slot10.success && !slot10.unfunded) return true;
            return result.successfulSlots < 8;
        }
    });

    // NEW: Different damage amp thresholds for high-budget optimization
    strategies.push({
        id: 'damage_amp_0_3',
        name: 'Damage Amp 0.3%+',
        description: '30% L65 scrolls. Reset if damage amp < 0.3%. Good for medium budgets.',
        selectScroll: () => 'L65_30',
        shouldReset: (result) => result.totalDamageAmp < 0.3
    });

    strategies.push({
        id: 'damage_amp_0_7',
        name: 'Damage Amp 0.7%+',
        description: '30% L65 scrolls. Reset if damage amp < 0.7%. Good for high budgets.',
        selectScroll: () => 'L65_30',
        shouldReset: (result) => result.totalDamageAmp < 0.7
    });

    strategies.push({
        id: 'damage_amp_1_0',
        name: 'Damage Amp 1.0%+',
        description: '30% L65 scrolls. Reset if damage amp < 1.0%. Very aggressive, needs high budget.',
        selectScroll: () => 'L65_30',
        shouldReset: (result) => result.totalDamageAmp < 1.0
    });

    // NEW: First slot 30% only - minimal risk, small upside
    strategies.push({
        id: 'first1_30_only',
        name: 'First Slot 30% Only',
        description: '30% L65 on slot 1 only, 70% on rest. Reset if slot 1 fails OR <8 success or first 2 fail.',
        selectScroll: (slot) => (slot === 1) ? 'L65_30' : 'L65_70',
        shouldReset: (result) => {
            if (result.slotResults.length >= 1 && !result.slotResults[0].success) return true;
            if (result.slotResults.length >= 2) {
                const first2Failed = !result.slotResults[0].success && !result.slotResults[1].success;
                if (first2Failed) return true;
            }
            return result.successfulSlots < 8;
        }
    });

    return strategies;
}

// Calculate damage gain from scroll results
function calculateScrollDamageGain(avgAttack, avgDamageAmp) {
    const baseStats = getStats('base');
    const baseDPS = calculateDamage(baseStats, 'boss').dps;

    // Apply scroll bonuses to stats
    const weaponAttackBonus = getWeaponAttackBonus();
    const effectiveAttackIncrease = avgAttack * (1 + weaponAttackBonus / 100);

    const modifiedStats = { ...baseStats };
    modifiedStats.attack += effectiveAttackIncrease;
    modifiedStats.damageAmp += avgDamageAmp;

    const newDPS = calculateDamage(modifiedStats, 'boss').dps;
    const dpsGain = ((newDPS - baseDPS) / baseDPS * 100);

    return {
        baseDPS,
        newDPS,
        dpsGain,
        effectiveAttackIncrease
    };
}

// Main simulation runner
async function runScrollSimulation() {
    const budget = parseInt(document.getElementById('scroll-spell-trace-budget').value);
    const numSimulations = parseInt(document.getElementById('scroll-simulations').value);

    const button = document.getElementById('scroll-run-btn');
    const progressContainer = document.getElementById('scroll-progress-container');
    const progressBar = document.getElementById('scroll-progress-bar');
    const progressText = document.getElementById('scroll-progress-text');

    button.disabled = true;
    progressContainer.style.display = 'block';

    const strategies = createL65Strategies();
    const results = {};

    // Initialize results tracking
    for (const strategy of strategies) {
        results[strategy.id] = {
            strategy,
            attacks: [],
            damageAmps: [],
            successCounts: [],
            resetCounts: [],
            traceUsed: [],
            avgAttack: 0,
            avgDamageAmp: 0,
            avgSuccess: 0,
            avgResets: 0,
            avgTraceUsed: 0,
            exampleResult: null
        };
    }

    // Run simulations
    for (let sim = 0; sim < numSimulations; sim++) {
        if (sim % 50 === 0) {
            const progress = (sim / numSimulations) * 100;
            progressBar.style.width = progress + '%';
            progressText.textContent = `${sim} / ${numSimulations}`;
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        for (const strategy of strategies) {
            const result = simulateScrollWithResets(strategy, budget);

            const data = results[strategy.id];
            data.attacks.push(result.totalAttack);
            data.damageAmps.push(result.totalDamageAmp);
            data.successCounts.push(result.successfulSlots);
            data.resetCounts.push(result.resetCount);
            data.traceUsed.push(result.traceUsed);

            // Store last result as example
            if (sim === numSimulations - 1) {
                data.exampleResult = result;
            }
        }
    }

    // Calculate averages and damage gains
    for (const strategyId in results) {
        const data = results[strategyId];
        data.avgAttack = data.attacks.reduce((a, b) => a + b, 0) / numSimulations;
        data.avgDamageAmp = data.damageAmps.reduce((a, b) => a + b, 0) / numSimulations;
        data.avgSuccess = data.successCounts.reduce((a, b) => a + b, 0) / numSimulations;
        data.avgResets = data.resetCounts.reduce((a, b) => a + b, 0) / numSimulations;
        data.avgTraceUsed = data.traceUsed.reduce((a, b) => a + b, 0) / numSimulations;

        // Calculate damage gain
        const damageGain = calculateScrollDamageGain(data.avgAttack, data.avgDamageAmp);
        data.dpsGain = damageGain.dpsGain;
        data.baseDPS = damageGain.baseDPS;
        data.newDPS = damageGain.newDPS;
        data.effectiveAttackIncrease = damageGain.effectiveAttackIncrease;
    }

    displayScrollResults(results, budget, numSimulations);

    button.disabled = false;
    progressContainer.style.display = 'none';
}

// Display simulation results
function displayScrollResults(results, budget, numSimulations) {
    const container = document.getElementById('scroll-results-container');
    container.innerHTML = '';

    // Find best strategy by DPS gain
    let bestStrategy = null;
    let bestDPSGain = -Infinity;

    for (const strategyId in results) {
        if (results[strategyId].dpsGain > bestDPSGain) {
            bestDPSGain = results[strategyId].dpsGain;
            bestStrategy = strategyId;
        }
    }

    // Create summary table
    let tableHTML = `
        <h3 style="color: var(--accent-primary); margin-bottom: 15px;">Strategy Comparison - Sorted by DPS Gain</h3>
        <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background: var(--background); box-shadow: 0 2px 8px var(--shadow); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: var(--accent-primary); color: white;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Strategy</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">DPS Gain</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Avg Attack</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Avg Damage Amp</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Avg Success</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Avg Resets</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Avg Trace Used</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Sort strategies by DPS gain (descending)
    const sortedStrategies = Object.entries(results).sort((a, b) => b[1].dpsGain - a[1].dpsGain);

    for (const [strategyId, data] of sortedStrategies) {
        const isBest = strategyId === bestStrategy;
        const rowStyle = isBest ?
            'background: linear-gradient(135deg, rgba(52, 199, 89, 0.15), rgba(0, 122, 255, 0.1)); font-weight: 600;' :
            '';

        tableHTML += `
            <tr style="${rowStyle}">
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); cursor: help;" title="${data.strategy.description}">
                    ${data.strategy.name}${isBest ? ' ⭐' : ''}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: right; color: var(--accent-success); font-weight: 600;">
                    +${data.dpsGain.toFixed(2)}%
                </td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: right;">
                    ${data.avgAttack.toFixed(1)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: right;">
                    ${data.avgDamageAmp.toFixed(2)}%
                </td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: right;">
                    ${data.avgSuccess.toFixed(1)} / 10
                </td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: right;">
                    ${data.avgResets.toFixed(1)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: right;">
                    ${data.avgTraceUsed.toFixed(0)} / ${budget}
                </td>
            </tr>
        `;
    }

    tableHTML += '</tbody></table></div>';

    // Add tabbed breakdown for top 5 strategies
    tableHTML += `
        <h3 style="color: var(--accent-primary); margin-top: 30px; margin-bottom: 15px;">Top 5 Strategies - Detailed Breakdown</h3>
        <div style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px var(--shadow);">
            <!-- Tab Navigation with horizontal scroll -->
            <div style="overflow-x: auto; background: var(--background); border-bottom: 2px solid var(--border-color);">
                <div id="scroll-strategy-tabs" style="display: flex; min-width: max-content;">
    `;

    const top5 = sortedStrategies.slice(0, 5);

    // Create tab buttons
    top5.forEach(([strategyId, data], index) => {
        const isBest = strategyId === bestStrategy;
        const isActive = index === 0;
        const activeStyle = isActive ?
            'background: var(--accent-primary); color: white;' :
            'background: transparent; color: var(--text-primary);';

        tableHTML += `
            <button
                class="scroll-strategy-tab-btn ${isActive ? 'active-scroll-tab' : ''}"
                data-strategy-id="${strategyId}"
                onclick="switchScrollStrategyTab('${strategyId}')"
                style="padding: 12px 20px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9em; white-space: nowrap; transition: all 0.3s; ${activeStyle}">
                ${data.strategy.name}${isBest ? ' ⭐' : ''}
            </button>
        `;
    });

    tableHTML += `
                </div>
            </div>
            <!-- Tab Contents -->
            <div id="scroll-strategy-tab-contents" style="padding: 20px; background: var(--background);">
    `;

    // Create tab content for each strategy
    top5.forEach(([strategyId, data], index) => {
        const isBest = strategyId === bestStrategy;
        const isActive = index === 0;
        const displayStyle = isActive ? 'block' : 'none';

        // Calculate percentiles for attack
        const sortedAttacks = [...data.attacks].sort((a, b) => a - b);
        const p10 = sortedAttacks[Math.floor(sortedAttacks.length * 0.10)];
        const p50 = sortedAttacks[Math.floor(sortedAttacks.length * 0.50)];
        const p90 = sortedAttacks[Math.floor(sortedAttacks.length * 0.90)];

        tableHTML += `
            <div id="scroll-strategy-tab-${strategyId}" class="scroll-strategy-tab-content" style="display: ${displayStyle};">
                <h4 style="color: var(--accent-primary); margin-top: 0; font-size: 1.1em;">
                    ${data.strategy.name}${isBest ? ' ⭐ (Best DPS Gain)' : ''}
                </h4>
                <p style="color: var(--text-secondary); font-size: 0.9em; margin: 5px 0 15px 0;">
                    ${data.strategy.description}
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: rgba(0, 122, 255, 0.1); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                        <div style="font-size: 1.4em; font-weight: 700; color: var(--accent-success);">+${data.dpsGain.toFixed(2)}%</div>
                        <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 4px;">DPS Gain</div>
                    </div>
                    <div style="background: rgba(0, 122, 255, 0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                        <div style="font-size: 1.4em; font-weight: 700; color: var(--text-primary);">${data.avgAttack.toFixed(1)}</div>
                        <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 4px;">Avg Attack</div>
                    </div>
                    <div style="background: rgba(0, 122, 255, 0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                        <div style="font-size: 1.4em; font-weight: 700; color: var(--text-primary);">${data.avgDamageAmp.toFixed(2)}%</div>
                        <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 4px;">Avg Damage Amp</div>
                    </div>
                    <div style="background: rgba(0, 122, 255, 0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                        <div style="font-size: 1.4em; font-weight: 700; color: var(--text-primary);">${data.avgSuccess.toFixed(1)}</div>
                        <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 4px;">Avg Success Slots</div>
                    </div>
                    <div style="background: rgba(0, 122, 255, 0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                        <div style="font-size: 1.4em; font-weight: 700; color: var(--text-primary);">${data.avgResets.toFixed(1)}</div>
                        <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 4px;">Avg Resets</div>
                    </div>
                    <div style="background: rgba(0, 122, 255, 0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                        <div style="font-size: 1.4em; font-weight: 700; color: var(--text-primary);">${data.avgTraceUsed.toFixed(0)}</div>
                        <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 4px;">Avg Trace Used</div>
                    </div>
                </div>

                <div style="background: rgba(0, 122, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
                        Attack Distribution (across ${numSimulations.toLocaleString()} simulations):
                    </div>
                    <div style="font-family: monospace; font-size: 0.9em; color: var(--text-secondary);">
                        10th percentile: ${p10} | Median: ${p50} | 90th percentile: ${p90}
                    </div>
                </div>

                <div style="background: rgba(0, 122, 255, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
                        Damage Breakdown:
                    </div>
                    <div style="font-size: 0.9em; color: var(--text-secondary); line-height: 1.6;">
                        Base DPS: ${formatNumber(data.baseDPS)}<br>
                        New DPS: ${formatNumber(data.newDPS)}<br>
                        Effective Attack Increase (with weapon bonus): +${formatNumber(data.effectiveAttackIncrease)}
                    </div>
                </div>
            </div>
        `;
    });

    tableHTML += `
            </div>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// Switch between strategy detail tabs
function switchScrollStrategyTab(strategyId) {
    // Hide all tab contents
    const allContents = document.querySelectorAll('.scroll-strategy-tab-content');
    allContents.forEach(content => {
        content.style.display = 'none';
    });

    // Remove active state from all tab buttons
    const allButtons = document.querySelectorAll('.scroll-strategy-tab-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active-scroll-tab');
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-primary)';
    });

    // Show selected tab content
    const selectedContent = document.getElementById(`scroll-strategy-tab-${strategyId}`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }

    // Highlight selected tab button
    const selectedButton = document.querySelector(`[data-strategy-id="${strategyId}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active-scroll-tab');
        selectedButton.style.background = 'var(--accent-primary)';
        selectedButton.style.color = 'white';
    }
}
