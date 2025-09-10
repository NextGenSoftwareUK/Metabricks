const fs = require('fs').promises;
const path = require('path');

// Storage file paths
const PURCHASES_FILE = path.join(__dirname, 'purchases.json');
const SOLD_BRICKS_FILE = path.join(__dirname, 'sold-bricks.json');

/**
 * Read data from a JSON file
 */
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default structure
      return { data: [], lastUpdated: null, totalCount: 0 };
    }
    throw error;
  }
}

/**
 * Write data to a JSON file
 */
async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Record a brick purchase
 */
async function recordPurchase(purchaseData) {
  try {
    const purchases = await readJsonFile(PURCHASES_FILE);
    
    const purchase = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      brickId: purchaseData.brickId,
      brickName: purchaseData.brickName,
      brickType: purchaseData.brickType,
      walletAddress: purchaseData.walletAddress,
      transactionHash: purchaseData.transactionHash,
      tokenId: purchaseData.tokenId,
      price: purchaseData.price,
      imageUrl: purchaseData.imageUrl,
      perks: purchaseData.perks || []
    };
    
    purchases.purchases.push(purchase);
    purchases.lastUpdated = new Date().toISOString();
    purchases.totalSold = purchases.purchases.length;
    
    await writeJsonFile(PURCHASES_FILE, purchases);
    
    // Also record in sold bricks
    await recordSoldBrick(purchaseData);
    
    return purchase;
  } catch (error) {
    console.error('Error recording purchase:', error);
    throw error;
  }
}

/**
 * Record a sold brick
 */
async function recordSoldBrick(brickData) {
  try {
    const soldBricks = await readJsonFile(SOLD_BRICKS_FILE);
    
    const soldBrick = {
      brickId: brickData.brickId,
      brickName: brickData.brickName,
      brickType: brickData.brickType,
      soldAt: new Date().toISOString(),
      walletAddress: brickData.walletAddress,
      transactionHash: brickData.transactionHash,
      tokenId: brickData.tokenId
    };
    
    // Check if brick is already recorded as sold
    const existingIndex = soldBricks.soldBricks.findIndex(brick => brick.brickId === brickData.brickId);
    if (existingIndex >= 0) {
      soldBricks.soldBricks[existingIndex] = soldBrick;
    } else {
      soldBricks.soldBricks.push(soldBrick);
    }
    
    soldBricks.lastUpdated = new Date().toISOString();
    soldBricks.totalSold = soldBricks.soldBricks.length;
    
    await writeJsonFile(SOLD_BRICKS_FILE, soldBricks);
    
    return soldBrick;
  } catch (error) {
    console.error('Error recording sold brick:', error);
    throw error;
  }
}

/**
 * Get all purchases (Hall of Fame data)
 */
async function getAllPurchases() {
  try {
    const purchases = await readJsonFile(PURCHASES_FILE);
    return purchases.purchases || [];
  } catch (error) {
    console.error('Error reading purchases:', error);
    return [];
  }
}

/**
 * Get sold bricks
 */
async function getSoldBricks() {
  try {
    const soldBricks = await readJsonFile(SOLD_BRICKS_FILE);
    return soldBricks.soldBricks || [];
  } catch (error) {
    console.error('Error reading sold bricks:', error);
    return [];
  }
}

/**
 * Check if a brick is sold
 */
async function isBrickSold(brickId) {
  try {
    const soldBricks = await getSoldBricks();
    return soldBricks.some(brick => brick.brickId === brickId);
  } catch (error) {
    console.error('Error checking if brick is sold:', error);
    return false;
  }
}

/**
 * Get Hall of Fame (unique buyers with their purchases)
 */
async function getHallOfFame() {
  try {
    const purchases = await getAllPurchases();
    const buyerMap = new Map();
    
    purchases.forEach(purchase => {
      const walletAddress = purchase.walletAddress;
      if (!buyerMap.has(walletAddress)) {
        buyerMap.set(walletAddress, {
          walletAddress,
          totalPurchases: 0,
          totalSpent: 0,
          firstPurchase: purchase.timestamp,
          lastPurchase: purchase.timestamp,
          purchases: []
        });
      }
      
      const buyer = buyerMap.get(walletAddress);
      buyer.totalPurchases++;
      buyer.totalSpent += purchase.price || 0;
      buyer.lastPurchase = purchase.timestamp;
      buyer.purchases.push({
        brickId: purchase.brickId,
        brickName: purchase.brickName,
        brickType: purchase.brickType,
        transactionHash: purchase.transactionHash,
        timestamp: purchase.timestamp
      });
    });
    
    // Convert to array and sort by total purchases (descending)
    const hallOfFame = Array.from(buyerMap.values()).sort((a, b) => b.totalPurchases - a.totalPurchases);
    
    return hallOfFame;
  } catch (error) {
    console.error('Error getting Hall of Fame:', error);
    return [];
  }
}

/**
 * Get available bricks (not sold)
 */
async function getAvailableBricks() {
  try {
    const soldBricks = await getSoldBricks();
    const soldBrickIds = new Set(soldBricks.map(brick => brick.brickId));
    
    // Generate all 432 bricks
    const allBricks = [];
    for (let i = 1; i <= 432; i++) {
      if (!soldBrickIds.has(i.toString())) {
        allBricks.push({
          id: i,
          brickId: i.toString(),
          available: true
        });
      }
    }
    
    return allBricks;
  } catch (error) {
    console.error('Error getting available bricks:', error);
    return [];
  }
}

module.exports = {
  recordPurchase,
  recordSoldBrick,
  getAllPurchases,
  getSoldBricks,
  isBrickSold,
  getHallOfFame,
  getAvailableBricks
};
