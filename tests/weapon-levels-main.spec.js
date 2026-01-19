// Weapon Levels Main Workflow Tests
// Tests user workflows: first-time setup, adjustments, and cross-tab navigation
// Run with: npm test weapon-levels-main.spec.js

import { test, expect } from '@playwright/test';
import {
    clearStorage,
    verifyWeaponStats,
    verifySummaryStats,
    verifySubTabActive,
    getWeaponLevelFromStorage,
    getWeaponStarsFromStorage,
    getEquippedWeaponFromStorage,
    markElementCovered
} from './helpers/weapon-levels-helpers.js';
import {
    applyWeaponLevelsFixture,
    WEAPON_LEVELS_EMPTY,
    WEAPON_LEVELS_EARLY,
    WEAPON_LEVELS_MID
} from './fixtures/weapon-levels.fixtures.js';

const BASE_URL = 'http://localhost:8000';

test.describe('Weapon Levels - Main User Workflows', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
        markElementCovered('weapon-levels-beforeEach');
    });

    // =========================================================================
    // FIRST-TIME USER SETUP WORKFLOW
    // =========================================================================

    test.describe('First-Time Setup Workflow', () => {

        test('should display empty state with all weapons at level 0', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Assert - Verify weapons grid sub-tab is active
            await verifySubTabActive(page, 'weapons-grid');

            // Assert - Verify summary stats show 0
            await expect(page.locator('#total-inventory-attack')).toHaveText('0%');
            await expect(page.locator('#equipped-weapon-attack-pct')).toHaveText('0%');
            await expect(page.locator('#total-weapon-attack')).toHaveText('0%');

            // Assert - Verify all level inputs are 0
            const levelInputs = page.locator('input[id^="level-"]');
            const inputCount = await levelInputs.count();

            for (let i = 0; i < Math.min(5, inputCount); i++) {
                await expect(levelInputs.nth(i)).toHaveValue('0');
            }

            markElementCovered('empty-state-weapon-levels');
        });

        test('setting first weapon level updates inventory and summary stats', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Act - Set Normal T4 to level 25
            const levelInput = page.locator('#level-normal-t4');
            await levelInput.fill('25');
            await page.waitForTimeout(300);

            // Assert - Direct state: inventory display shows correct attack
            const inventoryDisplay = page.locator('#inventory-display-normal-t4');
            await expect(inventoryDisplay).toBeVisible();
            await expect(inventoryDisplay).toContainText('inventory attack');

            // Assert - Side effects: summary stats updated
            const totalInventory = page.locator('#total-inventory-attack');
            await expect(totalInventory).not.toHaveText('0%');

            markElementCovered('set-weapon-level-normal-t4');
        });

        test('clicking star rating updates visual state and enforces max level', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Act - Click 3rd star on Normal T4
            const star3 = page.locator('#star-normal-t4-3');
            await star3.click();
            await page.waitForTimeout(200);

            // Assert - Direct state: star is active
            await expect(star3).toHaveClass(/active/);

            // Assert - Side effects: stars 1 and 2 are also active
            await expect(page.locator('#star-normal-t4-1')).toHaveClass(/active/);
            await expect(page.locator('#star-normal-t4-2')).toHaveClass(/active/);
            await expect(page.locator('#star-normal-t4-4')).not.toHaveClass(/active/);
            await expect(page.locator('#star-normal-t4-5')).not.toHaveClass(/active/);

            // Assert - Max level enforced (3 stars = max level 160)
            const levelInput = page.locator('#level-normal-t4');
            const maxAttr = await levelInput.getAttribute('max');
            expect(parseInt(maxAttr)).toBe(160);

            markElementCovered('star-rating-normal-t4');
        });

        test('equipping weapon shows equipped display and hides others', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Set up Normal T4 first
            await page.locator('#level-normal-t4').fill('50');
            await page.waitForTimeout(200);

            // Act - Check equipped checkbox (click the label since checkbox is hidden)
            const equippedLabel = page.locator('#equipped-label-normal-t4');
            await equippedLabel.click();
            await page.waitForTimeout(200);

            // Assert - Direct state: checkbox is checked
            const equippedCheckbox = page.locator('#equipped-checkbox-normal-t4');
            await expect(equippedCheckbox).toBeChecked();

            // Assert - Side effects: equipped display is visible
            const equippedDisplay = page.locator('#equipped-display-normal-t4');
            await expect(equippedDisplay).toBeVisible();

            const equippedValue = page.locator('#equipped-value-normal-t4');
            await expect(equippedValue).toContainText('equipped attack');

            // Assert - Side effects: card has equipped class
            const weaponCard = page.locator('#weapon-normal-t4');
            await expect(weaponCard).toHaveClass(/equipped/);

            // Assert - Side effects: no-weapon-equipped-indicator is hidden
            const indicator = page.locator('#no-weapon-equipped-indicator');
            await expect(indicator).not.toBeVisible();

            markElementCovered('equipped-checkbox-normal-t4');
        });

        test('switching equipped weapon unchecks previous', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);

            // Set up and equip Normal T4
            await page.locator('#level-normal-t4').fill('50');
            await page.locator('#equipped-label-normal-t4').click();
            await page.waitForTimeout(200);

            // Set up Rare T4
            await page.locator('#level-rare-t4').fill('30');
            await page.waitForTimeout(200);

            // Act - Equip Rare T4
            await page.locator('#equipped-label-rare-t4').click();
            await page.waitForTimeout(200);

            // Assert - Direct state: new checkbox is checked
            await expect(page.locator('#equipped-checkbox-rare-t4')).toBeChecked();

            // Assert - Side effects: previous checkbox is unchecked
            await expect(page.locator('#equipped-checkbox-normal-t4')).not.toBeChecked();

            // Assert - Side effects: previous equipped display is hidden
            await expect(page.locator('#equipped-display-normal-t4')).not.toBeVisible();

            // Assert - Side effects: previous card doesn't have equipped class
            await expect(page.locator('#weapon-normal-t4')).not.toHaveClass(/equipped/);

            // Assert - Side effects: new equipped display is visible
            await expect(page.locator('#equipped-display-rare-t4')).toBeVisible();

            markElementCovered('switch-equipped-weapon');
        });

        test('star toggle behavior: clicking same star sets to 0', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);

            // Set stars to 3
            await page.locator('#star-normal-t4-3').click();
            await page.waitForTimeout(200);
            await expect(page.locator('#star-normal-t4-3')).toHaveClass(/active/);

            // Act - Click the same star (3rd) again
            await page.locator('#star-normal-t4-3').click();
            await page.waitForTimeout(200);

            // Assert - All stars should be inactive
            await expect(page.locator('#star-normal-t4-1')).not.toHaveClass(/active/);
            await expect(page.locator('#star-normal-t4-2')).not.toHaveClass(/active/);
            await expect(page.locator('#star-normal-t4-3')).not.toHaveClass(/active/);
            await expect(page.locator('#star-normal-t4-4')).not.toHaveClass(/active/);
            await expect(page.locator('#star-normal-t4-5')).not.toHaveClass(/active/);

            // Assert - Max level should be 0 (no stars)
            const levelInput = page.locator('#level-normal-t4');
            const maxAttr = await levelInput.getAttribute('max');
            expect(parseInt(maxAttr)).toBe(0);

            markElementCovered('star-toggle-behavior');
        });
    });

    // =========================================================================
    // ADJUSTMENT WORKFLOW
    // =========================================================================

    test.describe('Adjustment Workflow', () => {

        test('changing existing weapon level recalculates displays', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);
            const initialInventory = await page.locator('#total-inventory-attack').textContent();

            // Act - Increase Normal T4 level from 25 to 50
            const levelInput = page.locator('#level-normal-t4');
            await levelInput.fill('50');
            await page.waitForTimeout(300);

            // Assert - Direct state: input shows new value
            await expect(levelInput).toHaveValue('50');

            // Assert - Side effects: inventory display updated
            const newInventory = await page.locator('#total-inventory-attack').textContent();
            expect(newInventory).not.toBe(initialInventory);

            markElementCovered('change-weapon-level');
        });

        test('upgrade gain text shows when below max level', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);

            // Set weapon to level 10 with 5 stars (max 200)
            await page.locator('#star-normal-t4-5').click();
            await page.locator('#level-normal-t4').fill('10');
            await page.waitForTimeout(300);

            // Assert - Upgrade gain container should be visible
            const upgradeGainContainer = page.locator('#upgrade-gain-container-normal-t4');
            await expect(upgradeGainContainer).toHaveClass(/visible/);

            // Assert - Upgrade gain text should contain efficiency info
            const upgradeGainText = page.locator('#upgrade-gain-normal-t4');
            await expect(upgradeGainText).toBeVisible();
            await expect(upgradeGainText).not.toHaveText('');

            markElementCovered('upgrade-gain-display');
        });

        test('upgrade gain hides when at max level', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);

            // Set weapon to max level (200) with 5 stars
            await page.locator('#star-normal-t4-5').click();
            await page.locator('#level-normal-t4').fill('200');
            await page.waitForTimeout(300);

            // Assert - Upgrade gain container should not be visible
            const upgradeGainContainer = page.locator('#upgrade-gain-container-normal-t4');
            await expect(upgradeGainContainer).not.toHaveClass(/visible/);

            markElementCovered('upgrade-gain-max-level');
        });

        test('upgrade gain hides when level is 0', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Assert - At level 0, upgrade gain should not be visible
            const upgradeGainContainer = page.locator('#upgrade-gain-container-normal-t4');
            await expect(upgradeGainContainer).not.toHaveClass(/visible/);

            markElementCovered('upgrade-gain-level-zero');
        });

        test('color coding updates based on efficiency tier', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);

            // Set up multiple weapons with different levels
            await page.locator('#star-normal-t4-5').click();
            await page.locator('#level-normal-t4').fill('50');

            await page.locator('#star-rare-t4-5').click();
            await page.locator('#level-rare-t4').fill('30');
            await page.waitForTimeout(300);

            // Assert - Upgrade gain displays should have efficiency classes
            const normalUpgradeGain = page.locator('#upgrade-gain-normal-t4');
            const rareUpgradeGain = page.locator('#upgrade-gain-rare-t4');

            // Both should have one of: high, medium, low class
            await expect(normalUpgradeGain).toHaveClass(/high|medium|low/);
            await expect(rareUpgradeGain).toHaveClass(/high|medium|low/);

            markElementCovered('upgrade-efficiency-color-coding');
        });
    });

    // =========================================================================
    // SUB-TAB SWITCHING WORKFLOW
    // =========================================================================

    test.describe('Sub-Tab Switching', () => {

        test('switching from weapons grid to upgrade priority', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Verify starting on weapons grid
            await verifySubTabActive(page, 'weapons-grid');

            // Act - Click upgrade priority button
            const priorityButton = page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' });
            await priorityButton.click();
            await page.waitForTimeout(200);

            // Assert - Direct state: upgrade priority sub-tab is visible and active
            await verifySubTabActive(page, 'upgrade-priority');

            // Assert - Side effects: weapons grid is hidden
            const weaponsGrid = page.locator('#weapon-levels-weapons-grid');
            await expect(weaponsGrid).not.toBeVisible();

            // Assert - Side effects: upgrade priority content is visible
            const priorityTab = page.locator('#weapon-levels-upgrade-priority');
            await expect(priorityTab).toBeVisible();

            markElementCovered('switch-to-upgrade-priority-tab');
        });

        test('switching from upgrade priority to weapons grid', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Switch to upgrade priority first
            const priorityButton = page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' });
            await priorityButton.click();
            await page.waitForTimeout(200);
            await verifySubTabActive(page, 'upgrade-priority');

            // Act - Click weapons grid button
            const gridButton = page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Weapons Grid' });
            await gridButton.click();
            await page.waitForTimeout(200);

            // Assert - Direct state: weapons grid sub-tab is visible and active
            await verifySubTabActive(page, 'weapons-grid');

            // Assert - Side effects: upgrade priority is hidden
            const priorityTab = page.locator('#weapon-levels-upgrade-priority');
            await expect(priorityTab).not.toBeVisible();

            markElementCovered('switch-to-weapons-grid-tab');
        });

        test('sub-tab selection persists after page reload', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Switch to upgrade priority
            const priorityButton = page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' });
            await priorityButton.click();
            await page.waitForTimeout(200);

            // Act - Reload page
            await page.reload();
            await page.waitForTimeout(200);

            // Assert - Should still be on upgrade priority tab
            await verifySubTabActive(page, 'upgrade-priority');

            markElementCovered('subtab-persistence-reload');
        });
    });

    // =========================================================================
    // CROSS-TAB NAVIGATION PERSISTENCE
    // =========================================================================

    test.describe('Cross-Tab Navigation Persistence', () => {

        test('navigating to equipment and back preserves weapon data', async ({ page }) => {
            // Arrange - Configure weapon levels
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);

            const initialTotal = await page.locator('#total-inventory-attack').textContent();
            const initialEquipped = await page.locator('#equipped-weapon-attack-pct').textContent();

            // Act - Navigate to Equipment tab
            await page.goto(`${BASE_URL}/#/setup/equipment`);
            await page.waitForTimeout(200);

            // Verify we're on equipment tab
            await expect(page.locator('#page-setup')).toBeVisible();

            // Act - Navigate back to Weapon Levels
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Assert - All data preserved
            await expect(page.locator('#level-normal-t4')).toHaveValue('25');
            await expect(page.locator('#total-inventory-attack')).toHaveText(initialTotal);
            await expect(page.locator('#equipped-weapon-attack-pct')).toHaveText(initialEquipped);

            markElementCovered('cross-tab-equipment-persistence');
        });

        test('navigating to gear lab and back preserves weapon data', async ({ page }) => {
            // Arrange - Configure weapon levels
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_MID);

            const initialTotal = await page.locator('#total-inventory-attack').textContent();

            // Act - Navigate to Gear Lab (Inner Ability)
            await page.goto(`${BASE_URL}/#/optimization/inner-ability`);
            await page.waitForTimeout(200);

            // Verify we're on optimization page
            await expect(page.locator('#page-optimization')).toBeVisible();

            // Act - Navigate back to Weapon Levels
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Assert - All data preserved
            await expect(page.locator('#total-inventory-attack')).toHaveText(initialTotal);

            markElementCovered('cross-tab-gear-lab-persistence');
        });

        test('navigating to statHub and back preserves weapon data', async ({ page }) => {
            // Arrange - Configure weapon levels
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);

            const initialTotal = await page.locator('#total-inventory-attack').textContent();

            // Act - Navigate to StatHub
            await page.goto(`${BASE_URL}/#/predictions/stat-tables`);
            await page.waitForTimeout(200);

            // Verify we're on predictions page
            await expect(page.locator('#page-predictions')).toBeVisible();

            // Act - Navigate back to Weapon Levels
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Assert - All data preserved
            await expect(page.locator('#total-inventory-attack')).toHaveText(initialTotal);

            markElementCovered('cross-tab-stathub-persistence');
        });

        test('full workflow across multiple tabs preserves all data', async ({ page }) => {
            // Arrange - Configure weapon levels
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_MID);

            const originalLevel = '100';
            const originalStars = '5';
            const originalTotal = await page.locator('#total-inventory-attack').textContent();

            // Act - Navigate through multiple tabs
            await page.goto(`${BASE_URL}/#/setup/equipment`);
            await page.waitForTimeout(200);

            await page.goto(`${BASE_URL}/#/optimization/item-comparison`);
            await page.waitForTimeout(200);

            await page.goto(`${BASE_URL}/#/predictions/stat-equivalency`);
            await page.waitForTimeout(200);

            // Act - Return to weapon levels
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Assert - All data preserved after full journey
            await expect(page.locator('#level-normal-t4')).toHaveValue(originalLevel);
            await expect(page.locator('#stars-normal-t4')).toHaveValue(originalStars);
            await expect(page.locator('#total-inventory-attack')).toHaveText(originalTotal);

            markElementCovered('cross-tab-full-workflow');
        });
    });

    // =========================================================================
    // PAGE RELOAD PERSISTENCE
    // =========================================================================

    test.describe('Page Reload Persistence', () => {

        test('reloading page restores all configured values', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);

            const originalLevel = '25';
            const originalStars = '2';
            const originalTotal = await page.locator('#total-inventory-attack').textContent();

            // Act - Reload page
            await page.reload();
            await page.waitForTimeout(200);

            // Assert - All values restored
            await expect(page.locator('#level-normal-t4')).toHaveValue(originalLevel);
            await expect(page.locator('#stars-normal-t4')).toHaveValue(originalStars);
            await expect(page.locator('#total-inventory-attack')).toHaveText(originalTotal);

            markElementCovered('reload-persistence');
        });

        test('reloading page with equipped weapon maintains equipped state', async ({ page }) => {
            // Arrange
            await applyWeaponLevelsFixture(page, WEAPON_LEVELS_EARLY);

            const equippedCheckbox = page.locator('#equipped-checkbox-normal-t4');
            const equippedDisplay = page.locator('#equipped-display-normal-t4');

            // Verify equipped before reload
            await expect(equippedCheckbox).toBeChecked();
            await expect(equippedDisplay).toBeVisible();

            // Act - Reload page
            await page.reload();
            await page.waitForTimeout(200);

            // Assert - Equipped state restored
            await expect(equippedCheckbox).toBeChecked();
            await expect(equippedDisplay).toBeVisible();

            // Assert - Card has equipped class
            await expect(page.locator('#weapon-normal-t4')).toHaveClass(/equipped/);

            markElementCovered('reload-equipped-persistence');
        });

        test('reloading page maintains sub-tab selection', async ({ page }) => {
            // Arrange
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            // Switch to upgrade priority
            const priorityButton = page.locator('#weapon-levels-subtab-button').filter({ hasText: 'Upgrade Priority' });
            await priorityButton.click();
            await page.waitForTimeout(200);

            // Act - Reload page
            await page.reload();
            await page.waitForTimeout(200);

            // Assert - Still on upgrade priority tab
            await verifySubTabActive(page, 'upgrade-priority');

            markElementCovered('reload-subtab-persistence');
        });
    });
});
