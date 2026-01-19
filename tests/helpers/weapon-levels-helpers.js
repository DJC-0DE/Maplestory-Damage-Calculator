// Weapon Levels Test Helpers
// Helper functions for weapon levels UI testing
import { expect } from "@playwright/test";

/**
 * Clear localStorage and sessionStorage
 * @param {Page} page - Playwright page object
 */
export async function clearStorage(page) {
  await page.goto("http://localhost:8000");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Get weapon level from localStorage
 * @param {Page} page - Playwright page object
 * @param {string} rarity - Weapon rarity
 * @param {string} tier - Weapon tier
 * @returns {Promise<string>} Value from localStorage
 */
export async function getWeaponLevelFromStorage(page, rarity, tier) {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, `level-${rarity}-${tier}`);
}

/**
 * Get weapon stars from localStorage
 * @param {Page} page - Playwright page object
 * @param {string} rarity - Weapon rarity
 * @param {string} tier - Weapon tier
 * @returns {Promise<string>} Value from localStorage
 */
export async function getWeaponStarsFromStorage(page, rarity, tier) {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, `stars-${rarity}-${tier}`);
}

/**
 * Get equipped weapon from localStorage
 * @param {Page} page - Playwright page object
 * @returns {Promise<string>} Equipped weapon key
 */
export async function getEquippedWeaponFromStorage(page) {
  return await page.evaluate(() => {
    // Check for the actual equipped weapon by looking at localStorage
    // The equipped weapon is stored differently - we need to find which one has checked=true
    const rarities = [
      "normal",
      "rare",
      "epic",
      "unique",
      "legendary",
      "mystic",
      "ancient",
    ];
    const tiers = ["t1", "t2", "t3", "t4"];

    for (const rarity of rarities) {
      for (const tier of tiers) {
        const key = `equipped-${rarity}-${tier}`;
        const isEquipped = localStorage.getItem(key);
        if (isEquipped === "true") {
          return `${rarity}-${tier}`;
        }
      }
    }
    return null;
  });
}

/**
 * Verify weapon stats match expected values
 * @param {Page} page - Playwright page object
 * @param {string} rarity - Weapon rarity
 * @param {string} tier - Weapon tier
 * @param {Object} expected - Expected values { level, stars, inventoryAttack, equippedAttack }
 */
export async function verifyWeaponStats(page, rarity, tier, expected) {
  // Verify level input
  const levelInput = page.locator(`#level-${rarity}-${tier}`);
  await expect(levelInput).toHaveValue(expected.level.toString());

  // Verify stars input (hidden field)
  const starsInput = page.locator(`#stars-${rarity}-${tier}`);
  await expect(starsInput).toHaveValue(expected.stars.toString());

  // Verify star visuals
  for (let i = 1; i <= 5; i++) {
    const starElement = page.locator(`#star-${rarity}-${tier}-${i}`);
    const shouldBeActive = i <= expected.stars;
    if (shouldBeActive) {
      await expect(starElement).toHaveClass(/active/);
    } else {
      await expect(starElement).not.toHaveClass(/active/);
    }
  }

  // Verify inventory attack display
  if (expected.inventoryAttack !== undefined) {
    const inventoryDisplay = page.locator(
      `#inventory-display-${rarity}-${tier}`,
    );
    const expectedText = `${expected.inventoryAttack.toFixed(1)}% inventory attack`;
    await expect(inventoryDisplay).toHaveText(expectedText);
  }

  // Verify equipped display if weapon is equipped
  if (expected.equipped && expected.equippedAttack !== undefined) {
    const equippedDisplay = page.locator(`#equipped-display-${rarity}-${tier}`);
    await expect(equippedDisplay).toBeVisible();

    const equippedValue = page.locator(`#equipped-value-${rarity}-${tier}`);
    const expectedText = `${expected.equippedAttack.toFixed(1)}% equipped attack`;
    await expect(equippedValue).toHaveText(expectedText);
  }
}

