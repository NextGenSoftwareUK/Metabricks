import { Injectable } from '@angular/core';

export interface MetabricksConfig {
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
    CURRENCY: 'SOL';
    MIN_PAYMENT: number;
  };
  
  // Brick Configuration
  BRICK: {
    TOTAL_COUNT: number;
    METADATA_BASE_URL: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MetabricksConfigService {
  
  private config: MetabricksConfig = {
    OASIS: {
      SITE_AVATAR_ID: 'metabricks-site-avatar',
      SITE_AVATAR_TOKEN: 'your-site-jwt-token-here', // Replace with actual token
      API_BASE_URL: 'https://localhost:5002/api'
    },
    
    NFT: {
      SYMBOL: 'MBRK',
      DEFAULT_PRICE: 0.4,
      NETWORK: 'devnet'
    },
    
    PAYMENT: {
      METABRICKS_WALLET_ADDRESS: 'YOUR_METABRICKS_WALLET_ADDRESS', // Replace with your wallet
      CURRENCY: 'SOL',
      MIN_PAYMENT: 0.4
    },
    
    BRICK: {
      TOTAL_COUNT: 432,
      METADATA_BASE_URL: 'https://gateway.pinata.cloud/ipfs/bafybeihkspp2kxsz4moylkgjpkdwm4sbafqluqmtzh3hy7x42jhvx6n5ym'
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
    
    if (env === 'production') {
      this.config.OASIS.API_BASE_URL = 'https://api.oasisplatform.world';
      this.config.NFT.NETWORK = 'mainnet-beta';
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
}
