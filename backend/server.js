const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const storageUtils = require('./storage/oasis-storage-utils');
const Stripe = require('stripe');
require('dotenv').config();

const execAsync = promisify(exec);

// Create axios instance that ignores SSL certificate errors
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    timeout: 60000
  }),
  timeout: 60000, // 60 second timeout
  headers: {
    'User-Agent': 'MetaBricks-Backend/1.0',
    'Connection': 'keep-alive'
  },
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  }
});

// Initialize Stripe (optional - only if STRIPE_SECRET_KEY is set)
let stripe = null;
let endpointSecret = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log('💳 Stripe initialized');
} else {
  console.log('⚠️ Stripe not configured - set STRIPE_SECRET_KEY to enable payment processing');
}

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

// Authentication token will be dynamically obtained from OASIS API

/**
 * Authenticate with OASIS API using curl (fallback method)
 */
async function authenticateWithCurl() {
  try {
    console.log('🔐 Authenticating with OASIS API using curl...');
    
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
    throw error;
  }
}

/**
 * Authenticate with OASIS API and get fresh token
 */
async function authenticateWithOASIS() {
  try {
    console.log('🔐 Authenticating with OASIS API...');
    
    const response = await axiosInstance.post(`${OASIS_API_URL}/api/avatar/authenticate`, {
      username: SITE_AVATAR_USERNAME,
      password: SITE_AVATAR_PASSWORD
    });

    if (response.data?.result?.jwtToken) {
      currentToken = response.data.result.jwtToken;
      tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      console.log('✅ OASIS authentication successful');
      console.log('🔑 Token expires at:', new Date(tokenExpiry).toISOString());
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
  // Check if token is expired or missing (with 30 second buffer)
  const bufferTime = 30 * 1000; // 30 seconds
  if (!currentToken || !tokenExpiry || Date.now() >= (tokenExpiry - bufferTime)) {
    console.log('🔄 Token expired or missing, re-authenticating...');
    
    try {
      // Try curl first (more reliable)
      console.log('🔄 Trying curl authentication...');
      const newToken = await authenticateWithCurl();
      if (!newToken) {
        throw new Error('Failed to authenticate with OASIS API via curl');
      }
    } catch (curlError) {
      console.log('🔄 Curl failed, trying axios fallback...');
      try {
        const newToken = await authenticateWithOASIS();
        if (!newToken) {
          throw new Error('Failed to authenticate with OASIS API via axios');
        }
      } catch (axiosError) {
        throw new Error('Failed to authenticate with OASIS API via both methods');
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
      OnChainProvider: 'ArbitrumOASIS', // Specify Arbitrum provider
      OffChainProvider: 'None', // Use external JSON URL instead of IPFS
      StoreNFTMetaDataOnChain: false,
      NFTOffChainMetaType: 'ExternalJsonURL', // Use external JSON URL
      JSONMetaDataURL: 'https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88', // Pinata metadata URL
      NFTStandardType: 'ERC721', // Specify ERC721 standard
      MemoText: `Welcome to MetaBricks! Your ${mintData.brickType || 'regular'} brick is ready for the metaverse.`
    };

    console.log('📤 Sending to OASIS API:', oasisRequest);
    
    // Make request to OASIS API
    const result = await makeOASISRequest('/api/Nft/mint-nft', oasisRequest);
    
    console.log('🎉 OASIS API response:', result);
    
    // Check if OASIS API returned an error
    if (result.isError) {
      console.error('❌ OASIS API returned error:', result.message);
      return res.status(400).json({
        success: false,
        error: result.message || 'OASIS API error',
        message: 'NFT minting failed - OASIS API error'
      });
    }
    
    console.log('✅ NFT minting successful:', result);
    
    // Record the purchase in persistent storage
    try {
      const purchaseData = {
        brickId: mintData.brickId.toString(),
        brickName: mintData.brickName || `MetaBrick #${mintData.brickId}`,
        brickType: mintData.brickType || 'regular',
        walletAddress: mintData.walletAddress,
        transactionHash: result.result?.transactionResult || result.result?.oasisnft?.hash,
        tokenId: result.result?.oasisnft?.id,
        price: 0.02,
        imageUrl: mintData.imageUrl,
        perks: mintData.perks || []
      };
      
      await storageUtils.recordPurchase(purchaseData);
      console.log('📝 Purchase recorded in persistent storage');
    } catch (storageError) {
      console.error('⚠️ Failed to record purchase in storage:', storageError.message);
      // Don't fail the request if storage fails
    }
    
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

// Initialize authentication on startup
async function initializeAuth() {
  try {
    // Try curl first (more reliable)
    await authenticateWithCurl();
    console.log('🚀 MetaBricks backend ready!');
  } catch (error) {
    console.error('❌ Failed to initialize authentication:', error.message);
    console.log('🔄 Will retry authentication on first request');
  }
}

// ============================================================================
// STRIPE PAYMENT PROCESSING ENDPOINTS
// ============================================================================

// Stripe checkout session creation
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
      const { brickId, walletAddress } = session.metadata;
      
      if (brickId && walletAddress) {
        try {
          // Mark brick as sold in our storage
          const brickIdNum = parseInt(brickId);
          if (!isNaN(brickIdNum) && brickIdNum >= 1 && brickIdNum <= 432) {
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
      configured: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      frontendUrl: process.env.FRONTEND_URL || 'https://metabricks.xyz',
      testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false
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
// SERVER STARTUP
// ============================================================================

// Start server
app.listen(PORT, () => {
  console.log(`🌐 MetaBricks backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 NFT endpoint: http://localhost:${PORT}/api/mint-nft`);
  
  // Stripe status
  if (process.env.STRIPE_SECRET_KEY) {
    const isTest = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
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
