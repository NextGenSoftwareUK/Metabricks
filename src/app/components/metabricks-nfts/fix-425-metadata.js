const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Pinata configuration
const PINATA_CONFIG = {
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmMTg4ODA1Ny0yZDRhLTQ1MzMtOWI4ZS0wZGMxYjEwNmM4YzMiLCJlbWFpbCI6Im1heC5nZXJzaGZpZWxkMUBnbWFpbC5jb20iLCJlbWFxYWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMiJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIiwidGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjFkYzZjNTYzZTdkYzc1YTYxM2ZiIiwic2NvcGVkS2V5U2VjcmV0IjoiNjBiODA5MmQ0NDQ3ZDExZjJjZjdlMTYwYzJjNjFlNjI1ZWJhNmZkNGFjNWIxODE2ZGU5OGEwMmRkNTllYWFkYyIsImV4cCI6MTc4NjUzNDU0NH0.564k1VU9XYgOTok3PvnyXg-Hgo4g0p4ZndOGLeZ7KWw'
};

// Upload corrected metadata for brick #425
async function uploadCorrectedMetadata() {
    try {
        console.log('🔧 Uploading corrected metadata for MetaBrick #425...\n');
        
        // Read the corrected metadata file
        const metadataPath = path.join(__dirname, 'metadata_425_fixed.json');
        const content = await fs.readFile(metadataPath, 'utf8');
        
        // Clean the content to ensure proper JSON formatting
        const cleanedContent = content.trim().replace(/\r\n/g, '\n');
        
        console.log('📄 Raw file content length:', cleanedContent.length);
        console.log('📄 First 200 characters:', cleanedContent.substring(0, 200));
        
        const metadata = JSON.parse(cleanedContent);
        
        console.log('📄 Current metadata image URL:');
        console.log(`   ${metadata.image}`);
        
        // Verify the image URL is correct (should have 'g' not 'q')
        const correctUrl = 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq';
        if (metadata.image === correctUrl) {
            console.log('✅ Image URL is already correct!');
        } else {
            console.log('⚠️ Image URL needs correction...');
            metadata.image = correctUrl;
            console.log('🔧 Updated image URL to:');
            console.log(`   ${metadata.image}`);
        }
        
        // Add upload timestamp
        metadata.uploadTimestamp = new Date().toISOString();
        metadata.imageUrlFixed = true;
        
        // Upload to Pinata
        console.log('\n📤 Uploading to Pinata...');
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            metadata,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PINATA_CONFIG.jwt}`
                }
            }
        );
        
        const ipfsHash = response.data.IpfsHash;
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        
        console.log('\n✅ Upload successful!');
        console.log(`🔑 IPFS Hash: ${ipfsHash}`);
        console.log(`🔗 IPFS URL: ${ipfsUrl}`);
        
        // Test the uploaded metadata
        console.log('\n🧪 Testing uploaded metadata...');
        const testResponse = await axios.get(ipfsUrl);
        const uploadedMetadata = testResponse.data;
        
        console.log(`📄 Uploaded metadata name: ${uploadedMetadata.name}`);
        console.log(`🖼️ Uploaded image URL: ${uploadedMetadata.image}`);
        
        // Test the image URL
        console.log('\n🖼️ Testing image URL...');
        const imageResponse = await axios.head(uploadedMetadata.image);
        console.log(`✅ Image accessible: ${imageResponse.status} ${imageResponse.statusText}`);
        console.log(`📊 Content-Type: ${imageResponse.headers['content-type']}`);
        console.log(`📏 Content-Length: ${imageResponse.headers['content-length']} bytes`);
        
        console.log('\n🎉 Metadata upload complete!');
        console.log('\n📝 Next steps:');
        console.log('1. Update your MetaBricks backend to use the new IPFS URL:');
        console.log(`   ${ipfsUrl}`);
        console.log('2. Test minting a new NFT with the corrected metadata');
        console.log('3. Verify the PNG image displays correctly on Solana explorer');
        
        // Save the results
        const results = {
            brickId: 425,
            oldIpfsUrl: 'https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88',
            newIpfsHash: ipfsHash,
            newIpfsUrl: ipfsUrl,
            imageUrl: uploadedMetadata.image,
            uploadTimestamp: metadata.uploadTimestamp,
            success: true
        };
        
        await fs.writeFile(
            path.join(__dirname, 'metadata-425-fix-results.json'),
            JSON.stringify(results, null, 2)
        );
        
        console.log('\n📄 Results saved to: metadata-425-fix-results.json');
        
    } catch (error) {
        console.error('❌ Error uploading metadata:', error.response?.data || error.message);
    }
}

// Run the upload
if (require.main === module) {
    uploadCorrectedMetadata();
}

module.exports = { uploadCorrectedMetadata };
