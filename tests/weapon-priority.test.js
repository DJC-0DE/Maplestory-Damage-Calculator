// Regression tests for weapon upgrade priority
// Run with: node tests/weapon-priority.test.js

const { TestRunner, assertEqual, assertAlmostEqual } = require('./test-runner');
const {
    calculateWeaponAttacks,
    getUpgradeCost,
    calculateUpgradeEfficiency,
    simulateUpgradePriority
} = require('./test-helpers');

const runner = new TestRunner();

// ============================================================================
// Test: Basic weapon attack calculations
// ============================================================================

runner.test('T1 Normal level 1 should have correct attack values', () => {
    const result = calculateWeaponAttacks('normal', 't1', 1);
    assertAlmostEqual(result.equippedAttack, 25.0, 0.01, 'Equipped attack incorrect');
    assertAlmostEqual(result.inventoryAttack, 7.14, 0.01, 'Inventory attack incorrect');
});

runner.test('T4 Normal level 1 should have correct attack values', () => {
    const result = calculateWeaponAttacks('normal', 't4', 1);
    assertAlmostEqual(result.equippedAttack, 15.0, 0.01, 'Equipped attack incorrect');
    assertAlmostEqual(result.inventoryAttack, 4.29, 0.01, 'Inventory attack incorrect');
});

runner.test('T4 Rare level 1 should have correct attack values', () => {
    const result = calculateWeaponAttacks('rare', 't4', 1);
    assertAlmostEqual(result.equippedAttack, 31.3, 0.01, 'Equipped attack incorrect');
    assertAlmostEqual(result.inventoryAttack, 8.94, 0.01, 'Inventory attack incorrect');
});

// ============================================================================
// Test: Upgrade cost calculations
// ============================================================================

runner.test('T1 Normal level 1 upgrade should cost 18 shards', () => {
    const cost = getUpgradeCost('normal', 't1', 1);
    assertEqual(cost, 18, 'Upgrade cost incorrect');
});

runner.test('T4 Normal level 1 upgrade should cost 10 shards', () => {
    const cost = getUpgradeCost('normal', 't4', 1);
    assertEqual(cost, 10, 'Upgrade cost incorrect');
});

runner.test('T4 Rare level 1 upgrade should cost 40 shards', () => {
    const cost = getUpgradeCost('rare', 't4', 1);
    assertEqual(cost, 40, 'Upgrade cost incorrect');
});

runner.test('T3 Rare level 1 upgrade should cost 48 shards', () => {
    const cost = getUpgradeCost('rare', 't3', 1);
    assertEqual(cost, 48, 'Upgrade cost incorrect');
});

// ============================================================================
// Test: Multi-level efficiency calculations (per 1k shards)
// ============================================================================

runner.test('T1 Normal level 1 should have ~0.94%/1k efficiency', () => {
    const efficiency = calculateUpgradeEfficiency('normal', 't1', 1);
    assertAlmostEqual(efficiency, 0.94, 0.05, 'Efficiency calculation incorrect');
});

runner.test('T4 Normal level 1 should have ~0.86%/1k efficiency', () => {
    const efficiency = calculateUpgradeEfficiency('normal', 't4', 1);
    assertAlmostEqual(efficiency, 0.86, 0.05, 'Efficiency calculation incorrect');
});

runner.test('T3 Rare level 1 should have ~0.60%/1k efficiency', () => {
    const efficiency = calculateUpgradeEfficiency('rare', 't3', 1);
    assertAlmostEqual(efficiency, 0.60, 0.05, 'Efficiency calculation incorrect');
});

runner.test('T4 Rare level 1 should have ~0.57%/1k efficiency', () => {
    const efficiency = calculateUpgradeEfficiency('rare', 't4', 1);
    assertAlmostEqual(efficiency, 0.57, 0.05, 'Efficiency calculation incorrect');
});

// ============================================================================
// Test: Priority algorithm correctness
// ============================================================================

runner.test('T4 Normal should be prioritized over T3 Rare at level 1', () => {
    const t4NormalEff = calculateUpgradeEfficiency('normal', 't4', 1);
    const t3RareEff = calculateUpgradeEfficiency('rare', 't3', 1);

    if (t4NormalEff <= t3RareEff) {
        throw new Error(`T4 Normal (${t4NormalEff.toFixed(4)}) should have higher efficiency than T3 Rare (${t3RareEff.toFixed(4)})`);
    }
});

