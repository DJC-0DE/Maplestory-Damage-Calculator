// Calculate stat damage gain from main stat % increase
// This is the canonical implementation used by both the predicted damage table and cube potential
export function calculateMainStatPercentGain(mainStatPctIncrease, currentMainStatPct, primaryMainStat, defense, selectedClass) {
    let defenseToMainStat = 0;
    if (selectedClass === 'dark-knight') {
        defenseToMainStat = defense * 0.127;
    }

    // Primary main stat is AFTER applying current main stat %
    // We need to work backwards to find the base main stat (before main stat % multiplier)
    // For Dark Knight: defense contribution is NOT affected by main stat %
    // So: primaryMainStat = (baseMainStat × currentMultiplier) + defenseToMainStat
    // Therefore: baseMainStat = (primaryMainStat - defenseToMainStat) / currentMultiplier

    const currentMultiplier = 1 + currentMainStatPct / 100;
    const baseMainStat = (primaryMainStat - defenseToMainStat) / currentMultiplier;

    // Now calculate the new total with the increased main stat %
    const newMultiplier = 1 + (currentMainStatPct + mainStatPctIncrease) / 100;
    const newTotalMainStat = (baseMainStat * newMultiplier) + defenseToMainStat;

    // Calculate the gain in main stat
    const mainStatGain = newTotalMainStat - primaryMainStat;

    // Convert to stat damage (100 main stat = 1% stat damage)
    const statDamageGain = mainStatGain / 100;

    return statDamageGain;
}