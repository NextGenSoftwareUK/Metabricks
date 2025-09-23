import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

export interface MintSuccessData {
  brickId?: number;
  brickName: string;
  brickType?: 'regular' | 'industrial' | 'legendary';
  transactionHash: string;
  tokenId?: string;
  walletAddress?: string;
  network?: 'solana' | 'arbitrum' | 'stripe';
  paymentNetwork?: 'solana' | 'arbitrum';
  purchaseType?: 'wallet' | 'email';
  email?: string;
  claimInstructions?: any;
  perks?: string[];
  imageUrl?: string;
  paymentHash?: string;
}

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss']
})
export class SuccessComponent implements OnInit {
  @Input() successData!: MintSuccessData;
  @Output() close = new EventEmitter<void>();
  @Output() viewInWallet = new EventEmitter<void>();
  @Output() mintAnother = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
    console.log('Success component initialized with data:', this.successData);
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Handle view in wallet button click
   */
  onViewInWallet(): void {
    this.viewInWallet.emit();
  }

  /**
   * Handle mint another button click
   */
  onMintAnother(): void {
    this.mintAnother.emit();
  }

  /**
   * Handle share button click
   */
  onShare(): void {
    this.share.emit();
  }

  /**
   * Get network display name
   */
  getNetworkDisplayName(): string {
    switch (this.successData.network) {
      case 'solana':
        return 'Solana';
      case 'arbitrum':
        return 'Arbitrum';
      case 'stripe':
        return 'Email Purchase';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get network explorer URL
   */
  getExplorerUrl(): string {
    if (this.successData.purchaseType === 'email') {
      return '#';
    }

    switch (this.successData.network) {
      case 'solana':
        return `https://explorer.solana.com/tx/${this.successData.transactionHash}`;
      case 'arbitrum':
        return `https://sepolia.arbiscan.io/tx/${this.successData.transactionHash}`;
      default:
        return '#';
    }
  }

  /**
   * Copy transaction hash to clipboard
   */
  async copyTransactionHash(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.successData.transactionHash);
      // You could show a toast notification here
      console.log('Transaction hash copied to clipboard');
    } catch (error) {
      console.error('Failed to copy transaction hash:', error);
    }
  }

  /**
   * Check if this is an email purchase
   */
  isEmailPurchase(): boolean {
    return this.successData.purchaseType === 'email';
  }

  /**
   * Get claim instructions for email purchases
   */
  getClaimInstructions(): any {
    return this.successData.claimInstructions || null;
  }
}