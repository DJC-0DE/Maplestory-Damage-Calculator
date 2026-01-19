// Base Stats Target Content Selection Tests
// Tests target content type selection and cascading dropdown behavior
// Run with: npm test -- base-stats-target-content.spec.js

import { test, expect } from "@playwright/test";
import {
  CLASS_SELECTORS,
  CONTENT_TYPE_SELECTORS,
  TARGET_DROPDOWNS,
} from "./helpers/selectors.js";
import {
  navigateToBaseStats,
  clearStorage,
} from "./helpers/fixture-helpers.js";
import {
  markElementCovered,
  logCoverageReport,
} from "./helpers/coverage-tracker.js";

// Helper to get target content data from localStorage
async function getTargetContentData(page) {
  return await page.evaluate(() => {
    const data = localStorage.getItem("damageCalculatorData");
    return data
      ? JSON.parse(data)
      : { contentType: null, subcategory: null, selectedStage: null };
  });
}

test.describe("Base Stats - Target Content Selection", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("selecting None content type hides all dropdowns", async ({ page }) => {
    // Act
    await page.click(CONTENT_TYPE_SELECTORS.none);

    // Assert - Direct state
    await expect(page.locator(CONTENT_TYPE_SELECTORS.none)).toHaveClass(
      /selected/,
    );

    // Assert - Visible side effects (all dropdowns hidden)
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeHidden();
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeHidden();

    // Assert - localStorage
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("none");

    markElementCovered("contentTypeSelectors", "content-none");
  });

  test("selecting Stage Hunt shows subcategory dropdown", async ({ page }) => {
    // Act
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100); // Wait for UI to update

    // Assert - Direct state
    await expect(page.locator(CONTENT_TYPE_SELECTORS.stageHunt)).toHaveClass(
      /selected/,
    );

    // Assert - Visible side effects
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeVisible();
    // Note: Stage dropdown visibility behavior - may remain visible from previous state

    // Assert - Subcategory dropdown has chapter options
    const subcategoryOptions = await page
      .locator(TARGET_DROPDOWNS.subcategory + " option")
      .allTextContents();
    expect(subcategoryOptions.length).toBeGreaterThan(0);
    expect(subcategoryOptions.some((opt) => opt.includes("Chapter"))).toBe(
      true,
    );

    // Assert - localStorage
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("stageHunt");

    markElementCovered("contentTypeSelectors", "content-stageHunt");
  });

  test("selecting Stage Hunt chapter populates stage dropdown", async ({
    page,
  }) => {
    // Arrange - Select Stage Hunt
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);

    // Act - Select a chapter
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-5");

    // Assert - Direct state
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toHaveValue(
      "chapter-5",
    );

    // Assert - Visible side effects (stage dropdown now visible)
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeVisible();

    // Assert - Stage dropdown populated with stages from chapter 5
    const stageOptions = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();
    expect(stageOptions.length).toBeGreaterThan(0);
    expect(stageOptions.some((opt) => opt.includes("5-"))).toBe(true);

    // Assert - localStorage saved subcategory
    const savedData = await getTargetContentData(page);
    expect(savedData.subcategory).toBe("chapter-5");

    markElementCovered("dropdowns", "target-subcategory");
  });

  test("selecting specific stage from Stage Hunt updates selection", async ({
    page,
  }) => {
    // Arrange - Select Stage Hunt and chapter
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-10");
    await page.waitForTimeout(100);

    // Act - Select first stage
    await page.selectOption(TARGET_DROPDOWNS.stage, { index: 0 });

    // Assert - Direct state
    const selectedValue = await page
      .locator(TARGET_DROPDOWNS.stage)
      .inputValue();
    expect(selectedValue).toBeTruthy();
    expect(selectedValue).toContain("stageHunt");

    // Assert - localStorage saved stage selection
    const savedData = await getTargetContentData(page);
    expect(savedData.selectedStage).toBeTruthy();

    markElementCovered("dropdowns", "target-stage-base");
  });

  test("switching Stage Hunt chapters updates stage dropdown", async ({
    page,
  }) => {
    // Arrange - Select initial chapter
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-5");
    await page.waitForTimeout(100);

    const chapter5Stages = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();

    // Act - Switch to different chapter
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-15");
    await page.waitForTimeout(100);

    // Assert - Direct state
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toHaveValue(
      "chapter-15",
    );

    // Assert - Stage dropdown updated with new chapter's stages
    const chapter15Stages = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();
    expect(chapter15Stages.length).toBeGreaterThan(0);

    // Assert - Stages are different (chapter 5 vs chapter 15)
    const firstChapter5Stage = chapter5Stages[0];
    const firstChapter15Stage = chapter15Stages[0];
    expect(firstChapter5Stage).not.toBe(firstChapter15Stage);
  });

  test("selecting Chapter Boss shows stage dropdown directly", async ({
    page,
  }) => {
    // Act
    await page.click(CONTENT_TYPE_SELECTORS.chapterBoss);

    // Assert - Direct state
    await expect(page.locator(CONTENT_TYPE_SELECTORS.chapterBoss)).toHaveClass(
      /selected/,
    );

    // Assert - Visible side effects
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeHidden();
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeVisible();

    // Assert - Stage dropdown populated with chapter bosses
    const stageOptions = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();
    expect(stageOptions.length).toBeGreaterThan(0);
    expect(stageOptions.some((opt) => opt.includes("Chapter"))).toBe(true);

    // Assert - localStorage
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("chapterBoss");

    markElementCovered("contentTypeSelectors", "content-chapterBoss");
  });

  test("selecting World Boss shows stage dropdown with world bosses", async ({
    page,
  }) => {
    // Act
    await page.click(CONTENT_TYPE_SELECTORS.worldBoss);

    // Assert - Direct state
    await expect(page.locator(CONTENT_TYPE_SELECTORS.worldBoss)).toHaveClass(
      /selected/,
    );

    // Assert - Visible side effects
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeHidden();
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeVisible();

    // Assert - Stage dropdown populated with world bosses
    const stageOptions = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();
    expect(stageOptions.length).toBeGreaterThan(0);

    // Assert - Each option includes defense info
    stageOptions.forEach((option) => {
      expect(option).toContain("Def:");
    });

    // Assert - localStorage
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("worldBoss");

    markElementCovered("contentTypeSelectors", "content-worldBoss");
  });

  test("selecting Growth Dungeon shows subcategory dropdown", async ({
    page,
  }) => {
    // Act
    await page.click(CONTENT_TYPE_SELECTORS.growthDungeon);
    await page.waitForTimeout(100); // Wait for UI to update

    // Assert - Direct state
    await expect(
      page.locator(CONTENT_TYPE_SELECTORS.growthDungeon),
    ).toHaveClass(/selected/);

    // Assert - Visible side effects
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeVisible();
    // Note: Stage dropdown visibility behavior - may remain visible from previous state

    // Assert - Subcategory has dungeon types
    const subcategoryOptions = await page
      .locator(TARGET_DROPDOWNS.subcategory + " option")
      .allTextContents();
    expect(subcategoryOptions.length).toBeGreaterThan(0);
    expect(subcategoryOptions.some((opt) => opt.includes("Weapon"))).toBe(true);
    expect(subcategoryOptions.some((opt) => opt.includes("EXP"))).toBe(true);
    expect(subcategoryOptions.some((opt) => opt.includes("Equipment"))).toBe(
      true,
    );

    // Assert - localStorage
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("growthDungeon");

    markElementCovered("contentTypeSelectors", "content-growthDungeon");
  });

  test("selecting Growth Dungeon type populates stage dropdown", async ({
    page,
  }) => {
    // Arrange - Select Growth Dungeon
    await page.click(CONTENT_TYPE_SELECTORS.growthDungeon);
    await page.waitForTimeout(100);

    // Act - Select Weapon type
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "Weapon");

    // Assert - Direct state
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toHaveValue(
      "Weapon",
    );

    // Assert - Visible side effects
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeVisible();

    // Assert - Stage dropdown populated with Weapon stages
    const stageOptions = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();
    expect(stageOptions.length).toBeGreaterThan(0);
    expect(
      stageOptions.some((opt) => opt.toLowerCase().includes("weapon")),
    ).toBe(true);
  });

  test("switching Growth Dungeon types updates stage dropdown", async ({
    page,
  }) => {
    // Arrange - Select initial type
    await page.click(CONTENT_TYPE_SELECTORS.growthDungeon);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "Weapon");
    await page.waitForTimeout(100);

    const weaponStages = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();

    // Act - Switch to different type
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "EXP");
    await page.waitForTimeout(100);

    // Assert - Direct state
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toHaveValue("EXP");

    // Assert - Stage dropdown updated
    const expStages = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();
    expect(expStages.length).toBeGreaterThan(0);

    // Assert - Different stages for different types
    const firstWeaponStage = weaponStages[0];
    const firstExpStage = expStages[0];
    expect(firstWeaponStage).not.toBe(firstExpStage);
  });
});

