import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, from, throwError } from 'rxjs';
import { map, catchError, tap, timeout } from 'rxjs/operators';
import { getMetaBrickMetadataUrl, getMetaBrickType } from '../components/metabricks-nfts/metadata-url-mapping';

export interface OASISAuthResponse {
  result: {
    jwtToken: string;
    avatar: {
      id: string;
      username: string;
      email: string;
    };
  };
  isError: boolean;
  message: string;
}

export interface OASISMintRequest {
  JSONMetaDataURL: string;
  Title: string;
  Symbol: string;
  MintedByAvatarId: string;
}

export interface OASISMintResponse {
  result: {
    mintAccount: string;
    transactionResult: string;
  };
  isError: boolean;
  message: string;
}

export interface OASISTransferRequest {
  FromWalletAddress: string;
  ToWalletAddress: string;
  NFTId: string;
  FromProviderType: string;
  ToProviderType: string;
  Amount: number;
}

export interface OASISTransferResponse {
  result: {
    transactionResult: string;
  };
  isError: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DirectOASISService {
  private readonly OASIS_API_URL = ''; // Use Angular proxy to avoid CORS
  private readonly SITE_AVATAR_USERNAME = 'metabricks_admin';
  private readonly SITE_AVATAR_PASSWORD = 'Uppermall1!';
  private readonly SITE_AVATAR_ID = '5f7daa80-160e-4213-9e81-94500390f31e';
  private readonly OASIS_WALLET_ADDRESS = 'AfpSpMjNyoHTZWMWkog6Znf57KV82MGzkpDUUjLtmHwG';

  private currentToken: string | null = null;
  private tokenExpiry: number | null = null;
  private authenticationSubject = new BehaviorSubject<boolean>(false);
  private refreshInterval: any = null;

  constructor(private http: HttpClient) {
    // Start proactive authentication
    this.startProactiveAuthentication();
  }

  /**
   * Start proactive authentication - authenticate immediately and set up refresh cycle
   */
  private async startProactiveAuthentication(): Promise<void> {
    console.log('🚀 DirectOASIS: Starting proactive authentication...');
    
    try {
      // Authenticate immediately
      await this.authenticateWithOASIS();
      
      // Set up refresh cycle every 10 minutes
      this.refreshInterval = setInterval(async () => {
        console.log('🔄 DirectOASIS: Proactive token refresh...');
        try {
          await this.authenticateWithOASIS();
        } catch (error) {
          console.warn('⚠️ DirectOASIS: Proactive refresh failed:', error);
        }
      }, 10 * 60 * 1000); // 10 minutes
      
      console.log('✅ DirectOASIS: Proactive authentication started');
    } catch (error) {
      console.error('❌ DirectOASIS: Initial authentication failed:', error);
      // Retry in 30 seconds
      setTimeout(() => this.startProactiveAuthentication(), 30000);
    }
  }

  /**
   * Stop proactive authentication
   */
  public stopProactiveAuthentication(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('🛑 DirectOASIS: Proactive authentication stopped');
    }
  }

