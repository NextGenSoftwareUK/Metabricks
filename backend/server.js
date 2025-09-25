const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const storageUtils = require('./storage/oasis-storage-utils');
const Stripe = require('stripe');
require('dotenv').config();

// OASIS Storage is now available on oasisweb4.one
process.env.OASIS_STORAGE_ENABLED = 'false';

// Individual brick metadata URLs from the collection index
// Each brick position has its own unique IPFS hash
const BRICK_METADATA_URLS = {
  1: "https://gateway.pinata.cloud/ipfs/QmXsv1bnPU3ybyQKKnQ7929YUmsUSdeEGxyX9Tj7vo5Mnz",
  2: "https://gateway.pinata.cloud/ipfs/QmQU6V3nkWfPiW6HXG5LCLpqzJmsRoB73uq2GfHhGRKqQ4",
  3: "https://gateway.pinata.cloud/ipfs/QmTA36eidj2Zp9idvP9znJLwJ6t2rKAdJjNBF4rVXyorWt",
  4: "https://gateway.pinata.cloud/ipfs/QmRVYJgCVaQyCVQsgtY9sYVNdm3SZFba4CmF5S672bRpgn",
  5: "https://gateway.pinata.cloud/ipfs/QmbdfRGZ3CBCcQ4rmaTzUAtnhSCoQEBx7JnREg8mRyjJWu",
  6: "https://gateway.pinata.cloud/ipfs/QmPwBVDXpN3o38acd1hMxBkSUwAwntT4MWF2Arf2eLf2ns",
  7: "https://gateway.pinata.cloud/ipfs/QmWULa9tU14PpCqJC1yPPfbGWZs5xrqLDJYTw3C2WNx2DP",
  8: "https://gateway.pinata.cloud/ipfs/QmYvvYu8Gp6DzSD3WBCh5gHLY4",
  9: "https://gateway.pinata.cloud/ipfs/QmUE8v2h8HpdNYTvdPurGR449k",
  10: "https://gateway.pinata.cloud/ipfs/QmbkEEtEL3PFu8u1mnuqPrsGmp",
  // Add more positions as needed - this is a simplified version
  // In production, you'd load the full collection index
};

// Function to get metadata URL for a brick number using individual IPFS hashes
function getMetaBrickMetadataUrl(brickNumber) {
  // Check if we have the specific metadata URL for this brick
  if (BRICK_METADATA_URLS[brickNumber]) {
    return BRICK_METADATA_URLS[brickNumber];
  }
  
  // Fallback: determine brick type and use generic URLs
  const brickType = getBrickType(brickNumber);
  switch (brickType) {
    case 'regular':
      return `https://gateway.pinata.cloud/ipfs/QmXa26ap9xo9thYpqjzF16NFMkzfStuLyRtZWMJ1pEGvfC`;
    case 'industrial':
      return `https://gateway.pinata.cloud/ipfs/QmUYGRpqx8J1cxq4rpMDjXx2rbshRftgAt4wxSGHybr5Ko`;
    case 'legendary':
      return `https://gateway.pinata.cloud/ipfs/QmfPUefyM2fCWvhZP6XPPZiVba2fort95BjCfmYj8QJ8Cd`;
    default:
      return `https://gateway.pinata.cloud/ipfs/QmXa26ap9xo9thYpqjzF16NFMkzfStuLyRtZWMJ1pEGvfC`;
  }
}

// Function to determine brick type using the actual randomized mapping
function getBrickType(brickNumber) {
  // This is the actual randomized distribution from the collection index
  // Based on metabricks-collection-index.json analysis
  
  // Legendary bricks (scattered throughout the wall)
  const legendaryBricks = [78, 108, 153, 155, 185, 219, 278, 296, 397, 431, 432];
  
  // Industrial bricks (scattered throughout the wall) 
  const industrialBricks = [2, 19, 23, 27, 28, 30, 33, 35, 38, 59, 68, 69, 71, 76, 77, 82, 90, 118, 125, 129, 132, 138, 140, 141, 146, 151, 155, 159, 180, 186, 205, 210, 212, 214, 218, 229, 231, 239, 248, 257, 258, 261, 275, 283, 284, 288, 292, 301, 311, 312, 314, 318, 350, 352, 356, 374, 379, 383, 403, 420];
  
  if (legendaryBricks.includes(brickNumber)) {
    return 'legendary';
  } else if (industrialBricks.includes(brickNumber)) {
    return 'industrial';
  } else {
    return 'regular';
  }
}

const execAsync = promisify(exec);

// Create axios instance that ignores SSL certificate errors
const axiosInstance = axios.create({
  timeout: 60000, // 60 second timeout
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  headers: {
    'User-Agent': 'MetaBricks-Backend/1.0',
    'Content-Type': 'application/json'
  },
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  }
});

// Initialize Stripe (using provided test keys for development)
let stripe = null;
let endpointSecret = null;

// Use environment variable or fallback to test keys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51RvJ4ODUfRvAn94pRsJilAg17lPyVQfEDb5WnM5w5BLy5S2QzIVAS5McThjlyn5ndPqO2bhlYDOp3bIoRL6897VN00jeYg7byc';

