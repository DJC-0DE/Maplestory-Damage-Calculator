import {
    calculate3rdJobSkillCoefficient,
    calculate4thJobSkillCoefficient
} from '@core/features/skills/skill-coefficient.js';
import { getSelectedJobTier } from '@core/state/state.js';

export function updateSkillCoefficient() {
    const levelInput = document.getElementById('character-level');
    const coefficientInput = document.getElementById('skill-coeff-base');

    if (!levelInput || !coefficientInput) return;

    const characterLevel = parseInt(levelInput.value) || 0;
    const jobTier = getSelectedJobTier();

    // Get the skill level for the selected job tier
    let skillLevel = 0;
    if (jobTier === '4th') {
        const skillLevelInput = document.getElementById('skill-level-4th-base');
        skillLevel = parseInt(skillLevelInput?.value) || 0;
    } else {
        const skillLevelInput = document.getElementById('skill-level-3rd-base');
        skillLevel = parseInt(skillLevelInput?.value) || 0;
    }

    let coefficient;
    if (jobTier === '4th') {
        coefficient = calculate4thJobSkillCoefficient(characterLevel, skillLevel);
    } else {
        coefficient = calculate3rdJobSkillCoefficient(characterLevel, skillLevel);
    }

    coefficientInput.value = coefficient.toFixed(2);
}

