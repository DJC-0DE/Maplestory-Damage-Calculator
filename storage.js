// Save all data to localStorage
function saveToLocalStorage() {
    const data = {
        baseSetup: {},
        equippedItem: {},
        comparisonItems: [],
        comparisonItemCount: comparisonItemCount,
        weapons: {}
    };

    // Save Base Setup
    const fields = [
        'attack', 'crit-rate', 'crit-damage', 'stat-damage', 'damage',
        'damage-amp', 'attack-speed', 'def-pen', 'boss-damage',
        'normal-damage', 'skill-coeff', 'skill-mastery', 'skill-mastery-boss',
        'min-damage', 'max-damage', 'primary-main-stat', 'secondary-main-stat'
    ];

    fields.forEach(field => {
        const element = document.getElementById(`${field}-base`);
        if (element) {
            data.baseSetup[field] = element.value;
        }
    });

    // Save Equipped Item
    data.equippedItem.name = document.getElementById('equipped-name')?.value || '';
    data.equippedItem.attack = document.getElementById('equipped-attack')?.value || '0';
    data.equippedItem.stats = [];

    for (let i = 1; i <= 10; i++) {
        const typeElem = document.getElementById(`equipped-stat-${i}-type`);
        const valueElem = document.getElementById(`equipped-stat-${i}-value`);

        if (typeElem && valueElem) {
            data.equippedItem.stats.push({
                type: typeElem.value,
                value: valueElem.value
            });
        }
    }

    // Save Comparison Items
    for (let i = 1; i <= comparisonItemCount; i++) {
        const element = document.getElementById(`comparison-item-${i}`);
        if (element) {
            const item = {
                id: i,
                name: document.getElementById(`item-${i}-name`)?.value || '',
                attack: document.getElementById(`item-${i}-attack`)?.value || '0',
                stats: []
            };

            for (let j = 1; j <= 10; j++) {
                const typeElem = document.getElementById(`item-${i}-stat-${j}-type`);
                const valueElem = document.getElementById(`item-${i}-stat-${j}-value`);

                if (typeElem && valueElem) {
                    item.stats.push({
                        type: typeElem.value,
                        value: valueElem.value
                    });
                }
            }

            data.comparisonItems.push(item);
        }
    }

    // Save Weapons
    rarities.forEach(rarity => {
        tiers.forEach(tier => {
            const inventoryInput = document.getElementById(`inventory-${rarity}-${tier}`);
            const equippedCheckbox = document.getElementById(`equipped-${rarity}-${tier}`);
            const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

            if (inventoryInput) {
                const key = `${rarity}-${tier}`;
                data.weapons[key] = {
                    inventoryAttack: inventoryInput.value,
                    equipped: equippedCheckbox ? equippedCheckbox.checked : false,
                    equippedAttack: equippedInput ? equippedInput.value : '0'
                };
            }
        });
    });

    localStorage.setItem('damageCalculatorData', JSON.stringify(data));
}

// Load data from localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('damageCalculatorData');
    if (!savedData) {
        return false;
    }

    try {
        const data = JSON.parse(savedData);

        // Load Base Setup
        const fields = [
            'attack', 'crit-rate', 'crit-damage', 'stat-damage', 'damage',
            'damage-amp', 'attack-speed', 'def-pen', 'boss-damage',
            'normal-damage', 'skill-coeff', 'skill-mastery', 'skill-mastery-boss',
            'min-damage', 'max-damage', 'primary-main-stat', 'secondary-main-stat'
        ];

        if (data.baseSetup) {
            fields.forEach(field => {
                const element = document.getElementById(`${field}-base`);
                if (element && data.baseSetup[field] !== undefined) {
                    element.value = data.baseSetup[field];
                }
            });
        }

        // Load Equipped Item
        if (data.equippedItem) {
            document.getElementById('equipped-name').value = data.equippedItem.name || '';
            document.getElementById('equipped-attack').value = data.equippedItem.attack || '0';

            if (data.equippedItem.stats && data.equippedItem.stats.length > 0) {
                data.equippedItem.stats.forEach(stat => {
                    addEquippedStat();
                    const typeElem = document.getElementById(`equipped-stat-${equippedStatCount}-type`);
                    const valueElem = document.getElementById(`equipped-stat-${equippedStatCount}-value`);

                    if (typeElem) typeElem.value = stat.type;
                    if (valueElem) valueElem.value = stat.value;
                });
            }
        }

        // Load Comparison Items
        if (data.comparisonItems && data.comparisonItems.length > 0) {
            data.comparisonItems.forEach(item => {
                addComparisonItem();
                document.getElementById(`item-${comparisonItemCount}-name`).value = item.name || '';
                document.getElementById(`item-${comparisonItemCount}-attack`).value = item.attack || '0';

                if (item.stats && item.stats.length > 0) {
                    item.stats.forEach(stat => {
                        addComparisonItemStat(comparisonItemCount);
                        const container = document.getElementById(`item-${comparisonItemCount}-stats-container`);
                        const statCount = container.children.length;

                        const typeElem = document.getElementById(`item-${comparisonItemCount}-stat-${statCount}-type`);
                        const valueElem = document.getElementById(`item-${comparisonItemCount}-stat-${statCount}-value`);

                        if (typeElem) typeElem.value = stat.type;
                        if (valueElem) valueElem.value = stat.value;
                    });
                }
            });
        }

        // Load Weapons
        if (data.weapons) {
            rarities.forEach(rarity => {
                tiers.forEach(tier => {
                    const key = `${rarity}-${tier}`;
                    const weaponData = data.weapons[key];

                    if (weaponData) {
                        const inventoryInput = document.getElementById(`inventory-${rarity}-${tier}`);
                        const equippedCheckbox = document.getElementById(`equipped-${rarity}-${tier}`);
                        const equippedInput = document.getElementById(`equipped-attack-${rarity}-${tier}`);

                        if (inventoryInput) inventoryInput.value = weaponData.inventoryAttack || '0';
                        if (equippedCheckbox) {
                            equippedCheckbox.checked = weaponData.equipped;
                            if (weaponData.equipped) {
                                handleEquippedChange(rarity, tier);
                            }
                        }
                        if (equippedInput) equippedInput.value = weaponData.equippedAttack;
                    }
                });
            });
        }

        return true;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return false;
    }
}

// Update analysis tabs when base stats change
function updateAnalysisTabs() {
    // Update Inner Ability Analysis
    renderPresetComparison();
    renderTheoreticalBest();

    // Update Artifact Potential
    renderArtifactPotential();

    // Recalculate all comparisons
    calculate();
}

// Attach save listeners to base setup inputs
function attachSaveListeners() {
    // Attach to base setup inputs
    const fields = [
        'attack', 'crit-rate', 'crit-damage', 'stat-damage', 'damage',
        'damage-amp', 'attack-speed', 'def-pen', 'boss-damage',
        'normal-damage', 'skill-coeff', 'skill-mastery', 'skill-mastery-boss',
        'min-damage', 'max-damage', 'primary-main-stat', 'secondary-main-stat'
    ];

    fields.forEach(field => {
        const element = document.getElementById(`${field}-base`);
        if (element) {
            element.addEventListener('input', () => {
                saveToLocalStorage();
                updateAnalysisTabs();
            });
        }
    });

    // Attach to equipped item name and attack
    const equippedName = document.getElementById('equipped-name');
    const equippedAttack = document.getElementById('equipped-attack');
    if (equippedName) equippedName.addEventListener('input', saveToLocalStorage);
    if (equippedAttack) equippedAttack.addEventListener('input', saveToLocalStorage);
}
