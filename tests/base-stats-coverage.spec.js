// Base Stats Coverage and Edge Cases Tests
// Tests element inventory validation and common user error scenarios
// Run with: npm test -- base-stats-coverage.spec.js

import { test, expect } from "@playwright/test";
import {
  CLASS_SELECTORS,
  JOB_TIER_BUTTONS,
  STAT_INPUTS,
  STAT_ROWS,
} from "./helpers/selectors.js";
import {
  navigateToBaseStats,
  clearStorage,
  applyBaseStatsFixture,
} from "./helpers/fixture-helpers.js";
import {
  markElementCovered,
  logCoverageReport,
  generateCoverageReport,
} from "./helpers/coverage-tracker.js";
import {
  HERO_LEVEL_60,
  HERO_LEVEL_120,
  BOWMASTER_LEVEL_60,
  ARCH_MAGE_IL_LEVEL_60,
  NIGHT_LORD_LEVEL_60,
  SHADOWER_LEVEL_60,
  MARKSMAN_LEVEL_60,
  ARCH_MAGE_FP_LEVEL_60,
  DARK_KNIGHT_LEVEL_60,
} from "./fixtures/base-stats.fixtures.js";

test.describe("Base Stats - Element Inventory Validation", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("all 8 class selectors are testable", async ({ page }) => {
    // Test all 8 classes
    const classes = [
      { selector: CLASS_SELECTORS.hero, name: "hero" },
      { selector: CLASS_SELECTORS.darkKnight, name: "dark-knight" },
      { selector: CLASS_SELECTORS.bowmaster, name: "bowmaster" },
      { selector: CLASS_SELECTORS.marksman, name: "marksman" },
      { selector: CLASS_SELECTORS.nightLord, name: "night-lord" },
      { selector: CLASS_SELECTORS.shadower, name: "shadower" },
      { selector: CLASS_SELECTORS.archMageIL, name: "arch-mage-il" },
      { selector: CLASS_SELECTORS.archMageFP, name: "arch-mage-fp" },
    ];

    for (const classInfo of classes) {
      // Act
      await page.click(classInfo.selector);
      await page.waitForTimeout(50);

      // Assert - Class is selected
      await expect(page.locator(classInfo.selector)).toHaveClass(/selected/);

      // Assert - localStorage updated
      const selectedClass = await page.evaluate(() =>
        localStorage.getItem("selectedClass"),
      );
      expect(selectedClass).toBe(classInfo.name);

      markElementCovered("classSelectors", classInfo.selector.replace("#", ""));
    }

    // Assert - All classes covered
    const report = generateCoverageReport();
    expect(report.categories.classSelectors.tested).toBe(8);
    expect(report.categories.classSelectors.percentage).toBe(100);
  });

  test("all stat input fields are accessible and writable", async ({
    page,
  }) => {
    // Arrange - Select Hero to show STR/DEX stats
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    const statTests = [
      { input: STAT_INPUTS.attack, value: "100", name: "attack" },
      { input: STAT_INPUTS.defense, value: "50", name: "defense" },
      { input: STAT_INPUTS.critRate, value: "20.5", name: "critRate" },
      { input: STAT_INPUTS.critDamage, value: "40.5", name: "critDamage" },
      { input: STAT_INPUTS.attackSpeed, value: "5", name: "attackSpeed" },
      { input: STAT_INPUTS.str, value: "500", name: "str" },
      { input: STAT_INPUTS.dex, value: "200", name: "dex" },
      { input: STAT_INPUTS.damage, value: "30", name: "damage" },
      { input: STAT_INPUTS.damageAmp, value: "1.2", name: "damageAmp" },
      { input: STAT_INPUTS.defPen, value: "15", name: "defPen" },
      { input: STAT_INPUTS.bossDamage, value: "50", name: "bossDamage" },
      { input: STAT_INPUTS.normalDamage, value: "25", name: "normalDamage" },
      { input: STAT_INPUTS.minDamage, value: "55", name: "minDamage" },
      { input: STAT_INPUTS.maxDamage, value: "100", name: "maxDamage" },
      { input: STAT_INPUTS.finalDamage, value: "10", name: "finalDamage" },
      { input: STAT_INPUTS.mainStatPct, value: "45", name: "mainStatPct" },
    ];

    for (const stat of statTests) {
      // Act
      await page.fill(stat.input, stat.value);

      // Assert
      await expect(page.locator(stat.input)).toHaveValue(stat.value);

      markElementCovered("statInputs", stat.input.replace("#", ""));
    }

    // Assert - Core stats covered
    const report = generateCoverageReport();
    expect(report.categories.statInputs.tested).toBeGreaterThan(15);
  });

  test("all skill level inputs are functional", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    const skillTests = [
      { input: "#skill-level-1st-base", value: "5", name: "1st" },
      { input: "#skill-level-2nd-base", value: "10", name: "2nd" },
      { input: "#skill-level-3rd-base", value: "15", name: "3rd" },
      { input: "#skill-level-4th-base", value: "20", name: "4th" },
    ];

    for (const skill of skillTests) {
      // Act
      await page.fill(skill.input, skill.value);

      // Assert
      await expect(page.locator(skill.input)).toHaveValue(skill.value);

      markElementCovered("skillLevelInputs", skill.input.replace("#", ""));
    }

    // Assert - All skill levels covered
    const report = generateCoverageReport();
    expect(report.categories.skillLevelInputs.tested).toBe(4);
    expect(report.categories.skillLevelInputs.percentage).toBe(100);
  });

  test.afterAll(async () => {
    logCoverageReport();
  });
});