/**
 * Verify summary stats match expected values
 * @param {Page} page - Playwright page object
 * @param {Object} expected - Expected values { totalInventory, equipped, total }
 */
export async function verifySummaryStats(page, expected) {
  const totalInventoryElement = page.locator("#total-inventory-attack");
  const equippedElement = page.locator("#equipped-weapon-attack-pct");
  const totalElement = page.locator("#total-weapon-attack");

  await expect(totalInventoryElement).toHaveText(
    expected.totalInventory.toString() + "%",
  );
  await expect(equippedElement).toHaveText(expected.equipped.toString() + "%");
  await expect(totalElement).toHaveText(expected.total.toString() + "%");
}

/**
 * Verify sub-tab is active
 * @param {Page} page - Playwright page object
 * @param {string} tabName - Tab name ('weapons-grid' or 'upgrade-priority')
 */
export async function verifySubTabActive(page, tabName) {
  const subTab = page.locator(`#weapon-levels-${tabName}`);
  await expect(subTab).toBeVisible();
  await expect(subTab).toHaveClass(/active/);

  // Verify corresponding button is active
  const buttons = page.locator("#weapon-levels-subtab-button");
  const buttonCount = await buttons.count();

  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const onClickAttr = await button.getAttribute("onclick");

    if (onClickAttr && onClickAttr.includes(tabName)) {
      await expect(button).toHaveClass(/active/);
    }
  }
}

/**
 * Get upgrade priority chain text
 * @param {Page} page - Playwright page object
 * @returns {Promise<string>} Priority chain HTML content
 */
export async function getPriorityChain(page) {
  const chainElement = page.locator("#upgrade-priority-chain");
  return await chainElement.innerHTML();
}

/**
 * Parse priority chain to extract upgrade sequence
 * @param {string} chainHTML - HTML content of priority chain
 * @returns {Array} Array of upgrade objects { rarity, tier, count }
 */
export function parsePriorityChain(chainHTML) {
  const upgrades = [];
  const items = chainHTML.match(
    /<span class="wl-priority-item"[^>]*>([^<]+)<\/span>/g,
  );

  if (items) {
    items.forEach((item) => {
      const match = item.match(/data-rarity="(\w+)">([^<]+)</);
      if (match) {
        const [, rarity, text] = match;
        // Parse "T4 N x15" format
        const textMatch = text.match(/([Tt][1234]) ([A-Z]) x(\d+)/);
        if (textMatch) {
          upgrades.push({
            rarity: rarity,
            tier: textMatch[1].toLowerCase(),
            count: parseInt(textMatch[3]),
          });
        }
      }
    });
  }

  return upgrades;
}

/**
 * Verify currency calculator results
 * @param {Page} page - Playwright page object
 * @param {Object} expected - Expected values
 */
export async function verifyCurrencyCalculator(page, expected) {
  const attackGain = page.locator("#currency-attack-gain");
  const dpsGain = page.locator("#currency-dps-gain");
  const resultsDiv = page.locator("#currency-upgrade-results");

  await expect(resultsDiv).toHaveClass(/visible/);
  await expect(attackGain).toContainText(expected.attackGain.toString());
  await expect(dpsGain).toContainText(expected.dpsGain.toString());
}

/**
 * Mark element as covered for tracking
 * @param {string} elementId - Element ID
 */
export function markElementCovered(elementId) {
  // This would integrate with a coverage tracking system
  // For now, it's a placeholder
  console.log(`Covered: ${elementId}`);
}

/**
 * Element coverage inventory for weapon levels tab
 * Track all interactive elements that need testing
 */
