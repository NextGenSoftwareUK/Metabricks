const fs = require('fs-extra');
const path = require('path');
const https = require('https');

// Pinata configuration
const PINATA_CONFIG = {
    apiKey: '3e5fb97332d629f94989',
    secretKey: '1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmMTg4ODA1Ny0yZDRhLTQ1MzMtOWI4ZS0wZGMxYjEwNmM4YzMiLCJlbWFpbCI6Im1heC5nZXJzaGZpZWxkMUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiM2U1ZmI5NzMzMmQ2MjlmOTQ5ODkiLCJzY29wZWRLZXlTZWNyZXQiOiIxZGRiNDA2NjZiYzNlYmE1ODkyNGI5MjA5NGY4NWZhYzQ2YWI1OGQzZmJhNTZmMGE0ZTE3ZTE5MmRjNzM5M2I3IiwiZXhwIjoxNzg4MDg0MTA1fQ.Ci0NKC3l6TOX2TYn16pAZBss1Ms9YlKeKm0wsHs_vFk'
};

// Brick image file paths
const BRICK_IMAGE_FILES = {
    regular: path.join(__dirname, 'assets', 'images', 'Regular_Brick_1.png'),
    industrial: path.join(__dirname, 'assets', 'images', 'Industrial_Brick_1.png'),
    legendary: path.join(__dirname, 'assets', 'images', 'Legendary_Brick_1.png')
};

// Brick image URLs (using existing uploaded images)
const BRICK_IMAGES = {
    regular: 'https://gateway.pinata.cloud/ipfs/bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4',
    industrial: 'https://gateway.pinata.cloud/ipfs/bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka',
    legendary: 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq'
};

// Simple HTTP POST function using built-in https
function makeRequest(url, data, headers) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'api.pinata.cloud',
            port: 443,
            path: '/pinning/pinJSONToIPFS',
            method: 'POST',
                    headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': PINATA_CONFIG.apiKey,
            'pinata_secret_api_key': PINATA_CONFIG.secretKey,
            'Content-Length': Buffer.byteLength(postData)
        }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode === 200) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || 'Unknown error'}`));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${responseData}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// Upload PNG image to Pinata
async function uploadImageToPinata(filePath, fileName) {
    return new Promise((resolve, reject) => {
        const fileData = fs.readFileSync(filePath);
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2, 9);
        
        let body = Buffer.alloc(0);
        
        // Add boundary start
        body = Buffer.concat([body, Buffer.from(`--${boundary}\r\n`)]);
        
        // Add file header
        body = Buffer.concat([body, Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`)]);
        body = Buffer.concat([body, Buffer.from(`Content-Type: image/png\r\n\r\n`)]);
        
        // Add file data
        body = Buffer.concat([body, fileData]);
        
        // Add boundary end
        body = Buffer.concat([body, Buffer.from(`\r\n--${boundary}--\r\n`)]);
        
        const options = {
            hostname: 'api.pinata.cloud',
            port: 443,
            path: '/pinning/pinFileToIPFS',
            method: 'POST',
                    headers: {
            'pinata_api_key': PINATA_CONFIG.apiKey,
            'pinata_secret_api_key': PINATA_CONFIG.secretKey,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length
        }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode === 200) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || 'Unknown error'}`));
                    }
                } catch (e) {
                    console.log(`Debug - Raw response: ${responseData}`);
                    reject(new Error(`Failed to parse response: ${responseData}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(body);
        req.end();
    });
}

