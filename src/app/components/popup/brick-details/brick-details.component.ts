import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MintComponent } from '../mint/mint.component'; // Adjust path as necessary
import { BulkBuyComponent } from '../bulk-buy/bulk-buy.component'; // Add bulk buy import
import { WalletService } from '../../../services/wallet.service';
import { ArbitrumMintingService, ArbitrumMintData } from '../../../services/arbitrum-minting.service';
import { MintSuccessData } from '../success/success.component';

@Component({
  selector: 'app-brick-details',
  templateUrl: './brick-details.component.html',
  styleUrls: ['./brick-details.component.scss']
})
export class BrickDetailsComponent implements OnInit {
  brick: any;  // Ensure it's ready to receive data
  mintedBricks: string[] = [];
  isMinted: boolean = false;
  attributes: any[] = [];
  loadingAttributes: boolean = false;
  attributesError: string | null = null;
  showPaymentOptions: boolean = false;
  
  // Success screen
  showSuccessScreen = false;
  successData: MintSuccessData | null = null;

  constructor(
    public modalRef: BsModalRef, 
    private modalService: BsModalService, 
    private walletService: WalletService,
    private arbitrumMintingService: ArbitrumMintingService
  ) {} // Inject BsModalService

  ngOnInit(): void {
    console.log(this.brick);  // Check what's inside the brick object
    if (!this.brick) {
      console.error('Brick data is not available');
    }
    // Fetch minted bricks
    this.walletService.getMintedBricks().subscribe({
      next: (res) => {
        this.mintedBricks = res.minted;
        this.isMinted = this.brick && this.brick.metadataUri && this.mintedBricks.includes(this.brick.metadataUri);
        
        // Reveal hidden values if brick is minted
        if (this.isMinted) {
          this.revealHiddenValues();
        }
      },
      error: (err) => {
        console.error('Failed to fetch minted bricks', err);
      }
    });
    // Fetch NFT attributes from metadataUri
    this.fetchAttributes();
  }

  async fetchAttributes() {
    this.loadingAttributes = true;
    this.attributesError = null;
    this.attributes = [];
    if (this.brick && this.brick.metadataUri) {
      try {
        const res = await fetch(this.brick.metadataUri);
        if (!res.ok) throw new Error('Failed to fetch metadata');
        const metadata = await res.json();
        
        // Process attributes to hide TGE discount values for mystery
        if (Array.isArray(metadata.attributes)) {
          this.attributes = metadata.attributes.map((attr: any) => {
            // Create a copy of the attribute
            const processedAttr = { ...attr };
            
            // Hide TGE discount values to maintain mystery (only discount, not airdrop)
            if (attr.trait_type === 'TGE Discount' || 
                attr.trait_type === 'Token Generation Event discount' ||
                (attr.description && attr.description.includes('Token Generation Event discount'))) {
              processedAttr.value = '??';
              processedAttr.originalValue = attr.value; // Store original for later
              processedAttr.isHidden = true;
            }
            
            return processedAttr;
          });
        }
      } catch (err: any) {
        this.attributesError = err.message || 'Failed to load attributes';
      }
    }
    this.loadingAttributes = false;
  }

  openMintModal(): void {
    this.modalRef = this.modalService.show(MintComponent, {
      class: 'modal-dialog-slide-up', // This class can be adjusted based on your modal CSS
      initialState: {
        brick: { ...this.brick, metadataUri: this.brick.metadataUri }
      }
    });
  }

  openBulkBuyModal(): void {
    this.modalRef = this.modalService.show(BulkBuyComponent, {
      class: 'modal-dialog-slide-up'
    });
  }

  // Method to reveal hidden TGE discount values after purchase
  revealHiddenValues(): void {
    if (this.isMinted) {
      this.attributes = this.attributes.map(attr => {
        if (attr.isHidden && attr.originalValue) {
          return { ...attr, value: attr.originalValue, isHidden: false };
        }
        return attr;
      });
    }
  }

