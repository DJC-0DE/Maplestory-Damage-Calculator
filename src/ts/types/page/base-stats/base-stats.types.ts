/**
 * Base Stats Type Definitions
 * Shared types for the base-stats module
 */

import type { ClassName, ContentType } from '@ts/types';
import { MASTERY_TYPE } from '@ts/types/constants';

// Class Configuration Interface
export interface ClassConfig {
    id: ClassName;
    name: string;
    image: string;
    title?: string;
}

// Content Type Configuration Interface
export interface ContentTypeConfig {
    id: ContentType;
    name: string;
    icon: string;
    title: string;
}

// Mastery Level Bonus Interface
export interface MasteryLevelBonus {
    level: number;
    bonus: number;
}

// Mastery Data Interface
export interface MasteryData {
    [MASTERY_TYPE.ALL]: MasteryLevelBonus[];
    [MASTERY_TYPE.BOSS]: MasteryLevelBonus[];
}

// Mastery Bonus Entry Interface (for mastery-bonus.ts)
export interface MasteryBonusEntry {
    [MASTERY_TYPE.ALL]: Record<string, number>;
    [MASTERY_TYPE.BOSS]: Record<string, number>;
}

// Mastery Bonuses Interface (for mastery-bonus.ts)
export interface MasteryBonuses {
    [key: string]: MasteryBonusEntry;
}

// Stat Input Configuration Interface
export interface StatInputConfig {
    id: string;
    label: string;
    type: string;
    value?: number | string;
    step?: string;
    info?: string;
    rowId?: string;
    min?: number;
    onChange?: boolean;
    hidden?: boolean;
}
