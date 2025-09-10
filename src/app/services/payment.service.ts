import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export interface PaymentRequest {
  brickId: string;
  brickName: string;
  price: number;
  walletAddress?: string;
  paymentMethod: 'crypto' | 'stripe';
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  transactionHash?: string;
  error?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  amount?: number;
  currency?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentMethodsSubject = new BehaviorSubject<PaymentMethod[]>([
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: 'assets/images/MetaMask_Fox.svg',
      description: 'Pay with Ethereum via MetaMask',
      enabled: true
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: 'assets/images/phantom-icon.svg',
      description: 'Pay with Solana via Phantom',
      enabled: true
    },
    {
      id: 'stripe',
      name: 'Credit Card',
      icon: 'assets/images/stripe.png',
      description: 'Pay with credit card via Stripe',
      enabled: true
    }
  ]);

  public paymentMethods$ = this.paymentMethodsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get available payment methods
   */
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.paymentMethods$;
  }

  /**
   * Check if MetaMask is available
   */
  async isMetaMaskAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' &&
           (window as any).ethereum.isMetaMask;
  }

  /**
   * Check if Phantom is available
   */
  async isPhantomAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 
           typeof (window as any).solana !== 'undefined' &&
           (window as any).solana.isPhantom;
  }

  /**
   * Get user's MetaMask address
   */
  async getMetaMaskAddress(): Promise<string> {
    if (!await this.isMetaMaskAvailable()) {
      throw new Error('MetaMask not available');
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });
      return accounts[0];
    } catch (error) {
      throw new Error('Failed to connect to MetaMask');
    }
  }

  /**
   * Get user's Phantom address
   */
  async getPhantomAddress(): Promise<string> {
    if (!await this.isPhantomAvailable()) {
      throw new Error('Phantom not available');
    }

    try {
      const response = await (window as any).solana.connect();
      return response.publicKey.toString();
    } catch (error) {
      throw new Error('Failed to connect to Phantom');
    }
  }

  /**
   * Process crypto payment (MetaMask/Phantom)
   */
  async processCryptoPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      let walletAddress: string;
      
      if (paymentRequest.paymentMethod === 'crypto') {
        // Try MetaMask first, then Phantom
        if (await this.isMetaMaskAvailable()) {
          walletAddress = await this.getMetaMaskAddress();
        } else if (await this.isPhantomAvailable()) {
          walletAddress = await this.getPhantomAddress();
        } else {
          throw new Error('No crypto wallet available');
        }
      } else {
        throw new Error('Invalid payment method for crypto payment');
      }

      // For now, we'll simulate the payment and return success
      // In a real implementation, you'd handle the actual blockchain transaction
      return {
        success: true,
        paymentId: `crypto_${Date.now()}`,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.http.post<PaymentResponse>('/create-checkout-session', {
        brickId: paymentRequest.brickId,
        price: paymentRequest.price,
        walletAddress: paymentRequest.walletAddress,
        metadataUri: `https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88`
      }).toPromise();

      return response || { success: false, error: 'No response from server' };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payment failed'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.http.get<PaymentStatus>(`/check-payment-status/${paymentId}`).toPromise();
      return response || { paymentId, status: 'failed' };
    } catch (error) {
      return { paymentId, status: 'failed' };
    }
  }

  /**
   * Process payment based on selected method
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    switch (paymentRequest.paymentMethod) {
      case 'crypto':
        return this.processCryptoPayment(paymentRequest);
      case 'stripe':
        return this.processStripePayment(paymentRequest);
      default:
        return {
          success: false,
          error: 'Invalid payment method'
        };
    }
  }
}
