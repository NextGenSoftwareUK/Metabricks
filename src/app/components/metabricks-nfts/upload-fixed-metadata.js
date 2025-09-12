const axios = require('axios');

// Pinata configuration
const PINATA_CONFIG = {
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmMTg4ODA1Ny0yZDRhLTQ1MzMtOWI4ZS0wZGMxYjEwNmM4YzMiLCJlbWFpbCI6Im1heC5nZXJzaGZpZWxkMUBnbWFpbC5jb20iLCJlbWFxYWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMiJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIiwidGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjFkYzZjNTYzZTdkYzc1YTYxM2ZiIiwic2NvcGVkS2V5U2VjcmV0IjoiNjBiODA5MmQ0NDQ3ZDExZjJjZjdlMTYwYzJjNjFlNjI1ZWJhNmZkNGFjNWIxODE2ZGU5OGEwMmRkNTllYWFkYyIsImV4cCI6MTc4NjUzNDU0NH0.564k1VU9XYgOTok3PvnyXg-Hgo4g0p4ZndOGLeZ7KWw'
};

// Create the corrected metadata object directly
const metadata = {
  "name": "MetaBrick #425",
  "symbol": "MBRICK",
  "description": "You have successfully removed a 'REGULAR' brick from the Metabricks wall. Perks will be revealed at specific destruction thresholds (10%, 25%, 50%, 75%, 100%).\n\nBy holding this Metabrick you are supporting construction of Metaverse systems via OASISWEB4 - thank you for your service.",
  "image": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq",
  "attributes": [
    {
      "trait_type": "Token Airdrop",
      "value": "Guaranteed",
      "description": "Token airdrop on TGE"
    },
    {
      "trait_type": "TGE Discount",
      "value": "20%",
      "description": "Token Generation Event discount"
    },
    {
      "trait_type": "Mystery",
      "value": "Mystery Perk #14",
      "description": "Mystery perk - will be revealed at 100% wall completion (432 bricks sold)",
      "rarity": "Mystery"
    },
    {
      "trait_type": "Mystery",
      "value": "Mystery Perk #11",
      "description": "Mystery perk - will be revealed at 75% wall completion (324 bricks sold)",
      "rarity": "Mystery"
    }
  ],
  "properties": {
    "files": [
      {
        "type": "image/png",
        "uri": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq"
      }
    ],
    "category": "image",
    "creators": [
      {
        "address": "85ArqfA2fy8spGcMGsSW7cbEJAWj26vewmmoG2bwkgT9",
        "share": 7
      }
    ]
  },
  "hiddenMetadata": {
    "type": "regular",
    "rarity": "Common"
  },
  "uploadTimestamp": new Date().toISOString(),
  "imageUrlFixed": true,
  "brickId": 425,
  "brickType": "regular"
};

// Upload corrected metadata for brick #425
async function uploadCorrectedMetadata() {
    try {
        console.log('🔧 Uploading corrected metadata for MetaBrick #425...\n');
        
        console.log('📄 Metadata image URL:');
        console.log(`   ${metadata.image}`);
        
        // Verify the image URL is correct (should have 'g' not 'q')
        const correctUrl = 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq';
        if (metadata.image === correctUrl) {
            console.log('✅ Image URL is correct!');
        } else {
            console.log('⚠️ Image URL needs correction...');
            metadata.image = correctUrl;
            console.log('🔧 Updated image URL to:');
            console.log(`   ${metadata.image}`);
        }
        
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
        
        return {
            brickId: 425,
            oldIpfsUrl: 'https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88',
            newIpfsHash: ipfsHash,
            newIpfsUrl: ipfsUrl,
            imageUrl: uploadedMetadata.image,
            uploadTimestamp: metadata.uploadTimestamp,
            success: true
        };
        
    } catch (error) {
        console.error('❌ Error uploading metadata:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// Run the upload
if (require.main === module) {
    uploadCorrectedMetadata().then(result => {
        if (result.success) {
            console.log('\n📄 Upload Results:');
            console.log(JSON.stringify(result, null, 2));
        }
    });
}

module.exports = { uploadCorrectedMetadata };
