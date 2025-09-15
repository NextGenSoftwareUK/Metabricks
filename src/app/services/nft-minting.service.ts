import { Injectable } from '@angular/core';
import { BrickPerkService } from './brick-perk.service';
import { OasisApiService, OASISNFTMintRequest } from './oasis-api.service';
import { AvatarService } from './avatar.service';
import { MetabricksConfigService } from './metabricks-config.service';
import { BackendApiService, NFTMintRequest } from './backend-api.service';

export interface NFTMintData {
  walletAddress: string;
  brickId: number;
  brickName: string;
}

export interface BrickMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: any[];
  perks: any[];
  coreBenefits: any;
  hiddenMetadata: any;
}

@Injectable({ providedIn: 'root' })
export class NFTMintingService {
  constructor(
    private brickPerkService: BrickPerkService,
    private oasisApiService: OasisApiService,
    private avatarService: AvatarService,
    private metabricksConfig: MetabricksConfigService,
    private backendApi: BackendApiService
  ) {}

  /**
   * Mint NFT via backend API (recommended method)
   * This uses the production backend which handles OASIS authentication and minting
   */
  async mintNFTViaBackend(
    mintData: NFTMintData,
    brickType: 'regular' | 'industrial' | 'legendary' = 'regular'
  ): Promise<{ success: boolean; signature?: string; error?: string; mintAddress?: string; metadata?: BrickMetadata; transferResult?: any; transferError?: string }> {
    try {
      console.log('🎨 Minting NFT via backend API:', mintData);

      // Prepare backend request
      const backendRequest: NFTMintRequest = {
        walletAddress: mintData.walletAddress,
        brickId: `Brick ${mintData.brickId}`,
        brickName: mintData.brickName || `MetaBrick #${mintData.brickId}`,
        brickType: brickType,
        paymentNetwork: 'solana'
      };

      // Call backend API
      const response = await this.backendApi.mintNFT(backendRequest);

      if (response.success) {
        console.log('✅ NFT minted successfully via backend:', response);
        
        // Generate brick metadata for response
        const brickMetadata = await this.brickPerkService.generateBrickMetadata(mintData.brickId);
        
        return {
          success: true,
          signature: response.data?.result?.transactionResult,
          mintAddress: response.data?.result?.mintAccount,
          metadata: brickMetadata,
          transferResult: response.transferSuccessful ? response.data : undefined,
          transferError: response.transferError
        };
      } else {
        console.error('❌ Backend NFT minting failed:', response.error);
        return {
          success: false,
          error: response.error || 'NFT minting failed'
        };
      }

    } catch (error: any) {
      console.error('❌ Backend NFT minting failed:', error);
      return {
        success: false,
        error: error.message || 'NFT minting failed'
      };
    }
  }

