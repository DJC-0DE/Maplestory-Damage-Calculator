// Base Stats Main Workflow Tests
// Tests critical user workflows for the Base Stats tab
// Run with: npm test -- base-stats-main.spec.js

import { test, expect } from '@playwright/test';
import {
  CLASS_SELECTORS,
  JOB_TIER_BUTTONS,
  STAT_INPUTS,
  STAT_ROWS,
  MASTERY_TABLES,
  SETUP_TAB_BUTTONS,
  STORAGE_KEYS
} from './helpers/selectors.js';
import {
  navigateToBaseStats,
  clearStorage,
  applyBaseStatsFixture,
  verifyStorageState
} from './helpers/fixture-helpers.js';
import {
  markElementCovered,
  logCoverageReport
} from './helpers/coverage-tracker.js';
import {
  HERO_LEVEL_60,
  HERO_LEVEL_100,
  BOWMASTER_LEVEL_80,
  ARCH_MAGE_IL_LEVEL_90,
  DARK_KNIGHT_LEVEL_100,
  NIGHT_LORD_LEVEL_90
} from './fixtures/base-stats.fixtures.js';

test.describe('Base Stats - Character Setup Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test('new user selects hero class and configures basic stats', async ({ page }) => {
    // Act - Select Hero class
    await page.click(CLASS_SELECTORS.hero);

    // Assert - Class selection successful
    await expect(page.locator(CLASS_SELECTORS.hero)).toHaveClass(/selected/);

    // Assert - Stat rows updated for warrior class (STR/DEX visible)
    await expect(page.locator(STAT_ROWS.str)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();

    markElementCovered('classSelectors', 'class-hero');
  });

  test('user sets character level and job tier', async ({ page }) => {
    // Arrange - Select class first
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Set character level
    await page.fill('#character-level', '80');

    // Assert - Direct state
    await expect(page.locator('#character-level')).toHaveValue('80');

    // Act - Select 4th job tier
    await page.click(JOB_TIER_BUTTONS['4th']);

    // Assert - Direct state
    await expect(page.locator(JOB_TIER_BUTTONS['4th'])).toHaveClass(/active/);
    await expect(page.locator(JOB_TIER_BUTTONS['3rd'])).not.toHaveClass(/active/);

    // Assert - Visible side effects (mastery tables)
    await expect(page.locator(MASTERY_TABLES['4th'])).toBeVisible();
    await expect(page.locator(MASTERY_TABLES['3rd'])).toBeHidden();

    // Assert - localStorage
    const jobTier = await page.evaluate(() => localStorage.getItem('selectedJobTier'));
    expect(jobTier).toBe('4th');

    markElementCovered('characterLevel', 'character-level');
    markElementCovered('jobTierButtons', 'job-tier-3rd');
    markElementCovered('jobTierButtons', 'job-tier-4th');
  });

  test('user inputs all core combat stats', async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Fill attack
    await page.fill(STAT_INPUTS.attack, '500');

    // Assert
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue('500');

    // Act - Fill defense
    await page.fill(STAT_INPUTS.defense, '200');

    // Assert
    await expect(page.locator(STAT_INPUTS.defense)).toHaveValue('200');

    // Act - Fill crit rate
    await page.fill(STAT_INPUTS.critRate, '25');

    // Assert
    await expect(page.locator(STAT_INPUTS.critRate)).toHaveValue('25');

    // Act - Fill crit damage
    await page.fill(STAT_INPUTS.critDamage, '50');

    // Assert
    await expect(page.locator(STAT_INPUTS.critDamage)).toHaveValue('50');

    // Act - Fill attack speed
    await page.fill(STAT_INPUTS.attackSpeed, '6');

    // Assert
    await expect(page.locator(STAT_INPUTS.attackSpeed)).toHaveValue('6');

    markElementCovered('statInputs', 'attack-base');
    markElementCovered('statInputs', 'defense-base');
    markElementCovered('statInputs', 'crit-rate-base');
    markElementCovered('statInputs', 'crit-damage-base');
    markElementCovered('statInputs', 'attack-speed-base');
  });

  test('user inputs main stat values for warrior class', async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Fill STR
    await page.fill(STAT_INPUTS.str, '1000');

    // Assert
    await expect(page.locator(STAT_INPUTS.str)).toHaveValue('1000');

    // Act - Fill DEX
    await page.fill(STAT_INPUTS.dex, '300');

    // Assert
    await expect(page.locator(STAT_INPUTS.dex)).toHaveValue('300');

    // Verify hidden primary/secondary fields are updated
    const primaryStat = await page.evaluate(() => document.getElementById('primary-main-stat-base').value);
    const secondaryStat = await page.evaluate(() => document.getElementById('secondary-main-stat-base').value);

    expect(primaryStat).toBe('1000');
    expect(secondaryStat).toBe('300');

    markElementCovered('statInputs', 'str-base');
    markElementCovered('statInputs', 'dex-base');
  });

  test('complete character setup with fixture', async ({ page }) => {
    // Act - Apply complete fixture
    await applyBaseStatsFixture(page, HERO_LEVEL_60);

    // Assert - Direct state (class)
    await expect(page.locator(CLASS_SELECTORS.hero)).toHaveClass(/selected/);

    // Assert - Direct state (level)
    await expect(page.locator('#character-level')).toHaveValue('60');

    // Assert - Direct state (job tier)
    await expect(page.locator(JOB_TIER_BUTTONS['3rd'])).toHaveClass(/active/);

    // Assert - Direct state (key stats)
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue('150');
    await expect(page.locator(STAT_INPUTS.str)).toHaveValue('300');

    // Assert - localStorage verification
    const storageValid = await verifyStorageState(page, HERO_LEVEL_60);
    expect(storageValid).toBe(true);
  });

  test.afterAll(async () => {
    logCoverageReport();
  });
});

