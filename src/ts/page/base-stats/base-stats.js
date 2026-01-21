import {
  calculate3rdJobSkillCoefficient,
  calculate4thJobSkillCoefficient
} from "@core/features/skills/skill-coefficient.js";
import { getSelectedJobTier, getCharacterLevel } from "@core/state/state.js";
import { JOB_TIER } from "@ts/types";
function updateSkillCoefficient() {
  const coefficientInput = document.getElementById("skill-coeff-base");
  if (!coefficientInput) return;
  const characterLevel = getCharacterLevel();
  const jobTier = getSelectedJobTier();
  let skillLevel = 0;
  if (jobTier === JOB_TIER.FOURTH) {
    const skillLevelInput = document.getElementById("skill-level-4th-base");
    skillLevel = parseInt(skillLevelInput?.value ?? "0") || 0;
  } else {
    const skillLevelInput = document.getElementById("skill-level-3rd-base");
    skillLevel = parseInt(skillLevelInput?.value ?? "0") || 0;
  }
  let coefficient;
  if (jobTier === JOB_TIER.FOURTH) {
    coefficient = calculate4thJobSkillCoefficient(characterLevel, skillLevel);
  } else {
    coefficient = calculate3rdJobSkillCoefficient(characterLevel, skillLevel);
  }
  coefficientInput.value = coefficient.toFixed(2);
}
export {
  updateSkillCoefficient
};
//# sourceMappingURL=base-stats.js.map
