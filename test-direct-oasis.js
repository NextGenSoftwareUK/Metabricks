#!/usr/bin/env node

/**
 * 🧪 DIRECT OASIS SERVICE TEST
 * 
 * This script tests the direct OASIS approach without the MetaBricks backend.
 * It simulates what the DirectOASISService will do in the frontend.
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const OASIS_API_URL = 'https://localhost:5002';
const SITE_AVATAR_USERNAME = 'metabricks_admin';
const SITE_AVATAR_PASSWORD = 'Uppermall1!';
const SITE_AVATAR_ID = '5f7daa80-160e-4213-9e81-94500390f31e';
const OASIS_WALLET_ADDRESS = 'AfpSpMjNyoHTZWMWkog6Znf57KV82MGzkpDUUjLtmHwG';
const TEST_WALLET_ADDRESS = '5asLfkbBXe3N8sJ8JQfRuSGxUJHhMGjnY2hRyqcJSuaW';

// Create HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Make HTTP request with proper error handling
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      agent: httpsAgent
    };

    if (options.body) {
      const bodyStr = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Authenticate with OASIS API
 */
async function authenticateWithOASIS() {
  try {
    console.log('🔐 Testing Direct OASIS Authentication...');
    
    const response = await makeRequest(`${OASIS_API_URL}/api/avatar/authenticate`, {
      method: 'POST',
      body: {
        username: SITE_AVATAR_USERNAME,
        password: SITE_AVATAR_PASSWORD
      }
    });

    if (response.data?.result?.jwtToken) {
      console.log('✅ Authentication successful!');
      console.log('🎫 JWT Token:', response.data.result.jwtToken.substring(0, 50) + '...');
      return response.data.result.jwtToken;
    } else {
      throw new Error('No JWT token received from OASIS API');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Test NFT minting with correct metadata
 */
async function testNFTMinting(token, brickNumber = 50) {
  try {
    console.log(`🎨 Testing NFT Minting for Brick ${brickNumber}...`);
    
    // Get correct metadata URL based on brick type
    let metadataUrl;
    if (brickNumber >= 1 && brickNumber <= 400) {
      metadataUrl = 'https://gateway.pinata.cloud/ipfs/QmXa26ap9xo9thYpqjzF16NFMkzfStuLyRtZWMJ1pEGvfC'; // Regular
    } else if (brickNumber >= 401 && brickNumber <= 430) {
      metadataUrl = 'https://gateway.pinata.cloud/ipfs/QmUYGRpqx8J1cxq4rpMDjXx2rbshRftgAt4wxSGHybr5Ko'; // Industrial
    } else {
      metadataUrl = 'https://gateway.pinata.cloud/ipfs/QmfPUefyM2fCWvhZP6XPPZiVba2fort95BjCfmYj8QJ8Cd'; // Legendary
    }

    const mintRequest = {
      JSONMetaDataURL: metadataUrl,
      Title: `MetaBrick #Brick ${brickNumber}`,
      Symbol: 'MBRICK',
      MintedByAvatarId: SITE_AVATAR_ID
    };

    console.log('📤 Minting request:', mintRequest);

    const response = await makeRequest(`${OASIS_API_URL}/api/Solana/Mint`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: mintRequest
    });

    if (response.data.isError) {
      throw new Error(`Minting failed: ${response.data.message}`);
    }

    console.log('✅ NFT Minting successful!');
    console.log('🎯 Mint Account:', response.data.result.mintAccount);
    console.log('📝 Transaction:', response.data.result.transactionResult);
    
    return {
      mintAccount: response.data.result.mintAccount,
      transactionResult: response.data.result.transactionResult
    };
  } catch (error) {
    console.error('❌ NFT minting failed:', error.message);
    throw error;
  }
}

/**
 * Test NFT transfer
 */
async function testNFTTransfer(token, mintAccount, toWallet) {
  try {
    console.log('🔄 Testing NFT Transfer...');
    console.log('⏳ Waiting 5 seconds for NFT to be fully processed...');
    
    // Wait for NFT to be fully processed
    await new Promise(resolve => setTimeout(resolve, 5000));

    const transferRequest = {
      FromWalletAddress: OASIS_WALLET_ADDRESS,
      ToWalletAddress: toWallet,
      NFTId: mintAccount,
      FromProviderType: 'SolanaOASIS',
      ToProviderType: 'SolanaOASIS',
      Amount: 1
    };

    console.log('📤 Transfer request:', transferRequest);

    const response = await makeRequest(`${OASIS_API_URL}/api/Nft/send-nft`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: transferRequest
    });

    if (response.data.isError) {
      throw new Error(`Transfer failed: ${response.data.message}`);
    }

    console.log('✅ NFT Transfer successful!');
    console.log('📝 Transfer Transaction:', response.data.result.transactionResult);
    
    return {
      transactionResult: response.data.result.transactionResult
    };
  } catch (error) {
    console.error('❌ NFT transfer failed:', error.message);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('🚀 Starting Direct OASIS Service Test...\n');

    // Step 1: Authenticate
    const token = await authenticateWithOASIS();
    console.log('');

    // Step 2: Test NFT minting
    const mintResult = await testNFTMinting(token, 50);
    console.log('');

    // Step 3: Test NFT transfer
    const transferResult = await testNFTTransfer(token, mintResult.mintAccount, TEST_WALLET_ADDRESS);
    console.log('');

    console.log('🎉 ALL TESTS PASSED! Direct OASIS approach is working!');
    console.log('📊 Final Results:');
    console.log('   - Authentication: ✅');
    console.log('   - NFT Minting: ✅');
    console.log('   - NFT Transfer: ✅');
    console.log('');
    console.log('🎯 The frontend can now bypass the backend entirely!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();
