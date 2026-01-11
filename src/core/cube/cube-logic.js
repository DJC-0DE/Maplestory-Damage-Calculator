// Business logic for cube potential system
// Pure business logic functions with no DOM manipulation

import { classMainStatMap, slotSpecificPotentials, equipmentPotentialData } from './cube-potential-data.js';
import { calculateDamage } from '../calculations/damage-calculations.js';
import { getStats } from '../state.js';
import { calculateMainStatPercentGain } from '../calculations/stat-calculations.js';
import { getSelectedClass } from '../main.js';

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
        const currentSelectedClass = typeof selectedClass !== 'undefined' ? getSelectedClass() : null;

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

// Calculate DPS gain for a specific slot's potential set
// This properly handles the baseline by subtracting the set first, then adding it back
export function calculateSlotSetGain(slotId, rarity, setData, currentStats) {
    // Step 1: Calculate baseline by removing this set's contribution from current stats
    const baselineStats = { ...currentStats };
    let accumulatedMainStatPct = 0;

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const line = setData[`line${lineNum}`];
        if (!line || !line.stat) continue;

        // Only process line if it exists in the current rarity for this slot
        if (!lineExistsInRarity(slotId, rarity, lineNum, line.stat, line.value, line.prime)) continue;

        const mapped = potentialStatToDamageStat(line.stat, line.value, accumulatedMainStatPct);
        if (mapped.stat) {
            // Subtract to get baseline
            baselineStats[mapped.stat] = (baselineStats[mapped.stat] || 0) - mapped.value;
            if (mapped.isMainStatPct) {
                accumulatedMainStatPct += line.value;
            }
        }
    }

    const baselineDPS = calculateDamage(baselineStats, 'boss').dps;

    // Step 2: Calculate stats with this set applied to baseline
    const setStats = { ...baselineStats };
    accumulatedMainStatPct = 0;

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const line = setData[`line${lineNum}`];
        if (!line || !line.stat) continue;

        if (!lineExistsInRarity(slotId, rarity, lineNum, line.stat, line.value, line.prime)) continue;

        const mapped = potentialStatToDamageStat(line.stat, line.value, accumulatedMainStatPct);
        if (mapped.stat) {
            // Add to baseline
            setStats[mapped.stat] = (setStats[mapped.stat] || 0) + mapped.value;
            if (mapped.isMainStatPct) {
                accumulatedMainStatPct += line.value;
            }
        }
    }

    const setDPS = calculateDamage(setStats, 'boss').dps;
    const gain = ((setDPS - baselineDPS) / baselineDPS * 100);

    return { gain, stats: setStats, baselineStats };
}

// Save cube potential data to localStorage
export function saveCubePotentialData(cubeSlotData) {
    try {
        localStorage.setItem('cubePotentialData', JSON.stringify(cubeSlotData));
    } catch (error) {
        console.error('Error saving cube potential data:', error);
    }
}

// Load cube potential data from localStorage
export function loadCubePotentialData(cubeSlotData, slotNames) {
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

// Calculate comparison between Set A and Set B
export function calculateComparison(cubeSlotData, currentCubeSlot, currentPotentialType, rankingsCache) {
    if (!getSelectedClass()) {
        return;
    }

    const slotData = cubeSlotData[currentCubeSlot][currentPotentialType];
    const currentStats = getStats('base'); // User's current stats (includes all equipped potential)
    const rarity = slotData.rarity;

    // Use shared function to calculate Set A
    const setAResult = calculateSlotSetGain(currentCubeSlot, rarity, slotData.setA, currentStats);
    const setAGain = setAResult.gain;
    const setAStats = setAResult.stats;
    const baselineStats = setAResult.baselineStats;

    // Calculate Set B using the same baseline
    const setBStats = { ...baselineStats };
    let setBAccumulatedMainStatPct = 0;

    for (let lineNum = 1; lineNum <= 3; lineNum++) {
        const statSelect = document.getElementById(`cube-setB-line${lineNum}-stat`);
        if (!statSelect || !statSelect.value) continue;

        const line = slotData.setB[`line${lineNum}`];
        if (!line || !line.stat) continue;

        const mapped = potentialStatToDamageStat(line.stat, line.value, setBAccumulatedMainStatPct);
        if (mapped.stat) {
            setBStats[mapped.stat] = (setBStats[mapped.stat] || 0) + mapped.value;
            if (mapped.isMainStatPct) {
                setBAccumulatedMainStatPct += line.value;
            }
        }
    }
    const setBDPS = calculateDamage(setBStats, 'boss').dps;
    const baselineDPS = calculateDamage(baselineStats, 'boss').dps;
    const setADPS = calculateDamage(setAStats, 'boss').dps;

    // Calculate gains
    // Set B Absolute Gain: compared to baseline (for ranking comparison)
    const setBAbsoluteGain = ((setBDPS - baselineDPS) / baselineDPS * 100);
    // Set B Relative Gain: compared to Set A (shows the delta when swapping from A to B)
    const setBGain = ((setBDPS - setADPS) / setADPS * 100);
    const deltaGain = setBGain - setAGain;

    // Return the results instead of calling display functions
    return {
        setAGain,
        setBGain,
        setBAbsoluteGain, // For ranking comparison
        deltaGain,
        setAStats,
        setBStats,
        slotId: currentCubeSlot,
        rarity: cubeSlotData[currentCubeSlot][currentPotentialType].rarity
    };
}

// Get percentile for a given DPS gain (helper for summary)
export function getPercentileForGain(slotId, rarity, dpsGain, rankingsCache, rankingsInProgress) {
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
