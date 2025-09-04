// src/app/components/mint/mint.component.ts
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NFTMintingService, NFTMintData } from '../../../services/nft-minting.service';
import { BrickPerkService } from '../../../services/brick-perk.service';
import { OasisApiService, OASISNFTMintRequest } from '../../../services/oasis-api.service';
import { BrickEventsService } from '../../../services/brick-events.service';
import { MetabricksConfigService } from '../../../services/metabricks-config.service';

// Extend Window interface to include solanaWeb3
declare global {
  interface Window {
    solanaWeb3?: any;
  }
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

@Component({
  selector: 'app-mint',
  templateUrl: './mint.component.html',
  styleUrls: ['./mint.component.scss']
})
export class MintComponent implements OnInit {
  @Input() brick: any;
  @ViewChild('mintModal') modalRef: any;

  constructor(
    private brickEvents: BrickEventsService,
    private nftMintingService: NFTMintingService,
    private brickPerkService: BrickPerkService,
    private oasisApiService: OasisApiService,
    private metabricksConfig: MetabricksConfigService
  ) { }

  ngOnInit(): void {
    console.log('Mint component initialized with brick:', this.brick);
    this.checkConfiguration();
  }

  /**
   * Check if the system is properly configured for minting
   */
  private checkConfiguration(): void {
    const configStatus = this.metabricksConfig.getConfigStatus();
    
    if (!configStatus.oasis) {
      console.warn('⚠️ OASIS site avatar not configured');
    }
    
    if (!configStatus.payment) {
      console.warn('⚠️ MetaBricks wallet address not configured');
    }
    
    if (!this.nftMintingService.isReadyForMinting()) {
      console.error('❌ NFT minting service not ready');
    }
  }

  async mintBrick() {
    console.log('🎨 Starting brick minting process via OASIS API (new flow)...', this.brick);

    if (!this.brick) {
      alert('No brick data available.');
      return;
    }

    // Check if minting service is ready
    if (!this.nftMintingService.isReadyForMinting()) {
      alert('NFT minting service not ready. Please contact support.');
      return;
    }
    
    // Get wallet provider (Phantom)
    const provider = (window as any).solana;
    if (!provider || !provider.isPhantom) {
      alert('Please install Phantom wallet to mint bricks.');
      return;
    }

    if (!provider.isConnected) {
      alert('Please connect your Phantom wallet first.');
      return;
    }

    try {
      // Step 1: Generate brick metadata with perks
      console.log('📝 Step 1: Generating brick metadata with perks...');
      const brickId = this.brick.id || this.brick.brickNumber?.replace('Brick ', '') || 1;
      const metadata = this.brickPerkService.generateBrickMetadata(brickId);
      
      if (!metadata) {
        throw new Error('Failed to generate brick metadata');
      }

      console.log('✅ Brick metadata generated:', {
        name: metadata.name,
        type: metadata.hiddenMetadata.type,
        rarity: metadata.hiddenMetadata.rarity,
        perks: metadata.perks.length,
        coreBenefits: metadata.coreBenefits
      });

      // Step 2: Show perks to user before minting
      console.log('👀 Step 2: Showing perks to user...');
      let perkMessage = `🎁 Your ${metadata.hiddenMetadata.type} brick includes:\n\n`;
      metadata.perks.forEach((perk: any, index: number) => {
        perkMessage += `${index + 1}. ${perk.name}\n`;
      });
      perkMessage += `\n💰 ${metadata.coreBenefits.tokenAirdrop} tokens + ${metadata.coreBenefits.tgeDiscount}% discount\n\n`;
      perkMessage += `Proceed with minting?`;

      if (!confirm(perkMessage)) {
        console.log('User cancelled minting');
        return;
      }

      // Step 3: Process payment via Phantom wallet
      console.log('💳 Step 3: Processing payment via Phantom wallet...');
      
      const paymentConfig = this.metabricksConfig.getPaymentConfig();
      const paymentResult = await this.processPayment(provider, paymentConfig.MIN_PAYMENT);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
      console.log('✅ Payment successful! Transaction:', paymentResult.signature);
      alert(`Payment successful! Now minting your NFT...`);

      // Step 4: Mint NFT via OASIS API using site-wide avatar (NEW FLOW)
      console.log('🎨 Step 4: Minting NFT via OASIS API (site avatar)...');
      const mintData: NFTMintData = {
        walletAddress: provider.publicKey.toString(),
        brickId: brickId,
        brickName: metadata.name
      };

      // Use the new method that doesn't require user avatar authentication
      const mintResult = await this.nftMintingService.mintNFTAfterPayment(
        mintData, 
        paymentResult.signature || 'unknown-signature'
      );

      if (mintResult.success) {
        console.log('🎉 NFT minting successful!', mintResult);
        
        // Show success message
        const successMessage = `🎉 MetaBrick NFT Minted Successfully!\n\n` +
          `🧱 ${metadata.name}\n` +
          `⭐ ${metadata.hiddenMetadata.type} (${metadata.hiddenMetadata.rarity})\n` +
          `🎁 ${metadata.perks.length} perks included\n` +
          `💳 Payment: ${paymentResult.signature}\n` +
          `🎨 Mint: ${mintResult.signature}\n\n` +
          `Your NFT is now in your wallet!`;

        alert(successMessage);
        
        // Notify other components
        this.brickEvents.notifyMinted();
        
        // Close modal if available
        if (this.modalRef) {
          this.modalRef.hide();
        }

      } else {
        throw new Error(mintResult.error || 'Unknown minting error');
      }

    } catch (error: any) {
      console.error('❌ Error during minting process:', error);
      alert(`Minting failed: ${error.message}\n\nPlease try again or contact support.`);
    }
  }

  /**
   * Process payment via wallet
   */
  private async processPayment(wallet: any, amount: number): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      console.log(`Processing payment of ${amount} SOL via wallet`);
      
      const paymentConfig = this.metabricksConfig.getPaymentConfig();
      
      // Check if MetaBricks wallet is configured
      if (!this.metabricksConfig.isMetabricksWalletConfigured()) {
        throw new Error('MetaBricks payment wallet not configured. Please contact support.');
      }

      // Check if we have a real Solana connection
      if (wallet.connection && window.solanaWeb3) {
        // Real Solana payment implementation
        const { Transaction, SystemProgram, PublicKey } = window.solanaWeb3;
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(paymentConfig.METABRICKS_WALLET_ADDRESS),
            lamports: amount * 1e9 // Convert SOL to lamports
          })
        );

        // Get recent blockhash
        const { blockhash } = await wallet.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        // Sign and send transaction
        const signedTx = await wallet.signTransaction(transaction);
        const signature = await wallet.connection.sendRawTransaction(signedTx.serialize());
        
        // Wait for confirmation
        const confirmation = await wallet.connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed to confirm');
        }

        console.log('Payment transaction confirmed:', signature);
        
        return {
          success: true,
          signature: signature
        };
      } else {
        // For development/testing, simulate successful payment
        console.log('Simulating payment (replace with real Solana transaction)');
        
        return {
          success: true,
          signature: 'simulated-payment-signature-' + Date.now()
        };
      }
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      };
    }
  }

  /**
   * Convert Pinata metadata to BrickMetadata format
   */
  private convertToBrickMetadata(pinataMetadata: any): BrickMetadata {
    return {
      name: pinataMetadata.name || 'Unknown Brick',
      symbol: pinataMetadata.symbol || 'MBRK',
      description: pinataMetadata.description || 'A unique MetaBrick',
      image: pinataMetadata.image || '',
      attributes: pinataMetadata.attributes || [],
      perks: pinataMetadata.perks || [],
      coreBenefits: pinataMetadata.coreBenefits || {},
      hiddenMetadata: pinataMetadata.hiddenMetadata || {}
    };
  }

  // Check payment status by polling the backend (keeping for Stripe payments)
  async checkPaymentStatus(sessionId: string) {
    let attempts = 0;
    const maxAttempts = 30; // Check for up to 1 minute (30 * 2 seconds)
    
    const pollStatus = async () => {
      try {
        const response = await fetch(`https://metabricks-backend-api-66e7d2abb038.herokuapp.com/check-payment-status/${sessionId}`);
        const data = await response.json();
        
        if (data.status === 'paid') {
          alert('Payment completed successfully! Your brick will be minted shortly.');
          this.brickEvents.notifyMinted();
          return;
        } else if (data.status === 'cancelled') {
          console.log('Payment was cancelled');
          return;
        } else {
          // Payment still in progress, check again in 2 seconds
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollStatus, 2000);
          } else {
            console.log('Payment status polling timed out');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 2000);
        }
      }
    };
    
    // Start polling
    pollStatus();
  }
}  
