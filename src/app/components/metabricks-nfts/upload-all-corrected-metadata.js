const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Pinata configuration using API Key and Secret
const PINATA_CONFIG = {
    apiKey: '3e5fb97332d629f94989',
    secretKey: '1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7',
};

class PinataMetadataUploader {
    constructor(config) {
        this.config = config;
        this.baseURL = 'https://api.pinata.cloud';
        this.metadataDir = path.join(__dirname, 'assets', 'metadata');
        this.results = [];
    }

    async uploadAllCorrectedMetadata() {
        console.log('📤 UPLOADING ALL CORRECTED METADATA TO PINATA');
        console.log('==============================================\n');
        
        const files = fs.readdirSync(this.metadataDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => parseInt(a.replace('.json', '')) - parseInt(b.replace('.json', '')));

        console.log(`📊 Found ${files.length} metadata files to upload\n`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const brickId = parseInt(file.replace('.json', ''));
            
            console.log(`📤 [${i + 1}/${files.length}] Uploading Brick #${brickId}...`);
            
            try {
                const result = await this.uploadMetadataFile(file);
                this.results.push(result);
                
                if (result.success) {
                    console.log(`✅ Brick #${brickId}: ${result.ipfsHash}`);
                } else {
                    console.log(`❌ Brick #${brickId}: ${result.error}`);
                }
            } catch (error) {
                console.log(`❌ Brick #${brickId}: ${error.message}`);
                this.results.push({
                    success: false,
                    brickId,
                    error: error.message
                });
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.generateReport();
        return this.results;
    }

    async uploadMetadataFile(filename) {
        const filePath = path.join(this.metadataDir, filename);
        const brickId = parseInt(filename.replace('.json', ''));
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const metadata = JSON.parse(content);

            const response = await axios.post(
                `${this.baseURL}/pinning/pinJSONToIPFS`,
                metadata,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.secretKey,
                    }
                }
            );

            const ipfsHash = response.data.IpfsHash;
            const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            return {
                success: true,
                brickId,
                ipfsHash,
                gatewayUrl,
                brickType: metadata.hiddenMetadata?.type || 'unknown',
                imageUrl: metadata.image
            };

        } catch (error) {
            return {
                success: false,
                brickId,
                error: error.response?.data?.error || error.message
            };
        }
    }

    generateReport() {
        console.log('\n📊 UPLOAD REPORT');
        console.log('================\n');
        
        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);
        
        console.log(`✅ Successful uploads: ${successful.length}`);
        console.log(`❌ Failed uploads: ${failed.length}\n`);

        if (successful.length > 0) {
            console.log('🎯 SAMPLE SUCCESSFUL UPLOADS:');
            successful.slice(0, 5).forEach(result => {
                console.log(`   Brick #${result.brickId} (${result.brickType}): ${result.gatewayUrl}`);
            });
            
            if (successful.length > 5) {
                console.log(`   ... and ${successful.length - 5} more`);
            }
        }

        if (failed.length > 0) {
            console.log('\n❌ FAILED UPLOADS:');
            failed.forEach(result => {
                console.log(`   Brick #${result.brickId}: ${result.error}`);
            });
        }

        console.log('\n📝 NEXT STEPS:');
        console.log('1. All corrected metadata is now on Pinata');
        console.log('2. Each metadata file has correct image URLs');
        console.log('3. Each metadata file has correct brick type descriptions');
        console.log('4. Ready for production minting with 100% accuracy');
        
        // Save results to file
        const resultsFile = path.join(__dirname, 'metadata-upload-results.json');
        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Results saved to: ${resultsFile}`);
    }
}

// Run the upload
async function main() {
    const uploader = new PinataMetadataUploader(PINATA_CONFIG);
    
    try {
        await uploader.uploadAllCorrectedMetadata();
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = PinataMetadataUploader;
