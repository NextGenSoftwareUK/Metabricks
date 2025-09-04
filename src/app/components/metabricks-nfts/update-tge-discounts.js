const fs = require('fs-extra');
const path = require('path');

// TGE Discount tiers by brick rarity
const TGE_DISCOUNTS = {
    regular: 10,    // Regular Bricks (1-361)
    industrial: 15, // Industrial Bricks (362-421)
    legendary: 20   // Legendary Bricks (422-432)
};

// Function to determine brick type from brick ID
function getBrickType(brickId) {
    if (brickId >= 422 && brickId <= 432) return 'legendary';
    if (brickId >= 362 && brickId <= 421) return 'industrial';
    return 'regular'; // 1-361
}

// Function to update a single metadata file
async function updateTGEDiscount(filePath, brickId) {
    try {
        // Read and parse the JSON
        const content = await fs.readFile(filePath, 'utf8');
        const metadata = JSON.parse(content);
        
        // Determine brick type
        const brickType = getBrickType(brickId);
        
        // Get the correct TGE discount
        const newDiscount = TGE_DISCOUNTS[brickType];
        
        // Update the TGE discount in attributes
        if (metadata.attributes) {
            const tgeAttribute = metadata.attributes.find(attr => attr.trait_type === 'TGE Discount');
            if (tgeAttribute) {
                tgeAttribute.value = `${newDiscount}%`;
                tgeAttribute.description = `Token Generation Event discount`;
            }
        }
        
        // Update the core benefits
        if (metadata.coreBenefits) {
            metadata.coreBenefits.tgeDiscount = newDiscount;
        }
        
        // Add update note
        metadata.lastUpdated = new Date().toISOString();
        metadata.tgeDiscountUpdated = true;
        
        // Write the updated file back
        await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
        
        return {
            success: true,
            brickId,
            brickType,
            oldDiscount: metadata.coreBenefits?.tgeDiscount || 'unknown',
            newDiscount: newDiscount
        };
        
    } catch (error) {
        return {
            success: false,
            brickId,
            error: error.message
        };
    }
}

// Main function to update all metadata files
async function updateAllTGEDiscounts() {
    const metadataDir = path.join(__dirname, 'assets', 'metadata');
    
    try {
        console.log('💰 Updating TGE discounts by brick rarity...\n');
        
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
        
        console.log(`📁 Found ${jsonFiles.length} JSON files to update\n`);
        
        let successCount = 0;
        let errorCount = 0;
        const results = [];
        
        // Process each JSON file
        for (const file of jsonFiles) {
            const filePath = path.join(metadataDir, file);
            const brickId = parseInt(file.replace('.json', ''));
            
            console.log(`🔄 Updating ${file} (Brick #${brickId})...`);
            
            const result = await updateTGEDiscount(filePath, brickId);
            
            if (result.success) {
                successCount++;
                console.log(`   ✅ Updated! Type: ${result.brickType}, TGE Discount: ${result.newDiscount}%`);
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
        
        // Show new TGE discount structure
        console.log('\n💰 NEW TGE DISCOUNT STRUCTURE:');
        console.log(`   Regular Bricks (1-361): ${TGE_DISCOUNTS.regular}% discount`);
        console.log(`   Industrial Bricks (362-421): ${TGE_DISCOUNTS.industrial}% discount`);
        console.log(`   Legendary Bricks (422-432): ${TGE_DISCOUNTS.legendary}% discount`);
        
        // Save results to file
        const resultsFile = path.join(__dirname, 'tge-discount-update-results.json');
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        console.log(`\n📝 Update results saved to: ${resultsFile}`);
        
        // Show next steps
        console.log('\n🚀 Next Steps:');
        console.log('1. TGE discounts updated by brick rarity');
        console.log('2. Ready to upload to Pinata');
        console.log('3. Clear rarity = value relationship established');
        
        if (errorCount === 0) {
            console.log('\n🎉 All TGE discounts successfully updated!');
        } else {
            console.log('\n⚠️ Some updates failed. Check the errors above.');
        }
        
    } catch (error) {
        console.error('❌ Error during update process:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    updateAllTGEDiscounts();
}

module.exports = {
    updateAllTGEDiscounts,
    updateTGEDiscount
};
