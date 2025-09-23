// src/app/components/mint/mint.component.ts
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NFTMintingService, NFTMintData } from '../../../services/nft-minting.service';
import { ArbitrumMintingService, ArbitrumMintData } from '../../../services/arbitrum-minting.service';
import { BrickPerkService } from '../../../services/brick-perk.service';
import { OasisApiService, OASISNFTMintRequest } from '../../../services/oasis-api.service';
import { BrickEventsService } from '../../../services/brick-events.service';
import { MetabricksConfigService } from '../../../services/metabricks-config.service';
import { WalletService } from '../../../services/wallet.service';
import { StripeEmailPurchaseService, StripeEmailPurchaseRequest } from '../../../services/stripe-email-purchase.service';
import { MintSuccessData } from '../success/success.component';
import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';

// Extend Window interface to include solanaWeb3 and ethereum
declare global {
  interface Window {
    solanaWeb3?: any;
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
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

  // Minting options
  selectedMintingOption: 'solana' | 'arbitrum' = 'arbitrum'; // Default to Arbitrum
  mintingInProgress = false;
  mintingStep = 0; // Progress step (0-4)
  showWalletOptions = false;
  
  // Payment processing
  showPaymentProcessing = false;
  selectedPaymentMethod: 'arbitrum' | 'solana' | 'stripe' | null = null;
  paymentProcessing = false;
  paymentStatus = '';
  transactionHash = '';
  paymentWalletAddress = '';
  
  // Stripe email purchase
  showEmailForm = false;
  userEmail = '';
  emailFormValid = false;
  emailPurchaseData: any = null;
  
  // Brick destruction animation
  brickDestroying = false;
  
  // Success screen
  showSuccessScreen = false;
  successData: MintSuccessData | null = null;

  constructor(
    private brickEvents: BrickEventsService,
    private nftMintingService: NFTMintingService,
    private arbitrumMintingService: ArbitrumMintingService,
    private brickPerkService: BrickPerkService,
    private oasisApiService: OasisApiService,
    private metabricksConfig: MetabricksConfigService,
    private walletService: WalletService,
    private stripeEmailPurchaseService: StripeEmailPurchaseService
  ) { }

  ngOnInit(): void {
    console.log('Mint component initialized with brick:', this.brick);
    this.checkConfiguration();
    
    // Initialize network selection from config
    this.selectedMintingOption = this.metabricksConfig.getCurrentNetwork();
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
    console.log('🎨 Starting brick minting process...', this.brick);

    if (!this.brick) {
      alert('No brick data available.');
      return;
    }

    if (this.mintingInProgress) {
      console.log('Minting already in progress...');
      return;
    }

    // Show wallet options instead of directly minting
    // This ensures payment confirmation happens first
    this.showWalletOptions = true;
  }

  /**
   * Mint brick on Arbitrum network
   */
  async mintBrickArbitrum() {
    console.log('🎨 Starting Arbitrum brick minting process...', this.brick);

    // Step 1: Connecting to blockchain
    this.mintingStep = 1;
    await this.delay(800);

    // This method should only be called after successful payment confirmation
    // The actual minting logic is now in proceedWithMinting()

    try {
      // Step 2: Creating NFT metadata
      this.mintingStep = 2;
      await this.delay(1000);

      // Call the OASIS API to mint the NFT
      const mintData = {
        walletAddress: this.brick.walletAddress || '',
        brickName: this.brick.brickNumber || `Brick #${this.brick.id}`,
        brickType: this.brick.brickType || 'regular',
        brickId: this.brick.id,
        imageUrl: this.brick.imageUrl || '/assets/images/simple-brick-large.png',
        perks: this.brick.perks || ['Basic Token Airdrop', 'Community Access'],
        rarity: this.brick.rarity || 'Common'
      };

      // Step 3: Minting to wallet
      this.mintingStep = 3;
      await this.delay(1200);

      console.log('📤 Sending mint request to backend...', mintData);
      
      const response = await fetch('https://metabricks-backend-api-66e7d2abb038.herokuapp.com/api/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mintData)
      });

      const result = await response.json();

      // Step 4: Finalizing transaction
      this.mintingStep = 4;
      await this.delay(800);
      
      if (result.success) {
        console.log('✅ NFT minted successfully!', result);
        
        // Emit success event
        this.brickEvents.notifyMinted(this.brick);

        // Show success screen
        this.showSuccessScreen = true;
      } else {
        throw new Error(result.error || 'NFT minting failed');
      }

    } catch (error: any) {
      console.error('❌ Error during Arbitrum minting process:', error);
      alert(`Arbitrum minting failed: ${error.message}\n\nPlease try again or contact support.`);
    }
  }

  /**
   * Mint brick on Solana network (legacy method)
   */
  async mintBrickSolana() {
    console.log('🎨 Starting Solana brick minting process...', this.brick);

    // Step 1: Connecting to blockchain
    this.mintingStep = 1;
    await this.delay(800);

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

    // Step 2: Creating NFT metadata
    this.mintingStep = 2;
    await this.delay(1000);

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
      // Use very small amount for devnet testing (0.001 SOL)
      const devnetPaymentAmount = 0.001;
      const paymentResult = await this.processPayment(provider, devnetPaymentAmount);
      
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
        
        // Prepare success data
        this.successData = {
          brickName: metadata.name,
          brickType: metadata.hiddenMetadata.type,
          transactionHash: mintResult.signature || '',
          tokenId: mintResult.mintAddress, // Use mintAddress as tokenId for Solana
          paymentHash: paymentResult.signature,
          perks: metadata.perks.map((p: any) => p.name),
          imageUrl: metadata.image,
          walletAddress: provider.publicKey.toString()
        };
        
        // Show success screen
        this.showSuccessScreen = true;
        
        // Notify other components
        this.brickEvents.notifyMinted(this.brick);
        
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
      if (wallet.connection) {
        // Real Solana payment implementation
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

  /**
   * Determine brick type based on brick data
   */
  private determineBrickType(brick: any): 'regular' | 'industrial' | 'legendary' {
    // Check if brick has type information
    if (brick.type) {
      return brick.type.toLowerCase();
    }
    
    // Check if brick has rarity information
    if (brick.rarity) {
      const rarity = brick.rarity.toLowerCase();
      if (rarity.includes('legendary')) return 'legendary';
      if (rarity.includes('industrial')) return 'industrial';
      return 'regular';
    }
    
    // Check brick number for pattern (example logic)
    const brickId = brick.id || brick.brickNumber?.replace('Brick ', '') || 1;
    if (brickId % 100 === 0) return 'legendary';
    if (brickId % 10 === 0) return 'industrial';
    return 'regular';
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
   * Switch minting option
   */
  switchMintingOption(option: 'solana' | 'arbitrum') {
    this.selectedMintingOption = option;
    console.log('Switched minting option to:', option);
    
    // Update the configuration service to reflect the selected network
    this.metabricksConfig.updateNetworkSelection(option);
    
    // Emit event to notify other components of network change
    this.brickEvents.emitNetworkChange(option);
  }

  /**
   * Connect wallet and select network
   */
  async connectWalletAndSelectNetwork(paymentMethod: 'solana' | 'arbitrum' | 'stripe') {
    console.log('Selected payment method:', paymentMethod);
    
    try {
      if (paymentMethod === 'stripe') {
        // For Stripe, show email collection form first
        this.selectedPaymentMethod = 'stripe';
        this.showEmailForm = true;
        this.showWalletOptions = false;
        return;
      }
      
      // For crypto wallets, connect first
      if (paymentMethod === 'arbitrum') {
        // Connect MetaMask for Arbitrum
        if (typeof window.ethereum !== 'undefined') {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log('MetaMask connected successfully');
        } else {
          alert('MetaMask is not installed. Please install MetaMask to continue.');
          return;
        }
      } else {
        // Connect Phantom for Solana
        if (typeof (window as any).phantom !== 'undefined') {
          const response = await (window as any).phantom.solana.connect();
          console.log('Phantom connected successfully:', response.publicKey.toString());
        } else {
          alert('Phantom wallet is not installed. Please install Phantom to continue.');
          return;
        }
      }
      
      // Show payment processing UI for crypto payments
      this.selectedPaymentMethod = paymentMethod;
      this.showPaymentProcessing = true;
      this.showWalletOptions = false;
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Handle email input change
   */
  onEmailChange(email: string): void {
    this.userEmail = email;
    this.emailFormValid = this.validateEmail(email);
  }

  /**
   * Proceed with Stripe email purchase
   */
  async proceedWithStripeEmailPurchase(): Promise<void> {
    if (!this.brick || !this.userEmail || !this.emailFormValid) {
      alert('Please enter a valid email address');
      return;
    }

    this.showEmailForm = false;
    this.showPaymentProcessing = true;
    this.paymentProcessing = true;

    try {
      const purchaseRequest: StripeEmailPurchaseRequest = {
        brickId: this.brick.id,
        email: this.userEmail,
        brickName: this.brick.brickNumber || `Brick #${this.brick.id}`,
        price: 50.00,
        metadataUri: this.brick.metadataUri || ''
      };

      console.log('🛒 Initiating Stripe email purchase:', purchaseRequest);

      const response = await this.stripeEmailPurchaseService.initiateEmailPurchase(purchaseRequest).toPromise();

      if (response?.success && response?.checkoutUrl) {
        console.log('✅ Stripe checkout session created, redirecting...');
        // Redirect to Stripe Checkout
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error(response?.error || 'Failed to create checkout session');
      }

    } catch (error: any) {
      console.error('❌ Stripe email purchase failed:', error);
      alert(`Purchase failed: ${error.message || 'Please try again.'}`);
      this.paymentProcessing = false;
      this.showPaymentProcessing = false;
      this.showEmailForm = true;
    }
  }

  /**
   * Cancel email form and return to wallet selection
   */
  cancelEmailForm(): void {
    this.showEmailForm = false;
    this.userEmail = '';
    this.emailFormValid = false;
    this.selectedPaymentMethod = null;
    this.showWalletOptions = true;
  }

  /**
   * Process Stripe payment (legacy method - kept for compatibility)
   */
  async processStripePayment() {
    if (!this.brick) {
      alert('No brick selected for purchase');
      return;
    }

    this.paymentProcessing = true;
    
    try {
      // Create Stripe checkout session
      const response = await fetch('https://metabricks-backend-api-66e7d2abb038.herokuapp.com/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brickId: this.brick.id,
          price: 50.00, // $50.00
          metadataUri: this.brick.metadataUri || '',
          walletAddress: 'stripe-payment-' + Date.now() // Generate unique address for Stripe payments
        })
      });

      const session = await response.json();
      
      if (session.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = session.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
      
    } catch (error) {
      console.error('Stripe payment failed:', error);
      alert('Payment processing failed. Please try again.');
      this.paymentProcessing = false;
    }
  }

  /**
   * Process crypto payment (MetaMask/Phantom)
   */
  async processCryptoPayment() {
    if (!this.brick || !this.selectedPaymentMethod) {
      alert('No brick or payment method selected');
      return;
    }

    this.paymentProcessing = true;
    
    try {
      // Connect to MetaMask first
      const wallet = await this.walletService.connectWallet();
      console.log('✅ Wallet connected:', wallet);
      
      // Store the wallet address for later use
      this.paymentWalletAddress = wallet.address || '';

      // Switch to the selected network (only for crypto payments)
      if (this.selectedPaymentMethod === 'arbitrum' || this.selectedPaymentMethod === 'solana') {
        this.switchMintingOption(this.selectedPaymentMethod);
      }

      // For Arbitrum, send ETH transaction through MetaMask
      if (this.selectedPaymentMethod === 'arbitrum') {
        const amount = '0.02'; // 0.02 ETH
        const amountInWei = '20000000000000000'; // Convert to wei
        
        // Send payment to MetaBricks contract address (Arbitrum Sepolia)
        const contractAddress = '0xbC9f66E4A8076D1ce3Cb8db0A1d95d47061c34A9'; // MetaBricks contract
        
        console.log('🚀 Sending MetaMask transaction for Arbitrum payment...');
        console.log('💰 Amount:', amount, 'ETH');
        console.log('📝 Contract:', contractAddress);
        
        this.paymentStatus = 'Sending transaction to MetaMask...';
        const txHash = await this.walletService.sendTransaction(contractAddress, amountInWei);
        this.transactionHash = txHash;
        console.log('✅ MetaMask transaction successful:', txHash);
        
        // Wait for transaction confirmation before proceeding
        this.paymentStatus = 'Waiting for transaction confirmation...';
        console.log('⏳ Waiting for transaction confirmation...');
        await this.waitForTransactionConfirmation(txHash);
        
        this.paymentStatus = 'Payment confirmed! Proceeding with minting...';
        
        // Proceed with minting after successful payment verification
        await this.proceedWithMinting();
      } else {
        // For Solana, proceed with minting (Phantom integration would go here)
        await this.proceedWithMinting();
      }
      
    } catch (error: any) {
      console.error('❌ Crypto payment failed:', error);
      alert(`Payment failed: ${error.message || 'Please try again.'}`);
      this.paymentProcessing = false;
    }
  }

  /**
   * Cancel payment and return to wallet selection
   */
  cancelPayment() {
    this.showPaymentProcessing = false;
    this.selectedPaymentMethod = null;
    this.paymentProcessing = false;
    this.paymentStatus = '';
    this.transactionHash = '';
    this.showWalletOptions = true;
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransactionConfirmation(txHash: string): Promise<void> {
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
   * Proceed with NFT minting after payment verification
   */
  private async proceedWithMinting() {
    if (!this.brick) {
      alert('No brick selected for minting');
      return;
    }

    this.mintingInProgress = true;
    this.mintingStep = 0; // Reset progress
    
    try {
      // Set the wallet address from the payment process
      this.brick.walletAddress = this.paymentWalletAddress;
      
      if (this.selectedMintingOption === 'arbitrum') {
        await this.mintBrickArbitrum();
      } else {
        await this.mintBrickSolana();
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. Please try again.');
      this.mintingInProgress = false;
      this.paymentProcessing = false;
      this.brickDestroying = false;
    }
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
          this.brickEvents.notifyMinted(this.brick);
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

  // Success screen event handlers
  onSuccessClose() {
    this.showSuccessScreen = false;
    this.successData = null;
    // Close the entire minting modal and return to home screen
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
    // The mint modal should already be closed, so we can trigger a new mint
    // This could emit an event to the parent component to open the mint modal again
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

  /**
   * Helper method to add delays for progress animation
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}  
