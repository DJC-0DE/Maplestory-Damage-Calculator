import { formatNumber } from '@utils/formatters.js';
import { StatCalculationService } from '@core/services/stat-calculation-service.js';

// Note: calculateStatEquivalency has been migrated to TypeScript in src/ts/page/stat-hub/stat-equivalency.ts
// This function is kept here for reference but should be removed after full migration is complete
window.calculateStatEquivalency = calculateStatEquivalency;

// Calculate stat weights - generates HTML for stat damage predictions
// ULTRA-COMPACT REDESIGN: Horizontal tabbed dashboard with minimal vertical footprint
// Note: This function has been migrated to TypeScript in src/ts/page/stat-hub/stat-predictions.ts
// Kept here temporarily until Chart.js utilities (toggleStatChart, sortStatPredictions, switchStatPredictionTab) are migrated
export function calculateStatWeights(stats) {
    // Create base service to get base DPS values (calculated once in constructor, auto-fetches weaponAttackBonus)
    const baseService = new StatCalculationService(stats);
    const baseBossDPS = baseService.baseBossDPS;
    const baseNormalDPS = baseService.baseNormalDPS;

    // Flat attack increases
    const attackIncreases = [500, 1000, 2500, 5000, 10000, 15000];

    // Flat main stat increases (100 main stat = 1% stat damage)
    const mainStatIncreases = [100, 500, 1000, 2500, 5000, 7500];

    // Percentage-based stats
    const percentageStats = [
        { key: 'skillCoeff', label: 'Skill Coeff' },
        { key: 'skillMastery', label: 'Skill Mastery' },
        { key: 'damage', label: 'Damage' },
        { key: 'finalDamage', label: 'Final Dmg' },
        { key: 'bossDamage', label: 'Boss Dmg' },
        { key: 'normalDamage', label: 'Mob Dmg' },
        { key: 'statDamage', label: 'Main Stat %' },
        { key: 'damageAmp', label: 'Dmg Amp' },
        { key: 'minDamage', label: 'Min Dmg' },
        { key: 'maxDamage', label: 'Max Dmg' },
        { key: 'critRate', label: 'Crit Rate' },
        { key: 'critDamage', label: 'Crit Dmg' },
        { key: 'attackSpeed', label: 'Atk Speed' },
        { key: 'defPen', label: 'Def Pen' }
    ];

    const percentIncreases = [1, 5, 10, 25, 50, 75];

    const multiplicativeStats = {
        'finalDamage': true
    };

    const diminishingReturnStats = {
        'attackSpeed': { denominator: 150 },        
        'defPen': { denominator: 100 },        
    };

    // ============================================
    // VERTICAL STACKED STAT PREDICTIONS
    // ============================================
    let html = '';

    // ========== FLAT STATS SECTION ==========
    html += '<div class="stat-predictions-section">';
    html += '<h3 style="margin: 0 0 12px 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">Flat Stats</h3>';
    html += '<div class="">';
    html += `<table class="table" id="stat-pred-table-flat">`;
    html += '<thead><tr><th>Stat</th>';
    attackIncreases.forEach((inc, idx) => {
        html += `<th>+${formatNumber(inc)} </th>`;
    });
    html += '</tr></thead><tbody>';

    // Attack row
    html += `<tr><td><button onclick="toggleStatChart('attack', 'Attack', true)" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">📊</button>Attack</td>`;
    attackIncreases.forEach(increase => {
        const service = new StatCalculationService(stats);
        const oldValue = stats.attack;
        const effectiveIncrease = increase * (1 + service.weaponAttackBonus / 100);

        const newDPS = service.addAttack(increase).computeDPS('boss');
        const newValue = service.getStats().attack;
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100).toFixed(2);

        const tooltip = `+${formatNumber(increase)} Attack\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nEffective: +${formatNumber(effectiveIncrease)}\nGain: ${gain}%`;

        html += `<td title="${tooltip}">+${gain}%</span></td>`;
    });
    html += '</tr>';
    html += `<tr id="chart-row-attack" class="chart-row" style="display: none;"><td colspan="7"><canvas id="chart-attack"></canvas></td></tr>`;

    html += '<thead><tr><th>Stat</th>';
    mainStatIncreases.forEach((inc, idx) => {
        html += `<th>+${formatNumber(inc)} </th>`;
    });
    html += '</tr></thead><tbody>';

    // Main Stat row
    html += `<tr><td><button onclick="toggleStatChart('mainStat', 'Main Stat', true)" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">📊</button>Main Stat</td>`;
    mainStatIncreases.forEach(increase => {
        const service = new StatCalculationService(stats);  
        const actualMainStatGain = service.calculateMainStatIncreaseWithPct(increase);

        const newDPS = service.addMainStat(increase).computeDPS('boss');
        const gain = ((newDPS - baseBossDPS) / baseBossDPS * 100).toFixed(2);
     
        const tooltip = `+${formatNumber(actualMainStatGain)} Main Stat\n+${formatNumber(actualMainStatGain)} Attack\n+${(actualMainStatGain/100).toFixed(2)}% Stat Damage\nGain: ${gain}%`;

        html += `<td title="${tooltip}"><span style="color: var(--text-primary);">+${gain}%</span></td>`;
    });
    html += '</tr>';
    html += `<tr id="chart-row-mainStat" class="chart-row" style="display: none;"><td colspan="7" style="padding: 16px; background: var(--background); border-top: 1px solid var(--table-glass-border);"><canvas id="chart-mainStat"></canvas></td></tr>`;

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';

    // ========== PERCENTAGE STATS SECTION ==========
    html += '<div class="stat-predictions-section" style="margin-top: 24px;">';
    html += '<h3 style="margin: 0 0 12px 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">Percentage Stats</h3>';
    html += '<div class="">';
    html += `<table class="table" id="stat-pred-table-percentage">`;
    html += '<thead><tr><th style="padding: 8px 10px; font-size: 0.75rem;">Stat</th>';
    percentIncreases.forEach((inc, idx) => {
        html += `<th onclick="sortStatPredictions('percentage', ${idx + 1}, this)" onmouseover="this.style.background='var(--table-surface-subtle)'" onmouseout="this.style.background='transparent'">+${inc}% <span class="sort-indicator" style="opacity: 0.3; font-size: 0.8em; margin-left: 4px;">⇅</span></th>`;
    });
    html += '</tr></thead><tbody>';

    // Percentage stats rows
    percentageStats.forEach(stat => {
        let labelContent = stat.label;
        if (multiplicativeStats[stat.key]) {
            labelContent += ` <span style="font-size: 0.7em; opacity: 0.5;" title="Multiplicative">⚡</span>`;
        } else if (diminishingReturnStats[stat.key]) {
            //labelContent += ` <span style="font-size: 0.7em; opacity: 0.5;" title="Diminishing returns">📉</span>`;
        }

        html += `<tr><td><button onclick="toggleStatChart('${stat.key}', '${stat.label}', false)" title="Toggle graph" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">📊</button>${labelContent}</td>`;

        percentIncreases.forEach(increase => {
            // Simple flat addition for table values
            const service = new StatCalculationService(stats);
            const baseDPS = stat.key === "normalDamage" ? baseNormalDPS : baseBossDPS;

            // Apply the full increase at once (not in steps)
            if (stat.key === 'statDamage') {
                service.addMainStatPct(increase);
            } else if (multiplicativeStats[stat.key]) {
                service.addMultiplicativeStat(stat.key, increase);
            } else if (diminishingReturnStats[stat.key]) {
                const factor = diminishingReturnStats[stat.key].denominator;
                service.addDiminishingReturnStat(stat.key, increase, factor);
            } else {
                service.addPercentageStat(stat.key, increase);
            }

            const monsterType = stat.key === "normalDamage" ? 'normal' : 'boss';
            const newDPS = service.computeDPS(monsterType);
            const gain = ((newDPS - baseDPS) / baseDPS * 100).toFixed(2);

            const newValue = service.getStats()[stat.key];
            const oldValue = stats[stat.key];

            let tooltip;
            if (stat.key === 'statDamage') {
                const statDamageIncrease = (newValue - oldValue).toFixed(2);
                tooltip = `+${increase}% Main Stat\nStat Damage: +${statDamageIncrease}%\nGain: ${gain}%`;
            } else {
                tooltip = `+${increase}%\nOld: ${formatNumber(oldValue)}, New: ${formatNumber(newValue)}\nGain: ${gain}%`;
            }

            html += `<td title="${tooltip}"><span style="color: var(--text-primary);">+${gain}%</span></td>`;
        });

        html += '</tr>';
        html += `<tr id="chart-row-${stat.key}" class="chart-row" style="display: none;"><td colspan="7"><canvas id="chart-${stat.key}"></canvas></td></tr>`;
    });

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';

    document.getElementById(`stat-weights`).innerHTML = html;
}

