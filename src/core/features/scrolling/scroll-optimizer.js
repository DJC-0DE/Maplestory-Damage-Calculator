// Scroll Optimizer - Level 65 and Level 85 Scrolls
// This module simulates different scrolling strategies and calculates damage gains

import { formatNumber } from '@utils/formatters.js';
import { getStats } from '@core/main.js';
import { StatCalculationService } from '@core/services/stat-calculation-service.js';

window.runScrollSimulation = runScrollSimulation;
window.switchScrollStrategyTab = switchScrollStrategyTab;
window.updateScrollLevelInfo = updateScrollLevelInfo;

// Scroll definitions
const SCROLLS_L65 = {
    'L65_70': { name: '70% Level 65', baseSuccess: 0.70, cost: 250, attack: 100, damageAmp: 0 },
    'L65_30': { name: '30% Level 65', baseSuccess: 0.30, cost: 300, attack: 200, damageAmp: 0.1 }
};

const SCROLLS_L85 = {
    'L85_70': { name: '70% Level 85', baseSuccess: 0.70, cost: 500, attack: 200, damageAmp: 0.2 },
    'L85_30': { name: '30% Level 85', baseSuccess: 0.30, cost: 650, attack: 400, damageAmp: 0.4 },
    'L85_15': { name: '15% Level 85', baseSuccess: 0.15, cost: 800, attack: 800, damageAmp: 0.8 }
};

const GLOBAL_SUCCESS_BONUS = 0.02;
const BONUS_AT_SLOT_5 = 0.10;
const BONUS_AT_SLOT_10 = 0.20;
const RESET_COST = 50;
const NUM_SLOTS = 10;

// Update scroll level info display
export function updateScrollLevelInfo() {
    const level = document.querySelector('input[name="scroll-level"]:checked')?.value || '65';
    const infoDiv = document.getElementById('scroll-level-info');

    if (!infoDiv) return;

    if (level === '65') {
        infoDiv.innerHTML = `
            <strong>Level 65 Scrolls:</strong><br>
            • 70%: +100 ATK, 250 spell trace<br>
            • 30%: +200 ATK, +0.1% Damage Amp, 300 spell trace
        `;
    } else {
        infoDiv.innerHTML = `
            <strong>Level 85 Scrolls:</strong><br>
            • 70%: +200 ATK, +0.2% Damage Amp, 500 spell trace<br>
            • 30%: +400 ATK, +0.4% Damage Amp, 650 spell trace<br>
            • 15%: +800 ATK, +0.8% Damage Amp, 800 spell trace
        `;
    }
}

// Calculate success rate for a scroll at a specific slot
export function getScrollSuccessRate(scroll, slotNumber) {
    let rate = scroll.baseSuccess + GLOBAL_SUCCESS_BONUS;
    if (slotNumber === 5) rate += BONUS_AT_SLOT_5;
    if (slotNumber === 10) rate += BONUS_AT_SLOT_10;
    return Math.min(rate, 1.0); // Cap at 100%
}

// Attempt one complete scroll run (all 10 slots)
export function attemptScrollRun(strategy, budget, traceUsed, scrolls) {
    let totalAttack = 0;
    let totalDamageAmp = 0;
    let successfulSlots = 0;
    let failedSlots = 0;
    let attemptCost = 0;
    const slotResults = [];
    let earlyReset = false;

    for (let slot = 1; slot <= NUM_SLOTS; slot++) {
        const scrollType = strategy.selectScroll(slot, successfulSlots, failedSlots, traceUsed + attemptCost, budget);
        const scroll = scrolls[scrollType];

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

        // Check for early reset after this slot (if strategy supports it)
        if (strategy.shouldResetEarly) {
            const shouldResetEarly = strategy.shouldResetEarly(slotResults, slot, successfulSlots, failedSlots);
            if (shouldResetEarly) {
                earlyReset = true;
                // Mark remaining slots as unfunded
                for (let s = slot + 1; s <= NUM_SLOTS; s++) {
                    slotResults.push({ slot: s, success: false, unfunded: true });
                }
                break;
            }
        }
    }

    return {
        totalAttack,
        totalDamageAmp,
        successfulSlots,
        failedSlots,
        attemptCost,
        slotResults,
        earlyReset
    };
}

