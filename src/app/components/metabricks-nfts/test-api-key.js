const https = require('https');

// Test with API key + secret (old credentials that might have worked)
const API_KEY = '158156e0c27a05f29636';
const SECRET_KEY = 'vIZ-ipxtXBaHQNtWN2EEaeD_yXHevPezOiwkkGMy4c_zzgwx1BPtvBWGeiehHKa9';

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
            'pinata_secret_api_key': SECRET_KEY,
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${responseData}`);
                
                if (res.statusCode === 200) {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${responseData}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
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

// Run test
console.log('🧪 Testing API key + secret authentication with Pinata...\n');

testApiKeyAuth()
    .then(result => {
        console.log('✅ Authentication successful!');
        console.log('Result:', result);
    })
    .catch(error => {
        console.log('❌ Authentication failed:');
        console.log(error.message);
    });
