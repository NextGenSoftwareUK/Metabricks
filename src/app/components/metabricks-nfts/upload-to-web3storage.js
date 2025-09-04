const fs = require('fs-extra');
const path = require('path');
const { Web3Storage, File } = require('web3.storage');

// Web3.Storage configuration
const WEB3_STORAGE_TOKEN = process.env.WEB3_STORAGE_TOKEN || 'YOUR_WEB3_STORAGE_TOKEN_HERE';

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

// Function to create Web3.Storage client
function makeStorageClient() {
    if (!WEB3_STORAGE_TOKEN || WEB3_STORAGE_TOKEN === 'YOUR_WEB3_STORAGE_TOKEN_HERE') {
        throw new Error('❌ WEB3_STORAGE_TOKEN not set. Please set your Web3.Storage API token.');
    }
    return new Web3Storage({ token: WEB3_STORAGE_TOKEN });
}

// Function to upload a single metadata file
async function uploadMetadataFile(client, filePath, uploadNumber) {
    try {
        // Read and parse the JSON
        const content = await fs.readFile(filePath, 'utf8');
        const metadata = JSON.parse(content);
        
        // Extract the original brick ID from the name
        const nameMatch = metadata.name.match(/MetaBrick #(\d+)/);
        if (!nameMatch) {
            throw new Error('Could not extract brick ID from name');
        }
        
        const originalBrickId = parseInt(nameMatch[1]);
        const brickType = getBrickType(originalBrickId);
        
        // Create file object for Web3.Storage
        const fileName = `${uploadNumber}.json`;
        const file = new File([JSON.stringify(metadata, null, 2)], fileName, {
            type: 'application/json'
        });
        
        // Upload to Web3.Storage
        const cid = await client.put([file], {
            name: `MetaBrick-${uploadNumber}`,
            maxRetries: 3
        });
        
        // Create the IPFS URL
        const ipfsUrl = `https://${cid}.ipfs.dweb.link/${fileName}`;
        
        return {
            success: true,
            uploadNumber,
            originalBrickId,
            brickType,
            cid: cid.toString(),
            ipfsUrl,
            fileName
        };
        
    } catch (error) {
        return {
            success: false,
            uploadNumber,
            error: error.message
        };
    }
}

// Function to upload all randomized metadata files
async function uploadAllMetadata() {
    try {
        console.log('🚀 Starting Web3.Storage upload for MetaBricks...\n');
        
        // Check if Web3.Storage token is set
        if (!WEB3_STORAGE_TOKEN || WEB3_STORAGE_TOKEN === 'YOUR_WEB3_STORAGE_TOKEN_HERE') {
            console.log('❌ WEB3_STORAGE_TOKEN not configured!');
            console.log('\n📋 To get your Web3.Storage token:');
            console.log('1. Go to https://web3.storage/');
            console.log('2. Sign up for a free account');
            console.log('3. Create an API token');
            console.log('4. Set it as an environment variable:');
            console.log('   export WEB3_STORAGE_TOKEN="your_token_here"');
            console.log('   or add it to your .env file');
            console.log('\n💡 Web3.Storage offers:');
            console.log('   • Free tier: 5GB storage');
            console.log('   • No authentication issues');
            console.log('   • Reliable IPFS hosting');
            console.log('   • Simple API');
            return;
        }
        
        // Create Web3.Storage client
        const client = makeStorageClient();
        console.log('✅ Web3.Storage client created successfully\n');
        
        // Get randomized metadata directory
        const randomizedDir = path.join(__dirname, 'pinata-upload-randomized');
        
        if (!await fs.pathExists(randomizedDir)) {
            console.log('❌ Randomized directory not found:', randomizedDir);
            return;
        }
        
        // Get all JSON files
        const files = await fs.readdir(randomizedDir);
        const jsonFiles = files.filter(file => file.endsWith('.json')).sort((a, b) => {
            const numA = parseInt(a.replace('.json', ''));
            const numB = parseInt(b.replace('.json', ''));
            return numA - numB;
        });
        
        console.log(`📁 Found ${jsonFiles.length} randomized metadata files to upload\n`);
        
        let successCount = 0;
        let errorCount = 0;
        const results = [];
        const uploadPromises = [];
        
        // Process files in batches to avoid overwhelming the API
        const BATCH_SIZE = 10;
        
        for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
            const batch = jsonFiles.slice(i, i + BATCH_SIZE);
            
            console.log(`🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(jsonFiles.length/BATCH_SIZE)} (${batch.length} files)...`);
            
            const batchPromises = batch.map(async (file) => {
                const filePath = path.join(randomizedDir, file);
                const uploadNumber = parseInt(file.replace('.json', ''));
                
                const result = await uploadMetadataFile(client, filePath, uploadNumber);
                
                if (result.success) {
                    successCount++;
                    console.log(`   ✅ Upload #${result.uploadNumber}: Brick #${result.originalBrickId} (${result.brickType})`);
                    console.log(`      CID: ${result.cid}`);
                    console.log(`      URL: ${result.ipfsUrl.substring(0, 60)}...`);
                    results.push(result);
                } else {
                    errorCount++;
                    console.log(`   ❌ Upload #${result.uploadNumber}: ${result.error}`);
                }
                
                return result;
            });
            
            // Wait for batch to complete
            await Promise.all(batchPromises);
            
            // Small delay between batches
            if (i + BATCH_SIZE < jsonFiles.length) {
                console.log('   ⏳ Waiting 2 seconds before next batch...\n');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Summary
        console.log('\n📊 Upload Summary:');
        console.log(`✅ Successfully uploaded: ${successCount} files`);
        console.log(`❌ Failed to upload: ${errorCount} files`);
        console.log(`📁 Total files processed: ${jsonFiles.length}`);
        
        if (successCount > 0) {
            // Show sample results
            console.log('\n🔗 Sample IPFS URLs:');
            results.slice(0, 5).forEach(result => {
                console.log(`   MetaBrick #${result.uploadNumber}: ${result.ipfsUrl}`);
            });
            
            // Save results to file
            const resultsFile = path.join(__dirname, 'web3storage-upload-results.json');
            await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
            console.log(`\n📝 Upload results saved to: ${resultsFile}`);
            
            // Show next steps
            console.log('\n🚀 Next Steps:');
            console.log('1. ✅ All MetaBricks uploaded to IPFS via Web3.Storage');
            console.log('2. ✅ Use the IPFS URLs for your NFT minting');
            console.log('3. ✅ Metadata is now permanently stored on IPFS');
            console.log('4. ✅ No more authentication issues!');
            
            // Create a summary file with all URLs
            const summaryFile = path.join(__dirname, 'metabricks-ipfs-summary.json');
            const summary = {
                uploadDate: new Date().toISOString(),
                totalFiles: successCount,
                brickType: 'MetaBricks',
                ipfsGateway: 'https://dweb.link/ipfs/',
                metadata: results.map(r => ({
                    uploadNumber: r.uploadNumber,
                    originalBrickId: r.originalBrickId,
                    brickType: r.brickType,
                    cid: r.cid,
                    ipfsUrl: r.ipfsUrl
                }))
            };
            
            await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
            console.log(`📋 IPFS summary saved to: ${summaryFile}`);
        }
        
        if (errorCount === 0) {
            console.log('\n🎉 All MetaBricks successfully uploaded to IPFS!');
        } else {
            console.log('\n⚠️ Some uploads failed. Check the errors above.');
        }
        
    } catch (error) {
        console.error('❌ Error during upload process:', error);
    }
}

// Function to test Web3.Storage connection
async function testConnection() {
    try {
        console.log('🧪 Testing Web3.Storage connection...\n');
        
        if (!WEB3_STORAGE_TOKEN || WEB3_STORAGE_TOKEN === 'YOUR_WEB3_STORAGE_TOKEN_HERE') {
            console.log('❌ WEB3_STORAGE_TOKEN not set');
            return false;
        }
        
        const client = makeStorageClient();
        
        // Test with a simple file
        const testFile = new File(['Hello MetaBricks!'], 'test.txt', {
            type: 'text/plain'
        });
        
        console.log('📤 Uploading test file...');
        const cid = await client.put([testFile], {
            name: 'MetaBricks-Test',
            maxRetries: 3
        });
        
        console.log('✅ Connection successful!');
        console.log(`🔗 Test file uploaded: https://${cid}.ipfs.dweb.link/test.txt`);
        console.log(`🔑 CID: ${cid}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    }
}

// Main execution
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'test') {
        testConnection();
    } else if (command === 'upload') {
        uploadAllMetadata();
    } else {
        console.log('🚀 MetaBricks Web3.Storage Upload Script\n');
        console.log('Usage:');
        console.log('  node upload-to-web3storage.js test    - Test Web3.Storage connection');
        console.log('  node upload-to-web3storage.js upload  - Upload all metadata files');
        console.log('\n💡 Make sure to set WEB3_STORAGE_TOKEN environment variable first!');
    }
}

module.exports = {
    uploadAllMetadata,
    testConnection,
    makeStorageClient
};
