// Results display functionality

import { formatNumber } from '../utils/formatters.js';
import { calculateDamage } from '../core/calculations/damage-calculations.js';
import { getWeaponAttackBonus } from '../core/main.js';
import { getStats } from './../core/state.js';

export function displayResults(itemName, stats, uniqueId, isEquipped = false, equippedDamageValues = null) {
    const bossResults = calculateDamage(stats, 'boss');
    const normalResults = calculateDamage(stats, 'normal');

    const borderColor = isEquipped ? '#10b981' : '#2563eb';
    const bgGradient = isEquipped
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(37, 99, 235, 0.05))'
        : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(88, 86, 214, 0.05))';

    const getPercentChangeDisplay = (currentValue, referenceValue) => {
        if (!referenceValue || referenceValue === 0) return '';
        const changePercentage = ((currentValue - referenceValue) / referenceValue) * 100;
        const changeColor = changePercentage >= 0 ? '#10b981' : '#f59e0b';
        const changeSign = changePercentage >= 0 ? '+' : '';
        return `<span style="color: ${changeColor}; font-weight: 600; margin-left: 8px; font-size: 0.85em;">(${changeSign}${changePercentage.toFixed(2)}%)</span>`;
    };

    const expectedBossDamagePercentChange = equippedDamageValues ? getPercentChangeDisplay(bossResults.expectedDamage, equippedDamageValues.expectedDamageBoss) : '';
    const bossDpsPercentChange = equippedDamageValues ? getPercentChangeDisplay(bossResults.dps, equippedDamageValues.dpsBoss) : '';
    const expectedNormalDamagePercentChange = equippedDamageValues ? getPercentChangeDisplay(normalResults.expectedDamage, equippedDamageValues.expectedDamageNormal) : '';
    const normalDpsPercentChjange = equippedDamageValues ? getPercentChangeDisplay(normalResults.dps, equippedDamageValues.dpsNormal) : '';

    const html = `
        <div class="result-panel" style="background: ${bgGradient}; border: 2px solid ${borderColor}; border-radius: 16px; padding: 20px; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
            <h3 style="color: ${borderColor}; margin-bottom: 15px; text-align: center; font-size: 1.2em; font-weight: 600;">${itemName}</h3>

        <div class="expected-damage">
            <div class="label">Expected Damage (Boss)</div>
            <div class="value">${formatNumber(bossResults.expectedDamage)}${expectedBossDamagePercentChange}</div>
        </div>

        <div class="expected-damage" style="margin-top: 10px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(37, 99, 235, 0.2));">
            <div class="label">DPS (Boss)</div>
            <div class="value">${formatNumber(bossResults.dps)}${bossDpsPercentChange}</div>
        </div>

        <div class="expected-damage" style="margin-top: 10px;">
            <div class="label">Expected Damage (Normal)</div>
            <div class="value">${formatNumber(normalResults.expectedDamage)}${expectedNormalDamagePercentChange}</div>
        </div>

        <div class="expected-damage" style="margin-top: 10px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(37, 99, 235, 0.2));">
            <div class="label">DPS (Normal)</div>
            <div class="value">${formatNumber(normalResults.dps)}${normalDpsPercentChjange}</div>
        </div>

        <div class="toggle-details" onclick="toggleDetails('${uniqueId}')">
            Show Detailed Breakdown
        </div>

        <div id="details-${uniqueId}" class="collapsible-section">
            <div class="damage-box">
                <h3 onclick="toggleSubDetails('stats-${uniqueId}')" style="cursor: pointer; user-select: none;">Stats Used <span id="stats-${uniqueId}-icon">▼</span></h3>
                <div id="stats-${uniqueId}" class="collapsible-section">
                    <div class="damage-row">
                        <span class="damage-label">Attack:</span>
                        <span class="damage-value">${formatNumber(stats.attack)}</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Critical Rate:</span>
                        <span class="damage-value">${stats.critRate.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Critical Damage:</span>
                        <span class="damage-value">${stats.critDamage.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Stat Damage:</span>
                        <span class="damage-value">${stats.statDamage.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Damage:</span>
                        <span class="damage-value">${stats.damage.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Boss Monster Damage:</span>
                        <span class="damage-value">${stats.bossDamage.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Normal Monster Damage:</span>
                        <span class="damage-value">${stats.normalDamage.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Damage Amplification:</span>
                        <span class="damage-value">${stats.damageAmp.toFixed(2)}</span>
                    </div>
                    <div class="damage-row" style="display: none;">
                        <span class="damage-label">Defense Penetration:</span>
                        <span class="damage-value">${stats.defPen.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Skill Coefficient:</span>
                        <span class="damage-value">${stats.skillCoeff.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Skill Mastery:</span>
                        <span class="damage-value">${stats.skillMastery.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Skill Mastery (Boss Only):</span>
                        <span class="damage-value">${stats.skillMasteryBoss.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Attack Speed:</span>
                        <span class="damage-value">${stats.attackSpeed.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Min Damage Multiplier:</span>
                        <span class="damage-value">${stats.minDamage.toFixed(2)}%</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Max Damage Multiplier:</span>
                        <span class="damage-value">${stats.maxDamage.toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            <div class="damage-box">
                <h3 onclick="toggleSubDetails('multipliers-${uniqueId}')" style="cursor: pointer; user-select: none;">Multipliers Applied <span id="multipliers-${uniqueId}-icon">▼</span></h3>
                <div id="multipliers-${uniqueId}" class="collapsible-section">
                    <div class="damage-row">
                        <span class="damage-label">Damage Amp Multiplier:</span>
                        <span class="damage-value">${bossResults.damageAmpMultiplier.toFixed(4)}x</span>
                    </div>
                    <div class="damage-row">
                        <span class="damage-label">Attack Speed Multiplier:</span>
                        <span class="damage-value">${bossResults.attackSpeedMultiplier.toFixed(4)}x</span>
                    </div>
                </div>
            </div>

            <div class="damage-box">
                <h3 onclick="toggleSubDetails('boss-${uniqueId}')" style="cursor: pointer; user-select: none;">VS Boss Monsters <span id="boss-${uniqueId}-icon">▼</span></h3>
                <div id="boss-${uniqueId}" class="collapsible-section">
                <div class="damage-row">
                    <span class="damage-label">Base Damage:</span>
                    <span class="damage-value">${formatNumber(bossResults.baseDamage)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Non-Crit MIN:</span>
                    <span class="damage-value">${formatNumber(bossResults.nonCritMin)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Non-Crit AVG:</span>
                    <span class="damage-value">${formatNumber(bossResults.nonCritAvg)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Non-Crit MAX:</span>
                    <span class="damage-value">${formatNumber(bossResults.nonCritMax)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Crit MIN:</span>
                    <span class="damage-value">${formatNumber(bossResults.critMin)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Crit AVG:</span>
                    <span class="damage-value">${formatNumber(bossResults.critAvg)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Crit MAX:</span>
                    <span class="damage-value">${formatNumber(bossResults.critMax)}</span>
                </div>
            </div>
            </div>

            <div class="damage-box">
                <h3 onclick="toggleSubDetails('normal-${uniqueId}')" style="cursor: pointer; user-select: none;">VS Normal Monsters <span id="normal-${uniqueId}-icon">▼</span></h3>
                <div id="normal-${uniqueId}" class="collapsible-section">
                <div class="damage-row">
                    <span class="damage-label">Base Damage:</span>
                    <span class="damage-value">${formatNumber(normalResults.baseDamage)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Non-Crit MIN:</span>
                    <span class="damage-value">${formatNumber(normalResults.nonCritMin)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Non-Crit AVG:</span>
                    <span class="damage-value">${formatNumber(normalResults.nonCritAvg)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Non-Crit MAX:</span>
                    <span class="damage-value">${formatNumber(normalResults.nonCritMax)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Crit MIN:</span>
                    <span class="damage-value">${formatNumber(normalResults.critMin)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Crit AVG:</span>
                    <span class="damage-value">${formatNumber(normalResults.critAvg)}</span>
                </div>
                <div class="damage-row">
                    <span class="damage-label">Crit MAX:</span>
                    <span class="damage-value">${formatNumber(normalResults.critMax)}</span>
                </div>
                </div>
            </div>
        </div>
    </div>
    `;

    return html;
}


