import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { retry, catchError, timeout } from 'rxjs/operators';

export interface OASISAuthResponse {
  showDetailedSettings: boolean;
  result: {
    resultsCount: number;
    errorCount: number;
    warningCount: number;
    savedCount: number;
    loadedCount: number;
    deletedCount: number;
    hasAnyHolonsChanged: boolean;
    isError: boolean;
    isWarning: boolean;
    isSaved: boolean;
    isLoaded: boolean;
    isDeleted: boolean;
    message: string;
    result: {
      jwtToken: string;
      avatarId: string;
      username: string;
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
      // ... other fields
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class OASISAuthService {
  private readonly OASIS_API_URL = 'https://metabricks-backend-api-v2-42ff9579046d.herokuapp.com/api';
  private readonly USERNAME = 'metabricks_admin';
  private readonly PASSWORD = 'Uppermall1!';
  
  private currentToken: string | null = null;
  private tokenExpiry: number | null = null;
  private authSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  /**
   * Authenticate with OASIS API and get JWT token
   */
  async authenticate(): Promise<string> {
    try {
      console.log('🔐 Authenticating with OASIS API...');
      
      // Use HttpClient with proxy to avoid CORS issues
      const data: OASISAuthResponse = await this.http.post<OASISAuthResponse>(
        `${this.OASIS_API_URL}/avatar/authenticate`,
        {
          username: this.USERNAME,
          password: this.PASSWORD
        }
      ).toPromise() as OASISAuthResponse;

      // The JWT token is nested deeper in the response structure
      const jwtToken = data?.result?.result?.jwtToken;
      
      if (jwtToken) {
        this.currentToken = jwtToken;
        this.tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
        this.authSubject.next(true);
        
        console.log('✅ OASIS authentication successful');
        console.log('🔑 Token expires at:', new Date(this.tokenExpiry).toISOString());
        console.log('🔑 JWT Token:', jwtToken.substring(0, 50) + '...');
        
        return this.currentToken;
      } else {
        console.error('❌ No JWT token found in response structure');
        console.error('❌ Response structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        throw new Error('No token received from OASIS API');
      }
    } catch (error) {
      console.error('❌ OASIS authentication failed:', error);
      this.authSubject.next(false);
      throw error;
    }
  }


  /**
   * Get valid token (authenticate if needed)
   */
  async getValidToken(): Promise<string> {
    // Check if token is expired or missing (with 30 second buffer)
    const bufferTime = 30 * 1000; // 30 seconds
    if (!this.currentToken || !this.tokenExpiry || Date.now() >= (this.tokenExpiry - bufferTime)) {
      console.log('🔄 Token expired or missing, re-authenticating...');
      return await this.authenticate();
    }
    return this.currentToken;
  }

  /**
   * Make authenticated request to OASIS API via backend proxy
   */
  async makeAuthenticatedRequest(endpoint: string, data: any): Promise<any> {
    try {
      console.log(`📡 Making request to OASIS via backend proxy: ${endpoint}`);
      
      // Use backend proxy to avoid CORS issues
      const response = await this.http.post(
        `${this.OASIS_API_URL}/proxy${endpoint}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();
      
      console.log('✅ OASIS request successful');
      return response;
    } catch (error) {
      console.error('❌ OASIS request failed:', error);
      throw error;
    }
  }


  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.currentToken !== null && 
           this.tokenExpiry !== null && 
           Date.now() < this.tokenExpiry;
  }

  /**
   * Get authentication status as observable
   */
  getAuthStatus(): Observable<boolean> {
    return this.authSubject.asObservable();
  }

  /**
   * Clear authentication (logout)
   */
  clearAuth(): void {
    this.currentToken = null;
    this.tokenExpiry = null;
    this.authSubject.next(false);
  }
}
