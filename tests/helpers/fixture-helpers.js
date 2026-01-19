/**
 * Fixture Helper Functions
 * Functions to apply base stats fixtures and verify state
 */

import {
  CLASS_SELECTORS,
  JOB_TIER_BUTTONS,
  STAT_INPUTS,
  SKILL_LEVEL_INPUTS,
  MASTERY_3RD_CHECKBOXES,
  MASTERY_4TH_CHECKBOXES,
  CONTENT_TYPE_SELECTORS,
  TARGET_DROPDOWNS,
  STORAGE_KEYS
} from './selectors.js';

/**
 * Clear all localStorage and sessionStorage
 * @param {Page} page - Playwright page object
 */
export async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Apply a complete base stats fixture to the page
 * @param {Page} page - Playwright page object
 * @param {object} fixture - Fixture object containing all character stats
 */
export async function applyBaseStatsFixture(page, fixture) {
  // Set class selection
  if (fixture.class) {
    const classSelector = CLASS_SELECTORS[fixture.class];
    if (classSelector) {
      await page.click(classSelector);
    }
  }

  // Set job tier
  if (fixture.jobTier) {
    const tierButton = JOB_TIER_BUTTONS[fixture.jobTier];
    if (tierButton) {
      await page.click(tierButton);
    }
  }

  // Set character level
  if (fixture.level !== undefined) {
    await page.fill('#character-level', String(fixture.level));
  }

  // Set stat inputs - only fill visible inputs
  const statMappings = {
    attack: fixture.attack,
    defense: fixture.defense,
    critRate: fixture.critRate,
    critDamage: fixture.critDamage,
    attackSpeed: fixture.attackSpeed,
    str: fixture.str,
    dex: fixture.dex,
    int: fixture.int,
    luk: fixture.luk,
    statDamage: fixture.statDamage,
    damage: fixture.damage,
    damageAmp: fixture.damageAmp,
    defPen: fixture.defPen,
    bossDamage: fixture.bossDamage,
    normalDamage: fixture.normalDamage,
    minDamage: fixture.minDamage,
    maxDamage: fixture.maxDamage,
    finalDamage: fixture.finalDamage,
    mainStatPct: fixture.mainStatPct
  };

  for (const [stat, value] of Object.entries(statMappings)) {
    if (value !== undefined && STAT_INPUTS[stat]) {
      const selector = STAT_INPUTS[stat];
      // Check if input is visible before filling
      const isVisible = await page.locator(selector).isVisible();
      if (isVisible) {
        await page.fill(selector, String(value));
      }
    }
  }

  // Set skill levels
  if (fixture.skillLevels) {
    const skillMappings = {
      '1st': fixture.skillLevels['1st'],
      '2nd': fixture.skillLevels['2nd'],
      '3rd': fixture.skillLevels['3rd'],
      '4th': fixture.skillLevels['4th']
    };

    for (const [skill, value] of Object.entries(skillMappings)) {
      if (value !== undefined && SKILL_LEVEL_INPUTS[skill]) {
        await page.fill(SKILL_LEVEL_INPUTS[skill], String(value));
      }
    }
  }

  // Set mastery checkboxes
  if (fixture.mastery) {
    // 3rd job mastery
    for (const [key, value] of Object.entries(fixture.mastery)) {
      if (key.startsWith('3rd') && value) {
        const checkbox = MASTERY_3RD_CHECKBOXES[key.replace('mastery-', '').replace('-', '')];
        // Handle the naming conversion
        const checkboxKey = key.replace('mastery-', '');
        if (checkboxKey === '3rd-all-64' && value) await page.check(MASTERY_3RD_CHECKBOXES.all64);
        if (checkboxKey === '3rd-all-68' && value) await page.check(MASTERY_3RD_CHECKBOXES.all68);
        if (checkboxKey === '3rd-boss-72' && value) await page.check(MASTERY_3RD_CHECKBOXES.boss72);
        if (checkboxKey === '3rd-all-76' && value) await page.check(MASTERY_3RD_CHECKBOXES.all76);
        if (checkboxKey === '3rd-all-80' && value) await page.check(MASTERY_3RD_CHECKBOXES.all80);
        if (checkboxKey === '3rd-boss-84' && value) await page.check(MASTERY_3RD_CHECKBOXES.boss84);
        if (checkboxKey === '3rd-all-88' && value) await page.check(MASTERY_3RD_CHECKBOXES.all88);
        if (checkboxKey === '3rd-all-92' && value) await page.check(MASTERY_3RD_CHECKBOXES.all92);
      }
    }

    // 4th job mastery
    for (const [key, value] of Object.entries(fixture.mastery)) {
      if (key.startsWith('4th') && value) {
        if (key === '4th-all-102' && value) await page.check(MASTERY_4TH_CHECKBOXES.all102);
        if (key === '4th-all-106' && value) await page.check(MASTERY_4TH_CHECKBOXES.all106);
        if (key === '4th-boss-111' && value) await page.check(MASTERY_4TH_CHECKBOXES.boss111);
        if (key === '4th-all-116' && value) await page.check(MASTERY_4TH_CHECKBOXES.all116);
        if (key === '4th-all-120' && value) await page.check(MASTERY_4TH_CHECKBOXES.all120);
        if (key === '4th-boss-124' && value) await page.check(MASTERY_4TH_CHECKBOXES.boss124);
        if (key === '4th-all-128' && value) await page.check(MASTERY_4TH_CHECKBOXES.all128);
        if (key === '4th-all-132' && value) await page.check(MASTERY_4TH_CHECKBOXES.all132);
      }
    }
  }

  // Set target content
  if (fixture.targetContent) {
    const contentType = CONTENT_TYPE_SELECTORS[fixture.targetContent];
    if (contentType) {
      await page.click(contentType);
    }
  }

  // Wait for state to settle
  await page.waitForTimeout(100);
}

