// Equipment UI functionality

import { saveToLocalStorage } from '../core/storage.js';
import { calculate, getItemStats, getWeaponAttackBonus } from '../core/main.js';
import { getSelectedClass } from '../../src/core/state.js';
import { removeComparisonItem, addComparisonItem, addComparisonItemStat } from './comparison-ui.js';
import { comparisonItemCount, equippedStatCount, setEquippedStatCount, availableStats } from '../core/constants.js';

export function unequipItem() {
    // Get equipped item data
    const equippedItem = getItemStats('equipped');

    if (!equippedItem.name && equippedItem.attack === 0 && equippedItem.mainStat === 0 &&
        equippedItem.defense === 0 && equippedItem.critRate === 0 && equippedItem.critDamage === 0 &&
        equippedItem.skillLevel === 0 && equippedItem.normalDamage === 0 &&
        equippedItem.bossDamage === 0 && equippedItem.damage === 0) {
        alert('No item currently equipped');
        return;
    }

    // Subtract equipped item stats from base stats
    const weaponMultiplier = 1 + (getWeaponAttackBonus() / 100);

    const attackBase = document.getElementById('attack-base');
    attackBase.value = Math.floor(parseFloat(attackBase.value) - (equippedItem.attack * weaponMultiplier));

    const statDamageBase = document.getElementById('stat-damage-base');
    let statDamageChange = equippedItem.mainStat / 100;
    // For Dark Knight: defense converts to main stat
    const currentClass = getSelectedClass();
    if (currentClass === 'dark-knight') {
        statDamageChange += (equippedItem.defense * 0.127) / 100;
    }
    statDamageBase.value = (parseFloat(statDamageBase.value) - statDamageChange).toFixed(1);

    const critRateBase = document.getElementById('crit-rate-base');
    critRateBase.value = (parseFloat(critRateBase.value) - equippedItem.critRate).toFixed(1);

    const critDamageBase = document.getElementById('crit-damage-base');
    critDamageBase.value = (parseFloat(critDamageBase.value) - equippedItem.critDamage).toFixed(1);

    const skillCoeffBase = document.getElementById('skill-coeff-base');
    skillCoeffBase.value = (parseFloat(skillCoeffBase.value) - (equippedItem.skillLevel * 0.3)).toFixed(1);

    const normalDamageBase = document.getElementById('normal-damage-base');
    normalDamageBase.value = (parseFloat(normalDamageBase.value) - equippedItem.normalDamage).toFixed(1);

    const bossDamageBase = document.getElementById('boss-damage-base');
    bossDamageBase.value = (parseFloat(bossDamageBase.value) - equippedItem.bossDamage).toFixed(1);

    const damageBase = document.getElementById('damage-base');
    damageBase.value = (parseFloat(damageBase.value) - equippedItem.damage).toFixed(1);

    // Move to comparison items
    addComparisonItem();
    document.getElementById(`item-${comparisonItemCount}-name`).value = equippedItem.name || 'Unequipped Item';
    document.getElementById(`item-${comparisonItemCount}-attack`).value = equippedItem.attack;

    // Add stats to comparison item
    const statMapping = [
        { type: 'main-stat', value: equippedItem.mainStat },
        { type: 'defense', value: equippedItem.defense },
        { type: 'crit-rate', value: equippedItem.critRate },
        { type: 'crit-damage', value: equippedItem.critDamage },
        { type: 'skill-level', value: equippedItem.skillLevel },
        { type: 'normal-damage', value: equippedItem.normalDamage },
        { type: 'boss-damage', value: equippedItem.bossDamage },
        { type: 'damage', value: equippedItem.damage }
    ];

    statMapping.forEach(stat => {
        if (stat.value !== 0) {
            addComparisonItemStat(comparisonItemCount);
            const container = document.getElementById(`item-${comparisonItemCount}-stats-container`);
            const statCount = container.children.length;
            document.getElementById(`item-${comparisonItemCount}-stat-${statCount}-type`).value = stat.type;
            document.getElementById(`item-${comparisonItemCount}-stat-${statCount}-value`).value = stat.value;
        }
    });

    // Clear equipped item
    document.getElementById('equipped-name').value = 'Current Item';
    document.getElementById('equipped-attack').value = '0';

    // Remove all equipped stats
    for (let i = 1; i <= 10; i++) {
        const statElem = document.getElementById(`equipped-stat-${i}`);
        if (statElem) statElem.remove();
    }
    setEquippedStatCount(0);

    saveToLocalStorage();
    calculate();
}

