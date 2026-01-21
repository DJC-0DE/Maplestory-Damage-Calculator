import {
    calculate3rdJobSkillCoefficient,
    calculate4thJobSkillCoefficient
} from '@core/features/skills/skill-coefficient';
import { getSelectedJobTier, getCharacterLevel } from '@core/state/state';
import { JOB_TIER } from '@ts/types';
import type { JobTier } from '@ts/types';

export function updateSkillCoefficient(): void {
    const coefficientInput = document.getElementById('skill-coeff-base') as HTMLInputElement;

    if (!coefficientInput) return;

    const characterLevel = getCharacterLevel();
    const jobTier = getSelectedJobTier();

    // Get the skill level for the selected job tier
    let skillLevel = 0;
    if (jobTier === JOB_TIER.FOURTH) {
        const skillLevelInput = document.getElementById('skill-level-4th-base') as HTMLInputElement;
        skillLevel = parseInt(skillLevelInput?.value ?? '0') || 0;
    } else {
        const skillLevelInput = document.getElementById('skill-level-3rd-base') as HTMLInputElement;
        skillLevel = parseInt(skillLevelInput?.value ?? '0') || 0;
    }

    let coefficient: number;
    if (jobTier === JOB_TIER.FOURTH) {
        coefficient = calculate4thJobSkillCoefficient(characterLevel, skillLevel);
    } else {
        coefficient = calculate3rdJobSkillCoefficient(characterLevel, skillLevel);
    }

    coefficientInput.value = coefficient.toFixed(2);
}
