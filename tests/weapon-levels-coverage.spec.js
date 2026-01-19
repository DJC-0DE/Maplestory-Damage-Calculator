// Weapon Levels Edge Cases & Coverage Tests
// Tests edge cases, disabled cards, and element inventory
// Run with: npm test weapon-levels-coverage.spec.js

import { test, expect } from "@playwright/test";
import {
  clearStorage,
  verifyMaxLevelEnforcement,
  markElementCovered,
  WEAPON_LEVELS_ELEMENTS,
  getAllWeaponCombinations,
  getEdgeCaseWeapons,
} from "./helpers/weapon-levels-helpers.js";
import {
  WEAPON_LEVELS_MAXED,
  WEAPON_LEVELS_DISABLED_TEST,
} from "./fixtures/weapon-levels.fixtures.js";

const BASE_URL = "http://localhost:8000";

test.describe("Weapon Levels - Edge Cases & Coverage", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  // =========================================================================
  // MAX LEVEL ENFORCEMENT
  // =========================================================================

  test.describe("Max Level Enforcement Based on Stars", () => {
    test("5 stars allows max level 200", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Ensure 5 stars (Normal T4 defaults to 5, so verify it's set)
      // First click star 3 to change from default, then click star 5 to set back to 5
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);
      await page.locator("#star-normal-t4-5").click();
      await page.waitForTimeout(200);

      // Assert - Max level should be 200
      await verifyMaxLevelEnforcement(page, "normal", "t4", 5, 200);

      // Test actual level can reach 200
      const levelInput = page.locator("#level-normal-t4");
      await levelInput.fill("200");
      await expect(levelInput).toHaveValue("200");

      markElementCovered("max-level-5-stars");
    });

    test("4 stars allows max level 180", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Set 4 stars
      await page.locator("#star-normal-t4-4").click();
      await page.waitForTimeout(200);

      // Assert - Max level should be 180
      await verifyMaxLevelEnforcement(page, "normal", "t4", 4, 180);

      markElementCovered("max-level-4-stars");
    });

    test("3 stars allows max level 160", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Set 3 stars
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);

      // Assert - Max level should be 160
      await verifyMaxLevelEnforcement(page, "normal", "t4", 3, 160);

      markElementCovered("max-level-3-stars");
    });

    test("2 stars allows max level 140", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Set 2 stars
      await page.locator("#star-normal-t4-2").click();
      await page.waitForTimeout(200);

      // Assert - Max level should be 140
      await verifyMaxLevelEnforcement(page, "normal", "t4", 2, 140);

      markElementCovered("max-level-2-stars");
    });

    test("1 star allows max level 120", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Set 1 star
      await page.locator("#star-normal-t4-1").click();
      await page.waitForTimeout(200);

      // Assert - Max level should be 120
      await verifyMaxLevelEnforcement(page, "normal", "t4", 1, 120);

      markElementCovered("max-level-1-star");
    });

    test("0 stars allows max level 100", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Set 3 stars, then click again to toggle to 0
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);

      // Assert - Max level should be 100 (0 stars defaults to 100)
      const levelInput = page.locator("#level-normal-t4");
      const maxAttr = await levelInput.getAttribute("max");
      expect(parseInt(maxAttr)).toBe(100);

      markElementCovered("max-level-0-stars");
    });

    test("level auto-corrects when stars decrease", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set 5 stars and high level (Normal T4 defaults to 5, so toggle to ensure it's set)
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);
      await page.locator("#star-normal-t4-5").click();
      await page.locator("#level-normal-t4").fill("200");
      await page.waitForTimeout(200);
      await expect(page.locator("#level-normal-t4")).toHaveValue("200");

      // Act - Reduce to 1 star (max level 120)
      await page.locator("#star-normal-t4-1").click();
      await page.waitForTimeout(200);

      // Assert - Level should auto-correct to 120
      await expect(page.locator("#level-normal-t4")).toHaveValue("120");

      markElementCovered("auto-correct-level-stars-decrease");
    });

    test("legendary weapon defaults to 1 star", async ({ page }) => {
      // Arrange - Clear storage first to ensure default state
      await clearStorage(page);
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Legendary should start with 1 star active
      await expect(page.locator("#star-legendary-t4-1")).toHaveClass(/active/);
      await expect(page.locator("#star-legendary-t4-2")).not.toHaveClass(
        /active/,
      );

      // Assert - Max level should be 120 (1 star)
      const levelInput = page.locator("#level-legendary-t4");
      const maxAttr = await levelInput.getAttribute("max");
      expect(parseInt(maxAttr)).toBe(120);

      markElementCovered("legendary-default-1-star");
    });

    test("ancient weapon defaults to 1 star", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Ancient should start with 1 star active
      await expect(page.locator("#star-ancient-t4-1")).toHaveClass(/active/);
      await expect(page.locator("#star-ancient-t4-2")).not.toHaveClass(
        /active/,
      );

      markElementCovered("ancient-default-1-star");
    });
  });

  // =========================================================================
  // DISABLED CARDS
  // =========================================================================

  test.describe("Disabled Cards (Ancient T1)", () => {
    test.skip("ancient T1 card shows no data and is disabled", async ({
      page,
    }) => {
      // NOTE: Ancient T1 card is not rendered in the DOM at all
      // The weapons-ui.js code skips disabled cards entirely
      // This test would verify the disabled state if the card existed

      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Ancient T1 card should not exist in DOM
      await expect(page.locator("#weapon-ancient-t1")).not.toBeAttached();

      markElementCovered("disabled-ancient-t1-card");
    });

    test("other ancient tiers are enabled", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Ancient T2, T3, T4 should not be disabled
      await expect(page.locator("#weapon-ancient-t4")).not.toHaveClass(
        /weapon-card--disabled/,
      );
      await expect(page.locator("#weapon-ancient-t3")).not.toHaveClass(
        /weapon-card--disabled/,
      );
      await expect(page.locator("#weapon-ancient-t2")).not.toHaveClass(
        /weapon-card--disabled/,
      );

      // Assert - Should have interactive elements
      await expect(page.locator("#level-ancient-t4")).toBeAttached();
      await expect(page.locator("#star-ancient-t4-1")).toBeAttached();

      markElementCovered("enabled-ancient-tiers");
    });
  });

  // =========================================================================
  // BOUNDARY VALUE TESTS
  // =========================================================================

  test.describe("Boundary Values", () => {
    test("level 0 hides upgrade gain display", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set up stars but level 0
      await page.locator("#star-normal-t4-5").click();
      await page.locator("#level-normal-t4").fill("0");
      await page.waitForTimeout(300);

      // Assert - Upgrade gain should not be visible
      const upgradeGainContainer = page.locator(
        "#upgrade-gain-container-normal-t4",
      );
      await expect(upgradeGainContainer).not.toHaveClass(/visible/);

      markElementCovered("boundary-level-0");
    });

    test("level 1 shows upgrade gain", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set to level 1
      await page.locator("#star-normal-t4-5").click();
      await page.locator("#level-normal-t4").fill("1");
      await page.waitForTimeout(300);

      // Assert - Upgrade gain should be visible
      const upgradeGainContainer = page.locator(
        "#upgrade-gain-container-normal-t4",
      );
      await expect(upgradeGainContainer).toHaveClass(/visible/);

      markElementCovered("boundary-level-1");
    });

    test("max level (200) hides upgrade gain", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set to max level
      await page.locator("#star-normal-t4-5").click();
      await page.locator("#level-normal-t4").fill("200");
      await page.waitForTimeout(300);

      // Assert - Upgrade gain should not be visible
      const upgradeGainContainer = page.locator(
        "#upgrade-gain-container-normal-t4",
      );
      await expect(upgradeGainContainer).not.toHaveClass(/visible/);

      markElementCovered("boundary-max-level");
    });

    test("max level minus 1 shows upgrade gain", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set to max level minus 1 (ensure 5 stars first)
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);
      await page.locator("#star-normal-t4-5").click();
      await page.locator("#level-normal-t4").fill("199");
      await page.waitForTimeout(300);

      // Assert - Upgrade gain should be visible
      const upgradeGainContainer = page.locator(
        "#upgrade-gain-container-normal-t4",
      );
      await expect(upgradeGainContainer).toHaveClass(/visible/);

      markElementCovered("boundary-max-minus-1");
    });

    test("negative level input is rejected", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Try to enter negative level
      const levelInput = page.locator("#level-normal-t4");
      await levelInput.fill("-10");
      await page.waitForTimeout(200);

      // Assert - Should show empty or 0 (browsers handle this differently)
      const actualValue = await levelInput.inputValue();
      // The input may be empty or "0", not negative
      expect(
        actualValue === "" || actualValue === "0" || parseInt(actualValue) >= 0,
      ).toBe(true);

      markElementCovered("boundary-negative-input");
    });

    test("very large level is capped at max", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set 5 stars (max level 200) - ensure it's actually set
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);
      await page.locator("#star-normal-t4-5").click();
      await page.waitForTimeout(200);

      // Act - Try to enter very large level
      const levelInput = page.locator("#level-normal-t4");
      await levelInput.fill("99999");
      await page.waitForTimeout(200);

      // Assert - Should be capped at 200
      await expect(levelInput).toHaveValue("200");

      markElementCovered("boundary-large-input");
    });
  });

  // =========================================================================
  // STAR INTERACTION EDGE CASES
  // =========================================================================

  test.describe("Star Interaction Edge Cases", () => {
    test("clicking star with level at max sets new max correctly", async ({
      page,
    }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set 5 stars and max level (ensure 5 stars is actually set)
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);
      await page.locator("#star-normal-t4-5").click();
      await page.locator("#level-normal-t4").fill("200");
      await page.waitForTimeout(200);
      await expect(page.locator("#level-normal-t4")).toHaveValue("200");

      // Act - Change to 3 stars (max level 160)
      await page.locator("#star-normal-t4-3").click();
      await page.waitForTimeout(200);

      // Assert - Level should auto-correct to 160
      await expect(page.locator("#level-normal-t4")).toHaveValue("160");

      // Assert - Max attribute should be 160
      const levelInput = page.locator("#level-normal-t4");
      const maxAttr = await levelInput.getAttribute("max");
      expect(parseInt(maxAttr)).toBe(160);

      markElementCovered("star-change-at-max-level");
    });

    test("rapid star clicking handles correctly", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Act - Rapidly click multiple stars
      await page.locator("#star-normal-t4-1").click();
      await page.locator("#star-normal-t4-3").click();
      await page.locator("#star-normal-t4-5").click();
      await page.waitForTimeout(300);

      // Assert - Should settle on final state (5 stars)
      await expect(page.locator("#star-normal-t4-5")).toHaveClass(/active/);
      await expect(page.locator("#star-normal-t4-1")).toHaveClass(/active/);

      // Assert - Max level should be 200
      const maxAttr = await page
        .locator("#level-normal-t4")
        .getAttribute("max");
      expect(parseInt(maxAttr)).toBe(200);

      markElementCovered("rapid-star-clicking");
    });

    test("star hover preview resets correctly", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set to 2 stars
      await page.locator("#star-normal-t4-2").click();
      await page.waitForTimeout(200);

      // Act - Hover over 4th star
      const star4 = page.locator("#star-normal-t4-4");
      await star4.hover();
      await page.waitForTimeout(100);

      // Preview should show stars 1-4 as active (visual preview)
      // This is hard to test with Playwright, so we'll just verify no errors

      // Act - Move mouse away
      await page.locator("#weapons-grid").hover();
      await page.waitForTimeout(100);

      // Assert - Should still be at 2 stars
      await expect(page.locator("#star-normal-t4-2")).toHaveClass(/active/);
      await expect(page.locator("#star-normal-t4-3")).not.toHaveClass(/active/);
      await expect(page.locator("#star-normal-t4-4")).not.toHaveClass(/active/);

      markElementCovered("star-hover-preview");
    });
  });

  // =========================================================================
  // EQUIPPED WEAPON EDGE CASES
  // =========================================================================

  test.describe("Equipped Weapon Edge Cases", () => {
    test("unchecking equipped checkbox hides display", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set up and equip weapon
      await page.locator("#level-normal-t4").fill("50");
      await page.locator("#equipped-label-normal-t4").click();
      await page.waitForTimeout(200);
      await expect(page.locator("#equipped-display-normal-t4")).toBeVisible();

      // Act - Uncheck
      await page.locator("#equipped-label-normal-t4").click();
      await page.waitForTimeout(200);

      // Assert - Display should be hidden
      await expect(
        page.locator("#equipped-display-normal-t4"),
      ).not.toBeVisible();

      // Assert - Card should not have equipped class
      await expect(page.locator("#weapon-normal-t4")).not.toHaveClass(
        /equipped/,
      );

      // Assert - Indicator should be visible
      await expect(page.locator("#no-weapon-equipped-indicator")).toBeVisible();

      markElementCovered("uncheck-equipped");
    });

    test("switching equipped weapon updates summary stats", async ({
      page,
    }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set up and equip Normal T4
      await page.locator("#level-normal-t4").fill("100");
      await page.locator("#equipped-label-normal-t4").click();
      await page.waitForTimeout(200);

      const initialEquipped = await page
        .locator("#equipped-weapon-attack-pct")
        .textContent();

      // Act - Set up and equip Rare T4
      await page.locator("#level-rare-t4").fill("50");
      await page.locator("#equipped-label-rare-t4").click();
      await page.waitForTimeout(200);

      const newEquipped = await page
        .locator("#equipped-weapon-attack-pct")
        .textContent();

      // Assert - Equipped stat should be different
      expect(newEquipped).not.toBe(initialEquipped);

      markElementCovered("switch-equipped-updates-stats");
    });

    test("changing level of equipped weapon updates display", async ({
      page,
    }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Set up and equip weapon
      await page.locator("#level-normal-t4").fill("50");
      await page.locator("#equipped-label-normal-t4").click();
      await page.waitForTimeout(200);

      const initialEquipped = await page
        .locator("#equipped-value-normal-t4")
        .textContent();

      // Act - Change level
      await page.locator("#level-normal-t4").fill("100");
      await page.waitForTimeout(300);

      const newEquipped = await page
        .locator("#equipped-value-normal-t4")
        .textContent();

      // Assert - Display should be updated
      expect(newEquipped).not.toBe(initialEquipped);

      markElementCovered("change-equipped-level");
    });
  });

  // =========================================================================
  // ELEMENT COVERAGE INVENTORY
  // =========================================================================

  test.describe("Element Coverage Inventory", () => {
    test("all sub-tab buttons are present and interactive", async ({
      page,
    }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Both sub-tab buttons should exist
      const buttons = page.locator("#weapon-levels-subtab-button");
      await expect(buttons).toHaveCount(2);

      // Assert - Should be able to click both
      await buttons.filter({ hasText: "Upgrade Priority" }).click();
      await page.waitForTimeout(200);
      await expect(
        page.locator("#weapon-levels-upgrade-priority"),
      ).toBeVisible();

      await buttons.filter({ hasText: "Weapons Grid" }).click();
      await page.waitForTimeout(200);
      await expect(page.locator("#weapon-levels-weapons-grid")).toBeVisible();

      markElementCovered("subtab-buttons");
    });

    test("summary stat elements exist and update", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - All summary stats should exist
      await expect(page.locator("#total-inventory-attack")).toBeVisible();
      await expect(page.locator("#equipped-weapon-attack-pct")).toBeVisible();
      await expect(page.locator("#total-weapon-attack")).toBeVisible();

      // Act - Set a weapon level
      await page.locator("#level-normal-t4").fill("50");
      await page.waitForTimeout(300);

      // Assert - All should have non-zero values
      await expect(page.locator("#total-inventory-attack")).not.toHaveText(
        "0%",
      );

      markElementCovered("summary-stats");
    });

    test("edge case weapon cards exist", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Key edge case cards should exist (Ancient T1 is not rendered)
      await expect(page.locator("#weapon-normal-t4")).toBeVisible();
      await expect(page.locator("#weapon-legendary-t4")).toBeVisible();
      await expect(page.locator("#weapon-ancient-t4")).toBeVisible();
      // Ancient T1 card is disabled and not rendered to DOM

      markElementCovered("edge-case-cards");
    });

    test("edge case star ratings exist", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Edge case stars should exist
      await expect(page.locator("#star-normal-t4-1")).toBeVisible();
      await expect(page.locator("#star-normal-t4-5")).toBeVisible();
      await expect(page.locator("#star-legendary-t4-1")).toBeVisible();
      await expect(page.locator("#star-ancient-t4-5")).toBeVisible();

      markElementCovered("edge-case-stars");
    });

    test("currency calculator elements exist", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Switch to priority tab
      await page
        .locator("#weapon-levels-subtab-button")
        .filter({ hasText: "Upgrade Priority" })
        .click();
      await page.waitForTimeout(500); // Increased wait for tab switch

      // Assert - All calculator elements should exist
      await expect(page.locator("#upgrade-currency-input")).toBeVisible();
      // The following elements might not be visible until currency is entered, but they should exist
      await expect(page.locator("#currency-attack-gain")).toBeAttached();
      await expect(page.locator("#currency-dps-gain")).toBeAttached();
      await expect(page.locator("#currency-upgrade-path")).toBeAttached();

      markElementCovered("currency-calculator-elements");
    });

    test("priority chain element exists", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Switch to priority tab
      await page
        .locator("#weapon-levels-subtab-button")
        .filter({ hasText: "Upgrade Priority" })
        .click();
      await page.waitForTimeout(500); // Increased wait for tab switch

      // Assert - Priority chain should exist
      await expect(page.locator("#upgrade-priority-chain")).toBeVisible();

      markElementCovered("priority-chain-element");
    });
  });

  // =========================================================================
  // RARITY-SPECIFIC BEHAVIORS
  // =========================================================================

  test.describe("Rarity-Specific Behaviors", () => {
    test("normal rare epic unique default to 5 stars", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Normal, Rare, Epic, Unique should start with 5 stars
      const raritiesToCheck = ["normal", "rare", "epic", "unique"];

      for (const rarity of raritiesToCheck) {
        await expect(page.locator(`#star-${rarity}-t4-5`)).toHaveClass(
          /active/,
        );
      }

      markElementCovered("default-5-stars-rarities");
    });

    test("legendary mystic ancient default to 1 star", async ({ page }) => {
      // Arrange
      await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
      await page.waitForTimeout(200);

      // Assert - Legendary, Mystic, Ancient should start with 1 star
      const raritiesToCheck = ["legendary", "mystic", "ancient"];

      for (const rarity of raritiesToCheck) {
        await expect(page.locator(`#star-${rarity}-t4-1`)).toHaveClass(
          /active/,
        );
        await expect(page.locator(`#star-${rarity}-t4-2`)).not.toHaveClass(
          /active/,
        );
      }

      markElementCovered("default-1-star-rarities");
    });
  });
});
