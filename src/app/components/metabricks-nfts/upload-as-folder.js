const fs = require('fs-extra');
const path = require('path');
const https = require('https');

// Pinata configuration
const PINATA_CONFIG = {
    apiKey: '3e5fb97332d629f94989',
    secretKey: '1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7'
};

// Brick image URLs (already on IPFS)
const BRICK_IMAGES = {
    regular: 'https://gateway.pinata.cloud/ipfs/bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4',
    industrial: 'https://gateway.pinata.cloud/ipfs/bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka',
    legendary: 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq'
};

// Function to determine brick type from brick ID
function getBrickType(brickId) {
    if (brickId >= 422 && brickId <= 432) return 'legendary';
    if (brickId >= 362 && brickId <= 421) return 'industrial';
    return 'regular'; // 1-361
}

// Function to create multipart form data for folder upload
function createFolderFormData(files) {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2, 9);
    let body = Buffer.alloc(0);
    
    // Add metadata for folder structure
    const folderMetadata = {
        name: 'MetaBricks-Collection',
        description: 'Complete MetaBricks NFT collection with randomized mystery strategy',
        keyvalues: {
            collection: 'MetaBricks',
            totalFiles: files.length.toString(),
            strategy: 'Randomized Mystery',
            uploadDate: new Date().toISOString()
        }
    };
    
    // Add folder metadata
    body = Buffer.concat([body, Buffer.from(`--${boundary}\r\n`)]);
    body = Buffer.concat([body, Buffer.from('Content-Disposition: form-data; name="pinataMetadata"\r\n')]);
    body = Buffer.concat([body, Buffer.from('Content-Type: application/json\r\n\r\n')]);
    body = Buffer.concat([body, Buffer.from(JSON.stringify(folderMetadata))]);
    body = Buffer.concat([body, Buffer.from('\r\n')]);
    
    // Add each file
    files.forEach((fileInfo, index) => {
        body = Buffer.concat([body, Buffer.from(`--${boundary}\r\n`)]);
        body = Buffer.concat([body, Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileInfo.fileName}"\r\n`)]);
        body = Buffer.concat([body, Buffer.from('Content-Type: application/json\r\n\r\n')]);
        body = Buffer.concat([body, fileInfo.content]);
        body = Buffer.concat([body, Buffer.from('\r\n')]);
    });
    
    // Add boundary end
    body = Buffer.concat([body, Buffer.from(`--${boundary}--\r\n`)]);
    
    return { body, boundary };
}

// Function to upload folder to Pinata
async function uploadFolderToPinata(files) {
    return new Promise((resolve, reject) => {
        const { body, boundary } = createFolderFormData(files);
        
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

// Main function to upload all metadata as a folder
async function uploadMetaBricksFolder() {
    try {
        console.log('🚀 Starting MetaBricks folder upload to Pinata...\n');
        console.log('📁 This will create a single organized folder containing all 432 metadata files\n');
        console.log('🎲 Files will be organized in randomized order for mystery strategy\n');
        
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
        
        console.log(`📁 Found ${jsonFiles.length} metadata files to organize into folder\n`);
        
        // Prepare files for upload
        const uploadFiles = [];
        let processedCount = 0;
        
        console.log('🔄 Preparing files for folder upload...\n');
        
        for (const file of jsonFiles) {
            const filePath = path.join(metadataDir, file);
            const uploadNumber = parseInt(file.replace('.json', ''));
            
            try {
                // Read and parse the JSON
                const content = await fs.readFile(filePath, 'utf8');
                const metadata = JSON.parse(content);
                
                // Extract the original brick ID from the name
                const nameMatch = metadata.name.match(/MetaBrick #(\d+)/);
                if (!nameMatch) {
                    console.log(`   ⚠️ Skipping ${file}: Could not extract brick ID`);
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
                
                // Create file info for upload
                const fileInfo = {
                    fileName: `${uploadNumber}.json`,
                    content: Buffer.from(JSON.stringify(metadata, null, 2)),
                    uploadNumber,
                    originalBrickId,
                    brickType
                };
                
                uploadFiles.push(fileInfo);
                processedCount++;
                
                if (processedCount % 50 === 0) {
                    console.log(`   📋 Processed ${processedCount}/${jsonFiles.length} files...`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error processing ${file}: ${error.message}`);
            }
        }
        
        console.log(`\n✅ Successfully prepared ${uploadFiles.length} files for upload\n`);
        
        if (uploadFiles.length === 0) {
            console.log('❌ No files prepared for upload');
            return;
        }
        
        // Upload the entire folder
        console.log('📤 Uploading MetaBricks collection folder to Pinata...\n');
        console.log('⏳ This may take a few minutes for 432 files...\n');
        
        const uploadResult = await uploadFolderToPinata(uploadFiles);
        
        console.log('🎉 Folder upload successful!\n');
        console.log('📊 Upload Results:');
        console.log(`   🔑 IPFS Hash: ${uploadResult.IpfsHash}`);
        console.log(`   📁 Total Files: ${uploadResult.NumberOfFiles}`);
        console.log(`   📏 Total Size: ${uploadResult.PinSize} bytes`);
        console.log(`   🕒 Timestamp: ${uploadResult.Timestamp}`);
        
        // Create access URLs
        const baseUrl = `https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`;
        console.log(`\n🔗 Collection Base URL: ${baseUrl}`);
        
        // Show sample file URLs
        console.log('\n📋 Sample File URLs:');
        uploadFiles.slice(0, 5).forEach(fileInfo => {
            console.log(`   MetaBrick #${fileInfo.uploadNumber}: ${baseUrl}/${fileInfo.fileName}`);
        });
        
        if (uploadFiles.length > 5) {
            console.log(`   ... and ${uploadFiles.length - 5} more files`);
        }
        
        // Save upload results
        const resultsFile = path.join(__dirname, 'metabricks-folder-upload-results.json');
        const results = {
            uploadDate: new Date().toISOString(),
            ipfsHash: uploadResult.IpfsHash,
            totalFiles: uploadResult.NumberOfFiles,
            totalSize: uploadResult.PinSize,
            baseUrl: baseUrl,
            files: uploadFiles.map(f => ({
                uploadNumber: f.uploadNumber,
                originalBrickId: f.originalBrickId,
                brickType: f.brickType,
                fileName: f.fileName,
                url: `${baseUrl}/${f.fileName}`
            }))
        };
        
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        console.log(`\n📝 Upload results saved to: ${resultsFile}`);
        
        // Show next steps
        console.log('\n🚀 Next Steps:');
        console.log('1. ✅ All MetaBricks metadata uploaded as organized folder');
        console.log('2. ✅ Single IPFS hash for entire collection');
        console.log('3. ✅ Files organized and accessible via URLs');
        console.log('4. ✅ Use the base URL for your MetaBricks configuration');
        console.log('5. ✅ Ready for NFT minting with mystery strategy!');
        
        console.log('\n💡 Benefits of this approach:');
        console.log('   • Organized in single folder (not scattered)');
        console.log('   • One IPFS hash for entire collection');
        console.log('   • Easy to manage and reference');
        console.log('   • Professional presentation');
        
    } catch (error) {
        console.error('❌ Error during folder upload:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    uploadMetaBricksFolder();
}

module.exports = {
    uploadMetaBricksFolder,
    uploadFolderToPinata
};