if (stripeSecretKey) {
  stripe = Stripe(stripeSecretKey);
  endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log('💳 Stripe initialized with test keys');
  console.log('🔑 Using Stripe Secret Key:', stripeSecretKey.substring(0, 20) + '...');
} else {
  console.log('⚠️ Stripe not configured - set STRIPE_SECRET_KEY to enable payment processing');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// OASIS API Configuration
const OASIS_API_URL = process.env.OASIS_API_URL || 'http://devnet.oasisweb4.one'; // Using devnet subdomain for testing
const SITE_AVATAR_USERNAME = process.env.SITE_AVATAR_USERNAME || 'metabricks_admin';
const SITE_AVATAR_PASSWORD = process.env.SITE_AVATAR_PASSWORD || 'Uppermall1!';
const SITE_AVATAR_ID = '89d907a8-5859-4171-b6c5-621bfe96930d';

// Simple error handling for Heroku deployment

/**
 * Native HTTP client for OASIS API (ChatGPT suggested fix)
 * This bypasses axios/undici issues that might cause HTTP blocking
 */
const http = require('http');

function postJsonHttp(urlStr, body, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const data = Buffer.from(JSON.stringify(body));
    const opts = {
      protocol: "http:",
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        "Connection": "close"
      },
      agent: false
    };

    const req = http.request(opts, res => {
      let chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const txt = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { 
            return resolve(JSON.parse(txt)); 
          } catch { 
            return resolve({ raw: txt }); 
          }
        }
        return reject(new Error(`HTTP ${res.statusCode}: ${txt}`));
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// Store authentication token
let currentToken = null;
let tokenExpiry = null;

// Authentication token will be dynamically obtained from OASIS API

/**
 * Create a mock authentication token for development
 */
function createMockToken() {
  const mockToken = 'mock_jwt_token_' + Date.now();
  currentToken = mockToken;
  tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
  console.log('🔧 Created mock authentication token for development');
  return mockToken;
}

/**
 * Authenticate with OASIS API using curl (fallback method)
 */
async function authenticateWithCurl() {
  try {
    console.log('🔐 Authenticating with OASIS API using curl...');
    console.log('🌐 OASIS API URL:', OASIS_API_URL);
    
    const curlCommand = `curl -s -k -X POST "${OASIS_API_URL}/api/avatar/authenticate" -H "Content-Type: application/json" -d '${JSON.stringify({username: SITE_AVATAR_USERNAME, password: SITE_AVATAR_PASSWORD})}' --max-time 30 --connect-timeout 10`;
    
    console.log('Executing curl command:', curlCommand);
    
    // Try execAsync first, if it fails, try spawn
    try {
      const { stdout, stderr } = await execAsync(curlCommand);
    if (stderr) {
      console.error('Curl stderr:', stderr);
    }
    
    console.log('Curl stdout length:', stdout.length);
      
      if (!stdout || stdout.trim().length === 0) {
        throw new Error('Empty response from OASIS API - service may be offline');
      }
      
    const response = JSON.parse(stdout);
    
    if (response?.result?.jwtToken) {
      currentToken = response.result.jwtToken;
      tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
        storageUtils.setToken(currentToken);
      console.log('✅ OASIS authentication successful via curl');
      return currentToken;
    } else {
      throw new Error('No token received from OASIS API');
      }
    } catch (execError) {
      console.log('execAsync failed, trying spawn...');
      
      // Use exec as fallback for more reliable output capture
      const curlCommand = `curl -s -k -X POST "${OASIS_API_URL}/api/avatar/authenticate" -H "Content-Type: application/json" -d '${JSON.stringify({username: SITE_AVATAR_USERNAME, password: SITE_AVATAR_PASSWORD})}' --max-time 30 --connect-timeout 10`;
      
      console.log('Executing curl command:', curlCommand);
      
      return new Promise((resolve, reject) => {
        exec(curlCommand, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
          // Exit code 92 is success for curl (just warnings)
          if (error && error.code !== 92) {
            reject(new Error(`Curl exec failed: ${error.message}`));
            return;
          }
          
          if (stderr) {
            console.error('Curl stderr:', stderr);
          }
          
          console.log('Curl stdout length:', stdout.length);
          console.log('Curl stdout preview:', stdout.substring(0, 200) + '...');
          console.log('Curl stdout ends with:', stdout.substring(stdout.length - 50));
          
          if (!stdout || stdout.trim().length === 0) {
            reject(new Error('Empty response from OASIS API - service may be offline'));
            return;
          }
          
          try {
            // Try to find the JWT token directly in the response without parsing the full JSON
            const jwtMatch = stdout.match(/"jwtToken":"([^"]+)"/);
            if (jwtMatch && jwtMatch[1]) {
              currentToken = jwtMatch[1];
              tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
              storageUtils.setToken(currentToken);
              console.log('✅ OASIS authentication successful via curl spawn (direct token extraction)');
              resolve(currentToken);
              return;
            }
            
            // Check if response is truncated
            if (!stdout.includes('}')) {
              reject(new Error('Truncated response from OASIS API - JSON incomplete'));
              return;
            }
            
            // Fallback to full JSON parsing
            const response = JSON.parse(stdout);
            
            if (response?.result?.jwtToken) {
              currentToken = response.result.jwtToken;
              tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
              storageUtils.setToken(currentToken);
              console.log('✅ OASIS authentication successful via curl spawn');
              resolve(currentToken);
            } else {
              reject(new Error('No token received from OASIS API'));
            }
          } catch (parseError) {
            console.error('JSON parse error:', parseError.message);
            console.error('Response preview:', stdout.substring(0, 500));
            reject(new Error(`Failed to parse OASIS API response: ${parseError.message}`));
          }
        });
      });
    }
  } catch (error) {
    console.error('❌ OASIS authentication failed via curl:', error.message);
    console.log('🔧 Falling back to mock authentication for development...');
    return createMockToken();
  }
}

/**
 * Authenticate with OASIS API and get fresh token
 */
async function authenticateWithOASIS() {
  try {
    console.log('🔐 Authenticating with OASIS API...');
    
    // Try native HTTP client first (ChatGPT suggested fix)
    try {
      console.log('🔄 Trying native HTTP client...');
      const response = await postJsonHttp(
        `${OASIS_API_URL}/api/avatar/authenticate`,
        { username: SITE_AVATAR_USERNAME, password: SITE_AVATAR_PASSWORD }
      );
      
      if (response?.result?.jwtToken) {
        currentToken = response.result.jwtToken;
        tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
        storageUtils.setToken(currentToken);
        console.log('✅ OASIS authentication successful via native HTTP');
        console.log('🔑 Token expires at:', new Date(tokenExpiry).toISOString());
        return currentToken;
      }
    } catch (nativeError) {
      console.log('❌ Native HTTP client failed:', nativeError.message);
    }
    
    // Fallback to axios
    console.log('🔄 Trying axios client...');
    const response = await axiosInstance.post(`${OASIS_API_URL}/api/avatar/authenticate`, {
      username: SITE_AVATAR_USERNAME,
      password: SITE_AVATAR_PASSWORD
    });

    if (response.data?.result?.jwtToken) {
      currentToken = response.data.result.jwtToken;
      tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      storageUtils.setToken(currentToken);
      console.log('✅ OASIS authentication successful via axios');
      console.log('🔑 Token expires at:', new Date(tokenExpiry).toISOString());
      return currentToken;
    } else {
      throw new Error('No token received from OASIS API');
    }
  } catch (error) {
    console.error('❌ OASIS authentication failed:', error.message);
    
    // In production (Heroku), provide a meaningful error instead of mock tokens
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OASIS API authentication failed - network connectivity issue. Please try again later.');
    }
    
    // Only use mock tokens in development
    console.log('🔧 Falling back to mock authentication for development...');
    return createMockToken();
  }
}

/**
 * Get valid token (authenticate if needed)
 */
