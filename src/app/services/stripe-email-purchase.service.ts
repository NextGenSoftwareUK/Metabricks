import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { BackendApiService } from './backend-api.service';

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
}

export interface StripeEmailPurchaseStatus {
  isProcessing: boolean;
  sessionId?: string;
  email?: string;
  brickId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StripeEmailPurchaseService {
  private purchaseStatusSubject = new BehaviorSubject<StripeEmailPurchaseStatus>({
    isProcessing: false
  });

  public purchaseStatus$ = this.purchaseStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private backendApi: BackendApiService
  ) {}

  /**
   * Initiate a Stripe purchase with email collection
   */
  async initiateEmailPurchase(request: StripeEmailPurchaseRequest): Promise<StripeEmailPurchaseResponse> {
    try {
      this.updatePurchaseStatus({
        isProcessing: true,
        email: request.email,
        brickId: request.brickId
      });

      console.log('🛒 Initiating Stripe email purchase:', request);

      const response = await this.backendApi.initiateStripeEmailPurchase(request);

      if (response?.success && response.sessionId) {
        this.updatePurchaseStatus({
          isProcessing: true,
          sessionId: response.sessionId,
          email: request.email,
          brickId: request.brickId
        });
      }

      return response || { success: false, error: 'No response received' };

    } catch (error: any) {
      console.error('❌ Stripe email purchase failed:', error);
      this.updatePurchaseStatus({ isProcessing: false });
      
      return {
        success: false,
        error: error.message || 'Failed to initiate purchase'
      };
    }
  }

  /**
   * Check the status of a Stripe email purchase
   */
  async checkPurchaseStatus(sessionId: string): Promise<{ status: string; metadata?: any }> {
    try {
      const response = await this.backendApi.checkPaymentStatus(sessionId);

      return response || { status: 'unknown' };

    } catch (error: any) {
      console.error('❌ Failed to check purchase status:', error);
      return { status: 'error' };
    }
  }

  /**
   * Poll for payment completion
   */
  async pollPaymentCompletion(sessionId: string, maxAttempts: number = 30): Promise<boolean> {
    let attempts = 0;
    
    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const status = await this.checkPurchaseStatus(sessionId);
          
          if (status.status === 'paid') {
            console.log('✅ Payment completed successfully');
            this.updatePurchaseStatus({ isProcessing: false });
            resolve(true);
            return;
          }
          
          if (status.status === 'cancelled' || status.status === 'error') {
            console.log('❌ Payment was cancelled or failed');
            this.updatePurchaseStatus({ isProcessing: false });
            resolve(false);
            return;
          }
          
          // Continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000); // Check every 2 seconds
          } else {
            console.log('⏰ Payment polling timed out');
            this.updatePurchaseStatus({ isProcessing: false });
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Error polling payment status:', error);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          } else {
            this.updatePurchaseStatus({ isProcessing: false });
            resolve(false);
          }
        }
      };
      
      // Start polling after 1 second
      setTimeout(poll, 1000);
    });
  }

  /**
   * Reset purchase status
   */
  resetPurchaseStatus(): void {
    this.updatePurchaseStatus({ isProcessing: false });
  }

  /**
   * Update purchase status
   */
  private updatePurchaseStatus(status: StripeEmailPurchaseStatus): void {
    this.purchaseStatusSubject.next(status);
  }

  /**
   * Get current purchase status
   */
  getCurrentStatus(): StripeEmailPurchaseStatus {
    return this.purchaseStatusSubject.value;
  }
}
