declare global {
    interface Window {
        importData: () => void;
        exportData: () => void;
    }
}

interface ImportData {
    damageCalculatorData?: string | unknown;
    heroPowerPresets?: string | unknown;
    cubePotentialData?: string | unknown;
    comparisonItems?: unknown;
    selectedClass?: string;
    selectedJobTier?: string;
    theme?: string;
}

interface ExportData {
    damageCalculatorData: string | null;
    heroPowerPresets: string | null;
    cubePotentialData: string | null;
    comparisonItems: unknown;
    selectedClass: string | null;
    selectedJobTier: string | null;
    theme: string | null;
}

// Forward declaration for external function
declare function exportComparisonItems(): unknown;

window.importData = importData;
window.exportData = exportData;

// Import data from clipboard to local storage
export function importData(): void {
    navigator.clipboard.readText().then(text => {
        try {
            const data: unknown = JSON.parse(text);

            // Validate the data structure
            const importData = data as ImportData;
            if (!importData.damageCalculatorData && !importData.heroPowerPresets && !importData.cubePotentialData && !importData.comparisonItems) {
                throw new Error('Invalid data format');
            }

            // Confirm before overwriting
            if (!confirm('⚠️ This will overwrite your current data. Are you sure you want to continue?')) {
                return;
            }

            // Import each piece of data (stringify if it's an object)
            if (importData.damageCalculatorData) {
                const dataString = typeof importData.damageCalculatorData === 'string'
                    ? importData.damageCalculatorData
                    : JSON.stringify(importData.damageCalculatorData);
                localStorage.setItem('damageCalculatorData', dataString);
            }
            if (importData.heroPowerPresets) {
                const dataString = typeof importData.heroPowerPresets === 'string'
                    ? importData.heroPowerPresets
                    : JSON.stringify(importData.heroPowerPresets);
                localStorage.setItem('heroPowerPresets', dataString);
            }
            if (importData.cubePotentialData) {
                const dataString = typeof importData.cubePotentialData === 'string'
                    ? importData.cubePotentialData
                    : JSON.stringify(importData.cubePotentialData);
                localStorage.setItem('cubePotentialData', dataString);
            }
            if (importData.comparisonItems) {
                // importComparisonItems(importData.comparisonItems);
            }
            if (importData.selectedClass) {
                localStorage.setItem('selectedClass', importData.selectedClass);
            }
            if (importData.selectedJobTier) {
                localStorage.setItem('selectedJobTier', importData.selectedJobTier);
            }
            if (importData.theme) {
                localStorage.setItem('theme', importData.theme);
            }

            alert('✅ Data imported successfully! Refreshing page...');
            location.reload();
        } catch (err) {
            console.error('Failed to import data:', err);
            alert('❌ Failed to import data. Please make sure you copied valid data.');
        }
    }).catch((err: unknown) => {
        console.error('Failed to read clipboard:', err);
        alert('❌ Failed to read clipboard. Please make sure you have data copied.');
    });
}

// Export all local storage data to clipboard
export function exportData(): void {
    const allData: ExportData = {
        damageCalculatorData: localStorage.getItem('damageCalculatorData'),
        heroPowerPresets: localStorage.getItem('heroPowerPresets'),
        cubePotentialData: localStorage.getItem('cubePotentialData'),
        comparisonItems: exportComparisonItems(),
        selectedClass: localStorage.getItem('selectedClass'),
        selectedJobTier: localStorage.getItem('selectedJobTier'),
        theme: localStorage.getItem('theme')
    };

    // Parse JSON strings so they're not double-stringified
    (Object.keys(allData) as Array<keyof ExportData>).forEach(key => {
        const value = allData[key];
        if (value && typeof value === 'string') {
            try {
                allData[key] = JSON.parse(value) as never;
            } catch (e) {
                // If it's not JSON (like theme which is just a string), keep as is
            }
        }
    });

    const jsonString = JSON.stringify(allData, null, 2);

    navigator.clipboard.writeText(jsonString).then(() => {
        alert('✅ Data copied to clipboard! You can now paste it on another device.');
    }).catch((err: unknown) => {
        console.error('Failed to copy data:', err);
        alert('❌ Failed to copy data. Please check console for details.');
    });
}
