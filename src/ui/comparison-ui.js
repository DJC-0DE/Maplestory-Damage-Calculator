// Comparison items UI functionality
import { saveToLocalStorage } from '../core/storage.js';
import { comparisonItemCount, setComparisonItemCount, availableStats } from '../core/constants.js';
import { calculate } from '../core/main.js';

export function addComparisonItem() {
    setComparisonItemCount(comparisonItemCount + 1);
    const container = document.getElementById('comparison-items-container');

    const itemDiv = document.createElement('div');
    itemDiv.id = `comparison-item-${comparisonItemCount}`;
    itemDiv.style.marginBottom = '12px';
    itemDiv.innerHTML = `
        <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-500 dark:border-blue-400 rounded-xl p-4 shadow-lg">
            <div class="flex justify-between items-center mb-2.5">
                <span class="text-blue-600 dark:text-blue-400 font-semibold text-base">Item #${comparisonItemCount}</span>
                <button onclick="removeComparisonItem(${comparisonItemCount})" class="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg cursor-pointer text-sm font-semibold transition-all">✕</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                <div class="input-group">
                    <label>Name</label>
                    <input type="text" id="item-${comparisonItemCount}-name" value="Item ${comparisonItemCount}" onchange="saveToLocalStorage()">
                </div>
                <div class="input-group">
                    <label>Attack</label>
                    <input type="number" id="item-${comparisonItemCount}-attack" value="0" onchange="saveToLocalStorage()">
                </div>
            </div>
            <div id="item-${comparisonItemCount}-stats-container"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <button onclick="addComparisonItemStat(${comparisonItemCount})" class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg transition-all">+ Add Stat</button>
                <button onclick="equipItem(${comparisonItemCount})" class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2.5 rounded-lg cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg transition-all">Equip</button>
            </div>
        </div>
    `;

    container.appendChild(itemDiv);
    saveToLocalStorage();
}
window.addComparisonItem = addComparisonItem;

export function removeComparisonItem(id) {
    const item = document.getElementById(`comparison-item-${id}`);
    if (item) {
        item.remove();
        saveToLocalStorage();
        calculate();
    }
}
window.removeComparisonItem = removeComparisonItem;

export function addComparisonItemStat(itemId) {
    const container = document.getElementById(`item-${itemId}-stats-container`);
    const currentStats = container.children.length;

    if (currentStats >= 6) {
        alert('Maximum 6 optional stats allowed');
        return;
    }

    // Find the next available stat ID (handles gaps from removed stats)
    let statId = 1;
    while (document.getElementById(`item-${itemId}-stat-${statId}`)) {
        statId++;
    }
    const statDiv = document.createElement('div');
    statDiv.id = `item-${itemId}-stat-${statId}`;
    statDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 80px auto; gap: 6px; margin-bottom: 6px; align-items: end;';

    let optionsHTML = '';
    availableStats.forEach(stat => {
        optionsHTML += `<option value="${stat.value}">${stat.label}</option>`;
    });

    statDiv.innerHTML = `
        <div class="input-group">
            <label style="font-size: 0.8em;">Stat</label>
            <select id="item-${itemId}-stat-${statId}-type" onchange="saveToLocalStorage()">
                ${optionsHTML}
            </select>
        </div>
        <div class="input-group">
            <label style="font-size: 0.8em;">Value</label>
            <input type="number" step="0.1" id="item-${itemId}-stat-${statId}-value" value="0" onchange="saveToLocalStorage()">
        </div>
        <button onclick="removeComparisonItemStat(${itemId}, ${statId})" class="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold transition-all" style="height: 38px;">✕</button>
    `;

    container.appendChild(statDiv);
    saveToLocalStorage();
}
window.addComparisonItemStat = addComparisonItemStat;

export function removeComparisonItemStat(itemId, statId) {
    const stat = document.getElementById(`item-${itemId}-stat-${statId}`);
    if (stat) {
        stat.remove();
        saveToLocalStorage();
    }
}
window.removeComparisonItemStat = removeComparisonItemStat;
