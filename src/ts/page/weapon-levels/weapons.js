import { weaponBaseAttackEquipped, weaponUpgradeCosts, MAX_LEVELS_BY_STARS } from "@ts/types";
function getWeaponLevelMultiplier(level) {
  if (!level || level <= 1) return 1;
  if (level <= 100) return 1 + 0.3 * (level - 1) / 100;
  if (level <= 130) return 1 + (30.3 + 0.7 * (level - 101)) / 100;
  if (level <= 155) return 1 + (51.4 + 0.8 * (level - 131)) / 100;
  if (level <= 175) return 1 + (71.5 + 0.9 * (level - 156)) / 100;
  if (level <= 200) return 1 + (89.6 + 1 * (level - 176)) / 100;
  return 1 + 113.6 / 100;
}
function getInventoryDivisor(rarity) {
  return ["legendary", "mystic", "ancient"].includes(rarity) ? 4 : 3.5;
}
function calculateWeaponAttacks(rarity, tier, level) {
  const baseEquipped = weaponBaseAttackEquipped[rarity]?.[tier];
  if (baseEquipped === null || baseEquipped === void 0 || !level || level <= 0) {
    return { inventoryAttack: 0, equippedAttack: 0 };
  }
  const levelMultiplier = getWeaponLevelMultiplier(level);
  const equippedBeforeRound = baseEquipped * levelMultiplier;
  const equippedAttack = Math.floor(equippedBeforeRound * 10) / 10;
  const divisor = getInventoryDivisor(rarity);
  const inventoryAttack = equippedAttack / divisor;
  return { inventoryAttack, equippedAttack };
}
function getMaxLevelForStars(stars) {
  return MAX_LEVELS_BY_STARS[stars] ?? 100;
}
function getUpgradeCost(rarity, tier, level) {
  const tierNum = parseInt(tier.replace("t", ""));
  const cost = weaponUpgradeCosts[rarity]?.[tierNum]?.[level + 1];
  return cost ?? 0;
}
function calculateUpgradeGain(rarity, tier, currentLevel, stars, resources, isEquipped = false) {
  if (currentLevel <= 0) {
    return {
      levelsGained: 0,
      newLevel: currentLevel,
      attackGain: 0,
      equippedAttackGain: 0,
      resourcesUsed: 0,
      efficiency: 0,
      singleLevelCost: 0,
      isUnaffordable: false
    };
  }
  const maxLevel = getMaxLevelForStars(stars);
  const nextLevelCost = getUpgradeCost(rarity, tier, currentLevel);
  if (nextLevelCost > resources && currentLevel < maxLevel) {
    const currentAttack2 = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
    const nextLevelAttack = calculateWeaponAttacks(rarity, tier, currentLevel + 1).inventoryAttack;
    const attackGain2 = nextLevelAttack - currentAttack2;
    const currentEquippedAttack2 = calculateWeaponAttacks(rarity, tier, currentLevel).equippedAttack;
    const nextEquippedAttack = calculateWeaponAttacks(rarity, tier, currentLevel + 1).equippedAttack;
    const equippedAttackGain2 = isEquipped ? nextEquippedAttack - currentEquippedAttack2 : 0;
    return {
      levelsGained: 0,
      newLevel: currentLevel,
      attackGain: attackGain2,
      equippedAttackGain: equippedAttackGain2,
      resourcesUsed: 0,
      efficiency: 0,
      singleLevelCost: nextLevelCost,
      isUnaffordable: true
    };
  }
  let level = currentLevel;
  let remainingResources = resources;
  let totalCost = 0;
  let iterations = 0;
  const maxIterations = 300;
  while (level < maxLevel && remainingResources > 0 && iterations < maxIterations) {
    const cost = getUpgradeCost(rarity, tier, level);
    if (cost <= 0 || cost > remainingResources) break;
    remainingResources -= cost;
    totalCost += cost;
    level++;
    iterations++;
  }
  const currentAttack = calculateWeaponAttacks(rarity, tier, currentLevel).inventoryAttack;
  const newAttack = calculateWeaponAttacks(rarity, tier, level).inventoryAttack;
  const attackGain = newAttack - currentAttack;
  const currentEquippedAttack = calculateWeaponAttacks(rarity, tier, currentLevel).equippedAttack;
  const newEquippedAttack = calculateWeaponAttacks(rarity, tier, level).equippedAttack;
  const equippedAttackGain = isEquipped ? newEquippedAttack - currentEquippedAttack : 0;
  return {
    levelsGained: level - currentLevel,
    newLevel: level,
    attackGain,
    equippedAttackGain,
    resourcesUsed: totalCost,
    efficiency: totalCost > 0 ? attackGain / (totalCost / 1e3) : 0,
    singleLevelCost: 0,
    isUnaffordable: false
  };
}
function calculateUpgradePriorityChain(weaponStates, numUpgrades = 100) {
  const upgradeSequence = [];
  const weaponLevels = {};
  const weaponMaxLevels = {};
  const weaponEquippedStates = {};
  weaponStates.forEach((ws) => {
    const key = `${ws.rarity}-${ws.tier}`;
    weaponLevels[key] = ws.level;
    weaponMaxLevels[key] = ws.maxLevel;
    weaponEquippedStates[key] = ws.isEquipped ?? false;
  });
  for (let i = 0; i < numUpgrades; i++) {
    let bestWeapon = null;
    let bestEfficiency = 0;
    weaponStates.forEach((ws) => {
      const key = `${ws.rarity}-${ws.tier}`;
      const currentLevel = weaponLevels[key];
      const maxLevel = weaponMaxLevels[key];
      const isEquipped = weaponEquippedStates[key];
      if (currentLevel >= maxLevel) return;
      const upgradeGain = calculateUpgradeGain(
        ws.rarity,
        ws.tier,
        currentLevel,
        ws.stars,
        1e3,
        isEquipped
      );
      let efficiency;
      if (upgradeGain.isUnaffordable) {
        const inventoryEfficiency = upgradeGain.attackGain / upgradeGain.singleLevelCost * 1e3;
        const equippedEfficiency = upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost * 1e3;
        efficiency = inventoryEfficiency + equippedEfficiency;
      } else {
        efficiency = upgradeGain.attackGain + upgradeGain.equippedAttackGain;
      }
      if (efficiency > bestEfficiency) {
        bestEfficiency = efficiency;
        bestWeapon = {
          rarity: ws.rarity,
          tier: ws.tier,
          key,
          cost: getUpgradeCost(ws.rarity, ws.tier, currentLevel)
        };
      }
    });
    if (!bestWeapon) break;
    upgradeSequence.push(bestWeapon);
    weaponLevels[bestWeapon.key]++;
  }
  const groupedUpgrades = groupUpgradesByWeapon(upgradeSequence);
  return {
    upgradeSequence,
    groupedUpgrades,
    finalWeaponLevels: weaponLevels
  };
}
function groupUpgradesByWeapon(upgradeSequence) {
  const groupedUpgrades = [];
  let currentGroup = null;
  upgradeSequence.forEach((upgrade) => {
    if (!currentGroup || currentGroup.rarity !== upgrade.rarity || currentGroup.tier !== upgrade.tier) {
      if (currentGroup) {
        groupedUpgrades.push(currentGroup);
      }
      currentGroup = {
        rarity: upgrade.rarity,
        tier: upgrade.tier,
        count: 1
      };
    } else {
      currentGroup.count++;
    }
  });
  if (currentGroup) {
    groupedUpgrades.push(currentGroup);
  }
  return groupedUpgrades;
}
function calculateCurrencyUpgrades(weaponStates, currency) {
  if (!weaponStates.length || currency <= 0) {
    return null;
  }
  const upgradeSequence = [];
  const weaponLevels = {};
  const weaponMaxLevels = {};
  const weaponEquippedStates = {};
  let remainingCurrency = currency;
  weaponStates.forEach((ws) => {
    const key = `${ws.rarity}-${ws.tier}`;
    weaponLevels[key] = ws.level;
    weaponMaxLevels[key] = ws.maxLevel;
    weaponEquippedStates[key] = ws.isEquipped ?? false;
  });
  while (remainingCurrency > 0) {
    let bestWeapon = null;
    let bestEfficiency = 0;
    weaponStates.forEach((ws) => {
      const key = `${ws.rarity}-${ws.tier}`;
      const currentLevel = weaponLevels[key];
      const maxLevel = weaponMaxLevels[key];
      const isEquipped = weaponEquippedStates[key];
      if (currentLevel >= maxLevel) return;
      const upgradeGain = calculateUpgradeGain(
        ws.rarity,
        ws.tier,
        currentLevel,
        ws.stars,
        1e3,
        isEquipped
      );
      let efficiency;
      if (upgradeGain.isUnaffordable) {
        const inventoryEfficiency = upgradeGain.attackGain / upgradeGain.singleLevelCost * 1e3;
        const equippedEfficiency = upgradeGain.equippedAttackGain / upgradeGain.singleLevelCost * 1e3;
        efficiency = inventoryEfficiency + equippedEfficiency;
      } else {
        efficiency = upgradeGain.attackGain + upgradeGain.equippedAttackGain;
      }
      if (efficiency > bestEfficiency) {
        bestEfficiency = efficiency;
        bestWeapon = {
          rarity: ws.rarity,
          tier: ws.tier,
          key,
          cost: getUpgradeCost(ws.rarity, ws.tier, currentLevel)
        };
      }
    });
    if (!bestWeapon) break;
    if (bestWeapon.cost > remainingCurrency) break;
    upgradeSequence.push(bestWeapon);
    weaponLevels[bestWeapon.key]++;
    remainingCurrency -= bestWeapon.cost;
  }
  if (upgradeSequence.length === 0) {
    return null;
  }
  let totalAttackGain = 0;
  upgradeSequence.forEach((upgrade) => {
    const prevLevel = weaponLevels[upgrade.key] - 1;
    const currentAttack = calculateWeaponAttacks(upgrade.rarity, upgrade.tier, prevLevel).inventoryAttack;
    const nextAttack = calculateWeaponAttacks(upgrade.rarity, upgrade.tier, weaponLevels[upgrade.key]).inventoryAttack;
    totalAttackGain += nextAttack - currentAttack;
  });
  return {
    totalAttackGain,
    dpsGainPct: 0,
    // To be calculated by UI layer
    upgradeSequence,
    weaponLevels,
    remainingCurrency
  };
}
function calculateTotalWeaponAttackBonus(weaponLevels, equippedWeaponKey) {
  let totalInventory = 0;
  let equippedAttack = 0;
  Object.entries(weaponLevels).forEach(([key, level]) => {
    if (level === 0) return;
    const [rarity, tier] = key.split("-");
    const { inventoryAttack, equippedAttack: atk } = calculateWeaponAttacks(rarity, tier, level);
    totalInventory += inventoryAttack;
    if (key === equippedWeaponKey) {
      equippedAttack = atk;
    }
  });
  return {
    inventoryAttack: totalInventory,
    equippedAttack,
    totalAttack: totalInventory + equippedAttack
  };
}
export {
  calculateCurrencyUpgrades,
  calculateTotalWeaponAttackBonus,
  calculateUpgradeGain,
  calculateUpgradePriorityChain,
  calculateWeaponAttacks,
  getInventoryDivisor,
  getMaxLevelForStars,
  getUpgradeCost,
  getWeaponLevelMultiplier,
  groupUpgradesByWeapon
};
//# sourceMappingURL=weapons.js.map
