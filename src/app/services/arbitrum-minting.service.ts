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
  message?: string;
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

  constructor(
    private metabricksConfig: MetabricksConfigService
  ) {}

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
        if (!window.ethereum) {
          throw new Error('MetaMask not available');
        }
        
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

      // Get configuration and ensure authentication
      const oasisConfig = this.metabricksConfig.getOasisConfig();
      const brickConfig = this.metabricksConfig.getBrickConfig();
      
      console.log('✅ Proceeding with minting via backend proxy...');

      // Generate metadata URL based on brick type
      const metadataUrl = this.getMetadataUrl(mintData.brickType, mintData.brickId);
      const imageUrl = this.getImageUrl(mintData.brickType, mintData.brickId);

      // Step 1: Mint to user's wallet via backend proxy
      console.log('📝 Step 1: Minting NFT to user wallet via backend proxy...');
      const arbitrumRequest = {
        walletAddress: mintData.walletAddress, // User's wallet address
        brickName: mintData.brickName,
        brickType: mintData.brickType,
        brickId: mintData.brickId,
        imageUrl: imageUrl,
        perks: this.getBrickPerks(mintData.brickType),
        rarity: this.getBrickRarity(mintData.brickType)
      };

      console.log('📝 Arbitrum NFT mint request:', arbitrumRequest);

      // Mint via MetaBricks Backend Proxy
      const backendUrl = 'http://localhost:3001/api/mint-nft';
      console.log('🌐 Making API request to MetaBricks backend:', backendUrl);
      console.log('📦 Request payload:', arbitrumRequest);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(arbitrumRequest)
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Arbitrum NFT minting failed:', errorData);
        throw new Error(errorData.message || `Minting failed: HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Arbitrum NFT minted to site avatar:', result);

      // Backend handles everything - NFT is already minted to user's wallet
      console.log('✅ NFT minted successfully via backend proxy');
      return {
        success: true,
        transactionHash: result.data?.result?.transactionResult || result.result?.transactionResult || result.transactionHash,
        tokenId: result.data?.result?.oasisnft?.id || result.result?.oasisnft?.id || result.data?.result?.tokenId || result.result?.tokenId || result.tokenId,
        message: 'NFT minted successfully!'
      };

    } catch (error: any) {
      console.error('❌ Arbitrum NFT minting error:', error);
      
      // Handle specific fetch errors
      if (error.message === 'Failed to fetch') {
        return {
          success: false,
          error: 'Unable to connect to the OASIS API. Please check if the API server is running and accessible.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'NFT minting failed'
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
