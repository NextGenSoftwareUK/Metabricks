const https = require('https');

// Test JWT token
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmMTg4ODA1Ny0yZDRhLTQ1MzMtOWI4ZS0wZGMxYjEwNmM4YzMiLCJlbWFpbCI6Im1heC5nZXJzaGZpZWxkMUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMWVhMTgyOTc0MjJjNzRhZjQ4ZGUiLCJzY29wZWRLZXlTZWNyZXQiOiI0NDZlZWUxNDJiOGYzYzBhNzg4M2Y4ODQ2MDMxMTAxYzY2YmJmOWMyNTA1NzY0OTUwMjg3MjdkYjM0MTg3YWJmIiwiZXhwIjoxNzg4MDQ4NTQ1fQ.zpUuivPNlMr2uzUaCPRVFtFUnJSlQEkjuQVB0AXNSt8';

// Test metadata upload
async function testMetadataUpload() {
    const testData = {
        name: "Test MetaBrick",
        description: "Testing JWT authentication",
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
            'Authorization': `Bearer ${JWT_TOKEN}`,
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
console.log('🧪 Testing JWT authentication with Pinata...\n');

testMetadataUpload()
    .then(result => {
        console.log('✅ Authentication successful!');
        console.log('Result:', result);
    })
    .catch(error => {
        console.log('❌ Authentication failed:');
        console.log(error.message);
    });
