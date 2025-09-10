import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface MintSuccessData {
  brickName: string;
  brickType: string;
  transactionHash: string;
  tokenId?: string;
  paymentHash?: string;
  transferHash?: string;
  transferError?: string;
  perks: string[];
  imageUrl?: string;
  walletAddress?: string;
}

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss']
})
export class SuccessComponent {
  @Input() successData!: MintSuccessData;
  @Output() close = new EventEmitter<void>();
  @Output() viewInWallet = new EventEmitter<void>();
  @Output() mintAnother = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();

  constructor() { }

  onClose() {
    this.close.emit();
  }

  onViewInWallet() {
    this.viewInWallet.emit();
  }

  onMintAnother() {
    this.mintAnother.emit();
  }

  onShare() {
    this.share.emit();
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  }

  getExplorerUrl(hash: string): string {
    // Arbitrum Sepolia explorer
    return `https://sepolia.arbiscan.io/tx/${hash}`;
  }

  getWalletUrl(): string {
    if (this.successData.walletAddress) {
      return `https://sepolia.arbiscan.io/address/${this.successData.walletAddress}`;
    }
    return '';
  }
}
