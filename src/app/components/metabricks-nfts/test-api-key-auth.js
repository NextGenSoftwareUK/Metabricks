const https = require('https');

// Test with API key + secret (alternative to JWT)
const API_KEY = '3e5fb97332d629f94989';
const SECRET_KEY = '1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7';

// Test metadata upload using API key + secret
async function testApiKeyAuth() {
    const testData = {
        name: "Test MetaBrick",
        description: "Testing API key authentication",
        timestamp: new Date().toISOString()
    };
    
    const postData = JSON.stringify(testData);
    
    const options = {
        hostname: 'api.pinata.cloud',
        port: 443,
        path: '/pinning/pinJSONToIPFS',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': API_KEY,
            'pinata_secret_api_key': SECRET_KEY
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`🧪 Testing API Key + Secret authentication...\n`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log(`\n✅ Authentication successful!`);
                    console.log(`🔑 IPFS Hash: ${result.IpfsHash}`);
                    console.log(`🔗 URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
                    resolve(result);
                } else {
                    console.log(`\n❌ Authentication failed:`);
                    console.log(`HTTP ${res.statusCode}: ${data}`);
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// Run the test
testApiKeyAuth()
    .then(() => {
        console.log('\n🎉 API Key + Secret authentication working!');
        console.log('💡 This method can be used instead of JWT.');
    })
    .catch((error) => {
        console.log('\n💡 If this also fails, you need to:');
        console.log('1. Go to Pinata Dashboard → API Keys');
        console.log('2. Check that your key has these scopes:');
        console.log('   • Pin File to IPFS');
        console.log('   • Pin JSON to IPFS');
        console.log('   • Pin by Hash');
        console.log('3. Or create a new API key with proper permissions');
    });
