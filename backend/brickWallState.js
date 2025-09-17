// Updated MetaBricks configuration with new randomized IPFS hash
const BRICK_CONFIG = {
    // New randomized MetaBricks IPFS hash
    IPFS_CID: 'bafybeihkspp2kxsz4moylkgjpkdwm4sbafqluqmtzh3hy7x42jhvx6n5ym',
    // All bricks cost the same for mystery box approach
    UNIFORM_PRICE: 50,
    // Total bricks in the wall
    TOTAL_BRICKS: 432,
    // Wall dimensions
    ROWS: 24,
    COLS: 18
};

// Generate all 432 bricks with mystery system and bulk buy support
function generateAllBricks() {
    const bricks = [];
    
    // Define brick type distribution for bulk buy system
    const BRICK_TYPE_DISTRIBUTION = {
        regular: 367,      // 85% - Regular bricks
        industrial: 57,    // 13% - Industrial bricks (for bulk buy guarantees)
        legendary: 8       // 2% - Legendary bricks (for bulk buy guarantees)
    };
    
    let brickTypeCounter = {
        regular: 0,
        industrial: 0,
        legendary: 0
    };
    
    for (let brickId = 1; brickId <= BRICK_CONFIG.TOTAL_BRICKS; brickId++) {
        // Calculate position on the wall
        const row = Math.floor((brickId - 1) / BRICK_CONFIG.COLS);
        const col = (brickId - 1) % BRICK_CONFIG.COLS;
        
        // Determine brick type based on distribution
        let brickType = 'regular';
        if (brickTypeCounter.legendary < BRICK_TYPE_DISTRIBUTION.legendary) {
            brickType = 'legendary';
            brickTypeCounter.legendary++;
        } else if (brickTypeCounter.industrial < BRICK_TYPE_DISTRIBUTION.industrial) {
            brickType = 'industrial';
            brickTypeCounter.industrial++;
        } else {
            brickType = 'regular';
            brickTypeCounter.regular++;
        }
        
        // All bricks have the same price for mystery box approach
        const brick = {
            id: brickId,
            // Brick type for bulk buy system
            type: brickType,
            price: BRICK_CONFIG.UNIFORM_PRICE,
            sold: false,
            
            // Frontend expected properties
            name: `MetaBrick #${brickId}`,
            seriesNumber: brickId,
            mintPrice: `$${BRICK_CONFIG.UNIFORM_PRICE}`,
            
            // New metadata URI pointing to randomized IPFS folder
            metadataUri: `https://gateway.pinata.cloud/ipfs/${BRICK_CONFIG.IPFS_CID}/${brickId}.json`,
            
            // Position on the wall
            position: {
                row: row,
                col: col,
                display: `X${col + 1}, Y${row + 1}`
            },
            
            // Mystery system properties
            rarity: brickType === 'legendary' ? 'legendary' : 
                   brickType === 'industrial' ? 'industrial' : 'regular',
            perks: 'mystery',  // Will be revealed at thresholds
            guaranteedPerk: 'MetaBrick Keychain' // Only guaranteed perk
        };
        
        bricks.push(brick);
    }
    
    console.log(`🏗️ Generated ${bricks.length} bricks:`, brickTypeCounter);
    return bricks;
}

let bricks = generateAllBricks();

// Load existing purchase history from persistent storage
loadPurchaseHistory();

// Get all bricks
function getBricks() {
    return bricks;
}

// Get brick statistics
function getBrickStats() {
    const total = bricks.length;
    const sold = bricks.filter(brick => brick.sold).length;
    const available = total - sold;
    
    const stats = {
        total,
        sold,
        available,
        completionPercentage: Math.round((sold / total) * 100),
        revenue: sold * BRICK_CONFIG.UNIFORM_PRICE,
        mysterySystem: {
            description: 'All bricks cost $50 with mystery rarity and perks',
            guaranteedPerk: 'MetaBrick Keychain',
            perkRevealThresholds: [
                { percentage: 10, bricksRequired: 43, description: 'First exciting perks revealed' },
                { percentage: 25, bricksRequired: 108, description: 'Bronze and Silver API access' },
                { percentage: 50, bricksRequired: 216, description: 'Gold API and premium perks' },
                { percentage: 75, bricksRequired: 324, description: 'Advanced integration perks' },
                { percentage: 100, bricksRequired: 432, description: 'OASIS integration and early access' }
            ]
        }
    };
    
    return stats;
}