  // Payment method functions
  async mintWithMetaMask(): Promise<void> {
    console.log('🚀 mintWithMetaMask() called!');
    console.log('🔧 ArbitrumMintingService:', this.arbitrumMintingService);
    console.log('🧱 Brick data:', this.brick);
    
    try {
      // Connect to MetaMask and Arbitrum network
      const connectionResult = await this.arbitrumMintingService.connectWallet();
      
      if (!connectionResult.success) {
        alert(`Connection failed: ${connectionResult.error}`);
        return;
      }

      console.log('MetaMask connected to Arbitrum:', connectionResult.address);
      
      // Prepare minting data
      const mintData: ArbitrumMintData = {
        walletAddress: connectionResult.address!,
        brickId: this.brick.brickNumber || 1,
        brickName: this.brick.name || `MetaBrick #${this.brick.brickNumber || 1}`,
        brickType: this.determineBrickType(this.brick)
      };

      console.log('Starting NFT minting process...', mintData);
      
      // Show loading state
      this.showPaymentOptions = false;
      
      // Mint the NFT
      const mintResult = await this.arbitrumMintingService.mintNFT(mintData);
      
      if (mintResult.success) {
        console.log('✅ NFT minted successfully!', mintResult);
        
        // Prepare success data
        this.successData = {
          brickName: mintData.brickName,
          brickType: mintData.brickType,
          transactionHash: mintResult.transactionHash || '',
          tokenId: mintResult.tokenId,
          perks: ['OASIS API access', 'Our World benefits', 'AR experiences'], // Default perks
          imageUrl: this.brick?.imageUrl,
          walletAddress: mintData.walletAddress
        };
        
        // Show success screen
        this.showSuccessScreen = true;
        
        // Mark as minted
        this.isMinted = true;
        
        // Close payment options
        this.showPaymentOptions = false;
      } else {
        console.error('❌ NFT minting failed:', mintResult.error);
        alert(`❌ Minting failed: ${mintResult.error}\n\nPlease try again or contact support.`);
      }
      
    } catch (error: any) {
      console.error('MetaMask minting failed:', error);
      alert(`Failed to mint NFT: ${error.message || 'Unknown error'}\n\nPlease try again or contact support.`);
    }
  }

  async mintWithPhantom(): Promise<void> {
    console.log('Minting with Phantom (Solana)...');
    try {
      if (typeof window.solanaWeb3 !== 'undefined') {
        const response = await window.solanaWeb3.connect();
        console.log('Phantom connected successfully:', response.publicKey.toString());
        // TODO: Implement actual minting logic here
        alert('Phantom connected! Minting functionality will be implemented.');
      } else {
        alert('Phantom wallet is not installed. Please install Phantom to continue.');
      }
    } catch (error) {
      console.error('Phantom connection failed:', error);
      alert('Failed to connect Phantom. Please try again.');
    }
  }

  async mintWithStripe(): Promise<void> {
    console.log('Minting with Stripe (Credit Card)...');
    try {
      // TODO: Implement Stripe payment integration
      alert('Stripe payment integration will be implemented. This will process a $50 USD payment.');
    } catch (error) {
      console.error('Stripe payment failed:', error);
      alert('Payment processing failed. Please try again.');
    }
  }

  /**
   * Determine brick type based on brick data
   */
  private determineBrickType(brick: any): 'regular' | 'industrial' | 'legendary' {
    // For now, we'll use a simple logic based on brick number
    // In a real implementation, this would be based on actual brick metadata
    const brickNumber = brick.brickNumber || 1;
    
    if (brickNumber <= 100) {
      return 'legendary';
    } else if (brickNumber <= 500) {
      return 'industrial';
    } else {
      return 'regular';
    }
  }

  // Success screen event handlers
  onSuccessClose() {
    this.showSuccessScreen = false;
    this.successData = null;
    // Close the entire brick details modal and return to home screen
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  onSuccessViewInWallet() {
    if (this.successData?.walletAddress) {
      const walletUrl = `https://sepolia.arbiscan.io/address/${this.successData.walletAddress}`;
      window.open(walletUrl, '_blank');
    }
  }

  onSuccessMintAnother() {
    this.showSuccessScreen = false;
    this.successData = null;
    // Could emit an event to open mint modal again
  }

  onSuccessShare() {
    if (this.successData) {
      // Create share text
      const shareText = `🎉 I just minted my MetaBrick NFT! 🧱\n\n` +
        `✨ ${this.successData.brickName}\n` +
        `🔗 Transaction: ${this.successData.transactionHash}\n` +
        `🌐 View on Arbitrum: https://sepolia.arbiscan.io/tx/${this.successData.transactionHash}\n\n` +
        `Join me in the MetaBricks metaverse! 🚀`;
      
      // Try to use Web Share API if available, otherwise fallback to clipboard
      if (navigator.share) {
        navigator.share({
          title: 'My MetaBrick NFT',
          text: shareText,
          url: window.location.href
        }).catch(console.error);
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Share text copied to clipboard! You can now paste it on social media.');
        }).catch(() => {
          // Final fallback - show the text for manual copying
          prompt('Copy this text to share your MetaBrick:', shareText);
        });
      }
    }
  }
}