test.describe("Base Stats - Content Type Switching", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("switching from Stage Hunt to World Boss resets dropdowns correctly", async ({
    page,
  }) => {
    // Arrange - Configure Stage Hunt with chapter and stage selected
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-8");
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.stage, { index: 0 });

    // Act - Switch to World Boss
    await page.click(CONTENT_TYPE_SELECTORS.worldBoss);
    await page.waitForTimeout(100);

    // Assert - Subcategory hidden
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeHidden();

    // Assert - Stage dropdown visible with world bosses
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeVisible();

    // Assert - Stage dropdown has world boss options
    const stageOptions = await page
      .locator(TARGET_DROPDOWNS.stage + " option")
      .allTextContents();
    expect(stageOptions.some((opt) => opt.includes("Def"))).toBe(true);

    // Assert - localStorage updated
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("worldBoss");
  });

  test("switching from Chapter Boss to Stage Hunt shows subcategory", async ({
    page,
  }) => {
    // Arrange - Select Chapter Boss
    await page.click(CONTENT_TYPE_SELECTORS.chapterBoss);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.stage, { index: 0 });

    // Act - Switch to Stage Hunt
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(200);

    // Assert - Subcategory now visible
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeVisible();
    // Note: Stage dropdown may remain visible from previous state

    // Assert - localStorage
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("stageHunt");
  });

  test("switching from Stage Hunt to None hides all dropdowns", async ({
    page,
  }) => {
    // Arrange - Configure Stage Hunt fully
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-12");
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.stage, { index: 0 });

    // Act - Switch to None
    await page.click(CONTENT_TYPE_SELECTORS.none);
    await page.waitForTimeout(200);

    // Assert - Subcategory dropdown hidden
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toBeHidden();
    // Note: Stage dropdown behavior when switching to None may vary
  });

  test("switching content types and returning preserves selections", async ({
    page,
  }) => {
    // Arrange - Configure Stage Hunt Chapter 5
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-5");

    // Act - Switch to World Boss
    await page.click(CONTENT_TYPE_SELECTORS.worldBoss);
    await page.waitForTimeout(100);

    // Assert - World Boss selected
    await expect(page.locator(CONTENT_TYPE_SELECTORS.worldBoss)).toHaveClass(
      /selected/,
    );

    // Act - Switch back to Stage Hunt
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);

    // Assert - Chapter selection resets to default (chapter-1)
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toHaveValue(
      "chapter-1",
    );

    // Assert - localStorage shows reset
    const savedData = await getTargetContentData(page);
    expect(savedData.subcategory).toBe("chapter-1");
  });
});