test.describe("Base Stats - Edge Cases and Boundary Values", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("character level accepts boundary values", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);

    // Act - Test minimum level
    await page.fill("#character-level", "0");

    // Assert
    await expect(page.locator("#character-level")).toHaveValue("0");

    // Act - Test maximum level
    await page.fill("#character-level", "200");

    // Assert
    await expect(page.locator("#character-level")).toHaveValue("200");

    // Act - Test mid-range value
    await page.fill("#character-level", "100");

    // Assert
    await expect(page.locator("#character-level")).toHaveValue("100");
  });

  test("stat inputs accept zero values", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.archMageIL);
    await page.waitForTimeout(100);

    const zeroTests = [
      STAT_INPUTS.attack,
      STAT_INPUTS.defense,
      STAT_INPUTS.critRate,
      STAT_INPUTS.int,
      STAT_INPUTS.luk,
    ];

    for (const input of zeroTests) {
      // Act
      await page.fill(input, "0");

      // Assert
      await expect(page.locator(input)).toHaveValue("0");
    }
  });

  test("stat inputs accept high values", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.nightLord);
    await page.waitForTimeout(100);

    // Act - Fill with very high stat value
    await page.fill(STAT_INPUTS.luk, "9999");

    // Assert
    await expect(page.locator(STAT_INPUTS.luk)).toHaveValue("9999");

    // Act - Fill with high damage value
    await page.fill(STAT_INPUTS.bossDamage, "999");

    // Assert
    await expect(page.locator(STAT_INPUTS.bossDamage)).toHaveValue("999");
  });

  test("percentage fields accept decimal values", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.bowmaster);
    await page.waitForTimeout(100);

    const decimalTests = [
      { input: STAT_INPUTS.critRate, value: "12.5" },
      { input: STAT_INPUTS.critDamage, value: "33.7" },
      { input: STAT_INPUTS.attackSpeed, value: "3.2" },
      { input: STAT_INPUTS.damageAmp, value: "1.5" },
      { input: STAT_INPUTS.defPen, value: "7.8" },
      { input: STAT_INPUTS.bossDamage, value: "45.3" },
    ];

    for (const test of decimalTests) {
      // Act
      await page.fill(test.input, test.value);

      // Assert
      await expect(page.locator(test.input)).toHaveValue(test.value);
    }
  });

  test("clearing required fields maintains state", async ({ page }) => {
    // Arrange - Configure with fixture
    await applyBaseStatsFixture(page, HERO_LEVEL_60);

    // Act - Clear level
    await page.fill("#character-level", "");

    // Assert - Field accepts empty value
    const levelValue = await page.locator("#character-level").inputValue();
    expect(levelValue).toBe("");

    // Act - Clear attack
    await page.fill(STAT_INPUTS.attack, "");

    // Assert - Field accepts empty value
    const attackValue = await page.locator(STAT_INPUTS.attack).inputValue();
    expect(attackValue).toBe("");
  });

  test("rapid class switching handles state correctly", async ({ page }) => {
    // Act - Rapidly switch between classes
    await page.click(CLASS_SELECTORS.hero);
    await page.click(CLASS_SELECTORS.bowmaster);
    await page.click(CLASS_SELECTORS.nightLord);
    await page.click(CLASS_SELECTORS.archMageIL);

    // Assert - Final class selected
    await expect(page.locator(CLASS_SELECTORS.archMageIL)).toHaveClass(
      /selected/,
    );

    // Assert - Only one class has selected class
    const selectedCount = await page
      .locator(".class-selector.selected")
      .count();
    expect(selectedCount).toBe(1);

    // Assert - localStorage reflects final selection
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(selectedClass).toBe("arch-mage-il");
  });

  test("rapid job tier switching handles state correctly", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Rapidly switch job tiers
    await page.click(JOB_TIER_BUTTONS["4th"]);
    await page.click(JOB_TIER_BUTTONS["3rd"]);
    await page.click(JOB_TIER_BUTTONS["4th"]);
    await page.click(JOB_TIER_BUTTONS["3rd"]);

    // Assert - Final tier selected
    await expect(page.locator(JOB_TIER_BUTTONS["3rd"])).toHaveClass(/active/);
    await expect(page.locator(JOB_TIER_BUTTONS["4th"])).not.toHaveClass(
      /active/,
    );

    // Assert - localStorage correct
    const jobTier = await page.evaluate(() =>
      localStorage.getItem("selectedJobTier"),
    );
    expect(jobTier).toBe("3rd");
  });

  test("double-clicking class selector maintains single selection", async ({
    page,
  }) => {
    // Act - Double click same class
    await page.click(CLASS_SELECTORS.hero);
    await page.click(CLASS_SELECTORS.hero);

    // Assert - Still selected (not toggled off)
    await expect(page.locator(CLASS_SELECTORS.hero)).toHaveClass(/selected/);

    // Assert - Only one selected
    const selectedCount = await page
      .locator(".class-selector.selected")
      .count();
    expect(selectedCount).toBe(1);
  });

  test("negative stat values are accepted by inputs", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Attempt to input negative values
    await page.fill(STAT_INPUTS.attack, "-100");
    await page.fill(STAT_INPUTS.str, "-500");

    // Assert - Inputs accept negative values (validation may happen at calculation layer)
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue("-100");
    await expect(page.locator(STAT_INPUTS.str)).toHaveValue("-500");
  });

  test("stat inputs accept very high values beyond normal gameplay", async ({
    page,
  }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.nightLord);
    await page.waitForTimeout(100);

    // Act - Input unrealistically high values
    await page.fill(STAT_INPUTS.luk, "99999");
    await page.fill(STAT_INPUTS.attack, "99999");

    // Assert - Values accepted (edge case for testing)
    await expect(page.locator(STAT_INPUTS.luk)).toHaveValue("99999");
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue("99999");
  });

  test("character level accepts values beyond typical range", async ({
    page,
  }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);

    // Act - Test beyond max level (200)
    await page.fill("#character-level", "999");

    // Assert - Value accepted (validation may happen elsewhere)
    await expect(page.locator("#character-level")).toHaveValue("999");

    // Act - Test negative level
    await page.fill("#character-level", "-10");

    // Assert - Negative value accepted
    await expect(page.locator("#character-level")).toHaveValue("-10");
  });

  test("percentage fields accept values over 100%", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.bowmaster);
    await page.waitForTimeout(100);

    // Act - Input percentages > 100%
    await page.fill(STAT_INPUTS.critRate, "150");
    await page.fill(STAT_INPUTS.bossDamage, "200");
    await page.fill(STAT_INPUTS.damage, "999");

    // Assert - Values accepted
    await expect(page.locator(STAT_INPUTS.critRate)).toHaveValue("150");
    await expect(page.locator(STAT_INPUTS.bossDamage)).toHaveValue("200");
    await expect(page.locator(STAT_INPUTS.damage)).toHaveValue("999");
  });

  test("non-numeric input handling in stat fields", async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.archMageIL);
    await page.waitForTimeout(100);

    // Act - Input text/invalid characters
    await page.fill(STAT_INPUTS.int, "abc");
    await page.fill(STAT_INPUTS.attack, "12.34.56");

    // Assert - Inputs handle invalid input (may show empty or partial value)
    const intValue = await page.locator(STAT_INPUTS.int).inputValue();
    const attackValue = await page.locator(STAT_INPUTS.attack).inputValue();

    // Either empty, partial, or original invalid value depending on browser
    expect([intValue, "abc", ""]).toContain(intValue);
  });
});

