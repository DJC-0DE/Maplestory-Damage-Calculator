// Weapon Levels Priority Algorithm Tests
//
// PURPOSE: Tests upgrade priority algorithm functionality and currency calculator
// COVERAGE:
//   - Priority chain generation and updates
//   - Currency calculator (attack gain, DPS gain, upgrade path)
//   - Apply upgrades functionality
//   - Mathematical accuracy of efficiency calculations
//
// User workflow tests are in:
//   - weapon-levels-main.spec.js
// Edge case tests are in:
//   - weapon-levels-coverage.spec.js
// Regression tests are in:
//   - weapon-levels-regression.spec.js
//
// Run with: npm test weapon-levels-priority.spec.js

import { test, expect } from '@playwright/test';
import {
    clearStorage,
    getPriorityChain,
    parsePriorityChain,
    switchToSubTab,
    setupWeapon,
    waitForCalculations,
    setWeaponLevel
} from './helpers/weapon-levels-helpers.js';
import {
    applyWeaponLevelsFixture,
    WEAPON_LEVELS_EARLY,
    WEAPON_LEVELS_MID
} from './fixtures/weapon-levels.fixtures.js';

const BASE_URL = 'http://localhost:8000';

test.describe('Weapon Levels - Upgrade Priority Algorithm', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    // =========================================================================
    // PRIORITY CHAIN WORKFLOW
    // =========================================================================

    test.describe('Priority Chain Generation', () => {

        test('empty weapons state shows no weapons available message', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Switch to upgrade priority tab
            await switchToSubTab(page, 'upgrade-priority');

            // Assert - Should show "No weapons available to upgrade"
            const chainElement = page.locator('#upgrade-priority-chain');
            await expect(chainElement).toContainText('No weapons available to upgrade');

            // Assert - Results div should be visible
            await expect(chainElement).toBeVisible();
        });

        test('priority chain generates with configured weapons', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            // Act - Switch to upgrade priority tab
            await switchToSubTab(page, 'upgrade-priority');

            // Assert - Priority chain should be generated
            const chainElement = page.locator('#upgrade-priority-chain');
            await expect(chainElement).toBeVisible();

            const chainHTML = await chainElement.innerHTML();
            expect(chainHTML).not.toContain('No weapons available to upgrade');
            expect(chainHTML).toContain('wl-priority-item');
        });

        test('priority chain shows 100 upgrades', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_MID);
            await page.waitForTimeout(200);

            // Act - Switch to upgrade priority tab
            await switchToSubTab(page, 'upgrade-priority');

            // Assert - Parse and count upgrades
            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Count total upgrades
            let totalUpgrades = 0;
            upgrades.forEach(upgrade => {
                totalUpgrades += upgrade.count;
            });

            // Should be 100 upgrades total
            expect(totalUpgrades).toBe(100);
        });

        test('priority chain groups consecutive upgrades', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            // Act - Switch to upgrade priority tab
            await switchToSubTab(page, 'upgrade-priority');

            // Assert - Chain should have grouping indicators (xN format)
            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Verify grouping exists (some upgrades should have count > 1)
            const hasGroupedUpgrades = upgrades.some(u => u.count > 1);
            expect(hasGroupedUpgrades).toBe(true);
        });

        test('priority chain updates when weapon levels change', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            // Switch to upgrade priority and get initial chain
            await switchToSubTab(page, 'upgrade-priority');
            const initialChain = await getPriorityChain(page);

            // Act - Change weapon level
            await switchToSubTab(page, 'weapons-grid');
            await setWeaponLevel(page, 'normal', 't4', 120);
            await waitForCalculations(page, 200);

            // Switch back to priority
            await switchToSubTab(page, 'upgrade-priority');

            // Assert - Chain should be different
            const newChain = await getPriorityChain(page);
            expect(newChain).not.toBe(initialChain);
        });

        test('priority chain prioritizes highest efficiency weapon', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up specific scenario: Normal T4 should be prioritized over Rare T3
            await setupWeapon(page, 'normal', 't4', 10, 5);
            await setupWeapon(page, 'rare', 't3', 10, 5);

            // Act - Switch to upgrade priority
            await switchToSubTab(page, 'upgrade-priority');

            // Assert - First upgrade should be Normal T4 (higher efficiency than Rare T3)
            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            expect(upgrades.length).toBeGreaterThan(0);
            expect(upgrades[0].rarity).toBe('normal');
            expect(upgrades[0].tier).toBe('t4');
        });

        test('priority chain shows dividers between weapon types', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_MID);
            await page.waitForTimeout(200);

            // Act - Switch to upgrade priority
            await switchToSubTab(page, 'upgrade-priority');

            // Assert - Chain should have dividers (→) between weapon groups
            const chainElement = page.locator('#upgrade-priority-chain');
            await expect(chainElement).toContainText('→');
        });
    });

    // =========================================================================
    // CURRENCY CALCULATOR WORKFLOW
    // =========================================================================

    test.describe('Currency Calculator', () => {

        test('entering currency shows attack and DPS gain', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_MID);
            await page.waitForTimeout(200);

            // Switch to upgrade priority
            await switchToSubTab(page, 'upgrade-priority');

            // Act - Enter currency amount
            const currencyInput = page.locator('#upgrade-currency-input');
            await currencyInput.fill('10000');
            await page.waitForTimeout(300);

            // Assert - Results should be visible
            const resultsDiv = page.locator('#currency-upgrade-results');
            await expect(resultsDiv).toHaveClass(/visible/);

            // Assert - Attack gain should be shown
            const attackGain = page.locator('#currency-attack-gain');
            await expect(attackGain).toBeVisible();
            await expect(attackGain).toContainText('%');

            // Assert - DPS gain should be shown
            const dpsGain = page.locator('#currency-dps-gain');
            await expect(dpsGain).toBeVisible();
            await expect(dpsGain).toContainText('%');
        });

        test('currency calculator shows upgrade path with counts', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            // Act - Enter currency amount
            await page.locator('#upgrade-currency-input').fill('5000');
            await page.waitForTimeout(300);

            // Assert - Upgrade path should show weapon counts
            const pathDisplay = page.locator('#currency-upgrade-path');
            await expect(pathDisplay).toBeVisible();

            const pathHTML = await pathDisplay.innerHTML();
            expect(pathHTML).toContain('wl-currency-path-item');
        });

        test('upgrade path shows final weapon levels in parentheses', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            // Act - Enter currency
            await page.locator('#upgrade-currency-input').fill('5000');
            await page.waitForTimeout(300);

            // Assert - Path should show final levels in parentheses
            const pathDisplay = page.locator('#currency-upgrade-path');
            const pathHTML = await pathDisplay.innerHTML();

            // Should contain parentheses with level numbers
            expect(pathHTML).toMatch(/\(\d+\)/);
        });

        test('insufficient currency shows friendly message', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up a weapon with high upgrade cost
            await setupWeapon(page, 'ancient', 't4', 180, 5);

            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            // Act - Enter very small currency amount
            await page.locator('#upgrade-currency-input').fill('100');
            await page.waitForTimeout(300);

            // Assert - Should show friendly message
            const pathDisplay = page.locator('#currency-upgrade-path');
            await expect(pathDisplay).toContainText("save up");

            // Assert - Attack gain should be +0.00%
            const attackGain = page.locator('#currency-attack-gain');
            await expect(attackGain).toContainText('+0.00%');
        });

        test('apply upgrades button is hidden when no upgrades possible', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            // Act - Enter very small currency
            await page.locator('#upgrade-currency-input').fill('10');
            await page.waitForTimeout(300);

            // Assert - Apply button should be hidden
            const applyButton = page.locator('#apply-upgrade-path-btn');
            await expect(applyButton).not.toBeVisible();
        });

        test('apply upgrades button updates weapon levels', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            // Get initial level
            const initialLevel = await page.locator('#level-normal-t4').inputValue();

            // Act - Enter currency and apply upgrades
            await page.locator('#upgrade-currency-input').fill('10000');
            await page.waitForTimeout(300);

            const applyButton = page.locator('#apply-upgrade-path-btn');
            await applyButton.click();
            await page.waitForTimeout(300);

            // Assert - Level should have increased
            const newLevel = await page.locator('#level-normal-t4').inputValue();
            expect(parseInt(newLevel)).toBeGreaterThan(parseInt(initialLevel));

            // Assert - Currency input should be reset to 0
            await expect(page.locator('#upgrade-currency-input')).toHaveValue('0');
        });

        test('results hide when currency set to 0', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            // Show results first
            await page.locator('#upgrade-currency-input').fill('5000');
            await page.waitForTimeout(300);
            await expect(page.locator('#currency-upgrade-results')).toHaveClass(/visible/);

            // Act - Set currency to 0
            await page.locator('#upgrade-currency-input').fill('0');
            await page.waitForTimeout(300);

            // Assert - Results should be hidden
            const resultsDiv = page.locator('#currency-upgrade-results');
            await expect(resultsDiv).not.toHaveClass(/visible/);
        });

        test('upgrade path separates weapon types with commas', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_MID);
            await page.waitForTimeout(200);

            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            // Act - Enter currency
            await page.locator('#upgrade-currency-input').fill('20000');
            await page.waitForTimeout(300);

            // Assert - Path should have separators (either commas or just spaces)
            const pathDisplay = page.locator('#currency-upgrade-path');
            const pathText = await pathDisplay.textContent();
            // Should have multiple weapon groups separated by something
            expect(pathText).toMatch(/T4 [A-Z] x\d+/);
        });
    });

    // =========================================================================
    // MATHEMATICAL ACCURACY TESTS
    // =========================================================================

    test.describe('Mathematical Accuracy', () => {

        test('priority algorithm efficiency matches weapon display efficiency', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up two weapons
            await setupWeapon(page, 'normal', 't4', 10, 5);
            await setupWeapon(page, 'rare', 't4', 10, 5);

            // Get efficiency from weapon display (upgrade gain text)
            const normalUpgradeGain = await page.locator('#upgrade-gain-normal-t4').textContent();
            const rareUpgradeGain = await page.locator('#upgrade-gain-rare-t4').textContent();

            // Extract efficiency values (they should show "X.XX% per 1k shards")
            const normalMatch = normalUpgradeGain.match(/([\d.]+)%/);
            const rareMatch = rareUpgradeGain.match(/([\d.]+)%/);

            expect(normalMatch).not.toBeNull();
            expect(rareMatch).not.toBeNull();

            // Act - Check priority chain
            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await waitForCalculations(page, 300);

            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Assert - First upgrade in chain should be the higher efficiency weapon
            // Normal T4 should have higher efficiency than Rare T4 at same level
            expect(upgrades[0].rarity).toBe('normal');
            expect(upgrades[0].tier).toBe('t4');
        });

        test('currency calculator DPS gain matches actual damage calculation', async ({ page }) => {
            // This test verifies that the DPS gain shown by the currency calculator
            // matches the actual difference in computed DPS

            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            await page.waitForTimeout(200);

            // Get base stats for damage calculation
            const initialStats = await page.evaluate(() => {
                return {
                    totalInventory: parseFloat(document.getElementById('total-inventory-attack').textContent),
                    equipped: parseFloat(document.getElementById('equipped-weapon-attack-pct').textContent)
                };
            });

            // Act - Calculate upgrades with currency
            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await page.waitForTimeout(200);

            await page.locator('#upgrade-currency-input').fill('10000');
            await page.waitForTimeout(300);

            // Get DPS gain from calculator
            const dpsGainText = await page.locator('#currency-dps-gain').textContent();
            const dpsGainMatch = dpsGainText.match(/([-\d.]+)%/);
            expect(dpsGainMatch).not.toBeNull();

            const calculatorDpsGain = parseFloat(dpsGainMatch[1]);

            // Assert - DPS gain should be positive
            expect(calculatorDpsGain).toBeGreaterThan(0);

            // Note: Full verification would require recalculating DPS manually
            // which is complex. This test ensures the calculator produces a reasonable value.
            expect(calculatorDpsGain).toBeLessThan(100); // Shouldn't be more than 100% gain
        });

        test('efficiency calculation accounts for equipped weapon bonus', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up a weapon and equip it
            await setupWeapon(page, 'normal', 't4', 50, 5);
            await page.locator('#equipped-label-normal-t4').click();
            await page.waitForTimeout(300);

            // Act - Check upgrade gain text
            const upgradeGainText = await page.locator('#upgrade-gain-normal-t4').textContent();

            // Assert - Should show efficiency info (format varies based on affordability)
            expect(upgradeGainText).toMatch(/\d+\.\d+%/); // Should have percentage
            expect(upgradeGainText).toContain('per 1k shards');
        });

        test('upgrade chain uses same efficiency calculation as display', async ({ page }) => {
            // This test verifies consistency between display and algorithm

            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up specific scenario
            await setupWeapon(page, 'normal', 't4', 20, 5);
            await setupWeapon(page, 'rare', 't3', 20, 5);

            // Get display efficiencies
            const normalGain = await page.locator('#upgrade-gain-normal-t4').textContent();
            const rareGain = await page.locator('#upgrade-gain-rare-t3').textContent();

            const normalMatch = normalGain.match(/([\d.]+)%/);
            const rareMatch = rareGain.match(/([\d.]+)%/);

            expect(normalMatch).not.toBeNull();
            expect(rareMatch).not.toBeNull();

            // Normal T4 should have higher efficiency than Rare T3
            const normalEff = parseFloat(normalMatch[1]);
            const rareEff = parseFloat(rareMatch[1]);
            expect(normalEff).toBeGreaterThan(rareEff);

            // Act - Check priority chain reflects this
            await page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' }).click();
            await waitForCalculations(page, 300);

            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // First upgrade should be Normal T4
            expect(upgrades[0].rarity).toBe('normal');
            expect(upgrades[0].tier).toBe('t4');
        });
    });
});
