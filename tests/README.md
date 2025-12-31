# Regression Test Suite

This directory contains regression tests for the Maplestory Damage Calculator to ensure features don't break with future changes.

## Running Tests

### Run all tests
```bash
node tests/run-all-tests.js
```

### Run a specific test suite
```bash
node tests/weapon-priority.test.js
```

## Test Structure

- **`test-runner.js`** - Simple test framework with assertion helpers
- **`test-helpers.js`** - Calculation functions extracted for testing (mirrors calculations.js)
- **`*.test.js`** - Individual test suites for specific features
- **`run-all-tests.js`** - Master runner that executes all test suites

## Writing New Tests

### 1. Create a new test file

Create a file named `<feature>.test.js` in the tests directory:

```javascript
const { TestRunner, assertEqual, assertAlmostEqual } = require('./test-runner');
const { /* import helpers needed */ } = require('./test-helpers');

const runner = new TestRunner();

// Add your tests
runner.test('Description of what you are testing', () => {
    const result = someCalculation();
    assertEqual(result, expectedValue, 'Optional error message');
});

// Run the tests
runner.run().then(success => {
    process.exit(success ? 0 : 1);
});
```

### 2. Available assertion helpers

```javascript
// Exact equality
assertEqual(actual, expected, message);

// Floating point comparison with tolerance
assertAlmostEqual(actual, expected, tolerance, message);
// Default tolerance: 0.0001

// Comparison assertions
assertGreaterThan(actual, expected, message);
assertLessThan(actual, expected, message);
```

### 3. Example test

```javascript
runner.test('Weapon attack calculation should be correct', () => {
    const result = calculateWeaponAttacks('normal', 't1', 1);

    // Check equipped attack
    assertAlmostEqual(
        result.equippedAttack,
        8.6,
        0.01,
        'Equipped attack for T1 Normal level 1 incorrect'
    );

    // Check inventory attack
    assertAlmostEqual(
        result.inventoryAttack,
        0.43,
        0.01,
        'Inventory attack for T1 Normal level 1 incorrect'
    );
});
```

## When to Write Tests

Write regression tests after completing a feature or fixing a bug:

1. **New Feature** - Create tests that verify the feature works as designed
2. **Bug Fix** - Create a test that reproduces the bug, verify it fails, then fix the bug and verify the test passes
3. **Refactoring** - Run existing tests before and after to ensure behavior unchanged

## Workflow

### Adding tests for a new feature

1. Implement your feature
2. Create a new test file: `tests/<feature-name>.test.js`
3. Write tests that verify the feature works correctly
4. Run tests: `node tests/run-all-tests.js`
5. Commit both the feature code and tests

### Before making changes

```bash
# Run tests to establish baseline
node tests/run-all-tests.js

# Make your changes...

# Run tests again to verify nothing broke
node tests/run-all-tests.js
```

## Current Test Coverage

- **weapon-priority.test.js** - Weapon upgrade priority algorithm
  - Weapon attack calculations
  - Upgrade cost calculations
  - Single-level efficiency calculations
  - Priority algorithm correctness
  - Display/priority alignment

## Tips

- Keep tests focused on one specific behavior
- Use descriptive test names that explain what is being tested
- Include both positive cases (should work) and edge cases (boundary conditions)
- When a test fails, the error message should clearly indicate what went wrong
- Tests should be deterministic (same input always produces same output)
