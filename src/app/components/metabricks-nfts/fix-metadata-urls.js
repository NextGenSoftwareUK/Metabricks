const fs = require('fs-extra');
const path = require('path');

// Correct brick image URLs (already on Pinata)
const CORRECT_BRICK_IMAGES = {
    regular: 'https://gateway.pinata.cloud/ipfs/bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4',
    industrial: 'https://gateway.pinata.cloud/ipfs/bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka',
    legendary: 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq'
};

// Function to determine brick type from brick ID
function getBrickType(brickId) {
    if (brickId >= 422 && brickId <= 432) return 'legendary';
    if (brickId >= 362 && brickId <= 421) return 'industrial';
    return 'regular'; // 1-361
}

// Function to fix a single metadata file
async function fixMetadataFile(filePath, brickId) {
    try {
        // Read and parse the JSON
        const content = await fs.readFile(filePath, 'utf8');
        const metadata = JSON.parse(content);
        
        // Determine brick type
        const brickType = getBrickType(brickId);
        
        // Get the correct image URL
        const correctImageUrl = CORRECT_BRICK_IMAGES[brickType];
        
        // Fix the image URL
        metadata.image = correctImageUrl;
        
        // Fix the properties.files[0].uri URL
        if (metadata.properties && metadata.properties.files && metadata.properties.files[0]) {
            metadata.properties.files[0].uri = correctImageUrl;
        }
        
        // Add a note about the fix
        metadata.lastUpdated = new Date().toISOString();
        metadata.imageUrlFixed = true;
        
        // Write the corrected file back
        await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
        
        return {
            success: true,
            brickId,
            brickType,
            oldUrl: metadata.image,
            newUrl: correctImageUrl
        };
        
    } catch (error) {
        return {
            success: false,
            brickId,
            error: error.message
        };
    }
}

// Main function to fix all metadata files
async function fixAllMetadata() {
    const metadataDir = path.join(__dirname, 'assets', 'metadata');
    
    try {
        console.log('🔧 Starting metadata URL fixes...\n');
        
        // Check if metadata directory exists
        if (!await fs.pathExists(metadataDir)) {
            console.log('❌ Metadata directory not found:', metadataDir);
            return;
        }
        
        // Get all JSON files
        const files = await fs.readdir(metadataDir);
        const jsonFiles = files.filter(file => file.endsWith('.json')).sort((a, b) => {
            const numA = parseInt(a.replace('.json', ''));
            const numB = parseInt(b.replace('.json', ''));
            return numA - numB;
        });
        
        console.log(`📁 Found ${jsonFiles.length} JSON files to fix\n`);
        
        let successCount = 0;
        let errorCount = 0;
        const results = [];
        
        // Process each JSON file
        for (const file of jsonFiles) {
            const filePath = path.join(metadataDir, file);
            const brickId = parseInt(file.replace('.json', ''));
            
            console.log(`🔄 Fixing ${file} (Brick #${brickId})...`);
            
            const result = await fixMetadataFile(filePath, brickId);
            
            if (result.success) {
                successCount++;
                console.log(`   ✅ Fixed! Type: ${result.brickType}, Image: ${result.newUrl}`);
                results.push(result);
            } else {
                errorCount++;
                console.log(`   ❌ Failed: ${result.error}`);
            }
        }
        
        // Summary
        console.log('\n📊 Fix Summary:');
        console.log(`✅ Successfully fixed: ${successCount} files`);
        console.log(`❌ Failed to fix: ${errorCount} files`);
        console.log(`📁 Total files processed: ${jsonFiles.length}`);
        
        // Save results to file
        const resultsFile = path.join(__dirname, 'metadata-fix-results.json');
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        console.log(`\n📝 Fix results saved to: ${resultsFile}`);
        
        // Show sample results
        if (results.length > 0) {
            console.log('\n🎯 Sample Fixed URLs:');
            results.slice(0, 5).forEach(result => {
                console.log(`• Brick #${result.brickId} (${result.brickType}): ${result.newUrl}`);
            });
            
            if (results.length > 5) {
                console.log(`   ... and ${results.length - 5} more`);
            }
        }
        
        // Show next steps
        console.log('\n🚀 Next Steps:');
        console.log('1. All metadata files now have correct image URLs');
        console.log('2. Ready to upload to Pinata');
        console.log('3. NFT images should display correctly in wallets');
        
        if (errorCount === 0) {
            console.log('\n🎉 All metadata files successfully fixed!');
        } else {
            console.log('\n⚠️ Some files failed to fix. Check the errors above.');
        }
        
    } catch (error) {
        console.error('❌ Error during fix process:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    fixAllMetadata();
}

module.exports = {
    fixAllMetadata,
    fixMetadataFile
};