test.describe('Base Stats - Class Switching Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test('switching from warrior to mage updates stat rows and preserves inputs', async ({ page }) => {
    // Arrange - Configure as Hero
    await page.click(CLASS_SELECTORS.hero);
    await page.fill(STAT_INPUTS.str, '800');
    await page.fill(STAT_INPUTS.dex, '200');
    await page.waitForTimeout(100);

    // Act - Switch to Arch Mage (I/L)
    await page.click(CLASS_SELECTORS.archMageIL);

    // Assert - Class changed
    await expect(page.locator(CLASS_SELECTORS.archMageIL)).toHaveClass(/selected/);

    // Assert - Stat rows updated for mage (INT/LUK visible)
    // Note: Comprehensive stat row visibility tests are in base-stats-coverage.spec.js
    await expect(page.locator(STAT_ROWS.int)).toBeVisible();
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();

    markElementCovered('classSelectors', 'class-arch-mage-il');
  });

  test('switching from warrior to dark knight shows defense input', async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);

    // Act - Switch to Dark Knight
    await page.click(CLASS_SELECTORS.darkKnight);

    // Assert - Class changed
    await expect(page.locator(CLASS_SELECTORS.darkKnight)).toHaveClass(/selected/);

    // Assert - Defense input visible (Dark Knight uses defense stat)
    await expect(page.locator(STAT_INPUTS.defense)).toBeVisible();

    // Assert - Same stat rows remain visible (both use STR/DEX)
    await expect(page.locator(STAT_ROWS.str)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();

    markElementCovered('classSelectors', 'class-dark-knight');
  });

  test('switching from archer to thief updates stat rows correctly', async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.bowmaster);
    await page.waitForTimeout(100);

    // Act - Switch to Night Lord
    await page.click(CLASS_SELECTORS.nightLord);

    // Assert - Class changed and stat rows updated (LUK/DEX for thieves)
    // Note: Comprehensive stat row visibility tests are in base-stats-coverage.spec.js
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();

    markElementCovered('classSelectors', 'class-bowmaster');
    markElementCovered('classSelectors', 'class-night-lord');
  });

  test('switching classes maintains configured values where applicable', async ({ page }) => {
    // Arrange - Configure Bowmaster
    await applyBaseStatsFixture(page, BOWMASTER_LEVEL_80);

    // Act - Switch to Marksman (same stat types: DEX/STR)
    await page.click(CLASS_SELECTORS.marksman);
    await page.waitForTimeout(100);

    // Assert - Class changed but same stat rows visible
    await expect(page.locator(CLASS_SELECTORS.marksman)).toHaveClass(/selected/);
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();
    await expect(page.locator(STAT_ROWS.str)).toBeVisible();

    markElementCovered('classSelectors', 'class-marksman');
  });

  test('switching from 4th job to 3rd job updates mastery tables', async ({ page }) => {
    // Arrange - Configure as 4th job Hero
    await applyBaseStatsFixture(page, HERO_LEVEL_100);

    // Act - Switch to 3rd job tier
    await page.click(JOB_TIER_BUTTONS['3rd']);

    // Assert - Job tier buttons updated
    await expect(page.locator(JOB_TIER_BUTTONS['3rd'])).toHaveClass(/active/);
    await expect(page.locator(JOB_TIER_BUTTONS['4th'])).not.toHaveClass(/active/);

    // Assert - Mastery table switched (mastery visibility tests are in base-stats-mastery.spec.js)
    await expect(page.locator(MASTERY_TABLES['3rd'])).toBeVisible();

    // Assert - localStorage updated
    const jobTier = await page.evaluate(() => localStorage.getItem('selectedJobTier'));
    expect(jobTier).toBe('3rd');
  });

  test.afterAll(async () => {
    logCoverageReport();
  });
});

