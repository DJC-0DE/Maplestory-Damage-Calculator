// Weapon Levels Test Fixtures
// Complete character configurations at defined progression milestones for weapon levels testing

/**
 * Early Game Fixture - Level 60
 * Basic 3rd job starter with minimal weapon progression
 */
export const WEAPON_LEVELS_EARLY = {
    description: 'Early game - Level 60 with basic weapons',
    characterLevel: 60,
    weapons: {
        // Focus on Normal and Rare weapons, low levels
        'normal-t4': { level: 25, stars: 2 },
        'normal-t3': { level: 15, stars: 2 },
        'rare-t4': { level: 10, stars: 1 },
        'rare-t3': { level: 5, stars: 1 },
        // All other weapons at level 0
    },
    equipped: 'normal-t4',
    expectedStats: {
        totalInventoryAttack: 15.0,
        equippedAttack: 15.0,
        totalAttack: 30.0
    }
};

/**
 * Mid Game Fixture - Level 90
 * Well-geared 3rd job with mixed weapon levels and stars
 */
export const WEAPON_LEVELS_MID = {
    description: 'Mid game - Level 90 with mixed progression',
    characterLevel: 90,
    weapons: {
        // Normal weapons - mid-high levels
        'normal-t4': { level: 100, stars: 5 },
        'normal-t3': { level: 80, stars: 4 },
        'normal-t2': { level: 60, stars: 3 },

        // Rare weapons - mid levels
        'rare-t4': { level: 70, stars: 4 },
        'rare-t3': { level: 50, stars: 3 },
        'rare-t2': { level: 30, stars: 2 },

        // Epic weapons - starting out
        'epic-t4': { level: 40, stars: 3 },
        'epic-t3': { level: 25, stars: 2 },

        // Unique - just started
        'unique-t4': { level: 15, stars: 1 },

        // Legendary and Mystic - unlocked but low
        'legendary-t4': { level: 5, stars: 1 },
        'mystic-t4': { level: 3, stars: 1 },
    },
    equipped: 'unique-t4',
    expectedStats: {
        totalInventoryAttack: 185.5,
        equippedAttack: 62.3,
        totalAttack: 247.8
    }
};

/**
 * Late Game Fixture - Level 120
 * Optimized 4th job with multiple maxed weapons
 */
export const WEAPON_LEVELS_LATE = {
    description: 'Late game - Level 120 with maxed weapons',
    characterLevel: 120,
    weapons: {
        // Normal - maxed out
        'normal-t4': { level: 200, stars: 5 },
        'normal-t3': { level: 200, stars: 5 },
        'normal-t2': { level: 200, stars: 5 },
        'normal-t1': { level: 200, stars: 5 },

        // Rare - high levels
        'rare-t4': { level: 180, stars: 5 },
        'rare-t3': { level: 160, stars: 4 },
        'rare-t2': { level: 140, stars: 4 },

        // Epic - progressing well
        'epic-t4': { level: 150, stars: 5 },
        'epic-t3': { level: 120, stars: 4 },
        'epic-t2': { level: 100, stars: 3 },

        // Unique - mid-high levels
        'unique-t4': { level: 130, stars: 4 },
        'unique-t3': { level: 100, stars: 3 },

        // Legendary - progressing
        'legendary-t4': { level: 100, stars: 3 },
        'legendary-t3': { level: 70, stars: 2 },

        // Mystic - started
        'mystic-t4': { level: 60, stars: 2 },
        'mystic-t3': { level: 40, stars: 1 },

        // Ancient - just unlocked
        'ancient-t4': { level: 30, stars: 1 },
        'ancient-t3': { level: 15, stars: 1 },
    },
    equipped: 'legendary-t4',
    expectedStats: {
        totalInventoryAttack: 1250.8,
        equippedAttack: 185.6,
        totalAttack: 1436.4
    }
};

/**
 * Edge Case Fixtures
 */

/**
 * Max Stars Max Level Fixture
 * All weapons at 5 stars and level 200 (max possible state)
 */
export const WEAPON_LEVELS_MAXED = {
    description: 'All weapons at max stars and max level',
    weapons: {},
    equipped: 'ancient-t4',
    expectedStats: {
        totalInventoryAttack: 3500.0,
        equippedAttack: 450.0,
        totalAttack: 3950.0
    }
};

// Populate all weapons with max values for the maxed fixture
const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic', 'ancient'];
const tiers = ['t1', 't2', 't3', 't4'];

rarities.forEach(rarity => {
    tiers.forEach(tier => {
        // Ancient T1 is disabled, so skip it
        if (rarity === 'ancient' && tier === 't1') return;
        WEAPON_LEVELS_MAXED.weapons[`${rarity}-${tier}`] = { level: 200, stars: 5 };
    });
});

/**
 * Empty State Fixture
 * All weapons at level 0, no equipped weapon
 */
