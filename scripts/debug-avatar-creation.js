#!/usr/bin/env node

/**
 * Debug script to examine avatar creation response
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
    password: 'Uppermall1!',
    firstName: 'Max',
    lastName: 'Gershfield'
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

// Create avatar and examine response
async function debugAvatarCreation() {
  console.log('🔍 Debugging Avatar Creation Response');
  console.log('=' .repeat(50));
  
  try {
    const avatarData = {
      username: OASIS_CONFIG.SITE_AVATAR.username,
      email: OASIS_CONFIG.SITE_AVATAR.email,
      password: OASIS_CONFIG.SITE_AVATAR.password,
      confirmPassword: OASIS_CONFIG.SITE_AVATAR.password,
      firstName: OASIS_CONFIG.SITE_AVATAR.firstName,
      lastName: OASIS_CONFIG.SITE_AVATAR.lastName,
      avatarType: "User",
      acceptTerms: true
    };
    
    console.log('📤 Sending registration request...');
    console.log('   Username:', avatarData.username);
    console.log('   Email:', avatarData.email);
    
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/api/Avatar/register`, {
      method: 'POST'
    }, avatarData);
    
    console.log('\n📥 Registration Response:');
    console.log('   Status:', response.status);
    console.log('   Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Look for verification token in different possible locations
    console.log('\n🔍 Searching for verification token...');
    
    const possibleTokenPaths = [
      'verificationToken',
      'token',
      'avatar.verificationToken',
      'avatar.token',
      'result.verificationToken',
      'result.token',
      'data.verificationToken',
      'data.token'
    ];
    
    let foundToken = null;
    for (const path of possibleTokenPaths) {
      const value = getNestedValue(response.data, path);
      if (value) {
        console.log(`   ✅ Found token at '${path}':`, value.substring(0, 20) + '...');
        foundToken = value;
        break;
      }
    }
    
    if (!foundToken) {
      console.log('   ❌ No verification token found in response');
      console.log('   🔍 Checking all string fields for token-like values...');
      
      // Search for any string that looks like a verification token
      const allStrings = extractAllStrings(response.data);
      const tokenCandidates = allStrings.filter(str => 
        str.length > 30 && /^[A-F0-9]+$/i.test(str)
      );
      
      if (tokenCandidates.length > 0) {
        console.log('   🎯 Potential verification tokens found:');
        tokenCandidates.forEach((token, index) => {
          console.log(`      ${index + 1}. ${token.substring(0, 20)}...`);
        });
      } else {
        console.log('   ❌ No token-like strings found');
      }
    }
    
    return foundToken;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

// Helper function to extract all string values from an object
function extractAllStrings(obj, result = []) {
  if (typeof obj === 'string') {
    result.push(obj);
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      extractAllStrings(obj[key], result);
    }
  }
  return result;
}

// Main execution
async function main() {
  const token = await debugAvatarCreation();
  
  if (token) {
    console.log('\n🎉 Verification token found!');
    console.log('   You can now use this token to verify the email:');
    console.log(`   node scripts/verify-avatar-email.js "${token}"`);
  } else {
    console.log('\n💥 No verification token found in response');
    console.log('   You may need to check MongoDB manually');
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Debug failed:', error.message);
    process.exit(1);
  });
}

module.exports = { debugAvatarCreation };
