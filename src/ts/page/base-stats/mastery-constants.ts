/**
 * Mastery Bonus Constants
 * Single source of truth for mastery bonus data
 */

import type { MasteryData, MasteryBonuses } from '@ts/types/page/base-stats/base-stats.types';

// ============================================================================
// MASTERY CONFIGURATION (Array format for UI generation)
// ============================================================================

export const MASTERY_3RD: MasteryData = {
    all: [
        { level: 64, bonus: 10 },
        { level: 68, bonus: 11 },
        { level: 76, bonus: 12 },
        { level: 80, bonus: 13 },
        { level: 88, bonus: 14 },
        { level: 92, bonus: 15 }
    ],
    boss: [
        { level: 72, bonus: 10 },
        { level: 84, bonus: 10 }
    ]
};

export const MASTERY_4TH: MasteryData = {
    all: [
        { level: 102, bonus: 10 },
        { level: 106, bonus: 11 },
        { level: 116, bonus: 12 },
        { level: 120, bonus: 13 },
        { level: 128, bonus: 14 },
        { level: 132, bonus: 15 }
    ],
    boss: [
        { level: 111, bonus: 10 },
        { level: 124, bonus: 10 }
    ]
};

// ============================================================================
// MASTERY CONFIGURATION (Object format for calculations)
// ============================================================================

export const MASTERY_BONUSES: MasteryBonuses = {
    '3rd': {
        all: {
            '64': 10,
            '68': 11,
            '76': 12,
            '80': 13,
            '88': 14,
            '92': 15
        },
        boss: {
            '72': 10,
            '84': 10
        }
    },
    '4th': {
        all: {
            '102': 10,
            '106': 11,
            '116': 12,
            '120': 13,
            '128': 14,
            '132': 15
        },
        boss: {
            '111': 10,
            '124': 10
        }
    }
};
