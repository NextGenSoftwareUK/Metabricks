n# 🚀 **PUMP.FUN INTEGRATION PLAN FOR METABRICKS**

## **🎯 Overview**

This document outlines the complete plan for integrating pump.fun tokens with MetaBricks, creating a revolutionary gaming experience where each MetaBrick NFT contains locked pump.fun tokens that unlock when brick walls are destroyed.

---

## **Phase 1: Technical Foundation**

### **1.1 pump.fun Program Research**
- **Program ID**: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- **Key Instructions**: `create`, `buy`, `sell`, `withdraw`
- **Bonding Curve**: Automatic price discovery mechanism
- **Token Standard**: SPL tokens with pump.fun bonding curve

### **1.2 Integration Architecture**
```
MetaBrick NFT → Contains pump.fun Token → Locked in Brick → Wall Destruction → Token Unlock
```

---

## **Phase 2: Configuration Enhancement**

### **2.1 Enhanced MetaBricksConfig Interface**
```typescript
interface MetabricksConfig {
  // Existing config...
  
  // NEW: pump.fun Integration
  PUMP_FUN: {
    PROGRAM_ID: string;
    BONDING_CURVE_PROGRAM: string;
    TOKEN_PROGRAM: string;
    INTEGRATION_ENABLED: boolean;
    DEFAULT_TOKEN_SUPPLY: number;
    BONDING_CURVE_START_PRICE: number;
    WALL_DESTRUCTION_THRESHOLD: number;
  };
}
```

### **2.2 Configuration Values**
- **Program ID**: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- **Token Program**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- **Default Supply**: 1,000,000 tokens per brick
- **Start Price**: 0.000001 SOL
- **Destruction Threshold**: 50% of bricks in wall

---

## **Phase 3: Enhanced MetaBrick Structure**

### **3.1 Updated MetaBrick Interface**
```typescript
interface MetaBrick {
  id: number;
  name: string;
  rarity: 'regular' | 'industrial' | 'legendary';
  perks: string[];
  
  // Existing fields...
  metadata: BrickMetadata;
  imageUrl: string;
  price: number;
  
  // NEW: pump.fun Integration
  pumpFunToken: {
    tokenMint: string;           // Solana token mint address
    bondingCurve: string;       // pump.fun bonding curve address
    tokenSupply: number;        // Total supply locked in brick
    currentPrice: number;       // Current price on bonding curve
    isLocked: boolean;          // Tokens locked in brick
    unlockCondition: 'wall_destruction' | 'collection_complete' | 'time_based';
    wallId?: string;            // Which wall this brick belongs to
  };
}
```

---

## **Phase 4: New Services Architecture**

### **4.1 PumpFunService**
```typescript
@Injectable()
export class PumpFunService {
  // Core pump.fun operations
  async createToken(brickId: number): Promise<PumpFunToken>
  async buyToken(tokenMint: string, amount: number): Promise<Transaction>
  async sellToken(tokenMint: string, amount: number): Promise<Transaction>
  async getTokenPrice(tokenMint: string): Promise<number>
  async getTokenSupply(tokenMint: string): Promise<number>
  
  // MetaBricks integration
  async createBrickToken(brick: MetaBrick): Promise<PumpFunToken>
  async lockTokensInBrick(brick: MetaBrick, token: PumpFunToken): Promise<void>
  async unlockTokensFromBrick(brick: MetaBrick): Promise<Transaction>
}
```

### **4.2 BrickWallService**
```typescript
@Injectable()
export class BrickWallService {
  // Wall management
  async createWall(bricks: MetaBrick[]): Promise<BrickWall>
  async addBrickToWall(wallId: string, brick: MetaBrick): Promise<void>
  async removeBrickFromWall(wallId: string, brickId: number): Promise<void>
  
  // Destruction mechanics
  async destroyWall(wallId: string): Promise<TokenUnlockResult>
  async checkDestructionThreshold(wallId: string): Promise<boolean>
  async distributeUnlockedTokens(wallId: string, participants: string[]): Promise<void>
  
  // Wall status
  async getWallStatus(wallId: string): Promise<WallStatus>
  async getDestroyedBricks(wallId: string): Promise<MetaBrick[]>
}
```

