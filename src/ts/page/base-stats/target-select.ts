/**
 * Pure logic layer for Target/Stage selection
 * Data retrieval and filtering functions without DOM dependencies
 */

import { stageDefenses } from '@core/state/state';
import type { ContentType } from '@ts/types';

export type { ContentType };

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StageEntry {
    stage: string;
    defense: number;
    accuracy?: number;
    chapter?: string;
    boss?: string;
}

export interface SavedContentTypeData {
    contentType: ContentType | null;
    subcategory: string | null;
    selectedStage: string | null;
}

// ============================================================================
// STAGE DATA RETRIEVAL
// ============================================================================

export function getStageEntries(contentType: ContentType): StageEntry[] {
    switch (contentType) {
        case 'chapterBoss':
            return stageDefenses.chapterBosses;
        case 'worldBoss':
            return stageDefenses.worldBosses;
        case 'stageHunt':
            return stageDefenses.stageHunts;
        case 'growthDungeon':
            return stageDefenses.growthDungeons;
        default:
            return [];
    }
}

export function filterStageHuntsByChapter(chapter: string): StageEntry[] {
    return stageDefenses.stageHunts.filter(e => e.stage.startsWith(`${chapter}-`));
}

export function filterGrowthDungeonsByType(dungeonType: string): StageEntry[] {
    return stageDefenses.growthDungeons.filter(e => e.stage.startsWith(dungeonType));
}

// ============================================================================
// DROPDOWN DATA GENERATION
// ============================================================================

export function getSubcategoryOptions(contentType: ContentType): Array<{ value: string; label: string }> {
    if (contentType === 'stageHunt') {
        const options: Array<{ value: string; label: string }> = [];
        for (let ch = 1; ch <= 28; ch++) {
            options.push({
                value: `chapter-${ch}`,
                label: `Chapter ${ch}`
            });
        }
        return options;
    }

    if (contentType === 'growthDungeon') {
        const types = ['Weapon', 'EXP', 'Equipment', 'Enhancement', 'Hero Training Ground'];
        return types.map(type => ({
            value: type,
            label: `${type} Stages`
        }));
    }

    return [];
}

export function getFilteredStageEntries(
    contentType: ContentType,
    filter: string
): Array<{ entry: StageEntry; identifier: string; prefix: string }> {
    let entries: StageEntry[] = [];
    let prefix = '';

    if (contentType === 'stageHunt') {
        entries = filterStageHuntsByChapter(filter);
        prefix = 'stageHunt';
    } else if (contentType === 'growthDungeon') {
        entries = filterGrowthDungeonsByType(filter);
        prefix = 'growthDungeon';
    } else if (contentType === 'chapterBoss') {
        entries = getStageEntries('chapterBoss');
        prefix = 'chapterBoss';
    } else if (contentType === 'worldBoss') {
        entries = getStageEntries('worldBoss');
        prefix = 'worldBoss';
    }

    return entries.map(entry => ({
        entry,
        identifier: entry.stage || entry.chapter || entry.boss || '',
        prefix
    }));
}

export function formatStageLabel(
    entry: StageEntry,
    identifier: string,
    contentType: ContentType
): string {
    const accuracy = entry.accuracy ? `, Acc: ${entry.accuracy}` : '';
    const defense = Math.floor(entry.defense * 100);

    if (contentType === 'chapterBoss') {
        return `Chapter ${identifier} (Def: ${defense}${accuracy})`;
    }

    if (contentType === 'worldBoss') {
        return `${identifier} (Def: ${defense}${accuracy})`;
    }

    return `${identifier} (Def: ${defense}${accuracy})`;
}

// ============================================================================
// CONTENT TYPE VALIDATION
// ============================================================================

export function requiresSubcategory(contentType: ContentType): boolean {
    return contentType === 'stageHunt' || contentType === 'growthDungeon';
}

export function requiresStageSelection(contentType: ContentType): boolean {
    return contentType === 'chapterBoss' ||
           contentType === 'worldBoss' ||
           contentType === 'stageHunt' ||
           contentType === 'growthDungeon';
}
