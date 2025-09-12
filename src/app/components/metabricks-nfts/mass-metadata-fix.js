const fs = require('fs');
const path = require('path');

class MassMetadataFixer {
    constructor() {
        this.metadataDir = path.join(__dirname, 'assets', 'metadata');
        this.fixedCount = 0;
        this.stats = {
            regular: 0,
            industrial: 0,
            legendary: 0
        };
    }

    async fixAllMetadata() {
        console.log('🔧 Starting mass metadata correction...\n');
        
        const files = fs.readdirSync(this.metadataDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => parseInt(a.replace('.json', '')) - parseInt(b.replace('.json', '')));

        for (const file of files) {
            await this.fixFile(file);
        }

        console.log('\n✅ MASS CORRECTION COMPLETE!');
        console.log('==========================');
        console.log(`📊 Fixed: ${this.fixedCount} files`);
        console.log(`📈 Regular: ${this.stats.regular}`);
        console.log(`📈 Industrial: ${this.stats.industrial}`);
        console.log(`📈 Legendary: ${this.stats.legendary}`);
    }

    async fixFile(filename) {
        const filePath = path.join(this.metadataDir, filename);
        const brickId = parseInt(filename.replace('.json', ''));
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const metadata = JSON.parse(content);

            const correctType = this.determineCorrectType(metadata);
            if (!correctType) return;

            const needsUpdate = this.updateMetadata(metadata, correctType);
            
            if (needsUpdate) {
                // Update timestamps
                metadata.lastUpdated = new Date().toISOString();
                metadata.massCorrected = true;

                // Write back to file
                fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
                this.fixedCount++;
                this.stats[correctType]++;
                
                console.log(`✅ Brick #${brickId}: Fixed to ${correctType}`);
            }

        } catch (error) {
            console.error(`❌ Error fixing ${filename}:`, error.message);
        }
    }

    determineCorrectType(metadata) {
        // Analyze perks to determine the correct type
        const perksLevel = this.analyzePerksLevel(metadata);
        return perksLevel;
    }

    analyzePerksLevel(metadata) {
        if (!metadata.coreBenefits) return null;

        const tokenAirdrop = metadata.coreBenefits.tokenAirdrop;
        const tgeDiscount = metadata.coreBenefits.tgeDiscount;
        
        // Legendary: Guaranteed airdrop + 20%+ discount
        if (tokenAirdrop === 100 && tgeDiscount >= 20) {
            return 'legendary';
        }
        
        // Industrial: Some airdrop + 10-19% discount  
        if (tokenAirdrop >= 50 && tgeDiscount >= 10) {
            return 'industrial';
        }
        
        // Regular: Basic perks
        return 'regular';
    }

    updateMetadata(metadata, correctType) {
        let needsUpdate = false;

        // Fix description
        const currentDesc = metadata.description;
        const newDesc = currentDesc.replace(
            /'regular'|'industrial'|'legendary'/,
            `'${correctType}'`
        );
        
        if (newDesc !== currentDesc) {
            metadata.description = newDesc;
            needsUpdate = true;
        }

        // Fix hidden metadata
        if (metadata.hiddenMetadata) {
            if (metadata.hiddenMetadata.type !== correctType) {
                metadata.hiddenMetadata.type = correctType;
                metadata.hiddenMetadata.rarity = this.getRarityForType(correctType);
                needsUpdate = true;
            }
        } else {
            metadata.hiddenMetadata = {
                type: correctType,
                rarity: this.getRarityForType(correctType)
            };
            needsUpdate = true;
        }

        return needsUpdate;
    }

    getRarityForType(type) {
        switch (type) {
            case 'regular': return 'Common';
            case 'industrial': return 'Uncommon';
            case 'legendary': return 'Legendary';
            default: return 'Common';
        }
    }
}

// Run the mass fix
async function main() {
    const fixer = new MassMetadataFixer();
    await fixer.fixAllMetadata();
}

if (require.main === module) {
    main();
}

module.exports = MassMetadataFixer;
