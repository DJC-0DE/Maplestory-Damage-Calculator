// Navigation Tests
// Tests all main pages and sub-tabs navigation
// Run with: npm run test:nav

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

// Navigation structure - defines all pages, tabs, and their unique identifiers
const navigationStructure = {
    setup: {
        title: 'Loadout',
        pageId: 'page-setup',
        defaultTab: 'base-stats',
        tabs: {
            'base-stats': 'Base Stats',
            'equipment': 'Equipment',
            'weapon-levels': 'Weapon Levels',
            'companions': 'Companions'
        }
    },
    optimization: {
        title: 'Gear Lab',
        pageId: 'page-optimization',
        defaultTab: 'item-comparison',
        tabs: {
            'item-comparison': 'Item Comparison',
            'inner-ability': 'Inner Ability',
            'artifact-potential': 'Artifact Potential',
            'scroll-optimizer': 'Scroll Optimizer',
            'cube-potential': 'Cube Potential',
            'stat-breakdown': 'Stat Breakdown'
        }
    },
    predictions: {
        title: 'StatHub',
        pageId: 'page-predictions',
        defaultTab: 'stat-tables',
        tabs: {
            'stat-tables': 'Stat Tables',
            'stat-equivalency': 'Stat Equivalency'
        }
    }
};

