#!/usr/bin/env node

/**
 * Script to create OASIS site avatar for MetaBricks NFT minting
 * Run this script to set up the site-wide avatar that will handle all NFT minting
 */

const https = require('https');
const http = require('http');

// Configuration
const OASIS_CONFIG = {
  // Update these values for your OASIS instance
  BASE_URL: 'https://localhost:5002', // Change to your OASIS API URL
  USE_HTTPS: true, // Set to false if using HTTP
  
  // Site avatar details
  SITE_AVATAR: {
    username: 'metabricks_admin',
    email: 'max.gershfield1@gmail.com',
    password: 'Uppermall1!', // Correct password
    firstName: 'Max',
    lastName: 'Gershfield',
    description: 'MetaBricks admin avatar for NFT minting operations'
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

// Step 1: Test OASIS API connection
async function testOASISConnection() {
  console.log('🔍 Testing OASIS API connection...');
  
  try {
    // Test with a simple endpoint that exists
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/swagger/v1/swagger.json`, {});
    
    if (response.status === 200 || response.status === 401) {
      console.log('✅ OASIS API connection successful!');
      console.log('   Status:', response.status);
      console.log('   Note: 401 is expected for unauthenticated requests');
      return true;
    } else {
      console.log('❌ OASIS API connection failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ OASIS API connection error:', error.message);
    return false;
  }
}

// Step 2: Create site avatar
async function createSiteAvatar() {
  console.log('\n👤 Creating MetaBricks site avatar...');
  
  try {
    const avatarData = {
      username: OASIS_CONFIG.SITE_AVATAR.username,
      email: OASIS_CONFIG.SITE_AVATAR.email,
      password: OASIS_CONFIG.SITE_AVATAR.password,
      confirmPassword: OASIS_CONFIG.SITE_AVATAR.password,
      firstName: "Meta",
      lastName: "Bricks",
      avatarType: "User",
      acceptTerms: true
    };
    
    console.log('   Username:', avatarData.username);
    console.log('   Email:', avatarData.email);
    console.log('   Avatar Type:', avatarData.avatarType);
    console.log('   Created OASIS Type:', avatarData.createdOASISType);
    
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/api/Avatar/register`, {
      method: 'POST'
    }, avatarData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Site avatar created successfully!');
      console.log('   Avatar ID:', response.data.avatar?.id || response.data.avatar?.avatarId || OASIS_CONFIG.SITE_AVATAR.username);
      
      // Extract verification token if available
      const verificationToken = response.data.verificationToken || response.data.avatar?.verificationToken;
      if (verificationToken) {
        console.log('   Verification Token:', verificationToken.substring(0, 20) + '...');
      } else {
        console.log('   ⚠️ No verification token in response - may need to check MongoDB');
      }
      
      return {
        avatar: response.data.avatar || response.data.result,
        verificationToken: verificationToken
      };
    } else {
      console.log('❌ Failed to create site avatar');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating site avatar:', error.message);
    return null;
  }
}

// Step 2.5: Get verification token from MongoDB (manual workaround)
async function getVerificationTokenFromMongoDB() {
  console.log('\n🔍 Getting verification token from MongoDB...');
  console.log('   ⚠️ This is a manual step - you need to check MongoDB manually');
  console.log('   Connect to MongoDB and run:');
  console.log('   db.Avatar.findOne({"Username": "metabricks_admin"}, {verificationToken: 1})');
  console.log('   Then copy the verificationToken value and use it in the next step');
  
  // For now, return null - user needs to manually get the token
  return null;
}

// Step 2.6: Verify email with token
async function verifyEmail(token) {
  console.log('\n📧 Verifying email with token...');
  
  try {
    const verifyData = {
      token: token
    };
    
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/api/Avatar/verify-email`, {
      method: 'POST'
    }, verifyData);
    
    if (response.status === 200) {
      console.log('✅ Email verification successful!');
      return true;
    } else {
      console.log('❌ Email verification failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying email:', error.message);
    return false;
  }
}

// Step 3: Get JWT token for site avatar
async function getSiteAvatarToken() {
  console.log('\n🔐 Getting JWT token for site avatar...');
  
  try {
    const loginData = {
      username: OASIS_CONFIG.SITE_AVATAR.username,
      password: OASIS_CONFIG.SITE_AVATAR.password
    };
    
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/api/Avatar/authenticate`, {
      method: 'POST'
    }, loginData);
    
    if (response.status === 200) {
      if (response.data.success && response.data.token) {
        console.log('✅ JWT token obtained successfully!');
        console.log('   Token:', response.data.token.substring(0, 50) + '...');
        return response.data.token;
      } else {
        console.log('❌ Login response missing JWT token');
        console.log('   Response:', response.data);
        return null;
      }
    } else {
      console.log('❌ Failed to get JWT token');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting JWT token:', error.message);
    return null;
  }
}

// Step 4: Test site avatar authentication
async function testSiteAvatarAuth(token) {
  console.log('\n🧪 Testing site avatar authentication...');
  
  try {
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/api/avatar/authenticate-token/${token}`, {
      method: 'POST'
    });
    
    if (response.status === 200) {
      console.log('✅ Site avatar authentication successful!');
      return true;
    } else {
      console.log('❌ Site avatar authentication failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing site avatar auth:', error.message);
    return false;
  }
}

// Step 5: Generate configuration
function generateConfiguration(avatarId, token) {
  console.log('\n⚙️ Generating MetaBricks configuration...');
  
  const config = {
    OASIS: {
      SITE_AVATAR_ID: avatarId,
      SITE_AVATAR_TOKEN: token,
      API_BASE_URL: OASIS_CONFIG.BASE_URL + '/api'
    },
    PAYMENT: {
      METABRICKS_WALLET_ADDRESS: 'YOUR_SOLANA_WALLET_ADDRESS_HERE',
      CURRENCY: 'SOL',
      MIN_PAYMENT: 0.4
    },
    NFT: {
      SYMBOL: 'MBRK',
      DEFAULT_PRICE: 0.4,
      NETWORK: 'devnet'
    },
    BRICK: {
      TOTAL_COUNT: 432,
      METADATA_BASE_URL: 'https://gateway.pinata.cloud/ipfs/bafybeihkspp2kxsz4moylkgjpkdwm4sbafqluqmtzh3hy7x42jhvx6n5ym'
    }
  };
  
  console.log('✅ Configuration generated!');
  console.log('\n📋 Copy this configuration to your MetaBricks site config:');
  console.log('=' .repeat(60));
  console.log(JSON.stringify(config, null, 2));
  console.log('=' .repeat(60));
  
  // Save to file
  const fs = require('fs');
  const configPath = './metabricks-oasis-config.json';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\n💾 Configuration saved to: ${configPath}`);
  
  return config;
}

// Main execution function
async function main() {
  console.log('🚀 MetaBricks OASIS Site Avatar Setup');
  console.log('=' .repeat(50));
  
  // Check if OASIS API is accessible
  const isConnected = await testOASISConnection();
  if (!isConnected) {
    console.log('\n❌ Cannot proceed without OASIS API connection');
    console.log('   Please check your OASIS API URL and ensure it\'s running');
    process.exit(1);
  }
  
  // Create site avatar
  const avatarData = await createSiteAvatar();
  if (!avatarData) {
    console.log('\n❌ Cannot proceed without creating site avatar');
    process.exit(1);
  }
  
  // Verify email if token is present
  let verificationToken = avatarData.verificationToken;
  
  if (!verificationToken) {
    // Try to get token from MongoDB manually
    verificationToken = await getVerificationTokenFromMongoDB();
    
    if (!verificationToken) {
      console.log('\n❌ No verification token available. Cannot proceed without email verification.');
      console.log('   Please check MongoDB manually and get the verification token.');
      console.log('   Then run the verification step manually.');
      process.exit(1);
    }
  }
  
  // Verify email with token
  const isVerified = await verifyEmail(verificationToken);
  if (!isVerified) {
    console.log('\n❌ Email verification failed. Cannot proceed without verified email.');
    process.exit(1);
  }
  
  // Get JWT token
  const token = await getSiteAvatarToken();
  if (!token) {
    console.log('\n❌ Cannot proceed without JWT token');
    process.exit(1);
  }
  
  // Test authentication
  const isAuthenticated = await testSiteAvatarAuth(token);
  if (!isAuthenticated) {
    console.log('\n❌ Site avatar authentication failed');
    process.exit(1);
  }
  
  // Generate configuration
  const avatarId = avatarData.avatar?.id || avatarData.avatar?.avatarId || OASIS_CONFIG.SITE_AVATAR.username;
  generateConfiguration(avatarId, token);
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Update the MetaBricks wallet address in the config');
  console.log('   2. Import the configuration into your MetaBricks site');
  console.log('   3. Test the NFT minting flow');
  console.log('\n🔒 Security notes:');
  console.log('   - Keep the JWT token secure and rotate regularly');
  console.log('   - Update the site avatar password');
  console.log('   - Monitor API usage and set appropriate rate limits');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testOASISConnection,
  createSiteAvatar,
  verifyEmail,
  getSiteAvatarToken,
  testSiteAvatarAuth,
  generateConfiguration
};
