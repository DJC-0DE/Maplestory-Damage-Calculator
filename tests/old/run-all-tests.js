// Master test runner - runs all test suites
// Run with: node tests/run-all-tests.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.join(__dirname, file));

console.log(`Found ${testFiles.length} test suite(s)\n`);

let failedSuites = 0;
let currentIndex = 0;

function runNextTest() {
    if (currentIndex >= testFiles.length) {
        console.log('\n=== All Test Suites Complete ===');
        if (failedSuites > 0) {
            console.log(`\n✗ ${failedSuites} test suite(s) failed`);
            process.exit(1);
        } else {
            console.log('\n✓ All test suites passed!');
            process.exit(0);
        }
        return;
    }

    const testFile = testFiles[currentIndex];
    console.log(`\n[${ currentIndex + 1}/${testFiles.length}] Running ${path.basename(testFile)}...`);
    console.log('='.repeat(60));

    const test = spawn('node', [testFile], { stdio: 'inherit' });

    test.on('close', (code) => {
        if (code !== 0) {
            failedSuites++;
        }
        currentIndex++;
        runNextTest();
    });
}

runNextTest();
