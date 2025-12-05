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
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
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
            <button onclick="addComparisonItemStat(${comparisonItemCount})" style="background: var(--accent-primary); border: none; padding: 10px 15px; border-radius: 10px; color: white; cursor: pointer; font-weight: 600; margin-top: 8px; font-size: 0.9em; width: 100%; box-shadow: 0 2px 8px var(--shadow); transition: all 0.3s ease;">+ Add Stat</button>
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
        html += `<div style="grid-column: span 4;"><h3 style="color: var(--accent-success); margin: 10px 0 8px 0; font-size: 0.95em; text-transform: capitalize; font-weight: 600;">${rarity} Weapons</h3></div>`;

        tiers.forEach(tier => {
            const rate = weaponRatesPerLevel[rarity][tier];
            if (rate === null) {
                html += `<div class="weapon-card" style="opacity: 0.4;">
                    <div class="weapon-header">${tier.toUpperCase()} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</div>
                    <div style="text-align: center; color: var(--text-secondary); font-size: 0.8em; padding: 15px 0;">No data</div>
                </div>`;
            } else {
                html += `<div class="weapon-card" id="weapon-${rarity}-${tier}">
                    <div class="weapon-header">${tier.toUpperCase()} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</div>
                    <input type="number" class="weapon-input" id="level-${rarity}-${tier}"
                           placeholder="Level" value="0" min="0" max="200" onchange="updateWeaponBonuses()">
                    <div class="weapon-checkbox">
                        <input type="checkbox" id="equipped-${rarity}-${tier}"
                               onchange="handleEquippedChange('${rarity}', '${tier}')">
                        <label>Equipped</label>
                    </div>
                    <div id="equipped-input-${rarity}-${tier}" style="display: none;">
                        <input type="number" step="0.1" class="weapon-input"
                               id="equipped-attack-${rarity}-${tier}"
                               placeholder="Equipped Attack %" value="0" onchange="updateWeaponBonuses()">
                    </div>
                    <div class="weapon-bonus">
                        Inventory: <span id="inventory-${rarity}-${tier}">0.0%</span>
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
                const levelInput = document.getElementById(`level-${rarity}-${tier}`);
                const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

                if (levelInput) {
                    levelInput.addEventListener('input', saveToLocalStorage);
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
            const levelInput = document.getElementById(`level-${rarity}-${tier}`);
            const inventorySpan = document.getElementById(`inventory-${rarity}-${tier}`);
            const equippedCheckbox = document.getElementById(`equipped-${rarity}-${tier}`);
            const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

            if (levelInput && inventorySpan) {
                const level = parseFloat(levelInput.value) || 0;
                const inventoryBonus = calculateInventoryBonus(rarity, tier, level);
                inventorySpan.textContent = inventoryBonus.toFixed(1) + '%';
                totalInventory += inventoryBonus;

                if (equippedCheckbox && equippedCheckbox.checked && equippedInput) {
                    equippedBonus = parseFloat(equippedInput.value) || 0;
                }
            }
        });
    });

    document.getElementById('total-inventory-attack').textContent = totalInventory.toFixed(1) + '%';
    document.getElementById('equipped-attack').textContent = equippedBonus.toFixed(1) + '%';
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
        return `<div style="color: ${changeColor}; font-weight: 600; margin-top: 4px; font-size: 0.95em;">${changeSign}${changePercentage.toFixed(2)}%</div>`;
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
            <div class="value">${formatNumber(bossResults.expectedDamage)}</div>
            ${expectedBossDamagePercentChange}
        </div>

        <div class="expected-damage" style="margin-top: 10px; background: rgba(67, 233, 123, 0.3);">
            <div class="label">DPS (Boss)</div>
            <div class="value">${formatNumber(bossResults.dps)}</div>
            ${bossDpsPercentChange}
        </div>

        <div class="expected-damage" style="margin-top: 10px;">
            <div class="label">Expected Damage (Normal)</div>
            <div class="value">${formatNumber(normalResults.expectedDamage)}</div>
            ${expectedNormalDamagePercentChange}
        </div>

        <div class="expected-damage" style="margin-top: 10px; background: rgba(67, 233, 123, 0.3);">
            <div class="label">DPS (Normal)</div>
            <div class="value">${formatNumber(normalResults.dps)}</div>
            ${normalDpsPercentChjange}
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
                    <div class="damage-row">
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
                        <span class="damage-label">Defense Pen Multiplier:</span>
                        <span class="damage-value">${bossResults.defPenMultiplier.toFixed(4)}x</span>
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
