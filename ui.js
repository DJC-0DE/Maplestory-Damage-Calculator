import { rarities, tiers, comparisonItemCount, equippedStatCount, setComparisonItemCount, setEquippedStatCount, weaponBaseAttackEquipped, rarityColors, availableStats } from './constants.js';
import { calculateWeaponAttacks, getMaxLevelForStars, getUpgradeCost, calculateUpgradeGain, calculateInventoryBonus, formatNumber, calculateDamage, calculateStatWeights } from './calculations.js';
import { saveToLocalStorage } from './storage.js';
import { innerAbilityStats } from './inner-ability-data.js';
import { getSelectedClass } from './main.js';

// Tab switching function
export function switchTab(group, tabName) {
    // Get all tab contents and buttons within the group
    const tabContents = document.querySelectorAll(`#${group}-${tabName}`).length > 0
        ? document.querySelectorAll(`[id^="${group}-"]`)
        : [];
    const tabButtons = event.currentTarget.parentElement.querySelectorAll('.tab-button');

    // Hide all tab contents in this group
    tabContents.forEach(content => {
        if (content.classList.contains('tab-content')) {
            content.classList.remove('active');
        }
    });

    // Remove active class from all buttons in this group
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Show the selected tab content
    const selectedTab = document.getElementById(`${group}-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    event.currentTarget.classList.add('active');

    // Render content for specific tabs
    if (group === 'analysis' && tabName === 'artifact-potential') {
        renderArtifactPotential();
    }
}

// Theme toggle functions
export function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const isDark = html.classList.contains('dark');

    if (isDark) {
        html.classList.remove('dark');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }

    // Re-initialize weapons to update Normal rarity color based on theme
    const savedData = localStorage.getItem('damageCalculatorData');
    initializeWeapons();

    // Restore weapon values after re-initialization
    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.weapons) {
            rarities.forEach(rarity => {
                tiers.forEach(tier => {
                    const key = `${rarity}-${tier}`;
                    const weaponData = data.weapons[key];

                    if (weaponData) {
                        const levelInput = document.getElementById(`level-${rarity}-${tier}`);
                        const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
                        const equippedCheckbox = document.getElementById(`equipped-checkbox-${rarity}-${tier}`);

                        if (starsInput) {
                            const defaultStars = ['legendary', 'mystic', 'ancient'].includes(rarity) ? 1 : 5;
                            const stars = weaponData.stars !== undefined ? weaponData.stars : defaultStars;
                            starsInput.value = stars;

                            // Update star display (1-5 stars)
                            for (let i = 1; i <= 5; i++) {
                                const starElem = document.getElementById(`star-${rarity}-${tier}-${i}`);
                                if (starElem) {
                                    starElem.style.opacity = i <= stars ? '1' : '0.3';
                                }
                            }
                        }

                        if (levelInput) {
                            levelInput.value = weaponData.level || '0';
                            handleWeaponLevelChange(rarity, tier);
                        }

                        // Restore equipped state
                        if (equippedCheckbox && weaponData.equipped) {
                            equippedCheckbox.checked = true;
                            handleEquippedCheckboxChange(rarity, tier);
                        }
                    }
                });
            });
            updateWeaponBonuses();
            updateEquippedWeaponIndicator();
        }
    }
}

export function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');

    if (savedTheme === 'dark') {
        html.classList.add('dark');
        if (themeToggle) themeToggle.textContent = '☀️';
    } else {
        html.classList.remove('dark');
        if (themeToggle) themeToggle.textContent = '🌙';
    }
}

// Equip/Unequip functionality
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

// Equipped item stat management
export function addEquippedStat() {
    const container = document.getElementById('equipped-stats-container');
    const currentStats = container.children.length;

    if (currentStats >= 3) {
        alert('Maximum 3 optional stats allowed');
        return;
    }

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

// Comparison item management
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

export function removeComparisonItem(id) {
    const item = document.getElementById(`comparison-item-${id}`);
    if (item) {
        item.remove();
        saveToLocalStorage();
        calculate();
    }
}

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

export function removeComparisonItemStat(itemId, statId) {
    const stat = document.getElementById(`item-${itemId}-stat-${statId}`);
    if (stat) {
        stat.remove();
        saveToLocalStorage();
    }
}

// Weapon initialization and management
export function initializeWeapons() {
    const weaponsGrid = document.getElementById('weapons-grid');
    let html = '';

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const baseAtk = weaponBaseAttackEquipped[rarity]?.[tier];
            const rarityCapitalized = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            let rarityColor = rarityColors[rarityCapitalized] || '#ffffff';

            // For Normal rarity, use dark grey in light theme and white in dark theme
            if (rarityCapitalized === 'Normal') {
                const isDark = document.documentElement.classList.contains('dark');
                rarityColor = isDark ? '#ffffff' : '#2a2a2a';
            }

            // Ancient T4 is enabled, T3/T2/T1 are disabled
            const isDisabled = rarity === 'ancient' && tier !== 't4';

            if (baseAtk === null || baseAtk === undefined || isDisabled) {
                html += `<div class="weapon-card" style="opacity: 0.4;">
                    <div class="weapon-header" style="color: ${rarityColor};">${tier.toUpperCase()} ${rarityCapitalized}</div>
                    <div style="text-align: center; color: var(--text-secondary); font-size: 0.8em; padding: 15px 0;">No data</div>
                </div>`;
            } else {
                // Default stars: 5 for normal/rare/epic/unique, 1 for legendary/mystic/ancient
                const defaultStars = ['legendary', 'mystic', 'ancient'].includes(rarity) ? 1 : 5;

                html += `<div class="weapon-card" id="weapon-${rarity}-${tier}">
                    <!-- Equipped Checkbox in top right -->
                    <div style="position: absolute; top: 8px; right: 8px;">
                        <input type="checkbox" id="equipped-checkbox-${rarity}-${tier}"
                               style="display: none;"
                               onchange="handleEquippedCheckboxChange('${rarity}', '${tier}')">
                        <label for="equipped-checkbox-${rarity}-${tier}"
                               style="cursor: pointer; display: flex; align-items: center; justify-content: center;
                                      width: 24px; height: 24px; border: 2px solid var(--border-color);
                                      border-radius: 4px; background: var(--background);
                                      font-weight: bold; font-size: 0.9em; color: var(--text-secondary);
                                      transition: all 0.2s;"
                               id="equipped-label-${rarity}-${tier}">E</label>
                    </div>

                    <div class="weapon-header" style="color: ${rarityColor};">${tier.toUpperCase()} ${rarityCapitalized}</div>

                    <!-- Star Rating -->
                    <div style="display: flex; gap: 4px; justify-content: center; margin: 8px 0;">`;

                for (let i = 1; i <= 5; i++) {
                    html += `<span onclick="setWeaponStars('${rarity}', '${tier}', ${i})"
                                   onmouseenter="previewStars('${rarity}', '${tier}', ${i})"
                                   onmouseleave="resetStarPreview('${rarity}', '${tier}')"
                                   id="star-${rarity}-${tier}-${i}"
                                   style="cursor: pointer; font-size: 1.1em; transition: all 0.2s; opacity: ${i <= defaultStars ? 1 : 0.3};">⭐</span>`;
                }

                html += `</div>
                    <input type="hidden" id="stars-${rarity}-${tier}" value="${defaultStars}">

                    <div class="input-group" style="margin-bottom: 8px;">
                        <label style="margin-bottom: 4px;">Level:</label>
                        <input type="number" min="0" max="200" class="weapon-input" id="level-${rarity}-${tier}"
                               placeholder="0-200" value="0" oninput="handleWeaponLevelChange('${rarity}', '${tier}')">
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 8px;">
                        <span id="inventory-display-${rarity}-${tier}">0.0% inventory attack</span>
                    </div>
                    <div id="upgrade-gain-container-${rarity}-${tier}" style="font-size: 0.8em; margin-bottom: 8px; display: none;">
                        <span id="upgrade-gain-${rarity}-${tier}"></span>
                    </div>
                    <div id="equipped-display-${rarity}-${tier}" style="display: none; margin-top: 8px;">
                        <div style="color: var(--text-secondary); font-size: 0.85em;">
                            Equipped: <span id="equipped-value-${rarity}-${tier}">0.0%</span>
                        </div>
                    </div>
                </div>`;
            }
        });
    });

    weaponsGrid.innerHTML = html;

    // Attach save listeners to weapon level and star inputs (after they're created)
    setTimeout(() => {
        rarities.forEach(rarity => {
            tiers.forEach(tier => {
                const levelInput = document.getElementById(`level-${rarity}-${tier}`);
                const starsInput = document.getElementById(`stars-${rarity}-${tier}`);

                if (levelInput) {
                    levelInput.addEventListener('input', saveToLocalStorage);
                }
                if (starsInput) {
                    starsInput.addEventListener('change', saveToLocalStorage);
                }
            });
        });
    }, 0);
}

export function setWeaponStars(rarity, tier, stars) {
    const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
    if (!starsInput) return;

    // Toggle behavior: if clicking the same star, set to 0, otherwise set to clicked star
    const currentStars = parseInt(starsInput.value) || 0;
    const newStars = (currentStars === stars) ? 0 : stars;
    starsInput.value = newStars;

    // Update star display (1-5 stars)
    for (let i = 1; i <= 5; i++) {
        const starElem = document.getElementById(`star-${rarity}-${tier}-${i}`);
        if (starElem) {
            starElem.style.opacity = i <= newStars ? '1' : '0.3';
        }
    }

    // Trigger level change to recalculate and enforce max level
    handleWeaponLevelChange(rarity, tier);
    saveToLocalStorage();
}

export function previewStars(rarity, tier, stars) {
    // Temporarily show what the stars would look like if this star is clicked
    for (let i = 1; i <= 5; i++) {
        const starElem = document.getElementById(`star-${rarity}-${tier}-${i}`);
        if (starElem) {
            starElem.style.opacity = i <= stars ? '1' : '0.3';
        }
    }
}

export function resetStarPreview(rarity, tier) {
    // Reset stars to their actual stored value
    const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
    if (!starsInput) return;

    const currentStars = parseInt(starsInput.value) || 0;
    for (let i = 1; i <= 5; i++) {
        const starElem = document.getElementById(`star-${rarity}-${tier}-${i}`);
        if (starElem) {
            starElem.style.opacity = i <= currentStars ? '1' : '0.3';
        }
    }
}

export function handleEquippedCheckboxChange(rarity, tier) {
    const checkbox = document.getElementById(`equipped-checkbox-${rarity}-${tier}`);
    const label = document.getElementById(`equipped-label-${rarity}-${tier}`);
    const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
    const card = document.getElementById(`weapon-${rarity}-${tier}`);

    if (checkbox.checked) {
        // Uncheck all other equipped checkboxes
        rarities.forEach(r => {
            tiers.forEach(t => {
                if (r !== rarity || t !== tier) {
                    const otherCheckbox = document.getElementById(`equipped-checkbox-${r}-${t}`);
                    const otherLabel = document.getElementById(`equipped-label-${r}-${t}`);
                    const otherDisplay = document.getElementById(`equipped-display-${r}-${t}`);
                    const otherCard = document.getElementById(`weapon-${r}-${t}`);

                    if (otherCheckbox) otherCheckbox.checked = false;
                    if (otherLabel) {
                        otherLabel.style.background = 'var(--background)';
                        otherLabel.style.borderColor = 'var(--border-color)';
                        otherLabel.style.color = 'var(--text-secondary)';
                    }
                    if (otherDisplay) otherDisplay.style.display = 'none';
                    if (otherCard) otherCard.classList.remove('equipped');
                }
            });
        });

        // Calculate and display equipped attack
        const levelInput = document.getElementById(`level-${rarity}-${tier}`);
        const level = parseInt(levelInput.value) || 0;
        const { equippedAttack } = calculateWeaponAttacks(rarity, tier, level);

        const equippedValue = document.getElementById(`equipped-value-${rarity}-${tier}`);
        if (equippedValue) {
            equippedValue.textContent = `${equippedAttack.toFixed(1)}%`;
        }

        if (equippedDisplay) equippedDisplay.style.display = 'block';
        if (card) card.classList.add('equipped');

        // Style the checkbox label
        if (label) {
            label.style.background = 'var(--accent-primary)';
            label.style.borderColor = 'var(--accent-primary)';
            label.style.color = '#ffffff';
        }
    } else {
        if (equippedDisplay) equippedDisplay.style.display = 'none';
        if (card) card.classList.remove('equipped');

        // Reset the checkbox label style
        if (label) {
            label.style.background = 'var(--background)';
            label.style.borderColor = 'var(--border-color)';
            label.style.color = 'var(--text-secondary)';
        }
    }

    saveToLocalStorage();
    updateWeaponBonuses();
    updateEquippedWeaponIndicator();
}

export function updateWeaponUpgradeColors() {
    // Collect all gainPer1k values
    const gainValues = [];
    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const upgradeGainDisplay = document.getElementById(`upgrade-gain-${rarity}-${tier}`);
            if (upgradeGainDisplay && upgradeGainDisplay.dataset.gainPer1k) {
                const gainPer1k = parseFloat(upgradeGainDisplay.dataset.gainPer1k);
                if (!isNaN(gainPer1k) && gainPer1k > 0) {
                    gainValues.push(gainPer1k);
                }
            }
        });
    });

    if (gainValues.length === 0) return;

    // Find min and max
    const minGain = Math.min(...gainValues);
    const maxGain = Math.max(...gainValues);

    // Apply colors to each upgrade display
    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const upgradeGainDisplay = document.getElementById(`upgrade-gain-${rarity}-${tier}`);
            if (upgradeGainDisplay && upgradeGainDisplay.dataset.gainPer1k) {
                const gainPer1k = parseFloat(upgradeGainDisplay.dataset.gainPer1k);
                if (!isNaN(gainPer1k) && gainPer1k > 0) {
                    // Normalize value between 0 (min) and 1 (max)
                    const normalized = maxGain === minGain ? 1 : (gainPer1k - minGain) / (maxGain - minGain);

                    // Color from deep forest green (low) to vibrant green (high)
                    // Deep forest green: rgb(34, 139, 34) or #228B22
                    // Vibrant green: rgb(16, 185, 129) or #10b981
                    const r = Math.round(34 + (16 - 34) * normalized);
                    const g = Math.round(139 + (185 - 139) * normalized);
                    const b = Math.round(34 + (129 - 34) * normalized);

                    upgradeGainDisplay.style.color = `rgb(${r}, ${g}, ${b})`;
                }
            }
        });
    });
}

export function handleWeaponLevelChange(rarity, tier) {
    const levelInput = document.getElementById(`level-${rarity}-${tier}`);
    const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
    const level = parseInt(levelInput.value) || 0;
    const stars = starsInput?.value !== undefined && starsInput?.value !== ''
        ? parseInt(starsInput.value)
        : 5;

    // Enforce max level based on stars
    const maxLevel = getMaxLevelForStars(stars);
    levelInput.setAttribute('max', maxLevel);
    if (level > maxLevel) {
        levelInput.value = maxLevel;
        return handleWeaponLevelChange(rarity, tier);
    }

    // Calculate inventory and equipped attack percentages
    const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(rarity, tier, level);

    // Update inventory display
    const inventoryDisplay = document.getElementById(`inventory-display-${rarity}-${tier}`);
    if (inventoryDisplay) {
        inventoryDisplay.textContent = `${inventoryAttack.toFixed(1)}% inventory attack`;
    }

    // Show/hide upgrade gain display based on whether at max level
    const upgradeGainContainer = document.getElementById(`upgrade-gain-container-${rarity}-${tier}`);
    const upgradeGainDisplay = document.getElementById(`upgrade-gain-${rarity}-${tier}`);

    if (level < maxLevel && level > 0) {
        // Calculate multi-level efficiency (what you actually get per 1k shards)
        const upgradeGain = calculateUpgradeGain(rarity, tier, level, stars, 1000);

        if (upgradeGainDisplay && upgradeGain.attackGain > 0) {
            let gainPer1k;

            if (upgradeGain.isUnaffordable) {
                // Next level costs more than 1k - normalize to per 1k
                gainPer1k = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
                upgradeGainDisplay.textContent = `+${gainPer1k.toFixed(2)}% per 1k shards (next level costs ${upgradeGain.singleLevelCost} shards)`;
            } else {
                // Can afford levels with 1k shards
                gainPer1k = upgradeGain.attackGain;
                upgradeGainDisplay.textContent = `+${gainPer1k.toFixed(2)}% per 1k shards (${upgradeGain.levelsGained} levels)`;
            }

            // Store gainPer1k for color coding
            upgradeGainDisplay.dataset.gainPer1k = gainPer1k;

            if (upgradeGainContainer) {
                upgradeGainContainer.style.display = 'block';
            }
        } else {
            // Hide if no gain or can't calculate
            if (upgradeGainContainer) {
                upgradeGainContainer.style.display = 'none';
            }
        }
    } else {
        if (upgradeGainContainer) {
            upgradeGainContainer.style.display = 'none';
        }
        if (upgradeGainDisplay) {
            delete upgradeGainDisplay.dataset.gainPer1k;
        }
    }

    // Update equipped display if this weapon is currently shown as equipped
    const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
    if (equippedDisplay && equippedDisplay.style.display !== 'none') {
        const equippedValue = document.getElementById(`equipped-value-${rarity}-${tier}`);
        if (equippedValue) {
            equippedValue.textContent = `${equippedAttack.toFixed(1)}%`;
        }
    }

    // Update totals and recalculate damage
    updateWeaponBonuses();
    updateEquippedWeaponIndicator();
    updateWeaponUpgradeColors();
}

export function updateEquippedWeaponIndicator() {
    // Check if any weapon is equipped
    let hasEquipped = false;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
            if (equippedDisplay && equippedDisplay.style.display !== 'none') {
                hasEquipped = true;
            }
        });
    });

    // Show/hide the indicator
    const indicator = document.getElementById('no-weapon-equipped-indicator');
    if (indicator) {
        indicator.style.display = hasEquipped ? 'none' : 'block';
    }
}

export function updateWeaponBonuses() {
    let totalInventory = 0;
    let equippedBonus = 0;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
            const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);

            if (levelInput) {
                const level = parseInt(levelInput.value) || 0;
                const stars = starsInput?.value !== undefined && starsInput?.value !== ''
                    ? parseInt(starsInput.value)
                    : 5;
                const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(rarity, tier, level);

                totalInventory += inventoryAttack;

                // Check if equipped based on display visibility
                if (equippedDisplay && equippedDisplay.style.display !== 'none') {
                    equippedBonus = equippedAttack;
                }
            }
        });
    });

    document.getElementById('total-inventory-attack').textContent = totalInventory.toFixed(1) + '%';
    document.getElementById('equipped-weapon-attack-pct').textContent = equippedBonus.toFixed(1) + '%';
    document.getElementById('total-weapon-attack').textContent = (totalInventory + equippedBonus).toFixed(1) + '%';

    // Save to localStorage
    saveToLocalStorage();

    // Recalculate damage
    calculate();

    // Update upgrade priority chain
    updateUpgradePriorityChain();
}

export function updateUpgradePriorityChain() {
    const priorityChain = document.getElementById('upgrade-priority-chain');
    if (!priorityChain) return;

    // Collect current weapon states
    const weaponStates = [];
    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
            if (levelInput) {
                const level = parseInt(levelInput.value) || 0;
                const stars = starsInput?.value !== undefined && starsInput?.value !== ''
                    ? parseInt(starsInput.value)
                    : 5;
                const maxLevel = getMaxLevelForStars(stars);

                // Only include weapons that can be upgraded (level > 0 and not at max)
                if (level > 0 && level < maxLevel) {
                    weaponStates.push({
                        rarity,
                        tier,
                        level,
                        stars,
                        maxLevel
                    });
                }
            }
        });
    });

    if (weaponStates.length === 0) {
        priorityChain.innerHTML = '<span style="color: var(--text-secondary);">No weapons available to upgrade</span>';
        return;
    }

    // Simulate 100 upgrades
    const upgradeSequence = [];
    const weaponLevels = {};
    const weaponMaxLevels = {};

    // Initialize current levels and max levels
    weaponStates.forEach(ws => {
        const key = `${ws.rarity}-${ws.tier}`;
        weaponLevels[key] = ws.level;
        weaponMaxLevels[key] = ws.maxLevel;
    });

    for (let i = 0; i < 100; i++) {
        let bestWeapon = null;
        let bestEfficiency = 0;

        // Recalculate efficiency for ALL weapons at their current levels
        weaponStates.forEach(ws => {
            const key = `${ws.rarity}-${ws.tier}`;
            const currentLevel = weaponLevels[key];
            const maxLevel = weaponMaxLevels[key];

            // Skip if at max level
            if (currentLevel >= maxLevel) return;

            // Calculate multi-level efficiency (what 1k shards gets you from current level)
            const upgradeGain = calculateUpgradeGain(ws.rarity, ws.tier, currentLevel, ws.stars, 1000);

            let efficiency;
            if (upgradeGain.isUnaffordable) {
                // Normalize to per 1k when single level costs more than 1k
                efficiency = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
            } else {
                efficiency = upgradeGain.attackGain; // Already per 1k
            }

            if (efficiency > bestEfficiency) {
                bestEfficiency = efficiency;
                bestWeapon = { rarity: ws.rarity, tier: ws.tier, key };
            }
        });

        // If no weapon can be upgraded, stop
        if (!bestWeapon) break;

        // Record this upgrade and increment by 1 level only (for granular priority display)
        upgradeSequence.push(bestWeapon);
        weaponLevels[bestWeapon.key]++;
    }

    // Group consecutive upgrades to the same weapon
    const groupedUpgrades = [];
    let currentGroup = null;

    upgradeSequence.forEach(upgrade => {
        if (!currentGroup || currentGroup.rarity !== upgrade.rarity || currentGroup.tier !== upgrade.tier) {
            if (currentGroup) {
                groupedUpgrades.push(currentGroup);
            }
            currentGroup = {
                rarity: upgrade.rarity,
                tier: upgrade.tier,
                count: 1
            };
        } else {
            currentGroup.count++;
        }
    });

    if (currentGroup) {
        groupedUpgrades.push(currentGroup);
    }

    // Build HTML for display
    let html = '';
    groupedUpgrades.forEach((group, index) => {
        const rarityColor = rarityColors[group.rarity.charAt(0).toUpperCase() + group.rarity.slice(1)];
        const tierUpper = group.tier.toUpperCase();
        const rarityFirstLetter = group.rarity.charAt(0).toUpperCase();

        html += `<span style="color: ${rarityColor}; font-weight: 600;">${tierUpper} ${rarityFirstLetter} x${group.count}</span>`;

        if (index < groupedUpgrades.length - 1) {
            html += ' <span style="color: var(--text-secondary);">→</span> ';
        }
    });

    priorityChain.innerHTML = html;
}

export function calculateCurrencyUpgrades() {
    const currencyInput = document.getElementById('upgrade-currency-input');
    const resultsDiv = document.getElementById('currency-upgrade-results');
    const attackGainDisplay = document.getElementById('currency-attack-gain');
    const dpsGainDisplay = document.getElementById('currency-dps-gain');
    const pathDisplay = document.getElementById('currency-upgrade-path');

    if (!currencyInput || !resultsDiv) return;

    const currency = parseFloat(currencyInput.value) || 0;

    if (currency <= 0) {
        resultsDiv.style.display = 'none';
        return;
    }

    // Collect current weapon states
    const weaponStates = [];
    const initialWeaponLevels = {};
    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
            if (levelInput) {
                const level = parseInt(levelInput.value) || 0;
                const stars = starsInput?.value !== undefined && starsInput?.value !== ''
                    ? parseInt(starsInput.value)
                    : 5;
                const maxLevel = getMaxLevelForStars(stars);
                const key = `${rarity}-${tier}`;
                initialWeaponLevels[key] = level;

                if (level > 0 && level < maxLevel) {
                    weaponStates.push({
                        rarity,
                        tier,
                        level,
                        stars,
                        maxLevel
                    });
                }
            }
        });
    });

    if (weaponStates.length === 0) {
        resultsDiv.style.display = 'none';
        return;
    }

    // Calculate initial DPS
    const baseStats = getStats('base');
    const initialDPS = calculateDamage(baseStats, 'boss').dps;

    // Simulate spending currency
    const upgradeSequence = [];
    const weaponLevels = {};
    const weaponMaxLevels = {};
    let remainingCurrency = currency;
    let totalAttackGain = 0;

    // Initialize current levels and max levels
    weaponStates.forEach(ws => {
        const key = `${ws.rarity}-${ws.tier}`;
        weaponLevels[key] = ws.level;
        weaponMaxLevels[key] = ws.maxLevel;
    });

    // Keep upgrading until we run out of currency (same logic as priority chain)
    while (remainingCurrency > 0) {
        let bestWeapon = null;
        let bestEfficiency = 0;

        // Find the most efficient upgrade based on 1k shard potential (same as priority chain)
        weaponStates.forEach(ws => {
            const key = `${ws.rarity}-${ws.tier}`;
            const currentLevel = weaponLevels[key];
            const maxLevel = weaponMaxLevels[key];

            if (currentLevel >= maxLevel) return;

            // Calculate multi-level efficiency (what 1k shards gets you from current level)
            const upgradeGain = calculateUpgradeGain(ws.rarity, ws.tier, currentLevel, ws.stars, 1000);

            let efficiency;
            if (upgradeGain.isUnaffordable) {
                // Normalize to per 1k when single level costs more than 1k
                efficiency = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
            } else {
                efficiency = upgradeGain.attackGain; // Already per 1k
            }

            if (efficiency > bestEfficiency) {
                bestEfficiency = efficiency;
                bestWeapon = {
                    rarity: ws.rarity,
                    tier: ws.tier,
                    key,
                    cost: getUpgradeCost(ws.rarity, ws.tier, currentLevel)
                };
            }
        });

        // If no weapon can be upgraded, stop
        if (!bestWeapon) break;

        // Check if we can afford this upgrade
        if (bestWeapon.cost > remainingCurrency) break;

        // Calculate actual gain for this single level
        const currentAttack = calculateWeaponAttacks(bestWeapon.rarity, bestWeapon.tier, weaponLevels[bestWeapon.key]).inventoryAttack;
        const nextAttack = calculateWeaponAttacks(bestWeapon.rarity, bestWeapon.tier, weaponLevels[bestWeapon.key] + 1).inventoryAttack;
        const gain = nextAttack - currentAttack;

        // Apply this upgrade (1 level at a time, just like priority chain)
        upgradeSequence.push(bestWeapon);
        weaponLevels[bestWeapon.key]++;
        remainingCurrency -= bestWeapon.cost;
        totalAttackGain += gain;
    }

    if (upgradeSequence.length === 0) {
        resultsDiv.style.display = 'none';
        return;
    }

    // Calculate weapon attack bonus with simulated upgraded levels
    let newWeaponAttackBonus = 0;
    let equippedBonus = 0;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const key = `${rarity}-${tier}`;
            const newLevel = weaponLevels[key] || initialWeaponLevels[key] || 0;

            if (newLevel === 0) return;

            const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(rarity, tier, newLevel);
            newWeaponAttackBonus += inventoryAttack;

            // Check if this weapon is equipped
            const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
            if (equippedDisplay && equippedDisplay.style.display !== 'none') {
                equippedBonus = equippedAttack;
            }
        });
    });

    newWeaponAttackBonus += equippedBonus;

    // Calculate new DPS with new weapon attack bonus
    const newStats = { ...baseStats };
    const currentWeaponBonus = getWeaponAttackBonus();
    const weaponBonusDiff = newWeaponAttackBonus - currentWeaponBonus;

    // Apply the weapon attack bonus difference to attack
    // Weapon attack bonus is a % that multiplies base attack
    const baseAttackWithoutWeaponBonus = baseStats.attack / (1 + currentWeaponBonus / 100);
    newStats.attack = baseAttackWithoutWeaponBonus * (1 + newWeaponAttackBonus / 100);

    const newDPS = calculateDamage(newStats, 'boss').dps;
    const dpsGainPct = ((newDPS - initialDPS) / initialDPS * 100);

    // Collate all upgrades by weapon type (not just consecutive)
    const upgradeCounts = {};

    upgradeSequence.forEach(upgrade => {
        const key = `${upgrade.rarity}-${upgrade.tier}`;
        if (!upgradeCounts[key]) {
            upgradeCounts[key] = {
                rarity: upgrade.rarity,
                tier: upgrade.tier,
                count: 0
            };
        }
        upgradeCounts[key].count++;
    });

    // Convert to array and sort by count (descending) then by rarity/tier
    const collatedUpgrades = Object.values(upgradeCounts).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        // Secondary sort: by rarity index then tier
        const rarityOrder = { normal: 0, rare: 1, epic: 2, unique: 3, legendary: 4, mystic: 5, ancient: 6 };
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        const tierOrder = { t4: 0, t3: 1, t2: 2, t1: 3 };
        return tierOrder[a.tier] - tierOrder[b.tier];
    });

    // Build path HTML (horizontal list)
    let pathHTML = '';
    collatedUpgrades.forEach((group, index) => {
        const rarityColor = rarityColors[group.rarity.charAt(0).toUpperCase() + group.rarity.slice(1)];
        const tierUpper = group.tier.toUpperCase();
        const rarityFirstLetter = group.rarity.charAt(0).toUpperCase();
        const weaponKey = `${group.rarity}-${group.tier}`;
        pathHTML += `<span style="color: ${rarityColor}; font-weight: 600;">${tierUpper} ${rarityFirstLetter} x${group.count} (${weaponLevels[weaponKey]})</span>`;

        if (index < collatedUpgrades.length - 1) {
            pathHTML += ' <span style="color: var(--text-secondary);">,</span> ';
        }
    });

    // Display results
    attackGainDisplay.textContent = `+${totalAttackGain.toFixed(2)}%`;
    dpsGainDisplay.textContent = `+${dpsGainPct.toFixed(2)}%`;
    pathDisplay.innerHTML = pathHTML;
    resultsDiv.style.display = 'block';
    const applyUpgradesBtn = document.getElementById('apply-upgrade-path-btn');

    // update weapon levels after user has leveled weps accordingly
    applyUpgradesBtn.onclick = () => {
        for (const key in weaponLevels) {
            const levelInput = document.getElementById(`level-${key}`);
            levelInput.value = weaponLevels[key];
        }

        // reset currency input
        const currencyInput = document.getElementById('upgrade-currency-input');
        currencyInput.value = '0';

        // update/save stats
        calculateCurrencyUpgrades();
        saveToLocalStorage();
        updateWeaponBonuses();
    }
}

// Display functions
export function displayResults(itemName, stats, uniqueId, isEquipped = false, equippedDamageValues = null) {
    const bossResults = calculateDamage(stats, 'boss');
    const normalResults = calculateDamage(stats, 'normal');

    const borderColor = isEquipped ? '#10b981' : '#2563eb';
    const darkBorderColor = isEquipped ? '#34d399' : '#60a5fa';
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
export function initializeHeroPowerPresets() {
    const container = document.getElementById('hero-power-presets-container');
    if (!container) return;

    // Create tabs
    let tabsHTML = '<div class="preset-tabs">';
    for (let i = 1; i <= 10; i++) {
        const activeClass = i === 1 ? 'active' : '';
        tabsHTML += `<button class="preset-tab ${activeClass}" id="preset-tab-${i}" onclick="switchPreset(${i})">${i}</button>`;
    }
    tabsHTML += '</div>';

    // Create preset contents
    let contentsHTML = '';
    for (let i = 1; i <= 10; i++) {
        contentsHTML += createPresetContentHTML(i, i === 1);
    }

    container.innerHTML = tabsHTML + contentsHTML;
}

export function createPresetContentHTML(presetId, isActive = false) {
    let optionsHTML = '<option value="">-- Select Stat --</option>';

    innerAbilityStats.forEach(stat => {
        optionsHTML += `<option value="${stat}">${stat}</option>`;
    });

    const activeClass = isActive ? 'active' : '';

    return `
        <div class="preset-content ${activeClass}" id="preset-${presetId}-content">
            <div class="preset-equipped-checkbox">
                <input type="checkbox" id="preset-${presetId}-equipped" onchange="handlePresetEquipped(${presetId})">
                <label for="preset-${presetId}-equipped">Currently Equipped</label>
            </div>
            <div class="inner-ability-lines">
                ${Array.from({ length: 6 }, (_, i) => `
                    <div class="inner-ability-line">
                        <div class="input-group">
                            <label>Line ${i + 1} - Stat</label>
                            <select id="preset-${presetId}-line-${i + 1}-stat" onchange="saveHeroPowerPresets()">
                                ${optionsHTML}
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Value</label>
                            <input type="number" step="0.1" id="preset-${presetId}-line-${i + 1}-value" placeholder="0" onchange="saveHeroPowerPresets()">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function switchPreset(presetId) {
    // Hide all preset contents
    for (let i = 1; i <= 10; i++) {
        const content = document.getElementById(`preset-${i}-content`);
        const tab = document.getElementById(`preset-tab-${i}`);

        if (content) content.classList.remove('active');
        if (tab) tab.classList.remove('active');
    }

    // Show selected preset
    const selectedContent = document.getElementById(`preset-${presetId}-content`);
    const selectedTab = document.getElementById(`preset-tab-${presetId}`);

    if (selectedContent) selectedContent.classList.add('active');
    if (selectedTab) selectedTab.classList.add('active');
}

export function handlePresetEquipped(presetId) {
    const checkbox = document.getElementById(`preset-${presetId}-equipped`);

    if (checkbox.checked) {
        // Uncheck all other presets
        for (let i = 1; i <= 10; i++) {
            if (i !== presetId) {
                const otherCheckbox = document.getElementById(`preset-${i}-equipped`);
                const otherTab = document.getElementById(`preset-tab-${i}`);

                if (otherCheckbox) otherCheckbox.checked = false;
                if (otherTab) otherTab.classList.remove('equipped');
            }
        }

        // Mark this preset tab as equipped
        const tab = document.getElementById(`preset-tab-${presetId}`);
        if (tab) tab.classList.add('equipped');
    } else {
        // Unmark this preset tab
        const tab = document.getElementById(`preset-tab-${presetId}`);
        if (tab) tab.classList.remove('equipped');
    }

    saveHeroPowerPresets();
}

export function saveHeroPowerPresets() {
    const presets = {};

    for (let i = 1; i <= 10; i++) {
        const isEquipped = document.getElementById(`preset-${i}-equipped`)?.checked || false;
        const lines = [];

        for (let j = 1; j <= 6; j++) {
            const stat = document.getElementById(`preset-${i}-line-${j}-stat`)?.value || '';
            const value = document.getElementById(`preset-${i}-line-${j}-value`)?.value || '';

            if (stat && value) {
                lines.push({ stat, value: parseFloat(value) });
            }
        }

        presets[i] = { isEquipped, lines };
    }

    localStorage.setItem('heroPowerPresets', JSON.stringify(presets));

    // Update Inner Ability Analysis when presets change
    renderPresetComparison();
    renderTheoreticalBest();
}

export function loadHeroPowerPresets() {
    const saved = localStorage.getItem('heroPowerPresets');
    if (!saved) return;

    try {
        const presets = JSON.parse(saved);

        for (let i = 1; i <= 10; i++) {
            const preset = presets[i];
            if (!preset) continue;

            // Set equipped checkbox
            const equippedCheckbox = document.getElementById(`preset-${i}-equipped`);
            const tab = document.getElementById(`preset-tab-${i}`);

            if (equippedCheckbox) {
                equippedCheckbox.checked = preset.isEquipped;
                if (preset.isEquipped && tab) {
                    tab.classList.add('equipped');
                }
            }

            // Set lines
            preset.lines.forEach((line, index) => {
                const lineNum = index + 1;
                const statSelect = document.getElementById(`preset-${i}-line-${lineNum}-stat`);
                const valueInput = document.getElementById(`preset-${i}-line-${lineNum}-value`);

                if (statSelect) statSelect.value = line.stat;
                if (valueInput) valueInput.value = line.value;
            });
        }
    } catch (error) {
        console.error('Failed to load hero power presets:', error);
    }
}

// Equipment Slots Management
export function initializeEquipmentSlots() {
    const slots = ['Head', 'Cape', 'Chest', 'Shoulders', 'Legs', 'Belt', 'Gloves', 'Boots', 'Ring', 'Neck', 'Eye Accessory'];
    const container = document.getElementById('equipment-slots-grid');
    if (!container) return;

    let html = '';
    slots.forEach((slotName, index) => {
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

// Help Sidebar System
const helpContent = {
    'skill-coeff': {
        title: 'Skill Coefficient',
        content: `
            <h4>What is Skill Coefficient?</h4>
            <p>The Skill Coefficient is a percentage value that determines how much of your base attack damage is applied when using your Basic Attack skill.</p>

            <h4>Where to Find It</h4>
            <p>You can find this value in the description of your <strong>Basic Attack</strong> skill. It's usually shown as a percentage (e.g., "89.9%" or "120%").</p>

            <img src="media/tutorial/skill-coefficient.png" alt="Skill Coefficient Example" style="width: 100%; max-width: 300px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">

            <h4>Example</h4>
            <p>If your skill coefficient is 89.9% and you have 1000 base attack, your Basic Attack will deal 899 damage before other multipliers are applied.</p>
        `
    },
    'def-pen': {
        title: 'Defense Penetration',
        content: `
            <h4>What is Defense Penetration?</h4>
            <p>Defense Penetration reduces the target's defense value, allowing you to deal more damage. This is especially valuable against high-defense enemies.</p>

            <h4>When It Matters</h4>
            <p>Defense Penetration becomes increasingly important when fighting:</p>
            <ul>
                <li>World Bosses (50%+ defense)</li>
                <li>Chapter Bosses (20-25% defense)</li>
                <li>High-level stage hunts</li>
            </ul>

            <h4>How It Works</h4>
            <p>If an enemy has 30% defense and you have 10% defense penetration, the enemy's effective defense becomes 20%.</p>
        `
    },
    'skill-mastery': {
        title: 'Skill Mastery Bonus',
        content: `
            <h4>What is Skill Mastery Bonus?</h4>
            <p>Skill Mastery Bonus represents the total damage increase from passive skills that enhance your Basic Attack.</p>

            <h4>How to Calculate</h4>
            <p>You must manually add up all Mastery skill bonuses that affect your Basic Attack damage:</p>
            <ul>
                <li>Check your passive skill tree</li>
                <li>Add up all percentages that say "increases Basic Attack damage"</li>
                <li>Enter the total sum here</li>
            </ul>

            <h4>Example</h4>
            <p>If you have three passives: +8%, +7%, and +6% to Basic Attack, your Skill Mastery Bonus would be 21%.</p>
        `
    },
    'skill-mastery-boss': {
        title: 'Skill Mastery Bonus - Boss Only',
        content: `
            <h4>What is this?</h4>
            <p>This field is for Mastery skills that <strong>only apply when fighting bosses</strong>.</p>

            <h4>How to Use</h4>
            <p>Similar to regular Skill Mastery Bonus, but only include bonuses that specifically state "against bosses" or "boss damage".</p>

            <img src="media/tutorial/mastery-boss.png" alt="Boss Mastery Example" style="width: 100%; max-width: 300px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">

            <h4>Important</h4>
            <p>Don't double-count! If a bonus applies to all enemies, put it in the regular Skill Mastery Bonus field, not here.</p>
        `
    },
    'target-stage': {
        title: 'Target Stage/Boss',
        content: `
            <h4>What is this?</h4>
            <p>Select the enemy or stage you're currently fighting to apply accurate defense and damage reduction values.</p>

            <h4>Why It Matters</h4>
            <p>Different enemies have different defensive stats:</p>
            <ul>
                <li><strong>Training Dummy:</strong> 0% defense (shows your raw damage)</li>
                <li><strong>Normal Stages:</strong> Low defense (5-20%)</li>
                <li><strong>Chapter Bosses:</strong> Medium defense (20-25%)</li>
                <li><strong>World Bosses:</strong> High defense (50%+)</li>
            </ul>

            <h4>Tip</h4>
            <p>Select "Training Dummy" to see your maximum potential damage output without any enemy resistances.</p>
        `
    },
    'defense': {
        title: 'Defense (Dark Knight Only)',
        content: `
            <h4>What is Defense?</h4>
            <p>This field is specifically for Dark Knight characters who have a passive skill that converts a percentage of their Defense stat into Main Stat.</p>

            <h4>Why It's Important</h4>
            <p>The Dark Knight passive converts defense into main stat, which is a unique damage multiplier. This conversion is <strong>not</strong> included when you get a main stat % increase from equipment or other sources.</p>

            <h4>How to Use</h4>
            <ul>
                <li>Enter your total Defense value from your character stats</li>
                <li>The calculator will apply the Dark Knight passive conversion</li>
                <li>This ensures accurate damage calculations for Dark Knights</li>
            </ul>

            <h4>Note</h4>
            <p>This field is only visible when you select Dark Knight as your class.</p>
        `
    },
    'main-stat-pct': {
        title: 'Current Main Stat %',
        content: `
            <h4>What is Main Stat %?</h4>
            <p>Main Stat % represents all percentage-based bonuses you currently have that increase your main stat (STR, DEX, INT, or LUK depending on your class).</p>

            <h4>Why It's Required</h4>
            <p>Main stat % bonuses are <strong>additive with each other</strong>, which means the value of gaining additional main stat % depends on your current total and existing bonuses. This field is required to correctly calculate how much DPS you would gain from additional main stat % sources.</p>

            <h4>How to Use These Fields Together</h4>
            <ol>
                <li><strong>Primary Main Stat:</strong> Enter the TOTAL main stat shown on your character sheet (this already includes all your main stat % bonuses)</li>
                <li><strong>Current Main Stat %:</strong> Enter the sum of all your main stat % bonuses</li>
            </ol>

            <h4>How to Calculate</h4>
            <p>Add up all your main stat % bonuses from:</p>
            <ul>
                <li>Artifacts</li>
                <li>Passive skills</li>
                <li>Buff skills</li>
                <li>Any other source that says "+X% Main Stat"</li>
            </ul>

            <h4>Important Note for Dark Knights</h4>
            <p>Main stat % bonuses do NOT affect the portion of your main stat that comes from Defense conversion. This is automatically handled in the calculations.</p>

            <h4>Example</h4>
            <p>If you have +20% from equipment, +15% from artifacts, and +10% from skills, enter <strong>45</strong> in the "Current Main Stat %" field. Then enter your character sheet's total main stat value in the "Primary Main Stat" field.</p>
        `
    }
};

export function openHelpSidebar(helpKey) {
    const sidebar = document.getElementById('help-sidebar');
    const title = document.getElementById('help-sidebar-title');
    const content = document.getElementById('help-sidebar-content');
    const backdrop = document.getElementById('help-sidebar-backdrop');

    if (!sidebar || !title || !content) return;

    const helpData = helpContent[helpKey];
    if (!helpData) return;

    // Set content
    title.textContent = helpData.title;
    content.innerHTML = helpData.content;

    // Show sidebar
    sidebar.style.display = 'flex';

    // Only show backdrop on mobile (< 768px)
    if (backdrop && window.innerWidth < 768) {
        backdrop.classList.add('active');
    }
}

export function closeHelpSidebar() {
    const sidebar = document.getElementById('help-sidebar');
    const backdrop = document.getElementById('help-sidebar-backdrop');

    if (sidebar) {
        sidebar.style.display = 'none';
    }
    if (backdrop) {
        backdrop.classList.remove('active');
    }
}

// Left Navigation - Scroll to Section
export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}
