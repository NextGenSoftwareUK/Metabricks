const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

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

/**
 * Authenticate with OASIS API and get fresh token
 */
async function authenticateWithOASIS() {
  try {
    console.log('🔐 Authenticating with OASIS API...');
    
    const response = await axios.post(`${OASIS_API_URL}/api/avatar/authenticate`, {
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
  } catch (error) {
    console.error('❌ OASIS authentication failed:', error.message);
    throw error;
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
    
    const response = await axios.post(`${OASIS_API_URL}${endpoint}`, data, {
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
      const retryResponse = await axios.post(`${OASIS_API_URL}${endpoint}`, data, {
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
      walletAddress: mintData.walletAddress,
      brickId: mintData.brickId,
      brickName: mintData.brickName || `MetaBrick #${mintData.brickId}`,
      brickType: mintData.brickType || 'regular',
      metadataUrl: mintData.metadataUrl,
      imageUrl: mintData.imageUrl,
      perks: mintData.perks || [],
      rarity: mintData.rarity || 'common'
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
