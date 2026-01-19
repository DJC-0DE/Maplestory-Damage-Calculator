// Simple test runner for regression tests
// Run with: node tests/test-runner.js

const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('\n=== Running Regression Tests ===\n');

        for (const test of this.tests) {
            try {
                await test.fn();
                this.results.passed++;
                console.log(`✓ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({
                    test: test.name,
                    error: error.message,
                    stack: error.stack
                });
                console.log(`✗ ${test.name}`);
                console.log(`  Error: ${error.message}`);
            }
        }

        this.printSummary();
        return this.results.failed === 0;
    }

    printSummary() {
        console.log('\n=== Test Summary ===');
        console.log(`Total: ${this.tests.length}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);

        if (this.results.failed === 0) {
            console.log('\n✓ All tests passed!');
        } else {
            console.log('\n✗ Some tests failed');
            process.exit(1);
        }
    }
}

// Assertion helpers
function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
    }
}

function assertAlmostEqual(actual, expected, tolerance = 0.0001, message = '') {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}\n  Difference: ${Math.abs(actual - expected)}`);
    }
}

function assertGreaterThan(actual, expected, message = '') {
    if (actual <= expected) {
        throw new Error(`${message}\n  Expected ${actual} > ${expected}`);
    }
}

function assertLessThan(actual, expected, message = '') {
    if (actual >= expected) {
        throw new Error(`${message}\n  Expected ${actual} < ${expected}`);
    }
}

module.exports = {
    TestRunner,
    assertEqual,
    assertAlmostEqual,
    assertGreaterThan,
    assertLessThan
};
