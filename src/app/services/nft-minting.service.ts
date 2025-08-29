import { Injectable } from '@angular/core';
import { BrickPerkService } from './brick-perk.service';
import { OasisApiService, OASISNFTMintRequest } from './oasis-api.service';
import { AvatarService } from './avatar.service';
import { MetabricksConfigService } from './metabricks-config.service';

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
    private metabricksConfig: MetabricksConfigService
  ) {}

  /**
   * Mint NFT using OASIS Solana API with site-wide avatar (no user auth required)
   * This is the new flow: user connects wallet -> payment -> OASIS mints NFT to user's wallet
   */
  async mintNFTAfterPayment(
    mintData: NFTMintData,
    paymentSignature: string
  ): Promise<{ success: boolean; signature?: string; error?: string; mintAddress?: string; metadata?: BrickMetadata }> {
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

      // Prepare OASIS Solana NFT mint request using site avatar
      const solanaRequest = {
        Title: brickMetadata.name,
        Symbol: nftConfig.SYMBOL,
        JSONUrl: brickMetadata.image || 'https://example.com/metadata.json', // Required field
        MintWalletAddress: mintData.walletAddress, // User's Phantom wallet address
        MintedByAvatarId: oasisConfig.SITE_AVATAR_ID, // Site avatar ID
        ImageUrl: brickMetadata.image || '',
        ThumbnailUrl: brickMetadata.image || '',
        Price: nftConfig.DEFAULT_PRICE, // Use configured price
        MemoText: `MetaBricks NFT: ${brickMetadata.name}`,
        MetaData: {
          ...brickMetadata,
          brickId: mintData.brickId,
          walletAddress: mintData.walletAddress,
          brickName: mintData.brickName,
          mintedAt: new Date().toISOString(),
          paymentSignature: paymentSignature, // Include payment proof
          attributes: brickMetadata.attributes || [],
          perks: brickMetadata.perks || [],
          coreBenefits: brickMetadata.coreBenefits || {}
        }
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
        
        return {
          success: true,
          signature: result.result?.transactionHash || result.transactionHash || result.signature,
          mintAddress: result.result?.mintAccount || result.mintAddress || result.nftId,
          metadata: brickMetadata
        };
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
  ): Promise<{ success: boolean; signature?: string; error?: string; mintAddress?: string; metadata?: BrickMetadata }> {
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

      // Prepare OASIS Solana NFT mint request - using our working API format
      const solanaRequest = {
        Title: brickMetadata.name,
        Symbol: 'MBRK', // MetaBricks symbol
        JSONUrl: brickMetadata.image || 'https://example.com/metadata.json', // Required field
        MintWalletAddress: walletAddress, // Phantom wallet address
        MintedByAvatarId: avatarId,
        ImageUrl: brickMetadata.image || '',
        ThumbnailUrl: brickMetadata.image || '',
        Price: 0.4, // Default price in SOL
        MemoText: `MetaBricks NFT: ${brickMetadata.name}`,
        MetaData: {
          ...brickMetadata,
          brickId: mintData.brickId,
          walletAddress: walletAddress,
          brickName: mintData.brickName,
          mintedAt: new Date().toISOString(),
          attributes: brickMetadata.attributes || [],
          perks: brickMetadata.perks || [],
          coreBenefits: brickMetadata.coreBenefits || {}
        }
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
        
        return {
          success: true,
          signature: result.result?.transactionHash || result.transactionHash || result.signature,
          mintAddress: result.result?.mintAccount || result.mintAddress || result.nftId,
          metadata: brickMetadata
        };
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
}