export function equipItem(itemId) {
    // Check if there's already an equipped item
    const currentEquipped = getItemStats('equipped');
    if (currentEquipped.attack !== 0 || currentEquipped.mainStat !== 0 ||
        currentEquipped.defense !== 0 || currentEquipped.critRate !== 0 ||
        currentEquipped.critDamage !== 0 || currentEquipped.skillLevel !== 0) {
        if (!confirm('This will replace your currently equipped item. Continue?')) {
            return;
        }
        // Unequip current item first
        unequipItem();
    }

    // Get comparison item data
    const comparisonItem = getItemStats(`item-${itemId}`);

    // Add comparison item stats to base stats
    const weaponMultiplier = 1 + (getWeaponAttackBonus() / 100);

    const attackBase = document.getElementById('attack-base');
    attackBase.value = Math.floor(parseFloat(attackBase.value) + (comparisonItem.attack * weaponMultiplier));

    const statDamageBase = document.getElementById('stat-damage-base');
    let statDamageChange = comparisonItem.mainStat / 100;
    // For Dark Knight: defense converts to main stat
    const currentClass = getSelectedClass();
    if (currentClass === 'dark-knight') {
        statDamageChange += (comparisonItem.defense * 0.127) / 100;
    }
    statDamageBase.value = (parseFloat(statDamageBase.value) + statDamageChange).toFixed(1);

    const critRateBase = document.getElementById('crit-rate-base');
    critRateBase.value = (parseFloat(critRateBase.value) + comparisonItem.critRate).toFixed(1);

    const critDamageBase = document.getElementById('crit-damage-base');
    critDamageBase.value = (parseFloat(critDamageBase.value) + comparisonItem.critDamage).toFixed(1);

    const skillCoeffBase = document.getElementById('skill-coeff-base');
    skillCoeffBase.value = (parseFloat(skillCoeffBase.value) + (comparisonItem.skillLevel * 0.3)).toFixed(1);

    const normalDamageBase = document.getElementById('normal-damage-base');
    normalDamageBase.value = (parseFloat(normalDamageBase.value) + comparisonItem.normalDamage).toFixed(1);

    const bossDamageBase = document.getElementById('boss-damage-base');
    bossDamageBase.value = (parseFloat(bossDamageBase.value) + comparisonItem.bossDamage).toFixed(1);

    const damageBase = document.getElementById('damage-base');
    damageBase.value = (parseFloat(damageBase.value) + comparisonItem.damage).toFixed(1);

    // Move to equipped item
    document.getElementById('equipped-name').value = comparisonItem.name || 'Equipped Item';
    document.getElementById('equipped-attack').value = comparisonItem.attack;

    // Add stats to equipped item
    const statMapping = [
        { type: 'main-stat', value: comparisonItem.mainStat },
        { type: 'defense', value: comparisonItem.defense },
        { type: 'crit-rate', value: comparisonItem.critRate },
        { type: 'crit-damage', value: comparisonItem.critDamage },
        { type: 'skill-level', value: comparisonItem.skillLevel },
        { type: 'normal-damage', value: comparisonItem.normalDamage },
        { type: 'boss-damage', value: comparisonItem.bossDamage },
        { type: 'damage', value: comparisonItem.damage }
    ];

    statMapping.forEach(stat => {
        if (stat.value !== 0) {
            addEquippedStat();
            document.getElementById(`equipped-stat-${equippedStatCount}-type`).value = stat.type;
            document.getElementById(`equipped-stat-${equippedStatCount}-value`).value = stat.value;
        }
    });

    // Remove comparison item
    removeComparisonItem(itemId);

    saveToLocalStorage();
    calculate();
}

export function addEquippedStat() {
    const container = document.getElementById('equipped-stats-container');

    // Find the next available stat ID (handles gaps from removed stats)
    let statId = 1;
    while (document.getElementById(`equipped-stat-${statId}`)) {
        statId++;
    }
    setEquippedStatCount(statId);

    const statDiv = document.createElement('div');
    statDiv.id = `equipped-stat-${equippedStatCount}`;
    statDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 80px auto; gap: 8px; margin-bottom: 6px; align-items: end;';

    let optionsHTML = '';
    availableStats.forEach(stat => {
        optionsHTML += `<option value="${stat.value}">${stat.label}</option>`;
    });

    statDiv.innerHTML = `
        <div class="input-group">
            <label style="font-size: 0.8em;">Stat</label>
            <select id="equipped-stat-${equippedStatCount}-type" onchange="saveToLocalStorage()">
                ${optionsHTML}
            </select>
        </div>
        <div class="input-group">
            <label style="font-size: 0.8em;">Value</label>
            <input type="number" step="0.1" id="equipped-stat-${equippedStatCount}-value" value="0" onchange="saveToLocalStorage()">
        </div>
        <button onclick="removeEquippedStat(${equippedStatCount})" class="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold transition-all" style="height: 38px;">✕</button>
    `;

    container.appendChild(statDiv);
    saveToLocalStorage();
}