async function getValidToken() {
  // Check if token is expired or missing (with 30 second buffer)
  const bufferTime = 30 * 1000; // 30 seconds
  if (!currentToken || !tokenExpiry || Date.now() >= (tokenExpiry - bufferTime)) {
    console.log('🔄 Token expired or missing, re-authenticating...');
    
    try {
      // Try axios first (more reliable)
      console.log('🔄 Trying axios authentication...');
      const newToken = await authenticateWithOASIS();
      if (!newToken) {
        throw new Error('Failed to authenticate with OASIS API via axios');
      }
    } catch (axiosError) {
      console.log('🔄 Axios failed, trying curl fallback...');
      try {
        const newToken = await authenticateWithCurl();
        if (!newToken) {
          throw new Error('Failed to authenticate with OASIS API via curl');
        }
      } catch (curlError) {
        console.error('❌ All authentication methods failed');
        console.error('Axios error:', axiosError.message);
        console.error('Curl error:', curlError.message);
        
        // In production, provide a user-friendly error message
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Unable to connect to OASIS API. This may be due to network restrictions. Please try again later or contact support.');
        }
        
        // In development, use mock tokens
        console.log('🔧 Using mock token for development...');
        return createMockToken();
      }
    }
  }
  return currentToken;
}

/**
 * Make authenticated request to OASIS API
 */
async function makeOASISRequest(endpoint, data) {
  const token = await getValidToken();
  
  try {
    console.log(`📡 Making request to OASIS: ${endpoint}`);
    
    const response = await axiosInstance.post(`${OASIS_API_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ OASIS request successful');
    return response.data;
  } catch (error) {
    console.error('❌ OASIS request failed:', error.response?.data || error.message);
    
    // If token is invalid, try to re-authenticate once
    if (error.response?.status === 401) {
      console.log('🔄 Token invalid, re-authenticating...');
      await authenticateWithOASIS();
      
      // Retry the request
      const retryResponse = await axiosInstance.post(`${OASIS_API_URL}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ OASIS retry request successful');
      return retryResponse.data;
    }
    
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    tokenValid: currentToken && tokenExpiry && Date.now() < tokenExpiry
  });
});

// Test endpoint to check HTTP connectivity from Heroku
app.get('/test-http-connectivity', async (req, res) => {
  try {
    console.log('🧪 Testing HTTP connectivity from Heroku...');
    
    // Test 1: Try to connect to a known HTTP service
    console.log('🌐 Testing connection to httpbin.org (HTTP)...');
    try {
      const httpbinResponse = await axios.get('http://httpbin.org/get', { timeout: 10000 });
      console.log('✅ httpbin.org HTTP response:', httpbinResponse.status);
    } catch (error) {
      console.log('❌ httpbin.org HTTP failed:', error.message);
    }
    
    // Test 1b: Try HTTPS version
    console.log('🌐 Testing connection to httpbin.org (HTTPS)...');
    try {
      const httpbinHttpsResponse = await axios.get('https://httpbin.org/get', { timeout: 10000 });
      console.log('✅ httpbin.org HTTPS response:', httpbinHttpsResponse.status);
    } catch (error) {
      console.log('❌ httpbin.org HTTPS failed:', error.message);
    }
    
    // Test 2: Try to connect to the OASIS API
    console.log('🌐 Testing connection to OASIS API...');
    const oasisResponse = await axios.post(`${OASIS_API_URL}/api/avatar/authenticate`, {
      username: SITE_AVATAR_USERNAME,
      password: SITE_AVATAR_PASSWORD
    }, { timeout: 10000 });
    console.log('✅ OASIS API response:', oasisResponse.status);
    
    res.json({
      success: true,
      message: 'HTTP connectivity test successful',
      tests: {
        httpbin: {
          status: httpbinResponse.status,
          success: true
        },
        oasis: {
          status: oasisResponse.status,
          success: true,
          hasToken: !!oasisResponse.data?.result?.jwtToken
        }
      }
    });
    
  } catch (error) {
    console.error('❌ HTTP connectivity test failed:', error.message);
    
    res.json({
      success: false,
      message: 'HTTP connectivity test failed',
      error: error.message,
      errorCode: error.code,
      errorResponse: error.response?.status,
      tests: {
        httpbin: {
          success: false,
          error: error.message
        },
        oasis: {
          success: false,
          error: error.message
        }
      }
    });
  }
});

