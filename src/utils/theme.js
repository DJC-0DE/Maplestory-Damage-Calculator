// Theme toggle functionality

import { initializeWeapons } from "@core/weapon-levels/weapons-ui.js";
import { updateWeaponBonuses } from "@core/weapon-levels/weapons-ui.js";
import { handleEquippedCheckboxChange } from "@core/weapon-levels/weapons-ui.js";
import {
  handleWeaponLevelChange,
  updateEquippedWeaponIndicator,
} from "@core/weapon-levels/weapons-ui.js";
import { rarities, tiers } from "@core/constants.js";

window.toggleTheme = toggleTheme;

export function toggleTheme() {
  // Dark mode only - light theme disabled
  // Ensure dark mode is always active
  const html = document.documentElement;
  if (!html.classList.contains("dark")) {
    html.classList.add("dark");
  }
  localStorage.setItem("theme", "dark");

  // Re-initialize weapons to update Normal rarity color (dark mode only)
  const savedData = localStorage.getItem("damageCalculatorData");
  initializeWeapons();

  // Restore weapon values after re-initialization
  if (savedData) {
    const data = JSON.parse(savedData);
    if (data.weapons) {
      rarities.forEach((rarity) => {
        tiers.forEach((tier) => {
          const key = `${rarity}-${tier}`;
          const weaponData = data.weapons[key];

          if (weaponData) {
            const levelInput = document.getElementById(
              `level-${rarity}-${tier}`,
            );
            const starsInput = document.getElementById(
              `stars-${rarity}-${tier}`,
            );
            const equippedCheckbox = document.getElementById(
              `equipped-checkbox-${rarity}-${tier}`,
            );

            if (starsInput) {
              const defaultStars = ["legendary", "mystic", "ancient"].includes(
                rarity,
              )
                ? 1
                : 5;
              const stars =
                weaponData.stars !== undefined
                  ? weaponData.stars
                  : defaultStars;
              starsInput.value = stars;

              // Update star display (1-5 stars)
              for (let i = 1; i <= 5; i++) {
                const starElem = document.getElementById(
                  `star-${rarity}-${tier}-${i}`,
                );
                if (starElem) {
                  starElem.style.opacity = i <= stars ? "1" : "0.3";
                }
              }
            }

            if (levelInput) {
              levelInput.value = weaponData.level || "0";
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
  // Dark mode only - ignore saved theme and force dark mode
  const html = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleSidebar = document.getElementById("theme-icon-sidebar");

  html.classList.add("dark");
  localStorage.setItem("theme", "dark");

  if (themeToggle) themeToggle.textContent = "☀️";
  if (themeToggleSidebar) themeToggleSidebar.textContent = "☀️";
}