export const WEAPON_LEVELS_ELEMENTS = {
  subTabButtons: [
    "weapon-levels-subtab-button[weapons-grid]",
    "weapon-levels-subtab-button[upgrade-priority]",
  ],

  // Weapon cards (edge case focus - key rarities and tiers)
  weaponCards: [
    "weapon-normal-t4",
    "weapon-legendary-t4",
    "weapon-ancient-t4",
    "weapon-ancient-t1", // Disabled card
  ],

  // Star ratings (testing edge cases: 0, 1, 5 stars)
  starRatings: [
    "star-normal-t4-1",
    "star-normal-t4-5",
    "star-legendary-t4-1",
    "star-legendary-t4-5",
    "star-ancient-t4-1",
    "star-ancient-t4-5",
  ],

  // Level inputs (edge cases: 0, max level for stars)
  levelInputs: ["level-normal-t4", "level-legendary-t4", "level-ancient-t4"],

  // Equipped checkboxes
  equippedCheckboxes: [
    "equipped-checkbox-normal-t4",
    "equipped-checkbox-legendary-t4",
    "equipped-checkbox-ancient-t4",
  ],

  // Currency calculator
  currencyCalculator: [
    "upgrade-currency-input",
    "currency-attack-gain",
    "currency-dps-gain",
    "currency-upgrade-path",
    "apply-upgrade-path-btn",
  ],

  // Summary stats
  summaryStats: [
    "total-inventory-attack",
    "equipped-weapon-attack-pct",
    "total-weapon-attack",
  ],

  // Priority chain
  priorityChain: ["upgrade-priority-chain"],
};

/**
 * Get all weapon combinations for testing
 * @returns {Array} Array of { rarity, tier } objects
 */
export function getAllWeaponCombinations() {
  const rarities = [
    "normal",
    "rare",
    "epic",
    "unique",
    "legendary",
    "mystic",
    "ancient",
  ];
  const tiers = ["t1", "t2", "t3", "t4"];
  const combinations = [];

  rarities.forEach((rarity) => {
    tiers.forEach((tier) => {
      // Skip disabled cards
      if (rarity === "ancient" && tier === "t1") return;
      combinations.push({ rarity, tier });
    });
  });

  return combinations;
}

/**
 * Get edge case weapon combinations for testing
 * @returns {Array} Array of { rarity, tier, description } objects
 */
export function getEdgeCaseWeapons() {
  return [
    {
      rarity: "normal",
      tier: "t4",
      description: "Normal T4 - most efficient upgrade",
    },
    {
      rarity: "legendary",
      tier: "t4",
      description: "Legendary T4 - high rarity",
    },
    {
      rarity: "ancient",
      tier: "t4",
      description: "Ancient T4 - highest rarity",
    },
    {
      rarity: "ancient",
      tier: "t1",
      description: "Ancient T1 - disabled card",
    },
    {
      rarity: "normal",
      tier: "t4",
      stars: 5,
      level: 200,
      description: "Max stars and level",
    },
    {
      rarity: "legendary",
      tier: "t4",
      stars: 1,
      level: 50,
      description: "Min stars (1), mid level",
    },
  ];
}

/**
 * Verify max level enforcement based on stars
 * @param {Page} page - Playwright page object
 * @param {string} rarity - Weapon rarity
 * @param {string} tier - Weapon tier
 * @param {number} stars - Number of stars
 * @param {number} expectedMaxLevel - Expected max level
 */
export async function verifyMaxLevelEnforcement(
  page,
  rarity,
  tier,
  stars,
  expectedMaxLevel,
) {
  const levelInput = page.locator(`#level-${rarity}-${tier}`);

  // Try to set a level higher than max
  await levelInput.fill((expectedMaxLevel + 10).toString());
  await page.waitForTimeout(100);

  // Should be capped at expectedMaxLevel
  const actualValue = await levelInput.inputValue();
  expect(parseInt(actualValue)).toBeLessThanOrEqual(expectedMaxLevel);

  // Verify the max attribute is set correctly
  const maxAttr = await levelInput.getAttribute("max");
  expect(parseInt(maxAttr)).toBe(expectedMaxLevel);
}
