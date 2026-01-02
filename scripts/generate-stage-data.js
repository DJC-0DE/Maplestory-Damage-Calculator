/**
 * Stage Data Generator
 * Extracts all stage/boss data from game JSON files and generates stage-data.js
 *
 * Usage: node scripts/generate-stage-data.js
 */

const fs = require('fs');
const path = require('path');

// Load game data files
const dataPath = path.join(__dirname, '..', 'ignore', 'textassets');
const dt = JSON.parse(fs.readFileSync(path.join(dataPath, 'DungeonTable.json')));
const mt = JSON.parse(fs.readFileSync(path.join(dataPath, 'MonsterTierTable.json')));
const cf = JSON.parse(fs.readFileSync(path.join(dataPath, 'CampFamilyTable.json')));
const loc = JSON.parse(fs.readFileSync(path.join(dataPath, 'Localization_en.json')));
const dvt = JSON.parse(fs.readFileSync(path.join(dataPath, 'DungeonVisualizeTable.json')));

/**
 * Get tier stats from MonsterTierTable
 */
function getTierStats(tierIndex) {
    const tier = mt.find(t => t.TierIndex === tierIndex);
    if (!tier) return null;
    return {
        defense: tier.StatRatio.Defence / 100,
        accuracy: tier.StatRatio.HitChance
    };
}

/**
 * Generate stage hunts and chapter bosses for chapters 1-28
 */
function generateChapterData() {
    const stageHunts = [];
    const chapterBosses = [];

    for (let ch = 1; ch <= 28; ch++) {
        const chapterStr = String(ch);

        // Get stages 1-9
        for (let s = 1; s <= 9; s++) {
            const stage = dt.find(d => d.ChapterIndex === chapterStr && d.DungeonIndex === String(s));
            if (stage && stage.GearEliteCreatureTierIndex) {
                const stats = getTierStats(stage.GearEliteCreatureTierIndex);
                if (stats) {
                    stageHunts.push({
                        stage: `${ch}-${s}`,
                        defense: stats.defense,
                        damageReduction: 0,
                        accuracy: stats.accuracy
                    });
                }
            }
        }

        // Get boss (dungeon 10)
        const boss = dt.find(d => d.ChapterIndex === chapterStr && d.DungeonIndex === '10');
        if (boss && boss.OverrideFamilyIndex) {
            const familyIndex = boss.OverrideFamilyIndex.find(f => f !== null);
            if (familyIndex) {
                const stats = getTierStats(familyIndex);
                if (stats) {
                    chapterBosses.push({
                        chapter: chapterStr,
                        defense: stats.defense,
                        damageReduction: 0,
                        accuracy: stats.accuracy
                    });
                }
            }
        }
    }

    return { stageHunts, chapterBosses };
}

/**
 * Generate world boss data (Chapter 3000)
 */
function generateWorldBossData() {
    const worldBosses = [];
    const wb = dt.filter(d => d.ChapterIndex === '3000');

    wb.forEach(w => {
        const fam = w.OverrideFamilyIndex.find(f => f !== null);
        if (fam) {
            const family = cf.find(f => f.FamilyIndex === fam);
            if (family && family.Monster && family.Monster[0]) {
                const tier = mt.find(t => t.TierIndex === family.Monster[0].TierIndex);
                if (tier) {
                    const viz = dvt.find(v => v.ChapterIndex === '3000' && v.DungeonIndex === w.DungeonIndex);
                    const nameObj = viz ? loc.find(l => l.Key === viz.DungeonNameLocalKey) : null;
                    const name = nameObj ? nameObj.Text : `World Boss Stage ${w.DungeonIndex}`;

                    worldBosses.push({
                        stage: name,
                        defense: tier.StatRatio.Defence / 100,
                        damageReduction: 0,
                        accuracy: tier.StatRatio.HitChance
                    });
                }
            }
        }
    });

    return worldBosses;
}

/**
 * Generate growth dungeon data (Chapters 1000-1004)
 */
function generateGrowthDungeonData() {
    const growthDungeons = [];

    // Map chapter to dungeon type name (from actual game localization)
    const dungeonTypeNames = {
        '1000': 'Weapon',
        '1001': 'EXP',
        '1002': 'Equipment',
        '1003': 'Enhancement',
        '1004': 'Hero Training Ground'
    };

    for (let ch = 1000; ch <= 1004; ch++) {
        const chapterStr = String(ch);
        const dungeonType = dungeonTypeNames[chapterStr];
        const dungeons = dt.filter(d => d.ChapterIndex === chapterStr);

        dungeons.forEach(dun => {
            let tierIndex = dun.GearEliteCreatureTierIndex;
            if (!tierIndex && dun.OverrideFamilyIndex) {
                tierIndex = dun.OverrideFamilyIndex.find(f => f !== null);
            }
            if (tierIndex) {
                const tier = mt.find(t => t.TierIndex === tierIndex);
                if (tier) {
                    growthDungeons.push({
                        stage: `${dungeonType} Stage ${dun.DungeonIndex}`,
                        defense: tier.StatRatio.Defence / 100,
                        damageReduction: 0,
                        accuracy: tier.StatRatio.HitChance
                    });
                }
            }
        });
    }

    return growthDungeons;
}

/**
 * Main function - generate all data and write to file
 */
function generateStageData() {
    console.log('🔄 Generating stage data from game files...\n');

    const { stageHunts, chapterBosses } = generateChapterData();
    const worldBosses = generateWorldBossData();
    const growthDungeons = generateGrowthDungeonData();

    const combined = {
        stageHunts,
        chapterBosses,
        worldBosses,
        growthDungeons
    };

    const content = `// Auto-generated stage data from game files
// Generated: ${new Date().toISOString()}
// Do not edit manually - regenerate using: node scripts/generate-stage-data.js

export const stageData = ${JSON.stringify(combined, null, 2)};
`;

    const outputPath = path.join(__dirname, '..', 'stage-data.js');
    fs.writeFileSync(outputPath, content);

    console.log('✅ Created stage-data.js with:');
    console.log(`   📍 Stage Hunts: ${stageHunts.length}`);
    console.log(`   👑 Chapter Bosses: ${chapterBosses.length}`);
    console.log(`   🌍 World Bosses: ${worldBosses.length}`);
    console.log(`   📈 Growth Dungeons: ${growthDungeons.length}`);
    console.log(`   📊 Total: ${stageHunts.length + chapterBosses.length + worldBosses.length + growthDungeons.length}\n`);
    console.log('✅ Done!');
}

// Run the generator
generateStageData();