---

## **Phase 5: Enhanced Minting Flow**

### **5.1 Updated Minting Process**
```typescript
async mintBrickWithPumpFunToken(brickId: number, userWallet: string) {
  // 1. Generate brick metadata (existing)
  const metadata = this.brickPerkService.generateBrickMetadata(brickId);
  
  // 2. Create pump.fun token for this brick
  const pumpFunToken = await this.pumpFunService.createBrickToken({
    id: brickId,
    name: `MetaBrick #${brickId}`,
    rarity: metadata.hiddenMetadata.type,
    // ... other brick properties
  });
  
  // 3. Mint MetaBrick NFT (existing)
  const metaBrick = await this.mintBrickSolana(brickId);
  
  // 4. Lock pump.fun tokens in the brick
  await this.pumpFunService.lockTokensInBrick(metaBrick, pumpFunToken);
  
  // 5. Add brick to wall (if applicable)
  await this.brickWallService.addBrickToWall('main-wall', metaBrick);
  
  return { metaBrick, pumpFunToken };
}
```

---

## **Phase 6: Wall Destruction Mechanics**

### **6.1 Destruction Triggers**
- **Manual Destruction**: User clicks "Destroy Wall" button
- **Threshold Destruction**: Automatic when 50% of bricks destroyed
- **Time-based Destruction**: After certain time period
- **Collection Complete**: When all bricks in wall are minted

### **6.2 Token Unlock Process**
```typescript
async destroyWall(wallId: string): Promise<TokenUnlockResult> {
  const wall = await this.getWall(wallId);
  const destroyedBricks = await this.getDestroyedBricks(wallId);
  
  if (destroyedBricks.length >= wall.destructionThreshold) {
    // 1. Unlock all pump.fun tokens in destroyed bricks
    const unlockedTokens = await this.unlockTokens(destroyedBricks);
    
    // 2. Distribute tokens to wall destroyers
    await this.distributeTokens(unlockedTokens, wall.participants);
    
    // 3. Update wall status
    await this.updateWallStatus(wallId, 'destroyed');
    
    return {
      success: true,
      tokensUnlocked: unlockedTokens.length,
      totalValue: this.calculateTotalValue(unlockedTokens),
      participants: wall.participants
    };
  }
  
  return { success: false, reason: 'Threshold not met' };
}
```

---

## **Phase 7: UI/UX Enhancements**

### **7.1 New Components**
- **PumpFunTokenDisplay**: Show token info in brick details
- **BrickWallViewer**: Visual wall with destruction progress
- **TokenUnlockModal**: Show unlocked tokens after destruction
- **WallDestructionButton**: Trigger wall destruction

### **7.2 Enhanced Brick Details**
- **Token Information**: Current price, supply, bonding curve position
- **Lock Status**: Whether tokens are locked/unlocked
- **Wall Association**: Which wall the brick belongs to
- **Destruction Progress**: How close to wall destruction

---

## **Phase 8: Game Mechanics**

### **8.1 Wall Types**
- **Legendary Wall**: 11 legendary bricks, high token rewards
- **Industrial Wall**: 362 industrial bricks, medium rewards
- **Regular Wall**: 60 regular bricks, basic rewards
- **Mixed Wall**: Combination of all types

### **8.2 Token Rewards**
- **Legendary Brick**: 1,000,000 tokens + premium perks
- **Industrial Brick**: 100,000 tokens + industrial perks
- **Regular Brick**: 10,000 tokens + basic perks

### **8.3 Destruction Rewards**
- **Early Destroyers**: Bonus tokens for first participants
- **Complete Destruction**: All tokens unlocked + special NFT
- **Partial Destruction**: Proportional token distribution

---

## **Phase 9: Integration Points**

### **9.1 Existing System Integration**
- **OASIS API**: Use existing Solana minting for MetaBricks
- **Payment System**: Add pump.fun token purchases
- **Wallet Integration**: Support pump.fun token transfers
- **Metadata System**: Include token information in NFT metadata

### **9.2 New API Endpoints**
- `POST /api/pumpfun/create-token` - Create pump.fun token
- `POST /api/pumpfun/buy-token` - Buy pump.fun token
- `POST /api/pumpfun/sell-token` - Sell pump.fun token
- `POST /api/wall/destroy` - Destroy brick wall
- `GET /api/wall/status` - Get wall status

---

## **Phase 10: Competition Submission**

### **10.1 dev.fun App Description**
> *"MetaBricks NFT Marketplace with pump.fun Token Integration: A revolutionary platform where each MetaBrick NFT contains locked pump.fun tokens that unlock when brick walls are destroyed. Features 432 unique MetaBricks with rarity tiers, multi-chain support (Solana/Arbitrum), wallet integration, and gamified wall destruction mechanics. Users mint bricks, participate in wall destruction, and unlock valuable pump.fun tokens through community collaboration."*

### **10.2 Technical Highlights**
- **Innovative Mechanics**: First-ever "tokens locked in NFTs" concept
- **Multi-chain Integration**: Solana + Arbitrum + pump.fun
- **Production Ready**: Working NFT minting system
- **Community Driven**: Wall destruction creates shared experiences
- **Real Utility**: pump.fun tokens have actual trading value

---

## **Phase 11: Implementation Timeline**

### **Week 1**: Configuration & Services
- Enhance MetabricksConfigService
- Create PumpFunService
- Create BrickWallService

### **Week 2**: Core Integration
- Update MetaBrick interface
- Implement token creation
- Implement token locking

### **Week 3**: Wall Mechanics
- Build wall destruction system
- Implement token unlock
- Add distribution logic

### **Week 4**: UI/UX & Testing
- Create new components
- Enhance existing UI
- Test complete flow

### **Week 5**: Competition Submission
- Prepare dev.fun submission
- Create demo video
- Document integration

---

## **Phase 12: Success Metrics**

### **12.1 Technical Success**
- ✅ pump.fun tokens created for each brick
- ✅ Tokens locked in MetaBrick NFTs
- ✅ Wall destruction unlocks tokens
- ✅ Token distribution to participants

### **12.2 Competition Success**
- ✅ Unique innovation (tokens in NFTs)
- ✅ Technical excellence (multi-chain)
- ✅ Community engagement (wall destruction)
- ✅ Real utility (trading value)

---

## **🎉 Revolutionary Concept**

This plan creates a **revolutionary gaming experience** where MetaBricks become more than just NFTs - they become **treasure chests** containing valuable pump.fun tokens that unlock through community collaboration. The wall destruction mechanic creates **shared experiences** and **collective rewards**, making it perfect for the dev.fun competition.

### **Key Innovation Points**
1. **First-ever "tokens locked in NFTs"** concept
2. **Community-driven token unlocking** through wall destruction
3. **Multi-chain integration** (Solana + Arbitrum + pump.fun)
4. **Gamified collection mechanics** with real economic value
5. **Production-ready system** with working NFT minting

### **Competition Advantages**
- **Technical Excellence**: Complex multi-chain integration
- **Innovation**: Unique mechanics never seen before
- **Community Value**: Shared experiences and collective rewards
- **Real Utility**: pump.fun tokens have actual trading value
- **Production Ready**: Not just a prototype, but a working system

---

*Document created: January 2025*  
*Status: Planning Phase - Ready for Implementation*  
*Target: dev.fun On-Chain App Jam Competition*