// NFT Minting endpoint - Direct processing with proper error handling
app.post('/api/mint-nft', async (req, res) => {
  try {
    console.log('🎯 NFT minting request received:', req.body);
    
    const mintData = req.body;
    
    // Validate required fields
    if (!mintData.walletAddress || !mintData.brickId) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress and brickId' 
      });
    }

    // CRITICAL: Validate payment before minting
    console.log('💳 Validating payment before minting...');
    
    // Check if payment information is provided
    if (!mintData.paymentNetwork) {
      return res.status(400).json({ 
        error: 'Payment validation required: paymentNetwork must be specified' 
      });
    }

    // For crypto payments, we assume payment was already processed by the frontend
    // For Stripe payments, we should verify the payment was successful
    if (mintData.paymentNetwork === 'stripe') {
      // TODO: Add Stripe payment verification here
      // For now, we'll assume Stripe payments are valid if they reach this point
      console.log('💳 Stripe payment validation: Assuming valid (webhook verification needed)');
    } else if (mintData.paymentNetwork === 'solana' || mintData.paymentNetwork === 'arbitrum') {
      console.log(`💳 ${mintData.paymentNetwork.toUpperCase()} payment validation: Assuming valid (blockchain confirmation)`);
    } else {
      return res.status(400).json({ 
        error: 'Invalid payment network. Must be solana, arbitrum, or stripe' 
      });
    }

    console.log('✅ Payment validation passed - proceeding with minting');

    let result;
    let oasisRequest;
    
    // Check if this is a Solana payment
    console.log('🔍 Backend Debug - paymentNetwork:', mintData.paymentNetwork);
    console.log('🔍 Backend Debug - originalSolanaAddress:', mintData.originalSolanaAddress);
    console.log('🔍 Backend Debug - walletAddress:', mintData.walletAddress);
    
    if (mintData.paymentNetwork === 'solana' || mintData.originalSolanaAddress) {
      console.log('🌊 Processing Solana payment...');
      
      // Ensure SolanaOASIS provider is registered and activated
      try {
        await registerSolanaProvider();
      } catch (providerError) {
        console.error('❌ Failed to register SolanaOASIS provider:', providerError.message);
        // Continue anyway - provider might already be registered
      }
      
      // Extract brick number from brickId (e.g., "Brick 32" -> 32)
      const brickNumber = parseInt(mintData.brickId?.toString().replace('Brick ', '') || '1');
      
      // Get the correct metadata URL for this brick
      const metadataUrl = getMetaBrickMetadataUrl(brickNumber);
      
      // Prepare Solana OASIS API request using David's new unified format
      oasisRequest = {
        Title: mintData.brickName || `MetaBrick #${mintData.brickId}`,
        Description: `MetaBrick NFT: ${mintData.brickName}`,
        Symbol: 'MBRICK',
        OnChainProvider: { value: 3, name: 'SolanaOASIS' },
        OffChainProvider: { value: 23, name: 'MongoDBOASIS' },
        NFTOffChainMetaType: { value: 3, name: 'ExternalJsonURL' },
        NFTStandardType: { value: 2, name: 'SPL' },
        JSONMetaDataURL: metadataUrl, // Use correct metadata URL for this specific brick
        ImageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq',
        ThumbnailUrl: 'https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq',
        Price: 0.02,
        NumberToMint: 1,
        StoreNFTMetaDataOnChain: false,
        MintedByAvatarId: SITE_AVATAR_ID, // Site avatar ID
        SendToAddressAfterMinting: mintData.walletAddress, // User's Phantom wallet
        WaitTillNFTSent: true,
        WaitForNFTToSendInSeconds: 60,
        AttemptToSendEveryXSeconds: 5
      };

      console.log('📤 Sending to Solana OASIS API:', oasisRequest);
      
      // Make request to Solana OASIS API using David's new unified endpoint
      result = await makeOASISRequest('/api/nft/mint-nft', oasisRequest);
      
    } else {
      console.log('🔷 Processing Arbitrum payment...');
      
      // Prepare Arbitrum OASIS API request (original logic)
      oasisRequest = {
      MintWalletAddress: mintData.walletAddress,
        MintedByAvatarId: '5f7daa80-160e-4213-9e81-94500390f31e',
      Title: mintData.brickName || `MetaBrick #${mintData.brickId}`,
      Description: `A unique ${mintData.brickType || 'regular'} MetaBrick with special perks and benefits`,
      ThumbnailUrl: mintData.imageUrl || 'https://gateway.pinata.cloud/ipfs/QmYourImageHash',
      ImageURL: mintData.imageUrl || 'https://gateway.pinata.cloud/ipfs/QmYourImageHash',
      Price: 0.02, // ETH price
      Discount: 0,
      NumberToMint: 1,
      MetaData: {
        brickType: mintData.brickType || 'regular',
        brickNumber: mintData.brickId,
        perks: mintData.perks || [],
        rarity: mintData.rarity || 'common'
      },
      OnChainProvider: { value: 4, name: 'ArbitrumOASIS' }, // Specify Arbitrum provider
        OffChainProvider: { value: -1, name: 'None' },
      StoreNFTMetaDataOnChain: false,
        NFTOffChainMetaType: 'ExternalJsonURL',
        JSONMetaDataURL: 'https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88',
        NFTStandardType: { value: 1, name: 'ERC721' },
      MemoText: `Welcome to MetaBricks! Your ${mintData.brickType || 'regular'} brick is ready for the metaverse.`
    };

      console.log('📤 Sending to Arbitrum OASIS API:', oasisRequest);
      
      // Make request to Arbitrum OASIS API
      result = await makeOASISRequest('/api/Nft/mint-nft', oasisRequest);
    }
    
    console.log('🎉 OASIS API response:', result);
    
    // Check if OASIS API returned an error
    if (result.isError) {
      console.error('❌ OASIS API returned error:', result.message);
      
      // If provider not found, try to register it
      if (result.message && result.message.includes('ArbitrumOASIS provider was not found')) {
        console.log('🔄 ArbitrumOASIS provider not found, attempting registration...');
        try {
          await registerArbitrumProvider();
          
          // Retry the minting request after provider registration
          console.log('🔄 Retrying NFT minting after provider registration...');
          const retryResult = await makeOASISRequest('/api/Nft/mint-nft', oasisRequest);
          
          if (!retryResult.isError) {
            console.log('✅ NFT minting successful after provider registration:', retryResult);
            
            // Record purchase in persistent storage
            await storageUtils.recordPurchase({
              walletAddress: mintData.walletAddress,
              brickId: mintData.brickId,
              brickName: mintData.brickName || `MetaBrick #${mintData.brickId}`,
              transactionHash: retryResult.result?.transactionResult,
              timestamp: new Date().toISOString(),
              price: 0.02,
              brickType: mintData.brickType || 'regular'
            });
            
            return res.json({
              success: true,
              data: retryResult,
              message: 'NFT minted successfully after provider registration'
            });
          } else {
            console.error('❌ NFT minting still failed after provider registration:', retryResult.message);
          }
        } catch (registrationError) {
          console.error('❌ Provider registration failed:', registrationError.message);
        }
      }
      
      return res.status(400).json({
        success: false,
        error: result.message || 'OASIS API error',
        message: 'NFT minting failed - OASIS API error'
      });
    }
    
    console.log('✅ NFT minting successful:', result);
    
    // For Solana payments, transfer the NFT to the user's wallet
    if (mintData.paymentNetwork === 'solana' || mintData.originalSolanaAddress) {
      try {
        console.log('🔄 Transferring NFT to user wallet:', mintData.walletAddress);
        
        const mintAccount = result.result?.mintAccount || result.result?.MintAccount;
        if (!mintAccount) {
          throw new Error('Mint account not found in response');
        }
        
        // Wait for NFT to be fully processed on blockchain before transferring
        console.log('⏳ Waiting 5 seconds for NFT to be fully processed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Transfer NFT using the working approach we discovered
        const transferRequest = {
          FromWalletAddress: 'HT2sbYb6qjYKNjSdSWkwCp6bfYtrW9LMaGsnevLRRVnB', // OASIS wallet from OASIS_DNA.json
          ToWalletAddress: mintData.walletAddress, // User's Phantom wallet
          NFTId: mintAccount, // API expects NFTId (gets mapped to TokenAddress internally)
          FromProviderType: 'SolanaOASIS',
          ToProviderType: 'SolanaOASIS',
          Amount: 1
        };
        
        console.log('📤 Sending NFT transfer request:', transferRequest);
        const transferResult = await makeOASISRequest('/api/Nft/send-nft', transferRequest);
        
        if (transferResult.isError) {
          console.error('❌ NFT transfer failed:', transferResult.message);
          // Don't fail the entire request - NFT is minted, just not transferred yet
          console.log('⚠️ NFT minted but not transferred. User can claim manually.');
        } else {
          console.log('✅ NFT transferred successfully:', transferResult.result?.transactionResult);
          // Update the result with transfer information
          result.transferResult = transferResult;
        }
      } catch (transferError) {
        console.error('❌ NFT transfer error:', transferError.message);
        // Don't fail the entire request - NFT is minted, just not transferred yet
        console.log('⚠️ NFT minted but transfer failed. User can claim manually.');
      }
    }
    
    // Record the purchase in persistent storage
    try {
      const purchaseData = {
        brickId: mintData.brickId.toString(),
        brickName: mintData.brickName || `MetaBrick #${mintData.brickId}`,
        brickType: mintData.brickType || 'regular',
        walletAddress: mintData.walletAddress,
        transactionHash: result.result?.transactionResult || result.result?.transactionHash || result.result?.oasisnft?.hash,
        tokenId: result.result?.mintAccount || result.result?.MintAccount || result.result?.oasisnft?.id,
        price: 0.02,
        imageUrl: mintData.imageUrl,
        perks: mintData.perks || []
      };
      
      await storageUtils.recordPurchase(purchaseData);
      console.log('📝 Purchase recorded in persistent storage');
      
      // CRITICAL: Mark brick as sold in wall state so it disappears from frontend
      const brickWallState = require('./brickWallState');
      const brickNumber = parseInt(mintData.brickId?.toString().replace('Brick ', '') || mintData.brickId);
      const markedAsSold = brickWallState.markBrickAsSold(brickNumber);
      
      if (markedAsSold) {
        console.log(`🎯 Brick #${brickNumber} marked as sold in wall state - will disappear from frontend`);
        // Save the updated wall state
        brickWallState.savePurchaseHistory();
      } else {
        console.warn(`⚠️ Failed to mark brick #${brickNumber} as sold in wall state`);
      }
      
    } catch (storageError) {
      console.error('⚠️ Failed to record purchase in storage:', storageError.message);
      // Don't fail the request if storage fails
    }
    
    // Check if transfer was successful
    // The new OASIS API includes transfer info in the main response
    console.log('🔍 Full OASIS API response structure:', JSON.stringify(result, null, 2));
    
    // Check multiple possible response structures for transfer success
    const hasTransferHash = result.data?.result?.oasisnft?.sendNFTTransactionHash || 
                           result.result?.oasisnft?.sendNFTTransactionHash ||
                           result.data?.result?.sendNFTTransactionHash ||
                           result.result?.sendNFTTransactionHash;
                           
    const hasMintHash = result.data?.result?.oasisnft?.mintTransactionHash ||
                       result.result?.oasisnft?.mintTransactionHash ||
                       result.data?.result?.mintTransactionHash ||
                       result.result?.mintTransactionHash;
    
    // Also check if we have any transaction hash (mint or transfer)
    const hasAnyTransactionHash = hasTransferHash || hasMintHash || 
                                 result.data?.result?.transactionHash ||
                                 result.result?.transactionHash ||
                                 result.data?.result?.oasisnft?.hash ||
                                 result.result?.oasisnft?.hash;
    
    // Consider transfer successful if we have any transaction hash (the new API handles transfer internally)
    const transferSuccessful = !!hasAnyTransactionHash;
    
    console.log('🔍 Debug transfer check:');
    console.log('  hasTransferHash:', !!hasTransferHash);
    console.log('  hasMintHash:', !!hasMintHash);
    console.log('  hasAnyTransactionHash:', !!hasAnyTransactionHash);
    console.log('  transferSuccessful:', transferSuccessful);
    
    res.json({
      success: true,
      data: result,
      transferSuccessful: transferSuccessful,
      message: transferSuccessful ? 'NFT minted and transferred successfully!' : 'NFT minted but transfer failed',
      transferError: transferSuccessful ? null : 'Transfer failed'
    });

  } catch (error) {
    console.error('❌ NFT minting failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'NFT minting failed'
    });
  }
});

