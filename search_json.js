const fs = require('fs');
const path = require('path');

const searchDir = path.join(__dirname, 'ignore', 'TextAsset');
const searchTerms = ['1901', '10190013', '10190014'];

function searchJsonFiles(dir) {
    searchTerms.forEach(searchText => {
        console.log(`\n========== Searching for "${searchText}" ==========\n`);

        try {
            const files = fs.readdirSync(dir);

            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    // Skip subdirectories for now
                } else if (file.endsWith('.json')) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        if (content.includes(searchText)) {
                            console.log(`Found in: ${file}`);

                            // Show context around the match
                            const lines = content.split('\n');
                            lines.forEach((line, index) => {
                                if (line.includes(searchText)) {
                                    // Show 2 lines before and after for context
                                    const start = Math.max(0, index - 2);
                                    const end = Math.min(lines.length, index + 3);

                                    console.log(`  Lines ${start + 1}-${end}:`);
                                    for (let i = start; i < end; i++) {
                                        const marker = i === index ? '>>> ' : '    ';
                                        console.log(`${marker}${i + 1}: ${lines[i].trim()}`);
                                    }
                                    console.log('');
                                }
                            });
                        }
                    } catch (err) {
                        // Skip files that can't be read
                    }
                }
            });
        } catch (err) {
            console.error(`Error reading directory ${dir}: ${err.message}`);
        }
    });
}

searchJsonFiles(searchDir);
console.log('\nSearch complete.');
