import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface ClaimRequest {
  email: string;
  transactionHash: string;
  walletAddress: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  nftData?: any;
  error?: string;
}

@Component({
  selector: 'app-claim',
  templateUrl: './claim.component.html',
  styleUrls: ['./claim.component.scss']
})
export class ClaimComponent implements OnInit {
  email: string = '';
  transactionHash: string = '';
  walletAddress: string = '';
  walletConnected: boolean = false;
  claiming: boolean = false;
  claimResult: ClaimResponse | null = null;
  
  private readonly API_BASE_URL = 'http://localhost:3001/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Get email and transaction hash from URL parameters
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.transactionHash = params['tx'] || '';
    });
  }

  /**
   * Connect wallet (MetaMask or Phantom)
   */
  async connectWallet(): Promise<void> {
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.walletAddress = accounts[0];
        this.walletConnected = true;
        console.log('MetaMask connected:', this.walletAddress);
      } else if (typeof (window as any).phantom !== 'undefined') {
        const response = await (window as any).phantom.solana.connect();
        this.walletAddress = response.publicKey.toString();
        this.walletConnected = true;
        console.log('Phantom connected:', this.walletAddress);
      } else {
        alert('No wallet found. Please install MetaMask or Phantom wallet.');
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      alert(`Wallet connection failed: ${error.message}`);
    }
  }

  /**
   * Validate claim form
   */
  validateForm(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Please enter a valid email address.');
    }

    if (!this.transactionHash || this.transactionHash.trim().length === 0) {
      errors.push('Please enter the transaction hash.');
    }

    if (!this.walletConnected || !this.walletAddress) {
      errors.push('Please connect your wallet.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Claim NFT
   */
  async claimNFT(): Promise<void> {
    const validation = this.validateForm();
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    this.claiming = true;
    this.claimResult = null;

    try {
      const claimRequest: ClaimRequest = {
        email: this.email,
        transactionHash: this.transactionHash,
        walletAddress: this.walletAddress
      };

      console.log('🎯 Claiming NFT:', claimRequest);

      const response = await this.http.post<ClaimResponse>(
        `${this.API_BASE_URL}/claim-nft`,
        claimRequest
      ).toPromise();

      this.claimResult = response;

      if (response?.success) {
        console.log('✅ NFT claimed successfully!');
        // Optionally redirect to success page or show success message
      } else {
        console.error('❌ NFT claim failed:', response?.error);
      }

    } catch (error: any) {
      console.error('❌ Claim request failed:', error);
      this.claimResult = {
        success: false,
        error: error.message || 'Failed to claim NFT. Please try again.',
        message: 'Claim request failed'
      };
    } finally {
      this.claiming = false;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Go back to main page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Try again after failed claim
   */
  tryAgain(): void {
    this.claimResult = null;
    this.claiming = false;
  }
}

