/**
 * Common Selectors for Stat Predictions Tests
 * Centralized selector constants for maintainability
 */

// Page and Tab Selectors
export const BASE_URL = "http://localhost:8000";
export const PREDICTIONS_URL = `${BASE_URL}/#/predictions/stat-tables`;

// Main Predictions Tab Buttons
export const PREDICTIONS_TAB_BUTTONS = {
  statTables: '.predictions-tab-button[data-tab="stat-tables"]',
  equivalency: '.predictions-tab-button[data-tab="equivalency"]',
};

// Tab Content Containers
export const PREDICTIONS_TAB_CONTENT = {
  statTables: "#predictions-stat-tables",
  equivalency: "#predictions-equivalency",
};

// Stat Predictions (Stat Tables) Tab Selectors
export const STAT_TABLES_SELECTORS = {
  container: "#stat-weights-base",
  // Results display containers (will be dynamically generated)
  resultsContainer: ".stat-weights-results",
};

// Stat Equivalency Input Selectors
export const EQUIVALENCY_INPUTS = {
  attack: "#equiv-attack",
  mainStat: "#equiv-main-stat",
  skillCoeff: "#equiv-skill-coeff",
  skillMastery: "#equiv-skill-mastery",
  damage: "#equiv-damage",
  finalDamage: "#equiv-final-damage",
  bossDamage: "#equiv-boss-damage",
  normalDamage: "#equiv-normal-damage",
  mainStatPct: "#equiv-main-stat-pct",
  damageAmp: "#equiv-damage-amp",
  minDamage: "#equiv-min-damage",
  maxDamage: "#equiv-max-damage",
  critRate: "#equiv-crit-rate",
  critDamage: "#equiv-crit-damage",
  attackSpeed: "#equiv-attack-speed",
  defPen: "#equiv-def-pen",
};

// Equivalency Result Display Selectors
export const EQUIVALENCY_RESULTS = {
  attackGain: "#equiv-result-attack",
  mainStatGain: "#equiv-result-main-stat",
  skillCoeffGain: "#equiv-result-skill-coeff",
  damageGain: "#equiv-result-damage",
  finalDamageGain: "#equiv-result-final-damage",
  bossDamageGain: "#equiv-result-boss-damage",
  normalDamageGain: "#equiv-result-normal-damage",
  critRateGain: "#equiv-result-crit-rate",
  critDamageGain: "#equiv-result-crit-damage",
  attackSpeedGain: "#equiv-result-attack-speed",
  defPenGain: "#equiv-result-def-pen",
};

// Stat Predictions Graph Selectors
export const GRAPH_SELECTORS = {
  damageGainGraph: ".damage-gain-graph",
  statWeightChart: ".stat-weight-chart",
};
