// Comparison items UI functionality
import { saveToLocalStorage } from '../core/storage.js';
import { comparisonItemCount, setComparisonItemCount, availableStats } from '../core/constants.js';
import { calculate } from '../core/main.js';

// Track active comparison item
let activeComparisonItemId = null;

// Update item name in tab when name input changes
export function updateComparisonItemTabName(itemId) {
    const nameInput = document.getElementById(`item-${itemId}-name`);
    const tabButton = document.getElementById(`comparison-tab-${itemId}`);
    if (nameInput && tabButton) {
        const nameSpan = tabButton.querySelector('.tab-item-name');
        if (nameSpan) {
            nameSpan.textContent = nameInput.value || `Item ${itemId}`;
        }
    }
    saveToLocalStorage();
}
window.updateComparisonItemTabName = updateComparisonItemTabName;

// Switch to a specific comparison item tab
export function switchComparisonItemTab(itemId) {
    // Hide all comparison items
    const allItems = document.querySelectorAll('[id^="comparison-item-"]');
    allItems.forEach(item => {
        item.style.display = 'none';
    });

    // Remove active class from all tabs
    const allTabs = document.querySelectorAll('[id^="comparison-tab-"]');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected item
    const selectedItem = document.getElementById(`comparison-item-${itemId}`);
    if (selectedItem) {
        selectedItem.style.display = 'block';
        activeComparisonItemId = itemId;
    }

    // Activate selected tab
    const selectedTab = document.getElementById(`comparison-tab-${itemId}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}
window.switchComparisonItemTab = switchComparisonItemTab;

export function addComparisonItem() {
    setComparisonItemCount(comparisonItemCount + 1);
    const itemId = comparisonItemCount;
    const container = document.getElementById('comparison-items-container');
    const tabsContainer = document.getElementById('comparison-tabs-container');

    // Create tab button
    const tabButton = document.createElement('button');
    tabButton.id = `comparison-tab-${itemId}`;
    tabButton.className = 'tab-button px-6 py-3 text-base font-semibold cursor-pointer transition-all duration-300 border-b-[3px] border-transparent -mb-0.5 rounded-t-lg';
    tabButton.onclick = () => switchComparisonItemTab(itemId);
    tabButton.innerHTML = `
        <span class="tab-item-name">Item ${itemId}</span>
        <button onclick="event.stopPropagation(); removeComparisonItem(${itemId})" class="ml-2 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-500 font-bold">✕</button>
    `;

    // Insert tab before "+ Add Item" button
    const addButton = tabsContainer.querySelector('button[onclick="addComparisonItem()"]');
    tabsContainer.insertBefore(tabButton, addButton);

    // Create item content
    const itemDiv = document.createElement('div');
    itemDiv.id = `comparison-item-${itemId}`;
    itemDiv.style.display = 'none'; // Hidden by default
    itemDiv.innerHTML = `
        <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-500 dark:border-blue-400 rounded-xl p-4 shadow-lg">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                <div class="input-group">
                    <label>Name</label>
                    <input type="text" id="item-${itemId}-name" value="Item ${itemId}" onchange="updateComparisonItemTabName(${itemId})">
                </div>
                <div class="input-group">
                    <label>Attack</label>
                    <input type="number" id="item-${itemId}-attack" value="0" onchange="saveToLocalStorage()">
                </div>
            </div>
            <div id="item-${itemId}-stats-container"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <button onclick="addComparisonItemStat(${itemId})" class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg transition-all">+ Add Stat</button>
                <button onclick="equipItem(${itemId})" class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2.5 rounded-lg cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg transition-all">Equip</button>
            </div>
        </div>
    `;

    container.appendChild(itemDiv);

    // Auto-switch to the newly created item
    switchComparisonItemTab(itemId);

    saveToLocalStorage();
}
window.addComparisonItem = addComparisonItem;

export function removeComparisonItem(id) {
    const item = document.getElementById(`comparison-item-${id}`);
    const tab = document.getElementById(`comparison-tab-${id}`);

    if (item && tab) {
        // Remove the item content and tab
        item.remove();
        tab.remove();

        // If we removed the active item, switch to another item
        if (activeComparisonItemId === id) {
            // Find remaining tabs
            const remainingTabs = document.querySelectorAll('[id^="comparison-tab-"]');

            if (remainingTabs.length > 0) {
                // Switch to the first remaining tab
                const firstTabId = remainingTabs[0].id.replace('comparison-tab-', '');
                switchComparisonItemTab(parseInt(firstTabId));
            } else {
                // No items left
                activeComparisonItemId = null;
            }
        }

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