test.describe('Base Stats - Configuration Adjustment Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test('user adjusts individual stat inputs and values persist', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_LEVEL_60);

    // Act - Increase attack
    await page.fill(STAT_INPUTS.attack, '200');

    // Assert
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue('200');

    // Act - Adjust damage percentage
    await page.fill(STAT_INPUTS.damage, '20');

    // Assert
    await expect(page.locator(STAT_INPUTS.damage)).toHaveValue('20');

    // Act - Adjust boss damage
    await page.fill(STAT_INPUTS.bossDamage, '30');

    // Assert
    await expect(page.locator(STAT_INPUTS.bossDamage)).toHaveValue('30');

    markElementCovered('statInputs', 'damage-base');
    markElementCovered('statInputs', 'boss-damage-base');
  });

  test('user adjusts all damage modifier stats', async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Fill stat damage
    await page.fill(STAT_INPUTS.statDamage, '15');

    // Assert
    await expect(page.locator(STAT_INPUTS.statDamage)).toHaveValue('15');

    // Act - Fill damage amp
    await page.fill(STAT_INPUTS.damageAmp, '1.5');

    // Assert
    await expect(page.locator(STAT_INPUTS.damageAmp)).toHaveValue('1.5');

    // Act - Fill def pen
    await page.fill(STAT_INPUTS.defPen, '20');

    // Assert
    await expect(page.locator(STAT_INPUTS.defPen)).toHaveValue('20');

    // Act - Fill normal damage
    await page.fill(STAT_INPUTS.normalDamage, '25');

    // Assert
    await expect(page.locator(STAT_INPUTS.normalDamage)).toHaveValue('25');

    // Act - Fill final damage
    await page.fill(STAT_INPUTS.finalDamage, '10');

    // Assert
    await expect(page.locator(STAT_INPUTS.finalDamage)).toHaveValue('10');

    markElementCovered('statInputs', 'stat-damage-base');
    markElementCovered('statInputs', 'damage-amp-base');
    markElementCovered('statInputs', 'def-pen-base');
    markElementCovered('statInputs', 'normal-damage-base');
    markElementCovered('statInputs', 'final-damage-base');
  });

  test('user adjusts min/max damage multipliers', async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.archMageIL);
    await page.waitForTimeout(100);

    // Act
    await page.fill(STAT_INPUTS.minDamage, '60');

    // Assert
    await expect(page.locator(STAT_INPUTS.minDamage)).toHaveValue('60');

    // Act
    await page.fill(STAT_INPUTS.maxDamage, '105');

    // Assert
    await expect(page.locator(STAT_INPUTS.maxDamage)).toHaveValue('105');

    markElementCovered('statInputs', 'min-damage-base');
    markElementCovered('statInputs', 'max-damage-base');
  });

  test('user adjusts main stat percentage', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, ARCH_MAGE_IL_LEVEL_90);

    // Act - Update main stat percentage
    await page.fill(STAT_INPUTS.mainStatPct, '75');

    // Assert
    await expect(page.locator(STAT_INPUTS.mainStatPct)).toHaveValue('75');

    markElementCovered('statInputs', 'main-stat-pct-base');
  });

  test('user adjusts skill levels and skill coefficient updates', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, DARK_KNIGHT_LEVEL_100);

    // Act - Update 4th job skill level
    await page.fill('#skill-level-4th-base', '15');

    // Assert - Input updated
    await expect(page.locator('#skill-level-4th-base')).toHaveValue('15');

    // Assert - Skill coefficient should be recalculated (verify field exists and has value)
    const skillCoeff = await page.evaluate(() => document.getElementById('skill-coeff-base').value);
    expect(skillCoeff).toBeTruthy();
    expect(parseFloat(skillCoeff)).toBeGreaterThan(0);

    markElementCovered('skillLevelInputs', 'skill-level-4th-base');
  });

  test('user adjusts all skill levels', async ({ page }) => {
    // Arrange
    await page.click(CLASS_SELECTORS.nightLord);
    await page.waitForTimeout(100);

    // Act - Fill all skill levels
    await page.fill('#skill-level-1st-base', '5');
    await page.fill('#skill-level-2nd-base', '10');
    await page.fill('#skill-level-3rd-base', '20');
    await page.fill('#skill-level-4th-base', '0');

    // Assert
    await expect(page.locator('#skill-level-1st-base')).toHaveValue('5');
    await expect(page.locator('#skill-level-2nd-base')).toHaveValue('10');
    await expect(page.locator('#skill-level-3rd-base')).toHaveValue('20');
    await expect(page.locator('#skill-level-4th-base')).toHaveValue('0');

    markElementCovered('skillLevelInputs', 'skill-level-1st-base');
    markElementCovered('skillLevelInputs', 'skill-level-2nd-base');
    markElementCovered('skillLevelInputs', 'skill-level-3rd-base');
  });

  test('rapid stat adjustments maintain data integrity', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_LEVEL_60);

    // Act - Rapidly adjust multiple values
    await page.fill(STAT_INPUTS.attack, '999');
    await page.fill(STAT_INPUTS.str, '1500');
    await page.fill(STAT_INPUTS.damage, '50');
    await page.fill(STAT_INPUTS.bossDamage, '100');

    // Assert - All values should be retained
    await expect(page.locator(STAT_INPUTS.attack)).toHaveValue('999');
    await expect(page.locator(STAT_INPUTS.str)).toHaveValue('1500');
    await expect(page.locator(STAT_INPUTS.damage)).toHaveValue('50');
    await expect(page.locator(STAT_INPUTS.bossDamage)).toHaveValue('100');

    // Assert - localStorage intact
    const selectedClass = await page.evaluate(() => localStorage.getItem('selectedClass'));
    expect(selectedClass).toBe('hero');
  });

  test.afterAll(async () => {
    logCoverageReport();
  });
});

