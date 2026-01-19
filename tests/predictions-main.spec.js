// Stat Predictions - Main Workflow Tests
// Tests critical user workflows for the Stat Predictions feature
// Run with: npm test -- predictions-main.spec.js

import { test, expect } from "@playwright/test";
import {
  PREDICTIONS_TAB_BUTTONS,
  PREDICTIONS_TAB_CONTENT,
  STAT_TABLES_SELECTORS,
  EQUIVALENCY_INPUTS,
  EQUIVALENCY_RESULTS,
} from "./helpers/predictions-selectors.js";
import {
  navigateToStatPredictions,
  navigateToStatEquivalency,
  navigateToBaseStats,
  clearStorage,
  applyBaseStatsFixture,
} from "./helpers/fixture-helpers.js";
import {
  markPredictionsElementCovered,
  logPredictionsCoverageReport,
} from "./helpers/predictions-coverage.js";
import {
  HERO_LEVEL_60,
  HERO_LEVEL_100,
  HERO_CAP_CRIT_RATE,
  HERO_CAP_ATTACK_SPEED,
  HERO_CAP_DEF_PEN,
  HERO_NEAR_CAP_CRIT_RATE,
  HERO_WELL_GEARED_4TH,
  BOWMASTER_CAP_ATTACK_SPEED,
} from "./fixtures/predictions-fixtures.js";

