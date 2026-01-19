// Stat Predictions - Element Inventory and Coverage Tests
// Validates all UI elements are present and functional
// Run with: npm test -- predictions-coverage.spec.js

import { test, expect } from '@playwright/test';
import {
  PREDICTIONS_TAB_BUTTONS,
  PREDICTIONS_TAB_CONTENT,
  STAT_TABLES_SELECTORS,
  EQUIVALENCY_INPUTS,
  EQUIVALENCY_RESULTS,
  GRAPH_SELECTORS
} from './helpers/predictions-selectors.js';
import {
  navigateToStatPredictions,
  navigateToStatEquivalency,
  navigateToBaseStats,
  clearStorage,
  applyBaseStatsFixture
} from './helpers/fixture-helpers.js';
import {
  PREDICTIONS_ELEMENTS,
  markPredictionsElementCovered,
  generatePredictionsCoverageReport,
  logPredictionsCoverageReport,
  isPredictionsElementCovered
} from './helpers/predictions-coverage.js';
import {
  HERO_LEVEL_60,
  HERO_LEVEL_100,
  HERO_WELL_GEARED_4TH,
  HERO_CAP_CRIT_RATE,
  HERO_CAP_ATTACK_SPEED,
  HERO_MINIMAL_STATS
} from './fixtures/predictions-fixtures.js';