export const WEAPON_LEVELS_EMPTY = {
    description: 'Empty state - no weapons configured',
    weapons: {},
    equipped: null,
    expectedStats: {
        totalInventoryAttack: 0.0,
        equippedAttack: 0.0,
        totalAttack: 0.0
    }
};

/**
 * Single Weapon Fixture
 * Only one weapon configured (for testing equipped behavior)
 */
export const WEAPON_LEVELS_SINGLE = {
    description: 'Single weapon - testing equipped toggle',
    weapons: {
        'normal-t4': { level: 50, stars: 3 }
    },
    equipped: 'normal-t4',
    expectedStats: {
        totalInventoryAttack: 35.7,
        equippedAttack: 35.7,
        totalAttack: 71.4
    }
};

/**
 * High Stars Low Level Fixture
 * Weapons with high stars but low levels (testing star/level relationship)
 */
export const WEAPON_LEVELS_HIGH_STARS_LOW_LEVEL = {
    description: 'High stars but low levels',
    weapons: {
        'legendary-t4': { level: 10, stars: 5 },  // Can go to 200 with 5 stars
        'mystic-t4': { level: 5, stars: 4 },     // Can go to 150 with 4 stars
        'ancient-t4': { level: 3, stars: 3 },    // Can go to 100 with 3 stars
    },
    equipped: 'legendary-t4',
    expectedStats: {
        totalInventoryAttack: 28.5,
        equippedAttack: 22.5,
        totalAttack: 51.0
    }
};

/**
 * Disabled Cards Fixture
 * Specifically tests Ancient T1 disabled card behavior
 */
export const WEAPON_LEVELS_DISABLED_TEST = {
    description: 'Testing disabled cards (Ancient T1)',
    weapons: {
        'ancient-t4': { level: 50, stars: 2 },
        'ancient-t3': { level: 30, stars: 2 },
        'ancient-t2': { level: 20, stars: 1 },
        // Ancient T1 should be disabled and have no data
    },
    equipped: 'ancient-t4',
    expectedStats: {
        totalInventoryAttack: 45.2,
        equippedAttack: 38.5,
        totalAttack: 83.7
    }
};

/**
 * Helper function to apply weapon levels fixture
 * @param {Page} page - Playwright page object
 * @param {Object} fixture - Fixture object from above
 */
export async function applyWeaponLevelsFixture(page, fixture) {
    // Navigate to weapon levels tab
    await page.goto('http://localhost:8000/#/setup/weapon-levels');
    await page.waitForTimeout(200);

    // Apply weapon levels
    for (const [weaponKey, weaponData] of Object.entries(fixture.weapons)) {
        const [rarity, tier] = weaponKey.split('-');

        // Set level
        const levelInput = page.locator(`#level-${rarity}-${tier}`);
        await levelInput.fill(weaponData.level.toString());

        // Set stars by directly setting the hidden input value
        // We don't click the star element because that triggers toggle behavior
        // which would set stars to 0 if the current value equals the clicked star
        const starsInput = page.locator(`#stars-${rarity}-${tier}`);
        await starsInput.evaluate((el, val) => { el.value = val; }, weaponData.stars.toString());

        // Update the star display classes to match the new stars value
        for (let i = 1; i <= 5; i++) {
            const starElement = page.locator(`#star-${rarity}-${tier}-${i}`);
            const isActive = i <= weaponData.stars;
            await starElement.evaluate((el, active) => {
                if (active) {
                    el.click();
                   // el.classList.add('active');
                } else {
                    el.click();
                   // el.classList.remove('active');
                }
            }, isActive);
        }
    }

    // Set equipped weapon if specified
    if (fixture.equipped) {
        const [rarity, tier] = fixture.equipped.split('-');
        const equippedLabel = page.locator(`#equipped-label-${rarity}-${tier}`);
        await equippedLabel.click();
    }

    // Wait for calculations to complete
    await page.waitForTimeout(300);
}

/**
 * Helper function to clear all weapon levels
 * @param {Page} page - Playwright page object
 */
export async function clearWeaponLevels(page) {
    await page.goto('http://localhost:8000/#/setup/weapon-levels');
    await page.waitForTimeout(200);

    // Clear all level inputs
    const rarities = ['normal', 'rare', 'epic', 'unique', 'legendary', 'mystic', 'ancient'];
    const tiers = ['t1', 't2', 't3', 't4'];

    for (const rarity of rarities) {
        for (const tier of tiers) {
            // Skip disabled cards
            if (rarity === 'ancient' && tier === 't1') continue;

            const levelInput = page.locator(`#level-${rarity}-${tier}`);

            try {
                await levelInput.fill('0');

                // Reset stars to default by clicking 5th star then clicking it again to toggle to 0
                // Actually, for simplicity, we'll just leave stars at default
            } catch (e) {
                // Element might not exist (disabled cards), skip
            }
        }
    }

    // Uncheck all equipped checkboxes
    await page.locator('input[id^="equipped-checkbox-"]').check({ checked: false });

    await page.waitForTimeout(200);
}
