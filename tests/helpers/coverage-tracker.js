/**
 * Element Coverage Tracker
 * Maintains inventory of interactive elements and tracks testing coverage
 */

// Element Inventory Manifest - Base Stats Tab
export const BASE_STATS_ELEMENTS = {
  classSelectors: [
    "class-hero",
    "class-dark-knight",
    "class-bowmaster",
    "class-marksman",
    "class-night-lord",
    "class-shadower",
    "class-arch-mage-il",
    "class-arch-mage-fp",
  ],
  jobTierButtons: ["job-tier-3rd", "job-tier-4th"],
  masteryTabButtons: ["mastery-tab-3rd", "mastery-tab-4th"],
  characterLevel: ["character-level"],
  statInputs: [
    "attack-base",
    "defense-base",
    "crit-rate-base",
    "crit-damage-base",
    "attack-speed-base",
    "str-base",
    "dex-base",
    "int-base",
    "luk-base",
    "stat-damage-base",
    "damage-base",
    "damage-amp-base",
    "def-pen-base",
    "boss-damage-base",
    "normal-damage-base",
    "min-damage-base",
    "max-damage-base",
    "final-damage-base",
    "main-stat-pct-base",
  ],
  skillLevelInputs: [
    "skill-level-1st-base",
    "skill-level-2nd-base",
    "skill-level-3rd-base",
    "skill-level-4th-base",
  ],
  mastery3rdCheckboxes: [
    "mastery-3rd-all-64",
    "mastery-3rd-all-68",
    "mastery-3rd-boss-72",
    "mastery-3rd-all-76",
    "mastery-3rd-all-80",
    "mastery-3rd-boss-84",
    "mastery-3rd-all-88",
    "mastery-3rd-all-92",
  ],
  mastery4thCheckboxes: [
    "mastery-4th-all-102",
    "mastery-4th-all-106",
    "mastery-4th-boss-111",
    "mastery-4th-all-116",
    "mastery-4th-all-120",
    "mastery-4th-boss-124",
    "mastery-4th-all-128",
    "mastery-4th-all-132",
  ],
  contentTypeSelectors: [
    "content-none",
    "content-stageHunt",
    "content-chapterBoss",
    "content-worldBoss",
    "content-growthDungeon",
  ],
  dropdowns: ["target-subcategory", "target-stage-base"],
};

// Coverage tracking state
const coverageState = {
  classSelectors: new Set(),
  jobTierButtons: new Set(),
  masteryTabButtons: new Set(),
  characterLevel: new Set(),
  statInputs: new Set(),
  skillLevelInputs: new Set(),
  mastery3rdCheckboxes: new Set(),
  mastery4thCheckboxes: new Set(),
  contentTypeSelectors: new Set(),
  dropdowns: new Set(),
};

/**
 * Mark an element as covered in tests
 * @param {string} category - Element category (e.g., 'classSelectors', 'statInputs')
 * @param {string} elementId - Element ID or selector
 */
export function markElementCovered(category, elementId) {
  if (coverageState[category]) {
    coverageState[category].add(elementId);
  }
}

/**
 * Generate coverage report showing tested vs untested elements
 * @returns {object} Coverage report with statistics
 */
export function generateCoverageReport() {
  const report = {
    totalElements: 0,
    testedElements: 0,
    categories: {},
    untestedElements: [],
  };

  for (const [category, elements] of Object.entries(BASE_STATS_ELEMENTS)) {
    const total = elements.length;
    const tested = coverageState[category]?.size || 0;
    const percentage = total > 0 ? Math.round((tested / total) * 100) : 0;

    report.categories[category] = {
      total,
      tested,
      untested: total - tested,
      percentage,
    };

    report.totalElements += total;
    report.testedElements += tested;

    // Track untested elements
    if (tested < total) {
      const testedSet = coverageState[category] || new Set();
      const untested = elements.filter((el) => !testedSet.has(el));
      report.untestedElements.push(
        ...untested.map((el) => `${category}: ${el}`),
      );
    }
  }

  report.overallPercentage =
    report.totalElements > 0
      ? Math.round((report.testedElements / report.totalElements) * 100)
      : 0;

  return report;
}

/**
 * Log coverage report to console
 */
export function logCoverageReport() {
  const report = generateCoverageReport();

  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║        BASE STATS ELEMENT COVERAGE REPORT                 ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  console.log(
    `Overall Coverage: ${report.overallPercentage}% (${report.testedElements}/${report.totalElements} elements)\n`,
  );

  for (const [category, stats] of Object.entries(report.categories)) {
    const status = stats.percentage === 100 ? "✓" : "✗";
    console.log(
      `${status} ${category}: ${stats.percentage}% (${stats.tested}/${stats.total})`,
    );
  }

  if (report.untestedElements.length > 0) {
    console.log(
      "\n════════════════════════════════════════════════════════════",
    );
    console.log("UNTESTED ELEMENTS:");
    console.log("════════════════════════════════════════════════════════════");
    report.untestedElements.forEach((el) => console.log(`  - ${el}`));
  }

  console.log(
    "\n════════════════════════════════════════════════════════════\n",
  );
}

/**
 * Reset coverage state (useful between test runs)
 */
export function resetCoverageState() {
  for (const key of Object.keys(coverageState)) {
    coverageState[key].clear();
  }
}

/**
 * Get all element IDs for a category
 * @param {string} category - Element category
 * @returns {array} Array of element IDs
 */
export function getElementsInCategory(category) {
  return BASE_STATS_ELEMENTS[category] || [];
}

/**
 * Check if a specific element is covered
 * @param {string} category - Element category
 * @param {string} elementId - Element ID
 * @returns {boolean} True if element has been tested
 */
export function isElementCovered(category, elementId) {
  return coverageState[category]?.has(elementId) || false;
}
