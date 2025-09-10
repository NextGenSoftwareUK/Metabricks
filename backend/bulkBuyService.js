const { getBricks, getBrickById, markBrickAsSold } = require('./brickWallState');

// Bulk buy tier configuration
const BULK_BUY_TIERS = [
    {
        name: 'Starter Pack',
        quantity: 3,
        originalPrice: 150,
        discountedPrice: 142.50,
        discount: 5,
        guarantee: '1 guaranteed Industrial brick',
        savings: 7.50,
        popular: false,
        guaranteedIndustrial: 1,
        guaranteedLegendary: 0
    },
    {
        name: 'Collector Pack',
        quantity: 5,
        originalPrice: 250,
        discountedPrice: 225,
        discount: 10,
        guarantee: '1 guaranteed Industrial brick',
        savings: 25,
        popular: false,
        guaranteedIndustrial: 1,
        guaranteedLegendary: 0
    },
    {
        name: 'Investor Pack',
        quantity: 10,
        originalPrice: 500,
        discountedPrice: 425,
        discount: 15,
        guarantee: '2 guaranteed Industrial bricks',
        savings: 75,
        popular: true,
        guaranteedIndustrial: 2,
        guaranteedLegendary: 0
    },
    {
        name: 'Whale Pack',
        quantity: 20,
        originalPrice: 1000,
        discountedPrice: 800,
        discount: 20,
        guarantee: '3 guaranteed Industrial bricks + 1 guaranteed Legendary brick + Permanent Hall of Fame induction',
        savings: 200,
        popular: false,
        guaranteedIndustrial: 3,
        guaranteedLegendary: 1
    },
    {
        name: 'MetaBricks Master',
        quantity: 50,
        originalPrice: 2500,
        discountedPrice: 1875,
        discount: 25,
        guarantee: '5 guaranteed Industrial bricks + 2 guaranteed Legendary bricks + Permanent Hall of Fame induction',
        savings: 625,
        popular: false,
        guaranteedIndustrial: 5,
        guaranteedLegendary: 2
    }
];

// Brick type definitions
const BRICK_TYPES = {
    REGULAR: 'regular',
    INDUSTRIAL: 'industrial',
    LEGENDARY: 'legendary'
};

// Brick inventory management
let brickInventory = {
    totalBricks: 432,
    remainingBricks: 432,
    industrialBricks: 57,
    legendaryBricks: 8,
    reservedIndustrial: 0,
    reservedLegendary: 0,
    soldBricks: {
        regular: [],
        industrial: [],
        legendary: []
    }
};

// Initialize inventory from existing brick data
function initializeInventory() {
    const bricks = getBricks();
    const soldBricks = bricks.filter(brick => brick.sold);
    
    brickInventory.remainingBricks = brickInventory.totalBricks - soldBricks.length;
    
    // Count sold bricks by type (this would be updated when bricks are actually minted)
    brickInventory.soldBricks.regular = soldBricks.filter(brick => brick.type === 'regular').length;
    brickInventory.soldBricks.industrial = soldBricks.filter(brick => brick.type === 'industrial').length;
    brickInventory.soldBricks.legendary = soldBricks.filter(brick => brick.type === 'legendary').length;
    
    console.log('📊 Inventory initialized:', brickInventory);
}

// Get current inventory
function getInventory() {
    return { ...brickInventory };
}

// Check if a tier can be fulfilled
function canFulfillTier(tierName) {
    const tier = BULK_BUY_TIERS.find(t => t.name === tierName);
    if (!tier) return false;
    
    const availableIndustrial = brickInventory.industrialBricks - brickInventory.reservedIndustrial;
    const availableLegendary = brickInventory.legendaryBricks - brickInventory.reservedLegendary;
    
    return availableIndustrial >= tier.guaranteedIndustrial && 
           availableLegendary >= tier.guaranteedLegendary;
}

// Reserve bricks for a bulk buy order
function reserveBricks(tierName, buyerAddress) {
    const tier = BULK_BUY_TIERS.find(t => t.name === tierName);
    if (!tier) {
        throw new Error('Invalid tier');
    }
    
    if (!canFulfillTier(tierName)) {
        throw new Error('Tier cannot be fulfilled with current inventory');
    }
    
    // Reserve the guaranteed bricks
    brickInventory.reservedIndustrial += tier.guaranteedIndustrial;
    brickInventory.reservedLegendary += tier.guaranteedLegendary;
    
    const order = {
        orderId: generateOrderId(),
        tier,
        buyerAddress,
        totalPrice: tier.discountedPrice,
        guaranteedBricks: {
            industrial: tier.guaranteedIndustrial,
            legendary: tier.guaranteedLegendary
        },
        regularBricks: tier.quantity - tier.guaranteedIndustrial - tier.guaranteedLegendary,
        timestamp: new Date(),
        status: 'reserved'
    };
    
    console.log(`🔒 Reserved bricks for order ${order.orderId}:`, order);
    return order;
}

