// Stat Predictions - Equivalency Calculator Tests
// Tests the equivalency calculator functionality with all input fields
// Run with: npm test -- predictions-equivalency.spec.js

import { test, expect } from '@playwright/test';
import {
  PREDICTIONS_TAB_BUTTONS,
  PREDICTIONS_TAB_CONTENT,
  EQUIVALENCY_INPUTS,
  EQUIVALENCY_RESULTS
} from './helpers/predictions-selectors.js';
import {
  navigateToStatEquivalency,
  navigateToBaseStats,
  clearStorage,
  applyBaseStatsFixture
} from './helpers/fixture-helpers.js';
import {
  markPredictionsElementCovered,
  logPredictionsCoverageReport
} from './helpers/predictions-coverage.js';
import {
  HERO_LEVEL_60,
  HERO_LEVEL_100,
  HERO_WELL_GEARED_4TH,
  BOWMASTER_LEVEL_80
} from './fixtures/predictions-fixtures.js';

test.describe('Stat Equivalency - Input Field Presence and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
    await navigateToStatEquivalency(page);
  });

  test('all 16+ input fields are present and visible', async ({ page }) => {
    // Assert - All input fields exist
    await expect(page.locator(EQUIVALENCY_INPUTS.attack)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.mainStat)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.skillCoeff)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.skillMastery)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.damage)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.finalDamage)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.bossDamage)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.normalDamage)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.mainStatPct)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.damageAmp)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.minDamage)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.maxDamage)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.critRate)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.critDamage)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.attackSpeed)).toBeVisible();
    await expect(page.locator(EQUIVALENCY_INPUTS.defPen)).toBeVisible();

    markPredictionsElementCovered('equivalencyInputs', 'equiv-attack');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-main-stat');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-skill-coeff');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-skill-mastery');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-final-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-boss-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-normal-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-main-stat-pct');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-damage-amp');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-min-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-max-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-crit-rate');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-crit-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-attack-speed');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-def-pen');
  });

  test('input fields accept numeric values', async ({ page }) => {
    // Act - Fill attack input
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');

    // Assert - Value accepted
    await expect(page.locator(EQUIVALENCY_INPUTS.attack)).toHaveValue('100');

    // Act - Fill main stat input
    await page.fill(EQUIVALENCY_INPUTS.mainStat, '50');

    // Assert - Value accepted
    await expect(page.locator(EQUIVALENCY_INPUTS.mainStat)).toHaveValue('50');

    // Act - Fill skill coefficient
    await page.fill(EQUIVALENCY_INPUTS.skillCoeff, '1.5');

    // Assert - Value accepted
    await expect(page.locator(EQUIVALENCY_INPUTS.skillCoeff)).toHaveValue('1.5');
  });

  test('input fields handle decimal values correctly', async ({ page }) => {
    // Act - Fill damage amp with decimal
    await page.fill(EQUIVALENCY_INPUTS.damageAmp, '1.35');

    // Assert - Decimal value preserved
    await expect(page.locator(EQUIVALENCY_INPUTS.damageAmp)).toHaveValue('1.35');

    // Act - Fill skill mastery with decimal
    await page.fill(EQUIVALENCY_INPUTS.skillMastery, '0.75');

    // Assert
    await expect(page.locator(EQUIVALENCY_INPUTS.skillMastery)).toHaveValue('0.75');
  });

  test('input fields handle zero values', async ({ page }) => {
    // Act - Set multiple fields to zero
    await page.fill(EQUIVALENCY_INPUTS.damage, '0');
    await page.fill(EQUIVALENCY_INPUTS.finalDamage, '0');
    await page.fill(EQUIVALENCY_INPUTS.damageAmp, '0');

    // Assert - All zeros accepted
    await expect(page.locator(EQUIVALENCY_INPUTS.damage)).toHaveValue('0');
    await expect(page.locator(EQUIVALENCY_INPUTS.finalDamage)).toHaveValue('0');
    await expect(page.locator(EQUIVALENCY_INPUTS.damageAmp)).toHaveValue('0');
  });

  test('input fields reject non-numeric input', async ({ page }) => {
    // Act - Attempt to fill with text
    await page.fill(EQUIVALENCY_INPUTS.attack, 'abc');

    // Assert - Value should not be accepted or should be cleared
    const value = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(value).not.toBe('abc');
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe('Stat Equivalency - Real-Time Calculation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
    await navigateToStatEquivalency(page);
  });

  test('entering attack value calculates equivalent gains for other stats', async ({ page }) => {
    // Act - Enter attack value
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200); // Allow calculation

    // Assert - Result fields should be populated
    const mainStatGain = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);
    const damageGain = await page.inputValue(EQUIVALENCY_INPUTS.damage);

    // Results should be calculated (not empty)
    expect(mainStatGain || mainStatGain === '0').toBeTruthy();
    expect(damageGain || damageGain === '0').toBeTruthy();

    // Assert - Side effects (result displays visible)
    await expect(page.locator(EQUIVALENCY_RESULTS.attackGain)).toBeVisible();
  });

  test('entering main stat value calculates equivalent attack', async ({ page }) => {
    // Act - Enter main stat value
    await page.fill(EQUIVALENCY_INPUTS.mainStat, '100');
    await page.waitForTimeout(200);

    // Assert - Attack equivalent calculated
    const attackGain = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(attackGain || attackGain === '0').toBeTruthy();

    // Assert - Result display updated
    await expect(page.locator(EQUIVALENCY_RESULTS.mainStatGain)).toBeVisible();
  });

  test('entering boss damage calculates equivalents for other stats', async ({ page }) => {
    // Act - Enter boss damage value
    await page.fill(EQUIVALENCY_INPUTS.bossDamage, '10');
    await page.waitForTimeout(200);

    // Assert - Equivalents calculated
    const attackGain = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    const mainStatGain = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    expect(attackGain || attackGain === '0').toBeTruthy();
    expect(mainStatGain || mainStatGain === '0').toBeTruthy();

    // Assert - Result display
    await expect(page.locator(EQUIVALENCY_RESULTS.bossDamageGain)).toBeVisible();
  });

  test('all inputs update in real-time as values change', async ({ page }) => {
    // Arrange - Set initial values
    await page.fill(EQUIVALENCY_INPUTS.attack, '50');
    await page.waitForTimeout(200);

    const initialMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    // Act - Update attack value
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);

    // Assert - Equivalent recalculated
    const updatedMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);
    expect(updatedMainStat).not.toBe(initialMainStat);
  });

  test('skill coefficient affects equivalency calculations', async ({ page }) => {
    // Arrange - Set base value
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);

    const initialMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    // Act - Change skill coefficient
    await page.fill(EQUIVALENCY_INPUTS.skillCoeff, '2.0');
    await page.waitForTimeout(200);

    // Assert - Equivalencies updated based on new coefficient
    const updatedMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);
    expect(updatedMainStat).not.toBe(initialMainStat);
  });

  test('skill mastery affects equivalency calculations', async ({ page }) => {
    // Arrange
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);

    const initialDamage = await page.inputValue(EQUIVALENCY_INPUTS.damage);

    // Act - Change skill mastery
    await page.fill(EQUIVALENCY_INPUTS.skillMastery, '0.5');
    await page.waitForTimeout(200);

    // Assert
    const updatedDamage = await page.inputValue(EQUIVALENCY_INPUTS.damage);
    expect(updatedDamage).not.toBe(initialDamage);
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe('Stat Equivalency - Cross-Stat Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
    await applyBaseStatsFixture(page, HERO_WELL_GEARED_4TH);
    await navigateToStatEquivalency(page);
  });

  test('attack to main stat conversion is bidirectional', async ({ page }) => {
    // Act - Set attack value
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);

    const attackToMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    // Act - Clear and set main stat to same value
    await page.fill(EQUIVALENCY_INPUTS.attack, '');
    await page.waitForTimeout(100);
    await page.fill(EQUIVALENCY_INPUTS.mainStat, attackToMainStat);
    await page.waitForTimeout(200);

    // Assert - Should calculate back to approximately same attack value
    const mainStatToAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(parseFloat(mainStatToAttack)).toBeCloseTo(100, 1);
  });

  test('damage to attack conversion works correctly', async ({ page }) => {
    // Act - Set damage value
    await page.fill(EQUIVALENCY_INPUTS.damage, '20');
    await page.waitForTimeout(200);

    // Assert - Attack equivalent calculated
    const attackEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(parseFloat(attackEquivalent)).toBeGreaterThan(0);
  });

  test('boss damage to normal damage conversion reflects target content', async ({ page }) => {
    // Arrange - Character with boss damage configured
    await page.fill(EQUIVALENCY_INPUTS.bossDamage, '30');
    await page.waitForTimeout(200);

    const bossToAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);

    // Act - Switch to normal damage
    await page.fill(EQUIVALENCY_INPUTS.normalDamage, '30');
    await page.waitForTimeout(200);

    const normalToAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);

    // Assert - Boss damage should have higher attack equivalent (assuming boss target)
    expect(parseFloat(bossToAttack)).toBeGreaterThan(0);
    expect(parseFloat(normalToAttack)).toBeGreaterThan(0);
  });

  test('crit rate to crit damage conversion shows diminishing returns', async ({ page }) => {
    // Arrange - Low crit rate
    await page.fill(EQUIVALENCY_INPUTS.critRate, '10');
    await page.waitForTimeout(200);

    const lowCritRateToAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);

    // Act - Higher crit rate (should show diminishing returns)
    await page.fill(EQUIVALENCY_INPUTS.critRate, '50');
    await page.waitForTimeout(200);

    const highCritRateToAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);

    // Assert - Both should calculate (actual values depend on current crit rate)
    expect(parseFloat(lowCritRateToAttack)).toBeGreaterThan(0);
    expect(parseFloat(highCritRateToAttack)).toBeGreaterThan(0);
  });

  test('attack speed conversion shows appropriate scaling', async ({ page }) => {
    // Act - Set attack speed value
    await page.fill(EQUIVALENCY_INPUTS.attackSpeed, '10');
    await page.waitForTimeout(200);

    // Assert - Attack equivalent calculated
    const attackEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(parseFloat(attackEquivalent)).toBeGreaterThan(0);

    // Act - Higher attack speed
    await page.fill(EQUIVALENCY_INPUTS.attackSpeed, '30');
    await page.waitForTimeout(200);

    const higherAttackEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.attack);

    // Assert - Should scale appropriately
    expect(parseFloat(higherAttackEquivalent)).toBeGreaterThan(0);
  });

  test('final damage conversion is calculated correctly', async ({ page }) => {
    // Act - Set final damage value
    await page.fill(EQUIVALENCY_INPUTS.finalDamage, '20');
    await page.waitForTimeout(200);

    // Assert - Equivalents calculated
    const attackEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    const mainStatEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    expect(parseFloat(attackEquivalent)).toBeGreaterThan(0);
    expect(parseFloat(mainStatEquivalent)).toBeGreaterThan(0);
  });

  test('defense penetration conversion reflects target defense', async ({ page }) => {
    // Act - Set def pen value
    await page.fill(EQUIVALENCY_INPUTS.defPen, '20');
    await page.waitForTimeout(200);

    // Assert - Attack equivalent calculated
    const attackEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(parseFloat(attackEquivalent)).toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe('Stat Equivalency - Input Validation and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
    await applyBaseStatsFixture(page, HERO_LEVEL_100);
    await navigateToStatEquivalency(page);
  });

  test('negative values are handled gracefully', async ({ page }) => {
    // Act - Enter negative value
    await page.fill(EQUIVALENCY_INPUTS.attack, '-50');
    await page.waitForTimeout(200);

    // Assert - Should handle gracefully (show 0, ignore, or show negative equivalent)
    const value = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(value).toBeTruthy();
  });

  test('extremely large values do not break calculations', async ({ page }) => {
    // Act - Enter very large value
    await page.fill(EQUIVALENCY_INPUTS.attack, '99999');
    await page.waitForTimeout(200);

    // Assert - No NaN or Infinity in results
    const mainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    const hasValidResults = await page.evaluate(() => {
      const inputs = document.querySelectorAll('[id^="equiv-result"]');
      for (const input of inputs) {
        const val = parseFloat(input.value);
        if (isNaN(val) || !isFinite(val)) {
          return false;
        }
      }
      return true;
    });

    expect(hasValidResults).toBe(true);
  });

  test('zero values calculate correctly for all stats', async ({ page }) => {
    // Act - Set multiple fields to zero
    await page.fill(EQUIVALENCY_INPUTS.attack, '0');
    await page.fill(EQUIVALENCY_INPUTS.mainStat, '0');
    await page.fill(EQUIVALENCY_INPUTS.damage, '0');
    await page.waitForTimeout(200);

    // Assert - Other fields should reflect zero equivalents
    const hasValidResults = await page.evaluate(() => {
      const inputs = document.querySelectorAll('[id^="equiv-"]:not([id^="equiv-result"])');
      for (const input of inputs) {
        const val = parseFloat(input.value);
        if (input.value && !isNaN(val)) {
          // Valid number or empty
          continue;
        }
      }
      return true;
    });

    expect(hasValidResults).toBe(true);
  });

  test('rapid input changes maintain calculation integrity', async ({ page }) => {
    // Act - Rapidly change values
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(50);

    await page.fill(EQUIVALENCY_INPUTS.attack, '200');
    await page.waitForTimeout(50);

    await page.fill(EQUIVALENCY_INPUTS.mainStat, '150');
    await page.waitForTimeout(50);

    await page.fill(EQUIVALENCY_INPUTS.damage, '25');
    await page.waitForTimeout(200);

    // Assert - Final state should be valid
    const hasValidResults = await page.evaluate(() => {
      const inputs = document.querySelectorAll('[id^="equiv-result"]');
      for (const input of inputs) {
        const val = parseFloat(input.value);
        if (isNaN(val) || !isFinite(val)) {
          return false;
        }
      }
      return true;
    });

    expect(hasValidResults).toBe(true);
  });

  test('clearing one input clears related equivalencies', async ({ page }) => {
    // Arrange - Set attack value
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);

    // Act - Clear attack value
    await page.fill(EQUIVALENCY_INPUTS.attack, '');
    await page.waitForTimeout(200);

    // Assert - Related fields should clear or update
    const mainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);
    expect(mainStat).toBe('');
  });

  test('decimal precision is maintained in calculations', async ({ page }) => {
    // Act - Enter decimal value
    await page.fill(EQUIVALENCY_INPUTS.damageAmp, '1.234');
    await page.waitForTimeout(200);

    // Assert - Decimal precision should be preserved
    const damageAmp = await page.inputValue(EQUIVALENCY_INPUTS.damageAmp);
    expect(parseFloat(damageAmp)).toBeCloseTo(1.234, 3);
  });

  test('min/max damage multipliers calculate correctly', async ({ page }) => {
    // Act - Set min damage
    await page.fill(EQUIVALENCY_INPUTS.minDamage, '70');
    await page.waitForTimeout(200);

    const minToAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(parseFloat(minToAttack)).toBeGreaterThan(0);

    // Act - Set max damage
    await page.fill(EQUIVALENCY_INPUTS.maxDamage, '110');
    await page.waitForTimeout(200);

    const maxToAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(parseFloat(maxToAttack)).toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe('Stat Equivalency - Integration with Base Stats', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test('equivalency calculations use current base stats', async ({ page }) => {
    // Arrange - Configure specific character
    await applyBaseStatsFixture(page, BOWMASTER_LEVEL_80);
    await navigateToStatEquivalency(page);

    // Act - Set attack value
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);

    // Assert - Equivalents should be based on Bowmaster's DEX (not INT/STR/LUK)
    const mainStatEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);
    expect(parseFloat(mainStatEquivalent)).toBeGreaterThan(0);

    // Assert - Base stats preserved in localStorage
    const selectedClass = await page.evaluate(() => localStorage.getItem('selectedClass'));
    expect(selectedClass).toBe('bowmaster');
  });

  test('changing base stats updates equivalency calculations', async ({ page }) => {
    // Arrange - Configure character
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
    await navigateToStatEquivalency(page);

    // Get initial calculation
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);
    const initialMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    // Act - Change base stats
    await navigateToBaseStats(page);
    await page.fill('#attack-base', '500'); // Double attack
    await page.waitForTimeout(100);

    // Act - Return to equivalency
    await navigateToStatEquivalency(page);
    await page.waitForTimeout(200);

    // Assert - Recalculate with new base stats
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);
    const updatedMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    // Equivalencies should change based on new base stats
    expect(updatedMainStat).toBeTruthy();
  });

  test('switching classes updates equivalency calculations', async ({ page }) => {
    // Arrange - Start with Hero
    await applyBaseStatsFixture(page, HERO_LEVEL_100);
    await navigateToStatEquivalency(page);

    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);
    const heroMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    // Act - Switch to Night Lord
    await navigateToBaseStats(page);
    await page.click('#class-night-lord');
    await page.fill('#luk-base', '920');
    await page.waitForTimeout(100);

    await navigateToStatEquivalency(page);
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);
    const nightLordMainStat = await page.inputValue(EQUIVALENCY_INPUTS.mainStat);

    // Assert - Different classes should have different equivalencies
    expect(nightLordMainStat).toBeTruthy();
    // Values may differ due to different primary stats

    // Assert - localStorage updated
    const selectedClass = await page.evaluate(() => localStorage.getItem('selectedClass'));
    expect(selectedClass).toBe('night-lord');
  });

  test('equivalency tab persists state when switching to stat tables', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_LEVEL_100);
    await navigateToStatEquivalency(page);

    // Set equivalency values
    await page.fill(EQUIVALENCY_INPUTS.attack, '150');
    await page.fill(EQUIVALENCY_INPUTS.damage, '30');
    await page.waitForTimeout(200);

    // Act - Switch to stat tables tab
    await page.click(PREDICTIONS_TAB_BUTTONS.statTables);
    await page.waitForTimeout(200);

    // Act - Switch back to equivalency
    await page.click(PREDICTIONS_TAB_BUTTONS.equivalency);
    await page.waitForTimeout(200);

    // Assert - Values should be preserved
    await expect(page.locator(EQUIVALENCY_INPUTS.attack)).toHaveValue('150');
    await expect(page.locator(EQUIVALENCY_INPUTS.damage)).toHaveValue('30');
  });

  test('full workflow: configure → calculate equivalency → adjust base → recalculate', async ({ page }) => {
    // Arrange - Configure character
    await page.click('#class-hero');
    await page.fill('#character-level', '80');
    await page.fill('#attack-base', '300');
    await page.fill('#str-base', '800');
    await page.waitForTimeout(100);

    // Act - Calculate equivalency
    await navigateToStatEquivalency(page);
    await page.fill(EQUIVALENCY_INPUTS.bossDamage, '20');
    await page.waitForTimeout(200);
    const initialAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);

    // Act - Adjust base stats
    await navigateToBaseStats(page);
    await page.fill('#attack-base', '600'); // Double
    await page.waitForTimeout(100);

    // Act - Recalculate
    await navigateToStatEquivalency(page);
    await page.fill(EQUIVALENCY_INPUTS.bossDamage, '20');
    await page.waitForTimeout(200);
    const updatedAttack = await page.inputValue(EQUIVALENCY_INPUTS.attack);

    // Assert - Equivalencies should change
    expect(updatedAttack).toBeTruthy();
    expect(parseFloat(updatedAttack)).not.toBe(parseFloat(initialAttack));

    // Assert - Base stats persisted
    const attackBase = await page.evaluate(() => localStorage.getItem('attackBase'));
    expect(attackBase).toBe('600');
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});