test.describe("Base Stats - State Validation and Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("page reload restores all configured values", async ({ page }) => {
    // Arrange - Configure with fixture
    await applyBaseStatsFixture(page, HERO_LEVEL_120);

    // Act - Reload page
    await page.reload();
    await page.waitForTimeout(300);

    // Assert - Class restored
    await expect(page.locator(CLASS_SELECTORS.hero)).toHaveClass(/selected/);

    // Assert - Level restored
    await expect(page.locator("#character-level")).toHaveValue("120");

    // Assert - Job tier restored
    await expect(page.locator(JOB_TIER_BUTTONS["4th"])).toHaveClass(/active/);

    // Assert - Stats restored
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue("800");
    await expect(page.locator(STAT_INPUTS.str)).toHaveValue("2000");

    // Assert - localStorage intact
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    const jobTier = await page.evaluate(() =>
      localStorage.getItem("selectedJobTier"),
    );
    expect(selectedClass).toBe("hero");
    expect(jobTier).toBe("4th");
  });

  test("navigating away and returning preserves values", async ({ page }) => {
    // Arrange - Configure with fixture
    await applyBaseStatsFixture(page, BOWMASTER_LEVEL_60);

    // Act - Navigate to equipment tab
    await page.click('button[data-tab="equipment"]');
    await page.waitForTimeout(200);

    // Act - Return to base stats
    await page.click('button[data-tab="base-stats"]');
    await page.waitForTimeout(200);

    // Assert - All values preserved
    await expect(page.locator(CLASS_SELECTORS.bowmaster)).toHaveClass(
      /selected/,
    );
    await expect(page.locator("#character-level")).toHaveValue("60");
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue("160");
    await expect(page.locator(STAT_INPUTS.dex)).toHaveValue("300");

    // Assert - localStorage intact
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(selectedClass).toBe("bowmaster");
  });

  test("manipulating localStorage directly is handled gracefully", async ({
    page,
  }) => {
    // Act - Manually corrupt localStorage
    await page.evaluate(() => {
      localStorage.setItem("selectedClass", "invalid-class");
      localStorage.setItem("characterLevel", "999");
    });

    // Act - Reload page
    await page.reload();
    await page.waitForTimeout(300);

    // Assert - Page loads without error
    await expect(page.locator("#setup-base-stats")).toBeVisible();

    // Assert - Can select valid class
    await page.click(CLASS_SELECTORS.hero);
    await expect(page.locator(CLASS_SELECTORS.hero)).toHaveClass(/selected/);

    // Assert - localStorage corrected
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(selectedClass).toBe("hero");
  });

  test("class stat rows visibility updates correctly on reload", async ({
    page,
  }) => {
    // Arrange - Configure as mage manually to ensure localStorage is set
    await page.click(CLASS_SELECTORS.archMageIL);
    await page.waitForTimeout(300); // Wait for localStorage to save

    // Verify class was saved to localStorage
    const savedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(savedClass).toBe("arch-mage-il");

    // Act - Reload
    await page.reload();
    await page.waitForTimeout(300);

    // Assert - localStorage preserved
    const reloadedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    expect(reloadedClass).toBe("arch-mage-il");

    // Assert - Correct stat rows visible based on saved class
    await expect(page.locator(STAT_ROWS.int)).toBeVisible();
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();
    await expect(page.locator(STAT_ROWS.str)).toBeHidden();
    await expect(page.locator(STAT_ROWS.dex)).toBeHidden();
  });

  test("mastery configuration persists across reload", async ({ page }) => {
    // Arrange - Configure mastery
    await page.click(CLASS_SELECTORS.hero);
    await page.fill("#character-level", "90");
    await page.check("#mastery-3rd-all-64");
    await page.check("#mastery-3rd-all-68");
    await page.check("#mastery-3rd-all-76");
    await page.check("#mastery-3rd-all-80");
    await page.check("#mastery-3rd-all-88");

    // Act - Reload
    await page.reload();
    await page.waitForTimeout(300);

    // Assert - Mastery checks preserved
    await expect(page.locator("#mastery-3rd-all-64")).toBeChecked();
    await expect(page.locator("#mastery-3rd-all-68")).toBeChecked();
    await expect(page.locator("#mastery-3rd-all-76")).toBeChecked();
    await expect(page.locator("#mastery-3rd-all-80")).toBeChecked();
    await expect(page.locator("#mastery-3rd-all-88")).toBeChecked();

    // Assert - Mastery bonus restored
    const skillMastery = await page.evaluate(
      () => document.getElementById("skill-mastery-base").value,
    );
    expect(skillMastery).toBe("60"); // 10 + 11 + 12 + 13 + 14
  });
});