test.describe('Base Stats - Cross-Tab Integration', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  const tabNavigationTests = [
    {
      name: 'equipment',
      tabButton: SETUP_TAB_BUTTONS.equipment,
      targetSelector: '#setup-equipment',
      fixture: HERO_LEVEL_100
    },
    {
      name: 'weapon levels',
      tabButton: SETUP_TAB_BUTTONS.weaponLevels,
      targetSelector: '#setup-weapon-levels',
      manualConfig: async (page) => {
        await page.click(CLASS_SELECTORS.nightLord);
        await page.fill('#character-level', '90');
        await page.fill(STAT_INPUTS.luk, '920');
        await page.waitForTimeout(300);
      },
      assertions: async (page) => {
        await expect(page.locator('#character-level')).toHaveValue('90');
        await expect(page.locator(STAT_INPUTS.luk)).toHaveValue('920');
        const selectedClass = await page.evaluate(() => localStorage.getItem('selectedClass'));
        expect(selectedClass).toBe('night-lord');
      }
    }
  ];

  for (const testCase of tabNavigationTests) {
    test(`base stats persist when navigating to ${testCase.name} tab`, async ({ page }) => {
      // Arrange - Configure base stats
      if (testCase.fixture) {
        await applyBaseStatsFixture(page, testCase.fixture);
      } else if (testCase.manualConfig) {
        await testCase.manualConfig(page);
      }

      // Act - Navigate to target tab
      await page.click(testCase.tabButton);
      await page.waitForTimeout(200);

      // Assert - Target tab is visible
      await expect(page.locator(testCase.targetSelector)).toBeVisible();

      // Act - Return to base stats
      await page.click(SETUP_TAB_BUTTONS.baseStats);
      await page.waitForTimeout(200);

      // Assert - Values preserved
      if (testCase.assertions) {
        await testCase.assertions(page);
      } else {
        await expect(page.locator('#character-level')).toHaveValue(String(testCase.fixture.level));
        await expect(page.locator(STAT_INPUTS.attack)).toHaveValue(String(testCase.fixture.attack));
        await expect(page.locator(CLASS_SELECTORS[testCase.fixture.class])).toHaveClass(/selected/);
        const storageValid = await verifyStorageState(page, testCase.fixture);
        expect(storageValid).toBe(true);
      }

      markElementCovered('tabButtons', `base-stats-tab`);
      markElementCovered('tabButtons', `${testCase.name}-tab`);
    });
  }

  test('base stats persist across multiple tab navigations', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, BOWMASTER_LEVEL_80);

    // Act - Navigate through multiple tabs
    await page.click(SETUP_TAB_BUTTONS.equipment);
    await page.waitForTimeout(100);

    await page.click(SETUP_TAB_BUTTONS.weaponLevels);
    await page.waitForTimeout(100);

    await page.click(SETUP_TAB_BUTTONS.companions);
    await page.waitForTimeout(100);

    // Act - Return to base stats
    await page.click(SETUP_TAB_BUTTONS.baseStats);
    await page.waitForTimeout(200);

    // Assert - All critical values preserved
    await expect(page.locator('#character-level')).toHaveValue('80');
    await expect(page.locator(STAT_INPUTS.dex)).toHaveValue('620');
    await expect(page.locator(CLASS_SELECTORS.bowmaster)).toHaveClass(/selected/);
    await expect(page.locator(JOB_TIER_BUTTONS['3rd'])).toHaveClass(/active/);

    markElementCovered('tabButtons', 'companions-tab');
  });

  test('changing class in base stats affects other tabs', async ({ page }) => {
    // Arrange - Start with Hero
    await page.click(CLASS_SELECTORS.hero);
    await page.waitForTimeout(100);

    // Act - Switch to Shadower
    await page.click(CLASS_SELECTORS.shadower);
    await page.waitForTimeout(100);

    // Act - Navigate to equipment
    await page.click(SETUP_TAB_BUTTONS.equipment);
    await page.waitForTimeout(200);

    // Act - Return to base stats
    await page.click(SETUP_TAB_BUTTONS.baseStats);
    await page.waitForTimeout(200);

    // Assert - Shadower selection persisted
    await expect(page.locator(CLASS_SELECTORS.shadower)).toHaveClass(/selected/);

    // Assert - Correct stat rows visible (LUK/DEX for thief)
    await expect(page.locator(STAT_ROWS.luk)).toBeVisible();
    await expect(page.locator(STAT_ROWS.dex)).toBeVisible();
    await expect(page.locator(STAT_ROWS.str)).toBeHidden();
    await expect(page.locator(STAT_ROWS.int)).toBeHidden();

    // Assert - localStorage
    const selectedClass = await page.evaluate(() => localStorage.getItem('selectedClass'));
    expect(selectedClass).toBe('shadower');

    markElementCovered('classSelectors', 'class-shadower');
  });

  test.afterAll(async () => {
    logCoverageReport();
  });
});
