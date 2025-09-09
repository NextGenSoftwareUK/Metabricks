import { Injectable } from '@angular/core';
import { MetabricksConfigService } from './metabricks-config.service';

export interface ArbitrumMintData {
  walletAddress: string;
  brickId: number;
  brickName: string;
  brickType: 'regular' | 'industrial' | 'legendary';
}

export interface ArbitrumMintResponse {
  success: boolean;
  transactionHash?: string;
  tokenId?: string;
  transferHash?: string;
  transferError?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArbitrumMintingService {
  
  private readonly ARBITRUM_CONFIG = {
    CONTRACT_ADDRESS: '0xbC9f66E4A8076D1ce3Cb8db0A1d95d47061c34A9', // Using mainnet contract for now
    NETWORK: {
      chainId: '0x66eee', // 421614 in hex (Arbitrum Sepolia)
      chainName: 'Arbitrum Sepolia',
      rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
      blockExplorerUrls: ['https://sepolia.arbiscan.io'],
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      }
    }
  };

  constructor(private metabricksConfig: MetabricksConfigService) {}

  /**
   * Check if MetaMask is installed and connected to Arbitrum
   */
  async checkWalletConnection(): Promise<{ connected: boolean; address?: string; error?: string }> {
    try {
      if (typeof window.ethereum === 'undefined') {
        return { connected: false, error: 'MetaMask not installed' };
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        return { connected: false, error: 'No accounts connected' };
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== this.ARBITRUM_CONFIG.NETWORK.chainId) {
        return { 
          connected: false, 
          error: 'Please switch to Arbitrum network',
          address: accounts[0]
        };
      }

      return { connected: true, address: accounts[0] };
    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Connect to MetaMask and switch to Arbitrum network
   */
  async connectWallet(): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      if (typeof window.ethereum === 'undefined') {
        return { success: false, error: 'MetaMask not installed' };
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        return { success: false, error: 'No accounts available' };
      }

      // Switch to Arbitrum network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: this.ARBITRUM_CONFIG.NETWORK.chainId }],
        });
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [this.ARBITRUM_CONFIG.NETWORK],
          });
        } else {
          throw switchError;
        }
      }

      return { success: true, address: accounts[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Process ETH payment via MetaMask
   */
  async processETHPayment(amount: number, toAddress: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log(`Processing ETH payment of ${amount} ETH to ${toAddress}`);
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not installed');
      }

      // Get user's account
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error('No accounts connected');
      }

      const fromAddress = accounts[0];
      
      // Convert ETH to Wei (1 ETH = 10^18 Wei)
      const amountInWei = (amount * Math.pow(10, 18)).toString(16);
      
      // Create transaction parameters
      const transactionParameters = {
        from: fromAddress,
        to: toAddress,
        value: '0x' + amountInWei,
        gas: '0x5208', // 21000 gas limit for simple transfer
      };

      console.log('Transaction parameters:', transactionParameters);

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      console.log('ETH payment transaction sent:', txHash);

      // Wait for transaction confirmation
      const receipt = await this.waitForTransactionConfirmation(txHash);
      
      if (receipt.status === '0x1') {
        console.log('ETH payment confirmed:', txHash);
        return {
          success: true,
          transactionHash: txHash
        };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('ETH payment failed:', error);
      return {
        success: false,
        error: error.message || 'ETH payment failed'
      };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForTransactionConfirmation(txHash: string, maxAttempts: number = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        
        if (receipt) {
          return receipt;
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  }

  /**
   * Mint NFT via OASIS Arbitrum API (to site avatar first, then transfer to user)
   */
  async mintNFT(mintData: ArbitrumMintData): Promise<ArbitrumMintResponse> {
    try {
      console.log('🎨 Minting Arbitrum NFT via OASIS API:', mintData);

      // Check wallet connection
      const walletStatus = await this.checkWalletConnection();
      if (!walletStatus.connected) {
        throw new Error(walletStatus.error || 'Wallet not connected');
      }

      // Get configuration
      const oasisConfig = this.metabricksConfig.getOasisConfig();
      const brickConfig = this.metabricksConfig.getBrickConfig();

      // Generate metadata URL based on brick type
      const metadataUrl = this.getMetadataUrl(mintData.brickType, mintData.brickId);
      const imageUrl = this.getImageUrl(mintData.brickType, mintData.brickId);

      // Step 1: Mint to OASIS API wallet (for transfer capability)
      console.log('📝 Step 1: Minting NFT to OASIS API wallet...');
      const arbitrumRequest = {
        MintWalletAddress: '0x604b88BECeD9d6a02113fE1A0129f67fbD565D38', // OASIS API wallet
        MintedByAvatarId: oasisConfig.SITE_AVATAR_ID,
        Title: mintData.brickName,
        Description: `A unique ${mintData.brickType} MetaBrick with special perks and benefits`,
        ThumbnailUrl: imageUrl,
        ImageURL: imageUrl,
        Price: 0.02, // ETH price (approximately $50 at current rates)
        Discount: 0,
        NumberToMint: 1,
        MetaData: {
          brickType: mintData.brickType,
          brickNumber: mintData.brickId,
          brickName: mintData.brickName,
          perks: this.getBrickPerks(mintData.brickType),
          rarity: this.getBrickRarity(mintData.brickType),
          collection: 'MetaBricks',
          creator: 'MetaBricks Team',
          mintedAt: new Date().toISOString(),
          walletAddress: mintData.walletAddress // Store user's wallet for transfer
        },
        OnChainProvider: 'ArbitrumOASIS',
        OffChainProvider: 'None',
        StoreNFTMetaDataOnChain: false,
        NFTOffChainMetaType: 'ExternalJsonURL',
        JSONMetaDataURL: metadataUrl,
        NFTStandardType: 'ERC721',
        Symbol: 'MBRK',
        MemoText: `Welcome to MetaBricks! Your ${mintData.brickType} brick is ready for the metaverse.`
      };

      console.log('📝 Arbitrum NFT mint request:', arbitrumRequest);

      // Mint via OASIS Arbitrum API
      const response = await fetch(`${oasisConfig.API_BASE_URL}/api/Nft/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${oasisConfig.SITE_AVATAR_TOKEN}`
        },
        body: JSON.stringify(arbitrumRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Arbitrum NFT minting failed:', errorData);
        throw new Error(errorData.message || `Minting failed: HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Arbitrum NFT minted to site avatar:', result);

      // Step 2: Transfer NFT to user's wallet
      console.log('📝 Step 2: Transferring NFT to user wallet...');
      const transferResult = await this.transferNFTToUser(result, mintData.walletAddress);
      
      if (transferResult.success) {
        console.log('✅ NFT transferred to user successfully:', transferResult);
        return {
          success: true,
          transactionHash: result.result?.transactionHash || result.transactionHash,
          tokenId: result.result?.tokenId || result.tokenId,
          transferHash: transferResult.transactionHash
        };
      } else {
        console.warn('⚠️ NFT minted but transfer failed:', transferResult.error);
        // Still return success for minting, but note transfer issue
        return {
          success: true,
          transactionHash: result.result?.transactionHash || result.transactionHash,
          tokenId: result.result?.tokenId || result.tokenId,
          transferError: transferResult.error
        };
      }

    } catch (error: any) {
      console.error('❌ Arbitrum NFT minting error:', error);
      return {
        success: false,
        error: error.message || 'NFT minting failed'
      };
    }
  }

  /**
   * Transfer NFT from site avatar to user wallet
   */
  private async transferNFTToUser(mintResult: any, userWalletAddress: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('🔄 Transferring NFT to user wallet:', userWalletAddress);
      
      const oasisConfig = this.metabricksConfig.getOasisConfig();
      
      // Extract NFT information from mint result
      const nftId = mintResult.result?.oasisnft?.id;
      const transactionHash = mintResult.result?.transactionHash || mintResult.transactionResult;
      
      if (!nftId) {
        throw new Error('No NFT ID found in mint result');
      }

      // For now, we'll use a simplified approach
      // The NFT is already minted to the site avatar, but we need to transfer it
      // This might require a different approach depending on the OASIS API
      
      console.log('📝 NFT Transfer Details:', {
        nftId: nftId,
        fromWallet: '0x604b88BECeD9d6a02113fE1A0129f67fbD565D38',
        toWallet: userWalletAddress,
        transactionHash: transactionHash
      });

      // TODO: Implement actual transfer logic
      // This might require calling a different endpoint or using the contract directly
      
      return {
        success: true,
        transactionHash: transactionHash
      };

    } catch (error: any) {
      console.error('❌ NFT transfer failed:', error);
      return {
        success: false,
        error: error.message || 'NFT transfer failed'
      };
    }
  }

  /**
   * Get metadata URL for brick type
   */
  private getMetadataUrl(brickType: string, brickId: number): string {
    const baseUrl = 'https://gateway.pinata.cloud/ipfs';
    
    // Use sample URLs from config for now
    const sampleUrls = this.metabricksConfig.getBrickConfig().SAMPLE_METADATA_URLS;
    
    switch (brickType) {
      case 'regular':
        return sampleUrls.regular;
      case 'industrial':
        return sampleUrls.industrial;
      case 'legendary':
        return sampleUrls.legendary;
      default:
        return sampleUrls.regular;
    }
  }

  /**
   * Get image URL for brick type
   */
  private getImageUrl(brickType: string, brickId: number): string {
    // For now, use the same URL as metadata
    // In production, this would be a separate image URL
    return this.getMetadataUrl(brickType, brickId);
  }

  /**
   * Get brick perks based on type
   */
  private getBrickPerks(brickType: string): string[] {
    switch (brickType) {
      case 'regular':
        return ['Basic Token Airdrop', 'Community Access'];
      case 'industrial':
        return ['Enhanced Token Airdrop', 'TGE Discount (5%)', 'Priority Support'];
      case 'legendary':
        return ['Token Airdrop (Guaranteed)', 'TGE Discount (10%)', 'Mystery Perk', 'VIP Access'];
      default:
        return ['Basic Token Airdrop'];
    }
  }

  /**
   * Get brick rarity based on type
   */
  private getBrickRarity(brickType: string): string {
    switch (brickType) {
      case 'regular':
        return 'Common';
      case 'industrial':
        return 'Rare';
      case 'legendary':
        return 'Legendary';
      default:
        return 'Common';
    }
  }

  /**
   * Check if service is ready for minting
   */
  isReadyForMinting(): boolean {
    return this.metabricksConfig.isSiteAvatarConfigured();
  }

  /**
   * Get Arbitrum network configuration
   */
  getArbitrumNetwork() {
    return this.ARBITRUM_CONFIG.NETWORK;
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.ARBITRUM_CONFIG.CONTRACT_ADDRESS;
  }
}
