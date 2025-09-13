#!/usr/bin/env node

/**
 * 🧪 FRONTEND DIRECT OASIS INTEGRATION TEST
 * 
 * This script tests the DirectOASISService functionality that the frontend will use.
 * It simulates the exact same calls the frontend will make.
 */

const https = require('https');
const { URL } = require('url');

// Configuration (same as frontend)
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
 * Simulate DirectOASISService authentication
 */
async function authenticateWithOASIS() {
  try {
    console.log('🔐 Testing DirectOASISService Authentication...');
    
    const response = await makeRequest(`${OASIS_API_URL}/api/avatar/authenticate`, {
      method: 'POST',
      body: {
        username: SITE_AVATAR_USERNAME,
        password: SITE_AVATAR_PASSWORD
      }
    });

    if (response.data?.result?.jwtToken) {
      console.log('✅ DirectOASISService Authentication successful!');
      console.log('🎫 JWT Token:', response.data.result.jwtToken.substring(0, 50) + '...');
      return response.data.result.jwtToken;
    } else {
      throw new Error('No JWT token received from OASIS API');
    }
  } catch (error) {
    console.error('❌ DirectOASISService Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Simulate DirectOASISService NFT minting
 */
async function mintNFTSolana(token, brickId = 50) {
  try {
    console.log(`🎨 Testing DirectOASISService NFT Minting for Brick ${brickId}...`);
    
    // Get correct metadata URL based on brick type (same logic as frontend)
    let metadataUrl;
    if (brickId >= 1 && brickId <= 400) {
      metadataUrl = 'https://gateway.pinata.cloud/ipfs/QmXa26ap9xo9thYpqjzF16NFMkzfStuLyRtZWMJ1pEGvfC'; // Regular
    } else if (brickId >= 401 && brickId <= 430) {
      metadataUrl = 'https://gateway.pinata.cloud/ipfs/QmUYGRpqx8J1cxq4rpMDjXx2rbshRftgAt4wxSGHybr5Ko'; // Industrial
    } else {
      metadataUrl = 'https://gateway.pinata.cloud/ipfs/QmfPUefyM2fCWvhZP6XPPZiVba2fort95BjCfmYj8QJ8Cd'; // Legendary
    }

    const mintRequest = {
      JSONMetaDataURL: metadataUrl,
      Title: `MetaBrick #Brick ${brickId}`,
      Symbol: 'MBRICK',
      MintedByAvatarId: SITE_AVATAR_ID
    };

    console.log('📤 DirectOASISService Minting request:', mintRequest);

    const response = await makeRequest(`${OASIS_API_URL}/api/Solana/Mint`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: mintRequest
    });

    if (response.data.isError) {
      throw new Error(`DirectOASISService Minting failed: ${response.data.message}`);
    }

    console.log('✅ DirectOASISService NFT Minting successful!');
    console.log('🎯 Mint Account:', response.data.result.mintAccount);
    console.log('📝 Transaction:', response.data.result.transactionResult);
    
    return {
      mintAccount: response.data.result.mintAccount,
      transactionResult: response.data.result.transactionResult
    };
  } catch (error) {
    console.error('❌ DirectOASISService NFT minting failed:', error.message);
    throw error;
  }
}

/**
 * Simulate DirectOASISService NFT transfer
 */
async function transferNFT(token, mintAccount, toWallet) {
  try {
    console.log('🔄 Testing DirectOASISService NFT Transfer...');
    console.log('⏳ Waiting 5 seconds for NFT to be fully processed...');
    
    // Wait for NFT to be fully processed (same as frontend)
    await new Promise(resolve => setTimeout(resolve, 5000));

    const transferRequest = {
      FromWalletAddress: OASIS_WALLET_ADDRESS,
      ToWalletAddress: toWallet,
      NFTId: mintAccount,
      FromProviderType: 'SolanaOASIS',
      ToProviderType: 'SolanaOASIS',
      Amount: 1
    };

    console.log('📤 DirectOASISService Transfer request:', transferRequest);

    const response = await makeRequest(`${OASIS_API_URL}/api/Nft/send-nft`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: transferRequest
    });

    if (response.data.isError) {
      throw new Error(`DirectOASISService Transfer failed: ${response.data.message}`);
    }

    console.log('✅ DirectOASISService NFT Transfer successful!');
    console.log('📝 Transfer Transaction:', response.data.result.transactionResult);
    
    return {
      transactionResult: response.data.result.transactionResult
    };
  } catch (error) {
    console.error('❌ DirectOASISService NFT transfer failed:', error.message);
    throw error;
  }
}

/**
 * Main test function - simulates complete frontend flow
 */
async function runFrontendIntegrationTest() {
  try {
    console.log('🚀 Starting Frontend DirectOASISService Integration Test...\n');

    // Step 1: Test authentication (same as frontend)
    const token = await authenticateWithOASIS();
    console.log('');

    // Step 2: Test NFT minting (same as frontend)
    const mintResult = await mintNFTSolana(token, 50);
    console.log('');

    // Step 3: Test NFT transfer (same as frontend)
    const transferResult = await transferNFT(token, mintResult.mintAccount, TEST_WALLET_ADDRESS);
    console.log('');

    console.log('🎉 FRONTEND INTEGRATION TEST PASSED!');
    console.log('📊 Frontend DirectOASISService Results:');
    console.log('   - Authentication: ✅');
    console.log('   - NFT Minting: ✅');
    console.log('   - NFT Transfer: ✅');
    console.log('');
    console.log('🎯 The frontend is ready to mint NFTs directly via OASIS API!');
    console.log('');
    console.log('🌐 Check your NFT on Solana Explorer:');
    console.log(`📝 Transfer Transaction: https://explorer.solana.com/tx/${transferResult.transactionResult}?cluster=devnet`);
    console.log(`🎯 NFT Mint Account: https://explorer.solana.com/address/${mintResult.mintAccount}?cluster=devnet`);
    console.log(`👤 Your Wallet: https://explorer.solana.com/address/${TEST_WALLET_ADDRESS}?cluster=devnet`);

  } catch (error) {
    console.error('💥 Frontend Integration Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runFrontendIntegrationTest();
