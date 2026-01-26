import { gearLabStore } from "@ts/store/gear-lab-store.js";
import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
import { STAT } from "@ts/types";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { calculatePassiveGainsForItem } from "@ts/services/item-comparison.service.js";
const EQUIPMENT_SLOTS = {
  head: { id: "head", name: "Head", hasMainStat: false },
  cape: { id: "cape", name: "Cape", hasMainStat: false },
  chest: { id: "chest", name: "Chest", hasMainStat: false },
  shoulders: { id: "shoulders", name: "Shoulders", hasMainStat: false },
  legs: { id: "legs", name: "Legs", hasMainStat: false },
  belt: { id: "belt", name: "Belt", hasMainStat: false },
  gloves: { id: "gloves", name: "Gloves", hasMainStat: false },
  boots: { id: "boots", name: "Boots", hasMainStat: false },
  ring: { id: "ring", name: "Ring", hasMainStat: true },
  neck: { id: "neck", name: "Neck", hasMainStat: true },
  "eye-accessory": { id: "eye-accessory", name: "Eye Accessory", hasMainStat: true }
};
const MAX_STAT_LINES = 10;
function validateComparisonItem(item) {
  if (!item.guid || typeof item.guid !== "string") return false;
  if (!item.name || typeof item.name !== "string") return false;
  if (typeof item.attack !== "number" || item.attack < 0) return false;
  if (typeof item.mainStat !== "number" || item.mainStat < 0) return false;
  if (!Array.isArray(item.statLines)) return false;
  for (const statLine of item.statLines) {
    if (typeof statLine.type !== "string") return false;
    if (typeof statLine.value !== "number") return false;
  }
  return true;
}
function validateStatLine(statLine) {
  return typeof statLine.type === "string" && typeof statLine.value === "number";
}
function getComparisonItems(slotId) {
  return gearLabStore.getComparisonItems(slotId);
}
function getComparisonItem(slotId, guid) {
  return gearLabStore.getComparisonItem(slotId, guid);
}
function getEquippedItemData(slotId) {
  const equipmentData = loadoutStore.getEquipmentData();
  const slotData = equipmentData[slotId];
  if (!slotData) return null;
  const statLines = (slotData.statLines || []).map((sl) => ({
    type: sl.type,
    value: sl.value
  }));
  return {
    attack: slotData.attack,
    mainStat: slotData.mainStat || 0,
    statLines
  };
}
function addComparisonItem(slotId, item) {
  return gearLabStore.addComparisonItem(slotId, item);
}
function updateComparisonItem(slotId, guid, data) {
  return gearLabStore.updateComparisonItem(slotId, guid, data);
}
function removeComparisonItem(slotId, guid) {
  return gearLabStore.removeComparisonItem(slotId, guid);
}
function clearComparisonItems(slotId) {
  gearLabStore.clearComparisonItems(slotId);
}
function addStatLine(slotId, guid, statLine) {
  const item = getComparisonItem(slotId, guid);
  if (!item) return false;
  if (item.statLines.length >= MAX_STAT_LINES) {
    console.warn(`Maximum ${MAX_STAT_LINES} stat lines allowed per item`);
    return false;
  }
  return gearLabStore.addComparisonItemStatLine(slotId, guid, statLine);
}
function removeStatLine(slotId, guid, statLineIndex) {
  return gearLabStore.removeComparisonItemStatLine(slotId, guid, statLineIndex);
}
function calculateItemDamage(slotId, item) {
  const baseStats = loadoutStore.getBaseStats();
  const currentClass = loadoutStore.getSelectedClass();
  const characterLevel = loadoutStore.getCharacterLevel();
  const service = new StatCalculationService(baseStats);
  const equippedData = getEquippedItemData(slotId);
  if (equippedData) {
    service.subtract(STAT.ATTACK.id, equippedData.attack);
    service.subtract(STAT.PRIMARY_MAIN_STAT.id, equippedData.mainStat);
    equippedData.statLines.forEach((statLine) => {
      service.subtract(statLine.type, statLine.value);
    });
  }
  service.add(STAT.ATTACK.id, item.attack);
  service.add(STAT.PRIMARY_MAIN_STAT.id, item.mainStat);
  item.statLines.forEach((statLine) => {
    service.add(statLine.type, statLine.value);
  });
  let passiveGains = void 0;
  if (currentClass) {
    const passiveResult = calculatePassiveGainsForItem(item, {
      currentClass,
      characterLevel,
      baseStats
    });
    Object.entries(passiveResult.statChanges).forEach(([stat, value]) => {
      if (value !== 0) {
        service.add(stat, value);
      }
    });
    if (passiveResult.breakdown.length > 0 || passiveResult.complexPassives.length > 0) {
      passiveGains = {
        statChanges: passiveResult.statChanges,
        breakdown: passiveResult.breakdown,
        complexPassives: passiveResult.complexPassives,
        complexStatChanges: passiveResult.complexStatChanges
      };
    }
  }
  const bossResult = service.compute("boss");
  const normalResult = service.compute("normal");
  return {
    guid: item.guid,
    name: item.name,
    bossDPS: bossResult.dps,
    normalDPS: normalResult.dps,
    bossExpectedDamage: bossResult.expectedDamage,
    normalExpectedDamage: normalResult.expectedDamage,
    stats: service.getStats(),
    passiveGains
  };
}
function calculateAllItemsDamage(slotId) {
  const items = getComparisonItems(slotId);
  return items.map((item) => calculateItemDamage(slotId, item));
}
function calculateEquippedDamage(slotId) {
  const equippedData = getEquippedItemData(slotId);
  if (!equippedData) return null;
  const baseStats = loadoutStore.getBaseStats();
  const currentClass = loadoutStore.getSelectedClass();
  const characterLevel = loadoutStore.getCharacterLevel();
  const service = new StatCalculationService(baseStats);
  let passiveGains = void 0;
  if (currentClass) {
    const equippedAsComparisonItem = {
      guid: "equipped",
      name: "Equipped Item",
      attack: equippedData.attack,
      mainStat: equippedData.mainStat,
      statLines: equippedData.statLines.map((sl) => ({
        type: sl.type,
        value: sl.value
      }))
    };
    const passiveResult = calculatePassiveGainsForItem(equippedAsComparisonItem, {
      currentClass,
      characterLevel,
      baseStats
    });
    Object.entries(passiveResult.statChanges).forEach(([stat, value]) => {
      if (value !== 0) {
        service.add(stat, value);
      }
    });
    if (passiveResult.breakdown.length > 0 || passiveResult.complexPassives.length > 0) {
      passiveGains = {
        statChanges: passiveResult.statChanges,
        breakdown: passiveResult.breakdown,
        complexPassives: passiveResult.complexPassives,
        complexStatChanges: passiveResult.complexStatChanges
      };
    }
  }
  const bossResult = service.compute("boss");
  const normalResult = service.compute("normal");
  return {
    guid: "equipped",
    name: "Equipped Item",
    bossDPS: bossResult.dps,
    normalDPS: normalResult.dps,
    bossExpectedDamage: bossResult.expectedDamage,
    normalExpectedDamage: normalResult.expectedDamage,
    stats: service.getStats(),
    passiveGains
  };
}
function getSlotConfig(slotId) {
  return EQUIPMENT_SLOTS[slotId] || null;
}
function getAllSlotConfigs() {
  return Object.values(EQUIPMENT_SLOTS);
}
function generateDefaultItemName(slotId, itemCount) {
  return `Item ${itemCount + 1}`;
}
export {
  EQUIPMENT_SLOTS,
  MAX_STAT_LINES,
  addComparisonItem,
  addStatLine,
  calculateAllItemsDamage,
  calculateEquippedDamage,
  calculateItemDamage,
  clearComparisonItems,
  generateDefaultItemName,
  getAllSlotConfigs,
  getComparisonItem,
  getComparisonItems,
  getEquippedItemData,
  getSlotConfig,
  removeComparisonItem,
  removeStatLine,
  updateComparisonItem,
  validateComparisonItem,
  validateStatLine
};
//# sourceMappingURL=comparison.js.map