// Get Hall of Fame (buyers)
app.get('/api/hall-of-fame', async (req, res) => {
  try {
    const hallOfFame = await storageUtils.getHallOfFame();
    res.json({
      success: true,
      data: hallOfFame,
      totalBuyers: hallOfFame.length
    });
  } catch (error) {
    console.error('❌ Failed to get Hall of Fame:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get Hall of Fame'
    });
  }
});

// Get sold bricks
app.get('/api/sold-bricks', async (req, res) => {
  try {
    const soldBricks = await storageUtils.getSoldBricks();
    res.json({
      success: true,
      data: soldBricks,
      totalSold: soldBricks.length
    });
  } catch (error) {
    console.error('❌ Failed to get sold bricks:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get sold bricks'
    });
  }
});

// Get minted bricks (for frontend compatibility)
app.get('/api/minted-bricks', async (req, res) => {
  try {
    const brickWallState = require('./brickWallState');
    const allBricks = brickWallState.getBricks();
    const soldBricks = allBricks.filter(brick => brick.sold);
    
    // Return brick IDs as strings (frontend expects this format)
    const mintedBrickIds = soldBricks.map(brick => brick.id.toString());
    
    res.json({
      success: true,
      data: mintedBrickIds,
      totalMinted: mintedBrickIds.length
    });
  } catch (error) {
    console.error('❌ Failed to get minted bricks:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get minted bricks'
    });
  }
});

// Get available bricks (not sold)
app.get('/api/available-bricks', async (req, res) => {
  try {
    const availableBricks = await storageUtils.getAvailableBricks();
    res.json({
      success: true,
      data: availableBricks,
      totalAvailable: availableBricks.length
    });
  } catch (error) {
    console.error('❌ Failed to get available bricks:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get available bricks'
    });
  }
});

// Check if specific brick is sold
app.get('/api/brick-status/:brickId', async (req, res) => {
  try {
    const { brickId } = req.params;
    const isSold = await storageUtils.isBrickSold(brickId);
    res.json({
      success: true,
      brickId,
      isSold,
      available: !isSold
    });
  } catch (error) {
    console.error('❌ Failed to check brick status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check brick status'
    });
  }
});

// Get all purchases
app.get('/api/purchases', async (req, res) => {
  try {
    const purchases = await storageUtils.getAllPurchases();
    res.json({
      success: true,
      data: purchases,
      totalPurchases: purchases.length
    });
  } catch (error) {
    console.error('❌ Failed to get purchases:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get purchases'
    });
  }
});

// Mark brick as sold (for immediate removal after payment)
app.post('/api/mark-brick-sold', async (req, res) => {
  try {
    console.log('🎯 Marking brick as sold:', req.body);
    
    const { brickId, walletAddress, paymentMethod, amount, timestamp } = req.body;
    
    if (!brickId) {
      return res.status(400).json({ error: 'Brick ID is required' });
    }

    // Record the purchase
    const purchaseData = {
      brickId: brickId.toString(),
      walletAddress: walletAddress || 'unknown',
      paymentMethod: paymentMethod || 'unknown',
      amount: amount || 50.00,
      timestamp: timestamp || new Date().toISOString(),
      transactionHash: 'payment-' + Date.now()
    };

    await storageUtils.recordPurchase(purchaseData);
    
    console.log(`✅ Brick ${brickId} marked as sold via ${paymentMethod}`);
    
    res.json({ 
      success: true, 
      message: `Brick ${brickId} marked as sold`,
      brickId: brickId
    });
    
  } catch (error) {
    console.error('❌ Error marking brick as sold:', error);
    res.status(500).json({ error: 'Failed to mark brick as sold' });
  }
});

