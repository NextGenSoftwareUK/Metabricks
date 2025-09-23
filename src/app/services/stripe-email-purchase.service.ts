import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StripeEmailPurchaseRequest {
  brickId: number;
  email: string;
  brickName: string;
  price: number;
  metadataUri?: string;
}

export interface StripeEmailPurchaseResponse {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
  brickId?: number;
  email?: string;
  price?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StripeEmailPurchaseService {
  private readonly API_BASE_URL = 'https://metabricks-backend-api-v2-42ff9579046d.herokuapp.com/api';

  constructor(private http: HttpClient) {}

  /**
   * Create Stripe checkout session for email-based purchase
   */
  createEmailPurchaseSession(request: StripeEmailPurchaseRequest): Observable<StripeEmailPurchaseResponse> {
    console.log('💳 Creating Stripe email purchase session:', request);
    
    return this.http.post<StripeEmailPurchaseResponse>(
      `${this.API_BASE_URL}/stripe-email-purchase`,
      request
    );
  }

  /**
   * Initiate email purchase (alias for createEmailPurchaseSession)
   */
  initiateEmailPurchase(request: StripeEmailPurchaseRequest): Observable<StripeEmailPurchaseResponse> {
    return this.createEmailPurchaseSession(request);
  }

  /**
   * Check payment status for a session
   */
  checkPaymentStatus(sessionId: string): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/check-payment-status/${sessionId}`);
  }

  /**
   * Validate email purchase request
   */
  validatePurchaseRequest(request: StripeEmailPurchaseRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.brickId || request.brickId < 1 || request.brickId > 432) {
      errors.push('Invalid brick ID. Must be between 1 and 432.');
    }

    if (!request.email || !this.isValidEmail(request.email)) {
      errors.push('Invalid email address.');
    }

    if (!request.brickName || request.brickName.trim().length === 0) {
      errors.push('Brick name is required.');
    }

    if (!request.price || request.price <= 0) {
      errors.push('Price must be greater than 0.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate claim instructions for email users
   */
  generateClaimInstructions(brickId: number, email: string, transactionHash: string): any {
    return {
      title: `Your MetaBrick #${brickId} is Ready!`,
      message: `Congratulations! Your MetaBrick #${brickId} has been successfully minted and is ready to claim.`,
      steps: [
        '1. Install a Web3 wallet (MetaMask for Ethereum or Phantom for Solana)',
        '2. Connect your wallet to the MetaBricks platform',
        '3. Go to the "Claim NFT" section',
        '4. Enter your email address and transaction hash',
        '5. Click "Claim NFT" to transfer it to your wallet',
        '6. Your MetaBrick will appear in your wallet!'
      ],
      transactionHash: transactionHash,
      claimUrl: `https://metabricks.xyz/claim?email=${encodeURIComponent(email)}&tx=${transactionHash}`,
      supportEmail: 'support@metabricks.xyz',
      walletInstallation: {
        metamask: 'https://metamask.io/download/',
        phantom: 'https://phantom.app/download'
      }
    };
  }
}