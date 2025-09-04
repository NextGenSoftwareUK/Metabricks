#!/usr/bin/env node

/**
 * Test authentication with existing avatar
 */

const https = require('https');
const http = require('http');

// Configuration
const OASIS_CONFIG = {
  BASE_URL: 'https://localhost:5002',
  USE_HTTPS: true,
  SITE_AVATAR: {
    username: 'metabricks_admin',
    email: 'max.gershfield1@gmail.com',
    password: 'Uppermall1!'
  }
};

// Helper function to make HTTP/HTTPS requests
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // For HTTPS, ignore self-signed certificate errors
    if (isHttps) {
      requestOptions.rejectUnauthorized = false;
    }

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test authentication
async function testAuthentication() {
  console.log('🔐 Testing Authentication with Existing Avatar');
  console.log('=' .repeat(50));
  
  try {
    const loginData = {
      username: OASIS_CONFIG.SITE_AVATAR.username,
      password: OASIS_CONFIG.SITE_AVATAR.password
    };
    
    console.log('📤 Sending authentication request...');
    console.log('   Username:', loginData.username);
    
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/api/Avatar/authenticate`, {
      method: 'POST'
    }, loginData);
    
    console.log('\n📥 Authentication Response:');
    console.log('   Status:', response.status);
    console.log('   Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      if (response.data.success && response.data.token) {
        console.log('\n🎉 Authentication successful!');
        console.log('   JWT Token:', response.data.token.substring(0, 50) + '...');
        console.log('   Avatar is already verified and ready to use!');
        return response.data.token;
      } else {
        console.log('\n❌ Authentication failed - no token in response');
        return null;
      }
    } else {
      console.log('\n❌ Authentication failed');
      console.log('   Status:', response.status);
      console.log('   Message:', response.data.result?.message || 'Unknown error');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  const token = await testAuthentication();
  
  if (token) {
    console.log('\n✅ Avatar is ready for use!');
    console.log('   You can now use this avatar for NFT minting operations.');
  } else {
    console.log('\n💥 Authentication failed');
    console.log('   The avatar may need email verification or the password is incorrect.');
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testAuthentication };