// Process bulk buy purchase and mint NFTs
async function processBulkBuyPurchase(orderId, paymentIntentId) {
    // Find the order (in a real app, this would be stored in a database)
    // For now, we'll simulate the order processing
    
    try {
        // Mark the order as paid
        const order = {
            orderId,
            status: 'paid',
            paymentIntentId,
            processedAt: new Date()
        };
        
        // Mint the guaranteed bricks as NFTs
        const mintedBricks = await mintGuaranteedBricks(order);
        
        // Update inventory
        updateInventoryAfterPurchase(order);
        
        console.log(`✅ Bulk buy order ${orderId} processed successfully`);
        return {
            success: true,
            orderId,
            mintedBricks,
            message: 'Bulk buy order processed successfully'
        };
        
    } catch (error) {
        console.error(`❌ Error processing bulk buy order ${orderId}:`, error);
        throw error;
    }
}

// Mint guaranteed bricks as NFTs
async function mintGuaranteedBricks(order) {
    const mintedBricks = [];
    
    try {
        // Mint Industrial bricks
        for (let i = 0; i < order.guaranteedBricks.industrial; i++) {
            const brickId = await mintIndustrialBrick(order.buyerAddress);
            mintedBricks.push({
                type: 'industrial',
                brickId,
                buyerAddress: order.buyerAddress
            });
        }
        
        // Mint Legendary bricks
        for (let i = 0; i < order.guaranteedBricks.legendary; i++) {
            const brickId = await mintLegendaryBrick(order.buyerAddress);
            mintedBricks.push({
                type: 'legendary',
                brickId,
                buyerAddress: order.buyerAddress
            });
        }
        
        console.log(`🎨 Minted ${mintedBricks.length} guaranteed bricks for order ${order.orderId}`);
        return mintedBricks;
        
    } catch (error) {
        console.error('❌ Error minting guaranteed bricks:', error);
        throw error;
    }
}

// Mint an Industrial brick
async function mintIndustrialBrick(buyerAddress) {
    // Find an available Industrial brick
    const availableIndustrialBricks = getBricks().filter(brick => 
        brick.type === 'industrial' && !brick.sold
    );
    
    if (availableIndustrialBricks.length === 0) {
        throw new Error('No Industrial bricks available');
    }
    
    // Select the first available Industrial brick
    const brick = availableIndustrialBricks[0];
    
    // Mark as sold and mint
    markBrickAsSold(brick.id);
    
    // Update inventory
    brickInventory.industrialBricks--;
    brickInventory.reservedIndustrial--;
    brickInventory.remainingBricks--;
    
    console.log(`🏭 Minted Industrial brick #${brick.id} for ${buyerAddress}`);
    return brick.id;
}

// Mint a Legendary brick
async function mintLegendaryBrick(buyerAddress) {
    // Find an available Legendary brick
    const availableLegendaryBricks = getBricks().filter(brick => 
        brick.type === 'legendary' && !brick.sold
    );
    
    if (availableLegendaryBricks.length === 0) {
        throw new Error('No Legendary bricks available');
    }
    
    // Select the first available Legendary brick
    const brick = availableLegendaryBricks[0];
    
    // Mark as sold and mint
    markBrickAsSold(brick.id);
    
    // Update inventory
    brickInventory.legendaryBricks--;
    brickInventory.reservedLegendary--;
    brickInventory.remainingBricks--;
    
    console.log(`👑 Minted Legendary brick #${brick.id} for ${buyerAddress}`);
    return brick.id;
}

// Update inventory after successful purchase
function updateInventoryAfterPurchase(order) {
    // Release reservations
    brickInventory.reservedIndustrial -= order.guaranteedBricks.industrial;
    brickInventory.reservedLegendary -= order.guaranteedBricks.legendary;
    
    console.log('📊 Inventory updated after purchase:', brickInventory);
}

// Generate unique order ID
function generateOrderId() {
    return `BB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get bulk buy tiers
function getBulkBuyTiers() {
    return BULK_BUY_TIERS;
}

// Cancel reservation
function cancelReservation(orderId) {
    // In a real app, this would find the order and release the reservations
    console.log(`❌ Cancelled reservation for order ${orderId}`);
    return { success: true };
}

module.exports = {
    initializeInventory,
    getInventory,
    canFulfillTier,
    reserveBricks,
    processBulkBuyPurchase,
    getBulkBuyTiers,
    cancelReservation
};