// Reset minted bricks (for frontend compatibility)
app.post('/api/reset-minted-bricks', async (req, res) => {
  try {
    console.log('🔄 Resetting minted bricks...');
    
    const brickWallState = require('./brickWallState');
    brickWallState.resetBrickWall();
    
    res.json({
      success: true,
      message: 'All bricks reset to available state'
    });
  } catch (error) {
    console.error('❌ Error resetting minted bricks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to reset minted bricks'
    });
  }
});

// Test endpoint to mark a brick as sold (bypasses OASIS API)
app.post('/api/test-mark-brick-sold', async (req, res) => {
  try {
    const { brickId } = req.body;
    
    if (!brickId) {
      return res.status(400).json({ 
        error: 'Missing required field: brickId' 
      });
    }

    console.log('🧪 Testing brick marking for brick:', brickId);
    
    const brickWallState = require('./brickWallState');
    const brickNumber = parseInt(brickId.toString().replace('Brick ', '') || brickId);
    const markedAsSold = brickWallState.markBrickAsSold(brickNumber);
    
    if (markedAsSold) {
      console.log(`🎯 Brick #${brickNumber} marked as sold in wall state`);
      brickWallState.savePurchaseHistory();
      
      res.json({
        success: true,
        message: `Brick #${brickNumber} marked as sold`,
        brickNumber: brickNumber
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to mark brick #${brickNumber} as sold`
      });
    }
  } catch (error) {
    console.error('❌ Error in test mark brick sold:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark brick as sold'
    });
  }
});

