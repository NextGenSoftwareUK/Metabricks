const axios = require('axios');
const https = require('https');

// Create axios instance that ignores SSL certificate errors
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    timeout: 60000
  }),
  timeout: 60000,
  headers: {
    'User-Agent': 'MetaBricks-OASIS-Storage/1.0',
    'Connection': 'keep-alive'
  },
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  }
});

// OASIS API Configuration
const OASIS_API_URL = process.env.OASIS_API_URL || 'https://localhost:5002';
const SITE_AVATAR_USERNAME = process.env.SITE_AVATAR_USERNAME || 'metabricks_admin';
const SITE_AVATAR_PASSWORD = process.env.SITE_AVATAR_PASSWORD || 'Uppermall1!';

// Store authentication token
let currentToken = null;
let tokenExpiry = null;

/**
 * Authenticate with OASIS API
 */
async function authenticateWithOASIS() {
  try {
    console.log('🔐 OASIS Storage: Authenticating...');
    
    const response = await axiosInstance.post(`${OASIS_API_URL}/api/avatar/authenticate`, {
      username: SITE_AVATAR_USERNAME,
      password: SITE_AVATAR_PASSWORD
    });

    if (response.data?.result?.jwtToken) {
      currentToken = response.data.result.jwtToken;
      tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      console.log('✅ OASIS Storage: Authentication successful');
      return currentToken;
    } else {
      throw new Error('No token received from OASIS API');
    }
  } catch (error) {
    console.error('❌ OASIS Storage: Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Set token from external source (main backend)
 */
function setToken(token) {
  currentToken = token;
  tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
  console.log('✅ OASIS Storage: Token set from external source');
}

/**
 * Get valid token (authenticate if needed)
 */
async function getValidToken() {
  const bufferTime = 30 * 1000; // 30 seconds
  if (!currentToken || !tokenExpiry || Date.now() >= (tokenExpiry - bufferTime)) {
    console.log('🔄 OASIS Storage: Token expired, re-authenticating...');
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
    const response = await axiosInstance.post(`${OASIS_API_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ OASIS Storage: Request failed:', error.response?.data || error.message);
    
    // If token is invalid, try to re-authenticate once
    if (error.response?.status === 401) {
      console.log('🔄 OASIS Storage: Token invalid, re-authenticating...');
      await authenticateWithOASIS();
      
      // Retry the request
      const retryResponse = await axiosInstance.post(`${OASIS_API_URL}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return retryResponse.data;
    }
    
    throw error;
  }
}

/**
 * Store purchase data in OASIS MongoDB
 */
async function recordPurchase(purchaseData) {
  try {
    console.log('💾 OASIS Storage: Recording purchase:', purchaseData.brickId);
    
    // Create a Holon (OASIS data structure) for the purchase
    const holonData = {
      Name: `MetaBrick Purchase #${purchaseData.brickId}`,
      Description: `Purchase record for MetaBrick #${purchaseData.brickId}`,
      HolonType: 'MetaBrickPurchase',
      ProviderKey: 'MongoOASIS', // Use MongoDB provider
      MetaData: {
        brickId: purchaseData.brickId,
        brickName: purchaseData.brickName || `MetaBrick #${purchaseData.brickId}`,
        brickType: purchaseData.brickType || 'regular',
        walletAddress: purchaseData.walletAddress,
        transactionHash: purchaseData.transactionHash,
        tokenId: purchaseData.tokenId,
        price: purchaseData.price || 0.02,
        imageUrl: purchaseData.imageUrl,
        perks: purchaseData.perks || [],
        paymentMethod: purchaseData.paymentMethod || 'crypto',
        timestamp: purchaseData.timestamp || new Date().toISOString(),
        // Additional metadata
        purchaseId: `purchase_${purchaseData.brickId}_${Date.now()}`,
        status: 'completed'
      },
      // Store in MongoDB through OASIS
      ProviderMetaData: {
        collection: 'metabricks_purchases',
        database: 'metabricks'
      }
    };

    const result = await makeOASISRequest('/api/holon/save-holon', holonData);
    
    if (result.isError) {
      throw new Error(`OASIS API error: ${result.message}`);
    }
    
    console.log('✅ OASIS Storage: Purchase recorded successfully');
    return result;
    
  } catch (error) {
    console.error('❌ OASIS Storage: Failed to record purchase:', error.message);
    throw error;
  }
}

/**
 * Get all purchases from OASIS MongoDB
 */
async function getAllPurchases() {
  try {
    console.log('📋 OASIS Storage: Fetching all purchases...');
    
    const searchData = {
      ProviderKey: 'MongoOASIS',
      HolonType: 'MetaBrickPurchase',
      ProviderMetaData: {
        collection: 'metabricks_purchases',
        database: 'metabricks'
      }
    };

    const result = await makeOASISRequest('/api/holon/search-holons', searchData);
    
    if (result.isError) {
      throw new Error(`OASIS API error: ${result.message}`);
    }
    
    // Extract purchase data from Holons
    const purchases = result.result?.map(holon => ({
      id: holon.id,
      brickId: holon.metaData?.brickId,
      brickName: holon.metaData?.brickName,
      brickType: holon.metaData?.brickType,
      walletAddress: holon.metaData?.walletAddress,
      transactionHash: holon.metaData?.transactionHash,
      tokenId: holon.metaData?.tokenId,
      price: holon.metaData?.price,
      imageUrl: holon.metaData?.imageUrl,
      perks: holon.metaData?.perks,
      paymentMethod: holon.metaData?.paymentMethod,
      timestamp: holon.metaData?.timestamp,
      purchaseId: holon.metaData?.purchaseId,
      status: holon.metaData?.status
    })) || [];
    
    console.log(`✅ OASIS Storage: Retrieved ${purchases.length} purchases`);
    return purchases;
    
  } catch (error) {
    console.error('❌ OASIS Storage: Failed to get purchases:', error.message);
    throw error;
  }
}

/**
 * Get sold bricks (simplified list for quick lookup)
 */
async function getSoldBricks() {
  try {
    const purchases = await getAllPurchases();
    
    // Return simplified list for quick lookup
    const soldBricks = purchases.map(purchase => ({
      brickId: purchase.brickId,
      walletAddress: purchase.walletAddress,
      timestamp: purchase.timestamp
    }));
    
    console.log(`✅ OASIS Storage: Retrieved ${soldBricks.length} sold bricks`);
    return soldBricks;
    
  } catch (error) {
    console.error('❌ OASIS Storage: Failed to get sold bricks:', error.message);
    console.log('🔄 OASIS Storage: Returning empty array as fallback');
    // Return empty array as fallback when OASIS is unavailable
    return [];
  }
}

/**
 * Check if a brick is sold
 */
async function isBrickSold(brickId) {
  try {
    const soldBricks = await getSoldBricks();
    
    // Check both formats: "123" and "Brick 123"
    const isSold = soldBricks.some(brick => 
      brick.brickId === brickId || 
      brick.brickId === `Brick ${brickId}` ||
      brickId === `Brick ${brick.brickId}`
    );
    
    return isSold;
    
  } catch (error) {
    console.error('❌ OASIS Storage: Failed to check brick status:', error.message);
    return false; // Default to not sold if check fails
  }
}

/**
 * Get Hall of Fame (top buyers by wallet address)
 */
async function getHallOfFame() {
  try {
    console.log('🏆 OASIS Storage: Building Hall of Fame...');
    
    const purchases = await getAllPurchases();
    
    // Group by wallet address and count bricks
    const walletStats = {};
    
    purchases.forEach(purchase => {
      const wallet = purchase.walletAddress;
      if (!walletStats[wallet]) {
        walletStats[wallet] = {
          walletAddress: wallet,
          brickCount: 0,
          totalSpent: 0,
          purchases: []
        };
      }
      
      walletStats[wallet].brickCount++;
      walletStats[wallet].totalSpent += (purchase.price || 0.02);
      walletStats[wallet].purchases.push({
        brickId: purchase.brickId,
        brickName: purchase.brickName,
        timestamp: purchase.timestamp
      });
    });
    
    // Convert to array and sort by brick count
    const hallOfFame = Object.values(walletStats)
      .sort((a, b) => b.brickCount - a.brickCount)
      .slice(0, 50); // Top 50 buyers
    
    console.log(`✅ OASIS Storage: Hall of Fame built with ${hallOfFame.length} buyers`);
    return hallOfFame;
    
  } catch (error) {
    console.error('❌ OASIS Storage: Failed to build Hall of Fame:', error.message);
    throw error;
  }
}

/**
 * Get available bricks (not sold)
 */
async function getAvailableBricks() {
  try {
    const soldBricks = await getSoldBricks();
    const soldBrickIds = new Set(soldBricks.map(brick => brick.brickId));
    
    // Generate list of all 432 bricks
    const allBricks = [];
    for (let i = 1; i <= 432; i++) {
      const brickId = i.toString();
      const brickIdFormatted = `Brick ${i}`;
      
      // Check if brick is sold (handle both formats)
      const isSold = soldBrickIds.has(brickId) || soldBrickIds.has(brickIdFormatted);
      
      if (!isSold) {
        allBricks.push({
          brickId: brickId,
          brickName: `MetaBrick #${i}`,
          available: true
        });
      }
    }
    
    console.log(`✅ OASIS Storage: Retrieved ${allBricks.length} available bricks`);
    return allBricks;
    
  } catch (error) {
    console.error('❌ OASIS Storage: Failed to get available bricks:', error.message);
    console.log('🔄 OASIS Storage: Returning all bricks as available (fallback)');
    // Return all bricks as available when OASIS is unavailable
    const allBricks = [];
    for (let i = 1; i <= 432; i++) {
      allBricks.push({
        brickId: i.toString(),
        brickName: `MetaBrick #${i}`,
        available: true
      });
    }
    return allBricks;
  }
}

module.exports = {
  recordPurchase,
  getAllPurchases,
  getSoldBricks,
  isBrickSold,
  getHallOfFame,
  getAvailableBricks,
  setToken
};