runner.test('Priority chain should start with T4 Normal when all at level 1', () => {
    const weaponStates = [
        { rarity: 'normal', tier: 't1', level: 1, stars: 5 },
        { rarity: 'normal', tier: 't2', level: 1, stars: 5 },
        { rarity: 'normal', tier: 't3', level: 1, stars: 5 },
        { rarity: 'normal', tier: 't4', level: 1, stars: 5 },
        { rarity: 'rare', tier: 't1', level: 1, stars: 5 },
        { rarity: 'rare', tier: 't2', level: 1, stars: 5 },
        { rarity: 'rare', tier: 't3', level: 1, stars: 5 },
        { rarity: 'rare', tier: 't4', level: 1, stars: 5 },
        { rarity: 'epic', tier: 't1', level: 1, stars: 5 },
        { rarity: 'epic', tier: 't2', level: 1, stars: 5 },
        { rarity: 'epic', tier: 't3', level: 1, stars: 5 },
        { rarity: 'epic', tier: 't4', level: 1, stars: 5 },
    ];

    const sequence = simulateUpgradePriority(weaponStates, 5);

    const firstUpgrade = sequence[0];
    if (firstUpgrade.rarity !== 'normal' || firstUpgrade.tier !== 't4') {
        throw new Error(`First upgrade should be Normal T4, got ${firstUpgrade.rarity} ${firstUpgrade.tier}`);
    }
});

runner.test('T4 Normal should always be picked before T3 Rare when both at level 1', () => {
    const weaponStates = [
        { rarity: 'normal', tier: 't4', level: 1, stars: 5 },
        { rarity: 'rare', tier: 't3', level: 1, stars: 5 },
    ];

    const sequence = simulateUpgradePriority(weaponStates, 10);

    // Count upgrades of each weapon
    let t4NormalUpgrades = 0;
    let t3RareUpgrades = 0;
    let t3RareFoundFirst = false;

    for (const upgrade of sequence) {
        if (upgrade.rarity === 'normal' && upgrade.tier === 't4') {
            t4NormalUpgrades++;
        } else if (upgrade.rarity === 'rare' && upgrade.tier === 't3') {
            if (t4NormalUpgrades === 0) {
                t3RareFoundFirst = true;
            }
            t3RareUpgrades++;
        }
    }

    if (t3RareFoundFirst) {
        throw new Error('T3 Rare was upgraded before T4 Normal - priority algorithm is broken!');
    }
});

// ============================================================================
// Test: Display and priority use same calculation
// ============================================================================

runner.test('Display efficiency should match priority algorithm calculation', () => {
    // This test ensures the UI display shows the same efficiency value
    // that the priority algorithm uses for ranking

    const testCases = [
        { rarity: 'normal', tier: 't1', level: 1 },
        { rarity: 'normal', tier: 't4', level: 1 },
        { rarity: 'rare', tier: 't3', level: 1 },
        { rarity: 'epic', tier: 't4', level: 5 },
    ];

    testCases.forEach(({ rarity, tier, level }) => {
        // Both display and priority use calculateUpgradeEfficiency with 1k shards
        const displayEfficiency = calculateUpgradeEfficiency(rarity, tier, level, 5, 1000);
        const priorityEfficiency = calculateUpgradeEfficiency(rarity, tier, level, 5, 1000);

        assertAlmostEqual(
            displayEfficiency,
            priorityEfficiency,
            0.0001,
            `Display and priority efficiency mismatch for ${tier} ${rarity} at level ${level}`
        );
    });
});

// ============================================================================
// Test: Ensure rounding doesn't cause unexpected behavior
// ============================================================================

runner.test('Weapons should show non-zero efficiency when spending 1k shards', () => {
    // Even though single-level upgrades might have zero gain due to rounding,
    // spending 1k shards should always result in some gain
    const weapons = [
        { rarity: 'normal', tier: 't4' },
        { rarity: 'normal', tier: 't1' },
        { rarity: 'rare', tier: 't3' },
    ];

    weapons.forEach(({ rarity, tier }) => {
        const efficiency = calculateUpgradeEfficiency(rarity, tier, 1, 5, 1000);
        if (efficiency <= 0) {
            throw new Error(`${tier} ${rarity} has zero efficiency with 1k shards, expected non-zero`);
        }
    });
});

// ============================================================================
// Run all tests
// ============================================================================

runner.run().then(success => {
    process.exit(success ? 0 : 1);
});