// Get brick by ID
function getBrickById(id) {
    return bricks.find(brick => brick.id === parseInt(id));
}

// Mark brick as sold
function markBrickAsSold(id) {
    const brick = getBrickById(id);
    if (brick) {
        // Check if already sold
        if (brick.sold) {
            console.warn(`⚠️ MetaBrick #${id} is already sold (sold at: ${brick.soldAt})`);
            return false;
        }
        
        brick.sold = true;
        brick.soldAt = new Date().toISOString();
        
        // Log the sale for tracking
        console.log(`🎉 MetaBrick #${id} sold for $${brick.price}!`);
        console.log(`   Sold at: ${brick.soldAt}`);
        console.log(`   Total bricks sold: ${getBrickStats().sold}/${getBrickStats().total}`);
        
        return true;
    }
    console.error(`❌ MetaBrick #${id} not found in system`);
    return false;
}

// Reset all bricks to unsold state
function resetBrickWall() {
    bricks.forEach(brick => {
        brick.sold = false;
        delete brick.soldAt;
    });
    console.log('🔄 MetaBricks wall reset - all bricks available for purchase');
}

// Get next available brick (for sequential minting)
function getNextAvailableBrick() {
    return bricks.find(brick => !brick.sold);
}

// Get completion milestone info
function getCompletionMilestone() {
    const stats = getBrickStats();
    const currentPercentage = stats.completionPercentage;
    
    // Find the next milestone
    const milestones = stats.mysterySystem.perkRevealThresholds;
    const nextMilestone = milestones.find(milestone => milestone.bricksRequired > stats.sold);
    
    return {
        currentPercentage,
        bricksSold: stats.sold,
        nextMilestone: nextMilestone || null,
        progressToNext: nextMilestone ? 
            Math.round(((stats.sold / nextMilestone.bricksRequired) * 100)) : 100
    };
}

// Persistent storage functions
function savePurchaseHistory() {
    try {
        const soldBricks = bricks.filter(brick => brick.sold).map(brick => ({
            id: brick.id,
            soldAt: brick.soldAt,
            price: brick.price,
            walletAddress: brick.walletAddress || 'unknown'
        }));
        
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(__dirname, 'purchase_history.json');
        
        fs.writeFileSync(dataPath, JSON.stringify({
            lastUpdated: new Date().toISOString(),
            totalSold: soldBricks.length,
            soldBricks: soldBricks
        }, null, 2));
        
        console.log(`💾 Purchase history saved: ${soldBricks.length} bricks`);
    } catch (error) {
        console.error('❌ Error saving purchase history:', error);
    }
}

function loadPurchaseHistory() {
    try {
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(__dirname, 'purchase_history.json');
        
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            console.log(`📚 Loading purchase history: ${data.totalSold} bricks sold`);
            
            // Restore sold status for bricks
            data.soldBricks.forEach(soldBrick => {
                const brick = getBrickById(soldBrick.id);
                if (brick) {
                    brick.sold = true;
                    brick.soldAt = soldBrick.soldAt;
                    brick.walletAddress = soldBrick.walletAddress;
                    console.log(`🔄 Restored brick #${soldBrick.id} as sold`);
                }
            });
            
            console.log(`✅ Purchase history restored successfully`);
        } else {
            console.log('📚 No existing purchase history found, starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading purchase history:', error);
    }
}

// Enhanced reset function that preserves purchase history
function resetBrickWall() {
    console.log('⚠️ WARNING: This will reset ALL bricks to unsold state!');
    console.log('📚 Purchase history will be preserved in purchase_history.json');
    
    bricks.forEach(brick => {
        brick.sold = false;
        delete brick.soldAt;
        delete brick.walletAddress;
    });
    
    // Save the reset state
    savePurchaseHistory();
    
    console.log('🔄 MetaBricks wall reset - all bricks available for purchase');
    console.log('💾 Previous purchase history preserved in purchase_history.json');
}

module.exports = {
    getBricks,
    getBrickStats,
    getBrickById,
    markBrickAsSold,
    resetBrickWall,
    getNextAvailableBrick,
    getCompletionMilestone,
    savePurchaseHistory,
    BRICK_CONFIG
};
