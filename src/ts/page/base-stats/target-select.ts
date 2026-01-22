/**
 * Pure logic layer for Target/Stage selection
 * Data retrieval and filtering functions without DOM dependencies
 */
import { stageDefenses } from '@ts/services/stage-defense.service';
import { CONTENT_TYPE, MAX_CHAPTER_NUMBER, type ContentType } from '@ts/types';

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
        case CONTENT_TYPE.CHAPTER_BOSS:
            return stageDefenses.chapterBosses;
        case CONTENT_TYPE.WORLD_BOSS:
            return stageDefenses.worldBosses;
        case CONTENT_TYPE.STAGE_HUNT:
            return stageDefenses.stageHunts;
        case CONTENT_TYPE.GROWTH_DUNGEON:
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
    if (contentType === CONTENT_TYPE.STAGE_HUNT) {
        const options: Array<{ value: string; label: string }> = [];
        for (let ch = 1; ch <= MAX_CHAPTER_NUMBER; ch++) {
            options.push({
                value: `chapter-${ch}`,
                label: `Chapter ${ch}`
            });
        }
        return options;
    }

    if (contentType === CONTENT_TYPE.GROWTH_DUNGEON) {
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

    if (contentType === CONTENT_TYPE.STAGE_HUNT) {
        entries = filterStageHuntsByChapter(filter);
        prefix = 'stageHunt';
    } else if (contentType === CONTENT_TYPE.GROWTH_DUNGEON) {
        entries = filterGrowthDungeonsByType(filter);
        prefix = 'growthDungeon';
    } else if (contentType === CONTENT_TYPE.CHAPTER_BOSS) {
        entries = getStageEntries(CONTENT_TYPE.CHAPTER_BOSS);
        prefix = 'chapterBoss';
    } else if (contentType === CONTENT_TYPE.WORLD_BOSS) {
        entries = getStageEntries(CONTENT_TYPE.WORLD_BOSS);
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

    if (contentType === CONTENT_TYPE.CHAPTER_BOSS) {
        return `Chapter ${identifier} (Def: ${defense}${accuracy})`;
    }

    if (contentType === CONTENT_TYPE.WORLD_BOSS) {
        return `${identifier} (Def: ${defense}${accuracy})`;
    }

    return `${identifier} (Def: ${defense}${accuracy})`;
}

// ============================================================================
// CONTENT TYPE VALIDATION
// ============================================================================

export function requiresSubcategory(contentType: ContentType): boolean {
    return contentType === CONTENT_TYPE.STAGE_HUNT || contentType === CONTENT_TYPE.GROWTH_DUNGEON;
}

export function requiresStageSelection(contentType: ContentType): boolean {
    return contentType === CONTENT_TYPE.CHAPTER_BOSS ||
           contentType === CONTENT_TYPE.WORLD_BOSS ||
           contentType === CONTENT_TYPE.STAGE_HUNT ||
           contentType === CONTENT_TYPE.GROWTH_DUNGEON;
}
