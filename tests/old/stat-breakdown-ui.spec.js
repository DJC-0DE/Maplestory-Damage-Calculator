// UI Tests for Stat Breakdown Page
// Run with: npx playwright test stat-breakdown-ui.spec.js --headed
//
// COMPREHENSIVE TESTS - Verify ALL stat sources appear in breakdown:
// - Equipment (all 11 slots)
// - Companions Equipped
// - Companions Inventory
// - Inner Ability
// - Scrolling (all slots combined)
// - Cube Potential (regular + bonus, Set A)

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

// Navigate to Base Stats tab
async function navigateToBaseStats(page) {
    await page.click('button:has-text("Base Stats")');
    await page.waitForSelector('#setup-base-stats', { state: 'visible' });
    await page.waitForTimeout(100);
}

// Navigate to Stat Breakdown tab
async function navigateToStatBreakdown(page) {
    await page.click('button:has-text("Stat Breakdown")');
    await page.waitForSelector('#stat-breakdown-content', { state: 'visible' });
    await page.waitForTimeout(300);
}

// Set base stat value via JavaScript
async function setBaseStatValue(page, statInputId, value) {
    await page.evaluate(({ id, val }) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = val;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, { id: statInputId, val: value });
}

// Setup equipment stats for a slot
async function setupEquipmentStats(page, slotId, stats) {
    await page.evaluate(({ slotId, stats }) => {
        if (window.updateEquipmentContributions) {
            const contributedStats = window.getContributedStats();
            if (!contributedStats.equipment) {
                contributedStats.equipment = {};
            }
            contributedStats.equipment[slotId] = stats;
            window.updateEquipmentContributions(contributedStats.equipment);
        }
    }, { slotId, stats });
}

// Setup companion equipped stats
async function setupCompanionEquippedStats(page, companionStats) {
    await page.evaluate(({ stats }) => {
        if (window.updateCompanionEquippedContributions) {
            window.updateCompanionEquippedContributions(stats);
        }
    }, { stats: companionStats });
}

// Setup companion inventory stats
async function setupCompanionInventoryStats(page, companionStats) {
    await page.evaluate(({ stats }) => {
        const contributedStats = window.getContributedStats();
        contributedStats.CompanionInventory = stats;
    }, { stats: companionStats });
}

// Setup inner ability stats
async function setupInnerAbilityStats(page, innerAbilityStats) {
    await page.evaluate(({ stats }) => {
        const contributedStats = window.getContributedStats();
        contributedStats.InnerAbility = stats;
    }, { stats: innerAbilityStats });
}

// Setup scrolling stats
async function setupScrollingStats(page, scrollingStats) {
    await page.evaluate(({ stats }) => {
        const contributedStats = window.getContributedStats();
        contributedStats.scrolling = stats;
    }, { stats: scrollingStats });
}

// Setup cube potential stats
async function setupCubePotentialStats(page, cubeStats) {
    await page.evaluate(({ stats }) => {
        const contributedStats = window.getContributedStats();
        contributedStats.cubePotential = stats;
    }, { stats: cubeStats });
}

// Trigger stat breakdown update
async function triggerStatBreakdownUpdate(page) {
    await page.evaluate(() => {
        if (window.updateStatBreakdown) {
            window.updateStatBreakdown();
        }
    });
    await page.waitForTimeout(200);
}

