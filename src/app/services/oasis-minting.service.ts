import { Injectable } from '@angular/core';
import { OASISAuthService } from './oasis-auth.service';

export interface OASISMintRequest {
  JSONMetaDataURL: string;
  Title: string;
  Symbol: string;
  MintedByAvatarId: string;
  SendToAddressAfterMinting?: string;
}

export interface OASISMintResponse {
  result: {
    mintAccount?: string;
    MintAccount?: string;
    transactionResult?: string;
    transactionHash?: string;
  };
  isError: boolean;
  message: string;
}

export interface OASISTransferRequest {
  FromWalletAddress: string;
  ToWalletAddress: string;
  NFTId: string;
  FromProviderType: string;
  ToProviderType: string;
  Amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class OASISMintingService {
  private readonly OASIS_WALLET = 'AfpSpMjNyoHTZWMWkog6Znf57KV82MGzkpDUUjLtmHwG';
  private readonly SITE_AVATAR_ID = '5f7daa80-160e-4213-9e81-94500390f31e';

  constructor(private oasisAuth: OASISAuthService) {}

  /**
   * Get metadata URL for a brick number
   */
  private getMetaBrickMetadataUrl(brickNumber: number): string {
    // Regular bricks (1-400): Use corrected regular metadata
    if (brickNumber >= 1 && brickNumber <= 400) {
      return 'https://gateway.pinata.cloud/ipfs/QmXa26ap9xo9thYpqjzF16NFMkzfStuLyRtZWMJ1pEGvfC';
    }
    // Industrial bricks (401-430): Use corrected industrial metadata  
    else if (brickNumber >= 401 && brickNumber <= 430) {
      return 'https://gateway.pinata.cloud/ipfs/QmUYGRpqx8J1cxq4rpMDjXx2rbshRftgAt4wxSGHybr5Ko';
    }
    // Legendary bricks (431-433): Use corrected legendary metadata
    else {
      return 'https://gateway.pinata.cloud/ipfs/QmfPUefyM2fCWvhZP6XPPZiVba2fort95BjCfmYj8QJ8Cd';
    }
  }

  /**
   * Mint NFT using OASIS API
   */
  async mintNFT(mintData: {
    walletAddress: string;
    brickId: string | number;
    brickName?: string;
    brickType?: string;
  }): Promise<OASISMintResponse> {
    try {
      console.log('🎯 Minting NFT via OASIS API:', mintData);
      
      // Extract brick number from brickId (e.g., "Brick 32" -> 32)
      const brickNumber = typeof mintData.brickId === 'string' 
        ? parseInt(mintData.brickId.replace('Brick ', '')) 
        : mintData.brickId;
      
      // Get the correct metadata URL for this brick
      const metadataUrl = this.getMetaBrickMetadataUrl(brickNumber);
      
      // Prepare OASIS API request
      const oasisRequest: OASISMintRequest = {
        JSONMetaDataURL: metadataUrl,
        Title: mintData.brickName || `MetaBrick #${brickNumber}`,
        Symbol: 'MBRICK',
        MintedByAvatarId: this.SITE_AVATAR_ID
        // Note: SendToAddressAfterMinting doesn't work reliably, we'll transfer after minting
      };

      console.log('📤 Sending to OASIS API:', oasisRequest);
      
      // Make request to OASIS API
      const result = await this.oasisAuth.makeAuthenticatedRequest('/api/Solana/Mint', oasisRequest);
      
      console.log('🎉 OASIS API response:', result);
      
      // Check if OASIS API returned an error
      if (result.isError) {
        console.error('❌ OASIS API returned error:', result.message);
        throw new Error(result.message || 'OASIS API error');
      }
      
      console.log('✅ NFT minting successful:', result);
      return result;

    } catch (error) {
      console.error('❌ NFT minting failed:', error);
      throw error;
    }
  }

  /**
   * Transfer NFT to user's wallet
   */
  async transferNFT(mintAccount: string, userWallet: string): Promise<any> {
    try {
      console.log('🔄 Transferring NFT to user wallet:', userWallet);
      
      // Wait for NFT to be fully processed on blockchain before transferring
      console.log('⏳ Waiting 5 seconds for NFT to be fully processed...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Transfer NFT using the working approach
      const transferRequest: OASISTransferRequest = {
        FromWalletAddress: this.OASIS_WALLET, // OASIS wallet
        ToWalletAddress: userWallet, // User's Phantom wallet
        NFTId: mintAccount, // API expects NFTId (gets mapped to TokenAddress internally)
        FromProviderType: 'SolanaOASIS',
        ToProviderType: 'SolanaOASIS',
        Amount: 1
      };
      
      console.log('📤 Sending NFT transfer request:', transferRequest);
      const transferResult = await this.oasisAuth.makeAuthenticatedRequest('/api/Nft/send-nft', transferRequest);
      
      if (transferResult.isError) {
        console.error('❌ NFT transfer failed:', transferResult.message);
        throw new Error(transferResult.message || 'NFT transfer failed');
      } else {
        console.log('✅ NFT transferred successfully:', transferResult.result?.transactionResult);
        return transferResult;
      }
    } catch (error) {
      console.error('❌ NFT transfer error:', error);
      throw error;
    }
  }

  /**
   * Mint and transfer NFT in one operation
   */
  async mintAndTransferNFT(mintData: {
    walletAddress: string;
    brickId: string | number;
    brickName?: string;
    brickType?: string;
  }): Promise<{
    mintResult: OASISMintResponse;
    transferResult?: any;
    transferSuccessful: boolean;
  }> {
    try {
      // First, mint the NFT
      const mintResult = await this.mintNFT(mintData);
      
      // Get the mint account from the result
      const mintAccount = mintResult.result?.mintAccount || mintResult.result?.MintAccount;
      if (!mintAccount) {
        throw new Error('Mint account not found in response');
      }
      
      // Then transfer it to the user
      let transferResult;
      let transferSuccessful = false;
      
      try {
        transferResult = await this.transferNFT(mintAccount, mintData.walletAddress);
        transferSuccessful = true;
      } catch (transferError) {
        console.error('❌ NFT transfer failed:', transferError);
        // Don't fail the entire request - NFT is minted, just not transferred yet
        console.log('⚠️ NFT minted but not transferred. User can claim manually.');
      }
      
      return {
        mintResult,
        transferResult,
        transferSuccessful
      };
      
    } catch (error) {
      console.error('❌ Mint and transfer failed:', error);
      throw error;
    }
  }
}
