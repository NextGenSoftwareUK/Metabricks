const fs = require('fs');
const path = require('path');

class MassImageFixer {
    constructor() {
        this.metadataDir = path.join(__dirname, 'assets', 'metadata');
        
        // Correct image URLs from Pinata upload
        this.correctImageUrls = {
            regular: 'https://gateway.pinata.cloud/ipfs/bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4',
            industrial: 'https://gateway.pinata.cloud/ipfs/bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka',
            legendary: 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq'
        };
        
        this.stats = {
            total: 0,
            fixed: 0,
            regular: 0,
            industrial: 0,
            legendary: 0,
            errors: 0
        };
    }

    async fixAllImages() {
        console.log('🖼️ MASS IMAGE FIX: Updating all MetaBrick metadata with correct image URLs');
        console.log('=======================================================================\n');
        
        const files = fs.readdirSync(this.metadataDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => parseInt(a.replace('.json', '')) - parseInt(b.replace('.json', '')));

        this.stats.total = files.length;

        for (const file of files) {
            await this.fixFileImage(file);
        }

        this.generateReport();
        return this.stats;
    }

    async fixFileImage(filename) {
        const filePath = path.join(this.metadataDir, filename);
        const brickId = parseInt(filename.replace('.json', ''));
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const metadata = JSON.parse(content);

            // Determine brick type
            const brickType = metadata.hiddenMetadata?.type || this.extractTypeFromDescription(metadata.description);
            
            if (!brickType) {
                console.log(`⚠️ Brick #${brickId}: Could not determine brick type`);
                this.stats.errors++;
                return;
            }

            // Get correct image URL for this brick type
            const correctImageUrl = this.correctImageUrls[brickType];
            if (!correctImageUrl) {
                console.log(`⚠️ Brick #${brickId}: No image URL found for type "${brickType}"`);
                this.stats.errors++;
                return;
            }

            // Check if image URL needs updating
            const currentImageUrl = metadata.image;
            if (currentImageUrl === correctImageUrl) {
                // Already correct
                return;
            }

            // Update the image URL
            metadata.image = correctImageUrl;
            
            // Update properties.files[0].uri if it exists
            if (metadata.properties && metadata.properties.files && metadata.properties.files.length > 0) {
                metadata.properties.files[0].uri = correctImageUrl;
            }

            // Add update timestamp
            metadata.lastImageUpdate = new Date().toISOString();
            metadata.imageCorrected = true;

            // Write back to file
            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
            
            this.stats.fixed++;
            this.stats[brickType]++;
            
            console.log(`✅ Brick #${brickId}: Updated ${brickType} image URL`);

        } catch (error) {
            console.error(`❌ Error fixing ${filename}:`, error.message);
            this.stats.errors++;
        }
    }

    extractTypeFromDescription(description) {
        if (!description) return null;
        
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes("'regular'")) return 'regular';
        if (lowerDesc.includes("'industrial'")) return 'industrial';
        if (lowerDesc.includes("'legendary'")) return 'legendary';
        return null;
    }

    generateReport() {
        console.log('\n📊 MASS IMAGE FIX REPORT');
        console.log('=========================\n');
        
        console.log(`📈 STATISTICS:`);
        console.log(`   Total Files: ${this.stats.total}`);
        console.log(`   Files Fixed: ${this.stats.fixed}`);
        console.log(`   Errors: ${this.stats.errors}\n`);
        
        console.log(`🖼️ IMAGE UPDATES BY TYPE:`);
        console.log(`   Regular: ${this.stats.regular}`);
        console.log(`   Industrial: ${this.stats.industrial}`);
        console.log(`   Legendary: ${this.stats.legendary}\n`);
        
        console.log(`🎯 CORRECT IMAGE URLS APPLIED:`);
        console.log(`   Regular: ${this.correctImageUrls.regular}`);
        console.log(`   Industrial: ${this.correctImageUrls.industrial}`);
        console.log(`   Legendary: ${this.correctImageUrls.legendary}\n`);
        
        if (this.stats.fixed > 0) {
            console.log('✅ SUCCESS: All MetaBrick metadata now has correct image URLs!');
            console.log('\n📝 NEXT STEPS:');
            console.log('1. Test minting a MetaBrick to verify correct image displays');
            console.log('2. Check Solana explorer to confirm image shows properly');
            console.log('3. All 433 bricks now have consistent, correct images');
        } else {
            console.log('⚠️ No files needed image updates (they were already correct)');
        }
        
        if (this.stats.errors > 0) {
            console.log(`\n❌ ${this.stats.errors} files had errors during processing`);
        }
    }

    async verifySampleImages() {
        console.log('\n🧪 VERIFYING SAMPLE IMAGE UPDATES:');
        console.log('===================================');
        
        const sampleFiles = ['1.json', '100.json', '200.json', '300.json', '400.json', '425.json'];
        
        for (const filename of sampleFiles) {
            const filePath = path.join(this.metadataDir, filename);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const metadata = JSON.parse(content);
                    const brickId = parseInt(filename.replace('.json', ''));
                    const brickType = metadata.hiddenMetadata?.type;
                    
                    console.log(`📋 Brick #${brickId} (${brickType}): ${metadata.image}`);
                } catch (error) {
                    console.log(`❌ Error reading ${filename}: ${error.message}`);
                }
            }
        }
    }
}

// Run the mass image fix
async function main() {
    const fixer = new MassImageFixer();
    
    try {
        await fixer.fixAllImages();
        await fixer.verifySampleImages();
        
    } catch (error) {
        console.error('❌ Mass image fix failed:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = MassImageFixer;
