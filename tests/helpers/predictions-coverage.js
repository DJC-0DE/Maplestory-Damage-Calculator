/**
 * Element Coverage Tracker for Stat Predictions
 * Maintains inventory of interactive elements and tracks testing coverage
 */

// Element Inventory Manifest - Stat Predictions Tabs
export const PREDICTIONS_ELEMENTS = {
  predictionsTabButtons: [
    'stat-tables-tab',
    'equivalency-tab'
  ],
  statTablesElements: [
    'stat-weights-base-container'
  ],
  equivalencyInputs: [
    'equiv-attack',
    'equiv-main-stat',
    'equiv-skill-coeff',
    'equiv-skill-mastery',
    'equiv-damage',
    'equiv-final-damage',
    'equiv-boss-damage',
    'equiv-normal-damage',
    'equiv-main-stat-pct',
    'equiv-damage-amp',
    'equiv-min-damage',
    'equiv-max-damage',
    'equiv-crit-rate',
    'equiv-crit-damage',
    'equiv-attack-speed',
    'equiv-def-pen'
  ],
  graphElements: [
    'damage-gain-graph',
    'stat-weight-chart'
  ]
};

// Coverage tracking state
const coverageState = {
  predictionsTabButtons: new Set(),
  statTablesElements: new Set(),
  equivalencyInputs: new Set(),
  graphElements: new Set()
};

/**
 * Mark an element as covered in tests
 * @param {string} category - Element category (e.g., 'equivalencyInputs', 'predictionsTabButtons')
 * @param {string} elementId - Element ID or selector
 */
export function markPredictionsElementCovered(category, elementId) {
  if (coverageState[category]) {
    coverageState[category].add(elementId);
  }
}

/**
 * Generate coverage report showing tested vs untested elements
 * @returns {object} Coverage report with statistics
 */
export function generatePredictionsCoverageReport() {
  const report = {
    totalElements: 0,
    testedElements: 0,
    categories: {},
    untestedElements: []
  };

  for (const [category, elements] of Object.entries(PREDICTIONS_ELEMENTS)) {
    const total = elements.length;
    const tested = coverageState[category]?.size || 0;
    const percentage = total > 0 ? Math.round((tested / total) * 100) : 0;

    report.categories[category] = {
      total,
      tested,
      untested: total - tested,
      percentage
    };

    report.totalElements += total;
    report.testedElements += tested;

    // Track untested elements
    if (tested < total) {
      const testedSet = coverageState[category] || new Set();
      const untested = elements.filter(el => !testedSet.has(el));
      report.untestedElements.push(...untested.map(el => `${category}: ${el}`));
    }
  }

  report.overallPercentage = report.totalElements > 0
    ? Math.round((report.testedElements / report.totalElements) * 100)
    : 0;

  return report;
}

/**
 * Log coverage report to console
 */
export function logPredictionsCoverageReport() {
  const report = generatePredictionsCoverageReport();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     STAT PREDICTIONS ELEMENT COVERAGE REPORT             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Overall Coverage: ${report.overallPercentage}% (${report.testedElements}/${report.totalElements} elements)\n`);

  for (const [category, stats] of Object.entries(report.categories)) {
    const status = stats.percentage === 100 ? '✓' : '✗';
    console.log(`${status} ${category}: ${stats.percentage}% (${stats.tested}/${stats.total})`);
  }

  if (report.untestedElements.length > 0) {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('UNTESTED ELEMENTS:');
    console.log('════════════════════════════════════════════════════════════');
    report.untestedElements.forEach(el => console.log(`  - ${el}`));
  }

  console.log('\n════════════════════════════════════════════════════════════\n');
}

/**
 * Reset coverage state (useful between test runs)
 */
export function resetPredictionsCoverageState() {
  for (const key of Object.keys(coverageState)) {
    coverageState[key].clear();
  }
}

/**
 * Get all element IDs for a category
 * @param {string} category - Element category
 * @returns {array} Array of element IDs
 */
export function getPredictionsElementsInCategory(category) {
  return PREDICTIONS_ELEMENTS[category] || [];
}

/**
 * Check if a specific element is covered
 * @param {string} category - Element category
 * @param {string} elementId - Element ID
 * @returns {boolean} True if element has been tested
 */
export function isPredictionsElementCovered(category, elementId) {
  return coverageState[category]?.has(elementId) || false;
}
