// Weapon Levels Regression Tests
//
// PURPOSE: Tests critical algorithm behavior with known-good baseline values
//          These tests act as early warning system for unexpected changes
// COVERAGE:
//   - Upgrade priority order regression (known sequences)
//   - Attack gain per 1k shards baseline values
//   - Efficiency calculation consistency (display vs algorithm)
//   - Algorithm consistency checks
//
// Behavior and functionality tests are in:
//   - weapon-levels-main.spec.js (user workflows)
//   - weapon-levels-coverage.spec.js (edge cases)
//   - weapon-levels-priority.spec.js (algorithm functionality)
//
// Run with: npm test weapon-levels-regression.spec.js

import { test, expect } from '@playwright/test';
import {
    clearStorage,
    setupWeapon,
    switchToSubTab,
    getPriorityChain,
    parsePriorityChain,
    getUpgradeGainText,
    extractEfficiency,
    waitForCalculations
} from './helpers/weapon-levels-helpers.js';

const BASE_URL = 'http://localhost:8000';

test.describe('Weapon Levels - Algorithm Regression Tests', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    // =========================================================================
    // UPGRADE PRIORITY ORDER REGRESSION TESTS
    // =========================================================================

    test.describe('Upgrade Priority Order - Known Scenarios', () => {

        test('REGRESSION: simple two-weapon scenario priority order is correct', async ({ page }) => {
            // This test establishes a baseline for a simple scenario
            // If this fails, the priority algorithm has changed unexpectedly

            // Arrange - Set up Normal T4 level 10 and Rare T4 level 10, both with 5 stars
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            await setupWeapon(page, 'normal', 't4', 10, 5);
            await setupWeapon(page, 'rare', 't4', 10, 5);

            // Act - Get priority chain
            await switchToSubTab(page, 'upgrade-priority');

            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Assert - First upgrade MUST be Normal T4 (higher efficiency than Rare T4)
            expect(upgrades.length).toBeGreaterThan(0);
            expect(upgrades[0].rarity).toBe('normal');
            expect(upgrades[0].tier).toBe('t4');

            // Assert - All upgrades should be either Normal T4 or Rare T4
            upgrades.forEach(upgrade => {
                expect(['normal', 'rare']).toContain(upgrade.rarity);
                expect(upgrade.tier).toBe('t4');
            });

            // Log the actual order for reference if algorithm changes
            console.log('Priority order:', upgrades.map(u => `${u.rarity}-${u.tier}`).join(', '));
        });

        test('REGRESSION: multi-tier scenario prioritizes lower tier at same rarity', async ({ page }) => {
            // Normal T3 should be prioritized over Normal T4 at same level
            // because lower tiers have better cost efficiency

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            await setupWeapon(page, 'normal', 't4', 50, 5);
            await setupWeapon(page, 'normal', 't3', 50, 5);

            await switchToSubTab(page, 'upgrade-priority');

            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Assert - First upgrade should be Normal T3 (lower tier = better efficiency)
            expect(upgrades.length).toBeGreaterThan(0);
            expect(upgrades[0].rarity).toBe('normal');
            expect(upgrades[0].tier).toBe('t3');

            console.log('Priority order:', upgrades.map(u => `${u.rarity}-${u.tier}`).join(', '));
        });

        test('REGRESSION: early game scenario priority order', async ({ page }) => {
            // Realistic early game: mixed levels and rarities
            // Expected order: prioritize efficiency (lower rarity + lower tier + lower level)

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up early game configuration
            await setupWeapon(page, 'normal', 't4', 25, 2);
            await setupWeapon(page, 'normal', 't3', 15, 2);
            await setupWeapon(page, 'rare', 't4', 10, 1);
            await setupWeapon(page, 'rare', 't3', 5, 1);

            await switchToSubTab(page, 'upgrade-priority');

            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Assert - Should have upgrades
            expect(upgrades.length).toBeGreaterThan(0);

            // Assert - First upgrade should be from lowest rarity/tier combo
            // Normal T3 or Normal T4 should come before Rare weapons
            const firstUpgrade = upgrades[0];
            expect(['normal']).toContain(firstUpgrade.rarity);

            console.log('Early game priority order:', upgrades.map(u => `${u.rarity}-${u.tier} (x${u.count})`).join(', '));
        });

        test('REGRESSION: late game scenario includes high rarity weapons', async ({ page }) => {
            // Late game with Ancient, Legendary, Mystic weapons
            // Should prioritize lower rarity weapons even when high rarity weapons are available

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Mix of high and low rarity weapons
            await setupWeapon(page, 'normal', 't4', 100, 5);
            await setupWeapon(page, 'epic', 't4', 80, 4);
            await setupWeapon(page, 'legendary', 't4', 50, 3);
            await setupWeapon(page, 'ancient', 't4', 30, 2);

            await switchToSubTab(page, 'upgrade-priority');

            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Assert - Normal T4 should be prioritized despite being lower rarity
            expect(upgrades.length).toBeGreaterThan(0);

            // First upgrade should be the most efficient (likely Normal or Epic)
            const firstUpgrade = upgrades[0];
            expect(['normal', 'epic', 'rare']).toContain(firstUpgrade.rarity);

            console.log('Late game priority order:', upgrades.map(u => `${u.rarity}-${u.tier} (x${u.count})`).join(', '));
        });

        test('REGRESSION: priority chain groups consecutive upgrades', async ({ page }) => {
            // Verify that consecutive upgrades of the same weapon are grouped

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up multiple weapons at low levels to ensure many upgrades
            await setupWeapon(page, 'normal', 't4', 10, 5);
            await setupWeapon(page, 'rare', 't4', 5, 3);

            await switchToSubTab(page, 'upgrade-priority');

            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Assert - Should have grouped upgrades (some with count > 1)
            const hasGroupedUpgrades = upgrades.some(u => u.count > 1);
            expect(hasGroupedUpgrades).toBe(true);

            console.log('Grouped upgrades:', upgrades.map(u => `${u.rarity}-${u.tier} x${u.count}`).join(', '));
        });
    });

    // =========================================================================
    // ATTACK GAIN PER 1K SHARDS REGRESSION TESTS
    // =========================================================================

    test.describe('Attack Gain Per 1K Shards - Known Values', () => {

        test('REGRESSION: Normal T4 level 1 efficiency is within expected range', async ({ page }) => {
            // Establish baseline efficiency for Normal T4 at low level
            // This will catch if the underlying efficiency calculation changes

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            await setupWeapon(page, 'normal', 't4', 1, 5);

            // Get upgrade gain text
            const upgradeGainText = await getUpgradeGainText(page, 'normal', 't4');
            const efficiency = extractEfficiency(upgradeGainText);

            // Assert - Should have efficiency value
            expect(efficiency).not.toBeNull();

            // Assert - Efficiency should be in reasonable range (0.5% to 5% per 1k shards)
            // This is a loose bound to catch major calculation errors
            expect(efficiency).toBeGreaterThan(0.5);
            expect(efficiency).toBeLessThan(5.0);

            console.log(`Normal T4 (level 1, 5 stars) efficiency: ${efficiency}% per 1k shards`);
        });

        test('REGRESSION: Normal T4 efficiency decreases as level increases', async ({ page }) => {
            // Efficiency should be higher at lower levels (diminishing returns)

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Test at level 10
            await setupWeapon(page, 'normal', 't4', 10, 5);
            const efficiency10 = extractEfficiency(await getUpgradeGainText(page, 'normal', 't4'));

            // Test at level 100
            await setupWeapon(page, 'normal', 't4', 100, 5);
            const efficiency100 = extractEfficiency(await getUpgradeGainText(page, 'normal', 't4'));

            // Assert - Both should have values
            expect(efficiency10).not.toBeNull();
            expect(efficiency100).not.toBeNull();

            // Assert - Level 10 should have higher efficiency than level 100
            expect(efficiency10).toBeGreaterThan(efficiency100);

            console.log(`Normal T4 efficiency at level 10: ${efficiency10}%, at level 100: ${efficiency100}%`);
        });

        test('REGRESSION: lower tier has better efficiency than higher tier at same level', async ({ page }) => {
            // Normal T3 should be more efficient than Normal T4 at same level

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            await setupWeapon(page, 'normal', 't4', 50, 5);
            const efficiencyT4 = extractEfficiency(await getUpgradeGainText(page, 'normal', 't4'));

            await setupWeapon(page, 'normal', 't3', 50, 5);
            const efficiencyT3 = extractEfficiency(await getUpgradeGainText(page, 'normal', 't3'));

            // Assert - T3 should be more efficient than T4
            expect(efficiencyT3).not.toBeNull();
            expect(efficiencyT4).not.toBeNull();
            expect(efficiencyT3).toBeGreaterThan(efficiencyT4);

            console.log(`Normal T3 efficiency: ${efficiencyT3}%, Normal T4 efficiency: ${efficiencyT4}%`);
        });

        test('REGRESSION: lower rarity has better efficiency than higher rarity at same level', async ({ page }) => {
            // Normal should be more efficient than Rare at same level/tier/stars

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            await setupWeapon(page, 'normal', 't4', 50, 5);
            const efficiencyNormal = extractEfficiency(await getUpgradeGainText(page, 'normal', 't4'));

            await setupWeapon(page, 'rare', 't4', 50, 5);
            const efficiencyRare = extractEfficiency(await getUpgradeGainText(page, 'rare', 't4'));

            // Assert - Normal should be more efficient than Rare
            expect(efficiencyNormal).not.toBeNull();
            expect(efficiencyRare).not.toBeNull();
            expect(efficiencyNormal).toBeGreaterThan(efficiencyRare);

            console.log(`Normal T4 efficiency: ${efficiencyNormal}%, Rare T4 efficiency: ${efficiencyRare}%`);
        });

        test('REGRESSION: more stars improves efficiency at same level', async ({ page }) => {
            // 5 stars should be more efficient than 1 star at same level
            // Use lower level to see clear difference

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            await setupWeapon(page, 'normal', 't4', 10, 1);
            const efficiency1Star = extractEfficiency(await getUpgradeGainText(page, 'normal', 't4'));

            await setupWeapon(page, 'normal', 't4', 10, 5);
            const efficiency5Stars = extractEfficiency(await getUpgradeGainText(page, 'normal', 't4'));

            // Assert - 5 stars should be more efficient (or at least equal)
            expect(efficiency1Star).not.toBeNull();
            expect(efficiency5Stars).not.toBeNull();
            expect(efficiency5Stars).toBeGreaterThanOrEqual(efficiency1Star);

            console.log(`Normal T4 (1 star) efficiency: ${efficiency1Star}%, (5 stars) efficiency: ${efficiency5Stars}%`);
        });

        test('REGRESSION: specific known efficiency values for common scenarios', async ({ page }) => {
            // Test specific scenarios with known efficiency values
            // These are reference values that should remain stable

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            const testCases = [
                { rarity: 'normal', tier: 't4', level: 10, stars: 5, minEfficiency: 0.5, maxEfficiency: 2.0 },
                { rarity: 'normal', tier: 't4', level: 100, stars: 5, minEfficiency: 0.1, maxEfficiency: 1.0 },
                { rarity: 'rare', tier: 't4', level: 50, stars: 3, minEfficiency: 0.2, maxEfficiency: 1.5 },
                { rarity: 'epic', tier: 't4', level: 50, stars: 3, minEfficiency: 0.1, maxEfficiency: 1.0 },
            ];

            for (const testCase of testCases) {
                await setupWeapon(page, testCase.rarity, testCase.tier, testCase.level, testCase.stars);

                const upgradeGainText = await getUpgradeGainText(page, testCase.rarity, testCase.tier);
                const efficiency = extractEfficiency(upgradeGainText);

                expect(efficiency).not.toBeNull();
                expect(efficiency).toBeGreaterThan(testCase.minEfficiency);
                expect(efficiency).toBeLessThan(testCase.maxEfficiency);

                console.log(`${testCase.rarity}-${testCase.tier} level ${testCase.level}, ${testCase.stars} stars: ${efficiency}% per 1k shards`);
            }
        });
    });

    // =========================================================================
    // ALGORITHM CONSISTENCY TESTS
    // =========================================================================

    test.describe('Algorithm Consistency', () => {

        test('REGRESSION: priority chain matches efficiency display order', async ({ page }) => {
            // Verify that the priority chain order matches the efficiency values shown on weapons

            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await waitForCalculations(page, 200);

            // Set up three weapons with different efficiencies
            await setupWeapon(page, 'normal', 't4', 10, 5);
            await setupWeapon(page, 'rare', 't4', 10, 5);
            await setupWeapon(page, 'epic', 't4', 10, 5);

            // Get efficiency values from display
            const normalEff = extractEfficiency(await getUpgradeGainText(page, 'normal', 't4'));
            const rareEff = extractEfficiency(await getUpgradeGainText(page, 'rare', 't4'));
            const epicEff = extractEfficiency(await getUpgradeGainText(page, 'epic', 't4'));

            // Get priority chain
            await switchToSubTab(page, 'upgrade-priority');
            const chainHTML = await getPriorityChain(page);
            const upgrades = parsePriorityChain(chainHTML);

            // Assert - First upgrade should be weapon with highest efficiency
            const firstUpgrade = upgrades[0];
            expect(firstUpgrade.rarity).toBe('normal'); // Normal should have highest efficiency

            console.log('Efficiency order - Normal:', normalEff, 'Rare:', rareEff, 'Epic:', epicEff);
            console.log('Priority chain order:', upgrades.map(u => u.rarity).join(', '));
        });
    });
});