  /**
   * Check if we have a valid token
   */
  public isAuthenticated(): boolean {
    const bufferTime = 30 * 1000; // 30 seconds
    return !!(this.currentToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - bufferTime));
  }

  /**
   * Get current authentication status
   */
  public getAuthenticationStatus(): { authenticated: boolean; token: string | null; expiresIn: number | null } {
    const bufferTime = 30 * 1000; // 30 seconds
    const authenticated = !!(this.currentToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - bufferTime));
    const expiresIn = this.tokenExpiry ? Math.max(0, this.tokenExpiry - Date.now()) : null;
    
    return {
      authenticated,
      token: this.currentToken,
      expiresIn
    };
  }

  /**
   * Get authentication status as observable (for compatibility)
   */
  public getAuthenticationObservable(): Observable<boolean> {
    return this.authenticationSubject.asObservable();
  }

  /**
   * Authenticate with OASIS API and get JWT token
   */
  private async authenticateWithOASIS(): Promise<string> {
    try {
      console.log('🔐 DirectOASIS: Authenticating with OASIS API...');
      
      // Get response as text to handle massive response more efficiently
      const responseText = await this.http.post(
        `${this.OASIS_API_URL}/api/avatar/authenticate`,
        {
          username: this.SITE_AVATAR_USERNAME,
          password: this.SITE_AVATAR_PASSWORD
        },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          }),
          responseType: 'text' // Get as text to handle large responses
        }
      ).pipe(
        timeout(120000) // 120 second timeout for massive OASIS responses
      ).toPromise();

      // Extract JWT token from the massive response using regex
      const jwtMatch = responseText?.match(/"jwtToken":"([^"]+)"/);
      if (jwtMatch && jwtMatch[1]) {
        this.currentToken = jwtMatch[1];
        this.tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
        this.authenticationSubject.next(true);
        console.log('✅ DirectOASIS: Authentication successful');
        return this.currentToken!;
      } else {
        throw new Error('No JWT token received from OASIS API');
      }
    } catch (error: any) {
      console.error('❌ DirectOASIS: Authentication failed:', error);
      this.authenticationSubject.next(false);
      throw new Error(`OASIS authentication failed: ${error.message}`);
    }
  }

  /**
   * Get valid token (authenticate if needed)
   */
  private async getValidToken(): Promise<string> {
    // Check if token is expired or missing (with 30 second buffer)
    const bufferTime = 30 * 1000; // 30 seconds
    if (!this.currentToken || !this.tokenExpiry || Date.now() >= (this.tokenExpiry - bufferTime)) {
      console.log('🔄 DirectOASIS: Token expired or missing, re-authenticating...');
      return await this.authenticateWithOASIS();
    }
    return this.currentToken;
  }

  /**
   * Make authenticated request to OASIS API
   */
  private async makeOASISRequest<T>(endpoint: string, data: any): Promise<T> {
    const token = await this.getValidToken();
    
    try {
      console.log(`📡 DirectOASIS: Making request to ${endpoint}`);
      
      const response = await this.http.post<T>(
        `${this.OASIS_API_URL}${endpoint}`,
        data,
        {
          headers: new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          })
        }
      ).pipe(
        timeout(120000) // 120 second timeout for massive OASIS responses
      ).toPromise();

      console.log('✅ DirectOASIS: Request successful');
      return response as T;
    } catch (error: any) {
      console.error('❌ DirectOASIS: Request failed:', error);
      
      // If token is invalid, try to re-authenticate once
      if (error.status === 401) {
        console.log('🔄 DirectOASIS: Token invalid, re-authenticating...');
        await this.authenticateWithOASIS();
        
        // Retry the request
        const retryResponse = await this.http.post<T>(
          `${this.OASIS_API_URL}${endpoint}`,
          data,
          {
            headers: new HttpHeaders({
              'Authorization': `Bearer ${this.currentToken}`,
              'Content-Type': 'application/json'
            })
          }
        ).pipe(
          timeout(120000) // 120 second timeout for massive OASIS responses
        ).toPromise();

        console.log('✅ DirectOASIS: Retry request successful');
        return retryResponse as T;
      }
      
      throw error;
    }
  }

  /**
   * Mint NFT directly via OASIS API (Solana)
   */
  async mintNFTSolana(
    walletAddress: string,
    brickId: string,
    brickName: string,
    brickType: string
  ): Promise<{ mintAccount: string; transactionResult: string }> {
    try {
      console.log('🎨 DirectOASIS: Minting Solana NFT...', { walletAddress, brickId, brickName, brickType });

      // Extract brick number from brickId (e.g., "Brick 32" -> 32)
      const brickNumber = parseInt(brickId.replace('Brick ', '') || '1');
      
      // Get the correct metadata URL for this brick
      const metadataUrl = getMetaBrickMetadataUrl(brickNumber);
      
      // Ensure we have a valid metadata URL (fallback to regular brick metadata if not found)
      const finalMetadataUrl = metadataUrl || 'https://gateway.pinata.cloud/ipfs/QmXa26ap9xo9thYpqjzF16NFMkzfStuLyRtZWMJ1pEGvfC';
      
      // Prepare Solana OASIS API request using David's new simplified format
      const oasisRequest: OASISMintRequest = {
        JSONMetaDataURL: finalMetadataUrl, // Use correct metadata URL for this specific brick
        Title: brickName || `MetaBrick #${brickId}`,
        Symbol: 'MBRICK',
        MintedByAvatarId: this.SITE_AVATAR_ID
      };

      console.log('📤 DirectOASIS: Sending to Solana OASIS API:', oasisRequest);
      
      // Make request to Solana OASIS API
      const result = await this.makeOASISRequest<OASISMintResponse>('/api/Solana/Mint', oasisRequest);
      
      if (result.isError) {
        throw new Error(`OASIS minting failed: ${result.message}`);
      }

      console.log('✅ DirectOASIS: NFT minting successful:', result);
      return {
        mintAccount: result.result.mintAccount,
        transactionResult: result.result.transactionResult
      };
    } catch (error: any) {
      console.error('❌ DirectOASIS: NFT minting failed:', error);
      throw error;
    }
  }

  /**
   * Transfer NFT from OASIS wallet to user wallet
   */
  async transferNFT(
    mintAccount: string,
    toWalletAddress: string
  ): Promise<{ transactionResult: string }> {
    try {
      console.log('🔄 DirectOASIS: Transferring NFT...', { mintAccount, toWalletAddress });

      // Wait for NFT to be fully processed on blockchain before transferring
      console.log('⏳ DirectOASIS: Waiting 5 seconds for NFT to be fully processed...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const transferRequest: OASISTransferRequest = {
        FromWalletAddress: this.OASIS_WALLET_ADDRESS,
        ToWalletAddress: toWalletAddress,
        NFTId: mintAccount, // API expects NFTId (gets mapped to TokenAddress internally)
        FromProviderType: 'SolanaOASIS',
        ToProviderType: 'SolanaOASIS',
        Amount: 1
      };

      console.log('📤 DirectOASIS: Sending NFT transfer request:', transferRequest);
      const transferResult = await this.makeOASISRequest<OASISTransferResponse>('/api/Nft/send-nft', transferRequest);

      if (transferResult.isError) {
        throw new Error(`NFT transfer failed: ${transferResult.message}`);
      }

      console.log('✅ DirectOASIS: NFT transfer successful:', transferResult);
      return {
        transactionResult: transferResult.result.transactionResult
      };
    } catch (error: any) {
      console.error('❌ DirectOASIS: NFT transfer failed:', error);
      throw error;
    }
  }

  /**
   * Complete NFT minting flow: mint to OASIS wallet, then transfer to user
   */
  async mintAndTransferNFT(
    walletAddress: string,
    brickId: string,
    brickName: string,
    brickType: string
  ): Promise<{
    mintAccount: string;
    mintTransaction: string;
    transferTransaction?: string;
    transferError?: string;
  }> {
    try {
      console.log('🚀 DirectOASIS: Starting complete NFT mint and transfer flow...');

      // Step 1: Mint NFT to OASIS wallet
      const mintResult = await this.mintNFTSolana(walletAddress, brickId, brickName, brickType);
      
      // Step 2: Transfer NFT to user wallet
      let transferResult: { transactionResult: string } | null = null;
      let transferError: string | null = null;
      
      try {
        transferResult = await this.transferNFT(mintResult.mintAccount, walletAddress);
      } catch (transferErr: any) {
        transferError = transferErr.message;
        console.warn('⚠️ DirectOASIS: NFT minted but transfer failed:', transferError);
      }

      return {
        mintAccount: mintResult.mintAccount,
        mintTransaction: mintResult.transactionResult,
        transferTransaction: transferResult?.transactionResult,
        transferError: transferError || undefined
      };
    } catch (error: any) {
      console.error('❌ DirectOASIS: Complete mint and transfer flow failed:', error);
      throw error;
    }
  }


  /**
   * Initialize authentication (call this when service starts)
   */
  async initialize(): Promise<void> {
    try {
      await this.authenticateWithOASIS();
      console.log('✅ DirectOASIS: Service initialized and authenticated');
    } catch (error) {
      console.error('❌ DirectOASIS: Service initialization failed:', error);
      throw error;
    }
  }
}
