import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  result: {
    jwtToken: string;
    refreshToken: string;
    avatarId: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthManagerService {
  private readonly API_BASE_URL = 'https://localhost:5002';
  private readonly CREDENTIALS: AuthCredentials = {
    username: 'metabricks_admin',
    password: 'Uppermall1!'
  };

  private currentTokenSubject = new BehaviorSubject<string>('');
  public currentToken$ = this.currentTokenSubject.asObservable();

  private refreshTokenSubject = new BehaviorSubject<string>('');
  private avatarIdSubject = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {
    console.log('🔧 AuthManagerService constructor called');
    
    // Make service available globally for debugging
    (window as any).authManager = this;
    
    // Authenticate MetaBricks once on startup
    this.authenticateMetaBricks();
  }

  /**
   * Authenticate MetaBricks once on startup
   */
  private authenticateMetaBricks(): void {
    console.log('🚀 MetaBricks: Authenticating once on startup...');
    
    // Authenticate immediately and store the result
    this.authenticate().subscribe({
      next: (response) => {
        if (response?.result?.jwtToken) {
          this.currentTokenSubject.next(response.result.jwtToken);
          this.avatarIdSubject.next(response.result.avatarId);
          console.log('✅ MetaBricks authenticated successfully!');
          console.log('🎯 Ready for NFT minting operations');
        }
      },
      error: (error) => {
        console.error('❌ MetaBricks authentication failed:', error);
        console.log('🔄 Will retry authentication when needed');
      }
    });
  }

  /**
   * Get current authentication status
   */
  public isMetaBricksReady(): boolean {
    return !!this.currentTokenSubject.value;
  }

  /**
   * Authenticate with OASIS API and get fresh tokens
   */
  private authenticate(): Observable<AuthResponse> {
    console.log('🔐 Authenticating with OASIS API...');
    
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/api/avatar/authenticate`, this.CREDENTIALS).pipe(
      tap(response => {
        if (response?.result?.jwtToken) {
          this.currentTokenSubject.next(response.result.jwtToken);
          this.refreshTokenSubject.next(response.result.refreshToken);
          this.avatarIdSubject.next(response.result.avatarId);
          console.log('✅ Authentication successful, token refreshed');
        } else {
          throw new Error('Invalid authentication response');
        }
      }),
      catchError(error => {
        console.error('❌ Authentication failed:', error);
        throw error;
      })
    );
  }

  /**
   * Get current valid JWT token
   */
  getCurrentToken(): string {
    return this.currentTokenSubject.value;
  }

  /**
   * Get current avatar ID
   */
  getCurrentAvatarId(): string {
    return this.avatarIdSubject.value;
  }

  /**
   * Check if MetaBricks is authenticated and ready
   */
  isAuthenticated(): boolean {
    return !!this.currentTokenSubject.value;
  }
}