// Tab switching function for stat predictions
window.switchStatPredictionTab = function(setup, tabName) {
    // Update tab buttons
    const container = document.getElementById(`stat-weights-${setup}`);
    const tabs = container.querySelectorAll('.stat-pred-tab');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update panels
    const panels = container.querySelectorAll('.stat-pred-panel');
    panels.forEach(panel => {
        if (panel.id === `stat-pred-panel-${setup}-${tabName}`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
};

// Column sorting for stat predictions tables
window.sortStatPredictions = function(setup, tabName, colIndex, headerElement) {
    const tableId = `stat-pred-table-${setup}-${tabName}`;
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Get all data rows (exclude chart rows)
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.classList.contains('chart-row'));

    // Parse numeric values from the clicked column and create row data
    const rowData = rows.map(row => {
        const cell = row.querySelector(`td:nth-child(${colIndex + 1})`);
        if (!cell) return { row, value: -Infinity };

        const span = cell.querySelector('span');
        const text = span ? span.textContent : cell.textContent;
        // Extract numeric value (handles "+1.23%" format)
        const value = parseFloat(text.replace(/[+%]/g, ''));
        return { row, value };
    });

    // Determine sort direction
    const currentSort = headerElement.dataset.sort || 'none';
    let newDirection = 'asc';

    if (currentSort === 'asc') {
        newDirection = 'desc';
    } else if (currentSort === 'desc') {
        newDirection = 'asc'; // Toggle back to asc
    }

    // Sort rows based on values
    rowData.sort((a, b) => {
        if (newDirection === 'asc') {
            return a.value - b.value;
        } else {
            return b.value - a.value;
        }
    });

    // Reorder rows in DOM (keeping chart rows with their data rows)
    rowData.forEach((item, index) => {
        const dataRow = item.row;
        const chartRow = dataRow.nextElementSibling;
        tbody.appendChild(dataRow);
        if (chartRow && chartRow.classList.contains('chart-row')) {
            tbody.appendChild(chartRow);
        }
    });

    // Update sort indicators
    const tableHeaders = table.querySelectorAll('th .sort-indicator');
    tableHeaders.forEach(indicator => {
        indicator.textContent = '⇅';
        indicator.style.opacity = '0.3';
    });

    const clickedIndicator = headerElement.querySelector('.sort-indicator');
    if (clickedIndicator) {
        clickedIndicator.textContent = newDirection === 'asc' ? '▲' : '▼';
        clickedIndicator.style.opacity = '1';
    }

    // Store sort state
    headerElement.dataset.sort = newDirection;
};

// Calculate stat equivalency - shows what other stats equal a given stat increase
export function calculateStatEquivalency(sourceStat) {
    // Get base stats from inputs
    const stats = getStats('base');

    // Create base service to get base DPS value (calculated once in constructor, auto-fetches weaponAttackBonus)
    const baseService = new StatCalculationService(stats);
    const baseBossDPS = baseService.baseBossDPS;

    // Map of stat IDs to their properties (ordered to match Stat Predictions tables)
    const statMapping = {
        'attack': {
            label: 'Attack',
            getValue: () => parseFloat(document.getElementById('equiv-attack').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addAttack(value);
                return service.getStats();
            },
            formatValue: (val) => formatNumber(val)
        },
         'main-stat': {
            label: 'Main Stat',
            getValue: () => parseFloat(document.getElementById('equiv-main-stat').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addMainStat(value);

                return service.getStats();
            },
            formatValue: (val) => formatNumber(val)
        },
        'main-stat-pct': {
            label: 'Main Stat %',
            getValue: () => parseFloat(document.getElementById('equiv-main-stat-pct').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addMainStatPct(value);
                return service.getStats();
            },
            formatValue: (val) => formatNumber(val)
        },
        'skill-coeff': {
            label: 'Skill Coefficient',
            getValue: () => parseFloat(document.getElementById('equiv-skill-coeff').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('skillCoeff', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'skill-mastery': {
            label: 'Skill Mastery',
            getValue: () => parseFloat(document.getElementById('equiv-skill-mastery').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('skillMastery', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'damage': {
            label: 'Damage',
            getValue: () => parseFloat(document.getElementById('equiv-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('damage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'final-damage': {
            label: 'Final Damage',
            getValue: () => parseFloat(document.getElementById('equiv-final-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addMultiplicativeStat('finalDamage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%',
            isMultiplicative: true
        },
        'boss-damage': {
            label: 'Boss Damage',
            getValue: () => parseFloat(document.getElementById('equiv-boss-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('bossDamage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'normal-damage': {
            label: 'Monster Damage',
            getValue: () => parseFloat(document.getElementById('equiv-normal-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('normalDamage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'stat-damage': {
            label: 'Stat Prop. Damage (%)',
            getValue: () => parseFloat(document.getElementById('equiv-stat-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('statDamage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'damage-amp': {
            label: 'Damage Amplification',
            getValue: () => parseFloat(document.getElementById('equiv-damage-amp').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('damageAmp', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}x`,
            suffix: 'x'
        },
        'min-damage': {
            label: 'Min Damage Multiplier',
            getValue: () => parseFloat(document.getElementById('equiv-min-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('minDamage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'max-damage': {
            label: 'Max Damage Multiplier',
            getValue: () => parseFloat(document.getElementById('equiv-max-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('maxDamage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'crit-rate': {
            label: 'Critical Rate',
            getValue: () => parseFloat(document.getElementById('equiv-crit-rate').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('critRate', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'crit-damage': {
            label: 'Critical Damage',
            getValue: () => parseFloat(document.getElementById('equiv-crit-damage').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addPercentageStat('critDamage', value);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%'
        },
        'attack-speed': {
            label: 'Attack Speed',
            getValue: () => parseFloat(document.getElementById('equiv-attack-speed').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                service.addDiminishingReturnStat('attackSpeed', value, 150);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%',
            isDiminishing: true
        },
        'def-pen': {
            label: 'Defense Penetration',
            getValue: () => parseFloat(document.getElementById('equiv-def-pen').value) || 0,
            applyToStats: (stats, value) => {
                const service = new StatCalculationService(stats);
                // defPen uses diminishing returns with factor 100
                service.addDiminishingReturnStat('defPen', value, 100);
                return service.getStats();
            },
            formatValue: (val) => `${val.toFixed(2)}%`,
            suffix: '%',
            isDiminishing: true
        }
    };

    // Get the source stat value and calculate target DPS gain (using boss as default)
    const sourceValue = statMapping[sourceStat].getValue();
    if (sourceValue === 0) {
        document.getElementById('equivalency-results').innerHTML = '';
        return;
    }

    // Use boss DPS as the baseline for display
    const baseDPS = baseService.baseBossDPS;

    // For main-stat-pct, we need to apply to a fresh service to avoid baseBossDPS
    // being calculated with already-increased statDamage
    let newDPS;
    if (sourceStat === 'main-stat-pct') {
        const modifiedService = new StatCalculationService(stats);
        modifiedService.addMainStatPct(sourceValue);
        newDPS = modifiedService.computeDPS('boss');
    } else {
        const modifiedStats = statMapping[sourceStat].applyToStats(stats, sourceValue);
        const modifiedService = new StatCalculationService(modifiedStats);
        newDPS = modifiedService.computeDPS('boss');
    }
    const targetDPSGain = ((newDPS - baseDPS) / baseDPS * 100);

    // Build HTML for results
    let html = '<div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.05)); border: 2px solid rgba(0, 122, 255, 0.2); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">';
    html += '<div style="text-align: center; margin-bottom: 25px;">';
    html += `<div style="font-size: 1.4em; font-weight: 700; color: var(--accent-primary); margin-bottom: 10px;">`;
    html += `${statMapping[sourceStat].formatValue(sourceValue)} ${statMapping[sourceStat].label}`;
    html += '</div>';
    html += `<div style="font-size: 1.1em; color: var(--accent-success); font-weight: 600;">`;
    html += `= ${targetDPSGain.toFixed(2)}% DPS Gain`;
    html += '</div>';
    html += '</div>';

    html += '<table class="table" style="margin: 0;">';
    html += '<thead><tr>';
    html += '<th style="text-align: left; font-size: 1em;">Equivalent Stat</th>';
    html += '<th style="text-align: right; font-size: 1em;">Required Amount</th>';
    html += '<th style="text-align: right; font-size: 1em;">DPS Gain</th>';
    html += '</tr></thead><tbody>';

    // Define stat maximums for realistic capping
    const statMaximums = {
        'crit-rate': 100,  // Crit rate caps at 100%
        'crit-damage': 500, // Realistic max for crit damage
        'attack-speed': 130, // Attack speed has diminishing returns, realistic max
        'boss-damage': null, // No realistic cap for boss damage when comparing monster dmg
        'normal-damage': null, // No realistic cap for monster damage when comparing boss dmg
        'damage': null, // No realistic cap
        'final-damage': null, // No realistic cap
        'stat-damage': null, // No realistic cap
        'damage-amp': null, // No realistic cap
        'min-damage': 100, // Min damage multiplier caps at 100%
        'max-damage': 100, // Max damage multiplier caps at 100%
        'skill-coeff': 1000, // Reasonable max
        'skill-mastery': 100, // Reasonable max
        'attack': 100000, // Very high but finite
        'main-stat': 500000, // Very high but finite,
        'main-stat-pct': 1000, // Very high but finite,
        'def-pen': 100
    };

    // Calculate equivalents for all other stats
    Object.entries(statMapping).forEach(([statId, statConfig]) => {
        if (statId === sourceStat) return; // Skip the source stat

        // Cross-stat incompatibility: boss damage doesn't work on normal monsters and vice versa
        if (sourceStat === 'boss-damage' && statId === 'normal-damage') {
            let icon = '';
            html += '<tr>';
            html += `<td style="font-weight: 600;">${statConfig.label}${icon}</td>`;
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--text-secondary); font-style: italic;">-</td>`;
            html += `<td style="text-align: right; color: var(--text-secondary); font-style: italic;">Ineffective (Boss DMG ≠ Monster target)</td>`;
            html += '</tr>';
            return;
        }

        if (sourceStat === 'normal-damage' && statId === 'boss-damage') {
            let icon = '';
            html += '<tr>';
            html += `<td style="font-weight: 600;">${statConfig.label}${icon}</td>`;
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--text-secondary); font-style: italic;">-</td>`;
            html += `<td style="text-align: right; color: var(--text-secondary); font-style: italic;">Ineffective (Monster DMG ≠ Boss target)</td>`;
            html += '</tr>';
            return;
        }

        // Determine target type for this stat row
        // boss-damage row calculates for boss targets
        // normal-damage row calculates for normal monster targets
        // all other rows use boss as target
        let rowTargetType = 'boss';
        let rowBaseDPS = baseService.baseBossDPS;

        if (statId === 'normal-damage') {
            rowTargetType = 'normal';
            rowBaseDPS = baseService.baseNormalDPS;
        } else if (statId === 'boss-damage') {
            rowTargetType = 'boss';
            rowBaseDPS = baseService.baseBossDPS;
        }

        // Get the max value for this stat (if capped)
        let maxValue = statMaximums[statId];
        if (maxValue === null) {
            // Use default high values for uncapped stats
            maxValue = statId === 'attack' ? 100000 : (statId === 'main-stat' ? 50000 : 1000);
        }

        // Special handling for crit rate - calculate room to cap
        let isCritRateCapped = false;
        if (statId === 'crit-rate') {
            const currentCritRate = stats.critRate;
            maxValue = Math.max(0, 100 - currentCritRate); // Can only increase up to 100%
            isCritRateCapped = currentCritRate >= 100;
        }

        // Binary search for equivalent value
        let low = 0;
        let high = maxValue;
        let iterations = 0;
        const maxIterations = 50;
        const tolerance = 0.01;

        while (iterations < maxIterations && high - low > tolerance) {
            const mid = (low + high) / 2;
            let testDPS;

            // For main-stat-pct, we need to apply fresh to original stats each iteration
            // because applyToStats returns stats with increased statDamage, and creating
            // a new service with those stats would calculate baseBossDPS incorrectly
            if (statId === 'main-stat-pct') {
                const testService = new StatCalculationService(stats);
                testService.addMainStatPct(mid);
                testDPS = testService.computeDPS(rowTargetType);
            } else {
                const testStats = statConfig.applyToStats(stats, mid);
                const testService = new StatCalculationService(testStats);
                testDPS = testService.computeDPS(rowTargetType);
            }

            const actualGain = ((testDPS - rowBaseDPS) / rowBaseDPS * 100);

            if (Math.abs(actualGain - targetDPSGain) < tolerance) {
                break;
            } else if (actualGain < targetDPSGain) {
                low = mid;
            } else {
                high = mid;
            }

            iterations++;
        }

        const equivalentValue = (low + high) / 2;

        // Check if we hit the cap and still can't reach target gain
        let verifyDPS;
        if (statId === 'main-stat-pct') {
            const verifyService = new StatCalculationService(stats);
            verifyService.addMainStatPct(equivalentValue);
            verifyDPS = verifyService.computeDPS(rowTargetType);
        } else {
            const verifyStats = statConfig.applyToStats(stats, equivalentValue);
            const verifyService = new StatCalculationService(verifyStats);
            verifyDPS = verifyService.computeDPS(rowTargetType);
        }
        const verifyGain = ((verifyDPS - rowBaseDPS) / rowBaseDPS * 100);

        // If we're at the cap and still below target gain, show as unable to match
        // Use relative tolerance for small caps
        const atCap = maxValue > 0 && (equivalentValue / maxValue) > 0.999; // Within 0.1% of max
        const unableToMatch = atCap && verifyGain < targetDPSGain * 0.99; // Within 1% tolerance

        let icon = '';

        if (statConfig.isMultiplicative) {
            icon = ' <span style="font-size: 0.9em; opacity: 0.7;" title="Multiplicative stat">ℹ️</span>';
        } else if (statConfig.isDiminishing) {
            //icon = ' <span style="font-size: 0.9em; opacity: 0.7;" title="Diminishing returns">ℹ️</span>';
        }

        html += '<tr>';
        html += `<td style="font-weight: 600;">${statConfig.label}${icon}</td>`;

        if (unableToMatch) {
            // Show "-" when stat can't match the target gain
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--text-secondary); font-style: italic;">-</td>`;
            html += `<td style="text-align: right; color: var(--text-secondary); font-style: italic;">Unable to match</td>`;
        } else {
            html += `<td style="text-align: right; font-size: 1.05em; color: var(--accent-primary); font-weight: 600;">${statConfig.formatValue(equivalentValue)}</td>`;
            html += `<td style="text-align: right;"><span class="gain-positive">+${verifyGain.toFixed(2)}%</span></td>`;
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    document.getElementById('equivalency-results').innerHTML = html;
}