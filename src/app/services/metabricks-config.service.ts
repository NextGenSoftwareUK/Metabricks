import { Injectable } from '@angular/core';
import { CURRENT_CONFIG } from '../../config/environments';

export interface MetabricksConfig {
  // Backend API Configuration
  BACKEND: {
    BASE_URL: string;
    TIMEOUT: number;
    ENVIRONMENT: 'development' | 'production';
  };
  
  // OASIS Site Avatar Configuration
  OASIS: {
    SITE_AVATAR_ID: string;
    SITE_AVATAR_TOKEN: string;
    API_BASE_URL: string;
  };
  
  // NFT Configuration
  NFT: {
    SYMBOL: string;
    DEFAULT_PRICE: number;
    NETWORK: 'devnet' | 'mainnet-beta';
  };
  
  // Payment Configuration
  PAYMENT: {
    METABRICKS_WALLET_ADDRESS: string;
    SOLANA_WALLET_ADDRESS: string;
    CURRENCY: 'SOL' | 'ETH';
    MIN_PAYMENT: number;
    SOLANA_MIN_PAYMENT: number;
    USD_PRICE?: number;
  };
  
  // Stripe Configuration
  STRIPE: {
    PUBLISHABLE_KEY: string;
    SECRET_KEY?: string; // Only for backend
    WEBHOOK_SECRET?: string; // Only for backend
  };
  