export function toggleSubDetails(id) {
    const section = document.getElementById(id);
    const icon = document.getElementById(`${id}-icon`);

    if (section.classList.contains('expanded')) {
        section.classList.remove('expanded');
        icon.textContent = '▼';
    } else {
        section.classList.add('expanded');
        icon.textContent = '▲';
    }
}


export function toggleDetails(id) {
    const detailsSection = document.getElementById(`details-${id}`);
    const toggleButton = event.target;

    if (detailsSection.classList.contains('expanded')) {
        detailsSection.classList.remove('expanded');
        toggleButton.classList.remove('expanded');
        toggleButton.textContent = 'Show Detailed Breakdown';
    } else {
        detailsSection.classList.add('expanded');
        toggleButton.classList.add('expanded');
        toggleButton.textContent = 'Hide Detailed Breakdown';
    }
}

// Hero Power Ability preset management

export function calculateEquipmentSlotDPS() {
    const baseStats = getStats('base');
    const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];
    const weaponAttackBonus = getWeaponAttackBonus();

    // Calculate baseline DPS (with all slots)
    const baselineDPS = calculateDamage(baseStats, 'boss').dps;

    // Track total stats from all slots for total DPS calculation
    let totalAttackFromSlots = 0;
    let totalStatDamageFromSlots = 0;
    let totalDamageAmpFromSlots = 0;

    slotNames.forEach(slotId => {
        const attackInput = document.getElementById(`slot-${slotId}-attack`);
        const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
        const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

        const slotAttack = parseFloat(attackInput?.value) || 0;
        const slotMainStat = parseFloat(mainStatInput?.value) || 0;
        const slotDamageAmp = parseFloat(damageAmpInput?.value) || 0;

        // Calculate weapon attack bonus (same as scrolling tab)
        const effectiveAttackIncrease = slotAttack * (1 + weaponAttackBonus / 100);

        // Convert main stat to stat damage (100:1 ratio)
        const statDamageFromMainStat = slotMainStat / 100;

        // Add to totals
        totalAttackFromSlots += effectiveAttackIncrease;
        totalStatDamageFromSlots += statDamageFromMainStat;
        totalDamageAmpFromSlots += slotDamageAmp;

        // Remove this slot's stats from base to see DPS without it
        const statsWithoutSlot = { ...baseStats };
        statsWithoutSlot.attack -= effectiveAttackIncrease;
        statsWithoutSlot.statDamage -= statDamageFromMainStat;
        statsWithoutSlot.damageAmp -= slotDamageAmp;

        // Calculate DPS without this slot
        const withoutSlotDPS = calculateDamage(statsWithoutSlot, 'boss').dps;

        // Calculate percentage gain
        const dpsGainPct = ((baselineDPS - withoutSlotDPS) / baselineDPS * 100);

        // Display results
        const dpsDisplay = document.getElementById(`slot-${slotId}-dps`);
        if (dpsDisplay) dpsDisplay.textContent = `+${dpsGainPct.toFixed(2)}%`;
    });

    // Calculate total DPS gain from all slots
    const statsWithoutAllSlots = { ...baseStats };
    statsWithoutAllSlots.attack -= totalAttackFromSlots;
    statsWithoutAllSlots.statDamage -= totalStatDamageFromSlots;
    statsWithoutAllSlots.damageAmp -= totalDamageAmpFromSlots;

    const withoutAllSlotsDPS = calculateDamage(statsWithoutAllSlots, 'boss').dps;
    const totalDPSGainPct = ((baselineDPS - withoutAllSlotsDPS) / baselineDPS * 100);

    // Display total DPS gain
    const totalDPSDisplay = document.getElementById('total-slots-dps');
    if (totalDPSDisplay) totalDPSDisplay.textContent = `+${totalDPSGainPct.toFixed(2)}%`;
}