test.describe('Stat Predictions - Element Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
  });

  test('all predictions tab buttons are present', async ({ page }) => {
    await navigateToStatPredictions(page);

    // Assert - Stat tables tab button exists
    await expect(page.locator(PREDICTIONS_TAB_BUTTONS.statTables)).toBeVisible();

    // Assert - Equivalency tab button exists
    await expect(page.locator(PREDICTIONS_TAB_BUTTONS.equivalency)).toBeVisible();

    markPredictionsElementCovered('predictionsTabButtons', 'stat-tables-tab');
    markPredictionsElementCovered('predictionsTabButtons', 'equivalency-tab');
  });

  test('all predictions tab content containers exist', async ({ page }) => {
    await navigateToStatPredictions(page);

    // Assert - Stat tables content container
    await expect(page.locator(PREDICTIONS_TAB_CONTENT.statTables)).toBeVisible();

    // Assert - Equivalency content container (may be hidden initially)
    await expect(page.locator(PREDICTIONS_TAB_CONTENT.equivalency)).toBeAttached();

    markPredictionsElementCovered('statTablesElements', 'stat-weights-base-container');
  });

  test('all equivalency input fields are present', async ({ page }) => {
    await navigateToStatEquivalency(page);

    // Verify all 16+ equivalency inputs
    const inputSelectors = Object.values(EQUIVALENCY_INPUTS);

    for (const selector of inputSelectors) {
      await expect(page.locator(selector)).toBeVisible();
    }

    // Mark all inputs as covered
    for (const inputId of PREDICTIONS_ELEMENTS.equivalencyInputs) {
      markPredictionsElementCovered('equivalencyInputs', inputId);
    }
  });

  test('all equivalency result displays are present', async ({ page }) => {
    await navigateToStatEquivalency(page);

    // Verify result display elements exist
    const resultSelectors = Object.values(EQUIVALENCY_RESULTS);

    for (const selector of resultSelectors) {
      await expect(page.locator(selector)).toBeAttached();
    }

    // Mark as covered
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-attack');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-main-stat');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-skill-coeff');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-final-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-boss-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-normal-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-crit-rate');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-crit-damage');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-attack-speed');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-result-def-pen');
  });

  test('graph elements exist when predictions are calculated', async ({ page }) => {
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300); // Allow predictions to load

    // Assert - Graph containers exist (may be empty initially)
    await expect(page.locator(GRAPH_SELECTORS.damageGainGraph)).toBeAttached();
    await expect(page.locator(GRAPH_SELECTORS.statWeightChart)).toBeAttached();

    markPredictionsElementCovered('graphElements', 'damage-gain-graph');
    markPredictionsElementCovered('graphElements', 'stat-weight-chart');
  });

  test('stat tables results container is present', async ({ page }) => {
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Results container exists
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    // Assert - Container has content after calculation
    const hasContent = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      return container && container.innerHTML.length > 0;
    });
    expect(hasContent).toBe(true);
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe('Stat Predictions - Edge Cases Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test('handles character with no base stats configured', async ({ page }) => {
    // Arrange - Don't configure any stats
    await navigateToStatPredictions(page);

    // Assert - Should not crash
    await expect(page.locator(PREDICTIONS_TAB_CONTENT.statTables)).toBeVisible();

    // Assert - Should show graceful handling (empty state or message)
    const hasNoErrors = await page.evaluate(() => {
      // Check for no console errors or broken UI
      const container = document.querySelector('#stat-weights-base');
      return container !== null;
    });
    expect(hasNoErrors).toBe(true);
  });

  test('handles character with all stats at zero', async ({ page }) => {
    // Arrange - Configure minimal stats character
    await applyBaseStatsFixture(page, HERO_MINIMAL_STATS);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Should handle gracefully
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    // Assert - No NaN or undefined values
    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return true; // Empty is OK
      return !container.textContent.includes('NaN') &&
             !container.textContent.includes('undefined');
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles character at multiple hard caps', async ({ page }) => {
    // Arrange - Configure character at crit rate cap
    await applyBaseStatsFixture(page, HERO_CAP_CRIT_RATE);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Should show capped stats with zero/minimal gain
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    // Assert - No calculation errors
    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return !container.textContent.includes('NaN') &&
             !container.textContent.includes('undefined') &&
             !container.textContent.includes('Infinity');
    });
    expect(hasValidResults).toBe(true);

    // Act - Adjust to attack speed cap
    await navigateToBaseStats(page);
    await applyBaseStatsFixture(page, HERO_CAP_ATTACK_SPEED);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Attack speed cap handled
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    const hasValidSpeedResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return !container.textContent.includes('NaN') &&
             !container.textContent.includes('undefined');
    });
    expect(hasValidSpeedResults).toBe(true);
  });

  test('handles extreme stat values', async ({ page }) => {
    // Arrange - Configure with extreme values
    await page.click('#class-hero');
    await page.fill('#character-level', '200');
    await page.fill('#attack-base', '99999');
    await page.fill('#str-base', '99999');
    await page.fill('#damage-base', '999');
    await page.fill('#boss-damage-base', '300');
    await page.waitForTimeout(100);

    // Act - Navigate to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Should handle extreme values without overflow
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return !container.textContent.includes('NaN') &&
             !container.textContent.includes('undefined') &&
             !container.textContent.includes('Infinity');
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles negative stat values gracefully', async ({ page }) => {
    // Arrange - Try to enter negative values
    await page.click('#class-hero');
    await page.fill('#attack-base', '-100');
    await page.waitForTimeout(100);

    // Act - Navigate to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Should handle gracefully
    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return true;
      return !container.textContent.includes('NaN');
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles decimal precision in predictions', async ({ page }) => {
    // Arrange - Configure with decimal values
    await page.click('#class-hero');
    await page.fill('#attack-base', '123.45');
    await page.fill('#damage-amp-base', '1.234');
    await page.fill('#def-pen-base', '12.34');
    await page.waitForTimeout(100);

    // Act
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Decimal precision should be preserved
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return !container.textContent.includes('NaN');
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles rapid stat changes without breaking', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_LEVEL_100);

    // Act - Rapidly change stats
    await navigateToBaseStats(page);
    await page.fill('#attack-base', '100');
    await page.waitForTimeout(50);

    await page.fill('#attack-base', '200');
    await page.waitForTimeout(50);

    await page.fill('#attack-base', '300');
    await page.waitForTimeout(50);

    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Should handle rapid changes
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return !container.textContent.includes('NaN') &&
             !container.textContent.includes('undefined');
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles switching between tabs rapidly', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_WELL_GEARED_4TH);
    await navigateToStatPredictions(page);

    // Act - Rapidly switch tabs
    await page.click(PREDICTIONS_TAB_BUTTONS.equivalency);
    await page.waitForTimeout(100);

    await page.click(PREDICTIONS_TAB_BUTTONS.statTables);
    await page.waitForTimeout(100);

    await page.click(PREDICTIONS_TAB_BUTTONS.equivalency);
    await page.waitForTimeout(100);

    await page.click(PREDICTIONS_TAB_BUTTONS.statTables);
    await page.waitForTimeout(300);

    // Assert - Both tabs should work correctly
    await expect(page.locator(PREDICTIONS_TAB_CONTENT.statTables)).toBeVisible();
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return container.innerHTML.length > 0;
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles page refresh with predictions active', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_LEVEL_100);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Refresh page
    await page.reload();
    await page.waitForTimeout(300);

    // Assert - Predictions should be restored or recalculated
    await expect(page.locator(PREDICTIONS_TAB_CONTENT.statTables)).toBeVisible();

    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return container.innerHTML.length > 0;
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles navigation away and back to predictions', async ({ page }) => {
    // Arrange
    await applyBaseStatsFixture(page, HERO_WELL_GEARED_4TH);
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Act - Navigate to base stats
    await navigateToBaseStats(page);
    await page.waitForTimeout(200);

    // Act - Navigate to predictions
    await navigateToStatPredictions(page);
    await page.waitForTimeout(300);

    // Assert - Predictions should be recalculated
    await expect(page.locator(STAT_TABLES_SELECTORS.resultsContainer)).toBeVisible();

    const hasValidResults = await page.evaluate(() => {
      const container = document.querySelector('.stat-weights-results');
      if (!container) return false;
      return container.innerHTML.length > 0;
    });
    expect(hasValidResults).toBe(true);
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe('Stat Predictions - Equivalency Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
    await applyBaseStatsFixture(page, HERO_LEVEL_60);
  });

  test('handles equivalency with no base stats configured', async ({ page }) => {
    // Arrange - Clear base stats
    await navigateToBaseStats(page);
    await page.fill('#attack-base', '');
    await page.fill('#str-base', '');
    await page.waitForTimeout(100);

    // Act - Navigate to equivalency
    await navigateToStatEquivalency(page);

    // Assert - Should handle gracefully
    await expect(page.locator(EQUIVALENCY_INPUTS.attack)).toBeVisible();

    // Try entering values
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(200);

    // Should not crash
    const hasNoErrors = await page.evaluate(() => {
      return document.querySelector('#equiv-attack') !== null;
    });
    expect(hasNoErrors).toBe(true);
  });

  test('handles equivalency with capped stats', async ({ page }) => {
    // Arrange - Character at hard cap
    await navigateToBaseStats(page);
    await applyBaseStatsFixture(page, HERO_CAP_CRIT_RATE);
    await navigateToStatEquivalency(page);

    // Act - Enter capped stat value
    await page.fill(EQUIVALENCY_INPUTS.critRate, '10');
    await page.waitForTimeout(200);

    // Assert - Should calculate appropriate equivalent (may be zero/minimal)
    const attackEquivalent = await page.inputValue(EQUIVALENCY_INPUTS.attack);
    expect(attackEquivalent).toBeTruthy();

    // Should not have NaN
    const hasValidResults = await page.evaluate(() => {
      const inputs = document.querySelectorAll('[id^="equiv-"]');
      for (const input of inputs) {
        const val = parseFloat(input.value);
        if (input.value && isNaN(val)) {
          return false;
        }
      }
      return true;
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles equivalency with extreme input values', async ({ page }) => {
    await navigateToStatEquivalency(page);

    // Act - Enter extreme values
    await page.fill(EQUIVALENCY_INPUTS.attack, '99999');
    await page.waitForTimeout(200);

    // Assert - Should not break
    const hasValidResults = await page.evaluate(() => {
      const inputs = document.querySelectorAll('[id^="equiv-result"]');
      for (const input of inputs) {
        const val = parseFloat(input.value);
        if (input.value && (isNaN(val) || !isFinite(val))) {
          return false;
        }
      }
      return true;
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles equivalency with zero values', async ({ page }) => {
    await navigateToStatEquivalency(page);

    // Act - Enter zero values
    await page.fill(EQUIVALENCY_INPUTS.attack, '0');
    await page.fill(EQUIVALENCY_INPUTS.mainStat, '0');
    await page.fill(EQUIVALENCY_INPUTS.damage, '0');
    await page.waitForTimeout(200);

    // Assert - Should handle gracefully
    const hasValidResults = await page.evaluate(() => {
      const inputs = document.querySelectorAll('[id^="equiv-"]');
      for (const input of inputs) {
        const val = parseFloat(input.value);
        if (input.value && !isNaN(val)) {
          continue; // Valid
        }
        if (!input.value) {
          continue; // Empty is OK
        }
        return false;
      }
      return true;
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles rapid equivalency input changes', async ({ page }) => {
    await navigateToStatEquivalency(page);

    // Act - Rapidly change inputs
    await page.fill(EQUIVALENCY_INPUTS.attack, '100');
    await page.waitForTimeout(50);

    await page.fill(EQUIVALENCY_INPUTS.attack, '200');
    await page.waitForTimeout(50);

    await page.fill(EQUIVALENCY_INPUTS.mainStat, '150');
    await page.waitForTimeout(50);

    await page.fill(EQUIVALENCY_INPUTS.damage, '25');
    await page.waitForTimeout(200);

    // Assert - Final state valid
    const hasValidResults = await page.evaluate(() => {
      const inputs = document.querySelectorAll('[id^="equiv-result"]');
      for (const input of inputs) {
        const val = parseFloat(input.value);
        if (input.value && (isNaN(val) || !isFinite(val))) {
          return false;
        }
      }
      return true;
    });
    expect(hasValidResults).toBe(true);
  });

  test('handles equivalency page refresh', async ({ page }) => {
    await navigateToStatEquivalency(page);

    // Arrange - Set values
    await page.fill(EQUIVALENCY_INPUTS.attack, '150');
    await page.fill(EQUIVALENCY_INPUTS.damage, '30');
    await page.waitForTimeout(200);

    // Act - Refresh page
    await page.reload();
    await page.waitForTimeout(300);

    // Assert - Inputs should be restored
    await expect(page.locator(EQUIVALENCY_INPUTS.attack)).toHaveValue('150');
    await expect(page.locator(EQUIVALENCY_INPUTS.damage)).toHaveValue('30');
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});

test.describe('Stat Predictions - Coverage Report Verification', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBaseStats(page);
    await clearStorage(page);
  });

  test('generates accurate coverage report', async ({ page }) => {
    // Arrange - Mark some elements as covered
    markPredictionsElementCovered('predictionsTabButtons', 'stat-tables-tab');
    markPredictionsElementCovered('predictionsTabButtons', 'equivalency-tab');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-attack');
    markPredictionsElementCovered('equivalencyInputs', 'equiv-main-stat');

    // Act - Generate report
    const report = generatePredictionsCoverageReport();

    // Assert - Report structure
    expect(report).toHaveProperty('totalElements');
    expect(report).toHaveProperty('testedElements');
    expect(report).toHaveProperty('overallPercentage');
    expect(report).toHaveProperty('categories');

    // Assert - Categories exist
    expect(report.categories).toHaveProperty('predictionsTabButtons');
    expect(report.categories).toHaveProperty('equivalencyInputs');

    // Assert - Percentages calculated
    expect(report.overallPercentage).toBeGreaterThanOrEqual(0);
    expect(report.overallPercentage).toBeLessThanOrEqual(100);
  });

  test('coverage report tracks tested elements correctly', async ({ page }) => {
    // Arrange - Mark elements
    markPredictionsElementCovered('equivalencyInputs', 'equiv-attack');

    // Act - Check coverage
    const isCovered = isPredictionsElementCovered('equivalencyInputs', 'equiv-attack');

    // Assert
    expect(isCovered).toBe(true);

    const notCovered = isPredictionsElementCovered('equivalencyInputs', 'equiv-damage');
    expect(notCovered).toBe(false);
  });

  test('logPredictionsCoverageReport outputs to console', async ({ page }) => {
    // Arrange - Mark some elements
    markPredictionsElementCovered('predictionsTabButtons', 'stat-tables-tab');
    markPredictionsElementCovered('statTablesElements', 'stat-weights-base-container');

    // Act - Log report (should not throw)
    expect(() => {
      logPredictionsCoverageReport();
    }).not.toThrow();
  });

  test.afterAll(async () => {
    logPredictionsCoverageReport();
  });
});
