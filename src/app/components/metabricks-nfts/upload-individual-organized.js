const fs = require('fs-extra');
const path = require('path');
const https = require('https');

// Pinata configuration
const PINATA_CONFIG = {
    apiKey: '3e5fb97332d629f94989',
    secretKey: '1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7'
};

// Private group ID for organized uploads
const PRIVATE_GROUP_ID = '0198fa7b-41b6-7dd5-9e00-bc3120f9e3ec';

// Brick image URLs (already on IPFS)
const BRICK_IMAGES = {
    regular: 'https://gateway.pinata.cloud/ipfs/bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4',
    industrial: 'https://gateway.pinata.cloud/ipfs/bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka',
    legendary: 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq'
};

// Function to determine brick type from brick ID
function getBrickType(brickId) {
    if (brickId >= 422 && brickId <= 432) return 'legendary';
    if (brickId >= 362 && brickId <= 421) return 'industrial';
    return 'regular'; // 1-361
}

// Function to upload a single file to Pinata
async function uploadFileToPinata(fileName, fileContent) {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2, 9);
        
        let body = Buffer.alloc(0);
        
        // Add metadata for the file
        const metadata = {
            name: `MetaBricks/${fileName}`,
            description: `MetaBrick #${fileName.replace('.json', '')} metadata`,
            keyvalues: {
                collection: 'MetaBricks',
                fileNumber: fileName.replace('.json', ''),
                strategy: 'Randomized Mystery',
                uploadDate: new Date().toISOString()
            }
        };
        
        // Add metadata
        body = Buffer.concat([body, Buffer.from(`--${boundary}\r\n`)]);
        body = Buffer.concat([body, Buffer.from('Content-Disposition: form-data; name="pinataMetadata"\r\n')]);
        body = Buffer.concat([body, Buffer.from('Content-Type: application/json\r\n\r\n')]);
        body = Buffer.concat([body, Buffer.from(JSON.stringify(metadata))]);
        body = Buffer.concat([body, Buffer.from('\r\n')]);
        
        // Add file content
        body = Buffer.concat([body, Buffer.from(`--${boundary}\r\n`)]);
        body = Buffer.concat([body, Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`)]);
        body = Buffer.concat([body, Buffer.from('Content-Type: application/json\r\n\r\n')]);
        body = Buffer.concat([body, fileContent]);
        body = Buffer.concat([body, Buffer.from('\r\n')]);
        
        // Add boundary end
        body = Buffer.concat([body, Buffer.from(`--${boundary}--\r\n`)]);
        
        const options = {
            hostname: 'api.pinata.cloud',
            port: 443,
            path: `/pinning/pinFileToIPFS?group=${PRIVATE_GROUP_ID}`,
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

// Function to upload all files with progress tracking
async function uploadAllMetaBricks() {
    try {
        console.log('🚀 Starting MetaBricks upload to private group: metabricks_jsons\n');
        console.log('🔒 All files will be organized in your private group\n');
        console.log('🎲 Maintaining randomized mystery strategy order\n');
        
        // Get randomized metadata directory
        const metadataDir = path.join(__dirname, 'pinata-upload-randomized');
        
        if (!await fs.pathExists(metadataDir)) {
            console.log('❌ Randomized directory not found:', metadataDir);
            return;
        }
        
        // Get all JSON files
        const files = await fs.readdir(metadataDir);
        const jsonFiles = files.filter(file => file.endsWith('.json')).sort((a, b) => {
            const numA = parseInt(a.replace('.json', ''));
            const numB = parseInt(b.replace('.json', ''));
            return numA - numB;
        });
        
        console.log(`📁 Found ${jsonFiles.length} metadata files to upload\n`);
        
        // Upload results tracking
        const uploadResults = [];
        let successCount = 0;
        let errorCount = 0;
        
        console.log('📤 Starting individual file uploads...\n');
        
        for (let i = 0; i < jsonFiles.length; i++) {
            const file = jsonFiles[i];
            const filePath = path.join(metadataDir, file);
            const uploadNumber = parseInt(file.replace('.json', ''));
            
            try {
                console.log(`🔄 Uploading ${file} (${i + 1}/${jsonFiles.length})...`);
                
                // Read and parse the JSON
                const content = await fs.readFile(filePath, 'utf8');
                const metadata = JSON.parse(content);
                
                // Extract the original brick ID from the name
                const nameMatch = metadata.name && metadata.name.match(/MetaBrick #(\d+)/);
                if (!nameMatch) {
                    console.log(`   ⚠️ Skipping ${file}: Invalid name format`);
                    continue;
                }
                
                const originalBrickId = parseInt(nameMatch[1]);
                const brickType = getBrickType(originalBrickId);
                
                // Update the image URL to use the correct brick type
                metadata.image = BRICK_IMAGES[brickType];
                
                // Add upload metadata
                metadata.uploadNumber = uploadNumber;
                metadata.originalBrickId = originalBrickId;
                metadata.brickType = brickType;
                metadata.uploadTimestamp = new Date().toISOString();
                
                // Upload to Pinata
                const uploadResult = await uploadFileToPinata(file, Buffer.from(JSON.stringify(metadata, null, 2)));
                
                // Track results
                const result = {
                    fileName: file,
                    uploadNumber,
                    originalBrickId,
                    brickType,
                    ipfsHash: uploadResult.IpfsHash,
                    pinataUrl: `https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`,
                    pinataName: uploadResult.Name,
                    fileSize: uploadResult.PinSize,
                    timestamp: uploadResult.Timestamp
                };
                
                uploadResults.push(result);
                successCount++;
                
                console.log(`   ✅ Uploaded! IPFS: ${uploadResult.IpfsHash.substring(0, 10)}...`);
                console.log(`      URL: https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`);
                
                // Progress update every 10 files
                if ((i + 1) % 10 === 0) {
                    console.log(`\n📊 Progress: ${i + 1}/${jsonFiles.length} files uploaded (${successCount} success, ${errorCount} errors)\n`);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                errorCount++;
                console.log(`   ❌ Failed to upload ${file}: ${error.message}`);
                
                // Add error to results
                uploadResults.push({
                    fileName: file,
                    uploadNumber: parseInt(file.replace('.json', '')),
                    error: error.message,
                    success: false
                });
            }
        }
        
        console.log('\n🎉 Upload process completed!\n');
        console.log('📊 Final Results:');
        console.log(`✅ Successfully uploaded: ${successCount} files`);
        console.log(`❌ Failed to upload: ${errorCount} files`);
        console.log(`📁 Total files processed: ${jsonFiles.length}`);
        
        // Save detailed results
        const resultsFile = path.join(__dirname, 'metabricks-individual-upload-results.json');
        const results = {
            uploadDate: new Date().toISOString(),
            summary: {
                totalFiles: jsonFiles.length,
                successCount,
                errorCount
            },
            files: uploadResults
        };
        
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        console.log(`\n📝 Detailed results saved to: ${resultsFile}`);
        
        // Show sample URLs
        console.log('\n🔗 Sample File URLs:');
        const successfulUploads = uploadResults.filter(r => r.ipfsHash);
        successfulUploads.slice(0, 5).forEach(result => {
            console.log(`   MetaBrick #${result.uploadNumber}: ${result.pinataUrl}`);
        });
        
        if (successfulUploads.length > 5) {
            console.log(`   ... and ${successfulUploads.length - 5} more files`);
        }
        
        // Show next steps
        console.log('\n🚀 Next Steps:');
        console.log('1. ✅ All MetaBricks metadata uploaded to private group');
        console.log('2. ✅ Files organized in metabricks_jsons group');
        console.log('3. ✅ Direct access to each file via IPFS URLs');
        console.log('4. ✅ Mystery strategy maintained perfectly');
        console.log('5. ✅ Ready for NFT minting!');
        
        console.log('\n💡 Benefits of this approach:');
        console.log('   • All files organized in one private group');
        console.log('   • Easy to manage and access');
        console.log('   • Professional and organized presentation');
        console.log('   • Private collection management');
        
        if (errorCount === 0) {
            console.log('\n🎉 All files uploaded successfully!');
        } else {
            console.log(`\n⚠️ ${errorCount} files failed to upload. Check the results file for details.`);
        }
        
    } catch (error) {
        console.error('❌ Error during upload process:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    uploadAllMetaBricks();
}

module.exports = {
    uploadAllMetaBricks,
    uploadFileToPinata
};