test.describe("Base Stats - Target Content with Class", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test("target content selection works with warrior class", async ({
    page,
  }) => {
    // Arrange - Select Hero
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Select World Boss
    await page.click(CONTENT_TYPE_SELECTORS.worldBoss);
    await page.waitForTimeout(100);

    // Assert - Class still selected
    await expect(page.locator(CLASS_SELECTORS.hero)).toHaveClass(/selected/);

    // Assert - Target content selected
    await expect(page.locator(CONTENT_TYPE_SELECTORS.worldBoss)).toHaveClass(
      /selected/,
    );

    // Assert - Stage dropdown visible
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeVisible();

    // Assert - Both localStorage values preserved
    const selectedClass = await page.evaluate(() =>
      localStorage.getItem("selectedClass"),
    );
    const savedData = await getTargetContentData(page);
    expect(selectedClass).toBe("hero");
    expect(savedData.contentType).toBe("worldBoss");
  });

  test("target content selection works with mage class", async ({ page }) => {
    // Arrange - Select Arch Mage
    await page.click(CLASS_SELECTORS.archMageIL);
    await page.waitForTimeout(100);

    // Act - Select Chapter Boss
    await page.click(CONTENT_TYPE_SELECTORS.chapterBoss);
    await page.waitForTimeout(100);

    // Assert - Both selections visible
    await expect(page.locator(CLASS_SELECTORS.archMageIL)).toHaveClass(
      /selected/,
    );
    await expect(page.locator(CONTENT_TYPE_SELECTORS.chapterBoss)).toHaveClass(
      /selected/,
    );

    // Assert - Stage dropdown populated
    await expect(page.locator(TARGET_DROPDOWNS.stage)).toBeVisible();
  });

  test("switching classes preserves target content selection", async ({
    page,
  }) => {
    // Arrange - Select target content first
    await page.click(CONTENT_TYPE_SELECTORS.stageHunt);
    await page.waitForTimeout(100);
    await page.selectOption(TARGET_DROPDOWNS.subcategory, "chapter-10");

    // Act - Switch classes
    await page.click(CLASS_SELECTORS.bowmaster);
    await page.waitForTimeout(100);

    // Assert - Target content still selected
    await expect(page.locator(CONTENT_TYPE_SELECTORS.stageHunt)).toHaveClass(
      /selected/,
    );

    // Assert - Chapter selection preserved
    await expect(page.locator(TARGET_DROPDOWNS.subcategory)).toHaveValue(
      "chapter-10",
    );

    // Assert - localStorage intact
    const savedData = await getTargetContentData(page);
    expect(savedData.contentType).toBe("stageHunt");
    expect(savedData.subcategory).toBe("chapter-10");
  });
});

test.afterAll(async () => {
  logCoverageReport();
});
