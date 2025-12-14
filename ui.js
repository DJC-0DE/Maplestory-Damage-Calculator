// Tab switching function
function switchTab(group, tabName) {
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
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = body.getAttribute('data-theme');

    if (currentTheme === 'light') {
        body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
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
                        const inventoryInput = document.getElementById(`inventory-${rarity}-${tier}`);
                        const equippedCheckbox = document.getElementById(`equipped-${rarity}-${tier}`);
                        const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

                        if (inventoryInput) inventoryInput.value = weaponData.inventoryAttack || '0';
                        if (equippedCheckbox) {
                            equippedCheckbox.checked = weaponData.equipped;
                            if (weaponData.equipped) {
                                handleEquippedChange(rarity, tier);
                            }
                        }
                        if (equippedInput) equippedInput.value = weaponData.equippedAttack || '0';
                    }
                });
            });
            updateWeaponBonuses();
        }
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Equip/Unequip functionality
function unequipItem() {
    // Get equipped item data
    const equippedItem = getItemStats('equipped');

    if (!equippedItem.name && equippedItem.attack === 0 &&
        equippedItem.critRate === 0 && equippedItem.critDamage === 0 &&
        equippedItem.skillLevel === 0 && equippedItem.normalDamage === 0 &&
        equippedItem.bossDamage === 0 && equippedItem.damage === 0) {
        alert('No item currently equipped');
        return;
    }

    // Subtract equipped item stats from base stats
    const weaponMultiplier = 1 + (getWeaponAttackBonus() / 100);

    const attackBase = document.getElementById('attack-base');
    attackBase.value = parseFloat(attackBase.value) - (equippedItem.attack * weaponMultiplier);

    const critRateBase = document.getElementById('crit-rate-base');
    critRateBase.value = parseFloat(critRateBase.value) - equippedItem.critRate;

    const critDamageBase = document.getElementById('crit-damage-base');
    critDamageBase.value = parseFloat(critDamageBase.value) - equippedItem.critDamage;

    const skillCoeffBase = document.getElementById('skill-coeff-base');
    skillCoeffBase.value = parseFloat(skillCoeffBase.value) - (equippedItem.skillLevel * 0.3);

    const normalDamageBase = document.getElementById('normal-damage-base');
    normalDamageBase.value = parseFloat(normalDamageBase.value) - equippedItem.normalDamage;

    const bossDamageBase = document.getElementById('boss-damage-base');
    bossDamageBase.value = parseFloat(bossDamageBase.value) - equippedItem.bossDamage;

    const damageBase = document.getElementById('damage-base');
    damageBase.value = parseFloat(damageBase.value) - equippedItem.damage;

    // Move to comparison items
    addComparisonItem();
    document.getElementById(`item-${comparisonItemCount}-name`).value = equippedItem.name || 'Unequipped Item';
    document.getElementById(`item-${comparisonItemCount}-attack`).value = equippedItem.attack;

    // Add stats to comparison item
    const statMapping = [
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
    equippedStatCount = 0;

    saveToLocalStorage();
    calculate();
}

function equipItem(itemId) {
    // Check if there's already an equipped item
    const currentEquipped = getItemStats('equipped');
    if (currentEquipped.attack !== 0 || currentEquipped.critRate !== 0 ||
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
    attackBase.value = parseFloat(attackBase.value) + (comparisonItem.attack * weaponMultiplier);

    const critRateBase = document.getElementById('crit-rate-base');
    critRateBase.value = parseFloat(critRateBase.value) + comparisonItem.critRate;

    const critDamageBase = document.getElementById('crit-damage-base');
    critDamageBase.value = parseFloat(critDamageBase.value) + comparisonItem.critDamage;

    const skillCoeffBase = document.getElementById('skill-coeff-base');
    skillCoeffBase.value = parseFloat(skillCoeffBase.value) + (comparisonItem.skillLevel * 0.3);

    const normalDamageBase = document.getElementById('normal-damage-base');
    normalDamageBase.value = parseFloat(normalDamageBase.value) + comparisonItem.normalDamage;

    const bossDamageBase = document.getElementById('boss-damage-base');
    bossDamageBase.value = parseFloat(bossDamageBase.value) + comparisonItem.bossDamage;

    const damageBase = document.getElementById('damage-base');
    damageBase.value = parseFloat(damageBase.value) + comparisonItem.damage;

    // Move to equipped item
    document.getElementById('equipped-name').value = comparisonItem.name || 'Equipped Item';
    document.getElementById('equipped-attack').value = comparisonItem.attack;

    // Add stats to equipped item
    const statMapping = [
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
function addEquippedStat() {
    if (equippedStatCount >= 3) {
        alert('Maximum 3 optional stats allowed');
        return;
    }

    equippedStatCount++;
    const container = document.getElementById('equipped-stats-container');

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
        <button onclick="removeEquippedStat(${equippedStatCount})" style="background: var(--accent-warning); border: none; padding: 8px 12px; border-radius: 8px; color: white; cursor: pointer; font-size: 0.85em; height: 38px; transition: all 0.3s ease; font-weight: 600;">✕</button>
    `;

    container.appendChild(statDiv);
    saveToLocalStorage();
}

function removeEquippedStat(id) {
    const stat = document.getElementById(`equipped-stat-${id}`);
    if (stat) {
        stat.remove();
        saveToLocalStorage();
    }
}

// Comparison item management
function addComparisonItem() {
    comparisonItemCount++;
    const container = document.getElementById('comparison-items-container');

    const itemDiv = document.createElement('div');
    itemDiv.id = `comparison-item-${comparisonItemCount}`;
    itemDiv.style.marginBottom = '12px';
    itemDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.05)); border: 1px solid var(--accent-primary); border-radius: 12px; padding: 15px; box-shadow: 0 4px 16px var(--shadow);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="color: var(--accent-primary); font-weight: 600; font-size: 0.95em;">Item #${comparisonItemCount}</span>
                <button onclick="removeComparisonItem(${comparisonItemCount})" style="background: var(--accent-warning); border: none; padding: 6px 12px; border-radius: 8px; color: white; cursor: pointer; font-size: 0.85em; transition: all 0.3s ease; font-weight: 600;">✕</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
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
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                <button onclick="addComparisonItemStat(${comparisonItemCount})" style="background: var(--accent-primary); border: none; padding: 10px 15px; border-radius: 10px; color: white; cursor: pointer; font-weight: 600; font-size: 0.9em; box-shadow: 0 2px 8px var(--shadow); transition: all 0.3s ease;">+ Add Stat</button>
                <button onclick="equipItem(${comparisonItemCount})" style="background: var(--accent-success); border: none; padding: 10px 15px; border-radius: 10px; color: white; cursor: pointer; font-weight: 600; font-size: 0.9em; box-shadow: 0 2px 8px var(--shadow); transition: all 0.3s ease;">Equip</button>
            </div>
        </div>
    `;

    container.appendChild(itemDiv);
    saveToLocalStorage();
}

function removeComparisonItem(id) {
    const item = document.getElementById(`comparison-item-${id}`);
    if (item) {
        item.remove();
        saveToLocalStorage();
        calculate();
    }
}

function addComparisonItemStat(itemId) {
    const container = document.getElementById(`item-${itemId}-stats-container`);
    const currentStats = container.children.length;

    if (currentStats >= 3) {
        alert('Maximum 3 optional stats allowed');
        return;
    }

    const statId = currentStats + 1;
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
        <button onclick="removeComparisonItemStat(${itemId}, ${statId})" style="background: var(--accent-warning); border: none; padding: 8px 12px; border-radius: 8px; color: white; cursor: pointer; font-size: 0.85em; height: 38px; transition: all 0.3s ease; font-weight: 600;">✕</button>
    `;

    container.appendChild(statDiv);
    saveToLocalStorage();
}

function removeComparisonItemStat(itemId, statId) {
    const stat = document.getElementById(`item-${itemId}-stat-${statId}`);
    if (stat) {
        stat.remove();
        saveToLocalStorage();
    }
}

// Weapon initialization and management
function initializeWeapons() {
    const weaponsGrid = document.getElementById('weapons-grid');
    let html = '';

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const rate = weaponRatesPerLevel[rarity][tier];
            const rarityCapitalized = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            let rarityColor = rarityColors[rarityCapitalized] || '#ffffff';

            // For Normal rarity, use black in light theme and white in dark theme
            if (rarityCapitalized === 'Normal') {
                const currentTheme = document.body.getAttribute('data-theme');
                rarityColor = currentTheme === 'light' ? '#000000' : '#ffffff';
            }

            if (rate === null) {
                html += `<div class="weapon-card" style="opacity: 0.4;">
                    <div class="weapon-header" style="color: ${rarityColor};">${tier.toUpperCase()} ${rarityCapitalized}</div>
                    <div style="text-align: center; color: var(--text-secondary); font-size: 0.8em; padding: 15px 0;">No data</div>
                </div>`;
            } else {
                html += `<div class="weapon-card" id="weapon-${rarity}-${tier}">
                    <div class="weapon-header" style="color: ${rarityColor};">${tier.toUpperCase()} ${rarityCapitalized}</div>
                    <input type="number" step="0.1" class="weapon-input" id="inventory-${rarity}-${tier}"
                           placeholder="Inventory %" value="0" onchange="updateWeaponBonuses()">
                    <div class="weapon-checkbox">
                        <input type="checkbox" id="equipped-${rarity}-${tier}"
                               onchange="handleEquippedChange('${rarity}', '${tier}')">
                        <label>Equipped</label>
                    </div>
                    <div id="equipped-input-${rarity}-${tier}" style="display: none;">
                        <input type="number" step="0.1" class="weapon-input"
                               id="equipped-attack-${rarity}-${tier}"
                               placeholder="Equipped %" value="0" onchange="updateWeaponBonuses()">
                    </div>
                </div>`;
            }
        });
    });

    weaponsGrid.innerHTML = html;

    // Attach save listeners to weapon inputs (after they're created)
    setTimeout(() => {
        rarities.forEach(rarity => {
            tiers.forEach(tier => {
                const inventoryInput = document.getElementById(`inventory-${rarity}-${tier}`);
                const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

                if (inventoryInput) {
                    inventoryInput.addEventListener('input', saveToLocalStorage);
                }
                if (equippedInput) {
                    equippedInput.addEventListener('input', saveToLocalStorage);
                }
            });
        });
    }, 0);
}

function handleEquippedChange(rarity, tier) {
    const checkbox = document.getElementById(`equipped-${rarity}-${tier}`);
    const equippedInput = document.getElementById(`equipped-input-${rarity}-${tier}`);
    const weaponCard = document.getElementById(`weapon-${rarity}-${tier}`);

    if (checkbox.checked) {
        // Uncheck all other equipped checkboxes
        rarities.forEach(r => {
            tiers.forEach(t => {
                if (r !== rarity || t !== tier) {
                    const otherCheckbox = document.getElementById(`equipped-${r}-${t}`);
                    if (otherCheckbox) {
                        otherCheckbox.checked = false;
                        const otherInput = document.getElementById(`equipped-input-${r}-${t}`);
                        const otherCard = document.getElementById(`weapon-${r}-${t}`);
                        if (otherInput) otherInput.style.display = 'none';
                        if (otherCard) otherCard.classList.remove('equipped');
                    }
                }
            });
        });
        equippedInput.style.display = 'block';
        weaponCard.classList.add('equipped');
    } else {
        equippedInput.style.display = 'none';
        weaponCard.classList.remove('equipped');
    }

    // Save to localStorage
    saveToLocalStorage();

    updateWeaponBonuses();
}

function updateWeaponBonuses() {
    let totalInventory = 0;
    let equippedBonus = 0;

    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const inventoryInput = document.getElementById(`inventory-${rarity}-${tier}`);
            const equippedCheckbox = document.getElementById(`equipped-${rarity}-${tier}`);
            const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

            if (inventoryInput) {
                const inventoryBonus = parseFloat(inventoryInput.value) || 0;
                totalInventory += inventoryBonus;

                if (equippedCheckbox && equippedCheckbox.checked && equippedInput) {
                    equippedBonus = parseFloat(equippedInput.value) || 0;
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
}

// Display functions
function displayResults(itemName, stats, uniqueId, isEquipped = false, equippedDamageValues = null) {
    const bossResults = calculateDamage(stats, 'boss');
    const normalResults = calculateDamage(stats, 'normal');

    const borderColor = isEquipped ? 'var(--accent-success)' : 'var(--accent-primary)';
    const bgGradient = isEquipped
        ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(0, 122, 255, 0.05))'
        : 'linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.05))';

    const getPercentChangeDisplay = (currentValue, referenceValue) => {
        if (!referenceValue || referenceValue === 0) return '';
        const changePercentage = ((currentValue - referenceValue) / referenceValue) * 100;
        const changeColor = changePercentage >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)';
        const changeSign = changePercentage >= 0 ? '+' : '';
        return `<span style="color: ${changeColor}; font-weight: 600; margin-left: 8px; font-size: 0.85em;">(${changeSign}${changePercentage.toFixed(2)}%)</span>`;
    };

    const expectedBossDamagePercentChange = equippedDamageValues ? getPercentChangeDisplay(bossResults.expectedDamage, equippedDamageValues.expectedDamageBoss) : '';
    const bossDpsPercentChange = equippedDamageValues ? getPercentChangeDisplay(bossResults.dps, equippedDamageValues.dpsBoss) : '';
    const expectedNormalDamagePercentChange = equippedDamageValues ? getPercentChangeDisplay(normalResults.expectedDamage, equippedDamageValues.expectedDamageNormal) : '';
    const normalDpsPercentChjange = equippedDamageValues ? getPercentChangeDisplay(normalResults.dps, equippedDamageValues.dpsNormal) : '';

    const html = `
        <div style="background: ${bgGradient}; border: 2px solid ${borderColor}; border-radius: 16px; padding: 20px; box-shadow: 0 6px 24px var(--shadow); transition: all 0.3s ease;">
            <h3 style="color: ${borderColor}; margin-bottom: 15px; text-align: center; font-size: 1.2em; font-weight: 600;">${itemName}</h3>
        <div class="expected-damage">
            <div class="label">Expected Damage (Boss)</div>
            <div class="value">${formatNumber(bossResults.expectedDamage)}${expectedBossDamagePercentChange}</div>
        </div>

        <div class="expected-damage" style="margin-top: 10px; background: rgba(67, 233, 123, 0.3);">
            <div class="label">DPS (Boss)</div>
            <div class="value">${formatNumber(bossResults.dps)}${bossDpsPercentChange}</div>
        </div>

        <div class="expected-damage" style="margin-top: 10px;">
            <div class="label">Expected Damage (Normal)</div>
            <div class="value">${formatNumber(normalResults.expectedDamage)}${expectedNormalDamagePercentChange}</div>
        </div>

        <div class="expected-damage" style="margin-top: 10px; background: rgba(67, 233, 123, 0.3);">
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

function toggleSubDetails(id) {
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

function toggleDetails(id) {
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
function initializeHeroPowerPresets() {
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

function createPresetContentHTML(presetId, isActive = false) {
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

function switchPreset(presetId) {
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

function handlePresetEquipped(presetId) {
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

function saveHeroPowerPresets() {
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

function loadHeroPowerPresets() {
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
function initializeEquipmentSlots() {
    const slots = ['Head', 'Cape', 'Chest', 'Shoulders', 'Legs', 'Belt', 'Gloves', 'Boots', 'Ring', 'Neck'];
    const container = document.getElementById('equipment-slots-grid');
    if (!container) return;

    let html = '';
    slots.forEach((slotName, index) => {
        const slotId = slotName.toLowerCase();
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
                    <div style="color: var(--text-secondary); font-size: 0.75em; margin-bottom: 6px; font-weight: 500;">DPS Gain % (Boss / Normal)</div>
                    <div style="color: var(--accent-primary); font-size: 0.9em; font-weight: 600;">
                        <span id="slot-${slotId}-boss-dps">0%</span> / <span id="slot-${slotId}-normal-dps">0%</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Attach save listeners
    setTimeout(() => {
        slots.forEach(slot => {
            const slotId = slot.toLowerCase();
            const attackInput = document.getElementById(`slot-${slotId}-attack`);
            const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
            const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

            if (attackInput) attackInput.addEventListener('input', saveEquipmentSlots);
            if (mainStatInput) mainStatInput.addEventListener('input', saveEquipmentSlots);
            if (damageAmpInput) damageAmpInput.addEventListener('input', saveEquipmentSlots);
        });
    }, 0);
}

function saveEquipmentSlots() {
    const slots = {};
    const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck'];

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

function loadEquipmentSlots() {
    const saved = localStorage.getItem('equipmentSlots');
    if (!saved) return;

    try {
        const slots = JSON.parse(saved);
        const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck'];

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

function calculateEquipmentSlotDPS() {
    const baseStats = getStats('base');
    const slotNames = ['head', 'cape', 'chest', 'shoulders', 'legs', 'belt', 'gloves', 'boots', 'ring', 'neck'];

    slotNames.forEach(slotId => {
        const attackInput = document.getElementById(`slot-${slotId}-attack`);
        const mainStatInput = document.getElementById(`slot-${slotId}-main-stat`);
        const damageAmpInput = document.getElementById(`slot-${slotId}-damage-amp`);

        const slotAttack = parseFloat(attackInput?.value) || 0;
        const slotMainStat = parseFloat(mainStatInput?.value) || 0;
        const slotDamageAmp = parseFloat(damageAmpInput?.value) || 0;

        // Calculate baseline DPS (base stats WITH this slot included)
        const baselineBossDPS = calculateDamage(baseStats, 'boss').dps;
        const baselineNormalDPS = calculateDamage(baseStats, 'normal').dps;

        // Calculate weapon attack bonus (same as scrolling tab)
        const weaponAttackBonus = getWeaponAttackBonus();
        const effectiveAttackIncrease = slotAttack * (1 + weaponAttackBonus / 100);

        // Convert main stat to stat damage (100:1 ratio)
        const statDamageFromMainStat = slotMainStat / 100;

        // Remove this slot's stats from base to see DPS without it
        const statsWithoutSlot = { ...baseStats };
        statsWithoutSlot.attack -= effectiveAttackIncrease;
        statsWithoutSlot.statDamage -= statDamageFromMainStat;
        statsWithoutSlot.damageAmp -= slotDamageAmp;

        // Calculate DPS without this slot
        const withoutSlotBossDPS = calculateDamage(statsWithoutSlot, 'boss').dps;
        const withoutSlotNormalDPS = calculateDamage(statsWithoutSlot, 'normal').dps;

        // Calculate percentage gain (same formula as scrolling tab: (new - old) / old * 100)
        const bossDPSGainPct = ((baselineBossDPS - withoutSlotBossDPS) / baselineBossDPS * 100);
        const normalDPSGainPct = ((baselineNormalDPS - withoutSlotNormalDPS) / baselineNormalDPS * 100);

        // Display results
        const bossDPSDisplay = document.getElementById(`slot-${slotId}-boss-dps`);
        const normalDPSDisplay = document.getElementById(`slot-${slotId}-normal-dps`);

        if (bossDPSDisplay) bossDPSDisplay.textContent = `+${bossDPSGainPct.toFixed(2)}%`;
        if (normalDPSDisplay) normalDPSDisplay.textContent = `+${normalDPSGainPct.toFixed(2)}%`;
    });
}
