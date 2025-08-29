# OASIS NFT Minting Setup Guide

## Overview

This guide explains how to set up the new MetaBricks NFT minting flow that uses a site-wide OASIS avatar instead of requiring individual user authentication. Users can now connect their wallet, complete payment, and receive NFTs directly without creating OASIS accounts.

## New Flow Architecture

```
User Wallet Connection → Payment Processing → OASIS Site Avatar → NFT Minting → User Receives NFT
```

### Key Benefits

- ✅ **No User Authentication Required** - Users don't need OASIS avatars
- ✅ **Simplified User Experience** - Connect wallet, pay, receive NFT
- ✅ **Centralized Management** - Single site avatar handles all minting
- ✅ **Maintains OASIS Integration** - Still uses OASIS NFT API
- ✅ **Secure Payment Flow** - Direct wallet-to-wallet transactions

## Setup Steps

### 1. Create OASIS Site Avatar

First, you need to create a dedicated avatar in OASIS for MetaBricks:

1. **Access OASIS API** (usually at `https://localhost:5002/api` for development)
2. **Create New Avatar** using the `/avatar` endpoint:
   ```json
   {
     "username": "metabricks-site",
     "email": "admin@metabricks.com",
     "password": "secure-password-here",
     "firstName": "MetaBricks",
     "lastName": "Site",
     "description": "MetaBricks site-wide avatar for NFT minting"
   }
   ```
3. **Note the Avatar ID** from the response
4. **Get JWT Token** by logging in with the avatar credentials

### 2. Configure MetaBricks Site Settings

Use the new Site Configuration component to set up the system:

1. **Navigate to Site Configuration** (`/admin/site-config`)
2. **Configure OASIS Settings**:
   - Site Avatar ID: `metabricks-site` (or your chosen ID)
   - Site Avatar JWT Token: The token from step 1
   - API Base URL: Your OASIS API endpoint
3. **Configure Payment Settings**:
   - MetaBricks Wallet Address: Your Solana wallet for receiving payments
   - Currency: SOL (or USDC)
   - Minimum Payment: 0.4 SOL
4. **Configure NFT Settings**:
   - Symbol: MBRK
   - Default Price: 0.4
   - Network: devnet (or mainnet-beta for production)

### 3. Test Configuration

Before going live, test the setup:

1. **Test OASIS Connection** - Verify API connectivity
2. **Test Site Avatar** - Verify authentication works
3. **Check Configuration Status** - All items should show ✅

## Configuration Files

### MetabricksConfigService

The configuration is managed by `MetabricksConfigService` which stores settings in:

- **Local Storage**: `metabricks_config`
- **Environment Variables**: For production overrides
- **Default Values**: Built-in fallbacks

### Key Configuration Keys

```typescript
{
  OASIS: {
    SITE_AVATAR_ID: 'metabricks-site',
    SITE_AVATAR_TOKEN: 'jwt-token-here',
    API_BASE_URL: 'https://localhost:5002/api'
  },
  PAYMENT: {
    METABRICKS_WALLET_ADDRESS: 'your-solana-wallet',
    CURRENCY: 'SOL',
    MIN_PAYMENT: 0.4
  },
  NFT: {
    SYMBOL: 'MBRK',
    DEFAULT_PRICE: 0.4,
    NETWORK: 'devnet'
  }
}
```

## User Experience Flow

### 1. User Connects Wallet

Users connect their Phantom wallet (or other Solana wallet) to the MetaBricks site.

### 2. User Selects Brick

Users browse and select a brick they want to mint.

### 3. Payment Processing

The system processes payment directly from the user's wallet to the MetaBricks wallet:
- Creates Solana transaction
- User signs transaction
- Payment is confirmed on-chain

### 4. NFT Minting

After successful payment:
- MetaBricks site avatar calls OASIS NFT API
- NFT is minted directly to user's wallet address
- User receives NFT without any authentication

### 5. Success Confirmation

User sees confirmation with:
- Payment transaction signature
- NFT minting transaction signature
- NFT details and perks

## Technical Implementation

### NFTMintingService.mintNFTAfterPayment()

This is the core method that handles the new flow:

```typescript
async mintNFTAfterPayment(
  mintData: NFTMintData,
  paymentSignature: string
): Promise<MintResult> {
  // 1. Check site avatar configuration
  // 2. Generate brick metadata
  // 3. Call OASIS API with site avatar credentials
  // 4. Return minting result
}
```

### Payment Processing

Real Solana transactions are handled in the mint component:

```typescript
private async processPayment(wallet: any, amount: number) {
  // 1. Create Solana transaction
  // 2. Get recent blockhash
  // 3. Sign and send transaction
  // 4. Wait for confirmation
  // 5. Return transaction signature
}
```

## Security Considerations

### Site Avatar Security

- **JWT Token Management**: Store tokens securely, rotate regularly
- **Avatar Permissions**: Limit site avatar to only NFT minting operations
- **API Access Control**: Restrict OASIS API access to necessary endpoints only

### Payment Security

- **Wallet Address Verification**: Double-check MetaBricks wallet address
- **Transaction Confirmation**: Wait for on-chain confirmation before minting
- **Amount Validation**: Verify payment amounts match expected values

### Error Handling

- **Graceful Degradation**: Handle OASIS API failures gracefully
- **User Feedback**: Provide clear error messages for users
- **Retry Logic**: Implement retry mechanisms for transient failures

## Troubleshooting

### Common Issues

1. **Site Avatar Not Configured**
   - Check OASIS configuration in site config
   - Verify JWT token is valid and not expired

2. **Payment Processing Fails**
   - Verify MetaBricks wallet address is correct
   - Check Solana network configuration
   - Ensure user has sufficient SOL balance

3. **OASIS API Errors**
   - Test OASIS connection
   - Verify API base URL
   - Check site avatar permissions

### Debug Information

Enable console logging to see detailed flow information:

```typescript
// In mint component
console.log('🎨 Starting brick minting process...');
console.log('💳 Processing payment...');
console.log('🎨 Minting NFT via OASIS...');
```

## Production Deployment

### Environment Configuration

For production, update configuration:

```typescript
// Production settings
OASIS_API_BASE_URL: 'https://api.oasisplatform.world'
SOLANA_NETWORK: 'mainnet-beta'
SITE_AVATAR_ID: 'metabricks-prod-avatar'
```

### Monitoring

- **Transaction Monitoring**: Track payment and minting success rates
- **API Health Checks**: Monitor OASIS API availability
- **Error Logging**: Log and alert on failures

## Migration from Legacy Flow

If you're upgrading from the old user avatar-based system:

1. **Keep Legacy Methods**: The old `mintNFT()` method is still available
2. **Gradual Migration**: Users can still use OASIS avatars if desired
3. **Configuration Updates**: Update site configuration with new settings
4. **Testing**: Verify both flows work before removing old code

## Support

For issues or questions:

1. **Check Configuration Status** in site config component
2. **Review Console Logs** for detailed error information
3. **Test OASIS Connection** using the test buttons
4. **Verify Site Avatar** authentication status

## Future Enhancements

Potential improvements for the system:

- **Multi-Currency Support**: USDC, other tokens
- **Batch Minting**: Multiple NFTs in single transaction
- **Advanced Payment Options**: Installment plans, subscriptions
- **Analytics Dashboard**: Minting statistics and user insights
- **Automated Testing**: Integration tests for the minting flow