// Simulate with reset strategy
export function simulateScrollWithResets(strategy, budget, scrolls) {
    let traceUsed = 0;
    let resetCount = 0;
    let finalResult = null;
    let attemptCount = 0;

    while (traceUsed < budget) {
        attemptCount++;
        const result = attemptScrollRun(strategy, budget, traceUsed, scrolls);

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

        // Check if early reset was triggered (takes priority)
        let shouldReset = false;
        if (result.earlyReset) {
            shouldReset = true;
        } else {
            // Otherwise, strategy decides whether to reset based on final result
            shouldReset = strategy.shouldReset(result, traceUsed, budget);
        }

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

// Create strategy variations for L65 scrolls - Lock-in optimized strategies
export function createL65Strategies() {
    const strategies = [];

    // Secure Slot 1 with 30% (Base strategy)
    strategies.push({
        id: 'L65_slot1_30_lock',
        name: 'Secure Slot 1 (30%)',
        description: 'Reset until 30% succeeds on slot 1. Then 30% on slots 5&10, 70% on others. Low budget efficient.',
        selectScroll: (slot) => {
            if (slot === 1) return 'L65_30';
            if (slot === 5 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // 70% Base with 30% on Bonus Slots Only
    strategies.push({
        id: 'L65_70_bonus_30',
        name: '70% Base + Bonus 30%',
        description: '70% L65 on all slots except 5&10, which use 30% (42% and 52% success rates). No early resets.',
        selectScroll: (slot) => {
            if (slot === 5 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldReset: () => false
    });

    // Secure Slot 10 with 30% (Best bonus slot)
    strategies.push({
        id: 'L65_slot10_30_lock',
        name: 'Secure Slot 10 (30%)',
        description: 'Reset until 30% succeeds on slot 10 (52% with +20% bonus). Then 30% on slots 1&5, 70% on others.',
        selectScroll: (slot) => {
            if (slot === 10) return 'L65_30';
            if (slot === 1 || slot === 5) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 10 && slotResults.length >= 10) {
                const slot10 = slotResults[9];
                if (!slot10.success && !slot10.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Secure Slot 5 with 30%
    strategies.push({
        id: 'L65_slot5_30_lock',
        name: 'Secure Slot 5 (30%)',
        description: 'Reset until 30% succeeds on slot 5 (42% with +10% bonus). Then 30% on slots 1&10, 70% on others.',
        selectScroll: (slot) => {
            if (slot === 5) return 'L65_30';
            if (slot === 1 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 5 && slotResults.length >= 5) {
                const slot5 = slotResults[4];
                if (!slot5.success && !slot5.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Secure Two Slots: 1 + 10
    strategies.push({
        id: 'L65_slot1_10_double_lock',
        name: 'Secure Slots 1+10 (30%)',
        description: 'Reset until slot 1 succeeds, then reset until slot 10 succeeds (both 30%). Then 30% on slot 5, 70% on others. High damage floor.',
        selectScroll: (slot) => {
            if (slot === 1 || slot === 10) return 'L65_30';
            if (slot === 5) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            // Reset if slot 1 fails
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            // Reset if slot 10 fails (after slot 1 succeeded)
            if (currentSlot === 10 && slotResults.length >= 10) {
                const slot1 = slotResults[0];
                const slot10 = slotResults[9];
                if (slot1.success && !slot10.success && !slot10.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Secure Two Slots: 1 + 5
    strategies.push({
        id: 'L65_slot1_5_double_lock',
        name: 'Secure Slots 1+5 (30%)',
        description: 'Reset until slot 1 succeeds, then reset until slot 5 succeeds (both 30%). Then 30% on slot 10, 70% on others. Medium budget.',
        selectScroll: (slot) => {
            if (slot === 1 || slot === 5) return 'L65_30';
            if (slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            // Reset if slot 1 fails
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            // Reset if slot 5 fails (after slot 1 succeeded)
            if (currentSlot === 5 && slotResults.length >= 5) {
                const slot1 = slotResults[0];
                const slot5 = slotResults[4];
                if (slot1.success && !slot5.success && !slot5.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Secure All Three Key Slots
    strategies.push({
        id: 'L65_triple_lock_1_5_10',
        name: 'Secure All Three 30% (1+5+10)',
        description: 'Reset until slots 1, 5, and 10 all succeed sequentially (all 30%). 70% on others. High budget, guarantees 3x 30% success.',
        selectScroll: (slot) => {
            if (slot === 1 || slot === 5 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            // Reset if slot 1 fails
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            // Reset if slot 5 fails (after slot 1 succeeded)
            if (currentSlot === 5 && slotResults.length >= 5) {
                const slot1 = slotResults[0];
                const slot5 = slotResults[4];
                if (slot1.success && !slot5.success && !slot5.unfunded) {
                    return true;
                }
            }
            // Reset if slot 10 fails (after slots 1 and 5 succeeded)
            if (currentSlot === 10 && slotResults.length >= 10) {
                const slot1 = slotResults[0];
                const slot5 = slotResults[4];
                const slot10 = slotResults[9];
                if (slot1.success && slot5.success && !slot10.success && !slot10.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Secure Slot 1, then All 30%
    strategies.push({
        id: 'L65_slot1_lock_all_30',
        name: 'Secure Slot 1 (30%) + All 30%',
        description: 'Reset until slot 1 succeeds with 30%, then use 30% L65 for ALL remaining slots. High damage amp potential, high budget required.',
        selectScroll: () => 'L65_30',
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Secure Slot 1 + Require Damage Amp
    strategies.push({
        id: 'L65_slot1_lock_amp_0_5',
        name: 'Secure Slot 1 (30%) + 0.5% Amp',
        description: 'Reset until slot 1 succeeds with 30%, then 30% on slots 5&10, 70% elsewhere. Also reset if total damage amp < 0.5%. High budget.',
        selectScroll: (slot) => {
            if (slot === 1) return 'L65_30';
            if (slot === 5 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: (result) => {
            return result.totalDamageAmp < 0.5;
        }
    });

    // Secure Slot 1 + Require Bonus Success
    strategies.push({
        id: 'L65_slot1_lock_bonus_retry',
        name: 'Secure Slot 1 (30%) + Bonus Retry',
        description: 'Reset until slot 1 succeeds with 30%, then 30% on slots 5&10, 70% elsewhere. Also reset if both bonus slots (5&10) fail. Medium budget.',
        selectScroll: (slot) => {
            if (slot === 1) return 'L65_30';
            if (slot === 5 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: (result) => {
            // Reset if both slot 5 and slot 10 failed
            const slot5 = result.slotResults.find(s => s.slot === 5);
            const slot10 = result.slotResults.find(s => s.slot === 10);
            if (slot5 && slot10 && !slot5.unfunded && !slot10.unfunded) {
                if (!slot5.success && !slot10.success) {
                    return true;
                }
            }
            return false;
        }
    });

    // Secure Slot 1 + Require High Success Rate
    strategies.push({
        id: 'L65_slot1_lock_8plus',
        name: 'Secure Slot 1 (30%) + 8+ Successes',
        description: 'Reset until slot 1 succeeds with 30%, then 30% on slots 5&10, 70% elsewhere. Also reset if <8 total successes. Very high budget.',
        selectScroll: (slot) => {
            if (slot === 1) return 'L65_30';
            if (slot === 5 || slot === 10) return 'L65_30';
            return 'L65_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: (result) => {
            return result.successfulSlots < 8;
        }
    });

    return strategies;
}

// Create strategy variations for L85 scrolls
export function createL85Strategies() {
    const strategies = [];

    // Base strategy: Slot 1 15% Lock-In
    strategies.push({
        id: 'L85_slot1_15_lock',
        name: 'Slot 1 15% Lock-In',
        description: '15% L85 on slot 1, reset until success. Then 15% on slots 5&10, 70% on others. No resets after slot 1 succeeds.',
        selectScroll: (slot) => {
            if (slot === 1) return 'L85_15';
            if (slot === 5 || slot === 10) return 'L85_15';
            return 'L85_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Slot 1 Lock + All 30%
    strategies.push({
        id: 'L85_slot1_lock_then_30',
        name: 'Slot 1 Lock + All 30%',
        description: 'Lock slot 1 with 15%, then use 30% L85 for all remaining slots. Higher risk/reward for high budgets.',
        selectScroll: (slot) => {
            if (slot === 1) return 'L85_15';
            return 'L85_30';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Slot 1 Lock + High Success Requirement
    strategies.push({
        id: 'L85_slot1_lock_7plus',
        name: 'Slot 1 Lock + 7+ Successes',
        description: 'Lock slot 1, then 15% on slots 5&10, 70% elsewhere. Reset if <7 total successes. Very high budget.',
        selectScroll: (slot) => {
            if (slot === 1) return 'L85_15';
            if (slot === 5 || slot === 10) return 'L85_15';
            return 'L85_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: (result) => {
            return result.successfulSlots < 7;
        }
    });

    // Double Lock: Slot 1 + Slot 5
    strategies.push({
        id: 'L85_slot1_5_double_lock',
        name: 'Slot 1+5 Double Lock',
        description: 'Reset until slot 1 succeeds with a 15%, 70% until slot 5, reset until slot 15% suceeds here too, 70% until slot 10 where finish off with 15%.',
        selectScroll: (slot) => {
            if (slot === 1 || slot === 5) return 'L85_15';
            if (slot === 10) return 'L85_15';
            return 'L85_70';
        },
        shouldResetEarly: (slotResults, currentSlot) => {
            // Reset if slot 1 fails
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            // Reset if slot 5 fails (after slot 1 succeeded)
            if (currentSlot === 5 && slotResults.length >= 5) {
                const slot1 = slotResults[0];
                const slot5 = slotResults[4];
                if (slot1.success && !slot5.success && !slot5.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    // Slot 1 Lock + All 15% (Ultra Aggressive)
    strategies.push({
        id: 'L85_slot1_lock_all_15',
        name: 'Slot 1 Lock + All 15%',
        description: 'Lock slot 1, then use 15% L85 for ALL remaining slots. Ultra-aggressive, extreme budget required.',
        selectScroll: () => 'L85_15',
        shouldResetEarly: (slotResults, currentSlot) => {
            if (currentSlot === 1 && slotResults.length >= 1) {
                const slot1 = slotResults[0];
                if (!slot1.success && !slot1.unfunded) {
                    return true;
                }
            }
            return false;
        },
        shouldReset: () => false
    });

    return strategies;
}

// Calculate damage gain from scroll results
export function calculateScrollDamageGain(avgAttack, avgDamageAmp) {
    const baseStats = getStats('base');

    // Use StatCalculationService to apply scroll bonuses (auto-fetches weaponAttackBonus)
    const service = new StatCalculationService(baseStats);
    service.addAttack(avgAttack);
    service.addPercentageStat('damageAmp', avgDamageAmp);

    const baseDPS = service.baseBossDPS;
    const newDPS = service.computeDPS('boss');
    const dpsGain = ((newDPS - baseDPS) / baseDPS * 100);
    const weaponAttackBonus = service.weaponAttackBonus;
    const effectiveAttackIncrease = avgAttack * (1 + weaponAttackBonus / 100);

    return {
        baseDPS,
        newDPS,
        dpsGain,
        effectiveAttackIncrease
    };
}

// Main simulation runner
export async function runScrollSimulation() {
    const budget = parseInt(document.getElementById('scroll-spell-trace-budget').value);
    const numSimulations = parseInt(document.getElementById('scroll-simulations').value);
    const scrollLevel = document.querySelector('input[name="scroll-level"]:checked')?.value || '65';
    const scrolls = scrollLevel === '65' ? SCROLLS_L65 : SCROLLS_L85;

    const button = document.getElementById('scroll-run-btn');
    const progressContainer = document.getElementById('scroll-progress-container');
    const progressBar = document.getElementById('scroll-progress-bar');
    const progressText = document.getElementById('scroll-progress-text');

    button.disabled = true;
    progressContainer.style.display = 'block';

    // Get strategies based on selected scroll level
    const strategies = scrollLevel === '65' ? createL65Strategies() : createL85Strategies();
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
            const result = simulateScrollWithResets(strategy, budget, scrolls);

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
export function displayScrollResults(results, budget, numSimulations) {
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
        const activeClass = isActive ?
            'bg-blue-600 dark:bg-blue-500 text-white' :
            'bg-transparent text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20';

        tableHTML += `
            <button
                class="scroll-strategy-tab-btn ${isActive ? 'active-scroll-tab' : ''} ${activeClass} px-5 py-3 border-none cursor-pointer font-semibold text-sm whitespace-nowrap transition-all"
                data-strategy-id="${strategyId}"
                onclick="switchScrollStrategyTab('${strategyId}')">
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
                    <div style="font-family: monospace; font-size: 0.9em; color: var(--text-secondary); margin-bottom: 12px;">
                        10th percentile: ${p10} | Median: ${p50} | 90th percentile: ${p90}
                    </div>
                    ${(() => {
                        // Create histogram bins (groups of 50 attack)
                        const binSize = 50;
                        const maxAttack = Math.max(...data.attacks);
                        const numBins = Math.ceil(maxAttack / binSize) + 1;
                        const bins = new Array(numBins).fill(0);

                        // Count simulations in each bin
                        data.attacks.forEach(attack => {
                            const binIndex = Math.floor(attack / binSize);
                            bins[binIndex]++;
                        });

                        // Find max count for scaling
                        const maxCount = Math.max(...bins);

                        // Generate histogram HTML
                        let histogramHTML = '<div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 8px;">';

                        // Only show bins that have at least 1 simulation
                        bins.forEach((count, index) => {
                            if (count > 0) {
                                const rangeStart = index * binSize;
                                const rangeEnd = (index + 1) * binSize;
                                const percentage = (count / numSimulations * 100).toFixed(1);
                                const barWidth = (count / maxCount * 100).toFixed(1);

                                histogramHTML +=
                                    '<div style="display: flex; align-items: center; margin-bottom: 4px;">' +
                                        '<div style="width: 100px; text-align: right; padding-right: 8px; font-family: monospace;">' +
                                            rangeStart + '-' + rangeEnd + ':' +
                                        '</div>' +
                                        '<div style="flex: 1; background: #e0e0e0; border-radius: 3px; height: 20px; position: relative;">' +
                                            '<div style="background: linear-gradient(90deg, #007AFF, #34C759); width: ' + barWidth + '%; height: 100%; border-radius: 3px; transition: width 0.3s;"></div>' +
                                        '</div>' +
                                        '<div style="width: 80px; padding-left: 8px; font-family: monospace; font-size: 0.9em;">' +
                                            count + ' (' + percentage + '%)' +
                                        '</div>' +
                                    '</div>';
                            }
                        });

                        histogramHTML += '</div>';
                        return histogramHTML;
                    })()}
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
export function switchScrollStrategyTab(strategyId) {
    // Hide all tab contents
    const allContents = document.querySelectorAll('.scroll-strategy-tab-content');
    allContents.forEach(content => {
        content.style.display = 'none';
    });

    // Remove active state from all tab buttons
    const allButtons = document.querySelectorAll('.scroll-strategy-tab-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active-scroll-tab');
        btn.classList.remove('bg-blue-600', 'dark:bg-blue-500', 'text-white');
        btn.classList.add('bg-transparent', 'text-gray-900', 'dark:text-gray-100', 'hover:bg-blue-50', 'dark:hover:bg-blue-900/20');
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
        selectedButton.classList.remove('bg-transparent', 'text-gray-900', 'dark:text-gray-100', 'hover:bg-blue-50', 'dark:hover:bg-blue-900/20');
        selectedButton.classList.add('bg-blue-600', 'dark:bg-blue-500', 'text-white');
    }
}
