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
  if (currentClass && characterLevel != null) {
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
function calculateEquipStatChanges(slotId, newItem) {
  const baseStats = loadoutStore.getBaseStats();
  const currentClass = loadoutStore.getSelectedClass();
  const characterLevel = loadoutStore.getCharacterLevel();
  const equippedData = getEquippedItemData(slotId);
  const oldDirectStats = {};
  if (equippedData) {
    oldDirectStats[STAT.ATTACK.id] = equippedData.attack;
    oldDirectStats[STAT.PRIMARY_MAIN_STAT.id] = equippedData.mainStat;
    equippedData.statLines.forEach((statLine) => {
      oldDirectStats[statLine.type] = (oldDirectStats[statLine.type] || 0) + statLine.value;
    });
  }
  const newDirectStats = {};
  newDirectStats[STAT.ATTACK.id] = newItem.attack;
  newDirectStats[STAT.PRIMARY_MAIN_STAT.id] = newItem.mainStat;
  newItem.statLines.forEach((statLine) => {
    newDirectStats[statLine.type] = (newDirectStats[statLine.type] || 0) + statLine.value;
  });
  const oldPassiveGains = equippedData && currentClass ? calculatePassiveGainsForItem(
    {
      guid: "old",
      name: "Old Item",
      attack: equippedData.attack,
      mainStat: equippedData.mainStat,
      statLines: equippedData.statLines.map((sl) => ({
        type: sl.type,
        value: sl.value
      }))
    },
    { currentClass, characterLevel, baseStats }
  ) : { statChanges: {}, breakdown: [], complexPassives: [], complexStatChanges: {} };
  const newPassiveGains = currentClass ? calculatePassiveGainsForItem(
    newItem,
    { currentClass, characterLevel, baseStats }
  ) : { statChanges: {}, breakdown: [], complexPassives: [], complexStatChanges: {} };
  const diff = {};
  Object.keys({ ...oldDirectStats, ...newDirectStats }).forEach((stat) => {
    const oldValue = oldDirectStats[stat] || 0;
    const newValue = newDirectStats[stat] || 0;
    diff[stat] = newValue - oldValue;
  });
  Object.keys({ ...oldPassiveGains.statChanges, ...newPassiveGains.statChanges }).forEach((stat) => {
    const oldValue = oldPassiveGains.statChanges[stat] || 0;
    const newValue = newPassiveGains.statChanges[stat] || 0;
    diff[stat] = (diff[stat] || 0) + (newValue - oldValue);
  });
  const hasAnyChanges = Object.values(diff).some((v) => v !== 0) || oldPassiveGains.breakdown.length > 0 || newPassiveGains.breakdown.length > 0;
  return {
    directStats: {
      old: oldDirectStats,
      new: newDirectStats,
      diff
    },
    passiveGains: {
      old: oldPassiveGains,
      new: newPassiveGains
    },
    hasAnyChanges
  };
}
function formatStatForDisplay(statId) {
  const statEntry = Object.values(STAT).find((stat) => stat.id === statId);
  return statEntry?.label || statId;
}
function isStatPercentage(statId) {
  return !["hitChance", "maxHp", "attack", "primaryMainStat"].includes(statId);
}
function createEquipStatComparisonTable(statChanges) {
  const { directStats: { old: oldDirect, new: newDirect, diff: directDiff }, passiveGains } = statChanges;
  const passiveDiff = {};
  const allPassiveStats = /* @__PURE__ */ new Set([
    ...Object.keys(passiveGains.old.statChanges),
    ...Object.keys(passiveGains.new.statChanges)
  ]);
  allPassiveStats.forEach((stat) => {
    const oldValue = passiveGains.old.statChanges[stat] || 0;
    const newValue = passiveGains.new.statChanges[stat] || 0;
    passiveDiff[stat] = newValue - oldValue;
  });
  const affectedDirectStats = Object.entries(directDiff).filter(([stat, diff]) => diff !== 0);
  const affectedPassiveStats = Object.entries(passiveDiff).filter(([stat, diff]) => diff !== 0);
  const hasDirectChanges = affectedDirectStats.length > 0;
  const hasPassiveChanges = affectedPassiveStats.length > 0;
  const createDirectStatsTable = () => {
    if (!hasDirectChanges) {
      return '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No direct stat changes</div>';
    }
    let rows = "";
    affectedDirectStats.forEach(([stat, diffValue]) => {
      const oldValue = oldDirect[stat] || 0;
      const newValue = newDirect[stat] || 0;
      const isPercent = isStatPercentage(stat);
      const formatValue = (val) => {
        const displayValue = isPercent ? val.toFixed(1).replace(/\.0$/, "") : Math.floor(val).toString();
        return `${displayValue}${isPercent ? "%" : ""}`;
      };
      const oldClass = oldValue > 0 ? "stat-value-negative" : "stat-value-neutral";
      const newClass = newValue > 0 ? "stat-value-positive" : "stat-value-neutral";
      const diffClass = diffValue > 0 ? "stat-value-positive" : diffValue < 0 ? "stat-value-negative" : "stat-value-neutral";
      rows += `
                <tr>
                    <td>${formatStatForDisplay(stat)}</td>
                    <td class="${oldClass}">${formatValue(oldValue)}</td>
                    <td class="${newClass}">${formatValue(newValue)}</td>
                    <td class="${diffClass}">${diffValue > 0 ? "+" : ""}${formatValue(diffValue)}</td>
                </tr>
            `;
    });
    return `
            <table class="stat-table">
                <thead>
                    <tr>
                        <th>Stat</th>
                        <th>Losing</th>
                        <th>Gaining</th>
                        <th>Net Change</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
  };
  const createPassiveStatsTable = () => {
    if (!hasPassiveChanges) {
      return '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No passive stat changes</div>';
    }
    let rows = "";
    affectedPassiveStats.forEach(([stat, diffValue]) => {
      const oldValue = passiveGains.old.statChanges[stat] || 0;
      const newValue = passiveGains.new.statChanges[stat] || 0;
      const isPercent = isStatPercentage(stat);
      const formatValue = (val) => {
        const displayValue = isPercent ? val.toFixed(1).replace(/\.0$/, "") : Math.floor(val).toString();
        return `${displayValue}${isPercent ? "%" : ""}`;
      };
      const oldClass = oldValue > 0 ? "stat-value-negative" : "stat-value-neutral";
      const newClass = newValue > 0 ? "stat-value-positive" : "stat-value-neutral";
      const diffClass = diffValue > 0 ? "stat-value-positive" : diffValue < 0 ? "stat-value-negative" : "stat-value-neutral";
      rows += `
                <tr>
                    <td>${formatStatForDisplay(stat)}</td>
                    <td class="${oldClass}">${formatValue(oldValue)}</td>
                    <td class="${newClass}">${formatValue(newValue)}</td>
                    <td class="${diffClass}">${diffValue > 0 ? "+" : ""}${formatValue(diffValue)}</td>
                </tr>
            `;
    });
    return `
            <table class="stat-table">
                <thead>
                    <tr>
                        <th>Passive Stat</th>
                        <th>Losing</th>
                        <th>Gaining</th>
                        <th>Net Change</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
  };
  return `
        <div class="modal-tabs">
            <button class="modal-tab active" data-tab="direct" onclick="window.switchEquipModalTab('direct')">
                Direct Stats (${affectedDirectStats.length})
            </button>
            <button class="modal-tab" data-tab="passive" onclick="window.switchEquipModalTab('passive')">
                Passive Stats (${affectedPassiveStats.length})
            </button>
        </div>

        <div class="modal-tab-content active" id="modal-tab-direct">
            <div class="stat-comparison-table">
                ${createDirectStatsTable()}
            </div>
        </div>

        <div class="modal-tab-content" id="modal-tab-passive">
            <div class="stat-comparison-table">
                ${createPassiveStatsTable()}
            </div>
        </div>
    `;
}
function showEquipConfirmModal(slotId, newItem) {
  return new Promise((resolve) => {
    const existingModal = document.getElementById("equip-comparison-modal");
    if (existingModal) {
      existingModal.remove();
    }
    const statChanges = calculateEquipStatChanges(slotId, newItem);
    const overlay = document.createElement("div");
    overlay.id = "equip-comparison-modal";
    overlay.className = "modal-overlay";
    const modalBox = document.createElement("div");
    modalBox.className = "modal-box";
    const slotConfig = getSlotConfig(slotId);
    const slotName = slotConfig?.name || slotId;
    const title = document.createElement("h2");
    title.className = "modal-title";
    title.textContent = `Equip ${newItem.name}`;
    const message = document.createElement("p");
    message.className = "modal-message";
    message.innerHTML = `
            Are you sure you want to equip <strong>${newItem.name}</strong> to the <strong>${slotName}</strong> slot?<br>
            <br>
            This will:
            <ul style="text-align: left; margin: 12px 0; padding-left: 24px;">
                <li>Subtract the stats of your currently equipped item from base stats</li>
                <li>Add the stats of ${newItem.name} to base stats</li>
                <li>Convert your old equipped item into a comparison item</li>
            </ul>
        `;
    const tableContainer = document.createElement("div");
    tableContainer.className = "stat-comparison-table";
    tableContainer.innerHTML = createEquipStatComparisonTable(statChanges);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "modal-buttons";
    const yesBtn = document.createElement("button");
    yesBtn.className = "modal-btn btn-yes";
    yesBtn.textContent = "Equip - Apply Stats";
    yesBtn.onclick = () => {
      overlay.remove();
      wrappedResolve("yes");
    };
    const noBtn = document.createElement("button");
    noBtn.className = "modal-btn btn-no";
    noBtn.textContent = "Equip - Keep Stats";
    noBtn.onclick = () => {
      overlay.remove();
      wrappedResolve("no");
    };
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "modal-btn btn-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => {
      overlay.remove();
      wrappedResolve("cancel");
    };
    buttonContainer.appendChild(yesBtn);
    buttonContainer.appendChild(noBtn);
    buttonContainer.appendChild(cancelBtn);
    modalBox.appendChild(title);
    modalBox.appendChild(message);
    modalBox.appendChild(tableContainer);
    modalBox.appendChild(buttonContainer);
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    window.switchEquipModalTab = (tabName) => {
      document.querySelectorAll(".modal-tab").forEach((tab) => {
        if (tab instanceof HTMLElement && tab.dataset.tab === tabName) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });
      document.querySelectorAll(".modal-tab-content").forEach((content) => {
        if (content instanceof HTMLElement && content.id === `modal-tab-${tabName}`) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    };
    const originalResolve = resolve;
    const wrappedResolve = (value) => {
      delete window.switchEquipModalTab;
      originalResolve(value);
    };
    const escHandler = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
        wrappedResolve("cancel");
      }
    };
    document.addEventListener("keydown", escHandler);
    yesBtn.focus();
  });
}
export {
  EQUIPMENT_SLOTS,
  MAX_STAT_LINES,
  addComparisonItem,
  addStatLine,
  calculateAllItemsDamage,
  calculateEquipStatChanges,
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
  showEquipConfirmModal,
  updateComparisonItem,
  validateComparisonItem,
  validateStatLine
};
//# sourceMappingURL=comparison.js.map
