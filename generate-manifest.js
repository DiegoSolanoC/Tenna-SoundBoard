// Script to generate manifest.json from Music and Sound Effects folders
// Run with: node generate-manifest.js

const fs = require('fs');
const path = require('path');

const musicFolder = './Music';
const soundEffectsFolder = './Sound Effects';
const soundEffectIconsFolder = './Sound Effect Icons';

function getMusicFiles(folderPath) {
    try {
        const files = fs.readdirSync(folderPath);
        const musicFiles = files
            .filter(file => {
                const lower = file.toLowerCase();
                return lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg');
            })
            .map(file => ({
                filename: file,
                name: file.replace(/\.(mp3|wav|ogg)$/i, '')
            }));
        
        // Sort with "Winston's Desk" first (or any file containing "Winston" or "Desk")
        const sorted = musicFiles.sort((a, b) => {
            const aIsDefault = a.name.toLowerCase().includes('winston') || a.name.toLowerCase().includes('desk');
            const bIsDefault = b.name.toLowerCase().includes('winston') || b.name.toLowerCase().includes('desk');
            
            if (aIsDefault && !bIsDefault) return -1;
            if (!aIsDefault && bIsDefault) return 1;
            return a.name.localeCompare(b.name);
        });
        
        return sorted;
    } catch (error) {
        console.error(`Error reading folder ${folderPath}:`, error);
        return [];
    }
}

// Helper function to normalize names for matching (remove spaces, special chars, case insensitive)
function normalizeName(name) {
    return name.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
}

// Helper function to find matching icon for a sound effect
function findIconForSound(soundName, iconFiles) {
    const normalizedSound = normalizeName(soundName);
    
    // Try exact match first
    for (const iconFile of iconFiles) {
        const iconName = iconFile.replace(/\.(png|jpg|jpeg)$/i, '');
        if (normalizeName(iconName) === normalizedSound) {
            return iconFile;
        }
    }
    
    // Try partial match (icon name contains sound name or vice versa)
    for (const iconFile of iconFiles) {
        const iconName = iconFile.replace(/\.(png|jpg|jpeg)$/i, '');
        const normalizedIcon = normalizeName(iconName);
        
        if (normalizedIcon.includes(normalizedSound) || normalizedSound.includes(normalizedIcon)) {
            return iconFile;
        }
    }
    
    // Try common variations
    const variations = [
        soundName.replace(/falling/gi, 'fall'),
        soundName.replace(/crow\s*cheer/gi, 'crowd cheer'),
        soundName.replace(/shrine\s*ringtone/gi, 'ringtone'),
    ];
    
    for (const variation of variations) {
        const normalizedVariation = normalizeName(variation);
        for (const iconFile of iconFiles) {
            const iconName = iconFile.replace(/\.(png|jpg|jpeg)$/i, '');
            if (normalizeName(iconName) === normalizedVariation) {
                return iconFile;
            }
        }
    }
    
    return null;
}

function getSoundEffects(folderPath) {
    const soundEffectsByCategory = {};
    
    // Get available icons
    let iconFiles = [];
    try {
        if (fs.existsSync(soundEffectIconsFolder)) {
            iconFiles = fs.readdirSync(soundEffectIconsFolder)
                .filter(file => {
                    const lower = file.toLowerCase();
                    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
                });
        }
    } catch (error) {
        console.warn(`Could not read icon folder: ${error.message}`);
    }
    
    try {
        const items = fs.readdirSync(folderPath, { withFileTypes: true });
        
        items.forEach(item => {
            if (item.isDirectory()) {
                // It's a category folder
                const categoryName = item.name;
                const categoryPath = path.join(folderPath, categoryName);
                const files = fs.readdirSync(categoryPath);
                
                const categorySounds = files
                    .filter(file => {
                        const lower = file.toLowerCase();
                        return lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg');
                    })
                    .map(file => {
                        const soundName = file.replace(/\.(mp3|wav|ogg)$/i, '');
                        const iconFile = findIconForSound(soundName, iconFiles);
                        return {
                            filename: path.join(categoryName, file).replace(/\\/g, '/'), // Use forward slashes
                            name: soundName,
                            category: categoryName,
                            icon: iconFile ? `Sound Effect Icons/${iconFile}` : null
                        };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));
                
                if (categorySounds.length > 0) {
                    soundEffectsByCategory[categoryName] = categorySounds;
                }
            } else {
                // It's a file in the root (no category)
                const lower = item.name.toLowerCase();
                if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg')) {
                    if (!soundEffectsByCategory['Uncategorized']) {
                        soundEffectsByCategory['Uncategorized'] = [];
                    }
                    const soundName = item.name.replace(/\.(mp3|wav|ogg)$/i, '');
                    const iconFile = findIconForSound(soundName, iconFiles);
                    soundEffectsByCategory['Uncategorized'].push({
                        filename: item.name,
                        name: soundName,
                        category: 'Uncategorized',
                        icon: iconFile ? `Sound Effect Icons/${iconFile}` : null
                    });
                }
            }
        });
        
        // Convert to flat array with categories
        const result = [];
        Object.keys(soundEffectsByCategory).sort().forEach(category => {
            result.push(...soundEffectsByCategory[category]);
        });
        
        return result;
    } catch (error) {
        console.error(`Error reading folder ${folderPath}:`, error);
        return [];
    }
}

const music = getMusicFiles(musicFolder);
const soundEffects = getSoundEffects(soundEffectsFolder);

const manifest = {
    music: music,
    soundEffects: soundEffects
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest generated successfully!');
console.log(`Found ${music.length} music files.`);
console.log(`Found ${soundEffects.length} sound effects.`);

