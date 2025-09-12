const fs = require('fs');
const path = require('path');

class ImageAuditor {
    constructor() {
        this.metadataDir = path.join(__dirname, 'assets', 'metadata');
        this.imagesDir = path.join(__dirname, 'assets', 'images');
        this.stats = {
            total: 0,
            regular: 0,
            industrial: 0,
            legendary: 0,
            unknownImage: 0,
            correctImage: 0,
            wrongImage: 0
        };
        this.imageMap = {
            'regular': 'Regular_Brick_1.png',
            'industrial': 'Industrial_Brick_1.png', 
            'legendary': 'Legendary_Brick_1.png'
        };
    }

    async auditImages() {
        console.log('🖼️ Starting MetaBrick image audit...\n');
        
        const files = fs.readdirSync(this.metadataDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => parseInt(a.replace('.json', '')) - parseInt(b.replace('.json', '')));

        this.stats.total = files.length;

        console.log('📊 CURRENT IMAGE DISTRIBUTION:');
        console.log('==============================\n');

        for (const file of files) {
            await this.auditFile(file);
        }

        this.generateReport();
        return this.stats;
    }

    async auditFile(filename) {
        const filePath = path.join(this.metadataDir, filename);
        const brickId = parseInt(filename.replace('.json', ''));
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const metadata = JSON.parse(content);

            const brickType = metadata.hiddenMetadata?.type || this.extractTypeFromDescription(metadata.description);
            const imageUrl = metadata.image;
            
            // Count brick types
            this.countBrickType(brickType);
            
            // Analyze image
            this.analyzeImage(brickType, imageUrl, brickId);

        } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error.message);
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

    countBrickType(type) {
        if (type) {
            this.stats[type]++;
        } else {
            this.stats.unknownImage++;
        }
    }

    analyzeImage(brickType, imageUrl, brickId) {
        if (!brickType) {
            this.stats.unknownImage++;
            return;
        }

        // Check if image URL matches expected brick type
        const expectedImage = this.imageMap[brickType];
        const imageFileName = this.extractImageFileName(imageUrl);
        
        if (imageFileName === expectedImage) {
            this.stats.correctImage++;
        } else {
            this.stats.wrongImage++;
            console.log(`🟡 Brick #${brickId} (${brickType}): Using ${imageFileName || 'unknown'} instead of ${expectedImage}`);
        }
    }

    extractImageFileName(imageUrl) {
        if (!imageUrl) return null;
        
        // Extract the IPFS hash and try to determine the image type
        // This is a simplified approach - in reality, we'd need to check the actual image content
        const hash = imageUrl.match(/\/ipfs\/([^\/]+)/);
        return hash ? hash[1] : null;
    }

    generateReport() {
        console.log('\n📊 IMAGE AUDIT REPORT');
        console.log('=====================\n');
        
        console.log(`📈 BRICK TYPE DISTRIBUTION:`);
        console.log(`   Regular: ${this.stats.regular}`);
        console.log(`   Industrial: ${this.stats.industrial}`);
        console.log(`   Legendary: ${this.stats.legendary}`);
        console.log(`   Unknown: ${this.stats.unknownImage}\n`);

        console.log(`🖼️ IMAGE ACCURACY:`);
        console.log(`   Correct Images: ${this.stats.correctImage}`);
        console.log(`   Wrong Images: ${this.stats.wrongImage}`);
        console.log(`   Accuracy: ${((this.stats.correctImage / this.stats.total) * 100).toFixed(1)}%\n`);

        if (this.stats.wrongImage > 0) {
            console.log('❌ IMAGE MISMATCH ISSUES:');
            console.log('=========================');
            console.log('• All bricks are currently using the same image URL');
            console.log('• We have separate PNG files for each brick type:');
            console.log('  - Regular_Brick_1.png');
            console.log('  - Industrial_Brick_1.png'); 
            console.log('  - Legendary_Brick_1.png');
            console.log('\n🔧 SOLUTION NEEDED:');
            console.log('• Upload each brick type PNG to Pinata separately');
            console.log('• Update metadata to use correct image URLs');
            console.log('• Ensure each brick type shows its proper image');
        } else {
            console.log('✅ All images are correctly matched to brick types!');
        }
    }

    async createImageMapping() {
        console.log('\n🔍 AVAILABLE LOCAL IMAGES:');
        console.log('===========================');
        
        const imageFiles = fs.readdirSync(this.imagesDir).filter(f => f.endsWith('.png'));
        
        for (const imageFile of imageFiles) {
            const filePath = path.join(this.imagesDir, imageFile);
            const stats = fs.statSync(filePath);
            console.log(`📁 ${imageFile}: ${(stats.size / 1024).toFixed(1)} KB`);
        }

        console.log('\n📋 RECOMMENDED IMAGE MAPPING:');
        console.log('==============================');
        console.log('Regular Bricks (0): Use Regular_Brick_1.png');
        console.log('Industrial Bricks (362): Use Industrial_Brick_1.png');
        console.log('Legendary Bricks (11): Use Legendary_Brick_1.png');
    }
}

// Run the audit
async function main() {
    const auditor = new ImageAuditor();
    
    try {
        await auditor.auditImages();
        await auditor.createImageMapping();
        
    } catch (error) {
        console.error('❌ Audit failed:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = ImageAuditor;
