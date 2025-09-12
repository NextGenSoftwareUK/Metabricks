const fs = require('fs');
const path = require('path');

class MetadataAuditor {
    constructor() {
        this.metadataDir = path.join(__dirname, 'assets', 'metadata');
        this.issues = [];
        this.stats = {
            total: 0,
            regular: 0,
            industrial: 0,
            legendary: 0,
            mismatches: 0,
            fixed: 0
        };
    }

    async auditAllMetadata() {
        console.log('🔍 Starting comprehensive MetaBrick metadata audit...\n');
        
        const files = fs.readdirSync(this.metadataDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => parseInt(a.replace('.json', '')) - parseInt(b.replace('.json', '')));

        this.stats.total = files.length;

        for (const file of files) {
            await this.auditFile(file);
        }

        this.generateReport();
        return this.issues;
    }

    async auditFile(filename) {
        const filePath = path.join(this.metadataDir, filename);
        const brickId = parseInt(filename.replace('.json', ''));
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const metadata = JSON.parse(content);

            const issues = this.checkMetadata(brickId, metadata);
            if (issues.length > 0) {
                this.issues.push({
                    brickId,
                    filename,
                    issues,
                    metadata
                });
                this.stats.mismatches++;
            }

            // Count brick types
            this.countBrickType(metadata);

        } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error.message);
        }
    }

    checkMetadata(brickId, metadata) {
        const issues = [];

        // Check 1: Description vs Hidden Metadata consistency
        const descriptionType = this.extractTypeFromDescription(metadata.description);
        const hiddenType = metadata.hiddenMetadata?.type;
        
        if (descriptionType && hiddenType && descriptionType !== hiddenType) {
            issues.push({
                type: 'type_mismatch',
                severity: 'high',
                message: `Description says "${descriptionType}" but hiddenMetadata says "${hiddenType}"`,
                description: descriptionType,
                hidden: hiddenType
            });
        }

        // Check 2: Brick type vs perks consistency
        const actualType = hiddenType || descriptionType;
        const perksLevel = this.analyzePerksLevel(metadata);
        
        if (actualType && perksLevel && actualType !== perksLevel) {
            issues.push({
                type: 'perks_mismatch',
                severity: 'medium',
                message: `Brick type "${actualType}" doesn't match perks level "${perksLevel}"`,
                brickType: actualType,
                perksLevel: perksLevel
            });
        }

        // Check 3: Required fields
        if (!metadata.name || !metadata.description || !metadata.image) {
            issues.push({
                type: 'missing_fields',
                severity: 'high',
                message: 'Missing required fields (name, description, or image)'
            });
        }

        // Check 4: Image URL validity
        if (metadata.image && !metadata.image.includes('gateway.pinata.cloud')) {
            issues.push({
                type: 'invalid_image_url',
                severity: 'medium',
                message: 'Image URL is not a valid Pinata gateway URL'
            });
        }

        return issues;
    }

    extractTypeFromDescription(description) {
        if (!description) return null;
        
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes("'regular'")) return 'regular';
        if (lowerDesc.includes("'industrial'")) return 'industrial';
        if (lowerDesc.includes("'legendary'")) return 'legendary';
        return null;
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

    countBrickType(metadata) {
        const type = metadata.hiddenMetadata?.type || this.extractTypeFromDescription(metadata.description);
        
        switch (type) {
            case 'regular':
                this.stats.regular++;
                break;
            case 'industrial':
                this.stats.industrial++;
                break;
            case 'legendary':
                this.stats.legendary++;
                break;
        }
    }

    generateReport() {
        console.log('\n📊 METADATA AUDIT REPORT');
        console.log('========================\n');
        
        console.log(`📈 STATISTICS:`);
        console.log(`   Total Files: ${this.stats.total}`);
        console.log(`   Regular: ${this.stats.regular}`);
        console.log(`   Industrial: ${this.stats.industrial}`);
        console.log(`   Legendary: ${this.stats.legendary}`);
        console.log(`   Issues Found: ${this.stats.mismatches}\n`);

        if (this.issues.length === 0) {
            console.log('✅ All metadata files are consistent!');
            return;
        }

        console.log('❌ ISSUES FOUND:\n');
        
        this.issues.forEach((issue, index) => {
            console.log(`${index + 1}. Brick #${issue.brickId} (${issue.filename})`);
            issue.issues.forEach(prob => {
                const severity = prob.severity === 'high' ? '🔴' : '🟡';
                console.log(`   ${severity} ${prob.message}`);
            });
            console.log('');
        });

        // Group issues by type
        const issueTypes = {};
        this.issues.forEach(issue => {
            issue.issues.forEach(prob => {
                if (!issueTypes[prob.type]) {
                    issueTypes[prob.type] = [];
                }
                issueTypes[prob.type].push(issue.brickId);
            });
        });

        console.log('📋 ISSUE SUMMARY BY TYPE:');
        Object.entries(issueTypes).forEach(([type, bricks]) => {
            console.log(`   ${type}: ${bricks.length} bricks (${bricks.slice(0, 5).join(', ')}${bricks.length > 5 ? '...' : ''})`);
        });
    }

    async fixIssues() {
        console.log('\n🔧 FIXING METADATA ISSUES...\n');
        
        for (const issue of this.issues) {
            await this.fixBrickMetadata(issue);
        }

        console.log(`\n✅ Fixed ${this.stats.fixed} metadata files`);
    }

    async fixBrickMetadata(issue) {
        const { brickId, metadata, issues: problems } = issue;
        
        console.log(`🔧 Fixing Brick #${brickId}...`);
        
        let needsUpdate = false;

        problems.forEach(prob => {
            if (prob.type === 'type_mismatch') {
                // Fix: Use the perks level as the authoritative type
                const correctType = this.analyzePerksLevel(metadata);
                if (correctType) {
                    // Update description
                    metadata.description = metadata.description.replace(
                        /'regular'|'industrial'|'legendary'/,
                        `'${correctType}'`
                    );
                    
                    // Update hidden metadata
                    if (metadata.hiddenMetadata) {
                        metadata.hiddenMetadata.type = correctType;
                        metadata.hiddenMetadata.rarity = this.getRarityForType(correctType);
                    }
                    
                    needsUpdate = true;
                    console.log(`   ✅ Fixed type mismatch: ${prob.brickType} → ${correctType}`);
                }
            }
        });

        if (needsUpdate) {
            // Update timestamp
            metadata.lastUpdated = new Date().toISOString();
            metadata.metadataFixed = true;

            // Write back to file
            const filePath = path.join(this.metadataDir, issue.filename);
            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
            this.stats.fixed++;
        }
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

// Run the audit
async function main() {
    const auditor = new MetadataAuditor();
    
    try {
        await auditor.auditAllMetadata();
        
        if (auditor.issues.length > 0) {
            console.log('\n❓ Would you like to automatically fix the issues? (y/n)');
            // For now, we'll auto-fix
            await auditor.fixIssues();
        }
        
    } catch (error) {
        console.error('❌ Audit failed:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = MetadataAuditor;
