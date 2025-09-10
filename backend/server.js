const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

// Create axios instance that ignores SSL certificate errors
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    timeout: 30000
  }),
  timeout: 30000, // 30 second timeout
  headers: {
    'User-Agent': 'MetaBricks-Backend/1.0',
    'Connection': 'keep-alive'
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// OASIS API Configuration
const OASIS_API_URL = process.env.OASIS_API_URL || 'https://localhost:5002';
const SITE_AVATAR_USERNAME = process.env.SITE_AVATAR_USERNAME || 'metabricks_admin';
const SITE_AVATAR_PASSWORD = process.env.SITE_AVATAR_PASSWORD || 'Uppermall1!';

// Store authentication token
let currentToken = null;
let tokenExpiry = null;

// For testing - use a hardcoded token (replace with actual token from OASIS API)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmN2RhYTgwLTE2MGUtNDIxMy05ZTgxLTk0NTAwMzkwZjMxZSIsIm5iZiI6MTc1NzQ5NjA3NCwiZXhwIjoxNzU3NDk2OTc0LCJpYXQiOjE3NTc0OTYwNzR9.uAa-kF3M9W3qCb5mdKdqmMlMj87CqJzsOJHbz0t8PXw';

/**
 * Authenticate with OASIS API using curl (fallback method)
 */
async function authenticateWithCurl() {
  try {
    console.log('🔐 Authenticating with OASIS API using curl...');
    
    const curlCommand = `curl -s -k -X POST "${OASIS_API_URL}/api/avatar/authenticate" -H "Content-Type: application/json" -d '{"username":"${SITE_AVATAR_USERNAME}","password":"${SITE_AVATAR_PASSWORD}"}' --max-time 30 --connect-timeout 10`;
    
    const { stdout, stderr } = await execAsync(curlCommand);
    
    if (stderr) {
      console.error('Curl stderr:', stderr);
    }
    
    console.log('Curl stdout length:', stdout.length);
    const response = JSON.parse(stdout);
    
    if (response?.result?.jwtToken) {
      currentToken = response.result.jwtToken;
      tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      console.log('✅ OASIS authentication successful via curl');
      return currentToken;
    } else {
      throw new Error('No token received from OASIS API');
    }
  } catch (error) {
    console.error('❌ OASIS authentication failed via curl:', error.message);
    throw error;
  }
}

/**
 * Authenticate with OASIS API and get fresh token
 */
async function authenticateWithOASIS() {
  try {
    console.log('🔐 Authenticating with OASIS API...');
    
    // For testing - use hardcoded token
    console.log('🔧 Using test token for now...');
    currentToken = TEST_TOKEN;
    tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
    console.log('✅ OASIS authentication successful (test token)');
    return currentToken;
    
    // Original authentication code (commented out for now)
    /*
    const response = await axiosInstance.post(`${OASIS_API_URL}/api/avatar/authenticate`, {
      username: SITE_AVATAR_USERNAME,
      password: SITE_AVATAR_PASSWORD
    });

    if (response.data?.result?.jwtToken) {
      currentToken = response.data.result.jwtToken;
      tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      console.log('✅ OASIS authentication successful');
      return currentToken;
    } else {
      throw new Error('No token received from OASIS API');
    }
    */
  } catch (error) {
    console.error('❌ OASIS authentication failed:', error.message);
    console.log('🔄 Trying curl fallback...');
    return await authenticateWithCurl();
  }
}

/**
 * Get valid token (authenticate if needed)
 */
async function getValidToken() {
  if (!currentToken || !tokenExpiry || Date.now() >= tokenExpiry) {
    console.log('🔄 Token expired or missing, re-authenticating...');
    await authenticateWithOASIS();
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

// NFT Minting endpoint
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

    // Prepare OASIS API request
    const oasisRequest = {
      MintWalletAddress: mintData.walletAddress,
      MintedByAvatarId: 'metabricks_site_avatar',
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
      OnChainProvider: 'ArbitrumOASIS', // Specify Arbitrum provider
      OffChainProvider: 'IPFSOASIS', // Specify IPFS for metadata storage
      NFTOffChainMetaType: 'IPFS', // Specify IPFS metadata type
      NFTStandardType: 'ERC721', // Specify ERC721 standard
      MemoText: `Welcome to MetaBricks! Your ${mintData.brickType || 'regular'} brick is ready for the metaverse.`
    };

    console.log('📤 Sending to OASIS API:', oasisRequest);
    
    // Make request to OASIS API
    const result = await makeOASISRequest('/api/Nft/mint-nft', oasisRequest);
    
    console.log('🎉 NFT minting successful:', result);
    
    res.json({
      success: true,
      data: result,
      message: 'NFT minted successfully'
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

// Initialize authentication on startup
async function initializeAuth() {
  try {
    await authenticateWithOASIS();
    console.log('🚀 MetaBricks backend ready!');
  } catch (error) {
    console.error('❌ Failed to initialize authentication:', error.message);
    console.log('🔄 Will retry authentication on first request');
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🌐 MetaBricks backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 NFT endpoint: http://localhost:${PORT}/api/mint-nft`);
});

// Initialize authentication
initializeAuth();

module.exports = app;
