import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BackendConfig {
  baseUrl: string;
  timeout: number;
}

export interface NFTMintRequest {
  walletAddress: string;
  brickId: string;
  brickName: string;
  brickType: 'regular' | 'industrial' | 'legendary';
  paymentNetwork: 'solana' | 'arbitrum';
}

export interface NFTMintResponse {
  success: boolean;
  data?: any;
  transferSuccessful?: boolean;
  message?: string;
  transferError?: string;
  error?: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  private config: BackendConfig = {
    baseUrl: 'https://metabricks-backend-api-66e7d2abb038.herokuapp.com',
    timeout: 30000
  };

  constructor(private http: HttpClient) {
    this.loadEnvironmentConfig();
  }

  /**
   * Load configuration based on environment
   */
  private loadEnvironmentConfig(): void {
    const env = (window as any).location?.hostname || 'localhost';
    
    if (env === 'localhost' || env.includes('localhost')) {
      // Development - use local backend
      this.config.baseUrl = 'http://localhost:3001';
    } else {
      // Production - use Heroku backend
      this.config.baseUrl = 'https://metabricks-backend-api-66e7d2abb038.herokuapp.com';
    }
    
    console.log('🔧 Backend API configured for:', this.config.baseUrl);
  }

  /**
   * Get the current backend configuration
   */
  getConfig(): BackendConfig {
    return { ...this.config };
  }

  /**
   * Update backend URL (for testing purposes)
   */
  updateBackendUrl(url: string): void {
    this.config.baseUrl = url;
    console.log('🔧 Backend URL updated to:', this.config.baseUrl);
  }

  /**
   * Mint NFT via backend API
   */
  async mintNFT(request: NFTMintRequest): Promise<NFTMintResponse> {
    try {
      console.log('🎨 Minting NFT via backend API:', request);
      console.log('🌐 Backend URL:', this.config.baseUrl);

      const response = await this.http.post<NFTMintResponse>(
        `${this.config.baseUrl}/api/mint-nft`,
        request,
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          })
        }
      ).toPromise();

      console.log('✅ Backend NFT minting response:', response);
      return response || { success: false, error: 'No response received' };

    } catch (error: any) {
      console.error('❌ Backend NFT minting failed:', error);
      return {
        success: false,
        error: error.message || 'NFT minting failed'
      };
    }
  }

  /**
   * Initiate Stripe email purchase via backend API
   */
  async initiateStripeEmailPurchase(request: StripeEmailPurchaseRequest): Promise<StripeEmailPurchaseResponse> {
    try {
      console.log('🛒 Initiating Stripe email purchase via backend:', request);
      console.log('🌐 Backend URL:', this.config.baseUrl);

      const response = await this.http.post<StripeEmailPurchaseResponse>(
        `${this.config.baseUrl}/api/stripe-email-purchase`,
        request,
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          })
        }
      ).toPromise();

      console.log('✅ Backend Stripe purchase response:', response);
      return response || { success: false, error: 'No response received' };

    } catch (error: any) {
      console.error('❌ Backend Stripe purchase failed:', error);
      return {
        success: false,
        error: error.message || 'Stripe purchase failed'
      };
    }
  }

  /**
   * Check payment status via backend API
   */
  async checkPaymentStatus(sessionId: string): Promise<{ status: string; metadata?: any }> {
    try {
      console.log('🔍 Checking payment status via backend:', sessionId);
      console.log('🌐 Backend URL:', this.config.baseUrl);

      const response = await this.http.get<{ status: string; metadata?: any }>(
        `${this.config.baseUrl}/api/check-payment-status/${sessionId}`
      ).toPromise();

      console.log('✅ Backend payment status response:', response);
      return response || { status: 'unknown' };

    } catch (error: any) {
      console.error('❌ Backend payment status check failed:', error);
      return { status: 'error' };
    }
  }

  /**
   * Health check for backend API
   */
  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      console.log('🏥 Backend health check:', this.config.baseUrl);

      const response = await this.http.get<{ status: string; message?: string }>(
        `${this.config.baseUrl}/health`
      ).toPromise();

      console.log('✅ Backend health check response:', response);
      return response || { status: 'unknown' };

    } catch (error: any) {
      console.error('❌ Backend health check failed:', error);
      return { 
        status: 'error', 
        message: error.message || 'Backend health check failed' 
      };
    }
  }

  /**
   * Get backend API status
   */
  async getBackendStatus(): Promise<{
    isOnline: boolean;
    url: string;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const healthResponse = await this.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        isOnline: healthResponse.status === 'ok' || healthResponse.status === 'healthy',
        url: this.config.baseUrl,
        responseTime,
        error: healthResponse.status === 'error' ? healthResponse.message : undefined
      };
    } catch (error: any) {
      return {
        isOnline: false,
        url: this.config.baseUrl,
        error: error.message || 'Backend is unreachable'
      };
    }
  }

  /**
   * Test backend connectivity
   */
  async testConnectivity(): Promise<boolean> {
    try {
      const status = await this.getBackendStatus();
      console.log('🔗 Backend connectivity test:', status);
      return status.isOnline;
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error);
      return false;
    }
  }
}