test.describe('Navigation Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Clear storage before each test
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test.describe('Main Page Navigation', () => {
        for (const [pageKey, pageData] of Object.entries(navigationStructure)) {
            test(`should navigate to ${pageData.title} page`, async ({ page }) => {
                // Navigate to the page
                await page.goto(`${BASE_URL}/#/${pageKey}`);
                await page.waitForTimeout(200);

                // Verify URL
                await expect(page).toHaveURL(new RegExp(`/#/${pageKey}(/${pageData.defaultTab})?`));

                // Verify page container is visible
                await expect(page.locator(`#${pageData.pageId}`)).toBeVisible();

                // Verify page title or unique element
                const titleElement = page.locator(`h1, h2, .page-title`).filter({ hasText: pageData.title });
                if (await titleElement.count() > 0) {
                    await expect(titleElement.first()).toBeVisible();
                }
            });
        }
    });

    test.describe('Sub-Tab Navigation', () => {
        for (const [pageKey, pageData] of Object.entries(navigationStructure)) {
            test.describe(pageData.title, () => {
                for (const [tabKey, tabName] of Object.entries(pageData.tabs)) {
                    test(`should navigate to ${tabName} tab`, async ({ page }) => {
                        // Navigate to the tab
                        await page.goto(`${BASE_URL}/#/${pageKey}/${tabKey}`);
                        await page.waitForTimeout(200);

                        // Verify URL
                        await expect(page).toHaveURL(`/#/${pageKey}/${tabKey}`);

                        // Verify page container is visible
                        await expect(page.locator(`#${pageData.pageId}`)).toBeVisible();
                    });
                }
            });
        }
    });

    test.describe('Default Tab Navigation', () => {
        test('should load page correctly when navigating to main page without tab', async ({ page }) => {
            // Navigate to optimization page without specifying tab
            await page.goto(`${BASE_URL}/#/optimization`);
            await page.waitForTimeout(200);

            // Should load the page (router doesn't auto-redirect to default tab)
            await expect(page).toHaveURL(/\/#\/optimization/);

            // Verify the page container is visible
            await expect(page.locator('#page-optimization')).toBeVisible();
        });
    });

    test.describe('Persistence Across Page Reload', () => {
        test('should maintain current tab after page reload', async ({ page }) => {
            // Navigate to a specific tab
            await page.goto(`${BASE_URL}/#/optimization/cube-potential`);
            await page.waitForTimeout(200);

            // Verify we're on the right page
            await expect(page).toHaveURL(/\/#\/optimization\/cube-potential/);
            await expect(page.locator('#page-optimization')).toBeVisible();

            // Reload the page
            await page.reload();
            await page.waitForTimeout(200);

            // Should still be on the same tab
            await expect(page).toHaveURL(/\/#\/optimization\/cube-potential/);
            await expect(page.locator('#page-optimization')).toBeVisible();
        });

        test('should maintain page state after reload', async ({ page }) => {
            // Navigate to predictions page
            await page.goto(`${BASE_URL}/#/predictions/stat-equivalency`);
            await page.waitForTimeout(200);

            // Verify navigation
            await expect(page).toHaveURL(/\/#\/predictions\/stat-equivalency/);
            await expect(page.locator('#page-predictions')).toBeVisible();

            // Reload and verify persistence
            await page.reload();
            await page.waitForTimeout(200);

            await expect(page).toHaveURL(/\/#\/predictions\/stat-equivalency/);
            await expect(page.locator('#page-predictions')).toBeVisible();
        });
    });

    test.describe('Browser Back/Forward Navigation', () => {
        test('should navigate back through tab history', async ({ page }) => {
            // Navigate through multiple tabs
            await page.goto(`${BASE_URL}/#/setup/base-stats`);
            await page.waitForTimeout(200);

            await page.goto(`${BASE_URL}/#/setup/equipment`);
            await page.waitForTimeout(200);

            await page.goto(`${BASE_URL}/#/optimization/item-comparison`);
            await page.waitForTimeout(200);

            // Go back - should be on equipment
            await page.goBack();
            await page.waitForTimeout(200);
            await expect(page).toHaveURL(/\/#\/setup\/equipment/);

            // Go back again - should be on base-stats
            await page.goBack();
            await page.waitForTimeout(200);
            await expect(page).toHaveURL(/\/#\/setup\/base-stats/);
        });

        test('should navigate forward through tab history', async ({ page }) => {
            // Create some history
            await page.goto(`${BASE_URL}/#/optimization/scroll-optimizer`);
            await page.waitForTimeout(200);

            await page.goto(`${BASE_URL}/#/predictions/stat-tables`);
            await page.waitForTimeout(200);

            // Go back
            await page.goBack();
            await page.waitForTimeout(200);
            await expect(page).toHaveURL(/\/#\/optimization\/scroll-optimizer/);

            // Go forward - should be back on stat-tables
            await page.goForward();
            await page.waitForTimeout(200);
            await expect(page).toHaveURL(/\/#\/predictions\/stat-tables/);
        });

        test('should maintain history across different pages', async ({ page }) => {
            // Navigate across different main pages
            await page.goto(`${BASE_URL}/#/setup/weapon-levels`);
            await page.waitForTimeout(200);

            await page.goto(`${BASE_URL}/#/optimization/inner-ability`);
            await page.waitForTimeout(200);

            await page.goto(`${BASE_URL}/#/predictions/stat-equivalency`);
            await page.waitForTimeout(200);

            // Navigate back through history
            await page.goBack();
            await page.waitForTimeout(200);
            await expect(page).toHaveURL(/\/#\/optimization\/inner-ability/);
            await expect(page.locator('#page-optimization')).toBeVisible();

            await page.goBack();
            await page.waitForTimeout(200);
            await expect(page).toHaveURL(/\/#\/setup\/weapon-levels/);
            await expect(page.locator('#page-setup')).toBeVisible();
        });
    });

    test.describe('Cross-Page Navigation', () => {
        test('should navigate from Setup to Optimization to Predictions', async ({ page }) => {
            // Start on Setup
            await page.goto(`${BASE_URL}/#/setup/base-stats`);
            await page.waitForTimeout(200);
            await expect(page.locator('#page-setup')).toBeVisible();

            // Go to Optimization
            await page.goto(`${BASE_URL}/#/optimization/item-comparison`);
            await page.waitForTimeout(200);
            await expect(page.locator('#page-optimization')).toBeVisible();
            await expect(page.locator('#page-setup')).not.toBeVisible();

            // Go to Predictions
            await page.goto(`${BASE_URL}/#/predictions/stat-tables`);
            await page.waitForTimeout(200);
            await expect(page.locator('#page-predictions')).toBeVisible();
            await expect(page.locator('#page-optimization')).not.toBeVisible();
        });
    });

    test.describe('Direct URL Navigation', () => {
        test('should load correct page when typing URL directly', async ({ page }) => {
            // Simulate typing URL directly
            const directURL = `${BASE_URL}/#/optimization/artifact-potential`;
            await page.goto(directURL);
            await page.waitForTimeout(200);

            // Verify correct page loaded
            await expect(page).toHaveURL(/\/#\/optimization\/artifact-potential/);
            await expect(page.locator('#page-optimization')).toBeVisible();

            // Verify the specific tab content is available
            const tabElement = page.locator('[data-tab="artifact-potential"], button:has-text("Artifact Potential")').first();
            await expect(tabElement).toBeVisible();
        });

        test('should handle deep links to nested tabs', async ({ page }) => {
            // Navigate directly to a deep tab
            await page.goto(`${BASE_URL}/#/predictions/stat-equivalency`);
            await page.waitForTimeout(200);

            // Verify we're on the right page
            await expect(page).toHaveURL(/\/#\/predictions\/stat-equivalency/);
            await expect(page.locator('#page-predictions')).toBeVisible();
        });
    });

    test.describe('URL Update on Tab Switch', () => {
        test('should update URL when switching tabs via UI', async ({ page }) => {
            // Start on default tab
            await page.goto(`${BASE_URL}/#/optimization`);
            await page.waitForTimeout(200);

            // Click on a different tab button
            const innerAbilityButton = page.locator('button:has-text("Inner Ability")').first();
            await innerAbilityButton.click();
            await page.waitForTimeout(200);

            // URL should update
            await expect(page).toHaveURL(/\/#\/optimization\/inner-ability/);
        });
    });
});
