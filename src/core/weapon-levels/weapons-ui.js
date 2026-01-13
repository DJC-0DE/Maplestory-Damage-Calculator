// Weapons UI functionality

import { calculateWeaponAttacks, getMaxLevelForStars, getUpgradeCost, calculateUpgradeGain } from '@core/weapon-levels/weapon-calculations.js';
import { calculateDamage } from '@core/calculations/damage-calculations.js';
import { saveToLocalStorage } from '@core/storage.js';
import { getStats, calculate } from '@core/main.js';
import { getWeaponAttackBonus } from '@core/state.js';
import { rarities, tiers, rarityColors, weaponBaseAttackEquipped } from '@core/constants.js';

window.setWeaponStars = setWeaponStars;
window.previewStars = previewStars;
window.resetStarPreview = resetStarPreview;
window.handleEquippedCheckboxChange = handleEquippedCheckboxChange;
window.handleWeaponLevelChange = handleWeaponLevelChange;
window.calculateCurrencyUpgrades = calculateCurrencyUpgrades;

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
            const isDisabled = rarity === 'ancient' && tier === 't1';

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
        // Check if this weapon is equipped
        const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);
        const isEquipped = equippedDisplay && equippedDisplay.style.display !== 'none';

        // Calculate multi-level efficiency (what you actually get per 1k shards)
        const upgradeGain = calculateUpgradeGain(rarity, tier, level, stars, 1000, isEquipped);

        if (upgradeGainDisplay && upgradeGain.attackGain > 0) {
            let gainPer1k;
            let totalGainPer1k;

            if (upgradeGain.isUnaffordable) {
                // Next level costs more than 1k - normalize to per 1k
                gainPer1k = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
                const equippedGainPer1k = (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
                totalGainPer1k = gainPer1k + equippedGainPer1k;

                if (isEquipped) {
                    upgradeGainDisplay.textContent = `+${totalGainPer1k.toFixed(2)}% per 1k shards (${gainPer1k.toFixed(2)}% inv + ${equippedGainPer1k.toFixed(2)}% eq, next level costs ${upgradeGain.singleLevelCost} shards)`;
                } else {
                    upgradeGainDisplay.textContent = `+${gainPer1k.toFixed(2)}% per 1k shards (next level costs ${upgradeGain.singleLevelCost} shards)`;
                }
            } else {
                // Can afford levels with 1k shards
                gainPer1k = upgradeGain.attackGain;
                totalGainPer1k = gainPer1k + upgradeGain.equippedAttackGain;

                if (isEquipped) {
                    upgradeGainDisplay.textContent = `+${totalGainPer1k.toFixed(2)}% per 1k shards (${gainPer1k.toFixed(2)}% inv + ${upgradeGain.equippedAttackGain.toFixed(2)}% eq, ${upgradeGain.levelsGained} levels)`;
                } else {
                    upgradeGainDisplay.textContent = `+${gainPer1k.toFixed(2)}% per 1k shards (${upgradeGain.levelsGained} levels)`;
                }
            }

            // Store totalGainPer1k for color coding (use total when equipped, otherwise just inventory)
            upgradeGainDisplay.dataset.gainPer1k = isEquipped ? totalGainPer1k : gainPer1k;

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
            const equippedDisplay = document.getElementById(`equipped-display-${rarity}-${tier}`);

            if (levelInput) {
                const level = parseInt(levelInput.value) || 0;
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
    const weaponEquippedStates = {};

    // Initialize current levels, max levels, and equipped states
    weaponStates.forEach(ws => {
        const key = `${ws.rarity}-${ws.tier}`;
        weaponLevels[key] = ws.level;
        weaponMaxLevels[key] = ws.maxLevel;

        // Check if this weapon is equipped
        const equippedDisplay = document.getElementById(`equipped-display-${ws.rarity}-${ws.tier}`);
        weaponEquippedStates[key] = equippedDisplay && equippedDisplay.style.display !== 'none';
    });

    for (let i = 0; i < 100; i++) {
        let bestWeapon = null;
        let bestEfficiency = 0;

        // Recalculate efficiency for ALL weapons at their current levels
        weaponStates.forEach(ws => {
            const key = `${ws.rarity}-${ws.tier}`;
            const currentLevel = weaponLevels[key];
            const maxLevel = weaponMaxLevels[key];
            const isEquipped = weaponEquippedStates[key];

            // Skip if at max level
            if (currentLevel >= maxLevel) return;

            // Calculate multi-level efficiency (what 1k shards gets you from current level)
            const upgradeGain = calculateUpgradeGain(ws.rarity, ws.tier, currentLevel, ws.stars, 1000, isEquipped);

            let efficiency;
            if (upgradeGain.isUnaffordable) {
                // Normalize to per 1k when single level costs more than 1k
                const inventoryEfficiency = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
                const equippedEfficiency = (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
                efficiency = inventoryEfficiency + equippedEfficiency;
            } else {
                efficiency = upgradeGain.attackGain + upgradeGain.equippedAttackGain; // Already per 1k
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
    const weaponEquippedStates = {};
    let remainingCurrency = currency;
    let totalAttackGain = 0;

    // Initialize current levels, max levels, and equipped states
    weaponStates.forEach(ws => {
        const key = `${ws.rarity}-${ws.tier}`;
        weaponLevels[key] = ws.level;
        weaponMaxLevels[key] = ws.maxLevel;

        // Check if this weapon is equipped
        const equippedDisplay = document.getElementById(`equipped-display-${ws.rarity}-${ws.tier}`);
        weaponEquippedStates[key] = equippedDisplay && equippedDisplay.style.display !== 'none';
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
            const isEquipped = weaponEquippedStates[key];

            if (currentLevel >= maxLevel) return;

            // Calculate multi-level efficiency (what 1k shards gets you from current level)
            const upgradeGain = calculateUpgradeGain(ws.rarity, ws.tier, currentLevel, ws.stars, 1000, isEquipped);

            let efficiency;
            if (upgradeGain.isUnaffordable) {
                // Normalize to per 1k when single level costs more than 1k
                const inventoryEfficiency = (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
                const equippedEfficiency = (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
                efficiency = inventoryEfficiency + equippedEfficiency;
            } else {
                efficiency = upgradeGain.attackGain + upgradeGain.equippedAttackGain; // Already per 1k
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
        // If no upgrades could be bought with the entered currency, show a friendly message
        // instead of hiding the results block so the user knows to save up.
        resultsDiv.style.display = 'block';
        if (attackGainDisplay) attackGainDisplay.textContent = `+0.00%`;
        if (dpsGainDisplay) dpsGainDisplay.textContent = `+0.00%`;
        if (pathDisplay) pathDisplay.innerHTML = `<span style="color: var(--text-secondary);">Most impactful upgrade can't be afforded — save up!</span>`;
        // Hide the apply button since there is no path to apply
        const applyUpgradesBtn = document.getElementById('apply-upgrade-path-btn');
        if (applyUpgradesBtn) applyUpgradesBtn.style.display = 'none';
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

    // Ensure the apply button is visible when there is a valid path
    if (applyUpgradesBtn) {
        applyUpgradesBtn.style.display = '';

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
}