  // Brick Configuration
  BRICK: {
    TOTAL_COUNT: number;
    METADATA_BASE_URL: string;
    SAMPLE_METADATA_URLS: {
      regular: string;
      industrial: string;
      legendary: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class MetabricksConfigService {
  
  private config: MetabricksConfig = {
    BACKEND: {
      BASE_URL: CURRENT_CONFIG.backend.baseUrl,
      TIMEOUT: CURRENT_CONFIG.backend.timeout,
      ENVIRONMENT: CURRENT_CONFIG.name
    },
    
    OASIS: {
      SITE_AVATAR_ID: CURRENT_CONFIG.oasis.siteAvatarId,
      SITE_AVATAR_TOKEN: CURRENT_CONFIG.oasis.siteAvatarToken || '',
      API_BASE_URL: CURRENT_CONFIG.oasis.apiBaseUrl
    },
    
    NFT: {
      SYMBOL: CURRENT_CONFIG.nft.symbol,
      DEFAULT_PRICE: CURRENT_CONFIG.nft.defaultPrice,
      NETWORK: CURRENT_CONFIG.nft.network
    },
    
    PAYMENT: {
      METABRICKS_WALLET_ADDRESS: CURRENT_CONFIG.payment.metabricksWalletAddress,
      SOLANA_WALLET_ADDRESS: CURRENT_CONFIG.payment.solanaWalletAddress,
      CURRENCY: CURRENT_CONFIG.payment.currency,
      MIN_PAYMENT: CURRENT_CONFIG.payment.minPayment,
      SOLANA_MIN_PAYMENT: CURRENT_CONFIG.payment.solanaMinPayment,
      USD_PRICE: CURRENT_CONFIG.payment.usdPrice
    },
    
    STRIPE: {
      PUBLISHABLE_KEY: CURRENT_CONFIG.stripe.publishableKey,
      SECRET_KEY: CURRENT_CONFIG.stripe.secretKey || '',
      WEBHOOK_SECRET: CURRENT_CONFIG.stripe.webhookSecret
    },
    
    BRICK: {
      TOTAL_COUNT: CURRENT_CONFIG.brick.totalCount,
      METADATA_BASE_URL: 'https://gateway.pinata.cloud/ipfs',
      // Sample working metadata URLs for different brick types
      SAMPLE_METADATA_URLS: {
        regular: 'https://gateway.pinata.cloud/ipfs/QmYtFD9zD8oBwcc4PKhPmhgXvqvi7DNLEcfyBYpvHhAuLY', // Brick #284
        industrial: 'https://gateway.pinata.cloud/ipfs/QmXsv1bnPU3ybyQKKnQ7929YUmsUSdeEGxyX9Tj7vo5Mnz', // Brick #22
        legendary: 'https://gateway.pinata.cloud/ipfs/QmWXYMjqeu5w1nUsaVuTpRuVZMM4f1G2G2GkzZtJnEGuq3' // Brick #305
      }
    }
  };

  constructor() {
    this.loadEnvironmentConfig();
  }

  /**
   * Load configuration from environment variables or local storage
   */
  private loadEnvironmentConfig(): void {
    // Configuration is now loaded from the centralized environment config
    // This method is kept for backward compatibility and localStorage overrides
    
    // Load from localStorage if available (for manual overrides)
    const storedConfig = localStorage.getItem('metabricks_config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        this.config = { ...this.config, ...parsed };
        console.log('🔧 Loaded configuration overrides from localStorage');
      } catch (error) {
        console.warn('Failed to parse stored config:', error);
      }
    }
  }

  /**
   * Get the complete configuration
   */
  getConfig(): MetabricksConfig {
    return { ...this.config };
  }

  /**
   * Get backend configuration
   */
  getBackendConfig() {
    return { ...this.config.BACKEND };
  }

  /**
   * Get OASIS configuration
   */
  getOasisConfig() {
    return { ...this.config.OASIS };
  }

  /**
   * Get NFT configuration
   */
  getNftConfig() {
    return { ...this.config.NFT };
  }

  /**
   * Get payment configuration
   */
  getPaymentConfig() {
    return { ...this.config.PAYMENT };
  }

  /**
   * Get brick configuration
   */
  getBrickConfig() {
    return { ...this.config.BRICK };
  }

  /**
   * Get Stripe configuration
   */
  getStripeConfig() {
    return { ...this.config.STRIPE };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MetabricksConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Store updated config
    localStorage.setItem('metabricks_config', JSON.stringify(this.config));
  }

  /**
   * Update OASIS site avatar configuration
   */
  updateSiteAvatar(avatarId: string, token: string): void {
    this.config.OASIS.SITE_AVATAR_ID = avatarId;
    this.config.OASIS.SITE_AVATAR_TOKEN = token;
    this.updateConfig(this.config);
  }

  /**
   * Update MetaBricks wallet address
   */
  updateMetabricksWallet(address: string): void {
    this.config.PAYMENT.METABRICKS_WALLET_ADDRESS = address;
    this.updateConfig(this.config);
  }

  /**
   * Check if site avatar is properly configured
   */
  isSiteAvatarConfigured(): boolean {
    return !!(this.config.OASIS.SITE_AVATAR_ID && this.config.OASIS.SITE_AVATAR_TOKEN);
  }

  /**
   * Check if MetaBricks wallet is configured
   */
  isMetabricksWalletConfigured(): boolean {
    return !!(this.config.PAYMENT.METABRICKS_WALLET_ADDRESS && 
              this.config.PAYMENT.METABRICKS_WALLET_ADDRESS !== 'YOUR_METABRICKS_WALLET_ADDRESS');
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): {
    oasis: boolean;
    payment: boolean;
    nft: boolean;
    brick: boolean;
  } {
    return {
      oasis: this.isSiteAvatarConfigured(),
      payment: this.isMetabricksWalletConfigured(),
      nft: true, // NFT config is always valid
      brick: true  // Brick config is always valid
    };
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    localStorage.removeItem('metabricks_config');
    this.loadEnvironmentConfig();
  }

  /**
   * Get metadata URL for a specific brick type
   * For now, returns sample URLs. In production, this would map to actual brick IDs
   */
  getBrickMetadataUrl(brickType: 'regular' | 'industrial' | 'legendary'): string {
    return this.config.BRICK.SAMPLE_METADATA_URLS[brickType] || this.config.BRICK.SAMPLE_METADATA_URLS.regular;
  }

  /**
   * Get all available metadata URLs
   */
  getAllMetadataUrls(): { [key: string]: string } {
    return { ...this.config.BRICK.SAMPLE_METADATA_URLS };
  }

  /**
   * Update network selection
   */
  updateNetworkSelection(network: 'solana' | 'arbitrum'): void {
    this.config.PAYMENT.CURRENCY = network === 'arbitrum' ? 'ETH' : 'SOL';
    this.updateConfig(this.config);
    console.log('Network selection updated to:', network);
  }

  /**
   * Get current network selection
   */
  getCurrentNetwork(): 'solana' | 'arbitrum' {
    return this.config.PAYMENT.CURRENCY === 'ETH' ? 'arbitrum' : 'solana';
  }

  /**
   * Check if Arbitrum network is selected
   */
  isArbitrumSelected(): boolean {
    return this.getCurrentNetwork() === 'arbitrum';
  }

  /**
   * Check if Solana network is selected
   */
  isSolanaSelected(): boolean {
    return this.getCurrentNetwork() === 'solana';
  }
}