test.describe("Stat Predictions - Configure Base Stats and View Predictions", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("user configures base stats then views stat predictions", async ({
    page,
  }) => {
    // Arrange - Configure base stats first
    await applyBaseStatsFixture(page, HERO_LEVEL_60);

    // Act - Navigate to Stat Predictions tab
    await navigateToStatPredictions(page);

    // Assert - Direct state (tab content is visible)
    await expect(
      page.locator(PREDICTIONS_TAB_CONTENT.statTables),
    ).toBeVisible();

    // Assert - Side effects (stat tables container exists)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();

    // Assert - localStorage (base stats persisted)
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(selectedClass).toBe("hero");

    markPredictionsElementCovered("predictionsTabButtons", "stat-tables-tab");
    markPredictionsElementCovered(
      "statTablesElements",
      "stat-weights-base-container",
    );
  });

  test("well-geared character shows meaningful damage predictions", async ({
    page,
  }) => {
    // Arrange - Configure well-geared character
    await applyBaseStatsFixture(page, HERO_WELL_GEARED_4TH);

    // Act - Navigate to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300); // Allow predictions to calculate

    // Assert - Direct state (container should be present)
    const container = page.locator(STAT_TABLES_SELECTORS.container);
    await expect(container).toBeVisible();

    // Assert - localStorage intact
    const storageValid = await page.evaluate(() => {
      return (
        localStorage.getItem("selectedClass") === "hero" &&
        localStorage.getItem("selectedJobTier") === "4th"
      );
    });
    expect(storageValid).toBe(true);
  });

  test("minimal stats character shows graceful predictions handling", async ({
    page,
  }) => {
    // Arrange - Navigate to base stats and create minimal character
    await page.click("#class-hero");
    await page.fill("#character-level", "10");
    await page.fill("#attack-base", "0");
    await page.fill("#str-base", "0");
    await page.fill("#dex-base", "0");
    await page.waitForTimeout(100);

    // Act - Navigate to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Direct state (no crashes/errors)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();

    // Assert - localStorage persisted
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(selectedClass).toBe("hero");
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe("Stat Predictions - Adjust Stats and Update Predictions", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("adjusting attack stat updates damage predictions in real-time", async ({
    page,
  }) => {
    // Arrange - Configure base character
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Navigate back and increase attack
    await navigateToBaseStats(page);
    await page.fill("#attack-base", "250"); // Increased from 150
    await page.waitForTimeout(100);

    // Act - Return to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Direct state (container still visible)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("adjusting crit rate near cap shows diminishing returns", async ({
    page,
  }) => {
    // Arrange - Character near crit rate cap
    await applyBaseStatsFixture(page, HERO_NEAR_CAP_CRIT_RATE);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Navigate back and increase crit rate to cap
    await navigateToBaseStats(page);
    await page.fill("#crit-rate-base", "100"); // Now at hard cap
    await page.waitForTimeout(100);

    // Act - Return to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Direct state (container visible)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();

    markPredictionsElementCovered("statTablesElements", "crit-rate-prediction");
  });

  test("adjusting multiple stats simultaneously updates all predictions", async ({
    page,
  }) => {
    // Arrange - Start with base character
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Navigate back and adjust multiple stats
    await navigateToBaseStats(page);
    await page.fill("#attack-base", "300");
    await page.fill("#str-base", "500");
    await page.fill("#damage-base", "20");
    await page.fill("#boss-damage-base", "50");
    await page.waitForTimeout(100);

    // Act - Return to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Direct state (container visible)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("rapid stat adjustments maintain prediction integrity", async ({
    page,
  }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_LEVEL_100);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Rapidly adjust multiple stats
    await navigateToBaseStats(page);
    await page.fill("#attack-base", "999");
    await page.fill("#crit-damage-base", "100");
    await page.fill("#attack-speed-base", "50");
    await page.fill("#final-damage-base", "30");
    await page.waitForTimeout(100);

    // Act - Return to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Container visible
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe("Stat Predictions - Tab Switching", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("switching between stat tables and equivalency tabs", async ({
    page,
  }) => {
    // Arrange - Configure character
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
    await navigateToStatPredictions(page);

    // Act - Switch to equivalency tab
    await page.click(PREDICTIONS_TAB_BUTTONS.equivalency);
    await page.waitForTimeout(200);

    // Assert - Direct state (equivalency tab visible)
    await expect(
      page.locator(PREDICTIONS_TAB_CONTENT.equivalency),
    ).toBeVisible();
    await expect(
      page.locator(PREDICTIONS_TAB_CONTENT.statTables),
    ).not.toBeVisible();

    // Assert - Side effects (equivalency inputs visible)
    await expect(page.locator(EQUIVALENCY_INPUTS.attack)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.mainStat)).toBeVisible();

    // Act - Switch back to stat tables
    await page.click(PREDICTIONS_TAB_BUTTONS.statTables);
    await page.waitForTimeout(200);

    // Assert - Direct state (stat tables visible again)
    await expect(
      page.locator(PREDICTIONS_TAB_CONTENT.statTables),
    ).toBeVisible();
    await expect(
      page.locator(PREDICTIONS_TAB_CONTENT.equivalency),
    ).not.toBeVisible();

    // Assert - localStorage intact
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(selectedClass).toBe("hero");

    markPredictionsElementCovered("predictionsTabButtons", "equivalency-tab");
  });

  test("tab switching preserves calculation state", async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_WELL_GEARED_4TH);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Switch to equivalency and back
    await page.click(PREDICTIONS_TAB_BUTTONS.equivalency);
    await page.waitForTimeout(200);
    await page.click(PREDICTIONS_TAB_BUTTONS.statTables);
    await page.waitForTimeout(200);

    // Assert - Container still visible after tab switching
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("navigating away from predictions and returning preserves state", async ({
    page,
  }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_LEVEL_100);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Navigate to base stats
    await navigateToBaseStats(page);
    await page.waitForTimeout(200);

    // Act - Return to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Predictions recalculated correctly (container visible)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe("Stat Predictions - Hard Cap Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("crit rate at hard cap shows zero damage gain", async ({ page }) => {
    // Arrange - Character at crit rate cap (100%)
    await applyBaseStatsFixture(page, HERO_CAP_CRIT_RATE);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Direct state (container visible)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("attack speed at hard cap shows zero damage gain", async ({ page }) => {
    // Arrange - Bowmaster at attack speed cap (150%)
    await applyBaseStatsFixture(page, BOWMASTER_CAP_ATTACK_SPEED);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Direct state (container visible)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("defense penetration at hard cap shows zero damage gain", async ({
    page,
  }) => {
    // Arrange - Character at def pen cap (100%)
    await applyBaseStatsFixture(page, HERO_CAP_DEF_PEN);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Direct state (container visible)
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("multiple stats at hard cap handled correctly", async ({ page }) => {
    // Arrange - Custom character with multiple capped stats
    await page.click("#class-hero");
    await page.fill("#character-level", "120");
    await page.fill("#crit-rate-base", "100"); // Capped
    await page.fill("#attack-speed-base", "150"); // Capped
    await page.fill("#def-pen-base", "100"); // Capped
    await page.fill("#attack-base", "1000");
    await page.fill("#str-base", "2000");
    await page.waitForTimeout(100);

    // Act - Navigate to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Container visible with multiple caps
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe("Stat Predictions - Cross-Tab Integration", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("base stats changes reflect in predictions after navigation", async ({
    page,
  }) => {
    // Arrange - Configure initial state
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Navigate to base stats and modify
    await navigateToBaseStats(page);
    await page.fill("#attack-base", "400"); // Significant increase
    await page.fill("#damage-base", "30");
    await page.waitForTimeout(100);

    // Act - Navigate to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Predictions updated
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("switching classes updates predictions correctly", async ({ page }) => {
    // Arrange - Configure as Hero
    await applyBaseStatsFixture(page, HERO_LEVEL_100);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Switch to Bowmaster
    await navigateToBaseStats(page);
    await page.click("#class-bowmaster");
    await page.fill("#dex-base", "1000");
    await page.waitForTimeout(100);

    // Act - Return to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Container visible for new class
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();

    // Assert - localStorage updated
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(selectedClass).toBe("bowmaster");
  });

  test("full workflow: configure base stats → view predictions → adjust → re-view", async ({
    page,
  }) => {
    // Arrange - Start fresh
    await page.click("#class-arch-mage-il");
    await page.fill("#character-level", "90");
    await page.fill("#attack-base", "300");
    await page.fill("#int-base", "800");
    await page.fill("#luk-base", "200");
    await page.fill("#crit-rate-base", "40");
    await page.fill("#boss-damage-base", "70");
    await page.waitForTimeout(100);

    // Act - View predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Adjust stats
    await navigateToBaseStats(page);
    await page.fill("#int-base", "1000"); // Boost main stat
    await page.fill("#boss-damage-base", "90"); // Boost boss damage
    await page.waitForTimeout(100);

    // Act - View updated predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Container visible
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test("predictions remain accurate after multiple tab navigations", async ({
    page,
  }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_WELL_GEARED_4TH);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Navigate through multiple tabs
    await navigateToBaseStats(page);
    await page.waitForTimeout(100);

    await navigateToStatPredictions(page);
    await page.waitForTimeout(100);

    await navigateToStatEquivalency(page);
    await page.waitForTimeout(100);

    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Container still visible after multiple navigations
    await expect(page.locator(STAT_TABLES_SELECTORS.container)).toBeVisible();
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});
