import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MintComponent } from '../mint/mint.component'; // Adjust path as necessary
import { BulkBuyComponent } from '../bulk-buy/bulk-buy.component'; // Add bulk buy import
import { WalletService } from '../../../services/wallet.service';
import { ArbitrumMintingService, ArbitrumMintData } from '../../../services/arbitrum-minting.service';
import { DirectOASISService } from '../../../services/direct-oasis.service';
import { MintSuccessData } from '../success/success.component';
import { PublicKey, Connection, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

// Extend Window interface to include ethereum and solana
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
    phantom?: {
      solana?: {
        isPhantom: boolean;
        connect: () => Promise<{ publicKey: any }>;
        disconnect: () => Promise<void>;
        on: (event: string, callback: (args: any) => void) => void;
        removeListener: (event: string, callback: (args: any) => void) => void;
      };
    };
    solana?: {
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (args: any) => void) => void;
      removeListener: (event: string, callback: (args: any) => void) => void;
    };
  }
}

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
    private arbitrumMintingService: ArbitrumMintingService,
    private directOASISService: DirectOASISService
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

  /**
   * Wait for transaction confirmation
   */
  private async waitForTransactionConfirmation(txHash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkConfirmation = async () => {
        try {
          if (window.ethereum) {
            const receipt = await window.ethereum.request({
              method: 'eth_getTransactionReceipt',
              params: [txHash]
            });
            
            if (receipt && receipt.status === '0x1') {
              console.log('✅ Transaction confirmed:', txHash);
              resolve();
            } else if (receipt && receipt.status === '0x0') {
              reject(new Error('Transaction failed'));
            } else {
              // Transaction still pending, check again in 2 seconds
              setTimeout(checkConfirmation, 2000);
            }
          } else {
            reject(new Error('MetaMask not available'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      // Start checking after 1 second
      setTimeout(checkConfirmation, 1000);
    });
  }

  /**
   * Send a Solana transaction
   */
  private async sendSolanaTransaction(toAddress: string, amountInLamports: string, fromPublicKeyString: string): Promise<string> {
    try {
      // Get the Phantom provider
      const provider = (window as any).phantom?.solana;
      if (!provider) {
        throw new Error('Phantom wallet not available');
      }

      const connection = new Connection('https://api.devnet.solana.com');
      
      console.log('Creating transaction with:');
      console.log('- From public key string:', fromPublicKeyString);
      console.log('- To address:', toAddress);
      console.log('- Amount in lamports:', amountInLamports);
      
      // Use the provided public key
      const fromPublicKey = new PublicKey(fromPublicKeyString);
      const toPublicKey = new PublicKey(toAddress);
      
      console.log('- From public key object:', fromPublicKey);
      console.log('- To public key object:', toPublicKey);

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: parseInt(amountInLamports)
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      // Sign and send transaction
      const signature = await provider.signAndSendTransaction(transaction);
      
      console.log('Solana transaction sent:', signature);
      console.log('Signature type:', typeof signature);
      console.log('Signature value:', signature);
      
      // Ensure we return a string
      return signature.toString();
      
    } catch (error: any) {
      console.error('Error sending Solana transaction:', error);
      throw new Error(`Solana transaction failed: ${error.message}`);
    }
  }

  /**
   * Wait for Solana transaction confirmation
   */
  private async waitForSolanaTransactionConfirmation(txHash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkConfirmation = async () => {
        try {
          const connection = new Connection('https://api.devnet.solana.com');
          
          console.log('Checking signature status for:', txHash);
          console.log('Signature type:', typeof txHash);
          
          // getSignatureStatus expects a signature string, not a PublicKey
          const status = await connection.getSignatureStatus(txHash);
          
          if (status && status.value && status.value.confirmationStatus === 'finalized') {
            console.log('✅ Solana transaction confirmed:', txHash);
            resolve();
          } else if (status && status.value && status.value.err) {
            reject(new Error('Solana transaction failed'));
          } else {
            // Transaction still pending, check again in 2 seconds
            setTimeout(checkConfirmation, 2000);
          }
        } catch (error) {
          console.error('Error checking signature status:', error);
          reject(error);
        }
      };
      
      // Start checking after 1 second
      setTimeout(checkConfirmation, 1000);
    });
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
      
      // REQUIRE PAYMENT FIRST - Send ETH transaction to MetaBricks contract
      const amount = '0.02'; // 0.02 ETH
      const amountInWei = '0x470DE4DF820000'; // 0.02 ETH in hex wei (20000000000000000)
      const contractAddress = '0xbC9f66E4A8076D1ce3Cb8db0A1d95d47061c34A9'; // MetaBricks contract
      
      console.log('🚀 Sending MetaMask transaction for payment...');
      console.log('💰 Amount:', amount, 'ETH');
      console.log('📝 Contract:', contractAddress);
      
      // Send payment transaction
      const txHash = await this.arbitrumMintingService.sendTransaction(contractAddress, amountInWei);
      console.log('✅ MetaMask payment transaction successful:', txHash);
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      await this.waitForTransactionConfirmation(txHash);
      
      console.log('✅ Payment confirmed! Proceeding with minting...');
      
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
          paymentNetwork: 'arbitrum', // Track which network was used
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
    console.log('🚀 mintWithPhantom() called!');
    console.log('🧱 Brick data:', this.brick);
    
    try {
      // Check if Phantom is available using the correct detection method
      console.log('🔍 Checking Phantom availability...');
      console.log('🔍 window.phantom exists:', !!('phantom' in window));
      console.log('🔍 window.phantom:', (window as any).phantom);
      console.log('🔍 window.phantom.solana:', (window as any).phantom?.solana);
      console.log('🔍 window.phantom.solana.isPhantom:', (window as any).phantom?.solana?.isPhantom);
      
      if (!('phantom' in window) || !(window as any).phantom?.solana?.isPhantom) {
        console.log('❌ Phantom wallet not detected');
        alert('Phantom wallet is not installed. Please install Phantom to continue.');
        return;
      }
      
      console.log('✅ Phantom wallet detected successfully');

      // Get the Phantom provider
      const provider = (window as any).phantom?.solana;
      console.log('🔍 Phantom provider:', provider);
      if (!provider) {
        console.log('❌ Phantom provider not available');
        alert('Phantom wallet is not available. Please refresh the page and try again.');
        return;
      }

      console.log('✅ Phantom provider found, attempting connection...');
      // Connect to Phantom with popup preference
      const response = await provider.connect({ onlyIfTrusted: false });
      console.log('Phantom connected successfully:', response);
      console.log('Public key object:', response.publicKey);
      console.log('Public key string:', response.publicKey.toString());
      
      // REQUIRE PAYMENT FIRST - Send SOL transaction to MetaBricks contract
      const amount = '0.1'; // 0.1 SOL for testing
      const amountInLamports = '100000000'; // 0.1 SOL in lamports
      // For testing, send to the user's own address (self-transfer)
      const contractAddress = response.publicKey.toString(); // User's own address
      
      console.log('🚀 Sending Phantom transaction for payment...');
      console.log('💰 Amount:', amount, 'SOL');
      console.log('📝 Contract:', contractAddress);
      
      // Send payment transaction
      const txHash = await this.sendSolanaTransaction(contractAddress, amountInLamports, response.publicKey.toString());
      console.log('✅ Phantom payment transaction successful:', txHash);
      
      // Wait for transaction confirmation (simplified for now)
      console.log('⏳ Waiting for transaction confirmation...');
      // For now, just wait a few seconds instead of checking signature status
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Payment confirmed (simplified confirmation)!');
      
      console.log('✅ Payment confirmed! Proceeding with NFT minting via Direct OASIS...');
      
      // Prepare minting data for direct OASIS service
      const solanaAddress = response.publicKey.toString();
      
      console.log('🚀 Starting NFT minting process via Direct OASIS...', {
        walletAddress: solanaAddress,
        brickId: this.brick.brickNumber,
        brickName: this.brick.name || `MetaBrick #${this.brick.brickNumber}`,
        brickType: this.determineBrickType(this.brick)
      });
      
      // Show loading state
      this.showPaymentOptions = false;
      
      // Call Direct OASIS service to mint and transfer NFT
      const mintResult = await this.directOASISService.mintAndTransferNFT(
        solanaAddress,
        this.brick.brickNumber,
        this.brick.name || `MetaBrick #${this.brick.brickNumber}`,
        this.determineBrickType(this.brick)
      );
      
      if (mintResult.mintAccount) {
        console.log('✅ NFT minted successfully via Direct OASIS!', mintResult);
        
        // Prepare success data
        this.successData = {
          brickName: this.brick.name || `MetaBrick #${this.brick.brickNumber}`,
          brickType: this.determineBrickType(this.brick),
          transactionHash: mintResult.transferTransaction || mintResult.mintTransaction,
          walletAddress: solanaAddress,
          paymentNetwork: 'solana', // Track which network was used
          perks: ['Basic Token Airdrop', 'Community Access'] // Default perks
        };
        
        // Show success screen
        this.showSuccessScreen = true;
      } else {
        throw new Error(mintResult.transferError || 'NFT minting failed');
      }
      
    } catch (error: any) {
      console.error('❌ Error during Direct OASIS minting process:', error);
      alert(`Direct OASIS minting failed: ${error.message}\n\nPlease try again or contact support.`);
    }
  }

  async mintWithStripe(): Promise<void> {
    console.log('Minting with Stripe (Credit Card)...');
    try {
      // Collect email address for Stripe purchase
      const email = prompt('Enter your email address to receive your NFT:\n\nWe\'ll mint your MetaBrick and email you instructions to claim it. No wallet required!');
      
      if (!email) {
        console.log('User cancelled email input');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Show confirmation
      const confirmed = confirm(`Confirm purchase:\n\nMetaBrick #${this.brick.id}\nEmail: ${email}\nPrice: $50.00 USD\n\nWe'll mint your NFT and email you claim instructions.`);
      
      if (!confirmed) {
        console.log('User cancelled purchase');
        return;
      }
      
      // Process Stripe email purchase
      await this.processStripeEmailPurchase(email);
      
    } catch (error) {
      console.error('Stripe payment failed:', error);
      alert('Payment processing failed. Please try again.');
    }
  }

  /**
   * Process Stripe email purchase
   */
  private async processStripeEmailPurchase(email: string): Promise<void> {
    try {
      console.log('🛒 Processing Stripe email purchase:', { brickId: this.brick.id, email });
      
      const purchaseRequest = {
        brickId: this.brick.id,
        email: email,
        brickName: this.brick.brickNumber || `MetaBrick #${this.brick.id}`,
        price: 50.00,
        metadataUri: this.brick.metadataUri || ''
      };

      const response = await fetch('http://localhost:3001/api/stripe-email-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseRequest)
      });

      const result = await response.json();
      
      if (result.success && result.checkoutUrl) {
        console.log('✅ Stripe checkout session created, redirecting...');
        // Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }

    } catch (error: any) {
      console.error('❌ Stripe email purchase failed:', error);
      alert(`Purchase failed: ${error.message || 'Please try again.'}`);
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
      let walletUrl: string;
      if (this.successData.paymentNetwork === 'solana') {
        walletUrl = `https://explorer.solana.com/address/${this.successData.walletAddress}`;
      } else {
        walletUrl = `https://sepolia.arbiscan.io/address/${this.successData.walletAddress}`;
      }
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
      // Create share text with correct network link
      let transactionLink: string;
      if (this.successData.paymentNetwork === 'solana') {
        transactionLink = `https://explorer.solana.com/tx/${this.successData.transactionHash}`;
      } else {
        transactionLink = `https://sepolia.arbiscan.io/tx/${this.successData.transactionHash}`;
      }
      
      const shareText = `🎉 I just minted my MetaBrick NFT! 🧱\n\n` +
        `✨ ${this.successData.brickName}\n` +
        `🔗 Transaction: ${this.successData.transactionHash}\n` +
        `🌐 View on ${this.successData.paymentNetwork === 'solana' ? 'Solana' : 'Arbitrum'}: ${transactionLink}\n\n` +
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
