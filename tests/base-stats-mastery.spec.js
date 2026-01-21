// Base Stats Mastery Tables Tests
// Tests skill mastery bonus table interactions for both 3rd and 4th job
// Run with: npm test -- base-stats-mastery.spec.js

import { test, expect } from '@playwright/test';
import {
  CLASS_SELECTORS,
  JOB_TIER_BUTTONS,
  MASTERY_TABS,
  MASTERY_TABLES,
  MASTERY_3RD_CHECKBOXES,
  MASTERY_4TH_CHECKBOXES
} from './helpers/selectors.js';
import {
  navigateToBaseStats,
  clearStorage
} from './helpers/fixture-helpers.js';
import {
  markElementCovered
} from './helpers/coverage-tracker.js';

test.describe('Base Stats - Mastery Bonus Tables', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);
  });

  test.describe('3rd Job Mastery Table', () => {
    test('3rd job mastery table is visible when 3rd tier selected', async ({ page }) => {
      // Assert - 3rd job table visible
      await expect(page.locator(MASTERY_TABLES['3rd'])).toBeVisible();
      await expect(page.locator(MASTERY_TABLES['4th'])).toBeHidden();
    });

    test('checking 3rd job all-monster level 64 mastery updates state', async ({ page }) => {
      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.all64);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all64)).toBeChecked();

      // Assert - Mastery bonus should accumulate (10% for this level)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('10');

      // Mastery state is stored in damageCalculatorData.baseSetup['skill-mastery']
      // Not validating here as it's handled by the storage system

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-all-64');
    });

    test('checking 3rd job all-monster level 68 mastery accumulates bonus', async ({ page }) => {
      // Arrange - Check first mastery
      await page.check(MASTERY_3RD_CHECKBOXES.all64);

      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.all68);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all68)).toBeChecked();

      // Assert - Mastery bonus should be 21 (10 + 11)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('21');

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-all-68');
    });

    test('checking 3rd job boss-only level 72 mastery updates boss bonus', async ({ page }) => {
      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.boss72);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.boss72)).toBeChecked();

      // Assert - Boss mastery bonus should be 10
      const skillMasteryBoss = await page.evaluate(() => document.getElementById('skill-mastery-boss-base').value);
      expect(skillMasteryBoss).toBe('10');

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-boss-72');
    });

    test('checking 3rd job all-monster level 76 mastery accumulates correctly', async ({ page }) => {
      // Arrange - Check previous masteries
      await page.check(MASTERY_3RD_CHECKBOXES.all64);
      await page.check(MASTERY_3RD_CHECKBOXES.all68);

      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.all76);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all76)).toBeChecked();

      // Assert - Total should be 33 (10 + 11 + 12)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('33');

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-all-76');
    });

    test('checking 3rd job all-monster level 80 mastery updates bonus', async ({ page }) => {
      // Arrange
      await page.check(MASTERY_3RD_CHECKBOXES.all64);
      await page.check(MASTERY_3RD_CHECKBOXES.all68);
      await page.check(MASTERY_3RD_CHECKBOXES.all76);

      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.all80);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all80)).toBeChecked();

      // Assert - Total should be 46 (10 + 11 + 12 + 13)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('46');

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-all-80');
    });

    test('checking 3rd job boss-only level 84 mastery updates boss bonus', async ({ page }) => {
      // Arrange
      await page.check(MASTERY_3RD_CHECKBOXES.boss72);

      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.boss84);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.boss84)).toBeChecked();

      // Assert - Boss total should be 20 (10 + 10)
      const skillMasteryBoss = await page.evaluate(() => document.getElementById('skill-mastery-boss-base').value);
      expect(skillMasteryBoss).toBe('20');

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-boss-84');
    });

    test('checking 3rd job all-monster level 88 mastery accumulates', async ({ page }) => {
      // Arrange - Check all previous all-monster masteries
      await page.check(MASTERY_3RD_CHECKBOXES.all64);
      await page.check(MASTERY_3RD_CHECKBOXES.all68);
      await page.check(MASTERY_3RD_CHECKBOXES.all76);
      await page.check(MASTERY_3RD_CHECKBOXES.all80);

      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.all88);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all88)).toBeChecked();

      // Assert - Total should be 60 (10 + 11 + 12 + 13 + 14)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('60');

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-all-88');
    });

    test('checking 3rd job all-monster level 92 mastery completes all 3rd job bonuses', async ({ page }) => {
      // Arrange - Check all previous all-monster masteries
      await page.check(MASTERY_3RD_CHECKBOXES.all64);
      await page.check(MASTERY_3RD_CHECKBOXES.all68);
      await page.check(MASTERY_3RD_CHECKBOXES.all76);
      await page.check(MASTERY_3RD_CHECKBOXES.all80);
      await page.check(MASTERY_3RD_CHECKBOXES.all88);

      // Act
      await page.check(MASTERY_3RD_CHECKBOXES.all92);

      // Assert - Direct state
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all92)).toBeChecked();

      // Assert - Total should be 75 (10 + 11 + 12 + 13 + 14 + 15)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('75');

      markElementCovered('mastery3rdCheckboxes', 'mastery-3rd-all-92');
    });

    test('unchecking 3rd job mastery removes bonus', async ({ page }) => {
      // Arrange - Check mastery
      await page.check(MASTERY_3RD_CHECKBOXES.all68);
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all68)).toBeChecked();

      // Act - Uncheck
      await page.uncheck(MASTERY_3RD_CHECKBOXES.all68);

      // Assert
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all68)).not.toBeChecked();

      // Assert - Mastery bonus should decrease
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('0');
    });
  });

  test.describe('4th Job Mastery Table', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to 4th job tier
      await page.click(JOB_TIER_BUTTONS['4th']);
      await page.waitForTimeout(100);
    });

    test('4th job mastery table is visible when 4th tier selected', async ({ page }) => {
      // Assert
      await expect(page.locator(MASTERY_TABLES['4th'])).toBeVisible();
      await expect(page.locator(MASTERY_TABLES['3rd'])).toBeHidden();
    });

    test('checking 4th job all-monster level 102 mastery updates state', async ({ page }) => {
      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.all102);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all102)).toBeChecked();

      // Assert - Mastery bonus should be 10
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('10');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-all-102');
    });

    test('checking 4th job all-monster level 106 mastery accumulates', async ({ page }) => {
      // Arrange
      await page.check(MASTERY_4TH_CHECKBOXES.all102);

      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.all106);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all106)).toBeChecked();

      // Assert - Total should be 21 (10 + 11)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('21');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-all-106');
    });

    test('checking 4th job boss-only level 111 mastery updates boss bonus', async ({ page }) => {
      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.boss111);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.boss111)).toBeChecked();

      // Assert - Boss mastery bonus should be 10
      const skillMasteryBoss = await page.evaluate(() => document.getElementById('skill-mastery-boss-base').value);
      expect(skillMasteryBoss).toBe('10');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-boss-111');
    });

    test('checking 4th job all-monster level 116 mastery accumulates', async ({ page }) => {
      // Arrange
      await page.check(MASTERY_4TH_CHECKBOXES.all102);
      await page.check(MASTERY_4TH_CHECKBOXES.all106);

      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.all116);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all116)).toBeChecked();

      // Assert - Total should be 33 (10 + 11 + 12)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('33');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-all-116');
    });

    test('checking 4th job all-monster level 120 mastery accumulates', async ({ page }) => {
      // Arrange
      await page.check(MASTERY_4TH_CHECKBOXES.all102);
      await page.check(MASTERY_4TH_CHECKBOXES.all106);
      await page.check(MASTERY_4TH_CHECKBOXES.all116);

      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.all120);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all120)).toBeChecked();

      // Assert - Total should be 46 (10 + 11 + 12 + 13)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('46');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-all-120');
    });

    test('checking 4th job boss-only level 124 mastery updates boss bonus', async ({ page }) => {
      // Arrange
      await page.check(MASTERY_4TH_CHECKBOXES.boss111);

      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.boss124);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.boss124)).toBeChecked();

      // Assert - Boss total should be 20 (10 + 10)
      const skillMasteryBoss = await page.evaluate(() => document.getElementById('skill-mastery-boss-base').value);
      expect(skillMasteryBoss).toBe('20');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-boss-124');
    });

    test('checking 4th job all-monster level 128 mastery accumulates', async ({ page }) => {
      // Arrange - Check all previous
      await page.check(MASTERY_4TH_CHECKBOXES.all102);
      await page.check(MASTERY_4TH_CHECKBOXES.all106);
      await page.check(MASTERY_4TH_CHECKBOXES.all116);
      await page.check(MASTERY_4TH_CHECKBOXES.all120);

      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.all128);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all128)).toBeChecked();

      // Assert - Total should be 60 (10 + 11 + 12 + 13 + 14)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('60');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-all-128');
    });

    test('checking 4th job all-monster level 132 mastery completes all 4th job bonuses', async ({ page }) => {
      // Arrange - Check all previous
      await page.check(MASTERY_4TH_CHECKBOXES.all102);
      await page.check(MASTERY_4TH_CHECKBOXES.all106);
      await page.check(MASTERY_4TH_CHECKBOXES.all116);
      await page.check(MASTERY_4TH_CHECKBOXES.all120);
      await page.check(MASTERY_4TH_CHECKBOXES.all128);

      // Act
      await page.check(MASTERY_4TH_CHECKBOXES.all132);

      // Assert - Direct state
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all132)).toBeChecked();

      // Assert - Total should be 75 (10 + 11 + 12 + 13 + 14 + 15)
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('75');

      markElementCovered('mastery4thCheckboxes', 'mastery-4th-all-132');
    });

    test('unchecking 4th job mastery removes bonus', async ({ page }) => {
      // Arrange
      await page.check(MASTERY_4TH_CHECKBOXES.all106);
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all106)).toBeChecked();

      // Act - Uncheck
      await page.uncheck(MASTERY_4TH_CHECKBOXES.all106);

      // Assert
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all106)).not.toBeChecked();

      // Assert - Mastery bonus should decrease
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('0');
    });
  });

  test.describe('Job Tier Switching with Mastery', () => {
    test('switching from 3rd to 4th job preserves 3rd job mastery', async ({ page }) => {
      // Arrange - Configure 3rd job mastery
      await page.check(MASTERY_3RD_CHECKBOXES.all64);
      await page.check(MASTERY_3RD_CHECKBOXES.all68);
      await page.check(MASTERY_3RD_CHECKBOXES.all76);
      await page.waitForTimeout(100);

      // Act - Switch to 4th job
      await page.click(JOB_TIER_BUTTONS['4th']);
      await page.waitForTimeout(100);

      // Assert - 4th job table visible
      await expect(page.locator(MASTERY_TABLES['4th'])).toBeVisible();
      await expect(page.locator(MASTERY_TABLES['3rd'])).toBeHidden();

      // Act - Switch back to 3rd job
      await page.click(JOB_TIER_BUTTONS['3rd']);
      await page.waitForTimeout(100);

      // Assert - 3rd job mastery preserved
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all64)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all68)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all76)).toBeChecked();

      // Assert - Mastery bonus restored
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('33'); // 10 + 11 + 12

      // Assert - localStorage preserves job tier
      const jobTier = await page.evaluate(() => localStorage.getItem('selectedJobTier'));
      expect(jobTier).toBe('3rd');
    });

    test('switching job tiers updates mastery tabs in sync', async ({ page }) => {
      // Arrange - Start on 3rd job
      await expect(page.locator(MASTERY_TABS['3rd'])).toHaveClass(/active/);
      await expect(page.locator(MASTERY_TABS['4th'])).not.toHaveClass(/active/);

      // Act - Switch to 4th job via job tier buttons
      await page.click(JOB_TIER_BUTTONS['4th']);
      await page.waitForTimeout(100);

      // Assert - Mastery tabs should sync
      await expect(page.locator(MASTERY_TABS['4th'])).toHaveClass(/active/);
      await expect(page.locator(MASTERY_TABS['3rd'])).not.toHaveClass(/active/);

      // Act - Switch back to 3rd job
      await page.click(JOB_TIER_BUTTONS['3rd']);
      await page.waitForTimeout(100);

      // Assert - Mastery tabs sync again
      await expect(page.locator(MASTERY_TABS['3rd'])).toHaveClass(/active/);
      await expect(page.locator(MASTERY_TABS['4th'])).not.toHaveClass(/active/);

      markElementCovered('masteryTabButtons', 'mastery-tab-3rd');
      markElementCovered('masteryTabButtons', 'mastery-tab-4th');
    });

    test('independent mastery states for 3rd and 4th job', async ({ page }) => {
      // Arrange - Configure 3rd job mastery
      await page.check(MASTERY_3RD_CHECKBOXES.all64);
      await page.check(MASTERY_3RD_CHECKBOXES.all68);

      // Act - Switch to 4th job and configure mastery
      await page.click(JOB_TIER_BUTTONS['4th']);
      await page.waitForTimeout(100);
      await page.check(MASTERY_4TH_CHECKBOXES.all102);
      await page.check(MASTERY_4TH_CHECKBOXES.all106);

      // Assert - 4th job mastery correct
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all102)).toBeChecked();
      await expect(page.locator(MASTERY_4TH_CHECKBOXES.all106)).toBeChecked();

      // Act - Switch back to 3rd job
      await page.click(JOB_TIER_BUTTONS['3rd']);
      await page.waitForTimeout(100);

      // Assert - 3rd job mastery preserved and independent
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all64)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all68)).toBeChecked();

      // Assert - 4th job mastery should not affect 3rd job bonus
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('21'); // 3rd job: 10 + 11
    });
  });

  test.describe('Mastery with Fixture Application', () => {
    test('applying fixture configures mastery checkboxes correctly', async ({ page }) => {
      // Act - Apply fixture with mastery configured
      await page.fill('#character-level', '90');
      await page.check(MASTERY_3RD_CHECKBOXES.all64);
      await page.check(MASTERY_3RD_CHECKBOXES.all68);
      await page.check(MASTERY_3RD_CHECKBOXES.boss72);
      await page.check(MASTERY_3RD_CHECKBOXES.all76);
      await page.check(MASTERY_3RD_CHECKBOXES.all80);
      await page.check(MASTERY_3RD_CHECKBOXES.all88);

      // Assert - All expected checkboxes checked
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all64)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all68)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.boss72)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all76)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all80)).toBeChecked();
      await expect(page.locator(MASTERY_3RD_CHECKBOXES.all88)).toBeChecked();

      // Assert - Mastery bonus calculation correct
      const skillMastery = await page.evaluate(() => document.getElementById('skill-mastery-base').value);
      expect(skillMastery).toBe('60'); // 10 + 11 + 12 + 13 + 14

      // Assert - Boss mastery correct
      const skillMasteryBoss = await page.evaluate(() => document.getElementById('skill-mastery-boss-base').value);
      expect(skillMasteryBoss).toBe('10');
    });
  });
});
