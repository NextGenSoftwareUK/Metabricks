const fs = require('fs-extra');
const path = require('path');

// Analysis results
const perkAnalysis = {
    totalBricks: 0,
    perkCategories: {},
    mysteryPerks: {},
    coreBenefits: {},
    productFocus: {},
    brickTypes: {},
    revealedPerks: {},
    unrevealedPerks: {}
};

// Function to analyze a single metadata file
function analyzeMetadata(metadata, brickId) {
    perkAnalysis.totalBricks++;
    
    // Count brick types
    const brickType = metadata.hiddenMetadata?.type || 'unknown';
    perkAnalysis.brickTypes[brickType] = (perkAnalysis.brickTypes[brickType] || 0) + 1;
    
    // Analyze perks
    if (metadata.perks) {
        metadata.perks.forEach(perk => {
            // Count perk categories
            const category = perk.category || 'Unknown';
            perkAnalysis.perkCategories[category] = (perkAnalysis.perkCategories[category] || 0) + 1;
            
            // Count revealed vs unrevealed
            if (perk.revealed) {
                perkAnalysis.revealedPerks[perk.name] = (perkAnalysis.revealedPerks[perk.name] || 0) + 1;
            } else {
                perkAnalysis.unrevealedPerks[perk.name] = (perkAnalysis.unrevealedPerks[perk.name] || 0) + 1;
            }
            
            // Analyze mystery perks
            if (perk.category === 'Mystery') {
                const perkId = perk.perkId || perk.value;
                perkAnalysis.mysteryPerks[perkId] = (perkAnalysis.mysteryPerks[perkId] || 0) + 1;
            }
        });
    }
    
    // Analyze core benefits
    if (metadata.coreBenefits) {
        Object.entries(metadata.coreBenefits).forEach(([key, value]) => {
            if (!perkAnalysis.coreBenefits[key]) {
                perkAnalysis.coreBenefits[key] = [];
            }
            if (!perkAnalysis.coreBenefits[key].includes(value)) {
                perkAnalysis.coreBenefits[key].push(value);
            }
        });
    }
    
    // Analyze product focus
    if (metadata.productFocus && metadata.productFocus.length > 0) {
        metadata.productFocus.forEach(product => {
            perkAnalysis.productFocus[product] = (perkAnalysis.productFocus[product] || 0) + 1;
        });
    }
}

// Main analysis function
async function analyzeAllPerks() {
    const metadataDir = path.join(__dirname, 'assets', 'metadata');
    
    try {
        console.log('🔍 Analyzing MetaBricks perks...\n');
        
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
        
        console.log(`📁 Analyzing ${jsonFiles.length} metadata files...\n`);
        
        // Process each JSON file
        for (const file of jsonFiles) {
            const filePath = path.join(metadataDir, file);
            const brickId = parseInt(file.replace('.json', ''));
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const metadata = JSON.parse(content);
                analyzeMetadata(metadata, brickId);
            } catch (error) {
                console.log(`   ⚠️  Error analyzing ${file}: ${error.message}`);
            }
        }
        
        // Display analysis results
        console.log('📊 METABRICKS PERKS ANALYSIS RESULTS\n');
        console.log('=' .repeat(50));
        
        // Brick type distribution
        console.log('\n🏗️  BRICK TYPE DISTRIBUTION:');
        Object.entries(perkAnalysis.brickTypes).forEach(([type, count]) => {
            const percentage = ((count / perkAnalysis.totalBricks) * 100).toFixed(1);
            console.log(`   ${type.toUpperCase()}: ${count} bricks (${percentage}%)`);
        });
        
        // Perk categories
        console.log('\n🎁 PERK CATEGORIES:');
        Object.entries(perkAnalysis.perkCategories).forEach(([category, count]) => {
            console.log(`   ${category}: ${count} perks`);
        });
        
        // Mystery perks breakdown
        console.log('\n🔮 MYSTERY PERKS BREAKDOWN:');
        Object.entries(perkAnalysis.mysteryPerks).forEach(([perkId, count]) => {
            console.log(`   ${perkId}: ${count} bricks`);
        });
        
        // Revealed vs Unrevealed
        console.log('\n✨ REVEALED PERKS:');
        Object.entries(perkAnalysis.revealedPerks).forEach(([perk, count]) => {
            console.log(`   ${perk}: ${count} bricks`);
        });
        
        console.log('\n❓ UNREVEALED PERKS:');
        Object.entries(perkAnalysis.unrevealedPerks).forEach(([perk, count]) => {
            console.log(`   ${perk}: ${count} bricks`);
        });
        
        // Core benefits
        console.log('\n💎 CORE BENEFITS:');
        Object.entries(perkAnalysis.coreBenefits).forEach(([benefit, values]) => {
            console.log(`   ${benefit}: ${values.join(', ')}`);
        });
        
        // Product focus
        console.log('\n🎯 PRODUCT FOCUS:');
        Object.entries(perkAnalysis.productFocus).forEach(([product, count]) => {
            console.log(`   ${product}: ${count} bricks`);
        });
        
        // Summary
        console.log('\n📋 SUMMARY:');
        console.log(`   Total Bricks: ${perkAnalysis.totalBricks}`);
        console.log(`   Total Perks: ${Object.values(perkAnalysis.perkCategories).reduce((a, b) => a + b, 0)}`);
        console.log(`   Mystery Perks: ${Object.keys(perkAnalysis.mysteryPerks).length} different types`);
        console.log(`   Revealed Perks: ${Object.keys(perkAnalysis.revealedPerks).length} different types`);
        console.log(`   Unrevealed Perks: ${Object.keys(perkAnalysis.unrevealedPerks).length} different types`);
        
        // Save analysis to file
        const analysisFile = path.join(__dirname, 'perks-analysis.json');
        await fs.writeFile(analysisFile, JSON.stringify(perkAnalysis, null, 2));
        console.log(`\n📝 Analysis saved to: ${analysisFile}`);
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('   1. Review mystery perk distribution for balance');
        console.log('   2. Check if product focus distribution makes sense');
        console.log('   3. Verify core benefits are consistent across brick types');
        console.log('   4. Ensure revealed perks provide immediate value');
        
    } catch (error) {
        console.error('❌ Error during analysis:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    analyzeAllPerks();
}

module.exports = {
    analyzeAllPerks,
    analyzeMetadata
};
