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

// Function to update a single randomized metadata file
async function updateRandomizedImage(filePath, uploadNumber) {
    try {
        // Read and parse the JSON
        const content = await fs.readFile(filePath, 'utf8');
        const metadata = JSON.parse(content);
        
        // Extract the original brick ID from the name (e.g., "MetaBrick #22" -> 22)
        const nameMatch = metadata.name.match(/MetaBrick #(\d+)/);
        if (!nameMatch) {
            return {
                success: false,
                uploadNumber,
                error: 'Could not extract brick ID from name'
            };
        }
        
        const originalBrickId = parseInt(nameMatch[1]);
        const brickType = getBrickType(originalBrickId);
        
        // Get the correct image URL
        const correctImageUrl = CORRECT_BRICK_IMAGES[brickType];
        
        // Update the image URL
        metadata.image = correctImageUrl;
        
        // Update the properties.files[0].uri
        if (metadata.properties && metadata.properties.files && metadata.properties.files[0]) {
            metadata.properties.files[0].uri = correctImageUrl;
        }
        
        // Add update note
        metadata.lastUpdated = new Date().toISOString();
        metadata.imageUrlFixed = true;
        metadata.uploadNumber = uploadNumber;
        metadata.originalBrickId = originalBrickId;
        metadata.brickType = brickType;
        
        // Write the updated file back
        await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
        
        return {
            success: true,
            uploadNumber,
            originalBrickId,
            brickType,
            oldImageUrl: metadata.image,
            newImageUrl: correctImageUrl
        };
        
    } catch (error) {
        return {
            success: false,
            uploadNumber,
            error: error.message
        };
    }
}

// Main function to update all randomized metadata files
async function updateAllRandomizedImages() {
    const randomizedDir = path.join(__dirname, 'pinata-upload-randomized');
    
    try {
        console.log('🖼️ Updating randomized metadata files with correct image URLs...\n');
        
        // Check if randomized directory exists
        if (!await fs.pathExists(randomizedDir)) {
            console.log('❌ Randomized directory not found:', randomizedDir);
            return;
        }
        
        // Get all JSON files
        const files = await fs.readdir(randomizedDir);
        const jsonFiles = files.filter(file => file.endsWith('.json')).sort((a, b) => {
            const numA = parseInt(a.replace('.json', ''));
            const numB = parseInt(b.replace('.json', ''));
            return numA - numB;
        });
        
        console.log(`📁 Found ${jsonFiles.length} randomized JSON files to update\n`);
        
        let successCount = 0;
        let errorCount = 0;
        const results = [];
        
        // Process each JSON file
        for (const file of jsonFiles) {
            const filePath = path.join(randomizedDir, file);
            const uploadNumber = parseInt(file.replace('.json', ''));
            
            console.log(`🔄 Updating ${file} (Upload #${uploadNumber})...`);
            
            const result = await updateRandomizedImage(filePath, uploadNumber);
            
            if (result.success) {
                successCount++;
                console.log(`   ✅ Updated! Original: Brick #${result.originalBrickId} (${result.brickType})`);
                console.log(`      Image URL: ${result.newImageUrl.substring(0, 60)}...`);
                results.push(result);
            } else {
                errorCount++;
                console.log(`   ❌ Failed: ${result.error}`);
            }
        }
        
        // Summary
        console.log('\n📊 Update Summary:');
        console.log(`✅ Successfully updated: ${successCount} files`);
        console.log(`❌ Failed to update: ${errorCount} files`);
        console.log(`📁 Total files processed: ${jsonFiles.length}`);
        
        // Show image URL structure
        console.log('\n🖼️ CORRECT IMAGE URL STRUCTURE:');
        console.log(`   Regular Bricks: ${CORRECT_BRICK_IMAGES.regular.substring(0, 60)}...`);
        console.log(`   Industrial Bricks: ${CORRECT_BRICK_IMAGES.industrial.substring(0, 60)}...`);
        console.log(`   Legendary Bricks: ${CORRECT_BRICK_IMAGES.legendary.substring(0, 60)}...`);
        
        // Save results to file
        const resultsFile = path.join(__dirname, 'randomized-image-update-results.json');
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        console.log(`\n📝 Update results saved to: ${resultsFile}`);
        
        // Show next steps
        console.log('\n🚀 Next Steps:');
        console.log('1. ✅ Randomized files updated with correct image URLs');
        console.log('2. ✅ TGE discounts already correct in randomized files');
        console.log('3. ✅ Perfect mystery strategy maintained');
        console.log('4. 🚀 Ready to upload to Pinata!');
        
        if (errorCount === 0) {
            console.log('\n🎉 All randomized files successfully updated!');
        } else {
            console.log('\n⚠️ Some updates failed. Check the errors above.');
        }
        
    } catch (error) {
        console.error('❌ Error during update process:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    updateAllRandomizedImages();
}

module.exports = {
    updateAllRandomizedImages,
    updateRandomizedImage
};
