// Equipment Summary Widget - Aggregate stats display
import { getAllEquipmentData } from "./equipment-tab.js";

/**
 * Update the equipment summary with aggregate stats
 */
export function updateEquipmentSummary() {
  const equipmentData = getAllEquipmentData();
  const totals = calculateAggregateStats(equipmentData);

  // Update summary display
  updateSummaryDisplay(totals);
}

/**
 * Calculate aggregate stats across all equipment
 */
function calculateAggregateStats(equipmentData) {
  const totals = {
    attack: 0,
    mainStat: 0,
    defense: 0,
    critRate: 0,
    critDamage: 0,
    bossDamage: 0,
    normalDamage: 0,
    damage: 0,
    finalDamage: 0,
    minDamage: 0,
    maxDamage: 0,
    skillLevel1st: 0,
    skillLevel2nd: 0,
    skillLevel3rd: 0,
    skillLevel4th: 0,
    skillLevelAll: 0,
  };

  Object.values(equipmentData).forEach((slotData) => {
    if (!slotData) return;

    // Add attack
    if (slotData.attack) {
      totals.attack += slotData.attack;
    }

    // Add main stat
    if (slotData.mainStat) {
      totals.mainStat += slotData.mainStat;
    }

    // Add stat lines
    if (slotData.statLines && Array.isArray(slotData.statLines)) {
      slotData.statLines.forEach((statLine) => {
        const statKey = getStatKey(statLine.type);
        if (statKey && totals.hasOwnProperty(statKey)) {
          totals[statKey] += statLine.value;
        }
      });
    }
  });

  return totals;
}

/**
 * Convert stat type string to property key
 */
function getStatKey(statType) {
  const statMap = {
    attack: "attack",
    "main-stat": "mainStat",
    defense: "defense",
    "crit-rate": "critRate",
    "crit-damage": "critDamage",
    "skill-level-1st": "skillLevel1st",
    "skill-level-2nd": "skillLevel2nd",
    "skill-level-3rd": "skillLevel3rd",
    "skill-level-4th": "skillLevel4th",
    "skill-level-all": "skillLevelAll",
    "normal-damage": "normalDamage",
    "boss-damage": "bossDamage",
    damage: "damage",
    "final-damage": "finalDamage",
    "min-damage": "minDamage",
    "max-damage": "maxDamage",
  };
  return statMap[statType];
}

/**
 * Update the summary display with premium styling
 */
function updateSummaryDisplay(totals) {
  const summaryElement = document.getElementById("equipment-summary-content");
  if (!summaryElement) return;

  const parts = [];

  // Define stat display configuration with color coding
  const statConfigs = [
    { key: "attack", label: "Attack", isPercent: false },
    { key: "mainStat", label: "Main Stat", isPercent: false },
    { key: "defense", label: "Defense", isPercent: false },
    { key: "critRate", label: "Crit Rate", isPercent: true },
    { key: "critDamage", label: "Crit Dmg", isPercent: true },
    { key: "bossDamage", label: "Boss Dmg", isPercent: true },
    { key: "damage", label: "Damage", isPercent: true },
    { key: "normalDamage", label: "Normal Dmg", isPercent: true },
    { key: "finalDamage", label: "Final Dmg", isPercent: true },
    { key: "minDamage", label: "Min Dmg", isPercent: true },
    { key: "maxDamage", label: "Max Dmg", isPercent: true },
    { key: "skillLevel1st", label: "1st Job", isPercent: false },
    { key: "skillLevel2nd", label: "2nd Job", isPercent: false },
    { key: "skillLevel3rd", label: "3rd Job", isPercent: false },
    { key: "skillLevel4th", label: "4th Job", isPercent: false },
    { key: "skillLevelAll", label: "All Jobs", isPercent: false },
  ];

  statConfigs.forEach((config) => {
    const value = totals[config.key];
    if (value > 0) {
      const formattedValue = config.isPercent ? `${value}%` : value;
      parts.push(`
                <span class="equipment-summary-stat">
                    <span class="equipment-summary-stat-value">+${formattedValue}</span>
                    ${config.label}
                </span>
            `);
    }
  });

  if (parts.length === 0) {
    summaryElement.innerHTML =
      '<span class="equipment-summary-empty">No equipment configured</span>';
  } else {
    summaryElement.innerHTML = parts.join(
      '<span class="equipment-summary-divider">•</span>',
    );
  }

  // Store totals for potential future use
  window.equipmentAggregateStats = totals;
}