export function removeEquippedStat(id) {
    const stat = document.getElementById(`equipped-stat-${id}`);
    if (stat) {
        stat.remove();
        saveToLocalStorage();
    }
}

export function initializeEquipmentSlots() {
    const slots = ['Head', 'Cape', 'Chest', 'Shoulders', 'Legs', 'Belt', 'Gloves', 'Boots', 'Ring', 'Neck', 'Eye Accessory'];
    const container = document.getElementById('equipment-slots-grid');
    if (!container) return;

    let html = '';
    slots.forEach((slotName) => {
        const slotId = slotName.toLowerCase().replace(/\s+/g, '-');
        html += `
            <div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.05)); border: 1px solid var(--accent-primary); border-radius: 12px; padding: 15px; box-shadow: 0 4px 16px var(--shadow); min-width: 0;">
                <div style="color: var(--accent-primary); font-weight: 600; font-size: 0.95em; margin-bottom: 12px;">${slotName}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; min-width: 0;">
                    <div class="input-group" style="min-width: 0;">
                        <label style="font-size: 0.75em;">Attack</label>
                        <input type="number" step="0.1" id="slot-${slotId}-attack" value="0" onchange="saveEquipmentSlots()" style="width: 100%; min-width: 0;">
                    </div>
                    <div class="input-group" style="min-width: 0;">
                        <label style="font-size: 0.75em;">Main Stat</label>
                        <input type="number" step="1" id="slot-${slotId}-main-stat" value="0" onchange="saveEquipmentSlots()" style="width: 100%; min-width: 0;">
                    </div>
                    <div class="input-group" style="min-width: 0;">
                        <label style="font-size: 0.75em;">Dmg Amp</label>
                        <input type="number" step="0.1" id="slot-${slotId}-damage-amp" value="0" onchange="saveEquipmentSlots()" style="width: 100%; min-width: 0;">
                    </div>
                </div>
                <div style="background: rgba(79, 195, 247, 0.1); border-radius: 8px; padding: 10px;">
                    <div style="color: var(--text-secondary); font-size: 0.75em; margin-bottom: 6px; font-weight: 500;">DPS Gain %</div>
                    <div style="color: var(--accent-primary); font-size: 1.1em; font-weight: 600;">
                        <span id="slot-${slotId}-dps">0%</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Attach save listeners
    setTimeout(() => {
        slots.forEach(slot => {
            const slotId = slot.toLowerCase().replace(/\s+/g, '-');
            const attackInput = document.getElementById(`slot-${slotId}-attack`);
            const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
            const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

            if (attackInput) attackInput.addEventListener('input', saveEquipmentSlots);
            if (mainStatInput) mainStatInput.addEventListener('input', saveEquipmentSlots);
            if (damageAmpInput) damageAmpInput.addEventListener('input', saveEquipmentSlots);
        });
    }, 0);
}


export function saveEquipmentSlots() {
    const slots = {};
    const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];

    slotNames.forEach(slotId => {
        const attackInput = document.getElementById(`slot-${slotId}-attack`);
        const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
        const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

        slots[slotId] = {
            attack: attackInput ? parseFloat(attackInput.value) || 0 : 0,
            mainStat: mainStatInput ? parseFloat(mainStatInput.value) || 0 : 0,
            damageAmp: damageAmpInput ? parseFloat(damageAmpInput.value) || 0 : 0
        };
    });

    localStorage.setItem('equipmentSlots', JSON.stringify(slots));
}


export function loadEquipmentSlots() {
    const saved = localStorage.getItem('equipmentSlots');
    if (!saved) return;

    try {
        const slots = JSON.parse(saved);
        const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck', 'eye-accessory'];

        slotNames.forEach(slotId => {
            if (slots[slotId]) {
                const attackInput = document.getElementById(`slot-${slotId}-attack`);
                const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
                const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

                if (attackInput) attackInput.value = slots[slotId].attack || 0;
                if (mainStatInput) mainStatInput.value = slots[slotId].mainStat || 0;
                if (damageAmpInput) damageAmpInput.value = slots[slotId].damageAmp || 0;
            }
        });
    } catch (error) {
        console.error('Failed to load equipment slots:', error);
    }
}

