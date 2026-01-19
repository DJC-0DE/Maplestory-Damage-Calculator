import { saveToLocalStorage, updateAnalysisTabs } from "@core/state/storage.js";
import { getSelectedJobTier } from "@core/state/state.js";
export function updateMasteryBonuses(skipSave = false) {
  // Get current job tier
  const currentTier = getSelectedJobTier();

  // Define mastery bonuses for each tier and level
  const masteryBonuses = {
    "3rd": {
      all: {
        64: 10,
        68: 11,
        76: 12,
        80: 13,
        88: 14,
        92: 15,
      },
      boss: {
        72: 10,
        84: 10,
      },
    },
    "4th": {
      all: {
        102: 10,
        106: 11,
        116: 12,
        120: 13,
        128: 14,
        132: 15,
      },
      boss: {
        111: 10,
        124: 10,
      },
    },
  };

  // Calculate totals for the current tier
  let allTotal = 0;
  let bossTotal = 0;

  const tierData = masteryBonuses[currentTier];

  // Sum up "All Monsters" bonuses
  for (const [level, bonus] of Object.entries(tierData.all)) {
    const checkbox = document.getElementById(
      `mastery-${currentTier}-all-${level}`,
    );
    if (checkbox && checkbox.checked) {
      allTotal += bonus;
    }
  }

  // Sum up "Boss Only" bonuses
  for (const [level, bonus] of Object.entries(tierData.boss)) {
    const checkbox = document.getElementById(
      `mastery-${currentTier}-boss-${level}`,
    );
    if (checkbox && checkbox.checked) {
      bossTotal += bonus;
    }
  }

  // Update display totals for the current tier
  const allTotalDisplay = document.getElementById(
    `mastery-${currentTier}-all-total`,
  );
  const bossTotalDisplay = document.getElementById(
    `mastery-${currentTier}-boss-total`,
  );

  if (allTotalDisplay) {
    allTotalDisplay.textContent = `${allTotal}%`;
  }
  if (bossTotalDisplay) {
    bossTotalDisplay.textContent = `${bossTotal}%`;
  }

  // Update hidden inputs that are used by the calculation engine
  const skillMasteryInput = document.getElementById("skill-mastery-base");
  const skillMasteryBossInput = document.getElementById(
    "skill-mastery-boss-base",
  );

  if (skillMasteryInput) {
    skillMasteryInput.value = allTotal;
  }
  if (skillMasteryBossInput) {
    skillMasteryBossInput.value = bossTotal;
  }

  // Save to localStorage and recalculate (unless we're just loading initial values)
  if (!skipSave) {
    saveToLocalStorage();
    updateAnalysisTabs();
  }
}