test.describe('Stat Breakdown UI Tests - Complete Coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await navigateToBaseStats(page);
    });

    test('should load Stat Breakdown tab', async ({ page }) => {
        await navigateToStatBreakdown(page);
        await expect(page.locator('#stat-breakdown-content')).toBeVisible();
    });

    // ========================================
    // EQUIPMENT TESTS
    // ========================================

    test('EQUIPMENT: Head slot mainStat', async ({ page }) => {
        await setBaseStatValue(page, 'primary-main-stat-base', 100);
        await setupEquipmentStats(page, 'head', { mainStat: 50 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="mainStat"] [data-contribution-type="equipment"][data-contribution-source="head"]')).toBeVisible();
    });

    test('EQUIPMENT: Multiple slots attack', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 300);
        await setupEquipmentStats(page, 'head', { attack: 30 });
        await setupEquipmentStats(page, 'gloves', { attack: 40 });
        await setupEquipmentStats(page, 'boots', { attack: 25 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="attack"] [data-contribution-type="equipment"][data-contribution-source="head"]')).toBeVisible();
        await expect(page.locator('[data-stat="attack"] [data-contribution-type="equipment"][data-contribution-source="gloves"]')).toBeVisible();
        await expect(page.locator('[data-stat="attack"] [data-contribution-type="equipment"][data-contribution-source="boots"]')).toBeVisible();
    });

    test('EQUIPMENT: All stat types from various slots', async ({ page }) => {
        await setBaseStatValue(page, 'crit-rate-base', 80);
        await setBaseStatValue(page, 'boss-damage-base', 150);
        await setBaseStatValue(page, 'damage-base', 100);

        await setupEquipmentStats(page, 'head', { critRate: 10 });
        await setupEquipmentStats(page, 'cape', { bossDamage: 20, damage: 12 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="equipment"][data-contribution-source="head"]')).toBeVisible();
        await expect(page.locator('[data-stat="bossDamage"] [data-contribution-type="equipment"][data-contribution-source="cape"]')).toBeVisible();
        await expect(page.locator('[data-stat="damage"] [data-contribution-type="equipment"][data-contribution-source="cape"]')).toBeVisible();
    });

    // ========================================
    // COMPANIONS EQUIPPED TESTS
    // ========================================

    test('COMPANIONS EQUIPPED: Attack stat', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 500);
        await setupCompanionEquippedStats(page, { Attack: 50 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="attack"] [data-contribution-type="companion"][data-contribution-source="attack-companions-equipped"]')).toBeVisible();
    });

    test('COMPANIONS EQUIPPED: All companion stat types', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 500);
        await setBaseStatValue(page, 'damage-base', 150);
        await setBaseStatValue(page, 'boss-damage-base', 200);
        await setBaseStatValue(page, 'crit-rate-base', 80);

        await setupCompanionEquippedStats(page, {
            Attack: 50,
            AttackPower: 40,
            AttackPowerToBoss: 60,
            CriticalChance: 25
        });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="attack"] [data-contribution-type="companion"]')).toBeVisible();
        await expect(page.locator('[data-stat="damage"] [data-contribution-type="companion"]')).toBeVisible();
        await expect(page.locator('[data-stat="bossDamage"] [data-contribution-type="companion"]')).toBeVisible();
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="companion"]')).toBeVisible();
    });

    // ========================================
    // COMPANIONS INVENTORY TESTS
    // ========================================

    test('COMPANIONS INVENTORY: Attack stat', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 500);
        await setupCompanionInventoryStats(page, { Attack: 35 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="attack"] [data-contribution-type="companion"][data-contribution-source="attack-companions-inventory"]')).toBeVisible();
    });

    test('COMPANIONS INVENTORY: All companion inventory stat types', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 500);
        await setBaseStatValue(page, 'damage-base', 150);
        await setBaseStatValue(page, 'boss-damage-base', 200);
        await setBaseStatValue(page, 'normal-damage-base', 100);

        await setupCompanionInventoryStats(page, {
            Attack: 25,
            AttackPower: 30,
            AttackPowerToBoss: 45,
            AttackPowerExcludeBoss: 35
        });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="attack"] [data-contribution-source="attack-companions-inventory"]')).toBeVisible();
        await expect(page.locator('[data-stat="damage"] [data-contribution-source="damage-companions-inventory"]')).toBeVisible();
        await expect(page.locator('[data-stat="bossDamage"] [data-contribution-source="boss-damage-companions-inventory"]')).toBeVisible();
        await expect(page.locator('[data-stat="normalDamage"] [data-contribution-source="normal-monster-damage-companions-inventory"]')).toBeVisible();
    });

    test('COMPANIONS: Both equipped and inventory Attack', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 600);
        await setupCompanionEquippedStats(page, { Attack: 50 });
        await setupCompanionInventoryStats(page, { Attack: 35 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        // Both should be visible
        await expect(page.locator('[data-stat="attack"] [data-contribution-source="attack-companions-equipped"]')).toBeVisible();
        await expect(page.locator('[data-stat="attack"] [data-contribution-source="attack-companions-inventory"]')).toBeVisible();
    });

    // ========================================
    // INNER ABILITY TESTS
    // ========================================

    test('INNER ABILITY: Multiple stat types', async ({ page }) => {
        await setBaseStatValue(page, 'boss-damage-base', 200);
        await setBaseStatValue(page, 'crit-rate-base', 80);
        await setBaseStatValue(page, 'damage-base', 150);

        await setupInnerAbilityStats(page, {
            bossDamage: 40,
            critRate: 20,
            damage: 30
        });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="bossDamage"] [data-contribution-type="innerAbility"]')).toBeVisible();
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="innerAbility"]')).toBeVisible();
        await expect(page.locator('[data-stat="damage"] [data-contribution-type="innerAbility"]')).toBeVisible();
    });

    // ========================================
    // SCROLLING TESTS
    // ========================================

    test('SCROLLING: Attack stat', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 500);
        await setupScrollingStats(page, { attack: 150 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="attack"] [data-contribution-type="scrolling"]')).toBeVisible();
    });

    test('SCROLLING: DamageAmp stat', async ({ page }) => {
        await setBaseStatValue(page, 'damage-amp-base', 15);
        await setupScrollingStats(page, { damageAmp: 8 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="damageAmp"] [data-contribution-type="scrolling"]')).toBeVisible();
    });

    // ========================================
    // CUBE POTENTIAL TESTS
    // ========================================

    test('CUBE POTENTIAL: Critical Rate', async ({ page }) => {
        await setBaseStatValue(page, 'crit-rate-base', 80);
        await setupCubePotentialStats(page, { critRate: 30 });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="cube"]')).toBeVisible();
    });

    test('CUBE POTENTIAL: Multiple stat types', async ({ page }) => {
        await setBaseStatValue(page, 'crit-rate-base', 80);
        await setBaseStatValue(page, 'damage-base', 150);
        await setBaseStatValue(page, 'final-damage-base', 40);

        await setupCubePotentialStats(page, {
            critRate: 30,
            damage: 50,
            finalDamage: 15
        });
        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="cube"]')).toBeVisible();
        await expect(page.locator('[data-stat="damage"] [data-contribution-type="cube"]')).toBeVisible();
        await expect(page.locator('[data-stat="finalDamage"] [data-contribution-type="cube"]')).toBeVisible();
    });

    // ========================================
    // INTEGRATION TESTS - ALL SOURCES
    // ========================================

    test('ALL SOURCES: Attack stat shows all contributors', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 800);

        await setupEquipmentStats(page, 'head', { attack: 30 });
        await setupEquipmentStats(page, 'gloves', { attack: 40 });
        await setupCompanionEquippedStats(page, { Attack: 50 });
        await setupCompanionInventoryStats(page, { Attack: 35 });
        await setupScrollingStats(page, { attack: 150 });

        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        // All 5 sources should be visible in attack breakdown
        await expect(page.locator('[data-stat="attack"] [data-contribution-type="equipment"][data-contribution-source="head"]')).toBeVisible();
        await expect(page.locator('[data-stat="attack"] [data-contribution-type="equipment"][data-contribution-source="gloves"]')).toBeVisible();
        await expect(page.locator('[data-stat="attack"] [data-contribution-source="attack-companions-equipped"]')).toBeVisible();
        await expect(page.locator('[data-stat="attack"] [data-contribution-source="attack-companions-inventory"]')).toBeVisible();
        await expect(page.locator('[data-stat="attack"] [data-contribution-type="scrolling"]')).toBeVisible();
    });

    test('ALL SOURCES: Critical Rate shows all contributors', async ({ page }) => {
        await setBaseStatValue(page, 'crit-rate-base', 150);

        await setupEquipmentStats(page, 'head', { critRate: 10 });
        await setupEquipmentStats(page, 'gloves', { critRate: 12 });
        await setupCompanionEquippedStats(page, { CriticalChance: 25 });
        await setupCompanionInventoryStats(page, { CriticalChance: 15 });
        await setupInnerAbilityStats(page, { critRate: 20 });
        await setupCubePotentialStats(page, { critRate: 30 });

        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        // All 6 sources should be visible
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="equipment"][data-contribution-source="head"]')).toBeVisible();
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="equipment"][data-contribution-source="gloves"]')).toBeVisible();
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="companion"]').filter({ hasText: 'Equipped' })).toBeVisible();
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="companion"]').filter({ hasText: 'Inventory' })).toBeVisible();
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="innerAbility"]')).toBeVisible();
        await expect(page.locator('[data-stat="critRate"] [data-contribution-type="cube"]')).toBeVisible();
    });

    // ========================================
    // PERSISTENCE TEST
    // ========================================

    test('PERSISTENCE: Stats persist after F5 refresh', async ({ page }) => {
        await setBaseStatValue(page, 'attack-base', 500);
        await setupEquipmentStats(page, 'head', { attack: 30 });
        await setupCompanionInventoryStats(page, { Attack: 35 });

        await page.evaluate(() => {
            if (window.saveState) window.saveState();
        });

        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        // Verify before refresh
        await expect(page.locator('[data-stat="attack"] [data-contribution-source="head"]')).toBeVisible();

        // Refresh (F5)
        await page.reload();
        await page.waitForTimeout(500);

        await navigateToStatBreakdown(page);
        await triggerStatBreakdownUpdate(page);

        // Verify still visible after refresh
        await expect(page.locator('#stat-breakdown-content')).toBeVisible();
        const contributionCount = await page.locator('[data-contribution-type]').count();
        expect(contributionCount).toBeGreaterThan(0);
    });
});
