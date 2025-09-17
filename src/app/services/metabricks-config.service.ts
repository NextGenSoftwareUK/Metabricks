import { Injectable } from '@angular/core';

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
      BASE_URL: 'https://metabricks-backend-api-66e7d2abb038.herokuapp.com',
      TIMEOUT: 30000,
      ENVIRONMENT: 'production'
    },
    
    OASIS: {
      SITE_AVATAR_ID: '5f7daa80-160e-4213-9e81-94500390f31e', // Verified avatar ID
      SITE_AVATAR_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmN2RhYTgwLTE2MGUtNDIxMy05ZTgxLTk0NTAwMzkwZjMxZSIsIm5iZiI6MTc1NzQ1NTYzMSwiZXhwIjoxNzU3NDU2NTMxLCJpYXQiOjE3NTc0NTU2MzF9.Cm3X7l-LRjJNVpFWza7n_cIqS7KJJtr4U3H2YNCf6qw', // Fresh JWT token
      API_BASE_URL: 'https://localhost:5002'
    },
    
    NFT: {
      SYMBOL: 'MBRK',
      DEFAULT_PRICE: 50, // $50 USD
      NETWORK: 'devnet'
    },
    
    PAYMENT: {
      METABRICKS_WALLET_ADDRESS: '0x628000b33cB8eaFC4Ef60176ccc5Cd373B1D4Fa1', // Arbitrum wallet for ETH payments
      SOLANA_WALLET_ADDRESS: 'HT2sbYb6qjYKNjSdSWkwCp6bfYtrW9LMaGsnevLRRVnB', // Solana wallet for SOL payments
      CURRENCY: 'ETH',
      MIN_PAYMENT: 0.02, // $50 worth of ETH
      SOLANA_MIN_PAYMENT: 0.1, // $50 worth of SOL (approximate)
      USD_PRICE: 50 // $50 USD
    },
    
    STRIPE: {
      PUBLISHABLE_KEY: 'pk_test_51RvJ4ODUfRvAn94pSOJ08qtGwTTcWwhyAXNx03jnmbQzTZLPCvepsKJ2ORpVTbGGcIBE5M2n0XtOvEIcpAWzJsU200Q00Np3j7',
      SECRET_KEY: 'sk_test_51RvJ4ODUfRvAn94pRsJilAg17lPyVQfEDb5WnM5w5BLy5S2QzIVAS5McThjlyn5ndPqO2bhlYDOp3bIoRL6897VN00jeYg7byc',
      WEBHOOK_SECRET: undefined // Will be set when webhook is configured
    },
    
    BRICK: {
      TOTAL_COUNT: 432,
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
    // Check for environment-specific configuration
    const env = process.env['NODE_ENV'] || 'development';
    const hostname = (window as any).location?.hostname || 'localhost';
    
    if (env === 'production' || hostname !== 'localhost') {
      this.config.BACKEND.ENVIRONMENT = 'production';
      this.config.BACKEND.BASE_URL = 'https://metabricks-backend-api-66e7d2abb038.herokuapp.com';
      this.config.OASIS.API_BASE_URL = 'https://api.oasisplatform.world';
      this.config.NFT.NETWORK = 'mainnet-beta';
    } else {
      this.config.BACKEND.ENVIRONMENT = 'development';
      this.config.BACKEND.BASE_URL = 'https://metabricks-backend-api-66e7d2abb038.herokuapp.com';
    }
    
    // Load from localStorage if available
    const storedConfig = localStorage.getItem('metabricks_config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        this.config = { ...this.config, ...parsed };
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
