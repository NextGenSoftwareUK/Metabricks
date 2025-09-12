const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Pinata configuration using API Key and Secret
const PINATA_CONFIG = {
    apiKey: '3e5fb97332d629f94989', // Older API Key
    secretKey: '1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7', // Older Secret Key
};

class PinataImageUploader {
    constructor(config) {
        this.config = config;
        this.baseURL = 'https://api.pinata.cloud';
    }

    async uploadImage(imagePath, brickType) {
        try {
            console.log(`📤 Uploading ${brickType} image: ${path.basename(imagePath)}`);
            
            const formData = new FormData();
            formData.append('file', fs.createReadStream(imagePath));
            
            // Add metadata
            formData.append('pinataMetadata', JSON.stringify({
                name: `${brickType}_Brick_Image`,
                keyvalues: {
                    brickType: brickType,
                    uploadedAt: new Date().toISOString()
                }
            }));
            
            // Add options
            formData.append('pinataOptions', JSON.stringify({
                cidVersion: 1
            }));

            const response = await axios.post(
                `${this.baseURL}/pinning/pinFileToIPFS`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.secretKey,
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            const ipfsHash = response.data.IpfsHash;
            const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            console.log(`✅ ${brickType} image uploaded successfully!`);
            console.log(`   IPFS Hash: ${ipfsHash}`);
            console.log(`   Gateway URL: ${gatewayUrl}`);
            console.log('');

            return {
                success: true,
                brickType: brickType,
                ipfsHash: ipfsHash,
                gatewayUrl: gatewayUrl,
                fileName: path.basename(imagePath)
            };

        } catch (error) {
            console.error(`❌ Error uploading ${brickType} image:`, error.response?.data || error.message);
            return {
                success: false,
                brickType: brickType,
                error: error.response?.data || error.message
            };
        }
    }

    async verifyImage(url) {
        try {
            const response = await axios.head(url);
            if (response.status === 200) {
                console.log(`✅ Image verified: ${response.status} OK`);
                console.log(`   Content-Type: ${response.headers['content-type']}`);
                console.log(`   Content-Length: ${response.headers['content-length']} bytes`);
                return true;
            } else {
                console.log(`❌ Image verification failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Image verification error:`, error.message);
            return false;
        }
    }
}

async function uploadAllCorrectImages() {
    const uploader = new PinataImageUploader(PINATA_CONFIG);
    const imagesDir = path.join(__dirname, 'assets', 'images');
    
    console.log('🖼️ UPLOADING CORRECT META BRICK IMAGES TO PINATA');
    console.log('================================================\n');

    // Define the correct image mappings
    const imageMappings = [
        {
            type: 'regular',
            fileName: 'Regular_Brick_1.png',
            description: 'Regular brick image'
        },
        {
            type: 'industrial', 
            fileName: 'Industrial_Brick_1.png',
            description: 'Industrial brick image'
        },
        {
            type: 'legendary',
            fileName: 'Legendary_Brick_1.png', 
            description: 'Legendary brick image'
        }
    ];

    const results = [];
    
    for (const mapping of imageMappings) {
        const imagePath = path.join(imagesDir, mapping.fileName);
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            console.log(`⚠️ Image file not found: ${mapping.fileName}`);
            continue;
        }

        // Upload the image
        const uploadResult = await uploader.uploadImage(imagePath, mapping.type);
        results.push(uploadResult);

        if (uploadResult.success) {
            // Verify the uploaded image
            console.log(`🧪 Verifying uploaded ${mapping.type} image...`);
            await uploader.verifyImage(uploadResult.gatewayUrl);
            console.log('');
        }
    }

    // Summary
    console.log('📊 UPLOAD SUMMARY');
    console.log('=================\n');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful uploads: ${successful.length}`);
    console.log(`❌ Failed uploads: ${failed.length}\n`);

    if (successful.length > 0) {
        console.log('🎯 CORRECT IMAGE URLS FOR METADATA:');
        console.log('===================================');
        
        successful.forEach(result => {
            console.log(`${result.brickType.toUpperCase()}: ${result.gatewayUrl}`);
        });
        
        console.log('\n📝 NEXT STEPS:');
        console.log('1. Use these URLs to update metadata files');
        console.log('2. Create mass update script for all 433 bricks');
        console.log('3. Test minting with corrected images');
    }

    if (failed.length > 0) {
        console.log('\n❌ FAILED UPLOADS:');
        failed.forEach(result => {
            console.log(`${result.brickType}: ${result.error}`);
        });
    }

    return results;
}

if (require.main === module) {
    uploadAllCorrectImages().catch(console.error);
}

module.exports = { PinataImageUploader, uploadAllCorrectImages };