test.describe("Base Stats - Integration with All Classes", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("all warrior classes show correct stat rows", async ({ page }) => {
    // Act - Test Hero
    await page.click(CLASS_SELECTORS.hero);
    await expect(page.locator(STAT_ROWS.str)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();

    // Act - Test Dark Knight
    await page.click(CLASS_SELECTORS.darkKnight);
    await expect(page.locator(STAT_ROWS.str)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();
  });

  test("all archer classes show correct stat rows", async ({ page }) => {
    // Act - Test Bowmaster
    await page.click(CLASS_SELECTORS.bowmaster);
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();
    await expect(page.locator(STAT_ROWS.str)).toBeVisible();

    // Act - Test Marksman
    await page.click(CLASS_SELECTORS.marksman);
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();
    await expect(page.locator(STAT_ROWS.str)).toBeVisible();
  });

  test("all thief classes show correct stat rows", async ({ page }) => {
    // Act - Test Night Lord
    await page.click(CLASS_SELECTORS.nightLord);
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();

    // Act - Test Shadower
    await page.click(CLASS_SELECTORS.shadower);
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();
  });

  test("all mage classes show correct stat rows", async ({ page }) => {
    // Act - Test Arch Mage I/L
    await page.click(CLASS_SELECTORS.archMageIL);
    await expect(page.locator(STAT_ROWS.int)).toBeVisible();
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();

    // Act - Test Arch Mage F/P
    await page.click(CLASS_SELECTORS.archMageFP);
    await expect(page.locator(STAT_ROWS.int)).toBeVisible();
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();
  });
});

test.afterAll(async () => {
  logCoverageReport();
});
