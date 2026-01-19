// Weapons UI functionality

import {
  calculateWeaponAttacks,
  getMaxLevelForStars,
  getUpgradeCost,
  calculateUpgradeGain,
} from "@core/weapon-levels/weapon-calculations.js";
import { StatCalculationService } from "@core/services/stat-calculation-service.js";
import { saveToLocalStorage } from "@core/state/storage.js";
import { getStats, calculate } from "@core/main.js";
import { getWeaponAttackBonus } from "@core/state/state.js";
import {
  rarities,
  tiers,
  rarityColors,
  weaponBaseAttackEquipped,
} from "@core/constants.js";

window.setWeaponStars = setWeaponStars;
window.previewStars = previewStars;
window.resetStarPreview = resetStarPreview;
window.handleEquippedCheckboxChange = handleEquippedCheckboxChange;
window.handleWeaponLevelChange = handleWeaponLevelChange;
window.calculateCurrencyUpgrades = calculateCurrencyUpgrades;
window.switchWeaponLevelsTab = switchWeaponLevelsTab;

// Switch weapon levels sub-tabs
export function switchWeaponLevelsTab(tabName) {
  const allSubTabContent = document.querySelectorAll(".weapon-levels-subtab");
  const allSubTabButtons = document.querySelectorAll(
    "#weapon-levels-subtab-button",
  );

  // Hide all subtabs
  allSubTabContent.forEach((tab) => {
    tab.classList.remove("active");
    tab.style.display = "none";
  });

  // Remove active from all buttons
  allSubTabButtons.forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected subtab
  const selectedTab = document.getElementById(`weapon-levels-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.add("active");
    selectedTab.style.display = "block";
  }

  // Activate button - Find the button by matching the onclick attribute
  allSubTabButtons.forEach((btn) => {
    const onclickAttr = btn.getAttribute("onclick");
    if (onclickAttr && onclickAttr.includes(tabName)) {
      btn.classList.add("active");
    }
  });
}

export function initializeWeapons() {
  const weaponsGrid = document.getElementById("weapons-grid");
  let html = "";

  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const baseAtk = weaponBaseAttackEquipped[rarity]?.[tier];
      const rarityCapitalized =
        rarity.charAt(0).toUpperCase() + rarity.slice(1);

      // Ancient T4 is enabled, T3/T2/T1 are disabled
      const isDisabled = rarity === "ancient" && tier === "t1";

      if (baseAtk === null || baseAtk === undefined || isDisabled) {
        html += `<div class="weapon-card weapon-card--disabled" data-rarity="${rarity}">
                    <div class="weapon-header">${tier.toUpperCase()} ${rarityCapitalized}</div>
                    <div class="weapon-no-data">No data</div>
                </div>`;
      } else {
        // Default stars: 5 for normal/rare/epic/unique, 1 for legendary/mystic/ancient
        const defaultStars = ["legendary", "mystic", "ancient"].includes(rarity)
          ? 1
          : 5;

        html += `<div class="weapon-card" id="weapon-${rarity}-${tier}" data-rarity="${rarity}">
                    <!-- Equipped Checkbox in top right -->
                    <div class="weapon-equipped-toggle">
                        <input type="checkbox" id="equipped-checkbox-${rarity}-${tier}"
                               onchange="handleEquippedCheckboxChange('${rarity}', '${tier}')">
                        <label for="equipped-checkbox-${rarity}-${tier}"
                               class="weapon-equipped-label"
                               id="equipped-label-${rarity}-${tier}">E</label>
                    </div>

                    <div class="weapon-header">${tier.toUpperCase()} ${rarityCapitalized}</div>

                    <!-- Star Rating -->
                    <div class="weapon-stars">`;

        for (let i = 1; i <= 5; i++) {
          const activeClass = i <= defaultStars ? "active" : "";
          html += `<span class="star-individual ${activeClass}"
                                   onclick="setWeaponStars('${rarity}', '${tier}', ${i})"
                                   onmouseenter="previewStars('${rarity}', '${tier}', ${i})"
                                   onmouseleave="resetStarPreview('${rarity}', '${tier}')"
                                   id="star-${rarity}-${tier}-${i}">⭐</span>`;
        }

        html += `</div>
                    <input type="hidden" id="stars-${rarity}-${tier}" value="${defaultStars}">

                    <div class="weapon-input-group">
                        <label for="level-${rarity}-${tier}">Level</label>
                        <input type="number" min="0" max="200" class="weapon-input" id="level-${rarity}-${tier}"
                               placeholder="0-200" value="0" oninput="handleWeaponLevelChange('${rarity}', '${tier}')">
                    </div>

                    <div class="weapon-stats">
                        <span class="weapon-inventory-display" id="inventory-display-${rarity}-${tier}">0.0% inventory attack</span>
                    </div>

                    <div class="weapon-upgrade-efficiency" id="upgrade-gain-container-${rarity}-${tier}">
                        <span class="weapon-efficiency-text" id="upgrade-gain-${rarity}-${tier}"></span>
                    </div>

                    <div class="weapon-equipped-display" id="equipped-display-${rarity}-${tier}" style="display:none;">
                        <span class="weapon-equipped-value" id="equipped-value-${rarity}-${tier}">0.0% equipped attack</span>
                    </div>
                </div>`;
      }
    });
  });

  weaponsGrid.innerHTML = html;

  // Attach save listeners to weapon level and star inputs (after they're created)
  setTimeout(() => {
    rarities.forEach((rarity) => {
      tiers.forEach((tier) => {
        const levelInput = document.getElementById(`level-${rarity}-${tier}`);
        const starsInput = document.getElementById(`stars-${rarity}-${tier}`);

        if (levelInput) {
          levelInput.addEventListener("input", saveToLocalStorage);
        }
        if (starsInput) {
          starsInput.addEventListener("change", saveToLocalStorage);
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
  const newStars = currentStars === stars ? 0 : stars;
  starsInput.value = newStars;

  // Update star display (1-5 stars)
  for (let i = 1; i <= 5; i++) {
    const starElem = document.getElementById(`star-${rarity}-${tier}-${i}`);
    if (starElem) {
      const isActive = i <= newStars;
      starElem.classList.toggle("active", isActive);

      // Add pop animation for newly active stars
      if (isActive && i > currentStars) {
        starElem.classList.remove("pop");
        void starElem.offsetWidth; // Trigger reflow
        starElem.classList.add("pop");
      }
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
      const shouldBeActive = i <= stars;
      starElem.style.opacity = shouldBeActive ? "1" : "0.25";
      starElem.style.filter = shouldBeActive
        ? "grayscale(0)"
        : "grayscale(0.7)";
      starElem.style.transform = shouldBeActive ? "scale(1)" : "scale(0.85)";
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
      // Remove inline styles and let CSS classes handle it
      starElem.style.opacity = "";
      starElem.style.filter = "";
      starElem.style.transform = "";
    }
  }
}

export function handleEquippedCheckboxChange(rarity, tier) {
  const checkbox = document.getElementById(
    `equipped-checkbox-${rarity}-${tier}`,
  );
  const label = document.getElementById(`equipped-label-${rarity}-${tier}`);
  const equippedDisplay = document.getElementById(
    `equipped-display-${rarity}-${tier}`,
  );
  const card = document.getElementById(`weapon-${rarity}-${tier}`);

  if (checkbox.checked) {
    // Uncheck all other equipped checkboxes
    rarities.forEach((r) => {
      tiers.forEach((t) => {
        if (r !== rarity || t !== tier) {
          const otherCheckbox = document.getElementById(
            `equipped-checkbox-${r}-${t}`,
          );
          const otherLabel = document.getElementById(
            `equipped-label-${r}-${t}`,
          );
          const otherDisplay = document.getElementById(
            `equipped-display-${r}-${t}`,
          );
          const otherCard = document.getElementById(`weapon-${r}-${t}`);

          if (otherCheckbox) otherCheckbox.checked = false;
          // CSS handles the label state via :checked pseudo-class
          if (otherDisplay) otherDisplay.style.display = "none";
          if (otherCard) otherCard.classList.remove("equipped");
        }
      });
    });

    // Calculate and display equipped attack
    const levelInput = document.getElementById(`level-${rarity}-${tier}`);
    const level = parseInt(levelInput.value) || 0;
    const { equippedAttack } = calculateWeaponAttacks(rarity, tier, level);

    const equippedValue = document.getElementById(
      `equipped-value-${rarity}-${tier}`,
    );
    if (equippedValue) {
      equippedValue.textContent = `${equippedAttack.toFixed(1)}% equipped attack`;
    }

    if (equippedDisplay) equippedDisplay.style.display = "block";
    if (card) card.classList.add("equipped");
  } else {
    if (equippedDisplay) equippedDisplay.style.display = "none";
    if (card) card.classList.remove("equipped");
  }

  saveToLocalStorage();
  updateWeaponBonuses();
  updateEquippedWeaponIndicator();
}

export function updateWeaponUpgradeColors() {
  // Collect all gainPer1k values
  const gainValues = [];
  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const upgradeGainDisplay = document.getElementById(
        `upgrade-gain-${rarity}-${tier}`,
      );
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

  // Apply CSS classes to each upgrade display
  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const upgradeGainDisplay = document.getElementById(
        `upgrade-gain-${rarity}-${tier}`,
      );
      if (upgradeGainDisplay && upgradeGainDisplay.dataset.gainPer1k) {
        const gainPer1k = parseFloat(upgradeGainDisplay.dataset.gainPer1k);
        if (!isNaN(gainPer1k) && gainPer1k > 0) {
          // Normalize value between 0 (min) and 1 (max)
          const normalized =
            maxGain === minGain
              ? 1
              : (gainPer1k - minGain) / (maxGain - minGain);

          // Apply CSS class based on efficiency tier
          upgradeGainDisplay.classList.remove("high", "medium", "low");
          if (normalized > 0.66) {
            upgradeGainDisplay.classList.add("high");
          } else if (normalized > 0.33) {
            upgradeGainDisplay.classList.add("medium");
          } else {
            upgradeGainDisplay.classList.add("low");
          }
        }
      }
    });
  });
}

export function handleWeaponLevelChange(rarity, tier) {
  const levelInput = document.getElementById(`level-${rarity}-${tier}`);
  const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
  const level = parseInt(levelInput.value) || 0;

  const stars =
    starsInput?.value !== undefined && starsInput?.value !== ""
      ? parseInt(starsInput.value)
      : 5;

  // Enforce max level based on stars
  const maxLevel = getMaxLevelForStars(stars);
  levelInput.setAttribute("max", maxLevel);
  if (level > maxLevel) {
    levelInput.value = maxLevel;
    return handleWeaponLevelChange(rarity, tier);
  }

  // Calculate inventory and equipped attack percentages
  const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(
    rarity,
    tier,
    level,
  );

  // Update inventory display
  const inventoryDisplay = document.getElementById(
    `inventory-display-${rarity}-${tier}`,
  );
  if (inventoryDisplay) {
    inventoryDisplay.textContent = `${inventoryAttack.toFixed(1)}% inventory attack`;
  }

  // Show/hide upgrade gain display based on whether at max level
  const upgradeGainContainer = document.getElementById(
    `upgrade-gain-container-${rarity}-${tier}`,
  );
  const upgradeGainDisplay = document.getElementById(
    `upgrade-gain-${rarity}-${tier}`,
  );

  if (level < maxLevel && level > 0) {
    // Check if this weapon is equipped
    const equippedDisplay = document.getElementById(
      `equipped-display-${rarity}-${tier}`,
    );
    const isEquipped =
      equippedDisplay && equippedDisplay.style.display !== "none";

    // Calculate multi-level efficiency (what you actually get per 1k shards)
    const upgradeGain = calculateUpgradeGain(
      rarity,
      tier,
      level,
      stars,
      1000,
      isEquipped,
    );

    if (upgradeGainDisplay && upgradeGain.attackGain > 0) {
      let gainPer1k;
      let totalGainPer1k;

      if (upgradeGain.isUnaffordable) {
        // Next level costs more than 1k - normalize to per 1k
        gainPer1k =
          (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
        const equippedGainPer1k =
          (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
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
      upgradeGainDisplay.dataset.gainPer1k = isEquipped
        ? totalGainPer1k
        : gainPer1k;

      if (upgradeGainContainer) {
        upgradeGainContainer.classList.add("visible");
      }
    } else {
      // Hide if no gain or can't calculate
      if (upgradeGainContainer) {
        upgradeGainContainer.classList.remove("visible");
      }
    }
  } else {
    if (upgradeGainContainer) {
      upgradeGainContainer.classList.remove("visible");
    }
    if (upgradeGainDisplay) {
      delete upgradeGainDisplay.dataset.gainPer1k;
    }
  }

  // Update equipped display if this weapon is currently shown as equipped
  const equippedDisplay = document.getElementById(
    `equipped-display-${rarity}-${tier}`,
  );
  if (equippedDisplay && equippedDisplay.style.display !== "none") {
    const equippedValue = document.getElementById(
      `equipped-value-${rarity}-${tier}`,
    );
    if (equippedValue) {
      equippedValue.textContent = `${equippedAttack.toFixed(1)}% equipped attack`;
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

  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const equippedDisplay = document.getElementById(
        `equipped-display-${rarity}-${tier}`,
      );
      if (equippedDisplay && equippedDisplay.style.display !== "none") {
        hasEquipped = true;
      }
    });
  });

  // Show/hide the indicator
  const indicator = document.getElementById("no-weapon-equipped-indicator");
  if (indicator) {
    indicator.style.display = hasEquipped ? "none" : "block";
  }
}

export function updateWeaponBonuses() {
  let totalInventory = 0;
  let equippedBonus = 0;

  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const levelInput = document.getElementById(`level-${rarity}-${tier}`);
      const equippedDisplay = document.getElementById(
        `equipped-display-${rarity}-${tier}`,
      );

      if (levelInput) {
        const level = parseInt(levelInput.value) || 0;
        const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(
          rarity,
          tier,
          level,
        );

        totalInventory += inventoryAttack;

        // Check if equipped based on display visibility
        if (equippedDisplay && equippedDisplay.style.display !== "none") {
          equippedBonus = equippedAttack;
        }
      }
    });
  });

  document.getElementById("total-inventory-attack").textContent =
    totalInventory.toFixed(1) + "%";
  document.getElementById("equipped-weapon-attack-pct").textContent =
    equippedBonus.toFixed(1) + "%";
  document.getElementById("total-weapon-attack").textContent =
    (totalInventory + equippedBonus).toFixed(1) + "%";

  // Save to localStorage
  saveToLocalStorage();

  // Recalculate damage
  calculate();

  // Update upgrade priority chain
  updateUpgradePriorityChain();
}

export function updateUpgradePriorityChain() {
  const priorityChain = document.getElementById("upgrade-priority-chain");
  if (!priorityChain) return;

  // Collect current weapon states
  const weaponStates = [];
  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const levelInput = document.getElementById(`level-${rarity}-${tier}`);
      const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
      if (levelInput) {
        const level = parseInt(levelInput.value) || 0;
        const stars =
          starsInput?.value !== undefined && starsInput?.value !== ""
            ? parseInt(starsInput.value)
            : 5;
        const maxLevel = getMaxLevelForStars(stars);

        // Only include weapons that can be upgraded (level > 0 and not at max)
        if (level > 0 && level <= maxLevel) {
          weaponStates.push({
            rarity,
            tier,
            level,
            stars,
            maxLevel,
          });
        }
      }
    });
  });

  if (weaponStates.length === 0) {
    priorityChain.innerHTML =
      '<span style="color: var(--text-secondary);">No weapons available to upgrade</span>';
    return;
  }

  // Simulate 100 upgrades
  const upgradeSequence = [];
  const weaponLevels = {};
  const weaponMaxLevels = {};
  const weaponEquippedStates = {};

  // Initialize current levels, max levels, and equipped states
  weaponStates.forEach((ws) => {
    const key = `${ws.rarity}-${ws.tier}`;
    weaponLevels[key] = ws.level;
    weaponMaxLevels[key] = ws.maxLevel;

    // Check if this weapon is equipped
    const equippedDisplay = document.getElementById(
      `equipped-display-${ws.rarity}-${ws.tier}`,
    );
    weaponEquippedStates[key] =
      equippedDisplay && equippedDisplay.style.display !== "none";
  });

  for (let i = 0; i < 100; i++) {
    let bestWeapon = null;
    let bestEfficiency = 0;

    // Recalculate efficiency for ALL weapons at their current levels
    weaponStates.forEach((ws) => {
      const key = `${ws.rarity}-${ws.tier}`;
      const currentLevel = weaponLevels[key];
      const maxLevel = weaponMaxLevels[key];
      const isEquipped = weaponEquippedStates[key];

      // Skip if at max level
      if (currentLevel >= maxLevel) return;

      // Calculate multi-level efficiency (what 1k shards gets you from current level)
      const upgradeGain = calculateUpgradeGain(
        ws.rarity,
        ws.tier,
        currentLevel,
        ws.stars,
        1000,
        isEquipped,
      );

      let efficiency;
      if (upgradeGain.isUnaffordable) {
        // Normalize to per 1k when single level costs more than 1k
        const inventoryEfficiency =
          (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
        const equippedEfficiency =
          (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
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

  upgradeSequence.forEach((upgrade) => {
    if (
      !currentGroup ||
      currentGroup.rarity !== upgrade.rarity ||
      currentGroup.tier !== upgrade.tier
    ) {
      if (currentGroup) {
        groupedUpgrades.push(currentGroup);
      }
      currentGroup = {
        rarity: upgrade.rarity,
        tier: upgrade.tier,
        count: 1,
      };
    } else {
      currentGroup.count++;
    }
  });

  if (currentGroup) {
    groupedUpgrades.push(currentGroup);
  }

  // Build HTML for display
  let html = "";
  groupedUpgrades.forEach((group, index) => {
    const tierUpper = group.tier.toUpperCase();
    const rarityFirstLetter = group.rarity.charAt(0).toUpperCase();

    html += `<span class="wl-priority-item" data-rarity="${group.rarity}">${tierUpper} ${rarityFirstLetter} x${group.count}</span>`;

    if (index < groupedUpgrades.length - 1) {
      html += ' <span class="wl-priority-divider">→</span> ';
    }
  });

  priorityChain.innerHTML = html;
}

/**
 * Helper function to calculate weapon attack bonus from weapon levels
 * @param {Object} weaponLevels - Object mapping rarity-tier keys to levels
 * @returns {number} Total weapon attack bonus
 */
function calculateWeaponAttackBonusFromLevels(weaponLevels) {
  let totalBonus = 0;
  let equippedBonus = 0;

  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const key = `${rarity}-${tier}`;
      const level = weaponLevels[key] || 0;

      if (level === 0) return;

      const { inventoryAttack, equippedAttack } = calculateWeaponAttacks(
        rarity,
        tier,
        level,
      );
      totalBonus += inventoryAttack;

      // Check if this weapon is equipped
      const equippedDisplay = document.getElementById(
        `equipped-label-${rarity}-${tier}`,
      );
      if (equippedDisplay && equippedDisplay.style.display !== "none") {
        equippedBonus = equippedAttack;
      }
    });
  });

  return totalBonus + equippedBonus;
}

export function calculateCurrencyUpgrades() {
  const currencyInput = document.getElementById("upgrade-currency-input");
  const resultsDiv = document.getElementById("currency-upgrade-results");
  const attackGainDisplay = document.getElementById("currency-attack-gain");
  const dpsGainDisplay = document.getElementById("currency-dps-gain");
  const pathDisplay = document.getElementById("currency-upgrade-path");

  if (!currencyInput || !resultsDiv) return;

  const currency = parseFloat(currencyInput.value) || 0;

  if (currency <= 0) {
    resultsDiv.classList.remove("visible");
    return;
  }

  // Collect current weapon states
  const weaponStates = [];
  const initialWeaponLevels = {};
  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      const levelInput = document.getElementById(`level-${rarity}-${tier}`);
      const starsInput = document.getElementById(`stars-${rarity}-${tier}`);
      if (levelInput) {
        const level = parseInt(levelInput.value) || 0;
        const stars =
          starsInput?.value !== undefined && starsInput?.value !== ""
            ? parseInt(starsInput.value)
            : 5;
        const maxLevel = getMaxLevelForStars(stars);
        const key = `${rarity}-${tier}`;
        initialWeaponLevels[key] = level;

        if (level > 0 && level <= maxLevel) {
          weaponStates.push({
            rarity,
            tier,
            level,
            stars,
            maxLevel,
          });
        }
      }
    });
  });

  if (weaponStates.length === 0) {
    resultsDiv.classList.remove("visible");
    return;
  }

  // Calculate initial DPS using StatCalculationService
  // We pass 0 for weaponAttackBonus since it's already included in the stats from state
  const baseStats = getStats("base");
  const initialStatService = new StatCalculationService(baseStats);
  const initialDPS = initialStatService.computeDPS("boss");

  // Simulate spending currency
  const upgradeSequence = [];
  const weaponLevels = {};
  const weaponMaxLevels = {};
  const weaponEquippedStates = {};
  let remainingCurrency = currency;
  let totalAttackGain = 0;

  // Initialize current levels, max levels, and equipped states
  weaponStates.forEach((ws) => {
    const key = `${ws.rarity}-${ws.tier}`;
    weaponLevels[key] = ws.level;
    weaponMaxLevels[key] = ws.maxLevel;

    // Check if this weapon is equipped
    const equippedDisplay = document.getElementById(
      `equipped-display-${ws.rarity}-${ws.tier}`,
    );
    weaponEquippedStates[key] =
      equippedDisplay && equippedDisplay.style.display !== "none";
  });

  // Keep upgrading until we run out of currency (same logic as priority chain)
  while (remainingCurrency > 0) {
    let bestWeapon = null;
    let bestEfficiency = 0;

    // Find the most efficient upgrade based on 1k shard potential (same as priority chain)
    weaponStates.forEach((ws) => {
      const key = `${ws.rarity}-${ws.tier}`;
      const currentLevel = weaponLevels[key];
      const maxLevel = weaponMaxLevels[key];
      const isEquipped = weaponEquippedStates[key];

      if (currentLevel >= maxLevel) return;

      // Calculate multi-level efficiency (what 1k shards gets you from current level)
      const upgradeGain = calculateUpgradeGain(
        ws.rarity,
        ws.tier,
        currentLevel,
        ws.stars,
        1000,
        isEquipped,
      );

      let efficiency;
      if (upgradeGain.isUnaffordable) {
        // Normalize to per 1k when single level costs more than 1k
        const inventoryEfficiency =
          (upgradeGain.attackGain / upgradeGain.singleLevelCost) * 1000;
        const equippedEfficiency =
          (upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost) * 1000;
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
          cost: getUpgradeCost(ws.rarity, ws.tier, currentLevel),
        };
      }
    });

    // If no weapon can be upgraded, stop
    if (!bestWeapon) break;

    // Check if we can afford this upgrade
    if (bestWeapon.cost > remainingCurrency) break;

    // Calculate actual gain for this single level
    const currentAttack = calculateWeaponAttacks(
      bestWeapon.rarity,
      bestWeapon.tier,
      weaponLevels[bestWeapon.key],
    ).inventoryAttack;
    const nextAttack = calculateWeaponAttacks(
      bestWeapon.rarity,
      bestWeapon.tier,
      weaponLevels[bestWeapon.key] + 1,
    ).inventoryAttack;
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
    resultsDiv.classList.add("visible");
    if (attackGainDisplay) attackGainDisplay.textContent = `+0.00%`;
    if (dpsGainDisplay) dpsGainDisplay.textContent = `+0.00%`;
    if (pathDisplay)
      pathDisplay.innerHTML = `<span class="wl-currency-path-divider">Most impactful upgrade can't be afforded — save up!</span>`;
    // Hide the apply button since there is no path to apply
    const applyUpgradesBtn = document.getElementById("apply-upgrade-path-btn");
    if (applyUpgradesBtn) applyUpgradesBtn.style.display = "none";
    return;
  }

  // Calculate weapon attack bonus with simulated upgraded levels using helper
  const newWeaponAttackBonus =
    calculateWeaponAttackBonusFromLevels(weaponLevels);

  // Apply the weapon attack bonus difference to attack
  // Weapon attack bonus is a % that multiplies base attack
  const baseAttackWithoutWeaponBonus =
    baseStats.attack / (1 + initialStatService.weaponAttackBonus / 100);
  const newStats = {
    ...baseStats,
    attack: baseAttackWithoutWeaponBonus * (1 + newWeaponAttackBonus / 100),
  };

  // Pass 0 for weaponAttackBonus since we've manually applied it to the attack stat
  const newStatService = new StatCalculationService(
    newStats,
    newWeaponAttackBonus,
  );
  const newDPS = newStatService.computeDPS("boss");
  const dpsGainPct = ((newDPS - initialDPS) / initialDPS) * 100;

  // Collate all upgrades by weapon type (not just consecutive)
  const upgradeCounts = {};

  upgradeSequence.forEach((upgrade) => {
    const key = `${upgrade.rarity}-${upgrade.tier}`;
    if (!upgradeCounts[key]) {
      upgradeCounts[key] = {
        rarity: upgrade.rarity,
        tier: upgrade.tier,
        count: 0,
      };
    }
    upgradeCounts[key].count++;
  });

  // Convert to array and sort by count (descending) then by rarity/tier
  const collatedUpgrades = Object.values(upgradeCounts).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    // Secondary sort: by rarity index then tier
    const rarityOrder = {
      normal: 0,
      rare: 1,
      epic: 2,
      unique: 3,
      legendary: 4,
      mystic: 5,
      ancient: 6,
    };
    if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    const tierOrder = { t4: 0, t3: 1, t2: 2, t1: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  // Build path HTML (horizontal list)
  let pathHTML = "";
  collatedUpgrades.forEach((group, index) => {
    const tierUpper = group.tier.toUpperCase();
    const rarityFirstLetter = group.rarity.charAt(0).toUpperCase();
    const weaponKey = `${group.rarity}-${group.tier}`;
    pathHTML += `<span class="wl-currency-path-item" data-rarity="${group.rarity}">${tierUpper} ${rarityFirstLetter} x${group.count} (${weaponLevels[weaponKey]})</span>`;

    if (index < collatedUpgrades.length - 1) {
      pathHTML += ' <span class="wl-currency-path-divider">,</span> ';
    }
  });

  // Display results
  attackGainDisplay.textContent = `+${totalAttackGain.toFixed(2)}%`;
  dpsGainDisplay.textContent = `+${dpsGainPct.toFixed(2)}%`;
  pathDisplay.innerHTML = pathHTML;
  resultsDiv.classList.add("visible");
  const applyUpgradesBtn = document.getElementById("apply-upgrade-path-btn");

  // Ensure the apply button is visible when there is a valid path
  if (applyUpgradesBtn) {
    applyUpgradesBtn.style.display = "";

    // update weapon levels after user has leveled weps accordingly
    applyUpgradesBtn.onclick = () => {
      for (const key in weaponLevels) {
        const levelInput = document.getElementById(`level-${key}`);
        levelInput.value = weaponLevels[key];
      }

      // reset currency input
      const currencyInput = document.getElementById("upgrade-currency-input");
      currencyInput.value = "0";

      // update/save stats
      calculateCurrencyUpgrades();
      saveToLocalStorage();
      updateWeaponBonuses();
    };
  }
}
