// UI Tests for Equipment Slot Comparison
// Run with: npx playwright test equipment-comparison-ui.spec.js --headed

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

// Helper function to navigate to Item Comparison tab
async function navigateToItemComparison(page) {
    // Click on the Item Comparison tab button
    await page.click('button:has-text("Item Comparison")');
    // Wait for the comparison UI to load
    await page.waitForSelector('#comparison-slot-selector', { state: 'visible' });
    await page.waitForTimeout(100); // Allow any async operations to complete
}

// Helper function to get stat count for an item
async function getStatCount(page, slot, itemId) {
    const stats = await page.locator(`#item-${slot}-${itemId}-stats-container > div`).count();
    return stats;
}

test.describe('Equipment Slot Comparison UI Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Clear storage before navigating
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            // Clear all comparison items from localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('comparisonItems.')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            localStorage.clear();
            sessionStorage.clear();
        });

        // Navigate to Item Comparison tab
        await navigateToItemComparison(page);
    });

    test('should load Item Comparison tab successfully', async ({ page }) => {
        // Check that slot selector is visible
        await expect(page.locator('#comparison-slot-selector')).toBeVisible();

        // Check that the Add Item button is visible
        await expect(page.locator('button[onclick="addComparisonItem()"]')).toBeVisible();

        // Check that comparison containers exist
        await expect(page.locator('#comparison-tabs-container')).toBeVisible();
        // Items container may be hidden initially
        await expect(page.locator('#comparison-items-container')).toBeAttached();
    });

    test('should add a comparison item', async ({ page }) => {
        // Get initial button count (should be at least 1 for the Add button)
        const initialButtons = await page.locator('#comparison-tabs-container button').count();

        // Click the Add Item button
        await page.click('button[onclick="addComparisonItem()"]');

        // Wait for the item to be added
        await page.waitForSelector('[id^="comparison-tab-head-"]');

        // Check that a new button was added (at least 1 more than before)
        const allButtons = await page.locator('#comparison-tabs-container button').count();
        expect(allButtons).toBeGreaterThanOrEqual(initialButtons + 1);

        // Check that the item tab has the expected structure
        const itemTab = page.locator('#comparison-tabs-container').locator('[id^="comparison-tab-head-"]').first();
        await expect(itemTab).toBeVisible();

        // Check that an item content div was created
        const itemContent = page.locator('[id^="comparison-item-head-"]');
        await expect(itemContent).toBeVisible();
    });

    test('should switch between equipment slots', async ({ page }) => {
        // Start with head slot
        await expect(page.locator('#comparison-slot-selector')).toHaveValue('head');

        // Switch to cape slot
        await page.selectOption('#comparison-slot-selector', 'cape');
        await page.waitForTimeout(200); // Wait for slot switching to complete

        // Verify the selector changed
        await expect(page.locator('#comparison-slot-selector')).toHaveValue('cape');

        // Add an item to cape slot
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-tab-cape-"]');

        // Switch back to head slot
        await page.selectOption('#comparison-slot-selector', 'head');
        await page.waitForTimeout(200);

        // Verify we're back on head (no items should be visible)
        await expect(page.locator('#comparison-slot-selector')).toHaveValue('head');
        await expect(page.locator('[id^="comparison-tab-head-"]')).toHaveCount(0);

        // Switch to cape again
        await page.selectOption('#comparison-slot-selector', 'cape');
        await page.waitForTimeout(200);

        // The cape item should still be there
        await expect(page.locator('[id^="comparison-tab-cape-"]')).toBeVisible();
    });

    test('should persist items across page refresh', async ({ page }) => {
        // Add an item with some data
        await page.click('button[onclick="addComparisonItem()"]');

        // Fill in the item name
        await page.fill('#item-head-1-name', 'Test Helm');

        // Fill in attack value
        await page.fill('#item-head-1-attack', '100');

        // Add a stat line - use a more specific selector to avoid clicking the wrong button
        const statContainer = page.locator('#comparison-item-head-1');
        await statContainer.locator('button:has-text("+ Add Stat")').click();
        await page.waitForSelector('#item-head-1-stat-1-type');

        // Select a stat type
        await page.selectOption('#item-head-1-stat-1-type', 'crit-rate');

        // Fill in stat value and trigger onchange
        const valueInput = page.locator('#item-head-1-stat-1-value');
        await valueInput.fill('5');
        await valueInput.dispatchEvent('change');

        // Wait for save to complete
        await page.waitForTimeout(500);

        // Refresh the page
        await page.reload();
        await navigateToItemComparison(page);

        // Verify the item persisted
        await expect(page.locator('[id^="comparison-tab-head-"]')).toBeVisible();
        await expect(page.locator('#item-head-1-name')).toHaveValue('Test Helm');
        await expect(page.locator('#item-head-1-attack')).toHaveValue('100');

        // Check the stat line
        await expect(page.locator('#item-head-1-stat-1-type')).toHaveValue('crit-rate');
        await expect(page.locator('#item-head-1-stat-1-value')).toHaveValue('5');
    });

    test('should persist slot selection across page refresh', async ({ page }) => {
        // Switch to a different slot
        await page.selectOption('#comparison-slot-selector', 'ring');
        await page.waitForTimeout(200);

        // Add an item
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-tab-ring-"]');

        // Refresh the page
        await page.reload();
        await navigateToItemComparison(page);

        // Verify we're still on the ring slot
        await expect(page.locator('#comparison-slot-selector')).toHaveValue('ring');

        // Verify the item is still there
        await expect(page.locator('[id^="comparison-tab-ring-"]')).toBeVisible();
    });

    test('should remove a comparison item', async ({ page }) => {
        // Add two items
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-tab-head-"]');

        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForTimeout(100); // Wait for second item to be added

        // Verify both items exist
        await expect(page.locator('[id^="comparison-tab-head-"]')).toHaveCount(2);

        // Remove the first item (click the X button)
        await page.locator('#comparison-tabs-container').locator('[id^="comparison-tab-head-"]').first().locator('button').click();

        // Wait for removal
        await page.waitForTimeout(100);

        // Verify only one item remains
        await expect(page.locator('[id^="comparison-tab-head-"]')).toHaveCount(1);
    });

    test('should add and remove stat lines from items', async ({ page }) => {
        // Add an item
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-item-head-"]');

        // Initially should have no stats
        const initialStatCount = await getStatCount(page, 'head', 1);
        expect(initialStatCount).toBe(0);

        // Add a stat line - use specific selector
        const statContainer = page.locator('#comparison-item-head-1');
        await statContainer.locator('button:has-text("+ Add Stat")').click();
        await page.waitForSelector('#item-head-1-stat-1-type');

        // Should now have 1 stat
        const afterAddCount = await getStatCount(page, 'head', 1);
        expect(afterAddCount).toBe(1);

        // Add another stat line
        await statContainer.locator('button:has-text("+ Add Stat")').click();
        await page.waitForSelector('#item-head-1-stat-2-type');

        // Should now have 2 stats
        const afterSecondAdd = await getStatCount(page, 'head', 1);
        expect(afterSecondAdd).toBe(2);

        // Remove the first stat (click X button)
        await page.click('#item-head-1-stat-1 button');
        await page.waitForTimeout(100);

        // Should now have 1 stat (stat-2 remains)
        const afterRemoveCount = await getStatCount(page, 'head', 1);
        expect(afterRemoveCount).toBe(1);
    });

    test('should save stat changes when switching slots', async ({ page }) => {
        // Add an item to head slot
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-item-head-"]');

        // Add and configure a stat
        const statContainer = page.locator('#comparison-item-head-1');
        await statContainer.locator('button:has-text("+ Add Stat")').click();
        await page.selectOption('#item-head-1-stat-1-type', 'boss-damage');
        await page.fill('#item-head-1-stat-1-value', '10');

        // Wait for save
        await page.waitForTimeout(300);

        // Switch to another slot
        await page.selectOption('#comparison-slot-selector', 'neck');
        await page.waitForTimeout(200);

        // Add an item to neck slot
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-item-neck-"]');

        // Switch back to head slot
        await page.selectOption('#comparison-slot-selector', 'head');
        await page.waitForTimeout(200);

        // Verify the head item data persisted
        await expect(page.locator('[id^="comparison-tab-head-"]')).toBeVisible();
        await expect(page.locator('#item-head-1-stat-1-type')).toHaveValue('boss-damage');
        await expect(page.locator('#item-head-1-stat-1-value')).toHaveValue('10');
    });

    test('should maintain separate items per slot', async ({ page }) => {
        // Add item to head slot
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-item-head-"]');
        await page.fill('#item-head-1-name', 'Head Item');

        // Wait for save
        await page.waitForTimeout(300);

        // Switch to cape slot and add different item
        await page.selectOption('#comparison-slot-selector', 'cape');
        await page.waitForTimeout(200);
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-item-cape-"]');
        await page.fill('#item-cape-1-name', 'Cape Item');

        // Wait for save
        await page.waitForTimeout(300);

        // Switch back to head
        await page.selectOption('#comparison-slot-selector', 'head');
        await page.waitForTimeout(200);

        // Should see Head Item, not Cape Item
        await expect(page.locator('#item-head-1-name')).toHaveValue('Head Item');

        // Switch to cape
        await page.selectOption('#comparison-slot-selector', 'cape');
        await page.waitForTimeout(200);

        // Should see Cape Item
        await expect(page.locator('#item-cape-1-name')).toHaveValue('Cape Item');
    });

    test('should handle max stat limit (6 stats)', async ({ page }) => {
        // Add an item
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-item-head-"]');

        const statContainer = page.locator('#comparison-item-head-1');

        // Add 6 stats (the maximum)
        for (let i = 0; i < 6; i++) {
            await statContainer.locator('button:has-text("+ Add Stat")').click();
            await page.waitForTimeout(50);
        }

        const statCount = await getStatCount(page, 'head', 1);
        expect(statCount).toBe(6);

        // Try to add a 7th stat - should show alert
        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('Maximum 6');
            dialog.accept();
        });

        await statContainer.locator('button:has-text("+ Add Stat")').click();
        await page.waitForTimeout(100);

        // Should still have only 6 stats
        const finalStatCount = await getStatCount(page, 'head', 1);
        expect(finalStatCount).toBe(6);
    });

    test('should update tab name when item name changes', async ({ page }) => {
        // Add an item
        await page.click('button[onclick="addComparisonItem()"]');
        await page.waitForSelector('[id^="comparison-tab-head-"]');

        // Check default tab name
        const tabName = await page.locator('#comparison-tabs-container').locator('[id^="comparison-tab-head-"]').first().locator('.tab-item-name').textContent();
        expect(tabName).toBe('Item 1');

        // Change the item name - trigger onchange event properly
        const nameInput = page.locator('#item-head-1-name');
        await nameInput.fill('Awesome Helmet');
        await nameInput.dispatchEvent('change');
        await page.waitForTimeout(200);

        // Tab name should update
        const updatedTabName = await page.locator('#comparison-tabs-container').locator('[id^="comparison-tab-head-"]').first().locator('.tab-item-name').textContent();
        expect(updatedTabName).toBe('Awesome Helmet');
    });

    test('should handle slot switching with no items gracefully', async ({ page }) => {
        // Start with head slot (no items)
        await expect(page.locator('#comparison-slot-selector')).toHaveValue('head');

        // Switch through multiple slots with no items
        const slots = ['cape', 'chest', 'gloves', 'boots'];

        for (const slot of slots) {
            await page.selectOption('#comparison-slot-selector', slot);
            await page.waitForTimeout(100);
            await expect(page.locator('#comparison-slot-selector')).toHaveValue(slot);
        }

        // No errors should occur, and we should end up on boots
        await expect(page.locator('#comparison-slot-selector')).toHaveValue('boots');
    });
});