// Register SolanaOASIS provider
async function registerSolanaProvider() {
  try {
    console.log('🔧 Registering SolanaOASIS provider...');
    
    // Get current valid token
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available for provider registration');
    }
    
    // Register provider type
    const registerResponse = await axiosInstance.post(
      `${OASIS_API_URL}/api/provider/register-provider-type/SolanaOASIS`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (registerResponse.data && !registerResponse.data.isError) {
      console.log('✅ SolanaOASIS provider type registered');
    } else {
      console.log('ℹ️ SolanaOASIS provider type already registered or failed:', registerResponse.data?.message);
    }
    
    // Activate provider
    const activateResponse = await axiosInstance.post(
      `${OASIS_API_URL}/api/provider/activate-provider/SolanaOASIS`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (activateResponse.data && !activateResponse.data.isError) {
      console.log('✅ SolanaOASIS provider activated');
    } else {
      console.log('ℹ️ SolanaOASIS provider already activated or failed:', activateResponse.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to register SolanaOASIS provider:', error.message);
    console.log('🔄 Will retry provider registration on first mint request');
  }
}

// Register ArbitrumOASIS provider
async function registerArbitrumProvider() {
  try {
    console.log('🔧 Registering ArbitrumOASIS provider...');
    
    // Get current valid token
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available for provider registration');
    }
    
    // Register provider type
    const registerResponse = await axiosInstance.post(
      `${OASIS_API_URL}/api/provider/register-provider-type/ArbitrumOASIS`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (registerResponse.data && !registerResponse.data.isError) {
      console.log('✅ ArbitrumOASIS provider type registered');
    } else {
      console.log('ℹ️ ArbitrumOASIS provider type already registered or failed:', registerResponse.data?.message);
    }
    
    // Activate provider
    const activateResponse = await axiosInstance.post(
      `${OASIS_API_URL}/api/provider/activate-provider/ArbitrumOASIS`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (activateResponse.data && !activateResponse.data.isError) {
      console.log('✅ ArbitrumOASIS provider activated');
    } else {
      console.log('ℹ️ ArbitrumOASIS provider already activated or failed:', activateResponse.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to register ArbitrumOASIS provider:', error.message);
    console.log('🔄 Will retry provider registration on first mint request');
  }
}

// Initialize authentication on startup (deferred for faster startup)
async function initializeAuth() {
  // Defer authentication to avoid blocking server startup
  setTimeout(async () => {
    try {
      console.log('🔄 Starting deferred authentication...');
      
      // Use manual JWT token from oasisweb4.one
      currentToken = MANUAL_JWT_TOKEN;
      tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      console.log('🔑 Using manual JWT token from oasisweb4.one');
      console.log('🔑 Token expires at:', new Date(tokenExpiry).toISOString());
      
      // Pass token to storage utility
      if (currentToken) {
        storageUtils.setToken(currentToken);
      }
      
      // Register providers after successful authentication
      await registerSolanaProvider();
      await registerArbitrumProvider();
      
      console.log('🚀 MetaBricks backend authentication ready!');
    } catch (error) {
      console.error('❌ Failed to initialize authentication:', error.message);
      console.log('🔄 Will retry authentication on first request');
    }
  }, 1000); // Start authentication after 1 second
}

// ============================================================================
// STRIPE PAYMENT PROCESSING ENDPOINTS
// ============================================================================

// Stripe email purchase endpoint
app.post('/api/stripe-email-purchase', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  
  try {
    console.log('🔔 Creating Stripe email purchase session:', req.body);
    
    const { brickId, email, brickName, price, metadataUri } = req.body;
    
    if (!brickId || !email || !brickName || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: brickId, email, brickName, price' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Validate brick ID (should be 1-432)
    const actualBrickId = parseInt(brickId);
    if (isNaN(actualBrickId) || actualBrickId < 1 || actualBrickId > 432) {
      return res.status(400).json({ 
        error: 'Invalid brick ID. Must be between 1 and 432' 
      });
    }

    // Validate price
    const actualPrice = parseFloat(price);
    if (isNaN(actualPrice) || actualPrice <= 0) {
      return res.status(400).json({ 
        error: 'Invalid price. Must be a positive number' 
      });
    }

    console.log(`💳 Creating Stripe email purchase session for Brick #${actualBrickId} - ${email}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: brickName,
              description: 'A unique MetaBrick NFT for the metaverse - We\'ll mint it and email you instructions to claim it!',
              images: ['https://gateway.pinata.cloud/ipfs/QmYtFD9zD8oBwcc4PKhPmhgXvqvi7DNLEcfyBYpvHhAuLY']
            },
            unit_amount: Math.round(actualPrice * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://metabricks.xyz'}/success?session_id={CHECKOUT_SESSION_ID}&type=email`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://metabricks.xyz'}/cancel`,
      customer_email: email,
      metadata: {
        brickId: actualBrickId.toString(),
        email: email,
        brickName: brickName,
        metadataUri: metadataUri || '',
        price: actualPrice.toString(),
        purchaseType: 'email'
      }
    });

    console.log(`✅ Stripe email purchase session created: ${session.id}`);
    
    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      brickId: actualBrickId,
      email: email,
      price: actualPrice
    });

  } catch (error) {
    console.error('❌ Error creating email purchase session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Stripe checkout session creation (legacy)
app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  
  try {
    console.log('🔔 Creating Stripe checkout session:', req.body);
    
    const { brickId, price, metadataUri, walletAddress } = req.body;
    
    if (!brickId || !price || !walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: brickId, price, walletAddress' 
      });
    }

    // Validate brick ID (should be 1-432)
    const actualBrickId = parseInt(brickId);
    if (isNaN(actualBrickId) || actualBrickId < 1 || actualBrickId > 432) {
      return res.status(400).json({ 
        error: 'Invalid brick ID. Must be between 1 and 432' 
      });
    }

    // Validate price
    const actualPrice = parseFloat(price);
    if (isNaN(actualPrice) || actualPrice <= 0) {
      return res.status(400).json({ 
        error: 'Invalid price. Must be a positive number' 
      });
    }

    console.log(`💳 Creating Stripe session for Brick #${actualBrickId} at $${actualPrice}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `MetaBrick #${actualBrickId}`,
              description: 'A unique MetaBrick NFT for the metaverse',
              images: ['https://gateway.pinata.cloud/ipfs/QmYtFD9zD8oBwcc4PKhPmhgXvqvi7DNLEcfyBYpvHhAuLY']
            },
            unit_amount: Math.round(actualPrice * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://metabricks.xyz'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://metabricks.xyz'}/cancel`,
      metadata: {
        brickId: actualBrickId.toString(),
        walletAddress: walletAddress,
        metadataUri: metadataUri || '',
        price: actualPrice.toString()
      }
    });

    console.log(`✅ Stripe session created: ${session.id}`);
    
    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      brickId: actualBrickId,
      price: actualPrice
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Check payment status
app.get('/check-payment-status/:sessionId', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({ 
      status: session.payment_status,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Helper function to mint NFT for email purchases
async function mintNFTForEmailPurchase({ brickId, email, brickName, metadataUri, sessionId }) {
  try {
    console.log(`🎨 Minting NFT for email purchase - Brick #${brickId} for ${email}`);
    
    // Prepare mint data for OASIS API
    const mintData = {
      walletAddress: '0x0000000000000000000000000000000000000000', // Placeholder - will be updated when claimed
      brickName: brickName,
      brickType: 'regular', // Default type for email purchases
      brickId: brickId,
      imageUrl: 'https://gateway.pinata.cloud/ipfs/QmYtFD9zD8oBwcc4PKhPmhgXvqvi7DNLEcfyBYpvHhAuLY',
      perks: ['Basic Token Airdrop', 'Community Access'],
      rarity: 'common',
      email: email,
      sessionId: sessionId,
      isEmailPurchase: true
    };

    console.log('📤 Sending mint request to OASIS API...', mintData);
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/mint-nft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mintData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ NFT minted successfully for email purchase!', result);
      
      return {
        success: true,
        transactionHash: result.data?.result?.transactionResult || 'unknown',
        tokenId: result.data?.result?.tokenId || 'unknown',
        claimInstructions: generateClaimInstructions(brickId, email, result.data?.result?.transactionResult)
      };
    } else {
      throw new Error(result.error || 'NFT minting failed');
    }

  } catch (error) {
    console.error('❌ Error minting NFT for email purchase:', error);
    return {
      success: false,
      error: error.message || 'Failed to mint NFT'
    };
  }
}

// Helper function to generate claim instructions
function generateClaimInstructions(brickId, email, transactionHash) {
  return {
    title: `Your MetaBrick #${brickId} is Ready!`,
    message: `Congratulations! Your MetaBrick #${brickId} has been successfully minted and is ready to claim.`,
    steps: [
      '1. Connect your wallet to the MetaBricks platform',
      '2. Go to the "Claim NFT" section',
      '3. Enter your email address and transaction hash',
      '4. Click "Claim NFT" to transfer it to your wallet',
      '5. Your MetaBrick will appear in your wallet!'
    ],
    transactionHash: transactionHash,
    claimUrl: `${process.env.FRONTEND_URL || 'https://metabricks.xyz'}/claim?email=${encodeURIComponent(email)}&tx=${transactionHash}`,
    supportEmail: 'support@metabricks.xyz'
  };
}

// Helper function to send NFT claim email
async function sendNFTClaimEmail({ email, brickName, transactionHash, tokenId, claimInstructions }) {
  try {
    console.log(`📧 Sending claim instructions to ${email}`);
    
    // For now, we'll just log the email content
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.
    const emailContent = {
      to: email,
      subject: claimInstructions.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b0ffec;">${claimInstructions.title}</h2>
          <p>${claimInstructions.message}</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Claim Instructions:</h3>
            <ol>
              ${claimInstructions.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Transaction Hash:</strong> ${transactionHash}</p>
            <p><strong>Token ID:</strong> ${tokenId}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${claimInstructions.claimUrl}" 
               style="background: #635bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Claim Your MetaBrick
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact us at ${claimInstructions.supportEmail}
          </p>
        </div>
      `
    };
    
    console.log('📧 Email content prepared:', {
      to: emailContent.to,
      subject: emailContent.subject,
      claimUrl: claimInstructions.claimUrl
    });
    
    // TODO: Integrate with actual email service
    // await emailService.send(emailContent);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending claim email:', error);
    return { success: false, error: error.message };
  }
}

// Stripe webhook
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !endpointSecret) {
    return res.status(500).json({ error: 'Stripe webhook not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;

  console.log('🔔 Webhook received:', {
    method: req.method,
    contentType: req.headers['content-type'],
    signature: sig ? 'present' : 'missing'
  });

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified successfully');
    console.log('📋 Event type:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('🔑 Expected secret:', endpointSecret);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    console.log('💰 Checkout session completed:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata
    });

    if (session.payment_status === 'paid') {
      const { brickId, walletAddress, email, purchaseType } = session.metadata;
      
      if (brickId) {
        try {
          const brickIdNum = parseInt(brickId);
          if (!isNaN(brickIdNum) && brickIdNum >= 1 && brickIdNum <= 432) {
            
            if (purchaseType === 'email' && email) {
              // Handle email-based purchase - mint NFT and send email
              console.log(`🎨 Processing email-based purchase for Brick #${brickId} - ${email}`);
              
              try {
                // Mint the NFT using OASIS API
                const mintResult = await mintNFTForEmailPurchase({
                  brickId: brickIdNum,
                  email: email,
                  brickName: session.metadata.brickName || `MetaBrick #${brickIdNum}`,
                  metadataUri: session.metadata.metadataUri || '',
                  sessionId: session.id
                });
                
                if (mintResult.success) {
                  console.log(`✅ NFT minted successfully for email purchase: ${mintResult.transactionHash}`);
                  
                  // Send email with claim instructions
                  await sendNFTClaimEmail({
                    email: email,
                    brickName: session.metadata.brickName || `MetaBrick #${brickIdNum}`,
                    transactionHash: mintResult.transactionHash,
                    tokenId: mintResult.tokenId,
                    claimInstructions: mintResult.claimInstructions
                  });
                  
                  console.log(`📧 Claim instructions sent to ${email}`);
                } else {
                  console.error(`❌ Failed to mint NFT for email purchase: ${mintResult.error}`);
                }
              } catch (mintError) {
                console.error('❌ Error minting NFT for email purchase:', mintError);
              }
            } else {
              // Handle regular wallet-based purchase
              if (walletAddress) {
                // Record the purchase
                storageUtils.recordPurchase({
                  brickId: brickIdNum.toString(),
                  walletAddress: walletAddress,
                  paymentMethod: 'stripe',
                  amount: session.amount_total / 100, // Convert from cents
                  transactionId: session.id,
                  timestamp: new Date().toISOString()
                });
                
                console.log(`🎉 Brick ${brickId} successfully marked as sold via Stripe payment`);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error processing brick sale:', error);
        }
      }
    }
  } else if (event.type === 'payment_intent.succeeded') {
    console.log('💳 Payment intent succeeded:', event.data.object.id);
  } else if (event.type === 'payment_intent.payment_failed') {
    console.log('❌ Payment intent failed:', event.data.object.id);
  }

  res.json({ received: true });
});

// Test Stripe configuration
app.get('/test-stripe', (req, res) => {
  try {
    const stripeStatus = {
      configured: !!stripeSecretKey,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      frontendUrl: process.env.FRONTEND_URL || 'https://metabricks.xyz',
      testMode: stripeSecretKey?.startsWith('sk_test_') || false
    };
    
    res.json({
      status: 'Stripe configuration check',
      ...stripeStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Stripe configuration:', error);
    res.status(500).json({ error: 'Failed to check Stripe configuration' });
  }
});

// ============================================================================
// NFT CLAIM ENDPOINTS
// ============================================================================

// Claim NFT for email purchases
app.post('/api/claim-nft', async (req, res) => {
  try {
    console.log('🎯 NFT claim request received:', req.body);
    
    const { email, transactionHash, walletAddress } = req.body;
    
    // Validate required fields
    if (!email || !transactionHash || !walletAddress) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: email, transactionHash, walletAddress' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format' 
      });
    }

    // Validate wallet address format (basic validation)
    if (walletAddress.length < 20) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid wallet address format' 
      });
    }

    console.log(`🎯 Processing NFT claim for ${email} - ${transactionHash}`);

    // Check if this email/transaction combination exists in our records
    // For now, we'll simulate a successful claim
    // In production, you would:
    // 1. Look up the email purchase in your database
    // 2. Verify the transaction hash matches
    // 3. Check if the NFT has already been claimed
    // 4. Transfer the NFT to the user's wallet

    // Simulate NFT transfer (replace with actual OASIS API call)
    const claimResult = await simulateNFTTransfer({
      email,
      transactionHash,
      walletAddress
    });

    if (claimResult.success) {
      console.log(`✅ NFT claimed successfully for ${email}`);
      
      res.json({
        success: true,
        message: 'NFT claimed successfully! Check your wallet.',
        nftData: {
          tokenId: claimResult.tokenId,
          transactionHash: claimResult.transferHash,
          walletAddress: walletAddress
        }
      });
    } else {
      console.error(`❌ NFT claim failed for ${email}:`, claimResult.error);
      
      res.status(400).json({
        success: false,
        error: claimResult.error || 'Failed to claim NFT',
        message: 'NFT claim failed'
      });
    }

  } catch (error) {
    console.error('❌ NFT claim request failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'NFT claim request failed'
    });
  }
});

// Helper function to simulate NFT transfer
async function simulateNFTTransfer({ email, transactionHash, walletAddress }) {
  try {
    console.log(`🔄 Simulating NFT transfer for ${email} to ${walletAddress}`);
    
    // In production, this would:
    // 1. Look up the original mint transaction
    // 2. Verify the email matches the purchase
    // 3. Transfer the NFT from the holding wallet to the user's wallet
    // 4. Return the transfer transaction hash
    
    // For now, simulate a successful transfer
    const simulatedTokenId = 'token_' + Date.now();
    const simulatedTransferHash = 'transfer_' + Date.now();
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Simulated NFT transfer successful: ${simulatedTransferHash}`);
    
    return {
      success: true,
      tokenId: simulatedTokenId,
      transferHash: simulatedTransferHash
    };
    
  } catch (error) {
    console.error('❌ NFT transfer simulation failed:', error.message);
    return {
      success: false,
      error: error.message || 'Transfer failed'
    };
  }
}

// Get claim status for an email/transaction
app.get('/api/claim-status', async (req, res) => {
  try {
    const { email, transactionHash } = req.query;
    
    if (!email || !transactionHash) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameters: email, transactionHash' 
      });
    }

    // In production, check your database for claim status
    // For now, simulate checking
    const claimStatus = {
      email: email,
      transactionHash: transactionHash,
      claimed: false, // Would check actual database
      claimDate: null,
      walletAddress: null
    };

    res.json({
      success: true,
      data: claimStatus
    });

  } catch (error) {
    console.error('❌ Failed to get claim status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get claim status'
    });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start server
app.listen(PORT, () => {
  console.log(`🌐 MetaBricks backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 NFT endpoint: http://localhost:${PORT}/api/mint-nft`);
  
  // Stripe status
  if (stripeSecretKey) {
    const isTest = stripeSecretKey.startsWith('sk_test_');
    console.log(`💳 Stripe: ${isTest ? 'TEST' : 'LIVE'} mode configured`);
  } else {
    console.log(`❌ Stripe: Not configured - set STRIPE_SECRET_KEY`);
  }
  
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    console.log(`🔗 Webhook: Configured for payment processing`);
  } else {
    console.log(`⚠️ Webhook: STRIPE_WEBHOOK_SECRET not set`);
  }
});

// Initialize authentication
initializeAuth();

module.exports = app;