/**
 * Verify localStorage values match expected fixture
 * @param {Page} page - Playwright page object
 * @param {object} fixture - Fixture object with expected values
 * @returns {boolean} True if all storage values match
 */
export async function verifyStorageState(page, fixture) {
  const selectedClass = await page.evaluate(() => localStorage.getItem('selectedClass'));
  const selectedJobTier = await page.evaluate(() => localStorage.getItem('selectedJobTier'));

  return (
    selectedClass === fixture.class &&
    selectedJobTier === fixture.jobTier
  );
}

/**
 * Get current values from all stat inputs
 * @param {Page} page - Playwright page object
 * @returns {object} Object with current stat values
 */
export async function getCurrentStatValues(page) {
  return await page.evaluate(() => {
    const getInputValue = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : null;
    };

    return {
      attack: getInputValue('attack-base'),
      defense: getInputValue('defense-base'),
      critRate: getInputValue('crit-rate-base'),
      critDamage: getInputValue('crit-damage-base'),
      attackSpeed: getInputValue('attack-speed-base'),
      str: getInputValue('str-base'),
      dex: getInputValue('dex-base'),
      int: getInputValue('int-base'),
      luk: getInputValue('luk-base'),
      damage: getInputValue('damage-base'),
      bossDamage: getInputValue('boss-damage-base'),
      level: getInputValue('character-level')
    };
  });
}

/**
 * Navigate to base stats tab and wait for load
 * @param {Page} page - Playwright page object
 */
export async function navigateToBaseStats(page) {
  await page.goto('http://localhost:8000/#/setup/base-stats');
  await page.waitForTimeout(200);
  await page.waitForSelector('#setup-base-stats', { state: 'visible' });
}

/**
 * Navigate to Stat Predictions tab (stat-tables sub-tab) and wait for load
 * @param {Page} page - Playwright page object
 */
export async function navigateToStatPredictions(page) {
  await page.goto('http://localhost:8000/#/predictions/stat-tables');
  await page.waitForTimeout(200);
  await page.waitForSelector('#predictions-stat-tables', { state: 'visible' });
}

/**
 * Navigate to Stat Equivalency tab and wait for load
 * @param {Page} page - Playwright page object
 */
export async function navigateToStatEquivalency(page) {
  await page.goto('http://localhost:8000/#/predictions/equivalency');
  await page.waitForTimeout(200);
  await page.waitForSelector('#predictions-equivalency', { state: 'visible' });
}
