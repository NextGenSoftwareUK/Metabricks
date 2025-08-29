import { Component, OnInit } from '@angular/core';
import { MetabricksConfigService } from '../../../services/metabricks-config.service';
import { NFTMintingService } from '../../../services/nft-minting.service';

@Component({
  selector: 'app-site-config',
  templateUrl: './site-config.component.html',
  styleUrls: ['./site-config.component.scss']
})
export class SiteConfigComponent implements OnInit {
  
  // Configuration forms
  oasisConfig = {
    siteAvatarId: '',
    siteAvatarToken: '',
    apiBaseUrl: ''
  };
  
  paymentConfig = {
    metabricksWalletAddress: '',
    currency: 'SOL',
    minPayment: 0.4
  };
  
  nftConfig = {
    symbol: 'MBRK',
    defaultPrice: 0.4,
    network: 'devnet' as 'devnet' | 'mainnet-beta'
  };
  
  // UI state
  isLoading = false;
  showOasisConfig = false;
  showPaymentConfig = false;
  showNftConfig = false;
  
  // Status
  configStatus: any = {};
  siteAvatarStatus: any = {};

  constructor(
    private metabricksConfig: MetabricksConfigService,
    private nftMintingService: NFTMintingService
  ) {}

  ngOnInit(): void {
    this.loadConfiguration();
    this.updateStatus();
  }

  /**
   * Load current configuration
   */
  private loadConfiguration(): void {
    const config = this.metabricksConfig.getConfig();
    
    this.oasisConfig = {
      siteAvatarId: config.OASIS.SITE_AVATAR_ID,
      siteAvatarToken: config.OASIS.SITE_AVATAR_TOKEN,
      apiBaseUrl: config.OASIS.API_BASE_URL
    };
    
    this.paymentConfig = {
      metabricksWalletAddress: config.PAYMENT.METABRICKS_WALLET_ADDRESS,
      currency: config.PAYMENT.CURRENCY,
      minPayment: config.PAYMENT.MIN_PAYMENT
    };
    
    this.nftConfig = {
      symbol: config.NFT.SYMBOL,
      defaultPrice: config.NFT.DEFAULT_PRICE,
      network: config.NFT.NETWORK
    };
  }

  /**
   * Update configuration status
   */
  private updateStatus(): void {
    this.configStatus = this.metabricksConfig.getConfigStatus();
    this.siteAvatarStatus = this.nftMintingService.getSiteAvatarConfig();
  }

  /**
   * Save OASIS configuration
   */
  async saveOasisConfig(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Update site avatar configuration
      this.metabricksConfig.updateSiteAvatar(
        this.oasisConfig.siteAvatarId,
        this.oasisConfig.siteAvatarToken
      );
      
      // Update API base URL
      this.metabricksConfig.updateConfig({
        OASIS: {
          ...this.metabricksConfig.getOasisConfig(),
          API_BASE_URL: this.oasisConfig.apiBaseUrl
        }
      });
      
      this.updateStatus();
      alert('✅ OASIS configuration saved successfully!');
      
    } catch (error: any) {
      console.error('Failed to save OASIS config:', error);
      alert(`❌ Failed to save OASIS configuration: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Save payment configuration
   */
  async savePaymentConfig(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Update MetaBricks wallet address
      this.metabricksConfig.updateMetabricksWallet(
        this.paymentConfig.metabricksWalletAddress
      );
      
      // Update other payment settings
      this.metabricksConfig.updateConfig({
        PAYMENT: {
          ...this.metabricksConfig.getPaymentConfig(),
          MIN_PAYMENT: this.paymentConfig.minPayment
        }
      });
      
      this.updateStatus();
      alert('✅ Payment configuration saved successfully!');
      
    } catch (error: any) {
      console.error('Failed to save payment config:', error);
      alert(`❌ Failed to save payment configuration: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Save NFT configuration
   */
  async saveNftConfig(): Promise<void> {
    try {
      this.isLoading = true;
      
      this.metabricksConfig.updateConfig({
        NFT: {
          ...this.metabricksConfig.getNftConfig(),
          SYMBOL: this.nftConfig.symbol,
          DEFAULT_PRICE: this.nftConfig.defaultPrice,
          NETWORK: this.nftConfig.network
        }
      });
      
      this.updateStatus();
      alert('✅ NFT configuration saved successfully!');
      
    } catch (error: any) {
      console.error('Failed to save NFT config:', error);
      alert(`❌ Failed to save NFT configuration: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Test OASIS connection
   */
  async testOasisConnection(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Test the connection using the configured API base URL
      const response = await fetch(`${this.oasisConfig.apiBaseUrl}/health`);
      
      if (response.ok) {
        const health = await response.json();
        alert(`✅ OASIS API connection successful!\n\nStatus: ${health.status || 'healthy'}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error: any) {
      console.error('OASIS connection test failed:', error);
      alert(`❌ OASIS connection test failed: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Test site avatar authentication
   */
  async testSiteAvatar(): Promise<void> {
    try {
      this.isLoading = true;
      
      if (!this.metabricksConfig.isSiteAvatarConfigured()) {
        throw new Error('Site avatar not configured');
      }
      
      const oasisConfig = this.metabricksConfig.getOasisConfig();
      
      // Test authentication by making a simple API call
      const response = await fetch(`${oasisConfig.API_BASE_URL}/avatar`, {
        headers: {
          'Authorization': `Bearer ${oasisConfig.SITE_AVATAR_TOKEN}`
        }
      });
      
      if (response.ok) {
        alert('✅ Site avatar authentication successful!');
      } else if (response.status === 401) {
        throw new Error('Invalid or expired token');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error: any) {
      console.error('Site avatar test failed:', error);
      alert(`❌ Site avatar test failed: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    if (confirm('Are you sure you want to reset all configuration to defaults?')) {
      this.metabricksConfig.resetConfig();
      this.loadConfiguration();
      this.updateStatus();
      alert('✅ Configuration reset to defaults');
    }
  }

  /**
   * Export configuration
   */
  exportConfig(): void {
    try {
      const config = this.metabricksConfig.getConfig();
      const configStr = JSON.stringify(config, null, 2);
      
      const blob = new Blob([configStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'metabricks-config.json';
      a.click();
      
      URL.revokeObjectURL(url);
      alert('✅ Configuration exported successfully!');
      
    } catch (error: any) {
      console.error('Failed to export config:', error);
      alert(`❌ Failed to export configuration: ${error.message}`);
    }
  }

  /**
   * Import configuration
   */
  importConfig(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const config = JSON.parse(e.target.result);
        this.metabricksConfig.updateConfig(config);
        this.loadConfiguration();
        this.updateStatus();
        alert('✅ Configuration imported successfully!');
      } catch (error: any) {
        console.error('Failed to import config:', error);
        alert(`❌ Failed to import configuration: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }
}
