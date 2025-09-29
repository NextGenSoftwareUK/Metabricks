// Environment Configuration System for MetaBricks
// Easy switching between development and production environments

export interface EnvironmentConfig {
  name: string;
  backend: {
    baseUrl: string;
    timeout: number;
  };
  oasis: {
    apiBaseUrl: string;
    siteAvatarId: string;
    siteAvatarToken?: string;
  };
  nft: {
    symbol: string;
    defaultPrice: number;
    network: 'devnet' | 'mainnet-beta';
  };
  payment: {
    metabricksWalletAddress: string;
    solanaWalletAddress: string;
    currency: string;
    minPayment: number;
    solanaMinPayment: number;
    usdPrice: number;
  };
  stripe: {
    publishableKey: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  brick: {
    totalCount: number;
    rows: number;
    cols: number;
    uniformPrice: number;
  };
  deployment: {
    frontendUrl: string;
    backendUrl: string;
    surgeDomain: string;
  };
}

// Development Environment Configuration
export const DEV_CONFIG: EnvironmentConfig = {
  name: 'development',
  backend: {
    baseUrl: 'http://localhost:3001',
    timeout: 30000,
  },
  oasis: {
    apiBaseUrl: 'http://oasisweb4.one',
    siteAvatarId: '89d907a8-5859-4171-b6c5-621bfe96930d',
    siteAvatarToken: '', // Managed by backend
  },
  nft: {
    symbol: 'MBRK',
    defaultPrice: 50,
    network: 'devnet',
  },
  payment: {
    metabricksWalletAddress: '0x628000b33cB8eaFC4Ef60176ccc5Cd373B1D4Fa1',
    solanaWalletAddress: 'HT2sbYb6qjYKNjSdSWkwCp6bfYtrW9LMaGsnevLRRVnB',
    currency: 'ETH',
    minPayment: 0.02,
    solanaMinPayment: 0.01,
    usdPrice: 50,
  },
  stripe: {
    publishableKey: process.env['STRIPE_PUBLISHABLE_KEY'] || 'pk_test_...',
    secretKey: process.env['STRIPE_SECRET_KEY'] || 'sk_test_...',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'],
  },
  brick: {
    totalCount: 432,
    rows: 24,
    cols: 18,
    uniformPrice: 50,
  },
  deployment: {
    frontendUrl: 'http://localhost:4200',
    backendUrl: 'http://localhost:3001',
    surgeDomain: 'metabricks-dev.surge.sh',
  },
};

// Production Environment Configuration
export const PROD_CONFIG: EnvironmentConfig = {
  name: 'production',
  backend: {
    baseUrl: 'https://metabricks-backend-api-v2-42ff9579046d.herokuapp.com',
    timeout: 30000,
  },
  oasis: {
    apiBaseUrl: 'http://oasisweb4.one',
    siteAvatarId: '89d907a8-5859-4171-b6c5-621bfe96930d',
    siteAvatarToken: '', // Managed by backend
  },
  nft: {
    symbol: 'MBRK',
    defaultPrice: 50,
    network: 'mainnet-beta',
  },
  payment: {
    metabricksWalletAddress: '0x628000b33cB8eaFC4Ef60176ccc5Cd373B1D4Fa1',
    solanaWalletAddress: 'HT2sbYb6qjYKNjSdSWkwCp6bfYtrW9LMaGsnevLRRVnB',
    currency: 'ETH',
    minPayment: 0.02,
    solanaMinPayment: 0.01,
    usdPrice: 50,
  },
  stripe: {
    publishableKey: process.env['STRIPE_PUBLISHABLE_KEY'] || 'pk_live_...',
    secretKey: process.env['STRIPE_SECRET_KEY'] || 'sk_live_...',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'],
  },
  brick: {
    totalCount: 432,
    rows: 24,
    cols: 18,
    uniformPrice: 50,
  },
  deployment: {
    frontendUrl: 'https://metabricks.xyz',
    backendUrl: 'https://metabricks-backend-api-v2-42ff9579046d.herokuapp.com',
    surgeDomain: 'metabricks.surge.sh',
  },
};

// Environment Detection
export function getCurrentEnvironment(): 'development' | 'production' {
  // Check for explicit environment variable
  if (process.env['NODE_ENV'] === 'production') {
    return 'production';
  }
  
  // Check for explicit environment variable
  if (process.env['METABRICKS_ENV'] === 'production') {
    return 'production';
  }
  
  // Check hostname for production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'metabricks.xyz' || hostname === 'metabricks.surge.sh') {
      return 'production';
    }
  }
  
  // Default to development
  return 'development';
}

// Get current configuration
export function getCurrentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  return env === 'production' ? PROD_CONFIG : DEV_CONFIG;
}

// Configuration validation
export function validateConfig(config: EnvironmentConfig): boolean {
  try {
    // Validate required fields
    if (!config.backend.baseUrl) throw new Error('Backend baseUrl is required');
    if (!config.oasis.apiBaseUrl) throw new Error('OASIS API baseUrl is required');
    if (!config.oasis.siteAvatarId) throw new Error('OASIS site avatar ID is required');
    if (!config.nft.symbol) throw new Error('NFT symbol is required');
    if (!config.payment.metabricksWalletAddress) throw new Error('MetaBricks wallet address is required');
    if (!config.payment.solanaWalletAddress) throw new Error('Solana wallet address is required');
    if (!config.stripe.publishableKey) throw new Error('Stripe publishable key is required');
    
    // Validate URLs
    try {
      new URL(config.backend.baseUrl);
      new URL(config.oasis.apiBaseUrl);
    } catch (error) {
      throw new Error('Invalid URL in configuration');
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}

// Export current config for easy access
export const CURRENT_CONFIG = getCurrentConfig();

// Log current environment on import
console.log(`🔧 MetaBricks Environment: ${CURRENT_CONFIG.name.toUpperCase()}`);
console.log(`🌐 Backend URL: ${CURRENT_CONFIG.backend.baseUrl}`);
console.log(`🔗 OASIS API: ${CURRENT_CONFIG.oasis.apiBaseUrl}`);
console.log(`🌊 Network: ${CURRENT_CONFIG.nft.network}`);