  /**
   * Mint NFT using OASIS Solana API with site-wide avatar (no user auth required)
   * This is the new flow: user connects wallet -> payment -> OASIS mints NFT to user's wallet
   * @deprecated Use mintNFTViaBackend instead for better reliability
   */
  async mintNFTAfterPayment(
    mintData: NFTMintData,
    paymentSignature: string
  ): Promise<{ success: boolean; signature?: string; error?: string; mintAddress?: string; metadata?: BrickMetadata; transferResult?: any; transferError?: string }> {
    try {
      console.log('🎨 Minting Solana NFT via OASIS API (site avatar):', mintData);

      // Check if site avatar is configured
      if (!this.metabricksConfig.isSiteAvatarConfigured()) {
        throw new Error('MetaBricks site avatar not configured. Please contact support.');
      }

      // Generate brick metadata with perks
      const brickMetadata = await this.brickPerkService.generateBrickMetadata(mintData.brickId);
      const oasisConfig = this.metabricksConfig.getOasisConfig();
      const nftConfig = this.metabricksConfig.getNftConfig();

      // Prepare OASIS Solana NFT mint request using David's new simplified format
      // Note: SendToAddressAfterMinting doesn't work - we'll transfer after minting
      const solanaRequest = {
        JSONMetaDataURL: 'https://gateway.pinata.cloud/ipfs/QmfPUefyM2fCWvhZP6XPPZiVba2fort95BjCfmYj8QJ8Cd', // Corrected Legendary Brick #425
        Title: brickMetadata.name,
        Symbol: nftConfig.SYMBOL,
        MintedByAvatarId: oasisConfig.SITE_AVATAR_ID // Site avatar ID
      };

      console.log('📝 Solana NFT mint request (site avatar):', solanaRequest);

      // Mint via OASIS Solana API using site avatar token
      const response = await fetch(`${oasisConfig.API_BASE_URL}/api/Solana/Mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${oasisConfig.SITE_AVATAR_TOKEN}`
        },
        body: JSON.stringify(solanaRequest)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Solana NFT minted successfully (site avatar):', result);
        
        // Step 2: Transfer NFT to user's wallet
        const mintAccount = result.result?.mintAccount || result.result?.MintAccount;
        if (mintAccount) {
          console.log('🔄 Transferring NFT to user wallet:', mintData.walletAddress);
          
          const transferRequest = {
            FromWalletAddress: 'AfpSpMjNyoHTZWMWkog6Znf57KV82MGzkpDUUjLtmHwG', // OASIS wallet
            ToWalletAddress: mintData.walletAddress, // User's Phantom wallet
            NFTId: mintAccount,
            FromProviderType: 'SolanaOASIS',
            ToProviderType: 'SolanaOASIS',
            Amount: 1
          };
          
          console.log('📤 Sending NFT transfer request:', transferRequest);
          
          const transferResponse = await fetch(`${oasisConfig.API_BASE_URL}/api/Nft/send-nft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${oasisConfig.SITE_AVATAR_TOKEN}`
            },
            body: JSON.stringify(transferRequest)
          });
          
          if (transferResponse.ok) {
            const transferResult = await transferResponse.json();
            console.log('✅ NFT transferred successfully:', transferResult.result?.transactionResult);
            
            return {
              success: true,
              signature: result.result?.transactionHash || result.transactionHash || result.signature,
              mintAddress: mintAccount,
              metadata: brickMetadata,
              transferResult: transferResult.result
            };
          } else {
            console.error('❌ NFT transfer failed, but NFT was minted');
            console.log('⚠️ NFT minted but not transferred. User can claim manually.');
            
            return {
              success: true,
              signature: result.result?.transactionHash || result.transactionHash || result.signature,
              mintAddress: mintAccount,
              metadata: brickMetadata,
              transferError: 'NFT minted but transfer failed. User can claim manually.'
            };
          }
        } else {
          console.error('❌ No mint account found in minting response');
          throw new Error('No mint account found in minting response');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Solana NFT minting failed (site avatar):', errorData);
        throw new Error(errorData.message || `Minting failed: HTTP ${response.status}`);
      }

    } catch (error: any) {
      console.error('❌ OASIS Solana NFT minting failed (site avatar):', error);
      return {
        success: false,
        error: error.message || 'NFT minting failed'
      };
    }
  }

  /**
   * Legacy method - Mint NFT using OASIS Solana API (requires user avatar)
   * @deprecated Use mintNFTAfterPayment instead for the new flow
   */
  async mintNFT(
    mintData: NFTMintData,
    walletAddress: string
  ): Promise<{ success: boolean; signature?: string; error?: string; mintAddress?: string; metadata?: BrickMetadata; transferResult?: any; transferError?: string }> {
    try {
      console.log('🎨 Minting Solana NFT via OASIS API (legacy method):', mintData);

      // Check if user is authenticated with OASIS
      const currentAvatar = await this.avatarService.getCurrentAvatar();
      if (!currentAvatar) {
        throw new Error('Please connect your OASIS Avatar first. Click "Connect Avatar" in the header.');
      }

      // Generate brick metadata with perks
      const brickMetadata = await this.brickPerkService.generateBrickMetadata(mintData.brickId);

      // Get avatar ID for minting
      const avatarId = currentAvatar.id;
      if (!avatarId) {
        throw new Error('No avatar ID available for NFT minting');
      }

      // Prepare OASIS Solana NFT mint request using David's new simplified format
      // Note: SendToAddressAfterMinting doesn't work - we'll transfer after minting
      const solanaRequest = {
        JSONMetaDataURL: 'https://gateway.pinata.cloud/ipfs/QmfPUefyM2fCWvhZP6XPPZiVba2fort95BjCfmYj8QJ8Cd', // Corrected Legendary Brick #425
        Title: brickMetadata.name,
        Symbol: 'MBRK', // MetaBricks symbol
        MintedByAvatarId: avatarId
      };

      console.log('📝 Solana NFT mint request (legacy):', solanaRequest);

      // Mint via OASIS Solana API
      const response = await fetch(`${this.oasisApiService.getBaseUrl()}/api/Solana/Mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.avatarService.getAuthToken()}`
        },
        body: JSON.stringify(solanaRequest)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Solana NFT minted successfully (legacy):', result);
        
        // Step 2: Transfer NFT to user's wallet
        const mintAccount = result.result?.mintAccount || result.result?.MintAccount;
        if (mintAccount) {
          console.log('🔄 Transferring NFT to user wallet:', walletAddress);
          
          const transferRequest = {
            FromWalletAddress: 'AfpSpMjNyoHTZWMWkog6Znf57KV82MGzkpDUUjLtmHwG', // OASIS wallet
            ToWalletAddress: walletAddress, // User's Phantom wallet
            NFTId: mintAccount,
            FromProviderType: 'SolanaOASIS',
            ToProviderType: 'SolanaOASIS',
            Amount: 1
          };
          
          console.log('📤 Sending NFT transfer request:', transferRequest);
          
          const transferResponse = await fetch(`${this.oasisApiService.getBaseUrl()}/api/Nft/send-nft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.avatarService.getAuthToken()}`
            },
            body: JSON.stringify(transferRequest)
          });
          
          if (transferResponse.ok) {
            const transferResult = await transferResponse.json();
            console.log('✅ NFT transferred successfully:', transferResult.result?.transactionResult);
            
            return {
              success: true,
              signature: result.result?.transactionHash || result.transactionHash || result.signature,
              mintAddress: mintAccount,
              metadata: brickMetadata,
              transferResult: transferResult.result
            };
          } else {
            console.error('❌ NFT transfer failed, but NFT was minted');
            console.log('⚠️ NFT minted but not transferred. User can claim manually.');
            
            return {
              success: true,
              signature: result.result?.transactionHash || result.transactionHash || result.signature,
              mintAddress: mintAccount,
              metadata: brickMetadata,
              transferError: 'NFT minted but transfer failed. User can claim manually.'
            };
          }
        } else {
          console.error('❌ No mint account found in minting response');
          throw new Error('No mint account found in minting response');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Solana NFT minting failed (legacy):', errorData);
        throw new Error(errorData.message || `Minting failed: HTTP ${response.status}`);
      }
      
    } catch (error: any) {
      console.error('❌ OASIS Solana NFT minting failed (legacy):', error);
      return {
        success: false,
        error: error.message || 'NFT minting failed'
      };
    }
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(nftId: string): Promise<BrickMetadata | null> {
    try {
      const currentAvatar = await this.avatarService.getCurrentAvatar();
      if (!currentAvatar) {
        throw new Error('Not authenticated with OASIS API');
      }

      const nftData = await this.oasisApiService.getNFT(nftId);
      return nftData.metadata || null;
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return null;
    }
  }

  /**
   * Get all NFTs for current avatar
   */
  async getAvatarNFTs(): Promise<any[]> {
    try {
      const currentAvatar = await this.avatarService.getCurrentAvatar();
      if (!currentAvatar) {
        throw new Error('Not authenticated with OASIS API');
      }

      return await this.oasisApiService.getAvatarNFTs();
    } catch (error) {
      console.error('Failed to get avatar NFTs:', error);
      return [];
    }
  }

  /**
   * Get site avatar configuration
   */
  getSiteAvatarConfig() {
    const oasisConfig = this.metabricksConfig.getOasisConfig();
    return {
      avatarId: oasisConfig.SITE_AVATAR_ID,
      hasToken: !!oasisConfig.SITE_AVATAR_TOKEN,
      isConfigured: this.metabricksConfig.isSiteAvatarConfigured()
    };
  }

  /**
   * Check if the service is ready for minting
   */
  isReadyForMinting(): boolean {
    return this.metabricksConfig.isSiteAvatarConfigured();
  }

  /**
   * Check backend connectivity
   */
  async checkBackendConnectivity(): Promise<boolean> {
    try {
      return await this.backendApi.testConnectivity();
    } catch (error) {
      console.error('❌ Backend connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Get backend status
   */
  async getBackendStatus(): Promise<{
    isOnline: boolean;
    url: string;
    responseTime?: number;
    error?: string;
  }> {
    return await this.backendApi.getBackendStatus();
  }
}