// Upload JSON metadata to Pinata
async function uploadToPinata(metadata) {
    try {
        const response = await makeRequest('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata);
        
        return {
            success: true,
            ipfsHash: response.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.IpfsHash}`
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}



// Display brick image URLs
function displayBrickImages() {
    console.log('🖼️  Using existing brick images on Pinata:\n');
    
    for (const [brickType, url] of Object.entries(BRICK_IMAGES)) {
        console.log(`   ${brickType}: ${url}`);
    }
    console.log('');
}

// Main upload function
async function uploadAllMetaBricks() {
    const metadataDir = path.join(__dirname, 'pinata-upload-randomized');
    
    try {
        console.log('🚀 Starting MetaBricks RANDOMIZED metadata upload to Pinata...\n');
        console.log('🎲 This will upload the mystery strategy files (1-432 in randomized order)\n');
        
        // Display existing brick image URLs
        displayBrickImages();
        
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
        
        console.log(`📁 Found ${jsonFiles.length} JSON files to upload\n`);
        
        // Calculate estimated time (200ms delay between uploads)
        const estimatedTimeMinutes = Math.round((jsonFiles.length * 0.2) / 60);
        console.log(`⏱️  Estimated upload time: ~${estimatedTimeMinutes} minutes (200ms delay between uploads)\n`);
        
        let successCount = 0;
        let errorCount = 0;
        const uploadResults = [];
        
        // Process each JSON file
        for (const file of jsonFiles) {
            const filePath = path.join(metadataDir, file);
            const brickId = parseInt(file.replace('.json', ''));
            
            console.log(`🔄 Processing ${file} (Brick #${brickId})...`);
            
            try {
                // Read and parse the JSON
                const content = await fs.readFile(filePath, 'utf8');
                const metadata = JSON.parse(content);
                
                // Determine brick type from hiddenMetadata
                const brickType = metadata.hiddenMetadata?.type || 'regular';
                
                // Update the image URL to use the correct brick type
                metadata.image = BRICK_IMAGES[brickType];
                
                // Add upload timestamp and brick info
                metadata.uploadTimestamp = new Date().toISOString();
                metadata.brickId = brickId;
                metadata.brickType = brickType;
                
                // Upload to Pinata
                console.log(`   📤 Uploading to Pinata...`);
                const uploadResult = await uploadToPinata(metadata);
                
                if (uploadResult.success) {
                    successCount++;
                    console.log(`   ✅ Upload successful! IPFS Hash: ${uploadResult.ipfsHash}`);
                    console.log(`   🔗 URL: ${uploadResult.url}`);
                    
                    uploadResults.push({
                        brickId,
                        brickType,
                        ipfsHash: uploadResult.ipfsHash,
                        url: uploadResult.url,
                        file: file
                    });
                    
                    // Add minimal delay for premium account (200ms instead of 1000ms)
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
                    errorCount++;
                    console.log(`   ❌ Upload failed: ${uploadResult.error}`);
                }
                
            } catch (error) {
                errorCount++;
                console.log(`   ❌ Processing failed: ${error.message}`);
            }
            
            console.log('');
        }
        
        // Summary
        console.log('📊 Upload Summary:');
        console.log(`✅ Successfully uploaded: ${successCount} files`);
        console.log(`❌ Failed to upload: ${errorCount} files`);
        console.log(`📁 Total files processed: ${jsonFiles.length}`);
        
        // Save upload results to file
        const resultsFile = path.join(__dirname, 'pinata-upload-results.json');
        await fs.writeFile(resultsFile, JSON.stringify(uploadResults, null, 2));
        console.log(`\n📝 Upload results saved to: ${resultsFile}`);
        
        // Show sample results
        if (uploadResults.length > 0) {
            console.log('\n🎯 Sample Upload Results:');
            uploadResults.slice(0, 5).forEach(result => {
                console.log(`• Brick #${result.brickId} (${result.brickType}): ${result.ipfsHash}`);
            });
            
            if (uploadResults.length > 5) {
                console.log(`   ... and ${uploadResults.length - 5} more`);
            }
        }
        
        // Show next steps
        console.log('\n🚀 Next Steps:');
        console.log('1. All MetaBricks are now on IPFS via Pinata');
        console.log('2. Each JSON is linked to the correct brick image');
        console.log('3. Use the IPFS hashes for your NFT minting');
        console.log('4. The verificationHash ensures authenticity');
        console.log('5. Ready for your MetaBricks wall launch!');
        
        if (errorCount === 0) {
            console.log('\n🎉 All MetaBricks successfully uploaded to Pinata!');
        } else {
            console.log('\n⚠️ Some uploads failed. Check the errors above.');
        }
        
    } catch (error) {
        console.error('❌ Error during upload process:', error);
    }
}

// Test Pinata connection
async function testPinataConnection() {
    console.log('🔗 Testing Pinata connection...\n');
    
    try {
        // Display brick image URLs
        displayBrickImages();
        
        // Test metadata upload
        const testMetadata = {
            name: "Test MetaBrick",
            description: "Testing Pinata connection",
            timestamp: new Date().toISOString()
        };
        
        const result = await uploadToPinata(testMetadata);
        
        if (result.success) {
            console.log('✅ Pinata connection successful!');
            console.log(`🔗 Test upload: ${result.url}`);
            console.log(`🔑 IPFS Hash: ${result.ipfsHash}`);
            console.log('\n🚀 Ready to upload MetaBricks!');
        } else {
            console.log('❌ Pinata connection failed:');
            console.log(`   Error: ${result.error}`);
            console.log('\n🔧 Please check your API keys and try again.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Export functions
module.exports = {
    uploadAllMetaBricks,
    testPinataConnection
};

// Run if executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        testPinataConnection();
    } else {
        uploadAllMetaBricks();
    }
}
